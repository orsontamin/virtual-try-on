import axios from 'axios';
import { fal } from "@fal-ai/client";
import { getStoredToken, refreshToken } from './auth';

/**
 * AI Grooming Kiosk - MASTER HYBRID ENGINE (v19.0)
 * Logic: 
 * 1. Gemini 2.5 Flash -> Style Strategy + Professional Prompt (FREE)
 * 2. Fal.ai Flux Pro v1.1 Redux (The Elite Groomer) -> 2x2 Grid with Identity Lock
 * Cost: ~$0.04 | Speed: 5-10 Seconds | Quality: World-Class
 */

const FAL_API_KEY = import.meta.env.VITE_FAL_API_KEY;
const GOOGLE_BRIDGE_URL = import.meta.env.VITE_GOOGLE_BRIDGE_URL;

// Configure Fal.ai Key
fal.config({
  credentials: FAL_API_KEY,
});

// Safely handle the JSON config to prevent Vite build crashes
let barberConfig = {};
try {
    // We use a separate constant to avoid direct top-level crash
    const configData = await import('../config/barber-config.json');
    barberConfig = configData.default;
} catch (e) {
    console.warn("⚠️ Could not load barber-config.json, using internal defaults.");
}

const BARBER_PROMPT_KEY = "barber_master_prompt";
const DEFAULT_BARBER_PROMPT = barberConfig?.master_prompt || `Analyze the PRIMARY person in the CENTER of this image. Ignore any people in the background.
    Carefully examine their face (jawline, features, glasses) and their CURRENT HAIR LENGTH. 
    You are a Master Groomer at a premium high-end salon.
    
    TASK:
    1. Select 4 premium professional hairstyles that suit them.
    2. IMPORTANT: Only recommend styles that can be achieved with their current hair length or shorter. If they have short hair, DO NOT suggest long hairstyles. The goal is to provide realistic options for a groomer to execute (cuts, fades, styling).
    3. Generate a prompt describing a 2x2 collage of these styles.
    4. Write a professional recommendation note for the client.
    
    Output ONLY valid JSON in this format:
    {
      "edit_prompt": "the technical prompt here...",
      "barber_note": "Your professional recommendation here..."
    }`;

export const getStoredBarberPrompt = () => {
    try {
        const stored = localStorage.getItem(BARBER_PROMPT_KEY);
        return stored ? JSON.parse(stored).prompt : DEFAULT_BARBER_PROMPT;
    } catch (e) {
        return DEFAULT_BARBER_PROMPT;
    }
};

export const setStoredBarberPrompt = (newPrompt) => {
    try {
        localStorage.setItem(BARBER_PROMPT_KEY, JSON.stringify({ prompt: newPrompt, updated_at: new Date().toISOString() }));
        return true;
    } catch (e) {
        return false;
    }
};

export const analyzeAndConsult = async (imageBase64, isRetry = false) => {
  const googleToken = getStoredToken();
  let generatedPrompt = "";
  
  if (!FAL_API_KEY) {
      throw new Error("FAL_API_KEY_MISSING: Ensure VITE_FAL_API_KEY is set in .env.local");
  }

  const cleanImageBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  const fullDataUri = imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`;

  try {
    // --- STAGE 1: THE CONSULTANT (Google Gemini 2.5 Flash) ---
    console.log("🧠 Phase 1: Gemini architecting the style matrix...");
    
    // Use Bridge if available, otherwise direct Vertex AI
    const geminiUrl = GOOGLE_BRIDGE_URL || `https://us-central1-aiplatform.googleapis.com/v1/projects/premium-carving-481411-d2/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent`;
    
    const consultantPrompt = getStoredBarberPrompt();

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
                    'Content-Type': 'text/plain;charset=utf-8', // Avoid preflight by using simple content-type
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

    const { edit_prompt, barber_note } = JSON.parse(geminiResp.data.candidates[0].content.parts[0].text);
    generatedPrompt = edit_prompt;
    console.log(`✅ Master Groomer Recommendation: ${barber_note}`);

    // --- STAGE 2: THE MASTER GROOMER (ByteDance SeeDream v4.5) ---
    console.log("🎨 Phase 2: Synthesizing AI 2x2 collage via ByteDance...");
    
    const result = await fal.subscribe("fal-ai/bytedance/seedream/v4.5/edit", {
      input: {
        prompt: generatedPrompt,
        image_urls: [fullDataUri],
        width: 1280,
        height: 720,
        return_media_as_data_uri: true 
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(msg => console.log(`[AI Engine] ${msg}`));
        }
      },
    });

    if (result.data && (result.data.images || result.data.image)) {
        const finalUrl = result.data.images?.[0]?.url || result.data.image?.url;
        return {
            image: finalUrl,
            text: barber_note
        };
    }

    throw new Error("AI Engine failed to return an image.");

  } catch (error) {
    console.error("Master Hybrid Error:", error.response?.data || error.message);
    
    // Do NOT swallow auth errors - the UI needs these to show the Refresh button
    if (error.message === "UNAUTHENTICATED" || error.message.includes("FAL_API_KEY")) {
        throw error;
    }

    return {
        image: imageBase64,
        text: `[CONSULTATION MODE] The high-end engines are busy. We recommend exploring styles that suit your natural face shape.`
    };
  }
};
