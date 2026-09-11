"use client";

interface LoreGuideModalProps {
  showLoreGuide: boolean;
  setShowLoreGuide: (val: boolean) => void;
}

export default function LoreGuideModal({
  showLoreGuide,
  setShowLoreGuide,
}: LoreGuideModalProps) {
  if (!showLoreGuide) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer overscroll-none"
      onClick={() => setShowLoreGuide(false)}
    >
      <div 
        className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-3">
          <h3 className="font-black text-base text-[var(--accent)] flex items-center gap-2">
            <span>📖</span> 매칭 가이드
          </h3>
          <button 
            type="button"
            onClick={() => setShowLoreGuide(false)}
            className="text-[var(--text-sub)] hover:text-white font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="text-xs text-[var(--text-sub)] space-y-2.5 leading-relaxed">
          <p>• <strong>조합 우선:</strong> 탱/힐/딜 구성을 맞춰 최적의 파티 조합으로 자동 배치합니다.</p>
          <p>• <strong>모집 우선:</strong> 역할 구분 없이 빠른 매칭 완성을 최우선으로 진행합니다.</p>
          <p>• <strong>연속 뺑이:</strong> 반복 클리어를 원하는 길드원끼리 묶어주는 매칭 모드입니다.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowLoreGuide(false)}
          className="w-full py-2.5 bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] font-black text-xs rounded-xl hover:bg-[var(--panel-border)] transition cursor-pointer"
        >
          닫기
        </button>
      </div>
    </div>
  );
}