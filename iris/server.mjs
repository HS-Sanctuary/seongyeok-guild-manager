import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { resolve } from 'node:path';
import { readSnapshot } from './reader.mjs';
import { createConnectionHandler } from './connection-http.mjs';

const pagePath = fileURLToPath(new URL('./index.html', import.meta.url));
export function createIrisServer({port = Number(process.env.IRIS_PORT || 4317), nativeToken} = {}) {
let snapshotInFlight;
let bridgeToken;
let bridgeExpiresAt = 0;
const bridgeOrigins = new Set(['http://localhost:3000', 'http://127.0.0.1:3000']);
const connectionHandler = createConnectionHandler({nativeToken});

function bridgeAuthorized(request) {
  const supplied = request.headers['x-iris-pairing'];
  if (typeof supplied !== 'string' || !bridgeToken || Date.now() >= bridgeExpiresAt) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(bridgeToken);
  return a.length === b.length && timingSafeEqual(a, b);
}

function getSnapshot() {
  if (!snapshotInFlight) {
    snapshotInFlight = readSnapshot().finally(() => { snapshotInFlight = undefined; });
  }
  return snapshotInFlight;
}

const server = http.createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (await connectionHandler(request,response)) return;
  // 로컬 전용 정보가 다른 Host 이름을 통해 열리지 않도록 한다.
  if (!['127.0.0.1', 'localhost'].includes(String(request.headers.host || '').split(':')[0])) {
    response.statusCode = 403;
    response.end('Local access only');
    return;
  }
  const origin = request.headers.origin;
  if (request.method === 'OPTIONS' && request.url === '/api/bridge/snapshot' && bridgeOrigins.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'X-IRIS-Pairing');
    response.setHeader('Access-Control-Allow-Private-Network', 'true');
    response.setHeader('Vary', 'Origin');
    response.statusCode = 204;
    response.end();
    return;
  }
  if (request.method === 'POST' && request.url === '/api/bridge/pair') {
    const localOrigins = new Set([`http://127.0.0.1:${port}`, `http://localhost:${port}`]);
    if (!localOrigins.has(origin)) { response.statusCode = 403; response.end('Local page only'); return; }
    bridgeToken = randomBytes(32).toString('base64url');
    bridgeExpiresAt = Date.now() + 30 * 60_000;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify({ token: bridgeToken, expiresAt: new Date(bridgeExpiresAt).toISOString() }));
    return;
  }
  if (request.method === 'GET' && request.url === '/api/bridge/snapshot') {
    if (!bridgeOrigins.has(origin) || !bridgeAuthorized(request)) {
      response.statusCode = 403;
      response.end('Pairing required');
      return;
    }
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      response.end(JSON.stringify({ status: 'connected', data: await getSnapshot() }));
    } catch (error) {
      response.statusCode = 503;
      response.end(JSON.stringify({ status: 'disconnected', message: error.message }));
    }
    return;
  }
  if (request.method === 'DELETE' && request.url === '/api/bridge/snapshot') {
    if (!bridgeOrigins.has(origin) || !bridgeAuthorized(request)) { response.statusCode = 403; response.end('Pairing required'); return; }
    bridgeToken = undefined;
    bridgeExpiresAt = 0;
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.statusCode = 204;
    response.end();
    return;
  }
  if (request.method === 'GET' && request.url === '/') {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end(await readFile(pagePath));
    return;
  }
  if (request.method === 'GET' && request.url === '/api/snapshot') {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      response.end(JSON.stringify({ status: 'connected', data: await getSnapshot() }));
    } catch (error) {
      response.statusCode = 503;
      response.end(JSON.stringify({ status: 'disconnected', message: error.message }));
    }
    return;
  }
  response.statusCode = 404;
  response.end('Not found');
});

return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
const port = Number(process.env.IRIS_PORT || 4317);
const server = createIrisServer({port});
server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`IRIS local preview: http://127.0.0.1:${port}\n`);
});
}
