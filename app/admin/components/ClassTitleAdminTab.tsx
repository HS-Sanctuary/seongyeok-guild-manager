"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ClassTitleAdminTab() {
  const [classes, setClasses] = useState<any[]>([]);
  const [titles, setTitles] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [titleDesc, setTitleDesc] = useState("");

  useEffect(() => {
    fetchClassAndTitles();
  }, []);

  const fetchClassAndTitles = async () => {
    const { data: cData } = await supabase.from("nexus_classes").select("*").order("id");
    if (cData) setClasses(cData);

    const { data: tData } = await supabase.from("nexus_titles").select("*").order("id");
    if (tData) setTitles(tData);
  };

  const handleRoleChange = async (classId: number, role: string) => {
    await supabase.from("nexus_classes").update({ role }).eq("id", classId);
    fetchClassAndTitles();
  };

  const handleAddTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return alert("칭호명을 입력해 주세요.");
    await supabase.from("nexus_titles").insert([{ title_name: newTitle.trim(), description: titleDesc.trim() }]);
    setNewTitle("");
    setTitleDesc("");
    fetchClassAndTitles();
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-bold text-[#e6c788]">🛡️ 21개 직업 역할군 & 판테온 칭호 연동</h2>
        <p className="text-xs text-zinc-400 mt-1">시낙시스 5대 포지션(탱/힐/근딜/원딜/서폿) 매핑 및 아고라 칭호 카탈로그를 관리합니다.</p>
      </div>

      {/* 21개 직업 역할군 설정 */}
      <div className="bg-[#252528] rounded-xl border border-zinc-700 p-4 space-y-3">
        <h3 className="text-xs font-bold text-amber-400">⚔️ 21개 직업 5대 포지션(역할군) 매핑</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
          {classes.map((c) => (
            <div key={c.id} className="bg-[#121212] p-2 rounded-lg border border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-white font-bold">{c.name}</span>
              <select
                value={c.role || "근딜"}
                onChange={(e) => handleRoleChange(c.id, e.target.value)}
                className="bg-[#252528] text-amber-400 border border-zinc-700 text-[11px] rounded p-1 outline-none"
              >
                <option value="근딜">근딜</option>
                <option value="원딜">원딜</option>
                <option value="탱커">탱커</option>
                <option value="힐러">힐러</option>
                <option value="서포터">서포터</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* 칭호 신규 등록 */}
      <form onSubmit={handleAddTitle} className="bg-[#252528] p-4 rounded-xl border border-zinc-700 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="신규 칭호명 (예: 성역의 수호자)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="bg-[#121212] text-xs text-white p-2.5 rounded-lg border border-zinc-700 flex-1 outline-none"
        />
        <input
          type="text"
          placeholder="칭호 수여 조건/설명"
          value={titleDesc}
          onChange={(e) => setTitleDesc(e.target.value)}
          className="bg-[#121212] text-xs text-white p-2.5 rounded-lg border border-zinc-700 flex-1 outline-none"
        />
        <button type="submit" className="bg-[#e6c788] text-black font-bold text-xs px-4 py-2.5 rounded-lg transition cursor-pointer">
          칭호 등록
        </button>
      </form>

      {/* 칭호 목록 */}
      <div className="bg-[#252528] rounded-xl border border-zinc-700 p-4">
        <h3 className="text-xs font-bold text-zinc-300 mb-2">🏅 판테온 등록 칭호</h3>
        <div className="flex flex-wrap gap-2">
          {titles.map((t) => (
            <div key={t.id} className="bg-[#121212] border border-zinc-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
              <span className="text-[#e6c788] font-bold">🏅 {t.title_name}</span>
              <button
                onClick={async () => {
                  if (!confirm("삭제하시겠습니까?")) return;
                  await supabase.from("nexus_titles").delete().eq("id", t.id);
                  fetchClassAndTitles();
                }}
                className="text-rose-500 font-bold text-[10px] hover:underline cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}