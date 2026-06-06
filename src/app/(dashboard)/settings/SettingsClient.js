"use client";

import { UserCircle, Mail, Bell, Loader2, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

const TZ_OPTIONS = [
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Tashkent",
  "Asia/Dubai",
  "Asia/Shanghai",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
];

const WEEKDAYS = [
  { v: 0, en: "Sun", ru: "Вс" },
  { v: 1, en: "Mon", ru: "Пн" },
  { v: 2, en: "Tue", ru: "Вт" },
  { v: 3, en: "Wed", ru: "Ср" },
  { v: 4, en: "Thu", ru: "Чт" },
  { v: 5, en: "Fri", ru: "Пт" },
  { v: 6, en: "Sat", ru: "Сб" },
];

function parseDaysString(s) {
  if (typeof s !== "string" || !s.trim()) return [1, 2, 3, 4, 5];
  return s
    .split(",")
    .map((x) => parseInt(x.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6);
}

export default function SettingsClient({ user, reminders }) {
  const isRu = user?.language === "ru";
  const [emailEnabled, setEmailEnabled] = useState(Boolean(reminders?.practiceRemindersEnabled));
  const [telegramEnabled, setTelegramEnabled] = useState(
    Boolean(reminders?.practiceRemindersTelegramEnabled)
  );
  const [telegramLinked, setTelegramLinked] = useState(Boolean(reminders?.telegramChatId));
  const [telegramConfigured, setTelegramConfigured] = useState(true);
  const [hour, setHour] = useState(reminders?.practiceReminderHour ?? 19);
  const [minute, setMinute] = useState(reminders?.practiceReminderMinute ?? 0);
  const [tz, setTz] = useState(reminders?.practiceReminderTimezone || "UTC");
  const [days, setDays] = useState(() => new Set(parseDaysString(reminders?.practiceReminderDays)));
  const [saving, setSaving] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkPending, setLinkPending] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const pollRef = useRef(null);

  const isLocalHost = useMemo(() => {
    if (typeof window === "undefined") return false;
    const h = window.location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h.startsWith("192.168.");
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const tzSelectOptions = useMemo(() => {
    const base = [...TZ_OPTIONS];
    if (tz && !base.includes(tz)) return [tz, ...base];
    return base;
  }, [tz]);

  const timeStr = useMemo(() => {
    const h = String(hour).padStart(2, "0");
    const m = String(minute).padStart(2, "0");
    return `${h}:${m}`;
  }, [hour, minute]);

  const setTimeFromInput = (e) => {
    const v = e.target.value;
    if (!v || !/^\d{2}:\d{2}$/.test(v)) return;
    const [hs, ms] = v.split(":");
    const h = parseInt(hs, 10);
    const m = parseInt(ms, 10);
    if (!Number.isNaN(h) && h >= 0 && h <= 23) setHour(h);
    if (!Number.isNaN(m) && m >= 0 && m <= 59) setMinute(m);
  };

  const toggleDay = (v) => {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      if (next.size === 0) next.add(v);
      return next;
    });
  };

  const connectTelegram = async () => {
    if (isLocalHost) {
      toast.error(
        isRu
          ? "Привязка работает только на stratumielts.com — откройте настройки там"
          : "Linking only works on stratumielts.com — open settings there"
      );
      window.open("https://stratumielts.com/settings", "_blank", "noopener,noreferrer");
      return;
    }

    setLinkLoading(true);
    try {
      const res = await fetch("/api/user/telegram-link", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || res.statusText);
      window.open(j.linkUrl, "_blank", "noopener,noreferrer");
      setLinkPending(true);
      toast.success(
        isRu
          ? "В Telegram нажмите Start (не пишите /start вручную)"
          : "In Telegram tap Start (do not type /start manually)"
      );
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch("/api/user/telegram-link");
          if (!statusRes.ok) return;
          const status = await statusRes.json();
          if (status.linked) {
            setTelegramLinked(true);
            setLinkPending(false);
            setTelegramConfigured(status.configured !== false);
            toast.success(isRu ? "Telegram привязан" : "Telegram connected");
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch {
          /* ignore */
        }
      }, 3000);
      setTimeout(() => {
        if (pollRef.current) clearInterval(pollRef.current);
      }, 3 * 60 * 1000);
    } catch (err) {
      toast.error(err?.message || (isRu ? "Не удалось создать ссылку" : "Could not create link"));
    } finally {
      setLinkLoading(false);
    }
  };

  const disconnectTelegram = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/user/telegram-link", { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || res.statusText);
      }
      setTelegramLinked(false);
      setLinkPending(false);
      setTelegramEnabled(false);
      toast.success(isRu ? "Telegram отключён" : "Telegram disconnected");
    } catch (err) {
      toast.error(err?.message || (isRu ? "Ошибка" : "Failed"));
    } finally {
      setDisconnecting(false);
    }
  };

  const saveReminders = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/reminder-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceRemindersEnabled: emailEnabled,
          practiceRemindersTelegramEnabled: telegramEnabled,
          practiceReminderHour: hour,
          practiceReminderMinute: minute,
          practiceReminderTimezone: tz,
          practiceReminderDays: Array.from(days).sort((a, b) => a - b),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || res.statusText);
      }
      toast.success(isRu ? "Сохранено" : "Saved");
    } catch (err) {
      toast.error(err?.message || (isRu ? "Ошибка сохранения" : "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto">
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm">
        <h2 className="text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-400 mb-4">
          Profile
        </h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          {user?.image ? (
            <img
              src={user.image}
              alt=""
              className="w-14 h-14 rounded-full border-2 border-indigo-600/30 shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-indigo-600/20 flex items-center justify-center shrink-0">
              <UserCircle className="w-8 h-8 text-indigo-600" strokeWidth={1.5} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold tracking-tight text-slate-900 dark:text-slate-100 truncate">
              {user?.name ?? "—"}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1 break-all">
              <Mail className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              {user?.email ?? "—"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-indigo-600" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-400">
            {isRu ? "Напоминания о практике" : "Practice reminders"}
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          {isRu
            ? "Одно расписание — доставка на email и/или в Telegram. Сервер проверяет время по cron; на Hobby Vercel запуск ~раз в сутки."
            : "One schedule — delivery via email and/or Telegram. The server checks time on a cron; on Vercel Hobby that runs about once per day."}
        </p>

        <div className="space-y-3 mb-4">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            {isRu ? "Время (локальное)" : "Local time"}
          </label>
          <input
            type="time"
            value={timeStr}
            onChange={setTimeFromInput}
            className="w-full max-w-[12rem] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2 mb-4">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            {isRu ? "Часовой пояс" : "Timezone"}
          </label>
          <select
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
          >
            {tzSelectOptions.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            {isRu ? "Дни недели" : "Days of week"}
          </p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => (
              <button
                key={d.v}
                type="button"
                onClick={() => toggleDay(d.v)}
                className={`min-h-[40px] px-3 rounded-lg text-xs font-medium border transition-colors ${
                  days.has(d.v)
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                {isRu ? d.ru : d.en}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {isRu ? "Каналы доставки" : "Delivery channels"}
          </p>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-800 dark:text-slate-200">
              {isRu ? "Email" : "Email"} — {user?.email ?? "—"}
            </span>
          </label>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
              <Send className="w-4 h-4 text-sky-500 shrink-0" strokeWidth={1.5} />
              <span className="font-medium">Telegram</span>
              {telegramLinked ? (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  {isRu ? "привязан" : "connected"}
                </span>
              ) : (
                <span className="text-xs text-slate-500">
                  {isRu ? "не привязан" : "not connected"}
                </span>
              )}
            </div>

            {!telegramConfigured ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {isRu
                  ? "Бот не настроен на сервере (TELEGRAM_BOT_TOKEN)."
                  : "Bot not configured on server (TELEGRAM_BOT_TOKEN)."}
              </p>
            ) : telegramLinked ? (
              <button
                type="button"
                onClick={disconnectTelegram}
                disabled={disconnecting}
                className="text-xs text-red-600 hover:text-red-500 disabled:opacity-60"
              >
                {disconnecting
                  ? isRu
                    ? "Отключение…"
                    : "Disconnecting…"
                  : isRu
                    ? "Отвязать Telegram"
                    : "Disconnect Telegram"}
              </button>
            ) : (
              <div className="space-y-2">
                {isLocalHost ? (
                  <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
                    {isRu
                      ? "На localhost привязка не сработает: webhook бота идёт на stratumielts.com. Откройте настройки на сайте."
                      : "Linking won't work on localhost — the bot webhook hits stratumielts.com. Use settings on the live site."}
                    {" "}
                    <a
                      href="https://stratumielts.com/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      stratumielts.com/settings
                    </a>
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={connectTelegram}
                  disabled={linkLoading}
                  className="inline-flex items-center gap-2 min-h-[36px] px-3 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 disabled:opacity-60"
                >
                  {linkLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  {isRu ? "Подключить Telegram" : "Connect Telegram"}
                </button>
                {linkPending ? (
                  <p className="text-xs text-sky-700 dark:text-sky-300">
                    {isRu
                      ? "1. В открывшемся Telegram нажмите Start · 2. Дождитесь «привязан» здесь · Не вводите /start вручную"
                      : "1. Tap Start in the Telegram tab · 2. Wait for “connected” here · Don't type /start manually"}
                  </p>
                ) : null}
              </div>
            )}

            <label
              className={`flex items-center gap-3 ${telegramLinked ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
            >
              <input
                type="checkbox"
                checked={telegramEnabled}
                disabled={!telegramLinked}
                onChange={(e) => setTelegramEnabled(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
              />
              <span className="text-sm text-slate-800 dark:text-slate-200">
                {isRu ? "Включить напоминания в Telegram" : "Enable Telegram reminders"}
              </span>
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={saveReminders}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isRu ? "Сохранить напоминания" : "Save reminders"}
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm">
        <h2 className="text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-400 mb-4">
          Account
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm break-words">
          {isRu
            ? "Тема оформления — переключатель Sun/Moon в шапке."
            : "Theme: use the Sun/Moon toggle in the navigation bar."}
        </p>
      </section>
    </div>
  );
}
