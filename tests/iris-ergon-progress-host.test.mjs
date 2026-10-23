import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {loadTS} from './load-ts.mjs';

test('review regressions protect approval, collection, pruning and lease handoff', {skip:process.platform!=='win32'},()=>{
 const output=execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','iris/desktop-life-progress-host.tests.ps1','-CaseID','review'],{encoding:'utf8',timeout:120000,windowsHide:true});
 for(let i=1;i<=5;i++)assert.match(output,new RegExp(`PASS R${String(i).padStart(2,'0')} `));
});

test('actual executor and progress store reconcile native terminal without real CLI', {skip:process.platform!=='win32'},()=>{
 const output=execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','iris/desktop-life-progress-host.tests.ps1'],{encoding:'utf8',timeout:120000,windowsHide:true});
 for(let i=1;i<=22;i++)assert.match(output,new RegExp(`PASS H${String(i).padStart(2,'0')}/?`));
});

test('progress client reads strict native scoped projection and never falls back to local progress',async()=>{
 const {createDesktopStore}=loadTS('lib/irisDesktopStore.ts');let listener;const calls=[];
 const scope={environment:'development',accountId:'synthetic-account',characterId:'synthetic-character'};
 let view={schemaVersion:1,revision:0,health:'ok',scope,capacityWarning:false,recoveryCandidates:[],goals:[]};
 const store=createDesktopStore({environment:'development',context:()=>({epoch:1,environment:'development'}),channel:{addEventListener:(_,l)=>listener=l,removeEventListener:()=>{},postMessage:message=>{calls.push(message);queueMicrotask(()=>listener({data:{version:1,id:message.id,epoch:1,ok:true,value:view}}));}}});
 assert.equal(typeof store.loadErgonProgress,'function');assert.deepEqual(await store.loadErgonProgress(scope),view);
 assert.equal(calls[0].method,'game.life.progress.load');assert.deepEqual(calls[0].payload,{accountId:scope.accountId,characterId:scope.characterId});
 view={...view,scope:{...scope,characterId:'foreign'}};await assert.rejects(()=>store.loadErgonProgress(scope));
 await assert.rejects(()=>store.loadErgonProgress({...scope,path:'synthetic-path'}));
});
