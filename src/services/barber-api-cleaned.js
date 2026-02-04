import axios from 'axios';

// Get token from localStorage if available, otherwise use hardcoded fallback
const getAccessToken = () => {
    const stored = localStorage.getItem('GEMINI_ACCESS_TOKEN');
    if (stored) return stored;
    return "YOUR_VERTEX_TOKEN"; // Hardcoded Fallback
};

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export const analyzeAndConsult = async (imageBase64) => {
  const cleanImage = imageBase64.split(',')[1];
  const token = getAccessToken();

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 1. Consultation Text
  const textPayload = {
    contents: [{*      parts: [
        { text: "Analyze this face shape and recommend 3 hairstyles: Trendsetter, Professional, Low Maintenance. Format per BARBERSHOP.md." },
        { inline_data: { mime_type: "image/png", data: cleanImage } }
      ]
    }]
  };
"S[XYBۜ[XYT^[YH۝[Έ\Έ^H[H^ܚYوH[YH\ۈ]Z\]Έ^\YܛYH\^]K[[W]NZ[YW\N[XYKȋ]NX[[XYHHBBWBNHۜ^\[XYT\HH]Z]Z\K[
^[˜
	АTWTK[Z[KLKKY\[\]P۝[^^[YXY\JK!xios.post(`${BASE_URL}/imagen-3.0-generate-001:generateContent`, imagePayload, { headers })
    ]);

    return {
        text: textResp.data.candidates[0].content.parts[0].text,
        image: `data:image/jpeg;base64,${imageResp.data.candidates[0].content.parts[0].inline_data.data}`
    };
  } catch (error) {
    if (error.response?.status === 401) {
        const msg = "ACCESS_TOKEN_EXPIRED: Run 'gcloud auth print-access-token' and run 'localStorage.setItem(\"GEMINI_ACCESS_TOKEN\", \"YOUR_TOKEN\")' in the console.";
        console.error(msg);
        throw new Error(msg);
    }
    throw error;
  }
};

