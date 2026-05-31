"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function readWorkspace(workspaceKey) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(workspaceKey);
    if (!raw) return null;
    const w = JSON.parse(raw);
    if (!w || typeof w !== "object") return null;
    return w;
  } catch {
    return null;
  }
}

function inferTaskTypeFromWorkspace(w) {
  const activeTab = typeof w?.activeTab === "string" ? w.activeTab : "";
  if (activeTab === "Task 1") return "Task 1";
  if (activeTab === "Task 2") return "Task 2";
  const t1 = typeof w?.t1 === "string" ? w.t1.trim() : "";
  const t2 = typeof w?.t2 === "string" ? w.t2.trim() : "";
  if (t1 && !t2) return "Task 1";
  if (t2 && !t1) return "Task 2";
  return null;
}

const TASK_WELCOME = {
  "Task 1":
    "Task 1 rewrite coach. Uses your editor draft. Ask to rewrite, or tap «Rewrite draft» — then apply the result to the editor.",
  "Task 2":
    "Task 2 rewrite coach. Uses your editor draft. Ask to rewrite, or tap «Rewrite draft» — then apply the result to the editor.",
};

const REWRITE_PROMPT =
  "Rewrite my full draft for a higher band. Keep the same meaning and facts. Return ONLY the improved essay (no diagnosis), then one short line: «Tap Apply to editor to paste this.»";

