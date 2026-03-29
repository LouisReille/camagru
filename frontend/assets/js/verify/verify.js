window.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const statusEl = document.getElementById("verify-status");
    const messageEl = document.getElementById("verify-message");
    const loginLinkEl = document.getElementById("login-link");
    if (!token) {
        statusEl.textContent = "❌ Invalid verification link";
        return;
    }
    const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
    fetchFn(`${API_CONFIG.USERS_API}verify.php?token=${token}`).then(res => res.json()).then(data => {
        if (data.success) {
            statusEl.textContent = "✅ Account Verified!";
            messageEl.textContent = "Your account has been successfully verified.";
            loginLinkEl.style.display = "block";
        } else {
            statusEl.textContent = "❌ Verification Failed";
            messageEl.textContent = data.message || "Something went wrong.";
        }
    }).catch(() => {
        statusEl.textContent = "❌ Verification Failed";
        messageEl.textContent = "Could not connect to the server.";
    });
});