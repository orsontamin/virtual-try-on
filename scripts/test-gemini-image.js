import axios from 'axios';

const TOKEN = "YOUR_GOOGLE_TOKEN"; 
const PROJECT_ID = "644427686366";
const REGION = "us-central1";

async function testGeminiImage() {
    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    const payload = {
        contents: [{
            parts: [
                { text: "A high-quality professional studio portrait with a new hairstyle makeover." }
            ]
        }]
    };

    const model = "gemini-2.5-flash-image-preview";
    // Usually these "image" models have a generateImages or similar endpoint, 
    // or they are called via the standard generateContent if they are multimodal generators.
    const url = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/${model}:generateContent`;

    console.log(`Testing Gemini Image Model: ${model}...`);
    try {
        const resp = await axios.post(url, payload, { headers });
        console.log(`✅ SUCCESS with ${model}!`);
        console.log(JSON.stringify(resp.data, null, 2));
    } catch (e) {
        console.log(`❌ Fail ${model}: ${e.response?.status} - ${JSON.stringify(e.response?.data?.error?.message || e.message)}`);
        
        // Try the alternative endpoint if it exists
        const altUrl = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/${model}:predict`;
        console.log(`Trying :predict endpoint...`);
        try {
            const resp2 = await axios.post(altUrl, payload, { headers });
            console.log(`✅ SUCCESS with :predict!`);
        } catch (e2) {
             console.log(`❌ Fail :predict: ${e2.response?.status}`);
        }
    }
}

testGeminiImage();
