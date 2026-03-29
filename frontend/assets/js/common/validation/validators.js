function isValidUsernameFormat(username) {
    return /^[a-zA-Z0-9_\-\.]{3,20}$/.test(username);
}

function isValidEmailFormat(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePasswordStrength(password) {
    const errors = [];
    if (password.length < 8) {
        errors.push("At least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("One uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
        errors.push("One lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
        errors.push("One number");
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push("One special character");
    }
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

async function showUsernameMessage(messageEl, message, suggestions = [], fieldId = "regUsername") {
    if (typeof message === "string" && message.includes("<")) {
        messageEl.innerHTML = message;
        return;
    }
    if (message === "available") {
        messageEl.innerHTML = await loadTemplate("validation/username-available");
    } else if (message === "taken") {
        let html = await loadTemplate("validation/username-taken");
        if (suggestions && suggestions.length > 0) {
            for (const suggestion of suggestions) {
                const onclick = `document.getElementById('${fieldId}').value='${suggestion}'; document.getElementById('${fieldId}').dispatchEvent(new Event('input'));`;
                const buttonHtml = await renderTemplate("messages/suggestion-button", {
                    suggestion: suggestion,
                    onclick: onclick
                });
                html += buttonHtml;
            }
        }
        messageEl.innerHTML = html;
    } else if (message === "invalid") {
        messageEl.innerHTML = await loadTemplate("validation/username-error");
    }
}

async function showEmailMessage(messageEl, message, options = {}) {
    if (typeof message === "string" && message.includes("<")) {
        messageEl.innerHTML = message;
        return;
    }
    if (message === "available") {
        messageEl.innerHTML = await loadTemplate("validation/email-available");
    } else if (message === "invalid") {
        messageEl.innerHTML = await loadTemplate("validation/email-invalid");
    } else if (message === "taken") {
        messageEl.innerHTML = await renderTemplate("messages/email-taken", {
            message: options.message || "Email already registered",
            canReset: options.canReset || false
        });
    }
}

async function showPasswordMessage(messageEl, requirementsEl, password) {
    if (!password || password.length === 0) {
        messageEl.innerHTML = "";
        if (requirementsEl) {
            requirementsEl.innerHTML = "<div>Requirements: 8+ characters, uppercase, lowercase, number, special character</div>";
        }
        return;
    }
    const validation = validatePasswordStrength(password);
    if (validation.valid) {
        messageEl.innerHTML = await loadTemplate("validation/password-valid");
        if (requirementsEl) {
            requirementsEl.innerHTML = '<div style="color: #155724;">✓ All requirements met</div>';
        }
    } else {
        messageEl.innerHTML = await renderTemplate("validation/password-missing", {
            errors: validation.errors.join(", ")
        });
        if (requirementsEl) {
            requirementsEl.innerHTML = '<div style="color: #721c24;">Requirements: 8+ characters, uppercase, lowercase, number, special character</div>';
        }
    }
}

async function showPasswordMatchMessage(messageEl, match) {
    if (match) {
        messageEl.innerHTML = await loadTemplate("validation/password-match-success");
    } else {
        messageEl.innerHTML = await loadTemplate("validation/password-match-error");
    }
}

window.isValidUsernameFormat = isValidUsernameFormat;

window.isValidEmailFormat = isValidEmailFormat;

window.validatePasswordStrength = validatePasswordStrength;

window.showUsernameMessage = showUsernameMessage;

window.showEmailMessage = showEmailMessage;

window.showPasswordMessage = showPasswordMessage;

window.showPasswordMatchMessage = showPasswordMatchMessage;