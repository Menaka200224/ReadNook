// ── Check login on page load ──
async function checkAuth() {
  const res  = await fetch("/api/auth/me", { credentials: "include" });
  const data = await res.json();

  if (!data.loggedIn) {
    window.location.href = "login.html";
    return;
  }

  // Show user's name in header
  const userEl = document.getElementById("user-name");
  if (userEl) userEl.textContent = data.name;
}

// ── Logout ──
async function logout() {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  window.location.href = "login.html";
}

document.getElementById("logout-btn")?.addEventListener("click", logout);

// Run auth check first
checkAuth().then(() => applyFilters());
const API = "http://localhost:3000/api";

const statusLabel = {
  reading: "Reading",
  done:    "Done",
  want:    "Want to read",
};

// ── Fetch all books from the backend ──
async function loadBooks() {
  const res   = await fetch(`${API}/books`, { credentials: "include" });
  const books = await res.json();
  return books;
}

// ── Render cards ──
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

  document.querySelectorAll(".status-select").forEach(select => {
    select.addEventListener("change", async (e) => {
      await updateStatus(parseInt(e.target.dataset.id), e.target.value);
    });
  });
}

// ── Update status via API ──
async function updateStatus(id, newStatus) {
  await fetch(`${API}/books/${id}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body:    JSON.stringify({ status: newStatus }),
  });
  applyFilters();
}

// ── Filter + search ──
let allBooks    = [];
let activeFilter = "all";

async function applyFilters() {
  allBooks = await loadBooks();
  const query = document.getElementById("search").value.toLowerCase();

  const filtered = allBooks.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(query) ||
                          book.author.toLowerCase().includes(query);
    const matchesFilter = activeFilter === "all" || book.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  renderBooks(filtered);
}

// ── Add book form ──
async function addBook(e) {
  e.preventDefault();
  const title  = document.getElementById("new-title").value.trim();
  const author = document.getElementById("new-author").value.trim();
  if (!title || !author) return;

  await fetch(`${API}/books`, {
    credentials: "include",
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ title, author, status: "want" }),
  });

  document.getElementById("new-title").value  = "";
  document.getElementById("new-author").value = "";
  document.getElementById("add-form").classList.add("hidden");
  applyFilters();
}

// ── Event listeners ──
document.getElementById("search").addEventListener("input", applyFilters);

document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    applyFilters();
  });
});

document.getElementById("add-book-btn").addEventListener("click", () => {
  document.getElementById("add-form").classList.toggle("hidden");
});

document.getElementById("book-form").addEventListener("submit", addBook);

