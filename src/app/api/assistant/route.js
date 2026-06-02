export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { safeAuth } from "@/lib/safeAuth";
import {
  createOpenAIClient,
  validateOpenAIEnvForRoute,
} from "@/lib/openaiServer.js";
import { requireAuthenticatedAiAccess } from "@/lib/aiRouteGuard.js";

function systemPrompt(taskType, task1Kind) {
  const t = String(taskType || "").toLowerCase();
  const isT1 = t.includes("1");
  const isLetter = isT1 && task1Kind === "gt_letter";
  return isLetter
    ? [
        "You are an IELTS General Training Task 1 letter coach.",
        "Goal: help the user improve tone, bullet coverage, purpose, salutation/closing, and cohesion.",
        "Be concise and actionable. Use bullet points.",
        "Priorities: all bullet points addressed, appropriate formal/semi-formal/informal register, clear opening purpose, polite closing.",
        "When rewriting, keep their situation and requests; improve letter phrases and paragraphing.",
      ].join("\n")
    : isT1
    ? [
        "You are an IELTS Writing Task 1 coach.",
        "Goal: help the user improve to a higher band without changing the underlying meaning.",
        "Be concise and actionable. Use bullet points.",
        "Priorities: Overview quality, key comparisons, trend language, cohesion, grammar accuracy, academic tone.",
        "When rewriting, keep their facts/data, but improve phrasing and structure.",
      ].join("\n")
    : [
        "You are an IELTS Writing Task 2 coach.",
        "Goal: help the user improve to a higher band without changing the underlying meaning.",
        "Be concise and actionable. Use bullet points.",
        "Priorities: clear thesis, topic sentences, logic, examples, cohesion, grammar accuracy, academic tone.",
        "When rewriting, keep their stance and arguments, but improve clarity and structure.",
      ].join("\n");
}

function clampText(s, max) {
  const str = typeof s === "string" ? s : "";
  if (str.length <= max) return str;
  return str.slice(0, max) + "\n...[truncated]";
}

function isProbablyDataUrlImage(s) {
  return typeof s === "string" && /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(s);
}

export async function POST(req) {
  try {
    const envError = validateOpenAIEnvForRoute();
    if (envError) return envError;

    const session = await safeAuth();
    const access = await requireAuthenticatedAiAccess(req, session, "assistant");
    if (!access.ok) return access.response;

    const body = await req.json().catch(() => ({}));
    const taskType = body?.taskType || "Task 2";
    const task1Kind = body?.task1Kind === "gt_letter" ? "gt_letter" : "academic";
    const prompt = clampText(body?.prompt || "", 2500);
    const draft = clampText(body?.draft || "", 12000);
    const image = body?.image;
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const rewriteMode = body?.mode === "rewrite";

    const userContextParts = [];
    if (prompt.trim()) userContextParts.push(`TASK PROMPT:\n${prompt}`);
    if (draft.trim()) userContextParts.push(`USER DRAFT:\n${draft}`);
    const contextBlock = userContextParts.length
      ? `\n\nContext:\n${userContextParts.join("\n\n")}`
      : "";

    const sanitized = messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-12)
      .map((m) => ({ role: m.role, content: clampText(m.content, 4000) }));

    const clientResult = createOpenAIClient();
    if (clientResult.error) return clientResult.error;
    const openai = clientResult.openai;

    const completion = await openai.chat.completions.create({
      model: (process.env.OPENAI_ASSISTANT_MODEL || "").trim() || "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt(taskType, task1Kind) },
        ...sanitized,
        {
          role: "user",
          content:
            isProbablyDataUrlImage(image) &&
            String(taskType).toLowerCase().includes("1") &&
            task1Kind !== "gt_letter"
            ? [
                {
                  type: "text",
                  text:
                    "You can see an IELTS Writing Task 1 chart/diagram image. Write a complete Task 1 response (160–190 words) with: 1 intro (paraphrase), 1 overview, 2 detail paragraphs with key comparisons and numbers. Use an academic tone. If the user draft is provided, improve it without changing meaning; otherwise write from scratch. After the essay, add 5 bullet 'Band 8+ upgrades'." +
                    contextBlock,
                },
                { type: "image_url", image_url: { url: image } },
              ]
            : rewriteMode
            ? "Rewrite the user's full draft for a higher band. Keep the same meaning, facts, and stance. Return ONLY the improved full essay (wrap it in a markdown code fence). After the fence, add exactly one short line telling them to apply it in the editor. No diagnosis or bullet lists." +
              contextBlock
            : rewriteMode
              ? "Rewrite the user's full draft for a higher band. Keep the same meaning, facts, and stance. Return ONLY the improved complete essay (no diagnosis, no bullet lists). Use a clear essay structure for " +
                taskType +
                "." +
                contextBlock
              : "Help me improve my IELTS writing. Give: (1) a quick diagnosis, (2) 5 targeted fixes, (3) one improved paragraph example, (4) 5 band-8+ vocabulary upgrades. Do not change the underlying meaning." +
                contextBlock,
        },
      ],
    });

    const reply = completion?.choices?.[0]?.message?.content || "";
    return NextResponse.json({ reply });
  } catch (err) {
    const msg = err && typeof err.message === "string" ? err.message : "Assistant failed";
    console.error("[assistant] error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
