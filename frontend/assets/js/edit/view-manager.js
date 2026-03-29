function getViewElements() {
    return {
        create: document.getElementById("createSection"),
        images: document.getElementById("imagesSection"),
        preview: document.getElementById("imagePreviewContainer"),
        backBtn: document.getElementById("backToImagesBtn"),
        sourceTabs: document.querySelector(".source-tabs"),
        webcamSection: document.getElementById("webcamSection"),
        uploadSection: document.getElementById("uploadSection"),
        stickerSection: document.getElementById("stickerSection"),
        mergeButtons: document.getElementById("mergeButtons"),
        previewBackBtn: document.getElementById("previewBackBtn")
    };
}

function hideAllViews() {
    const views = getViewElements();
    if (views.create) views.create.style.display = "none";
    if (views.images) views.images.style.display = "none";
    if (views.preview) views.preview.style.display = "none";
}

function showCreateView(options = {}) {
    hideAllViews();
    const el = getViewElements();
    if (el.create) {
        el.create.style.display = "block";
    }
    const sourceButtons = document.querySelector(".source-buttons");
    if (sourceButtons) {
        sourceButtons.style.display = options.hideSourceButtons ? "none" : "flex";
        if (el.mergeButtons && !options.hideSourceButtons) {
            el.mergeButtons.style.display = "none";
        }
    }
    if (el.sourceTabs) {
        el.sourceTabs.style.display = "none";
    }
    if (el.webcamSection) {
        el.webcamSection.style.display = options.showWebcam ? "block" : "none";
    }
    if (el.uploadSection) {
        el.uploadSection.style.display = options.showUpload ? "block" : "none";
    }
    if (el.stickerSection) {
        el.stickerSection.style.display = options.showStickers ? "block" : "none";
        if (options.showStickers) {
            const editContainer = document.querySelector(".edit-container");
            if (editContainer) {
                editContainer.classList.add("has-stickers");
            }
        }
    }
    if (el.mergeButtons) {
        el.mergeButtons.style.display = options.showMergeButtons ? "flex" : "none";
    }
    if (el.backBtn) {
        el.backBtn.style.display = options.showBackBtn ? "block" : "none";
    }
}

function showImagesView() {
    hideAllViews();
    const el = getViewElements();
    if (el.images) {
        el.images.style.display = "block";
    }
    if (el.backBtn) {
        el.backBtn.style.display = "none";
    }
}

function showPreviewView(options = {}) {
    hideAllViews();
    const el = getViewElements();
    if (el.preview) {
        el.preview.style.display = "block";
    }
    if (el.sourceTabs) el.sourceTabs.style.display = "none";
    if (el.webcamSection) el.webcamSection.style.display = "none";
    if (el.uploadSection) el.uploadSection.style.display = "none";
    if (el.mergeButtons) el.mergeButtons.style.display = "none";
    if (el.stickerSection) {
        el.stickerSection.style.display = "none";
        const editContainer = document.querySelector(".edit-container");
        if (editContainer) {
            editContainer.classList.remove("has-stickers");
        }
    }
    if (el.backBtn) {
        el.backBtn.style.display = "none";
    }
    if (el.previewBackBtn) {
        el.previewBackBtn.style.display = options.showBackBtn ? "block" : "none";
    }
}

function showBackButton() {
    const el = getViewElements();
    if (el.backBtn) {
        el.backBtn.style.display = "block";
    }
}

function hideBackButton() {
    const el = getViewElements();
    if (el.backBtn) {
        el.backBtn.style.display = "none";
    }
}

function showStickerSection() {
    const el = getViewElements();
    if (el.stickerSection) {
        el.stickerSection.style.display = "block";
        const editContainer = document.querySelector(".edit-container");
        if (editContainer) {
            editContainer.classList.add("has-stickers");
        }
    }
}

function hideStickerSection() {
    const el = getViewElements();
    if (el.stickerSection) {
        el.stickerSection.style.display = "none";
        const editContainer = document.querySelector(".edit-container");
        if (editContainer) {
            editContainer.classList.remove("has-stickers");
        }
    }
}

function showMergeButtons() {
    const el = getViewElements();
    if (el.mergeButtons) {
        el.mergeButtons.style.display = "flex";
    }
}

function hideMergeButtons() {
    const el = getViewElements();
    if (el.mergeButtons) {
        el.mergeButtons.style.display = "none";
    }
}

function resetFormUI() {
    const sourceButtons = document.querySelector(".source-buttons");
    if (sourceButtons) {
        sourceButtons.style.display = "flex";
        const el = getViewElements();
        if (el.mergeButtons) {
            el.mergeButtons.style.display = "none";
        }
    }
    const capturePreview = document.getElementById("capturePreview");
    const uploadPreview = document.getElementById("uploadPreview");
    if (capturePreview) capturePreview.style.display = "none";
    if (uploadPreview) uploadPreview.style.display = "none";
    const captureContainer = document.getElementById("captureStickerContainer");
    const uploadContainer = document.getElementById("uploadStickerContainer");
    if (captureContainer) captureContainer.innerHTML = "";
    if (uploadContainer) uploadContainer.innerHTML = "";
    const el = getViewElements();
    if (el.stickerSection) {
        el.stickerSection.style.display = "none";
        const editContainer = document.querySelector(".edit-container");
        if (editContainer) {
            editContainer.classList.remove("has-stickers");
        }
    }
    if (el.mergeButtons) el.mergeButtons.style.display = "none";
    const captionContainer = document.getElementById("captionContainer");
    if (captionContainer) captionContainer.style.display = "none";
    const continueBtn = document.getElementById("continueBtn");
    const postBtn = document.getElementById("postBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    if (continueBtn) continueBtn.style.display = "inline-block";
    if (postBtn) postBtn.style.display = "none";
    if (cancelBtn) cancelBtn.style.display = "inline-block";
    const capturePreviewActions = document.querySelector("#capturePreview .preview-actions");
    if (capturePreviewActions) {
        capturePreviewActions.style.display = "flex";
        const usePhotoBtn = capturePreviewActions.querySelector("button.btn-primary");
        if (usePhotoBtn) usePhotoBtn.style.display = "inline-block";
    }
    const uploadPreviewActions = document.querySelector("#uploadPreview .preview-actions");
    if (uploadPreviewActions) {
        uploadPreviewActions.style.display = "flex";
        const useImageBtn = uploadPreviewActions.querySelector("button.btn-primary");
        if (useImageBtn) useImageBtn.style.display = "inline-block";
    }
    const captionInput = document.getElementById("imageCaption");
    if (captionInput) {
        captionInput.value = "";
        const charCount = document.getElementById("captionCharCount");
        if (charCount) charCount.textContent = "0";
    }
    const previewCaptionInput = document.getElementById("previewImageCaption");
    if (previewCaptionInput) {
        previewCaptionInput.value = "";
        const previewCharCount = document.getElementById("previewCaptionCharCount");
        if (previewCharCount) previewCharCount.textContent = "0";
    }
    const previewCaptionContainer = document.getElementById("previewCaptionContainer");
    if (previewCaptionContainer) {
        previewCaptionContainer.style.display = "none";
    }
}

const viewManager = {
    showCreateView: showCreateView,
    showImagesView: showImagesView,
    showPreviewView: showPreviewView,
    showBackButton: showBackButton,
    hideBackButton: hideBackButton,
    showStickerSection: showStickerSection,
    hideStickerSection: hideStickerSection,
    showMergeButtons: showMergeButtons,
    hideMergeButtons: hideMergeButtons,
    resetFormUI: resetFormUI
};

window.viewManager = viewManager;