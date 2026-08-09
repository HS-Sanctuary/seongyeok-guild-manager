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

    return NextResponse.json({
      success: true,
      message: `${items.length}명 최신 스탯 업데이트 완료!`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}