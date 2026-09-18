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

// 무작위 2자리 특수문자 생성 헬퍼 함수
const generateRandomSpecialChars = () => {
  const c1 = SPECIAL_CHARS[Math.floor(Math.random() * SPECIAL_CHARS.length)];
  const c2 = SPECIAL_CHARS[Math.floor(Math.random() * SPECIAL_CHARS.length)];
  return `${c1}${c2}`;
};

// 🪶 좌우로 살랑거리며 낙하하는 깃털 14개의 무작위 물리 속성
const FEATHER_PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: `${(i * 7.1 + Math.random() * 4).toFixed(1)}%`,
  duration: `${(7 + Math.random() * 5).toFixed(1)}s`,
  delay: `${(Math.random() * 6).toFixed(1)}s`,
  scale: (0.45 + Math.random() * 0.55).toFixed(2),
}));

export default function LoginPage() {
  const router = useRouter();
  
  // 탭 상태: 'login' (기존 접속) | 'register' (신규 가입)
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // 기존 로그인 폼 상태
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");

  // 신규 가입 폼 상태
  const [regNickname, setRegNickname] = useState("");
  const [regFavWord, setRegFavWord] = useState("");
  const [regBirth, setRegBirth] = useState("");
  const [specialSuffix, setSpecialSuffix] = useState("!&");

  // 시스템 및 UI 상태
  const [loading, setLoading] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // 초기 랜덤 특수문자 발급
  useEffect(() => {
    setSpecialSuffix(generateRandomSpecialChars());
  }, []);

  // 쿨다운 타이머 처리
  useEffect(() => {
    if (lockoutTimer > 0) {
      const interval = setInterval(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTimer]);

  // 비밀번호 미리보기 조합 연산 (단어 + 생일4자리 + 무작위특수문자2자리)
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
      return alert("생일은 4자리 숫자(예: 0923)로 입력해주세요!");
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
      setSpecialSuffix(generateRandomSpecialChars());
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
    <main className="min-h-screen bg-[#070709] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      
      {/* 🪶 [Keyframe Animations] 좌우 파동 깃털 하강 & 날개 미세 호버링 모션 (좌우 반전 적용) */}
      <style jsx global>{`
        @keyframes fallAndSway {
          0% {
            transform: translateY(-10vh) translateX(0px) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 0.85;
          }
          35% {
            transform: translateY(35vh) translateX(45px) rotate(40deg);
          }
          60% {
            transform: translateY(65vh) translateX(-40px) rotate(-30deg);
          }
          85% {
            opacity: 0.85;
          }
          100% {
            transform: translateY(105vh) translateX(15px) rotate(15deg);
            opacity: 0;
          }
        }

        /* 🔄 좌측 날개: scaleX(-1) 반전 및 미세 호버 */
        @keyframes wingFloatLeft {
          0%, 100% {
            transform: scaleX(-1) translateY(0px) rotate(0deg);
          }
          50% {
            transform: scaleX(-1) translateY(-14px) rotate(-1.5deg);
          }
        }

        /* 🔄 우측 날개: scaleX(1) 원본 정방향 및 미세 호버 */
        @keyframes wingFloatRight {
          0%, 100% {
            transform: scaleX(1) translateY(0px) rotate(0deg);
          }
          50% {
            transform: scaleX(1) translateY(-14px) rotate(1.5deg);
          }
        }

        /* ✨ 날개 광원 숨쉬기 모션 */
        @keyframes wingPulseGlow {
          0%, 100% {
            opacity: 0.75;
            filter: drop-shadow(0 0 25px rgba(255, 230, 150, 0.8)) drop-shadow(0 0 50px rgba(212, 175, 55, 0.5));
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 38px rgba(255, 240, 180, 0.95)) drop-shadow(0 0 75px rgba(255, 215, 0, 0.75));
          }
        }
      `}</style>

      {/* 🌌 [Cinematic Background] 심층 구멍 천상 광원 및 오라 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2a2215] via-[#0b0b0e] to-[#050507] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] sm:w-[600px] h-[750px] bg-gradient-to-b from-[#FFE082]/20 via-[#D4AF37]/5 to-transparent blur-3xl pointer-events-none" />

      {/* 🪶 [S자 좌우 흔들림 깃털 파티클 레이어] - 반투명 순백색 도색 */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {FEATHER_PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute top-0 w-6 h-6 sm:w-8 sm:h-8 opacity-0"
            style={{
              left: p.left,
              animation: `fallAndSway ${p.duration} ease-in-out infinite`,
              animationDelay: p.delay,
              transform: `scale(${p.scale})`,
            }}
          >
            {/* ✨ 반투명 순백색 SVG Masking 렌더러 */}
            <div
              className="w-full h-full bg-white/70"
              style={{
                maskImage: `url('/svgs/logo/깃털.svg')`,
                WebkitMaskImage: `url('/svgs/logo/깃털.svg')`,
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskPosition: "center",
                maskSize: "contain",
                WebkitMaskSize: "contain",
                filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))",
              }}
            />
          </div>
        ))}
      </div>

      {/* 우측 상단 웅장한 크레딧 버튼 */}
      <button
        type="button"
        onClick={() => setShowCredits(true)}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#121216]/90 backdrop-blur-md border border-[#D4AF37]/50 hover:border-[#FFE082] text-[#F3E5AB] text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.25)] transition-all flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer z-40"
      >
        <span className="text-[#FFE082]">🏛️</span>
        <span className="tracking-wider">CREDITS & HONOR</span>
      </button>

      {/* 🏛️ [Hero Header] 신성 엠블럼 & 금빛 세공 타이포 로고 */}
      <div className="text-center relative z-20 mb-4 sm:mb-6 animate-fadeIn flex flex-col items-center">
        <div className="relative flex items-center justify-center p-2 group cursor-pointer">
          
          {/* 천상 후광 링 */}
          <svg className="absolute w-[300px] sm:w-[440px] h-[300px] sm:h-[440px] text-[#D4AF37]/25 pointer-events-none" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 4" />
            <circle cx="100" cy="100" r="82" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="74" stroke="currentColor" strokeWidth="0.25" strokeDasharray="12 6" />
          </svg>

          {/* 중앙 황금 후광 광원 */}
          <div className="absolute w-44 h-44 bg-gradient-to-r from-amber-400/30 via-yellow-100/40 to-amber-500/30 rounded-full blur-2xl opacity-90 group-hover:opacity-100 transition duration-1000 animate-pulse pointer-events-none" />

          {/* 메탈릭 골드 타이포 로고 */}
          <div
            className="w-[260px] sm:w-[360px] md:w-[420px] h-20 sm:h-28 md:h-32 bg-gradient-to-b from-[#FFFDF0] via-[#FFD700] to-[#996515] transition-transform duration-500 group-hover:scale-105 relative z-10"
            style={{
              maskImage: `url('/svgs/logo/생텀타이포로고.svg')`,
              WebkitMaskImage: `url('/svgs/logo/생텀타이포로고.svg')`,
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskPosition: "center",
              maskSize: "contain",
              WebkitMaskSize: "contain",
              filter: "drop-shadow(0 0 18px rgba(255, 215, 0, 0.8)) drop-shadow(0 4px 10px rgba(0,0,0,0.9))",
            }}
          />
        </div>

        {/* 한글 서버 라벨 */}
        <div className="flex items-center justify-center gap-3 mt-1 relative z-10">
          <div className="h-[1px] w-12 sm:w-28 bg-gradient-to-r from-transparent via-[#D4AF37]/80 to-transparent" />
          <span className="text-[11px] sm:text-xs font-black text-[#F3E5AB] tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            ◆ 데이안 서버 • 성역 길드 ◆
          </span>
          <div className="h-[1px] w-12 sm:w-28 bg-gradient-to-r from-transparent via-[#D4AF37]/80 to-transparent" />
        </div>
      </div>

      {/* 🪽 [Angel Wings & Form Card Container] 찬란한 신성 광원 도색 하얀 날개 컨테이너 */}
      <div className="relative w-full max-w-md flex items-center justify-center z-20">
        
        {/* 1. 좌측 하얀 날개 (Left Wing) - 검은 스케치선 소멸 & 고광도 천상 오라 적용 */}
        <div
          className="absolute -left-[160px] sm:-left-[280px] md:-left-[350px] -top-[140px] sm:-top-[200px] md:-top-[240px] w-[240px] sm:w-[420px] md:w-[480px] h-auto pointer-events-none z-10 opacity-70 sm:opacity-100"
          style={{ animation: "wingFloatLeft 6s ease-in-out infinite" }}
        >
          {/* 🌟 날개 자체에서 피어오르는 황금빛 백그라운드 광원 블러 */}
          <div className="absolute inset-0 bg-radial from-[#FFE082]/40 via-[#D4AF37]/20 to-transparent blur-2xl rounded-full transform -rotate-12 scale-110 pointer-events-none" />
          
          <img
            src="/svgs/logo/하얀날개.svg"
            alt="White Wing Left"
            className="w-full h-auto object-contain relative z-10 mix-blend-lighten filter brightness-125 contrast-110 drop-shadow-[0_0_25px_rgba(255,230,150,0.85)] drop-shadow-[0_0_55px_rgba(212,175,55,0.6)] drop-shadow-[0_0_80px_rgba(255,255,255,0.7)]"
            style={{ animation: "wingPulseGlow 4s ease-in-out infinite" }}
          />
        </div>

        {/* 2. 우측 하얀 날개 (Right Wing) - 검은 스케치선 소멸 & 고광도 천상 오라 적용 */}
        <div
          className="absolute -right-[160px] sm:-right-[280px] md:-right-[350px] -top-[140px] sm:-top-[200px] md:-top-[240px] w-[240px] sm:w-[420px] md:w-[480px] h-auto pointer-events-none z-10 opacity-70 sm:opacity-100"
          style={{ animation: "wingFloatRight 6s ease-in-out infinite" }}
        >
          {/* 🌟 날개 자체에서 피어오르는 황금빛 백그라운드 광원 블러 */}
          <div className="absolute inset-0 bg-radial from-[#FFE082]/40 via-[#D4AF37]/20 to-transparent blur-2xl rounded-full transform rotate-12 scale-110 pointer-events-none" />

          <img
            src="/svgs/logo/하얀날개.svg"
            alt="White Wing Right"
            className="w-full h-auto object-contain relative z-10 mix-blend-lighten filter brightness-125 contrast-110 drop-shadow-[0_0_25px_rgba(255,230,150,0.85)] drop-shadow-[0_0_55px_rgba(212,175,55,0.6)] drop-shadow-[0_0_80px_rgba(255,255,255,0.7)]"
            style={{ animation: "wingPulseGlow 4s ease-in-out infinite" }}
          />
        </div>

        {/* ⚔️ [Gothic Luxury Form Card] 중앙 접속 카드 */}
        <div className="w-full bg-[#0D0D11]/90 backdrop-blur-2xl border border-[#D4AF37]/40 rounded-2xl p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(212,175,55,0.15)] relative z-20 overflow-hidden">
          
          {/* 4개 모서리 황금 필리그리 장식 */}
          <svg className="absolute top-1 left-1 w-6 h-6 text-[#D4AF37]/60 pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 2h8v2H4v6H2V2zm0 0l6 6" stroke="currentColor" strokeWidth="1" />
          </svg>
          <svg className="absolute top-1 right-1 w-6 h-6 text-[#D4AF37]/60 pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 2h-8v2h6v6h2V2zm0 0l-6 6" stroke="currentColor" strokeWidth="1" />
          </svg>
          <svg className="absolute bottom-1 left-1 w-6 h-6 text-[#D4AF37]/60 pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 22h8v-2H4v-6H2v8zm0 0l6-6" stroke="currentColor" strokeWidth="1" />
          </svg>
          <svg className="absolute bottom-1 right-1 w-6 h-6 text-[#D4AF37]/60 pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 22h-8v-2h6v-6h2v8zm0 0l-6-6" stroke="currentColor" strokeWidth="1" />
          </svg>

          {/* 탭 스위처 */}
          <div className="flex bg-[#050507] p-1 rounded-xl border border-[#2A2A33] mb-5 relative z-10">
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "login"
                  ? "bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C5A059] text-slate-950 font-black shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              🔐 기존 계정 접속
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "register"
                  ? "bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C5A059] text-slate-950 font-black shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              ⚔️ 신규 길드원 가입
            </button>
          </div>

          {/* 2-A. 기존 계정 접속 폼 */}
          {activeTab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4 relative z-10 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-[#D4AF37]/90 mb-1.5">
                  대표 캐릭터 닉네임
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-[#050508]/90 border border-[#2A2A35] text-white rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:border-[#D4AF37] focus:shadow-[0_0_12px_rgba(212,175,55,0.3)] transition"
                  placeholder="대표 캐릭터 닉네임 (예: 한설)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#D4AF37]/90 mb-1.5">
                  접속 코드
                </label>
                <input
                  type="password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-[#050508]/90 border border-[#2A2A35] text-white rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:border-[#D4AF37] focus:shadow-[0_0_12px_rgba(212,175,55,0.3)] transition"
                  placeholder="부여받은 접속 코드를 입력하세요"
                />
              </div>

              {lockoutTimer > 0 && (
                <div className="p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-lg text-center text-xs font-bold text-rose-300">
                  ⚠️ 보안 쿨다운 실행 중: {lockoutTimer}초 남음
                </div>
              )}

              <button
                type="submit"
                disabled={loading || lockoutTimer > 0}
                className="w-full bg-gradient-to-r from-[#D4AF37] via-[#FFF5C0] to-[#C5A059] hover:brightness-110 text-slate-950 font-black py-3 rounded-xl mt-4 transition shadow-[0_4px_20px_rgba(212,175,55,0.35)] disabled:opacity-50 cursor-pointer text-xs sm:text-sm tracking-wide"
              >
                {loading ? "성역 인증 중..." : "생텀 접속하기"}
              </button>
            </form>
          ) : (
            /* 2-B. 신규 길드원 가입 신청 폼 */
            <form onSubmit={handleRegister} className="space-y-3.5 relative z-10 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-[#D4AF37]/90 mb-1">
                  대표 캐릭터 닉네임
                </label>
                <input
                  type="text"
                  value={regNickname}
                  onChange={(e) => setRegNickname(e.target.value)}
                  className="w-full bg-[#050508]/90 border border-[#2A2A35] text-white rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#D4AF37] focus:shadow-[0_0_12px_rgba(212,175,55,0.3)] transition"
                  placeholder="마비노기 모바일 본캐 닉네임"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#D4AF37]/90 mb-1">
                    좋아하는 것 (단어)
                  </label>
                  <input
                    type="text"
                    value={regFavWord}
                    onChange={(e) => setRegFavWord(e.target.value)}
                    className="w-full bg-[#050508]/90 border border-[#2A2A35] text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37] transition"
                    placeholder="예: 사과, 검, 바다"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#D4AF37]/90 mb-1">
                    생월일 (4자리)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={regBirth}
                    onChange={(e) => setRegBirth(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-[#050508]/90 border border-[#2A2A35] text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37] transition"
                    placeholder="예: 0923"
                  />
                </div>
              </div>

              {/* 자동 생성 코드 실시간 미리보기 바 */}
              <div className="p-2.5 bg-[#050508] border border-[#D4AF37]/30 rounded-xl flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-semibold">자동 생성 비밀코드:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-[#FFE082]">
                    {generatedCodePreview}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSpecialSuffix(generateRandomSpecialChars())}
                    className="text-[10px] bg-[#121216] hover:bg-[#1f1f26] border border-[#D4AF37]/50 text-[#F3E5AB] px-1.5 py-0.5 rounded transition cursor-pointer"
                    title="특수문자 조합 재생성"
                  >
                    🎲 재생성
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#D4AF37] via-[#FFF5C0] to-[#C5A059] hover:brightness-110 text-slate-950 font-black py-3 rounded-xl mt-2 transition shadow-[0_4px_20px_rgba(212,175,55,0.35)] disabled:opacity-50 cursor-pointer text-xs sm:text-sm tracking-wide"
              >
                {loading ? "가입 신청 중..." : "성역 가입 신청하기"}
              </button>
            </form>
          )}

          {/* 슬로건 푸터 */}
          <div className="mt-5 text-center border-t border-[#2A2A35] pt-3.5 relative z-10">
            <p className="text-[11px] sm:text-xs text-zinc-400 font-medium tracking-tight">
              마비노기 모바일 데이안 서버 | 성역 길드 전용 플랫폼
            </p>
          </div>
        </div>
      </div>

      {/* 🏛️ 웅장한 시네마틱 크레딧 & 명예의 전당 팝업 모달 */}
      {showCredits && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowCredits(false)}
        >
          <div
            className="bg-[#0D0D11] border-2 border-[#D4AF37] text-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-[0_0_60px_rgba(212,175,55,0.3)] relative overflow-hidden space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              type="button"
              onClick={() => setShowCredits(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-lg font-black p-2 rounded-full hover:bg-[#1a1a22] transition cursor-pointer"
            >
              ✕
            </button>

            {/* 오프닝 타이틀 & 도색 타이포 로고 */}
            <div className="text-center space-y-2 border-b border-[#2A2A35] pb-5 flex flex-col items-center">
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
              <div className="text-xs font-black tracking-widest text-[#D4AF37] uppercase">
                SANCTUM HONOR ROLL & CREDITS
              </div>
              <p className="text-xs text-zinc-400 font-medium">
                마비노기 모바일 데이안 서버 성역 길드 통합 플랫폼
              </p>
            </div>

            {/* 크레딧 명단 */}
            <div className="space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 text-center">
              <div className="bg-[#050508] border border-[#D4AF37]/40 p-4 rounded-2xl shadow-inner space-y-1">
                <span className="text-[10px] font-extrabold text-[#D4AF37] tracking-widest uppercase block">
                  Project Lead & Chief Architect
                </span>
                <div className="text-lg font-black text-white">
                  한설 <span className="text-xs font-normal text-zinc-400">(길드마스터)</span>
                </div>
                <div className="text-[11px] text-zinc-400 font-medium">
                  기획 & 시스템 수석 총괄 개발
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-black text-[#D4AF37] tracking-wider uppercase block">
                  🌟 SPECIAL THANKS (데이안 서버)
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
                      className="px-2.5 py-2 bg-[#050508] border border-[#2A2A35] rounded-xl text-xs font-bold text-zinc-200 shadow-sm hover:border-[#D4AF37]/60 transition truncate"
                    >
                      {name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#2A2A35]">
                <p className="text-xs font-bold text-zinc-400 leading-relaxed italic">
                  "그리고... 성역의 영광을 함께 만들어가는<br />
                  <span className="text-[#FFE082] font-black">모든 데이안 서버 성역 길드원 여러분들께</span> 이 플랫폼을 바칩니다."
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCredits(false)}
              className="w-full bg-gradient-to-r from-[#D4AF37] via-[#FFF5C0] to-[#C5A059] text-slate-950 font-black py-2.5 rounded-xl text-xs transition shadow-md cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </main>
  );
}