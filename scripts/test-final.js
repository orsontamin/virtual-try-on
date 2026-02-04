import axios from 'axios';

const TOKEN = "YOUR_GOOGLE_TOKEN"; 
const PROJECT_ID = "644427686366";
const REGION = "asia-southeast1";

async function testFinal() {
    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    const payload = {
        contents: [{ role: "user", parts: [{ text: "hi" }] }]
    };

    const versions = ["v1", "v1beta1"];
    const models = ["gemini-1.5-flash", "gemini-1.5-flash-001", "gemini-1.5-pro"];

    for (const v of versions) {
        for (const m of models) {
            const url = `https://${REGION}-aiplatform.googleapis.com/${v}/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/${m}:generateContent`;
            console.log(`Testing: ${url}`);
            try {
                const resp = await axios.post(url, payload, { headers });
                console.log(`✅ SUCCESS with ${v} and ${m}!`);
                return;
            } catch (e) {
                console.log(`❌ Fail: ${e.response?.status}`);
            }
        }
    }
}

testFinal();
