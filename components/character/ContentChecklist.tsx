"use client";

interface ContentChecklistProps {
  activeTab: string;
  visibleDailyList: any[];
  visibleWeeklyList: any[];
  abyssList: any[];
  raidList: any[];
  dailyChecks: number[];
  setDailyChecks: React.Dispatch<React.SetStateAction<number[]>>;
  weeklyChecks: number[];
  setWeeklyChecks: React.Dispatch<React.SetStateAction<number[]>>;
  repeatChecks: Record<number, boolean[]>;
  updateRepeatCount: (id: number, delta: number, max: number) => void;
  abyssChecks: number[];
  setAbyssChecks: React.Dispatch<React.SetStateAction<number[]>>;
  raidChecks: number[];
  setRaidChecks: React.Dispatch<React.SetStateAction<number[]>>;
  handleSmartToggle: (type: string) => void;
  isDailyAllChecked: boolean;
  isWeeklyAllChecked: boolean;
  isAbyssAllChecked: boolean;
  isRaidAllChecked: boolean;
}

export default function ContentChecklist({
  activeTab,
  visibleDailyList,
  visibleWeeklyList,
  abyssList,
  raidList,
  dailyChecks,
  setDailyChecks,
  weeklyChecks,
  setWeeklyChecks,
  repeatChecks,
  updateRepeatCount,
  abyssChecks,
  setAbyssChecks,
  raidChecks,
  setRaidChecks,
  handleSmartToggle,
  isDailyAllChecked,
  isWeeklyAllChecked,
  isAbyssAllChecked,
  isRaidAllChecked,
}: ContentChecklistProps) {
  const cleanItemName = (name: string) =>
    (name || "").replace(/^어비스\s*-\s*/, "").replace(/^레이드\s*-\s*/, "");

  const calculateProgress = () => {
    let total = 0;
    let completed = 0;

    const countList = (list: any[], checks: number[]) => {
      list.forEach((item) => {
        if (item.type?.startsWith("repeat")) {
          const max = item.max_count || 1;
          const current = (repeatChecks[item.id] || []).filter(Boolean).length;
          total += max;
          completed += current;
        } else {
          total += 1;
          if (checks.includes(item.id)) completed += 1;
        }
      });
    };

    if (activeTab === "all" || activeTab === "weekly_daily") {
      countList(visibleDailyList, dailyChecks);
      countList(visibleWeeklyList, weeklyChecks);
    }
    if (activeTab === "all" || activeTab === "abyss_raid") {
      countList(abyssList, abyssChecks);
      countList(raidList, raidChecks);
    }

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  };

  const { completed, total, percent } = calculateProgress();

  const renderTask = (
    item: any,
    type: "daily" | "weekly" | "abyss" | "raid"
  ) => {
    const pcName = cleanItemName(item.name);
    const mobileDisplayName =
      item.mobile_name && item.mobile_name.trim()
        ? item.mobile_name
        : pcName;

    if (item.type?.startsWith("repeat")) {
      const currentCount = (repeatChecks[item.id] || []).filter(Boolean).length;
      const isMax = currentCount === item.max_count;
      const showBadge =
        item.type === "repeat_daily" || item.type === "repeat_weekend";
      const badgeText = item.type === "repeat_daily" ? "일간" : "주말";

      return (
        <div
          key={item.id}
          className={`flex items-center justify-between p-1.5 md:p-2 rounded-lg border transition-all ${
            isMax
              ? "bg-[var(--accent-soft)] border-[var(--accent)]"
              : "bg-[var(--inner-box)] border-[var(--panel-border)]"
          }`}
        >
          <div className="flex flex-col min-w-0 pr-1 flex-1">
            {showBadge && (
              <span
                className={`text-[10px] w-fit px-1 py-0.2 rounded font-bold mb-0.5 ${
                  isMax
                    ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                    : "bg-[var(--panel)] text-[var(--text-sub)]"
                }`}
              >
                {badgeText}
              </span>
            )}
            <span
              className={`md:hidden text-xs font-black leading-snug break-keep ${
                isMax ? "text-[var(--accent)]" : "text-[var(--text-main)]"
              }`}
            >
              {mobileDisplayName}
            </span>
            <span
              className={`hidden md:block text-xs md:text-sm font-bold leading-snug break-keep ${
                isMax ? "text-[var(--accent)]" : "text-[var(--text-main)]"
              }`}
            >
              {pcName}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-[var(--panel)] px-1.5 py-0.5 rounded border border-[var(--panel-border)] shrink-0">
            <button
              type="button"
              onClick={() => updateRepeatCount(item.id, -1, item.max_count)}
              className="w-4 h-4 flex justify-center items-center rounded bg-[var(--inner-box)] text-[var(--text-sub)] hover:text-[var(--text-main)] text-xs font-black cursor-pointer border border-[var(--panel-border)]"
            >
              -
            </button>
            <span
              className={`text-xs font-black min-w-[24px] text-center ${
                isMax ? "text-[var(--accent)]" : "text-[var(--text-sub)]"
              }`}
            >
              {currentCount}/{item.max_count}
            </span>
            <button
              type="button"
              onClick={() => updateRepeatCount(item.id, 1, item.max_count)}
              className="w-4 h-4 flex justify-center items-center rounded bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
      );
    }

    let checks: number[] = [];
    let setChecks: any;
    if (type === "daily") {
      checks = dailyChecks;
      setChecks = setDailyChecks;
    } else if (type === "weekly") {
      checks = weeklyChecks;
      setChecks = setWeeklyChecks;
    } else if (type === "abyss") {
      checks = abyssChecks;
      setChecks = setAbyssChecks;
    } else if (type === "raid") {
      checks = raidChecks;
      setChecks = setRaidChecks;
    }

    const isChecked = checks.includes(item.id);

    const getColorTheme = () => {
      if (!isChecked)
        return {
          wrapper:
            "bg-[var(--inner-box)] border-[var(--panel-border)] hover:border-[var(--accent)]",
          text: "text-[var(--text-main)]",
          box: "bg-[var(--panel)] border-[var(--panel-border)]",
        };
      if (type === "daily")
        return {
          wrapper: "bg-amber-500/10 border-amber-500/50",
          text: "text-amber-400 font-bold",
          box: "bg-amber-500 text-white",
        };
      if (type === "weekly")
        return {
          wrapper: "bg-blue-500/10 border-blue-500/50",
          text: "text-blue-400 font-bold",
          box: "bg-blue-500 text-white",
        };
      if (type === "abyss" || type === "raid")
        return {
          wrapper: "bg-emerald-500/15 border-emerald-500/60",
          text: "text-emerald-400 font-bold",
          box: "bg-emerald-500 text-black font-bold",
        };
      return { wrapper: "", text: "", box: "" };
    };

    const theme = getColorTheme();

    return (
      <div
        key={item.id}
        onClick={() =>
          setChecks(
            isChecked
              ? checks.filter((i: number) => i !== item.id)
              : [...checks, item.id]
          )
        }
        className={`flex items-center justify-between p-1.5 md:p-2 rounded-lg cursor-pointer border transition-all min-w-0 ${theme.wrapper}`}
      >
        <span
          className={`md:hidden text-xs font-black leading-tight break-keep pr-1 min-w-0 ${theme.text}`}
        >
          {mobileDisplayName}
        </span>
        <span
          className={`hidden md:block text-xs md:text-sm font-bold leading-tight break-keep pr-1 min-w-0 ${theme.text}`}
        >
          {pcName}
        </span>

        <div
          className={`w-4 h-4 rounded flex items-center justify-center transition-all shrink-0 ${theme.box}`}
        >
          {isChecked && (
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>
    );
  };

  const mobileRepeatTasks = [
    ...visibleWeeklyList.filter((t: any) => t.type?.startsWith("repeat")),
    ...visibleDailyList.filter((t: any) => t.type?.startsWith("repeat")),
  ];

  const mobileDailyChecklists = visibleDailyList.filter(
    (t: any) => !t.type?.startsWith("repeat")
  );
  const mobileWeeklyChecklists = visibleWeeklyList.filter(
    (t: any) => !t.type?.startsWith("repeat")
  );

  return (
    <div className="space-y-2.5">
      {/* 📊 슬림 진척도 프로그레스 바 */}
      {total > 0 && (
        <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-2.5 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-[var(--text-sub)]">🎯 숙제 달성률</span>
            <span className="text-[var(--accent)] font-mono">
              {completed} / {total} ({percent}%)
            </span>
          </div>
          <div className="w-full bg-[var(--inner-box)] h-2 rounded-full overflow-hidden border border-[var(--panel-border)]">
            <div
              className="bg-[var(--accent)] h-full transition-all duration-300 rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {/* 모바일 레이아웃 */}
      <div className="block md:hidden space-y-2.5">
        {(activeTab === "all" || activeTab === "weekly_daily") &&
          mobileRepeatTasks.length > 0 && (
            <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-2 shadow-xs space-y-1.5">
              <h3 className="font-bold text-[var(--accent)] text-xs border-b border-[var(--panel-border)] pb-1">
                ⏳ 주간/일일 반복 컨텐츠
              </h3>
              <div className="space-y-1">
                {mobileRepeatTasks.map((item: any) =>
                  renderTask(
                    item,
                    item.type?.includes("daily") ? "daily" : "weekly"
                  )
                )}
              </div>
            </div>
          )}

        {(activeTab === "all" || activeTab === "weekly_daily") && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-1.5 shadow-xs flex flex-col min-w-0">
              <div className="flex justify-between items-center mb-1 border-b border-[var(--panel-border)] pb-1">
                <h3 className="font-bold text-amber-400 text-xs">일일 숙제</h3>
                <button
                  type="button"
                  onClick={() => handleSmartToggle("daily")}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--accent-fg)] cursor-pointer"
                >
                  {isDailyAllChecked ? "전체 해제" : "전체 완료"}
                </button>
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                {mobileDailyChecklists.map((item: any) =>
                  renderTask(item, "daily")
                )}
              </div>
            </div>

            <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-1.5 shadow-xs flex flex-col min-w-0">
              <div className="flex justify-between items-center mb-1 border-b border-[var(--panel-border)] pb-1">
                <h3 className="font-bold text-blue-400 text-xs">주간 숙제</h3>
                <button
                  type="button"
                  onClick={() => handleSmartToggle("weekly")}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--accent-fg)] cursor-pointer"
                >
                  {isWeeklyAllChecked ? "전체 해제" : "전체 완료"}
                </button>
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                {mobileWeeklyChecklists.map((item: any) =>
                  renderTask(item, "weekly")
                )}
              </div>
            </div>
          </div>
        )}

        {(activeTab === "all" || activeTab === "abyss_raid") && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-1.5 shadow-xs flex flex-col min-w-0">
              <div className="flex justify-between items-center mb-1 border-b border-[var(--panel-border)] pb-1">
                <h3 className="font-bold text-emerald-400 text-xs">어비스</h3>
                <button
                  type="button"
                  onClick={() => handleSmartToggle("abyss")}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--accent-fg)] cursor-pointer"
                >
                  {isAbyssAllChecked ? "전체 해제" : "전체 완료"}
                </button>
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                {abyssList.map((item: any) => renderTask(item, "abyss"))}
              </div>
            </div>

            <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-1.5 shadow-xs flex flex-col min-w-0">
              <div className="flex justify-between items-center mb-1 border-b border-[var(--panel-border)] pb-1">
                <h3 className="font-bold text-emerald-400 text-xs">레이드</h3>
                <button
                  type="button"
                  onClick={() => handleSmartToggle("raid")}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--accent-fg)] cursor-pointer"
                >
                  {isRaidAllChecked ? "전체 해제" : "전체 완료"}
                </button>
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                {raidList.map((item: any) => renderTask(item, "raid"))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PC / 태블릿 뷰 */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {(activeTab === "all" || activeTab === "weekly_daily") && (
          <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-3 shadow-xs flex flex-col">
            <div className="flex justify-between items-center mb-3 border-b border-[var(--panel-border)] pb-2 gap-2">
              <h3 className="font-bold text-amber-400 text-sm whitespace-nowrap">
                일일 컨텐츠
              </h3>
              <button
                type="button"
                onClick={() => handleSmartToggle("daily")}
                className={`text-xs font-bold px-2.5 py-1 rounded transition shadow-xs whitespace-nowrap cursor-pointer ${
                  isDailyAllChecked
                    ? "bg-[var(--inner-box)] text-[var(--text-sub)] border border-[var(--panel-border)]"
                    : "bg-[var(--accent)] text-[var(--accent-fg)]"
                }`}
              >
                {isDailyAllChecked ? "전체 해제" : "전체 완료"}
              </button>
            </div>
            <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {visibleDailyList.map((item: any) => renderTask(item, "daily"))}
            </div>
          </div>
        )}

        {(activeTab === "all" || activeTab === "weekly_daily") && (
          <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-3 shadow-xs flex flex-col">
            <div className="flex justify-between items-center mb-3 border-b border-[var(--panel-border)] pb-2 gap-2">
              <h3 className="font-bold text-blue-400 text-sm whitespace-nowrap">
                주간 컨텐츠
              </h3>
              <button
                type="button"
                onClick={() => handleSmartToggle("weekly")}
                className={`text-xs font-bold px-2.5 py-1 rounded transition shadow-xs whitespace-nowrap cursor-pointer ${
                  isWeeklyAllChecked
                    ? "bg-[var(--inner-box)] text-[var(--text-sub)] border border-[var(--panel-border)]"
                    : "bg-[var(--accent)] text-[var(--accent-fg)]"
                }`}
              >
                {isWeeklyAllChecked ? "전체 해제" : "전체 완료"}
              </button>
            </div>
            <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {visibleWeeklyList.map((item: any) => renderTask(item, "weekly"))}
            </div>
          </div>
        )}

        {(activeTab === "all" || activeTab === "abyss_raid") && (
          <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-3 shadow-xs flex flex-col">
            <div className="flex justify-between items-center mb-3 border-b border-[var(--panel-border)] pb-2 gap-2">
              <h3 className="font-bold text-emerald-400 text-sm whitespace-nowrap">
                어비스 관리
              </h3>
              <button
                type="button"
                onClick={() => handleSmartToggle("abyss")}
                className={`text-xs font-bold px-2.5 py-1 rounded transition shadow-xs whitespace-nowrap cursor-pointer ${
                  isAbyssAllChecked
                    ? "bg-[var(--inner-box)] text-[var(--text-sub)] border border-[var(--panel-border)]"
                    : "bg-[var(--accent)] text-[var(--accent-fg)]"
                }`}
              >
                {isAbyssAllChecked ? "전체 해제" : "전체 완료"}
              </button>
            </div>
            <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {abyssList.map((item: any) => renderTask(item, "abyss"))}
            </div>
          </div>
        )}

        {(activeTab === "all" || activeTab === "abyss_raid") && (
          <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-3 shadow-xs flex flex-col">
            <div className="flex justify-between items-center mb-3 border-b border-[var(--panel-border)] pb-2 gap-2">
              <h3 className="font-bold text-emerald-400 text-sm whitespace-nowrap">
                레이드 관리
              </h3>
              <button
                type="button"
                onClick={() => handleSmartToggle("raid")}
                className={`text-xs font-bold px-2.5 py-1 rounded transition shadow-xs whitespace-nowrap cursor-pointer ${
                  isRaidAllChecked
                    ? "bg-[var(--inner-box)] text-[var(--text-sub)] border border-[var(--panel-border)]"
                    : "bg-[var(--accent)] text-[var(--accent-fg)]"
                }`}
              >
                {isRaidAllChecked ? "전체 해제" : "전체 완료"}
              </button>
            </div>
            <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {raidList.map((item: any) => renderTask(item, "raid"))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}