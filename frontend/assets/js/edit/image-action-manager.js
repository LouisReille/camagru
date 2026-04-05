async function uploadNewImage(imageBlob) {
    const formData = new FormData;
    const imageBlobTyped = new Blob([ imageBlob ], {
        type: "image/png"
    });
    formData.append("image", imageBlobTyped, "image.png");
    const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
    const uploadRes = await fetchFn(IMAGE_API + "upload.php", {
        method: "POST",
        credentials: "include",
        body: formData
    });
    const uploadText = await uploadRes.text();
    let uploadData;
    try {
        uploadData = JSON.parse(uploadText);
    } catch (e) {
        throw new Error("Server returned invalid response. Status: " + uploadRes.status + ". Response: " + uploadText.substring(0, 200));
    }
    if (!uploadRes.ok || !uploadData.success) {
        const errorMsg = uploadData.error || "Upload failed";
        throw new Error(errorMsg + (uploadRes.status ? " (Status: " + uploadRes.status + ")" : ""));
    }
    return uploadData;
}

async function mergeImageWithStickers(filename, stickersData, previewWidth, previewHeight, caption, isEditing) {
    const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
    if (isEditing) {
        const editRes = await fetch(IMAGE_API + "edit_image.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                image_id: editState.getImageId(),
                stickers: stickersData,
                previewWidth: previewWidth,
                previewHeight: previewHeight,
                caption: caption || null
            })
        });
        const editText = await editRes.text();
        let mergeData;
        try {
            mergeData = JSON.parse(editText);
        } catch (e) {
            throw new Error("Server returned invalid response during edit. Status: " + editRes.status);
        }
        if (!editRes.ok || !mergeData.success) {
            throw new Error(mergeData?.error || "Edit failed");
        }
        return mergeData;
    } else {
        const mergeRes = await fetchFn(IMAGE_API + "merge_image.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                background: filename,
                stickers: stickersData,
                previewWidth: previewWidth,
                previewHeight: previewHeight,
                caption: caption || null
            })
        });
        const mergeText = await mergeRes.text();
        let mergeData;
        try {
            mergeData = JSON.parse(mergeText);
        } catch (e) {
            throw new Error("Server returned invalid response during merge. Status: " + mergeRes.status);
        }
        if (!mergeRes.ok || !mergeData.success) {
            throw new Error(mergeData?.error || "Merge failed");
        }
        return mergeData;
    }
}

async function saveImageWithoutStickers(filename, caption, isEditing) {
    const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
    const saveRes = await fetchFn(IMAGE_API + "save_image.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
            filename: filename,
            caption: caption,
            image_id: isEditing ? editState.getImageId() : null
        })
    });
    const saveText = await saveRes.text();
    let saveData;
    try {
        saveData = JSON.parse(saveText);
    } catch (e) {
        throw new Error("Server returned invalid response. Status: " + saveRes.status + ". Response: " + saveText.substring(0, 200));
    }
    if (!saveRes.ok || !saveData.success) {
        const errorMsg = saveData.error || "Save failed";
        throw new Error(errorMsg + (saveRes.status ? " (Status: " + saveRes.status + ")" : ""));
    }
    return saveData;
}

