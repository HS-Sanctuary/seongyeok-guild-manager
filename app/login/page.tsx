"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface AccountPreset {
  id: string;
  nickname: string;
  role: string;
  alias: string;
  borderColor: string;
  theme: string;
  bgImage?: string;
  dimmer?: number;
}

// 🎯 Shift+1~0 특수문자 10종 리스트
const SPECIAL_CHARS = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"];

// 🪶 좌우로 유기적으로 크게 살랑거리며 천천히 낙하하는 깃털 7개의 결정론적 물리 속성
const FEATHER_PARTICLES = Array.from({ length: 7 }, (_, i) => {
  const pseudo1 = ((i * 17 + 5) % 10) / 10;
  const pseudo2 = ((i * 23 + 11) % 10) / 10;
  const pseudo3 = ((i * 29 + 3) % 10) / 10;
  const pseudo4 = ((i * 31 + 7) % 10) / 10;

  return {
    id: i,
    left: `${(i * 13.5 + pseudo1 * 6).toFixed(1)}%`,
    duration: `${(14 + pseudo2 * 9).toFixed(1)}s`,
    delay: `${(pseudo3 * 8).toFixed(1)}s`,
    scale: (0.45 + pseudo4 * 0.55).toFixed(2),
  };
});

export default function LoginPage() {
  const router = useRouter();
  
  // 탭 상태: 'login' (기존 접속) | 'register' (신규 가입)
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // 기존 로그인 폼 상태
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(true); // 로그인 상태 유지

  // 신규 가입 폼 상태
  const [regNickname, setRegNickname] = useState("");
  const [regFavWord, setRegFavWord] = useState("");
  const [regBirth, setRegBirth] = useState("");
  
  // 🎯 선택된 특수문자 2개 상태 (기본값: ! 와 &)
  const [selectedSpecials, setSelectedSpecials] = useState<string[]>(["!", "&"]);

  // 시스템 및 UI 상태
  const [loading, setLoading] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // 쿨다운 타이머 처리
  useEffect(() => {
    if (lockoutTimer > 0) {
      const interval = setInterval(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTimer]);

  // ⌨️ [ESC 키 입력 시 크레딧 모달 닫기 이벤트 바인딩]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showCredits) {
        setShowCredits(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCredits]);

  // 특수문자 칩 클릭 로직 (최대 2개 유지, 이미 2개면 가장 오래된 것 교체)
  const handleSpecialCharClick = (char: string) => {
    if (selectedSpecials.includes(char)) {
      if (selectedSpecials.length > 1) {
        setSelectedSpecials(selectedSpecials.filter((c) => c !== char));
      }
    } else {
      if (selectedSpecials.length < 2) {
        setSelectedSpecials([...selectedSpecials, char]);
      } else {
        setSelectedSpecials([selectedSpecials[1], char]);
      }
    }
  };

  const specialSuffix = selectedSpecials.join("");

  // 비밀번호 미리보기 조합 연산
  const previewFav = regFavWord.trim().replaceAll(" ", "");
  const previewBirth = regBirth.trim();
  const generatedCodePreview = previewFav || previewBirth
    ? `${previewFav}${previewBirth}${specialSuffix}`
    : `단어+생일+${specialSuffix}`;

  // 1. 기존 계정 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) {
      alert(`보안 쿨다운 진행 중입니다. ${lockoutTimer}초 후 다시 시도해주세요.`);
      return;
    }

    const trimmedNickname = nickname.trim();
    if (!trimmedNickname || !code) {
      alert("대표 캐릭터 닉네임과 접속 코드를 모두 입력해주세요!");
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("nickname", trimmedNickname)
        .eq("code", code.trim())
        .single();

      if (error || !data) {
        const nextFail = failCount + 1;
        setFailCount(nextFail);
        if (nextFail >= 5) {
          setLockoutTimer(30);
          setFailCount(0);
          alert("로그인 시도 5회 실패! 보안을 위해 30초간 접속이 제한됩니다.");
        } else {
          alert(`닉네임 또는 접속 코드가 올바르지 않습니다. (실패 ${nextFail}/5회)`);
        }
        setLoading(false);
        return;
      }

      // 🛡️ 가입 승인 대기 계정 접속 차단 검증
      if (data.role === "승인대기" || data.status === "pending") {
        alert("⏳ 현재 가입 승인 대기 중인 계정입니다.\n길드마스터(한설) 또는 부마스터의 승인 처리 후 접속이 가능합니다!");
        setLoading(false);
        return;
      }

      // 로그인 상태 유지 설정 저장
      if (keepLoggedIn) {
        localStorage.setItem("sanctum_keep_logged_in", "true");
      } else {
        localStorage.removeItem("sanctum_keep_logged_in");
      }

      executeLoginSuccess(data.nickname, data.role || "길드원");
    } catch (err) {
      console.error(err);
      alert("로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 2. 신규 계정 가입 신청 처리 (승인대기 상태 저장)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNick = regNickname.trim();
    const cleanFav = regFavWord.trim().replaceAll(" ", "");
    const cleanBirth = regBirth.trim();

    if (!cleanNick) return alert("대표 캐릭터 닉네임을 입력해주세요!");
    if (!cleanFav) return alert("좋아하는 것(단어/사물)을 입력해주세요!");
    if (!cleanBirth || !/^\d{4}$/.test(cleanBirth)) {
      return alert("생일은 4자리 숫자(예: 0328)로 입력해주세요!");
    }
    if (selectedSpecials.length < 2) {
      return alert("접속 코드용 특수문자 2개를 선택해 주세요!");
    }

    const finalCode = `${cleanFav}${cleanBirth}${specialSuffix}`;
    setLoading(true);

    try {
      // 닉네임 중복 체크
      const { data: existingUser } = await supabase
        .from("accounts")
        .select("id")
        .eq("nickname", cleanNick)
        .maybeSingle();

      if (existingUser) {
        alert("이미 생텀에 등록된 대표 캐릭터 닉네임입니다. 기존 계정 접속을 이용해주세요!");
        setLoading(false);
        return;
      }

      // Supabase accounts 신규 등록 (role: '승인대기')
      const { data: newAcc, error: insertErr } = await supabase
        .from("accounts")
        .insert([
          {
            nickname: cleanNick,
            code: finalCode,
            role: "승인대기",
          },
        ])
        .select()
        .single();

      if (insertErr || !newAcc) {
        console.error("Insert error:", insertErr);
        alert("계정 가입 신청 중 오류가 발생했습니다.");
        setLoading(false);
        return;
      }

      alert(
        `📋 성역 가입 신청이 성공적으로 완료되었습니다!\n\n닉네임: ${cleanNick}\n발급된 비밀코드: ${finalCode}\n\n⚠️ 생성된 비밀코드를 반드시 복사하거나 기억해 두세요!\n길드마스터(한설) 또는 부마스터의 승인 처리 후 접속 가능합니다.`
      );

      // 폼 초기화 및 로그인 탭으로 전환
      setNickname(cleanNick);
      setCode(finalCode);
      setActiveTab("login");
      setRegNickname("");
      setRegFavWord("");
      setRegBirth("");
      setSelectedSpecials(["!", "&"]);
    } catch (err) {
      console.error(err);
      alert("신규 가입 처리 중 예외가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 3. 로그인 성공 시 다계정 스위처 동기화 공통 함수
  const executeLoginSuccess = (userNick: string, userRole: string) => {
    const accountId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const userTheme = "aureum";
    const userBorderColor = "#E6C788";

    const newAccount: AccountPreset = {
      id: accountId,
      nickname: userNick,
      role: userRole,
      alias: userNick,
      borderColor: userBorderColor,
      theme: userTheme,
      bgImage: "",
      dimmer: 40,
    };

    let existingAccounts: AccountPreset[] = [];
    try {
      const saved = localStorage.getItem("sanctum_accounts");
      if (saved) existingAccounts = JSON.parse(saved);
    } catch (err) {}

    const filtered = existingAccounts.filter((a) => a.nickname !== userNick);
    const updatedAccounts = [newAccount, ...filtered];

    localStorage.setItem("sanctum_accounts", JSON.stringify(updatedAccounts));
    localStorage.setItem("sanctum_active_account_id", accountId);
    localStorage.setItem(
      "nexus_user",
      JSON.stringify({
        nickname: userNick,
        role: userRole,
        alias: userNick,
        borderColor: userBorderColor,
        theme: userTheme,
      })
    );

    window.dispatchEvent(new CustomEvent("sanctum_account_changed", { detail: newAccount }));
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-[url('/images/bg-login-mobile.webp')] sm:bg-[url('/images/bg-login-pc.webp')] bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      
      {/* 🪶 & 🔮 [Keyframe Animations] 넓은 좌우 스윙과 천천히 낙하하는 깃털 및 회전 빛줄기 키프레임 */}
      <style jsx global>{`
        @keyframes fallAndSway {
          0% {
            transform: translateY(-10vh) translateX(0px) rotate(-15deg);
            opacity: 0;
          }
          12% {
            opacity: 0.85;
          }
          30% {
            transform: translateY(25vh) translateX(65px) rotate(35deg);
          }
          55% {
            transform: translateY(55vh) translateX(-60px) rotate(-40deg);
          }
          80% {
            transform: translateY(82vh) translateX(40px) rotate(25deg);
            opacity: 0.85;
          }
          100% {
            transform: translateY(108vh) translateX(-15px) rotate(10deg);
            opacity: 0;
          }
        }

        /* 🎯 피벗 중심축(translate(-50%, -50%))을 유지하면서 360도 회전 */
        @keyframes rotateClockwise {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        @keyframes rotateCounterClockwise {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(-360deg);
          }
        }

        @keyframes pulseBeam {
          0%, 100% {
            opacity: 0.28;
          }
          50% {
            opacity: 0.48;
          }
        }
      `}</style>

      {/* 🌟 [Light Aura Overlay] 상단 SANCTUM 로고 천상 황금빛 방사 오라 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,224,130,0.25)_0%,_rgba(212,175,55,0.08)_40%,_transparent_75%)] pointer-events-none z-0" />

      {/* 🔮 [Sun Core Sunbeams / Rotating Light Rays Layer] (초록색 십자가 지정 영역 피벗 바인딩 - 2중 중첩으로 콤보 애니메이션 충돌 분리) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* 1. 시계 방향 회전 외곽 껍질 */}
        <div
          className="absolute left-1/2 top-[56%] sm:top-[50.5%] w-[250vh] h-[250vh] min-w-[1200px] min-h-[1200px] origin-center mix-blend-screen pointer-events-none"
          style={{
            animationName: "rotateClockwise",
            animationDuration: "100s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        >
          {/* 내부 펄스 코어 */}
          <div
            className="w-full h-full origin-center"
            style={{
              background: `repeating-conic-gradient(
                from 0deg at 50% 50%,
                rgba(255, 224, 130, 0.16) 0deg 6deg,
                transparent 6deg 24deg,
                rgba(212, 175, 55, 0.11) 24deg 30deg,
                transparent 30deg 54deg
              )`,
              maskImage: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0) 75%)",
              WebkitMaskImage: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0) 75%)",
              animationName: "pulseBeam",
              animationDuration: "7s",
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
            }}
          />
        </div>

        {/* 2. 반시계 방향 회전 서브 보조 빛줄기 */}
        <div
          className="absolute left-1/2 top-[56%] sm:top-[50.5%] w-[250vh] h-[250vh] min-w-[1200px] min-h-[1200px] origin-center mix-blend-screen pointer-events-none"
          style={{
            background: `repeating-conic-gradient(
              from 15deg at 50% 50%,
              rgba(255, 240, 180, 0.12) 0deg 8deg,
              transparent 8deg 32deg,
              rgba(212, 175, 55, 0.08) 32deg 38deg,
              transparent 38deg 65deg
            )`,
            maskImage: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0) 80%)",
            WebkitMaskImage: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0) 80%)",
            animationName: "rotateCounterClockwise",
            animationDuration: "140s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        />
      </div>

      {/* 🌌 [Soft Bottom Gradient] 텍스트 가독성 보장용 스무스 하단 차광 */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/50 pointer-events-none z-0" />

      {/* 🪶 [넓고 천천히 S자로 흔들리는 깃털 파티클 레이어 - 쇼트핸드 분리 적용] */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {FEATHER_PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute top-0 w-6 h-6 sm:w-8 sm:h-8 opacity-0"
            style={{
              left: p.left,
              animationName: "fallAndSway",
              animationDuration: p.duration,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              animationDelay: p.delay,
              transform: `scale(${p.scale})`,
            }}
          >
            <div
              className="w-full h-full bg-white/80"
              style={{
                maskImage: `url('/svgs/logo/깃털.svg')`,
                WebkitMaskImage: `url('/svgs/logo/깃털.svg')`,
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskPosition: "center",
                maskSize: "contain",
                WebkitMaskSize: "contain",
                filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.9))",
              }}
            />
          </div>
        ))}
      </div>

      {/* ⚔️ [Floating Form Container] (배경 SANCTUM 로고 아래 정돈 mt-20 sm:mt-28) */}
      <div className="w-full max-w-[330px] sm:max-w-[350px] relative z-20 space-y-3 mt-20 sm:mt-28 px-1">
        
        {/* 📜 [상단 슬로건 - 극초경량 블러 bg-black/10 backdrop-blur-[2px]] */}
        <div className="text-center space-y-1">
          <div className="inline-block px-3 py-1 rounded-xl bg-black/10 backdrop-blur-[2px]">
            <h2 className="text-xs sm:text-[13px] font-serif font-medium text-[#FFFDF0] tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
              성역과 함께 시작하는 마비노기 모바일.
            </h2>
          </div>
          <div className="flex items-center justify-center gap-2 opacity-75 pt-0.5">
            <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-[#D4AF37]" />
            <span className="text-[#D4AF37] text-[8px] drop-shadow-[0_0_5px_rgba(212,175,55,0.8)]">✦</span>
            <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-[#D4AF37]" />
          </div>
        </div>

        {/* 2-A. 기존 계정 로그인 폼 */}
        {activeTab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-3 relative z-10 animate-fadeIn">
            
            {/* 아이디 (대표 캐릭터 닉네임) 입력란 - PC뷰 폰트 슬림화 적용 */}
            <div className="relative flex items-center">
              <span className="absolute left-3.5 z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(255,224,130,0.9)]">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="#FFE082" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 sm:py-2 bg-[#050608]/35 backdrop-blur-md border border-[#D4AF37]/35 text-white rounded-xl text-[11px] sm:text-xs focus:outline-none focus:border-[#FFE082] focus:ring-1 focus:ring-[#FFE082]/60 focus:shadow-[0_0_15px_rgba(212,175,55,0.35)] transition placeholder:text-zinc-300/80 shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
                placeholder="대표 캐릭터 닉네임 (예: 성역)"
              />
            </div>

            {/* 비밀번호 (접속 코드) 입력란 - PC뷰 폰트 슬림화 적용 */}
            <div className="relative flex items-center">
              <span className="absolute left-3.5 z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(255,224,130,0.9)]">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="#FFE082" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 sm:py-2 bg-[#050608]/35 backdrop-blur-md border border-[#D4AF37]/35 text-white rounded-xl text-[11px] sm:text-xs focus:outline-none focus:border-[#FFE082] focus:ring-1 focus:ring-[#FFE082]/60 focus:shadow-[0_0_15px_rgba(212,175,55,0.35)] transition placeholder:text-zinc-300/80 shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
                placeholder="생성하신 접속 코드를 입력하세요."
              />
            </div>

            {/* 📜 [로그인 상태 유지 & 생텀 신규 가입] */}
            <div className="flex items-center justify-between py-0.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none group px-2.5 py-1 bg-black/10 backdrop-blur-[2px] rounded-lg transition">
                <div
                  onClick={() => setKeepLoggedIn(!keepLoggedIn)}
                  className="w-4 h-4 rounded-[4px] bg-[#050608]/40 border border-[#D4AF37]/60 flex items-center justify-center cursor-pointer transition-all shadow-inner group-hover:border-[#FFE082]"
                >
                  {keepLoggedIn && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span
                  onClick={() => setKeepLoggedIn(!keepLoggedIn)}
                  className="font-medium text-[11px] sm:text-xs text-[#FFFDF0] transition drop-shadow-[0_1px_4px_rgba(0,0,0,1)]"
                >
                  로그인 상태 유지
                </span>
              </label>

              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className="px-2.5 py-1 bg-black/10 backdrop-blur-[2px] rounded-lg text-[#FFE082] hover:text-white transition font-medium text-[11px] sm:text-xs cursor-pointer hover:underline underline-offset-4 drop-shadow-[0_1px_4px_rgba(0,0,0,1)]"
              >
                생텀 신규 가입
              </button>
            </div>

            {lockoutTimer > 0 && (
              <div className="p-2.5 bg-rose-950/90 border border-rose-800 rounded-xl text-center text-xs font-bold text-rose-200 backdrop-blur-md shadow-lg">
                ⚠️ 보안 쿨다운 실행 중: {lockoutTimer}초 남음
              </div>
            )}

            {/* 👑 [고품격 판타지 RPG 메탈릭 로그인 버튼] */}
            <button
              type="submit"
              disabled={loading || lockoutTimer > 0}
              className="relative w-full py-3 rounded-md bg-gradient-to-r from-[#1a1510] via-[#3a2b1b] to-[#1a1510] border border-[#a6824a] hover:border-[#f3e5ab] text-[#f0d297] font-serif font-medium text-xs sm:text-sm tracking-widest shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.85)] transition-all cursor-pointer flex items-center justify-center group overflow-hidden active:scale-[0.99] mt-1"
            >
              <div className="absolute inset-[2px] border border-[#d4af37]/40 rounded-[3px] pointer-events-none group-hover:border-[#ffe082]/70 transition-colors" />

              {/* 4방향 중앙 다이아몬드 메탈 노드 장식 (✦) */}
              <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#d4af37] rotate-45 border border-[#1a1510] shadow-[0_0_6px_rgba(212,175,55,0.8)]" />
              <div className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#d4af37] rotate-45 border border-[#1a1510] shadow-[0_0_6px_rgba(212,175,55,0.8)]" />
              <div className="absolute -left-[3px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#d4af37] rotate-45 border border-[#1a1510] shadow-[0_0_6px_rgba(212,175,55,0.8)]" />
              <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#d4af37] rotate-45 border border-[#1a1510] shadow-[0_0_6px_rgba(212,175,55,0.8)]" />

              <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                {loading ? "성역 인증 중..." : "로그인"}
              </span>
            </button>
          </form>
        ) : (
          /* 2-B. 신규 길드원 가입 신청 폼 */
          <form onSubmit={handleRegister} className="space-y-3 relative z-10 animate-fadeIn">
            <div>
              <div className="inline-block mb-1 px-2 py-0.5 rounded-md bg-black/10 backdrop-blur-[2px]">
                <label className="block text-xs font-normal text-[#D4AF37] drop-shadow-[0_1px_4px_rgba(0,0,0,1)]">
                  대표 캐릭터 닉네임
                </label>
              </div>
              <input
                type="text"
                value={regNickname}
                onChange={(e) => setRegNickname(e.target.value)}
                className="w-full bg-[#050608]/35 backdrop-blur-md border border-[#D4AF37]/35 text-white rounded-xl p-2.5 sm:py-2 text-[11px] sm:text-xs focus:outline-none focus:border-[#FFE082] focus:shadow-[0_0_15px_rgba(212,175,55,0.35)] transition placeholder:text-zinc-300/80 shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
                placeholder="마비노기 모바일 본캐 닉네임"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="inline-block mb-1 px-2 py-0.5 rounded-md bg-black/10 backdrop-blur-[2px]">
                  <label className="block text-xs font-normal text-[#D4AF37] drop-shadow-[0_1px_4px_rgba(0,0,0,1)]">
                    좋아하는 것 (7글자)
                  </label>
                </div>
                <input
                  type="text"
                  maxLength={7}
                  value={regFavWord}
                  onChange={(e) => setRegFavWord(e.target.value.replace(/\s/g, ""))}
                  className="w-full bg-[#050608]/35 backdrop-blur-md border border-[#D4AF37]/35 text-white rounded-xl p-2.5 sm:py-2 text-[11px] sm:text-xs focus:outline-none focus:border-[#FFE082] transition placeholder:text-zinc-300/80 shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
                  placeholder="예: 사과, 검, 바다"
                />
              </div>

              <div>
                <div className="inline-block mb-1 px-2 py-0.5 rounded-md bg-black/10 backdrop-blur-[2px]">
                  <label className="block text-xs font-normal text-[#D4AF37] drop-shadow-[0_1px_4px_rgba(0,0,0,1)]">
                    생일 (4자리)
                  </label>
                </div>
                <input
                  type="text"
                  maxLength={4}
                  value={regBirth}
                  onChange={(e) => setRegBirth(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-[#050608]/35 backdrop-blur-md border border-[#D4AF37]/35 text-white rounded-xl p-2.5 sm:py-2 text-[11px] sm:text-xs focus:outline-none focus:border-[#FFE082] transition placeholder:text-zinc-300/80 shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
                  placeholder="예: 0328"
                />
              </div>
            </div>

            {/* 🎯 [10개 특수문자 1줄(1 Row) 컴팩트 그리드 배열 적용] */}
            <div className="space-y-1.5 pt-0.5">
              <div className="inline-block px-2 py-0.5 rounded-md bg-black/10 backdrop-blur-[2px]">
                <label className="block text-xs font-normal text-[#D4AF37] drop-shadow-[0_1px_4px_rgba(0,0,0,1)]">
                  특수문자 2개 선택!
                </label>
              </div>

              <div className="grid grid-cols-10 gap-1 p-1.5 bg-[#050608]/30 backdrop-blur-md border border-[#D4AF37]/30 rounded-xl shadow-inner">
                {SPECIAL_CHARS.map((char) => {
                  const isSelected = selectedSpecials.includes(char);
                  return (
                    <button
                      key={char}
                      type="button"
                      onClick={() => handleSpecialCharClick(char)}
                      className={`py-1.5 rounded-md text-[11px] sm:text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
                        isSelected
                          ? "bg-[#D4AF37]/30 border border-[#FFE082] text-[#FFE082] shadow-[0_0_8px_rgba(255,224,130,0.5)] scale-105"
                          : "bg-[#050608]/40 border border-white/10 text-zinc-400 hover:border-[#D4AF37]/40 hover:text-white"
                      }`}
                    >
                      {char}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 🔵 [접속 코드 밀착 연결 및 박스 고투명화] */}
            <div className="p-2.5 bg-[#050608]/30 backdrop-blur-md border border-[#D4AF37]/35 rounded-xl flex items-center justify-between text-xs shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-2 overflow-hidden w-full">
                <span className="text-zinc-200 font-normal text-[11px] whitespace-nowrap">생성된 접속 코드:</span>
                <span className="font-mono font-bold text-[#FFE082] drop-shadow-[0_0_8px_rgba(255,224,130,0.8)] text-xs sm:text-sm truncate">
                  {generatedCodePreview}
                </span>
              </div>
            </div>

            {/* 🩷 [안내문구 & 로그인 이동 링크 한 줄 레이아웃] */}
            <div className="flex items-center justify-between py-0.5 text-xs">
              <div className="px-2.5 py-1 bg-black/10 backdrop-blur-[2px] rounded-lg inline-flex items-center gap-1">
                <span className="text-[10px] text-[#FFE082] font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,1)]">
                  ⚠️ 코드를 꼭 기억해주세요!
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className="px-2.5 py-1 bg-black/10 backdrop-blur-[2px] rounded-lg text-[#FFE082] hover:text-white transition font-medium text-[11px] sm:text-xs cursor-pointer hover:underline underline-offset-4 drop-shadow-[0_1px_4px_rgba(0,0,0,1)]"
              >
                로그인 화면으로
              </button>
            </div>

            {/* 가입 신청 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3 rounded-md bg-gradient-to-r from-[#1a1510] via-[#3a2b1b] to-[#1a1510] border border-[#a6824a] hover:border-[#f3e5ab] text-[#f0d297] font-serif font-medium text-xs sm:text-sm tracking-widest shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.85)] transition-all cursor-pointer flex items-center justify-center group overflow-hidden active:scale-[0.99] mt-1"
            >
              <div className="absolute inset-[2px] border border-[#d4af37]/40 rounded-[3px] pointer-events-none group-hover:border-[#ffe082]/70 transition-colors" />
              <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#d4af37] rotate-45 border border-[#1a1510]" />
              <div className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#d4af37] rotate-45 border border-[#1a1510]" />
              <div className="absolute -left-[3px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#d4af37] rotate-45 border border-[#1a1510]" />
              <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#d4af37] rotate-45 border border-[#1a1510]" />
              <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                {loading ? "가입 신청 중..." : "생텀 가입 신청하기"}
              </span>
            </button>
          </form>
        )}

        {/* 📜 [슬로건 푸터 - 극초경량 블러 bg-black/10 backdrop-blur-[2px]] */}
        <div className="mt-4 text-center border-t border-[#D4AF37]/25 pt-3 relative z-10">
          <div className="inline-block px-2.5 py-0.5 rounded-md bg-black/10 backdrop-blur-[2px]">
            <p className="text-[10px] sm:text-[10.5px] text-[#FFFDF0] font-medium tracking-[0.05em] whitespace-nowrap leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
              마비노기 모바일 데이안 서버 | 성역 길드 전용 관리 플랫폼
            </p>
          </div>
        </div>
      </div>

      {/* 🏛️ [우측 하단 고정 RPG 메탈릭 버튼: CREDITS & HONOR] */}
      <button
        type="button"
        onClick={() => setShowCredits(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 px-4 py-2 rounded-md bg-gradient-to-r from-[#1a1510] via-[#3a2b1b] to-[#1a1510] border border-[#a6824a] hover:border-[#f3e5ab] text-[#f0d297] font-serif font-medium text-xs tracking-widest shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.85)] transition-all flex items-center justify-center group overflow-hidden hover:scale-105 active:scale-95 cursor-pointer z-40"
      >
        <div className="absolute inset-[2px] border border-[#d4af37]/40 rounded-[3px] pointer-events-none group-hover:border-[#ffe082]/70 transition-colors" />

        <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-1 h-1 bg-[#d4af37] rotate-45 border border-[#1a1510] shadow-[0_0_4px_rgba(212,175,55,0.8)]" />
        <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-1 h-1 bg-[#d4af37] rotate-45 border border-[#1a1510] shadow-[0_0_4px_rgba(212,175,55,0.8)]" />
        <div className="absolute -left-[2px] top-1/2 -translate-y-1/2 w-1 h-1 bg-[#d4af37] rotate-45 border border-[#1a1510] shadow-[0_0_4px_rgba(212,175,55,0.8)]" />
        <div className="absolute -right-[2px] top-1/2 -translate-y-1/2 w-1 h-1 bg-[#d4af37] rotate-45 border border-[#1a1510] shadow-[0_0_4px_rgba(212,175,55,0.8)]" />

        <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] tracking-wider">
          CREDITS & HONOR
        </span>
      </button>

      {/* 🏛️ [웅장한 시네마틱 크레딧 & 명예의 전당 팝업 모달] */}
      {showCredits && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowCredits(false)}
        >
          <div
            className="bg-[#0d0a07]/95 backdrop-blur-xl border border-[#a6824a]/80 text-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.2)] relative overflow-hidden space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-[4px] border border-[#d4af37]/30 rounded-xl pointer-events-none" />

            <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#d4af37] rotate-45 border border-[#1a1510] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
            <div className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#d4af37] rotate-45 border border-[#1a1510] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
            <div className="absolute -left-[3px] top-1/2 -translate-y-1/2 w-2 h-2 bg-[#d4af37] rotate-45 border border-[#1a1510] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
            <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-2 h-2 bg-[#d4af37] rotate-45 border border-[#1a1510] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />

            <button
              type="button"
              onClick={() => setShowCredits(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-[#FFE082] text-base font-bold p-1.5 rounded-full hover:bg-white/5 transition cursor-pointer z-10"
            >
              ✕
            </button>

            <div className="text-center space-y-2 border-b border-[#a6824a]/30 pb-5 flex flex-col items-center relative z-10">
              <div
                className="w-48 h-14 bg-gradient-to-b from-[#FFFDF0] via-[#FFD700] to-[#996515] mb-1"
                style={{
                  maskImage: `url('/svgs/logo/생텀타이포로고.svg')`,
                  WebkitMaskImage: `url('/svgs/logo/생텀타이포로고.svg')`,
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskPosition: "center",
                  maskSize: "contain",
                  WebkitMaskSize: "contain",
                  filter: "drop-shadow(0 0 12px rgba(255, 215, 0, 0.7))",
                }}
              />
              <div className="text-xs font-serif font-bold tracking-widest text-[#f0d297] uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                SANCTUM HONOR ROLL & CREDITS
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">
                마비노기 모바일 데이안 서버 성역 길드 통합 플랫폼
              </p>
            </div>

            <div className="space-y-5 max-h-[58vh] overflow-y-auto custom-scrollbar pr-1 text-center relative z-10">
              <div className="bg-[#16120e]/80 border border-[#a6824a]/50 p-4 rounded-xl shadow-inner space-y-1 relative">
                <span className="text-[10px] font-serif font-bold text-[#f0d297] tracking-widest uppercase block drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  PROJECT LEAD & CHIEF ARCHITECT
                </span>
                <div className="text-lg font-serif font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  한설 <span className="text-xs font-sans font-normal text-zinc-400">(길드마스터)</span>
                </div>
                <div className="text-[11px] text-zinc-300/80 font-medium">
                  기획 & 시스템 수석 총괄 개발
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-serif font-bold text-[#f0d297] tracking-wider uppercase block drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  SPECIAL THANKS (데이안 서버)
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    "신파랑",
                    "제스",
                    "수도사는수도사",
                    "화연",
                    "오십쇼",
                    "옛날사골곰탕",
                    "김당지",
                    "ynara",
                  ].map((name) => (
                    <div
                      key={name}
                      className="px-2.5 py-2 bg-[#120e0a]/80 border border-[#a6824a]/30 rounded-lg text-xs font-medium text-[#e6c288] shadow-sm hover:border-[#f3e5ab] hover:text-[#ffe082] transition truncate"
                    >
                      {name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#a6824a]/25">
                <p className="text-xs font-serif font-medium text-zinc-300 leading-relaxed italic drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                  "그리고... 성역의 영광을 함께 만들어가는<br />
                  <span className="text-[#f0d297] font-bold">모든 데이안 서버 성역 길드원 여러분들께</span> 이 플랫폼을 바칩니다."
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCredits(false)}
              className="relative w-full py-3 rounded-md bg-gradient-to-r from-[#1a1510] via-[#3a2b1b] to-[#1a1510] border border-[#a6824a] hover:border-[#f3e5ab] text-[#f0d297] font-serif font-medium text-xs sm:text-sm tracking-widest shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.85)] transition-all cursor-pointer flex items-center justify-center group overflow-hidden active:scale-[0.99] relative z-10"
            >
              <div className="absolute inset-[2px] border border-[#d4af37]/40 rounded-[3px] pointer-events-none group-hover:border-[#ffe082]/70 transition-colors" />

              <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#d4af37] rotate-45 border border-[#1a1510] shadow-[0_0_6px_rgba(212,175,55,0.8)]" />
              <div className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#d4af37] rotate-45 border border-[#1a1510] shadow-[0_0_6px_rgba(212,175,55,0.8)]" />
              <div className="absolute -left-[3px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#d4af37] rotate-45 border border-[#1a1510] shadow-[0_0_6px_rgba(212,175,55,0.8)]" />
              <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#d4af37] rotate-45 border border-[#1a1510] shadow-[0_0_6px_rgba(212,175,55,0.8)]" />

              <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                확인
              </span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}