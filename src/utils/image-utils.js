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
