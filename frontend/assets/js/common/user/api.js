const USER_API_BASE = API_CONFIG.USERS_API;

async function checkUsername(username) {
    try {
        const res = await fetch(`${USER_API_BASE}check_username.php?username=${encodeURIComponent(username)}`);
        return await res.json();
    } catch (err) {
        return {
            available: false,
            error: err.message
        };
    }
}

async function checkEmail(email) {
    try {
        const res = await fetch(`${USER_API_BASE}check_email.php?email=${encodeURIComponent(email)}`);
        return await res.json();
    } catch (err) {
        return {
            available: false,
            error: err.message
        };
    }
}

async function updateProfileAPI(data) {
    try {
        const res = await fetch(`${USER_API_BASE}update_profile.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (err) {
        return {
            success: false,
            error: err.message
        };
    }
}

async function updateNotifications(likes, comments) {
    try {
        const res = await fetch(`${USER_API_BASE}update_notifications.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                likes: likes,
                comments: comments
            })
        });
        return await res.json();
    } catch (err) {
        return {
            success: false,
            error: err.message
        };
    }
}

window.checkUsername = checkUsername;

window.checkEmail = checkEmail;

window.updateProfileAPI = updateProfileAPI;

window.updateNotifications = updateNotifications;