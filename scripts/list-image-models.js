import axios from 'axios';

const TOKEN = "YOUR_GOOGLE_TOKEN"; 
const PROJECT_ID = "644427686366";
const REGION = "us-central1";

async function listAllModels() {
    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    const url = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models`;
    
    try {
        console.log(`Listing all publisher models in ${REGION}...`);
        const resp = await axios.get(url, { headers });
        console.log("Found models!");
        const names = resp.data.publisherModels.map(m => m.name);
        console.log("Image/Generation models found:");
        console.log(names.filter(n => n.includes('image') || n.includes('imagen')).slice(0, 50));
    } catch (e) {
        console.log(`❌ Fail: ${e.response?.status || e.message}`);
        if (e.response?.data) console.log(e.response.data);
    }
}

listAllModels();
