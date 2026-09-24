"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { adminCatalogRead, adminCatalogWrite } from "@/lib/adminCatalogClient";

interface TradeItem {
  id: string | number;
  map: string;
  npc: string;
  reward: string;
  reward_cnt: number;
  cost: string;
  cost_cnt: number;
  limit: number;
  reset_type: "일간" | "주간";
  scope: "캐릭당" | "계정당";
}

export default function TradeAdminTab({ shop = false }: { shop?: boolean }) {
  const table = shop ? "kronos_shop_items" : "nexus_trades";
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [mapName, setMapName] = useState("");
  const [npcName, setNpcName] = useState("");
  const [rewardName, setRewardName] = useState("");
  const [rewardCount, setRewardCount] = useState<number>(1);
  const [costName, setCostName] = useState("");
  const [costCount, setCostCount] = useState<number>(1);
  const [maxLimit, setMaxLimit] = useState<number>(2);
  const [resetCycle, setResetCycle] = useState<"일간" | "주간">("주간");
  const [scope, setScope] = useState<"캐릭당" | "계정당">("캐릭당");

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    try { setError(""); setTrades(await adminCatalogRead<TradeItem>(table)); }
    catch (e) { setError((e as Error).message); }
    setLoading(false);
  }, [table]);

  useEffect(() => {
    let active = true;
    adminCatalogRead<TradeItem>(table)
      .then((data) => { if (active) { setTrades(data); setError(""); } })
      .catch((cause) => { if (active) setError((cause as Error).message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [table]);

  const clearForm = () => {
    setEditingId(null);
    setMapName(""); setNpcName(""); setRewardName(""); setRewardCount(1);
    setCostName(""); setCostCount(1); setMaxLimit(2);
    setResetCycle("주간"); setScope("캐릭당");
  };

  const beginEdit = (item: TradeItem) => {
    setEditingId(item.id);
    setMapName(item.map); setNpcName(item.npc); setRewardName(item.reward);
    setRewardCount(item.reward_cnt); setCostName(shop ? "" : item.cost);
    setCostCount(item.cost_cnt); setMaxLimit(item.limit);
    setResetCycle(item.reset_type); setScope(item.scope);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAddTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!rewardName.trim() || (!shop && !costName.trim())) return alert("획득 보상과 소모 재화를 모두 입력해 주세요.");

    setSaving(true);
    try {
      await adminCatalogWrite(table, editingId === null ? "insert" : "update", {
        map: mapName.trim() || "전역",
        npc: npcName.trim() || "NPC",
        reward: rewardName.trim(),
        reward_cnt: rewardCount,
        ...(shop ? { is_active: true } : { cost: costName.trim() }),
        cost_cnt: costCount,
        limit: maxLimit,
        reset_type: resetCycle,
        scope,
      }, editingId ?? undefined);
      clearForm();
      await fetchTrades();
    } catch (error) { alert("등록 실패: " + (error as Error).message); } finally { setSaving(false); }
  };

  const handleDeleteTrade = async (id: string | number) => {
    if (!confirm(shop ? "해당 상점 구매 품목을 삭제하시겠습니까?" : "해당 물물교환 카탈로그 품목을 삭제하시겠습니까?")) return;
    try {
      await adminCatalogWrite(table, "delete", undefined, id);
      await fetchTrades();
    } catch (error) { alert((error as Error).message); }
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-[var(--panel-border)] pb-3">
        <h2 className="text-lg font-black text-[var(--accent)]">{shop ? "🛒 골드 상점 구매 카탈로그" : "⚖️ 물물교환 카탈로그 설정"}</h2>
        <p className="text-xs text-[var(--text-sub)] font-medium mt-0.5">{shop ? "골드로 구매하는 NPC 상점 품목의 가격과 구매 상한을 등록합니다." : "NPC 물물교환 품목의 소모 재화와 획득 보상을 등록합니다."}</p>
      </div>

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <form ref={formRef} onSubmit={handleAddTrade} className="bg-[var(--inner-box)] p-4 rounded-xl border border-[var(--panel-border)] space-y-3">
        {editingId !== null && <p className="text-sm font-bold text-[var(--accent)]">기존 품목 수정 중 · 저장 전에는 목록이 바뀌지 않습니다.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-2 text-xs">
          <input type="text" placeholder="맵 (예: 두갈드)" value={mapName} onChange={(e) => setMapName(e.target.value)} className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] p-2.5 rounded-lg outline-none font-bold placeholder:[var(--text-sub)]" />
          <input type="text" placeholder="NPC (예: 앨빈)" value={npcName} onChange={(e) => setNpcName(e.target.value)} className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] p-2.5 rounded-lg outline-none font-bold placeholder:[var(--text-sub)]" />
          <input type="text" placeholder="보상 (예: 상급 목재)" value={rewardName} onChange={(e) => setRewardName(e.target.value)} className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] p-2.5 rounded-lg outline-none font-bold placeholder:[var(--text-sub)]" />
          <div className="flex items-center gap-1">
            <span className="text-[var(--text-sub)] text-xs font-bold">수량</span>
            <input type="number" min="1" required value={rewardCount} onChange={(e) => setRewardCount(Number(e.target.value))} className="w-full bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] p-2.5 rounded-lg text-center outline-none font-bold" />
          </div>
          <input type="text" disabled={shop} placeholder={shop ? "골드" : "소모 재화 (예: 야채볶음)"} value={shop ? "골드" : costName} onChange={(e) => setCostName(e.target.value)} className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] p-2.5 rounded-lg outline-none font-bold placeholder:[var(--text-sub)]" />
          <div className="flex items-center gap-1">
            <span className="text-[var(--text-sub)] text-xs font-bold">소모</span>
            <input type="number" min="1" value={costCount} onChange={(e) => setCostCount(Number(e.target.value))} className="w-full bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] p-2.5 rounded-lg text-center outline-none font-bold" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-3 text-xs w-full sm:w-auto font-bold">
            <div className="flex items-center gap-1">
              <span className="text-[var(--text-sub)]">상한(Max):</span>
              <input type="number" min="1" value={maxLimit} onChange={(e) => setMaxLimit(Number(e.target.value))} className="w-16 bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--accent)] p-1.5 rounded-lg text-center outline-none font-black" />
            </div>
            <select value={resetCycle} onChange={(e) => setResetCycle(e.target.value as "일간" | "주간")} className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] p-1.5 rounded-lg outline-none font-bold cursor-pointer">
              <option value="주간">주간 초기화</option>
              <option value="일간">일간 초기화</option>
            </select>
            <select value={scope} onChange={(e) => setScope(e.target.value as "캐릭당" | "계정당")} className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] p-1.5 rounded-lg outline-none font-bold cursor-pointer">
              <option value="캐릭당">캐릭당</option>
              <option value="계정당">계정당</option>
            </select>
          </div>

          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <button type="submit" disabled={saving || loading} className="flex-1 sm:flex-none bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs px-6 py-2.5 rounded-xl transition cursor-pointer shadow-md disabled:opacity-50">
              {saving ? "저장 중…" : editingId === null ? "카탈로그에 추가" : "수정 저장"}
            </button>
            {editingId !== null && <button type="button" disabled={saving} onClick={clearForm} className="rounded-xl border border-[var(--panel-border)] px-4 py-2.5 text-xs font-bold">취소</button>}
          </div>
        </div>
      </form>

      <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl overflow-x-auto">
        <table className="min-w-[760px] w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[var(--panel)] text-[var(--text-sub)] border-b border-[var(--panel-border)]">
              <th className="p-3 font-black">맵 / NPC</th>
              <th className="p-3 font-black">획득 보상</th>
              <th className="p-3 font-black">소모 재화</th>
              <th className="p-3 font-black text-center">상한</th>
              <th className="p-3 font-black text-center">조건</th>
              <th className="p-3 font-black text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--panel-border)] text-[var(--text-main)]">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-[var(--text-sub)] font-bold">카탈로그 조회 중...</td></tr>
            ) : trades.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-[var(--text-sub)] font-bold">{shop ? "등록된 상점 구매 품목이 없습니다." : "등록된 물물교환 품목이 없습니다."}</td></tr>
            ) : (
              trades.map((tr) => (
                <tr key={tr.id} className="hover:bg-[var(--panel)]/50 transition font-medium">
                  <td className="p-3">
                    <div className="font-bold text-[var(--text-main)]">{tr.map}</div>
                    <div className="text-xs text-[var(--text-sub)] font-mono">{tr.npc}</div>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-emerald-400">{tr.reward}</span>
                    <span className="text-[var(--text-sub)] text-xs ml-1">({tr.reward_cnt}개 획득)</span>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-amber-400">{shop ? "골드" : tr.cost}</span>
                    <span className="text-[var(--text-sub)] text-xs ml-1">({tr.cost_cnt}{shop ? "골드" : "개"} 필요)</span>
                  </td>
                  <td className="p-3 text-center font-black text-purple-400 text-sm">
                    {tr.limit}회
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="px-1.5 py-0.5 bg-sky-500/15 text-sky-400 border border-sky-500/30 text-xs rounded font-bold">{tr.reset_type}</span>
                      <span className={`px-1.5 py-0.5 text-xs rounded font-bold border ${tr.scope === "캐릭당" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-rose-500/15 text-rose-400 border-rose-500/30"}`}>{tr.scope}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <button type="button" disabled={saving} onClick={() => beginEdit(tr)} className="px-2.5 py-1 rounded border border-[var(--panel-border)] text-[var(--accent)] font-bold disabled:opacity-50">수정</button>
                      <button type="button" disabled={saving} onClick={() => handleDeleteTrade(tr.id)} className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded text-xs font-bold transition cursor-pointer border border-rose-500/30 disabled:opacity-50">삭제</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
