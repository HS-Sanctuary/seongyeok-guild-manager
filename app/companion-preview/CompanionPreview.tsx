"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./preview.module.css";

type Period = "daily" | "weekly";
type Task = { id: string; period: Period; title: string; done: boolean };
type Stats = { combat: number; living: number };

const initialTasks: Task[] = [
  { id: "daily-dungeon", period: "daily", title: "일일 던전", done: false },
  { id: "daily-cook", period: "daily", title: "요리", done: true },
  { id: "daily-gather", period: "daily", title: "채집", done: false },
  { id: "weekly-quest", period: "weekly", title: "주간 의뢰", done: false },
  { id: "weekly-abyss", period: "weekly", title: "어비스", done: true },
  { id: "weekly-raid", period: "weekly", title: "레이드", done: false },
];

const initialObserved: Stats = { combat: 99152, living: 28671 };
const initialSaved: Stats = { combat: 99090, living: 28630 };
const sampleParties = [
  { id: "abyss", title: "어비스", time: "오늘 21:00", members: "3/4", needed: "딜러 1명", note: "샘플 파티 · 실제 모집 아님" },
  { id: "dungeon", title: "상급 던전", time: "내일 20:30", members: "2/4", needed: "서포터 1명 · 딜러 1명", note: "샘플 파티 · 실제 모집 아님" },
] as const;
const number = (value: number) => value.toLocaleString("ko-KR");

