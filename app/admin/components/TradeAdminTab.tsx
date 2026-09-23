"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { adminCatalogWrite } from "@/lib/adminCatalogClient";

interface TradeItem {
  id: string | number;
  map_name: string;
  npc_name: string;
  reward_name: string;
  reward_count: number;
  cost_name: string;
  cost_count: number;
  max_limit: number;
  reset_cycle: "일간" | "주간";
  scope: "캐릭당" | "계정당";
}

export default function TradeAdminTab() {
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [loading, setLoading] = useState(false);

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
    const { data } = await supabase.from("nexus_trades").select("*").order("id", { ascending: false });
    if (data) setTrades(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const handleAddTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardName.trim() || !costName.trim()) return alert("획득 보상과 소모 재화를 모두 입력해 주세요.");

    try {
      await adminCatalogWrite("nexus_trades", "insert", {
        map_name: mapName.trim() || "전역",
        npc_name: npcName.trim() || "NPC",
        reward_name: rewardName.trim(),
        reward_count: rewardCount,
        cost_name: costName.trim(),
        cost_count: costCount,
        max_limit: maxLimit,
        reset_cycle: resetCycle,
        scope,
      });
      setRewardName("");
      setCostName("");
      fetchTrades();
    } catch (error) { alert("등록 실패: " + (error as Error).message); }
  };

  const handleDeleteTrade = async (id: string | number) => {
    if (!confirm("해당 물물교환 카탈로그 품목을 삭제하시겠습니까?")) return;
    try {
      await adminCatalogWrite("nexus_trades", "delete", undefined, id);
      fetchTrades();
    } catch (error) { alert((error as Error).message); }
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-[var(--panel-border)] pb-3">
        <h2 className="text-lg font-black text-[var(--accent)]">⚖️ 통합 물물교환 카탈로그 설정</h2>
        <p className="text-xs text-[var(--text-sub)] font-medium mt-0.5">캐릭터별로 추적할 NPC 교환 및 상점 아이템 조건 및 수량을 등록합니다.</p>
      </div>

      <form onSubmit={handleAddTrade} className="bg-[var(--inner-box)] p-4 rounded-xl border border-[var(--panel-border)] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-2 text-xs">
          <input type="text" placeholder="맵 (예: 두갈드)" value={mapName} onChange={(e) => setMapName(e.target.value)} className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] p-2.5 rounded-lg outline-none font-bold placeholder:[var(--text-sub)]" />
          <input type="text" placeholder="NPC (예: 앨빈)" value={npcName} onChange={(e) => setNpcName(e.target.value)} className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] p-2.5 rounded-lg outline-none font-bold placeholder:[var(--text-sub)]" />
          <input type="text" placeholder="보상 (예: 상급 목재)" value={rewardName} onChange={(e) => setRewardName(e.target.value)} className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] p-2.5 rounded-lg outline-none font-bold placeholder:[var(--text-sub)]" />
          <div className="flex items-center gap-1">
            <span className="text-[var(--text-sub)] text-[11px] font-bold">수량</span>
            <input type="number" min="1" value={rewardCount} onChange={(e) => setRewardCount(Number(e.target.value))} className="w-full bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] p-2.5 rounded-lg text-center outline-none font-bold" />
          </div>
          <input type="text" placeholder="소모 재화 (예: 야채볶음)" value={costName} onChange={(e) => setCostName(e.target.value)} className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] p-2.5 rounded-lg outline-none font-bold placeholder:[var(--text-sub)]" />
          <div className="flex items-center gap-1">
            <span className="text-[var(--text-sub)] text-[11px] font-bold">소모</span>
            <input type="number" min="1" value={costCount} onChange={(e) => setCostCount(Number(e.target.value))} className="w-full bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] p-2.5 rounded-lg text-center outline-none font-bold" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-3 text-xs w-full sm:w-auto font-bold">
            <div className="flex items-center gap-1">
              <span className="text-[var(--text-sub)]">상한(Max):</span>
              <input type="number" min="1" value={maxLimit} onChange={(e) => setMaxLimit(Number(e.target.value))} className="w-16 bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--accent)] p-1.5 rounded-lg text-center outline-none font-black" />
            </div>
            <select value={resetCycle} onChange={(e: any) => setResetCycle(e.target.value)} className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] p-1.5 rounded-lg outline-none font-bold cursor-pointer">
              <option value="주간">주간 초기화</option>
              <option value="일간">일간 초기화</option>
            </select>
            <select value={scope} onChange={(e: any) => setScope(e.target.value)} className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] p-1.5 rounded-lg outline-none font-bold cursor-pointer">
              <option value="캐릭당">캐릭당</option>
              <option value="계정당">계정당</option>
            </select>
          </div>

          <button type="submit" className="w-full sm:w-auto bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[var(--accent-fg)] font-black text-xs px-6 py-2.5 rounded-xl transition cursor-pointer shadow-md">
            카탈로그에 추가
          </button>
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
              <th className="p-3 font-black text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--panel-border)] text-[var(--text-main)]">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-[var(--text-sub)] font-bold">카탈로그 조회 중...</td></tr>
            ) : trades.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-[var(--text-sub)] font-bold">등록된 물물교환 카탈로그 품목이 없습니다.</td></tr>
            ) : (
              trades.map((tr) => (
                <tr key={tr.id} className="hover:bg-[var(--panel)]/50 transition font-medium">
                  <td className="p-3">
                    <div className="font-bold text-[var(--text-main)]">{tr.map_name}</div>
                    <div className="text-[11px] text-[var(--text-sub)] font-mono">{tr.npc_name}</div>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-emerald-400">{tr.reward_name}</span>
                    <span className="text-[var(--text-sub)] text-[11px] ml-1">({tr.reward_count}개 획득)</span>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-amber-400">{tr.cost_name}</span>
                    <span className="text-[var(--text-sub)] text-[11px] ml-1">({tr.cost_count}개 필요)</span>
                  </td>
                  <td className="p-3 text-center font-black text-purple-400 text-sm">
                    {tr.max_limit}회
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="px-1.5 py-0.5 bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[10px] rounded font-bold">{tr.reset_cycle}</span>
                      <span className={`px-1.5 py-0.5 text-[10px] rounded font-bold border ${tr.scope === "캐릭당" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-rose-500/15 text-rose-400 border-rose-500/30"}`}>{tr.scope}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleDeleteTrade(tr.id)} className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded text-[11px] font-bold transition cursor-pointer border border-rose-500/30">
                      삭제
                    </button>
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
