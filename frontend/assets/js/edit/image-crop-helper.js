function cropImageToPortrait(imageBlob) {
    return new Promise((resolve, reject) => {
        const img = new Image;
        const url = URL.createObjectURL(imageBlob);
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const sourceWidth = img.width;
            const sourceHeight = img.height;
            const sourceAspect = sourceWidth / sourceHeight;
            const standardAspect = typeof window !== "undefined" && window.STANDARD_ASPECT || 4 / 5;
            const standardWidth = typeof window !== "undefined" && window.STANDARD_WIDTH || 800;
            const standardHeight = typeof window !== "undefined" && window.STANDARD_HEIGHT || 1e3;
            let cropX = 0, cropY = 0, cropWidth = sourceWidth, cropHeight = sourceHeight;
            if (sourceAspect > standardAspect) {
                cropHeight = sourceHeight;
                cropWidth = sourceHeight * standardAspect;
                cropX = (sourceWidth - cropWidth) / 2;
                cropY = 0;
            } else {
                cropWidth = sourceWidth;
                cropHeight = sourceWidth / standardAspect;
                cropX = 0;
                cropY = (sourceHeight - cropHeight) / 2;
            }
            canvas.width = standardWidth;
            canvas.height = standardHeight;
            ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, standardWidth, standardHeight);
            canvas.toBlob(blob => {
                URL.revokeObjectURL(url);
                if (!blob) {
                    reject(new Error("Failed to create cropped image"));
                    return;
                }
                const dataUrl = canvas.toDataURL("image/png");
                resolve({
                    blob: new Blob([ blob ], {
                        type: "image/png"
                    }),
                    dataUrl: dataUrl
                });
            }, "image/png", .95);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load image"));
        };
        img.src = url;
    });
}

window.cropImageToPortrait = cropImageToPortrait;