class ImageActionManager {
    async mergeAndUpload(skipUIReset = false) {
        const mergeBtn = document.getElementById("mergeBtn");
        const capturedImageBlob = window.capturedImageBlob;
        if (!capturedImageBlob) {
            mergeBtn.disabled = true;
            mergeBtn.textContent = "Waiting for image...";
            for (let i = 0; i < 50; i++) {
                await new Promise(resolve => setTimeout(resolve, 100));
                if (window.capturedImageBlob) break;
            }
                if (!window.capturedImageBlob) {
                mergeBtn.disabled = false;
                mergeBtn.textContent = "Post Image";
                if (typeof showInlineMessage === "function") {
                    showInlineMessage(mergeBtn, "Image is still processing. Please wait a moment and try again.", "error");
                }
                return null;
            }
        }
        const blob = window.capturedImageBlob;
        if (!(blob instanceof Blob)) {
            if (typeof showInlineMessage === "function") {
                showInlineMessage(mergeBtn, "Invalid image data. Please try uploading again.", "error");
            }
            return null;
        }
        if (blob.size === 0) {
            if (typeof showInlineMessage === "function") {
                showInlineMessage(mergeBtn, "Invalid image. Please try again.", "error");
            }
            return null;
        }
        mergeBtn.disabled = true;
        mergeBtn.textContent = "Processing...";
        const isEditing = editState.isEditing();
        try {
            let uploadData;
            if (!isEditing) {
                uploadData = await uploadNewImage(blob);
            } else {
                uploadData = {
                    filename: editState.getImageFilename() || editState.imageFilename
                };
            }
            const stickers = window.activeStickers || [];
            const captionInputEl = document.getElementById("imageCaption") || document.getElementById("previewImageCaption");
            const captionValue = captionInputEl ? captionInputEl.value.trim() : "";
            let savedImageId = null;
            if (!stickers || stickers.length === 0) {
                if (isEditing) {
                    await saveImageWithoutStickers(editState.getImageFilename() || editState.imageFilename, captionValue || null, true);
                    savedImageId = editState.getImageId();
                } else {
                    const saveData = await saveImageWithoutStickers(uploadData.filename, captionValue || null, false);
                    savedImageId = saveData.image_id != null ? Number(saveData.image_id) : null;
                }
                if (!skipUIReset) {
                    if (typeof showInlineMessage === "function") {
                        showInlineMessage(mergeBtn, isEditing ? "Image updated!" : "Image saved!", "success", 2e3);
                    }
                    const continueBtn = document.getElementById("continueBtn");
                    const cancelBtn = document.getElementById("cancelBtn");
                    if (continueBtn) continueBtn.style.display = "none";
                    if (cancelBtn) cancelBtn.style.display = "none";
                    editState.setCreateMode();
                    if (typeof resetEditForm === "function") {
                        resetEditForm();
                    }
                    if (typeof loadUserImages === "function") {
                        await loadUserImages();
                    }
                    if (typeof showImagesView === "function") {
                        showImagesView();
                    } else {
                        const createSection = document.getElementById("createSection");
                        const imagesSection = document.getElementById("imagesSection");
                        if (createSection) createSection.style.display = "none";
                        if (imagesSection) imagesSection.style.display = "block";
                        const backBtn = document.getElementById("backToImagesBtn");
                        if (backBtn) backBtn.style.display = "none";
                    }
                }
                mergeBtn.disabled = false;
                if (typeof updateMergeButton === "function") {
                    updateMergeButton();
                }
                return savedImageId;
            }
            const previewImg = typeof getCurrentPreviewImage === "function" ? getCurrentPreviewImage() : null;
            const container = typeof getCurrentStickerContainer === "function" ? getCurrentStickerContainer() : null;
            if (!previewImg || !container || stickers.length === 0) {
                if (typeof showInlineMessage === "function") {
                    showInlineMessage(mergeBtn, "No stickers to apply", "error");
                }
                mergeBtn.disabled = false;
                if (typeof updateMergeButton === "function") {
                    updateMergeButton();
                }
                return null;
            }
            const stickersData = await StickerPositionCalculator.calculatePositions(previewImg, container, stickers);
            if (stickersData.length === 0) {
                if (typeof showInlineMessage === "function") {
                    showInlineMessage(mergeBtn, "Failed to calculate sticker positions. Please try again.", "error");
                }
                mergeBtn.disabled = false;
                if (typeof updateMergeButton === "function") {
                    updateMergeButton();
                }
                return null;
            }
            const naturalDims = StickerPositionCalculator.getNaturalDimensions(previewImg);
            const previewWidth = naturalDims.width;
            const previewHeight = naturalDims.height;
            const captionInputEl2 = document.getElementById("imageCaption") || document.getElementById("previewImageCaption");
            const captionValue2 = captionInputEl2 ? captionInputEl2.value.trim() : "";
            const mergeData = await mergeImageWithStickers(uploadData.filename, stickersData, previewWidth, previewHeight, captionValue2, isEditing);
            const mergedImageId = mergeData.image_id != null ? Number(mergeData.image_id) : (isEditing ? editState.getImageId() : null);
            if (!skipUIReset) {
                if (typeof showInlineMessage === "function") {
                    showInlineMessage(mergeBtn, isEditing ? "Image updated!" : "Image saved!", "success", 2e3);
                }
                const continueBtn = document.getElementById("continueBtn");
                const cancelBtn = document.getElementById("cancelBtn");
                if (continueBtn) continueBtn.style.display = "none";
                if (cancelBtn) cancelBtn.style.display = "none";
                if (typeof resetEditForm === "function") {
                    resetEditForm();
                }
                if (typeof loadUserImages === "function") {
                    await loadUserImages();
                }
                viewManager.showImagesView();
            }
            mergeBtn.disabled = false;
            if (typeof updateMergeButton === "function") {
                updateMergeButton();
            }
            return mergedImageId;
        } catch (err) {
            if (typeof showInlineMessage === "function") {
                showInlineMessage(mergeBtn, err.message || "Failed to create image", "error");
            } else {
                alert(err.message || "Failed to create image");
            }
            mergeBtn.disabled = false;
            if (typeof updateMergeButton === "function") {
                updateMergeButton();
            }
            return null;
        }
    }
    async saveAndPost() {
        const postBtn = document.getElementById("postBtn");
        const cancelBtn = document.getElementById("cancelBtn");
        if (postBtn) {
            postBtn.disabled = true;
            postBtn.textContent = "Posting...";
        }
        let previousCancelDisplay = null;
        if (cancelBtn) {
            previousCancelDisplay = cancelBtn.style.display || "";
            cancelBtn.style.display = "none";
            cancelBtn.disabled = true;
        }
        const isEditing = editState.isEditing();
        const imageIdToPost = editState.getImageId();
        const savedIdFromMerge = await this.mergeAndUpload(true);
        let targetImageId = imageIdToPost || savedIdFromMerge;
        if (!targetImageId) {
            try {
                const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
                const res = await fetchFn(API_CONFIG.IMAGES_API + "user_images.php", {
                    credentials: "include"
                });
                const data = await res.json();
                if (data.success && data.images && data.images.length > 0) {
                    targetImageId = data.images[0].id;
                }
            } catch (err) {}
        }
        if (targetImageId) {
            try {
                const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
                const postRes = await fetchFn(API_CONFIG.IMAGES_API + "post_image.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        image_id: targetImageId
                    })
                });
                const postData = await postRes.json();
                if (postData.success) {
                    window.location.href = "/pages/index.html";
                    return;
                } else if (typeof showInlineMessage === "function") {
                    showInlineMessage(postBtn, "Image saved but failed to post: " + (postData.error || "Unknown error"), "error");
                }
            } catch (err) {
                if (typeof showInlineMessage === "function") {
                    showInlineMessage(postBtn, "Image saved but failed to post: " + err.message, "error");
                }
            }
        } else if (typeof showInlineMessage === "function") {
            showInlineMessage(postBtn, "Image saved but could not determine which image to post", "error");
        }
        if (postBtn) {
            postBtn.disabled = false;
            postBtn.textContent = "Post";
        }
        if (cancelBtn) {
            cancelBtn.disabled = false;
            cancelBtn.style.display = previousCancelDisplay || "inline-block";
        }
    }
    async delete(imageId, buttonElement) {
        const item = buttonElement.closest(".user-image-item");
        if (!item) {
            return;
        }
        buttonElement.disabled = true;
        buttonElement.textContent = "Deleting...";
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
                item.style.opacity = "0";
                item.style.transition = "opacity 0.3s";
                setTimeout(() => {
                    item.remove();
                    if (typeof loadUserImages === "function") {
                        loadUserImages();
                    }
                }, 300);
            } else {
                buttonElement.disabled = false;
                buttonElement.textContent = "Delete";
                const sidebar = document.querySelector(".edit-sidebar");
                if (typeof showInlineMessage === "function" && sidebar) {
                    showInlineMessage(sidebar, data.error || "Failed to delete image", "error");
                } else {
                    alert(data.error || "Failed to delete image");
                }
            }
        } catch (err) {
            buttonElement.disabled = false;
            buttonElement.textContent = "Delete";
            const sidebar = document.querySelector(".edit-sidebar");
            if (typeof showInlineMessage === "function" && sidebar) {
                showInlineMessage(sidebar, "Failed to delete image: " + err.message, "error");
            } else {
                alert("Failed to delete image: " + err);
            }
        }
    }
    async post(imageId, buttonElement) {
        buttonElement.disabled = true;
        buttonElement.textContent = "Posting...";
        try {
            const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
            const res = await fetchFn(API_CONFIG.IMAGES_API + "post_image.php", {
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
                if (typeof loadUserImages === "function") {
                    await loadUserImages();
                }
                if (typeof showInlineMessage === "function") {
                    showInlineMessage(buttonElement, "Image posted!", "success", 2e3);
                }
            } else {
                buttonElement.disabled = false;
                buttonElement.textContent = "Post";
                if (typeof showInlineMessage === "function") {
                    showInlineMessage(buttonElement, data.error || "Failed to post image", "error");
                }
            }
        } catch (err) {
            buttonElement.disabled = false;
            buttonElement.textContent = "Post";
            if (typeof showInlineMessage === "function") {
                showInlineMessage(buttonElement, "Failed to post image: " + err.message, "error");
            }
        }
    }
    async edit(imageId) {
        try {
            const fetchFn = typeof authFetch === "function" ? authFetch : fetch;
            const res = await fetchFn(API_CONFIG.IMAGES_API + "user_images.php", {
                credentials: "include"
            });
            const data = await res.json();
            if (!data.success || !data.images) {
                throw new Error("Failed to load image");
            }
            const freshRes = await fetchFn(API_CONFIG.IMAGES_API + "user_images.php?t=" + Date.now(), {
                credentials: "include"
            });
            const freshData = await freshRes.json();
            const image = freshData.success && freshData.images ? freshData.images.find(img => img.id == imageId) : data.images.find(img => img.id == imageId);
            if (!image) {
                throw new Error("Image not found");
            }
            ImageEditHelper.configureUIForEdit();
            editState.setEditMode(imageId, image.filename);
            let imageFilename = image.filename;
            let imageUrl = `${API_CONFIG.IMAGES_API}get_image.php?filename=${encodeURIComponent(imageFilename)}`;
            let response = await fetch(imageUrl, {
                credentials: "include"
            });
            if (!response.ok && imageFilename !== image.filename) {
                imageFilename = image.filename;
                imageUrl = `${API_CONFIG.IMAGES_API}get_image.php?filename=${encodeURIComponent(imageFilename)}`;
                response = await fetch(imageUrl, {
                    credentials: "include"
                });
            }
            if (!response.ok) {
                let errorDetails = "";
                try {
                    const errorData = await response.json();
                    errorDetails = errorData.error || errorData.message || "";
                } catch (e) {
                    errorDetails = response.statusText;
                }
                throw new Error(`Failed to load image (${response.status}): ${errorDetails || "Image file not found on server"}`);
            }
            const blob = await response.blob();
            window.capturedImageBlob = blob;
            ImageEditHelper.setupUploadPreviewForEdit();
            const uploadPreviewImg = document.getElementById("uploadPreviewImg");
            const uploadStickerContainer = document.getElementById("uploadStickerContainer");
            ImageEditHelper.clearAllStickerContainers();
            const reader = new FileReader;
            reader.onload = e => {
                window.capturedImageDataUrl = e.target.result;
                if (uploadPreviewImg) {
                    if (typeof clearAllStickers === "function") {
                        clearAllStickers();
                    }
                    if (uploadStickerContainer) {
                        uploadStickerContainer.innerHTML = "";
                    }
                    uploadPreviewImg.src = window.capturedImageDataUrl;
                }
                ImageEditHelper.setupStickerSectionForEdit(image);
                ImageEditHelper.setupMergeButtonsForEdit();
                ImageEditHelper.loadCaption(image.caption);
                setTimeout(() => {
                    if (typeof loadStickerCatalogue === "function") {
                        loadStickerCatalogue();
                    }
                }, 100);
                if (typeof updateMergeButton === "function") {
                    updateMergeButton();
                }
            };
            reader.readAsDataURL(blob);
            return;
        } catch (err) {
            if (typeof showInlineMessage === "function") {
                showInlineMessage(document.querySelector(".edit-sidebar"), "Failed to load image: " + err.message, "error");
            }
        }
    }
}

const imageActionManager = new ImageActionManager;

window.imageActionManager = imageActionManager;