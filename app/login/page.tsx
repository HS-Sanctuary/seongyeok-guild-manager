"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SecretCodeInput from "@/components/common/SecretCodeInput";
import { isValidBirthdayMMDD } from "@/lib/accountProfile";

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

const CLASS_LIST = [
  "검술사", "격투가", "궁수", "기사", "대검전사", 
  "댄서", "도적", "듀얼블레이드", "마법사", "빙결술사", 
  "사제", "석궁사수", "수도사", "악사", "암흑술사", 
  "음유시인", "장궁병", "전격술사", "전사", "화염술사", "힐러"
];

const SPECIAL_CHARS = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"];

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
  
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // 기존 로그인 폼 상태
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  // 신규 가입 폼 상태
  const [regNickname, setRegNickname] = useState("");
  const [regFavWord, setRegFavWord] = useState("");
  const [regBirth, setRegBirth] = useState("");
  const [selectedJob, setSelectedJob] = useState("전사");
  const [combatPower, setCombatPower] = useState<number | "">(12000);
  const [magicResist, setMagicResist] = useState<number | "">(1200);
  const [selectedSpecials, setSelectedSpecials] = useState<string[]>(["!", "&"]);

  // 시스템 및 UI 상태
  const [loading, setLoading] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  useEffect(() => {
    if (lockoutTimer > 0) {
      const interval = setInterval(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTimer]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showCredits) {
        setShowCredits(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCredits]);

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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: trimmedNickname, code: code.trim(), keepLoggedIn }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status !== 401) {
          alert(result.message || "로그인을 확인하지 못했습니다.");
          return;
        }
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

      const data = result.account;

      if (keepLoggedIn) {
        localStorage.setItem("sanctum_keep_logged_in", "true");
      } else {
        localStorage.removeItem("sanctum_keep_logged_in");
      }

      executeLoginSuccess(data.id, data.nickname, data.role || "길드원");
    } catch (err) {
      console.error(err);
      alert("로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 2. 신규 계정 가입 신청 (accounts + characters 동시 저장)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNick = regNickname.trim();
    const cleanFav = regFavWord.trim().replaceAll(" ", "");
    const cleanBirth = regBirth.trim();

    if (!cleanNick) return alert("대표 캐릭터 닉네임을 입력해주세요!");
    if (!cleanFav) return alert("좋아하는 것(단어/사물)을 입력해주세요!");
    if (!isValidBirthdayMMDD(cleanBirth)) {
      return alert("생일은 올바른 월일 4자리(예: 0923)로 입력해주세요!");
    }
    if (selectedSpecials.length < 2) {
      return alert("접속 코드용 특수문자 2개를 선택해 주세요!");
    }

    const finalCode = `${cleanFav}${cleanBirth}${specialSuffix}`;
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: cleanNick, code: finalCode, favoriteWord: cleanFav, birthdayMMDD: cleanBirth, job: selectedJob, combatPower: Number(combatPower) || 0, magicResistance: Number(magicResist) || 0 }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "가입 신청을 저장하지 못했습니다.");

      alert(
        `📋 성역 가입 신청이 성공적으로 완료되었습니다!\n\n닉네임: ${cleanNick}\n주 직업: ${selectedJob}\n발급된 비밀코드: ${finalCode}\n\n⚠️ 생성된 비밀코드를 반드시 복사하거나 기억해 두세요!\n길드마스터(한설) 또는 관리자의 승인 처리 후 접속 가능합니다.`
      );

      setNickname(cleanNick);
      setCode("");
      setActiveTab("login");
      setRegNickname("");
      setRegFavWord("");
      setRegBirth("");
      setSelectedSpecials(["!", "&"]);
    } catch (err: any) {
      console.error(err);
      alert(`신규 가입 처리 중 예외 발생: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const executeLoginSuccess = (accountId: string, userNick: string, userRole: string) => {
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

        @keyframes rotateClockwise {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes rotateCounterClockwise {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(-360deg); }
        }

        @keyframes pulseBeam {
          0%, 100% { opacity: 0.28; }
          50% { opacity: 0.48; }
        }
      `}</style>

      {/* 🌟 Light Aura Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,224,130,0.25)_0%,_rgba(212,175,55,0.08)_40%,_transparent_75%)] pointer-events-none z-0" />

      {/* 🔮 Sun Core Sunbeams */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-[56%] sm:top-[50.5%] w-[250vh] h-[250vh] min-w-[1200px] min-h-[1200px] origin-center mix-blend-screen pointer-events-none"
          style={{
            animationName: "rotateClockwise",
            animationDuration: "100s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        >
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

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/50 pointer-events-none z-0" />

      {/* 🪶 Feather Particles */}
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

      {/* ⚔️ Floating Form Container */}
      <div className="w-full max-w-[340px] sm:max-w-[360px] relative z-20 space-y-3 mt-16 sm:mt-24 px-1">
        
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

        {activeTab === "login" ? (
          /* 로그인 폼 */
          <form onSubmit={handleLogin} className="space-y-3 relative z-10 animate-fadeIn">
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
                placeholder="대표 캐릭터 닉네임 (예: 한설)"
              />
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-3 sm:top-2.5 z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(255,224,130,0.9)]">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="#FFE082" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <SecretCodeInput
                value={code}
                onChange={setCode}
                className="w-full pl-11 pr-16 py-2.5 sm:py-2 bg-[#050608]/35 backdrop-blur-md border border-[#D4AF37]/35 text-white rounded-xl text-sm focus:outline-none focus:border-[#FFE082] focus:ring-1 focus:ring-[#FFE082]/60 transition placeholder:text-zinc-300/80"
              />
            </div>

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

            <button
              type="submit"
              disabled={loading || lockoutTimer > 0}
              className="relative w-full py-3 rounded-md bg-gradient-to-r from-[#1a1510] via-[#3a2b1b] to-[#1a1510] border border-[#a6824a] hover:border-[#f3e5ab] text-[#f0d297] font-serif font-medium text-xs sm:text-sm tracking-widest shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.85)] transition-all cursor-pointer flex items-center justify-center group overflow-hidden active:scale-[0.99] mt-1"
            >
              <div className="absolute inset-[2px] border border-[#d4af37]/40 rounded-[3px] pointer-events-none group-hover:border-[#ffe082]/70 transition-colors" />
              <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#d4af37] rotate-45 border border-[#1a1510]" />
              <div className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#d4af37] rotate-45 border border-[#1a1510]" />
              <div className="absolute -left-[3px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#d4af37] rotate-45 border border-[#1a1510]" />
              <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#d4af37] rotate-45 border border-[#1a1510]" />
              <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                {loading ? "성역 인증 중..." : "로그인"}
              </span>
            </button>
          </form>
        ) : (
          /* 신규 가입 폼 (직업 + 스탯 입력 추가) */
          <form onSubmit={handleRegister} className="space-y-2.5 relative z-10 animate-fadeIn">
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
                className="w-full bg-[#050608]/35 backdrop-blur-md border border-[#D4AF37]/35 text-white rounded-xl p-2.5 sm:py-2 text-[11px] sm:text-xs focus:outline-none focus:border-[#FFE082] transition placeholder:text-zinc-300/80 shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
                placeholder="마비노기 모바일 본캐 닉네임"
              />
            </div>

            {/* 직업 선택 & 스탯 입력 */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="inline-block mb-1 px-2 py-0.5 rounded-md bg-black/10 backdrop-blur-[2px]">
                  <label className="block text-[11px] font-normal text-[#FFFDF0]">주 직업</label>
                </div>
                <select
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="w-full bg-[#050608]/50 border border-[#D4AF37]/35 text-white rounded-xl p-2 text-[11px] outline-none"
                >
                  {CLASS_LIST.map((job) => (
                    <option key={job} value={job} className="bg-zinc-900 text-white">{job}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="inline-block mb-1 px-2 py-0.5 rounded-md bg-black/10 backdrop-blur-[2px]">
                  <label className="block text-[11px] font-normal text-[#fff000]">전투력 (CP)</label>
                </div>
                <input
                  type="number"
                  value={combatPower}
                  onChange={(e) => setCombatPower(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-[#050608]/35 border border-[#D4AF37]/35 text-amber-300 font-bold rounded-xl p-2 text-[11px] outline-none"
                />
              </div>

              <div>
                <div className="inline-block mb-1 px-2 py-0.5 rounded-md bg-black/10 backdrop-blur-[2px]">
                  <label className="block text-[11px] font-normal text-cyan-400">마법 저항력</label>
                </div>
                <input
                  type="number"
                  value={magicResist}
                  onChange={(e) => setMagicResist(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-[#050608]/35 border border-[#D4AF37]/35 text-cyan-300 font-bold rounded-xl p-2 text-[11px] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="inline-block mb-1 px-2 py-0.5 rounded-md bg-black/10 backdrop-blur-[2px]">
                  <label className="block text-xs font-normal text-[#FFFDF0]">좋아하는 것 (7글자)</label>
                </div>
                <input
                  type="text"
                  maxLength={7}
                  value={regFavWord}
                  onChange={(e) => setRegFavWord(e.target.value.replace(/\s/g, ""))}
                  className="w-full bg-[#050608]/35 border border-[#D4AF37]/35 text-white rounded-xl p-2.5 sm:py-2 text-[11px] sm:text-xs outline-none"
                  placeholder="예: 성역, 검, 바다"
                />
              </div>

              <div>
                <div className="inline-block mb-1 px-2 py-0.5 rounded-md bg-black/10 backdrop-blur-[2px]">
                  <label className="block text-xs font-normal text-[#FFFDF0]">생일 (월일 4자리)</label>
                </div>
                <input
                  type="text"
                  maxLength={4}
                  value={regBirth}
                  onChange={(e) => setRegBirth(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-[#050608]/35 border border-[#D4AF37]/35 text-white rounded-xl p-2.5 sm:py-2 text-[11px] sm:text-xs outline-none"
                  placeholder="예: 0923"
                />
              </div>
            </div>

            {/* 특수문자 선택 */}
            <div className="space-y-1 pt-0.5">
              <div className="inline-block px-2 py-0.5 rounded-md bg-black/10 backdrop-blur-[2px]">
                <label className="block text-xs font-normal text-[#FFFDF0]">특수문자 2개 선택!</label>
              </div>

              <div className="grid grid-cols-10 gap-1 p-1 bg-[#050608]/30 backdrop-blur-md border border-[#D4AF37]/30 rounded-xl">
                {SPECIAL_CHARS.map((char) => {
                  const isSelected = selectedSpecials.includes(char);
                  return (
                    <button
                      key={char}
                      type="button"
                      onClick={() => handleSpecialCharClick(char)}
                      className={`py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? "bg-[#D4AF37]/30 border border-[#FFE082] text-[#FFE082] shadow-[0_0_8px_rgba(255,224,130,0.5)] scale-105"
                          : "bg-[#050608]/40 border border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {char}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-2 bg-[#050608]/30 backdrop-blur-md border border-[#D4AF37]/35 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 overflow-hidden w-full">
                <span className="text-zinc-200 font-normal text-[11px] whitespace-nowrap">생성된 접속 코드:</span>
                <span className="font-mono font-bold text-[#FFE082] text-xs sm:text-sm truncate">
                  {generatedCodePreview}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-0.5 text-xs">
              <span className="text-[10px] text-[#FFE082] font-medium">⚠️ 코드를 꼭 기억해주세요!</span>
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className="px-2.5 py-1 bg-black/10 text-[#FFE082] hover:text-white transition font-medium text-[11px] cursor-pointer hover:underline"
              >
                로그인 화면으로
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3 rounded-md bg-gradient-to-r from-[#1a1510] via-[#3a2b1b] to-[#1a1510] border border-[#a6824a] hover:border-[#f3e5ab] text-[#f0d297] font-serif font-medium text-xs sm:text-sm tracking-widest transition-all cursor-pointer flex items-center justify-center group active:scale-[0.99] mt-1"
            >
              <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                {loading ? "가입 신청 중..." : "생텀 가입 신청하기"}
              </span>
            </button>
          </form>
        )}

        <div className="mt-4 text-center border-t border-[#D4AF37]/25 pt-3 relative z-10">
          <p className="text-[10px] sm:text-[10.5px] text-[#FFFDF0] font-medium tracking-[0.05em] whitespace-nowrap">
            마비노기 모바일 데이안 서버 | 성역 길드 전용 관리 플랫폼
          </p>
        </div>
      </div>

      {/* CREDITS & HONOR 버튼 및 팝업 모달 */}
      <button
        type="button"
        onClick={() => setShowCredits(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 px-4 py-2 rounded-md bg-gradient-to-r from-[#1a1510] via-[#3a2b1b] to-[#1a1510] border border-[#a6824a] hover:border-[#f3e5ab] text-[#f0d297] font-serif font-medium text-xs tracking-widest shadow-xl hover:scale-105 active:scale-95 cursor-pointer z-40"
      >
        <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
          CREDITS & HONOR
        </span>
      </button>

      {showCredits && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowCredits(false)}
        >
          <div
            className="bg-[#0d0a07]/95 border border-[#a6824a]/80 text-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowCredits(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-[#FFE082] text-base font-bold"
            >
              ✕
            </button>

            <div className="text-center space-y-2 border-b border-[#a6824a]/30 pb-5">
              <div className="text-xs font-serif font-bold tracking-widest text-[#f0d297] uppercase">
                SANCTUM HONOR ROLL & CREDITS
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">
                마비노기 모바일 데이안 서버 성역 길드 통합 플랫폼
              </p>
            </div>

            <div className="space-y-5 max-h-[58vh] overflow-y-auto custom-scrollbar pr-1 text-center">
              <div className="bg-[#16120e]/80 border border-[#a6824a]/50 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-serif font-bold text-[#f0d297] tracking-widest uppercase block">
                  PROJECT LEAD & CHIEF ARCHITECT
                </span>
                <div className="text-lg font-serif font-bold text-white">
                  한설 <span className="text-xs font-sans font-normal text-zinc-400">(길드마스터)</span>
                </div>
                <div className="text-[11px] text-zinc-300/80 font-medium">
                  기획 & 시스템 수석 총괄 개발
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-serif font-bold text-[#f0d297] tracking-wider uppercase block">
                  SPECIAL THANKS (데이안 서버)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {["신파랑", "제스", "수도사는수도사", "화연", "오십쇼", "옛날사골곰탕", "김당지", "ynara"].map((name) => (
                    <div key={name} className="px-2.5 py-2 bg-[#120e0a]/80 border border-[#a6824a]/30 rounded-lg text-xs text-[#e6c288]">
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCredits(false)}
              className="w-full py-3 rounded-md bg-gradient-to-r from-[#1a1510] via-[#3a2b1b] to-[#1a1510] border border-[#a6824a] text-[#f0d297] font-serif text-xs font-bold"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
