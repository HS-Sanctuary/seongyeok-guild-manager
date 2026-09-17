"use client";

import { useEffect, useState } from "react";
import { PollData } from "@/types/kerygma";

interface KerygmaPollModalProps {
  isOpen: boolean;
  onClose: () => void;
  pollForm: PollData;
  setPollForm: React.Dispatch<React.SetStateAction<PollData>>;
  onInsertPoll: (pollData: PollData) => void;
}

export default function KerygmaPollModal({
  isOpen,
  onClose,
  pollForm,
  setPollForm,
  onInsertPoll,
}: KerygmaPollModalProps) {
  const [draftPrompt, setDraftPrompt] = useState<PollData | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (typeof window !== "undefined") {
        const savedDraft = localStorage.getItem("kerygma_poll_draft");
        if (
          savedDraft &&
          !pollForm.title.trim() &&
          !pollForm.options.some((o) => o.text.trim())
        ) {
          try {
            const parsed = JSON.parse(savedDraft);
            if (
              parsed &&
              (parsed.title?.trim() ||
                parsed.options?.some((o: any) => o.text?.trim()))
            ) {
              setDraftPrompt(parsed);
            }
          } catch (e) {
            console.error("Poll draft parse error:", e);
          }
        }
      }
    } else {
      setDraftPrompt(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSafeClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, pollForm]);

  const handleSafeClose = () => {
    const hasData =
      pollForm.title.trim() !== "" ||
      pollForm.options.some((opt) => opt.text.trim() !== "");

    if (hasData) {
      if (typeof window !== "undefined") {
        localStorage.setItem("kerygma_poll_draft", JSON.stringify(pollForm));
      }
    }
    onClose();
  };

  const handleAcceptDraft = () => {
    if (draftPrompt) {
      setPollForm(draftPrompt);
    }
    setDraftPrompt(null);
  };

  const handleRejectDraft = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("kerygma_poll_draft");
    }
    setDraftPrompt(null);
  };

  const handleConfirm = () => {
    if (!pollForm.title.trim()) return alert("투표 주제를 입력하세요.");
    const validOptions = pollForm.options.filter((o) => o.text.trim() !== "");
    if (validOptions.length < 2) return alert("선택 항목을 2개 이상 입력하세요.");

    const finalPoll: PollData = {
      ...pollForm,
      options: validOptions.map((opt, i) => ({
        ...opt,
        id: opt.id || `opt-${Date.now()}-${i}`,
        votes: opt.votes || 0,
        voters: opt.voters || [],
      })),
    };

    if (typeof window !== "undefined") {
      localStorage.removeItem("kerygma_poll_draft");
    }

    onInsertPoll(finalPoll);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto"
      onClick={handleSafeClose}
    >
      <div
        className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl w-full max-w-[420px] max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl p-4 sm:p-6 flex flex-col gap-4 border-l-4 border-l-[var(--accent)] relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {draftPrompt ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 border-b border-[var(--panel-border)] pb-3">
              <h3 className="text-sm font-bold text-[var(--text-main)]">
                임시저장된 투표 데이터
              </h3>
            </div>
            <p className="text-xs text-[var(--text-sub)] leading-relaxed">
              이전에 작성하던 투표 데이터가 존재합니다. 불러오시겠습니까?
            </p>
            <div className="p-3 bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl space-y-1">
              <p className="text-xs font-bold text-[var(--accent)] truncate">
                주제: {draftPrompt.title || "(주제 미입력)"}
              </p>
              <p className="text-[11px] text-[var(--text-sub)]">
                항목 수: {draftPrompt.options?.length || 0}개
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleRejectDraft}
                className="px-4 py-2 bg-[var(--inner-box)] border border-[var(--panel-border)] hover:bg-[var(--panel-hover)] text-[var(--text-main)] text-xs font-bold rounded-xl transition cursor-pointer"
              >
                새로 작성
              </button>
              <button
                type="button"
                onClick={handleAcceptDraft}
                className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-fg)] text-xs font-extrabold rounded-xl transition shadow cursor-pointer"
              >
                불러오기
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-3 shrink-0">
              <h3 className="text-sm font-bold text-[var(--text-main)]">
                투표 설정
              </h3>
              <button
                type="button"
                onClick={handleSafeClose}
                className="text-[var(--text-sub)] hover:text-[var(--text-main)] text-xs font-bold cursor-pointer p-1 transition"
                title="닫기"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-sub)] block mb-1">
                  투표 주제
                </label>
                <input
                  type="text"
                  placeholder="예: 레이드 시간 선호도 조사"
                  value={pollForm.title}
                  onChange={(e) => setPollForm({ ...pollForm, title: e.target.value })}
                  className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] p-2.5 rounded-xl text-xs text-[var(--text-main)] placeholder:text-[var(--text-sub)]/50 outline-none focus:border-[var(--accent)] transition"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl">
                <div>
                  <span className="text-xs font-bold text-[var(--text-main)] block">익명 투표</span>
                  <span className="text-[10px] text-[var(--text-sub)]">
                    비활성화 시 닉네임이 공개됩니다
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={pollForm.isAnonymous}
                  onChange={(e) => setPollForm({ ...pollForm, isAnonymous: e.target.checked })}
                  className="w-4 h-4 rounded cursor-pointer accent-[var(--accent)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--text-sub)] block mb-1">
                  선택 항목
                </label>
                <div className="space-y-2 mb-2">
                  {pollForm.options.map((opt, idx) => (
                    <div key={opt.id || idx} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder={`선택 ${idx + 1}`}
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...pollForm.options];
                          newOpts[idx].text = e.target.value;
                          setPollForm({ ...pollForm, options: newOpts });
                        }}
                        className="flex-1 bg-[var(--inner-box)] border border-[var(--panel-border)] p-2.5 rounded-xl text-xs text-[var(--text-main)] placeholder:text-[var(--text-sub)]/50 outline-none focus:border-[var(--accent)] transition"
                      />
                      {pollForm.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = pollForm.options.filter((_, i) => i !== idx);
                            setPollForm({ ...pollForm, options: newOpts });
                          }}
                          className="px-2.5 py-2.5 text-xs text-red-400 hover:text-red-300 bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-red-500/50 rounded-xl transition cursor-pointer"
                          title="항목 삭제"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPollForm({
                      ...pollForm,
                      options: [
                        ...pollForm.options,
                        { id: `opt-${Date.now()}`, text: "", votes: 0, voters: [] },
                      ],
                    })
                  }
                  className="w-full py-2 bg-[var(--inner-box)] hover:bg-[var(--panel-hover)] text-[var(--text-main)] hover:text-[var(--accent)] text-xs font-bold rounded-xl border border-[var(--panel-border)] hover:border-[var(--accent)] cursor-pointer transition"
                >
                  + 항목 추가
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-sub)] block mb-1">
                    복수 선택
                  </label>
                  <select
                    value={pollForm.allowMultiple ? "multi" : "single"}
                    onChange={(e) =>
                      setPollForm({ ...pollForm, allowMultiple: e.target.value === "multi" })
                    }
                    className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] p-2.5 rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition cursor-pointer"
                  >
                    <option value="single">단일 선택</option>
                    <option value="multi">복수 허용</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-sub)] block mb-1">
                    마감 기간
                  </label>
                  <select
                    value={pollForm.endDate || "1일"}
                    onChange={(e) => setPollForm({ ...pollForm, endDate: e.target.value })}
                    className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] p-2.5 rounded-xl text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition cursor-pointer"
                  >
                    <option value="1일">1일</option>
                    <option value="3일">3일</option>
                    <option value="7일">7일</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-fg)] font-extrabold py-3 rounded-xl text-xs shadow-md mt-1 cursor-pointer active:scale-95 transition shrink-0"
            >
              투표 적용하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}