export const applyFrame = async (imageBase64, framePath, options = {}) => {
    const { contentScale = 1.0 } = options;

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const frame = new Image();
            frame.crossOrigin = "anonymous";
            frame.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = frame.width;
                canvas.height = frame.height;
                const ctx = canvas.getContext('2d');

                // Draw the AI result image, optionally scaled down and centered
                if (contentScale < 1.0) {
                    const scaledWidth = canvas.width * contentScale;
                    const scaledHeight = canvas.height * contentScale;
                    const offsetX = (canvas.width - scaledWidth) / 2;
                    const offsetY = (canvas.height - scaledHeight) / 2;
                    ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
                } else {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                }

                ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

                resolve(canvas.toDataURL('image/png'));
            };
            frame.onerror = reject;
            frame.src = framePath;
        };
        img.onerror = reject;
        img.src = imageBase64;
    });
};

export const combineImagesSideBySide = async (img1Base64, img2Base64) => {
    return new Promise((resolve, reject) => {
        const img1 = new Image();
        const img2 = new Image();
        
        let loadedCount = 0;
        const checkDone = () => {
            loadedCount++;
            if (loadedCount === 2) {
                const canvas = document.createElement('canvas');
                // We assume both images have similar aspect ratios for VTO output
                // Use the height of the first image as the base
                const height = img1.height;
                const img2ScaledWidth = img2.width * (height / img2.height);
                
                canvas.width = img1.width + img2ScaledWidth;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img1, 0, 0);
                ctx.drawImage(img2, img1.width, 0, img2ScaledWidth, height);
                
                resolve(canvas.toDataURL('image/png'));
            }
        };

        img1.crossOrigin = "anonymous";
        img2.crossOrigin = "anonymous";
        img1.onload = checkDone;
        img2.onload = checkDone;
        img1.onerror = reject;
        img2.onerror = reject;
        
        img1.src = img1Base64;
        img2.src = img2Base64;
    });
};
