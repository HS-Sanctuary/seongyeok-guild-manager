// app/api/game-events/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 서버 전용 수파베이스 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // 수파베이스에서 길드 관리자가 갱신한 최신 이벤트 데이터 조회
    const { data, error } = await supabase
      .from('server_events')
      .select('*')
      .single();

    // 데이터가 아직 없다면 기본 초기값 반환
    if (error || !data) {
      return NextResponse.json({
        success: true,
        boundary: { remainingSeconds: 3600, status: '정상' },
        abyssHole: { nextTimeText: '관리자 갱신 대기 중', remainingSeconds: 7200 },
        deepHole: { resetRemainingSeconds: 18000, senmai: [0], paleMountain: [0] }
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      boundary: {
        remainingSeconds: data.boundary_remaining_sec ?? 3600,
        status: data.boundary_status || '정상'
      },
      abyssHole: {
        nextTimeText: data.abyss_time_text || '일정 확인 중',
        remainingSeconds: data.abyss_remaining_sec ?? 7200
      },
      deepHole: {
        resetRemainingSeconds: data.deep_reset_sec ?? 18000,
        senmai: data.senmai_channels || [0, 0, 0, 0, 0, 0, 0, 0],
        paleMountain: data.pale_mountain_channels || [0, 0, 0, 0, 0, 0, 0, 0]
      }
    });

  } catch (error) {
    console.error("Database Event Fetch Error:", error);
    return NextResponse.json({
      success: true,
      boundary: { remainingSeconds: 3600, status: '정상' },
      abyssHole: { nextTimeText: '정보 동기화 중', remainingSeconds: 7200 },
      deepHole: { resetRemainingSeconds: 18000, senmai: [0], paleMountain: [0] }
    });
  }
}