const STICKER_BASE_URL = typeof API_CONFIG !== "undefined" && API_CONFIG.STICKERS_URL ? API_CONFIG.STICKERS_URL : "/assets/stickers/";

let activeStickers = [];

window.activeStickers = activeStickers;

const STICKER_CATALOGUE = {
    stickers: [ {
        id: "heart",
        name: "Heart",
        src: "heart.png",
        type: "decoration"
    }, {
        id: "star",
        name: "Star",
        src: "star.png",
        type: "decoration"
    }, {
        id: "smile",
        name: "Smile",
        src: "smile.png",
        type: "emoji"
    }, {
        id: "fire",
        name: "Fire",
        src: "fire.png",
        type: "decoration"
    }, {
        id: "crown",
        name: "Crown",
        src: "crown.png",
        type: "decoration"
    }, {
        id: "sparkles",
        name: "Sparkles",
        src: "sparkles.png",
        type: "decoration"
    }, {
        id: "sun",
        name: "Sun",
        src: "sun.png",
        type: "decoration"
    }, {
        id: "moon",
        name: "Moon",
        src: "moon.png",
        type: "decoration"
    }, {
        id: "lightning",
        name: "Lightning",
        src: "lightning.png",
        type: "decoration"
    }, {
        id: "flower",
        name: "Flower",
        src: "flower.png",
        type: "decoration"
    } ],
    filters: [ {
        id: "vintage",
        name: "Vintage",
        src: "filter_vintage.png",
        type: "filter"
    }, {
        id: "sepia",
        name: "Sepia",
        src: "filter_sepia.png",
        type: "filter"
    }, {
        id: "blur",
        name: "Blur",
        src: "filter_blur.png",
        type: "filter"
    }, {
        id: "warm",
        name: "Warm",
        src: "filter_warm.png",
        type: "filter"
    }, {
        id: "cool",
        name: "Cool",
        src: "filter_cool.png",
        type: "filter"
    }, {
        id: "dramatic",
        name: "Dramatic",
        src: "filter_dramatic.png",
        type: "filter"
    }, {
        id: "soft",
        name: "Soft",
        src: "filter_soft.png",
        type: "filter"
    }, {
        id: "vibrant",
        name: "Vibrant",
        src: "filter_vibrant.png",
        type: "filter"
    }, {
        id: "matte",
        name: "Matte",
        src: "filter_matte.png",
        type: "filter"
    }, {
        id: "cinematic",
        name: "Cinematic",
        src: "filter_cinematic.png",
        type: "filter"
    }, {
        id: "blue",
        name: "Blue",
        src: "filter_blue.png",
        type: "filter"
    }, {
        id: "pink",
        name: "Pink",
        src: "filter_pink.png",
        type: "filter"
    } ],
    frames: [ {
        id: "sticker4",
        name: "Floral Frame",
        src: "sticker4.png",
        type: "frame"
    }, {
        id: "sticker5",
        name: "Vintage Frame",
        src: "sticker5.png",
        type: "frame"
    }, {
        id: "sticker8",
        name: "Wooden Frame",
        src: "sticker8.png",
        type: "frame"
    }, {
        id: "sticker9",
        name: "Neon Frame",
        src: "sticker9.png",
        type: "frame"
    }, {
        id: "sticker11",
        name: "Snow Frame",
        src: "sticker11.png",
        type: "frame"
    }, {
        id: "sticker12",
        name: "City Frame",
        src: "sticker12.png",
        type: "frame"
    }, {
        id: "sticker13",
        name: "Sunset Frame",
        src: "sticker13.png",
        type: "frame"
    }, {
        id: "sticker14",
        name: "Neon Punk Frame",
        src: "sticker14.png",
        type: "frame"
    } ]
};

