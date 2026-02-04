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
    contents: [{      parts: [
        { text: "Analyze this face shape and recommend 3 hairstyles: Trendsetter, Professional, Low Maintenance. Format per BARBERSHOP.md." },
        { inline_data: { mime_type: "image/png", data: cleanImage } }
      ]
    }]
  };
