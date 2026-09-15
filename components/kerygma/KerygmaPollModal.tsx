"use client";

import { PollData } from "@/types/kerygma";

interface KerygmaPollModalProps {
  isOpen: boolean;
  onClose: () => void;
  pollForm: PollData;
  setPollForm: React.Dispatch<React.SetStateAction<PollData>>;
  onInsertPoll: () => void;
}

export default function KerygmaPollModal({
  isOpen,
  onClose,
  pollForm,
  setPollForm,
  onInsertPoll,
}: KerygmaPollModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#252528] border border-zinc-700 rounded-xl w-full max-w-[440px] max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl p-5 flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-zinc-700 pb-2.5">
          <h3 className="text-sm font-bold text-white">📊 투표 생성</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-lg cursor-pointer">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[0.7rem] font-bold text-zinc-400 block mb-1">투표 주제</label>
            <input
              type="text"
              placeholder="예: 레이드 시간"
              value={pollForm.title}
              onChange={(e) => setPollForm({ ...pollForm, title: e.target.value })}
              className="w-full bg-[#1c1c1e] border border-zinc-700 p-2 rounded text-[0.8rem] text-white outline-none"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 bg-[#1c1c1e] border border-zinc-700 rounded-lg">
            <div>
              <span className="text-[0.8rem] font-bold text-white block">익명 투표</span>
              <span className="text-[0.65rem] text-zinc-400">비활성화 시 닉네임 공개</span>
            </div>
            <input
              type="checkbox"
              checked={pollForm.isAnonymous}
              onChange={(e) => setPollForm({ ...pollForm, isAnonymous: e.target.checked })}
              className="w-4 h-4 rounded cursor-pointer accent-[var(--accent)]"
            />
          </div>

          <div>
            <label className="text-[0.7rem] font-bold text-zinc-400 block mb-1">선택 항목</label>
            <div className="space-y-1.5 mb-2">
              {pollForm.options.map((opt, idx) => (
                <input
                  key={opt.id}
                  type="text"
                  placeholder={`선택 ${idx + 1}`}
                  value={opt.text}
                  onChange={(e) => {
                    const newOpts = [...pollForm.options];
                    newOpts[idx].text = e.target.value;
                    setPollForm({ ...pollForm, options: newOpts });
                  }}
                  className="w-full bg-[#1c1c1e] border border-zinc-700 p-2 rounded text-[0.8rem] text-white outline-none"
                />
              ))}
            </div>
            <button
              onClick={() =>
                setPollForm({
                  ...pollForm,
                  options: [
                    ...pollForm.options,
                    { id: `opt-${Date.now()}`, text: "", votes: 0, voters: [] },
                  ],
                })
              }
              className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[0.75rem] font-bold rounded border border-zinc-700 cursor-pointer"
            >
              + 항목 추가
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.7rem] font-bold text-zinc-400 block mb-1">복수 선택</label>
              <select
                onChange={(e) =>
                  setPollForm({ ...pollForm, allowMultiple: e.target.value === "multi" })
                }
                className="w-full bg-[#1c1c1e] border border-zinc-700 p-2 rounded text-[0.8rem] text-white outline-none"
              >
                <option value="single">단일 선택</option>
                <option value="multi">복수 허용</option>
              </select>
            </div>
            <div>
              <label className="text-[0.7rem] font-bold text-zinc-400 block mb-1">기간</label>
              <select
                onChange={(e) => setPollForm({ ...pollForm, endDate: e.target.value })}
                className="w-full bg-[#1c1c1e] border border-zinc-700 p-2 rounded text-[0.8rem] text-white outline-none"
              >
                <option value="1일">1일</option>
                <option value="3일">3일</option>
                <option value="7일">7일</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={onInsertPoll}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-fg)] font-black py-2.5 rounded text-[0.8rem] shadow-md mt-2 cursor-pointer"
        >
          에디터에 삽입
        </button>
      </div>
    </div>
  );
}