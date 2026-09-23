"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import MarkIcon from "@/components/common/MarkIcon";

export interface NexusContent {
  id: number;
  type: string;
  name: string;
  short_name: string | null;
  mobile_name: string | null;
  duration_minutes: number;
  max_count: number;
  is_weekend: boolean;
  is_active: boolean;
}

export interface ContentPowerReq {
  id: number;
  content_id: number;
  content_type: string;
  content_name: string; 
  difficulty: string;
  min_cp: number;
  rec_cp: number;
  op_cp: number;
  rec_mr: number;
  op_mr: number;
}

export default function ContentAdminTab() {
  const [contents, setContents] = useState<NexusContent[]>([]);
  const [powerReqs, setPowerReqs] = useState<ContentPowerReq[]>([]);
  
  const [selectedContentId, setSelectedContentId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"abyss" | "raid">("abyss");
  const [loading, setLoading] = useState(false);

  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);

  const [cForm, setCForm] = useState<Partial<NexusContent>>({
    type: "abyss", duration_minutes: 15, max_count: 1, is_weekend: false, is_active: true
  });

  const [dForm, setDForm] = useState<Partial<ContentPowerReq>>({
    difficulty: "어려움", min_cp: 0, rec_cp: 0, op_cp: 0, rec_mr: 0, op_mr: 0
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: cData, error: cErr } = await supabase.from("nexus_contents").select("*").order("id", { ascending: true });
      const { data: pData, error: pErr } = await supabase.from("content_power_reqs").select("*").order("id", { ascending: true });
      
      if (cErr) throw cErr;
      if (pErr) throw pErr;

      setContents(cData || []);
      setPowerReqs(pData || []);
      
      if (cData && cData.length > 0) {
        const defaultItem = cData.find(c => c.type === activeTab) || cData[0];
        if (defaultItem && !selectedContentId) {
          setSelectedContentId(defaultItem.id);
        }
      }
    } catch (error) {
      console.error("컨텐츠 및 스탯 컷 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedContentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (tab: "abyss" | "raid") => {
    setActiveTab(tab);
    setCForm((prev) => ({ ...prev, type: tab }));
    const firstInTab = contents.find((c) => c.type === tab);
    if (firstInTab) {
      setSelectedContentId(firstInTab.id);
    } else {
      setSelectedContentId(null);
    }
  };

  const openNewContentModal = () => {
    setCForm({ type: activeTab, name: "", short_name: "", duration_minutes: 15, max_count: 1, is_weekend: false, is_active: true });
    setIsContentModalOpen(true);
  };

  const openEditContentModal = (content: NexusContent) => {
    setCForm(content);
    setIsContentModalOpen(true);
  };

  const handleSaveContent = async () => {
    if (!cForm.name) return alert("컨텐츠 명칭을 입력해주세요.");
    
    const payload = {
      ...cForm,
      type: cForm.type || activeTab
    };

    try {
      if (cForm.id) {
        await supabase.from("nexus_contents").update(payload).eq("id", cForm.id);
      } else {
        await supabase.from("nexus_contents").insert([payload]);
      }
      setIsContentModalOpen(false);
      fetchData();
    } catch (e: any) {
      alert("컨텐츠 저장 실패: " + e.message);
    }
  };

  const handleDeleteContent = async (id: number) => {
    if (!confirm("이 컨텐츠를 삭제하시겠습니까? 연결된 스탯 컷 데이터도 함께 삭제됩니다.")) return;
    await supabase.from("nexus_contents").delete().eq("id", id);
    if (selectedContentId === id) setSelectedContentId(null);
    fetchData();
  };

  const openNewReqModal = () => {
    if (!selectedContentId) return alert("먼저 좌측에서 컨텐츠를 선택해주세요.");
    setDForm({ difficulty: "어려움", min_cp: 0, rec_cp: 0, op_cp: 0, rec_mr: 0, op_mr: 0 });
    setIsReqModalOpen(true);
  };

  const openEditReqModal = (req: ContentPowerReq) => {
    setDForm(req);
    setIsReqModalOpen(true);
  };

  const handleSavePowerReq = async () => {
    const selectedContent = contents.find(c => c.id === selectedContentId);
    if (!selectedContentId || !selectedContent) return alert("먼저 좌측에서 컨텐츠를 선택해주세요.");
    if (!dForm.difficulty) return alert("난이도 명칭을 입력해주세요.");

    try {
      const payload = { 
        ...dForm, 
        content_id: selectedContentId,
        content_type: selectedContent.type,
        content_name: selectedContent.name 
      };

      if (dForm.id) {
        await supabase.from("content_power_reqs").update(payload).eq("id", dForm.id);
      } else {
        await supabase.from("content_power_reqs").upsert([payload], { onConflict: "content_id,difficulty" });
      }
      setIsReqModalOpen(false);
      fetchData();
    } catch (e: any) {
      alert("스탯 컷 저장 실패: " + e.message);
    }
  };

  const handleDeletePowerReq = async (id: number) => {
    if (!confirm("해당 난이도의 스탯 컷 설정을 삭제하시겠습니까?")) return;
    await supabase.from("content_power_reqs").delete().eq("id", id);
    fetchData();
  };

  const filteredContents = contents.filter(c => c.type === activeTab);
  const selectedContent = contents.find(c => c.id === selectedContentId);
  const currentReqs = powerReqs.filter(r => r.content_id === selectedContentId || (r.content_name === selectedContent?.name));

  return (
    <div className="space-y-5">
      <div className="border-b border-[var(--panel-border)] pb-3 flex justify-between items-end">
        <div>
          <h2 className="text-lg font-black text-[var(--accent)] flex items-center gap-2">
            <MarkIcon src="/svgs/contens mark/레이드 마크.svg" size="sm" colorClass="bg-[var(--accent)]" />
            <span>어비스 / 레이드 관리</span>
          </h2>
          <p className="text-xs text-[var(--text-sub)] font-medium mt-0.5">
            마스터 컨텐츠(`nexus_contents`) 등록과 난이도별 요구 전투력/마도저항 컷(`content_power_reqs`)을 한눈에 제어합니다.
          </p>
        </div>
        <button 
          onClick={fetchData} 
          className="text-xs font-bold bg-[var(--inner-box)] hover:bg-[var(--panel-border)] px-3 py-1.5 rounded-lg text-[var(--text-main)] transition cursor-pointer border border-[var(--panel-border)] flex items-center gap-1.5 shrink-0"
        >
          🔄 동기화
        </button>
      </div>

      {loading && <div className="text-center text-xs text-[var(--accent)] font-bold animate-pulse py-1">⏳ 데이터 수집 중...</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 좌측 패널: 마스터 컨텐츠 목록 */}
        <div className="lg:col-span-5 bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-2xl p-4 flex flex-col min-h-[620px]">
          
          <div className="flex gap-2 p-1.5 bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl mb-3 shrink-0">
            <button
              type="button"
              onClick={() => handleTabChange("abyss")}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "abyss"
                  ? "bg-teal-500/20 text-teal-400 border border-teal-500/40 shadow-sm"
                  : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              <MarkIcon src="/svgs/contens mark/어비스 마크.svg" size="xs" colorClass={activeTab === "abyss" ? "bg-teal-400" : "bg-[var(--text-sub)]"} />
              <span>어비스 ({contents.filter(c => c.type === "abyss").length})</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("raid")}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "raid"
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-sm"
                  : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              <MarkIcon src="/svgs/contens mark/레이드 마크.svg" size="xs" colorClass={activeTab === "raid" ? "bg-indigo-400" : "bg-[var(--text-sub)]"} />
              <span>레이드 ({contents.filter(c => c.type === "raid").length})</span>
            </button>
          </div>

          <div className="mb-3 shrink-0">
            <button
              onClick={openNewContentModal}
              className="w-full py-2 bg-[var(--panel)] hover:bg-[var(--panel-border)] text-[var(--accent)] border border-[var(--accent)]/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>+ 신규 마스터 컨텐츠 추가</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredContents.length === 0 ? (
              <div className="text-center text-xs text-[var(--text-sub)] font-bold py-16">
                등록된 {activeTab === "abyss" ? "어비스" : "레이드"} 컨텐츠가 없습니다.
              </div>
            ) : (
              filteredContents.map(c => {
                const isSelected = selectedContentId === c.id;
                return (
                  <div 
                    key={c.id} 
                    onClick={() => setSelectedContentId(c.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected 
                        ? "bg-[var(--accent-soft)] border-[var(--accent)] shadow-sm" 
                        : "bg-[var(--panel)] border-[var(--panel-border)] hover:border-[var(--accent)]/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MarkIcon
                          src={c.type === 'raid' ? "/svgs/contens mark/레이드 마크.svg" : "/svgs/contens mark/어비스 마크.svg"}
                          size="sm"
                          colorClass={isSelected ? "bg-[var(--accent)]" : c.type === "raid" ? "bg-indigo-400" : "bg-teal-400"}
                        />
                        <span className="min-w-0 text-sm font-black text-[var(--text-main)] break-words [overflow-wrap:anywhere]">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEditContentModal(c); }}
                          className="text-xs font-bold text-[var(--text-sub)] hover:text-[var(--text-main)] bg-[var(--inner-box)] px-2 py-0.5 rounded-md transition cursor-pointer"
                        >
                          수정
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteContent(c.id); }}
                          className="text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded-md transition cursor-pointer"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-[var(--text-sub)] flex flex-wrap items-center gap-2 font-bold">
                      {c.short_name && <span className="bg-[var(--inner-box)] px-1.5 py-0.5 rounded text-[var(--text-main)]">약칭: {c.short_name}</span>}
                      <span>⏱️ 소요시간: {c.duration_minutes}분</span>
                      {c.is_weekend && <span className="text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">주말전용</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 우측 패널: 스탯 컷 관리 */}
        <div className="lg:col-span-7 bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-2xl p-4 flex flex-col min-h-[620px]">
          {!selectedContent ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-sub)] text-xs font-bold">
              <span className="text-3xl mb-2">👈</span>
              좌측 목록에서 컨텐츠를 선택하시면 난이도별 스탯 컷을 제어할 수 있습니다.
            </div>
          ) : (
            <>
              <div className="mb-3 shrink-0 border-b border-[var(--panel-border)] pb-2.5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-[var(--accent)] flex items-center gap-2">
                    <MarkIcon src="/svgs/status mark/전투력 마크.svg" size="sm" colorClass="bg-[var(--accent)]" />
                    <span>난이도별 스탯 컷트라인 관리</span>
                  </h3>
                  <p className="text-xs text-[var(--text-sub)] font-bold mt-0.5">
                    선택된 타겟: <span className="text-[var(--text-main)] bg-[var(--panel)] px-2 py-0.5 rounded-md border border-[var(--panel-border)]">[{selectedContent.name}]</span>
                  </p>
                </div>
                <button
                  onClick={openNewReqModal}
                  className="px-3.5 py-1.5 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs rounded-xl transition cursor-pointer shadow-md"
                >
                  + 신규 컷트라인 추가
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {currentReqs.length === 0 ? (
                  <div className="text-center text-xs text-[var(--text-sub)] font-bold py-16">
                    등록된 난이도 컷트라인이 없습니다. 상단 [+ 신규 컷트라인 추가] 버튼을 눌러 추가해주세요.
                  </div>
                ) : (
                  currentReqs.map(d => (
                    <div key={d.id} className="bg-[var(--panel)] border border-[var(--panel-border)] p-3.5 rounded-2xl space-y-3 shadow-xs">
                      
                      <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-2">
                        <span className="text-sm font-black text-[var(--accent)] bg-[var(--inner-box)] px-2.5 py-0.5 rounded-lg border border-[var(--panel-border)]">
                          [{d.difficulty}] 난이도
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEditReqModal(d)} className="text-xs font-bold bg-[var(--inner-box)] text-[var(--text-main)] px-2.5 py-1 rounded-lg border border-[var(--panel-border)] cursor-pointer">
                            수정
                          </button>
                          <button onClick={() => handleDeletePowerReq(d.id)} className="text-xs font-bold bg-rose-500/15 text-rose-400 px-2.5 py-1 rounded-lg border border-rose-500/30 cursor-pointer">
                            삭제
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                          <MarkIcon src="/svgs/status mark/전투력 마크.svg" size="xs" colorClass="bg-amber-400" />
                          <span>전투력</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 bg-[var(--inner-box)] p-2.5 rounded-xl border border-[var(--panel-border)] text-center">
                          <div>
                            <div className="text-[10px] text-[var(--text-sub)] font-bold mb-0.5">최소</div>
                            <div className="font-mono text-[var(--text-main)] font-bold text-xs">{d.min_cp ? d.min_cp.toLocaleString() : 0}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-amber-400 font-bold mb-0.5">권장</div>
                            <div className="font-mono text-amber-300 font-bold text-xs">{d.rec_cp ? d.rec_cp.toLocaleString() : 0}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-purple-400 font-bold mb-0.5">압도</div>
                            <div className="font-mono text-purple-300 font-bold text-xs">{d.op_cp ? d.op_cp.toLocaleString() : 0}</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs font-black text-sky-400 flex items-center gap-1.5">
                          <MarkIcon src="/svgs/status mark/마도저항 마크.svg" size="xs" colorClass="bg-sky-400" />
                          <span>마도저항</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 bg-[var(--inner-box)] p-2.5 rounded-xl border border-[var(--panel-border)] text-center">
                          <div>
                            <div className="text-[10px] text-emerald-400 font-bold mb-0.5">경고</div>
                            <div className="font-mono text-emerald-300 font-bold text-xs">{d.rec_mr ? d.rec_mr.toLocaleString() : 0}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-purple-400 font-bold mb-0.5">압도</div>
                            <div className="font-mono text-purple-300 font-bold text-xs">{d.op_mr ? d.op_mr.toLocaleString() : 0}</div>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 모달 팝업 1: 마스터 컨텐츠 */}
      {isContentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-[var(--accent)] border-b border-[var(--panel-border)] pb-2.5">
              {cForm.id ? "✏️ 마스터 컨텐츠 수정" : "✨ 신규 마스터 컨텐츠 추가"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text-sub)] mb-1">분류</label>
                <select 
                  value={cForm.type || activeTab} 
                  onChange={e => setCForm({...cForm, type: e.target.value})}
                  className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs p-2.5 rounded-xl outline-none font-bold text-[var(--text-main)] cursor-pointer"
                >
                  <option value="abyss">어비스</option>
                  <option value="raid">레이드</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-sub)] mb-1">명칭</label>
                <input 
                  type="text" 
                  placeholder="예: 레이드 - 카브락" 
                  value={cForm.name || ""} 
                  onChange={e => setCForm({...cForm, name: e.target.value})}
                  className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs text-[var(--text-main)] p-2.5 rounded-xl outline-none focus:border-[var(--accent)] font-bold placeholder:[var(--text-sub)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-sub)] mb-1">약칭</label>
                <input 
                  type="text" 
                  placeholder="예: 카브" 
                  value={cForm.short_name || ""} 
                  onChange={e => setCForm({...cForm, short_name: e.target.value})}
                  className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs text-[var(--text-main)] p-2.5 rounded-xl outline-none focus:border-[var(--accent)] font-bold placeholder:[var(--text-sub)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-sub)] mb-1">소요시간 (분)</label>
                <input 
                  type="number" 
                  value={cForm.duration_minutes || 0} 
                  onChange={e => setCForm({...cForm, duration_minutes: Number(e.target.value)})}
                  className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs text-[var(--text-main)] p-2.5 rounded-xl outline-none focus:border-[var(--accent)] font-bold"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="text-xs text-[var(--text-sub)] flex items-center gap-2 cursor-pointer font-bold">
                  <input type="checkbox" checked={cForm.is_weekend || false} onChange={e => setCForm({...cForm, is_weekend: e.target.checked})} className="accent-[var(--accent)]" />
                  주말 전용 컨텐츠
                </label>
                <label className="text-xs text-[var(--text-sub)] flex items-center gap-2 cursor-pointer font-bold">
                  <input type="checkbox" checked={cForm.is_active !== false} onChange={e => setCForm({...cForm, is_active: e.target.checked})} className="accent-[var(--accent)]" />
                  파티 모집 활성화
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--panel-border)]">
              <button onClick={() => setIsContentModalOpen(false)} className="px-4 py-2 bg-[var(--inner-box)] text-[var(--text-sub)] rounded-xl text-xs font-bold cursor-pointer">
                취소
              </button>
              <button onClick={handleSaveContent} className="px-5 py-2 bg-[var(--accent)] text-[var(--accent-fg)] font-black rounded-xl text-xs cursor-pointer shadow-md">
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모달 팝업 2: 스탯 컷트라인 */}
      {isReqModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 w-full max-w-lg space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-amber-400 border-b border-[var(--panel-border)] pb-2.5">
              {dForm.id ? "✏️ 스탯 컷트라인 수정" : "✨ 신규 스탯 컷트라인 추가"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text-sub)] mb-1">난이도 명칭</label>
                <input 
                  type="text" 
                  placeholder="예: 입문, 어려움, 매우 어려움, 지옥1" 
                  value={dForm.difficulty || ""} 
                  onChange={e => setDForm({...dForm, difficulty: e.target.value})}
                  className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs text-[var(--text-main)] p-2.5 rounded-xl outline-none focus:border-amber-500 font-bold placeholder:[var(--text-sub)]"
                />
              </div>

              <div className="bg-[var(--inner-box)] p-3 rounded-xl border border-[var(--panel-border)] space-y-2">
                <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                  <MarkIcon src="/svgs/status mark/전투력 마크.svg" size="xs" colorClass="bg-amber-400" />
                  <span>전투력 설정</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-[var(--text-sub)] font-bold mb-1 block">최소 (MIN)</label>
                    <input type="number" value={dForm.min_cp || 0} onChange={e => setDForm({...dForm, min_cp: Number(e.target.value)})} className="w-full bg-[var(--panel)] border border-[var(--panel-border)] text-xs text-[var(--text-main)] p-2 rounded-lg outline-none font-mono font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] text-amber-400 font-bold mb-1 block">권장 (REC)</label>
                    <input type="number" value={dForm.rec_cp || 0} onChange={e => setDForm({...dForm, rec_cp: Number(e.target.value)})} className="w-full bg-[var(--panel)] border border-amber-500/30 text-xs text-amber-300 font-mono font-bold p-2 rounded-lg outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-purple-400 font-bold mb-1 block">압도 (OP)</label>
                    <input type="number" value={dForm.op_cp || 0} onChange={e => setDForm({...dForm, op_cp: Number(e.target.value)})} className="w-full bg-[var(--panel)] border border-purple-500/30 text-xs text-purple-300 font-mono font-bold p-2 rounded-lg outline-none" />
                  </div>
                </div>
              </div>

              <div className="bg-[var(--inner-box)] p-3 rounded-xl border border-[var(--panel-border)] space-y-2">
                <div className="text-xs font-black text-sky-400 flex items-center gap-1.5">
                  <MarkIcon src="/svgs/status mark/마도저항 마크.svg" size="xs" colorClass="bg-sky-400" />
                  <span>마도저항 설정</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-emerald-400 font-bold mb-1 block">경고 (WARN)</label>
                    <input type="number" value={dForm.rec_mr || 0} onChange={e => setDForm({...dForm, rec_mr: Number(e.target.value)})} className="w-full bg-[var(--panel)] border border-emerald-500/30 text-xs text-emerald-300 font-mono font-bold p-2 rounded-lg outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-purple-400 font-bold mb-1 block">압도 (OP)</label>
                    <input type="number" value={dForm.op_mr || 0} onChange={e => setDForm({...dForm, op_mr: Number(e.target.value)})} className="w-full bg-[var(--panel)] border border-purple-500/30 text-xs text-purple-300 font-mono font-bold p-2 rounded-lg outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--panel-border)]">
              <button onClick={() => setIsReqModalOpen(false)} className="px-4 py-2 bg-[var(--inner-box)] text-[var(--text-sub)] rounded-xl text-xs font-bold cursor-pointer">취소</button>
              <button onClick={handleSavePowerReq} className="px-5 py-2 bg-[var(--accent)] text-[var(--accent-fg)] font-black rounded-xl text-xs cursor-pointer shadow-md">저장 / 업데이트</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
