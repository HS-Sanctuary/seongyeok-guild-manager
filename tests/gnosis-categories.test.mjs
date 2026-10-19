import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTS } from './load-ts.mjs';

test('new navigation keeps the requested seven labels and legacy category display', () => {
  const { GNOSIS_SECTIONS, gnosisCategoryLabel } = loadTS('lib/gnosisCategories.ts');
  assert.deepEqual(GNOSIS_SECTIONS, ['전체', '클래스', '전투', '생활', '패션', '악보', '기타']);
  assert.equal(gnosisCategoryLabel('악보 지식'), '악보');
  assert.equal(gnosisCategoryLabel('기타 지식'), '기타');
  assert.equal(gnosisCategoryLabel('도적'), '도적');
});

test('old and new music and miscellaneous records stay visible without rewriting data', () => {
  const { matchesGnosisSection } = loadTS('lib/gnosisCategories.ts');
  for (const [section, categories] of [['악보', ['악보', '악보 지식']], ['기타', ['기타', '기타 지식']]]) {
    for (const category of categories) {
      const guide = Object.freeze({ sub_category: category });
      assert.equal(matchesGnosisSection(section, guide, new Set()), true);
      assert.equal(guide.sub_category, category);
      assert.equal(matchesGnosisSection('전체', guide, new Set()), true);
    }
  }
});

test('class and life filters use their actual subcategories', () => {
  const { matchesGnosisSection } = loadTS('lib/gnosisCategories.ts');
  const classes = new Set(['도적', '새 직업']);
  assert.equal(matchesGnosisSection('클래스', { sub_category: '새 직업' }, classes), true);
  assert.equal(matchesGnosisSection('생활', { sub_category: '가공' }, classes), true);
  assert.equal(matchesGnosisSection('생활', { sub_category: '도적' }, classes), false);
  assert.equal(matchesGnosisSection('클래스', { sub_category: '악보 지식' }, classes), false);
});

test('fashion includes named categories and previously attached outfit data', () => {
  const { matchesGnosisSection } = loadTS('lib/gnosisCategories.ts');
  for (const guide of [{ sub_category: '패션' }, { sub_category: '패션 지식' }, { sub_category: '도적', item_data: { itemName: '상의', dyeParts: ['#ffffff'] } }]) {
    assert.equal(matchesGnosisSection('패션', guide, new Set(['도적'])), true);
  }
  assert.equal(matchesGnosisSection('패션', { sub_category: '도적', item_data: null }, new Set(['도적'])), false);
  assert.equal(matchesGnosisSection('패션', { sub_category: '도적' }, new Set(['도적'])), false);
});

test('combat is its own category and accepts the older display suffix', () => {
  const { matchesGnosisSection } = loadTS('lib/gnosisCategories.ts');
  assert.equal(matchesGnosisSection('전투', { sub_category: '전투' }, new Set()), true);
  assert.equal(matchesGnosisSection('전투', { sub_category: '전투 지식' }, new Set()), true);
  assert.equal(matchesGnosisSection('전투', { sub_category: '도적' }, new Set(['도적'])), false);
});

test('combat includes all four child boards without mixing class or life posts', () => {
  const { GNOSIS_COMBAT_CATEGORIES, matchesGnosisSection } = loadTS('lib/gnosisCategories.ts');
  assert.deepEqual(GNOSIS_COMBAT_CATEGORIES, ['레이드 공략', '어비스 공략', '나이트메어 드릴 공략', '기타 전투 공략']);
  for (const sub_category of GNOSIS_COMBAT_CATEGORIES) {
    const guide = Object.freeze({ sub_category });
    assert.equal(matchesGnosisSection('전투', guide, new Set(['전사'])), true);
    assert.equal(matchesGnosisSection('전체', guide, new Set(['전사'])), true);
    assert.equal(matchesGnosisSection('클래스', guide, new Set(['전사'])), false);
    assert.equal(matchesGnosisSection('생활', guide, new Set(['전사'])), false);
  }
});
