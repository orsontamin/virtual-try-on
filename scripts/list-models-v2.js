import axios from 'axios';

const TOKEN = "YOUR_GOOGLE_TOKEN"; 
const REGION = "us-central1";

async function listModels() {
    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    // Correct endpoint for listing publisher models
    const url = `https://${REGION}-aiplatform.googleapis.com/v1/publishers/google/models`;
    
    try {
        console.log(`Listing models via ${url}...`);
        const resp = await axios.get(url, { headers });
        console.log("Found models!");
        const names = resp.data.publisherModels.map(m => m.name);
        console.log("Filtered models:");
        console.log(names.filter(n => n.toLowerCase().includes('imagen') || n.toLowerCase().includes('gemini-2')).slice(0, 50));
    } catch (e) {
        console.log(`❌ Fail: ${e.response?.status || e.message}`);
        if (e.response?.data) console.log(JSON.stringify(e.response.data, null, 2));
    }
}

listModels();
