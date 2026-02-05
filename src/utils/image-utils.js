export const applyFrame = async (imageBase64, framePath) => {
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

                // Draw the AI result image
                // We assume the frame is designed to fit the 16:9 aspect ratio or similar
                // For ByteDance (1280x720) or Vertex (768x1024)
                // We'll scale the image to fit the frame or draw it in the center
                
                // For simplicity, let's stretch the image to the frame's dimensions 
                // but usually these frames have a specific transparent area.
                // If the frame is the same size as the output, we just draw image then frame.
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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
