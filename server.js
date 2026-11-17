/**
 * ShipGuard Local Dev & Interactive Preview Server
 * Serves static Custom UI and handles MCP / Forge resolver requests
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleMcpRequest } from './src/mcp_server.js';
import { calculateBlastRadius } from './src/blast_radius.js';
import { queryReleaseGraph } from './src/twg_graph.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const STATIC_DIR = path.join(__dirname, 'static', 'frontend');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // API Endpoint: MCP Protocol Server (/api/mcp)
  if (url.pathname === '/api/mcp' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const json = JSON.parse(body || '{}');
        const mcpRes = await handleMcpRequest(json);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mcpRes, null, 2));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: `Parse error: ${err.message}` }
        }));
      }
    });
    return;
  }

  // API Endpoint: Forge Bridge Mock Resolver (/api/resolver)
  if (url.pathname === '/api/resolver' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { functionKey, payload } = JSON.parse(body || '{}');
        let result;
        if (functionKey === 'getIssueBlastRadius') {
          result = await calculateBlastRadius(payload?.issueKey || 'PROJ-1042');
        } else if (functionKey === 'getReleaseDashboard') {
          result = await queryReleaseGraph(payload?.version || 'v2.4.0');
        } else if (functionKey === 'postReceiptToIssue') {
          const hash = `REC-${Date.now().toString(36).toUpperCase()}`;
          result = {
            success: true,
            receiptId: hash,
            message: `Verification receipt ${hash} attached to ${payload?.issueKey || 'PROJ-1042'}`
          };
        } else {
          result = { success: true };
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Static File Serving
  let filePath = path.join(STATIC_DIR, url.pathname === '/' ? 'index.html' : url.pathname);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(content);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`ShipGuard Preview Server running at http://0.0.0.0:${PORT}`);
});
