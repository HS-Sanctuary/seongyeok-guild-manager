"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatWeeklyResetRemaining, getWeeklyReminderKey } from "@/lib/weeklyReset";

export type SanctumNotification = {
  id: number;
  title: string;
  type: string;
  href?: string;
  author: string;
  created_at: string;
  is_pinned: boolean;
};

const MAX_NOTIFICATIONS = 30;

const joinNotificationId = (id: string) => {
  let hash = 0;
  for (const char of id) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) | 0;
  return -(Math.abs(hash) + 1);
};

const getReadStorageKey = (nickname?: string) =>
  `sanctum_notice_reads_${nickname || "guest"}`;

const getInitializedStorageKey = (nickname?: string) =>
  `sanctum_notice_notifications_initialized_${nickname || "guest"}`;

const toNotification = (notice: Record<string, unknown>): SanctumNotification => ({
  id: Number(notice.id),
  title: String(notice.title || "제목 없는 공지"),
  type: String(notice.type || "생텀 공지사항"),
  href: `/kerygma?id=${Number(notice.id)}`,
  author: String(notice.author || "SANCTUM 시스템"),
  created_at: String(notice.created_at || new Date().toISOString()),
  is_pinned: Boolean(notice.is_pinned),
});

const isOperator = (role?: string) => ["길드마스터", "부마스터", "부마스터 대행", "master", "admin"].includes(role || "");

const asMembers = (value: unknown): Array<Record<string, unknown>> => {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is Record<string, unknown> => !!item && typeof item === "object") : [];
  } catch {
    return [];
  }
};

