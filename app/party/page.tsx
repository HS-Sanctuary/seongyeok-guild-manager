"use client";

import { Suspense } from "react";
import PartyCreateForm from "@/components/party/PartyCreateForm";
import PartyFilterHeader from "@/components/party/PartyFilterHeader";
import PartyCard from "@/components/party/PartyCard";
import GuildBusCard from "@/components/party/GuildBusCard";
import PartyModals from "@/components/party/PartyModals";
import GuildBusJoinModal from "@/components/party/GuildBusJoinModal";
import { getDayOfWeekKorean } from "@/lib/partyDateUtils";
import { usePartyManager } from "@/hooks/usePartyManager";

function SynaxisContent() {
  const partyManager = usePartyManager();

  if (!partyManager.mounted) return null;

  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans pb-28 pt-3 sm:pt-6 relative select-none w-full">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 space-y-3 sm:space-y-4 relative z-10">
        
        {/* 상단 파티 헤더 */}
        <header className="relative overflow-hidden rounded-2xl bg-[var(--panel)] border border-[var(--panel-border)] py-3 px-4 md:py-4 md:px-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-3 min-w-0">
          <div className="absolute top-0 left-0 w-2 h-full bg-[var(--accent)] shadow-[0_0_15px_var(--accent)]"></div>
          
          <div className="flex items-center justify-between w-full md:w-auto gap-2.5 min-w-0 shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <h1 className="text-base sm:text-lg md:text-xl font-black tracking-widest leading-none text-[var(--text-main)] whitespace-nowrap shrink-0 drop-shadow-sm">
                SYNAXIS
              </h1>
              <span className="text-xs sm:text-sm font-bold text-[var(--accent)] whitespace-nowrap shrink-0 break-keep">
                시낙시스 : 스마트 파티 매칭
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <button 
                type="button"
                onClick={() => partyManager.setShowSynaxisInfoModal(true)} 
                className="lg:hidden w-6 h-6 rounded-full bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs font-black text-[var(--text-sub)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition flex items-center justify-center shrink-0 shadow-xs cursor-pointer" 
              >
                ?
              </button>
              <button 
                type="button"
                onClick={() => partyManager.setShowLoreGuide(true)} 
                className="hidden lg:flex w-5 h-5 rounded-full bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs font-black text-[var(--text-sub)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition items-center justify-center shrink-0 ml-1 cursor-pointer" 
              >
                i
              </button>
            </div>
          </div>

          <div className="hidden xl:flex bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl px-3.5 py-2 items-center gap-2 text-[11px] sm:text-xs text-[var(--text-main)] shadow-inner max-w-[620px] shrink min-w-0">
            <span className="text-sm shrink-0">🏛️</span>
            <span className="medium text-[var(--text-sub)] leading-snug line-clamp-2 break-keep">
              시낙시스는 고대 그리스어로 <strong className="text-[var(--accent)] font-bold">&apos;함께 모이는 것&apos;</strong>을 뜻합니다.<br className="hidden xl:block" />
              성역의 전우들과 최적의 시간으로 길을 나섭니다.
            </span>
          </div>
        </header>

        {/* 모바일 스마트 매칭 등록 토글 버튼 (접힘 시 하트비트 펄스 애니메이션 적용) */}
        <div className="lg:hidden">
          <button 
            type="button"
            onClick={() => partyManager.setIsMobileFormOpen(!partyManager.isMobileFormOpen)}
            className={`w-full py-2.5 px-4 rounded-2xl shadow-md transition-all duration-300 flex justify-between items-center border active:scale-[0.99] cursor-pointer min-w-0 ${
              partyManager.isMobileFormOpen 
                ? "bg-[var(--inner-box)] border-[var(--accent)] text-[var(--accent)] shadow-[0_0_10px_var(--accent)]/20" 
                : "bg-[var(--panel)] border-[var(--accent)] text-[var(--text-main)] ring-2 ring-[var(--accent)]/40 animate-pulse shadow-[0_0_15px_var(--accent)]/30"
            }`}
          >
            <span className="flex items-center gap-2 text-xs font-black min-w-0 truncate">
              <span className="text-sm leading-none shrink-0 animate-bounce">✨</span>
              <span className="truncate text-[var(--accent)] font-black">스마트 파티 매칭 등록</span>
            </span>
            <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-xl border shrink-0 transition ${
              partyManager.isMobileFormOpen 
                ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent" 
                : "bg-[var(--accent)]/20 text-[var(--accent)] border-[var(--accent)]/60 font-black shadow-xs"
            }`}>
              {partyManager.isMobileFormOpen ? "닫기" : "열기"}
            </span>
          </button>
        </div>

        {/* 메인 레이아웃 Grid (Form + List) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-w-0 items-start relative">
          <div className={`lg:col-span-5 xl:col-span-4 bg-[var(--panel)] rounded-2xl border border-[var(--panel-border)] p-4 sm:p-5 shadow-sm h-fit min-w-0 lg:sticky lg:top-24 lg:z-20 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto custom-scrollbar ${
            partyManager.isMobileFormOpen ? "block animate-in fade-in duration-200" : "hidden lg:block"
          }`}>
            <PartyCreateForm 
              isAdmin={partyManager.isAdmin}
              myCharacterNames={partyManager.myCharacterNames}
              allCharactersMap={partyManager.allCharactersMap}
              selectedChar={partyManager.selectedChar}
              setSelectedChar={partyManager.setSelectedChar}
              selectedContent={partyManager.selectedContent}
              selectedDiff={partyManager.selectedDiff}
              openContentModal={partyManager.openContentModal}
              selectedDate={partyManager.selectedDate}
              getDayOfWeekKorean={getDayOfWeekKorean}
              timeStart={partyManager.timeStart}
              timeEnd={partyManager.timeEnd}
              openScheduleModal={() => partyManager.setShowScheduleModal(true)}
              partyType={partyManager.partyType}
              setPartyType={partyManager.setPartyType}
              matchingMode={partyManager.matchingMode}
              setMatchingMode={partyManager.setMatchingMode}
              loopSubMode={partyManager.loopSubMode}
              setMinRuns={partyManager.setMinRuns}
              setLoopSubMode={partyManager.setLoopSubMode}
              minRuns={partyManager.minRuns}
              maxRuns={partyManager.maxRuns}
              setMaxRuns={partyManager.setMaxRuns}
              loopHoursCount={partyManager.loopHoursCount}
              setLoopHoursCount={partyManager.setLoopHoursCount}
              loopHoursMin={partyManager.loopHoursMin}
              setLoopHoursMin={partyManager.setLoopHoursMin}
              partyMemo={partyManager.partyMemo}
              setPartyMemo={partyManager.setPartyMemo}
              myRoles={partyManager.myRoles}
              setMyRoles={partyManager.setMyRoles}
              wantedRoles={partyManager.wantedRoles}
              setWantedRoles={partyManager.setWantedRoles}
              handleReservation={partyManager.handleReservation}
              setShowBusCreateModal={partyManager.openBusCreateModal}
            />
          </div>

          <div className="lg:col-span-7 xl:col-span-8 space-y-3 min-w-0">
            <div className="bg-[var(--panel)] rounded-2xl border border-[var(--panel-border)] p-4 sm:p-5 shadow-sm space-y-4 min-w-0">
              
              <PartyFilterHeader 
                activeDateFilter={partyManager.activeDateFilter}
                setActiveDateFilter={partyManager.setActiveDateFilter}
                setShowFilterCalendarModal={partyManager.setShowFilterCalendarModal}
                selectedCategoryFilter={partyManager.selectedCategoryFilter}
                setSelectedCategoryFilter={partyManager.setSelectedCategoryFilter}
                setStatusFilter={partyManager.setStatusFilter}
                setPartySearchTerm={partyManager.setPartySearchTerm}
                upcomingDates={partyManager.upcomingDates}
                datePartyCounts={partyManager.datePartyCounts}
                partySearchTerm={partyManager.partySearchTerm}
                statusFilter={partyManager.statusFilter}
              />

              <div className="space-y-5 min-w-0">
                {partyManager.filteredParties.length === 0 ? (
                  <div className="text-center py-20 text-[var(--text-sub)] font-bold text-xs sm:text-sm bg-[var(--inner-box)] rounded-2xl border border-[var(--panel-border)]">
                    해당 조건의 파티가 없습니다.
                  </div>
                ) : (
                  partyManager.filteredParties.map(party => {
                    const isBus = party.sub_content?.includes("길드 버스") || (party.party_type === "1회 클리어" && party.sub_content?.includes("버스"));
                    
                    return isBus ? (
                      <GuildBusCard 
                        key={party.id}
                        party={party}
                        currentUserNickname={partyManager.user?.nickname || partyManager.user?.username || "한설"}
                        onJoinClick={() => partyManager.openJoinPopup(party)}
                        onLeaveClick={(p) => partyManager.handleLeaveParty(p, partyManager.user?.nickname || partyManager.user?.username || "한설")}
                        onDeleteClick={(id) => partyManager.handleDeleteParty(id)}
                        onNextRoundClick={partyManager.handleNextRound}
                        onRefresh={() => {
                          const ownerName = partyManager.user?.username || partyManager.user?.nickname || partyManager.user?.owner || "한설";
                          partyManager.fetchData(ownerName);
                        }}
                        isMasterOrAdmin={partyManager.isAdmin}
                      />
                    ) : (
                      <PartyCard 
                        key={party.id}
                        party={party}
                        myCharacterNames={partyManager.myCharacterNames}
                        allCharactersMap={partyManager.allCharactersMap}
                        openJoinPopup={partyManager.openJoinPopup}
                        setInspectCharacter={partyManager.setInspectCharacter}
                        handleLeaveParty={partyManager.handleLeaveParty}
                        handleDeleteParty={partyManager.handleDeleteParty}
                        onCompleteParty={partyManager.handleCompleteParty}
                        isAdmin={partyManager.isAdmin}
                        onRefresh={() => {
                          const ownerName = partyManager.user?.username || partyManager.user?.nickname || partyManager.user?.owner || "한설";
                          partyManager.fetchData(ownerName);
                        }}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 전용 드래그 FAB 버튼 */}
      <button
        type="button"
        onTouchStart={partyManager.handleFabTouchStart}
        onTouchMove={partyManager.handleFabTouchMove}
        onTouchEnd={partyManager.handleFabTouchEnd}
        onMouseDown={partyManager.handleFabMouseDown}
        onClick={partyManager.handleFabClick}
        style={partyManager.fabPos ? { left: `${partyManager.fabPos.x}px`, top: `${partyManager.fabPos.y}px`, bottom: "auto", right: "auto" } : {}}
        className={`lg:hidden fixed ${
          partyManager.fabPos ? "" : "bottom-20 right-4"
        } z-[90] h-10 px-4 rounded-full bg-[var(--panel)] border border-[var(--accent)] text-[var(--accent)] font-black text-xs shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform select-none cursor-grab active:cursor-grabbing whitespace-nowrap shrink-0 ${
          partyManager.isDraggingFab ? "opacity-90 scale-105" : ""
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping shrink-0"></span>
        <span className="whitespace-nowrap shrink-0">{partyManager.isMobileFormOpen ? "닫기" : "매칭"}</span>
      </button>

      {/* 타임아웃 안내 팝업 모달 */}
      {partyManager.timeoutParty && (
        <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] border border-amber-500/60 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 min-w-0">
            <div className="flex items-center gap-2 text-amber-400 font-black text-lg">
              <span>⏱️</span> 희망 모집 시간 경과 안내
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed break-keep">
              [<strong className="text-amber-300">{partyManager.timeoutParty.content_name}</strong>] 파티의 희망 종료 시간(
              <strong className="text-amber-300">{partyManager.timeoutParty.time_end}</strong>)이 경과하였습니다.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => partyManager.handleExtendTimeout(partyManager.timeoutParty!, "30M")}
                className="py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl transition cursor-pointer"
              >
                ⏱️ +30분 연장
              </button>
              <button
                onClick={() => partyManager.handleExtendTimeout(partyManager.timeoutParty!, "1H")}
                className="py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl transition cursor-pointer"
              >
                ⏰ +1시간 연장
              </button>
              <button
                onClick={() => partyManager.handleExtendTimeout(partyManager.timeoutParty!, "TOMORROW")}
                className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition cursor-pointer"
              >
                📅 내일 동일 시간으로
              </button>
              <button
                onClick={() => partyManager.handleExtendTimeout(partyManager.timeoutParty!, "CANCEL")}
                className="py-2.5 bg-rose-900/60 hover:bg-rose-800 text-rose-300 font-black text-xs rounded-xl transition cursor-pointer border border-rose-500/30"
              >
                🗑️ 파티 모집 취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 길드 버스 탑승 모달 */}
      {partyManager.targetBusParty && (
        <GuildBusJoinModal
          isOpen={partyManager.isBusModalOpen}
          onClose={() => partyManager.setIsBusModalOpen(false)}
          myCharacters={partyManager.myCharacters}
          onSubmit={partyManager.handleBusSubmit}
          contentName={partyManager.targetBusParty.contentName}
          difficulty={partyManager.targetBusParty.difficulty}
        />
      )}

      {/* 전체 서브 모달 묶음 */}
      <PartyModals 
        showSynaxisInfoModal={partyManager.showSynaxisInfoModal}
        setShowSynaxisInfoModal={partyManager.setShowSynaxisInfoModal}
        showLoreGuide={partyManager.showLoreGuide}
        setShowLoreGuide={partyManager.setShowLoreGuide}
        showContentModal={partyManager.showContentModal}
        setShowContentModal={partyManager.setShowContentModal}
        tempContentCategory={partyManager.tempContentCategory}
        setTempContentCategory={partyManager.setTempContentCategory}
        tempContent={partyManager.tempContent}
        setTempContent={partyManager.setTempContent}
        tempDiff={partyManager.tempDiff}
        setTempDiff={partyManager.setTempDiff}
        applyContentModal={partyManager.applyContentModal}
        showScheduleModal={partyManager.showScheduleModal}
        setShowScheduleModal={partyManager.setShowScheduleModal}
        calendarYearMonth={partyManager.calendarYearMonth}
        setCalendarYearMonth={partyManager.setCalendarYearMonth}
        calendarDays={partyManager.calendarDays}
        selectedDate={partyManager.selectedDate}
        setSelectedDate={partyManager.setSelectedDate}
        timeStart={partyManager.timeStart}
        setTimeStart={partyManager.setTimeStart}
        timeEnd={partyManager.timeEnd}
        setTimeEnd={partyManager.setTimeEnd}
        showFilterCalendarModal={partyManager.showFilterCalendarModal}
        setShowFilterCalendarModal={partyManager.setShowFilterCalendarModal}
        activeDateFilter={partyManager.activeDateFilter}
        setActiveDateFilter={partyManager.setActiveDateFilter}
        datePartyCounts={partyManager.datePartyCounts}
        getDayOfWeekKorean={getDayOfWeekKorean}
        showBusCreateModal={partyManager.showBusCreateModal}
        setShowBusCreateModal={partyManager.setShowBusCreateModal}
        busCreateContent={partyManager.busCreateContent}
        setBusCreateContent={partyManager.setBusCreateContent}
        busCreateDiff={partyManager.busCreateDiff}
        setBusCreateDiff={partyManager.setBusCreateDiff}
        busCreateDate={partyManager.busCreateDate}
        setBusCreateDate={partyManager.setBusCreateDate}
        busCreateTimeStart={partyManager.busCreateTimeStart}
        setBusCreateTimeStart={partyManager.setBusCreateTimeStart}
        busCreateTimeEnd={partyManager.busCreateTimeEnd}
        setBusCreateTimeEnd={partyManager.setBusCreateTimeEnd}
        busCreateMemo={partyManager.busCreateMemo}
        setBusCreateMemo={partyManager.setBusCreateMemo}
        busCharSelections={partyManager.busCharSelections}
        setBusCharSelections={partyManager.setBusCharSelections}
        handleCreateGuildBus={partyManager.handleCreateGuildBus}
        inspectCharacter={partyManager.inspectCharacter}
        setInspectCharacter={partyManager.setInspectCharacter}
        joinPopupParty={partyManager.joinPopupParty}
        setJoinPopupParty={partyManager.setJoinPopupParty}
        myCharacters={partyManager.myCharacters}
        joinSelectedChar={partyManager.joinSelectedChar}
        setJoinSelectedChar={partyManager.setJoinSelectedChar}
        joinSelectedRole={partyManager.joinSelectedRole}
        setJoinSelectedRole={partyManager.setJoinSelectedRole}
        joinTimeStart={partyManager.joinTimeStart}
        setJoinTimeStart={partyManager.setJoinTimeStart}
        joinTimeEnd={partyManager.joinTimeEnd}
        setJoinTimeEnd={partyManager.setJoinTimeEnd}
        executeJoinParty={partyManager.executeJoinParty}
      />

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--panel-border); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--accent); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </main>
  );
}

export default function PartyPage() {
  return (
    <Suspense fallback={<div className="w-full text-center py-20 font-black text-[var(--text-sub)]">시낙시스 시스템 로딩 중...</div>}>
      <SynaxisClient />
    </Suspense>
  );
}

function SynaxisClient() {
  return <SynaxisContent />;
}