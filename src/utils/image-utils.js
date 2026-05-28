export const applyFrame = async (imageBase64, framePath, options = {}) => {
    const { 
        contentScale = 1.0, 
        backgroundPath = null, 
        offsetY = 0, 
        showGrid = false, 
        gridColor = '#F47321',
        targetArea = null, // { x, y, w, h }
        showPlaceholder = false
    } = options;

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

                const drawAll = (bgImg = null) => {
                    // 1. Draw Background (Bottom)
                    if (bgImg) {
                        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
                    } else {
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }

                    // 2. Draw the AI result image (Middle)
                    let drawX, drawY, drawW, drawH;

                    if (targetArea) {
                        drawX = targetArea.x;
                        drawY = targetArea.y;
                        drawW = targetArea.w;
                        drawH = targetArea.h;
                    } else {
                        drawW = canvas.width * contentScale;
                        drawH = canvas.height * contentScale;
                        drawX = (canvas.width - drawW) / 2;
                        drawY = ((canvas.height - drawH) / 2) + offsetY;
                    }

                    if (showPlaceholder) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                        ctx.fillRect(drawX, drawY, drawW, drawH);
                        ctx.strokeStyle = 'white';
                        ctx.lineWidth = 2;
                        ctx.setLineDash([10, 5]);
                        ctx.strokeRect(drawX, drawY, drawW, drawH);
                        ctx.setLineDash([]);
                    } else if (img.src) {
                        ctx.drawImage(img, drawX, drawY, drawW, drawH);
                    }

                    // Optional: Draw Grid (on top of image but behind frame)
                    if (showGrid && !showPlaceholder) {
                        ctx.strokeStyle = gridColor;
                        ctx.lineWidth = 4;
                        
                        ctx.beginPath();
                        ctx.moveTo(drawX + drawW / 2, drawY);
                        ctx.lineTo(drawX + drawW / 2, drawY + drawH);
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.moveTo(drawX, drawY + (drawH / 2));
                        ctx.lineTo(drawX + drawW, drawY + (drawH / 2));
                        ctx.stroke();
                    }

                    // 3. Draw Frame (Top)
                    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

                    resolve(canvas.toDataURL('image/png'));
                };

                if (backgroundPath) {
                    const bg = new Image();
                    bg.crossOrigin = "anonymous";
                    bg.onload = () => drawAll(bg);
                    bg.onerror = () => drawAll(null); // Fallback if bg fails
                    bg.src = backgroundPath;
                } else {
                    drawAll(null);
                }
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
