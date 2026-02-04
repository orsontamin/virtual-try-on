Install Google Cloud SDK  if you haven't already or open Cloud Shell and skip to step three.
Run the following command to authenticate using your Google account.
gcloud auth login
Enter the following to request a model response:
cat << EOF > request.json
{
    "endpoint": "projects/premium-carving-481411-d2/locations/asia-southeast1/publishers/google/models/virtual-try-on-001",
    "instances": [
        {
            "personImage": {
            },
            "productImages": [
                {
                }
            ],
        }
    ],
    "parameters": {
        "personGeneration": "allow_all",
        "safetySettings": "block_few",
        "addWatermark": true,
        "includeRaiReason": true,
        "outputOptions": {
          "mimeType": "image/jpeg",
          "compressionQuality": 95,
        }
    }
}
EOF

PROJECT_ID="premium-carving-481411-d2"
LOCATION_ID="asia-southeast1"
API_ENDPOINT="asia-southeast1-aiplatform.googleapis.com"
MODEL_ID="virtual-try-on-001"

curl \
-X POST \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $(gcloud auth print-access-token)" \
"https://${API_ENDPOINT}/v1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/${MODEL_ID}:predict" -d '@request.json'

API key: YOUR_VERTEX_TOKEN

