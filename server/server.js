// server.js — Readnook Express API

const express = require("express");
const cors    = require("cors");
const db      = require("./database");

const app  = express();
const PORT = 3000;

app.use(cors());

app.use(express.json());


// Serve frontend files from the parent folder
app.use(express.static(require("path").join(__dirname, "..")));

// ── GET all books ──────────────────────────────────────
app.get("/api/books", (req, res) => {
  const books = db.prepare("SELECT * FROM books ORDER BY created_at DESC").all();
  res.json(books);
});

// ── GET single book ────────────────────────────────────
app.get("/api/books/:id", (req, res) => {
  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(req.params.id);
  if (!book) return res.status(404).json({ error: "Book not found" });
  res.json(book);
});

// ── POST add a new book ────────────────────────────────
app.post("/api/books", (req, res) => {
  const { title, author, status, notes } = req.body;
  if (!title || !author) {
    return res.status(400).json({ error: "Title and author are required" });
  }
  const result = db.prepare(
    "INSERT INTO books (title, author, status, notes) VALUES (?, ?, ?, ?)"
  ).run(title, author, status || "want", notes || "");

  const newBook = db.prepare("SELECT * FROM books WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(newBook);
});

// ── PATCH update book status or notes ─────────────────
app.patch("/api/books/:id", (req, res) => {
  const { status, notes } = req.body;
  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(req.params.id);
  if (!book) return res.status(404).json({ error: "Book not found" });

  db.prepare(
    "UPDATE books SET status = ?, notes = ? WHERE id = ?"
  ).run(status ?? book.status, notes ?? book.notes, req.params.id);

  const updated = db.prepare("SELECT * FROM books WHERE id = ?").get(req.params.id);
  res.json(updated);
});

// ── DELETE a book ──────────────────────────────────────
app.delete("/api/books/:id", (req, res) => {
  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(req.params.id);
  if (!book) return res.status(404).json({ error: "Book not found" });
  db.prepare("DELETE FROM books WHERE id = ?").run(req.params.id);
  res.json({ message: "Book deleted" });
});

// ── Start server ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Readnook server running at http://localhost:${PORT}`);
});