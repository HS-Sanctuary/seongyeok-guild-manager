"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase"; 

const TABS = [
  { id: "banner", label: "🚨 긴급 배너" },
  { id: "contents", label: "⚔️ 레이드/어비스" },
  { id: "character", label: "👤 캐릭터 관리" }, // 🟢 신규 탭 추가!
  { id: "trades", label: "⚖️ 물물교환 관리" },
  { id: "purchases", label: "🛒 상점 구매 관리" },
];

export default function AdminPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("banner");

  // [1] 배너 상태
  const [bannerInput, setBannerInput] = useState("");
  const [activeBanner, setActiveBanner] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // [2] 레이드/어비스 상태
  const [contents, setContents] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [newContent, setNewContent] = useState({ type: "abyss", name: "", is_weekend: false });

  // 🟢 [3] 캐릭터 관리 (숙제) 상태
  const [tasks, setTasks] = useState<any[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTaskForm, setEditTaskForm] = useState<any>({});
  const [newTask, setNewTask] = useState({ type: "daily", name: "", max_count: 1 });

  // 🟢 [4] 캐릭터 관리 (클래스) 상태
  const [classes, setClasses] = useState<any[]>([]);
  const [editingClassId, setEditingClassId] = useState<number | null>(null);
  const [editClassForm, setEditClassForm] = useState<any>({});
  const [newClass, setNewClass] = useState({ icon: "👤", name: "" });

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (!savedUser) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(savedUser);
    
    if (parsedUser.nickname !== "한설" && parsedUser.role !== "마스터") {
      alert("관리자 권한이 없습니다.");
      router.push("/");
      return;
    }
    setUser(parsedUser);

    fetchActiveBanner();
    fetchContents();
    fetchTasks();
    fetchClasses();
  }, [router]);

  // ==========================================
  // 배너 로직 (버그 수정 완료)
  // ==========================================
  const fetchActiveBanner = async () => {
    const { data } = await supabase.from('nexus_banners').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single();
    setActiveBanner(data || null);
  };

  const handleBroadcastBanner = async () => {
    if (!bannerInput.trim()) return alert("배너 메시지를 입력해주세요.");
    setIsSubmitting(true);
    try {
      await supabase.from('nexus_banners').update({ is_active: false }).eq('is_active', true);
      // DB 스키마에 맞게 message 와 is_active 만 전송!
      const { error } = await supabase.from('nexus_banners').insert([{ message: bannerInput, is_active: true }]);
      if (error) throw error;
      
      alert("긴급 배너가 송출되었습니다!");
      setBannerInput("");
      fetchActiveBanner();
      window.location.reload(); 
    } catch (e) { console.error(e); alert("배너 송출 실패"); } finally { setIsSubmitting(false); }
  };

  const handleTurnOffBanner = async () => {
    if (!activeBanner) return;
    await supabase.from('nexus_banners').update({ is_active: false }).eq('id', activeBanner.id);
    setActiveBanner(null);
    window.location.reload();
  };

  // ==========================================
  // 콘텐츠(레이드) 로직
  // ==========================================
  const fetchContents = async () => {
    const { data } = await supabase.from('nexus_contents').select('*').order('type').order('id');
    if (data) setContents(data);
  };
  const handleAddContent = async () => {
    if (!newContent.name.trim()) return alert("콘텐츠 이름을 입력해주세요.");
    let finalName = newContent.name;
    if (!finalName.includes("-") && !finalName.includes("주말")) {
      finalName = newContent.type === "abyss" ? `어비스 - ${finalName}` : `레이드 - ${finalName}`;
    }
    await supabase.from('nexus_contents').insert([{ type: newContent.type, name: finalName, is_weekend: newContent.is_weekend, is_active: true }]);
    setNewContent({ type: "abyss", name: "", is_weekend: false });
    fetchContents();
  };
  const saveEditingContent = async () => {
    await supabase.from('nexus_contents').update({ type: editForm.type, name: editForm.name, is_weekend: editForm.is_weekend, is_active: editForm.is_active }).eq('id', editingId);
    setEditingId(null); fetchContents();
  };
  const deleteContent = async (id: number, name: string) => {
    if (!confirm(`'${name}'을(를) 영구 삭제하시겠습니까?`)) return;
    await supabase.from('nexus_contents').delete().eq('id', id); fetchContents();
  };

  // ==========================================
  // 숙제 관리 로직
  // ==========================================
  const fetchTasks = async () => {
    const { data } = await supabase.from('nexus_tasks').select('*').order('type').order('id');
    if (data) setTasks(data);
  };
  const handleAddTask = async () => {
    if (!newTask.name.trim()) return;
    await supabase.from('nexus_tasks').insert([{ type: newTask.type, name: newTask.name, max_count: newTask.type === 'repeat' ? newTask.max_count : 1, is_active: true }]);
    setNewTask({ type: "daily", name: "", max_count: 1 });
    fetchTasks();
  };
  const saveEditingTask = async () => {
    await supabase.from('nexus_tasks').update({ type: editTaskForm.type, name: editTaskForm.name, max_count: editTaskForm.type === 'repeat' ? editTaskForm.max_count : 1, is_active: editTaskForm.is_active }).eq('id', editingTaskId);
    setEditingTaskId(null); fetchTasks();
  };
  const deleteTask = async (id: number) => {
    if (!confirm(`숙제를 삭제하시겠습니까?`)) return;
    await supabase.from('nexus_tasks').delete().eq('id', id); fetchTasks();
  };

  // ==========================================
  // 클래스(직업) 관리 로직
  // ==========================================
  const fetchClasses = async () => {
    const { data } = await supabase.from('nexus_classes').select('*').order('id');
    if (data) setClasses(data);
  };
  const handleAddClass = async () => {
    if (!newClass.name.trim() || !newClass.icon.trim()) return;
    await supabase.from('nexus_classes').insert([{ name: newClass.name, icon: newClass.icon, is_active: true }]);
    setNewClass({ icon: "👤", name: "" });
    fetchClasses();
  };
  const saveEditingClass = async () => {
    await supabase.from('nexus_classes').update({ name: editClassForm.name, icon: editClassForm.icon, is_active: editClassForm.is_active }).eq('id', editingClassId);
    setEditingClassId(null); fetchClasses();
  };
  const deleteClass = async (id: number) => {
    if (!confirm(`클래스를 삭제하시겠습니까?`)) return;
    await supabase.from('nexus_classes').delete().eq('id', id); fetchClasses();
  };

  if (!mounted || !user) return null;

  return (
    <main className="min-h-screen bg-[#1c1c1e] text-[#d4d4d8] font-sans pb-20 pt-8">
      <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-8">
        
        <div className="flex items-center gap-4 border-b border-zinc-800 pb-6">
          <div className="text-4xl">⚙️</div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#e6c788]">넥서스 커맨드 센터</h1>
            <p className="text-sm text-zinc-400 mt-1">성역 길드의 모든 데이터를 실시간으로 제어합니다.</p>
          </div>
        </div>

        <div className="flex overflow-x-auto custom-scrollbar border-b border-zinc-800 gap-1 pb-[-1px]">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-bold transition-all whitespace-nowrap rounded-t-lg border-b-2 ${
                activeTab === tab.id ? "border-[#e6c788] text-[#e6c788] bg-yellow-900/10" : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-[#252528] border border-zinc-700/50 rounded-xl p-6 shadow-xl min-h-[400px]">
          
          {/* 🚨 긴급 배너 */}
          {activeTab === "banner" && (
            <div className="space-y-6 max-w-3xl">
              <h2 className="text-lg font-bold text-white">🚨 긴급 공지 배너 제어</h2>
              <div className="bg-[#1c1c1e] border border-zinc-700 p-5 rounded-lg space-y-4">
                <label className="block text-xs font-bold text-zinc-400">새로운 배너 메시지 입력</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" value={bannerInput} onChange={(e) => setBannerInput(e.target.value)}
                    placeholder="예: 오늘 오후 8시 필드보스 레이드 집결!" 
                    className="flex-1 bg-[#121212] border border-zinc-600 rounded p-3 text-sm text-white focus:border-red-500 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleBroadcastBanner()}
                  />
                  <button onClick={handleBroadcastBanner} disabled={isSubmitting} className="bg-red-600 hover:bg-red-500 text-white font-black px-6 py-3 rounded text-sm transition-colors">
                    {isSubmitting ? "송출 중..." : "송출하기"}
                  </button>
                </div>
              </div>
              {activeBanner && (
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-5 flex justify-between items-center gap-4">
                  <div>
                    <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded mr-2">현재 송출 중</span>
                    <span className="text-sm font-bold text-red-200">{activeBanner.message}</span>
                  </div>
                  <button onClick={handleTurnOffBanner} className="text-xs bg-[#1c1c1e] text-zinc-400 border border-zinc-700 hover:text-white px-4 py-2 rounded transition">배너 종료</button>
                </div>
              )}
            </div>
          )}

          {/* ⚔️ 레이드/어비스 */}
          {activeTab === "contents" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-white">⚔️ 레이드 / 어비스 리스트 관리</h2>
                <span className="text-xs text-zinc-400">목록에서 직접 수정 및 삭제가 가능합니다.</span>
              </div>
              <div className="space-y-2">
                {contents.map(item => (
                  <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${item.is_active ? 'bg-[#1c1c1e] border-zinc-700' : 'bg-zinc-900 border-zinc-800/80 opacity-60'}`}>
                    {editingId === item.id ? (
                      <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
                        <select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})} className="bg-[#121212] border border-zinc-600 rounded p-1.5 text-sm text-white w-full sm:w-28 outline-none"><option value="abyss">어비스</option><option value="raid">레이드</option></select>
                        <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="flex-1 bg-[#121212] border border-zinc-600 rounded p-1.5 text-sm text-white outline-none w-full" />
                        <label className="flex items-center gap-1 text-xs text-zinc-300"><input type="checkbox" checked={editForm.is_weekend} onChange={e => setEditForm({...editForm, is_weekend: e.target.checked})} className="accent-amber-500" /> 주말</label>
                        <label className="flex items-center gap-1 text-xs text-emerald-400"><input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm({...editForm, is_active: e.target.checked})} className="accent-emerald-500" /> 활성화</label>
                        <div className="flex gap-2">
                          <button onClick={saveEditingContent} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded font-bold">저장</button>
                          <button onClick={() => setEditingId(null)} className="text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1.5 rounded">취소</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-xl flex-shrink-0 w-8 text-center">{item.type === 'abyss' ? '🌌' : '🐉'}</span>
                        <div className="flex-1 flex items-center gap-3 overflow-hidden">
                          <span className={`font-bold text-sm truncate ${item.is_active ? 'text-zinc-200' : 'text-zinc-500 line-through'}`}>{item.name}</span>
                          {item.is_weekend && <span className="text-[10px] text-amber-500 font-bold bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-800/30">주말</span>}
                          {!item.is_active && <span className="text-[10px] text-red-400 font-bold bg-red-900/20 px-1.5 py-0.5 rounded border border-red-800/30">비활성화됨</span>}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => { setEditingId(item.id); setEditForm({...item}); }} className="text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 px-3 py-1.5 rounded">수정</button>
                          <button onClick={() => deleteContent(item.id, item.name)} className="text-xs text-red-400 hover:text-white bg-red-950/40 border border-red-900/50 px-3 py-1.5 rounded">삭제</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row items-center gap-3 p-3 mt-4 rounded-lg bg-yellow-900/10 border border-yellow-700/50 border-dashed">
                  <select value={newContent.type} onChange={e => setNewContent({...newContent, type: e.target.value})} className="bg-[#121212] border border-yellow-700/50 rounded p-1.5 text-sm text-[#e6c788] outline-none"><option value="abyss">어비스</option><option value="raid">레이드</option></select>
                  <input type="text" placeholder="새로운 던전/레이드 이름" value={newContent.name} onChange={e => setNewContent({...newContent, name: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleAddContent()} className="flex-1 bg-[#1c1c1e] border border-yellow-700/50 focus:border-yellow-500 rounded p-1.5 text-sm text-white outline-none w-full" />
                  <label className="flex items-center gap-1 text-xs text-amber-400"><input type="checkbox" checked={newContent.is_weekend} onChange={e => setNewContent({...newContent, is_weekend: e.target.checked})} className="accent-amber-500" /> 주말</label>
                  <button onClick={handleAddContent} className="text-xs bg-[#e6c788] hover:bg-yellow-500 text-[#121212] font-black px-4 py-1.5 rounded">+ 추가</button>
                </div>
              </div>
            </div>
          )}

          {/* 🟢 캐릭터 관리 (숙제 및 직업) */}
          {activeTab === "character" && (
            <div className="space-y-10">
              
              {/* 숙제 관리 섹션 */}
              <section>
                <div className="flex justify-between items-center border-b border-zinc-700 pb-3 mb-4">
                  <h3 className="text-lg font-bold text-white">📋 숙제 목록 관리</h3>
                </div>
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${task.is_active ? 'bg-[#1c1c1e] border-zinc-700' : 'bg-zinc-900 border-zinc-800/80 opacity-60'}`}>
                      {editingTaskId === task.id ? (
                        <div className="flex-1 flex items-center gap-3">
                          <select value={editTaskForm.type} onChange={e => setEditTaskForm({...editTaskForm, type: e.target.value})} className="bg-[#121212] border border-zinc-600 rounded p-1.5 text-sm text-white outline-none">
                            <option value="daily">일일</option><option value="weekly">주간</option><option value="repeat">반복</option>
                          </select>
                          <input type="text" value={editTaskForm.name} onChange={e => setEditTaskForm({...editTaskForm, name: e.target.value})} className="flex-1 bg-[#121212] border border-zinc-600 rounded p-1.5 text-sm text-white outline-none" />
                          {editTaskForm.type === 'repeat' && (
                            <input type="number" min="1" value={editTaskForm.max_count} onChange={e => setEditTaskForm({...editTaskForm, max_count: parseInt(e.target.value)})} className="w-16 bg-[#121212] border border-zinc-600 rounded p-1.5 text-sm text-white outline-none" placeholder="횟수" />
                          )}
                          <label className="flex items-center gap-1 text-xs text-emerald-400"><input type="checkbox" checked={editTaskForm.is_active} onChange={e => setEditTaskForm({...editTaskForm, is_active: e.target.checked})} className="accent-emerald-500" /> 활성화</label>
                          <button onClick={saveEditingTask} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded font-bold">저장</button>
                          <button onClick={() => setEditingTaskId(null)} className="text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1.5 rounded">취소</button>
                        </div>
                      ) : (
                        <>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${task.type === 'daily' ? 'bg-amber-900/20 text-amber-500 border-amber-800/50' : task.type === 'weekly' ? 'bg-blue-900/20 text-blue-400 border-blue-800/50' : 'bg-purple-900/20 text-purple-400 border-purple-800/50'}`}>
                            {task.type === 'daily' ? '일일' : task.type === 'weekly' ? '주간' : '반복'}
                          </span>
                          <span className={`font-bold text-sm flex-1 ${task.is_active ? 'text-zinc-200' : 'text-zinc-500 line-through'}`}>{task.name}</span>
                          {task.type === 'repeat' && <span className="text-[10px] text-zinc-400 font-mono">Max: {task.max_count}회</span>}
                          {!task.is_active && <span className="text-[10px] text-red-400 font-bold bg-red-900/20 px-1.5 py-0.5 rounded border border-red-800/30">비활성화</span>}
                          <button onClick={() => { setEditingTaskId(task.id); setEditTaskForm({...task}); }} className="text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 px-3 py-1.5 rounded">수정</button>
                          <button onClick={() => deleteTask(task.id)} className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 px-3 py-1.5 rounded">삭제</button>
                        </>
                      )}
                    </div>
                  ))}
                  
                  {/* 신규 숙제 추가 */}
                  <div className="flex items-center gap-3 p-3 mt-4 rounded-lg bg-yellow-900/10 border border-yellow-700/50 border-dashed">
                    <select value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value})} className="bg-[#121212] border border-yellow-700/50 rounded p-1.5 text-sm text-[#e6c788] outline-none">
                      <option value="daily">일일 숙제</option><option value="weekly">주간 숙제</option><option value="repeat">반복 숙제</option>
                    </select>
                    <input type="text" placeholder="새로운 숙제명" value={newTask.name} onChange={e => setNewTask({...newTask, name: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleAddTask()} className="flex-1 bg-[#1c1c1e] border border-yellow-700/50 focus:border-yellow-500 rounded p-1.5 text-sm text-white outline-none" />
                    {newTask.type === 'repeat' && (
                      <input type="number" min="1" value={newTask.max_count} onChange={e => setNewTask({...newTask, max_count: parseInt(e.target.value)})} className="w-16 bg-[#1c1c1e] border border-yellow-700/50 rounded p-1.5 text-sm text-white outline-none" placeholder="최대" />
                    )}
                    <button onClick={handleAddTask} className="text-xs bg-[#e6c788] hover:bg-yellow-500 text-[#121212] font-black px-4 py-1.5 rounded">+ 추가</button>
                  </div>
                </div>
              </section>

              {/* 직업 관리 섹션 */}
              <section>
                <div className="flex justify-between items-center border-b border-zinc-700 pb-3 mb-4">
                  <h3 className="text-lg font-bold text-white">🪖 직업(클래스) 목록 관리</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {classes.map(cls => (
                    <div key={cls.id} className={`flex items-center gap-2 p-2 rounded-lg border ${cls.is_active ? 'bg-[#1c1c1e] border-zinc-700' : 'bg-zinc-900 border-zinc-800/80 opacity-50'}`}>
                      {editingClassId === cls.id ? (
                        <div className="flex flex-col gap-2 w-full">
                          <div className="flex gap-1">
                            <input type="text" value={editClassForm.icon} onChange={e => setEditClassForm({...editClassForm, icon: e.target.value})} className="w-10 bg-[#121212] border border-zinc-600 rounded p-1 text-center outline-none" />
                            <input type="text" value={editClassForm.name} onChange={e => setEditClassForm({...editClassForm, name: e.target.value})} className="flex-1 bg-[#121212] border border-zinc-600 rounded p-1 text-sm text-white outline-none" />
                          </div>
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] text-emerald-400 flex items-center gap-1"><input type="checkbox" checked={editClassForm.is_active} onChange={e => setEditClassForm({...editClassForm, is_active: e.target.checked})} /> 활성</label>
                            <div className="flex gap-1">
                              <button onClick={saveEditingClass} className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded">V</button>
                              <button onClick={() => setEditingClassId(null)} className="text-[10px] bg-zinc-700 text-white px-2 py-1 rounded">X</button>
                            </div>
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
                  
                  {/* 신규 직업 추가 박스 */}
                  <div className="flex flex-col gap-2 p-2 rounded-lg bg-yellow-900/10 border border-yellow-700/50 border-dashed justify-center">
                    <div className="flex gap-1">
                      <input type="text" placeholder="이모지" value={newClass.icon} onChange={e => setNewClass({...newClass, icon: e.target.value})} className="w-12 bg-[#121212] border border-yellow-700/50 rounded p-1 text-center text-sm outline-none" />
                      <input type="text" placeholder="직업명" value={newClass.name} onChange={e => setNewClass({...newClass, name: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleAddClass()} className="flex-1 bg-[#1c1c1e] border border-yellow-700/50 rounded p-1 text-sm text-white outline-none" />
                    </div>
                    <button onClick={handleAddClass} className="text-[10px] bg-[#e6c788] hover:bg-yellow-500 text-[#121212] font-black py-1.5 rounded w-full">+ 직업 추가</button>
                  </div>
                </div>
              </section>

            </div>
          )}

          {["trades", "purchases"].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500 space-y-3">
              <span className="text-4xl">🛠️</span><p className="text-sm font-medium">물물교환 및 상점 기능 준비중입니다.</p>
            </div>
          )}

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
      `}} />
    </main>
  );
}