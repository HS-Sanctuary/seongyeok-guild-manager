// Private parent pipe only. Never put native capabilities in argv, env or files.
import {createIrisServer} from './server.mjs';

let server;
let initialized=false,ending=false;
let buffered='';
const timer=setTimeout(()=>fail(),5000);
function fail() {
  if(ending) return;
  ending=true;clearTimeout(timer);
  process.stderr.write('IRIS_BOOTSTRAP_FAILED\n');
  if(server) {server.closeAllConnections();server.close();}
  process.exit(1);
}
function shutdown() {
  if(ending) return;
  ending=true;clearTimeout(timer);
  if(!initialized) {process.stderr.write('IRIS_BOOTSTRAP_FAILED\n');process.exit(1);}
  if(server) {server.closeAllConnections();server.close(()=>process.exit(0));}
  else process.exit(0);
}
process.stdin.setEncoding('utf8');
process.stdin.on('data',chunk=> {
  if(initialized || ending) return;
  buffered+=chunk;
  if(buffered.length>256) return fail();
  const newline=buffered.indexOf('\n');
  if(newline<0) return;
  const token=buffered.slice(0,newline).replace(/\r$/,'');
  if(!/^[A-Za-z0-9_-]{43,128}$/.test(token) || buffered.slice(newline+1).length) return fail();
  buffered='';initialized=true;clearTimeout(timer);
  const port=Number(process.env.IRIS_PORT || 4317);
  if(!Number.isSafeInteger(port) || port<1 || port>65535) return fail();
  server=createIrisServer({port,nativeToken:token});
  server.once('error',fail);
  server.listen(port,'127.0.0.1',()=>process.stdout.write('IRIS_READY\n'));
});
process.stdin.on('end',shutdown);
process.stdin.on('error',fail);
process.on('SIGTERM',shutdown);
process.on('SIGINT',shutdown);
