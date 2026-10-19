"use client";

import { useMemo, useSyncExternalStore } from "react";
import { DEFAULT_GNOSIS_NAVIGATION, parseGnosisNavigation, type GnosisNavigationItem } from "@/lib/gnosisNavigation";

const STORAGE_KEY = "sanctum:gnosis:navigation-preview:v1";
const EVENT = "gnosis-navigation-preview";
function subscribe(callback: () => void) {
  const storage = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === null) callback(); };
  window.addEventListener("storage", storage);
  window.addEventListener(EVENT, callback);
  return () => { window.removeEventListener("storage", storage); window.removeEventListener(EVENT, callback); };
}
function snapshot() { try { return localStorage.getItem(STORAGE_KEY) ?? ""; } catch { return ""; } }
const serverSnapshot = () => "";

export function useGnosisNavigation() {
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return useMemo(() => {
    let parsed = null;
    try { if (raw) parsed = parseGnosisNavigation(JSON.parse(raw)); } catch { /* Preserve invalid storage for recovery. */ }
    return { items: parsed ?? DEFAULT_GNOSIS_NAVIGATION, invalid: Boolean(raw && !parsed), revision: raw };
  }, [raw]);
}
export function saveGnosisNavigation(items: GnosisNavigationItem[]) {
  const valid = parseGnosisNavigation({ version: 1, items });
  if (!valid) throw new Error("이름은 중복 없이 1~12자로 입력하고 모든 분류를 유지해주세요.");
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items: valid }));
  window.dispatchEvent(new Event(EVENT));
}
export function resetGnosisNavigation() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(EVENT));
}
