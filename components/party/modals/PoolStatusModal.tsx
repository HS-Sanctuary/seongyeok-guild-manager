'use client';

import React from 'react';
import ClassIcon from '@/components/common/ClassIcon';
import MarkIcon from '@/components/common/MarkIcon';
import { parseCP } from '@/lib/busUtils';

const Users = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const X = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);

const RefreshCw = ({ className, title }: { className?: string; title?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {title && <title>{title}</title>}
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>
  </svg>
);

interface PoolStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: any[];
  activeMembers: any[];
}

export default function PoolStatusModal({
  isOpen,
  onClose,
  members = [],
  activeMembers = []
}: PoolStatusModalProps) {
  if (!isOpen) return null;

  // 출전 중인 캐릭터 이름 Set
  const activeCharNames = new Set(
    activeMembers.map((m) => m.character_name || m.name)
  );

  // 계정주(owner/account_id) 기준으로 참여한 캐릭터 그룹화
  const groupedByAccount = members.reduce((acc: Record<string, any[]>, m) => {
    const owner = m.account_id || m.owner || m.owner_account || m.nickname || m.name || '미지정 계정';
    if (!acc[owner]) acc[owner] = [];
    acc[owner].push(m);
    return acc;
  }, {});

  const totalCharCount = members.length;

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--panel)] border-2 border-[var(--accent)] rounded-2xl w-full max-w-lg max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* 모달 헤더 */}
        <div className="p-3.5 sm:p-4 border-b border-[var(--panel-border)] flex items-center justify-between bg-[var(--inner-box)] shrink-0">
          <div className="flex items-center gap-2 text-sm sm:text-base font-black text-[var(--accent)]">
            <Users className="w-5 h-5 text-[var(--accent)] shrink-0" />
            <span>📋 참전 현황 & 대기열 ({totalCharCount}캐릭터)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-sub)] hover:text-white transition p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 계정별 캐릭터 목록 컨텐츠 */}
        <div className="p-3 sm:p-4 overflow-y-auto custom-scrollbar flex-1 space-y-3.5">
          {Object.keys(groupedByAccount).length === 0 ? (
            <div className="text-center py-8 text-xs sm:text-sm text-[var(--text-sub)] font-bold">
              현재 버스에 등록된 캐릭터가 없습니다.
            </div>
          ) : (
            Object.entries(groupedByAccount).map(([ownerName, charList]) => (
              <div
                key={ownerName}
                className="bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-2.5 sm:p-3 space-y-2"
              >
                {/* 계정주 타이틀 헤더 */}
                <div className="flex items-center justify-between pb-1.5 border-b border-[var(--panel-border)]/60 text-xs font-black text-[var(--text-main)]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                    <span>{ownerName} 계정</span>
                  </span>
                  <span className="text-[11px] text-[var(--text-sub)] font-bold">
                    {charList.length}개 캐릭터 참여
                  </span>
                </div>

                {/* 캐릭터 카드리스트 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {charList.map((char: any, idx: number) => {
                    const charName = char.character_name || char.name;
                    const isActive = activeCharNames.has(charName);
                    const cpVal = parseCP(char.combat_power || char.cp || 0);
                    const mrVal = parseCP(char.magic_resistance || char.mres || 0);
                    const alias = char.alias || char.tempAlias;
                    const displayName =
                      alias && alias !== 'EMPTY' && alias !== 'NULL' && alias.trim() !== ''
                        ? alias.trim().slice(0, 3)
                        : charName.slice(0, 3);

                    return (
                      <div
                        key={`${charName}-${idx}`}
                        className={`p-2 rounded-xl border flex flex-col gap-1.5 transition relative overflow-hidden ${
                          isActive
                            ? 'bg-[var(--accent-soft)]/40 border-[var(--accent)] shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                            : 'bg-[var(--panel)] border-[var(--panel-border)]'
                        }`}
                      >
                        {/* 현재 출전 중 하이라이트 뱃지 */}
                        {isActive && (
                          <span className="absolute top-0 right-0 px-1.5 py-0.2 bg-[var(--accent)] text-black font-black text-[8px] rounded-bl-md">
                            출전 중
                          </span>
                        )}

                        <div className="flex items-center justify-between min-w-0 pr-6">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <ClassIcon className="w-4 h-4 text-[var(--text-main)] shrink-0" job={char.job} />
                            <span className="text-xs font-black text-[var(--text-main)] truncate">
                              {displayName} <span className="text-[10px] text-[var(--text-sub)] font-normal">({charName})</span>
                            </span>
                          </div>
                        </div>

                        {/* 전투력 & 마법저항 스탯 SVG 노출 */}
                        <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-[var(--panel-border)]/40">
                          <div className="flex items-center gap-1">
                            <MarkIcon src="/svgs/status mark/전투력 마크.svg" size="xs" scale={0.8} colorClass="bg-amber-400" />
                            <span className="font-bold text-amber-400">
                              {cpVal > 0 ? cpVal.toLocaleString() : '-'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <MarkIcon src="/svgs/status mark/마법저항 마크.svg" size="xs" scale={0.8} colorClass="bg-cyan-400" />
                            <span className="font-bold text-cyan-400">
                              {mrVal > 0 ? mrVal.toLocaleString() : '-'}
                            </span>
                          </div>
                        </div>

                        {/* 반복 유무 & 완료 상태 뱃지 */}
                        <div className="flex items-center justify-between text-[10px] pt-0.5">
                          {char.allow_repeat ? (
                            <span className="text-[var(--accent)] font-bold flex items-center gap-0.5">
                              <RefreshCw className="w-3 h-3" /> 반복
                            </span>
                          ) : (
                            <span className="text-[var(--text-sub)]">단발</span>
                          )}

                          {char.is_completed && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black">
                              [완료]
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="p-2.5 sm:p-3 border-t border-[var(--panel-border)] bg-[var(--inner-box)] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[var(--accent)] text-black font-black text-xs hover:brightness-110 transition cursor-pointer"
          >
            확인
          </button>
        </div>

      </div>
    </div>
  );
}