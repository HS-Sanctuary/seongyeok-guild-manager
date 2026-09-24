import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/server/sanctumSession";
import { isValidBirthdayMMDD, matchesSignupCode } from "@/lib/accountProfile";

const ALLOWED_JOBS = new Set([
  "검술사", "격투가", "궁수", "기사", "대검전사", "댄서", "도적", "듀얼블레이드", "마법사", "빙결술사",
  "사제", "석궁사수", "수도사", "악사", "암흑술사", "음유시인", "장궁병", "전격술사", "전사", "화염술사", "힐러",
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const favoriteWord = typeof body.favoriteWord === "string" ? body.favoriteWord.trim() : "";
    const birthdayMMDD = typeof body.birthdayMMDD === "string" ? body.birthdayMMDD.trim() : "";
    const job = typeof body.job === "string" ? body.job : "";
    const combatPower = Number(body.combatPower);
    const magicResistance = Number(body.magicResistance);

    if (!nickname || nickname.length > 12 || code.length < 6 || code.length > 128
      || !favoriteWord || favoriteWord.length > 7 || /\s/.test(favoriteWord)
      || !isValidBirthdayMMDD(birthdayMMDD) || !matchesSignupCode(code, favoriteWord, birthdayMMDD)
      || !ALLOWED_JOBS.has(job)
      || !Number.isSafeInteger(combatPower) || combatPower < 0 || !Number.isSafeInteger(magicResistance) || magicResistance < 0) {
      return NextResponse.json({ message: "가입 정보를 다시 확인해 주세요." }, { status: 400 });
    }

    const { data, error } = await getServerSupabase().rpc("sanctum_register_account_with_profile", {
      input_nickname: nickname,
      input_code: code,
      input_job: job,
      input_combat_power: String(combatPower),
      input_magic_resistance: String(magicResistance),
      input_favorite_word: favoriteWord,
      input_birthday_mmdd: birthdayMMDD,
    });
    if (error) {
      if (error.code === "23505" || /이미 등록된/.test(error.message)) {
        return NextResponse.json({ message: "이미 등록된 대표 캐릭터 닉네임입니다." }, { status: 409 });
      }
      console.error("SANCTUM register error:", error.code);
      return NextResponse.json({ message: "가입 신청을 저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요." }, { status: 503 });
    }

    const account = data?.[0];
    if (!account) return NextResponse.json({ message: "가입 신청 결과를 확인하지 못했습니다." }, { status: 503 });
    return NextResponse.json({ account }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("SANCTUM register route error:", error);
    return NextResponse.json({ message: "가입 신청 중 오류가 발생했습니다." }, { status: 500 });
  }
}