export default function CompanionPreview() {
  const [tasks, setTasks] = useState(initialTasks);
  const [period, setPeriod] = useState<Period>("daily");
  const [observed, setObserved] = useState(initialObserved);
  const [saved, setSaved] = useState(initialSaved);
  const [previewSync, setPreviewSync] = useState(false);
  const [showMissionHud, setShowMissionHud] = useState(true);
  const [showStatusHud, setShowStatusHud] = useState(true);
  const [showPartyHud, setShowPartyHud] = useState(true);
  const [selectedPartyId, setSelectedPartyId] = useState<(typeof sampleParties)[number]["id"]>("abyss");
  const [opacity, setOpacity] = useState(86);
  const [scale, setScale] = useState(100);
  const [lastMockSync, setLastMockSync] = useState<string | null>(null);

  const visibleTasks = tasks.filter((task) => task.period === period);
  const dailyDone = tasks.filter((task) => task.period === "daily" && task.done).length;
  const weeklyDone = tasks.filter((task) => task.period === "weekly" && task.done).length;
  const hasStatChange = observed.combat !== saved.combat || observed.living !== saved.living;
  const selectedParty = sampleParties.find((party) => party.id === selectedPartyId) ?? sampleParties[0];

  const toggleTask = (id: string) => {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));
  };

  const resetDemo = () => {
    setTasks(initialTasks);
    setPeriod("daily");
    setObserved(initialObserved);
    setSaved(initialSaved);
    setPreviewSync(false);
    setLastMockSync(null);
    setShowStatusHud(true);
    setShowMissionHud(true);
    setShowPartyHud(true);
    setSelectedPartyId("abyss");
    setOpacity(86);
    setScale(100);
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>SANCTUM · PC COMPANION STUDY</p>
            <h1>게임 옆의 작은 성역</h1>
            <p>크로노스 숙제·시낙시스 매칭·내 캐릭터 스탯을 한눈에 보는 로컬 시제품</p>
          </div>
          <div className={styles.heroBadge}>시뮬레이션 전용 <span>●</span></div>
        </header>

        <div className={styles.safety} role="note">
          <strong>실제 게임·생텀 DB와 연결되지 않았어요.</strong> 아래 모든 체크와 동기화는 이 페이지 안에서만 움직이는 샘플입니다.
        </div>

        <div className={styles.layout}>
          <section className={styles.control} aria-label="생텀 동반 프로그램 제어판">
            <div className={styles.sectionHeading}>
              <span className={styles.sectionGlyph}>✦</span>
              <div><h2>연결 제어판</h2><p>내 캐릭터만 · 읽기 전용 설계</p></div>
            </div>

            <div className={styles.connectionCard}>
              <span className={styles.offlineDot} aria-hidden="true" />
              <div><strong>게임 연결 미실행</strong><small>샘플 데이터로 화면과 흐름을 시험하는 중</small></div>
              <span className={styles.localTag}>LOCAL</span>
            </div>

            <div className={styles.subheading}><h3>내 캐릭터 스탯</h3><span>샘플 캐릭터</span></div>
            <div className={styles.statCompare}>
              <div className={styles.statCard}>
                <span>⚔ 전투력</span><strong>{number(observed.combat)}</strong>
                <small>생텀 저장값 {number(saved.combat)}</small>
              </div>
              <div className={styles.statCard}>
                <span>🌿 생활력</span><strong>{number(observed.living)}</strong>
                <small>생텀 저장값 {number(saved.living)}</small>
              </div>
            </div>
            <div className={styles.rowActions}>
              <button type="button" onClick={() => { setObserved((v) => ({ ...v, combat: v.combat + 120 })); setPreviewSync(false); }}>전투력 +120 체험</button>
              <button type="button" onClick={() => { setObserved((v) => ({ ...v, living: v.living + 20 })); setPreviewSync(false); }}>생활력 +20 체험</button>
            </div>
            <button type="button" className={styles.primaryButton} onClick={() => setPreviewSync(true)}>변경분 미리보기</button>
            {previewSync && (
              <div className={styles.syncPreview} role="status">
                <strong>{hasStatChange ? "변경된 값만 반영할 준비가 됐어요" : "변경된 스탯이 없어요"}</strong>
                <span>전투력 {observed.combat - saved.combat >= 0 ? "+" : ""}{number(observed.combat - saved.combat)} · 생활력 {observed.living - saved.living >= 0 ? "+" : ""}{number(observed.living - saved.living)}</span>
                <button type="button" disabled={!hasStatChange} onClick={() => { setSaved(observed); setLastMockSync(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })); setPreviewSync(false); }}>샘플에만 반영</button>
              </div>
            )}
            {lastMockSync && <p className={styles.syncedNotice}>✓ {lastMockSync} 로컬 샘플 반영 완료 · 서버 전송 없음</p>}

            <div className={styles.subheading}><h3>크로노스 숙제</h3><span>06시 초기화 설계</span></div>
            <div className={styles.segmented} role="tablist" aria-label="숙제 주기">
              <button type="button" role="tab" aria-selected={period === "daily"} className={period === "daily" ? styles.selected : ""} onClick={() => setPeriod("daily")}>일일 {dailyDone}/3</button>
              <button type="button" role="tab" aria-selected={period === "weekly"} className={period === "weekly" ? styles.selected : ""} onClick={() => setPeriod("weekly")}>주간 {weeklyDone}/3</button>
            </div>
            <div className={styles.taskList}>
              {visibleTasks.map((task) => (
                <label key={task.id} className={task.done ? styles.taskDone : styles.task}>
                  <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} />
                  <span>{task.title}</span><small>{task.done ? "완료" : "남음"}</small>
                </label>
              ))}
            </div>
            <p className={styles.helpText}>이 목록과 오른쪽 미션 HUD는 같은 샘플 상태를 사용해요. 실제 연결에서는 이름이 아닌 크로노스 숙제 ID로 맞춰야 합니다.</p>
          </section>

          <section className={styles.stageSection} aria-label="오버레이 미리보기">
            <div className={styles.stageTitle}><div><h2>게임 위 오버레이 미리보기</h2><p>게임 화면을 복제하지 않은 추상 배경</p></div><span>16:10 PREVIEW</span></div>
            <div className={styles.gameStage}>
              <div className={styles.stageSky} aria-hidden="true" />
              <div className={styles.stageMountains} aria-hidden="true" />
              <div className={styles.stageGround} aria-hidden="true" />
              <div className={styles.stageCrosshair} aria-hidden="true">✦</div>
              <div className={styles.stageCaption}>게임 화면 예시 영역 · 실제 화면 캡처 아님</div>
              {showStatusHud && (
                <div className={styles.statusHud} style={{ opacity: opacity / 100, fontSize: `${scale}%` }}>
                  <div className={styles.hudCrest}>✦</div>
                  <strong>SANCTUM</strong><span>샘플 캐릭터</span><i />
                  <small>게임 연결 전 · 웹 동기화 전</small>
                </div>
              )}
              {showMissionHud && (
                <div className={styles.missionHud} style={{ opacity: opacity / 100, fontSize: `${scale}%` }}>
                  <div className={styles.missionTop}><span>✦ 크로노스</span><strong>남은 숙제</strong></div>
                  <div className={styles.hudTabs}>
                    <button type="button" className={period === "daily" ? styles.hudTabActive : ""} onClick={() => setPeriod("daily")}>일일 {dailyDone}/3</button>
                    <button type="button" className={period === "weekly" ? styles.hudTabActive : ""} onClick={() => setPeriod("weekly")}>주간 {weeklyDone}/3</button>
                  </div>
                  {visibleTasks.map((task) => (
                    <label key={task.id} className={styles.hudTask}>
                      <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} />
                      <span className={task.done ? styles.hudTaskDone : ""}>{task.title}</span>
                      <small>{task.done ? "완료" : "남음"}</small>
                    </label>
                  ))}
                  <p>샘플 연결 · 실제 게임 조작 없음</p>
                </div>
              )}
              {showPartyHud && (
                <div className={styles.partyHud} style={{ opacity: opacity / 100, fontSize: `${scale}%` }}>
                  <div className={styles.partyHudHeading}><span>✦ 시낙시스</span><small>샘플 매칭</small></div>
                  <strong>{selectedParty.title}</strong>
                  <span>{selectedParty.time} · {selectedParty.members}명</span>
                  <em>{selectedParty.needed} 모집 중</em>
                  <Link href="/party">실제 시낙시스 열기 ↗</Link>
                </div>
              )}
            </div>
            <div className={styles.flow} aria-label="예정된 동기화 흐름">
              <span>내 게임 정보</span><b>→</b><span>PC 동반 프로그램</span><b>→</b><span>내 생텀 계정</span>
            </div>
          </section>

          <aside className={styles.settings} aria-label="오버레이 설정">
            <div className={styles.sectionHeading}><span className={styles.sectionGlyph}>⚙</span><div><h2>오버레이 설정</h2><p>내 화면에서만 바뀌어요</p></div></div>
            <label className={styles.switchRow}><span><strong>상단 상태바</strong><small>연결 상태와 캐릭터 표시</small></span><input type="checkbox" checked={showStatusHud} onChange={(event) => setShowStatusHud(event.target.checked)} /></label>
            <label className={styles.switchRow}><span><strong>남은 숙제 HUD</strong><small>일일·주간 체크 표시</small></span><input type="checkbox" checked={showMissionHud} onChange={(event) => setShowMissionHud(event.target.checked)} /></label>
            <label className={styles.switchRow}><span><strong>시낙시스 HUD</strong><small>파티 모집 정보 미리보기</small></span><input type="checkbox" checked={showPartyHud} onChange={(event) => setShowPartyHud(event.target.checked)} /></label>
            <label className={styles.sliderRow}><span><strong>배경 투명도</strong><output>{opacity}%</output></span><input type="range" min="45" max="100" step="1" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} /></label>
            <label className={styles.sliderRow}><span><strong>위젯 크기</strong><output>{scale}%</output></span><input type="range" min="85" max="115" step="5" value={scale} onChange={(event) => setScale(Number(event.target.value))} /></label>
            <div className={styles.boundary}>
              <strong>프로토타입의 안전 경계</strong>
              <p>다른 플레이어 정보 수집 없음. 게임 명령 실행 없음. 로그인 코드·게임 원본 데이터 저장 없음. 운영 DB 호출 없음.</p>
            </div>
            <button type="button" className={styles.resetButton} onClick={resetDemo}>샘플 데이터 처음으로</button>
          </aside>

          <section className={styles.synaxis} aria-label="시낙시스 매칭 시제품">
            <div className={styles.synaxisIntro}>
              <p className={styles.eyebrow}>SYNAXIS · PARTY MATCHING</p>
              <h2>게임을 끊지 않고 파티를 살펴봐요</h2>
              <p>오버레이에서는 모집·빈자리·시간을 빠르게 확인하고, 실제 신청은 로그인된 생텀 시낙시스에서 이어가는 흐름이에요.</p>
              <Link href="/party">현재 시낙시스 화면 열기 ↗</Link>
            </div>
            <div className={styles.partySamples}>
              {sampleParties.map((party) => (
                <article key={party.id} className={party.id === selectedPartyId ? styles.partySelected : styles.partySample}>
                  <div><strong>{party.title}</strong><span>{party.members}명</span></div>
                  <p>{party.time} · {party.needed}</p>
                  <small>{party.note}</small>
                  <button type="button" onClick={() => { setSelectedPartyId(party.id); setShowPartyHud(true); }}>오버레이에서 보기</button>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
