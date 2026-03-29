function togglePopup() {
    const popup = document.getElementById("rightPopup");
    const backdrop = document.getElementById("popupBackdrop");
    if (popup.classList.contains("open")) {
        closePopup();
    } else {
        openPopup();
    }
}

async function openPopup() {
    const popup = document.getElementById("rightPopup");
    const backdrop = document.getElementById("popupBackdrop");
    const user = await getUserInfo();
    if (user) {
        if (window.loadAccountSettings) {
            loadAccountSettings();
        }
    } else {
        if (window.showAuthForm) {
            showAuthForm("login");
        }
    }
    popup.classList.add("open");
    backdrop.classList.add("active");
}

function closePopup() {
    const popup = document.getElementById("rightPopup");
    const backdrop = document.getElementById("popupBackdrop");
    popup.classList.remove("open");
    backdrop.classList.remove("active");
}

function toggleAuthModal(mode = "login") {
    const popup = document.getElementById("rightPopup");
    const backdrop = document.getElementById("popupBackdrop");
    if (!popup.classList.contains("open")) {
        openPopup();
    }
    if (mode && window.showAuthForm) {
        showAuthForm(mode);
    }
}

window.togglePopup = togglePopup;

window.openPopup = openPopup;

window.closePopup = closePopup;

window.toggleAuthModal = toggleAuthModal;