function extractRewrite(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  const fenced = raw.match(/```(?:\w*\n)?([\s\S]*?)```/);
  if (fenced?.[1]?.trim()) return fenced[1].trim();
  const marked = raw.match(
    /(?:IMPROVED(?:\s+VERSION)?|REWRITTEN(?:\s+DRAFT)?|FULL\s+ESSAY)\s*:?\s*\n([\s\S]+)/i
  );
  if (marked?.[1]?.trim()) return marked[1].trim();
  const lines = raw.split("\n");
  const essayLines = [];
  let inEssay = false;
  for (const line of lines) {
    if (/^#{1,3}\s/.test(line) && /diagnosis|fix|upgrade|bullet|tip/i.test(line)) break;
    if (/^(?:[-*•]|\d+\.)\s/.test(line) && essayLines.length > 40) break;
    if (line.trim()) inEssay = true;
    if (inEssay) essayLines.push(line);
  }
  if (essayLines.length >= 3) return essayLines.join("\n").trim();
  return raw;
}

function writeDraftToWorkspace(workspaceKey, task, text) {
  if (typeof window === "undefined") return;
  try {
    const w = readWorkspace(workspaceKey) || { v: 2 };
    const next = { ...w, v: w.v || 2 };
    if (task === "Task 1") next.t1 = text;
    else next.t2 = text;
    localStorage.setItem(workspaceKey, JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent("ielts-stratum-workspace-patch", { detail: next })
    );
  } catch {
    /* ignore quota errors */
  }
}

function defaultMessagesForTask(task) {
  return [{ role: "assistant", content: TASK_WELCOME[task] || TASK_WELCOME["Task 2"] }];
}

function readContextFromWorkspace(w, task) {
  if (!w) {
    return { prompt: "", draft: "", chartImage: "", task1Kind: "academic" };
  }
  const kind = w?.task1Kind === "gt_letter" ? "gt_letter" : "academic";
  if (task === "Task 1") {
    const prompt =
      kind === "gt_letter"
        ? w?.promptT1Letter || w?.promptT1
        : w?.promptT1Academic || w?.promptT1;
    return {
      prompt: typeof prompt === "string" ? prompt : "",
      draft: typeof w?.t1 === "string" ? w.t1 : "",
      chartImage:
        kind === "gt_letter"
          ? ""
          : typeof w?.image === "string"
            ? w.image
            : "",
      task1Kind: kind,
    };
  }
  return {
    prompt: typeof w?.promptT2 === "string" ? w.promptT2 : "",
    draft: typeof w?.t2 === "string" ? w.t2 : "",
    chartImage: "",
    task1Kind: kind,
  };
}

export default function ChatAssistantWidget() {
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const userStorageId = useMemo(() => {
    const id = session?.user?.id || session?.user?.email;
    return typeof id === "string" && id.trim().length > 0 ? id.trim() : "anon";
  }, [session?.user?.id, session?.user?.email]);
  const workspaceKey = useMemo(
    () => `ielts_stratum_workspace_v1:${userStorageId}`,
    [userStorageId]
  );

  const [open, setOpen] = useState(false);
  const [taskType, setTaskType] = useState("Task 2");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applyNotice, setApplyNotice] = useState("");
  const [messagesByTask, setMessagesByTask] = useState(() => ({
    "Task 1": defaultMessagesForTask("Task 1"),
    "Task 2": defaultMessagesForTask("Task 2"),
  }));
  const userPickedTaskRef = useRef(false);
  const messages = messagesByTask[taskType] ?? defaultMessagesForTask(taskType);

  const getEditorContext = () =>
    readContextFromWorkspace(readWorkspace(workspaceKey), taskType);

  // Match chat tab to editor tab once when opening; never override user picks.
  useEffect(() => {
    if (!isAuthed || !open || typeof window === "undefined") return;
    if (userPickedTaskRef.current) return;
    const w = readWorkspace(workspaceKey);
    if (!w) return;
    const inferred = inferTaskTypeFromWorkspace(w);
    if (inferred) setTaskType(inferred);
  }, [open, isAuthed, workspaceKey]);

  function switchTaskType(next) {
    if (next !== "Task 1" && next !== "Task 2") return;
    if (next === taskType) return;
    userPickedTaskRef.current = true;
    setTaskType(next);
    setError("");
    setInput("");
    setApplyNotice("");
  }

  function applyToEditor(content) {
    const text = extractRewrite(content);
    if (!text) return;
    writeDraftToWorkspace(workspaceKey, taskType, text);
    setApplyNotice(`Applied to ${taskType} editor.`);
    window.setTimeout(() => setApplyNotice(""), 3000);
  }

  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isAuthed || !open) return;
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [open, messages.length, busy, isAuthed]);

  // Lock page scroll on mobile while the bottom sheet is open.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(max-width: 639px)");
    if (!mq.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open || !isAuthed) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open, isAuthed]);

  const canSend = useMemo(() => {
    return !busy && input.trim().length > 0;
  }, [busy, input]);

  async function sendText(textRaw, { mode } = {}) {
    if (busy) return;
    setError("");
    setApplyNotice("");
    const text = String(textRaw || "").trim();
    if (!text) return;
    setInput("");
    const ctx = getEditorContext();
    const cur = messagesByTask[taskType] ?? defaultMessagesForTask(taskType);
    const next = [...cur, { role: "user", content: text }];
    setMessagesByTask((prev) => ({ ...prev, [taskType]: next }));
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          taskType,
          task1Kind: taskType === "Task 1" ? ctx.task1Kind : undefined,
          prompt: ctx.prompt,
          draft: ctx.draft,
          image: ctx.task1Kind === "gt_letter" ? null : ctx.chartImage,
          messages: next,
          mode: mode === "rewrite" ? "rewrite" : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      const reply = data?.reply || "";
      setMessagesByTask((prev) => ({
        ...prev,
        [taskType]: [
          ...(prev[taskType] ?? defaultMessagesForTask(taskType)),
          { role: "assistant", content: reply },
        ],
      }));
      if (mode === "rewrite" && reply.trim()) {
        applyToEditor(reply);
      }
    } catch (e) {
      setError(e?.message || "Assistant request failed");
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!canSend) return;
    return sendText(input);
  }

  function clearChat() {
    setMessagesByTask((prev) => ({
      ...prev,
      [taskType]: defaultMessagesForTask(taskType),
    }));
    setError("");
    setInput("");
    setApplyNotice("");
  }

  // Only show after registration/login (authenticated session).
  if (!isAuthed) return null;

  return (
    <div
      className="fixed z-[200]"
      style={{
        right: "calc(1rem + env(safe-area-inset-right))",
        bottom: "calc(1rem + env(safe-area-inset-bottom))",
      }}
    >
      {open && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-[2px] sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-assistant-title"
            className="fixed inset-x-0 bottom-0 z-[201] sm:static sm:mb-3 sm:w-[420px] sm:max-w-[calc(100vw-2rem-env(safe-area-inset-left)-env(safe-area-inset-right))] rounded-t-3xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur shadow-2xl overflow-hidden h-[min(85dvh,calc(100dvh-env(safe-area-inset-bottom)))] sm:h-[min(560px,70dvh)] flex flex-col"
          >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70 dark:border-slate-800 shrink-0">
            <div className="min-w-0">
              <div
                id="chat-assistant-title"
                className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100"
              >
                AI Writing Assistant
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Rewrites Task 1 & Task 2 drafts
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={clearChat}
                className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500"
                aria-label="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => switchTaskType("Task 1")}
                className={cx(
                  "px-3 py-1.5 rounded-2xl text-xs font-semibold border transition-colors",
                  taskType === "Task 1"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                )}
              >
                Task 1
              </button>
              <button
                type="button"
                onClick={() => switchTaskType("Task 2")}
                className={cx(
                  "px-3 py-1.5 rounded-2xl text-xs font-semibold border transition-colors",
                  taskType === "Task 2"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                )}
              >
                Task 2
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
              Uses the {taskType} text from your editor — write there, rewrite here.
            </p>
          </div>

          <div
            ref={messagesRef}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-3"
          >
            {messages.map((m, idx) => {
              const isLastAssistant =
                m.role === "assistant" &&
                idx ===
                  messages.reduce((last, msg, i) => (msg.role === "assistant" ? i : last), -1);
              return (
                <div
                  key={idx}
                  className={cx(
                    m.role === "user" ? "ml-8" : "mr-8"
                  )}
                >
                  <div
                    className={cx(
                      "rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap",
                      m.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    )}
                  >
                    {m.content}
                  </div>
                  {isLastAssistant && m.content.trim() && (
                    <button
                      type="button"
                      onClick={() => applyToEditor(m.content)}
                      className="mt-1.5 px-2.5 py-1 rounded-xl text-[10px] font-semibold border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                    >
                      Apply to {taskType} editor
                    </button>
                  )}
                </div>
              );
            })}
            {applyNotice && (
              <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                {applyNotice}
              </div>
            )}
            {busy && (
              <div className="rounded-2xl px-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 mr-8">
                Thinking…
              </div>
            )}
            {error && (
              <div className="rounded-2xl px-3 py-2 text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                {error}
              </div>
            )}
          </div>

          <div className="shrink-0 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3 border-t border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60">
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => sendText(REWRITE_PROMPT, { mode: "rewrite" })}
                className={cx(
                  "px-3 py-1.5 rounded-2xl text-[11px] font-semibold border transition-colors",
                  busy
                    ? "bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                    : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                )}
              >
                Rewrite draft
              </button>
            </div>
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask to rewrite your draft…"
                rows={2}
                className="flex-1 px-3 py-2 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-400 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!busy) sendText(e.currentTarget.value);
                  }
                }}
              />
              <button
                type="button"
                onClick={send}
                disabled={!canSend}
                className={cx(
                  "h-10 w-10 rounded-2xl flex items-center justify-center border transition-all active:scale-95",
                  canSend
                    ? "bg-slate-900 text-white border-slate-900 hover:bg-indigo-600 hover:border-indigo-600"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                )}
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-500">
              Enter = send • Shift+Enter = new line
            </div>
          </div>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "w-14 h-14 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-center hover:scale-[1.02] active:scale-95 transition-transform",
          open && "hidden sm:flex"
        )}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        aria-expanded={open}
      >
        <MessageCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
      </button>
    </div>
  );
}

