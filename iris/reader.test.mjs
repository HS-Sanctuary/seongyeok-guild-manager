import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSnapshot, readCommand } from './reader.mjs';

test('허용되지 않은 실행 명령을 거부한다', () => {
  assert.throws(() => readCommand('execute_gathering'), /읽기 명령/);
});

test('캐릭터·가공 데이터에서 필요한 값만 추출한다', () => {
  const result = normalizeSnapshot(
    { Name: '공개하지 않을 이름', AccountId: 'private', Level: 100, EnabledCombatJobDisplayName: '힐러', CombatScore: { Value: 103126 }, LivingScore: 19364, AttractivenessScore: { Value: 815 }, ArcaneResistance: 7134, DecorScore: { Value: 2100 } },
    { completedCount: 2, works: [{ FacilityName: '목재 가공 시설', State: 'InProgress' }, { FacilityName: '목재 가공 시설', IsCompleted: true }] },
    [{ IsCompleted: true, IsRewardReceived: false }, { IsCompleted: false, IsRewardReceived: false }],
    [{ IsCompleted: true, IsRewardReceived: true, Description: '어비스 1회 토벌', CurrentCount: 1, GoalCount: 1 }],
    [{ DisplayName: '은동전', Amount: 250 }, { DisplayName: '마족 공물', Amount: 13 }],
  );
  assert.equal(result.character.combatScore, 103126);
  assert.equal(result.character.livingScore, 19364);
  assert.equal(result.character.attractivenessScore, 815);
  assert.equal(result.character.arcaneResistance, 7134);
  assert.equal(result.character.decorScore, 2100);
  assert.equal(result.processing.facilityCount, 1);
  assert.equal(result.processing.available, true);
  assert.equal(result.processing.completed, 2);
  assert.deepEqual(result.missions.daily, { available: true, total: 2, completed: 1, received: 0 });
  assert.deepEqual(result.missions.weekly, { available: true, total: 1, completed: 1, received: 1 });
  assert.deepEqual(result.missions.weeklyActivityProgress[0].goals, [{ current: 1, goal: 1, completed: true }]);
  assert.equal(result.currencies.silverCoins, 250);
  assert.equal(result.currencies.demonTributes, 13);
  assert.equal(JSON.stringify(result).includes('private'), false);
  assert.equal(JSON.stringify(result).includes('공개하지 않을 이름'), false);
});

test('가공기 응답 실패를 빈 작업으로 오인하지 않는다', () => {
  assert.equal(normalizeSnapshot({}, null).processing.available, false);
});

test('시설별 등록 작업 수와 가장 빠른 남은 시간만 추출하고 품목 원문은 제외한다', () => {
  const processing = normalizeSnapshot({}, {works:[
    {FacilityName:'목재 가공 시설',DisplayName:'private item',State:'InProgress',RemainingSeconds:180},
    {FacilityName:'목재 가공 시설',State:'InProgress',RemainingSeconds:60},
    {FacilityName:'목재 가공 시설',IsCompleted:true,RemainingSeconds:0},
    {FacilityName:'금속 가공 시설',State:'InProgress',RemainingSeconds:null},
  ]}).processing;
  assert.deepEqual(processing.facilities[0], {name:'목재 가공 시설',active:2,completed:1,total:3,remainingSeconds:60});
  assert.equal(processing.facilities[1].remainingSeconds,null);
  assert.equal(JSON.stringify(processing).includes('private item'),false);
});

test('게임 연결 해제 응답은 연결 대기로 분류한다', async () => {
  await assert.rejects(readCommand('get_my_info', { execute: (_path, _args, _options, callback) => callback(Object.assign(new Error('exit 5'), { code: 5 }), '{"pipe":"disconnected","reason":"game_off"}') }), /게임 CLI 연결 대기/);
});
