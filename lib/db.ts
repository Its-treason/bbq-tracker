import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

function createDb(): Database.Database {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(path.join(dataDir, "grill.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT    NOT NULL,
      total_count     INTEGER NOT NULL DEFAULT 0,
      available_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS participants (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL REFERENCES participants(id),
      item_id        INTEGER NOT NULL REFERENCES inventory_items(id),
      quantity       INTEGER NOT NULL DEFAULT 1,
      status         TEXT    NOT NULL DEFAULT 'in_progress',
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

const db: Database.Database = global.__db ?? createDb();
if (process.env.NODE_ENV !== "production") global.__db = db;

export default db;
