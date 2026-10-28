import test from 'node:test';import assert from 'node:assert/strict';import {pgPreflight} from './account-online-pg-preflight.mjs';
test('missing Docker and unpinned images never start or contact a database',()=>{
 const calls=[];const result=pgPreflight((...args)=>{calls.push(args);return {status:null,error:Error('not installed')};},'postgres:latest');
 assert.equal(result.status,'NOT_RUN');assert.equal(calls.length,1);assert.deepEqual(calls[0][1],['version','--format','{{.Server.Version}}']);assert.equal(result.realDatabaseCalls,0);assert.equal(result.containersStarted,0);
});
test('ready preflight inspects only a pinned local official image and still starts nothing',()=>{
 const calls=[];const r=pgPreflight((name,args)=>{calls.push(args);return {status:0,stdout:'synthetic-local-image'};},'postgres@sha256:'+'a'.repeat(64));
 assert.equal(r.status,'READY_FOR_SEPARATE_SQL_SETUP');assert.equal(calls.length,2);assert.equal(calls[1][0],'image');assert.equal(r.containersStarted,0);
});
