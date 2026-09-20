"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface TaskItem {
  id: string | number;
  name: string;
  type: "daily" | "weekly" | "repeat";
  repeat_cycle?: "daily" | "weekly";
  max_count: number;
  is_active?: boolean;
}

const DEFAULT_TASKS: TaskItem[] = [
  { id: "t-1", name: "필드 보스 처치", type: "daily", max_count: 1, is_active: true },
  { id: "t-2", name: "여신상 공물 바치기", type: "daily", max_count: 1, is_active: true },
  { id: "t-3", name: "주간 어비스 클리어", type: "weekly", max_count: 1, is_active: true },
  { id: "t-4", name: "주간 레이드 클리어", type: "weekly", max_count: 1, is_active: true },
  { id: "t-5", name: "소환의 결계", type: "repeat", repeat_cycle: "weekly", max_count: 7, is_active: true },
  { id: "t-6", name: "창백한 산", type: "repeat", repeat_cycle: "weekly", max_count: 5, is_active: true },
];

export default function TaskAdminTab() {
  const [tasks, setTasks] = useState<TaskItem[]>(DEFAULT_TASKS);
  const [loading, setLoading] = useState(false);

  // 폼 상태
  const [newDailyName, setNewDailyName] = useState("");
  const [newWeeklyName, setNewWeeklyName] = useState("");
  const [newRepeatName, setNewRepeatName] = useState("");
  const [newRepeatCycle, setNewRepeatCycle] = useState<"daily" | "weekly">("weekly");
  const [newRepeatMax, setNewRepeatMax] = useState<number>(7);

  // 수정 모달 상태
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("nexus_tasks").select("*").order("id", { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) setTasks(data);
    } catch (err) {
      console.error("nexus_tasks 로드 실패 (기본값 바인딩):", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAddTask = async (type: "daily" | "weekly" | "repeat", name: string, maxCount = 1, cycle?: "daily" | "weekly") => {
    if (!name.trim()) return alert("숙제 명칭을 입력해 주세요.");
    const payload = {
      name: name.trim(),
      type,
      max_count: maxCount,
      repeat_cycle: cycle || "weekly",
      is_active: true,
    };

    try {
      const { data, error } = await supabase.from("nexus_tasks").insert([payload]).select();
      if (error) throw error;
      
      if (data && data[0]) {
        setTasks((prev) => [...prev, data[0]]);
      } else {
        setTasks((prev) => [...prev, { id: Date.now(), ...payload }]);
      }

      if (type === "daily") setNewDailyName("");
      if (type === "weekly") setNewWeeklyName("");
      if (type === "repeat") setNewRepeatName("");
    } catch (err: any) {
      alert("숙제 추가 실패: " + err.message);
    }
  };

  const handleDeleteTask = async (id: string | number) => {
    if (!confirm("해당 숙제 항목을 삭제하시겠습니까?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("nexus_tasks").delete().eq("id", id);
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;
    try {
      await supabase
        .from("nexus_tasks")
        .update({
          name: editingTask.name,
          max_count: editingTask.max_count,
          repeat_cycle: editingTask.repeat_cycle,
          is_active: editingTask.is_active !== false
        })
        .eq("id", editingTask.id);

      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? editingTask : t)));
      setEditingTask(null);
    } catch (err: any) {
      alert("수정 실패: " + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-zinc-800 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#e6c788]">📝 일일 / 주간 / 반복 숙제 관리</h2>
          <p className="text-xs text-zinc-400 mt-1">
            크로노스 체크보드에 반영되는 길드원 숙제 항목 리스트를 제어합니다.
          </p>
        </div>
        <button onClick={fetchTasks} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-zinc-300 transition cursor-pointer">
          🔄 리로드
        </button>
      </div>

      {loading && <div className="text-center py-6 text-xs text-zinc-500 animate-pulse">⏳ 숙제 목록 동기화 중...</div>}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 일일 콘텐츠 */}
          <div className="bg-[#121212] border border-zinc-800 rounded-xl p-4 space-y-3 flex flex-col justify-between min-h-[440px]">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">🌼 일일 콘텐츠</h3>
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                {tasks.filter((t) => t.type === "daily").map((t) => (
                  <div key={t.id} className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-200 truncate max-w-[140px]">{t.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setEditingTask({ ...t })} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] cursor-pointer">수정</button>
                      <button onClick={() => handleDeleteTask(t.id)} className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-400 rounded text-[11px] cursor-pointer">삭제</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-1.5 pt-2 border-t border-zinc-800/80">
              <input type="text" placeholder="새 일일 숙제" value={newDailyName} onChange={(e) => setNewDailyName(e.target.value)} className="flex-1 bg-[#1c1c1e] border border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-200 outline-none focus:border-[#e6c788]" />
              <button onClick={() => handleAddTask("daily", newDailyName, 1)} className="px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold rounded-lg text-xs border border-amber-500/40 cursor-pointer">+</button>
            </div>
          </div>

          {/* 주간 콘텐츠 */}
          <div className="bg-[#121212] border border-zinc-800 rounded-xl p-4 space-y-3 flex flex-col justify-between min-h-[440px]">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-sky-400 flex items-center gap-1.5">🌙 주간 콘텐츠</h3>
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                {tasks.filter((t) => t.type === "weekly").map((t) => (
                  <div key={t.id} className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-200 truncate max-w-[140px]">{t.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setEditingTask({ ...t })} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] cursor-pointer">수정</button>
                      <button onClick={() => handleDeleteTask(t.id)} className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-400 rounded text-[11px] cursor-pointer">삭제</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-1.5 pt-2 border-t border-zinc-800/80">
              <input type="text" placeholder="새 주간 숙제" value={newWeeklyName} onChange={(e) => setNewWeeklyName(e.target.value)} className="flex-1 bg-[#1c1c1e] border border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-200 outline-none focus:border-[#e6c788]" />
              <button onClick={() => handleAddTask("weekly", newWeeklyName, 1)} className="px-3 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 font-bold rounded-lg text-xs border border-sky-500/40 cursor-pointer">+</button>
            </div>
          </div>

          {/* 반복 콘텐츠 */}
          <div className="bg-[#121212] border border-zinc-800 rounded-xl p-4 space-y-3 flex flex-col justify-between min-h-[440px]">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-purple-400 flex items-center gap-1.5">🔄 반복 콘텐츠</h3>
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                {tasks.filter((t) => t.type === "repeat").map((t) => (
                  <div key={t.id} className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-purple-400 border border-purple-500/30 px-1 rounded">{t.repeat_cycle === "daily" ? "일간" : "주간"}</span>
                        <span className="font-bold text-zinc-200 truncate max-w-[100px]">{t.name}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Max: {t.max_count}회</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setEditingTask({ ...t })} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] cursor-pointer">수정</button>
                      <button onClick={() => handleDeleteTask(t.id)} className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-400 rounded text-[11px] cursor-pointer">삭제</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-zinc-800/80">
              <div className="flex gap-1.5">
                <select value={newRepeatCycle} onChange={(e: any) => setNewRepeatCycle(e.target.value)} className="bg-[#1c1c1e] border border-zinc-700 text-xs text-zinc-300 rounded-lg px-2 outline-none cursor-pointer">
                  <option value="weekly">주간 반복</option>
                  <option value="daily">일간 반복</option>
                </select>
                <input type="number" min="1" max="99" value={newRepeatMax} onChange={(e) => setNewRepeatMax(Number(e.target.value))} className="w-14 bg-[#1c1c1e] border border-zinc-700 rounded-lg p-1.5 text-xs text-center text-zinc-200 outline-none" />
              </div>
              <div className="flex gap-1.5">
                <input type="text" placeholder="새 반복 숙제" value={newRepeatName} onChange={(e) => setNewRepeatName(e.target.value)} className="flex-1 bg-[#1c1c1e] border border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-200 outline-none focus:border-[#e6c788]" />
                <button onClick={() => handleAddTask("repeat", newRepeatName, newRepeatMax, newRepeatCycle)} className="px-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 font-bold rounded-lg text-xs border border-purple-500/40 cursor-pointer">+</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 팝업 */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] border border-zinc-700 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-base font-bold text-[#e6c788]">✏️ 숙제 항목 수정</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">숙제 명칭</label>
                <input
                  type="text"
                  value={editingTask.name}
                  onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                  className="w-full bg-[#121212] border border-zinc-700 text-xs text-zinc-200 rounded-lg p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Max 수행 횟수</label>
                <input
                  type="number"
                  value={editingTask.max_count}
                  onChange={(e) => setEditingTask({ ...editingTask, max_count: Number(e.target.value) })}
                  className="w-full bg-[#121212] border border-zinc-700 text-xs text-zinc-200 rounded-lg p-2.5 outline-none"
                />
              </div>

              {editingTask.type === "repeat" && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">반복 주기</label>
                  <select
                    value={editingTask.repeat_cycle || "weekly"}
                    onChange={(e: any) => setEditingTask({ ...editingTask, repeat_cycle: e.target.value })}
                    className="w-full bg-[#121212] border border-zinc-700 text-xs text-zinc-200 rounded-lg p-2.5 outline-none cursor-pointer"
                  >
                    <option value="weekly">주간 반복</option>
                    <option value="daily">일간 반복</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditingTask(null)} className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg text-xs font-bold cursor-pointer">취소</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-[#e6c788] text-black rounded-lg text-xs font-bold cursor-pointer">저장하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}