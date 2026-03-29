function showImagePreview(image) {
    const createSection = document.getElementById("createSection");
    const imagesSection = document.getElementById("imagesSection");
    if (createSection) {
        createSection.style.display = "block";
    }
    if (imagesSection) {
        imagesSection.style.display = "none";
    }
    const editMainSection = document.querySelector(".edit-main-section");
    if (editMainSection) {
        const sourceButtons = editMainSection.querySelector(".source-buttons");
        if (sourceButtons) sourceButtons.style.display = "none";
        const sourceTabs = editMainSection.querySelector(".source-tabs");
        if (sourceTabs) sourceTabs.style.display = "none";
    }
    document.getElementById("webcamSection").style.display = "none";
    document.getElementById("uploadSection").style.display = "none";
    document.getElementById("mergeButtons").style.display = "none";
    const stickerSection = document.getElementById("stickerSection");
    if (stickerSection) {
        stickerSection.style.display = "none";
        const editContainer = document.querySelector(".edit-container");
        if (editContainer) {
            editContainer.classList.remove("has-stickers");
        }
    }
    const previewContainer = document.getElementById("imagePreviewContainer");
    if (previewContainer) {
        previewContainer.style.display = "block";
    }
    const previewImg = document.getElementById("previewImage");
    previewImg.src = `${API_CONFIG.IMAGES_API}get_image.php?filename=${encodeURIComponent(image.filename)}`;
    editState.setPreviewImage(image);
    const previewPostBtn = document.getElementById("previewPostBtn");
    const previewEditBtn = document.getElementById("previewEditBtn");
    const previewDeleteBtn = document.getElementById("previewDeleteBtn");
    const previewEditActions = document.getElementById("previewEditActions");
    const previewCaptionContainer = document.getElementById("previewCaptionContainer");
    if (previewPostBtn) {
        previewPostBtn.disabled = false;
    }
    if (previewEditBtn) {
        previewEditBtn.disabled = false;
    }
    if (previewDeleteBtn) {
        previewDeleteBtn.disabled = false;
        previewDeleteBtn.textContent = "🗑️ Delete";
        previewDeleteBtn.style.display = "inline-block";
        const existingConfirm = previewDeleteBtn.parentNode?.querySelector(".delete-confirmation-container");
        if (existingConfirm) {
            existingConfirm.remove();
        }
        const existingMessage = previewDeleteBtn.parentNode?.querySelector(".inline-message.confirmation");
        if (existingMessage) {
            existingMessage.remove();
        }
    }
    const previewBackBtn = document.getElementById("previewBackBtn");
    if (previewBackBtn) {
        previewBackBtn.style.display = "block";
    }
    const backToImagesBtn = document.getElementById("backToImagesBtn");
    if (backToImagesBtn) {
        backToImagesBtn.style.display = "none";
    }
    if (image.is_posted) {
        previewPostBtn.style.display = "none";
        previewEditBtn.textContent = "Duplicate to Recreate";
        previewEditBtn.style.display = "inline-block";
        previewDeleteBtn.style.display = "inline-block";
        const appliedStickersContainer = document.getElementById("appliedStickersContainer");
        if (appliedStickersContainer) {
            appliedStickersContainer.style.display = "none";
        }
    } else {
        previewPostBtn.style.display = "inline-block";
        previewEditBtn.textContent = "Edit";
        previewEditBtn.style.display = "inline-block";
        previewDeleteBtn.style.display = "inline-block";
    }
    previewEditActions.style.display = "none";
    previewCaptionContainer.style.display = "none";
    if (image.caption) {
        let captionDisplay = previewContainer.querySelector(".caption-display");
        if (!captionDisplay) {
            captionDisplay = document.createElement("div");
            captionDisplay.className = "caption-display";
            previewContainer.insertBefore(captionDisplay, previewContainer.querySelector(".preview-actions"));
        }
        captionDisplay.textContent = image.caption;
        captionDisplay.style.display = "block";
    } else {
        const captionDisplay = previewContainer.querySelector(".caption-display");
        if (captionDisplay) {
            captionDisplay.style.display = "none";
        }
    }
}

