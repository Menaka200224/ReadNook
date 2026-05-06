// ── Readnook app.js – Phase 2 ──

// Default books (used only if nothing is saved yet)
const defaultBooks = [
  { id: 1, title: "The Pragmatic Programmer", author: "David Thomas & Andrew Hunt", status: "reading" },
  { id: 2, title: "Atomic Habits",            author: "James Clear",                 status: "done"    },
  { id: 3, title: "Deep Work",                author: "Cal Newport",                 status: "want"    },
  { id: 4, title: "The Alchemist",            author: "Paulo Coelho",                status: "want"    },
  { id: 5, title: "Sapiens",                  author: "Yuval Noah Harari",           status: "reading" },
];

// ── Load from localStorage (or use defaults) ──
function loadBooks() {
  const saved = localStorage.getItem("readnook-books");
  return saved ? JSON.parse(saved) : defaultBooks;
}

// ── Save to localStorage ──
function saveBooks(books) {
  localStorage.setItem("readnook-books", JSON.stringify(books));
}

// ── Status label map ──
const statusLabel = {
  reading: "Reading",
  done:    "Done",
  want:    "Want to read",
};

// ── Render cards to the DOM ──
function renderBooks(books) {
  const grid = document.getElementById("book-grid");

  if (books.length === 0) {
    grid.innerHTML = `<p class="empty-msg">No books found.</p>`;
    return;
  }

  grid.innerHTML = books.map(book => `
    <div class="book-card" data-id="${book.id}">
      <h2>${book.title}</h2>
      <p class="author">${book.author}</p>
      <span class="status ${book.status}">${statusLabel[book.status]}</span>
      <div class="card-actions">
        <select class="status-select" data-id="${book.id}">
          <option value="reading" ${book.status === "reading" ? "selected" : ""}>Reading</option>
          <option value="done"    ${book.status === "done"    ? "selected" : ""}>Done</option>
          <option value="want"    ${book.status === "want"    ? "selected" : ""}>Want to read</option>
        </select>
        <a href="book.html?id=${book.id}" class="detail-link">Details →</a>
      </div>
    </div>
  `).join("");

  // Attach change listeners to all dropdowns
  document.querySelectorAll(".status-select").forEach(select => {
    select.addEventListener("change", (e) => {
      updateStatus(parseInt(e.target.dataset.id), e.target.value);
    });
  });
}

// ── Update a book's status ──
function updateStatus(id, newStatus) {
  const books = loadBooks();
  const book = books.find(b => b.id === id);
  if (book) {
    book.status = newStatus;
    saveBooks(books);
    applyFilters(); // re-render with current filters
  }
}

// ── Filter + search logic ──
let activeFilter = "all";

function applyFilters() {
  const books     = loadBooks();
  const query     = document.getElementById("search").value.toLowerCase();

  const filtered = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(query) ||
                          book.author.toLowerCase().includes(query);
    const matchesFilter = activeFilter === "all" || book.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  renderBooks(filtered);
}

// ── Search input listener ──
document.getElementById("search").addEventListener("input", applyFilters);

// ── Filter button listeners ──
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    applyFilters();
  });
});

// ── Initial render ──
applyFilters();