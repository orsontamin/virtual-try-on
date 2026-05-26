const GOOGLE_BRIDGE_URL = import.meta.env.VITE_GOOGLE_BRIDGE_URL;

/**
 * Compresses a base64 image string to reduce payload size.
 * Targets ~500KB - 800KB for fast transfer.
 */
const compressImage = (imageBase64OrUrl, maxWidth = 1280, quality = 0.7) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        if (!imageBase64OrUrl || imageBase64OrUrl.length < 100) {
            return reject(new Error("Invalid image data provided for compression"));
        }

        if (!imageBase64OrUrl.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
        }
        
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
        img.onerror = (e) => {
            console.error("❌ Compression Image Load Error:", e);
            reject(new Error("Failed to load image for compression"));
        };
        img.src = imageBase64OrUrl;
    });
};

/**
 * Google Drive Storage Service (v4.0 - Compressed Bridge)
 * Routes uploads through the Google Apps Script bridge.
 */
export const saveImageToDrive = async (base64Data, filename = "vto-result.png") => {
    console.log("🛠️ SaveToDrive Called for:", filename, "URL:", GOOGLE_BRIDGE_URL ? "DEFINED" : "UNDEFINED");
    
    if (!GOOGLE_BRIDGE_URL) {
        console.warn("⚠️ Google Drive Save: VITE_GOOGLE_BRIDGE_URL is not defined in .env");
        return null;
    }

    try {
        console.log(`📤 Compressing ${filename}...`);
        const compressedBase64 = await compressImage(base64Data);
        console.log(`📤 Sending ${filename} to Bridge...`);
        
        const response = await fetch(GOOGLE_BRIDGE_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'upload',
                base64: compressedBase64,
                filename: filename.replace('.png', '.jpg')
            }),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', 
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("📥 Bridge Response Received:", data);
        
        if (data.success && (data.id || data.url)) {
            // Support 'url' or 'id' or 'webViewLink' from the bridge
            const finalUrl = data.url || data.webViewLink || (data.id ? `https://drive.google.com/file/d/${data.id}/view` : null);
            
            console.log(`✅ Upload Success: ${filename}`, finalUrl);
            return {
                id: data.id,
                webViewLink: finalUrl
            };
        }
        
        console.error(`❌ Upload Failed: ${filename}`, data.error || data);
        return null;
        
    } catch (err) {
        console.error(`❌ Drive Bridge Error for ${filename}:`, err);
        return null;
    }
};
