"use client";

import { useRouter } from "next/navigation";
import ClassIcon from "@/components/common/ClassIcon";

interface CharacterSelectorProps {
  profile: any;
  myCharacters: any[];
  switchCharacter: (targetName: string) => void;
  openManageModal: () => void;
  dbClasses: any[];
  CLASS_TITLES: Record<string, string[]>;
  updateProfile: (field: string, value: any) => void;
  totalLevel: number;
  isTitleAccordionOpen: boolean;
  setIsTitleAccordionOpen: (open: boolean) => void;
  earnedTitles: any[];
}

export default function CharacterSelector({
  profile,
  myCharacters,
  switchCharacter,
  openManageModal,
  dbClasses,
  CLASS_TITLES,
  updateProfile,
  totalLevel,
  isTitleAccordionOpen,
  setIsTitleAccordionOpen,
  earnedTitles,
}: CharacterSelectorProps) {
  const router = useRouter();

  return (
    <div className="space-y-2">
      {/* 캐릭터 헤더 프로필 */}
      <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-2 gap-2 min-w-0">
        
        {/* 좌측: 주클래스 SVG + 닉네임 + 직업 선택 드롭다운 */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* 🎨 팔레트 아이콘 대신 주클래스 SVG 동적 반영 */}
          <div className="w-9 h-9 md:w-10 md:h-10 bg-[var(--inner-box)] rounded-xl border border-[var(--panel-border)] flex items-center justify-center shrink-0 shadow-inner">
            <ClassIcon job={profile.job || "전사"} className="w-5 h-5 md:w-6 md:h-6" />
          </div>

          <div className="min-w-0 flex-1">
            {/* 모바일/데스크톱 겹침 방지 Flex 레이아웃 */}
            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap leading-tight min-w-0">
              {/* 닉네임 (데스크톱) */}
              <span className="hidden md:inline text-base font-black text-[var(--text-main)] truncate max-w-[150px]">
                {profile.nickname}
              </span>
              {/* 닉네임 (모바일) */}
              <span className="md:hidden text-xs sm:text-sm font-black text-[var(--text-main)] truncate max-w-[75px] sm:max-w-[100px]">
                {profile.alias || profile.nickname}
              </span>

              {/* 직업 선택 드롭다운 (너비 초과 방지 max-w 설정) */}
              <select
                value={profile.job || "전사"}
                onChange={(e) => updateProfile("job", e.target.value)}
                className="text-[11px] sm:text-xs bg-[var(--inner-box)] border border-[var(--panel-border)] px-1 py-0.5 rounded font-bold text-[var(--accent)] outline-none cursor-pointer hover:border-[var(--accent)] shrink-0 max-w-[90px] sm:max-w-none truncate"
              >
                {dbClasses.length > 0
                  ? dbClasses.map((cls: any) => (
                      <option
                        key={cls.name}
                        value={cls.name}
                        className="bg-[var(--panel)] text-[var(--text-main)]"
                      >
                        {cls.name}
                      </option>
                    ))
                  : Object.keys(CLASS_TITLES).map((clsName) => (
                      <option
                        key={clsName}
                        value={clsName}
                        className="bg-[var(--panel)] text-[var(--text-main)]"
                      >
                        {clsName}
                      </option>
                    ))}
              </select>

              {/* 대표 캐릭터 태그 */}
              {profile.isMain && (
                <span className="text-[9px] sm:text-[10px] bg-[var(--accent)] text-[var(--accent-fg)] font-black px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">
                  대표
                </span>
              )}
            </div>

            <div className="text-[11px] sm:text-xs text-[var(--text-sub)] font-bold mt-0.5 whitespace-nowrap">
              누적 레벨 : {totalLevel}
            </div>
          </div>
        </div>

        {/* 우측: 장비상세 / 칭호보기 버튼 (너비 고정 shrink-0) */}
        <div className="flex flex-col gap-1 shrink-0 ml-1">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/character/detail?char=${encodeURIComponent(
                  profile.nickname
                )}`
              )
            }
            className="px-2 py-0.5 text-center bg-[var(--accent)] text-[var(--accent-fg)] text-[10px] sm:text-[11px] md:text-xs font-black rounded-md shadow-xs transition hover:opacity-90 whitespace-nowrap cursor-pointer"
          >
            🔍 장비상세
          </button>
          <button
            type="button"
            onClick={() =>
              setIsTitleAccordionOpen(!isTitleAccordionOpen)
            }
            className="px-2 py-0.5 text-center bg-[var(--inner-box)] border border-[var(--panel-border)] text-[10px] sm:text-[11px] md:text-xs font-bold text-[var(--accent)] rounded-md transition whitespace-nowrap hover:bg-[var(--accent-soft)] cursor-pointer"
          >
            ✨ 칭호보기
          </button>
        </div>
      </div>

      {/* 칭호 펼침 아코디언 */}
      {isTitleAccordionOpen && (
        <div className="p-2 border rounded-lg border-[var(--panel-border)] bg-[var(--inner-box)] space-y-1 text-xs">
          {earnedTitles.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
              {earnedTitles.map((t) => (
                <div
                  key={t.type}
                  className={`text-xs font-black p-1.5 rounded border text-center truncate ${t.tagClass}`}
                >
                  {t.name}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[var(--text-sub)] text-center py-0.5">
              아고라 랭킹을 달성해 칭호를 획득해 보세요.
            </div>
          )}
        </div>
      )}

      {/* 캐릭터 스위처 버튼 목록 */}
      <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-1.5 md:p-2.5 shadow-xs space-y-2">
        <div className="flex items-center justify-between gap-1 text-xs font-bold text-[var(--text-sub)] px-1">
          <span className="flex items-center gap-1 whitespace-nowrap shrink-0 text-xs md:text-sm">
            캐릭터 선택
            <span className="text-[12px] text-[var(--text-sub)] font-normal md:hidden">
              ({myCharacters.length})
            </span>
          </span>
          <button
            type="button"
            onClick={openManageModal}
            className="text-[11px] md:text-xs bg-[var(--inner-box)] text-[var(--text-main)] font-bold px-2 py-1 rounded-md border border-[var(--panel-border)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition shadow-xs cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            ⚙️ 캐릭터 등록 및 관리
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1.5 md:gap-2 w-full">
          {myCharacters.map((char: any) => {
            const mobileAlias = (char.alias || char.nickname).slice(0, 3);
            const isSelected = char.nickname === profile.nickname;

            return (
              <button
                key={char.nickname}
                type="button"
                onClick={() => switchCharacter(char.nickname)}
                className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition cursor-pointer select-none w-full min-w-0 ${
                  isSelected
                    ? "bg-[var(--accent-soft)] border-[var(--accent)] shadow-xs"
                    : "bg-[var(--inner-box)] border-[var(--panel-border)] hover:border-[var(--accent)]/50"
                }`}
              >
                <span className="md:hidden text-xs font-black leading-none text-center truncate w-full">
                  <span
                    className={
                      isSelected
                        ? "text-[var(--accent)]"
                        : "text-[var(--text-main)]"
                    }
                  >
                    {mobileAlias}
                  </span>
                </span>

                <div className="hidden md:flex flex-col items-center justify-center w-full gap-0.5 min-w-0 text-center">
                  <span
                    className={`text-xs font-black truncate w-full text-center ${
                      isSelected
                        ? "text-[var(--accent)]"
                        : "text-[var(--text-main)]"
                    }`}
                  >
                    {char.nickname}
                  </span>
                  <span className="text-[10px] text-[var(--text-sub)] font-bold truncate w-full text-center">
                    {char.job || "전사"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}