import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/server/sanctumSession';
import { canRunSanctumSync } from '@/lib/server/sanctumSyncAuth';

export async function POST(req: NextRequest) {
  try {
    if (!(await canRunSanctumSync(req))) {
      return NextResponse.json({ success: false, error: '운영진 인증이 필요합니다.' }, { status: 403 });
    }
    const supabase = getServerSupabase();

    const body = await req.json();
    const { items, isWeeklyReset, isDailyReset } = body;

    // 1. 주간/일일 초기화 스케줄 처리 (계정당 교환 카운트 및 구매자 닉네임 리셋)
    if (isWeeklyReset || isDailyReset) {
      const resetScope = isWeeklyReset ? '주간' : '일간';

      // 해당 리셋 타입의 계정당 품목 검색 및 초기화
      await supabase
        .from('nexus_trades')
        .update({ completed_by_nickname: null })
        .eq('reset_type', resetScope)
        .eq('scope', '계정당');
    }

    // 2. 주간 스탯 동기화
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        await supabase
          .from('characters')
          .update({
            combat: item.combat,
            charm: item.charm,
            life: item.life,
            updated_at: new Date().toISOString(),
          })
          .eq('nickname', item.nickname);
      }
    }

    return NextResponse.json({
      success: true,
      message: '동기화 및 리셋 스케줄 처리가 완료되었습니다.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Sync Weekly API is active' });
}
