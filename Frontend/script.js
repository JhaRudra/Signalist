const API_URL = "https://signalist-backend-xix0.onrender.com/api/auth";

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

      if (data.name) {
        localStorage.setItem("signalistUser", data.name);
      }
    }

    document.getElementById("formLogin").style.display = "none";
    document.getElementById("formSignup").style.display = "none";
    document.getElementById("authSuccess").style.display = "block";

    if (type === "login") {
      window.location.href = "dashboard.html";
    } else {
      document.getElementById("successTitle").textContent = "Welcome to Signalist!";
      document.getElementById("successMsg").textContent = "Account created successfully. You can now log in.";
    }

  } catch (error) {
    alert("Backend not connected. Please try again after a few seconds.");
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