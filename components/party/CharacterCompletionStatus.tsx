'use client';

import type {PartyCatalog} from '@/hooks/usePartyCatalog';
import {cleanItemName, isTaskChecked} from '@/lib/matchingUtils';

type Character = {nickname?: string; name?: string; raid_checks?: unknown; _missing?: boolean};

export function CharacterCompletionName({character, expanded, onToggle}: {
  character: Character; expanded: boolean; onToggle: () => void;
}) {
  const name = character.nickname || character.name || '캐릭터';
  return <button type="button" aria-label={`${name} 완료 상태 보기`} aria-expanded={expanded}
    onClick={event => {event.stopPropagation(); onToggle();}}
    className="min-w-0 text-left font-black text-xs sm:text-sm text-[var(--text-main)] cursor-pointer hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded break-words [overflow-wrap:anywhere]">
    {name} <span aria-hidden="true" className="text-[var(--accent)]">{expanded ? '▴' : '▾'}</span>
  </button>;
}

export default function CharacterCompletionStatus({character, catalog, onClose}: {
  character: Character; catalog: PartyCatalog; onClose: () => void;
}) {
  const name = character.nickname || character.name || '캐릭터';
  let checks = character.raid_checks;
  if (typeof checks === 'string') {
    try {checks = JSON.parse(checks);} catch {checks = undefined;}
  }
  const unavailable = character._missing || checks === undefined ||
    (checks !== null && typeof checks !== 'object');
  const message = catalog.error ? '완료 상태 기준을 불러오지 못했어요. 새로고침 후 다시 확인해주세요.' :
    !catalog.loaded ? '완료 상태 기준을 불러오는 중이에요.' :
    unavailable ? '크로노스 저장 상태를 확인할 수 없어요. 새로고침 후 다시 확인해주세요.' : null;

  return <section role="region" aria-label={`${name} 레이드·어비스 완료 상태`}
    onClick={event => event.stopPropagation()}
    onKeyDown={event => {if (event.key === 'Escape') {event.stopPropagation(); onClose();}}}
    className="min-w-0 w-full rounded-xl border border-[var(--panel-border)] bg-[var(--inner-box)] p-3 text-xs text-[var(--text-main)] space-y-3">
    <div className="flex flex-wrap justify-between items-center gap-2">
      <strong className="min-w-0 break-words [overflow-wrap:anywhere]">{name} · 크로노스 완료 상태</strong>
      <button type="button" aria-label={`${name} 완료 상태 닫기`} onClick={onClose}
        className="shrink-0 rounded-lg border border-[var(--panel-border)] px-2 py-1 cursor-pointer hover:border-[var(--accent)]">닫기</button>
    </div>
    {message ? <p role="status" className="text-[var(--text-sub)]">{message}</p> :
      (['raid', 'abyss'] as const).map(type => {
        const contents = catalog.contents.filter(content => content.type === type && content.is_active !== false);
        const rows = contents.map(content => ({content, completed: isTaskChecked(checks, content, catalog.contents)}));
        return <div key={type} className="space-y-1.5">
          <h4 className="font-black text-[var(--accent)]">{type === 'raid' ? '레이드' : '어비스'} <span className="text-[var(--text-sub)]">{rows.filter(row => row.completed).length}/{rows.length}</span></h4>
          {rows.length === 0 ? <p className="text-[var(--text-sub)]">등록된 컨텐츠가 없어요.</p> :
            <ul className="space-y-1.5">{rows.map(({content, completed}) =>
              <li key={content.id} className="flex flex-wrap justify-between gap-x-3 gap-y-1 rounded-lg bg-[var(--panel)] px-2.5 py-2">
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">{cleanItemName(content.name)}</span>
                <strong className={`shrink-0 ${completed ? 'text-[var(--accent)]' : 'text-[var(--text-sub)]'}`}>{completed ? '✓ 완료' : '미완료'}</strong>
              </li>)}</ul>}
        </div>;
      })}
    <p className="text-[var(--text-sub)] leading-relaxed">저장된 체크 기준이며 참가 선택과 별개예요. 이 화면에서는 완료 상태를 수정하지 않아요.</p>
  </section>;
}
