let originalUsername = "";

let originalEmail = "";

let usernameCheckTimeout;

async function handleUsernameChange(original) {
    originalUsername = original;
    const input = document.getElementById("editUsername");
    const newValue = input.value.trim();
    const updateBtn = document.getElementById("updateUsernameBtn");
    const messageEl = document.getElementById("editUsernameMessage");
    if (newValue !== original && newValue.length > 0) {
        updateBtn.style.display = "block";
    } else {
        updateBtn.style.display = "none";
        messageEl.innerHTML = "";
        return;
    }
    clearTimeout(usernameCheckTimeout);
    if (!isValidUsernameFormat(newValue)) {
        messageEl.innerHTML = await loadTemplate("validation/username-error");
        return;
    }
    usernameCheckTimeout = setTimeout(async () => {
        const data = await checkUsername(newValue);
        if (data.available) {
            await showUsernameMessage(messageEl, "available");
        } else {
            await showUsernameMessage(messageEl, "taken", data.suggestions || [], "editUsername");
        }
    }, 500);
}

function handleEmailChange(original) {
    originalEmail = original;
    const input = document.getElementById("editEmail");
    const newValue = input.value.trim();
    const updateBtn = document.getElementById("updateEmailBtn");
    const messageEl = document.getElementById("editEmailMessage");
    if (newValue !== original && newValue.length > 0) {
        updateBtn.style.display = "block";
        messageEl.innerHTML = "";
    } else {
        updateBtn.style.display = "none";
        messageEl.innerHTML = "";
    }
}

async function handlePasswordChange() {
    const input = document.getElementById("editPassword");
    const newValue = input.value;
    const updateBtn = document.getElementById("updatePasswordBtn");
    const messageEl = document.getElementById("editPasswordMessage");
    if (newValue.length > 0) {
        updateBtn.style.display = "block";
        await showPasswordMessage(messageEl, null, newValue);
    } else {
        updateBtn.style.display = "none";
        messageEl.innerHTML = "";
    }
}

async function updateUsername(original) {
    const username = document.getElementById("editUsername").value.trim();
    const updateBtn = document.getElementById("updateUsernameBtn");
    const messageEl = document.getElementById("editUsernameMessage");
    if (username === original) {
        updateBtn.style.display = "none";
        return;
    }
    disableOtherUpdateButtons("updateUsernameBtn");
    updateBtn.disabled = true;
    updateBtn.textContent = "Updating...";
    try {
        const data = await updateProfileAPI({
            username: username,
            email: null,
            password: null
        });
        if (data.success) {
            showInlineMessage(updateBtn, "Username updated successfully", "success", 2e3);
            originalUsername = username;
            document.getElementById("userMenuIcon").textContent = getUserInitial(username);
            if (window.updateUserCache) {
                updateUserCache({
                    username: username
                });
            }
            setTimeout(() => {
                updateBtn.style.display = "none";
                messageEl.innerHTML = "";
                document.getElementById("editUsername").value = username;
                enableAllUpdateButtons();
            }, 2e3);
        } else {
            if (data.errors && data.errors.username) {
                let html = await renderTemplate("validation/username-error");
                html = html.replace("Username must be", `✗ ${data.errors.username}`);
                if (data.errors.username_suggestions && data.errors.username_suggestions.length > 0) {
                    html += '<span style="margin-left: 5px;">Try:</span>';
                    for (const suggestion of data.errors.username_suggestions) {
                        const onclick = `document.getElementById('editUsername').value='${suggestion}'; handleUsernameChange('${original}');`;
                        html += await renderTemplate("messages/suggestion-button", {
                            suggestion: suggestion,
                            onclick: onclick
                        });
                    }
                }
                messageEl.innerHTML = html;
            } else {
                showInlineMessage(updateBtn, data.error || "Failed to update username", "error");
            }
            enableAllUpdateButtons();
        }
    } catch (err) {
        showInlineMessage(updateBtn, "Error updating username: " + err.message, "error");
        enableAllUpdateButtons();
    }
    updateBtn.disabled = false;
    updateBtn.textContent = "Update Username";
}

async function updateEmail(original) {
    const email = document.getElementById("editEmail").value.trim();
    const updateBtn = document.getElementById("updateEmailBtn");
    const messageEl = document.getElementById("editEmailMessage");
    if (email === original) {
        updateBtn.style.display = "none";
        return;
    }
    disableOtherUpdateButtons("updateEmailBtn");
    updateBtn.disabled = true;
    updateBtn.textContent = "Updating...";
    try {
        const data = await updateProfileAPI({
            username: null,
            email: email,
            password: null
        });
        if (data.success) {
            if (data.email_change_pending) {
                messageEl.innerHTML = '<span class="info-text" style="color: #0c5460;">✓ Verification email sent. Email will be updated as soon as it is verified on the email address you just provided.</span>';
                showInlineMessage(updateBtn, "Verification email sent. Check your new email.", "info", 5e3);
                updateBtn.style.display = "none";
                originalEmail = email;
                enableAllUpdateButtons();
            } else {
                showInlineMessage(updateBtn, "Email updated successfully", "success", 2e3);
                originalEmail = email;
                if (window.updateUserCache) {
                    updateUserCache({
                        email: email
                    });
                }
                setTimeout(() => {
                    updateBtn.style.display = "none";
                    document.getElementById("editEmail").value = email;
                    enableAllUpdateButtons();
                }, 2e3);
            }
        } else {
            if (data.errors && data.errors.email) {
                messageEl.innerHTML = await renderTemplate("validation/email-invalid");
                messageEl.innerHTML = messageEl.innerHTML.replace("Invalid email format", `✗ ${data.errors.email}`);
            } else {
                showInlineMessage(updateBtn, data.error || "Failed to update email", "error");
            }
            enableAllUpdateButtons();
        }
    } catch (err) {
        showInlineMessage(updateBtn, "Error updating email: " + err.message, "error");
        enableAllUpdateButtons();
    }
    updateBtn.disabled = false;
    updateBtn.textContent = "Update Email";
}

