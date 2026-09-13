"use client";

import { useState } from "react";
import MarkIcon from "../common/MarkIcon";
import ClassIcon from "../common/ClassIcon";

function CustomTimePicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [h, m] = value.split(':');
  const hours = Array.from({length: 24}, (_, i) => String(i).padStart(2, '0'));
  const minutes = ["00", "15", "30", "45"];

  return (
    <div className="relative flex-1">
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>}
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative z-50 border rounded p-2 text-[0.8rem] font-bold cursor-pointer text-center transition flex justify-center items-center gap-1 bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)]"
      >
        <span>{h}:{m}</span>
        <span className="text-[0.6rem] text-[var(--text-sub)] transition-transform">▼</span>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-[140px] border rounded-lg shadow-2xl z-50 p-2 flex gap-2 bg-[var(--panel)] border-[var(--panel-border)]">
          <div className="flex-1 h-32 overflow-y-auto custom-scrollbar pr-1 space-y-1">
            {hours.map(hour => (
              <button 
                key={hour} 
                onClick={() => onChange(`${hour}:${m}`)} 
                className={`w-full text-center py-1 rounded text-[0.7rem] font-bold transition ${
                  h === hour 
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow' 
                    : 'text-[var(--text-sub)] hover:bg-[var(--panel-hover)] hover:text-[var(--text-main)]'
                }`}
              >
                {hour}시
              </button>
            ))}
          </div>
          <div className="w-px bg-[var(--panel-border)]"></div>
          <div className="flex-1 h-32 overflow-y-auto custom-scrollbar pr-1 space-y-1">
            {minutes.map(minute => (
              <button 
                key={minute} 
                onClick={() => { onChange(`${h}:${minute}`); setIsOpen(false); }} 
                className={`w-full text-center py-1 rounded text-[0.7rem] font-bold transition ${
                  m === minute 
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow' 
                    : 'text-[var(--text-sub)] hover:bg-[var(--panel-hover)] hover:text-[var(--text-main)]'
                }`}
              >
                {minute}분
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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

  joinPopupParty: any;
  setJoinPopupParty: (party: any) => void;
  joinSelectedChar: string;
  setJoinSelectedChar: (char: string) => void;
  joinSelectedRole: string;
  setJoinSelectedRole: (role: string) => void;
  joinTimeStart: string;
  setJoinTimeStart: (time: string) => void;
  joinTimeEnd: string;
  setJoinTimeEnd: (time: string) => void;
  myCharacters: any[];
  executeJoinParty: () => void;
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

  joinPopupParty,
  setJoinPopupParty,
  joinSelectedChar,
  setJoinSelectedChar,
  joinSelectedRole,
  setJoinSelectedRole,
  joinTimeStart,
  setJoinTimeStart,
  joinTimeEnd,
  setJoinTimeEnd,
  myCharacters,
  executeJoinParty,
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
      
      {/* 파티 참여 신청 모달 */}
      {joinPopupParty && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col bg-[var(--panel)] border-[var(--panel-border)]">
            <div className="p-4 border-b flex justify-between items-center gap-2 bg-[var(--inner-box)] border-[var(--panel-border)]">
              <h2 className="text-[0.85rem] font-black whitespace-nowrap text-[var(--text-main)]">⚔️ 파티 참여 신청</h2>
              <button onClick={() => setJoinPopupParty(null)} className="text-xl shrink-0 hover:opacity-80 text-[var(--text-sub)]">&times;</button>
            </div>
            
            <div className="p-4 space-y-3.5">
              <div className="p-2.5 rounded-lg border bg-[var(--panel)] border-[var(--panel-border)]">
                <p className="text-[0.75rem] font-black text-[var(--text-main)]">{joinPopupParty.content_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[0.55rem] px-1.5 py-0.2 rounded border bg-[var(--inner-box)] border-[var(--panel-border)] text-purple-400">{joinPopupParty.difficulty}</span>
                  <span className="text-[0.55rem] text-[var(--text-sub)] font-mono">{joinPopupParty.time_start} ~ {joinPopupParty.time_end}</span>
                </div>
              </div>

              <div>
                <label className="text-[0.65rem] font-bold mb-1 block text-[var(--text-sub)]">참여할 내 캐릭터</label>
                <select 
                  value={joinSelectedChar} 
                  onChange={(e) => setJoinSelectedChar(e.target.value)}
                  className="w-full text-[0.75rem] p-2 rounded border outline-none bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)]"
                >
                  {myCharacters.map(c => (
                    <option key={c.id || c.nickname} value={c.nickname}>{c.nickname} (Lv.{c.level || 1})</option>
                  ))}
                  {myCharacters.length === 0 && <option value="">등록된 캐릭터가 없습니다</option>}
                </select>
              </div>

              <div>
                <label className="text-[0.65rem] font-bold mb-1 block text-[var(--text-sub)]">수행 포지션 (5대 직군)</label>
                <div className="grid grid-cols-5 gap-1">
                  {['탱커', '근딜', '원딜', '힐러', '서포터'].map(r => (
                    <label key={r} className={`flex flex-col items-center justify-center p-2 rounded border cursor-pointer transition ${joinSelectedRole === r ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] font-bold' : 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)]'}`}>
                      <input type="radio" name="role" value={r} checked={joinSelectedRole === r} onChange={(e) => setJoinSelectedRole(e.target.value)} className="hidden" />
                      <span className="text-[0.65rem] truncate">{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[0.65rem] font-bold mb-1 block text-[var(--text-sub)]">나의 실제 참여 가능 시간 (파티와 조율됨)</label>
                <div className="flex items-center gap-2">
                  <CustomTimePicker value={joinTimeStart} onChange={setJoinTimeStart} />
                  <span className="text-[var(--text-sub)] font-bold text-xs">~</span>
                  <CustomTimePicker value={joinTimeEnd} onChange={setJoinTimeEnd} />
                </div>
              </div>
            </div>

            <div className="p-3 border-t flex justify-end gap-2 bg-[var(--inner-box)] border-[var(--panel-border)]">
              <button onClick={() => setJoinPopupParty(null)} className="px-3.5 py-1.5 rounded text-[0.7rem] font-bold transition bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)]">취소</button>
              <button onClick={executeJoinParty} className="px-3.5 py-1.5 rounded text-[0.7rem] font-black transition shadow hover:opacity-90 bg-[var(--accent)] text-[var(--accent-fg)]">신청 확정</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}