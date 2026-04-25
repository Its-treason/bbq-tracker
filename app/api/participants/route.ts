import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const participants = db
    .prepare("SELECT * FROM participants ORDER BY name")
    .all();
  return NextResponse.json(participants);
}

export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  const result = db
    .prepare("INSERT INTO participants (name) VALUES (?)")
    .run(name.trim());
  return NextResponse.json(
    { id: result.lastInsertRowid, name: name.trim() },
    { status: 201 }
  );
}
