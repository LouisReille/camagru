document.getElementById("forgotForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const messageEl = document.getElementById("message");
    messageEl.textContent = "Sending...";
    try {
        const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
        const res = await fetchFn(`${API_CONFIG.USERS_API}forgot_password.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email
            })
        });
        const data = await res.json();
        messageEl.textContent = data.message || "If this email exists, a reset link was sent.";
    } catch (err) {
        messageEl.textContent = "Network error.";
    }
});