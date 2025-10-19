// Initialize quotes array
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
  { text: "In the middle of difficulty lies opportunity.", category: "Inspiration" }
];

// Load last viewed quote (sessionStorage)
const lastViewedQuote = sessionStorage.getItem('lastViewedQuote');

// Display area reference
const quoteDisplay = document.getElementById('quoteDisplay');
const notification = document.getElementById('notification');

// ==================== CORE FUNCTIONS ====================

// Display random quote
function displayRandomQuote() {
  if (quotes.length === 0) {
    quoteDisplay.innerText = "No quotes available.";
    return;
  }
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  quoteDisplay.innerText = `"${quote.text}" — ${quote.category}`;
  sessionStorage.setItem('lastViewedQuote', JSON.stringify(quote));
}

// Add a new quote
function addQuote() {
  const text = document.getElementById('newQuoteText').value.trim();
  const category = document.getElementById('newQuoteCategory').value.trim();

  if (!text || !category) {
    alert('Please enter both quote and category!');
    return;
  }

  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  displayRandomQuote();
  postQuoteToServer(newQuote);
  showNotification('Quote added and synced!');
  
  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';
}

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// ==================== CATEGORY FILTER ====================
function populateCategories() {
  const select = document.getElementById('categoryFilter');
  const categories = [...new Set(quotes.map(q => q.category))];
  select.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

function filterQuotes() {
  const filter = document.getElementById('categoryFilter').value;
  localStorage.setItem('lastCategory', filter);
  if (filter === 'all') {
    displayRandomQuote();
  } else {
    const filtered = quotes.filter(q => q.category === filter);
    if (filtered.length > 0) {
      const randomIndex = Math.floor(Math.random() * filtered.length);
      const quote = filtered[randomIndex];
      quoteDisplay.innerText = `"${quote.text}" — ${quote.category}`;
    } else {
      quoteDisplay.innerText = "No quotes found in this category.";
    }
  }
}

// Restore last selected category
function restoreLastCategory() {
  const lastCategory = localStorage.getItem('lastCategory');
  if (lastCategory) {
    document.getElementById('categoryFilter').value = lastCategory;
    filterQuotes();
  } else {
    displayRandomQuote();
  }
}

// ==================== JSON IMPORT/EXPORT ====================

// Export quotes to JSON
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Import quotes from JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    const importedQuotes = JSON.parse(e.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    showNotification('Quotes imported successfully!');
  };
  fileReader.readAsText(event.target.files[0]);
}

// ==================== SERVER SYNC (MOCK API) ====================

// Fetch quotes from mock server (JSONPlaceholder)
async function fetchQuotesFromServer() {
  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
    const data = await res.json();
    // Convert mock posts to quote-like objects
    return data.map(d => ({ text: d.title, category: "Server" }));
  } catch (error) {
    console.error('Fetch failed:', error);
    return [];
  }
}

// Post new quote to mock server
async function postQuoteToServer(quote) {
  try {
    await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quote)
    });
  } catch (error) {
    console.error('Post failed:', error);
  }
}

// Sync local and server quotes
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  let updated = false;

  serverQuotes.forEach(sq => {
    if (!quotes.some(lq => lq.text === sq.text)) {
      quotes.push(sq);
      updated = true;
    }
  });

  if (updated) {
    saveQuotes();
    populateCategories();
    showNotification('Quotes synced from server!');
  }
}

// Periodic sync every 30 seconds
setInterval(syncQuotes, 30000);

// ==================== UTILITIES ====================
function showNotification(message) {
  notification.textContent = message;
  setTimeout(() => (notification.textContent = ''), 4000);
}

// ==================== INITIALIZATION ====================
document.getElementById('newQuote').addEventListener('click', displayRandomQuote);
populateCategories();
restoreLastCategory();
if (lastViewedQuote && !quoteDisplay.textContent) {
  const quote = JSON.parse(lastViewedQuote);
  quoteDisplay.innerText = `"${quote.text}" — ${quote.category}`;
} else {
  displayRandomQuote();
}
