// publisher.js — Readnook publisher dashboard

const API = "http://localhost:3000/api";

// ── Auth check — publishers only ──
async function checkAuth() {
  const res  = await fetch("/api/auth/me", { credentials: "include" });
  const data = await res.json();

  if (!data.loggedIn) {
    window.location.href = "login.html";
    return null;
  }
  if (data.role !== "publisher") {
    window.location.href = "index.html";
    return null;
  }

  document.getElementById("user-name").textContent = data.name;
  return data;
}

// ── Load publisher's books ──
async function loadPublishedBooks() {
  const res   = await fetch(`${API}/books`, { credentials: "include" });
  const books = await res.json();
  const grid  = document.getElementById("pub-grid");

  if (books.length === 0) {
    grid.innerHTML = `<p class="empty-msg">You haven't published any books yet.</p>`;
    return;
  }

  grid.innerHTML = books.map(book => `
    <div class="book-card">
      <h2>${book.title}</h2>
      <p class="author">${book.author}</p>
      <span class="status reading">Published</span>
      <div class="card-actions">
        <span style="font-size:0.78rem;color:#888;font-family:system-ui,sans-serif">
          ${new Date(book.created_at).toLocaleDateString()}
        </span>
        <button class="delete-book-btn" data-id="${book.id}"
          style="font-size:0.75rem;color:#C0392B;background:none;border:none;cursor:pointer">
          Remove
        </button>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".delete-book-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Remove this book?")) return;
      await fetch(`${API}/books/${btn.dataset.id}`, {
        method: "DELETE", credentials: "include"
      });
      loadPublishedBooks();
    });
  });
}

// ── Publish new book ──
// ── Publish new book ──
document.getElementById("publish-btn").addEventListener("click", async () => {
  const title  = document.getElementById("pub-title").value.trim();
  const author = document.getElementById("pub-author").value.trim();
  const errEl  = document.getElementById("pub-error");
  const btn    = document.getElementById("publish-btn");

  // Clear previous errors
  errEl.classList.add("hidden");

  if (!title || !author) {
    errEl.textContent = "Title and author are required";
    errEl.classList.remove("hidden");
    return;
  }

  // Show loading state
  btn.textContent = "Publishing...";
  btn.disabled    = true;

  try {
    const res  = await fetch(`${API}/books`, {
      method:      "POST",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body:        JSON.stringify({ title, author, status: "reading" }),
    });

    const data = await res.json();
    console.log("Publish response:", res.status, data); // debug line

    if (res.ok) {
      document.getElementById("pub-title").value  = "";
      document.getElementById("pub-author").value = "";
      errEl.classList.add("hidden");
      loadPublishedBooks();
    } else {
      // Show exact server error
      errEl.textContent = data.error || "Something went wrong. Please try again.";
      errEl.classList.remove("hidden");
    }

  } catch (err) {
    console.error("Publish error:", err);
    errEl.textContent = "Could not connect to server. Is it running?";
    errEl.classList.remove("hidden");
  } finally {
    btn.textContent = "Publish book";
    btn.disabled    = false;
  }
});


// ── Logout ──
document.getElementById("logout-btn").addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  window.location.href = "login.html";
});

// ── Init ──
checkAuth().then(user => {
  if (user) loadPublishedBooks();
});