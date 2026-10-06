import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';

async function reserve() {
  const server=http.createServer();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  await new Promise(resolve=>server.close(resolve));
  return port;
}
function child(port) {
  return spawn(process.execPath,[fileURLToPath(new URL('./owned-server.mjs',import.meta.url))],{
    env:{...process.env,IRIS_PORT:String(port)},windowsHide:true,stdio:['pipe','pipe','pipe'],
  });
}
test('owned server receives capability only through private stdin and closes on owner EOF',async()=> {
  const port=await reserve(),process=child(port),exited=once(process,'exit');
  let output='';process.stdout.on('data',data=>output+=data);process.stderr.on('data',data=>output+=data);
  try {
    const ready=Promise.race([
      once(process.stdout,'data'),
      exited.then(()=>{throw new Error('Owned server exited before ready');}),
    ]);
    process.stdin.write('n'.repeat(43)+'\n');
    const [line]=await ready;
    assert.equal(line.toString(),'IRIS_READY\n');
    const response=await fetch(`http://127.0.0.1:${port}/api/connection/native/state`,{headers:{'X-IRIS-Native':'n'.repeat(43)}});
    assert.equal(response.status,200);
    assert.equal(output.includes('n'.repeat(43)),false);
    process.stdin.end();
    assert.equal((await exited)[0],0);
    const probe=http.createServer();
    await new Promise((resolve,reject)=>{probe.once('error',reject);probe.listen(port,'127.0.0.1',resolve);});
    await new Promise(resolve=>probe.close(resolve));
  } finally {if(process.exitCode===null) {process.kill();await exited;}}
});
test('invalid or oversized bootstrap input fails closed without echoing input',async()=> {
  for(const input of ['invalid-secret\n','x'.repeat(300)+'\n']) {
    const process=child(await reserve()),exited=once(process,'exit');let output='';
    process.stdout.on('data',data=>output+=data);process.stderr.on('data',data=>output+=data);
    process.stdin.on('error',()=>{});process.stdin.end(input);
    assert.equal((await exited)[0],1);
    assert.equal(output.includes('IRIS_READY'),false);
    assert.equal(output.trim(),'IRIS_BOOTSTRAP_FAILED');
    assert.equal(output.includes(input.trim()),false);
  }
});
