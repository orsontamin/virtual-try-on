import axios from 'axios';

/**
 * Diagnostic Script for AI Barber Kiosk
 * This script tests the Vertex AI connection using the current token.
 * Run with: node scripts/test-barber-api.js
 */

const TOKEN = "YOUR_VERTEX_TOKEN"; 
const PROJECT_ID = "premium-carving-481411-d2";
const LOCATION_ID = "asia-southeast1";
const API_ENDPOINT = `${LOCATION_ID}-aiplatform.googleapis.com`;

// Minimal placeholder image (1x1 transparent pixel)
const PLACEHOLDER_IMAGE = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function runDiagnostic() {
    console.log("🚀 Starting AI Barber Diagnostic...");
    console.log(`📍 Region: ${LOCATION_ID}`);
    console.log(`🆔 Project: ${PROJECT_ID}`);
    console.log(`🔑 Token (Partial): ${TOKEN.substring(0, 10)}...`);

    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    const geminiUrl = `https://${API_ENDPOINT}/v1beta1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/gemini-1.5-flash:generateContent`;

    const payload = {
        contents: [{
            role: "user",
            parts: [
                { text: "Ping. Reply with 'Pong' in JSON format: { 'status': 'Pong' }" },
                { inline_data: { mime_type: 'image/png', data: PLACEHOLDER_IMAGE } }
            ]
        }],
        generationConfig: {
            response_mime_type: "application/json"
        }
    };

    try {
        console.log("\n📡 Testing Gemini 1.5 Flash connectivity...");
        const resp = await axios.post(geminiUrl, payload, { headers });
        console.log("✅ SUCCESS! API Response:");
        console.log(JSON.stringify(resp.data, null, 2));
    } catch (error) {
        console.error("\n❌ FAILED!");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
            
            if (error.response.status === 401) {
                console.error("\n💡 FIX: Your token is expired. Run 'gcloud auth print-access-token' and update the TOKEN constant in this script and barber-api.js.");
            } else if (error.response.status === 403) {
                console.error("\n💡 FIX: Insufficient permissions. Ensure Vertex AI is enabled and your token has 'https://www.googleapis.com/auth/cloud-platform' scope.");
            }
        } else {
            console.error("Error Message:", error.message);
        }
    }
}

runDiagnostic();
