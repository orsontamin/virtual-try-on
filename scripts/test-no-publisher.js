import axios from 'axios';

const TOKEN = "YOUR_GOOGLE_TOKEN"; 
const PROJECT_ID = "644427686366";
const REGION = "asia-southeast1";

async function testNoPublisher() {
    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    const payload = {
        contents: [{ role: "user", parts: [{ text: "hi" }] }]
    };

    const url = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/models/gemini-1.5-flash:generateContent`;
    console.log(`Testing: ${url}`);
    try {
        const resp = await axios.post(url, payload, { headers });
        console.log(`✅ SUCCESS!`);
    } catch (e) {
        console.log(`❌ Fail: ${e.response?.status}`);
    }
}

testNoPublisher();
