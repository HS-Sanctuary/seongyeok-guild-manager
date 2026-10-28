import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, getSessionAccount, isPendingAccount, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";
import { accountActivityEnabled } from '@/lib/server/accountActivity';

export async function GET(request: NextRequest) {
  try {
    const actor = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if (!actor || isPendingAccount(actor)) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    const supabase = getServerSupabase();
    let { data, error } = await supabase.from("accounts")
      .select("id, nickname, role, equipped_title, titles, job, main_class")
      .eq("status", "승인");
    if (error?.code === "42703") {
      const fallback = await supabase.from("accounts").select("id, nickname, role").eq("status", "승인");
      data = fallback.data?.map(account => ({ ...account, equipped_title: null, titles: null, job: null, main_class: null })) ?? null;
      error = fallback.error;
    }
    if (error) throw error;
    const observedAt=new Date().toISOString();
    let activityAvailable=false;
    const activity=new Map<string,string>();
    const enabled=accountActivityEnabled();
    if(enabled&&data?.length){
      try{const result=await supabase.from('sanctum_account_activity').select('account_id,last_active_at').in('account_id',data.map(row=>row.id));
        if(!result.error){activityAvailable=true;for(const row of result.data??[]){const value=Date.parse(row.last_active_at);if(Number.isFinite(value)&&value<=Date.parse(observedAt))activity.set(row.account_id,new Date(value).toISOString());}}
      }catch{/* Optional activity failures must not hide the existing member directory. */}
    }else if(enabled)activityAvailable=true;
    return NextResponse.json({ viewer:{id:actor.id,nickname:actor.nickname},observedAt,activityAvailable,
      accounts:(data??[]).map(row=>({...row,lastActiveAt:activity.get(row.id)??null})) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("SANCTUM account directory error:", error);
    return NextResponse.json({ message: "계정 정보를 불러오지 못했습니다." }, { status: 503 });
  }
}
