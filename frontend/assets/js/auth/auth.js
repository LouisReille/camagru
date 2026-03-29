const AUTH_API_BASE = API_CONFIG.USERS_API;

async function apiFetch(endpoint, options = {}, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
            const res = await fetchFn(AUTH_API_BASE + endpoint, {
                credentials: "include",
                ...options
            });
            const text = await res.text();
            try {
                const data = JSON.parse(text);
                return data;
            } catch (parseError) {
                return {
                    success: false,
                    error: "Invalid server response",
                    details: text.substring(0, 200)
                };
            }
        } catch (err) {
            const isNetworkError = err.message && (err.message.includes("ERR_NETWORK_CHANGED") || err.message.includes("Failed to fetch") || err.message.includes("NetworkError") || err.name === "TypeError");
            if (attempt === retries || !isNetworkError) {
                return {
                    success: false,
                    error: err.message || "Network error",
                    logged_in: false
                };
            }
            const delay = Math.min(1e3 * Math.pow(2, attempt), 3e3);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function register(email, username, password) {
    return await apiFetch("register.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            username: username,
            password: password
        })
    });
}

async function login(identifier, password) {
    return await apiFetch("login.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: identifier,
            password: password
        })
    });
}

async function logout() {
    const result = await apiFetch("logout.php", {
        method: "POST"
    });
    return result;
}

async function deleteAccount() {
    try {
        const data = await apiFetch("delete_account.php", {
            method: "POST"
        });
        return data;
    } catch (error) {
        return {
            success: false,
            error: error.message || "Failed to delete account"
        };
    }
}

async function isLoggedIn() {
    try {
        const data = await apiFetch("check_session.php");
        if (data && typeof data.logged_in === "boolean") {
            return data.logged_in;
        }
        return false;
    } catch (err) {
        return false;
    }
}

async function forgotPassword(email) {
    return await apiFetch("forgot_password.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email
        })
    });
}

async function resetPassword(token, password) {
    return await apiFetch("reset_password.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: token,
            password: password
        })
    });
}

window.register = register;

window.login = login;

window.logout = logout;

window.isLoggedIn = isLoggedIn;

window.deleteAccount = deleteAccount;

window.forgotPassword = forgotPassword;

window.resetPassword = resetPassword;

document.getElementById("registerForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const email = document.getElementById("regEmail").value;
    const username = document.getElementById("regUsername").value;
    const password = document.getElementById("regPassword").value;
    const result = await register(email, username, password);
    if (result.success) {
        alert(result.message);
        window.location.href = "/auth/login.html";
    } else {
        alert(result.error);
    }
});

const loginForm = document.getElementById("loginForm");

if (loginForm && !loginForm.dataset.handled) {
    loginForm.addEventListener("submit", async e => {
        e.preventDefault();
        const username = document.getElementById("username")?.value || document.getElementById("email")?.value;
        const password = document.getElementById("password").value;
        const result = await login(username, password);
        if (result.success) {
            window.location.href = "/pages/index.html";
        } else {
            alert(result.error || "Username or password incorrect");
        }
    });
    loginForm.dataset.handled = "true";
}

document.getElementById("forgotForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const messageEl = document.getElementById("message");
    messageEl.textContent = "Sending...";
    const result = await forgotPassword(email);
    if (result.message) {
        messageEl.textContent = result.message;
    } else {
        messageEl.textContent = result.error || "Something went wrong.";
    }
});

(async () => {
    const resetForm = document.getElementById("resetForm");
    if (resetForm) {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        if (!token) {
            document.body.innerHTML = await loadTemplate("errors/invalid-reset-link");
            return;
        }
        resetForm.addEventListener("submit", async e => {
            e.preventDefault();
            const password = document.getElementById("password").value;
            const messageEl = document.getElementById("message");
            messageEl.textContent = "Resetting...";
            const result = await resetPassword(token, password);
            if (result.message) {
                messageEl.textContent = result.message;
                setTimeout(() => {
                    window.location.href = "/auth/login.html";
                }, 2e3);
            } else {
                messageEl.textContent = result.error || "Invalid or expired link.";
            }
        });
    }
})();