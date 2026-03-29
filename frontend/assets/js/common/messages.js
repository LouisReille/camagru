function showInlineMessage(element, message, type = "info", duration = 5e3) {
    const existing = element.parentNode.querySelector(".inline-message");
    if (existing) {
        existing.remove();
    }
    const messageEl = document.createElement("div");
    messageEl.className = `inline-message ${type}`;
    messageEl.textContent = message;
    if (element.parentNode) {
        element.parentNode.insertBefore(messageEl, element.nextSibling);
    } else {
        element.insertAdjacentElement("afterend", messageEl);
    }
    setTimeout(() => {
        messageEl.classList.add("show");
    }, 10);
    if (duration > 0) {
        setTimeout(() => {
            hideInlineMessage(messageEl);
        }, duration);
    }
    return messageEl;
}

function hideInlineMessage(messageEl) {
    messageEl.classList.remove("show");
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.remove();
        }
    }, 300);
}

function showConfirmation(element, message, onConfirm, onCancel = null) {
    const existing = element.parentNode.querySelector(".inline-message.confirmation");
    if (existing) {
        existing.remove();
    }
    const messageEl = document.createElement("div");
    messageEl.className = "inline-message warning confirmation";
    const messageText = document.createElement("div");
    messageText.textContent = message;
    messageText.style.cssText = "width: 100%; margin-bottom: 12px;";
    messageEl.appendChild(messageText);
    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.cssText = "display: flex; gap: 8px; justify-content: flex-end; width: 100%;";
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = () => {
        messageEl.remove();
        if (onCancel) onCancel();
    };
    buttonsContainer.appendChild(cancelBtn);
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Confirm";
    confirmBtn.onclick = () => {
        messageEl.remove();
        onConfirm();
    };
    buttonsContainer.appendChild(confirmBtn);
    messageEl.appendChild(buttonsContainer);
    messageEl.style.cssText = "display: flex; flex-direction: column; gap: 0;";
    if (element.parentNode) {
        element.parentNode.insertBefore(messageEl, element.nextSibling);
    } else {
        element.insertAdjacentElement("afterend", messageEl);
    }
    setTimeout(() => {
        messageEl.classList.add("show");
    }, 10);
}

window.showInlineMessage = showInlineMessage;

window.hideInlineMessage = hideInlineMessage;

window.showConfirmation = showConfirmation;