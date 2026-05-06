# readnook

> A cozy public e-book library and reading tracker — built for readers, made for publishers.

![Version](https://img.shields.io/badge/version-0.4.0-C0392B)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## What is Readnook?

Readnook is a full-stack web application where readers can track their reading lists and publishers can share e-books with the world. Built from scratch as a learning project — starting from a static HTML page all the way to a live deployed app with automation.

---

## Features

- Browse and search books by title or author
- Track reading status — *Reading*, *Done*, *Want to read*
- Add new books to your personal list
- User accounts — register, login, logout
- Each user sees only their own reading list
- Publisher portal (coming in Phase 5)
- Scheduled automation — weekly reading reports and reminders (coming in Phase 5)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js, Express |
| Database | SQLite via better-sqlite3 |
| Auth | bcrypt, express-session, connect-sqlite3 |
| Automation | node-cron, Nodemailer (Phase 5) |
| CI/CD | GitHub Actions (Phase 5) |

---

## Project Structure

```
readnook/
├── index.html          # Main book list page
├── book.html           # Single book detail page
├── login.html          # Login page
├── register.html       # Registration page
├── style.css           # Global styles (Readnook brand)
├── app.js              # Frontend JavaScript
├── .env                # Environment variables (never commit this)
├── .gitignore
├── README.md
└── server/
    ├── server.js       # Express app + all API routes
    ├── database.js     # SQLite setup + schema + seed data
    ├── package.json
    └── readnook.db     # SQLite database (auto-created, never commit)
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- npm (comes with Node.js)

### Installation

1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/readnook.git
cd readnook
```

2. Install backend dependencies

```bash
cd server
npm install
```

3. Create your `.env` file in the project root

```bash
# readnook/.env
SESSION_SECRET=your_secret_key_change_this_in_production
PORT=3000
```

4. Start the server

```bash
node server.js
```

5. Open your browser and visit

```
http://localhost:3000
```

---

## API Reference

All endpoints are prefixed with `/api`.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Get current session info |

### Books (requires login)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/books` | Get all books for logged-in user |
| GET | `/api/books/:id` | Get a single book |
| POST | `/api/books` | Add a new book |
| PATCH | `/api/books/:id` | Update book status or notes |
| DELETE | `/api/books/:id` | Delete a book |

### Example request — add a book

```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{"title": "The Alchemist", "author": "Paulo Coelho", "status": "want"}'
```

---

## Version History

| Version | What shipped |
|---|---|
| `v0.1` | Static HTML & CSS ,Live search, status filter, localStorage |
| `v0.2` | Node.js & Express API & SQLite database |
| `v0.3` | User accounts, login, sessions, protected routes |


---

## Roadmap

- [x] Static frontend with book cards
- [x] JavaScript search and filter
- [x] Real backend with REST API
- [x] SQLite database
- [x] User authentication and sessions
- [ ] Publisher portal — upload and manage e-books
- [ ] Public library — browse all published books
- [ ] Weekly reading report emails
- [ ] Daily reading reminders
- [ ] GitHub Actions CI/CD pipeline
- [ ] Live deployment on Railway or Render

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `SESSION_SECRET` | Secret key for signing session cookies | `readnook_secret_abc123` |
| `PORT` | Port the server runs on | `3000` |

> Never commit your `.env` file. It is already listed in `.gitignore`.

---

## Contributing

This is a personal learning project but contributions are welcome. Feel free to open an issue or submit a pull request.

---

## License

MIT — feel free to use this project to learn from or build on top of.

---

> Built with ❤️ by a reader, for readers.