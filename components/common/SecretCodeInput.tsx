"use client";
import { useState, useSyncExternalStore, type CSSProperties } from "react";

const subscribe = () => () => {};
const maskSupport = () => CSS.supports("-webkit-text-security", "disc");

/** Text input keeps Korean IME composition available; masking is display-only. */
export default function SecretCodeInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const canMaskText = useSyncExternalStore(subscribe, maskSupport, () => false);
  const [composing, setComposing] = useState(false);
  return (
    <div className="w-full">
      <div className="relative">
        <input
          name="password"
          aria-label="접속 코드"
          type={canMaskText || visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          lang="ko"
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              (composing || e.nativeEvent.isComposing || e.keyCode === 229)
            )
              e.preventDefault();
          }}
          style={
            canMaskText
              ? ({
                  WebkitTextSecurity: visible ? "none" : "disc",
                } as CSSProperties)
              : undefined
          }
          className={className}
          placeholder="접속 코드 (한글 입력 가능)"
        />
        <button
          type="button"
          aria-label={visible ? "접속 코드 숨기기" : "접속 코드 보기"}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs text-[#FFE082] bg-[#171717]"
        >
          {visible ? "숨김" : "보기"}
        </button>
      </div>
      <p className="mt-2 flex w-full items-center justify-center rounded-lg bg-black/10 px-2.5 py-1 text-center text-[0.7rem] font-medium leading-snug text-[#FFFDF0] backdrop-blur-[2px] [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
        한/영 상태와 특수문자 순서를 확인해 주세요.
        {!canMaskText && " 한글은 ‘보기’를 켜고 입력해 주세요."}
      </p>
    </div>
  );
}
