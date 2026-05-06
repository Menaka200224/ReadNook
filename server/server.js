// server.js — Readnook Phase 4

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const express        = require("express");
const cors           = require("cors");
const path           = require("path");
const bcrypt         = require("bcrypt");
const session        = require("express-session");
const SqliteStore    = require("connect-sqlite3")(session);
const db             = require("./database");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "..")));

// ── Sessions ──────────────────────────────────────────
app.use(session({
  store:  new SqliteStore({ db: "sessions.db", dir: __dirname }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, // 7 days
}));

// ── Auth middleware ───────────────────────────────────
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Please log in first" });
  }
  next();
}

// ════════════════════════════════════════════════════════
// AUTH ROUTES
// ════════════════════════════════════════════════════════

// Register
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const result = db.prepare(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)"
  ).run(name, email, hashed);

  req.session.userId   = result.lastInsertRowid;
  req.session.userName = name;
  req.session.userRole = "reader";

  res.status(201).json({ message: "Account created", name, role: "reader" });
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  req.session.userId   = user.id;
  req.session.userName = user.name;
  req.session.userRole = user.role;

  res.json({ message: "Logged in", name: user.name, role: user.role });
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out" });
});

// Check current session
app.get("/api/auth/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ loggedIn: false });
  }
  res.json({
    loggedIn: true,
    name: req.session.userName,
    role: req.session.userRole,
  });
});

// ════════════════════════════════════════════════════════
// BOOK ROUTES (now protected + user-scoped)
// ════════════════════════════════════════════════════════

// GET all books for logged-in user
app.get("/api/books", requireLogin, (req, res) => {
  const books = db.prepare(
    "SELECT * FROM books WHERE user_id = ? ORDER BY created_at DESC"
  ).all(req.session.userId);
  res.json(books);
});

// GET single book
app.get("/api/books/:id", requireLogin, (req, res) => {
  const book = db.prepare(
    "SELECT * FROM books WHERE id = ? AND user_id = ?"
  ).get(req.params.id, req.session.userId);
  if (!book) return res.status(404).json({ error: "Book not found" });
  res.json(book);
});

// POST add book
app.post("/api/books", requireLogin, (req, res) => {
  const { title, author, status, notes } = req.body;
  if (!title || !author) {
    return res.status(400).json({ error: "Title and author are required" });
  }
  const result = db.prepare(
    "INSERT INTO books (title, author, status, notes, user_id) VALUES (?, ?, ?, ?, ?)"
  ).run(title, author, status || "want", notes || "", req.session.userId);

  const newBook = db.prepare("SELECT * FROM books WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(newBook);
});

// PATCH update book
app.patch("/api/books/:id", requireLogin, (req, res) => {
  const { status, notes } = req.body;
  const book = db.prepare(
    "SELECT * FROM books WHERE id = ? AND user_id = ?"
  ).get(req.params.id, req.session.userId);
  if (!book) return res.status(404).json({ error: "Book not found" });

  db.prepare(
    "UPDATE books SET status = ?, notes = ? WHERE id = ?"
  ).run(status ?? book.status, notes ?? book.notes, req.params.id);

  const updated = db.prepare("SELECT * FROM books WHERE id = ?").get(req.params.id);
  res.json(updated);
});

// DELETE book
app.delete("/api/books/:id", requireLogin, (req, res) => {
  const book = db.prepare(
    "SELECT * FROM books WHERE id = ? AND user_id = ?"
  ).get(req.params.id, req.session.userId);
  if (!book) return res.status(404).json({ error: "Book not found" });
  db.prepare("DELETE FROM books WHERE id = ?").run(req.params.id);
  res.json({ message: "Book deleted" });
});

// ── Start server ──────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Readnook running at http://localhost:${PORT}`);
});