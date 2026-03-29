class FileUploadManager {
    handleSelect(event, onImageReady) {
        const file = event.target.files[0];
        if (!file) return;
        const sourceButtons = document.querySelector(".source-buttons");
        if (sourceButtons) {
            sourceButtons.style.display = "none";
        }
        if (typeof switchSource === "function") {
            switchSource("upload");
        }
        if (typeof window !== "undefined") {
            window.capturedImageBlob = null;
            window.capturedImageDataUrl = null;
        }
        const stickerSection = document.getElementById("stickerSection");
        if (stickerSection && stickerSection.style.display === "none") {
            stickerSection.style.display = "block";
            const editContainer = document.querySelector(".edit-container");
            if (editContainer) {
                editContainer.classList.add("has-stickers");
            }
            setTimeout(() => {
                if (typeof loadStickerCatalogue === "function") {
                    loadStickerCatalogue();
                }
            }, 100);
        }
        const fileName = file.name.toLowerCase();
        const isImageFile = file.type.startsWith("image/") || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".png") || fileName.endsWith(".gif") || fileName.endsWith(".heic") || fileName.endsWith(".heif") || fileName.endsWith(".webp") || fileName.endsWith(".bmp");
        if (!isImageFile) {
            if (typeof showInlineMessage === "function") {
                showInlineMessage(document.getElementById("uploadSection"), "Please select an image file", "error");
            }
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            if (typeof showInlineMessage === "function") {
                showInlineMessage(document.getElementById("uploadSection"), "Image file is too large. Maximum size is 10MB.", "error");
            }
            return;
        }
        const uploadSection = document.getElementById("uploadSection");
        if (typeof showInlineMessage === "function") {
            showInlineMessage(uploadSection, "Processing image...", "info", 5e3);
        }
        const reader = new FileReader;
        reader.onload = e => {
            const dataUrl = e.target.result;
            const preview = document.getElementById("uploadPreview");
            const previewImg = document.getElementById("uploadPreviewImg");
            const img = new Image;
            img.onerror = err => {
                if (typeof window !== "undefined") {
                    window.capturedImageBlob = null;
                }
                const messages = uploadSection.querySelectorAll(".inline-message");
                messages.forEach(msg => {
                    if (msg.textContent.includes("Processing")) {
                        msg.remove();
                    }
                });
                if (typeof showInlineMessage === "function") {
                    const fileName = file.name.toLowerCase();
                    if (fileName.endsWith(".heic") || fileName.endsWith(".heif")) {
                        showInlineMessage(uploadSection, "HEIC format not supported by this browser. Please convert to JPEG in your Photos app first, or use Safari.", "error");
                    } else {
                        showInlineMessage(uploadSection, "Error loading image file. The file may be corrupted or in an unsupported format.", "error");
                    }
                }
            };
            img.onload = async () => {
                if (!img.naturalWidth || !img.naturalHeight) {
                    if (typeof window !== "undefined") {
                        window.capturedImageBlob = null;
                    }
                    if (typeof showInlineMessage === "function") {
                        showInlineMessage(uploadSection, "Invalid image dimensions. Please try a different image.", "error");
                    }
                    return;
                }
                const tempCanvas = document.createElement("canvas");
                const tempCtx = tempCanvas.getContext("2d");
                tempCanvas.width = img.naturalWidth;
                tempCanvas.height = img.naturalHeight;
                try {
                    tempCtx.drawImage(img, 0, 0);
                } catch (err) {
                    if (typeof window !== "undefined") {
                        window.capturedImageBlob = null;
                    }
                    if (typeof showInlineMessage === "function") {
                        showInlineMessage(uploadSection, "Error processing image. Please try a different image.", "error");
                    }
                    return;
                }
                tempCanvas.toBlob(async blob => {
                    if (!blob) {
                        if (typeof window !== "undefined") {
                            window.capturedImageBlob = null;
                        }
                        if (typeof showInlineMessage === "function") {
                            showInlineMessage(uploadSection, "Error processing image file. Please try a different image.", "error");
                        }
                        return;
                    }
                    try {
                        const cropped = await cropImageToPortrait(blob);
                        if (typeof window !== "undefined") {
                            window.capturedImageBlob = cropped.blob;
                            window.capturedImageDataUrl = cropped.dataUrl;
                        }
                        if (onImageReady) {
                            onImageReady(cropped.blob, cropped.dataUrl);
                        }
                    } catch (err) {
                        const fallbackBlob = new Blob([ blob ], {
                            type: "image/png"
                        });
                        const fallbackDataUrl = tempCanvas.toDataURL("image/png");
                        if (typeof window !== "undefined") {
                            window.capturedImageBlob = fallbackBlob;
                            window.capturedImageDataUrl = fallbackDataUrl;
                        }
                        if (onImageReady) {
                            onImageReady(fallbackBlob, fallbackDataUrl);
                        }
                    }
                    previewImg.onerror = () => {
                        if (typeof showInlineMessage === "function") {
                            showInlineMessage(uploadSection, "Failed to display preview. The image was processed successfully though.", "error");
                        }
                    };
                    const previewContainer = previewImg.closest(".preview-image-container");
                    const dataUrl = typeof window !== "undefined" && window.capturedImageDataUrl ? window.capturedImageDataUrl : onImageReady ? null : tempCanvas.toDataURL("image/png");
                    if (dataUrl) {
                        previewImg.src = dataUrl;
                        preview.style.display = "block";
                    }
                    previewImg.onload = () => {
                        if (previewContainer) {
                            const pendingStickers = (window.activeStickers || []).filter(s => s.pending);
                            pendingStickers.forEach(sticker => {
                                delete sticker.pending;
                                if (typeof addStickerToPreview === "function") {
                                    addStickerToPreview(sticker.src, sticker.type);
                                }
                            });
                            window.activeStickers = (window.activeStickers || []).filter(s => !s.pending);
                        }
                    };
                    const messages = uploadSection.querySelectorAll(".inline-message");
                    messages.forEach(msg => {
                        if (msg.textContent.includes("Processing")) {
                            msg.remove();
                        }
                    });
                }, "image/png", .95);
            };
            img.src = dataUrl;
        };
        reader.onerror = err => {
            if (typeof window !== "undefined") {
                window.capturedImageBlob = null;
            }
            if (typeof showInlineMessage === "function") {
                showInlineMessage(document.getElementById("uploadSection"), "Error reading image file", "error");
            }
        };
        reader.readAsDataURL(file);
    }
    clear() {
        const fileInput = document.getElementById("imageFile");
        if (fileInput) {
            fileInput.value = "";
        }
        const uploadPreview = document.getElementById("uploadPreview");
        if (uploadPreview) {
            uploadPreview.style.display = "none";
        }
        const stickerSection = document.getElementById("stickerSection");
        if (stickerSection) {
            stickerSection.style.display = "none";
            const editContainer = document.querySelector(".edit-container");
            if (editContainer) {
                editContainer.classList.remove("has-stickers");
            }
        }
        const mergeButtons = document.getElementById("mergeButtons");
        if (mergeButtons) {
            mergeButtons.style.display = "none";
        }
        const sourceButtons = document.querySelector(".source-buttons");
        if (sourceButtons) {
            sourceButtons.style.display = "flex";
        }
        const fileLabel = document.querySelector(".file-label");
        if (fileLabel) {
            fileLabel.style.display = "block";
        }
        const previewActions = document.querySelector("#uploadPreview .preview-actions");
        if (previewActions) {
            const useImageBtn = previewActions.querySelector("button.btn-primary");
            if (useImageBtn) {
                useImageBtn.style.display = "inline-block";
            }
        }
        if (typeof window !== "undefined") {
            window.capturedImageBlob = null;
            window.capturedImageDataUrl = null;
            window.selectedSticker = null;
        }
        if (typeof clearAllStickers === "function") {
            clearAllStickers();
        }
    }
    proceedToSticker() {
        if (!editState.isEditing()) {
            viewManager.hideBackButton();
        }
        const uploadSection = document.getElementById("uploadSection");
        if (uploadSection) {
            uploadSection.style.display = "block";
            uploadSection.classList.add("active");
        }
        const uploadContainer = document.querySelector("#uploadSection .upload-container");
        if (uploadContainer) {
            uploadContainer.style.display = "block";
        }
        const uploadPreview = document.getElementById("uploadPreview");
        if (uploadPreview) {
            uploadPreview.style.display = "block";
            uploadPreview.style.visibility = "visible";
        }
        const previewWrapper = document.querySelector("#uploadPreview .preview-wrapper");
        if (previewWrapper) {
            previewWrapper.style.display = "block";
            previewWrapper.style.visibility = "visible";
        }
        const previewImg = document.getElementById("uploadPreviewImg");
        if (previewImg && previewImg.src) {
            previewImg.style.display = "block";
            previewImg.style.visibility = "visible";
        }
        const fileLabel = document.querySelector(".file-label");
        if (fileLabel) {
            fileLabel.style.display = "none";
        }
        const previewActions = document.querySelector("#uploadPreview .preview-actions");
        if (previewActions) {
            previewActions.style.display = "none";
            const useImageBtn = previewActions.querySelector("button.btn-primary");
            if (useImageBtn) {
                useImageBtn.style.display = "none";
            }
            const changeBtn = previewActions.querySelector("button.btn-secondary");
            if (changeBtn) {
                changeBtn.style.display = "none";
            }
        }
        const sourceButtons = document.querySelector(".source-buttons");
        if (sourceButtons) {
            sourceButtons.style.display = "none";
        }
        const sourceTabs = document.querySelector(".source-tabs");
        if (sourceTabs) {
            sourceTabs.style.display = "none";
        }
        const stickerSection = document.getElementById("stickerSection");
        if (stickerSection) {
            stickerSection.style.display = "block";
            const editContainer = document.querySelector(".edit-container");
            if (editContainer) {
                editContainer.classList.add("has-stickers");
            }
        }
        const mergeButtons = document.getElementById("mergeButtons");
        if (mergeButtons) {
            mergeButtons.style.display = "block";
        }
        const captionContainer = document.getElementById("captionContainer");
        if (captionContainer) {
            captionContainer.style.display = "none";
        }
        const continueBtn = document.getElementById("continueBtn");
        const postBtn = document.getElementById("postBtn");
        const cancelBtn = document.getElementById("cancelBtn");
        if (continueBtn) {
            continueBtn.style.display = "inline-block";
        }
        if (postBtn) {
            postBtn.style.display = "none";
        }
        if (cancelBtn) {
            cancelBtn.style.display = "inline-block";
        }
        if (typeof window !== "undefined") {
            window.selectedSticker = null;
        }
        setTimeout(() => {
            if (typeof loadStickerCatalogue === "function") {
                loadStickerCatalogue();
            }
        }, 100);
        if (typeof updateMergeButton === "function") {
            updateMergeButton();
        }
    }
}

const fileUploadManager = new FileUploadManager;

window.fileUploadManager = fileUploadManager;