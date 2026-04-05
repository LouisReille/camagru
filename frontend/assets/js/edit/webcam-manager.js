class WebcamManager {
    constructor() {
        this.stream = null;
    }
    async start() {
        const sourceButtons = document.querySelector(".source-buttons");
        if (sourceButtons) {
            sourceButtons.style.display = "none";
        }
        if (typeof switchSource === "function") {
            switchSource("webcam");
        }
        const video = document.getElementById("webcamVideo");
        const canvas = document.getElementById("webcamCanvas");
        const errorDiv = document.getElementById("webcamError");
        const startBtn = document.getElementById("startWebcamBtn");
        const stopBtn = document.getElementById("stopWebcamBtn");
        const captureBtn = document.getElementById("captureBtn");
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: {
                        ideal: 640
                    },
                    height: {
                        ideal: 480
                    },
                    facingMode: "user"
                }
            });
            const liveBlock = document.getElementById("webcamLiveBlock");
            if (liveBlock) {
                liveBlock.classList.remove("webcam-live-block--hidden");
            }
            video.srcObject = this.stream;
            const videoWrapper = document.querySelector(".webcam-video-wrapper");
            if (videoWrapper) {
                videoWrapper.style.display = "flex";
            }
            video.style.display = "block";
            video.play();
            video.addEventListener("loadedmetadata", () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            });
            startBtn.style.display = "none";
            stopBtn.style.display = "inline-block";
            captureBtn.style.display = "inline-block";
            captureBtn.disabled = true;
            errorDiv.style.display = "none";
            const webcamControls = document.querySelector(".webcam-controls");
            if (webcamControls) {
                webcamControls.style.display = "flex";
            }
            const stickerSection = document.getElementById("stickerSection");
            if (stickerSection) {
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
            if (typeof updateCaptureButtonState === "function") {
                updateCaptureButtonState();
            }
        } catch (err) {
            let errorMessage = "Unable to access camera.";
            let permissionGuide = "";
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                errorMessage = "Camera permission denied.";
                permissionGuide = `\n                    <div style="margin-top: 15px; padding: 15px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; text-align: left;">\n                        <strong style="display: block; margin-bottom: 10px;">How to enable camera access:</strong>\n                        <ol style="margin: 0; padding-left: 20px; font-size: 0.9em; line-height: 1.8;">\n                            <li>Look for the camera permission prompt in your browser</li>\n                            <li>Choose <strong>Allow</strong> when asked for camera access</li>\n                            <li>If you already denied it, check your browser settings:\n                                <ul style="margin-top: 5px; padding-left: 20px;">\n                                    <li><strong>Chrome/Edge:</strong> Use the site settings icon in the address bar, then allow Camera</li>\n                                    <li><strong>Safari:</strong> Settings → Safari → Camera → Allow for this site</li>\n                                </ul>\n                            </li>\n                            <li>Refresh the page and try again</li>\n                        </ol>\n                        <button onclick="startWebcam()" style="margin-top: 15px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">\n                            Try again\n                        </button>\n                    </div>\n                `;
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                errorMessage = "No camera found. Please use upload instead.";
            } else {
                errorMessage = "Unable to access camera. Please check permissions or use upload instead.";
            }
            if (typeof renderTemplate === "function") {
                errorDiv.innerHTML = await renderTemplate("errors/camera-error", {
                    errorMessage: errorMessage,
                    permissionGuide: permissionGuide
                });
            } else {
                errorDiv.innerHTML = `<p>${errorMessage}</p>${permissionGuide}`;
            }
            errorDiv.style.display = "block";
            startBtn.style.display = "inline-block";
            stopBtn.style.display = "none";
            captureBtn.style.display = "none";
            this.stream = null;
        }
    }
    /**
     * Stops camera tracks (LED off) after a successful capture while keeping the still preview visible.
     */
    stopStreamKeepPreview() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        const video = document.getElementById("webcamVideo");
        const videoWrapper = document.querySelector(".webcam-video-wrapper");
        if (video) {
            video.srcObject = null;
            video.style.display = "none";
        }
        if (videoWrapper) {
            videoWrapper.style.display = "none";
        }
    }
    stop() {
        this.stopStreamKeepPreview();
        const startBtn = document.getElementById("startWebcamBtn");
        const stopBtn = document.getElementById("stopWebcamBtn");
        const captureBtn = document.getElementById("captureBtn");
        const capturePreview = document.getElementById("capturePreview");
        if (startBtn) startBtn.style.display = "inline-block";
        if (stopBtn) stopBtn.style.display = "none";
        if (captureBtn) captureBtn.style.display = "none";
        if (capturePreview) capturePreview.style.display = "none";
        const liveBlock = document.getElementById("webcamLiveBlock");
        if (liveBlock) {
            liveBlock.classList.remove("webcam-live-block--hidden");
        }
    }
    capture() {
        const video = document.getElementById("webcamVideo");
        const canvas = document.getElementById("webcamCanvas");
        const ctx = canvas.getContext("2d");
        if (!this.stream || !video.videoWidth) {
            return null;
        }
        return new Promise((resolve, reject) => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const standardAspect = typeof window !== "undefined" && window.STANDARD_ASPECT || 4 / 5;
            const standardWidth = typeof window !== "undefined" && window.STANDARD_WIDTH || 800;
            const standardHeight = typeof window !== "undefined" && window.STANDARD_HEIGHT || 1e3;
            const cropWidth = Math.min(canvas.width, canvas.height * standardAspect);
            const cropHeight = cropWidth / standardAspect;
            const cropX = (canvas.width - cropWidth) / 2;
            const cropY = (canvas.height - cropHeight) / 2;
            const croppedCanvas = document.createElement("canvas");
            croppedCanvas.width = standardWidth;
            croppedCanvas.height = standardHeight;
            const croppedCtx = croppedCanvas.getContext("2d");
            croppedCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, standardWidth, standardHeight);
            croppedCanvas.toBlob(async blob => {
                if (!blob) {
                    reject(new Error("Failed to convert canvas to blob"));
                    return;
                }
                const dataUrl = croppedCanvas.toDataURL("image/png");
                resolve({
                    blob: blob,
                    dataUrl: dataUrl
                });
            }, "image/png");
        });
    }
    getStream() {
        return this.stream;
    }
}

const webcamManager = new WebcamManager;

window.webcamManager = webcamManager;