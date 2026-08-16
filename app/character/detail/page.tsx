"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

function DetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const charName = searchParams.get("char") || "";

  const [characterData, setCharacterData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'accepted'>('none');

  useEffect(() => {
    if (!charName) return;
    const fetchChar = async () => {
      setLoading(true);
      const { data } = await supabase.from('characters').select('*').eq('nickname', charName).single();
      if (data) setCharacterData(data);
      setLoading(false);
    };
    fetchChar();
  }, [charName]);

  const handleSendRequest = () => {
    setRequestStatus('pending');
    alert(`[${charName}] 님에게 정보 공유 요청을 보냈습니다!\n상대방이 수락하면 상세 장비 및 패션 정보를 확인할 수 있습니다.`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-xs font-bold text-[var(--text-sub)]">
        캐릭터 정보를 불러오는 중...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--text-main)] p-4 max-w-4xl mx-auto space-y-4">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-3">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="text-xs bg-[var(--panel)] border border-[var(--panel-border)] px-2.5 py-1 rounded text-[var(--text-sub)] hover:text-[var(--text-main)]">
            ← 뒤로가기
          </button>
          <h1 className="text-base font-black text-[var(--text-main)]">
            🔍 {charName || "캐릭터"} 상세 정보
          </h1>
        </div>
        <span className="text-xs text-[var(--accent)] font-bold bg-[var(--inner-box)] px-2 py-0.5 rounded border border-[var(--panel-border)]">
          {characterData?.job || "전사"}
        </span>
      </div>

      {/* 정보 공유 요청 안내 구역 */}
      <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-4 text-center space-y-3">
        <div className="text-3xl">🔒</div>
        <h2 className="text-sm font-bold text-[var(--text-main)]">캐릭터 상세 정보 공유 요청</h2>
        <p className="text-xs text-[var(--text-sub)] leading-relaxed max-w-md mx-auto">
          길드원 간 소통과 성장을 도모하기 위해 정보 수락 기능이 적용되어 있습니다.<br />
          아래 버튼을 눌러 정보 공유를 요청하고 소통해 보세요!
        </p>

        {requestStatus === 'none' && (
          <button 
            onClick={handleSendRequest}
            className="bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs px-4 py-2 rounded-lg shadow hover:opacity-90 transition"
          >
            💬 정보 공유 요청 보내기
          </button>
        )}

        {requestStatus === 'pending' && (
          <div className="inline-block bg-amber-500/20 text-amber-300 border border-amber-500/50 px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse">
            ⏳ [${charName}] 님의 공유 승인을 기다리는 중...
          </div>
        )}
      </div>

      {/* 준비 중 가이드 구역 */}
      <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-4 text-xs space-y-2 text-[var(--text-sub)]">
        <h3 className="font-bold text-[var(--accent)]">🛠️ 기획 예정 파트</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>전투력 정보: 장착 아이템, 각인 룬, 인챈트/증폭, 보석, 탈것/펫 및 장비</li>
          <li>생활력 정보: 장착 도구, 가방, 악기 정보</li>
          <li>매력 정보: 패션 아이템 이름/등급, 염색 상세 정보</li>
          <li>캐릭터 상세 스탯 및 길드원 전용 모니터링</li>
        </ul>
      </div>
    </main>
  );
}

export default function CharacterDetailPage() {
  return (
    <Suspense fallback={<div className="p-4 text-xs font-bold">로딩 중...</div>}>
      <DetailContent />
    </Suspense>
  );
}