const IMAGE_API = API_CONFIG.IMAGES_API;

if (typeof window !== "undefined") {
    window.STANDARD_WIDTH = 800;
    window.STANDARD_HEIGHT = 1e3;
    window.STANDARD_ASPECT = 4 / 5;
}

const STANDARD_WIDTH = window.STANDARD_WIDTH;

const STANDARD_HEIGHT = window.STANDARD_HEIGHT;

const STANDARD_ASPECT = window.STANDARD_ASPECT;

let selectedSticker = null;

let stream = null;

let currentSource = "webcam";

window.capturedImageBlob = null;

window.capturedImageDataUrl = null;

function switchSource(source) {
    if (!editState.isEditing()) {
        viewManager.showBackButton();
    }
    currentSource = source;
    window.capturedImageBlob = null;
    window.capturedImageDataUrl = null;
    selectedSticker = null;
    document.getElementById("webcamSection").style.display = source === "webcam" ? "block" : "none";
    document.getElementById("uploadSection").style.display = source === "upload" ? "block" : "none";
    document.getElementById("capturePreview").style.display = "none";
    const stickerSection = document.getElementById("stickerSection");
    if (stickerSection) {
        stickerSection.style.display = "none";
        const editContainer = document.querySelector(".edit-container");
        if (editContainer) {
            editContainer.classList.remove("has-stickers");
        }
    }
    document.getElementById("mergeButtons").style.display = "none";
    const stickerPreview = document.getElementById("stickerPreview");
    if (stickerPreview) {
        stickerPreview.style.display = "none";
    }
    if (source === "webcam") {
        const videoWrapper = document.querySelector(".webcam-video-wrapper");
        const video = document.getElementById("webcamVideo");
        if (videoWrapper) {
            videoWrapper.style.display = stream ? "flex" : "none";
        }
        if (video) {
            video.style.display = stream ? "block" : "none";
        }
    }
    if (source === "upload" && stream) {
        stopWebcam();
    }
}

async function startWebcam() {
    await webcamManager.start();
    stream = webcamManager.getStream();
}

function stopWebcam() {
    webcamManager.stop();
    stream = null;
}

async function capturePhoto() {
    const result = await webcamManager.capture();
    if (result) {
        window.capturedImageBlob = result.blob;
        window.capturedImageDataUrl = result.dataUrl;
        const preview = document.getElementById("capturePreview");
        const previewImg = document.getElementById("capturePreviewImg");
        if (preview && previewImg) {
            previewImg.src = result.dataUrl;
            preview.style.display = "block";
            const videoWrapper = document.querySelector(".webcam-video-wrapper");
            if (videoWrapper) videoWrapper.style.display = "none";
            const video = document.getElementById("webcamVideo");
            if (video) video.style.display = "none";
            document.getElementById("captureBtn").style.display = "none";
            const webcamControls = document.querySelector(".webcam-controls");
            if (webcamControls) webcamControls.style.display = "none";
            previewImg.onload = () => {
                const allStickers = [ ...window.activeStickers || [] ];
                const previewContainer = document.getElementById("captureStickerContainer");
                const webcamContainer = document.getElementById("webcamStickerContainer");
                if (previewContainer) previewContainer.innerHTML = "";
                if (webcamContainer) webcamContainer.innerHTML = "";
                window.activeStickers = [];
                const appliedStickerIds = new Set;
                allStickers.forEach(sticker => {
                    if (appliedStickerIds.has(sticker.id) || appliedStickerIds.has(sticker.src + sticker.type)) return;
                    appliedStickerIds.add(sticker.id);
                    appliedStickerIds.add(sticker.src + sticker.type);
                    delete sticker.pending;
                    if (typeof addStickerToPreview === "function") {
                        addStickerToPreview(sticker.src, sticker.type);
                    }
                });
            };
        }
    }
}

