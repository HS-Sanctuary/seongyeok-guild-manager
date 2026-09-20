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
    <div className="space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-bold text-[#e6c788]">📜 임무 게시판 카탈로그 제어</h2>
        <p className="text-xs text-zinc-400 mt-1">길드 미션 및 현황판의 달성 목표와 보상 항목을 제어합니다.</p>
      </div>

      <form onSubmit={handleAddMission} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-[#252528] p-3 rounded-xl border border-zinc-700">
        <input
          type="text"
          placeholder="임무 제목 (예: 발할라 어비스 3회 클리어)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-[#121212] text-xs text-white p-2.5 rounded-lg border border-zinc-700 outline-none sm:col-span-2"
        />
        <input
          type="text"
          placeholder="보상 아이템명"
          value={rewardItem}
          onChange={(e) => setRewardItem(e.target.value)}
          className="bg-[#121212] text-xs text-white p-2.5 rounded-lg border border-zinc-700 outline-none"
        />
        <button type="submit" className="bg-[#e6c788] text-black font-bold text-xs py-2.5 rounded-lg transition cursor-pointer">
          신규 임무 등록
        </button>
      </form>

      <div className="bg-[#252528] rounded-xl border border-zinc-700 p-4 divide-y divide-zinc-800">
        {loading ? (
          <div className="text-center text-xs text-zinc-500 py-6">로딩 중...</div>
        ) : missions.length === 0 ? (
          <div className="text-center text-xs text-zinc-500 py-6">등록된 임무가 없습니다.</div>
        ) : (
          missions.map((m) => (
            <div key={m.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="text-white font-bold">{m.title}</span>
                <span className="text-emerald-400 ml-2 font-semibold">(보상: {m.reward_item} {m.reward_count}개)</span>
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