function getCurrentStickerContainer() {
    const previewContainer = document.getElementById("imagePreviewContainer");
    const capturePreview = document.getElementById("capturePreview");
    const uploadPreview = document.getElementById("uploadPreview");
    const webcamVideo = document.getElementById("webcamVideo");
    const webcamVideoWrapper = document.querySelector(".webcam-video-wrapper");
    if (webcamVideo && webcamVideoWrapper && webcamVideo.style.display !== "none" && webcamVideoWrapper.style.display !== "none" && webcamVideo.videoWidth > 0) {
        return document.getElementById("webcamStickerContainer");
    }
    if (previewContainer && previewContainer.style.display !== "none") {
        return document.getElementById("previewStickerContainer");
    } else if (capturePreview && capturePreview.style.display !== "none") {
        return document.getElementById("captureStickerContainer");
    } else if (uploadPreview && uploadPreview.style.display !== "none") {
        return document.getElementById("uploadStickerContainer");
    }
    return null;
}

function getCurrentPreviewImage() {
    const previewContainer = document.getElementById("imagePreviewContainer");
    const capturePreview = document.getElementById("capturePreview");
    const uploadPreview = document.getElementById("uploadPreview");
    const webcamVideo = document.getElementById("webcamVideo");
    const webcamVideoWrapper = document.querySelector(".webcam-video-wrapper");
    if (webcamVideo && webcamVideoWrapper && webcamVideo.style.display !== "none" && webcamVideoWrapper.style.display !== "none" && webcamVideo.videoWidth > 0) {
        return webcamVideo;
    }
    if (previewContainer && previewContainer.style.display !== "none") {
        return document.getElementById("previewImage");
    } else if (capturePreview && capturePreview.style.display !== "none") {
        return document.getElementById("capturePreviewImg");
    } else if (uploadPreview && uploadPreview.style.display !== "none") {
        return document.getElementById("uploadPreviewImg");
    }
    return null;
}