export function useNoticeNotifications(nickname?: string, role?: string) {
  const [notifications, setNotifications] = useState<SanctumNotification[]>([]);
  const [readIds, setReadIds] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | "unsupported">("unsupported");

  const persistReadIds = useCallback(
    (nextReadIds: number[]) => {
      const normalized = Array.from(new Set(nextReadIds)).slice(-MAX_NOTIFICATIONS);
      setReadIds(normalized);
      localStorage.setItem(getReadStorageKey(nickname), JSON.stringify(normalized));
    },
    [nickname]
  );

  const markAsRead = useCallback(
    (id: number) => {
      setReadIds((current) => {
        if (current.includes(id)) return current;
        const next = Array.from(new Set([...current, id])).slice(-MAX_NOTIFICATIONS);
        localStorage.setItem(getReadStorageKey(nickname), JSON.stringify(next));
        return next;
      });
    },
    [nickname]
  );

  const markAllAsRead = useCallback(() => {
    persistReadIds(notifications.map((notification) => notification.id));
  }, [notifications, persistReadIds]);

  const requestBrowserPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setBrowserPermission("unsupported");
      return "unsupported" as const;
    }

    const permission = await window.Notification.requestPermission();
    setBrowserPermission(permission);
    return permission;
  }, []);

  const appendOperationalNotification = useCallback((notification: SanctumNotification, dedupeKey: string) => {
    if (typeof window === "undefined") return;
    const storageKey = `sanctum_operational_notification_${nickname || "guest"}_${dedupeKey}`;
    if (localStorage.getItem(storageKey)) return;
    localStorage.setItem(storageKey, "true");
    setNotifications((current) => [notification, ...current.filter((item) => item.id !== notification.id)].slice(0, MAX_NOTIFICATIONS));
    if ("Notification" in window && window.Notification.permission === "granted") {
      new window.Notification("SANCTUM 알림", { body: `[${notification.type}] ${notification.title}`, icon: "/favicon.ico", tag: dedupeKey });
    }
  }, [nickname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("Notification" in window) {
      setBrowserPermission(window.Notification.permission);
    }

    try {
      const rawReadIds = localStorage.getItem(getReadStorageKey(nickname));
      const parsedReadIds = rawReadIds ? JSON.parse(rawReadIds) : [];
      if (Array.isArray(parsedReadIds)) {
        setReadIds(parsedReadIds.filter((id): id is number => Number.isFinite(Number(id))).map(Number));
      }
    } catch {
      setReadIds([]);
    }
  }, [nickname]);

  useEffect(() => {
    if (!nickname) {
      setNotifications([]);
      setIsLoaded(true);
      return;
    }

    let active = true;

    const fetchNotices = async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("id, title, type, author, created_at, is_pinned")
        .order("created_at", { ascending: false })
        .limit(MAX_NOTIFICATIONS);

      if (!active || error || !data) {
        if (active) setIsLoaded(true);
        return;
      }

      const nextNotifications = data.map((notice) => toNotification(notice));
      setNotifications((current) => [
        ...current.filter((item) => item.type === "운영 · 가입 승인"),
        ...nextNotifications,
      ].slice(0, MAX_NOTIFICATIONS));

      const initializedKey = getInitializedStorageKey(nickname);
      if (!localStorage.getItem(initializedKey)) {
        // 첫 방문에 과거 공지를 모두 새 알림으로 취급하지 않는다.
        persistReadIds(nextNotifications.map((notice) => notice.id));
        localStorage.setItem(initializedKey, "true");
      }

      setIsLoaded(true);
    };

    fetchNotices();

    const channel = supabase
      .channel(`sanctum-notification-${nickname}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notices" },
        (payload) => {
          if (!active || !payload.new) return;

          const nextNotification = toNotification(payload.new as Record<string, unknown>);
          setNotifications((current) => [nextNotification, ...current.filter((item) => item.id !== nextNotification.id)].slice(0, MAX_NOTIFICATIONS));

          if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
            const browserNotification = new window.Notification("SANCTUM 새 공지", {
              body: `[${nextNotification.type}] ${nextNotification.title}`,
              icon: "/favicon.ico",
              tag: `sanctum-notice-${nextNotification.id}`,
            });

            browserNotification.onclick = () => {
              window.focus();
              browserNotification.close();
            };
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [nickname, persistReadIds]);

  useEffect(() => {
    if (!nickname) return;
    const createId = () => -Date.now() - Math.floor(Math.random() * 1000);
    const makeNotification = (type: string, title: string, href: string): SanctumNotification => ({
      id: createId(), title, type, href, author: "SANCTUM 시스템", created_at: new Date().toISOString(), is_pinned: false,
    });
    const partyChannel = supabase.channel(`sanctum-party-notification-${nickname}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "parties" }, ({ new: row }) => {
        const party = row as Record<string, unknown>;
        const isBus = String(party.sub_content || "").includes("길드 버스") || String(party.memo || "").includes("길드 버스");
        if (isBus) appendOperationalNotification(makeNotification("SYNAXIS · 길드 버스", `${String(party.content_name || "새 컨텐츠")} 길드 버스가 개설되었습니다.`, "/party"), `bus-${String(party.id)}`);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "parties" }, ({ new: row }) => {
        const party = row as Record<string, unknown>;
        const completed = ["매칭 완료", "매칭완료", "모집완료"].includes(String(party.status || ""));
        const isParticipant = asMembers(party.members).some((member) => [member.owner, member.owner_account, member.nickname, member.name, member.character_name].map(String).includes(nickname));
        if (completed && isParticipant) appendOperationalNotification(makeNotification("SYNAXIS · 매칭 완료", `${String(party.content_name || "파티")} 매칭이 완료되었습니다.`, "/party"), `party-matched-${String(party.id)}`);
      }).subscribe();

    const pantheonStorageKey = "sanctum_pantheon_top3_snapshot";
    const refreshPantheonSnapshot = async () => {
      const { data } = await supabase.from("characters").select("nickname, owner, is_main, combat_power, life_energy, charm, contribution");
      if (!data?.length) return;
      const score = (character: Record<string, unknown>, category: string) => {
        const cp = Number(character.combat_power) || 0;
        const life = Number(character.life_energy) || 0;
        const charm = Number(character.charm) || 0;
        if (category === "KRATOS") return cp;
        if (category === "TECHNE") return life;
        if (category === "HARMONIA") return charm;
        if (category === "PIETAS") return Number(character.contribution) || 0;
        return cp + life + charm;
      };
      const scoreSnapshot = ["TELOS", "KRATOS", "TECHNE", "HARMONIA", "PIETAS"].map((category) =>
        `${category}:${[...data].sort((a, b) => score(b, category) - score(a, category)).slice(0, 3).map((character) => character.nickname).join(",")}`
      );
      const accounts = new Map<string, { nickname: string; score: number }>();
      data.forEach((character) => {
        const owner = String(character.owner || character.nickname);
        const total = (Number(character.combat_power) || 0) + (Number(character.life_energy) || 0) + (Number(character.charm) || 0);
        const current = accounts.get(owner) || { nickname: owner, score: 0 };
        current.score += total;
        accounts.set(owner, current);
      });
      const symphonia = Array.from(accounts.values()).sort((a, b) => b.score - a.score).slice(0, 3).map((account) => account.nickname).join(",");
      const snapshot = [...scoreSnapshot, `SYMPHONIA:${symphonia}`].join("|");
      const previous = localStorage.getItem(pantheonStorageKey);
      localStorage.setItem(pantheonStorageKey, snapshot);
      if (previous && previous !== snapshot) {
        appendOperationalNotification(makeNotification("AGORA · 판테온", "판테온 Top 3 순위권에 변동이 있습니다.", "/lounge?tab=PANTHEON"), `pantheon-${snapshot}`);
      }
    };
    void refreshPantheonSnapshot();
    let pantheonTimer: number | undefined;
    const characterChannel = supabase.channel(`sanctum-pantheon-notification-${nickname}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "characters" }, () => {
      if (pantheonTimer) window.clearTimeout(pantheonTimer);
      pantheonTimer = window.setTimeout(() => void refreshPantheonSnapshot(), 800);
    }).subscribe();

    const checkWeeklyReminder = async () => {
      const weeklyKey = getWeeklyReminderKey();
      if (!weeklyKey) return;
        const [{ data: characters }, { data: tasks }] = await Promise.all([
          supabase.from("characters").select("nickname, owner, weekly_checks").or(`owner.eq.${nickname},nickname.eq.${nickname}`),
          supabase.from("nexus_tasks").select("id, type, name, max_count").in("type", ["weekly", "repeat_weekly", "repeat_weekend"]),
        ]);
        const hasIncompleteWeeklyWork = (characters || []).some((character: Record<string, unknown>) => {
          const checks = character.weekly_checks as { normal?: unknown[]; repeat?: Record<string, unknown[]> } | unknown[] | null;
          const normalChecks = Array.isArray(checks) ? checks : Array.isArray(checks?.normal) ? checks.normal : [];
          const repeatChecks = !Array.isArray(checks) && checks?.repeat ? checks.repeat : {};
          return (tasks || []).some((task: Record<string, unknown>) => {
            const taskId = String(task.id);
            if (task.type === "weekly") return !normalChecks.some((value) => String(value) === taskId);
            const completedCount = Array.isArray(repeatChecks[taskId]) ? repeatChecks[taskId].filter(Boolean).length : 0;
            return completedCount < (Number(task.max_count) || 1);
          });
        });
        if (hasIncompleteWeeklyWork) appendOperationalNotification(makeNotification("KRONOS · 주간 숙제", `미완료 주간 숙제가 있습니다. 초기화까지 ${formatWeeklyResetRemaining()} 남았습니다.`, "/character"), weeklyKey);
    };
    void checkWeeklyReminder();
    const weeklyTimer = window.setInterval(() => void checkWeeklyReminder(), 60_000);

    return () => {
      window.clearInterval(weeklyTimer);
      supabase.removeChannel(partyChannel);
      supabase.removeChannel(characterChannel);
      if (pantheonTimer) window.clearTimeout(pantheonTimer);
    };
  }, [nickname, role, appendOperationalNotification]);

  useEffect(() => {
    if (!nickname || !isOperator(role)) return;
    let active = true;

    const refreshJoinRequests = async () => {
      const response = await fetch('/api/admin/pending', { cache: 'no-store' });
      if (!response.ok) return;
      const { accounts: data }: { accounts: { id: string; nickname: string; role: string; status: string | null; created_at: string | null }[] } = await response.json();
      if (!active || !data) return;

      const pending = data.filter((account) => [account.role, account.status].some((value) => ["승인대기", "가입대기", "pending"].includes(String(value || ""))));
      const pendingNotifications: SanctumNotification[] = pending.map((account) => ({
        id: joinNotificationId(String(account.id)),
        title: `${account.nickname}님의 가입 승인을 기다리고 있습니다.`,
        type: "운영 · 가입 승인",
        href: "/admin?tab=approval",
        author: "SANCTUM 시스템",
        created_at: String(account.created_at || new Date().toISOString()),
        is_pinned: false,
      }));
      setNotifications((current) => [
        ...pendingNotifications,
        ...current.filter((item) => item.type !== "운영 · 가입 승인"),
      ].slice(0, MAX_NOTIFICATIONS));

      if ("Notification" in window && window.Notification.permission === "granted") {
        const unseen = pendingNotifications.filter((notification) => {
          const seenKey = `sanctum_join_browser_alert_${nickname}_${notification.id}`;
          if (localStorage.getItem(seenKey)) return false;
          localStorage.setItem(seenKey, "true");
          return true;
        });
        if (unseen.length > 0) new window.Notification("SANCTUM 가입 신청", {
          body: unseen.length === 1 ? unseen[0].title : `새 가입 신청 ${unseen.length}건이 승인 대기 중입니다.`,
          icon: "/favicon.ico",
          tag: "sanctum-join-requests",
        });
      }
    };

    void refreshJoinRequests();
    const timer = window.setInterval(() => void refreshJoinRequests(), 45_000);
    window.addEventListener("sanctum_approval_changed", refreshJoinRequests);
    const channel = supabase.channel(`sanctum-approval-notification-${nickname}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "accounts" }, () => void refreshJoinRequests())
      .subscribe();
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("sanctum_approval_changed", refreshJoinRequests);
      supabase.removeChannel(channel);
    };
  }, [nickname, role]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !readIds.includes(notification.id)).length,
    [notifications, readIds]
  );

  return {
    browserPermission,
    isLoaded,
    markAllAsRead,
    markAsRead,
    notifications,
    readIds,
    requestBrowserPermission,
    unreadCount,
  };
}
