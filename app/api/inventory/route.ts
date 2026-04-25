import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const items = db
    .prepare(
      `SELECT
        i.id,
        i.name,
        i.total_count,
        i.available_count,
        COALESCE(SUM(CASE WHEN o.status = 'in_progress' THEN o.quantity ELSE 0 END), 0) AS in_progress_count,
        i.total_count - i.available_count - COALESCE(SUM(CASE WHEN o.status = 'in_progress' THEN o.quantity ELSE 0 END), 0) AS used_count
      FROM inventory_items i
      LEFT JOIN orders o ON o.item_id = i.id
      GROUP BY i.id
      ORDER BY i.name`
    )
    .all();
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const { name, total_count } = await req.json();
  if (!name?.trim() || typeof total_count !== "number" || total_count < 0) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  const result = db
    .prepare(
      "INSERT INTO inventory_items (name, total_count, available_count) VALUES (?, ?, ?)"
    )
    .run(name.trim(), total_count, total_count);
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
