import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'smartgrid.db');

let db: SqlJsDatabase;

// ── Initialize database ────────────────────────────────────────────────────────

async function initDb(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs();

  // Load existing DB file if it exists, otherwise create a new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    // Ensure the directory exists
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new SQL.Database();
  }

  // Create tables if they don't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    NOT NULL UNIQUE,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_states (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL UNIQUE,
      state_json  TEXT    NOT NULL,
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  persist();
  return db;
}

// ── Persist DB to disk ─────────────────────────────────────────────────────────

function persist() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// ── Query helpers ──────────────────────────────────────────────────────────────

export function createUser(username: string, email: string, passwordHash: string) {
  db.run(
    `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`,
    [username, email, passwordHash]
  );
  persist();

  // Return the last inserted row id
  const result = db.exec(`SELECT last_insert_rowid() as id`);
  return result[0]?.values[0]?.[0] as number;
}

export function findUserByEmail(email: string) {
  const stmt = db.prepare(`SELECT * FROM users WHERE email = ?`);
  stmt.bind([email]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

export function findUserById(id: number) {
  const stmt = db.prepare(`SELECT id, username, email, created_at FROM users WHERE id = ?`);
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

export function upsertState(userId: number, stateJson: string) {
  // Check if a record already exists
  const stmt = db.prepare(`SELECT id FROM user_states WHERE user_id = ?`);
  stmt.bind([userId]);
  const exists = stmt.step();
  stmt.free();

  if (exists) {
    db.run(
      `UPDATE user_states SET state_json = ?, updated_at = datetime('now') WHERE user_id = ?`,
      [stateJson, userId]
    );
  } else {
    db.run(
      `INSERT INTO user_states (user_id, state_json, updated_at) VALUES (?, ?, datetime('now'))`,
      [userId, stateJson]
    );
  }
  persist();
}

export function loadState(userId: number): string | null {
  const stmt = db.prepare(`SELECT state_json FROM user_states WHERE user_id = ?`);
  stmt.bind([userId]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row.state_json as string;
  }
  stmt.free();
  return null;
}

export { initDb };
export default db!;
