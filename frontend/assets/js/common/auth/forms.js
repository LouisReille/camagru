let lastLoginIdentifier = "";

let lastLoginIsEmail = false;

async function showAuthForm(mode, ...args) {
    const popup = document.getElementById("rightPopup");
    if (mode === "login") {
        await showLoginForm(popup);
    } else if (mode === "register") {
        await showRegisterForm(popup);
    } else if (mode === "forgot") {
        const prefillEmail = args[0] || "";
        const wasEmail = args[1] || false;
        await showForgotPasswordForm(popup, prefillEmail, wasEmail);
    }
}

async function showLoginForm(popup) {
    popup.innerHTML = await loadTemplate("forms/login-form");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    if (usernameInput) {
        usernameInput.addEventListener("focus", () => {
            usernameInput.placeholder = "";
        });
        usernameInput.addEventListener("blur", () => {
            if (!usernameInput.value) {
                usernameInput.placeholder = "Enter username or email";
            }
        });
    }
    if (passwordInput) {
        passwordInput.addEventListener("focus", () => {
            passwordInput.placeholder = "";
        });
        passwordInput.addEventListener("blur", () => {
            if (!passwordInput.value) {
                passwordInput.placeholder = "Enter password";
            }
        });
    }
    const forgotLink = document.getElementById("forgotPasswordLink");
    if (forgotLink) {
        forgotLink.onclick = () => {
            const currentIdentifier = document.getElementById("username")?.value.trim() || lastLoginIdentifier;
            const currentIsEmail = currentIdentifier ? isValidEmailFormat(currentIdentifier) : lastLoginIsEmail;
            showAuthForm("forgot", currentIdentifier, currentIsEmail);
        };
    }
    document.getElementById("loginForm").addEventListener("submit", async e => {
        e.preventDefault();
        const identifier = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        lastLoginIdentifier = identifier;
        lastLoginIsEmail = isValidEmailFormat(identifier);
        const result = await login(identifier, password);
        if (result.success) {
            if (typeof clearUserCache === "function") {
                clearUserCache();
            }
            if (typeof initHeaderMenu === "function") {
                await initHeaderMenu(true);
            }
            showInlineMessage(submitBtn, "Login successful! Redirecting...", "success", 1e3);
            setTimeout(() => {
                closePopup();
                location.reload();
            }, 1e3);
        } else {
            let errorMsg = "Username/email or password incorrect";
            if (result.error_type === "not_verified") {
                errorMsg = "Registration not completed, check your email box";
            } else if (result.error_type === "not_found") {
                errorMsg = "User or email not found";
            } else if (result.error_type === "wrong_password" || result.identifier_exists && result.error === "Incorrect password") {
                errorMsg = "Username or password doesn't match";
            } else if (result.error) {
                errorMsg = result.error;
            }
            showInlineMessage(submitBtn, errorMsg, "error");
            if (forgotLink) {
                forgotLink.onclick = () => {
                    showAuthForm("forgot", lastLoginIdentifier, lastLoginIsEmail);
                };
            }
        }
    });
}

async function showRegisterForm(popup) {
    if (window.templateCache) {
        delete window.templateCache["forms/register-form"];
        delete window.templateCache["register-form"];
    }
    popup.innerHTML = await loadTemplate("forms/register-form");
    const usernameInput = document.getElementById("regUsername");
    const emailInput = document.getElementById("regEmail");
    const passwordInput = document.getElementById("regPassword");
    const passwordConfirmInput = document.getElementById("regPasswordConfirm");
    if (usernameInput) {
        usernameInput.addEventListener("focus", () => {
            usernameInput.placeholder = "";
        });
        usernameInput.addEventListener("blur", () => {
            if (!usernameInput.value) {
                usernameInput.placeholder = "Enter your username";
            }
        });
    }
    if (emailInput) {
        emailInput.addEventListener("focus", () => {
            emailInput.placeholder = "";
        });
        emailInput.addEventListener("blur", () => {
            if (!emailInput.value) {
                emailInput.placeholder = "Enter your email";
            }
        });
    }
    if (passwordInput) {
        passwordInput.addEventListener("focus", () => {
            passwordInput.placeholder = "";
        });
        passwordInput.addEventListener("blur", () => {
            if (!passwordInput.value) {
                passwordInput.placeholder = "Password";
            }
        });
    }
    if (passwordConfirmInput) {
        passwordConfirmInput.addEventListener("focus", () => {
            passwordConfirmInput.placeholder = "";
        });
        passwordConfirmInput.addEventListener("blur", () => {
            if (!passwordConfirmInput.value) {
                passwordConfirmInput.placeholder = "Confirm password";
            }
        });
    }
    window.registerFormSuccessTimeouts = {
        username: null,
        email: null,
        password: null,
        passwordConfirm: null
    };
    window.isRegisterSuccessMessage = function(messageEl) {
        if (!messageEl) return false;
        const html = messageEl.innerHTML;
        return html.includes("success-text") || html.includes("✓");
    };
    window.scheduleRegisterSuccessClear = function(fieldName, messageEl) {
        if (window.registerFormSuccessTimeouts[fieldName]) {
            clearTimeout(window.registerFormSuccessTimeouts[fieldName]);
        }
        window.registerFormSuccessTimeouts[fieldName] = setTimeout(() => {
            if (window.isRegisterSuccessMessage(messageEl)) {
                messageEl.innerHTML = "";
            }
            window.registerFormSuccessTimeouts[fieldName] = null;
        }, 1e3);
    };
    const closeBtn = popup.querySelector(".popup-close-btn");
    if (closeBtn) {
        closeBtn.onclick = closePopup;
    }
    setupRegisterFormValidation();
}

