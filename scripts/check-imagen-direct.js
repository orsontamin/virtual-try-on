import axios from 'axios';

const TOKEN = "YOUR_VERTEX_TOKEN"; // This might be an API key or an old token
const PROJECT_ID = "premium-carving-481411-d2";
const REGION = "us-central1"; // Trying us-central1 first as it's more likely to have Imagen 3

async function checkImagen() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateContent?key=${TOKEN}`;
    
    try {
        console.log("Checking Imagen 3 via AI Studio...");
        const resp = await axios.post(url, {
            contents: [{ parts: [{ text: "test" }] }]
        });
        console.log("✅ Success via AI Studio!");
    } catch (e) {
        console.log(`❌ Fail AI Studio: ${e.response?.status}`);
        console.log(JSON.stringify(e.response?.data?.error || e.message, null, 2));
    }
}

checkImagen();
