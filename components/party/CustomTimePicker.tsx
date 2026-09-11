"use client";

import { useState } from "react";

interface CustomTimePickerProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  badge?: React.ReactNode;
  pickerType?: "start" | "end";
}

export default function CustomTimePicker({
  value,
  onChange,
  label,
  badge,
  pickerType = "start",
}: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 1. 기본값 설정: 시작 = 14:00 (오후 2시) / 종료 = 23:00 (오후 11시)
  const defaultFallback = pickerType === "end" ? "23:00" : "14:00";
  const [rawH, rawM] = (value || defaultFallback).split(":");
  const h = String(parseInt(rawH || (pickerType === "end" ? "23" : "14"), 10)).padStart(2, "0");
  const m = String(parseInt(rawM || "00", 10)).padStart(2, "0");

  const adjustMinutes = (delta: number) => {
    let currentMins = parseInt(h, 10) * 60 + parseInt(m, 10) + delta;
    if (currentMins < 0) currentMins += 24 * 60;
    currentMins = currentMins % (24 * 60);
    const newH = Math.floor(currentMins / 60);
    const newM = currentMins % 60;
    onChange(`${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`);
  };

  const PRESETS = ["14:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00"];

  // 2. 초록 영역: 시작/종료 구분에 따른 동적 피드백 버튼 문구
  const completionText =
    pickerType === "end"
      ? `종료 시간 선택 완료 (${h}:${m})`
      : `시작 시간 선택 완료 (${h}:${m})`;

  return (
    <div className="relative flex-1 min-w-0">
      {label && <label className="text-[11px] font-black text-[var(--text-sub)] block mb-1">{label}</label>}
      
      {/* Trigger Button */}
      <div 
        onClick={() => setIsOpen(true)} 
        className={`bg-[var(--inner-box)] border ${
          isOpen ? "border-[var(--accent)] text-[var(--accent)] shadow-sm" : "border-[var(--panel-border)] text-[var(--text-main)]"
        } hover:border-[var(--accent)] rounded-xl py-2 px-2.5 text-xs font-black cursor-pointer text-center transition flex justify-center items-center gap-1.5 whitespace-nowrap overflow-hidden shadow-xs shrink-0 select-none`}
      >
        {badge}
        <span className="font-mono text-xs font-black shrink-0 whitespace-nowrap">{h}:{m}</span>
        <span className={`text-[9px] text-[var(--text-sub)] transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180 text-[var(--accent)]" : ""}`}>
          ▼
        </span>
      </div>

      {/* Fixed Central Overlay Modal */}
      {isOpen && (
        <div 
          className="scrollable-time-picker fixed inset-0 z-[400] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 cursor-pointer overscroll-none animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div 
            className="bg-[var(--panel)] border border-[var(--accent)]/80 rounded-2xl shadow-2xl w-full max-w-xs p-4 space-y-3.5 animate-in zoom-in-95 duration-150 cursor-default select-none max-h-[90vh] overflow-y-auto custom-scrollbar overscroll-contain"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-base">⏰</span>
                <span className="text-xs font-black text-[var(--accent)]">
                  {pickerType === "end" ? "종료 시간 상세 설정" : "시작 시간 상세 설정"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[var(--text-sub)] hover:text-white font-bold text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 1. 추천 출발 시간 */}
            <div>
              <span className="text-[11px] font-black text-[var(--text-sub)] mb-1.5 block">
                ⚡ 추천 출발 시간 (24시간제)
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      onChange(p);
                    }}
                    className={`text-xs font-mono font-bold py-1.5 rounded-lg border transition cursor-pointer ${
                      value === p
                        ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent font-black shadow-xs scale-[1.02]"
                        : "bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 증감 조절 */}
            <div className="border-t border-[var(--panel-border)] pt-2.5">
              <span className="text-[11px] font-black text-[var(--text-sub)] mb-1.5 block">
                🛠️ 증감 조절
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustMinutes(-60)}
                  className="text-[11px] font-bold py-1.5 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)] transition cursor-pointer active:scale-95"
                >
                  -1시간
                </button>
                <button
                  type="button"
                  onClick={() => adjustMinutes(60)}
                  className="text-[11px] font-bold py-1.5 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)] transition cursor-pointer active:scale-95"
                >
                  +1시간
                </button>
                <button
                  type="button"
                  onClick={() => adjustMinutes(-15)}
                  className="text-[11px] font-bold py-1.5 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)] transition cursor-pointer active:scale-95"
                >
                  -15분
                </button>
                <button
                  type="button"
                  onClick={() => adjustMinutes(15)}
                  className="text-[11px] font-bold py-1.5 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)] transition cursor-pointer active:scale-95"
                >
                  +15분
                </button>
              </div>
            </div>

            {/* 3. 빨간 영역: 시 / 분 독립 스크롤 피커 (클래스 식별자 지정) */}
            <div className="border-t border-[var(--panel-border)] pt-2.5 flex gap-2 h-36">
              <div 
                className="scrollable-time-picker flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1 overscroll-contain touch-pan-y"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <span className="text-[10px] font-black text-[var(--text-sub)] block text-center mb-1 sticky top-0 bg-[var(--panel)] py-0.5 z-10">
                  시 (00~23)
                </span>
                {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => onChange(`${hour}:${m}`)}
                    className={`w-full text-center py-1.5 rounded-md text-xs font-mono font-bold transition cursor-pointer ${
                      h === hour
                        ? "bg-[var(--accent)] text-[var(--accent-fg)] font-black"
                        : "text-[var(--text-sub)] hover:bg-[var(--inner-box)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    {hour}시
                  </button>
                ))}
              </div>

              <div className="w-px bg-[var(--panel-border)] shrink-0"></div>

              <div 
                className="scrollable-time-picker flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1 overscroll-contain touch-pan-y"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <span className="text-[10px] font-black text-[var(--text-sub)] block text-center mb-1 sticky top-0 bg-[var(--panel)] py-0.5 z-10">
                  분
                </span>
                {["00", "15", "30", "45"].map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => onChange(`${h}:${minute}`)}
                    className={`w-full text-center py-1.5 rounded-md text-xs font-mono font-bold transition cursor-pointer ${
                      m === minute
                        ? "bg-[var(--accent)] text-[var(--accent-fg)] font-black"
                        : "text-[var(--text-sub)] hover:bg-[var(--inner-box)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    {minute}분
                  </button>
                ))}
              </div>
            </div>

            {/* 초록 영역: 시작/종료 구분 유동 완결 버튼 */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs rounded-xl shadow-md cursor-pointer hover:brightness-110 transition active:scale-98"
            >
              {completionText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}