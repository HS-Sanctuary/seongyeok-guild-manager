import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // DB에 등록된 길드원 캐릭터 닉네임 가져오기
    const { data, error } = await supabase.from('characters').select('nickname');
    if (error) throw error;

    const nicknames = data.map((c: { nickname: string }) => c.nickname).filter(Boolean);
    return NextResponse.json({ success: true, nicknames });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}