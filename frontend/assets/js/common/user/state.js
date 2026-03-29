let currentUser = null;

async function getUserInfo(forceRefresh = false) {
    if (!forceRefresh && currentUser && currentUser.email_notifications_likes !== undefined) {
        return currentUser;
    }
    try {
        const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
        const res = await fetchFn(`${API_CONFIG.USERS_API}get_user.php`, {
            credentials: "include",
            cache: "no-cache"
        });
        const data = await res.json();
        if (data.logged_in) {
            const likesValue = data.email_notifications_likes;
            const commentsValue = data.email_notifications_comments;
            currentUser = {
                username: data.username,
                email: data.email,
                created_at: data.created_at || null,
                email_notifications_likes: likesValue !== undefined && likesValue !== null ? !(likesValue === false || likesValue === 0 || likesValue === "0" || likesValue === "false") : true,
                email_notifications_comments: commentsValue !== undefined && commentsValue !== null ? !(commentsValue === false || commentsValue === 0 || commentsValue === "0" || commentsValue === "false") : true
            };
            try {
                localStorage.setItem("camagru_user", JSON.stringify(currentUser));
            } catch (e) {}
            return currentUser;
        }
        return null;
    } catch (err) {
        return null;
    }
}

function getUserInitial(username) {
    if (!username) return "C";
    return username.charAt(0).toUpperCase();
}

function updateUserCache(updates) {
    if (currentUser) {
        currentUser = {
            ...currentUser,
            ...updates
        };
    }
}

function clearUserCache() {
    currentUser = null;
}

window.getUserInfo = getUserInfo;

window.getUserInitial = getUserInitial;

window.updateUserCache = updateUserCache;

window.clearUserCache = clearUserCache;