// book.js — Readnook book detail page

const API = "http://localhost:3000/api";
const params = new URLSearchParams(window.location.search);
const userBookId = params.get("id");
const libraryBookId = params.get("bookId");

// ── Check auth ──
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

async function loadBook() {
  if (userBookId) {
    return loadUserBook(userBookId);
  }
  if (libraryBookId) {
    return loadLibraryBook(libraryBookId);
  }
  window.location.href = "index.html";
}

async function loadUserBook(id) {
  const res = await fetch(`${API}/books/${id}`, { credentials: "include" });
  if (!res.ok) {
    document.getElementById("book-detail-box").innerHTML =
      `<p class="empty-msg">Book not found. <a href="index.html">Go back</a></p>`;
    return;
  }
  const book = await res.json();
  renderBook(book, false);
}

async function loadLibraryBook(id) {
  const res = await fetch(`${API}/library/${id}`, { credentials: "include" });
  if (!res.ok) {
    document.getElementById("book-detail-box").innerHTML =
      `<p class="empty-msg">Book not found. <a href="index.html">Go back</a></p>`;
    return;
  }
  const book = await res.json();
  renderBook(book, true, Boolean(book.saved_entry_id));
}

function renderBook(book, isLibrary = false, isSaved = false) {
  const statusLabel = { reading: "Reading", done: "Done", want: "Want to read" };
  const box = document.getElementById("book-detail-box");
  const currentStatus = book.status || book.saved_status || "want";
  const currentNotes = book.notes ?? book.saved_notes ?? "";

  box.innerHTML = `
    <div class="detail-header">
      <div>
        <h2>${book.title}</h2>
        <p class="author">${book.author}${book.publisher_name ? ` • ${book.publisher_name}` : ""}</p>
      </div>
      <span class="status ${currentStatus}">${statusLabel[currentStatus]}</span>
    </div>

    <div class="detail-section">
      <p class="book-meta">${book.description ? book.description : "No description available."}</p>
    </div>

    <div class="detail-section">
      <label class="detail-label">Reading status</label>
      <select id="status-select" class="status-select-lg">
        <option value="reading" ${currentStatus === "reading" ? "selected" : ""}>Reading</option>
        <option value="done"    ${currentStatus === "done"    ? "selected" : ""}>Done</option>
        <option value="want"    ${currentStatus === "want"    ? "selected" : ""}>Want to read</option>
      </select>
    </div>

    <div class="detail-section">
      <label class="detail-label">My notes</label>
      <textarea id="notes-input" class="notes-input" placeholder="Write your thoughts about this book...">${currentNotes}</textarea>
    </div>

    <div class="detail-actions">
      <button id="save-btn" class="submit-btn">${isLibrary && !isSaved ? "Add to my list" : "Save changes"}</button>
      ${((isLibrary && isSaved) || !isLibrary) ? '<button id="delete-btn" class="delete-btn">Remove from my list</button>' : ""}
    </div>

    <div id="save-msg" class="save-msg hidden">✓ Saved successfully</div>

    <div id="confirm-overlay" class="confirm-overlay hidden">
      <div class="confirm-box">
        <h3>Remove this book?</h3>
        <p>This will remove <strong>${book.title}</strong> from your list.</p>
        <div class="confirm-actions">
          <button id="confirm-delete" class="delete-btn">Yes, remove</button>
          <button id="cancel-delete" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("save-btn").addEventListener("click", async () => {
    const status = document.getElementById("status-select").value;
    const notes = document.getElementById("notes-input").value;

    if (isLibrary && !isSaved) {
      const res = await fetch(`${API}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bookId: book.id, status, notes }),
      });
      if (res.ok) {
        const saved = await res.json();
        window.location.href = `book.html?id=${saved.id}`;
      }
      return;
    }

    const entryId = isLibrary ? book.saved_entry_id : book.id;
    const res = await fetch(`${API}/books/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status, notes }),
    });

    if (res.ok) {
      const updated = await res.json();
      const badge = box.querySelector(".status");
      badge.className = `status ${updated.status}`;
      badge.textContent = statusLabel[updated.status];
      const msgEl = document.getElementById("save-msg");
      msgEl.classList.remove("hidden");
      setTimeout(() => msgEl.classList.add("hidden"), 2400);
    }
  });

  const deleteBtn = document.getElementById("delete-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      document.getElementById("confirm-overlay").classList.remove("hidden");
    });
  }

  document.getElementById("cancel-delete").addEventListener("click", () => {
    document.getElementById("confirm-overlay").classList.add("hidden");
  });

  document.getElementById("confirm-delete").addEventListener("click", async () => {
    const entryId = isLibrary ? book.saved_entry_id : book.id;
    const res = await fetch(`${API}/books/${entryId}`, {
      method: "DELETE",
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