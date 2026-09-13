"use client";

import MarkIcon from "../common/MarkIcon";

interface SanctumHeaderWidgetsProps {
  isWidgetExpandedMobile: boolean;
  setIsWidgetExpandedMobile: (v: boolean) => void;
  uniqueAccountsCount: number;
  totalCharactersCount: number;
  allRounderLevel: number;
  fieldBossEvent: { status: string; sec: number };
  barrierEvent: { status: string; sec: number };
  abyssDisplay: { status: string; timeText: string; subText: string; isDefault: boolean };
  deepTimer: string;
  HUNTING_ZONES: Array<{ uid: string; name: string; isActive: boolean }>;
  getActiveDeepHoles: (uid: string) => any[];
  setIsAbyssModalOpen: (v: boolean) => void;
  setIsDeepModalOpen: (v: boolean) => void;
  formatTimeHM: (sec: number) => string;
  router: any;
}

export default function SanctumHeaderWidgets({
  isWidgetExpandedMobile,
  setIsWidgetExpandedMobile,
  uniqueAccountsCount,
  totalCharactersCount,
  allRounderLevel,
  fieldBossEvent,
  barrierEvent,
  abyssDisplay,
  deepTimer,
  HUNTING_ZONES,
  getActiveDeepHoles,
  setIsAbyssModalOpen,
  setIsDeepModalOpen,
  formatTimeHM,
  router,
}: SanctumHeaderWidgetsProps) {
  return (
    <section className="space-y-2">
      {/* 알림 텍스트 및 모바일 토글 버튼 헤더 */}
      <div className="flex justify-between items-center px-1 gap-2">
        <span className="text-[0.6rem] md:text-[0.65rem] font-medium flex items-center gap-1.5 backdrop-blur px-2.5 py-1 rounded-full border whitespace-nowrap shadow-sm bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)] truncate">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-green-500 shrink-0"></span>
          <span className="truncate">심층/어비스 구멍 출현 제보 시 모두에게 공유 됩니다.</span>
        </span>

        <button
          onClick={() => setIsWidgetExpandedMobile(!isWidgetExpandedMobile)}
          className="md:hidden text-[0.6rem] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 shrink-0 bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--accent)] hover:border-[var(--accent)] active:scale-95 transition-all"
        >
          <span>{isWidgetExpandedMobile ? '요약보기' : '상세보기'}</span>
          <span className="text-[0.5rem]">{isWidgetExpandedMobile ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* 1. 모바일 전용 컴팩트 미니 그리드 (기본 요약 뷰: 위 3개 / 아래 3개) */}
      {!isWidgetExpandedMobile && (
        <div className="grid grid-cols-3 gap-1.5 md:hidden">
          {/* [1] ASTRA (마크 크기 sm으로 확대 보정) */}
          <div 
            onClick={() => router.push('/lounge?tab=ASTRA')}
            className="rounded-lg border backdrop-blur p-2 flex flex-col items-center justify-center text-center cursor-pointer transition active:scale-95 bg-[var(--panel)] border-[var(--panel-border)] hover:border-[var(--accent)] min-w-0"
          >
            <div className="flex items-center gap-1 mb-0.5">
              <MarkIcon src="/svgs/UI mark/길드 마크.svg" size="sm" colorClass="bg-[var(--accent)]" />
              <span className="text-[0.58rem] font-black tracking-tight text-[var(--accent)] truncate">ASTRA</span>
            </div>
            <span className="text-[0.65rem] font-black text-[var(--text-main)] truncate">{uniqueAccountsCount}계정 / {totalCharactersCount}캐릭</span>
          </div>

          {/* [2] 올라운더 (마크 크기 sm으로 확대 보정) */}
          <div className="rounded-lg border backdrop-blur p-2 flex flex-col items-center justify-center text-center bg-[var(--panel)] border-[var(--panel-border)] min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <MarkIcon src="/svgs/UI mark/도감 마크.svg" size="sm" colorClass="bg-[var(--accent)]" />
              <span className="text-[0.58rem] font-bold text-[var(--text-sub)] truncate">올라운더</span>
            </div>
            <span className="text-[0.65rem] font-black text-[var(--accent)] truncate">{allRounderLevel} LV</span>
          </div>

          {/* [3] 필드보스 */}
          <div className={`rounded-lg border backdrop-blur p-2 flex flex-col items-center justify-center text-center bg-[var(--panel)] min-w-0 ${
            fieldBossEvent.status === 'imminent' || fieldBossEvent.status === 'active' 
              ? 'border-yellow-500' 
              : 'border-[var(--panel-border)]'
          }`}>
            <div className="flex items-center gap-1 mb-0.5">
              <MarkIcon src="/svgs/contens mark/필드보스 마크.svg" size="xs" colorClass="bg-yellow-400" />
              <span className="text-[0.58rem] font-bold text-[var(--text-sub)] truncate">필드보스</span>
            </div>
            <span className={`text-[0.65rem] font-black truncate ${
              fieldBossEvent.status === 'imminent' || fieldBossEvent.status === 'active' ? 'text-yellow-400' : 'text-[var(--text-main)]'
            }`}>
              {fieldBossEvent.status === 'imminent' ? '출현 임박!' : fieldBossEvent.status === 'active' ? '출현중!' : formatTimeHM(fieldBossEvent.sec)}
            </span>
          </div>

          {/* [4] 소환의 결계 */}
          <div className={`rounded-lg border backdrop-blur p-2 flex flex-col items-center justify-center text-center bg-[var(--panel)] min-w-0 ${
            barrierEvent.status === 'imminent' || barrierEvent.status === 'active' 
              ? 'border-red-500' 
              : 'border-[var(--panel-border)]'
          }`}>
            <div className="flex items-center gap-1 mb-0.5">
              <MarkIcon src="/svgs/contens mark/여신상 마크.svg" size="xs" colorClass="bg-red-400" />
              <span className="text-[0.58rem] font-bold text-[var(--text-sub)] truncate">소환결계</span>
            </div>
            <span className={`text-[0.65rem] font-black truncate ${
              barrierEvent.status === 'imminent' || barrierEvent.status === 'active' ? 'text-red-400' : 'text-[var(--text-main)]'
            }`}>
              {barrierEvent.status === 'imminent' ? '곧 출현!' : barrierEvent.status === 'active' ? '출현중!' : formatTimeHM(barrierEvent.sec)}
            </span>
          </div>

          {/* [5] 어비스 구멍 */}
          <div 
            onClick={() => setIsAbyssModalOpen(true)}
            className="rounded-lg border backdrop-blur p-2 flex flex-col items-center justify-center text-center cursor-pointer transition active:scale-95 bg-[var(--panel)] border-[var(--panel-border)] hover:border-[var(--accent)] min-w-0"
          >
            <div className="flex items-center gap-1 mb-0.5">
              <MarkIcon src="/svgs/contens mark/어비스 마크.svg" size="xs" colorClass="bg-[var(--accent)]" />
              <span className="text-[0.55rem] font-bold text-[var(--accent)] truncate">어비스 구멍</span>
            </div>
            <span className="text-[0.65rem] font-black text-[var(--text-main)] truncate">{abyssDisplay.timeText}</span>
          </div>

          {/* [6] 심층 구멍 */}
          {(() => {
            const changbaekHole = getActiveDeepHoles('hz_001')[0];
            const hasActiveHole = changbaekHole && changbaekHole.channel !== '0';
            const changbaekStatusText = hasActiveHole ? `${changbaekHole.channel}개` : '대기';
            
            return (
              <div 
                onClick={() => setIsDeepModalOpen(true)}
                className={`rounded-lg border backdrop-blur p-1.5 flex flex-col items-center justify-center text-center cursor-pointer transition active:scale-95 bg-[var(--panel)] min-w-0 ${
                  hasActiveHole 
                    ? 'border-red-500/80 bg-red-950/20 shadow-sm' 
                    : 'border-[var(--panel-border)] hover:border-red-400'
                }`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <MarkIcon src="/svgs/contens mark/레이드 마크.svg" size="xs" colorClass="bg-red-400" />
                  <span className="text-[0.55rem] font-bold text-red-400 truncate">심층구멍</span>
                </div>
                <div className="flex flex-col items-center leading-tight min-w-0 w-full">
                  <span className={`text-[0.58rem] font-black truncate w-full ${hasActiveHole ? 'text-red-400 font-extrabold' : 'text-[var(--text-main)]'}`}>
                    창백한 산 {changbaekStatusText}
                  </span>
                  <span className="text-[0.5rem] font-mono text-[var(--text-sub)] mt-0.5 whitespace-nowrap">
                    {deepTimer} 초기화
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 2. 풀사이즈 상세 카드 그리드 (PC 뷰 항시 노출 / 모바일은 '상세보기' 선택 시 노출) */}
      <div className={`grid grid-cols-2 xl:grid-cols-6 gap-2 md:gap-3 items-stretch ${
        isWidgetExpandedMobile ? 'grid md:grid' : 'hidden md:grid'
      }`}>
        
        {/* ASTRA 현황 풀 카드 */}
        <div 
          onClick={() => router.push('/lounge?tab=ASTRA')}
          className="rounded-xl border backdrop-blur p-2.5 sm:p-3.5 flex flex-col justify-between relative overflow-hidden shadow-sm order-1 cursor-pointer transition group bg-[var(--panel)] border-[var(--panel-border)] hover:border-[var(--accent)]"
        >
          <div className="absolute -right-2 -bottom-2 opacity-20 group-hover:scale-110 transition-transform pointer-events-none filter drop-shadow">
            <MarkIcon src="/svgs/UI mark/길드 마크.svg" size="xl" colorClass="bg-[var(--accent)]" />
          </div>
          
          <div className="mb-2">
            <span className="text-[0.55rem] xs:text-[0.6rem] uppercase tracking-tight xs:tracking-wider font-black block leading-tight whitespace-nowrap text-[var(--accent)]">Sanctuary ASTRA</span>
            <p className="text-[0.6rem] xs:text-[0.65rem] font-bold mt-0.5 leading-tight whitespace-nowrap text-[var(--text-sub)]">성역에 새겨진 모든 별들</p>
          </div>

          <div className="grid grid-cols-2 gap-1 xs:gap-2 pt-2 border-t mt-auto border-[var(--panel-border)]">
            <div className="flex flex-col min-w-0">
              <span className="text-[0.55rem] xs:text-[0.6rem] uppercase font-bold tracking-wider text-[var(--accent)] truncate">SOL</span>
              <div className="flex items-baseline gap-0.5 xs:gap-1 mt-0.5 whitespace-nowrap">
                <span className="text-lg xs:text-xl md:text-2xl font-black cursor-help leading-none text-[var(--text-main)]" title="등록된 계정 수">{uniqueAccountsCount}</span>
                <span className="text-[0.55rem] xs:text-[0.6rem] font-bold leading-none whitespace-nowrap text-[var(--text-sub)]">계정</span>
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[0.55rem] xs:text-[0.6rem] uppercase font-bold text-blue-400 tracking-wider truncate">LUNA</span>
              <div className="flex items-baseline gap-0.5 xs:gap-1 mt-0.5 whitespace-nowrap">
                <span className="text-lg xs:text-xl md:text-2xl font-black cursor-help leading-none text-[var(--text-main)]" title="등록된 캐릭터 수">{totalCharactersCount}</span>
                <span className="text-[0.55rem] xs:text-[0.6rem] font-bold leading-none whitespace-nowrap text-[var(--text-sub)]">캐릭터</span>
              </div>
            </div>
          </div>
        </div>

        {/* 올라운더 풀 카드 */}
        <div className="rounded-xl border backdrop-blur p-2.5 sm:p-3.5 flex flex-col justify-between relative overflow-hidden shadow-sm order-2 bg-[var(--panel)] border-[var(--panel-border)]">
          <div className="absolute -right-2 -bottom-2 opacity-25 pointer-events-none filter drop-shadow">
            <MarkIcon src="/svgs/UI mark/도감 마크.svg" size="xl" colorClass="bg-[var(--accent)]" />
          </div>
          <p className="text-[0.55rem] xs:text-[0.6rem] uppercase tracking-[0.05em] xs:tracking-[0.1em] font-bold whitespace-nowrap text-[var(--text-sub)]">올라운더 달성률</p>
          <div className="my-auto py-1 flex items-baseline gap-1">
            <span className="text-2xl md:text-3xl font-black leading-none text-[var(--accent)]">{allRounderLevel}</span>
            <span className="text-[0.65rem] xs:text-[0.7rem] font-bold leading-none text-[var(--text-sub)]">LV</span>
          </div>
          <p className="text-[0.55rem] xs:text-[0.6rem] whitespace-nowrap text-[var(--text-sub)]">최대 1365 LV</p>
        </div>

        {/* 필드보스 풀 카드 */}
        <div className={`rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between relative transition-all duration-500 order-3 backdrop-blur border bg-[var(--panel)] ${
          fieldBossEvent.status === 'imminent' || fieldBossEvent.status === 'active' 
            ? 'border-yellow-500' 
            : 'border-[var(--panel-border)]'
        } ${fieldBossEvent.status === 'imminent' ? 'animate-pulse' : ''}`}>
          <div className="flex items-center justify-between">
            <p className={`text-[0.55rem] xs:text-[0.6rem] font-bold whitespace-nowrap ${fieldBossEvent.status === 'imminent' || fieldBossEvent.status === 'active' ? 'text-yellow-400' : 'text-[var(--text-sub)]'}`}>필드보스 알림</p>
            <MarkIcon src="/svgs/contens mark/필드보스 마크.svg" size="sm" colorClass="bg-yellow-400" />
          </div>
          <div className="my-auto py-1 flex flex-col">
            <span className="text-base xs:text-lg md:text-xl font-black leading-tight whitespace-nowrap text-[var(--text-main)]">
              {fieldBossEvent.status === 'imminent' ? '출현 임박!' : fieldBossEvent.status === 'active' ? '출현중!' : formatTimeHM(fieldBossEvent.sec)}
            </span>
            {fieldBossEvent.status === 'waiting' && <span className="text-[0.55rem] xs:text-[0.6rem] font-bold mt-0.5 whitespace-nowrap text-[var(--text-sub)]">다음 출현까지</span>}
          </div>
          <p className="text-[0.55rem] xs:text-[0.6rem] whitespace-nowrap text-[var(--text-sub)]">{fieldBossEvent.status === 'active' ? '지도에서 위치 확인' : '12, 18, 20, 22시'}</p>
        </div>

        {/* 소환의 결계 풀 카드 */}
        <div className={`rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between relative transition-all duration-500 order-4 backdrop-blur border bg-[var(--panel)] ${
          barrierEvent.status === 'imminent' || barrierEvent.status === 'active' 
            ? 'border-red-500' 
            : 'border-[var(--panel-border)]'
        } ${barrierEvent.status === 'imminent' ? 'animate-pulse' : ''}`}>
          <div className="flex items-center justify-between">
            <p className={`text-[0.55rem] xs:text-[0.6rem] font-bold whitespace-nowrap ${barrierEvent.status === 'imminent' || barrierEvent.status === 'active' ? 'text-red-400' : 'text-[var(--text-sub)]'}`}>소환의 결계 알림</p>
            <MarkIcon src="/svgs/contens mark/여신상 마크.svg" size="sm" colorClass="bg-red-400" />
          </div>
          <div className="my-auto py-1 flex flex-col">
            <span className="text-base xs:text-lg md:text-xl font-black leading-tight whitespace-nowrap text-[var(--text-main)]">
              {barrierEvent.status === 'imminent' ? '곧 출현!' : barrierEvent.status === 'active' ? '출현중!' : formatTimeHM(barrierEvent.sec)}
            </span>
            {barrierEvent.status === 'waiting' && <span className="text-[0.55rem] xs:text-[0.6rem] font-bold mt-0.5 whitespace-nowrap text-[var(--text-sub)]">다음 출현까지</span>}
          </div>
          <p className="text-[0.55rem] xs:text-[0.6rem] whitespace-nowrap text-[var(--text-sub)]">{barrierEvent.status === 'active' ? '몬스터 등장 중' : '매 정각 실시간 타이머'}</p>
        </div>

        {/* 어비스 구멍 풀 카드 */}
        <div className="rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between relative backdrop-blur order-5 border bg-[var(--panel)] border-[var(--panel-border)]">
          <div className="flex justify-between items-center mb-1 gap-1">
            <div className="flex items-center gap-1">
              <MarkIcon src="/svgs/contens mark/어비스 마크.svg" size="sm" colorClass="bg-[var(--accent)]" />
              <p className="text-[0.55rem] xs:text-[0.6rem] font-bold whitespace-nowrap text-[var(--accent)]">어비스 구멍</p>
            </div>
            <button 
              onClick={() => setIsAbyssModalOpen(true)} 
              className="text-[0.55rem] xs:text-[0.6rem] px-1.5 py-0.5 rounded border transition font-bold shadow shrink-0 whitespace-nowrap hover:opacity-80 bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--accent)]"
            >
              제보
            </button>
          </div>
          <div className="flex flex-col my-auto py-1">
            <span className="text-base xs:text-lg md:text-xl font-black leading-tight whitespace-nowrap text-[var(--text-main)]">
              {abyssDisplay.timeText}
            </span>
            <span className="text-[0.55rem] xs:text-[0.6rem] font-bold mt-0.5 whitespace-nowrap text-[var(--text-sub)]">{abyssDisplay.subText}</span>
          </div>
        </div>

        {/* 심층 구멍 풀 카드 */}
        <div className="rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between relative backdrop-blur order-6 border bg-[var(--panel)] border-[var(--panel-border)]">
          <div className="flex flex-col mb-1">
            <div className="flex justify-between items-center w-full gap-1">
              <div className="flex items-center gap-1">
                <MarkIcon src="/svgs/contens mark/레이드 마크.svg" size="sm" colorClass="bg-red-400" />
                <p className="text-[0.55rem] xs:text-[0.6rem] font-bold whitespace-nowrap text-red-400">심층 구멍</p>
              </div>
              <button 
                onClick={() => setIsDeepModalOpen(true)} 
                className="text-[0.55rem] xs:text-[0.6rem] px-1.5 py-0.5 rounded border transition font-bold shadow shrink-0 whitespace-nowrap hover:opacity-80 bg-[var(--inner-box)] border-[var(--panel-border)] text-red-400"
              >
                제보
              </button>
            </div>
            <span className="text-[0.5rem] xs:text-[0.55rem] font-mono mt-0.5 whitespace-nowrap text-[var(--text-sub)]">{deepTimer} 초기화</span>
          </div>
          <div className="grid grid-cols-2 gap-1 my-auto">
            {HUNTING_ZONES.filter(z => z.isActive).map(zone => {
              const activeHole = getActiveDeepHoles(zone.uid)[0];
              return (
                <div 
                  key={zone.uid} 
                  className="flex flex-col justify-center items-center border p-1 rounded-lg text-center gap-0.5 whitespace-nowrap bg-[var(--inner-box)] border-[var(--panel-border)] min-w-0"
                >
                  <span className="text-[0.55rem] xs:text-[0.6rem] font-bold leading-tight truncate w-full text-[var(--text-main)]">{zone.name}</span>
                  <span 
                    className={`text-[0.55rem] xs:text-[0.6rem] w-full py-0.5 rounded font-bold ${activeHole && activeHole.channel !== '0' ? 'bg-red-500 text-white' : 'bg-[var(--panel)] text-[var(--text-sub)]'}`}
                  >
                    {activeHole ? `${activeHole.channel}개` : '대기'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}