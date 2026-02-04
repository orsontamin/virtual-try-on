import axios from 'axios';
import { fal } from "@fal-ai/client";
import { getStoredToken, refreshToken } from './auth';

/**
 * GLAM Studio - MASTER HYBRID ENGINE (v19.0)
 * Logic: 
 * 1. Gemini 2.5 Flash -> Technical Prompt + Professional Note (FREE)
 * 2. ByteDance SeeDream v4.5 (The Elite MUA) -> 2x2 Grid (4 Panels ONLY)
 * Cost: ~$0.04 | Speed: 5-10 Seconds | Quality: World-Class
 */

const FAL_API_KEY = import.meta.env.VITE_FAL_API_KEY;
const GOOGLE_BRIDGE_URL = import.meta.env.VITE_GOOGLE_BRIDGE_URL;

// Configure Fal.ai Key
fal.config({
  credentials: FAL_API_KEY,
});

export const analyzeAndConsultGlam = async (imageBase64, isRetry = false) => {
  const googleToken = getStoredToken();
  let generatedPrompt = "";
  
  if (!FAL_API_KEY) {
      throw new Error("FAL_API_KEY_MISSING: Ensure VITE_FAL_API_KEY is set in .env.local");
  }

  const cleanImageBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  const fullDataUri = imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`;

  try {
    // --- STAGE 1: THE VIRTUAL ARTIST (Google Gemini 2.5 Flash) ---
    console.log("💄 Phase 1: Gemini analyzing features and creating makeup prompt...");
    
    // Use Bridge if available, otherwise direct Vertex AI
    const geminiUrl = GOOGLE_BRIDGE_URL || `https://us-central1-aiplatform.googleapis.com/v1/projects/premium-carving-481411-d2/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent`;
    
    const consultantPrompt = `Analyze this person's face carefully (skin tone, eye color, features). 
    You are a Master Makeup Artist at a world-class luxury boutique.
    
    TASK:
    1. Generate a high-quality AI image editing prompt for a 2x2 GRID COMPOSITE (TOTAL 4 PANELS ONLY).
    2. Write a professional, encouraging recommendation note for the client.
    
    Guidelines for the Edit Prompt:
    - Layout: MANDATORY - A strict 2x2 grid collage showing 4 variations.
    - Identity: MAINTAIN the exact original face shape, jawline, and features. DO NOT make the face slimmer.
    - Framing: Show the WHOLE FACE and FULL HEAD in every panel. DO NOT CROP.
    - Variety: 4 distinct premium makeup looks.
    
    Output ONLY valid JSON in this format:
    {
      "edit_prompt": "the technical prompt here...",
      "mua_note": "Your professional recommendation here..."
    }`;

    let geminiResp;
    try {
        const payload = {
            contents: [{
              role: "user",
              parts: [
                { text: consultantPrompt },
                { inline_data: { mime_type: 'image/png', data: cleanImageBase64 } }
              ]
            }],
            generationConfig: { response_mime_type: "application/json" }
        };

        if (GOOGLE_BRIDGE_URL) {
            // Use fetch for the bridge to better handle Apps Script redirects and CORS
            const response = await fetch(GOOGLE_BRIDGE_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'gemini',
                    payload: payload
                }),
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8', 
                }
            });
            const text = await response.text();
            try {
                const data = JSON.parse(text);
                geminiResp = { data };
            } catch (pErr) {
                console.error("❌ Bridge Parse Error:", text);
                throw new Error("BRIDGE_PARSE_FAILED");
            }
        } else {
            if (!googleToken) throw new Error("UNAUTHENTICATED");
            geminiResp = await axios.post(geminiUrl, payload, { 
                headers: { 'Authorization': `Bearer ${googleToken}` } 
            });
        }
    } catch (gErr) {
        if (gErr.response?.status === 401 || gErr.message === "UNAUTHENTICATED") {
            if (GOOGLE_BRIDGE_URL) {
                console.error("❌ Bridge Authentication Error. Check Apps Script deployment.");
            } else {
                console.error("❌ Google Session Expired. Use 'REFRESH SESSION' button.");
            }
            throw new Error("UNAUTHENTICATED");
        }
        throw gErr;
    }

    const { edit_prompt, mua_note } = JSON.parse(geminiResp.data.candidates[0].content.parts[0].text);
    generatedPrompt = edit_prompt;
    console.log(`✅ Master MUA Recommendation: ${mua_note}`);

    // --- STAGE 2: THE MASTER MUA (ByteDance SeeDream v4.5) ---
    console.log("🎨 Phase 2: Synthesizing Elite 2x2 Glam Matrix via ByteDance...");
    
    const result = await fal.subscribe("fal-ai/bytedance/seedream/v4.5/edit", {
      input: {
        prompt: generatedPrompt,
        image_urls: [fullDataUri],
        width: 1920,
        height: 1080,
        return_media_as_data_uri: true 
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(msg => console.log(`[Glam Engine] ${msg}`));
        }
      },
    });

    if (result.data && (result.data.images || result.data.image)) {
        const finalUrl = result.data.images?.[0]?.url || result.data.image?.url;
        return {
            image: finalUrl,
            text: mua_note
        };
    }

    throw new Error("Glam Engine failed to return an image.");

  } catch (error) {
    console.error("Glam Hybrid Error:", error.response?.data || error.message);
    
    // Do NOT swallow auth errors
    if (error.message === "UNAUTHENTICATED" || error.message.includes("FAL_API_KEY")) {
        throw error;
    }
    
    return {
        image: imageBase64,
        text: `[CONSULTATION MODE] The GLAM engines are busy, but our Master Artist recommends natural tones to enhance your features.`
    };
  }
};
