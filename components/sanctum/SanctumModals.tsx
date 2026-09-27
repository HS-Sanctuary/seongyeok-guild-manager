"use client";

import MarkIcon from "../common/MarkIcon";
import ClassIcon from "../common/ClassIcon";

interface SanctumModalsProps {
  isAbyssModalOpen: boolean;
  setIsAbyssModalOpen: (v: boolean) => void;
  user: any;
  isAdminMode: boolean;
  setIsAdminMode: (v: boolean) => void;
  abyssMins: string;
  setAbyssMins: (v: string) => void;
  submitAbyssHole: (e: React.FormEvent) => void;

  isDeepModalOpen: boolean;
  setIsDeepModalOpen: (v: boolean) => void;
  deepZoneUID: string;
  setDeepZoneUID: (v: string) => void;
  deepCount: string;
  setDeepCount: (v: string) => void;
  submitDeepHole: (e: React.FormEvent) => void;
  HUNTING_ZONES: Array<{ uid: string; name: string; isActive: boolean }>;

  detailModalParty: any;
  setDetailModalParty: (party: any) => void;
  allCharactersMap: Record<string, string>;
  formatRoleText: (roleStr: string) => string;

}

export default function SanctumModals({
  isAbyssModalOpen,
  setIsAbyssModalOpen,
  user,
  isAdminMode,
  setIsAdminMode,
  abyssMins,
  setAbyssMins,
  submitAbyssHole,

  isDeepModalOpen,
  setIsDeepModalOpen,
  deepZoneUID,
  setDeepZoneUID,
  deepCount,
  setDeepCount,
  submitDeepHole,
  HUNTING_ZONES,

  detailModalParty,
  setDetailModalParty,
  allCharactersMap,
  formatRoleText,

}: SanctumModalsProps) {
  return (
    <>
      {/* 어비스 구멍 제보 모달 */}
      {isAbyssModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col bg-[var(--panel)] border-[var(--panel-border)]">
            <div className="p-4 border-b flex justify-between items-center gap-2 bg-[var(--inner-box)] border-[var(--panel-border)]">
              <div className="flex items-center gap-1.5">
                <MarkIcon src="/svgs/contens mark/어비스 마크.svg" size="sm" colorClass="bg-[var(--accent)]" />
                <h2 className="text-base font-black whitespace-nowrap text-[var(--accent)]">어비스 구멍 제보</h2>
              </div>
              <button onClick={() => setIsAbyssModalOpen(false)} className="text-xl shrink-0 hover:opacity-80 text-[var(--text-sub)]">&times;</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-[0.65rem] font-bold whitespace-nowrap text-[var(--text-sub)]">신규 제보 입력</span>
                {((user?.nickname && ["한설", "수도사는수도사", "신파랑", "제ส"].includes(user.nickname)) || 
                  ["길드마스터", "마스터", "부마스터"].includes(user?.role)) && (
                  <label className="flex items-center space-x-1.5 cursor-pointer border px-2 py-0.5 rounded shrink-0 bg-[var(--inner-box)] border-[var(--panel-border)]">
                    <input type="checkbox" checked={isAdminMode} onChange={(e) => setIsAdminMode(e.target.checked)} className="w-3 h-3 accent-[var(--accent)]" />
                    <span className="text-[0.6rem] font-bold whitespace-nowrap text-[var(--text-sub)]">관리자(CBT)</span>
                  </label>
                )}
              </div>
              <form onSubmit={submitAbyssHole} className="flex gap-2">
                <input 
                  type="text" 
                  value={user?.nickname || "로딩중..."} 
                  disabled 
                  className="w-24 text-[0.7rem] p-2 rounded border cursor-not-allowed shrink-0 bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)]" 
                />
                <div className="flex-1 relative min-w-0">
                  <input 
                    type="number" 
                    placeholder="등장까지 몇분 남았나요?" 
                    value={abyssMins} 
                    onChange={(e) => setAbyssMins(e.target.value)} 
                    className="w-full text-[0.7rem] p-2 rounded border focus:outline-none pr-8 bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)]" 
                  />
                  <span className="absolute right-2.5 top-2 text-[0.7rem] font-bold whitespace-nowrap text-[var(--text-sub)]">분</span>
                </div>
                <button 
                  type="submit" 
                  className="text-[0.7rem] px-3.5 rounded font-bold transition shrink-0 whitespace-nowrap hover:opacity-90 bg-[var(--accent)] text-[var(--accent-fg)]"
                >
                  제보
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 심층 구멍 현황 제보 모달 */}
      {isDeepModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col bg-[var(--panel)] border-[var(--panel-border)]">
            <div className="p-4 border-b flex justify-between items-center gap-2 bg-[var(--inner-box)] border-[var(--panel-border)]">
              <div className="flex items-center gap-1.5">
                <MarkIcon src="/svgs/contens mark/레이드 마크.svg" size="sm" colorClass="bg-red-500" />
                <h2 className="text-base font-black text-red-500 whitespace-nowrap">심층 구멍 현황 제보</h2>
              </div>
              <button onClick={() => setIsDeepModalOpen(false)} className="text-xl shrink-0 hover:opacity-80 text-[var(--text-sub)]">&times;</button>
            </div>
            <form onSubmit={submitDeepHole} className="p-4 space-y-4">
              <div>
                <label className="text-[0.65rem] font-bold mb-1 block whitespace-nowrap text-[var(--text-sub)]">제보자 닉네임</label>
                <input type="text" value={user?.nickname || "로딩중..."} disabled className="w-full text-[0.75rem] p-2.5 rounded border cursor-not-allowed bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)]" />
              </div>
              <div>
                <label className="text-[0.65rem] font-bold mb-1 block whitespace-nowrap text-[var(--text-sub)]">사냥터 선택</label>
                <div className="flex gap-1.5 flex-wrap">
                  {HUNTING_ZONES.filter(z => z.isActive).map((zone) => (
                    <button 
                      type="button" 
                      key={zone.uid} 
                      onClick={() => setDeepZoneUID(zone.uid)} 
                      className={`flex-1 min-w-[90px] text-[0.7rem] font-bold py-2 rounded-lg transition whitespace-nowrap border ${
                        deepZoneUID === zone.uid 
                          ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]' 
                          : 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)]'
                      }`}
                    >
                      {zone.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[0.65rem] font-bold mb-1 block whitespace-nowrap text-[var(--text-sub)]">현재 구멍 갯수</label>
                <div className="flex gap-1.5">
                  {['0', '1', '2', '3'].map((num) => (
                    <button 
                      type="button" 
                      key={num} 
                      onClick={() => setDeepCount(num)} 
                      className={`flex-1 text-[0.8rem] font-black py-2 rounded-lg transition whitespace-nowrap border ${
                        deepCount === num 
                          ? 'bg-red-500 text-white border-red-500' 
                          : 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)]'
                      }`}
                    >
                      {num}개
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-1">
                <button type="submit" className="w-full text-[0.75rem] py-2.5 rounded-xl font-black transition shadow-lg whitespace-nowrap hover:opacity-90 bg-red-500 text-white">제보 반영하기</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 파티 멤버 상세보기 모달 */}
      {detailModalParty && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col bg-[var(--panel)] border-[var(--panel-border)]">
            <div className="p-4 border-b flex justify-between items-center gap-2 bg-[var(--inner-box)] border-[var(--panel-border)]">
              <h3 className="font-bold text-[0.8rem] truncate text-[var(--text-main)]">👥 {detailModalParty.content_name} 전체 멤버 ({detailModalParty.members.length}/{detailModalParty.max_members})</h3>
              <button onClick={() => setDetailModalParty(null)} className="text-lg shrink-0 hover:opacity-80 text-[var(--text-sub)]">&times;</button>
            </div>
            <div className="p-4 grid grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar bg-[var(--panel)]">
              {Array.from({ length: detailModalParty.max_members }).map((_, i) => {
                const m = detailModalParty.members[i];
                const actualJob = m ? (allCharactersMap[m.name] || m.job || "전사") : "";
                const displayRole = m?.roles && m.roles.length > 0 ? formatRoleText(m.roles[0]) : (m?.role ? formatRoleText(m.role) : "");
                return m ? (
                  <div key={i} className={`flex flex-col items-center justify-center border rounded p-2 h-20 relative ${
                    detailModalParty.status === '모집완료' && detailModalParty.leader_name === m.name 
                      ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]' 
                      : 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)]'
                  }`}>
                    <ClassIcon job={actualJob} size="md" />
                    <span className="text-[0.6rem] truncate w-full text-center font-bold mt-1">{m.name}</span>
                    {displayRole && <span className="absolute bottom-0 w-full text-center text-[0.45rem] rounded-b truncate px-0.5 bg-[var(--accent-strong)] text-white">{displayRole}</span>}
                  </div>
                ) : (
                  <div key={i} className="flex flex-col items-center justify-center border border-dashed rounded p-2 h-20 bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)]">
                    <span className="text-[0.55rem] font-bold">빈자리</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
    </>
  );
}
