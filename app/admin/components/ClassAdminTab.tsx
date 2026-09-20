"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import ClassIcon from "@/components/common/ClassIcon";

export interface ClassItem {
  id: string | number;
  name: string;
  role: "근딜" | "원딜" | "탱커" | "힐러" | "서포터";
}

const DEFAULT_CLASSES: ClassItem[] = [
  { id: "c-1", name: "검술사", role: "근딜" },
  { id: "c-2", name: "격투가", role: "근딜" },
  { id: "c-3", name: "궁수", role: "원딜" },
  { id: "c-4", name: "기사", role: "탱커" },
  { id: "c-5", name: "대검전사", role: "근딜" },
  { id: "c-6", name: "댄서", role: "근딜" },
  { id: "c-7", name: "도적", role: "근딜" },
  { id: "c-8", name: "듀얼블레이드", role: "근딜" },
  { id: "c-9", name: "마법사", role: "원딜" },
  { id: "c-10", name: "빙결술사", role: "탱커" },
  { id: "c-11", name: "사제", role: "힐러" },
  { id: "c-12", name: "석궁사수", role: "원딜" },
  { id: "c-13", name: "수도사", role: "힐러" },
  { id: "c-14", name: "악사", role: "원딜" },
  { id: "c-15", name: "암흑술사", role: "원딜" },
  { id: "c-16", name: "음유시인", role: "서포터" },
  { id: "c-17", name: "장궁병", role: "원딜" },
  { id: "c-18", name: "전격술사", role: "원딜" },
  { id: "c-19", name: "전사", role: "탱커" },
  { id: "c-20", name: "화염술사", role: "원딜" },
  { id: "c-21", name: "힐러", role: "힐러" },
];

export default function ClassAdminTab() {
  const [classes, setClasses] = useState<ClassItem[]>(DEFAULT_CLASSES);
  const [loading, setLoading] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassRole, setNewClassRole] = useState<"근딜" | "원딜" | "탱커" | "힐러" | "서포터">("근딜");
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("nexus_classes").select("*").order("id", { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) setClasses(data);
    } catch (err) {
      console.error("nexus_classes 로드 실패 (기본값 바인딩):", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleAddClass = async () => {
    if (!newClassName.trim()) return alert("직업명을 입력해 주세요.");
    const payload = { name: newClassName.trim(), role: newClassRole };

    try {
      const { data, error } = await supabase.from("nexus_classes").insert([payload]).select();
      if (error) throw error;

      if (data && data[0]) {
        setClasses((prev) => [...prev, data[0]]);
      } else {
        setClasses((prev) => [...prev, { id: Date.now(), ...payload }]);
      }

      setNewClassName("");
    } catch (err: any) {
      alert("직업 추가 실패: " + err.message);
    }
  };

  const handleDeleteClass = async (id: string | number) => {
    if (!confirm("해당 직업을 삭제하시겠습니까?")) return;
    setClasses((prev) => prev.filter((c) => c.id !== id));
    await supabase.from("nexus_classes").delete().eq("id", id);
  };

  const handleSaveEdit = async () => {
    if (!editingClass) return;
    try {
      await supabase
        .from("nexus_classes")
        .update({ name: editingClass.name, role: editingClass.role })
        .eq("id", editingClass.id);

      setClasses((prev) => prev.map((c) => (c.id === editingClass.id ? editingClass : c)));
      setEditingClass(null);
    } catch (err: any) {
      alert("직업 수정 실패: " + err.message);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "근딜": return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      case "원딜": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "탱커": return "bg-sky-500/20 text-sky-400 border-sky-500/30";
      case "힐러": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "서포터": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default: return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-zinc-800 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#e6c788]">🪖 클래스 & 역할군 카탈로그 관리</h2>
          <p className="text-xs text-zinc-400 mt-1">
            21개 직업 및 5대 역할군(근딜/원딜/탱커/힐러/서포터)의 파티 자동 밸런싱 기준을 관리합니다.
          </p>
        </div>
        <button onClick={fetchClasses} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-zinc-300 transition cursor-pointer">
          🔄 리로드
        </button>
      </div>

      {loading && <div className="text-center py-6 text-xs text-zinc-500 animate-pulse">⏳ 클래스 정보 동기화 중...</div>}

      {!loading && (
        <div className="space-y-4">
          <div className="bg-[#121212] border border-zinc-800 rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-bold text-[#e6c788]">등록된 클래스 목록 ({classes.length}개)</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {classes.map((c) => (
                <div key={c.id} className="bg-[#1c1c1e] border border-zinc-800 hover:border-zinc-700 p-3 rounded-xl flex items-center justify-between gap-2 text-xs transition">
                  <div className="flex items-center gap-2 min-w-0">
                    <ClassIcon job={c.name} className="w-5 h-5 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-zinc-200 truncate">{c.name}</div>
                      <span className={`text-[9px] px-1 py-0.2 rounded border font-semibold ${getRoleBadgeStyle(c.role)}`}>
                        {c.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditingClass({ ...c })} className="text-zinc-500 hover:text-zinc-300 text-[11px] cursor-pointer">수정</button>
                    <button onClick={() => handleDeleteClass(c.id)} className="text-rose-500 hover:text-rose-400 text-[11px] cursor-pointer">삭제</button>
                  </div>
                </div>
              ))}

              {/* 신규 직업 추가 카드 */}
              <div className="bg-[#1c1c1e]/50 border border-dashed border-zinc-700 p-2.5 rounded-xl flex flex-col gap-2 justify-center">
                <input 
                  type="text" placeholder="신규 직업명" value={newClassName} 
                  onChange={(e) => setNewClassName(e.target.value)} 
                  className="w-full bg-[#121212] border border-zinc-700 text-xs text-zinc-200 rounded px-2 py-1 outline-none" 
                />
                <div className="flex gap-1.5">
                  <select 
                    value={newClassRole} 
                    onChange={(e: any) => setNewClassRole(e.target.value)}
                    className="flex-1 bg-[#121212] border border-zinc-700 text-[11px] text-zinc-300 rounded px-1 py-1 outline-none cursor-pointer"
                  >
                    <option value="근딜">근딜</option>
                    <option value="원딜">원딜</option>
                    <option value="탱커">탱커</option>
                    <option value="힐러">힐러</option>
                    <option value="서포터">서포터</option>
                  </select>
                  <button onClick={handleAddClass} className="px-2.5 py-1 bg-[#e6c788] text-black font-bold text-xs rounded shrink-0 cursor-pointer">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 팝업 */}
      {editingClass && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] border border-zinc-700 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-base font-bold text-[#e6c788]">✏️ 클래스 정보 수정</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">직업명</label>
                <input
                  type="text"
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  className="w-full bg-[#121212] border border-zinc-700 text-xs text-zinc-200 rounded-lg p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">기본 역할군</label>
                <select
                  value={editingClass.role}
                  onChange={(e: any) => setEditingClass({ ...editingClass, role: e.target.value })}
                  className="w-full bg-[#121212] border border-zinc-700 text-xs text-zinc-200 rounded-lg p-2.5 outline-none cursor-pointer"
                >
                  <option value="근딜">근딜</option>
                  <option value="원딜">원딜</option>
                  <option value="탱커">탱커</option>
                  <option value="힐러">힐러</option>
                  <option value="서포터">서포터</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditingClass(null)} className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg text-xs font-bold cursor-pointer">취소</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-[#e6c788] text-black rounded-lg text-xs font-bold cursor-pointer">저장하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}