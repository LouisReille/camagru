function togglePasswordVisibility(...fieldIds) {
    const checkbox = document.getElementById("showPassword");
    if (!checkbox) return;
    const isChecked = checkbox.checked;
    fieldIds.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.type = isChecked ? "text" : "password";
        }
    });
}

function disableOtherUpdateButtons(currentBtnId) {
    const allButtons = [ "updateUsernameBtn", "updateEmailBtn", "updatePasswordBtn" ];
    allButtons.forEach(btnId => {
        if (btnId !== currentBtnId) {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = "0.5";
            }
        }
    });
}

function enableAllUpdateButtons() {
    const allButtons = [ "updateUsernameBtn", "updateEmailBtn", "updatePasswordBtn" ];
    allButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = "1";
        }
    });
}

window.togglePasswordVisibility = togglePasswordVisibility;

window.disableOtherUpdateButtons = disableOtherUpdateButtons;

window.enableAllUpdateButtons = enableAllUpdateButtons;