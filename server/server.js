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

function requirePublisher(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Please log in first" });
  }
  if (req.session.userRole !== "publisher") {
    return res.status(403).json({ error: "Only publishers can access this route" });
  }
  next();
}

// ════════════════════════════════════════════════════════
// AUTH ROUTES
// ════════════════════════════════════════════════════════

// Register
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password,role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const userRole   = role === "publisher" ? "publisher" : "reader";
  const result = db.prepare(
    "INSERT INTO users (name, email, password,role) VALUES (?, ?, ?,?)"
  ).run(name, email, hashed,userRole);

  req.session.userId   = result.lastInsertRowid;
  req.session.userName = name;
  req.session.userRole = userRole;

  res.status(201).json({ message: "Account created", name, role: userRole});
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
// LIBRARY ROUTES
// ════════════════════════════════════════════════════════

app.get("/api/library", requireLogin, (req, res) => {
  const query = req.query.q ? `%${req.query.q.toLowerCase()}%` : "%";
  const books = db.prepare(`
    SELECT books.*, users.name AS publisher_name, ub.id AS saved_entry_id
    FROM books
    LEFT JOIN users ON books.publisher_id = users.id
    LEFT JOIN user_books ub ON books.id = ub.book_id AND ub.user_id = ?
    WHERE lower(books.title) LIKE ? OR lower(books.author) LIKE ?
    ORDER BY books.created_at DESC
  `).all(req.session.userId, query, query);
  res.json(books);
});

app.get("/api/library/:id", requireLogin, (req, res) => {
  const book = db.prepare(`
    SELECT books.*, users.name AS publisher_name,
           ub.id AS saved_entry_id, ub.status AS saved_status, ub.notes AS saved_notes
    FROM books
    LEFT JOIN users ON books.publisher_id = users.id
    LEFT JOIN user_books ub ON books.id = ub.book_id AND ub.user_id = ?
    WHERE books.id = ?
  `).get(req.session.userId, req.params.id);

  if (!book) return res.status(404).json({ error: "Book not found" });
  res.json(book);
});

// ════════════════════════════════════════════════════════
// USER READING LIST ROUTES
// ════════════════════════════════════════════════════════

app.get("/api/books", requireLogin, (req, res) => {
  const books = db.prepare(`
    SELECT ub.id, ub.status, ub.notes, ub.created_at,
           b.id AS book_id, b.title, b.author, b.description,
           u.name AS publisher_name
    FROM user_books ub
    JOIN books b ON ub.book_id = b.id
    LEFT JOIN users u ON b.publisher_id = u.id
    WHERE ub.user_id = ?
    ORDER BY ub.created_at DESC
  `).all(req.session.userId);
  res.json(books);
});

app.get("/api/books/:id", requireLogin, (req, res) => {
  const book = db.prepare(`
    SELECT ub.id, ub.status, ub.notes, ub.created_at,
           b.id AS book_id, b.title, b.author, b.description,
           u.name AS publisher_name
    FROM user_books ub
    JOIN books b ON ub.book_id = b.id
    LEFT JOIN users u ON b.publisher_id = u.id
    WHERE ub.id = ? AND ub.user_id = ?
  `).get(req.params.id, req.session.userId);

  if (!book) return res.status(404).json({ error: "Book not found" });
  res.json(book);
});