function setupRegisterFormValidation() {
    const submitBtn = document.getElementById("registerSubmitBtn");
    if (!submitBtn) return;
    const validationState = {
        username: false,
        email: false,
        password: false,
        passwordConfirm: false
    };
    async function validateRegistrationForm() {
        const username = document.getElementById("regUsername")?.value.trim() || "";
        const email = document.getElementById("regEmail")?.value.trim() || "";
        const password = document.getElementById("regPassword")?.value || "";
        const confirmPassword = document.getElementById("regPasswordConfirm")?.value || "";
        const usernameMessage = document.getElementById("usernameMessage")?.innerHTML || "";
        const usernameValid = validationState.username || username.length >= 3 && isValidUsernameFormat(username) && usernameMessage.includes("success-text") && usernameMessage.includes("✓");
        const emailMessage = document.getElementById("emailMessage")?.innerHTML || "";
        const emailValid = validationState.email || isValidEmailFormat(email) && emailMessage.includes("success-text") && emailMessage.includes("✓");
        const passwordValidation = validatePasswordStrength(password);
        const passwordValid = passwordValidation.valid;
        const confirmValid = confirmPassword.length > 0 && password === confirmPassword && password.length > 0;
        const allValid = usernameValid && emailValid && passwordValid && confirmValid;
        submitBtn.disabled = !allValid;
        submitBtn.style.opacity = allValid ? "1" : "0.6";
        submitBtn.style.cursor = allValid ? "pointer" : "not-allowed";
    }
    setTimeout(validateRegistrationForm, 100);
    let usernameCheckTimeout;
    document.getElementById("regUsername").addEventListener("input", async e => {
        clearTimeout(usernameCheckTimeout);
        const username = e.target.value.trim();
        const messageEl = document.getElementById("usernameMessage");
        if (username.length < 3) {
            messageEl.innerHTML = "";
            validationState.username = false;
            validateRegistrationForm();
            return;
        }
        if (!isValidUsernameFormat(username)) {
            await showUsernameMessage(messageEl, "invalid");
            validationState.username = false;
            validateRegistrationForm();
            return;
        }
        usernameCheckTimeout = setTimeout(async () => {
            const data = await checkUsername(username);
            if (data.available) {
                await showUsernameMessage(messageEl, "available");
                validationState.username = true;
                window.scheduleRegisterSuccessClear("username", messageEl);
            } else {
                await showUsernameMessage(messageEl, "taken", data.suggestions || [], "regUsername");
                validationState.username = false;
            }
            validateRegistrationForm();
        }, 500);
        validateRegistrationForm();
    });
    document.getElementById("regPasswordConfirm").addEventListener("input", async e => {
        const password = document.getElementById("regPassword").value;
        const confirmPassword = e.target.value;
        const messageEl = document.getElementById("passwordConfirmMessage");
        if (confirmPassword.length === 0) {
            messageEl.innerHTML = "";
            validateRegistrationForm();
            return;
        }
        const isMatch = password === confirmPassword;
        await showPasswordMatchMessage(messageEl, isMatch);
        if (isMatch) {
            window.scheduleRegisterSuccessClear("passwordConfirm", messageEl);
        }
        validateRegistrationForm();
    });
    document.getElementById("regPassword").addEventListener("input", async e => {
        const password = e.target.value;
        const confirmPassword = document.getElementById("regPasswordConfirm").value;
        const messageEl = document.getElementById("passwordMessage");
        const confirmMessageEl = document.getElementById("passwordConfirmMessage");
        const requirementsEl = document.getElementById("passwordRequirements");
        await showPasswordMessage(messageEl, requirementsEl, password);
        const passwordValidation = validatePasswordStrength(password);
        if (passwordValidation.valid) {
            window.scheduleRegisterSuccessClear("password", messageEl);
        }
        if (confirmPassword.length > 0) {
            const isMatch = password === confirmPassword;
            await showPasswordMatchMessage(confirmMessageEl, isMatch);
            if (isMatch) {
                window.scheduleRegisterSuccessClear("passwordConfirm", confirmMessageEl);
            }
        }
        validateRegistrationForm();
    });
    let emailCheckTimeout;
    document.getElementById("regEmail").addEventListener("input", async e => {
        clearTimeout(emailCheckTimeout);
        const email = e.target.value.trim();
        const messageEl = document.getElementById("emailMessage");
        if (!email) {
            messageEl.innerHTML = "";
            validationState.email = false;
            validateRegistrationForm();
            return;
        }
        if (!isValidEmailFormat(email)) {
            await showEmailMessage(messageEl, "invalid");
            validationState.email = false;
            validateRegistrationForm();
            return;
        }
        emailCheckTimeout = setTimeout(async () => {
            const data = await checkEmail(email);
            if (data.available) {
                await showEmailMessage(messageEl, "available");
                validationState.email = true;
                window.scheduleRegisterSuccessClear("email", messageEl);
            } else {
                await showEmailMessage(messageEl, "taken", {
                    message: data.message || "Email already registered",
                    canReset: data.can_reset || false
                });
                validationState.email = false;
            }
            validateRegistrationForm();
        }, 500);
        validateRegistrationForm();
    });
    document.getElementById("registerForm").addEventListener("submit", async e => {
        e.preventDefault();
        const email = document.getElementById("regEmail").value.trim();
        const username = document.getElementById("regUsername").value.trim();
        const password = document.getElementById("regPassword").value;
        const confirmPassword = document.getElementById("regPasswordConfirm").value;
        const submitBtn = document.getElementById("registerSubmitBtn");
        document.getElementById("usernameMessage").innerHTML = "";
        document.getElementById("emailMessage").innerHTML = "";
        document.getElementById("passwordMessage").innerHTML = "";
        document.getElementById("passwordConfirmMessage").innerHTML = "";
        if (password !== confirmPassword) {
            const confirmMessageEl = document.getElementById("passwordConfirmMessage");
            await showPasswordMatchMessage(confirmMessageEl, false);
            return;
        }
        const result = await register(email, username, password);
        if (result.success) {
            showInlineMessage(submitBtn, result.message || "Registration successful! Check your email to verify.", "success", 8e3);
            setTimeout(() => {
                showAuthForm("login");
            }, 2e3);
        } else {
            if (result.errors) {
                if (result.errors.username) {
                    const messageEl = document.getElementById("usernameMessage");
                    let html = await renderTemplate("validation/username-error");
                    html = html.replace("Username must be", `✗ ${result.errors.username}`);
                    if (result.errors.username_suggestions && result.errors.username_suggestions.length > 0) {
                        html += '<span style="margin-left: 5px;">Try:</span>';
                        for (const suggestion of result.errors.username_suggestions) {
                            const onclick = `document.getElementById('regUsername').value='${suggestion}'; document.getElementById('regUsername').dispatchEvent(new Event('input'));`;
                            html += await renderTemplate("messages/suggestion-button", {
                                suggestion: suggestion,
                                onclick: onclick
                            });
                        }
                    }
                    messageEl.innerHTML = html;
                }
                if (result.errors.email) {
                    const messageEl = document.getElementById("emailMessage");
                    await showEmailMessage(messageEl, "taken", {
                        message: result.errors.email,
                        canReset: result.errors.email_can_reset || false
                    });
                }
                if (result.errors.password) {
                    const messageEl = document.getElementById("passwordMessage");
                    messageEl.innerHTML = await renderTemplate("validation/password-missing", {
                        errors: result.errors.password.replace("✗ ", "")
                    });
                }
            } else {
                showInlineMessage(submitBtn, result.error || "Registration failed", "error");
            }
        }
    });
}

async function showForgotPasswordForm(popup, prefillEmail, wasEmail) {
    const emailValue = wasEmail && prefillEmail ? prefillEmail : "";
    popup.innerHTML = await renderTemplate("forms/forgot-password-form", {
        emailValue: emailValue
    });
    document.getElementById("forgotForm").addEventListener("submit", async e => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const result = await forgotPassword(email);
        if (result.message) {
            showInlineMessage(submitBtn, result.message, "info", 8e3);
        } else {
            showInlineMessage(submitBtn, result.error || "Something went wrong.", "error");
        }
    });
}

window.showAuthForm = showAuthForm;