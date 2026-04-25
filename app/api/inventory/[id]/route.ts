import { NextResponse } from "next/server";
import db from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const { name, total_count } = await req.json();
  if (!name?.trim() || typeof total_count !== "number" || total_count < 0) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const item = db
    .prepare("SELECT * FROM inventory_items WHERE id = ?")
    .get(id) as { total_count: number; available_count: number } | undefined;
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const delta = total_count - item.total_count;
  const new_available = Math.max(0, item.available_count + delta);

  db.prepare(
    "UPDATE inventory_items SET name = ?, total_count = ?, available_count = ? WHERE id = ?"
  ).run(name.trim(), total_count, new_available, id);

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;

  const inProgress = db
    .prepare(
      "SELECT COUNT(*) as count FROM orders WHERE item_id = ? AND status = 'in_progress'"
    )
    .get(id) as { count: number };

  if (inProgress.count > 0) {
    return NextResponse.json(
      { error: "Item has in-progress orders" },
      { status: 400 }
    );
  }

  db.prepare("DELETE FROM inventory_items WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
