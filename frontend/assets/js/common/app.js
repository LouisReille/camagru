function logout() {
    fetch(`${API_CONFIG.USERS_API}logout.php`, {
        method: "POST"
    }).then(() => window.location.href = "/auth/login.html");
}