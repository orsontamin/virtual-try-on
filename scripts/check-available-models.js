import axios from 'axios';

const TOKEN = "YOUR_GOOGLE_TOKEN"; 
const PROJECT_ID = "premium-carving-481411-d2";
const REGION = "us-central1";

async function listModels() {
    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    // This is the standard Vertex AI "Publisher Models" endpoint
    const url = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models`;
    
    try {
        console.log(`Checking Vertex AI Models in ${REGION}...`);
        const resp = await axios.get(url, { headers });
        const models = resp.data.publisherModels || [];
        console.log(`Found ${models.length} models.`);
        
        const names = models.map(m => m.name.split('/').pop());
        console.log("Common models found:");
        console.log(names.filter(n => n.includes('gemini') || n.includes('imagen')).slice(0, 20));
    } catch (e) {
        console.log(`❌ Fail: ${e.response?.status || e.message}`);
        if (e.response?.data) console.log(JSON.stringify(e.response.data, null, 2));
    }
}

listModels();
