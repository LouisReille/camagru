let sessionRefreshInterval = null;

let lastActivity = Date.now();

async function refreshSession() {
    try {
        const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
        const response = await fetchFn(`${API_CONFIG.USERS_API}check_session.php`, {
            credentials: "include",
            method: "GET",
            cache: "no-cache"
        });
        const data = await response.json();
        if (!data.logged_in) {
            stopSessionRefresh();
            try {
                localStorage.removeItem("camagru_user");
            } catch (e) {}
            if (!window.location.pathname.includes("/auth/")) {
                window.location.href = "/pages/index.html?login=true";
            }
        }
    } catch (err) {}
}

function startSessionRefresh() {
    stopSessionRefresh();
    refreshSession();
    sessionRefreshInterval = setInterval(refreshSession, 6e5);
}

function stopSessionRefresh() {
    if (sessionRefreshInterval) {
        clearInterval(sessionRefreshInterval);
        sessionRefreshInterval = null;
    }
}

function trackActivity() {
    const now = Date.now();
    if (now - lastActivity > 3e5) {
        lastActivity = now;
        refreshSession();
    }
}

const activityEvents = [ "mousedown", "mousemove", "keypress", "scroll", "touchstart", "click" ];

activityEvents.forEach(event => {
    document.addEventListener(event, trackActivity, {
        passive: true
    });
});

document.addEventListener("DOMContentLoaded", () => {
    try {
        const cachedUser = localStorage.getItem("camagru_user");
        if (cachedUser) {
            startSessionRefresh();
        }
    } catch (e) {}
});

window.startSessionRefresh = startSessionRefresh;

window.stopSessionRefresh = stopSessionRefresh;

window.refreshSession = refreshSession;