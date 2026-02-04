const GOOGLE_BRIDGE_URL = import.meta.env.VITE_GOOGLE_BRIDGE_URL;

/**
 * Compresses a base64 image string to reduce payload size.
 * Targets ~500KB - 800KB for fast transfer.
 */
const compressImage = (imageBase64OrUrl, maxWidth = 1280, quality = 0.7) => {
    return new Promise((resolve) => {
        const img = new Image();
        // Handle cross-origin URLs (like fal.ai results)
        if (!imageBase64OrUrl.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
        }
        img.src = imageBase64OrUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
    });
};

/**
 * Google Drive Storage Service (v4.0 - Compressed Bridge)
 * Routes uploads through the Google Apps Script bridge.
 */
export const saveImageToDrive = async (base64Data, filename = "vto-result.png") => {
    if (!GOOGLE_BRIDGE_URL) {
        return null;
    }

    try {
        // Compress before sending to avoid bridge timeouts/slow transfer
        const compressedBase64 = await compressImage(base64Data);
        
        const response = await fetch(GOOGLE_BRIDGE_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'upload',
                base64: compressedBase64,
                filename: filename.replace('.png', '.jpg') // Use .jpg for compressed
            }),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', 
            }
        });

        const data = await response.json();
        
        if (data.success && data.id) {
            return {
                id: data.id,
                webViewLink: data.url
            };
        }
        return null;
        
    } catch (err) {
        return null;
    }
};
