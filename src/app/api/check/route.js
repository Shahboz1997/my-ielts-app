export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import {
  IELTS_TASK1_STANDARD_INSTRUCTION,
  buildTask1QuestionPaperText,
} from '@/lib/task1Prompt.js';
import { buildGtLetterUserContext } from '@/lib/task1LetterPrompt.js';
import { CREDITS_EXHAUSTED_CODE, userHasCheckCredits } from '@/lib/credits';
import { SUPPORT_EMAIL } from '@/lib/support';
import {
  getOpenAIBaseURL,
  getTrimmedOpenAIKey,
  getTrimmedOpenAIProjectId,
  openAIErrorToJsonResponse,
  validateOpenAIEnvForRoute,
} from '@/lib/openaiServer.js';
import {
  isAuxiliaryOpenAiCheckRequest,
  resolveAuxiliaryAiAccess,
  resolveMainCheckAccess,
} from '@/lib/aiRouteGuard.js';
import { getOpenAIClient } from '@/lib/ielts/checkOpenai.js';
import {
  MAX_DATA_URL_CHARS,
  imageUrlToBase64,
  sanitizeTask1VisionIntro,
} from '@/lib/ielts/imageHelpers.js';
import { buildDescribeImageSystemPrompt } from '@/lib/ielts/prompts.js';
import { normalizeTask1Kind } from '@/lib/ielts/parseResponse.js';
import { runFullIeltsCheck } from '@/lib/ielts/runFullIeltsCheck.js';
import { normalizeCheckResult } from '@/lib/ielts/normalizeCheckResult.js';
import { persistCheckResult } from '@/lib/ielts/persistCheck.js';
import { buildE2eMockCheckResult } from '@/lib/ielts/e2eMockCheckResult.js';
import {
  buildDevMockGeneratedTask1Text,
  buildDevMockLetterTask,
  buildDevMockTask2Question,
} from '@/lib/ielts/devOpenAiMock.js';
import { shouldUseDevOpenAiMock } from '@/lib/openaiServer.js';

const e2eMockOpenAI = () => process.env.E2E_MOCK_OPENAI === '1';
const shouldUseOpenAiMock = () => e2eMockOpenAI() || shouldUseDevOpenAiMock();

export async function DELETE(req) {
  return NextResponse.json({ message: "Archive cleared" }, { status: 200 });
}

