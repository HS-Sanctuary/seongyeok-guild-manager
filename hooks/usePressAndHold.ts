import { useRef, useCallback } from "react";

interface UsePressAndHoldOptions {
  interval?: number; // 연속 동작 간격 (기본 100ms)
  delay?: number;    // 꾹 누르기 인식 대기 시간 (기본 300ms)
}

export function usePressAndHold(
  action: () => void,
  options: UsePressAndHoldOptions = {}
) {
  const { interval = 100, delay = 300 } = options;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const actionRef = useRef(action);
  actionRef.current = action;

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (e: React.SyntheticEvent) => {
      // 터치/클릭 기본 동작 중복 방지
      e.preventDefault();
      stop();

      // 1회 즉시 실행
      actionRef.current();

      // delay 이후 연속 실행 시작
      timerRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          actionRef.current();
        }, interval);
      }, delay);
    },
    [delay, interval, stop]
  );

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
}