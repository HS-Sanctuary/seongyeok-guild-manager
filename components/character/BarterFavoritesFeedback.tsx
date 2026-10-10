'use client';

import {useEffect, useState} from 'react';
import type {useBarterFavorites} from '@/hooks/useBarterFavorites';
import './barter-favorites.css';

const legacyKey = 'nexus_pinned_trades';
const markerKey = (accountId:string) => 'sanctum_barter_favorites_imported:' + accountId;

type Props = {
  state:ReturnType<typeof useBarterFavorites>; accountId:string|null; accountNickname?:string; legacyImport?:boolean;
};
export function BarterFavoritesFeedback(props:Props) {
  return <AccountFavoritesFeedback key={props.accountId ?? 'signed-out'} {...props}/>;
}
function AccountFavoritesFeedback({state, accountId, accountNickname, legacyImport = false}:Props) {
  const [legacy, setLegacy] = useState<{accountId:string;ids:number[]}|null>(null);
  const [approved, setApproved] = useState(false);
  useEffect(() => {
    if (!legacyImport || !accountId) return;
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      try {
        if (localStorage.getItem(markerKey(accountId))) return;
        const value:unknown = JSON.parse(localStorage.getItem(legacyKey) ?? 'null');
        if (Array.isArray(value) && value.length <= 500) {
          const ids = [...new Set(value.filter((id):id is number => typeof id === 'number' && Number.isSafeInteger(id) && id > 0))];
          if (ids.length) setLegacy({accountId, ids});
        }
      } catch { /* Preserve the original legacy value even if it cannot be read. */ }
    });
    return () => {active = false;};
  }, [accountId, legacyImport]);
  const importRows = legacy?.accountId === accountId ? legacy.ids : [];
  const apply = async () => {
    if (!accountId || !approved || !importRows.length || state.busy || !state.ready) return;
    const targetAccount = accountId;
    if (!await state.importLegacy(importRows)) return;
    // A marker is only an acknowledgement; the unscoped original is not deleted or overwritten.
    try {localStorage.setItem(markerKey(targetAccount), 'confirmed');} catch { /* Server result remains saved. */ }
    setLegacy(value => value?.accountId === targetAccount ? null : value);
  };
  return <div className="barter-favorites-feedback">
    <div className="barter-favorites-status">
      <p role="status" aria-live="polite">{state.message || '계정 공통 즐겨찾기 · 별표 변경은 바로 저장돼요.'}</p>
      <button type="button" disabled={state.busy || !accountId} onClick={() => void state.refresh()}>다시 조회</button>
    </div>
    {importRows.length > 0 && <details className="barter-favorites-import" key={accountId}>
      <summary>이 브라우저의 기존 즐겨찾기 {importRows.length}개 가져오기</summary>
      <p>기존 목록은 계정 구분 없이 저장됐어요. <strong>{accountNickname || '현재 로그인한 계정'}</strong>의 목록이 맞는지 확인해 주세요.</p>
      <p>현재 생텀 목록은 유지하고, 아직 기록이 없는 품목만 추가해요.</p>
      <label><input type="checkbox" checked={approved} onChange={event => setApproved(event.target.checked)}/>이 계정의 즐겨찾기가 맞아요</label>
      <button type="button" disabled={!approved || !state.ready || state.busy} onClick={() => void apply()}>확인하고 가져오기</button>
    </details>}
  </div>;
}