export async function POST(req) {
  try {
    // Debug: confirm request reaches this route (never log full secrets).
    const _trimKey = getTrimmedOpenAIKey();
    console.log('[/api/check] POST start', {
      hasKey: _trimKey.length > 0,
      keyLast4: _trimKey ? _trimKey.slice(-4) : null,
      hasProject: Boolean(getTrimmedOpenAIProjectId()),
      baseURL: getOpenAIBaseURL(),
      nodeEnv: process.env.NODE_ENV,
      time: new Date().toISOString(),
    });

    const body = await req.json();
    if (!shouldUseOpenAiMock()) {
      const envError = validateOpenAIEnvForRoute();
      if (envError) return envError;
    }

    const { safeAuth } = await import('@/lib/safeAuth');
    const session = await safeAuth();

    console.log('[/api/check] session', {
      authed: Boolean(session?.user?.id),
      userId: session?.user?.id ?? null,
      hasEmail: Boolean(session?.user?.email),
    });

    if (isAuxiliaryOpenAiCheckRequest(body)) {
      const auxAccess = await resolveAuxiliaryAiAccess(req, session, 'check');
      if (!auxAccess.ok) return auxAccess.response;
    }

    console.log('[/api/check] request body flags', {
      describeImage: Boolean(body?.describeImage),
      hasImage: Boolean(body?.image),
      hasEssay1: typeof body?.essay1 === 'string' && body.essay1.trim().length > 0,
      hasEssay2: typeof body?.essay2 === 'string' && body.essay2.trim().length > 0,
      analysisMode: body?.analysisMode,
    });
    // Footer feedback opens the user's mail client (mailto) — no server SMTP.
    // --- 1. РЕЖИМ: Глубокий анализ изображения (Vision / OCR) ---
    // Frontend sends POST with { describeImage: true, image: base64OrUrl }. API key is read at request time via getOpenAIClient().
    if (body.describeImage && body.image) {
      // Chart vision always uses the real OpenAI API (never E2E_MOCK_OPENAI placeholder text).
      const rawImage = typeof body.image === 'string' ? body.image.trim() : '';
      if (!rawImage) {
        return NextResponse.json({ error: 'Missing image.' }, { status: 400 });
      }
      if (rawImage.startsWith('data:')) {
        if (!rawImage.startsWith('data:image/')) {
          return NextResponse.json({ error: 'Unsupported data URL type. Please upload a valid image.' }, { status: 400 });
        }
        if (rawImage.length > MAX_DATA_URL_CHARS) {
          return NextResponse.json({ error: 'Image is too large. Please upload a smaller image (under ~6MB).' }, { status: 413 });
        }
      }

      const clientResult = getOpenAIClient();
      if (clientResult.error) return clientResult.error;
      const openai = clientResult.openai;
      const describeMessages = (imageUrlForApi) => [
        {
          role: 'system',
          content: buildDescribeImageSystemPrompt(),
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Write the introductory stem only. Do not write the essay or report.',
            },
            { type: 'image_url', image_url: { url: imageUrlForApi } },
          ],
        },
      ];
      try {
        const isPublicHttp = /^https?:\/\//i.test(rawImage);

        let response;
        // Let OpenAI fetch public URLs first (avoids our server download + huge base64); fallback if it fails.
        if (isPublicHttp) {
          try {
            response = await openai.chat.completions.create(
              {
                model: "gpt-4o",
                messages: describeMessages(rawImage),
                max_tokens: 220,
              },
              { timeout: 180_000 }
            );
          } catch (directErr) {
            console.warn(
              "[/api/check] describeImage: vision with public URL failed, trying downloaded image:",
              directErr?.message || directErr
            );
            const finalImage = await imageUrlToBase64(rawImage);
            response = await openai.chat.completions.create(
              {
                model: "gpt-4o",
                messages: describeMessages(finalImage),
                max_tokens: 220,
              },
              { timeout: 180_000 }
            );
          }
        } else {
          response = await openai.chat.completions.create(
            {
              model: "gpt-4o",
              messages: describeMessages(body.image),
              max_tokens: 220,
            },
            { timeout: 180_000 }
          );
        }

        const rawIntro = response?.choices?.[0]?.message?.content;
        const intro = sanitizeTask1VisionIntro(
          typeof rawIntro === 'string' ? rawIntro : ''
        );
        const question = intro
          ? buildTask1QuestionPaperText(intro)
          : IELTS_TASK1_STANDARD_INSTRUCTION;

        return NextResponse.json({ question });
      } catch (error) {
        console.error(
          "OpenAI error (describeImage):",
          error?.response ?? error?.error ?? error?.message,
          "response?.data:",
          error?.response?.data ?? error?.error
        );
        const openAiRes = openAIErrorToJsonResponse(error);
        if (openAiRes) return openAiRes;
        const upstreamStatus = error?.status ?? error?.statusCode ?? error?.response?.status;
        const message =
          typeof error?.message === 'string' && error.message
            ? error.message
            : 'Image description failed.';
        return NextResponse.json(
          {
            error:
              upstreamStatus === 400
                ? 'Invalid image for vision. Please try another image.'
                : 'The selected image source is protected, too large, or invalid. Please upload a smaller file or try another topic.',
            detail: process.env.NODE_ENV === 'development' ? message : undefined,
            question: null,
          },
          { status: 502 }
        );
      }
    }

    // --- 2. РЕЖИМ: Генерация случайного Task 1 (Текст) ---
    if (body.generateTask1) {
      if (shouldUseOpenAiMock()) {
        return NextResponse.json({ question: buildDevMockGeneratedTask1Text() });
      }
      const clientResult = getOpenAIClient();
      if (clientResult.error) return clientResult.error;
      const openai = clientResult.openai;
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You write ONLY the written description that appears above the task instructions on an IELTS Academic Task 1 paper.

Return 2–4 sentences that describe a hypothetical chart, table, map, or process (type + what it shows). Do NOT invent specific numbers. Do NOT write the candidate's report, overview of trends, or analysis.

Do NOT include "Summarize the information" or "Write at least 150 words".`,
            },
            { role: 'user', content: 'Generate a new Academic Task 1 written prompt (description only).' },
          ],
          max_tokens: 220,
        });
        const raw = response?.choices?.[0]?.message?.content;
        const intro = sanitizeTask1VisionIntro(typeof raw === 'string' ? raw : '');
        const question = intro
          ? buildTask1QuestionPaperText(intro)
          : IELTS_TASK1_STANDARD_INSTRUCTION;
        return NextResponse.json({ question });
      } catch (err) {
        console.error('Generate Task 1 error:', err, 'response?.data:', err?.response?.data ?? err?.error);
        const openAiRes = openAIErrorToJsonResponse(err);
        if (openAiRes) return openAiRes;
        return NextResponse.json({ error: err?.message || 'Topic generation failed.' }, { status: 500 });
      }
    }

    // --- 2b. Генерация GT Task 1 (письмо) ---
    if (body.generateLetterTask) {
      if (shouldUseOpenAiMock()) {
        return NextResponse.json({ question: buildDevMockLetterTask(), task1Kind: 'gt_letter' });
      }
      const clientResult = getOpenAIClient();
      if (clientResult.error) return clientResult.error;
      const openai = clientResult.openai;
      const keyword = typeof body.keyword === 'string' ? body.keyword.trim() : '';
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You write an authentic IELTS General Training Writing Task 1 question (letter only).

Return ONLY the task text as it appears on the exam paper:
- 1–2 sentences of situation (who you are, context)
- Exactly 3 bullet points starting with "•" or "-" listing what the letter must include
- End with: "Write at least 150 words. You do not need to write any addresses. Begin your letter as follows:"
- Then one opening line starter e.g. "Dear Sir or Madam," or "Dear Mr Jones,"

Do NOT write the candidate's letter. Do NOT include band descriptors or examiner notes.`,
            },
            {
              role: 'user',
              content: keyword
                ? `Generate a new GT letter task about: ${keyword}`
                : 'Generate a new GT formal letter task (complaint or request to an organisation).',
            },
          ],
          max_tokens: 400,
        });
        const raw = response?.choices?.[0]?.message?.content;
        const text = (typeof raw === 'string' ? raw : '').trim();
        if (!text) {
          return NextResponse.json(
            { error: 'Could not generate a letter task. Please try again.' },
            { status: 502 }
          );
        }
        return NextResponse.json({ question: text, task1Kind: 'gt_letter' });
      } catch (err) {
        console.error('Generate letter task error:', err);
        const openAiRes = openAIErrorToJsonResponse(err);
        if (openAiRes) return openAiRes;
        return NextResponse.json(
          { error: err?.message || 'Letter task generation failed.' },
          { status: 500 }
        );
      }
    }

    // --- 3. РЕЖИМ: Генерация темы Task 2 ---
    if (body.generateTopic) {
      if (shouldUseOpenAiMock()) {
        const keyword = typeof body.keyword === 'string' ? body.keyword.trim() : '';
        return NextResponse.json({ question: buildDevMockTask2Question(keyword) });
      }
      const clientResult = getOpenAIClient();
      if (clientResult.error) return clientResult.error;
      const openai = clientResult.openai;
      const keyword = typeof body.keyword === 'string' ? body.keyword.trim() : '';
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an IELTS Examiner. Generate a Task 2 question. Return ONLY the text." },
            { role: "user", content: `Topic: ${keyword || 'General'}` }
          ]
        });
        const raw = response?.choices?.[0]?.message?.content;
        const text = (typeof raw === 'string' ? raw : '').trim();
        if (!text) {
          return NextResponse.json(
            { error: 'Could not generate a topic. Please try again.' },
            { status: 502 }
          );
        }
        return NextResponse.json({ question: text });
      } catch (err) {
        console.error('Generate topic error:', err, 'response?.data:', err?.response?.data ?? err?.error);
        const openAiRes = openAIErrorToJsonResponse(err);
        if (openAiRes) return openAiRes;
        return NextResponse.json(
          { error: err?.message || err?.error?.message || 'Topic generation failed.' },
          { status: 500 }
        );
      }
    }

    // --- 4. ОСНОВНОЙ РЕЖИМ: Глубокий анализ эссе ---
    const { essay1, essay2, image, analysisMode, promptText, task1Kind: rawTask1Kind, letterMeta } = body;
    const isT1 = analysisMode === 'task1';
    const task1Kind = isT1 ? normalizeTask1Kind(rawTask1Kind) : 'academic';
    const isGtLetter = isT1 && task1Kind === 'gt_letter';
    const userText = isT1 ? essay1 : essay2;
    const taskCriteriaName = isT1 ? 'Task_Achievement' : 'Task_Response';

    if (!userText || userText.trim().length < 10) {
      return NextResponse.json({ error: "Text is too short for analysis." }, { status: 400 });
    }

    const mainAccess = await resolveMainCheckAccess(req, session);
    if (!mainAccess.ok) return mainAccess.response;

    const { getPrisma } = await import('@/lib/prisma');
    const userId = mainAccess.userId;
    const prisma = userId ? getPrisma() : null;

    let persistAfterCheck = false;
    if (userId && prisma) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        console.warn('[/api/check] Session user not in DB; running analysis without save.', { userId });
      } else {
        const hasCredits = userHasCheckCredits(user.credits);
        if (!hasCredits) {
          return NextResponse.json(
            {
              code: CREDITS_EXHAUSTED_CODE,
              error:
                'You have used your included checks and have no credits left. Analysis is not available until you top up. For credit purchases and billing questions, use the support email shown in the site footer.',
              supportEmail: SUPPORT_EMAIL,
            },
            { status: 403 }
          );
        }
        persistAfterCheck = true;
      }
    }
    let result;

    if (shouldUseOpenAiMock()) {
      result = normalizeCheckResult(
        buildE2eMockCheckResult({ userText, promptText, isT1 }),
        { taskCriteriaName, userText, isT1, isGtLetter, task1Kind }
      );
    } else {
      const clientResult = getOpenAIClient();
      if (clientResult.error) return clientResult.error;
      const openai = clientResult.openai;

      const userTextBlock = isGtLetter
        ? `${buildGtLetterUserContext({ promptText, letterMeta })}\n\nSTUDENT LETTER:\n${userText}`
        : `TASK: ${analysisMode.toUpperCase()}\nPROMPT: ${promptText}\nSTUDENT ESSAY:\n${userText}`;

      try {
        const fullCheck = await runFullIeltsCheck({
          openai,
          userTextBlock,
          taskCriteriaName,
          userText,
          isT1,
          isGtLetter,
          task1Kind,
          image,
        });
        if (!fullCheck.ok) {
          return NextResponse.json({ error: fullCheck.message }, { status: fullCheck.status });
        }
        result = fullCheck.result;
      } catch (err) {
        console.error('OpenAI error (essay check):', err?.response ?? err?.error ?? err?.message, 'response?.data:', err?.response?.data ?? err?.error);
        const openAiRes = openAIErrorToJsonResponse(err);
        if (openAiRes) return openAiRes;
        throw err;
      }
    }

    if (persistAfterCheck && userId && prisma) {
      const { savedId, creditsRemaining } = await persistCheckResult({
        prisma,
        userId,
        userText,
        promptText,
        isT1,
        result,
      });
      return NextResponse.json({ ...result, savedId, creditsRemaining });
    }

    return NextResponse.json({ ...result, savedId: null });
  } catch (error) {
    console.error("API ERROR:", error);
    const openAiRes = openAIErrorToJsonResponse(error);
    if (openAiRes) return openAiRes;
    return NextResponse.json({ error: error?.message || 'Server error.' }, { status: 500 });
  }
}
