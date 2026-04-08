const grid = document.getElementById("hackathon-grid");
const searchInput = document.getElementById("search");
const noResults = document.getElementById("no-results");
const stats = document.getElementById("stats");

let allHackathons = [];
let currentFilter = "All";

// ✅ Fix URL
function fixUrl(url) {
  if (!url) return "#";
  if (url.startsWith("http")) return url;
  return "https://unstop.com" + url;
}

// ✅ Fetch data
async function fetchHackathons() {
  console.log("Fetching hackathons from API...");
  try {
    const res = await fetch("/api/hackathons");
    console.log("Fetch response status:", res.status);
    const data = await res.json();

    console.log("DATA:", data); // 🔥 DEBUG

    allHackathons = Array.isArray(data)
      ? data
      : Array.isArray(data?.hackathons)
      ? data.hackathons
      : [];

    renderHackathons();
    updateStats();

    document.getElementById("last-updated").innerText =
      "Last updated: " + new Date().toLocaleTimeString();
  } catch (err) {
    console.error("Error fetching hackathons:", err);
  }
}

// ✅ Render cards
function renderHackathons() {
  grid.innerHTML = "";

  const searchText = (searchInput.value || "").toLowerCase();

  let filtered = allHackathons.filter((h) => {
    const title = (h.title || "").toLowerCase();

    const matchesSearch = title.includes(searchText);

    const matchesFilter =
      currentFilter === "All" || h.source === currentFilter;

    return matchesSearch && matchesFilter;
  });

  console.log("Filtered:", filtered); // 🔥 DEBUG

  if (filtered.length === 0) {
    noResults.style.display = "block";
    return;
  } else {
    noResults.style.display = "none";
  }

  filtered.forEach((h) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${h.thumbnail || "https://via.placeholder.com/300"}" class="thumb"/>

      <h3>
        <a href="${fixUrl(h.url)}" target="_blank" rel="noopener noreferrer">
          ${h.title || "Untitled Hackathon"}
        </a>
      </h3>

      <p><strong>📅 Deadline:</strong> ${h.deadline || "N/A"}</p>
      <p><strong>🏆 Prize:</strong> ${h.prize || "N/A"}</p>
      <p><strong>👥 Participants:</strong> ${h.participants || 0}</p>

      <span class="badge ${(h.source || "").toLowerCase()}">
        ${h.source || "Unknown"}
      </span>
    `;

    grid.appendChild(card);
  });
}

// ✅ Stats
function updateStats() {
  const total = allHackathons.length;

  const devpost = allHackathons.filter((h) => h.source === "Devpost").length;
  const unstop = allHackathons.filter((h) => h.source === "Unstop").length;
  const dorahacks = allHackathons.filter((h) => h.source === "DoraHacks").length;

  stats.innerHTML = `
    <p>🔥 Total: ${total}</p>
    <p>Devpost: ${devpost}</p>
    <p>Unstop: ${unstop}</p>
    <p>DoraHacks: ${dorahacks}</p>
  `;
}

// ✅ Search
function filterCards() {
  renderHackathons();
}

// ✅ Filters
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));

    btn.classList.add("active");
    currentFilter = btn.dataset.source;

    renderHackathons();
  });
});

// ✅ Refresh
async function forceRefresh() {
  console.log("Force refreshing data...");
  document.getElementById("last-updated").innerText = "Refreshing...";
  try {
    const res = await fetch("/api/refresh");
    console.log("Refresh response status:", res.status);
    await fetchHackathons();
  } catch (err) {
    console.error("Error refreshing:", err);
  }
}

// ✅ Initial load
fetchHackathons();