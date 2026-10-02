import { CONTENT_DB, type ContentItem, type ContentPowerReq } from '@/components/party/types';

export const normalizeContentName = (name: string) => name
  .replace(/^(레이드|어비스)\s*-\s*/, '').replace(/\s*\(.*?\)\s*$/, '').trim();
export const normalizeDifficulty = (difficulty: string) => difficulty.replace(/\s+/g, '');

export function getContentRequirements(item: ContentItem, reqs: ContentPowerReq[]): ContentPowerReq[] {
  const type = item.category === '레이드' ? 'raid' : 'abyss';
  return reqs.filter(req => req.content_type === type &&
    normalizeContentName(req.content_name) === normalizeContentName(item.name));
}

/** Static entries retain selection IDs/names; only the DB supplies selectable difficulties. */
export function getPartyContentOptions(reqs: ContentPowerReq[], subContents = ['abyss_1','abyss_2','abyss_3']): ContentItem[] {
  const rowsFor = (item: ContentItem) => getContentRequirements(item, reqs);
  const diffsFor = (item: ContentItem) => [...new Set(rowsFor(item).map(row => row.difficulty).filter(Boolean))];
  return CONTENT_DB.map(item => {
    let diffs: string[];
    if (item.id === 'abyss_all') {
      const selected = subContents.map(id => CONTENT_DB.find(content => content.id === id && content.category === '어비스' && content.id !== 'abyss_all'));
      // A multi-dungeon party must have a difficulty registered for every selected dungeon.
      diffs = selected.length && selected.every(Boolean) ? diffsFor(selected[0]!).filter(diff =>
        selected.every(content => diffsFor(content!).some(value => normalizeDifficulty(value) === normalizeDifficulty(diff)))) : [];
    } else {
      diffs = diffsFor(item);
    }
    const defaultDiff = diffs.find(diff => normalizeDifficulty(diff) === normalizeDifficulty(item.defaultDiff)) || diffs[0] || '';
    const size = rowsFor(item).find(row => row.difficulty === defaultDiff)?.max_members || item.size;
    return {...item, diffs, defaultDiff, size};
  });
}

export function isSupportedPartyContent(item: ContentItem, difficulty: string, reqs: ContentPowerReq[], subContents?: string[]): boolean {
  return getPartyContentOptions(reqs, subContents).find(option => option.id === item.id)?.diffs
    .some(diff => normalizeDifficulty(diff) === normalizeDifficulty(difficulty)) ?? false;
}
