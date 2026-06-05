// ── Check login on page load ──
async function checkAuth() {
  const res  = await fetch("/api/auth/me", { credentials: "include" });
  const data = await res.json();

  if (!data.loggedIn) {
    window.location.href = "login.html";
    return null;
  }

  const userEl = document.getElementById("user-name");
  if (userEl) userEl.textContent = data.name;
  return data;
}

// ── Logout ──
async function logout() {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  window.location.href = "login.html";
}

document.getElementById("logout-btn")?.addEventListener("click", logout);

const API = "http://localhost:3000/api";
const statusLabel = {
  reading: "Reading",
  done:    "Done",
  want:    "Want to read",
};

let myBooks = [];
let activeFilter = "all";

async function loadLibrary() {
  const query = document.getElementById("search").value.trim();
  const url = new URL(`${API}/library`, window.location);
  if (query) url.searchParams.set("q", query);

  const res = await fetch(url, { credentials: "include" });
  const books = await res.json();
  renderLibrary(books);
}

async function loadBooks() {
  const res = await fetch(`${API}/books`, { credentials: "include" });
  myBooks = await res.json();
  applyFilters();
}

function renderLibrary(books) {
  const grid = document.getElementById("library-grid");

  if (books.length === 0) {
    grid.innerHTML = `<p class="empty-msg">No library books found.</p>`;
    return;
  }

  grid.innerHTML = books.map(book => `
    <div class="book-card" data-id="${book.id}">
      <h2>${book.title}</h2>
      <p class="author">${book.author}${book.publisher_name ? ` • ${book.publisher_name}` : ""}</p>
      <p class="book-meta">${book.description ? book.description : "A cozy library title waiting to be discovered."}</p>
      <div class="card-actions">
        <a href="book.html?bookId=${book.id}" class="detail-link">Details →</a>
        <button class="add-list-btn" data-id="${book.id}" ${book.saved_entry_id ? "disabled" : ""}>
          ${book.saved_entry_id ? "Saved" : "Add to list"}
        </button>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".add-list-btn").forEach(button => {
    button.addEventListener("click", async (event) => {
      const id = parseInt(event.target.dataset.id, 10);
      await addBookToList(id);
    });
  });
}

function renderBooks(books) {
  const grid = document.getElementById("reading-grid");

  if (books.length === 0) {
    grid.innerHTML = `<p class="empty-msg">No books found in your reading list.</p>`;
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
      await updateStatus(parseInt(e.target.dataset.id, 10), e.target.value);
    });
  });
}

async function updateStatus(id, newStatus) {
  await fetch(`${API}/books/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status: newStatus }),
  });
  await refreshLists();
}

async function addBookToList(bookId) {
  await fetch(`${API}/books`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ bookId, status: "want" }),
  });
  await refreshLists();
}

async function applyFilters() {
  const query = document.getElementById("search").value.toLowerCase();
  const filtered = myBooks.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(query) ||
                          book.author.toLowerCase().includes(query);
    const matchesFilter = activeFilter === "all" || book.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  renderBooks(filtered);
}

async function refreshLists() {
  await Promise.all([loadLibrary(), loadBooks()]);
}

async function addBook(e) {
  e.preventDefault();
  const title = document.getElementById("new-title").value.trim();
  const author = document.getElementById("new-author").value.trim();
  const description = document.getElementById("new-desc").value.trim();
  if (!title || !author) return;

  await fetch(`${API}/books`, {
    credentials: "include",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, author, description, status: "want" }),
  });

  document.getElementById("new-title").value = "";
  document.getElementById("new-author").value = "";
  document.getElementById("new-desc").value = "";
  document.getElementById("add-form").classList.add("hidden");
  await refreshLists();
}

// ── Event listeners ──
document.getElementById("search").addEventListener("input", refreshLists);

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

checkAuth().then(user => {
  if (user) refreshLists();
});

