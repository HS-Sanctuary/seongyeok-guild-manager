import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTS } from './load-ts.mjs';
const utils = loadTS('lib/busUtils.ts', {
  '@/lib/supabase': { supabase: {} }, '@/lib/memberMutationClient': {},
});
const { assembleBalancedParty, getRoleByJob, validateStatRequirement } = utils;
const req = { min_cp: 50, rec_cp: 100, op_cp: 200, rec_mr: 0, op_mr: 0 };
const classes = [{ name: '대검전사', role: '근딜' }, { name: '사제', role: '힐러' }];
const candidate = (name, cp, owner = name, extra = {}) => ({
  character_name: name, owner_account: owner, job: '대검전사', combat_power: cp, ...extra,
});
test('four seats include overpower, recommended and below-recommended from initial assembly', () => {
  const pool = [candidate('op1', 300), candidate('op2', 280), candidate('rec1', 150), candidate('rec2', 140), candidate('low1', 70), candidate('low2', 60)];
  const names = assembleBalancedParty(pool, 4, req, undefined, classes).selected.map(m => m.character_name);
  assert.equal(names.length, 4);
  assert.ok(names.some(n => n.startsWith('low')), names.join(','));
  assert.ok(names.some(n => n.startsWith('op')));
  assert.ok(names.some(n => n.startsWith('rec')));
});
test('eight seats use three overpower, two or three recommended, two or three others', () => {
  const pool = Array.from({length: 5}, (_, i) => candidate(`op${i}`, 300-i))
    .concat(Array.from({length: 4}, (_, i) => candidate(`rec${i}`, 150-i)), Array.from({length: 4}, (_, i) => candidate(`low${i}`, 70-i)));
  const names = assembleBalancedParty(pool, 8, req, undefined, classes).selected.map(m => m.character_name);
  assert.equal(names.filter(n => n.startsWith('op')).length, 3);
  assert.ok([2,3].includes(names.filter(n => n.startsWith('rec')).length));
  assert.ok([2,3].includes(names.filter(n => n.startsWith('low')).length));
});
test('uncleared alt can replace a completed repeat character on the same account', () => {
  const pool = [candidate('repeat-main', 500, 'same', {is_completed: true, allow_repeat: true}), candidate('waiting-alt', 230, 'same'), candidate('rec', 140), candidate('low', 70), candidate('other', 60)];
  const selected = assembleBalancedParty(pool, 4, req, undefined, classes).selected;
  assert.ok(selected.some(m => m.character_name === 'waiting-alt'));
  assert.equal(new Set(selected.map(m => m.owner_account)).size, selected.length);
});
test('missing overpower threshold does not classify every character as overpower', () => {
  assert.equal(validateStatRequirement(150, 0, {rec_cp:100}).isOpPassed, false);
});
test('admin class role wins over saved role and supporter is bard only', () => {
  assert.equal(getRoleByJob('대검전사', classes), '근딜');
  assert.equal(getRoleByJob('악사', [{name:'악사',role:'서포터'}]), '원딜');
  assert.equal(getRoleByJob('음유시인', [{name:'음유시인',role:'서포터'}]), '서포터');
});
test('content cut matches prefixed party names to the admin catalog without changing difficulty', () => {
  const reqs=[{...req,content_type:'raid',content_name:'에이렐',difficulty:'어려움'}];
  assert.deepEqual(utils.findPartyPowerReq?.(reqs,'레이드 - 에이렐','어려움'),reqs[0]);
  assert.equal(utils.findPartyPowerReq?.(reqs,'레이드 - 에이렐','매우 어려움'),null);
});
test('persisted queue priority changes the roster but preserves four-seat tier balance', () => {
  const pool=[candidate('op1',300),candidate('op2',280),candidate('rec1',150),candidate('rec2',140),candidate('low1',70),candidate('low2',60)];
  const first=assembleBalancedParty(pool,4,req,undefined,classes).selected.map(m=>m.character_name);
  const rotated=[...pool.filter(c=>!first.includes(c.character_name)),...pool.filter(c=>first.includes(c.character_name))].map((c,i)=>({...c,selection_order:i}));
  const next=assembleBalancedParty(rotated,4,req,undefined,classes).selected.map(m=>m.character_name);
  assert.notDeepEqual(next,first);
  assert.ok(next.some(n=>n.startsWith('low')));
});
test('sparse tiers still fill seats and never select two characters from one account', () => {
  const pool=[candidate('main',300,'a'),candidate('alt',299,'a'),candidate('b',298),candidate('c',297),candidate('d',296)];
  const selected=assembleBalancedParty(pool,4,req,undefined,classes).selected;
  assert.equal(selected.length,4);
  assert.equal(new Set(selected.map(m=>m.owner_account)).size,4);
});
