import axios from 'axios';
import { getStoredToken, refreshToken } from './auth';

/**
 * VTO.AI API Service (v5.0 - Bridge Edition)
 * Routes VTO predictions through the Apps Script bridge to avoid CORS
 * and handle authentication automatically.
 */

const GOOGLE_BRIDGE_URL = import.meta.env.VITE_GOOGLE_BRIDGE_URL;

export const analyzePersonAttire = async (imageBase64) => {
    try {
        const cleanImage = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        const geminiUrl = GOOGLE_BRIDGE_URL || `https://asia-southeast1-aiplatform.googleapis.com/v1/projects/premium-carving-481411-d2/locations/asia-southeast1/publishers/google/models/gemini-2.0-flash-001:generateContent`;
        
        const payload = {
            contents: [{
                role: "user",
                parts: [
                    { text: "Analyze this person's attire. Detect if they are a Muslimah (wearing a hijab) or if they are wearing sleeveless clothing (bare arms, tank top, or sleeveless shirt). Return ONLY a JSON object with boolean fields: {\"is_muslimah\": true/false, \"is_sleeveless\": true/false}" },
                    { inline_data: { mime_type: 'image/png', data: cleanImage } }
                ]
            }],
            generationConfig: { response_mime_type: "application/json" }
        };

        let result;
        if (GOOGLE_BRIDGE_URL) {
            const response = await fetch(GOOGLE_BRIDGE_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'gemini', payload: payload }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            result = await response.json();
        } else {
            const token = getStoredToken();
            const resp = await axios.post(geminiUrl, payload, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            result = resp.data;
        }

        const text = result.candidates[0].content.parts[0].text;
        const data = JSON.parse(text);
        return data; // Returns { is_muslimah: boolean, is_sleeveless: boolean }
    } catch (err) {
        console.error("Attire Analysis Error:", err);
        return { is_muslimah: false, is_sleeveless: false };
    }
};

export const tryOn = async (humanImageBase64, designImageBase64, isRetry = false) => {
  const cleanHuman = humanImageBase64.split(',')[1];
  const cleanDesign = designImageBase64.split(',')[1];

  const payload = {
    instances: [
      {
        personImage: {
          image: { bytesBase64Encoded: cleanHuman }
        },
        productImages: [
          { image: { bytesBase64Encoded: cleanDesign } }
        ]
      }
    ],
    parameters: {
      personGeneration: "allow_all",
      safetySettings: "block_few",
      addWatermark: false
    }
  };

  try {
    console.log(`👕 Starting VTO Prediction via Bridge...`);
    
    if (GOOGLE_BRIDGE_URL) {
        const response = await fetch(GOOGLE_BRIDGE_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'vto',
                payload: payload
            }),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            }
        });
        const data = await response.json();
        
        if (data.predictions && data.predictions[0]) {
            const prediction = data.predictions[0];
            const imgData = prediction.bytesBase64Encoded || prediction.outputImage;
            if (imgData) return `data:image/jpeg;base64,${imgData}`;
        }
    } else {
        // Fallback to direct if no bridge configured
        const PROJECT_ID = "premium-carving-481411-d2";
        const LOCATION_ID = "asia-southeast1";
        const url = `https://${LOCATION_ID}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/virtual-try-on-001:predict`;
        const token = getStoredToken();
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const resp = await axios.post(url, payload, { headers });
        if (resp.data.predictions?.[0]) {
            const pred = resp.data.predictions[0];
            const imgData = pred.bytesBase64Encoded || pred.outputImage;
            return `data:image/jpeg;base64,${imgData}`;
        }
    }
    
    return null;

  } catch (error) {
    console.error("VTO API Error:", error.message);
    throw error;
  }
};
