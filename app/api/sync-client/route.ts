import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: '유효한 데이터가 없습니다.' }, { status: 400 });
    }

    // 1. 기존 DB 데이터 조회 (스탯 오염 방지 및 기존 rankings 조회)
    const { data: currentChars } = await supabase
      .from('characters')
      .select('nickname, combat_power, life_energy, charm, rankings');

    const charMap = new Map();
    currentChars?.forEach((c) => charMap.set(c.nickname, c));

    const growthReport: any[] = [];

    for (const item of items) {
      const oldData = charMap.get(item.nickname) || { 
        combat_power: '0', 
        life_energy: '0', 
        charm: '0',
        rankings: {} 
      };
      
      const oldCombat = Number(oldData.combat_power) || 0;
      const oldLife = Number(oldData.life_energy) || 0;
      const oldCharm = Number(oldData.charm) || 0;

      // 수집된 값 (다양한 모비라이프 필드명 대응)
      let newCombat = Number(item.combat_power ?? item.combat ?? item.power ?? 0);
      let newLife = Number(item.life_energy ?? item.life ?? item.living ?? 0);
      let newCharm = Number(item.charm ?? 0);

      // 🛡️ [0으로 오염 방지 로직] 새로 수집된 값이 0이고 기존 DB 값이 있다면 기존값 유지
      if (newCombat === 0 && oldCombat > 0) newCombat = oldCombat;
      if (newLife === 0 && oldLife > 0) newLife = oldLife;
      if (newCharm === 0 && oldCharm > 0) newCharm = oldCharm;

      // 📌 카테고리별 순위(통합/데이안) 데이터 병합
      const newRankings = item.rankings 
        ? { ...(oldData.rankings || {}), ...item.rankings } 
        : (oldData.rankings || {});

      growthReport.push({
        nickname: item.nickname,
        old: { combat: oldCombat, life: oldLife, charm: oldCharm },
        new: { combat: newCombat, life: newLife, charm: newCharm },
        diff: {
          combat: newCombat - oldCombat,
          life: newLife - oldLife,
          charm: newCharm - oldCharm,
        },
      });

      // DB 업데이트 (스탯 + 4대 랭킹 jsonb)
      await supabase
        .from('characters')
        .update({
          combat_power: String(newCombat),
          life_energy: String(newLife),
          charm: String(newCharm),
          rankings: newRankings, // 📌 카테고리별 통합/데이안 순위 업데이트
          updated_at: new Date().toISOString(),
        })
        .eq('nickname', item.nickname);
    }

    return NextResponse.json({
      success: true,
      message: `${items.length}명 최신 스탯 및 4대 랭킹 순위 업데이트 완료!`,
      growthReport,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}