async function handleLogout() {
    if (typeof removeAuthToken === "function") {
        removeAuthToken();
    }
    const logoutBtn = document.getElementById("logoutBtnPopup") || document.getElementById("logoutBtn") || document.querySelector(".logout");
    if (!logoutBtn) return;
    logoutBtn.disabled = true;
    const originalText = logoutBtn.innerHTML;
    logoutBtn.innerHTML = "<span>Logging out...</span>";
    await logout();
    try {
        localStorage.removeItem("camagru_user");
    } catch (e) {}
    if (typeof clearUserCache === "function") {
        clearUserCache();
    }
    if (typeof initHeaderMenu === "function") {
        await initHeaderMenu(true);
    }
    if (window.closePopup) {
        closePopup();
    }
    location.reload();
}

async function handleDeleteAccount(event) {
    const deleteBtn = event?.target?.closest("#deleteAccountBtn") || document.getElementById("deleteAccountBtn");
    if (!deleteBtn) {
        return;
    }
    const existingConfirm = deleteBtn.parentNode.querySelector(".inline-message.confirmation");
    if (existingConfirm) {
        existingConfirm.remove();
        return;
    }
    showConfirmation(deleteBtn, "Are you sure you want to delete your account? This action cannot be undone.", async () => {
        const secondConfirm = deleteBtn.parentNode.querySelector(".inline-message.confirmation");
        if (secondConfirm) secondConfirm.remove();
        showConfirmation(deleteBtn, "Final confirmation: Delete account permanently? All your posts, likes, and comments will be deleted as well.", async () => {
            deleteBtn.disabled = true;
            const originalText = deleteBtn.innerHTML;
            deleteBtn.innerHTML = "<span>Deleting...</span>";
            try {
                const result = await deleteAccount();
                if (result && result.success) {
                    showInlineMessage(deleteBtn, "Account deleted successfully", "success", 2e3);
                    setTimeout(() => {
                        if (window.closePopup) {
                            closePopup();
                        }
                        window.location.href = "/pages/index.html";
                    }, 2e3);
                } else {
                    deleteBtn.disabled = false;
                    deleteBtn.innerHTML = originalText;
                    showInlineMessage(deleteBtn, result?.error || result?.message || "Error deleting account", "error");
                }
            } catch (error) {
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = originalText;
                showInlineMessage(deleteBtn, "Error deleting account: " + error.message, "error");
            }
        });
    });
}

window.handleLogout = handleLogout;

window.handleDeleteAccount = handleDeleteAccount;