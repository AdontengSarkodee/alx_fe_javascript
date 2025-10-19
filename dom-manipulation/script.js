// ====== GLOBAL VARIABLES ======
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "Success is not final; failure is not fatal.", category: "Motivation" },
  { text: "Love conquers all.", category: "Love" },
  { text: "Knowledge is power.", category: "Wisdom" }
];

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const categoryFilter = document.getElementById("categoryFilter");

// ====== SAVE QUOTES TO LOCAL STORAGE ======
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ====== LOAD QUOTES FROM LOCAL STORAGE ======
function loadQuotes() {
  const storedQuotes = localStorage.getItem("quotes");
  if (storedQuotes) {
    quotes = JSON.parse(storedQuotes);
  }
}

// ====== DISPLAY RANDOM QUOTE ======
function displayRandomQuote() {
  if (quotes.length === 0) return;
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const { text, category } = quotes[randomIndex];
  quoteDisplay.innerHTML = `<p>"${text}"</p><small>– ${category}</small>`;
  // Save last viewed quote to session storage
  sessionStorage.setItem("lastQuote", JSON.stringify({ text, category }));
}

// ====== ADD QUOTE FUNCTION ======
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (text && category) {
    quotes.push({ text, category });
    saveQuotes();
    populateCategories(); // update dropdown
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";
    alert("Quote added successfully!");
  } else {
    alert("Please enter both quote text and category.");
  }
}

// ====== POPULATE CATEGORIES ======
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  // Restore last selected category
  const last = localStorage.getItem("selectedCategory") || "all";
  categoryFilter.value = last;
}

// ====== FILTER QUOTES ======
function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem("selectedCategory", selected);

  const filtered = selected === "all" ? quotes : quotes.filter(q => q.category === selected);

  if (filtered.length > 0) {
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    quoteDisplay.innerHTML = `<p>"${random.text}"</p><small>– ${random.category}</small>`;
  } else {
    quoteDisplay.innerHTML = `<p>No quotes available for "${selected}".</p>`;
  }
}

// ====== EXPORT TO JSON FILE ======
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();
}

// ====== IMPORT FROM JSON FILE ======
function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        quotes = imported;
        saveQuotes();
        populateCategories();
        filterQuotes();
        alert("Quotes imported successfully!");
      } else {
        alert("Invalid JSON format!");
      }
    } catch (error) {
      alert("Error importing file!");
    }
  };
  reader.readAsText(file);
}

// ====== EVENT LISTENERS ======
newQuoteBtn.addEventListener("click", displayRandomQuote);
addQuoteBtn.addEventListener("click", addQuote);
document.getElementById("exportBtn").addEventListener("click", exportToJsonFile);

// ====== INITIALIZATION ======
loadQuotes();
populateCategories();
filterQuotes();

// Restore last viewed quote from session storage
const lastQuote = sessionStorage.getItem("lastQuote");
if (lastQuote) {
  const { text, category } = JSON.parse(lastQuote);
  quoteDisplay.innerHTML = `<p>"${text}"</p><small>– ${category}</small>`;
} else {
  displayRandomQuote();
}
