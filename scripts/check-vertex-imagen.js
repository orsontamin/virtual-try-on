import axios from 'axios';

const TOKEN = "YOUR_GOOGLE_TOKEN"; 
const PROJECT_ID = "premium-carving-481411-d2";
const REGION = "us-central1"; 

async function checkVertexImagen() {
    const url = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/imagen-3.0-generate-001:generateContent`;
    
    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    try {
        console.log(`Checking Imagen 3 via Vertex AI (${REGION})...`);
        const resp = await axios.post(url, {
            contents: [{ parts: [{ text: "a professional haircut collage" }] }]
        }, { headers });
        console.log("✅ Success via Vertex AI!");
        // console.log(JSON.stringify(resp.data, null, 2));
    } catch (e) {
        console.log(`❌ Fail Vertex AI: ${e.response?.status}`);
        console.log(JSON.stringify(e.response?.data?.error || e.message, null, 2));
    }
}

checkVertexImagen();
