// app/api/market/route.ts
import { NextResponse } from 'next/server';

const MOBILIFE_API_BASE = 'https://open.mabimobi.life'; 

export async function GET() {
  try {
    const apiKey = process.env.MOBILIFE_API_KEY;

    if (!apiKey) {
       return NextResponse.json({ error: 'MOBILIFE_API_KEY가 없습니다.' }, { status: 500 });
    }

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };

    // 거래소 시세 조회: 24시간 변동률(급등) 기준 상위 5개 가져오기
    const marketRes = await fetch(`${MOBILIFE_API_BASE}/v1/market/prices?sort=pct_change_24h_desc&limit=5`, { 
        headers, 
        next: { revalidate: 60 } // 1분 캐싱 (API 남용 방지)
    });
    
    if (!marketRes.ok) {
        console.log(`❌ [모비라이프 거래소 API 에러] 상태코드: ${marketRes.status}`);
        return NextResponse.json({ error: '거래소 데이터를 불러오지 못했습니다.' }, { status: 500 });
    }
    
    const marketData = await marketRes.json();

    return NextResponse.json({
      success: true,
      lastUpdated: marketData.last_updated_at,
      topItems: marketData.data.map((item: any) => ({
          id: item.kind_id,
          name: item.name,
          price: item.min_price,
          pctChange: item.pct_change_24h,
          isSoldOut: item.is_sold_out
      }))
    });

  } catch (error) {
    console.error("Market API Error:", error);
    return NextResponse.json({ error: '서버 내부 오류' }, { status: 500 });
  }
}