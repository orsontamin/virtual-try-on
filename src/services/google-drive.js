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
 * Google Drive Storage Service (v4.1 - Compressed Bridge with Retries)
 * Routes uploads through the Google Apps Script bridge.
 */
export const saveImageToDrive = async (base64Data, filename = "vto-result.png") => {
    console.log("🛠️ SaveToDrive Called for:", filename, "URL:", GOOGLE_BRIDGE_URL ? "DEFINED" : "UNDEFINED");
    
    if (!GOOGLE_BRIDGE_URL) {
        console.warn("⚠️ Google Drive Save: VITE_GOOGLE_BRIDGE_URL is not defined in .env");
        return null;
    }

    const maxRetries = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                console.log(`🔄 Retry Attempt ${attempt} for ${filename}...`);
                // Exponential backoff: 1s, 2s
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }

            console.log(`📤 Compressing ${filename} (Attempt ${attempt+1})...`);
            const compressedBase64 = await compressImage(base64Data);
            console.log(`📤 Sending ${filename} to Bridge (Size: ${Math.round(compressedBase64.length / 1024)} KB)...`);
            
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
                const finalUrl = data.url || data.webViewLink || (data.id ? `https://drive.google.com/file/d/${data.id}/view` : null);
                
                console.log(`✅ Upload Success: ${filename}`, finalUrl);
                return {
                    id: data.id,
                    webViewLink: finalUrl
                };
            }
            
            throw new Error(data.error || "Bridge returned success:false without error message");
            
        } catch (err) {
            console.error(`❌ Drive Bridge Error (Attempt ${attempt+1}):`, err.message);
            lastError = err;
            // If it's a network error or a 5xx, we retry. 
            // If it's something else, maybe we should stop, but for now we retry everything up to maxRetries.
        }
    }

    console.error(`🛑 All ${maxRetries + 1} attempts failed for ${filename}. Last error:`, lastError);
    return null;
};
