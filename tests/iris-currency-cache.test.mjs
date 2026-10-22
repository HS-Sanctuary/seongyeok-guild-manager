import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadTS} from './load-ts.mjs';
const api=existsSync('lib/irisCurrencyCache.ts')?loadTS('lib/irisCurrencyCache.ts'):{};
const scope={environment:'development',accountId:'a'};
const snapshot={schemaVersion:1,...scope,attribution:'unverified',items:[{name:'골드',amount:0,observedAt:'2026-10-22T01:00:00.000Z'}]};
test('cache is strict, owner/environment isolated and never identifies a game character',()=>{
 assert.equal(typeof api.parseCurrencyCache,'function');assert.deepEqual(api.parseCurrencyCache(snapshot,scope),snapshot);
 for(const value of [{...snapshot,accountId:'b'},{...snapshot,environment:'production'},{...snapshot,attribution:'verified'},{...snapshot,characterId:'c'},{...snapshot,items:[...snapshot.items,...snapshot.items]},{...snapshot,items:[{...snapshot.items[0],amount:null}]},{...snapshot,items:[{...snapshot.items[0],amount:-1}]}])assert.throws(()=>api.parseCurrencyCache(value,scope));
});
test('cache requires canonical timestamps, bounded values and preserves explicit zero',()=>{
 assert.equal(typeof api.parseCurrencyCache,'function');assert.equal(api.parseCurrencyCache(snapshot,scope).items[0].amount,0);
 for(const amount of [Infinity,NaN,1.2,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>api.parseCurrencyCache({...snapshot,items:[{...snapshot.items[0],amount}]},scope));
 for(const observedAt of ['bad','2026-01-01','99999-01-01T00:00:00.000Z'])assert.throws(()=>api.parseCurrencyCache({...snapshot,items:[{...snapshot.items[0],observedAt}]},scope));
});
