// database.js — Readnook database setup

const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "readnook.db"));

// Create tables if they don't exist yet
db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    title     TEXT    NOT NULL,
    author    TEXT    NOT NULL,
    status    TEXT    NOT NULL DEFAULT 'want',
    notes     TEXT    DEFAULT '',
    created_at TEXT   DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS publishers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed some starter books if table is empty
const count = db.prepare("SELECT COUNT(*) as c FROM books").get();
if (count.c === 0) {
  const insert = db.prepare(
    "INSERT INTO books (title, author, status) VALUES (?, ?, ?)"
  );
  insert.run("The Pragmatic Programmer", "David Thomas & Andrew Hunt", "reading");
  insert.run("Atomic Habits",            "James Clear",                 "done");
  insert.run("Deep Work",                "Cal Newport",                 "want");
  insert.run("The Alchemist",            "Paulo Coelho",                "want");
  insert.run("Sapiens",                  "Yuval Noah Harari",           "reading");
  console.log("✅ Database seeded with starter books");
}

module.exports = db;