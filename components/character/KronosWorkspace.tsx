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
import ProgressiveGrid from "./ProgressiveGrid";
import {createKronosAutosave,type KronosSaveFields} from '@/lib/kronosAutosave';
export type KronosWorkspaceSaveSource=Pick<ReturnType<typeof createKronosAutosave>,'state'|'flush'>;

function shopRequirement(item: ShopItem) {
  if (item.reward === "사포" && ["앨빈", "델렌"].includes(item.npc)) return "구매 조건: 생활력 7,000";
  if (item.npc === "조셀린" && item.reward === "상급 설비 증축 도면") return "구매 조건: 아르바이트 Lv.15";
  return null;
}

export default function KronosWorkspace({
  character,
  account,
  shopVisible,
  missionVisible,
  reminderRequest,
  onSaveSource,
}: {
  character: string;
  account: string;
  shopVisible: boolean;
  missionVisible: boolean;
  reminderRequest: number;
  onSaveSource?:(source:KronosWorkspaceSaveSource|null)=>void;
}) {
  const [autosave]=useState(()=>createKronosAutosave());
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [notes, setNotes] = useState<Reminder[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string[]>([]);
  const pending = useRef(new Set<string>());
  const progressRef = useRef<Progress[]>([]);
  const confirmedRef=useRef<Progress[]>([]);
  const saveItemsRef=useRef<{shops:ShopItem[];missions:Mission[]}>({shops:[],missions:[]});
  const uncertainRef=useRef(false);
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
  const matchingShops = shops
    .filter((s) => [s.map, s.npc, s.reward].join(" ").toLowerCase().includes(shopSearch.trim().toLowerCase()))
    .sort((a, b) =>
      Number(!!progress.find((p) => p.kind === "shop" && p.item_id === b.id)?.bookmarked)
      - Number(!!progress.find((p) => p.kind === "shop" && p.item_id === a.id)?.bookmarked)
      || a.map.localeCompare(b.map, "ko")
      || a.npc.localeCompare(b.npc, "ko")
      || a.reward.localeCompare(b.reward, "ko"));
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
        confirmedRef.current=d.progress;
        saveItemsRef.current={shops:d.shops,missions:d.missions};
        autosave.reset(saveFields(d.progress));
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
  }, [character,autosave]);
  useEffect(()=>{onSaveSource?.(autosave);const unsubscribe=autosave.subscribe(()=>onSaveSource?.(autosave));return()=>{unsubscribe();onSaveSource?.(null);autosave.dispose();};},[autosave,onSaveSource]);
  function saveFields(rows:Progress[]):KronosSaveFields{
    const fields:KronosSaveFields={};
    for(const kind of ['shop','mission'] as const)for(const item of kind==='shop'?saveItemsRef.current.shops:saveItemsRef.current.missions){const p=rows.find(row=>row.kind===kind&&row.item_id===item.id);fields[kind+item.id]=JSON.stringify([currentProgress(p,kind==='shop'&&(item as ShopItem).reset_type==='일간',new Date()),p?.bookmarked??false]);}
    return fields;
  }
  async function saveBatch(desired:Progress[],keys:ReadonlySet<string>){
    if(uncertainRef.current){const response=await fetch('/api/kronos?character='+encodeURIComponent(character),{cache:'no-store'});const data=await response.json();if(!response.ok||!Array.isArray(data.progress))throw Error('저장 결과를 다시 확인하지 못했어요.');confirmedRef.current=data.progress;uncertainRef.current=false;}
    for(const next of desired){
      const key=next.kind+next.item_id;
      if(!keys.has(key))continue;
      const daily=next.kind==='shop'&&saveItemsRef.current.shops.find(item=>item.id===next.item_id)?.reset_type==='일간';
      if(Date.parse(next.period_start)!==kronosPeriodStart(new Date(),daily))throw Error('초기화 시간이 지났어요. 새로고침 후 기록을 확인해 주세요.');
      const before=confirmedRef.current.find(row=>row.kind===next.kind&&row.item_id===next.item_id);
      const delta=next.count-currentProgress(before,daily,new Date()),bookmarked=next.bookmarked===(before?.bookmarked??false)?undefined:next.bookmarked;
      if(!delta&&bookmarked===undefined){const current=progressRef.current.find(row=>row.kind===next.kind&&row.item_id===next.item_id);if(current?.count===next.count&&current.bookmarked===next.bookmarked)pending.current.delete(key);continue;}
      try{const response=await fetch('/api/kronos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({character,action:'progress',kind:next.kind,itemId:next.item_id,delta,bookmarked})});const data=await response.json();if(!response.ok||!data.progress)throw Error(data.message||'저장 결과를 확인하지 못했어요.');confirmedRef.current=[...confirmedRef.current.filter(row=>!(row.kind===next.kind&&row.item_id===next.item_id)),data.progress];if(data.progress.kind!==next.kind||data.progress.item_id!==next.item_id||data.progress.count!==next.count||data.progress.bookmarked!==next.bookmarked)throw Error('다른 기록이 함께 변경됐어요. 다시 저장하기 전에 확인해 주세요.');const current=progressRef.current.find(row=>row.kind===next.kind&&row.item_id===next.item_id);if(current?.count===next.count&&current.bookmarked===next.bookmarked){showProgress(data.progress);pending.current.delete(key);}}
      catch(reason){uncertainRef.current=true;setError(reason instanceof Error?reason.message:'저장에 실패했어요.');throw reason;}
    }
    setBusy([...pending.current]);setError('');
  }
  function showProgress(next: Progress) {
    progressRef.current = [...progressRef.current.filter((p) => !(p.kind === next.kind && p.item_id === next.item_id)), next];
    setProgress(progressRef.current);
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
    pending.current.add(key);
    setBusy([...pending.current]);
    showProgress(optimistic);
    setError("");
    const desired=progressRef.current.map(row=>({...row}));
    const keys=new Set(pending.current);
    autosave.edit(saveFields(desired),()=>saveBatch(desired,keys));
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
      <div className={compact ? "flex items-center gap-1 whitespace-nowrap" : "flex flex-wrap items-center gap-2 mt-3"}>
        <button
          aria-label="횟수 줄이기"
          disabled={count === 0}
          onClick={() => update(kind, id, -1)}
          className="px-2 py-1 rounded bg-[var(--inner-box)] border border-[var(--panel-border)] disabled:opacity-40"
        >
          −
        </button>
        <span className={"font-mono font-bold whitespace-nowrap " + (wait ? "opacity-70" : "")} aria-live="polite">
          <span className={count >= max ? "text-[var(--kronos-reward)]" : ""}>{count}/{max}</span>
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
        {wait && <span className={compact ? "sr-only" : "text-xs text-[var(--text-sub)]"}>{autosave.state().saving?'저장 중…':'미저장'}</span>}
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
          <ProgressiveGrid
            key={shopSearch}
            items={matchingShops}
            columns={3}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 items-stretch gap-3"
            renderItem={(s) => (
              (() => {
                const completed = currentProgress(row("shop", s.id), s.reset_type === "일간", now) >= s.limit;
                return (
                <article
                  aria-label={completed ? `${s.npc} ${s.reward} 구매 완료` : undefined}
                  className={`flex h-full min-h-[10.5rem] min-w-0 flex-col rounded-xl border border-[var(--panel-border)] border-l-[3px] bg-[var(--inner-box)] p-3 text-sm break-words [overflow-wrap:anywhere] ${completed ? "!border-[var(--kronos-reward)] !border-l-[var(--kronos-reward)]" : "border-l-[var(--accent)]"}`}
                >
                  <div className="flex min-h-10 items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-start gap-1"><div className="shrink-0">{bookmarkButton("shop", s.id)}</div><h4 className="min-w-0 font-bold leading-tight text-[var(--accent)]">{s.npc} <span className="whitespace-nowrap font-normal text-[var(--text-main)]">({s.map})</span></h4></div>
                    <span className="flex shrink-0 items-center gap-1"><span className="kronos-meta-badge">{s.reset_type}</span><span className="kronos-meta-badge">{s.scope}</span></span>
                  </div>
                  <div className="mt-2 grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-start gap-2 text-sm"><strong className="min-w-0 text-[var(--kronos-reward)]">{s.reward} × {s.reward_cnt.toLocaleString()}</strong><strong className="whitespace-nowrap text-[var(--kronos-cost)]">{s.cost_cnt.toLocaleString()} 골드</strong></div>
                  {shopRequirement(s) && <p className="mt-1 text-xs text-[var(--text-sub)]">{shopRequirement(s)}</p>}
                  <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-[var(--panel-border)] pt-2"><span className="text-xs text-[var(--text-sub)]">총합 <strong className="text-[var(--kronos-cost)]">{(s.cost_cnt * s.limit).toLocaleString()} 골드</strong></span><div className="ml-auto">{controls("shop", s.id, s.limit, s.reset_type === "일간", true, true)}</div></div>
                </article>
                );
              })()
              )}
          />
          {ready && matchingShops.length === 0 && (
            <p className="text-sm text-[var(--text-sub)]">
              {shopSearch ? "검색 결과가 없습니다." : "등록된 상점 구매 품목이 없습니다."}
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
          <ProgressiveGrid
            key={missionSearch}
            items={matchingMissions}
            columns={2}
            className="grid grid-cols-1 items-stretch md:grid-cols-2 gap-3"
            renderItem={(m) => (
              (() => {
                const completed = currentProgress(row("mission", m.id), false, now) >= m.max_count;
                return (
                <article
                  aria-label={completed ? `${m.title} 임무 완료` : undefined}
                  className={`flex h-full min-h-[11rem] min-w-0 flex-col rounded-xl border border-[var(--panel-border)] border-l-[3px] bg-[var(--inner-box)] p-2.5 text-sm break-words [overflow-wrap:anywhere] ${completed ? "!border-[var(--kronos-reward)] !border-l-[var(--kronos-reward)]" : "border-l-[var(--accent)]"}`}
                >
                  <div className="flex min-h-10 items-start justify-between gap-2"><div className="flex min-w-0 items-start gap-1">{bookmarkButton("mission", m.id)}<h4 className="font-bold text-[var(--accent)]">{m.title}</h4></div><span className="kronos-meta-badge shrink-0">{m.town}</span></div>
                  <div className="mt-1 grid grid-cols-[2.25rem_minmax(0,1fr)] items-baseline gap-1.5 text-xs leading-snug">
                    <span className="text-[var(--text-sub)]">임무</span>
                    <p className="min-w-0 whitespace-pre-wrap font-semibold text-[var(--kronos-cost)]">{m.description}</p>
                  </div>
                  <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-1 border-t border-[var(--panel-border)] pt-1.5">
                    <ul className="min-w-[13rem] flex-1 space-y-0.5 text-xs leading-snug">
                      {m.rewards.map((reward, index) => (
                        <li key={index} className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-baseline gap-1.5">
                          <span className="text-[var(--text-sub)]">{index === 0 ? "보상" : ""}</span>
                          <span className="min-w-0 break-keep text-[var(--kronos-reward)]"><strong>{reward.name}</strong>{" "}<strong className="whitespace-nowrap">× {reward.count.toLocaleString()}</strong></span>
                        </li>
                      ))}
                    </ul>
                    <div className="ml-auto shrink-0">{controls("mission", m.id, m.max_count, false, true, true)}</div>
                  </div>
                </article>
                );
              })()
              )}
          />
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
