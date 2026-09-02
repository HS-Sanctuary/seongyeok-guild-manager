"use client";

import { useState } from "react";

interface CustomTimePickerProps {
  value: string;
  onChange: (val: string) => void;
}

export default function CustomTimePicker({ value, onChange }: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [h, m] = (value || "18:00").split(":");

  const adjustMinutes = (delta: number) => {
    let currentMins = parseInt(h, 10) * 60 + parseInt(m, 10) + delta;
    if (currentMins < 0) currentMins += 24 * 60;
    currentMins = currentMins % (24 * 60);
    const newH = Math.floor(currentMins / 60);
    const newM = currentMins % 60;
    onChange(`${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`);
  };

  const PRESETS = ["18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00"];

  return (
    <div className="relative flex-1 min-w-0">
      {isOpen && <div className="fixed inset-0 z-[150]" onClick={() => setIsOpen(false)}></div>}
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className={`relative z-[151] bg-[var(--inner-box)] border ${
          isOpen ? "border-[var(--accent)] text-[var(--accent)] shadow-sm" : "border-[var(--panel-border)] text-[var(--text-main)]"
        } hover:border-[var(--accent)] rounded-xl py-2 px-2.5 text-xs font-black cursor-pointer text-center transition flex justify-center items-center gap-1.5 whitespace-nowrap overflow-hidden shadow-xs`}
      >
        <span className="truncate">⏰ {h}:{m}</span>
        <span className={`text-[9px] text-[var(--text-sub)] transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180 text-[var(--accent)]" : ""}`}>▼</span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[220px] bg-[var(--panel)] border border-[var(--accent)]/60 rounded-2xl shadow-2xl z-[152] p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
          <div>
            <span className="text-[10px] font-black text-[var(--accent)] mb-1 block">⚡ 추천 출발 시간</span>
            <div className="flex flex-wrap gap-1">
              {PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { onChange(p); setIsOpen(false); }}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition ${
                    value === p ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent font-black shadow-xs" : "bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--panel-border)] pt-2">
            <span className="text-[10px] font-black text-[var(--text-sub)] mb-1 block">🛠️ 빠른 증감 조절</span>
            <div className="grid grid-cols-4 gap-1">
              <button type="button" onClick={() => adjustMinutes(-60)} className="text-[10px] font-bold py-1 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)] transition">-1시간</button>
              <button type="button" onClick={() => adjustMinutes(60)} className="text-[10px] font-bold py-1 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)] transition">+1시간</button>
              <button type="button" onClick={() => adjustMinutes(-15)} className="text-[10px] font-bold py-1 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)] transition">-15분</button>
              <button type="button" onClick={() => adjustMinutes(15)} className="text-[10px] font-bold py-1 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)] transition">+15분</button>
            </div>
          </div>

          <div className="border-t border-[var(--panel-border)] pt-2 flex gap-1 h-32">
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-0.5">
              <span className="text-[9px] font-black text-[var(--text-sub)] block text-center mb-1">시</span>
              {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map(hour => (
                <button 
                  key={hour} 
                  type="button"
                  onClick={() => onChange(`${hour}:${m}`)} 
                  className={`w-full text-center py-1 rounded-md text-[10px] font-bold transition ${
                    h === hour ? "bg-[var(--accent)] text-[var(--accent-fg)] font-black" : "text-[var(--text-sub)] hover:bg-[var(--inner-box)] hover:text-[var(--text-main)]"
                  }`}
                >
                  {hour}시
                </button>
              ))}
            </div>
            <div className="w-px bg-[var(--panel-border)] shrink-0"></div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-0.5">
              <span className="text-[9px] font-black text-[var(--text-sub)] block text-center mb-1">분</span>
              {["00", "15", "30", "45"].map(minute => (
                <button 
                  key={minute} 
                  type="button"
                  onClick={() => { onChange(`${h}:${minute}`); setIsOpen(false); }} 
                  className={`w-full text-center py-1 rounded-md text-[10px] font-bold transition ${
                    m === minute ? "bg-[var(--accent)] text-[var(--accent-fg)] font-black" : "text-[var(--text-sub)] hover:bg-[var(--inner-box)] hover:text-[var(--text-main)]"
                  }`}
                >
                  {minute}분
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}