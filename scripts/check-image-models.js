import axios from 'axios';

const TOKEN = "YOUR_GOOGLE_TOKEN"; 
const PROJECT_ID = "644427686366";
const REGION = "us-central1";

const MODELS = [
    "imagen-3.0-fast-001",
    "imagegeneration@006",
    "imagegeneration@005"
];

async function checkImageModels() {
    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    const payload = {
        instances: [{
            prompt: "a simple cat",
        }],
        parameters: {
            sampleCount: 1,
        }
    };

    for (const model of MODELS) {
        // Test with :predict as Imagen 2/Fast often prefer it
        const url = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/${model}:predict`;
        console.log(`Testing Image Model: ${model}...`);
        try {
            const resp = await axios.post(url, payload, { headers });
            console.log(`✅ SUCCESS with ${model}!`);
            return model;
        } catch (e) {
            console.log(`❌ Fail ${model}: ${e.response?.status} - ${JSON.stringify(e.response?.data?.error?.message || e.message)}`);
        }
    }
}

checkImageModels();
