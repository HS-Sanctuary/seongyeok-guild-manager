"use client";

import React, { useState, useEffect } from "react";

interface CustomTimePickerProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  badge?: React.ReactNode;
  pickerType?: "start" | "end";
}

const PRESETS = ["18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00", "01:00"];

export default function CustomTimePicker({
  value,
  onChange,
  label,
  badge,
  pickerType = "start",
}: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"hour" | "minute">("hour");

  const defaultFallback = pickerType === "end" ? "23:00" : "14:00";

  // 시간/분/다음날 파싱 함수
  const parseValue = (valStr: string) => {
    const target = valStr || defaultFallback;
    const isNext = target.includes("+1일") || target.includes("다음날") || target.includes("익일");

    const match = target.match(/(\d{1,2}):(\d{1,2})/);

    let hNum = match ? parseInt(match[1], 10) : (pickerType === "end" ? 23 : 14);
    let mNum = match ? parseInt(match[2], 10) : 0;

    if (isNaN(hNum)) hNum = pickerType === "end" ? 23 : 14;
    if (isNaN(mNum)) mNum = 0;

    return {
      hour: (hNum + 24) % 24,
      minute: (mNum + 60) % 60,
      isNextDay: isNext,
    };
  };

  const parsed = parseValue(value || defaultFallback);
  const [localHour, setLocalHour] = useState<number>(parsed.hour);
  const [localMinute, setLocalMinute] = useState<number>(parsed.minute);
  const [isNextDay, setIsNextDay] = useState<boolean>(parsed.isNextDay);

  useEffect(() => {
    const p = parseValue(value || defaultFallback);
    setLocalHour(p.hour);
    setLocalMinute(p.minute);
    setIsNextDay(p.isNextDay);
  }, [value, defaultFallback]);

  const hStr = String(localHour).padStart(2, "0");
  const mStr = String(localMinute).padStart(2, "0");

  const isPM = localHour >= 12;
  const period: "AM" | "PM" = isPM ? "PM" : "AM";

  const emitChange = (newH: number, newM: number, nextDayFlag: boolean) => {
    const validH = (newH + 24) % 24;
    const validM = (newM + 60) % 60;

    setLocalHour(validH);
    setLocalMinute(validM);
    setIsNextDay(nextDayFlag);

    const timeString = `${String(validH).padStart(2, "0")}:${String(validM).padStart(2, "0")}`;
    const finalFormatted = nextDayFlag ? `${timeString} (+1일)` : timeString;
    onChange(finalFormatted);
  };

  const handlePeriodChange = (targetPeriod: "AM" | "PM") => {
    let nextH = localHour;
    let autoNextDay = isNextDay;

    if (targetPeriod === "AM" && isPM) {
      nextH = localHour - 12;
      if (nextH >= 0 && nextH <= 5) autoNextDay = true;
    } else if (targetPeriod === "PM" && !isPM) {
      nextH = localHour + 12;
      autoNextDay = false;
    }
    emitChange(nextH, localMinute, autoNextDay);
  };

  const handleNextDayToggle = (flag: boolean) => {
    emitChange(localHour, localMinute, flag);
  };

  const adjustMinutes = (delta: number) => {
    let totalMins = localHour * 60 + localMinute + delta;
    let nextDayFlag = isNextDay;

    if (totalMins >= 24 * 60) {
      totalMins = totalMins % (24 * 60);
      nextDayFlag = true;
    } else if (totalMins < 0) {
      totalMins = (totalMins + 24 * 60) % (24 * 60);
    }

    const nH = Math.floor(totalMins / 60);
    const nM = totalMins % 60;

    if (nH >= 0 && nH <= 5 && delta > 0) {
      nextDayFlag = true;
    }

    emitChange(nH, nM, nextDayFlag);
  };

  const handlePresetClick = (presetStr: string) => {
    const [pH, pM] = presetStr.split(":").map((n) => parseInt(n, 10));
    const autoNext = pH >= 0 && pH <= 5;
    emitChange(pH, pM, autoNext);
  };

  const handleOpen = () => {
    const p = parseValue(value || defaultFallback);
    setLocalHour(p.hour);
    setLocalMinute(p.minute);
    setIsNextDay(p.isNextDay);
    setStep("hour");
    setIsOpen(true);
  };

  const CENTER = 95;
  const R_RING = 72;

  const getHourAngle = (hour: number) => (hour % 12) * 30;
  const getMinuteAngle = (min: number) => min * 6;

  const handAngle = step === "hour" ? getHourAngle(localHour) : getMinuteAngle(localMinute);
  const handRad = ((handAngle - 90) * Math.PI) / 180;
  const handX = CENTER + R_RING * Math.cos(handRad);
  const handY = CENTER + R_RING * Math.sin(handRad);

  const handleSelectHour = (hour: number) => {
    const autoNext = hour >= 0 && hour <= 5 ? true : isNextDay;
    emitChange(hour, localMinute, autoNext);
    setStep("minute");
  };

  const handleSelectMinute = (min: number) => {
    emitChange(localHour, min, isNextDay);
  };

  const hourList = isPM
    ? [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
    : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  const completionText = pickerType === "start"
    ? `시작 시간 설정 완료 (${isNextDay ? "다음날 " : ""}${hStr}:${mStr})`
    : `종료 시간 설정 완료 (${isNextDay ? "다음날 " : ""}${hStr}:${mStr})`;

  return (
    <div className="relative flex-1 min-w-0">
      {label && <label className="text-[11px] font-black text-[var(--text-sub)] block mb-1">{label}</label>}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpen} 
        className={`w-full bg-[var(--inner-box)] border ${
          isOpen ? "border-[var(--accent)] text-[var(--accent)] shadow-sm" : "border-[var(--panel-border)] text-[var(--text-main)]"
        } hover:border-[var(--accent)] rounded-xl py-2 px-1.5 text-xs font-black cursor-pointer text-center transition flex justify-center items-center gap-1 whitespace-nowrap overflow-hidden shadow-xs shrink-0 select-none`}
      >
        {badge}
        <span className="font-mono text-xs font-black shrink-0 whitespace-nowrap">
          {hStr}:{mStr}
        </span>
        {isNextDay && !badge && (
          <span className="text-[9px] bg-[var(--accent)]/20 text-[var(--accent)] px-1 py-0.2 rounded font-black shrink-0 border border-[var(--accent)]/40 leading-none">
            +1일
          </span>
        )}
        <span className={`text-[9px] text-[var(--text-sub)] transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180 text-[var(--accent)]" : ""}`}>
          ▼
        </span>
      </button>

      {/* Analog Clock Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overscroll-none animate-in fade-in duration-150 [text-size-adjust:100%]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div 
            className="bg-[var(--panel)] border-2 border-[var(--accent)]/80 rounded-2xl shadow-2xl w-full max-w-xs p-3.5 space-y-2.5 animate-in zoom-in-95 duration-150 cursor-default select-none max-h-[92vh] overflow-y-auto custom-scrollbar overscroll-contain flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="w-full flex justify-between items-center border-b border-[var(--panel-border)] pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base">⏰</span>
                <span className="text-xs font-black text-[var(--accent)]">
                  {pickerType === "start" ? "시작 시간 시계 설정" : "종료 시간 시계 설정"}
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

            {/* Step Display */}
            <div className="w-full bg-[var(--inner-box)] p-2 rounded-xl border border-[var(--panel-border)] flex items-center justify-between px-3">
              <div className="text-[11px] font-black text-[var(--text-sub)]">
                {step === "hour" ? "1단계: 시(Hour) 선택" : "2단계: 분(Minute) 선택"}
              </div>

              <div className="flex items-center gap-1 font-mono">
                <button
                  type="button"
                  onClick={() => setStep("hour")}
                  className={`px-2 py-0.5 rounded-lg text-sm font-black transition cursor-pointer ${
                    step === "hour"
                      ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs scale-105"
                      : "text-[var(--text-sub)] hover:text-white bg-black/30"
                  }`}
                >
                  {hStr}시
                </button>
                <span className="text-[var(--text-sub)] font-bold">:</span>
                <button
                  type="button"
                  onClick={() => setStep("minute")}
                  className={`px-2 py-0.5 rounded-lg text-sm font-black transition cursor-pointer ${
                    step === "minute"
                      ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs scale-105"
                      : "text-[var(--text-sub)] hover:text-white bg-black/30"
                  }`}
                >
                  {mStr}분
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="w-full space-y-1">
              <div className="w-full bg-[var(--inner-box)] p-1 rounded-xl border border-[var(--panel-border)] flex gap-1">
                <button
                  type="button"
                  onClick={() => handlePeriodChange("AM")}
                  className={`flex-1 py-1 rounded-lg text-xs font-mono font-black transition cursor-pointer text-center whitespace-nowrap ${
                    period === "AM"
                      ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-sm font-black"
                      : "text-[var(--text-sub)] hover:text-white bg-transparent"
                  }`}
                >
                  ☀️ AM
                </button>
                <button
                  type="button"
                  onClick={() => handlePeriodChange("PM")}
                  className={`flex-1 py-1 rounded-lg text-xs font-mono font-black transition cursor-pointer text-center whitespace-nowrap ${
                    period === "PM"
                      ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-sm font-black"
                      : "text-[var(--text-sub)] hover:text-white bg-transparent"
                  }`}
                >
                  🌙 PM
                </button>
              </div>

              {/* 🟢 [수정완료] 시작시간 / 종료시간 구분 없이 당일 / 다음날(+1일) 토글 바 항시 노출 */}
              <div className="w-full bg-[var(--inner-box)] p-1 rounded-xl border border-[var(--panel-border)] flex gap-1">
                <button
                  type="button"
                  onClick={() => handleNextDayToggle(false)}
                  className={`flex-1 py-1 rounded-lg text-xs font-mono font-black transition cursor-pointer text-center whitespace-nowrap ${
                    !isNextDay
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 font-black shadow-xs"
                      : "text-[var(--text-sub)] hover:text-white bg-transparent border border-transparent"
                  }`}
                >
                  📅 당일
                </button>
                <button
                  type="button"
                  onClick={() => handleNextDayToggle(true)}
                  className={`flex-1 py-1 rounded-lg text-xs font-mono font-black transition cursor-pointer text-center whitespace-nowrap ${
                    isNextDay
                      ? "bg-indigo-500/30 text-indigo-300 border border-indigo-400/60 font-black shadow-xs"
                      : "text-[var(--text-sub)] hover:text-white bg-transparent border border-transparent"
                  }`}
                >
                  🌙 다음날 (+1일)
                </button>
              </div>
            </div>

            {/* Dial Canvas */}
            <div className="relative w-[190px] h-[190px] bg-[var(--inner-box)] rounded-full border-2 border-[var(--panel-border)] shadow-inner flex items-center justify-center my-0.5 shrink-0">
              <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 190 190">
                <circle cx={CENTER} cy={CENTER} r="4" fill="var(--accent)" />
                <line
                  x1={CENTER}
                  y1={CENTER}
                  x2={handX}
                  y2={handY}
                  stroke="var(--accent)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="transition-all duration-200 ease-out"
                />
                <circle
                  cx={handX}
                  cy={handY}
                  r="13"
                  fill="var(--accent)"
                  opacity="0.3"
                  className="transition-all duration-200 ease-out"
                />
              </svg>

              {step === "hour" && (
                <>
                  {hourList.map((h) => {
                    const angle = getHourAngle(h);
                    const rad = ((angle - 90) * Math.PI) / 180;
                    const x = CENTER + R_RING * Math.cos(rad);
                    const y = CENTER + R_RING * Math.sin(rad);
                    const isSelected = localHour === h;

                    return (
                      <button
                        key={`hour-${h}`}
                        type="button"
                        onClick={() => handleSelectHour(h)}
                        style={{ left: `${x}px`, top: `${y}px` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full text-xs font-mono font-black flex items-center justify-center transition active:scale-90 cursor-pointer ${
                          isSelected
                            ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-md ring-2 ring-[var(--accent)]/50 z-10 scale-110"
                            : "text-[var(--text-main)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)]"
                        }`}
                      >
                        {String(h).padStart(2, "0")}
                      </button>
                    );
                  })}
                </>
              )}

              {step === "minute" && (
                <>
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => {
                    const angle = getMinuteAngle(m);
                    const rad = ((angle - 90) * Math.PI) / 180;
                    const x = CENTER + R_RING * Math.cos(rad);
                    const y = CENTER + R_RING * Math.sin(rad);
                    const isSelected = localMinute === m;
                    const isMainMin = m % 15 === 0;

                    return (
                      <button
                        key={`min-${m}`}
                        type="button"
                        onClick={() => handleSelectMinute(m)}
                        style={{ left: `${x}px`, top: `${y}px` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full text-xs font-mono font-black flex items-center justify-center transition active:scale-90 cursor-pointer ${
                          isMainMin ? "w-7 h-7" : "w-6 h-6 text-[10px]"
                        } ${
                          isSelected
                            ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-md ring-2 ring-[var(--accent)]/50 z-10 scale-110"
                            : isMainMin
                            ? "text-[var(--text-main)] bg-black/40 hover:bg-[var(--accent)]/20 border border-white/10"
                            : "text-[var(--text-sub)] hover:bg-[var(--accent)]/20"
                        }`}
                      >
                        {String(m).padStart(2, "0")}
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            {/* Adjust Buttons */}
            <div className="w-full border-t border-[var(--panel-border)] pt-2">
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => adjustMinutes(-60)}
                  className="text-[10px] font-bold py-1.5 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)] transition cursor-pointer active:scale-95 text-center"
                >
                  -1시간
                </button>
                <button
                  type="button"
                  onClick={() => adjustMinutes(60)}
                  className="text-[10px] font-bold py-1.5 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)] transition cursor-pointer active:scale-95 text-center"
                >
                  +1시간
                </button>
                <button
                  type="button"
                  onClick={() => adjustMinutes(-15)}
                  className="text-[10px] font-bold py-1.5 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)] transition cursor-pointer active:scale-95 text-center"
                >
                  -15분
                </button>
                <button
                  type="button"
                  onClick={() => adjustMinutes(15)}
                  className="text-[10px] font-bold py-1.5 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)] transition cursor-pointer active:scale-95 text-center"
                >
                  +15분
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="w-full border-t border-[var(--panel-border)] pt-2">
              <span className="text-[10px] font-black text-[var(--text-sub)] mb-1 block">
                ⚡ 빠른 시간 추천
              </span>
              <div className="grid grid-cols-4 gap-1">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePresetClick(p)}
                    className={`text-[11px] font-mono font-bold py-1 rounded-lg border transition cursor-pointer text-center ${
                      hStr === p.split(":")[0] && mStr === p.split(":")[1]
                        ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent font-black shadow-xs scale-105"
                        : "bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Complete Button */}
            <button
              type="button"
              onClick={() => {
                const finalFormatted = isNextDay ? `${hStr}:${mStr} (+1일)` : `${hStr}:${mStr}`;
                onChange(finalFormatted);
                setIsOpen(false);
              }}
              className="w-full py-2.5 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs rounded-xl shadow-md cursor-pointer hover:brightness-110 transition active:scale-98 mt-1"
            >
              {completionText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}