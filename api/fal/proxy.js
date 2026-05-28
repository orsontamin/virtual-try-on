import axios from 'axios';

export default async function handler(req, res) {
  // Handle CORS / preflight requests if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-fal-target-url');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const targetUrl = req.headers['x-fal-target-url'];
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing x-fal-target-url header' });
  }

  const falKey = process.env.FAL_API_KEY || process.env.VITE_FAL_API_KEY;
  if (!falKey) {
    return res.status(500).json({ error: 'FAL_API_KEY environment variable is not configured' });
  }

  try {
    // Copy headers from incoming request, cleaning up host and target-url
    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'host' && lowerKey !== 'x-fal-target-url' && lowerKey !== 'connection') {
        headers[key] = value;
      }
    }

    // Set authorization header
    headers['authorization'] = `Key ${falKey}`;

    // Forward the request to Fal
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: headers,
      data: req.body,
      responseType: 'arraybuffer',
      validateStatus: () => true, // Allow passing through error statuses
    });

    // Copy response headers
    for (const [key, value] of Object.entries(response.headers)) {
      res.setHeader(key, value);
    }

    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Fal Proxy Error:', error.message);
    res.status(500).json({ error: 'Internal server error during proxying', details: error.message });
  }
}
