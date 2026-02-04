import axios from 'axios';

const TOKEN = "YOUR_GOOGLE_TOKEN"; 
const PROJECT_ID = "644427686366";
const REGION = "us-central1";

const MODELS = [
    "imagen-3.0-fast-001",
    "imagen-3.0-fast",
    "imagen-3.0-generate",
    "imagen-2.0-generate-001",
    "imagegeneration@006",
    "imagegeneration@005"
];

async function discover() {
    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    const payload = {
        contents: [{ parts: [{ text: "cat" }] }]
    };

    for (const model of MODELS) {
        const url = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/${model}:generateContent`;
        console.log(`Trying ${model}...`);
        try {
            await axios.post(url, payload, { headers });
            console.log(`✅ ${model} works!`);
        } catch (e) {
            console.log(`❌ ${model}: ${e.response?.status}`);
        }
    }
}

discover();
