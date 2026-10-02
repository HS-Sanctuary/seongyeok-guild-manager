import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTS } from '../tests/load-ts.mjs';
const policy = loadTS('lib/guildBusPolicy.ts');
const {eligibleBusCandidates,isBusOperator,formatBusRoster} = policy;

const bus = { party_date: '2026-09-30', time_start: '21:00', time_end: '24:00' };
const members = [
  { character_name: '한설', time_start: '21:00', time_end: '24:00', is_completed: true, allow_repeat: true },
  { character_name: '늦은손님', time_start: '22:00', time_end: '23:00', is_completed: false },
  { character_name: '완료손님', time_start: '21:00', time_end: '24:00', is_completed: true, allow_repeat: false },
];

test('21시 구성은 22시 시작 신청자와 반복 불가 완료자를 제외한다', () => {
  assert.deepEqual(eligibleBusCandidates(members, bus, new Date('2026-09-30T12:00:00Z')).map(m => m.character_name), ['한설']);
});

test('22시에는 늦은 신청자를 포함하고 23시에는 제외한다', () => {
  assert.deepEqual(eligibleBusCandidates(members, bus, new Date('2026-09-30T13:00:00Z')).map(m => m.character_name), ['한설', '늦은손님']);
  assert.deepEqual(eligibleBusCandidates(members, bus, new Date('2026-09-30T14:00:00Z')).map(m => m.character_name), ['한설']);
});

test('관리자라도 현재 운행자가 아니면 컨트롤러 권한이 없다', () => {
  assert.equal(isBusOperator('한설', '다른관리자', ['다른관리자캐릭터'], true), false);
  assert.equal(isBusOperator('한설', '한설계정', ['한설'], true), true);
  assert.equal(isBusOperator('인계받은관리자', '인계받은관리자', [], true), true);
  assert.equal(isBusOperator('한설', '한설계정', ['한설'], false), false);
});

test('구성 안내는 반복 잔존자를 먼저, 새 인원을 다음 줄에 적는다', () => {
  assert.equal(formatBusRoster(['한설', '늦은손님'], members), '잔존: 한설\n변경: 늦은손님');
});
test('본인 캐릭터가 없으면 다른 계정 캐릭터를 자기 목록으로 쓰지 않는다', () => {
  assert.deepEqual(policy.ownedPartyCharacters?.([{nickname:'driver',owner:'admin'}],'outsider'),[]);
});
test('홈과 시낙시스가 레거시 메모를 포함해 동일하게 길드버스를 판별한다', () => {
  assert.equal(policy.isGuildBusParty?.({memo:'[성역 길드 버스] 안내'}),true);
  assert.equal(policy.isGuildBusParty?.({party_type:'길드버스'}),true);
  assert.equal(policy.isGuildBusParty?.({is_guild_bus:true}),true);
  assert.equal(policy.isGuildBusParty?.({party_type:'1회 클리어',sub_content:'일반 파티'}),false);
});
