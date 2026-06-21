const API_URL = "http://127.0.0.1:5000/api/auth";

/* AUTH MODAL */
function openModal(tab) {
  document.getElementById("authModal").classList.add("open");
  switchTab(tab || "signup");
}

function closeModal() {
  document.getElementById("authModal").classList.remove("open");
}

function switchTab(t) {
  document.getElementById("tabLogin").classList.toggle("active", t === "login");
  document.getElementById("tabSignup").classList.toggle("active", t === "signup");

  document.getElementById("formLogin").style.display = t === "login" ? "" : "none";
  document.getElementById("formSignup").style.display = t === "signup" ? "" : "none";
  document.getElementById("authSuccess").style.display = "none";
}

async function handleAuth(type) {
  let url = "";
  let body = {};

  if (type === "signup") {
    const inputs = document.querySelectorAll("#formSignup input");

    body = {
      name: inputs[0].value,
      email: inputs[1].value,
      password: inputs[2].value
    };

    url = `${API_URL}/register`;
  }

  if (type === "login") {
    const inputs = document.querySelectorAll("#formLogin input");

    body = {
      email: inputs[0].value,
      password: inputs[1].value
    };

    url = `${API_URL}/login`;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Something went wrong");
      return;
    }

    if (data.token) {
      localStorage.setItem("signalistToken", data.token);
    }

    document.getElementById("formLogin").style.display = "none";
    document.getElementById("formSignup").style.display = "none";
    document.getElementById("authSuccess").style.display = "block";

    if (type === "login") {
    window.location.href = "dashboard.html";
}   else {
    document.getElementById("successTitle").textContent = "Welcome to Signalist!";
    document.getElementById("successMsg").textContent = "Account created successfully. You can now log in.";
}

  } catch (error) {
    alert("Backend not connected. Make sure node server.js is running.");
    console.error(error);
  }
}

/* CLOSE MODAL */
document.getElementById("authModal").addEventListener("click", function(e) {
  if (e.target === this) closeModal();
});

/* DASHBOARD PREVIEW TABS */
document.querySelectorAll(".ptab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".ptab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

/* LIVE STOCK DATA */
const SYMBOLS = [
  { sym: "AAPL", name: "Apple Inc." },
  { sym: "NVDA", name: "NVIDIA Corp." },
  { sym: "MSFT", name: "Microsoft Corp." },
  { sym: "TSLA", name: "Tesla Inc." },
  { sym: "GOOGL", name: "Alphabet Inc." },
  { sym: "META", name: "Meta Platforms" },
];

const SIGNALS = ["Strong buy", "Buy", "Hold", "Watch", "Sell"];
const SIGNAL_COLORS = ["#1D9E75", "#5DCAA5", "#888780", "#BA7517", "#D85A30"];

function signalFor(chg) {
  if (chg > 2) return 0;
  if (chg > 0.5) return 1;
  if (chg > -0.5) return 2;
  if (chg > -2) return 3;
  return 4;
}

function renderStocks(data) {
  const grid = document.getElementById("stocksGrid");
  grid.innerHTML = "";

  data.forEach(d => {
    const up = d.chg >= 0;
    const si = signalFor(d.chg);
    const fill = Math.min(100, Math.abs(d.chg) * 15 + 20);
    const icoClass = si <= 1 ? "trending-up" : si >= 3 ? "trending-down" : "minus";

    grid.innerHTML += `
      <div class="stock-card">
        <div class="stock-sym">${d.sym}</div>
        <div class="stock-name">${d.name}</div>
        <div class="stock-price">$${d.price.toFixed(2)}</div>
        <div class="stock-change ${up ? "up" : "dn"}">${up ? "▲" : "▼"} ${Math.abs(d.chg).toFixed(2)}%</div>
        <div class="stock-bar">
          <div class="stock-fill" style="width:${fill}%;background:${SIGNAL_COLORS[si]}"></div>
        </div>
        <div class="stock-signal" style="color:${SIGNAL_COLORS[si]}">
          <i class="ti ti-${icoClass}"></i> ${SIGNALS[si]}
        </div>
      </div>`;
  });
}

async function loadStocks() {
  try {
    const syms = SYMBOLS.map(s => s.sym).join(",");
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${syms}&fields=regularMarketPrice,regularMarketChangePercent`;
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

    const res = await fetch(proxy);
    const json = await res.json();
    const quotes = JSON.parse(json.contents).quoteResponse.result;

    const data = quotes.map((q, i) => ({
      sym: SYMBOLS[i].sym,
      name: SYMBOLS[i].name,
      price: q.regularMarketPrice,
      chg: q.regularMarketChangePercent,
    }));

    renderStocks(data);

  } catch (e) {
    const bases = {
      AAPL: 189.45,
      NVDA: 874.20,
      MSFT: 415.30,
      TSLA: 242.10,
      GOOGL: 174.60,
      META: 512.90
    };

    const data = SYMBOLS.map(s => {
      const chg = Math.random() * 8 - 3;
      return {
        sym: s.sym,
        name: s.name,
        price: bases[s.sym] * (1 + chg / 100),
        chg
      };
    });

    renderStocks(data);
  }
}

loadStocks();
setInterval(loadStocks, 60000);