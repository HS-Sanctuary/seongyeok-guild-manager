"use client";

import React, { useState, useRef, useMemo } from "react";

interface CharacterManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  manageList: any[];
  setManageList: React.Dispatch<React.SetStateAction<any[]>>;
  dbClasses: any[];
  CLASS_TITLES: Record<string, string[]>;
  saveManageModal: () => void;
}

export default function CharacterManageModal({
  isOpen,
  onClose,
  manageList,
  setManageList,
  dbClasses,
  CLASS_TITLES,
  saveManageModal,
}: CharacterManageModalProps) {
  const [isHowToOpen, setIsHowToOpen] = useState(false);
  const dragItemIndex = useRef<number | null>(null);

  // 🎯 DB에 등록된 활성 클래스 목록 필터링 (is_active: true)
  const activeDbClasses = useMemo(() => {
    if (!dbClasses || dbClasses.length === 0) return [];
    return dbClasses.filter((cls: any) => cls.is_active ?? true);
  }, [dbClasses]);

  if (!isOpen) return null;

  // DB에 등록된 첫 번째 활성 직업을 기본값으로 채택
  const defaultJob =
    activeDbClasses.length > 0
      ? activeDbClasses[0].name
      : Object.keys(CLASS_TITLES)[0] || "전사";

  const addManageCharacter = () => {
    setManageList([
      ...manageList,
      {
        originalName: "",
        tempAlias: "",
        tempNickname: "새캐릭",
        tempJob: defaultJob,
        isMain: false,
        isDeleted: false,
        sort_order: manageList.length,
        isNew: true,
      },
    ]);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItemIndex.current = index;
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    if (
      dragItemIndex.current === null ||
      dragItemIndex.current === index
    )
      return;
    const newList = [...manageList];
    const draggedItem = newList[dragItemIndex.current];
    newList.splice(dragItemIndex.current, 1);
    newList.splice(index, 0, draggedItem);
    dragItemIndex.current = index;
    setManageList(newList.map((item, idx) => ({ ...item, sort_order: idx })));
  };

  const handleSetMain = (index: number) => {
    setManageList((prev) =>
      prev.map((item, idx) => ({ ...item, isMain: idx === index }))
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-2 md:p-4 backdrop-blur-xs">
      <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl w-[98%] max-w-2xl max-h-[88vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-2.5 md:p-3 border-b border-[var(--panel-border)] flex justify-between items-center bg-[var(--inner-box)]">
          <h2 className="text-xs md:text-base font-black text-[var(--accent)]">
            ⚙️ 캐릭터 등록 및 관리
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-sub)] hover:text-[var(--text-main)] text-sm cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        <div className="p-1.5 md:p-3 overflow-y-auto custom-scrollbar flex-1 space-y-1.5">
          <button
            type="button"
            onClick={() => setIsHowToOpen(!isHowToOpen)}
            className="w-full text-left text-xs text-[var(--accent)] bg-[var(--inner-box)] border border-[var(--panel-border)] px-2 py-1 rounded-lg font-bold hover:bg-[var(--accent-soft)] transition flex justify-between items-center cursor-pointer"
          >
            <span>📖 [사용 방법]</span>
            <span className="text-[10px]">{isHowToOpen ? "▲ 닫기" : "▼ 펼치기"}</span>
          </button>

          {isHowToOpen && (
            <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-2 rounded-lg text-xs space-y-1 text-[var(--text-sub)]">
              <p>● :: 핸들을 움직여 순서를 변경 할 수 있습니다!</p>
              <p>● 애칭은 최대 세글자(3자)까지 입력 가능합니다!</p>
              <p>● 닉네임은 인게임 닉네임을 정확히 입력해주세요!</p>
              <p>● 대표 캐릭터는 한 캐릭터만 지정할 수 있습니다!</p>
            </div>
          )}

          {manageList.map(
            (char, index) =>
              !char.isDeleted && (
                <div
                  key={index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex items-center gap-1 bg-[var(--inner-box)] p-1 rounded-lg border border-[var(--panel-border)] transition hover:border-[var(--accent)]/50 min-w-0"
                >
                  <div className="flex items-center text-[var(--text-sub)] font-mono cursor-grab active:cursor-grabbing shrink-0 select-none text-[10px] leading-none">
                    <span className="font-bold text-[11px] text-[var(--text-sub)]">
                      ::
                    </span>
                    <span className="font-bold text-[var(--accent)] min-w-[10px] text-center">
                      {index + 1}
                    </span>
                  </div>

                  <input
                    value={char.tempAlias}
                    maxLength={3}
                    placeholder="애칭(3자)"
                    onChange={(e) => {
                      const nw = [...manageList];
                      nw[index].tempAlias = e.target.value.slice(0, 3);
                      setManageList(nw);
                    }}
                    className="w-12 sm:w-14 bg-[var(--panel)] border border-[var(--panel-border)] rounded px-1 py-1 text-[11px] text-[var(--text-main)] focus:border-[var(--accent)] outline-none text-center shrink-0 font-bold"
                  />

                  <input
                    value={char.tempNickname}
                    placeholder="닉네임"
                    onChange={(e) => {
                      const nw = [...manageList];
                      nw[index].tempNickname = e.target.value;
                      setManageList(nw);
                    }}
                    className="flex-1 min-w-[48px] bg-[var(--panel)] border border-[var(--panel-border)] rounded px-1 py-1 text-[11px] text-[var(--text-main)] focus:border-[var(--accent)] outline-none font-medium"
                  />

                  {/* 🎯 nexus_classes DB 실시간 연동 동적 직업 셀렉트 박스 */}
                  <select
                    value={char.tempJob}
                    onChange={(e) => {
                      const nw = [...manageList];
                      nw[index].tempJob = e.target.value;
                      setManageList(nw);
                    }}
                    className="w-[72px] sm:w-24 bg-zinc-900 text-zinc-100 border border-zinc-700 rounded px-1 py-1 text-[10px] sm:text-xs font-bold outline-none focus:border-[var(--accent)] shrink-0 cursor-pointer"
                  >
                    {activeDbClasses.length > 0 ? (
                      <>
                        {/* 🛡️ 기존 직업이 비활성화되었거나 목록에 없을 경우 방어적 옵션 표시 */}
                        {!activeDbClasses.some((cls: any) => cls.name === char.tempJob) && char.tempJob && (
                          <option value={char.tempJob} className="bg-zinc-900 text-amber-400 font-bold">
                            {char.tempJob} (보존)
                          </option>
                        )}
                        {activeDbClasses.map((cls: any) => (
                          <option
                            key={cls.id || cls.name}
                            value={cls.name}
                            className="bg-zinc-900 text-zinc-100 font-bold"
                          >
                            {cls.name}
                          </option>
                        ))}
                      </>
                    ) : (
                      Object.keys(CLASS_TITLES).map((clsName) => (
                        <option
                          key={clsName}
                          value={clsName}
                          className="bg-zinc-900 text-zinc-100 font-bold"
                        >
                          {clsName}
                        </option>
                      ))
                    )}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleSetMain(index)}
                    className={`px-1.5 py-1 rounded text-[10px] sm:text-xs font-bold shrink-0 transition cursor-pointer ${
                      char.isMain
                        ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                        : "bg-[var(--panel)] text-[var(--text-sub)] border border-[var(--panel-border)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    대표
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `정말 [${
                            char.tempAlias || char.tempNickname
                          }] 캐릭터를 삭제하시겠습니까?`
                        )
                      ) {
                        const nw = [...manageList];
                        nw[index].isDeleted = true;
                        setManageList(nw);
                      }
                    }}
                    className="bg-red-950/40 text-red-400 border border-red-800/50 px-1.5 py-1 rounded text-[10px] sm:text-xs font-bold hover:bg-red-900/60 shrink-0 cursor-pointer"
                  >
                    삭제
                  </button>
                </div>
              )
          )}

          <button
            type="button"
            onClick={addManageCharacter}
            className="w-full border border-dashed border-[var(--accent)] text-[var(--accent)] py-1.5 rounded-lg hover:bg-[var(--accent-soft)] font-bold text-xs transition cursor-pointer"
          >
            + 새 캐릭터 추가
          </button>
        </div>

        <div className="p-2 border-t border-[var(--panel-border)] bg-[var(--inner-box)] flex justify-end gap-1.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-[var(--panel)] text-[var(--text-sub)] text-xs font-bold transition cursor-pointer hover:text-[var(--text-main)]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={saveManageModal}
            className="px-4 py-1 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-black transition cursor-pointer hover:opacity-90"
          >
            변경사항 저장
          </button>
        </div>
      </div>
    </div>
  );
}