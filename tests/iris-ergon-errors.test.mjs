import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import {loadTS} from './load-ts.mjs';
const api=existsSync('lib/irisErgonErrors.ts')?loadTS('lib/irisErgonErrors.ts'):{};
test('approved life errors explain missing wings, unsafe activity and protected unknown without leaking codes',()=>{
 assert.equal(typeof api.ergonErrorMessage,'function');assert.match(api.ergonErrorMessage('life_not_enough_wings'),/날개/);assert.match(api.ergonErrorMessage('life_unresolved'),/미확정|확인/);assert.match(api.ergonErrorMessage('life_game_blocked'),/게임/);
 for(const code of ['life_not_enough_wings','life_unresolved','life_game_blocked','life_not_available','life_stock_changed'])assert.doesNotMatch(api.ergonErrorMessage(code),/life_/);
});
test('unknown native errors cannot become user-visible raw paths, response bodies or secrets',()=>{
 for(const code of ['C:\\secret\\token.txt','{"apiKey":"secret"}',null,{},'unapproved_custom_error'])assert.equal(api.ergonErrorMessage(code),null);
});
