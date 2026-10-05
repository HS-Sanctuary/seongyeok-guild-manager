import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTS} from './load-ts.mjs';

test('read and disabled notifications never appear in inbox or badge',()=>{
  const {visibleNotifications,normalizePreferences}=loadTS('lib/notificationPolicy.ts');
  const items=[{id:1,type:'생텀 업데이트'},{id:2,type:'KRONOS · 주간 숙제'},{id:3,type:'운영 · 가입 승인'}];
  assert.deepEqual(visibleNotifications(items,[1],normalizePreferences({kronos:false})).map(x=>x.id),[3]);
});
test('each module can mute delivery without muting operational approvals',()=>{
  const {notificationEnabled,normalizePreferences}=loadTS('lib/notificationPolicy.ts');
  for(const [key,type] of [['kerygma','생텀 가이드'],['kronos','KRONOS · 주간 숙제'],['agora','AGORA · 판테온'],['synaxis','SYNAXIS · 매칭 완료'],['logos','LOGOS · 정리 검토']]) {
    const prefs=normalizePreferences({[key]:false});
    assert.equal(notificationEnabled({type},prefs),false);
    assert.equal(notificationEnabled({type:'운영 · 가입 승인'},prefs),true);
  }
});
test('damaged preferences default to enabled and all-read preserves previous receipts',()=>{
  const {normalizePreferences,mergeReadIds}=loadTS('lib/notificationPolicy.ts');
  assert.equal(normalizePreferences({kronos:'false'}).kronos,true);
  assert.deepEqual(mergeReadIds([1,2],[2,3]),[1,2,3]);
  assert.equal(mergeReadIds(Array.from({length:50},(_,i)=>i+1),[51]).includes(1),true);
});
test('preference storage is isolated between accounts',()=>{
  const {preferenceStorageKey}=loadTS('lib/notificationPolicy.ts');
  assert.notEqual(preferenceStorageKey('한설'),preferenceStorageKey('뉴월'));
});
