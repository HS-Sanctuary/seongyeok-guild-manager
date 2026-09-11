"use client";

import { useEffect } from "react";
import { ContentItem, Party } from "@/components/party/types";

import SynaxisInfoModal from "@/components/party/modals/SynaxisInfoModal";
import LoreGuideModal from "@/components/party/modals/LoreGuideModal";
import ContentSelectModal from "@/components/party/modals/ContentSelectModal";
import ScheduleModal from "@/components/party/modals/ScheduleModal";
import FilterCalendarModal from "@/components/party/modals/FilterCalendarModal";
import BusCreateModal, { BusCharSelectionConfig, generateDefaultBusMemo } from "@/components/party/modals/BusCreateModal";
import InspectCharacterModal from "@/components/party/modals/InspectCharacterModal";
import JoinPartyModal from "@/components/party/modals/JoinPartyModal";

export type { BusCharSelectionConfig };
export { generateDefaultBusMemo };

export const cleanContentName = (name: string) => {
  return name
    .replace(/^(어비스|레이드)\s*-\s*/, "")
    .replace(/\s*\(통합\)/g, "")
    .trim();
};

interface PartyModalsProps {
  showSynaxisInfoModal: boolean;
  setShowSynaxisInfoModal: (val: boolean) => void;
  showLoreGuide: boolean;
  setShowLoreGuide: (val: boolean) => void;
  showContentModal: boolean;
  setShowContentModal: (val: boolean) => void;
  tempContentCategory: "어비스" | "레이드";
  setTempContentCategory: (val: "어비스" | "레이드") => void;
  tempContent: ContentItem;
  setTempContent: (val: ContentItem) => void;
  tempDiff: string;
  setTempDiff: (val: string) => void;
  applyContentModal: () => void;

  showScheduleModal: boolean;
  setShowScheduleModal: (val: boolean) => void;
  calendarYearMonth: { year: number; month: number };
  setCalendarYearMonth: React.Dispatch<React.SetStateAction<{ year: number; month: number }>>;
  calendarDays: ({ day: number; dateStr: string } | null)[];
  selectedDate: string;
  setSelectedDate: (val: string) => void;
  timeStart: string;
  setTimeStart: (val: string) => void;
  timeEnd: string;
  setTimeEnd: (val: string) => void;

  showFilterCalendarModal: boolean;
  setShowFilterCalendarModal: (val: boolean) => void;
  activeDateFilter: string;
  setActiveDateFilter: (val: string) => void;
  datePartyCounts: Record<string, { total: number; recruiting: number; completed: number }>;
  getDayOfWeekKorean: (dateStr: string) => string;

  showBusCreateModal: boolean;
  setShowBusCreateModal: (val: boolean) => void;
  busCreateContent: ContentItem;
  setBusCreateContent: (val: ContentItem) => void;
  busCreateDiff: string;
  setBusCreateDiff: (val: string) => void;
  busCreateDate: string;
  setBusCreateDate: (val: string) => void;
  busCreateTimeStart: string;
  setBusCreateTimeStart: (val: string) => void;
  busCreateTimeEnd: string;
  setBusCreateTimeEnd: (val: string) => void;
  busCreateMemo: string;
  setBusCreateMemo: (val: string) => void;
  busCharSelections: Record<string, BusCharSelectionConfig>;
  setBusCharSelections: React.Dispatch<React.SetStateAction<Record<string, BusCharSelectionConfig>>>;
  handleCreateGuildBus: () => void;

  inspectCharacter: any;
  setInspectCharacter: (val: any) => void;

  joinPopupParty: Party | null;
  setJoinPopupParty: (val: Party | null) => void;
  myCharacters: any[];
  joinSelectedChar: string;
  setJoinSelectedChar: (val: string) => void;
  joinSelectedRole: string;
  setJoinSelectedRole: (val: string) => void;
  joinTimeStart: string;
  setTimeStartJoin?: (val: string) => void;
  joinTimeEnd: string;
  setTimeEndJoin?: (val: string) => void;
  executeJoinParty: () => void;

  parties?: any[];
  guildBuses?: any[];
}

