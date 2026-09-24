"use client";
import { useEffect, useRef, useState } from "react";
import {
  currentProgress,
  kronosPeriodStart,
  MISSION_TOWNS,
  type ShopItem,
  type Mission,
  type Progress,
  type Reminder,
} from "@/lib/kronos";
import ReminderWindows from "./ReminderWindows";

type QueuedProgress = {
  confirmed: Progress | undefined;
  desired: Progress;
  running: boolean;
  timer: ReturnType<typeof setTimeout> | null;
};

export default function KronosWorkspace({
  character,
  account,
  shopVisible,
  missionVisible,
  reminderRequest,
}: {
  character: string;
  account: string;
  shopVisible: boolean;
  missionVisible: boolean;
  reminderRequest: number;
}) {
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [notes, setNotes] = useState<Reminder[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string[]>([]);
  const pending = useRef(new Set<string>());
  const progressRef = useRef<Progress[]>([]);
  const queues = useRef(new Map<string, QueuedProgress>());
  const [shopSearch, setShopSearch] = useState("");
  const [missionSearch, setMissionSearch] = useState("");
  const [now, setNow] = useState(new Date());
  const [initialReminderRequest] = useState(reminderRequest);
  const townOrder = [...MISSION_TOWNS].reverse();
  const matchingMissions = missions
    .filter((m) => [m.town, m.title, m.description, ...m.rewards.map((r) => r.name)]
      .join(" ").toLowerCase().includes(missionSearch.trim().toLowerCase()))
    .sort((a, b) => Number(!!progress.find((p) => p.kind === "mission" && p.item_id === b.id)?.bookmarked)
      - Number(!!progress.find((p) => p.kind === "mission" && p.item_id === a.id)?.bookmarked)
      || townOrder.indexOf(a.town as typeof townOrder[number]) - townOrder.indexOf(b.town as typeof townOrder[number])
      || a.title.localeCompare(b.title, "ko"));
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/kronos?character=" + encodeURIComponent(character), {
      cache: "no-store",
      signal: abort.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.message);
        return d;
      })
      .then((d) => {
        setShops(d.shops);
        setMissions(d.missions);
        progressRef.current = d.progress;
        setProgress(d.progress);
        setNotes(d.notes);
        setReady(true);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => {
      abort.abort();
      clearInterval(timer);
    };
  }, [character]);
  function showProgress(next: Progress) {
    progressRef.current = [...progressRef.current.filter((p) => !(p.kind === next.kind && p.item_id === next.item_id)), next];
    setProgress(progressRef.current);
  }
  async function flush(key: string, kind: "shop" | "mission", itemId: number) {
    const queue = queues.current.get(key);
    if (!queue || queue.running) return;
    queue.running = true;
    queue.timer = null;
    const daily = kind === "shop" && shops.find((s) => s.id === itemId)?.reset_type === "일간";
    const delta = queue.desired.count - currentProgress(queue.confirmed, daily, new Date());
    const bookmarked = queue.desired.bookmarked === (queue.confirmed?.bookmarked ?? false) ? undefined : queue.desired.bookmarked;
    if (delta === 0 && bookmarked === undefined) {
      queues.current.delete(key);
      pending.current.delete(key);
      setBusy([...pending.current]);
      return;
    }
    try {
      const r = await fetch("/api/kronos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character, action: "progress", kind, itemId, delta, bookmarked }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.message);
      queue.confirmed = d.progress;
      queue.running = false;
      if (queue.desired.count !== d.progress.count || queue.desired.bookmarked !== d.progress.bookmarked) {
        queue.timer = setTimeout(() => void flush(key, kind, itemId), 80);
      } else {
        showProgress(d.progress);
        queues.current.delete(key);
        pending.current.delete(key);
        setBusy([...pending.current]);
      }
    } catch (e) {
      progressRef.current = progressRef.current.filter((p) => !(p.kind === kind && p.item_id === itemId));
      if (queue.confirmed) progressRef.current.push(queue.confirmed);
      setProgress([...progressRef.current]);
      queues.current.delete(key);
      pending.current.delete(key);
      setBusy([...pending.current]);
      setError((e as Error).message);
    }
  }
  function update(
    kind: "shop" | "mission",
    itemId: number,
    delta: number,
    bookmarked?: boolean,
  ) {
    const key = kind + itemId;
    const previous = progressRef.current.find((p) => p.kind === kind && p.item_id === itemId);
    const shopItem = kind === "shop" ? shops.find((s) => s.id === itemId) : undefined;
    const missionItem = kind === "mission" ? missions.find((m) => m.id === itemId) : undefined;
    if (!shopItem && !missionItem) return;
    const daily = shopItem?.reset_type === "일간";
    const limit = shopItem?.limit ?? missionItem?.max_count ?? 0;
    const optimistic: Progress = {
      kind, item_id: itemId,
      character_name: shopItem?.scope === "계정당" ? null : character,
      count: Math.max(0, Math.min(limit, currentProgress(previous, daily, now) + delta)),
      bookmarked: bookmarked ?? previous?.bookmarked ?? false,
      period_start: new Date(kronosPeriodStart(now, daily)).toISOString(),
    };
    const queue = queues.current.get(key);
    if (queue) queue.desired = optimistic;
    else queues.current.set(key, { confirmed: previous, desired: optimistic, running: false, timer: null });
    pending.current.add(key);
    setBusy([...pending.current]);
    showProgress(optimistic);
    setError("");
    const next = queues.current.get(key)!;
    if (next.timer) clearTimeout(next.timer);
    if (!next.running) next.timer = setTimeout(() => void flush(key, kind, itemId), 150);
  }
  function row(kind: "shop" | "mission", id: number) {
    return progress.find((p) => p.kind === kind && p.item_id === id);
  }
  function bookmarkButton(kind: "shop" | "mission", id: number) {
    const selected = row(kind, id)?.bookmarked ?? false;
    return <button type="button" aria-label="즐겨찾기" aria-pressed={selected} title={selected ? "즐겨찾기 해제" : "즐겨찾기 추가"} onClick={() => update(kind, id, 0, !selected)} className="shrink-0 rounded-md px-1 py-0.5 text-[var(--accent)] hover:bg-[var(--panel-hover)]">{selected ? "★" : "☆"}</button>;
  }
  function controls(
    kind: "shop" | "mission",
    id: number,
    max: number,
    daily = false,
    showMax = false,
    compact = false,
  ) {
    const p = row(kind, id);
    const count = currentProgress(p, daily, now);
    const wait = busy.includes(kind + id);
    return (
      <div className={compact ? "flex items-center gap-1" : "flex flex-wrap items-center gap-2 mt-3"}>
        <button
          aria-label="횟수 줄이기"
          disabled={count === 0}
          onClick={() => update(kind, id, -1)}
          className="px-2 py-1 rounded bg-[var(--inner-box)] border border-[var(--panel-border)] disabled:opacity-40"
        >
          −
        </button>
        <span className={"font-mono font-bold whitespace-nowrap " + (wait ? "opacity-70" : "")} aria-live="polite">
          {count}/{max}
        </span>
        <button
          aria-label="횟수 늘리기"
          disabled={count >= max}
          onClick={() => update(kind, id, 1)}
          className="px-2 py-1 rounded bg-[var(--accent)] text-[var(--accent-fg)] disabled:opacity-40"
        >
          +
        </button>
        {showMax && <button aria-label={count >= max ? `${kind === "shop" ? "구매" : "임무"} 횟수 모두 초기화` : `${kind === "shop" ? "남은 구매" : "남은 임무"} 횟수 모두 완료`} onClick={() => update(kind, id, count >= max ? -count : max - count)} className="rounded-md border border-[var(--accent)] px-1.5 py-1 text-xs font-bold text-[var(--accent)]">{count >= max ? "MIN" : "MAX"}</button>}
        {wait && <span className={compact ? "sr-only" : "text-xs text-[var(--text-sub)]"}>저장 중…</span>}
      </div>
    );
  }
  const panel =
    "rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-3 md:p-5 space-y-3";
  const searchClass =
    "w-full min-w-0 rounded-lg border border-[var(--panel-border)] bg-[var(--inner-box)] p-2 text-sm";
  return (
    <>
      {error &&
        (shopVisible ||
          missionVisible ||
          reminderRequest !== initialReminderRequest) && (
          <p
            role="alert"
            className="rounded-lg border border-[var(--panel-border)] p-3 text-sm"
          >
            {error}
          </p>
        )}
      {shopVisible && (
        <section className={panel}>
          <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-bold text-[var(--accent)]">🛒 상점 구매 목록</h3><span className="text-xs text-[var(--text-sub)]">☆ 즐겨찾기 품목이 먼저 표시됩니다</span></div>
          <input
            aria-label="상점 구매 검색"
            placeholder="마을 / NPC / 아이템 검색"
            value={shopSearch}
            onChange={(e) => setShopSearch(e.target.value)}
            className={searchClass}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {shops
              .filter((s) =>
                [s.map, s.npc, s.reward]
                  .join(" ")
                  .toLowerCase()
                  .includes(shopSearch.toLowerCase()),
              )
              .sort(
                (a, b) =>
                  Number(!!row("shop", b.id)?.bookmarked) -
                    Number(!!row("shop", a.id)?.bookmarked) ||
                  a.map.localeCompare(b.map, "ko"),
              )
              .map((s) => (
                <article
                  key={s.id}
                  className="min-w-0 rounded-xl border border-[var(--panel-border)] bg-[var(--inner-box)] p-3 text-sm break-words [overflow-wrap:anywhere]"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex min-w-0 items-center gap-1">{bookmarkButton("shop", s.id)}<h4 className="min-w-0 font-bold text-[var(--accent)]">{s.npc} <span className="font-normal text-[var(--text-main)]">({s.map})</span></h4></div>
                    <span className="flex shrink-0 items-center gap-1"><span className="kronos-meta-badge">{s.reset_type}</span><span className="kronos-meta-badge">{s.scope}</span></span>
                  </div>
                  <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 text-sm"><strong className="min-w-0 text-[var(--kronos-reward)]">{s.reward} × {s.reward_cnt.toLocaleString()}</strong><strong className="whitespace-nowrap text-[var(--kronos-cost)]">{s.cost_cnt.toLocaleString()} 골드</strong></div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--panel-border)] pt-2"><span className="text-xs text-[var(--text-sub)]">총합 <strong className="text-[var(--kronos-cost)]">{(s.cost_cnt * s.limit).toLocaleString()} 골드</strong></span>{controls("shop", s.id, s.limit, s.reset_type === "일간", true, true)}</div>
                </article>
              ))}
          </div>
          {ready && shops.length === 0 && (
            <p className="text-sm text-[var(--text-sub)]">
              등록된 상점 구매 품목이 없습니다.
            </p>
          )}
        </section>
      )}
      {missionVisible && (
        <section className={panel}>
          <div className="flex flex-wrap items-center justify-between gap-x-1 gap-y-1">
            <h3 className="font-bold text-[0.9rem] text-[var(--accent)]">📜 임무 게시판</h3>
            <div className="flex flex-wrap items-center gap-1 text-[0.6667rem]">
              <span className="kronos-meta-badge kronos-character-badge max-w-full text-[var(--text-main)]">{character}</span>
              <span className="whitespace-nowrap text-[var(--text-sub)]">초기화: 매주 월 06시</span>
            </div>
          </div>
          <input
            aria-label="임무 검색"
            placeholder="마을 / 임무 제목 / 내용 / 보상 검색"
            value={missionSearch}
            onChange={(e) => setMissionSearch(e.target.value)}
            className={searchClass}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {matchingMissions.map((m) => (
                <article
                  key={m.id}
                  className="min-w-0 rounded-xl border border-[var(--panel-border)] border-l-[3px] border-l-[var(--accent)] bg-[var(--inner-box)] p-3 text-sm break-words [overflow-wrap:anywhere]"
                >
                  <div className="flex items-start justify-between gap-2"><div className="flex min-w-0 items-start gap-1">{bookmarkButton("mission", m.id)}<h4 className="font-bold text-[var(--accent)]">{m.title}</h4></div><span className="kronos-meta-badge shrink-0">{m.town}</span></div>
                  <div className="mt-2 grid grid-cols-[2.25rem_minmax(0,1fr)] items-baseline gap-1.5 text-xs leading-relaxed">
                    <span className="text-[var(--text-sub)]">임무</span>
                    <p className="min-w-0 whitespace-pre-wrap font-semibold text-[var(--kronos-cost)]">{m.description}</p>
                  </div>
                  <div className="mt-2 border-t border-[var(--panel-border)] pt-2">
                    <ul className="space-y-1 text-xs leading-relaxed">
                      {m.rewards.map((reward, index) => (
                        <li key={index} className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-baseline gap-1.5">
                          <span className="text-[var(--text-sub)]">{index === 0 ? "보상" : ""}</span>
                          <span className="min-w-0 break-keep text-[var(--kronos-reward)]"><strong>{reward.name}</strong>{" "}<strong className="whitespace-nowrap">× {reward.count.toLocaleString()}</strong></span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex justify-end">{controls("mission", m.id, m.max_count, false, true, true)}</div>
                  </div>
                </article>
              ))}
          </div>
          {ready && matchingMissions.length === 0 && <p className="text-sm text-[var(--text-sub)]">{missionSearch ? "검색 결과가 없습니다." : "등록된 임무가 없습니다."}</p>}
        </section>
      )}
      {ready && (
        <ReminderWindows
          key={account + character}
          account={account}
          character={character}
          initialNotes={notes}
          request={reminderRequest}
        />
      )}
    </>
  );
}
