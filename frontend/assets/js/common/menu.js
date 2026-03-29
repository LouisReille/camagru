async function initHeaderMenu(forceRefresh = false) {
    const user = await getUserInfo(forceRefresh);
    const icon = document.getElementById("userMenuIcon");
    const logoutBtn = document.getElementById("logoutBtn");
    if (user) {
        icon.textContent = getUserInitial(user.username);
        icon.classList.add("logged-in");
        if (logoutBtn) {
            logoutBtn.style.display = "block";
        }
        try {
            localStorage.setItem("camagru_user", JSON.stringify(user));
        } catch (e) {}
    } else {
        icon.textContent = "C";
        icon.classList.remove("logged-in");
        if (logoutBtn) {
            logoutBtn.style.display = "none";
        }
        try {
            localStorage.removeItem("camagru_user");
        } catch (e) {}
    }
    icon.onclick = () => togglePopup();
}

window.initHeaderMenu = initHeaderMenu;