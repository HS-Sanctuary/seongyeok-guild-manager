"use client";

interface SynaxisInfoModalProps {
  showSynaxisInfoModal: boolean;
  setShowSynaxisInfoModal: (val: boolean) => void;
}

export default function SynaxisInfoModal({
  showSynaxisInfoModal,
  setShowSynaxisInfoModal,
}: SynaxisInfoModalProps) {
  if (!showSynaxisInfoModal) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer overscroll-none"
      onClick={() => setShowSynaxisInfoModal(false)}
    >
      <div 
        className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-3">
          <h3 className="font-black text-base sm:text-lg text-[var(--accent)] flex items-center gap-2">
            <span>🏛️</span> SYNAXIS 시스템 안내
          </h3>
          <button 
            type="button"
            onClick={() => setShowSynaxisInfoModal(false)}
            className="text-[var(--text-sub)] hover:text-white font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="text-xs sm:text-sm text-[var(--text-sub)] space-y-3 leading-relaxed">
          <p>
            <strong className="text-[var(--text-main)] font-bold">시낙시스(SYNAXIS)</strong>는 길드원 간의 원활한 던전 및 레이드 매칭을 위해 설계된 성역 전용 통합 스마트 매칭 플랫폼입니다.
          </p>
          <div className="bg-[var(--inner-box)] p-3 rounded-xl border border-[var(--panel-border)] space-y-2 text-[11px] sm:text-xs">
            <div>✨ <strong className="text-[var(--text-main)]">자동 시간 조율:</strong> 멤버가 모이면 최적의 중간 출발 시간을 자동 산출합니다.</div>
            <div>🚌 <strong className="text-[var(--text-main)]">성역 길드 버스:</strong> 관리자가 개설한 지원 버스에 내 캐릭터들을 일괄 탑승시킬 수 있습니다.</div>
            <div>⚡ <strong className="text-[var(--text-main)]">실시간 동기화:</strong> 수동 새로고침 없이 파티 생성이 즉시 반영됩니다.</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowSynaxisInfoModal(false)}
          className="w-full py-2.5 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs rounded-xl shadow-md hover:opacity-90 transition cursor-pointer"
        >
          확인
        </button>
      </div>
    </div>
  );
}