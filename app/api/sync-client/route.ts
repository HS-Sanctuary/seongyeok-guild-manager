import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // Service Role Key를 활용하여 RLS 권한 문제 없이 서버에서 DB 업데이트 가능하도록 설정
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: '유효한 데이터가 없습니다.' }, { status: 400 });
    }

    // 1. 기존 DB 데이터 전체 조회 (name/nickname 키 대응 및 rankings 포함)
    const { data: currentChars, error: fetchErr } = await supabase
      .from('characters')
      .select('name, nickname, combat_power, life_energy, charm, rankings');

    if (fetchErr) {
      console.error('[SANCTUM DB Fetch Error]', fetchErr);
    }

    // Map 객체에 name과 nickname 모두를 매핑하여 안전하게 매칭
    const charMap = new Map();
    currentChars?.forEach((c) => {
      if (c.nickname) charMap.set(c.nickname.trim(), c);
      if (c.name) charMap.set(c.name.trim(), c);
    });

    const growthReport: any[] = [];

    for (const item of items) {
      const nick = (item.nickname || item.name || '').trim();
      if (!nick) continue;

      const oldData = charMap.get(nick) || { 
        combat_power: 0, 
        life_energy: 0, 
        charm: 0,
        rankings: {} 
      };
      
      const oldCombat = Number(oldData.combat_power) || 0;
      const oldLife = Number(oldData.life_energy) || 0;
      const oldCharm = Number(oldData.charm) || 0;
      const oldRankings = oldData.rankings || {};

      // 수집된 신규 값 (숫자 변환)
      let newCombat = Number(item.combat_power ?? item.combat ?? item.power ?? 0);
      let newLife = Number(item.life_energy ?? item.life ?? item.living ?? 0);
      let newCharm = Number(item.charm ?? item.charm_stat ?? 0);

      // 🛡️ [0 오염 방지] 새로 수집된 값이 0이고 기존 DB 값이 있다면 기존 값 유지
      if (newCombat === 0 && oldCombat > 0) newCombat = oldCombat;
      if (newLife === 0 && oldLife > 0) newLife = oldLife;
      if (newCharm === 0 && oldCharm > 0) newCharm = oldCharm;

      // 📌 4대 카테고리별 순위(통합/데이안) 데이터 병합 (기존 랭킹 + 신규 랭킹)
      const newRankings = item.rankings 
        ? { ...oldRankings, ...item.rankings } 
        : oldRankings;

      // 📊 리포트용 객체 구조 (템퍼몽키 v8.2 성장 리포트 모달 출력 규격과 100% 일치)
      growthReport.push({
        nickname: nick,
        old: { 
          combat: oldCombat, 
          life: oldLife, 
          charm: oldCharm,
          rankings: oldRankings 
        },
        new: { 
          combat: newCombat, 
          life: newLife, 
          charm: newCharm,
          rankings: newRankings 
        },
        diff: {
          combat: newCombat - oldCombat,
          life: newLife - oldLife,
          charm: newCharm - oldCharm,
        },
      });

      // DB 업데이트 페이로드 구성
      const updatePayload = {
        combat_power: newCombat,
        life_energy: newLife,
        charm: newCharm,
        rankings: newRankings,
        updated_at: new Date().toISOString(),
      };

      // nickname 우선 업데이트 후 없을 시 name 조건으로 업데이트
      let { error: updateErr, count } = await supabase
        .from('characters')
        .update(updatePayload)
        .eq('nickname', nick);

      // nickname으로 업데이트된 행이 없다면 name 컬럼 조건으로 재시도
      if (!updateErr) {
        const { error: nameUpdateErr } = await supabase
          .from('characters')
          .update(updatePayload)
          .eq('name', nick);
        
        if (nameUpdateErr) {
          console.error(`[SANCTUM Update Error - name] ${nick}:`, nameUpdateErr);
        }
      } else {
        console.error(`[SANCTUM Update Error - nickname] ${nick}:`, updateErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${items.length}명 최신 스탯 및 4대 랭킹 순위 업데이트 완료!`,
      growthReport,
    });
  } catch (err: any) {
    console.error('[SANCTUM Sync API Fatal Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}