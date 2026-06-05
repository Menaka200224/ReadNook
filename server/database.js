// database.js — Readnook database setup

const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "readnook.db"));

// Create tables if they don't exist yet
db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    author      TEXT    NOT NULL,
    description TEXT    DEFAULT '',
    publisher_id INTEGER,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_books (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    book_id     INTEGER NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'want',
    notes       TEXT    DEFAULT '',
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_user_books_unique
    ON user_books(user_id, book_id);

  CREATE TABLE IF NOT EXISTS publishers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    email        TEXT    NOT NULL UNIQUE,
    password     TEXT    NOT NULL,
    role         TEXT    NOT NULL DEFAULT 'reader',
    created_at   TEXT    DEFAULT (datetime('now'))
  );
`);

try { db.prepare("ALTER TABLE books ADD COLUMN description TEXT DEFAULT ''").run(); } catch (err) {}
try { db.prepare("ALTER TABLE books ADD COLUMN publisher_id INTEGER").run(); } catch (err) {}
try { db.prepare("ALTER TABLE books ADD COLUMN created_at TEXT DEFAULT (datetime('now'))").run(); } catch (err) {}

try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS user_books (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      book_id     INTEGER NOT NULL,
      status      TEXT    NOT NULL DEFAULT 'want',
      notes       TEXT    DEFAULT '',
      created_at  TEXT    DEFAULT (datetime('now'))
    )
  `).run();
} catch (err) {}

try {
  db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_user_books_unique ON user_books(user_id, book_id)").run();
} catch (err) {}

// Seed some starter books if table is empty
const count = db.prepare("SELECT COUNT(*) as c FROM books").get();
if (count.c === 0) {
  const insert = db.prepare(
    "INSERT INTO books (title, author, description, publisher_id) VALUES (?, ?, ?, ?)"
  );
  insert.run("The Pragmatic Programmer", "David Thomas & Andrew Hunt", "A classic guide to software craftsmanship and career growth.", null);
  insert.run("Atomic Habits", "James Clear", "Simple habits for remarkable results.", null);
  insert.run("Deep Work", "Cal Newport", "Focus on meaningful work in a distracted world.", null);
  insert.run("The Alchemist", "Paulo Coelho", "A magical story about following your dreams.", null);
  insert.run("Sapiens", "Yuval Noah Harari", "A brief history of humankind.", null);
  console.log("Database seeded with starter library books");
}

module.exports = db;