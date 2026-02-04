import http from 'http';
import fs from 'fs';

const PORT = 3001;
const LOG_FILE = 'browser-debug.log';

const server = http.createServer((req, res) => {
  // Ultra-permissive CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const log = JSON.parse(body);
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${log.type.toUpperCase()}] ${log.message}\n${log.stack || ''}\n---\n`;
        
        fs.appendFileSync(LOG_FILE, logEntry);
        console.log(`Received log: ${log.message.substring(0, 50)}...`);
        res.writeHead(200);
        res.end('Logged');
      } catch (e) {
        console.error("Error parsing log body", e);
        res.writeHead(400);
        res.end('Bad Request');
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Logger bridge active on http://localhost:${PORT}`);
});