function retakePhoto() {
    window.capturedImageBlob = null;
    window.capturedImageDataUrl = null;
    selectedSticker = null;
    const sourceButtons = document.querySelector(".source-buttons");
    if (sourceButtons) {
        sourceButtons.style.display = "flex";
    }
    document.getElementById("capturePreview").style.display = "none";
    const previewImg = document.getElementById("capturePreviewImg");
    if (previewImg) previewImg.src = "";
    startWebcam();
    const stickerSection = document.getElementById("stickerSection");
    if (stickerSection) {
        stickerSection.style.display = "none";
        const editContainer = document.querySelector(".edit-container");
        if (editContainer) editContainer.classList.remove("has-stickers");
    }
    document.getElementById("mergeButtons").style.display = "none";
    if (typeof clearAllStickers === "function") clearAllStickers();
    const captureContainer = document.getElementById("captureStickerContainer");
    const uploadContainer = document.getElementById("uploadStickerContainer");
    if (captureContainer) captureContainer.innerHTML = "";
    if (uploadContainer) uploadContainer.innerHTML = "";
    const previewActions = document.querySelector("#capturePreview .preview-actions");
    if (previewActions) {
        const usePhotoBtn = previewActions.querySelector("button.btn-primary");
        if (usePhotoBtn) usePhotoBtn.style.display = "inline-block";
    }
    const fileLabel = document.querySelector(".file-label");
    if (fileLabel) fileLabel.style.display = "block";
    const captureOverlay = document.getElementById("captureStickerOverlay");
    const uploadOverlay = document.getElementById("uploadStickerOverlay");
    if (captureOverlay) captureOverlay.style.display = "none";
    if (uploadOverlay) uploadOverlay.style.display = "none";
}

