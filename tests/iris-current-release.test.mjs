import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadTS} from './load-ts.mjs';
test('the advertised IRIS release has bounded version-matched changelog available before install',()=>{
 const {IRIS_BETA_VERSION}=loadTS('lib/irisRelease.ts');
 const {parseIrisUpdateNotes}=loadTS('lib/irisUpdateNotes.ts');
 const raw=readFileSync(`public/IRIS/notes/${IRIS_BETA_VERSION}.json`,'utf8');
 assert.ok(Buffer.byteLength(raw)<16384);
 const notes=parseIrisUpdateNotes(JSON.parse(raw),IRIS_BETA_VERSION);
 assert.ok(notes.sections.length>0);
});
