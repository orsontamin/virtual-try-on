import axios from 'axios';

const TOKEN = "YOUR_GOOGLE_TOKEN"; 
const PROJECT_ID = "premium-carving-481411-d2";

const REGIONS = ["us-central1", "asia-southeast1", "us-east1"];
const MODELS = ["gemini-1.5-flash-001", "gemini-1.5-flash-002", "gemini-1.5-flash"];

async function findWorkingModel() {
    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    const payload = {
        contents: [{ role: "user", parts: [{ text: "hi" }] }]
    };

    for (const region of REGIONS) {
        for (const model of MODELS) {
            const url = `https://${region}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${region}/publishers/google/models/${model}:generateContent`;
            console.log(`Testing: ${region} | ${model}...`);
            try {
                const resp = await axios.post(url, payload, { headers });
                console.log(`✅ SUCCESS in ${region} with ${model}!`);
                return { region, model };
            } catch (e) {
                console.log(`❌ Fail: ${e.response?.status || e.message}`);
            }
        }
    }
    console.log("No working combination found.");
}

findWorkingModel();
