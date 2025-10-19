// === Initialize and Load from LocalStorage ===
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "Stay hungry, stay foolish.", category: "Motivation" },
  { text: "Knowledge is power.", category: "Wisdom" },
  { text: "Be yourself; everyone else is already taken.", category: "Inspiration" }
];

let selectedCategory = localStorage.getItem('selectedCategory') || "All";

// === Helper Functions ===
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

function showNotification(message) {
  const note = document.getElementById('notification');
  note.textContent = message;
  setTimeout(() => note.textContent = "", 3000);
}

// === Display Random Quote ===
function displayRandomQuote() {
  let availableQuotes = quotes;
  if (selectedCategory !== "All") {
    availableQuotes = quotes.filter(q => q.category === selectedCategory);
  }
  if (availableQuotes.length === 0) {
    document.getElementById('quoteDisplay').textContent = "No quotes found.";
    return;
  }
  const randomIndex = Math.floor(Math.random() * availableQuotes.length);
  const quote = availableQuotes[randomIndex];
  document.getElementById('quoteDisplay').innerHTML = `<p>"${quote.text}"</p><small>– ${quote.category}</small>`;
  sessionStorage.setItem('lastViewedQuote', JSON.stringify(quote));
}

// === Add Quote Logic ===
function addQuote(text, category) {
  if (text && category) {
    quotes.push({ text, category });
    saveQuotes();
    populateCategories();
    showNotification("Quote added successfully!");
  } else {
    alert("Please enter both quote and category.");
  }
}

// === Create Add Quote Form ===
function createAddQuoteForm() {
  const section = document.getElementById('addQuoteSection');
  section.innerHTML = `
    <h3>Add New Quote</h3>
    <input type="text" id="quoteText" placeholder="Quote text">
    <input type="text" id="quoteCategory" placeholder="Category">
    <button id="addQuoteBtn">Add Quote</button>
  `;
  document.getElementById('addQuoteBtn').addEventListener('click', () => {
    const text = document.getElementById('quoteText').value.trim();
    const category = document.getElementById('quoteCategory').value.trim();
    addQuote(text, category);
  });
}

// === Category Filter ===
function populateCategories() {
  const categories = ["All", ...new Set(quotes.map(q => q.category))];
  const select = document.getElementById('categoryFilter');
  select.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  select.value = selectedCategory;
}

function filterQuotes() {
  selectedCategory = document.getElementById('categoryFilter').value;
  localStorage.setItem('selectedCategory', selectedCategory);
  displayRandomQuote();
}

// === Import / Export ===
document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'quotes.json';
  a.click();
});

document.getElementById('importFile').addEventListener('change', (event) => {
  const fileReader = new FileReader();
  fileReader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      quotes.push(...imported);
      saveQuotes();
      populateCategories();
      showNotification("Quotes imported successfully!");
    } catch {
      alert("Invalid JSON file.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
});

// === Mock Server Sync ===
async function fetchQuotesFromServer() {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=3');
  const data = await response.json();
  return data.map(post => ({ text: post.title, category: "Server" }));
}

async function postQuoteToServer(quote) {
  await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    body: JSON.stringify(quote),
    headers: { 'Content-type': 'application/json; charset=UTF-8' }
  });
}

async function syncQuotes() {
  try {
    const serverQuotes = await fetchQuotesFromServer();
    let newQuotes = serverQuotes.filter(sq => !quotes.some(lq => lq.text === sq.text));
    if (newQuotes.length > 0) {
      quotes.push(...newQuotes);
      saveQuotes();
      populateCategories();
      showNotification("Quotes synced with server!");
    }
  } catch (e) {
    console.error("Sync failed:", e);
  }
}

// Periodically sync every 30 seconds
setInterval(syncQuotes, 30000);

// === Event Listeners ===
document.getElementById('showQuoteBtn').addEventListener('click', displayRandomQuote);
document.getElementById('categoryFilter').addEventListener('change', filterQuotes);

// === Initialize ===
createAddQuoteForm();
populateCategories();
displayRandomQuote();
syncQuotes();
