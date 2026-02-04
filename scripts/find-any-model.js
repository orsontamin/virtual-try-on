import axios from 'axios';

const TOKEN = "YOUR_GOOGLE_TOKEN"; 
const PROJECT_ID = "premium-carving-481411-d2";

const REGIONS = ["us-central1", "asia-southeast1", "us-east4", "europe-west1", "europe-west9"];
const MODELS = [
    "imagen-3.0-fast-generate-001",
    "imagen-3.0-generate-001",
    "imagegeneration@005",
    "gemini-2.5-flash-image-preview"
];

async function findAnyWorkingModel() {
    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    const payloadGenerateContent = {
        contents: [{ parts: [{ text: "a simple portrait of a man" }] }]
    };

    const payloadPredict = {
        instances: [{ prompt: "a simple portrait of a man" }],
        parameters: { sampleCount: 1 }
    };

    for (const model of MODELS) {
        for (const region of REGIONS) {
            console.log(`\n🔍 Testing ${model} in ${region}...`);
            
            // Try :generateContent (Imagen 3 / Gemini)
            const genUrl = `https://${region}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${region}/publishers/google/models/${model}:generateContent`;
            try {
                const resp = await axios.post(genUrl, payloadGenerateContent, { headers });
                console.log(`✅ SUCCESS (genContent): ${model} in ${region}`);
                return;
            } catch (e) {
                console.log(`❌ genContent fail: ${e.response?.status}`);
            }

            // Try :predict (Imagen 1.5 / 2)
            const predUrl = `https://${region}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${region}/publishers/google/models/${model}:predict`;
            try {
                const resp = await axios.post(predUrl, payloadPredict, { headers });
                console.log(`✅ SUCCESS (predict): ${model} in ${region}`);
                return;
            } catch (e) {
                console.log(`❌ predict fail: ${e.response?.status}`);
            }
        }
    }
}

findAnyWorkingModel();
