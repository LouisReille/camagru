(async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
        const container = document.querySelector(".reset-container");
        if (container) {
            container.innerHTML = await loadTemplate("errors/invalid-reset-link");
        }
        return;
    }
    function togglePasswordVisibilityReset() {
        const checkbox = document.getElementById("showPasswordReset");
        const passwordField = document.getElementById("password");
        const confirmField = document.getElementById("passwordConfirm");
        if (checkbox && passwordField && confirmField) {
            const isChecked = checkbox.checked;
            passwordField.type = isChecked ? "text" : "password";
            confirmField.type = isChecked ? "text" : "password";
        }
    }
    window.togglePasswordVisibilityReset = togglePasswordVisibilityReset;
    document.getElementById("passwordConfirm")?.addEventListener("input", e => {
        const password = document.getElementById("password").value;
        const confirmPassword = e.target.value;
        const messageEl = document.getElementById("passwordMatchMessage");
        if (confirmPassword.length === 0) {
            messageEl.innerHTML = "";
            return;
        }
        if (password !== confirmPassword) {
            messageEl.innerHTML = '<span style="color: #ef4444;">✗ Passwords do not match</span>';
        } else {
            messageEl.innerHTML = '<span style="color: #10B981;">✓ Passwords match</span>';
        }
    });
    document.getElementById("password")?.addEventListener("input", e => {
        const password = e.target.value;
        const confirmPassword = document.getElementById("passwordConfirm").value;
        const messageEl = document.getElementById("passwordMessage");
        const confirmMessageEl = document.getElementById("passwordMatchMessage");
        const requirementsEl = document.getElementById("passwordRequirements");
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
        if (password.length === 0) {
            messageEl.innerHTML = "";
            requirementsEl.innerHTML = "Requirements: 8+ characters, uppercase, lowercase, number, special character";
            requirementsEl.style.color = "#94a3b8";
        } else if (errors.length > 0) {
            messageEl.innerHTML = '<span style="color: #ef4444;">✗ Missing: ' + errors.join(", ") + "</span>";
            requirementsEl.innerHTML = "Requirements: 8+ characters, uppercase, lowercase, number, special character";
            requirementsEl.style.color = "#ef4444";
        } else {
            messageEl.innerHTML = '<span style="color: #10B981;">✓ Password meets requirements</span>';
            requirementsEl.innerHTML = "✓ All requirements met";
            requirementsEl.style.color = "#10B981";
        }
        if (confirmPassword.length > 0) {
            if (password !== confirmPassword) {
                confirmMessageEl.innerHTML = '<span style="color: #ef4444;">✗ Passwords do not match</span>';
            } else {
                confirmMessageEl.innerHTML = '<span style="color: #10B981;">✓ Passwords match</span>';
            }
        }
    });
    document.getElementById("resetForm")?.addEventListener("submit", async e => {
        e.preventDefault();
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("passwordConfirm").value.trim();
        const messageEl = document.getElementById("message");
        const formContainer = document.getElementById("formContainer");
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (password !== confirmPassword) {
            document.getElementById("passwordMatchMessage").innerHTML = '<span style="color: #ef4444;">✗ Passwords do not match</span>';
            return;
        }
        submitBtn.textContent = "Resetting...";
        submitBtn.disabled = true;
        try {
            const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
            const res = await fetchFn(`${API_CONFIG.USERS_API}reset_password.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: token,
                    password: password
                })
            });
            const data = await res.json();
            if (res.ok) {
                formContainer.innerHTML = await loadTemplate("forms/reset-password-success");
            } else {
                messageEl.className = "error-message";
                messageEl.textContent = data.error || "Invalid or expired link.";
                submitBtn.textContent = "Reset Password";
                submitBtn.disabled = false;
            }
        } catch (err) {
            messageEl.className = "error-message";
            messageEl.textContent = "Network error. Please try again.";
            submitBtn.textContent = "Reset Password";
            submitBtn.disabled = false;
        }
    });
})();