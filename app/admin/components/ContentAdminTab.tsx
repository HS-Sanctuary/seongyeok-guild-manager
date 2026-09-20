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

  // 모달 상태 관리
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);

  // 폼 상태 - 마스터 컨텐츠
  const [cForm, setCForm] = useState<Partial<NexusContent>>({
    type: "abyss", duration_minutes: 15, max_count: 1, is_weekend: false, is_active: true
  });

  // 폼 상태 - 전투력/마도저항 스탯 컷
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

  // --- 마스터 컨텐츠 CRUD ---
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

  // --- 스탯 컷 디테일 CRUD ---
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
        await supabase.from("content_power_reqs").upsert(
          [payload], 
          { onConflict: "content_id,difficulty" }
        );
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
  
  const currentReqs = powerReqs.filter(r => 
    r.content_id === selectedContentId || (r.content_name === selectedContent?.name)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 헤더 (전역 테마 마크 연동) */}
      <div className="border-b border-zinc-800 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-[var(--accent,#e6c788)] flex items-center gap-2.5">
            <MarkIcon
              src="/svgs/contens mark/레이드 마크.svg"
              size="md"
              colorClass="bg-[var(--accent,#e6c788)]"
            />
            <span>어비스/레이드 관리</span>
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            마스터 컨텐츠(`nexus_contents`) 등록과 난이도별 요구 전투력/마도저항 컷(`content_power_reqs`)을 한눈에 제어합니다.
          </p>
        </div>
        <button 
          onClick={fetchData} 
          className="text-xs font-bold bg-zinc-800 hover:bg-zinc-700 px-3.5 py-2 rounded-lg text-zinc-200 transition cursor-pointer border border-zinc-700 flex items-center gap-1.5 shrink-0"
        >
          🔄 동기화
        </button>
      </div>

      {loading && <div className="text-center text-xs text-amber-400 font-bold animate-pulse py-2">⏳ 데이터 수집 중...</div>}

      {/* 메인 2열 그리드 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 좌측 패널: 어비스 / 레이드 탭 버튼 및 마스터 컨텐츠 목록 */}
        <div className="lg:col-span-5 xl:col-span-5 bg-[var(--bg-main,#121212)] border border-zinc-800 rounded-2xl p-4 md:p-5 flex flex-col min-h-[680px]">
          
          {/* 2종 세그먼트 버튼 */}
          <div className="flex gap-2 p-1.5 bg-[var(--panel,#1c1c1e)] border border-zinc-800 rounded-xl mb-4 shrink-0">
            <button
              type="button"
              onClick={() => handleTabChange("abyss")}
              className={`flex-1 py-2.5 text-xs md:text-sm font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "abyss"
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/50 shadow-md"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <MarkIcon
                src="/svgs/contens mark/어비스 마크.svg"
                size="xs"
                colorClass={activeTab === "abyss" ? "bg-teal-300" : "bg-zinc-500"}
              />
              <span>어비스 ({contents.filter(c => c.type === "abyss").length})</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("raid")}
              className={`flex-1 py-2.5 text-xs md:text-sm font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "raid"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-md"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <MarkIcon
                src="/svgs/contens mark/레이드 마크.svg"
                size="xs"
                colorClass={activeTab === "raid" ? "bg-indigo-300" : "bg-zinc-500"}
              />
              <span>레이드 ({contents.filter(c => c.type === "raid").length})</span>
            </button>
          </div>

          {/* 신규 마스터 컨텐츠 추가 버튼 */}
          <div className="mb-3 shrink-0">
            <button
              onClick={openNewContentModal}
              className="w-full py-2.5 bg-zinc-800/80 hover:bg-zinc-700 text-[var(--accent,#e6c788)] border border-[var(--accent,#e6c788)]/30 hover:border-[var(--accent,#e6c788)] rounded-xl text-xs md:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>+ 신규 마스터 컨텐츠 추가</span>
            </button>
          </div>

          {/* 마스터 컨텐츠 피드 카드 리스트 */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {filteredContents.length === 0 ? (
              <div className="text-center text-xs text-zinc-500 py-16">
                등록된 {activeTab === "abyss" ? "어비스" : "레이드"} 컨텐츠가 없습니다.
              </div>
            ) : (
              filteredContents.map(c => {
                const isSelected = selectedContentId === c.id;
                return (
                  <div 
                    key={c.id} 
                    onClick={() => setSelectedContentId(c.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected 
                        ? "bg-[var(--accent,#e6c788)]/10 border-[var(--accent,#e6c788)] shadow-md shadow-[var(--accent,#e6c788)]/5" 
                        : "bg-[var(--panel,#1c1c1e)] border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* 기존 MarkIcon 컴포넌트 스펙 그대로 바인딩 */}
                        <MarkIcon
                          src={c.type === 'raid' ? "/svgs/contens mark/레이드 마크.svg" : "/svgs/contens mark/어비스 마크.svg"}
                          size="sm"
                          colorClass={
                            isSelected
                              ? "bg-[var(--accent,#e6c788)]"
                              : c.type === "raid"
                              ? "bg-indigo-400"
                              : "bg-teal-400"
                          }
                        />
                        <span className="text-sm md:text-base font-bold text-white break-all">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEditContentModal(c); }}
                          className="text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-md transition cursor-pointer"
                        >
                          수정
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteContent(c.id); }}
                          className="text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 px-2.5 py-1 rounded-md transition cursor-pointer"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-2 font-medium">
                      {c.short_name && <span className="bg-zinc-800/90 px-2 py-0.5 rounded text-zinc-300">약칭: {c.short_name}</span>}
                      <span>⏱️ 소요시간: {c.duration_minutes}분</span>
                      {c.is_weekend && <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">주말전용</span>}
                      {!c.is_active && <span className="text-rose-400 font-bold">비활성</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 우측 패널: 선택된 컨텐츠의 난이도별 스탯 컷 상세 제어 */}
        <div className="lg:col-span-7 xl:col-span-7 bg-[var(--bg-main,#121212)] border border-zinc-800 rounded-2xl p-4 md:p-5 flex flex-col min-h-[680px]">
          {!selectedContent ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-sm">
              <span className="text-4xl mb-3">👈</span>
              좌측 목록에서 컨텐츠를 선택하시면 난이도별 스탯 컷을 제어할 수 있습니다.
            </div>
          ) : (
            <>
              {/* 스탯 컷 제어 타겟 표시 & 신규 추가 버튼 */}
              <div className="mb-4 shrink-0 border-b border-zinc-800 pb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm md:text-base font-black text-[var(--accent,#e6c788)] flex items-center gap-2">
                    <MarkIcon
                      src="/svgs/status mark/전투력 마크.svg"
                      size="sm"
                      colorClass="bg-[var(--accent,#e6c788)]"
                    />
                    <span>난이도별 스탯 컷트라인 관리 (전투력 / 마도저항)</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    선택된 타겟: <span className="text-white font-bold bg-zinc-800 px-2 py-0.5 rounded-md ml-1 border border-zinc-700">[{selectedContent.name}]</span>
                  </p>
                </div>
                <button
                  onClick={openNewReqModal}
                  className="px-3.5 py-2 bg-[var(--accent,#e6c788)] hover:brightness-110 text-black font-black text-xs md:text-sm rounded-xl transition cursor-pointer shadow-md"
                >
                  + 신규 컷트라인 추가
                </button>
              </div>

              {/* 초록 영역 스탯 컷 레이아웃 */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                {currentReqs.length === 0 ? (
                  <div className="text-center text-xs md:text-sm text-zinc-500 py-16">
                    등록된 난이도 컷트라인이 없습니다. 상단 [+ 신규 컷트라인 추가] 버튼을 눌러 추가해주세요.
                  </div>
                ) : (
                  currentReqs.map(d => (
                    <div key={d.id} className="bg-[var(--panel,#1c1c1e)] border border-zinc-800 p-4 md:p-5 rounded-2xl transition hover:border-zinc-700 space-y-4 shadow-sm">
                      
                      {/* [난이도] 헤더 및 수정/삭제 버튼 */}
                      <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base md:text-lg font-black text-[var(--accent,#e6c788)] bg-zinc-800/80 px-3 py-1 rounded-xl border border-zinc-700/80 shadow-sm">
                            [{d.difficulty}] 난이도
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => openEditReqModal(d)} 
                            className="text-xs font-bold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded-lg text-zinc-200 cursor-pointer transition"
                          >
                            수정
                          </button>
                          <button 
                            onClick={() => handleDeletePowerReq(d.id)} 
                            className="text-xs font-bold bg-rose-950/60 hover:bg-rose-900 border border-rose-800/50 px-3 py-1.5 rounded-lg text-rose-400 cursor-pointer transition"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                      
                      {/* 전투력 섹션 */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                          <MarkIcon src="/svgs/status mark/전투력 마크.svg" size="xs" colorClass="bg-amber-400" />
                          <span>전투력</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 bg-[var(--bg-main,#121212)] p-3 rounded-xl border border-zinc-800 text-center">
                          <div>
                            <div className="text-[11px] text-zinc-400 font-bold mb-1">최소</div>
                            <div className="font-mono text-zinc-200 font-bold text-xs md:text-sm">{d.min_cp ? d.min_cp.toLocaleString() : 0}</div>
                          </div>
                          <div>
                            <div className="text-[11px] text-amber-400 font-bold mb-1">권장</div>
                            <div className="font-mono text-amber-300 font-bold text-xs md:text-sm">{d.rec_cp ? d.rec_cp.toLocaleString() : 0}</div>
                          </div>
                          <div>
                            <div className="text-[11px] text-purple-400 font-bold mb-1">압도</div>
                            <div className="font-mono text-purple-300 font-bold text-xs md:text-sm">{d.op_cp ? d.op_cp.toLocaleString() : 0}</div>
                          </div>
                        </div>
                      </div>

                      {/* 마도저항 섹션 */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-black text-sky-400 flex items-center gap-1.5">
                          <MarkIcon src="/svgs/status mark/마도저항 마크.svg" size="xs" colorClass="bg-sky-400" />
                          <span>마도저항</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 bg-[var(--bg-main,#121212)] p-3 rounded-xl border border-zinc-800 text-center">
                          <div>
                            <div className="text-[11px] text-zinc-400 font-bold mb-1">최소</div>
                            <div className="font-mono text-zinc-200 font-bold text-xs md:text-sm">-</div>
                          </div>
                          <div>
                            <div className="text-[11px] text-amber-400 font-bold mb-1">권장</div>
                            <div className="font-mono text-amber-300 font-bold text-xs md:text-sm">{d.rec_mr ? d.rec_mr.toLocaleString() : 0}</div>
                          </div>
                          <div>
                            <div className="text-[11px] text-purple-400 font-bold mb-1">압도</div>
                            <div className="font-mono text-purple-300 font-bold text-xs md:text-sm">{d.op_mr ? d.op_mr.toLocaleString() : 0}</div>
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

      {/* 하단 유효 시스템 및 적용 기능 안내 바 */}
      <div className="bg-[var(--panel,#1c1c1e)] border border-zinc-800 rounded-2xl p-4 md:p-5 space-y-2 shadow-md">
        <h4 className="text-xs md:text-sm font-bold text-[var(--accent,#e6c788)] flex items-center gap-2">
          💡 적용되는 기능 :
        </h4>
        <ol className="list-decimal list-inside text-xs md:text-sm text-zinc-300 space-y-1 font-medium pl-1">
          <li>생텀 메인페이지 크로노스 체크 보드</li>
          <li>크로노스 어비스/레이드 체크 리스트</li>
          <li>시낙시스 파티 매칭 전투력 및 마도저항 시스템</li>
        </ol>
      </div>

      {/* ----------------- 모달 팝업 1: 마스터 컨텐츠 추가/수정 ----------------- */}
      {isContentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--panel,#1c1c1e)] border border-zinc-700 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-scale-up">
            <h3 className="text-base font-black text-[var(--accent,#e6c788)] border-b border-zinc-800 pb-3 flex items-center gap-2">
              <span>{cForm.id ? "✏️ 마스터 컨텐츠 수정" : "✨ 신규 마스터 컨텐츠 추가"}</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">분류</label>
                <select 
                  value={cForm.type || activeTab} 
                  onChange={e => setCForm({...cForm, type: e.target.value})}
                  className="w-full bg-[var(--bg-main,#121212)] border border-zinc-700 text-xs md:text-sm p-2.5 rounded-xl outline-none cursor-pointer text-white font-bold"
                >
                  <option value="abyss">어비스</option>
                  <option value="raid">레이드</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">명칭</label>
                <input 
                  type="text" 
                  placeholder="예: 레이드 - 카브락" 
                  value={cForm.name || ""} 
                  onChange={e => setCForm({...cForm, name: e.target.value})}
                  className="w-full bg-[var(--bg-main,#121212)] border border-zinc-700 text-xs md:text-sm text-white p-2.5 rounded-xl outline-none focus:border-[var(--accent,#e6c788)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">약칭</label>
                <input 
                  type="text" 
                  placeholder="예: 카브" 
                  value={cForm.short_name || ""} 
                  onChange={e => setCForm({...cForm, short_name: e.target.value})}
                  className="w-full bg-[var(--bg-main,#121212)] border border-zinc-700 text-xs md:text-sm text-white p-2.5 rounded-xl outline-none focus:border-[var(--accent,#e6c788)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">소요시간 (분)</label>
                <input 
                  type="number" 
                  value={cForm.duration_minutes || 0} 
                  onChange={e => setCForm({...cForm, duration_minutes: Number(e.target.value)})}
                  className="w-full bg-[var(--bg-main,#121212)] border border-zinc-700 text-xs md:text-sm text-white p-2.5 rounded-xl outline-none focus:border-[var(--accent,#e6c788)]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-xs text-zinc-300 flex items-center gap-2 cursor-pointer font-medium">
                  <input type="checkbox" checked={cForm.is_weekend || false} onChange={e => setCForm({...cForm, is_weekend: e.target.checked})} className="accent-[var(--accent,#e6c788)]" />
                  주말 전용 컨텐츠
                </label>
                <label className="text-xs text-zinc-300 flex items-center gap-2 cursor-pointer font-medium">
                  <input type="checkbox" checked={cForm.is_active !== false} onChange={e => setCForm({...cForm, is_active: e.target.checked})} className="accent-[var(--accent,#e6c788)]" />
                  파티 모집 활성화
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button 
                onClick={() => setIsContentModalOpen(false)} 
                className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-zinc-700 transition"
              >
                취소
              </button>
              <button 
                onClick={handleSaveContent} 
                className="px-5 py-2 bg-[var(--accent,#e6c788)] text-black font-black rounded-xl text-xs md:text-sm cursor-pointer hover:brightness-110 transition shadow-md"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- 모달 팝업 2: 스탯 컷트라인 추가/수정 ----------------- */}
      {isReqModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--panel,#1c1c1e)] border border-zinc-700 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl animate-scale-up">
            <h3 className="text-base font-black text-amber-400 border-b border-zinc-800 pb-3 flex items-center gap-2">
              <span>{dForm.id ? "✏️ 스탯 컷트라인 수정" : "✨ 신규 스탯 컷트라인 추가"}</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">난이도 명칭</label>
                <input 
                  type="text" 
                  placeholder="예: 입문, 어려움, 매우 어려움, 지옥1" 
                  value={dForm.difficulty || ""} 
                  onChange={e => setDForm({...dForm, difficulty: e.target.value})}
                  className="w-full bg-[var(--bg-main,#121212)] border border-zinc-700 text-xs md:text-sm text-white p-2.5 rounded-xl outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* 전투력 그룹 */}
              <div className="bg-[var(--bg-main,#121212)] p-3.5 rounded-xl border border-zinc-800 space-y-2">
                <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                  <MarkIcon src="/svgs/status mark/전투력 마크.svg" size="xs" colorClass="bg-amber-400" />
                  <span>전투력 설정</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-zinc-400 font-bold mb-1 block">최소 (MIN)</label>
                    <input 
                      type="number" 
                      value={dForm.min_cp || 0} 
                      onChange={e => setDForm({...dForm, min_cp: Number(e.target.value)})}
                      className="w-full bg-[var(--panel,#1c1c1e)] border border-zinc-700 text-xs text-zinc-200 p-2 rounded-lg outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-amber-400 font-bold mb-1 block">권장 (REC)</label>
                    <input 
                      type="number" 
                      value={dForm.rec_cp || 0} 
                      onChange={e => setDForm({...dForm, rec_cp: Number(e.target.value)})}
                      className="w-full bg-[var(--panel,#1c1c1e)] border border-amber-500/30 text-xs text-amber-300 font-bold p-2 rounded-lg outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-purple-400 font-bold mb-1 block">압도 (OP)</label>
                    <input 
                      type="number" 
                      value={dForm.op_cp || 0} 
                      onChange={e => setDForm({...dForm, op_cp: Number(e.target.value)})}
                      className="w-full bg-[var(--panel,#1c1c1e)] border border-purple-500/30 text-xs text-purple-300 font-bold p-2 rounded-lg outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 마도저항 그룹 */}
              <div className="bg-[var(--bg-main,#121212)] p-3.5 rounded-xl border border-zinc-800 space-y-2">
                <div className="text-xs font-black text-sky-400 flex items-center gap-1.5">
                  <MarkIcon src="/svgs/status mark/마도저항 마크.svg" size="xs" colorClass="bg-sky-400" />
                  <span>마도저항 설정</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-amber-400 font-bold mb-1 block">권장 (REC)</label>
                    <input 
                      type="number" 
                      value={dForm.rec_mr || 0} 
                      onChange={e => setDForm({...dForm, rec_mr: Number(e.target.value)})}
                      className="w-full bg-[var(--panel,#1c1c1e)] border border-amber-500/30 text-xs text-amber-300 font-bold p-2 rounded-lg outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-purple-400 font-bold mb-1 block">압도 (OP)</label>
                    <input 
                      type="number" 
                      value={dForm.op_mr || 0} 
                      onChange={e => setDForm({...dForm, op_mr: Number(e.target.value)})}
                      className="w-full bg-[var(--panel,#1c1c1e)] border border-purple-500/30 text-xs text-purple-300 font-bold p-2 rounded-lg outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button 
                onClick={() => setIsReqModalOpen(false)} 
                className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-zinc-700 transition"
              >
                취소
              </button>
              <button 
                onClick={handleSavePowerReq} 
                className="px-5 py-2 bg-[var(--accent,#e6c788)] text-black font-black rounded-xl text-xs md:text-sm cursor-pointer hover:brightness-110 transition shadow-md"
              >
                저장 / 업데이트
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}