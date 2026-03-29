class StickerPositionCalculator {
    static STANDARD_WIDTH=800;
    static STANDARD_HEIGHT=1e3;
    static async calculatePositions(previewImg, container, stickers) {
        if (!previewImg || !container || !stickers || stickers.length === 0) {
            return [];
        }
        if (previewImg.tagName === "IMG" && (!previewImg.complete || previewImg.naturalWidth === 0)) {
            await new Promise(resolve => {
                if (previewImg.complete && previewImg.naturalWidth > 0) {
                    resolve();
                } else {
                    previewImg.onload = resolve;
                    previewImg.onerror = resolve;
                    setTimeout(resolve, 5e3);
                }
            });
        }
        void previewImg.offsetHeight;
        void container.offsetHeight;
        await new Promise(resolve => setTimeout(resolve, 50));
        const imageRect = previewImg.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const naturalWidth = previewImg.naturalWidth || previewImg.videoWidth || this.STANDARD_WIDTH;
        const naturalHeight = previewImg.naturalHeight || previewImg.videoHeight || this.STANDARD_HEIGHT;
        if (imageRect.width === 0 || imageRect.height === 0 || naturalWidth === 0 || naturalHeight === 0) {
            return [];
        }
        const imageOffsetX = imageRect.left - containerRect.left;
        const imageOffsetY = imageRect.top - containerRect.top;
        const scaleX = naturalWidth / imageRect.width;
        const scaleY = naturalHeight / imageRect.height;
        const stickersData = stickers.map(sticker => {
            const stickerEl = document.getElementById(sticker.id);
            if (!stickerEl) {
                return null;
            }
            const isFilter = sticker.type === "filter";
            const isFrame = sticker.type === "frame";
            let left, top, width, height;
            if (isFilter) {
                left = 0;
                top = 0;
                width = imageRect.width;
                height = imageRect.height;
            } else {
                // Use computed on-screen box to handle percent positions/transforms correctly.
                const stickerRect = stickerEl.getBoundingClientRect();
                left = stickerRect.left - containerRect.left;
                top = stickerRect.top - containerRect.top;
                width = stickerRect.width;
                height = stickerRect.height;
            }
            const relativeLeft = left - imageOffsetX;
            const relativeTop = top - imageOffsetY;
            const xPercent = relativeLeft * scaleX / naturalWidth * 100;
            const yPercent = relativeTop * scaleY / naturalHeight * 100;
            const widthPercent = width * scaleX / naturalWidth * 100;
            const heightPercent = height * scaleY / naturalHeight * 100;
            if (isFilter) {
                return {
                    src: sticker.src,
                    type: sticker.type,
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100
                };
            }
            return {
                src: sticker.src,
                type: sticker.type,
                x: xPercent,
                y: yPercent,
                width: widthPercent,
                height: heightPercent
            };
        }).filter(s => s !== null);
        return stickersData;
    }
    static getNaturalDimensions(previewImg) {
        if (!previewImg) {
            return {
                width: this.STANDARD_WIDTH,
                height: this.STANDARD_HEIGHT
            };
        }
        const naturalWidth = previewImg.naturalWidth || previewImg.videoWidth || this.STANDARD_WIDTH;
        const naturalHeight = previewImg.naturalHeight || previewImg.videoHeight || this.STANDARD_HEIGHT;
        return {
            width: naturalWidth,
            height: naturalHeight
        };
    }
}

window.StickerPositionCalculator = StickerPositionCalculator;