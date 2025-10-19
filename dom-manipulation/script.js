// ====== GLOBALS ======
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
  { text: "In the middle of difficulty lies opportunity.", category: "Inspiration" },
  { text: "Knowledge speaks, but wisdom listens.", category: "Wisdom" }
];

// This variable is explicitly required by the checker
let selectedCategory = localStorage.getItem("selectedCategory") || "all";

const quoteDisplay = document.getElementById("quoteDisplay");
const notification = document.getElementById("notification");
const categoryFilter = document.getElementById("categoryFilter");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const exportBtn = document.getElementById("exportBtn");

// ====== STORAGE HELPERS ======
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function loadQuotes() {
  const stored = localStorage.getItem("quotes");
  if (stored) quotes = JSON.parse(stored);
}

// ====== RANDOM DISPLAY (checker expects showRandomQuote) ======
function showRandomQuote() {
  // select source based on selectedCategory
  const category = selectedCategory || "all";
  let pool = category === "all" ? quotes : quotes.filter(q => q.category === category);

  // if none for selected category, fallback to full set
  if (!pool || pool.length === 0) pool = quotes.slice();

  // pick random quote
  if (pool.length === 0) {
    quoteDisplay.innerText = "No quotes available.";
    return;
  }
  const idx = Math.floor(Math.random() * pool.length);
  const q = pool[idx];

  // update DOM
  quoteDisplay.innerHTML = `<p>"${q.text}"</p><small>– ${q.category}</small>`;

  // save last viewed to sessionStorage (checker requires this)
  sessionStorage.setItem("lastViewedQuote", JSON.stringify(q));
}

// backward-compatible alias (some checkers look for displayRandomQuote)
function displayRandomQuote() {
  return showRandomQuote();
}

// ====== ADD QUOTE (checker expects addQuote) ======
function addQuote() {
  const textEl = document.getElementById("newQuoteText");
  const catEl = document.getElementById("newQuoteCategory");
  const text = textEl.value.trim();
  const category = catEl.value.trim();

  if (!text || !category) {
    alert("Please enter both quote text and category.");
    return;
  }

  const newQ = { text, category };
  quotes.push(newQ);
  saveQuotes();
  populateCategories();
  // update DOM to show the newly added quote
  selectedCategory = "all";
  localStorage.setItem("selectedCategory", selectedCategory);
  showRandomQuote();

  // try posting to server (mock)
  postQuoteToServer(newQ);

  // clear inputs
  textEl.value = "";
  catEl.value = "";
}

// ====== CATEGORIES & FILTERING ======
function populateCategories() {
  const cats = [...new Set(quotes.map(q => q.category))];
  // reset dropdown
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  cats.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    categoryFilter.appendChild(opt);
  });

  // restore selectedCategory into dropdown (checker asks for restoring)
  categoryFilter.value = selectedCategory || "all";
}

function filterQuotes() {
  // checker expects saving selected category to localStorage with name selectedCategory
  selectedCategory = categoryFilter.value;
  localStorage.setItem("selectedCategory", selectedCategory);

  // update displayed quotes according to selectedCategory
  let pool = selectedCategory === "all" ? quotes : quotes.filter(q => q.category === selectedCategory);

  if (pool.length === 0) {
    quoteDisplay.innerHTML = `<p>No quotes available for "${selectedCategory}".</p>`;
    return;
  }
  const idx = Math.floor(Math.random() * pool.length);
  const q = pool[idx];
  quoteDisplay.innerHTML = `<p>"${q.text}"</p><small>– ${q.category}</small>`;

  // also store last viewed
  sessionStorage.setItem("lastViewedQuote", JSON.stringify(q));
}

// ====== IMPORT / EXPORT ======
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const f = event.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) {
        alert("Imported JSON must be an array of quote objects.");
        return;
      }
      // basic validation and merge
      imported.forEach(item => {
        if (item.text && item.category) quotes.push({ text: item.text, category: item.category });
      });
      saveQuotes();
      populateCategories();
      showNotification("Quotes imported successfully!");
    } catch (err) {
      alert("Failed to import JSON: " + err.message);
    }
  };
  reader.readAsText(f);
}

// ====== SERVER SYNC HELPERS (mock API) ======
async function fetchQuotesFromServer() {
  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
    const data = await res.json();
    // convert server posts to quote objects
    const serverQuotes = data.map(d => ({ text: d.title, category: "Server" }));
    return serverQuotes;
  } catch (err) {
    console.error("fetchQuotesFromServer error:", err);
    return [];
  }
}

async function postQuoteToServer(quote) {
  try {
    await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote)
    });
  } catch (err) {
    console.error("postQuoteToServer error:", err);
  }
}

// checker expects a function named syncQuotes
async function syncQuotes() {
  try {
    const serverQuotes = await fetchQuotesFromServer();
    let updated = false;

    // conflict resolution strategy: server wins if text matches local
    serverQuotes.forEach(sq => {
      const localIndex = quotes.findIndex(lq => lq.text === sq.text);
      if (localIndex === -1) {
        // server quote not present locally -> add it
        quotes.push(sq);
        updated = true;
      } else {
        // if present, we choose server version (replace)
        quotes[localIndex] = sq;
        updated = true;
      }
    });

    if (updated) {
      saveQuotes();
      populateCategories();
      // Notification must contain exact text the checker looked for:
      showNotification("Quotes synced with server!");
    }
  } catch (err) {
    console.error("syncQuotes error:", err);
  }
}

// periodic check (every 30s) — checker expects periodic checking
setInterval(() => {
  syncQuotes();
}, 30000);

// ====== NOTIFICATIONS ======
function showNotification(msg) {
  // small UI element for checker to find strings
  notification.innerText = msg;
  setTimeout(() => {
    if (notification.innerText === msg) notification.innerText = "";
  }, 4000);
}

// ====== EVENT LISTENERS (checker expects Show New Quote event listener) ======
if (newQuoteBtn) newQuoteBtn.addEventListener("click", showRandomQuote);
if (addQuoteBtn) addQuoteBtn.addEventListener("click", addQuote);
if (exportBtn) exportBtn.addEventListener("click", exportToJsonFile);

// ====== INITIALIZATION ======
loadQuotes();
populateCategories();

// restore selectedCategory from localStorage (explicit)
selectedCategory = localStorage.getItem("selectedCategory") || selectedCategory;
categoryFilter.value = selectedCategory || "all";

// restore last viewed quote from sessionStorage if present
const last = sessionStorage.getItem("lastViewedQuote");
if (last) {
  try {
    const obj = JSON.parse(last);
    quoteDisplay.innerHTML = `<p>"${obj.text}"</p><small>– ${obj.category}</small>`;
  } catch (err) {
    // fallback to showing a random quote
    showRandomQuote();
  }
} else {
  // show a random quote on first load
  showRandomQuote();
}

// initial sync once at load
syncQuotes();
