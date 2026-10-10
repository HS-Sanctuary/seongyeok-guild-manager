'use client';

import {useCallback, useEffect, useId, useLayoutEffect, useRef, useState} from 'react';

type Snapshot = {accountId:string; favorites:number[]};
type State = Snapshot & {ready:boolean; busy:boolean; message:string};
type Mutation = {tradeId:number; favorite:boolean} | {importIds:number[]};
const endpoint = '/api/kronos/barter-favorites';
const changedEvent = 'sanctum:barter-favorites-changed';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const empty = (accountId = ''):State => ({accountId, favorites:[], ready:false, busy:false, message:''});

function snapshot(value:unknown, accountId:string):Snapshot {
  const data = value as Partial<Snapshot> | null;
  if (!data || data.accountId !== accountId || !Array.isArray(data.favorites)
      || data.favorites.length > 100000
      || data.favorites.some(id => !Number.isSafeInteger(id) || id < 1)
      || new Set(data.favorites).size !== data.favorites.length) throw Error('Invalid favorites response');
  return {accountId, favorites:data.favorites};
}

/** Preferences are immediate writes, separate from the protected 15-second completion queue. */
export function useBarterFavorites(accountId:string|null) {
  const source = useId();
  const [state, setState] = useState<State>(() => empty());
  const confirmed = useRef<State>(empty());
  const work = useRef({accountId:null as string|null, generation:0, live:false, busy:false});

  const request = useCallback(async (mutation?:Mutation):Promise<boolean> => {
    const ctx = work.current;
    if (!accountId || !uuid.test(accountId)
        || !ctx.live || ctx.accountId !== accountId || ctx.busy
        || (mutation && !confirmed.current.ready)) return false;
    const generation = ctx.generation;
    const current = () => work.current === ctx && ctx.live && ctx.generation === generation;
    ctx.busy = true;
    const previous = confirmed.current.accountId === accountId ? confirmed.current : empty(accountId);
    confirmed.current = {...previous, busy:true, message:mutation?'즐겨찾기를 저장하고 있어요.':'즐겨찾기를 불러오고 있어요.'};
    setState(confirmed.current);
    try {
      const response = await fetch(endpoint + (mutation ? '' : '?accountId=' + encodeURIComponent(accountId)), {
        method:mutation?'POST':'GET', cache:'no-store', credentials:'same-origin',
        ...(mutation ? {headers:{'Content-Type':'application/json'}, body:JSON.stringify({accountId, ...mutation})} : {}),
      });
      if (!response.ok) throw Error('Favorites request failed');
      const result = snapshot(await response.json(), accountId);
      if (!current()) return false;
      confirmed.current = {...result, ready:true, busy:false, message:mutation?'즐겨찾기를 저장했어요.':''};
      ctx.busy = false;
      setState(confirmed.current);
      if (mutation) window.dispatchEvent(new CustomEvent(changedEvent, {detail:{accountId, source}}));
      return true;
    } catch {
      if (!current()) return false;
      // A failed response can follow a successful DB write. Never toggle/retry automatically.
      confirmed.current = {...previous, ready:false, busy:false, message:mutation
        ?'저장 결과를 확인하지 못했어요. 다시 조회한 뒤 변경해 주세요.'
        :'즐겨찾기를 불러오지 못했어요. 로그인·연결 상태를 확인하고 다시 조회해 주세요.'};
      ctx.busy = false;
      setState(confirmed.current);
      return false;
    }
  }, [accountId, source]);

  const refresh = useCallback(async () => {await request();}, [request]);
  const toggle = useCallback((tradeId:number) => {
    if (!Number.isSafeInteger(tradeId) || tradeId < 1) return Promise.resolve(false);
    return request({tradeId, favorite:!confirmed.current.favorites.includes(tradeId)});
  }, [request]);
  const importLegacy = useCallback((ids:number[]) => {
    if (!Array.isArray(ids) || ids.length > 500 || ids.some(id => !Number.isSafeInteger(id) || id < 1)) return Promise.resolve(false);
    return request({importIds:[...new Set(ids)]});
  }, [request]);

  // Invalidate old-account IO at commit, before passive effects or late network callbacks.
  useLayoutEffect(() => {
    const ctx = {accountId, generation:work.current.generation + 1, live:true, busy:false};
    work.current = ctx;
    confirmed.current = empty(accountId ?? '');
    return () => {ctx.live = false;};
  }, [accountId]);

  useEffect(() => {
    if (!accountId || !uuid.test(accountId)) return;
    void refresh();
    const focus = () => {
      if (document.visibilityState === 'visible' && confirmed.current.ready) void refresh();
    };
    const changed = (event:Event) => {
      const detail = (event as CustomEvent<{accountId:string;source:string}>).detail;
      if (detail?.accountId === accountId && detail.source !== source) void refresh();
    };
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', focus);
    window.addEventListener(changedEvent, changed);
    return () => {
      window.removeEventListener('focus', focus);
      document.removeEventListener('visibilitychange', focus);
      window.removeEventListener(changedEvent, changed);
    };
  }, [accountId, refresh, source]);

  const visible = !accountId || !uuid.test(accountId)
    ? {...empty(accountId ?? ''), message:'로그인한 계정의 즐겨찾기를 사용할 수 있어요.'}
    : state.accountId === accountId ? state : empty(accountId);
  return {...visible, refresh, toggle, importLegacy};
}
