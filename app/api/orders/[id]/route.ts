import { NextResponse } from "next/server";
import db from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json() as {
    status: "completed" | "cancelled";
    cancel_quantity?: number;
  };

  if (body.status !== "completed" && body.status !== "cancelled") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = db
    .prepare("SELECT * FROM orders WHERE id = ?")
    .get(id) as { status: string; quantity: number; item_id: number } | undefined;

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.status !== "in_progress") {
    return NextResponse.json({ error: "Order is not in progress" }, { status: 400 });
  }

  const update = db.transaction(() => {
    if (body.status === "completed") {
      db.prepare("UPDATE orders SET status = 'completed' WHERE id = ?").run(id);
      return;
    }

    const cancelQty = Math.min(
      order.quantity,
      Math.max(1, Math.floor(body.cancel_quantity ?? order.quantity))
    );

    db.prepare(
      "UPDATE inventory_items SET available_count = available_count + ? WHERE id = ?"
    ).run(cancelQty, order.item_id);

    if (cancelQty >= order.quantity) {
      db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(id);
    } else {
      db.prepare("UPDATE orders SET quantity = quantity - ? WHERE id = ?").run(cancelQty, id);
    }
  });

  update();
  return NextResponse.json({ success: true });
}