function addStickerToPreview(stickerSrc, stickerType = "sticker") {
    const container = getCurrentStickerContainer();
    const previewImg = getCurrentPreviewImage();
    if (!container || !previewImg) {
        const stickerId = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        activeStickers.push({
            id: stickerId,
            src: stickerSrc,
            type: stickerType,
            pending: true,
            x: 0,
            y: 0,
            width: 100,
            height: 100
        });
        window.activeStickers = activeStickers;
        if (typeof updateCaptureButtonState === "function") {
            updateCaptureButtonState();
        }
        updateAppliedStickersList();
        return stickerId;
    }
    if (stickerType === "filter") {
        const existingFilters = activeStickers.filter(s => s.type === "filter");
        existingFilters.forEach(filter => {
            removeSticker(filter.id);
        });
    }
    if (stickerType === "frame") {
        const existingFrames = activeStickers.filter(s => s.type === "frame");
        existingFrames.forEach(frame => {
            removeSticker(frame.id);
        });
    }
    if (container) {
        const existingStickers = container.querySelectorAll(".draggable-sticker");
        for (const existing of existingStickers) {
            if (existing.dataset.src === stickerSrc && existing.dataset.type === stickerType) {
                const existingId = existing.id;
                if (!activeStickers.some(s => s.id === existingId)) {
                    const existingSticker = activeStickers.find(s => s.src === stickerSrc && s.type === stickerType);
                    if (existingSticker) {
                        existingSticker.id = existingId;
                    }
                }
                return existingId;
            }
        }
    }
    const alreadyExists = activeStickers.some(s => s.src === stickerSrc && s.type === stickerType && !s.pending);
    if (alreadyExists && container && previewImg) {
        const existing = activeStickers.find(s => s.src === stickerSrc && s.type === stickerType && !s.pending);
        if (existing) {
            const existingEl = container.querySelector(`#${existing.id}`);
            if (existingEl) {
                return existing.id;
            }
        }
    }
    const stickerId = `sticker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const stickerEl = document.createElement("div");
    stickerEl.className = "draggable-sticker";
    stickerEl.id = stickerId;
    stickerEl.dataset.type = stickerType;
    stickerEl.dataset.src = stickerSrc;
    const isFilter = stickerType === "filter";
    const isFrame = stickerType === "frame";
    if (isFilter) {
        stickerEl.style.width = "100%";
        stickerEl.style.height = "100%";
        stickerEl.style.left = "0";
        stickerEl.style.top = "0";
        stickerEl.style.transform = "none";
        stickerEl.style.position = "absolute";
        stickerEl.style.pointerEvents = "none";
    } else if (isFrame) {
        const updateFrameSize = () => {
            if (!stickerEl.parentElement) return;
            const currentImg = getCurrentPreviewImage();
            if (!currentImg) return;
            const currentContainer = getCurrentStickerContainer();
            if (!currentContainer) return;
            const imageRect = currentImg.getBoundingClientRect();
            const containerRect = currentContainer.getBoundingClientRect();
            const naturalWidth = currentImg.naturalWidth || currentImg.videoWidth || 800;
            const naturalHeight = currentImg.naturalHeight || currentImg.videoHeight || 1e3;
            const offsetX = imageRect.left - containerRect.left;
            const offsetY = imageRect.top - containerRect.top;
            const frameWidth = imageRect.width;
            const frameHeight = imageRect.height;
            const maxWidth = containerRect.width - offsetX;
            const maxHeight = containerRect.height - offsetY;
            const finalWidth = Math.min(frameWidth, maxWidth);
            const finalHeight = Math.min(frameHeight, maxHeight);
            stickerEl.style.setProperty("width", finalWidth + "px", "important");
            stickerEl.style.setProperty("height", finalHeight + "px", "important");
            stickerEl.style.setProperty("left", offsetX + "px", "important");
            stickerEl.style.setProperty("top", offsetY + "px", "important");
            stickerEl.style.setProperty("transform", "none", "important");
            stickerEl.style.setProperty("box-sizing", "border-box", "important");
            stickerEl.style.setProperty("overflow", "visible", "important");
        };
        const attemptUpdate = (attempts = 0) => {
            if (attempts < 5) {
                updateFrameSize();
                setTimeout(() => attemptUpdate(attempts + 1), 50);
            }
        };
        attemptUpdate();
        if (previewImg.tagName === "VIDEO") {
            if (previewImg.readyState >= 2) {
                setTimeout(() => attemptUpdate(), 100);
            } else {
                previewImg.addEventListener("loadedmetadata", () => {
                    setTimeout(() => attemptUpdate(), 100);
                }, {
                    once: true
                });
            }
        } else {
            if (previewImg.complete) {
                setTimeout(() => attemptUpdate(), 100);
            } else {
                previewImg.addEventListener("load", () => {
                    setTimeout(() => attemptUpdate(), 100);
                }, {
                    once: true
                });
            }
        }
        const resizeHandler = () => {
            setTimeout(() => attemptUpdate(), 50);
        };
        window.addEventListener("resize", resizeHandler);
        stickerEl._resizeHandler = resizeHandler;
        stickerEl.style.transform = "none";
        stickerEl.style.position = "absolute";
        stickerEl.style.pointerEvents = "none";
    } else {
        const previewWidth = previewImg.offsetWidth || previewImg.naturalWidth || 640;
        const initialSize = Math.max(80, Math.min(200, previewWidth * .2));
        stickerEl.style.width = initialSize + "px";
        stickerEl.style.height = initialSize + "px";
        stickerEl.style.left = "50%";
        stickerEl.style.top = "50%";
        stickerEl.style.transform = "translate(-50%, -50%)";
    }
    const stickerImg = document.createElement("img");
    stickerImg.src = STICKER_BASE_URL + stickerSrc;
    stickerImg.alt = stickerSrc;
    stickerImg.draggable = false;
    stickerImg.style.display = "block";
    stickerImg.style.visibility = "visible";
    stickerImg.style.opacity = "1";
    if (isFilter) {
        stickerImg.style.width = "100%";
        stickerImg.style.height = "100%";
        stickerImg.style.objectFit = "cover";
    } else if (isFrame) {
        stickerImg.style.width = "100%";
        stickerImg.style.height = "100%";
        stickerImg.style.objectFit = "cover";
        stickerImg.style.display = "block";
        stickerImg.style.position = "absolute";
        stickerImg.style.top = "0";
        stickerImg.style.left = "0";
        stickerImg.style.margin = "0";
        stickerImg.style.padding = "0";
    } else {
        stickerImg.style.width = "100%";
        stickerImg.style.height = "100%";
        stickerImg.style.objectFit = "contain";
    }
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "sticker-delete";
    deleteBtn.innerHTML = "×";
    deleteBtn.setAttribute("data-sticker-id", stickerId);
    deleteBtn.onclick = e => {
        e.stopPropagation();
        e.preventDefault();
        const id = e.target.getAttribute("data-sticker-id") || stickerId;
        if (typeof window.removeSticker === "function") {
            window.removeSticker(id);
        } else if (typeof removeSticker === "function") {
            removeSticker(id);
        }
    };
    if (isFilter || isFrame) {
        deleteBtn.style.display = "none";
    }
    stickerEl.appendChild(stickerImg);
    stickerEl.appendChild(deleteBtn);
    if (!isFilter && !isFrame) {
        const resizeHandle = document.createElement("div");
        resizeHandle.className = "sticker-resize-handle";
        stickerEl.appendChild(resizeHandle);
    }
    container.appendChild(stickerEl);
    if (!isFilter && !isFrame) {
        makeStickerDraggable(stickerEl);
        makeStickerResizable(stickerEl);
    }
    const containerRect = container.getBoundingClientRect();
    if (isFilter || isFrame) {
        activeStickers.push({
            id: stickerId,
            src: stickerSrc,
            type: stickerType,
            x: 0,
            y: 0,
            width: 100,
            height: 100
        });
    } else {
        const previewWidth = previewImg.offsetWidth || previewImg.naturalWidth || previewImg.videoWidth || 640;
        const initialSize = Math.max(80, Math.min(200, previewWidth * .2));
        activeStickers.push({
            id: stickerId,
            src: stickerSrc,
            type: stickerType,
            x: 50,
            y: 50,
            width: initialSize,
            height: initialSize
        });
    }
    window.activeStickers = activeStickers;
    updateAppliedStickersList();
    if (typeof updateMergeButton === "function") {
        updateMergeButton();
    }
    if (typeof updateCaptureButtonState === "function") {
        updateCaptureButtonState();
    }
    return stickerId;
}

function removeSticker(stickerId) {
    const stickerEl = document.getElementById(stickerId);
    if (stickerEl) {
        if (stickerEl._resizeHandler) {
            window.removeEventListener("resize", stickerEl._resizeHandler);
            delete stickerEl._resizeHandler;
        }
        stickerEl.remove();
    }
    activeStickers = activeStickers.filter(s => s.id !== stickerId);
    window.activeStickers = activeStickers;
    updateAppliedStickersList();
    if (typeof updateMergeButton === "function") {
        updateMergeButton();
    }
    if (typeof updateCaptureButtonState === "function") {
        updateCaptureButtonState();
    }
}

window.removeSticker = removeSticker;

function disableAllStickerInteractions() {
    const allStickers = document.querySelectorAll(".draggable-sticker");
    allStickers.forEach(stickerEl => {
        stickerEl.dataset.disabled = "true";
        stickerEl.style.cursor = "default";
        const resizeHandle = stickerEl.querySelector(".sticker-resize-handle");
        if (resizeHandle) {
            resizeHandle.style.display = "none";
        }
        const deleteBtn = stickerEl.querySelector(".sticker-delete");
        if (deleteBtn) {
            deleteBtn.style.display = "none";
        }
    });
}

window.disableAllStickerInteractions = disableAllStickerInteractions;

function makeStickerDraggable(stickerEl) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    function getEventCoordinates(e) {
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
        return {
            x: e.clientX,
            y: e.clientY
        };
    }
    function startDrag(e) {
        if (stickerEl.dataset.disabled === "true") {
            return;
        }
        if (e.target.classList.contains("sticker-delete") || e.target.classList.contains("sticker-resize-handle")) {
            return;
        }
        isDragging = true;
        stickerEl.style.cursor = "grabbing";
        const rect = stickerEl.parentElement.getBoundingClientRect();
        const stickerRect = stickerEl.getBoundingClientRect();
        const coords = getEventCoordinates(e);
        startX = coords.x;
        startY = coords.y;
        startLeft = stickerRect.left - rect.left;
        startTop = stickerRect.top - rect.top;
        e.preventDefault();
        e.stopPropagation();
    }
    function handleMove(e) {
        if (!isDragging) return;
        const container = stickerEl.parentElement;
        const containerRect = container.getBoundingClientRect();
        const stickerRect = stickerEl.getBoundingClientRect();
        const coords = getEventCoordinates(e);
        let newLeft = startLeft + (coords.x - startX);
        let newTop = startTop + (coords.y - startY);
        newLeft = Math.max(0, Math.min(newLeft, containerRect.width - stickerRect.width));
        newTop = Math.max(0, Math.min(newTop, containerRect.height - stickerRect.height));
        stickerEl.style.left = newLeft + "px";
        stickerEl.style.top = newTop + "px";
        stickerEl.style.transform = "none";
        const stickerId = stickerEl.id;
        const sticker = activeStickers.find(s => s.id === stickerId);
        if (sticker) {
            sticker.x = newLeft / containerRect.width * 100;
            sticker.y = newTop / containerRect.height * 100;
            const currentWidth = parseFloat(stickerEl.style.width) || stickerEl.offsetWidth;
            const currentHeight = parseFloat(stickerEl.style.height) || stickerEl.offsetHeight;
            sticker.width = currentWidth / containerRect.width * 100;
            sticker.height = currentHeight / containerRect.height * 100;
        }
        e.preventDefault();
    }
    function endDrag() {
        if (isDragging) {
            isDragging = false;
            stickerEl.style.cursor = "grab";
        }
    }
    stickerEl.addEventListener("mousedown", startDrag);
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", endDrag);
    stickerEl.addEventListener("touchstart", startDrag, {
        passive: false
    });
    document.addEventListener("touchmove", handleMove, {
        passive: false
    });
    document.addEventListener("touchend", endDrag);
    document.addEventListener("touchcancel", endDrag);
}

function makeStickerResizable(stickerEl) {
    let isResizing = false;
    let startX, startY, startWidth, startHeight, startLeft, startTop;
    const resizeHandle = stickerEl.querySelector(".sticker-resize-handle");
    function getEventCoordinates(e) {
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
        return {
            x: e.clientX,
            y: e.clientY
        };
    }
    function startResize(e) {
        if (stickerEl.dataset.disabled === "true") {
            return;
        }
        isResizing = true;
        e.stopPropagation();
        const rect = stickerEl.getBoundingClientRect();
        const coords = getEventCoordinates(e);
        startX = coords.x;
        startY = coords.y;
        startWidth = rect.width;
        startHeight = rect.height;
        startLeft = rect.left;
        startTop = rect.top;
        e.preventDefault();
    }
    function handleResizeMove(e) {
        if (!isResizing) return;
        const coords = getEventCoordinates(e);
        const deltaX = coords.x - startX;
        const deltaY = coords.y - startY;
        const newWidth = Math.max(40, startWidth + deltaX);
        const newHeight = Math.max(40, startHeight + deltaY);
        stickerEl.style.width = newWidth + "px";
        stickerEl.style.height = newHeight + "px";
        const stickerId = stickerEl.id;
        const sticker = activeStickers.find(s => s.id === stickerId);
        if (sticker) {
            const container = stickerEl.parentElement;
            if (container) {
                const containerRect = container.getBoundingClientRect();
                sticker.width = newWidth / containerRect.width * 100;
                sticker.height = newHeight / containerRect.height * 100;
            } else {
                sticker.width = newWidth;
                sticker.height = newHeight;
            }
        }
        e.preventDefault();
    }
    function endResize() {
        isResizing = false;
    }
    resizeHandle.addEventListener("mousedown", startResize);
    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", endResize);
    resizeHandle.addEventListener("touchstart", startResize, {
        passive: false
    });
    document.addEventListener("touchmove", handleResizeMove, {
        passive: false
    });
    document.addEventListener("touchend", endResize);
    document.addEventListener("touchcancel", endResize);
}

function loadStickerCatalogue() {
    const stickerGrid = document.getElementById("stickerGrid");
    const filterGrid = document.getElementById("filterGrid");
    const frameGrid = document.getElementById("frameGrid");
    if (!stickerGrid || !filterGrid || !frameGrid) {
        setTimeout(() => {
            const retryGrid = document.getElementById("stickerGrid");
            const retryFilterGrid = document.getElementById("filterGrid");
            const retryFrameGrid = document.getElementById("frameGrid");
            if (retryGrid && retryFilterGrid && retryFrameGrid) {
                loadStickerCatalogue();
            }
        }, 100);
        return;
    }
    stickerGrid.innerHTML = "";
    STICKER_CATALOGUE.stickers.forEach((sticker, index) => {
        const item = document.createElement("div");
        item.className = "sticker-item";
        item.dataset.sticker = sticker.src;
        item.dataset.type = "sticker";
        item.onclick = () => {
            addStickerToPreview(sticker.src, "sticker");
        };
        const img = document.createElement("img");
        const imgUrl = STICKER_BASE_URL + sticker.src;
        img.src = imgUrl;
        img.alt = sticker.name;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        img.onerror = e => {
            img.style.display = "none";
            const placeholder = document.createElement("div");
            placeholder.className = "sticker-placeholder";
            placeholder.textContent = sticker.name;
            placeholder.style.display = "block";
            item.appendChild(placeholder);
        };
        img.onload = () => {};
        item.appendChild(img);
        stickerGrid.appendChild(item);
    });
    filterGrid.innerHTML = "";
    STICKER_CATALOGUE.filters.forEach((filter, index) => {
        const item = document.createElement("div");
        item.className = "sticker-item";
        item.dataset.sticker = filter.src;
        item.dataset.type = "filter";
        item.onclick = () => {
            addStickerToPreview(filter.src, "filter");
        };
        const img = document.createElement("img");
        const imgUrl = STICKER_BASE_URL + filter.src;
        img.src = imgUrl;
        img.alt = filter.name;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        img.onerror = e => {
            img.style.display = "none";
            const placeholder = document.createElement("div");
            placeholder.className = "sticker-placeholder";
            placeholder.textContent = filter.name;
            placeholder.style.display = "block";
            item.appendChild(placeholder);
        };
        img.onload = () => {};
        item.appendChild(img);
        filterGrid.appendChild(item);
    });
    frameGrid.innerHTML = "";
    STICKER_CATALOGUE.frames.forEach((frame, index) => {
        const item = document.createElement("div");
        item.className = "sticker-item";
        item.dataset.sticker = frame.src;
        item.dataset.type = "frame";
        item.onclick = () => {
            addStickerToPreview(frame.src, "frame");
        };
        const img = document.createElement("img");
        const imgUrl = STICKER_BASE_URL + frame.src;
        img.src = imgUrl;
        img.alt = frame.name;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        img.onerror = e => {
            img.style.display = "none";
            const placeholder = document.createElement("div");
            placeholder.className = "sticker-placeholder";
            placeholder.textContent = frame.name;
            placeholder.style.display = "block";
            item.appendChild(placeholder);
        };
        img.onload = () => {};
        item.appendChild(img);
        frameGrid.appendChild(item);
    });
}

function switchStickerTab(tab) {
    const stickersTab = document.getElementById("stickersTab");
    const filtersTab = document.getElementById("filtersTab");
    const framesTab = document.getElementById("framesTab");
    const tabs = document.querySelectorAll(".sticker-tab");
    if (!stickersTab || !filtersTab || !framesTab) {
        return;
    }
    tabs.forEach(t => t.classList.remove("active"));
    stickersTab.classList.remove("active");
    filtersTab.classList.remove("active");
    framesTab.classList.remove("active");
    if (tab === "stickers") {
        stickersTab.classList.add("active");
        if (tabs[0]) tabs[0].classList.add("active");
    } else if (tab === "filters") {
        filtersTab.classList.add("active");
        if (tabs[1]) tabs[1].classList.add("active");
    } else if (tab === "frames") {
        framesTab.classList.add("active");
        if (tabs[2]) tabs[2].classList.add("active");
    }
}

function clearAllStickers() {
    activeStickers = [];
    window.activeStickers = activeStickers;
    const containers = [ document.getElementById("captureStickerContainer"), document.getElementById("uploadStickerContainer"), document.getElementById("previewStickerContainer") ];
    containers.forEach(container => {
        if (container) {
            container.innerHTML = "";
        }
    });
    updateAppliedStickersList();
    if (typeof updateMergeButton === "function") {
        updateMergeButton();
    }
}

function updateAppliedStickersList() {
    const container = document.getElementById("appliedStickersContainer");
    const list = document.getElementById("appliedStickersList");
    if (!container || !list) {
        return;
    }
    const previewContainer = document.getElementById("imagePreviewContainer");
    if (previewContainer && previewContainer.style.display !== "none") {
        const currentImage = window.currentPreviewImage;
        if (currentImage && currentImage.is_posted) {
            container.style.display = "none";
            return;
        }
    }
    if (activeStickers.length === 0) {
        container.style.display = "none";
        return;
    }
    container.style.display = "block";
    list.innerHTML = "";
    const getStickerName = (src, type) => {
        let catalogue;
        if (type === "filter") {
            catalogue = STICKER_CATALOGUE.filters;
        } else if (type === "frame") {
            catalogue = STICKER_CATALOGUE.frames;
        } else {
            catalogue = STICKER_CATALOGUE.stickers;
        }
        const item = catalogue.find(s => s.src === src);
        return item ? item.name : src.replace(/\.(png|jpg|jpeg)$/i, "").replace(/_/g, " ");
    };
    activeStickers.forEach(sticker => {
        const item = document.createElement("div");
        item.className = "applied-sticker-item";
        item.setAttribute("data-sticker-id", sticker.id);
        const icon = document.createElement("div");
        icon.className = "applied-sticker-item-icon";
        const iconImg = document.createElement("img");
        iconImg.src = STICKER_BASE_URL + sticker.src;
        iconImg.alt = sticker.src;
        iconImg.onerror = () => {
            iconImg.style.display = "none";
            icon.textContent = "📷";
        };
        icon.appendChild(iconImg);
        const info = document.createElement("div");
        info.className = "applied-sticker-item-info";
        const name = document.createElement("p");
        name.className = "applied-sticker-item-name";
        name.textContent = getStickerName(sticker.src, sticker.type);
        const type = document.createElement("p");
        type.className = "applied-sticker-item-type";
        if (sticker.type === "filter") {
            type.textContent = "Filter";
        } else if (sticker.type === "frame") {
            type.textContent = "Frame";
        } else {
            type.textContent = "Sticker";
        }
        info.appendChild(name);
        info.appendChild(type);
        const removeBtn = document.createElement("button");
        removeBtn.className = "applied-sticker-item-remove";
        removeBtn.textContent = "Remove";
        removeBtn.onclick = e => {
            e.stopPropagation();
            if (typeof window.removeSticker === "function") {
                window.removeSticker(sticker.id);
            } else if (typeof removeSticker === "function") {
                removeSticker(sticker.id);
            }
        };
        item.appendChild(icon);
        item.appendChild(info);
        item.appendChild(removeBtn);
        list.appendChild(item);
    });
}

window.updateAppliedStickersList = updateAppliedStickersList;