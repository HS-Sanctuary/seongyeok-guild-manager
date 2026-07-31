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
  { id: "classes", label: "🪖 클래스 목록 설정" },
];

export default function AdminPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [activeMainTab, setActiveMainTab] = useState("character"); 
  const [activeCharTab, setActiveCharTab] = useState("tasks"); 

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
  const [newRepeat, setNewRepeat] = useState({ name: "", max: 1, cycle: "repeat_weekly" });

  // 🟢 물물교환 관련 상태
  const [trades, setTrades] = useState<any[]>([]);
  const [newTrade, setNewTrade] = useState({
    map: "", npc: "", reward: "", reward_cnt: 1, cost: "", cost_cnt: 1, limit: 10, reset_type: "주간", scope: "캐릭당"
  });

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
    fetchTrades();
  }, [router]);

  // 배너 로직
  const fetchActiveBanner = async () => { const { data } = await supabase.from('nexus_banners').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1); if (data && data.length > 0) setActiveBanner(data[0]); else setActiveBanner(null); };
  const handleBroadcastBanner = async () => { if (!bannerInput.trim()) return alert("입력해주세요."); setIsSubmitting(true); try { await supabase.from('nexus_banners').update({ is_active: false }).eq('is_active', true); await supabase.from('nexus_banners').insert([{ message: bannerInput, is_active: true }]); alert("송출 성공!"); setBannerInput(""); fetchActiveBanner(); window.location.reload(); } catch (e) {} finally { setIsSubmitting(false); } };
  const handleTurnOffBanner = async () => { if (!activeBanner) return; await supabase.from('nexus_banners').update({ is_active: false }).eq('id', activeBanner.id); setActiveBanner(null); window.location.reload(); };
  
  // 컨텐츠(어비스/레이드) 로직
  const fetchContents = async () => { const { data } = await supabase.from('nexus_contents').select('*').order('type').order('id'); if (data) setContents(data); };
  const handleAddContent = async (type: string, name: string) => { if (!name.trim()) return; const finalName = type === "abyss" ? `어비스 - ${name}` : `레이드 - ${name}`; await supabase.from('nexus_contents').insert([{ type, name: finalName, short_name: name.substring(0,2), is_weekend: false, is_active: true }]); if (type === 'abyss') setNewAbyss(""); else setNewRaid(""); fetchContents(); };
  const saveEditingContent = async () => { await supabase.from('nexus_contents').update({ name: editForm.name, is_weekend: editForm.is_weekend, is_active: editForm.is_active }).eq('id', editingId); setEditingId(null); fetchContents(); };
  const deleteContent = async (id: number) => { if (!confirm(`삭제하시겠습니까?`)) return; await supabase.from('nexus_contents').delete().eq('id', id); fetchContents(); };
  
  // 숙제(일일/주간/반복) 로직
  const fetchTasks = async () => { const { data } = await supabase.from('nexus_tasks').select('*').order('type').order('id'); if (data) setTasks(data); };
  const handleAddTask = async (type: string, name: string, max_count: number = 1) => { if (!name.trim()) return; await supabase.from('nexus_tasks').insert([{ type, name, max_count, is_active: true }]); if (type === 'daily') setNewDaily(""); else if (type === 'weekly') setNewWeekly(""); else setNewRepeat({ name: "", max: 1, cycle: "repeat_weekly" }); fetchTasks(); };
  const saveEditingTask = async () => { await supabase.from('nexus_tasks').update({ name: editTaskForm.name, max_count: editTaskForm.max_count, is_active: editTaskForm.is_active }).eq('id', editingTaskId); setEditingTaskId(null); fetchTasks(); };
  const deleteTask = async (id: number) => { if (!confirm(`삭제하시겠습니까?`)) return; await supabase.from('nexus_tasks').delete().eq('id', id); fetchTasks(); };
  
  // 클래스 로직
  const fetchClasses = async () => { const { data } = await supabase.from('nexus_classes').select('*').order('id'); if (data) setClasses(data); };
  const handleAddClass = async () => { if (!newClass.name.trim() || !newClass.icon.trim()) return; await supabase.from('nexus_classes').insert([{ name: newClass.name, icon: newClass.icon, is_active: true }]); setNewClass({ icon: "👤", name: "" }); fetchClasses(); };
  const saveEditingClass = async () => { await supabase.from('nexus_classes').update({ name: editClassForm.name, icon: editClassForm.icon, is_active: editClassForm.is_active }).eq('id', editingClassId); setEditingClassId(null); fetchClasses(); };
  const deleteClass = async (id: number) => { if (!confirm(`삭제하시겠습니까?`)) return; await supabase.from('nexus_classes').delete().eq('id', id); fetchClasses(); };

  // 🟢 물물교환 API 로직
  const fetchTrades = async () => { const { data } = await supabase.from('nexus_trades').select('*').order('id'); if (data) setTrades(data); };
  const handleAddTrade = async () => {
    if (!newTrade.reward.trim() || !newTrade.cost.trim()) return alert("보상과 재화 이름은 필수입니다.");
    await supabase.from('nexus_trades').insert([newTrade]);
    setNewTrade({ map: "", npc: "", reward: "", reward_cnt: 1, cost: "", cost_cnt: 1, limit: 10, reset_type: "주간", scope: "캐릭당" });
    fetchTrades();
  };
  const deleteTrade = async (id: number) => { if (!confirm("이 교환 항목을 삭제하시겠습니까?")) return; await supabase.from('nexus_trades').delete().eq('id', id); fetchTrades(); };

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
          
          {/* 배너 탭 */}
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

          {/* 🟢 캐릭터 관리 설정 탭 (완벽 복원) */}
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
                  {/* 일일 콘텐츠 */}
                  <div className="bg-[#252528] rounded-xl border border-zinc-700 p-4">
                    <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-2"><h3 className="text-[#e6c788] font-bold">☀️ 일일 콘텐츠</h3></div>
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

                  {/* 주간 콘텐츠 */}
                  <div className="bg-[#252528] rounded-xl border border-zinc-700 p-4">
                    <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-2"><h3 className="text-blue-400 font-bold">🌙 주간 콘텐츠</h3></div>
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
                                <button onClick={() => { setEditingTaskId(task.id); setEditTaskForm({...task}); }} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded">수정</button>
                                <button onClick={() => deleteTask(task.id)} className="text-[10px] bg-red-900/40 text-red-400 hover:bg-red-800/50 px-2 py-1 rounded">삭제</button>
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

                  {/* 반복 콘텐츠 */}
                  <div className="bg-[#252528] rounded-xl border border-zinc-700 p-4">
                    <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-2"><h3 className="text-purple-400 font-bold">🔄 반복 콘텐츠</h3></div>
                    <div className="space-y-2">
                      {tasks.filter(t => t.type.startsWith('repeat')).map(task => {
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
                  {/* 어비스 관리 */}
                  <div className="bg-[#252528] rounded-xl border border-zinc-700 p-4">
                    <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-2"><h3 className="text-emerald-400 font-bold text-lg">🌌 어비스 관리</h3></div>
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

                  {/* 레이드 관리 */}
                  <div className="bg-[#252528] rounded-xl border border-zinc-700 p-4">
                    <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-2"><h3 className="text-indigo-400 font-bold text-lg">🐉 레이드 관리</h3></div>
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

          {/* 🟢 구매/교환 탭 로직 */}
          {activeMainTab === "trade" && (
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#e6c788]">⚖️ 통합 물물교환 카탈로그 설정</h2>
                  <p className="text-sm text-zinc-400 mt-1">캐릭터별로 추적할 NPC 교환 및 상점 아이템을 등록합니다.</p>
                </div>
              </div>

              {/* 입력 폼 */}
              <div className="bg-[#252528] rounded-xl border border-zinc-700 p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-2">
                  <input type="text" placeholder="맵 (예: 두갈드아일)" value={newTrade.map} onChange={e => setNewTrade({...newTrade, map: e.target.value})} className="bg-[#121212] border border-zinc-600 rounded p-2 text-xs text-white" />
                  <input type="text" placeholder="NPC (예: 앨빈)" value={newTrade.npc} onChange={e => setNewTrade({...newTrade, npc: e.target.value})} className="bg-[#121212] border border-zinc-600 rounded p-2 text-xs text-white" />
                  <input type="text" placeholder="보상 (예: 상급 목재)" value={newTrade.reward} onChange={e => setNewTrade({...newTrade, reward: e.target.value})} className="bg-[#121212] border border-zinc-600 rounded p-2 text-xs text-white lg:col-span-2" />
                  <div className="flex items-center bg-[#121212] border border-zinc-600 rounded px-2">
                    <span className="text-[10px] text-zinc-500 mr-1">수량</span>
                    <input type="number" min="1" value={newTrade.reward_cnt} onChange={e => setNewTrade({...newTrade, reward_cnt: Number(e.target.value)})} className="bg-transparent w-full text-xs text-white outline-none" />
                  </div>
                  <input type="text" placeholder="소모 재화 (예: 야채볶음)" value={newTrade.cost} onChange={e => setNewTrade({...newTrade, cost: e.target.value})} className="bg-[#121212] border border-zinc-600 rounded p-2 text-xs text-white lg:col-span-2" />
                  <div className="flex items-center bg-[#121212] border border-zinc-600 rounded px-2">
                    <span className="text-[10px] text-zinc-500 mr-1">소모</span>
                    <input type="number" min="1" value={newTrade.cost_cnt} onChange={e => setNewTrade({...newTrade, cost_cnt: Number(e.target.value)})} className="bg-transparent w-full text-xs text-white outline-none" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  <div className="flex items-center bg-[#121212] border border-zinc-600 rounded px-2">
                    <span className="text-[10px] text-zinc-500 mr-1 w-12">상한(Max)</span>
                    <input type="number" min="1" value={newTrade.limit} onChange={e => setNewTrade({...newTrade, limit: Number(e.target.value)})} className="bg-transparent w-full p-2 text-xs text-white outline-none" />
                  </div>
                  <select value={newTrade.reset_type} onChange={e => setNewTrade({...newTrade, reset_type: e.target.value})} className="bg-[#121212] border border-zinc-600 rounded p-2 text-xs text-white outline-none">
                    <option value="일간">일간 초기화</option>
                    <option value="주간">주간 초기화</option>
                  </select>
                  <select value={newTrade.scope} onChange={e => setNewTrade({...newTrade, scope: e.target.value})} className="bg-[#121212] border border-zinc-600 rounded p-2 text-xs text-white outline-none">
                    <option value="캐릭당">캐릭당</option>
                    <option value="계정당">계정당</option>
                  </select>
                  <button onClick={handleAddTrade} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-sm rounded transition p-2">카탈로그에 추가</button>
                </div>
              </div>

              {/* 목록 테이블 */}
              <div className="bg-[#1c1c1e] border border-zinc-700 rounded-lg overflow-hidden overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#252528] text-zinc-400 border-b border-zinc-700">
                    <tr>
                      <th className="p-3 font-bold text-xs">맵 / NPC</th>
                      <th className="p-3 font-bold text-xs">획득 보상</th>
                      <th className="p-3 font-bold text-xs">소모 재화</th>
                      <th className="p-3 font-bold text-xs text-center">상한</th>
                      <th className="p-3 font-bold text-xs text-center">조건</th>
                      <th className="p-3 font-bold text-xs text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {trades.map((trade) => (
                      <tr key={trade.id} className="hover:bg-[#202023] transition">
                        <td className="p-3">
                          <div className="font-bold text-zinc-200">{trade.map || "-"}</div>
                          <div className="text-[10px] text-zinc-500">{trade.npc || "-"}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-emerald-400">{trade.reward}</div>
                          <div className="text-[10px] text-zinc-500">{trade.reward_cnt}개 획득</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-amber-400">{trade.cost}</div>
                          <div className="text-[10px] text-zinc-500">{trade.cost_cnt}개 필요</div>
                        </td>
                        <td className="p-3 text-center font-black text-purple-400">{trade.limit}회</td>
                        <td className="p-3 text-center">
                          <div className="flex flex-col gap-1 items-center">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${trade.reset_type === '일간' ? 'bg-amber-900/30 text-amber-400' : 'bg-blue-900/30 text-blue-400'}`}>{trade.reset_type}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${trade.scope === '캐릭당' ? 'bg-zinc-800 text-zinc-300' : 'bg-rose-900/30 text-rose-400'}`}>{trade.scope}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => deleteTrade(trade.id)} className="text-[10px] bg-red-900/40 text-red-400 hover:bg-red-800 hover:text-white px-2 py-1 rounded transition">삭제</button>
                        </td>
                      </tr>
                    ))}
                    {trades.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-500">등록된 카탈로그가 없습니다.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}