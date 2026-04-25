import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST() {
  const reset = db.transaction(() => {
    db.prepare("DELETE FROM orders").run();
    db.prepare("DELETE FROM participants").run();
    db.prepare("UPDATE inventory_items SET available_count = total_count").run();
  });
  reset();
  return NextResponse.json({ success: true });
}
