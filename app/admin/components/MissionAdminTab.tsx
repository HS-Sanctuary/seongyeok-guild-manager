"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function MissionAdminTab() {
  const [missions, setMissions] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [rewardItem, setRewardItem] = useState("");
  const [rewardCount, setRewardCount] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    setLoading(true);
    const { data } = await supabase.from("nexus_missions").select("*").order("created_at", { ascending: false });
    if (data) setMissions(data);
    setLoading(false);
  };

  const handleAddMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !rewardItem.trim()) return alert("임무 제목과 보상 아이템을 입력해 주세요.");

    const { error } = await supabase.from("nexus_missions").insert([
      { title: title.trim(), reward_item: rewardItem.trim(), reward_count: rewardCount, is_active: true }
    ]);

    if (error) return alert("임무 추가 실패: " + error.message);
    setTitle("");
    setRewardItem("");
    setRewardCount(1);
    fetchMissions();
  };

  const deleteMission = async (id: number) => {
    if (!confirm("이 임무 항목을 삭제하시겠습니까?")) return;
    await supabase.from("nexus_missions").delete().eq("id", id);
    fetchMissions();
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-[var(--panel-border)] pb-3">
        <h2 className="text-lg font-black text-[var(--accent)]">📜 임무 게시판 카탈로그 제어</h2>
        <p className="text-xs text-[var(--text-sub)] font-medium mt-0.5">길드 미션 및 현황판의 달성 목표와 보상 항목을 제어합니다.</p>
      </div>

      <form onSubmit={handleAddMission} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-[var(--inner-box)] p-3 rounded-xl border border-[var(--panel-border)]">
        <input
          type="text"
          placeholder="임무 제목 (예: 발할라 어비스 3회 클리어)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-[var(--panel)] text-xs text-[var(--text-main)] p-2.5 rounded-lg border border-[var(--panel-border)] outline-none font-bold sm:col-span-2 placeholder:[var(--text-sub)]"
        />
        <input
          type="text"
          placeholder="보상 아이템명"
          value={rewardItem}
          onChange={(e) => setRewardItem(e.target.value)}
          className="bg-[var(--panel)] text-xs text-[var(--text-main)] p-2.5 rounded-lg border border-[var(--panel-border)] outline-none font-bold placeholder:[var(--text-sub)]"
        />
        <button type="submit" className="bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs py-2.5 rounded-lg transition cursor-pointer shadow-md">
          신규 임무 등록
        </button>
      </form>

      <div className="bg-[var(--inner-box)] rounded-xl border border-[var(--panel-border)] p-4 divide-y divide-[var(--panel-border)]">
        {loading ? (
          <div className="text-center text-xs text-[var(--text-sub)] font-bold py-6">로딩 중...</div>
        ) : missions.length === 0 ? (
          <div className="text-center text-xs text-[var(--text-sub)] font-bold py-6">등록된 임무가 없습니다.</div>
        ) : (
          missions.map((m) => (
            <div key={m.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
              <div className="min-w-0 break-words [overflow-wrap:anywhere]">
                <span className="text-[var(--text-main)] font-black">{m.title}</span>
                <span className="text-emerald-400 ml-2 font-bold">(보상: {m.reward_item} {m.reward_count}개)</span>
              </div>
              <button
                onClick={() => deleteMission(m.id)}
                className="text-rose-400 font-bold hover:underline cursor-pointer"
              >
                삭제
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