function proceedToSticker() {
    if (!editState.isEditing()) {
        viewManager.hideBackButton();
    }
    const webcamSection = document.getElementById("webcamSection");
    if (webcamSection) {
        webcamSection.style.display = "block";
        webcamSection.classList.add("active");
    }
    const webcamContainer = document.querySelector("#webcamSection .webcam-container");
    if (webcamContainer) {
        webcamContainer.style.display = "block";
    }
    const capturePreview = document.getElementById("capturePreview");
    if (capturePreview) {
        capturePreview.style.display = "block";
        capturePreview.style.visibility = "visible";
    }
    const previewWrapper = document.querySelector("#capturePreview .preview-wrapper");
    if (previewWrapper) {
        previewWrapper.style.display = "block";
        previewWrapper.style.visibility = "visible";
    }
    const previewImg = document.getElementById("capturePreviewImg");
    if (previewImg && previewImg.src) {
        previewImg.style.display = "block";
        previewImg.style.visibility = "visible";
    }
    const videoWrapper = document.querySelector(".webcam-video-wrapper");
    const video = document.getElementById("webcamVideo");
    if (videoWrapper) {
        videoWrapper.style.display = "none";
    }
    if (video) {
        video.style.display = "none";
    }
    document.getElementById("startWebcamBtn").style.display = "none";
    document.getElementById("stopWebcamBtn").style.display = "none";
    document.getElementById("captureBtn").style.display = "none";
    const previewActions = document.querySelector("#capturePreview .preview-actions");
    if (previewActions) {
        previewActions.style.display = "none";
    }
    const sourceButtons = document.querySelector(".source-buttons");
    if (sourceButtons) {
        sourceButtons.style.display = "none";
    }
    const sourceTabs = document.querySelector(".source-tabs");
    if (sourceTabs) {
        sourceTabs.style.display = "none";
    }
    const webcamControls = document.querySelector(".webcam-controls");
    if (webcamControls) {
        webcamControls.style.display = "none";
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
    selectedSticker = null;
    setTimeout(() => {
        if (typeof loadStickerCatalogue === "function") {
            loadStickerCatalogue();
        }
    }, 100);
    updateMergeButton();
}

function updateCapturePreviewOverlay() {
    const previewImg = document.getElementById("capturePreviewImg");
    const stickerOverlay = document.getElementById("captureStickerOverlay");
    if (!previewImg || !stickerOverlay) return;
    if (previewImg.src && previewImg.src !== "") {
        const previewWrapper = previewImg.closest(".preview-wrapper");
        if (previewWrapper) {
            previewWrapper.style.display = "block";
        }
        const capturePreview = document.getElementById("capturePreview");
        if (capturePreview) {
            capturePreview.style.display = "block";
        }
    }
    if (selectedSticker) {
        const stickerUrl = typeof API_CONFIG !== "undefined" && API_CONFIG.STICKERS_URL ? `${API_CONFIG.STICKERS_URL}${selectedSticker}` : `/assets/stickers/${selectedSticker}`;
        stickerOverlay.src = stickerUrl;
        stickerOverlay.style.display = "block";
        const updateStickerSize = () => {
            if (previewImg.complete && previewImg.naturalWidth > 0) {
                stickerOverlay.style.width = previewImg.offsetWidth + "px";
                stickerOverlay.style.height = previewImg.offsetHeight + "px";
            }
        };
        if (previewImg.complete) {
            updateStickerSize();
        } else {
            previewImg.onload = updateStickerSize;
        }
        stickerOverlay.onload = function() {
            stickerOverlay.style.opacity = "1";
            updateStickerSize();
        };
        stickerOverlay.onerror = function() {
            stickerOverlay.style.display = "none";
        };
    } else {
        stickerOverlay.style.display = "none";
    }
}

function updateUploadPreviewOverlay() {
    const previewImg = document.getElementById("uploadPreviewImg");
    const stickerOverlay = document.getElementById("uploadStickerOverlay");
    if (!previewImg || !stickerOverlay) return;
    if (previewImg.src && previewImg.src !== "") {
        const previewWrapper = previewImg.closest(".preview-wrapper");
        if (previewWrapper) {
            previewWrapper.style.display = "block";
        }
        const uploadPreview = document.getElementById("uploadPreview");
        if (uploadPreview) {
            uploadPreview.style.display = "block";
        }
    }
    if (selectedSticker) {
        const stickerUrl = typeof API_CONFIG !== "undefined" && API_CONFIG.STICKERS_URL ? `${API_CONFIG.STICKERS_URL}${selectedSticker}` : `/assets/stickers/${selectedSticker}`;
        stickerOverlay.src = stickerUrl;
        stickerOverlay.style.display = "block";
        const updateStickerSize = () => {
            if (previewImg.complete && previewImg.naturalWidth > 0) {
                stickerOverlay.style.width = previewImg.offsetWidth + "px";
                stickerOverlay.style.height = previewImg.offsetHeight + "px";
            }
        };
        if (previewImg.complete) {
            updateStickerSize();
        } else {
            previewImg.onload = updateStickerSize;
        }
        stickerOverlay.onload = function() {
            stickerOverlay.style.opacity = "1";
            updateStickerSize();
        };
        stickerOverlay.onerror = function() {
            stickerOverlay.style.display = "none";
        };
    } else {
        stickerOverlay.style.display = "none";
    }
}

function selectSticker(stickerName) {
    selectedSticker = stickerName;
    document.querySelectorAll(".sticker-item").forEach(item => {
        item.classList.remove("selected");
    });
    const stickerItem = document.querySelector(`[data-sticker="${stickerName}"]`);
    if (stickerItem) {
        stickerItem.classList.add("selected");
    }
    const stickerMessage = document.getElementById("stickerMessage");
    if (stickerMessage) {
        stickerMessage.textContent = `Selected: ${stickerName}`;
        stickerMessage.style.color = "#28a745";
    }
    updateCapturePreviewOverlay();
    updateUploadPreviewOverlay();
    updateMergeButton();
}

function updateCaptureButtonState() {
    const captureBtn = document.getElementById("captureBtn");
    if (!captureBtn) return;
    const stickers = window.activeStickers || [];
    const hasSticker = stickers.length > 0;
    captureBtn.disabled = !hasSticker;
    if (hasSticker) {
        captureBtn.title = "Click to capture photo";
        captureBtn.style.opacity = "1";
        captureBtn.style.cursor = "pointer";
    } else {
        captureBtn.title = "Please select a sticker, filter, or frame first";
        captureBtn.style.opacity = "0.6";
        captureBtn.style.cursor = "not-allowed";
    }
}

function updateMergeButton() {
    const mergeBtn = document.getElementById("mergeBtn");
    if (mergeBtn) {
        mergeBtn.disabled = false;
        const stickers = window.activeStickers || [];
        if (stickers && stickers.length > 0) {
            mergeBtn.textContent = `💾 Save Image (${stickers.length} ${stickers.length === 1 ? "sticker" : "stickers"})`;
        } else {
            mergeBtn.textContent = "💾 Save Image";
        }
    }
}

function showCaptionSection() {
    const captionContainer = document.getElementById("captionContainer");
    const continueBtn = document.getElementById("continueBtn");
    const postBtn = document.getElementById("postBtn");
    const mergeBtn = document.getElementById("mergeBtn");
    if (typeof disableAllStickerInteractions === "function") {
        disableAllStickerInteractions();
    }
    const stickerSection = document.getElementById("stickerSection");
    if (stickerSection) {
        stickerSection.style.display = "none";
        const editContainer = document.querySelector(".edit-container");
        if (editContainer) {
            editContainer.classList.remove("has-stickers");
        }
    }
    if (mergeBtn) {
        mergeBtn.style.display = "none";
    }
    if (captionContainer) {
        captionContainer.style.display = "block";
    }
    if (continueBtn) {
        continueBtn.style.display = "none";
    }
    if (postBtn) {
        postBtn.style.display = "inline-block";
    }
    const cancelBtn = document.getElementById("cancelBtn");
    if (cancelBtn) {
        cancelBtn.style.display = "inline-block";
    }
}

async function saveAndPost() {
    await imageActionManager.saveAndPost();
}

function handleFileSelect(event) {
    fileUploadManager.handleSelect(event, (blob, dataUrl) => {
        window.capturedImageBlob = blob;
        window.capturedImageDataUrl = dataUrl;
    });
}

function clearUpload() {
    fileUploadManager.clear();
}

function proceedToStickerFromUpload() {
    fileUploadManager.proceedToSticker();
}

async function mergeAndUpload() {
    await imageActionManager.mergeAndUpload();
}

async function deleteImage(imageId, buttonElement) {
    await imageActionManager.delete(imageId, buttonElement);
}

function resetEditForm() {
    window.capturedImageBlob = null;
    window.capturedImageDataUrl = null;
    selectedSticker = null;
    editState.setCreateMode();
    if (typeof clearAllStickers === "function") {
        clearAllStickers();
    }
    viewManager.resetFormUI();
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    const videoWrapper = document.querySelector(".webcam-video-wrapper");
    const video = document.getElementById("webcamVideo");
    const startBtn = document.getElementById("startWebcamBtn");
    const stopBtn = document.getElementById("stopWebcamBtn");
    const captureBtn = document.getElementById("captureBtn");
    if (currentSource === "webcam") {
        if (videoWrapper) {
            videoWrapper.style.display = "none";
        }
        if (video) {
            video.style.display = "none";
            video.srcObject = null;
        }
        if (startBtn) {
            startBtn.style.display = "inline-block";
        }
        if (stopBtn) {
            stopBtn.style.display = "none";
        }
        if (captureBtn) {
            captureBtn.style.display = "none";
        }
    } else {
        if (videoWrapper) {
            videoWrapper.style.display = "none";
        }
        if (video) {
            video.style.display = "none";
            video.srcObject = null;
        }
    }
    const fileInput = document.getElementById("imageFile");
    if (fileInput) {
        fileInput.value = "";
    }
    const fileLabel = document.querySelector(".file-label");
    if (fileLabel) {
        fileLabel.style.display = "block";
    }
    const mergeBtn = document.getElementById("mergeBtn");
    if (mergeBtn) {
        mergeBtn.textContent = "💾 Save Image";
    }
    const previewContainer = document.getElementById("imagePreviewContainer");
    if (previewContainer) {
        previewContainer.style.display = "none";
    }
    const editMainSection = document.querySelector(".edit-main-section");
    if (editMainSection) {
        const sourceButtons = editMainSection.querySelector(".source-buttons");
        if (sourceButtons) sourceButtons.style.display = "flex";
        const sourceTabs = editMainSection.querySelector(".source-tabs");
        if (sourceTabs) sourceTabs.style.display = "none";
    }
    const webcamControls = document.querySelector(".webcam-controls");
    if (webcamControls) {
        webcamControls.style.display = "flex";
    }
    if (currentSource === "webcam") {
        const webcamSection = document.getElementById("webcamSection");
        if (webcamSection) {
            webcamSection.style.display = "block";
        }
    }
    if (currentSource === "upload") {
        const uploadSection = document.getElementById("uploadSection");
        if (uploadSection) {
            uploadSection.style.display = "block";
        }
    }
}

async function postImage(imageId, buttonElement) {
    await imageActionManager.post(imageId, buttonElement);
}

async function editImage(imageId) {
    await imageActionManager.edit(imageId);
}

async function filterImages(filter) {
    await userImagesManager.filter(filter);
}

function showImagePreview(image) {
    imagePreviewManager.show(image);
}

async function postPreviewImage() {
    await imagePreviewManager.post();
}

async function editPreviewImage() {
    await imagePreviewManager.edit();
}

async function deletePreviewImage() {
    await imagePreviewManager.delete();
}

async function savePreviewEdit() {
    await imagePreviewManager.saveEdit();
}

async function saveAndPostPreviewEdit() {
    await imagePreviewManager.saveAndPost();
}

async function loadUserImages() {
    await userImagesManager.load();
}

function backToImagesList() {
    viewManager.showImagesView();
    editState.clearPreviewImage();
    const currentFilter = userImagesManager.getCurrentFilter();
    if (currentFilter) {
        filterImages(currentFilter);
    }
}

function showImagesView() {
    viewManager.showImagesView();
    editState.setCreateMode();
}

window.switchSource = switchSource;

window.showImagesView = showImagesView;

window.backToImagesList = backToImagesList;

window.startWebcam = startWebcam;

window.stopWebcam = stopWebcam;

window.deleteImage = deleteImage;

window.postImage = postImage;

window.editImage = editImage;

window.capturePhoto = capturePhoto;

window.retakePhoto = retakePhoto;

window.proceedToSticker = proceedToSticker;

window.proceedToStickerFromUpload = proceedToStickerFromUpload;

window.selectSticker = selectSticker;

window.handleFileSelect = handleFileSelect;

window.clearUpload = clearUpload;

window.mergeAndUpload = mergeAndUpload;

window.saveAndPost = saveAndPost;

window.loadUserImages = loadUserImages;

window.resetEditForm = resetEditForm;

window.filterImages = filterImages;

window.showImagePreview = showImagePreview;

window.postPreviewImage = postPreviewImage;

window.editPreviewImage = editPreviewImage;

window.deletePreviewImage = deletePreviewImage;

window.savePreviewEdit = savePreviewEdit;

window.saveAndPostPreviewEdit = saveAndPostPreviewEdit;

window.updateCaptureButtonState = updateCaptureButtonState;

window.updateMergeButton = updateMergeButton;

window.showCaptionSection = showCaptionSection;

window.updateCapturePreviewOverlay = updateCapturePreviewOverlay;

window.updateUploadPreviewOverlay = updateUploadPreviewOverlay;