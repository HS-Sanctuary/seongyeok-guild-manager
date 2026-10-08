import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadTS} from './load-ts.mjs';
test('currency boundary preserves zero and large amounts without turning absent values into zero',()=>{
  assert.ok(existsSync('lib/irisCurrencies.ts'),'Missing currency contract');
  const {parseCurrencies}=loadTS('lib/irisCurrencies.ts');
  const value=parseCurrencies({observedAt:'2026-10-08T01:00:00.000Z',items:[{name:'골드',amount:12345678901},{name:'은동전',amount:0},{name:'웨카',amount:null}]});
  assert.deepEqual(value.items,[{name:'골드',amount:12345678901},{name:'은동전',amount:0},{name:'웨카',amount:null}]);
  for(const items of [[{name:'골드',amount:-1}],[{name:'골드',amount:Infinity}],[{name:'골드',amount:1},{name:'골드',amount:2}]])assert.throws(()=>parseCurrencies({observedAt:'2026-10-08T01:00:00.000Z',items}));
});