async function postPreviewImage() {
    const previewImage = editState.getPreviewImage();
    if (!previewImage) return;
    const btn = document.getElementById("previewPostBtn");
    btn.disabled = true;
    btn.textContent = "Posting...";
    try {
        const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
        const res = await fetchFn(API_CONFIG.IMAGES_API + "post_image.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                image_id: previewImage.id
            })
        });
        const data = await res.json();
        if (data.success) {
            window.location.href = "/pages/index.html";
        } else {
            btn.disabled = false;
            btn.textContent = "📤 Post";
            if (typeof showInlineMessage === "function") {
                showInlineMessage(btn, data.error || "Failed to post image", "error");
            }
        }
    } catch (err) {
        btn.disabled = false;
        btn.textContent = "📤 Post";
        if (typeof showInlineMessage === "function") {
            showInlineMessage(btn, "Failed to post image: " + err.message, "error");
        }
    }
}

async function editPreviewImage() {
    const previewImage = editState.getPreviewImage();
    if (!previewImage) return;
    const image = previewImage;
    const wasPosted = !!image.is_posted;
    if (image.is_posted) {
        try {
            const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
            const dupRes = await fetchFn(API_CONFIG.IMAGES_API + "duplicate_image.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    image_id: image.id
                })
            });
            const dupData = await dupRes.json();
            if (!dupRes.ok || !dupData.success) {
                throw new Error(dupData?.error || "Failed to duplicate image");
            }
            const userImagesRes = await fetchFn(API_CONFIG.IMAGES_API + "user_images.php", {
                credentials: "include"
            });
            const userImagesData = await userImagesRes.json();
            if (userImagesData.success && userImagesData.images) {
                const duplicatedImage = userImagesData.images.find(img => img.id == dupData.image.id);
                if (duplicatedImage) {
                    editState.setPreviewImage(duplicatedImage);
                    Object.assign(image, duplicatedImage);
                } else {
                    editState.setPreviewImage(dupData.image);
                    image.id = dupData.image.id;
                    image.filename = dupData.image.filename;
                    image.is_posted = false;
                }
            } else {
                editState.setPreviewImage(dupData.image);
                image.id = dupData.image.id;
                image.filename = dupData.image.filename;
                image.is_posted = false;
            }
        } catch (err) {
            if (typeof showInlineMessage === "function") {
                showInlineMessage(document.getElementById("previewEditBtn"), "Failed to duplicate image: " + err.message, "error");
            }
            return;
        }
    }
    if (wasPosted) {
        image.caption = "";
        const currentPreview = editState.getPreviewImage();
        if (currentPreview) {
            currentPreview.caption = "";
            editState.setPreviewImage({
                ...currentPreview
            });
        }
    }
    if (typeof editImage === "function") {
        await editImage(image.id);
    }
}

async function deletePreviewImage() {
    const previewImage = editState.getPreviewImage();
    if (!previewImage) return;
    const image = previewImage;
    const btn = document.getElementById("previewDeleteBtn");
    if (!btn) return;
    const existingConfirm = btn.parentNode.querySelector(".delete-confirmation-container");
    if (existingConfirm) {
        existingConfirm.remove();
        btn.style.display = "inline-block";
        return;
    }
    let confirmMessage = "Are you sure you want to delete this image?";
    if (image.is_posted) {
        confirmMessage = "Are you sure you want to delete this image? The image will no longer appear in the gallery.";
    }
    btn.style.display = "none";
    const confirmContainer = document.createElement("div");
    confirmContainer.className = "delete-confirmation-container";
    confirmContainer.style.cssText = "display: inline-block; padding: 8px 12px; background: rgba(255, 142, 155, 0.2); border: 1px solid rgba(255, 142, 155, 0.4); border-radius: 6px; font-size: 0.85em;";
    const messageText = document.createElement("div");
    messageText.textContent = confirmMessage;
    messageText.style.cssText = "margin-bottom: 8px; color: #FF8E9B;";
    confirmContainer.appendChild(messageText);
    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.cssText = "display: flex; gap: 8px; justify-content: flex-end;";
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.cssText = "padding: 6px 12px; font-size: 0.85em; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; background: linear-gradient(135deg, #00D4FF 0%, #00B8D4 100%); color: white; box-shadow: 0 2px 6px rgba(0, 212, 255, 0.3);";
    cancelBtn.onmouseover = () => {
        cancelBtn.style.background = "linear-gradient(135deg, #00B8D4 0%, #0097C7 100%)";
        cancelBtn.style.boxShadow = "0 4px 10px rgba(0, 212, 255, 0.4)";
    };
    cancelBtn.onmouseout = () => {
        cancelBtn.style.background = "linear-gradient(135deg, #00D4FF 0%, #00B8D4 100%)";
        cancelBtn.style.boxShadow = "0 2px 6px rgba(0, 212, 255, 0.3)";
    };
    cancelBtn.onclick = () => {
        confirmContainer.remove();
        btn.style.display = "inline-block";
    };
    buttonsContainer.appendChild(cancelBtn);
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Confirm";
    confirmBtn.style.cssText = "padding: 6px 12px; font-size: 0.85em; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; background: linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%); color: white; box-shadow: 0 2px 6px rgba(255, 107, 157, 0.3);";
    confirmBtn.onmouseover = () => {
        confirmBtn.style.background = "linear-gradient(135deg, #FF4757 0%, #FF6B9D 100%)";
        confirmBtn.style.boxShadow = "0 4px 10px rgba(255, 107, 157, 0.4)";
    };
    confirmBtn.onmouseout = () => {
        confirmBtn.style.background = "linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%)";
        confirmBtn.style.boxShadow = "0 2px 6px rgba(255, 107, 157, 0.3)";
    };
    confirmBtn.onclick = async () => {
        confirmContainer.remove();
        await performDeleteImage(image.id, btn);
    };
    buttonsContainer.appendChild(confirmBtn);
    confirmContainer.appendChild(buttonsContainer);
    if (btn.parentNode) {
        btn.parentNode.insertBefore(confirmContainer, btn.nextSibling);
    }
}

