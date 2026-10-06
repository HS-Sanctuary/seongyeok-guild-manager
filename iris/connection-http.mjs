import { randomBytes, timingSafeEqual } from 'node:crypto';
import { ConnectionState } from './connection-state.mjs';

const origins = new Set(['http://localhost:3000', 'http://127.0.0.1:3000']);
const methods = {
  'native/connect':'POST', 'native/state':'GET', 'native/select':'POST', 'native/disconnect':'POST',
  'browser/consent':'POST', 'browser/characters':'PUT', 'browser/summary':'PUT',
  'browser/selection':'GET', 'browser/disconnect':'POST',
  'native/edits':'POST','native/edits/submit':'POST','native/edits/discard':'POST',
  'browser/write-consent':'POST','browser/edits':'GET','browser/edits/results':'PUT',
};
function matches(supplied, expected) {
  if (typeof supplied !== 'string' || typeof expected !== 'string' || supplied.length > 200) return false;
  const a = Buffer.from(supplied), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a,b);
}
function bodyOf(request) {
  return new Promise((resolve,reject) => {
    let size = 0;
    const chunks = [];
    const finish = (error, value) => {
      clearTimeout(timer);
      request.off('data',data); request.off('end',end); request.off('error',failed); request.off('aborted',aborted);
      if (error) { request.resume(); reject(error); } else resolve(value);
    };
    const failed = () => finish(400);
    const aborted = () => finish(400);
    const data = chunk => {
      size += chunk.length;
      if (size > 65536) finish(413); else chunks.push(chunk);
    };
    const end = () => {
      try {
        const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!value || typeof value !== 'object' || Array.isArray(value)) return finish(400);
        finish(null,value);
      } catch { finish(400); }
    };
    const timer = setTimeout(()=>finish(408),5000);
    request.on('data',data); request.on('end',end); request.on('error',failed); request.on('aborted',aborted);
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers['content-type'] || '')) finish(415);
    else if (Number(request.headers['content-length']) > 65536) finish(413);
  });
}

// The caller supplies a capability only when it owns this server process.
// No environment, URL, disk file or browser route issues the native capability.
export function createConnectionHandler({nativeToken, now = Date.now} = {}) {
  const enabled = typeof nativeToken === 'string' && /^[A-Za-z0-9_-]{43,128}$/.test(nativeToken);
  const state = new ConnectionState({now});
  let browserToken, expiresAt = 0, consent = false, consentAccountId = null;
  function revoke() { browserToken = undefined; expiresAt = 0; consent = false; consentAccountId = null; state.disconnect(); }
  function expire() { if (browserToken && now() >= expiresAt) revoke(); }
  return async (request,response) => {
    if (!request.url?.startsWith('/api/connection/')) return false;
    response.setHeader('Cache-Control','no-store');
    response.setHeader('X-Content-Type-Options','nosniff');
    const reply = (status,data = {error:'Connection request rejected'}) => {
      response.statusCode = status;
      response.setHeader('Content-Type','application/json; charset=utf-8');
      response.end(JSON.stringify(data));
      return true;
    };
    const host = request.headers.host;
    if (![ `127.0.0.1:${request.socket.localPort}`, `localhost:${request.socket.localPort}` ].includes(host)) return reply(403);
    const route = request.url.slice('/api/connection/'.length);
    if (!Object.hasOwn(methods,route)) return reply(404);
    if (!enabled) return reply(503,{error:'Owned native connection unavailable'});
    const browser = route.startsWith('browser/');
    const origin = request.headers.origin;
    expire();
    // Known local pages must be able to distinguish 403 from a transport failure.
    // CORS exposes only the generic rejection; authorization still gates all state.
    if (browser && origins.has(origin)) {
      response.setHeader('Access-Control-Allow-Origin',origin);
      response.setHeader('Vary','Origin');
    }
    if (browser && origins.has(origin) && request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Origin',origin);
      response.setHeader('Vary','Origin');
      response.setHeader('Access-Control-Allow-Methods',methods[route]);
      response.setHeader('Access-Control-Allow-Headers','Content-Type, X-IRIS-Browser');
      response.setHeader('Access-Control-Allow-Private-Network','true');
      response.statusCode = 204; response.end(); return true;
    }
    const authorized = () => browser
      ? origins.has(origin) && matches(request.headers['x-iris-browser'],browserToken)
      : origin === undefined && matches(request.headers['x-iris-native'],nativeToken);
    if (!authorized()) return reply(403);
    if (request.method !== methods[route]) return reply(405);
    if (browser && !consent && route !== 'browser/consent') return reply(403);
    const capabilityAtStart = browserToken;
    let body;
    if (request.method !== 'GET') {
      try { body = await bodyOf(request); } catch(status) { return reply(status); }
      // A slow request cannot revive a token revoked/rotated while its body arrived.
      expire();
      if (!authorized() || (browser && capabilityAtStart !== browserToken)) return reply(403);
    }
    if (route === 'native/connect') {
      if(state.snapshot().editQueue.edits.length && body.discardPending!==true)return reply(409);
      state.discardEdits();
      revoke();
      const generation = state.begin();
      browserToken = randomBytes(32).toString('base64url'); expiresAt = now() + 30*60_000;
      return reply(200,{generation,browserToken,expiresAt});
    }
    if (route.endsWith('/disconnect')) {
      if (route === 'native/disconnect' && body.generation !== state.snapshot().generation) return reply(409);
      if(route==='native/disconnect'&&state.snapshot().editQueue.edits.length&&body.discardPending!==true)return reply(409);
      revoke(); return reply(200,{status:'disconnected'});
    }
    if (route === 'native/state') return reply(200,state.snapshot());
    if(route==='browser/write-consent')return state.setWriteAllowed(body.generation,body.allowed)?reply(200,{status:'received'}):reply(409);
    if(route==='native/edits')return state.stageEdit(body.edit)?reply(200,{status:'received'}):reply(409);
    if(route==='native/edits/submit')return state.submitEdits(body.generation,body.selectionVersion)?reply(200,{status:'received'}):reply(409);
    if(route==='native/edits/discard'){if(body.generation!==state.snapshot().generation)return reply(409);state.discardEdits();return reply(200,{status:'discarded'});}
    if(route==='browser/edits')return reply(200,{generation:state.snapshot().generation,edits:state.takeEdits(state.snapshot().generation)});
    if(route==='browser/edits/results')return state.applyEditResults(body.generation,body.selectionVersion,body.results)?reply(200,{status:'received'}):reply(409);
    if (route === 'browser/selection') {
      const {generation,selectionVersion,selectedId,status,writeAllowed} = state.snapshot();
      return reply(200,{generation,selectionVersion,selectedId,status,writeAllowed});
    }
    if (route === 'native/select') {
      const selectionVersion = state.select(body.generation,body.characterId,body.discardPending===true);
      return selectionVersion === null ? reply(409) : reply(200,{selectionVersion});
    }
    if (route === 'browser/consent') {
      if (body.generation !== state.snapshot().generation) return reply(409);
      consent = true; return reply(200,{status:'consented'});
    }
    if (route === 'browser/characters' && body.generation === state.snapshot().generation &&
        consentAccountId !== null && body.accountId !== consentAccountId) {
      revoke(); return reply(409);
    }
    const ok = route === 'browser/characters'
      ? state.setCharacters(body.generation,body)
      : state.setSummary(body.generation,body.selectionVersion,body.characterId,body.summary,body.details,body.writeContext);
    if (ok && route === 'browser/characters') consentAccountId = state.snapshot().accountId;
    return ok ? reply(200,{status:'received'}) : reply(409);
  };
}
