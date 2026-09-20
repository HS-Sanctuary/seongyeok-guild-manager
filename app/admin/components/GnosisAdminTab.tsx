"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function GnosisAdminTab() {
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    setLoading(true);
    const { data } = await supabase.from("gnosis_guides").select("*").order("created_at", { ascending: false });
    if (data) setGuides(data);
    setLoading(false);
  };

  const togglePin = async (id: number, currentPin: boolean) => {
    await supabase.from("gnosis_guides").update({ is_pinned: !currentPin }).eq("id", id);
    fetchGuides();
  };

  const deleteGuide = async (id: number) => {
    if (!confirm("이 공략글을 삭제하시겠습니까?")) return;
    await supabase.from("gnosis_guides").delete().eq("id", id);
    fetchGuides();
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-bold text-[#e6c788]">📖 그노시스 공략 게시판 제어</h2>
        <p className="text-xs text-zinc-400 mt-1">길드원 공유 공략글 상단 고정 및 삭제 권한을 관리합니다.</p>
      </div>

      <div className="bg-[#252528] rounded-xl border border-zinc-700 p-4 divide-y divide-zinc-800">
        {loading ? (
          <div className="text-center text-xs text-zinc-500 py-6">공략글 로딩 중...</div>
        ) : guides.length === 0 ? (
          <div className="text-center text-xs text-zinc-500 py-6">등록된 그노시스 공략글이 없습니다.</div>
        ) : (
          guides.map((g) => (
            <div key={g.id} className="py-3 flex items-center justify-between gap-4 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {g.is_pinned && <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-bold">📌 고정</span>}
                  <span className="text-white font-bold">{g.title}</span>
                </div>
                <div className="text-zinc-500 text-[11px]">
                  작성자: {g.author} | 카테고리: {g.category || "일반"} | 조회수: {g.views || 0}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePin(g.id, g.is_pinned)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition ${
                    g.is_pinned ? "bg-amber-950 text-amber-400 border border-amber-800" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {g.is_pinned ? "고정 해제" : "상단 고정"}
                </button>
                <button
                  onClick={() => deleteGuide(g.id)}
                  className="bg-rose-950 text-rose-300 border border-rose-800 px-2.5 py-1 rounded text-[11px] font-bold hover:bg-rose-900 cursor-pointer transition"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}