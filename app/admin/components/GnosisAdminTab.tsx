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
    <div className="space-y-5">
      <div className="border-b border-[var(--panel-border)] pb-3">
        <h2 className="text-lg font-black text-[var(--accent)]">📖 그노시스 공략 게시판 제어</h2>
        <p className="text-xs text-[var(--text-sub)] font-medium mt-0.5">길드원 공유 공략글 상단 고정 및 삭제 권한을 관리합니다.</p>
      </div>

      <div className="bg-[var(--inner-box)] rounded-xl border border-[var(--panel-border)] p-4 divide-y divide-[var(--panel-border)]">
        {loading ? (
          <div className="text-center text-xs text-[var(--text-sub)] font-bold py-6">공략글 로딩 중...</div>
        ) : guides.length === 0 ? (
          <div className="text-center text-xs text-[var(--text-sub)] font-bold py-6">등록된 그노시스 공략글이 없습니다.</div>
        ) : (
          guides.map((g) => (
            <div key={g.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div className="space-y-0.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {g.is_pinned && <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-black border border-amber-500/30">📌 고정</span>}
                  <span className="min-w-0 text-[var(--text-main)] font-black break-words [overflow-wrap:anywhere]">{g.title}</span>
                </div>
                <div className="text-[var(--text-sub)] text-[11px] font-bold break-words [overflow-wrap:anywhere]">
                  작성자: {g.author} | 카테고리: {g.category || "일반"} | 조회수: {g.views || 0}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <button
                  onClick={() => togglePin(g.id, g.is_pinned)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition ${
                    g.is_pinned 
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" 
                      : "bg-[var(--panel)] text-[var(--text-sub)] border border-[var(--panel-border)]"
                  }`}
                >
                  {g.is_pinned ? "고정 해제" : "상단 고정"}
                </button>
                <button
                  onClick={() => deleteGuide(g.id)}
                  className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-lg text-[11px] font-bold hover:bg-rose-500/25 cursor-pointer transition"
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
