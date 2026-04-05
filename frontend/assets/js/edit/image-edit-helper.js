function configureUIForEdit() {
    const createSection = document.getElementById("createSection");
    const imagesSection = document.getElementById("imagesSection");
    if (createSection) {
        createSection.style.display = "block";
    }
    if (imagesSection) {
        imagesSection.style.display = "none";
    }
    viewManager.showBackButton();
    const sourceButtons = document.querySelector(".source-buttons");
    if (sourceButtons) {
        sourceButtons.style.display = "none";
    }
    const sourceTabs = document.querySelector(".source-tabs");
    if (sourceTabs) {
        sourceTabs.style.display = "none";
    }
    const webcamSection = document.getElementById("webcamSection");
    const uploadSection = document.getElementById("uploadSection");
    if (webcamSection) webcamSection.style.display = "none";
    if (uploadSection) uploadSection.style.display = "block";
    const previewContainer = document.getElementById("imagePreviewContainer");
    if (previewContainer) {
        previewContainer.style.display = "none";
    }
}

function setupUploadPreviewForEdit() {
    const uploadPreview = document.getElementById("uploadPreview");
    const fileLabel = document.querySelector(".file-label");
    const previewActions = document.querySelector("#uploadPreview .preview-actions");
    if (fileLabel) {
        fileLabel.style.display = "none";
    }
    if (previewActions) {
        previewActions.style.display = "none";
    }
    if (uploadPreview) {
        uploadPreview.style.display = "block";
    }
}

function setupStickerSectionForEdit(image) {
    if (typeof setWebcamStickerFiltersUnlocked === "function") {
        setWebcamStickerFiltersUnlocked(true);
    }
    const stickerSection = document.getElementById("stickerSection");
    if (stickerSection) {
        stickerSection.style.display = "block";
        const editContainer = document.querySelector(".edit-container");
        if (editContainer) {
            editContainer.classList.add("has-stickers");
        }
    }
}

function setupMergeButtonsForEdit() {
    const mergeButtons = document.getElementById("mergeButtons");
    if (mergeButtons) {
        mergeButtons.style.display = "block";
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
    const mergeBtn = document.getElementById("mergeBtn");
    if (mergeBtn) {
        mergeBtn.textContent = "Save";
    }
}

function loadCaption(caption) {
    const captionContainer = document.getElementById("captionContainer");
    if (captionContainer) {
        captionContainer.style.display = "none";
    }
    const imageCaption = document.getElementById("imageCaption");
    if (imageCaption) {
        imageCaption.value = caption || "";
        const charCount = document.getElementById("captionCharCount");
        if (charCount) charCount.textContent = (caption || "").length;
    }
}

function clearAllStickerContainers() {
    if (typeof clearAllStickers === "function") {
        clearAllStickers();
    }
    const allStickerContainers = [ document.getElementById("captureStickerContainer"), document.getElementById("uploadStickerContainer"), document.getElementById("previewStickerContainer") ];
    allStickerContainers.forEach(container => {
        if (container) {
            container.innerHTML = "";
        }
    });
}

window.ImageEditHelper = {
    configureUIForEdit: configureUIForEdit,
    setupUploadPreviewForEdit: setupUploadPreviewForEdit,
    setupStickerSectionForEdit: setupStickerSectionForEdit,
    setupMergeButtonsForEdit: setupMergeButtonsForEdit,
    loadCaption: loadCaption,
    clearAllStickerContainers: clearAllStickerContainers
};