async function updatePassword() {
    const password = document.getElementById("editPassword").value;
    const updateBtn = document.getElementById("updatePasswordBtn");
    const messageEl = document.getElementById("editPasswordMessage");
    if (!password || password.length === 0) {
        updateBtn.style.display = "none";
        return;
    }
    disableOtherUpdateButtons("updatePasswordBtn");
    updateBtn.disabled = true;
    updateBtn.textContent = "Updating...";
    try {
        const data = await updateProfileAPI({
            username: null,
            email: null,
            password: password
        });
        if (data.success) {
            showInlineMessage(updateBtn, "Password updated successfully", "success", 2e3);
            setTimeout(() => {
                updateBtn.style.display = "none";
                document.getElementById("editPassword").value = "";
                messageEl.innerHTML = "";
                enableAllUpdateButtons();
            }, 2e3);
        } else {
            if (data.errors && data.errors.password) {
                messageEl.innerHTML = await renderTemplate("validation/password-missing", {
                    errors: data.errors.password.replace("✗ ", "")
                });
            } else {
                showInlineMessage(updateBtn, data.error || "Failed to update password", "error");
            }
            enableAllUpdateButtons();
        }
    } catch (err) {
        showInlineMessage(updateBtn, "Error updating password: " + err.message, "error");
        enableAllUpdateButtons();
    }
    updateBtn.disabled = false;
    updateBtn.textContent = "Update Password";
}

async function updateProfile() {
    const username = document.getElementById("editUsername").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const password = document.getElementById("editPassword").value;
    const updateBtn = document.querySelector(".update");
    const usernameMsgEl = document.getElementById("editUsernameMessage");
    const emailMsgEl = document.getElementById("editEmailMessage");
    const passwordMsgEl = document.getElementById("editPasswordMessage");
    if (usernameMsgEl) usernameMsgEl.innerHTML = "";
    if (emailMsgEl) emailMsgEl.innerHTML = "";
    if (passwordMsgEl) passwordMsgEl.innerHTML = "";
    if (!username || !email) {
        showInlineMessage(updateBtn, "Username and email are required", "error");
        return;
    }
    try {
        const data = await updateProfileAPI({
            username: username || null,
            email: email || null,
            password: password || null
        });
        if (data.success) {
            let message = data.message || "Profile updated successfully";
            if (data.email_change_pending) {
                message += " Check your new email to verify the change.";
            }
            showInlineMessage(updateBtn, message, "success", 5e3);
            if (!data.email_change_pending) {
                if (window.updateUserCache) {
                    updateUserCache({
                        username: username,
                        email: email
                    });
                }
                document.getElementById("userMenuIcon").textContent = getUserInitial(username);
                document.getElementById("editPassword").value = "";
                setTimeout(() => {
                    if (window.loadAccountSettings) {
                        loadAccountSettings();
                    }
                }, 1e3);
            }
        } else {
            if (data.errors) {
                if (data.errors.username) {
                    let html = await renderTemplate("validation/username-error");
                    html = html.replace("Username must be", `✗ ${data.errors.username}`);
                    if (data.errors.username_suggestions && data.errors.username_suggestions.length > 0) {
                        html += '<span style="margin-left: 5px;">Try:</span>';
                        for (const suggestion of data.errors.username_suggestions) {
                            const onclick = `document.getElementById('editUsername').value='${suggestion}'; document.getElementById('editUsername').dispatchEvent(new Event('input'));`;
                            html += await renderTemplate("messages/suggestion-button", {
                                suggestion: suggestion,
                                onclick: onclick
                            });
                        }
                    }
                    if (usernameMsgEl) {
                        usernameMsgEl.innerHTML = html;
                    } else {
                        showInlineMessage(updateBtn, data.errors.username, "error");
                    }
                }
                if (data.errors.email) {
                    if (emailMsgEl) {
                        emailMsgEl.innerHTML = await renderTemplate("validation/email-invalid");
                        emailMsgEl.innerHTML = emailMsgEl.innerHTML.replace("Invalid email format", `✗ ${data.errors.email}`);
                    } else {
                        showInlineMessage(updateBtn, data.errors.email, "error");
                    }
                }
                if (data.errors.password) {
                    if (passwordMsgEl) {
                        passwordMsgEl.innerHTML = await renderTemplate("validation/password-missing", {
                            errors: data.errors.password.replace("✗ ", "")
                        });
                    } else {
                        showInlineMessage(updateBtn, data.errors.password, "error");
                    }
                }
            } else {
                showInlineMessage(updateBtn, data.error || "Failed to update profile", "error");
            }
        }
    } catch (err) {
        showInlineMessage(updateBtn, "Error updating profile: " + err.message, "error");
    }
}

window.handleUsernameChange = handleUsernameChange;

window.handleEmailChange = handleEmailChange;

window.handlePasswordChange = handlePasswordChange;

window.updateUsername = updateUsername;

window.updateEmail = updateEmail;

window.updatePassword = updatePassword;

window.updateProfile = updateProfile;