async function performDeleteImage(imageId, btn) {
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Deleting...";
    try {
        const res = await fetch(API_CONFIG.IMAGES_API + "delete.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                image_id: imageId
            })
        });
        const data = await res.json();
        if (data.success) {
            btn.disabled = false;
            btn.textContent = "🗑️ Delete";
            document.getElementById("imagePreviewContainer").style.display = "none";
            if (typeof showImagesView === "function") {
                showImagesView();
            }
            if (typeof loadUserImages === "function") {
                await loadUserImages();
            }
        } else {
            btn.disabled = false;
            btn.textContent = "🗑️ Delete";
            if (typeof showInlineMessage === "function") {
                showInlineMessage(btn, data.error || "Failed to delete image", "error");
            }
        }
    } catch (err) {
        btn.disabled = false;
        btn.textContent = "🗑️ Delete";
        if (typeof showInlineMessage === "function") {
            showInlineMessage(btn, "Failed to delete image: " + err.message, "error");
        }
    }
}

async function savePreviewEdit() {
    if (typeof mergeAndUpload === "function") {
        await mergeAndUpload();
    }
    const previewImage = editState.getPreviewImage();
    if (previewImage) {
        const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
        const res = await fetchFn(IMAGE_API + "user_images.php", {
            credentials: "include"
        });
        const data = await res.json();
        if (data.success && data.images) {
            const updatedImage = data.images.find(img => img.id == previewImage.id);
            if (updatedImage) {
                showImagePreview(updatedImage);
            }
        }
    }
}

async function saveAndPostPreview() {
    if (typeof mergeAndUpload === "function") {
        await mergeAndUpload();
    }
    const previewImage = editState.getPreviewImage();
    if (previewImage) {
        try {
            const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
            const res = await fetchFn(API_CONFIG.IMAGES_API + "post_image.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    image_id: previewImage.id
                })
            });
            const data = await res.json();
            if (data.success) {
                window.location.href = "/pages/index.html";
            } else {
                if (typeof showInlineMessage === "function") {
                    showInlineMessage(document.getElementById("previewSavePostBtn"), data.error || "Failed to post image", "error");
                }
            }
        } catch (err) {
            if (typeof showInlineMessage === "function") {
                showInlineMessage(document.getElementById("previewSavePostBtn"), "Failed to post image: " + err.message, "error");
            }
        }
    }
}

const imagePreviewManager = {
    show: showImagePreview,
    post: postPreviewImage,
    edit: editPreviewImage,
    delete: deletePreviewImage,
    saveEdit: savePreviewEdit,
    saveAndPost: saveAndPostPreview
};

window.imagePreviewManager = imagePreviewManager;