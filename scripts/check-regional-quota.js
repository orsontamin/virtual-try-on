import axios from 'axios';

const TOKEN = "YOUR_GOOGLE_TOKEN"; 
const PROJECT_ID = "644427686366";

const REGIONS = ["us-central1", "us-west1", "asia-southeast1", "us-east4"];
const MODELS = ["imagen-3.0-generate-001", "imagen-3.0-fast-generate-001"];

async function checkRegionalQuota() {
    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    const payload = {
        contents: [{
            parts: [{ text: "a cat" }]
        }]
    };

    for (const model of MODELS) {
        console.log(`\n--- Testing Model: ${model} ---`);
        for (const region of REGIONS) {
            const url = `https://${region}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${region}/publishers/google/models/${model}:generateContent`;
            console.log(`Testing in ${region}...`);
            try {
                const resp = await axios.post(url, payload, { headers });
                console.log(`✅ SUCCESS in ${region} with ${model}!`);
                return { region, model };
            } catch (e) {
                console.log(`❌ Fail ${region}: ${e.response?.status} - ${e.response?.data?.error?.message || e.message}`);
            }
        }
    }
}

checkRegionalQuota();
