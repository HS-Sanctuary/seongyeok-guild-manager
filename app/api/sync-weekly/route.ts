import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // 빌드 타임 에러 방지를 위해 핸들러 안에서 안전하게 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: '유효한 데이터가 없습니다.' }, { status: 400 });
    }

    // 주간 스탯 및 데이터 업데이트 로직
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
      message: `${items.length}명 주간 스탯 동기화 완료!`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Sync Weekly API is active' });
}