app.post("/api/books", requireLogin, (req, res) => {
  const { bookId, title, author, description, status, notes } = req.body;

  if (bookId) {
    const libraryBook = db.prepare("SELECT * FROM books WHERE id = ?").get(bookId);
    if (!libraryBook) return res.status(404).json({ error: "Library book not found" });

    db.prepare(
      "INSERT OR IGNORE INTO user_books (user_id, book_id, status, notes) VALUES (?, ?, ?, ?)"
    ).run(req.session.userId, bookId, status || "want", notes || "");

    const entry = db.prepare(`
      SELECT ub.id, ub.status, ub.notes, ub.created_at,
             b.id AS book_id, b.title, b.author, b.description,
             u.name AS publisher_name
      FROM user_books ub
      JOIN books b ON ub.book_id = b.id
      LEFT JOIN users u ON b.publisher_id = u.id
      WHERE ub.user_id = ? AND ub.book_id = ?
    `).get(req.session.userId, bookId);

    return res.status(201).json(entry);
  }

  if (!title || !author) {
    return res.status(400).json({ error: "Title and author are required" });
  }

  const bookResult = db.prepare(
    "INSERT INTO books (title, author, description, publisher_id) VALUES (?, ?, ?, ?)"
  ).run(title, author, description || "", null);

  const result = db.prepare(
    "INSERT INTO user_books (user_id, book_id, status, notes) VALUES (?, ?, ?, ?)"
  ).run(req.session.userId, bookResult.lastInsertRowid, status || "want", notes || "");

  const newEntry = db.prepare(`
    SELECT ub.id, ub.status, ub.notes, ub.created_at,
           b.id AS book_id, b.title, b.author, b.description,
           u.name AS publisher_name
    FROM user_books ub
    JOIN books b ON ub.book_id = b.id
    LEFT JOIN users u ON b.publisher_id = u.id
    WHERE ub.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(newEntry);
});

app.patch("/api/books/:id", requireLogin, (req, res) => {
  const { status, notes } = req.body;
  const book = db.prepare(
    "SELECT * FROM user_books WHERE id = ? AND user_id = ?"
  ).get(req.params.id, req.session.userId);
  if (!book) return res.status(404).json({ error: "Book not found" });

  db.prepare(
    "UPDATE user_books SET status = ?, notes = ? WHERE id = ?"
  ).run(status ?? book.status, notes ?? book.notes, req.params.id);

  const updated = db.prepare(`
    SELECT ub.id, ub.status, ub.notes, ub.created_at,
           b.id AS book_id, b.title, b.author, b.description,
           u.name AS publisher_name
    FROM user_books ub
    JOIN books b ON ub.book_id = b.id
    LEFT JOIN users u ON b.publisher_id = u.id
    WHERE ub.id = ?
  `).get(req.params.id);

  res.json(updated);
});

app.delete("/api/books/:id", requireLogin, (req, res) => {
  const book = db.prepare(
    "SELECT * FROM user_books WHERE id = ? AND user_id = ?"
  ).get(req.params.id, req.session.userId);
  if (!book) return res.status(404).json({ error: "Book not found" });
  db.prepare("DELETE FROM user_books WHERE id = ?").run(req.params.id);
  res.json({ message: "Book removed from your list" });
});

// ════════════════════════════════════════════════════════
// PUBLISHER ROUTES
// ════════════════════════════════════════════════════════

app.get("/api/publisher/books", requirePublisher, (req, res) => {
  const books = db.prepare(`
    SELECT books.*, users.name AS publisher_name
    FROM books
    LEFT JOIN users ON books.publisher_id = users.id
    WHERE books.publisher_id = ?
    ORDER BY books.created_at DESC
  `).all(req.session.userId);
  res.json(books);
});

app.post("/api/library", requirePublisher, (req, res) => {
  const { title, author, description } = req.body;
  if (!title || !author) {
    return res.status(400).json({ error: "Title and author are required" });
  }

  const result = db.prepare(
    "INSERT INTO books (title, author, description, publisher_id) VALUES (?, ?, ?, ?)"
  ).run(title, author, description || "", req.session.userId);

  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(book);
});

app.delete("/api/library/:id", requirePublisher, (req, res) => {
  const book = db.prepare(
    "SELECT * FROM books WHERE id = ? AND publisher_id = ?"
  ).get(req.params.id, req.session.userId);
  if (!book) return res.status(404).json({ error: "Published book not found" });

  db.prepare("DELETE FROM user_books WHERE book_id = ?").run(req.params.id);
  db.prepare("DELETE FROM books WHERE id = ?").run(req.params.id);
  res.json({ message: "Published book removed" });
});

// ── Start server ──────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Readnook running at http://localhost:${PORT}`);
});