export default function PartyModals(props: PartyModalsProps) {
  const isAnyModalOpen = Boolean(
    props.showSynaxisInfoModal ||
    props.showLoreGuide ||
    props.showContentModal ||
    props.showScheduleModal ||
    props.showFilterCalendarModal ||
    props.showBusCreateModal ||
    props.inspectCharacter ||
    props.joinPopupParty
  );

  useEffect(() => {
    if (!isAnyModalOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      const scrollableEl = target.closest(".overflow-y-auto, .overflow-auto") as HTMLElement | null;

      if (!scrollableEl) {
        e.preventDefault();
      } else {
        const isScrollAtTop = scrollableEl.scrollTop <= 0 && e.deltaY < 0;
        const isScrollAtBottom =
          scrollableEl.scrollTop + scrollableEl.clientHeight >= scrollableEl.scrollHeight - 1 && e.deltaY > 0;
        if (isScrollAtTop || isScrollAtBottom) {
          e.preventDefault();
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const scrollableEl = target.closest(".overflow-y-auto, .overflow-auto");
      if (!scrollableEl) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.touchAction = originalBodyTouchAction;
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isAnyModalOpen]);

  return (
    <>
      <SynaxisInfoModal
        showSynaxisInfoModal={props.showSynaxisInfoModal}
        setShowSynaxisInfoModal={props.setShowSynaxisInfoModal}
      />

      <LoreGuideModal
        showLoreGuide={props.showLoreGuide}
        setShowLoreGuide={props.setShowLoreGuide}
      />

      <ContentSelectModal
        showContentModal={props.showContentModal}
        setShowContentModal={props.setShowContentModal}
        tempContentCategory={props.tempContentCategory}
        setTempContentCategory={props.setTempContentCategory}
        tempContent={props.tempContent}
        setTempContent={props.setTempContent}
        tempDiff={props.tempDiff}
        setTempDiff={props.setTempDiff}
        applyContentModal={props.applyContentModal}
      />

      <ScheduleModal
        showScheduleModal={props.showScheduleModal}
        setShowScheduleModal={props.setShowScheduleModal}
        calendarYearMonth={props.calendarYearMonth}
        setCalendarYearMonth={props.setCalendarYearMonth}
        calendarDays={props.calendarDays}
        selectedDate={props.selectedDate}
        setSelectedDate={props.setSelectedDate}
        timeStart={props.timeStart}
        setTimeStart={props.setTimeStart}
        timeEnd={props.timeEnd}
        setTimeEnd={props.setTimeEnd}
        getDayOfWeekKorean={props.getDayOfWeekKorean}
      />

      <FilterCalendarModal
        showFilterCalendarModal={props.showFilterCalendarModal}
        setShowFilterCalendarModal={props.setShowFilterCalendarModal}
        activeDateFilter={props.activeDateFilter}
        setActiveDateFilter={props.setActiveDateFilter}
        datePartyCounts={props.datePartyCounts}
        getDayOfWeekKorean={props.getDayOfWeekKorean}
        parties={props.parties}
        guildBuses={props.guildBuses}
      />

      <BusCreateModal
        showBusCreateModal={props.showBusCreateModal}
        setShowBusCreateModal={props.setShowBusCreateModal}
        busCreateContent={props.busCreateContent}
        setBusCreateContent={props.setBusCreateContent}
        busCreateDiff={props.busCreateDiff}
        setBusCreateDiff={props.setBusCreateDiff}
        busCreateDate={props.busCreateDate}
        setBusCreateDate={props.setBusCreateDate}
        busCreateTimeStart={props.busCreateTimeStart}
        setBusCreateTimeStart={props.setBusCreateTimeStart}
        busCreateTimeEnd={props.busCreateTimeEnd}
        setBusCreateTimeEnd={props.setBusCreateTimeEnd}
        busCreateMemo={props.busCreateMemo}
        setBusCreateMemo={props.setBusCreateMemo}
        busCharSelections={props.busCharSelections}
        setBusCharSelections={props.setBusCharSelections}
        handleCreateGuildBus={props.handleCreateGuildBus}
        myCharacters={props.myCharacters}
      />

      <InspectCharacterModal
        inspectCharacter={props.inspectCharacter}
        setInspectCharacter={props.setInspectCharacter}
      />

      <JoinPartyModal
        joinPopupParty={props.joinPopupParty}
        setJoinPopupParty={props.setJoinPopupParty}
        myCharacters={props.myCharacters}
        joinSelectedChar={props.joinSelectedChar}
        setJoinSelectedChar={props.setJoinSelectedChar}
        joinSelectedRole={props.joinSelectedRole}
        setJoinSelectedRole={props.setJoinSelectedRole}
        joinTimeStart={props.joinTimeStart}
        setTimeStartJoin={props.setTimeStartJoin}
        joinTimeEnd={props.joinTimeEnd}
        setTimeEndJoin={props.setTimeEndJoin}
        executeJoinParty={props.executeJoinParty}
        getDayOfWeekKorean={props.getDayOfWeekKorean}
      />
    </>
  );
}