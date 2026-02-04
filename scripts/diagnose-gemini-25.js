import axios from 'axios';

const TOKEN = "YOUR_GOOGLE_TOKEN"; 
const PROJECT_ID = "644427686366";
const REGION = "us-central1";

async function diagnoseGemini25() {
    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    const url = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/gemini-2.5-flash-image:generateContent`;

    const payload = {
        contents: [{
            role: "user",
            parts: [
                { text: "Generate a high-quality professional studio portrait of a man with a beard." }
            ]
        }]
    };

    try {
        console.log("Testing Gemini 2.5 Flash Image...");
        const resp = await axios.post(url, payload, { headers });
        console.log("Response Status:", resp.status);
        console.log("Full Response Structure:", JSON.stringify(resp.data, null, 2));
    } catch (e) {
        console.log(`❌ Fail: ${e.response?.status}`);
        if (e.response?.data) console.log(JSON.stringify(e.response.data, null, 2));
    }
}

diagnoseGemini25();
