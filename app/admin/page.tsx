"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase"; 

const MAIN_TABS = [
  { id: "banner", label: "🚨 긴급 배너" },
  { id: "character", label: "👤 캐릭터 관리 설정" },
  { id: "trade", label: "⚖️ 구매/교환 설정" },
];

const CHAR_SUB_TABS = [
  { id: "tasks", label: "📝 숙제 목록 설정" },
  { id: "raids", label: "⚔️ 레이드/어비스 목록 설정" },
  { id: "classes", label: "🪖 클래스 레벨 관리 목록 설정" },
];

const TRADE_SUB_TABS = [
  { id: "trades", label: "⚖️ 물물교환 목록 설정" },
  { id: "purchases", label: "🛒 상점구매 목록 설정" },
];

export default function AdminPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [activeMainTab, setActiveMainTab] = useState("character"); 
  const [activeCharTab, setActiveCharTab] = useState("tasks"); 
  const [activeTradeTab, setActiveTradeTab] = useState("trades"); 

  const [bannerInput, setBannerInput] = useState("");
  const [activeBanner, setActiveBanner] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [contents, setContents] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTaskForm, setEditTaskForm] = useState<any>({});

  const [classes, setClasses] = useState<any[]>([]);
  const [editingClassId, setEditingClassId] = useState<number | null>(null);
  const [editClassForm, setEditClassForm] = useState<any>({});
  const [newClass, setNewClass] = useState({ icon: "👤", name: "" });

  const [newAbyss, setNewAbyss] = useState("");
  const [newRaid, setNewRaid] = useState("");
  const [newDaily, setNewDaily] = useState("");
  const [newWeekly, setNewWeekly] = useState("");
  
  // 🟢 반복 숙제에 '주기(cycle)' 상태 추가
  const [newRepeat, setNewRepeat] = useState({ name: "", max: 1, cycle: "repeat_weekly" });

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (!savedUser) { router.push("/login"); return; }
    const parsedUser = JSON.parse(savedUser);
    if (parsedUser.nickname !== "한설" && parsedUser.role !== "마스터") {
      alert("관리자 권한이 없습니다."); router.push("/"); return;
    }
    setUser(parsedUser);

    fetchActiveBanner();
    fetchContents();
    fetchTasks();
    fetchClasses();
  }, [router]);

  const fetchActiveBanner = async () => {
    const { data } = await supabase.from('nexus_banners').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1);
    if (data && data.length > 0) setActiveBanner(data[0]);
    else setActiveBanner(null);
  };
  
  const handleBroadcastBanner = async () => {
    if (!bannerInput.trim()) return alert("배너 메시지를 입력해주세요.");
    setIsSubmitting(true);
    try {
      await supabase.from('nexus_banners').update({ is_active: false }).eq('is_active', true);
      const { error } = await supabase.from('nexus_banners').insert([{ message: bannerInput, is_active: true }]);
      if (error) throw error;
      alert("긴급 배너가 송출되었습니다!"); setBannerInput(""); fetchActiveBanner(); window.location.reload(); 
    } catch (e) { alert("배너 송출 실패"); } finally { setIsSubmitting(false); }
  };
  
  const handleTurnOffBanner = async () => {
    if (!activeBanner) return;
    await supabase.from('nexus_banners').update({ is_active: false }).eq('id', activeBanner.id);
    setActiveBanner(null); window.location.reload();
  };

  const fetchContents = async () => {
    const { data } = await supabase.from('nexus_contents').select('*').order('type').order('id');
    if (data) setContents(data);
  };
  
  const handleAddContent = async (type: string, name: string) => {
    if (!name.trim()) return;
    const finalName = type === "abyss" ? `어비스 - ${name}` : `레이드 - ${name}`;
    const shortName = name.substring(0, 2); 
    await supabase.from('nexus_contents').insert([{ type, name: finalName, short_name: shortName, is_weekend: false, is_active: true }]);
    if (type === 'abyss') setNewAbyss(""); else setNewRaid("");
    fetchContents();
  };
  
  const saveEditingContent = async () => {
    await supabase.from('nexus_contents').update({ name: editForm.name, is_weekend: editForm.is_weekend, is_active: editForm.is_active }).eq('id', editingId);
    setEditingId(null); fetchContents();
  };
  
  const deleteContent = async (id: number) => {
    if (!confirm(`삭제하시겠습니까?`)) return;
    await supabase.from('nexus_contents').delete().eq('id', id); fetchContents();
  };

  const fetchTasks = async () => {
    const { data } = await supabase.from('nexus_tasks').select('*').order('type').order('id');
    if (data) setTasks(data);
  };
  
  // 🟢 type 매개변수 활용 (repeat_daily, repeat_weekly 등)
  const handleAddTask = async (type: string, name: string, max_count: number = 1) => {
    if (!name.trim()) return;
    await supabase.from('nexus_tasks').insert([{ type, name, max_count, is_active: true }]);
    if (type === 'daily') setNewDaily(""); 
    else if (type === 'weekly') setNewWeekly(""); 
    else setNewRepeat({ name: "", max: 1, cycle: "repeat_weekly" });
    fetchTasks();
  };
  
  const saveEditingTask = async () => {
    await supabase.from('nexus_tasks').update({ name: editTaskForm.name, max_count: editTaskForm.max_count, is_active: editTaskForm.is_active }).eq('id', editingTaskId);
    setEditingTaskId(null); fetchTasks();
  };
  
  const deleteTask = async (id: number) => {
    if (!confirm(`삭제하시겠습니까?`)) return;
    await supabase.from('nexus_tasks').delete().eq('id', id); fetchTasks();
  };

  const fetchClasses = async () => {
    const { data } = await supabase.from('nexus_classes').select('*').order('id');
    if (data) setClasses(data);
  };
  
  const handleAddClass = async () => {
    if (!newClass.name.trim() || !newClass.icon.trim()) return;
    await supabase.from('nexus_classes').insert([{ name: newClass.name, icon: newClass.icon, is_active: true }]);
    setNewClass({ icon: "👤", name: "" }); fetchClasses();
  };
  
  const saveEditingClass = async () => {
    await supabase.from('nexus_classes').update({ name: editClassForm.name, icon: editClassForm.icon, is_active: editClassForm.is_active }).eq('id', editingClassId);
    setEditingClassId(null); fetchClasses();
  };
  
  const deleteClass = async (id: number) => {
    if (!confirm(`삭제하시겠습니까?`)) return;
    await supabase.from('nexus_classes').delete().eq('id', id); fetchClasses();
  };

  if (!mounted || !user) return null;

  return (
    <main className="min-h-screen bg-[#121212] text-[#d4d4d8] font-sans pb-20 pt-8">
      <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-6">
        
        <div className="flex items-center gap-4 border-b border-zinc-800 pb-6">
          <div className="text-4xl">⚙️</div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#e6c788]">성역 넥서스 관리 시스템</h1>
            <p className="text-sm text-zinc-400 mt-1">성역 길드의 모든 데이터를 구조적으로 제어합니다.</p>
          </div>
        </div>

        <div className="flex gap-2">
          {MAIN_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveMainTab(tab.id)} className={`px-5 py-3 rounded-lg text-sm font-bold transition-all ${activeMainTab === tab.id ? "bg-[#1c1c1e] text-[#e6c788] border border-zinc-700 shadow-md" : "bg-transparent text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-[#1c1c1e] border border-zinc-800 rounded-xl p-6 shadow-xl min-h-[500px]">
          
          {activeMainTab === "banner" && (
            <div className="space-y-6 max-w-3xl">
              <h2 className="text-xl font-bold text-white mb-4">🚨 긴급 공지 배너 제어</h2>
              <div className="bg-[#252528] border border-zinc-700 p-5 rounded-lg space-y-4">
                <label className="block text-sm font-bold text-zinc-400">새로운 배너 메시지 입력</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input type="text" value={bannerInput} onChange={(e) => setBannerInput(e.target.value)} placeholder="예: 오늘 오후 8시 필드보스 레이드 집결!" className="flex-1 bg-[#121212] border border-zinc-600 rounded p-3 text-sm text-white focus:border-red-500 outline-none" onKeyDown={(e) => e.key === 'Enter' && handleBroadcastBanner()} />
                  <button onClick={handleBroadcastBanner} disabled={isSubmitting} className="bg-red-600 hover:bg-red-500 text-white font-black px-6 py-3 rounded text-sm transition-colors">{isSubmitting ? "송출 중..." : "송출하기"}</button>
                </div>
              </div>
              {activeBanner && (
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-5 flex justify-between items-center gap-4">
                  <div>
                    <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded mr-2">현재 송출 중</span>
                    <span className="text-sm font-bold text-red-200">{activeBanner.message}</span>
                  </div>
                  <button onClick={handleTurnOffBanner} className="text-xs bg-[#121212] text-zinc-400 border border-zinc-700 hover:text-white px-4 py-2 rounded transition">배너 종료</button>
                </div>
              )}
            </div>
          )}

          {activeMainTab === "character" && (
            <div className="space-y-6">
              <div className="flex border-b border-zinc-800 mb-6">
                {CHAR_SUB_TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveCharTab(tab.id)} className={`px-5 py-3 text-sm font-bold transition-all border-b-2 ${activeCharTab === tab.id ? "border-[#e6c788] text-[#e6c788]" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeCharTab === "tasks" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* 일일 컨텐츠 */}
                  <div className="bg-[#252528] rounded-xl border border-zinc-700 p-4">
                    <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-2">
                      <h3 className="text-[#e6c788] font-bold">☀️ 일일 컨텐츠</h3>
                    </div>
                    <div className="space-y-2">
                      {tasks.filter(t => t.type === 'daily').map(task => (
                        <div key={task.id} className="bg-[#1c1c1e] p-2.5 rounded-lg border border-zinc-700 flex justify-between items-center gap-2">
                          {editingTaskId === task.id ? (
                            <div className="flex w-full gap-1">
                              <input type="text" value={editTaskForm.name} onChange={e => setEditTaskForm({...editTaskForm, name: e.target.value})} className="flex-1 bg-[#121212] border border-zinc-600 rounded p-1 text-xs text-white" />
                              <button onClick={saveEditingTask} className="text-[10px] bg-emerald-600 px-2 rounded font-bold text-white">V</button>
                              <button onClick={() => setEditingTaskId(null)} className="text-[10px] bg-zinc-600 px-2 rounded font-bold text-white">X</button>
                            </div>
                          ) : (
                            <>
                              <span className="text-sm font-bold truncate">{task.name}</span>
                              <div className="flex gap-1 flex-shrink-0">
                                <button onClick={() => { setEditingTaskId(task.id); setEditTaskForm({...task}); }} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded">수정</button>
                                <button onClick={() => deleteTask(task.id)} className="text-[10px] bg-red-900/40 text-red-400 hover:bg-red-800/50 px-2 py-1 rounded">삭제</button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-700/50">
                        <input type="text" value={newDaily} onChange={e => setNewDaily(e.target.value)} placeholder="새 일일 숙제" onKeyDown={e => e.key === 'Enter' && handleAddTask('daily', newDaily)} className="flex-1 bg-[#121212] rounded p-1.5 text-xs border border-zinc-600" />
                        <button onClick={() => handleAddTask('daily', newDaily)} className="bg-[#e6c788] text-black text-xs font-bold px-3 rounded">+</button>
                      </div>
                    </div>
                  </div>

                  {/* 주간 컨텐츠 */}
                  <div className="bg-[#252528] rounded-xl border border-zinc-700 p-4">
                    <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-2">
                      <h3 className="text-blue-400 font-bold">🌙 주간 컨텐츠</h3>
                    </div>
                    <div className="space-y-2">
                      {tasks.filter(t => t.type === 'weekly').map(task => (
                        <div key={task.id} className="bg-[#1c1c1e] p-2.5 rounded-lg border border-zinc-700 flex justify-between items-center gap-2">
                          {editingTaskId === task.id ? (
                            <div className="flex w-full gap-1">
                              <input type="text" value={editTaskForm.name} onChange={e => setEditTaskForm({...editTaskForm, name: e.target.value})} className="flex-1 bg-[#121212] border border-zinc-600 rounded p-1 text-xs text-white" />
                              <button onClick={saveEditingTask} className="text-[10px] bg-emerald-600 px-2 rounded font-bold text-white">V</button>
                              <button onClick={() => setEditingTaskId(null)} className="text-[10px] bg-zinc-600 px-2 rounded font-bold text-white">X</button>
                            </div>
                          ) : (
                            <>
                              <span className="text-sm font-bold truncate">{task.name}</span>
                              <div className="flex gap-1 flex-shrink-0">
                                <button onClick={() => { setEditingTaskId(task.id); setEditTaskForm({...task}); }} className="text-[10px] bg-zinc-800 px-2 py-1 rounded">수정</button>
                                <button onClick={() => deleteTask(task.id)} className="text-[10px] bg-red-900/40 text-red-400 px-2 py-1 rounded">삭제</button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-700/50">
                        <input type="text" value={newWeekly} onChange={e => setNewWeekly(e.target.value)} placeholder="새 주간 숙제" onKeyDown={e => e.key === 'Enter' && handleAddTask('weekly', newWeekly)} className="flex-1 bg-[#121212] rounded p-1.5 text-xs border border-zinc-600" />
                        <button onClick={() => handleAddTask('weekly', newWeekly)} className="bg-blue-500 text-white text-xs font-bold px-3 rounded">+</button>
                      </div>
                    </div>
                  </div>

                  {/* 🟢 반복 컨텐츠 (주기 설정 콤보박스 적용) */}
                  <div className="bg-[#252528] rounded-xl border border-zinc-700 p-4">
                    <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-2">
                      <h3 className="text-purple-400 font-bold">🔄 반복 컨텐츠</h3>
                    </div>
                    <div className="space-y-2">
                      {tasks.filter(t => t.type.startsWith('repeat')).map(task => {
                        // type에 따른 뱃지 텍스트
                        const badgeStr = task.type === 'repeat_daily' ? '일간' : task.type === 'repeat_weekend' ? '주말' : '주간';
                        return (
                          <div key={task.id} className="bg-[#1c1c1e] p-2.5 rounded-lg border border-zinc-700 flex justify-between items-center gap-2">
                            {editingTaskId === task.id ? (
                              <div className="flex w-full gap-1">
                                <input type="text" value={editTaskForm.name} onChange={e => setEditTaskForm({...editTaskForm, name: e.target.value})} className="flex-1 bg-[#121212] border border-zinc-600 rounded p-1 text-xs text-white" />
                                <input type="number" min="1" value={editTaskForm.max_count} onChange={e => setEditTaskForm({...editTaskForm, max_count: parseInt(e.target.value)})} className="w-10 bg-[#121212] border border-zinc-600 rounded p-1 text-xs text-center text-white" />
                                <button onClick={saveEditingTask} className="text-[10px] bg-emerald-600 px-2 rounded font-bold text-white">V</button>
                                <button onClick={() => setEditingTaskId(null)} className="text-[10px] bg-zinc-600 px-2 rounded font-bold text-white">X</button>
                              </div>
                            ) : (
                              <>
                                <div className="flex flex-col truncate">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] bg-purple-900/40 text-purple-300 px-1 rounded">{badgeStr}</span>
                                    <span className="text-sm font-bold truncate">{task.name}</span>
                                  </div>
                                  <span className="text-[10px] text-zinc-500">Max: {task.max_count}회</span>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <button onClick={() => { setEditingTaskId(task.id); setEditTaskForm({...task}); }} className="text-[10px] bg-zinc-800 px-2 py-1 rounded">수정</button>
                                  <button onClick={() => deleteTask(task.id)} className="text-[10px] bg-red-900/40 text-red-400 px-2 py-1 rounded">삭제</button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                      
                      <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-zinc-700/50">
                        <select value={newRepeat.cycle} onChange={e => setNewRepeat({...newRepeat, cycle: e.target.value})} className="w-full bg-[#121212] border border-zinc-600 rounded p-1.5 text-xs text-zinc-300 outline-none">
                          <option value="repeat_weekly">주간 반복</option>
                          <option value="repeat_daily">일간 반복</option>
                          <option value="repeat_weekend">주말 전용 반복</option>
                        </select>
                        <div className="flex gap-2">
                          <input type="text" value={newRepeat.name} onChange={e => setNewRepeat({...newRepeat, name: e.target.value})} placeholder="새 반복 숙제" className="flex-1 bg-[#121212] rounded p-1.5 text-xs border border-zinc-600" />
                          <input type="number" min="1" value={newRepeat.max} onChange={e => setNewRepeat({...newRepeat, max: parseInt(e.target.value)})} placeholder="횟수" className="w-12 bg-[#121212] rounded p-1.5 text-xs text-center border border-zinc-600" />
                          <button onClick={() => handleAddTask(newRepeat.cycle, newRepeat.name, newRepeat.max)} className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 rounded transition">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeCharTab === "raids" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                  {/* 어비스/레이드 렌더링 코드 유지 (변경사항 없음) */}
                  <div className="bg-[#252528] rounded-xl border border-zinc-700 p-4">
                    <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-2">
                      <h3 className="text-emerald-400 font-bold text-lg">🌌 어비스 관리</h3>
                    </div>
                    <div className="space-y-2">
                      {contents.filter(c => c.type === 'abyss').map(item => (
                        <div key={item.id} className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-700 flex justify-between items-center gap-2">
                          {editingId === item.id ? (
                            <div className="flex w-full gap-2 items-center">
                              <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="flex-1 bg-[#121212] border border-zinc-600 rounded p-1.5 text-sm text-white outline-none" />
                              <label className="text-xs text-amber-400 flex items-center gap-1"><input type="checkbox" checked={editForm.is_weekend} onChange={e => setEditForm({...editForm, is_weekend: e.target.checked})} /> 주말</label>
                              <button onClick={saveEditingContent} className="text-xs bg-emerald-600 px-3 py-1.5 rounded font-bold">저장</button>
                              <button onClick={() => setEditingId(null)} className="text-xs bg-zinc-600 px-3 py-1.5 rounded font-bold">취소</button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-bold text-sm truncate">{item.name}</span>
                                {item.is_weekend && <span className="text-[10px] text-amber-500 bg-amber-900/20 px-1.5 rounded">주말</span>}
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <button onClick={() => { setEditingId(item.id); setEditForm({...item}); }} className="text-xs bg-zinc-800 px-3 py-1.5 rounded">수정</button>
                                <button onClick={() => deleteContent(item.id)} className="text-xs bg-red-900/40 text-red-400 px-3 py-1.5 rounded">삭제</button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-700/50">
                        <input type="text" value={newAbyss} onChange={e => setNewAbyss(e.target.value)} placeholder="새 어비스 던전명" onKeyDown={e => e.key === 'Enter' && handleAddContent('abyss', newAbyss)} className="flex-1 bg-[#121212] rounded p-2 text-sm border border-zinc-600" />
                        <button onClick={() => handleAddContent('abyss', newAbyss)} className="bg-emerald-600 text-white text-sm font-bold px-4 rounded">+</button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#252528] rounded-xl border border-zinc-700 p-4">
                    <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-2">
                      <h3 className="text-indigo-400 font-bold text-lg">🐉 레이드 관리</h3>
                    </div>
                    <div className="space-y-2">
                      {contents.filter(c => c.type === 'raid').map(item => (
                        <div key={item.id} className="bg-[#1c1c1e] p-3 rounded-lg border border-zinc-700 flex justify-between items-center gap-2">
                          {editingId === item.id ? (
                            <div className="flex w-full gap-2 items-center">
                              <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="flex-1 bg-[#121212] border border-zinc-600 rounded p-1.5 text-sm text-white outline-none" />
                              <label className="text-xs text-amber-400 flex items-center gap-1"><input type="checkbox" checked={editForm.is_weekend} onChange={e => setEditForm({...editForm, is_weekend: e.target.checked})} /> 주말</label>
                              <button onClick={saveEditingContent} className="text-xs bg-emerald-600 px-3 py-1.5 rounded font-bold">저장</button>
                              <button onClick={() => setEditingId(null)} className="text-xs bg-zinc-600 px-3 py-1.5 rounded font-bold">취소</button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-bold text-sm truncate">{item.name}</span>
                                {item.is_weekend && <span className="text-[10px] text-amber-500 bg-amber-900/20 px-1.5 rounded">주말</span>}
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <button onClick={() => { setEditingId(item.id); setEditForm({...item}); }} className="text-xs bg-zinc-800 px-3 py-1.5 rounded">수정</button>
                                <button onClick={() => deleteContent(item.id)} className="text-xs bg-red-900/40 text-red-400 px-3 py-1.5 rounded">삭제</button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-700/50">
                        <input type="text" value={newRaid} onChange={e => setNewRaid(e.target.value)} placeholder="새 레이드 던전명" onKeyDown={e => e.key === 'Enter' && handleAddContent('raid', newRaid)} className="flex-1 bg-[#121212] rounded p-2 text-sm border border-zinc-600" />
                        <button onClick={() => handleAddContent('raid', newRaid)} className="bg-indigo-600 text-white text-sm font-bold px-4 rounded">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 클래스 유지 */}
              {activeCharTab === "classes" && (
                <div className="bg-[#252528] rounded-xl border border-zinc-700 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">🪖 클래스 레벨 관리 목록 설정</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {classes.map(cls => (
                      <div key={cls.id} className="flex items-center gap-2 p-2 rounded-lg border bg-[#1c1c1e] border-zinc-700">
                        {editingClassId === cls.id ? (
                          <div className="flex flex-col gap-2 w-full">
                            <div className="flex gap-1">
                              <input type="text" value={editClassForm.icon} onChange={e => setEditClassForm({...editClassForm, icon: e.target.value})} className="w-10 bg-[#121212] border border-zinc-600 rounded p-1 text-center outline-none" />
                              <input type="text" value={editClassForm.name} onChange={e => setEditClassForm({...editClassForm, name: e.target.value})} className="flex-1 bg-[#121212] border border-zinc-600 rounded p-1 text-sm text-white outline-none" />
                            </div>
                            <div className="flex justify-end gap-1">
                              <button onClick={saveEditingClass} className="text-[10px] bg-emerald-600 text-white px-3 py-1 rounded">V</button>
                              <button onClick={() => setEditingClassId(null)} className="text-[10px] bg-zinc-700 text-white px-3 py-1 rounded">X</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className="text-lg w-6 text-center">{cls.icon}</span>
                            <span className="text-sm font-bold flex-1 truncate text-zinc-200">{cls.name}</span>
                            <div className="flex flex-col gap-1">
                              <button onClick={() => { setEditingClassId(cls.id); setEditClassForm({...cls}); }} className="text-[10px] text-zinc-400 hover:text-white bg-zinc-800 px-1.5 rounded">수정</button>
                              <button onClick={() => deleteClass(cls.id)} className="text-[10px] text-red-400 hover:text-red-300 bg-red-950/40 px-1.5 rounded">삭제</button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    
                    <div className="flex flex-col gap-2 p-2 rounded-lg bg-yellow-900/10 border border-yellow-700/50 border-dashed justify-center">
                      <div className="flex gap-1">
                        <input type="text" placeholder="이모지" value={newClass.icon} onChange={e => setNewClass({...newClass, icon: e.target.value})} className="w-12 bg-[#121212] border border-yellow-700/50 rounded p-1 text-center text-sm outline-none" />
                        <input type="text" placeholder="직업명" value={newClass.name} onChange={e => setNewClass({...newClass, name: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleAddClass()} className="flex-1 bg-[#1c1c1e] border border-yellow-700/50 rounded p-1 text-sm text-white outline-none" />
                      </div>
                      <button onClick={handleAddClass} className="text-[10px] bg-[#e6c788] hover:bg-yellow-500 text-[#121212] font-black py-1.5 rounded w-full">+ 직업 추가</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMainTab === "trade" && (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500 space-y-3 bg-[#252528] rounded-xl border border-zinc-700">
                <span className="text-4xl">🛠️</span>
                <p className="text-sm font-medium">물물교환 및 상점 기능은 현재 백엔드 연동 작업 중입니다.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}