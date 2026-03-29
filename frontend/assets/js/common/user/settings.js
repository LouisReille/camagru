let originalNotificationPreferences = {
    likes: null,
    comments: null
};

let notificationPreferencesChanged = false;

function convertNotificationValue(value) {
    if (value === undefined || value === null) return true;
    return !(value === false || value === 0 || value === "0" || value === "false" || String(value).toLowerCase() === "false");
}

async function loadAccountSettings() {
    const user = await getUserInfo(true);
    if (!user) return;
    const popup = document.getElementById("rightPopup");
    const currentPath = window.location.pathname;
    const isEditPage = currentPath.includes("edit.html");
    const emailNotificationsLikes = convertNotificationValue(user.email_notifications_likes);
    const emailNotificationsComments = convertNotificationValue(user.email_notifications_comments);
    originalNotificationPreferences.likes = emailNotificationsLikes;
    originalNotificationPreferences.comments = emailNotificationsComments;
    notificationPreferencesChanged = false;
    let joinDateText = "";
    if (user.created_at) {
        try {
            const date = new Date(user.created_at);
            const month = date.toLocaleString("en-US", {
                month: "long"
            });
            const year = date.getFullYear();
            joinDateText = `Joined in ${month} ${year}`;
        } catch (e) {}
    }
    popup.innerHTML = await renderTemplate("forms/account-settings", {
        showCreateImageCard: !isEditPage,
        emailNotificationsLikes: emailNotificationsLikes,
        emailNotificationsComments: emailNotificationsComments,
        username: user.username,
        email: user.email,
        joinDate: joinDateText
    });
    setTimeout(() => {
        const deleteBtn = document.getElementById("deleteAccountBtn");
        if (deleteBtn && window.handleDeleteAccount) {
            deleteBtn.addEventListener("click", handleDeleteAccount);
        }
        const logoutBtn = document.getElementById("logoutBtnPopup");
        if (logoutBtn && window.handleLogout) {
            logoutBtn.removeAttribute("onclick");
            logoutBtn.addEventListener("click", handleLogout);
        }
        const likesCheckbox = document.getElementById("emailNotificationsLikes");
        const commentsCheckbox = document.getElementById("emailNotificationsComments");
        const saveBtn = document.getElementById("savePreferencesBtn");
        if (likesCheckbox) {
            likesCheckbox.addEventListener("change", checkNotificationChanges);
        }
        if (commentsCheckbox) {
            commentsCheckbox.addEventListener("change", checkNotificationChanges);
        }
    }, 100);
}

function showAccountPreferences() {
    const prefsSection = document.getElementById("accountPreferences");
    const toggle = document.getElementById("preferencesToggle");
    if (prefsSection && toggle) {
        const isVisible = prefsSection.style.display !== "none";
        prefsSection.style.display = isVisible ? "none" : "block";
        toggle.textContent = isVisible ? "▼" : "▲";
    }
}

function checkNotificationChanges() {
    const likesCheckbox = document.getElementById("emailNotificationsLikes");
    const commentsCheckbox = document.getElementById("emailNotificationsComments");
    const saveBtn = document.getElementById("savePreferencesBtn");
    if (!likesCheckbox || !commentsCheckbox || !saveBtn) {
        return;
    }
    const currentLikes = likesCheckbox.checked;
    const currentComments = commentsCheckbox.checked;
    const originalLikes = originalNotificationPreferences.likes;
    const originalComments = originalNotificationPreferences.comments;
    const hasChanged = currentLikes !== originalLikes || currentComments !== originalComments;
    notificationPreferencesChanged = hasChanged;
    if (hasChanged) {
        saveBtn.style.display = "block";
    } else {
        saveBtn.style.display = "none";
    }
}

async function saveNotificationPreferences() {
    const likesCheckbox = document.getElementById("emailNotificationsLikes");
    const commentsCheckbox = document.getElementById("emailNotificationsComments");
    const saveBtn = document.getElementById("savePreferencesBtn");
    const saveBtnText = document.getElementById("savePreferencesBtnText");
    if (!likesCheckbox || !commentsCheckbox || !saveBtn) {
        return;
    }
    if (originalNotificationPreferences.likes === null) {
        originalNotificationPreferences.likes = likesCheckbox.checked;
        originalNotificationPreferences.comments = commentsCheckbox.checked;
    }
    const likesEnabled = likesCheckbox.checked;
    const commentsEnabled = commentsCheckbox.checked;
    saveBtn.disabled = true;
    saveBtnText.textContent = "Saving...";
    saveBtn.style.opacity = "0.7";
    try {
        const data = await updateNotifications(likesEnabled, commentsEnabled);
        if (data.success) {
            if (window.updateUserCache) {
                updateUserCache({
                    email_notifications_likes: likesEnabled,
                    email_notifications_comments: commentsEnabled
                });
            }
            originalNotificationPreferences.likes = likesEnabled;
            originalNotificationPreferences.comments = commentsEnabled;
            notificationPreferencesChanged = false;
            const user = await getUserInfo(true);
            if (user && window.updateUserCache) {
                updateUserCache(user);
            }
            saveBtnText.textContent = "✓ Saved!";
            saveBtn.style.background = "#d4edda";
            saveBtn.style.color = "#155724";
            setTimeout(() => {
                saveBtnText.textContent = "Save Preferences";
                saveBtn.style.background = "";
                saveBtn.style.color = "";
                saveBtn.style.display = "none";
            }, 2e3);
        } else {
            saveBtnText.textContent = "✗ Failed";
            saveBtn.style.background = "#f8d7da";
            saveBtn.style.color = "#721c24";
            setTimeout(() => {
                saveBtnText.textContent = "Save Preferences";
                saveBtn.style.background = "";
                saveBtn.style.color = "";
            }, 2e3);
            if (originalNotificationPreferences.likes !== null) {
                likesCheckbox.checked = originalNotificationPreferences.likes;
                commentsCheckbox.checked = originalNotificationPreferences.comments;
            } else {
                const user = await getUserInfo(true);
                if (user) {
                    likesCheckbox.checked = convertNotificationValue(user.email_notifications_likes);
                    commentsCheckbox.checked = convertNotificationValue(user.email_notifications_comments);
                }
            }
        }
    } catch (err) {
        saveBtnText.textContent = "✗ Error";
        saveBtn.style.background = "#f8d7da";
        saveBtn.style.color = "#721c24";
        setTimeout(() => {
            saveBtnText.textContent = "Save Preferences";
            saveBtn.style.background = "";
            saveBtn.style.color = "";
        }, 2e3);
        const user = await getUserInfo();
        if (user) {
            likesCheckbox.checked = convertNotificationValue(user.email_notifications_likes);
            commentsCheckbox.checked = convertNotificationValue(user.email_notifications_comments);
        }
    } finally {
        saveBtn.disabled = false;
        saveBtn.style.opacity = "1";
    }
}

window.loadAccountSettings = loadAccountSettings;

window.showAccountPreferences = showAccountPreferences;

window.saveNotificationPreferences = saveNotificationPreferences;

window.checkNotificationChanges = checkNotificationChanges;