"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import OwnedCharacterPicker, { type OwnedCharacter } from "@/components/character/OwnedCharacterPicker";
import { IrisRelay, parseIrisConnectionFragment } from "@/lib/irisRelay";

type IrisSnapshot = {
  observedAt: string;
  character: { job: string; level: number | null; combatScore: number | null; livingScore: number | null; attractivenessScore: number | null; arcaneResistance: number | null; decorScore: number | null };
  currencies: { available: boolean; silverCoins: number | null; demonTributes: number | null };
  processing: { available: boolean; facilityCount: number; completed: number };
  missions: { daily: { available: boolean; completed: number; total: number }; weekly: { available: boolean; completed: number; total: number } };
};
const localBridge = "http://127.0.0.1:4317/api/bridge/snapshot";
const display = (value: number | null) => value == null ? "조회 불가" : value.toLocaleString("ko-KR");

export default function IrisPage() {
  const [characters, setCharacters] = useState<OwnedCharacter[]>([]);
  const [selected, setSelected] = useState("");
  const [confirmed, setConfirmed] = useState("");
  const [message, setMessage] = useState("캐릭터 목록 확인 중…");
  const [pairToken, setPairToken] = useState("");
  const [snapshot, setSnapshot] = useState<IrisSnapshot | null>(null);
  const [bridgeMessage, setBridgeMessage] = useState("로컬 아이리스 연결 승인 대기");
  const [isLocalPreview, setIsLocalPreview] = useState(false);
  const [connection, setConnection] = useState<{ token: string; generation: number } | null>(null);
  const [relayStatus, setRelayStatus] = useState("전달 동의 대기");
  const [relayStarted, setRelayStarted] = useState(false);
  const [writeAllowed,setWriteAllowed]=useState(false);
  const [writeBusy,setWriteBusy]=useState(false);
  const relayRef = useRef<IrisRelay | null>(null);
  const initialConnection = useRef<{ local: boolean; pair: string | null; incoming: ReturnType<typeof parseIrisConnectionFragment> } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    // Keep the memory-only initial value across React development effect replay.
    if (!initialConnection.current) initialConnection.current = {
      local: ["http://localhost:3000", "http://127.0.0.1:3000"].includes(window.location.origin),
      pair: params.get("pair"),
      incoming: parseIrisConnectionFragment(window.location.origin, window.location.hash),
    };
    const { local, pair: token, incoming } = initialConnection.current;
    // Remove capabilities before any network call; never persist them to browser storage.
    if (params.has("pair") || params.has("connect") || params.has("g")) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    window.queueMicrotask(() => {
      setIsLocalPreview(local);
      setConnection(incoming);
      if (token && local && !incoming) {
        setPairToken(token);
        setBridgeMessage("로컬 아이리스 승인 완료. 캐릭터 확인 후 데이터를 읽습니다.");
      }
    });
    return () => { void relayRef.current?.stop(); relayRef.current = null; };
  }, []);

  function startRelay() {
    if (!connection || relayRef.current) return;
    const relay = new IrisRelay({ ...connection,onWriteAllowed:setWriteAllowed, onStatus: (status) => {
      if (relayRef.current === relay) setRelayStatus(status);
    } });
    relayRef.current = relay;
    setRelayStarted(true);
    setRelayStatus("본인 캐릭터 목록을 확인하고 있어요…");
    void relay.start();
  }

  async function stopRelay() {
    const relay = relayRef.current;
    relayRef.current = null;
    setConnection(null);
    setRelayStarted(false);
    setRelayStatus("전달을 중단했어요. 다시 연결하려면 아이리스에서 새 연결을 시작해 주세요.");
    await relay?.stop();
  }
  async function toggleWrite(){
    if(writeBusy||!relayRef.current)return;
    setWriteBusy(true);
    try{await relayRef.current.setWriteAllowed(!writeAllowed);}catch{
      setWriteAllowed(false);setRelayStarted(false);relayRef.current=null;
      setConnection(null);
      setRelayStatus('수정 동의 상태를 확인하지 못해 읽기 연결도 중단했어요. 아이리스에서 새 읽기 연결을 시작해 주세요.');
    }
    finally{setWriteBusy(false);}
  }

  useEffect(() => {
    if (!confirmed || !pairToken) return;
    let stopped = false;
    let controller: AbortController | null = null;
    let timer: number | undefined;
    async function readLocal() {
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 8000);
      try {
        const response = await fetch(localBridge, { headers: { "X-IRIS-Pairing": pairToken }, cache: "no-store", credentials: "omit", redirect: "error", signal: controller.signal });
        if (!response.ok) throw new Error(response.status === 403 ? "연결 승인이 만료됐어요. 로컬 아이리스에서 다시 승인해 주세요." : "게임 데이터를 읽지 못했습니다.");
        const result = await response.json();
        if (stopped) return;
        if (result.status !== "connected") throw new Error(result.message || "게임 연결 대기 중입니다.");
        setSnapshot(result.data);
        setBridgeMessage("로컬 게임 데이터 미리보기 · 생텀에는 저장되지 않음");
      } catch (error) {
        if (stopped) return;
        setSnapshot(null);
        setBridgeMessage(error instanceof Error ? error.message : "로컬 아이리스에 연결하지 못했습니다.");
      } finally {
        window.clearTimeout(timeout);
        if (!stopped) timer = window.setTimeout(() => void readLocal(), 15_000);
      }
    }
    void readLocal();
    return () => { stopped = true; controller?.abort(); window.clearTimeout(timer); };
  }, [confirmed, pairToken]);

  async function disconnect() {
    const token = pairToken;
    setPairToken("");
    setSnapshot(null);
    setBridgeMessage("연결을 해제했어요.");
    if (token) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      try { await fetch(localBridge, { method: "DELETE", headers: { "X-IRIS-Pairing": token }, credentials: "omit", redirect: "error", signal: controller.signal }); }
      catch { /* 로컬 서버가 이미 종료됐을 수 있다. */ }
      finally { window.clearTimeout(timeout); }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/iris/characters", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "목록을 불러오지 못했습니다.");
        setCharacters(result.characters || []);
        setMessage((result.characters || []).length ? "게임에서 현재 플레이 중인 캐릭터를 직접 선택해 주세요." : "등록된 캐릭터가 없습니다. 크로노스에서 먼저 등록해 주세요.");
      })
      .catch((error) => { if (error.name !== "AbortError") setMessage(error.message); });
    return () => controller.abort();
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 space-y-6 text-[var(--text-main)]">
      <div>
        <h1 className="text-2xl font-black text-[var(--accent)]">IRIS · 캐릭터 연결 준비</h1>
        <Link href="/iris/download" className="inline-block underline">Windows IRIS 베타 다운로드 안내</Link>
        <p className="mt-2 text-sm text-[var(--text-sub)]">게임 연결이 닉네임을 제공하지 않아 생텀 캐릭터를 직접 확인하는 단계입니다.</p>
      </div>
      {connection && <section className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 space-y-4">
        <h2 className="font-bold">아이리스에 생텀 정보 전달</h2>
        <p className="text-sm text-[var(--text-sub)]">본인 캐릭터의 크로노스 항목과 완료 정보를 전달합니다. 읽기 연결만으로 기록을 변경하지 않으며, 로그인 정보는 아이리스에 전달하지 않습니다.</p>
        <p className="text-sm text-[var(--text-sub)]">이 탭이 닫히거나 연결이 오래 멈추면 오버레이의 정보가 비워집니다. 게임 캐릭터의 자동 신원 확인은 아닙니다.</p>
        <p role="status" className="text-sm text-[var(--accent)]">{relayStatus}</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={relayStarted} onClick={startRelay} className="rounded-lg bg-[var(--accent)] px-4 py-2 font-bold text-[var(--accent-fg)] disabled:opacity-50">동의하고 읽기 연결</button>
          <button type="button" onClick={() => void stopRelay()} className="rounded-lg border border-[var(--panel-border)] px-4 py-2">전달 중단</button>
          <button type="button" disabled={!relayStarted||writeBusy} onClick={()=>void toggleWrite()} className="rounded-lg border border-[var(--panel-border)] px-4 py-2 disabled:opacity-50">{writeBusy?'연결 중…':writeAllowed?'숙제 수정 허용 중 · 중단':'동의하고 숙제 수정 허용'}</button>
        </div>
        <p className="text-sm text-[var(--text-sub)]">수정 허용 후 오버레이에서 체크하고 저장 버튼을 누르면 생텀 숙제 기록이 바뀝니다. 게임 보상을 수령하는 기능은 아닙니다. 저장할 때 이 탭을 열어 두세요.</p>
      </section>}
      {!connection && <section className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 space-y-4">
        <h2 className="font-bold">내 캐릭터 선택</h2>
        <p role="status" className="text-sm text-[var(--text-sub)]">{message}</p>
        {characters.length > 0 && <OwnedCharacterPicker characters={characters} selectedNickname={selected} onSelect={(nickname) => { setSelected(nickname); setConfirmed(""); setSnapshot(null); }} />}
        {selected && <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--inner-box)] p-4 space-y-3">
          <p>지금 게임에서 플레이 중인 캐릭터가 <strong className="text-[var(--accent)]">{selected}</strong> 맞나요?</p>
          <button type="button" onClick={() => setConfirmed(selected)} className="rounded-lg bg-[var(--accent)] px-4 py-2 font-bold text-[var(--accent-fg)]">네, 이 캐릭터가 맞아요</button>
        </div>}
        {confirmed && <p role="status" className="text-sm text-[var(--accent)]">{confirmed} 선택을 확인했어요. 게임이 제공하는 닉네임으로 자동 대조한 결과는 아닙니다.</p>}
      </section>}
      {!connection && <section className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 space-y-4">
        <h2 className="font-bold">로컬 게임 데이터 미리보기</h2>
        <p role="status" className="text-sm text-[var(--text-sub)]">{bridgeMessage}</p>
        {!isLocalPreview && <p className="text-sm text-[var(--text-sub)]">이 연결 미리보기는 현재 로컬 개발 환경에서만 사용할 수 있습니다.</p>}
        {isLocalPreview && !pairToken && <a href="http://127.0.0.1:4317/" className="inline-block rounded-lg bg-[var(--accent)] px-4 py-2 font-bold text-[var(--accent-fg)]">로컬 아이리스 열어 연결 승인</a>}
        {pairToken && <button type="button" onClick={disconnect} className="rounded-lg border border-[var(--panel-border)] px-4 py-2 text-sm">연결 해제</button>}
        {pairToken && !confirmed && <p className="text-sm text-[var(--text-sub)]">위에서 현재 게임 캐릭터를 선택·확인하면 값을 표시합니다.</p>}
        {confirmed && snapshot && <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>직업 · 레벨<strong className="block">{snapshot.character.job} · {display(snapshot.character.level)}</strong></div>
          <div>전투력<strong className="block">{display(snapshot.character.combatScore)}</strong></div>
          <div>생활력<strong className="block">{display(snapshot.character.livingScore)}</strong></div>
          <div>매력<strong className="block">{display(snapshot.character.attractivenessScore)}</strong></div>
          <div>마도저항<strong className="block">{display(snapshot.character.arcaneResistance)}</strong></div>
          <div>데코점수<strong className="block">{display(snapshot.character.decorScore)}</strong></div>
          <div>은동전<strong className="block">{display(snapshot.currencies.silverCoins)}</strong></div>
          <div>마족 공물<strong className="block">{display(snapshot.currencies.demonTributes)}</strong></div>
          <div>가공기<strong className="block">{snapshot.processing.available ? `${snapshot.processing.facilityCount}개 · 완료 ${snapshot.processing.completed}건` : "조회 불가"}</strong></div>
          <div>일일 숙제<strong className="block">{snapshot.missions.daily.available ? `${snapshot.missions.daily.completed}/${snapshot.missions.daily.total}` : "조회 불가"}</strong></div>
          <div>주간 숙제<strong className="block">{snapshot.missions.weekly.available ? `${snapshot.missions.weekly.completed}/${snapshot.missions.weekly.total}` : "조회 불가"}</strong></div>
          <p className="col-span-full text-xs text-[var(--text-sub)]">마지막 읽기: {new Date(snapshot.observedAt).toLocaleTimeString("ko-KR")}. 값은 이 브라우저에서만 표시되고 생텀 DB에 저장되지 않습니다.</p>
        </div>}
      </section>}
      <p className="text-sm text-[var(--text-sub)]">이 화면의 캐릭터 선택과 연결 승인은 새로고침하면 초기화됩니다. 게임 닉네임 자동 판별과 게임 정보의 자동 DB 동기화는 아직 없습니다.</p>
      <Link href="/character" className="inline-block rounded-lg border border-[var(--panel-border)] px-4 py-2 text-sm">크로노스에서 캐릭터 관리</Link>
    </main>
  );
}
