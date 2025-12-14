import { createClient } from '@libsql/client'

const url = process.env.LIBSQL_URL
const authToken = process.env.LIBSQL_AUTH_TOKEN

if (!url || !authToken) {
  throw new Error('LIBSQL_URL e LIBSQL_AUTH_TOKEN são obrigatórios')
}

export const db = createClient({ url, authToken })

let initialized = false

export async function initDb() {
  if (initialized) return
  await db.execute('PRAGMA foreign_keys = ON;')
  await db.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      service_main TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS attendances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      service TEXT NOT NULL,
      amount REAL NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );
  `)
  initialized = true
}
