import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const orders = db
    .prepare(
      `SELECT
        o.id, o.participant_id, o.item_id, o.quantity, o.status, o.created_at,
        p.name AS participant_name,
        i.name AS item_name
      FROM orders o
      JOIN participants p ON p.id = o.participant_id
      JOIN inventory_items i ON i.id = o.item_id
      WHERE o.status = 'in_progress'
      ORDER BY p.name, o.created_at`
    )
    .all();
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const { participant_id, items } = await req.json() as {
    participant_id: number;
    items: { item_id: number; quantity: number }[];
  };

  if (!participant_id || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const validItems = items.filter((i) => i.quantity > 0);
  if (validItems.length === 0) {
    return NextResponse.json({ error: "No items with quantity > 0" }, { status: 400 });
  }

  const assign = db.transaction(
    (pid: number, orderItems: { item_id: number; quantity: number }[]) => {
      for (const { item_id, quantity } of orderItems) {
        const item = db
          .prepare("SELECT available_count, name FROM inventory_items WHERE id = ?")
          .get(item_id) as { available_count: number; name: string } | undefined;

        if (!item) throw new Error(`Item ${item_id} not found`);
        if (item.available_count < quantity) {
          throw new Error(
            `Not enough ${item.name}: ${item.available_count} left, tried to assign ${quantity}`
          );
        }

        db.prepare(
          "UPDATE inventory_items SET available_count = available_count - ? WHERE id = ?"
        ).run(quantity, item_id);

        db.prepare(
          "INSERT INTO orders (participant_id, item_id, quantity, status) VALUES (?, ?, ?, 'in_progress')"
        ).run(pid, item_id, quantity);
      }
    }
  );

  try {
    assign(participant_id, validItems);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Assignment failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
