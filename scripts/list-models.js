import axios from 'axios';

const TOKEN = "YOUR_GOOGLE_TOKEN"; 
const PROJECT_ID = "premium-carving-481411-d2";
const REGION = "us-central1";

async function listPublisherModels() {
    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    const url = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models`;
    
    try {
        console.log(`Listing models in ${REGION}...`);
        const resp = await axios.get(url, { headers });
        console.log("Found models!");
        const names = resp.data.publisherModels.map(m => m.name);
        console.log(names.filter(n => n.includes('gemini')).slice(0, 10));
    } catch (e) {
        console.log(`❌ Fail: ${e.response?.status || e.message}`);
        if (e.response) console.log(e.response.data);
    }
}

listPublisherModels();
