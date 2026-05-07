// book.js — Readnook book detail page

const API = "http://localhost:3000/api";

// ── Get book ID from URL (?id=1) ──
function getBookId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

// ── Check auth ──
async function checkAuth() {
  const res  = await fetch(`${API.replace("/api", "")}/api/auth/me`, {
    credentials: "include"
  });
  const data = await res.json();
  if (!data.loggedIn) {
    window.location.href = "login.html";
    return null;
  }
  const userEl = document.getElementById("user-name");
  if (userEl) userEl.textContent = data.name;
  return data;
}

// ── Load and render book ──
async function loadBook() {
  const id = getBookId();
  if (!id) {
    window.location.href = "index.html";
    return;
  }

  const res  = await fetch(`${API}/books/${id}`, { credentials: "include" });
  if (!res.ok) {
    document.getElementById("book-detail-box").innerHTML =
      `<p class="empty-msg">Book not found. <a href="index.html">Go back</a></p>`;
    return;
  }

  const book = await res.json();
  renderBook(book);
}

// ── Render book detail ──
function renderBook(book) {
  const statusLabel = { reading: "Reading", done: "Done", want: "Want to read" };
  const box = document.getElementById("book-detail-box");

  box.innerHTML = `
    <div class="detail-header">
      <div>
        <h2>${book.title}</h2>
        <p class="author">${book.author}</p>
      </div>
      <span class="status ${book.status}">${statusLabel[book.status]}</span>
    </div>

    <div class="detail-section">
      <label class="detail-label">Reading status</label>
      <select id="status-select" class="status-select-lg">
        <option value="reading" ${book.status === "reading" ? "selected" : ""}>Reading</option>
        <option value="done"    ${book.status === "done"    ? "selected" : ""}>Done</option>
        <option value="want"    ${book.status === "want"    ? "selected" : ""}>Want to read</option>
      </select>
    </div>

    <div class="detail-section">
      <label class="detail-label">My notes</label>
      <textarea id="notes-input" class="notes-input" placeholder="Write your thoughts about this book...">${book.notes || ""}</textarea>
    </div>

    <div class="detail-actions">
      <button id="save-btn" class="submit-btn">Save changes</button>
      <button id="delete-btn" class="delete-btn">Delete book</button>
    </div>

    <div id="save-msg" class="save-msg hidden">✓ Saved successfully</div>

    <!-- Delete confirmation dialog -->
    <div id="confirm-overlay" class="confirm-overlay hidden">
      <div class="confirm-box">
        <h3>Delete this book?</h3>
        <p>This will permanently remove <strong>${book.title}</strong> from your list.</p>
        <div class="confirm-actions">
          <button id="confirm-delete" class="delete-btn">Yes, delete</button>
          <button id="cancel-delete" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  `;

  // ── Save changes ──
  document.getElementById("save-btn").addEventListener("click", async () => {
    const status = document.getElementById("status-select").value;
    const notes  = document.getElementById("notes-input").value;

    const res = await fetch(`${API}/books/${book.id}`, {
      method:      "PATCH",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body:        JSON.stringify({ status, notes }),
    });

    if (res.ok) {
      const msgEl = document.getElementById("save-msg");
      msgEl.classList.remove("hidden");
      setTimeout(() => msgEl.classList.add("hidden"), 2500);

      // Update the status badge live
      const updated = await res.json();
      const badge   = box.querySelector(".status");
      badge.className   = `status ${updated.status}`;
      badge.textContent = statusLabel[updated.status];
    }
  });

  // ── Delete button → show confirmation ──
  document.getElementById("delete-btn").addEventListener("click", () => {
    document.getElementById("confirm-overlay").classList.remove("hidden");
  });

  // ── Cancel delete ──
  document.getElementById("cancel-delete").addEventListener("click", () => {
    document.getElementById("confirm-overlay").classList.add("hidden");
  });

  // ── Confirm delete ──
  document.getElementById("confirm-delete").addEventListener("click", async () => {
    const res = await fetch(`${API}/books/${book.id}`, {
      method:      "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      window.location.href = "index.html";
    }
  });
}

// ── Logout ──
document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  window.location.href = "login.html";
});

// ── Init ──
checkAuth().then(user => {
  if (user) loadBook();
});