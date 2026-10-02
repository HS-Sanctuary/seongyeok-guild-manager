'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from '@/lib/supabase';
import type { NexusClassItem, NexusContent, ContentPowerReq } from '@/components/party/types';

export type PartyCatalog = {
  classes: NexusClassItem[]; contents: NexusContent[]; powerReqs: ContentPowerReq[];
  loaded: boolean; error: string | null;
};
const empty: PartyCatalog = {classes:[],contents:[],powerReqs:[],loaded:false,error:null};
let snapshot = empty;
let pending: Promise<void> | null = null;
let lastLoaded = 0;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => {listeners.delete(listener);}; };

export function refreshPartyCatalog(force = false): Promise<void> {
  if (pending) return pending;
  if (!force && snapshot.loaded && Date.now()-lastLoaded < 60_000) return Promise.resolve();
  pending = (async () => {
    try {
      const [classes, contents, power] = await Promise.all([
        supabase.from('nexus_classes').select('*').order('id'),
        supabase.from('nexus_contents').select('*').order('id'),
        supabase.from('content_power_reqs').select('*').order('id'),
      ]);
      if (classes.error || contents.error || power.error) throw new Error('파티 기준 자료를 불러오지 못했습니다.');
      snapshot = {classes:classes.data ?? [],contents:contents.data ?? [],powerReqs:power.data ?? [],loaded:true,error:null};
      lastLoaded = Date.now();
    } catch {
      snapshot = {...snapshot,error:'역할·파티 구성 기준을 불러오지 못했습니다. 새로고침 후 다시 확인해주세요.'};
    } finally {
      pending = null;
      listeners.forEach(listener => listener());
    }
  })();
  return pending;
}

/** Both SYNAXIS and the home preview subscribe to the same catalog snapshot. */
export function usePartyCatalog(): PartyCatalog {
  const value = useSyncExternalStore(subscribe, () => snapshot, () => empty);
  useEffect(() => {
    void refreshPartyCatalog();
    const refresh = () => {void refreshPartyCatalog();};
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => {window.removeEventListener('focus',refresh);window.clearInterval(timer);};
  }, []);
  return value;
}
