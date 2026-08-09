import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const token = process.env.MOBILIFE_API_TOKEN;
    
    // 토큰을 주소(query)와 헤더에 모두 담아 인증된 접근임을 증명합니다.
    const url = `https://mabimobi.life/ranking/v2?sort_by=combat&sort_order=desc&per_page=100${token ? `&token=${token}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': token || '',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    });
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`모비라이프 서버 거부 (${response.status}): ${errText.slice(0, 100)}`);
    }

    const data = await response.json();

    if (!data.items) {
      throw new Error("모비라이프 데이터 구조에 items가 없습니다.");
    }

    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff)).toISOString().split('T')[0];

    for (const item of data.items) {
      const { data: char } = await supabase
        .from('characters')
        .select('id, nickname')
        .eq('nickname', item.character_name)
        .single();

      if (char) {
        await supabase.from('characters').update({
          combat_power: Number(item.combat),
          charm: Number(item.charm),
          life_energy: Number(item.life || 0)
        }).eq('id', char.id);

        await supabase.from('weekly_stat_snapshots').upsert({
          character_id: char.id,
          character_nickname: char.nickname,
          combat_power: Number(item.combat),
          charm: Number(item.charm),
          life_energy: Number(item.life || 0),
          week_start_date: monday
        }, { onConflict: 'character_id, week_start_date' });
      }
    }

    return NextResponse.json({ success: true, message: "동기화 완료!" });
  } catch (error: any) {
    console.error("=== SYNC API ERROR ===", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}