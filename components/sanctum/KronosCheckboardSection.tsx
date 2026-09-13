"use client";

import React from "react";
import MarkIcon from "../common/MarkIcon";
import ClassIcon from "../common/ClassIcon";

interface KronosCheckboardSectionProps {
  myCharacters: any[];
  dailyTasks: any[];
  weeklyTasks: any[];
  abyssList: any[];
  raidList: any[];
  accountProgressRate: number;
  checkTaskDone: (char: any, item: any, type: "daily" | "weekly" | "raid") => boolean;
  onToggleTask?: (char: any, item: any, type: "daily" | "weekly" | "raid") => void;
  formatName: (fullName: string) => string;
  router: any;
}

export default function KronosCheckboardSection({
  myCharacters,
  dailyTasks,
  weeklyTasks,
  abyssList,
  raidList,
  accountProgressRate,
  checkTaskDone,
  onToggleTask,
  formatName,
  router,
}: KronosCheckboardSectionProps) {
  return (
    <section className="bg-transparent p-0.5 md:p-1">
      {/* 1. KRONOS CHECK BOARD 1줄 컴팩트 헤더 영역 (Single Row Header) */}
      <div className="flex flex-row justify-between items-center mb-2 pb-2 border-b gap-1.5 md:gap-2 border-[var(--panel-border)]">
        
        {/* 좌측: 장비 마크 + (대제목 + 뱃지 서브타이틀 텍스트 수직 칼정렬) */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MarkIcon src="/svgs/UI mark/장비 마크.svg" size="md" colorClass="bg-[var(--accent)]" />
          <div className="min-w-0 flex flex-col items-start justify-center">
            <h2 className="font-black text-xs md:text-sm tracking-tight whitespace-nowrap text-[var(--text-main)] leading-tight">
              Kronos Check Board
            </h2>
            <div className="mt-0.5 flex items-center">
              {/* -ml-1.5 음수 마진을 통해 'K'와 'S' 글자 수직 정렬 축 100% 일치 */}
              <span className="inline-block text-[0.5rem] md:text-[0.58rem] font-extrabold px-1.5 py-0.5 -ml-1 rounded bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs leading-none whitespace-nowrap">
                Sanctum : 캐릭터 관리 시스템 요약
              </span>
            </div>
          </div>
        </div>
        
        {/* 우측: 계정 전체 달성률 + Learn More 버튼 */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          
          {/* 계정 달성률 초미니 인라인 게이지 */}
          <div className="flex items-center gap-1 bg-[var(--inner-box)] px-1.5 py-0.5 md:px-2 md:py-1 rounded-md border border-[var(--panel-border)]">
            <span className="text-[0.48rem] md:text-[0.55rem] font-bold text-[var(--text-sub)] whitespace-nowrap">전체 달성률</span>
            <span className="text-[0.58rem] md:text-[0.65rem] font-black text-[var(--accent)] font-mono leading-none">{accountProgressRate}%</span>
            <div className="hidden sm:block w-8 sm:w-12 md:w-14 h-1 md:h-1.5 rounded-full overflow-hidden border bg-[var(--panel)] border-[var(--panel-border)]">
              <div 
                style={{ width: `${accountProgressRate}%` }} 
                className="h-full transition-all duration-500 rounded-full bg-[var(--accent)]"
              ></div>
            </div>
          </div>
          
          {/* 초컴팩트 미니 Learn More 버튼 */}
          <button 
            type="button"
            onClick={() => router.push('/character')} 
            className="whitespace-nowrap shrink-0 text-[0.55rem] md:text-[0.6rem] font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-md border transition-all active:scale-95 flex items-center gap-0.5 border-[var(--accent)] text-[var(--accent)] bg-[var(--inner-box)] hover:bg-[var(--accent)] hover:text-[var(--accent-fg)] cursor-pointer"
          >
            <span>Learn More</span>
            <span className="text-[0.5rem]">→</span>
          </button>
        </div>

      </div>
      
      {/* 2. 캐릭터별 숙제 그리드 카드 (모바일 2열 ~ PC 6열) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-1.5 md:gap-2.5">
        {myCharacters.length === 0 ? (
          <div className="col-span-full text-center py-6 text-xs font-bold text-[var(--text-sub)]">
            등록된 캐릭터가 없습니다. 'Learn More'에서 캐릭터를 등록해주세요!
          </div>
        ) : (
          myCharacters.map((char) => {
            const completedDailyCount = dailyTasks.filter(t => checkTaskDone(char, t, "daily")).length;
            const completedWeeklyCount = weeklyTasks.filter(t => checkTaskDone(char, t, "weekly")).length;

            const dRate = Math.round((completedDailyCount / (dailyTasks.length || 1)) * 100);
            const wRate = Math.round((completedWeeklyCount / (weeklyTasks.length || 1)) * 100);

            const abyssCount = abyssList.filter(a => checkTaskDone(char, a, "raid")).length;
            const raidCount = raidList.filter(r => checkTaskDone(char, r, "raid")).length;

            return (
              <div 
                key={char.id || char.nickname} 
                onClick={() => router.push(`/character?char=${encodeURIComponent(char.nickname)}`)} 
                className="backdrop-blur border rounded-xl p-2 md:p-2.5 cursor-pointer transition shadow-xs flex flex-col gap-1.5 group min-w-0 active:scale-[0.99] bg-[var(--panel)] border-[var(--panel-border)] hover:border-[var(--accent)]"
              >
                {/* 캐릭터 헤더 (직업 아이콘 + 닉네임 + 대표 뱃지) */}
                <div className="flex items-center justify-between border-b pb-1 gap-1 border-[var(--panel-border)]">
                  <div className="flex items-center gap-1 w-full truncate">
                    <ClassIcon job={char.job} size="xs" />
                    <span className="font-black text-[0.72rem] md:text-[0.8rem] truncate flex-1 min-w-0 text-[var(--text-main)]">
                      {char.nickname}
                    </span>
                  </div>
                  {char.is_main && (
                    <span className="text-[0.5rem] font-black px-1 py-0.2 rounded shrink-0 whitespace-nowrap bg-[var(--accent)] text-[var(--accent-fg)]">
                      대표
                    </span>
                  )}
                </div>

                {/* 일일/주간 프로그레스 바 */}
                <div className="space-y-0.5 text-[0.58rem] font-bold px-0.5">
                  <div>
                    <div className="flex justify-between mb-0.5 gap-1 text-[var(--text-sub)]">
                      <span className="whitespace-nowrap">일일 숙제</span>
                      <span className="font-mono shrink-0 text-[var(--accent)]">{Math.min(dRate, 100)}%</span>
                    </div>
                    <div className="w-full h-1 rounded-full overflow-hidden bg-[var(--inner-box)]">
                      <div style={{ width: `${Math.min(dRate, 100)}%` }} className="h-full transition-all bg-[var(--accent)]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5 gap-1 text-[var(--text-sub)]">
                      <span className="whitespace-nowrap">주간 숙제</span>
                      <span className="font-mono shrink-0 text-[var(--accent)]">{Math.min(wRate, 100)}%</span>
                    </div>
                    <div className="w-full h-1 rounded-full overflow-hidden bg-[var(--inner-box)]">
                      <div style={{ width: `${Math.min(wRate, 100)}%` }} className="h-full transition-all bg-[var(--accent)]"></div>
                    </div>
                  </div>
                </div>
                
                {/* 인터랙티브 어비스 & 레이드 직접 토글 버튼 영역 */}
                <div className="flex flex-col gap-1 p-1 rounded-lg border mt-auto bg-[var(--inner-box)] border-[var(--panel-border)]">
                  {/* 어비스 목록 */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[0.52rem] font-bold truncate text-[var(--text-sub)]">
                      어비스 ({abyssCount}/{abyssList.length})
                    </span>
                    <div className="grid grid-cols-2 gap-0.5">
                      {abyssList.length > 0 ? abyssList.map((a, idx) => {
                        const isChecked = checkTaskDone(char, a, "raid");
                        const dName = a.short_name || formatName(a.name);
                        const isOddAndLast = (abyssList.length % 2 !== 0) && (idx === abyssList.length - 1);
                        return (
                          <button
                            type="button"
                            key={a.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation(); // 카드 상세 이동 방지
                              if (onToggleTask) {
                                onToggleTask(char, a, "raid");
                              }
                            }}
                            title={`${char.nickname} - ${a.name} (${isChecked ? '완료됨' : '미완료'})`}
                            className={`w-full text-[0.52rem] px-0.5 py-0.5 rounded border font-bold text-center truncate transition-all active:scale-95 cursor-pointer ${
                              isOddAndLast ? 'col-span-2' : ''
                            } ${
                              isChecked 
                                ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] font-black shadow-xs' 
                                : 'bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)] hover:border-[var(--accent)] hover:text-[var(--text-main)]'
                            }`}
                          >
                            {dName}
                          </button>
                        );
                      }) : (
                        <span className="font-normal text-[0.5rem] col-span-2 text-center text-[var(--text-sub)]">없음</span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[var(--panel-border)] my-0.5"></div>

                  {/* 레이드 목록 */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[0.52rem] font-bold truncate text-[var(--text-sub)]">
                      레이드 ({raidCount}/{raidList.length})
                    </span>
                    <div className="grid grid-cols-2 gap-0.5">
                      {raidList.length > 0 ? raidList.map((r, idx) => {
                        const isChecked = checkTaskDone(char, r, "raid");
                        const dName = r.short_name || formatName(r.name);
                        const isOddAndLast = (raidList.length % 2 !== 0) && (idx === raidList.length - 1);
                        return (
                          <button
                            type="button"
                            key={r.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation(); // 카드 상세 이동 방지
                              if (onToggleTask) {
                                onToggleTask(char, r, "raid");
                              }
                            }}
                            title={`${char.nickname} - ${r.name} (${isChecked ? '완료됨' : '미완료'})`}
                            className={`w-full text-[0.52rem] px-0.5 py-0.5 rounded border font-bold text-center truncate transition-all active:scale-95 cursor-pointer ${
                              isOddAndLast ? 'col-span-2' : ''
                            } ${
                              isChecked 
                                ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] font-black shadow-xs' 
                                : 'bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)] hover:border-[var(--accent)] hover:text-[var(--text-main)]'
                            }`}
                          >
                            {dName}
                          </button>
                        );
                      }) : (
                        <span className="font-normal text-[0.5rem] col-span-2 text-center text-[var(--text-sub)]">없음</span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>
    </section>
  );
}