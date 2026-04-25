import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST() {
  db.prepare("UPDATE orders SET status = 'completed' WHERE status = 'in_progress'").run();
  return NextResponse.json({ success: true });
}
