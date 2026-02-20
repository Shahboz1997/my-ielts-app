

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import nodemailer from 'nodemailer';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TASK1_FOCUS = `TASK 1 (Academic) FOCUS:
- Task Achievement: Accurate reporting of main trends, key features, and data; clear overview; no irrelevant detail.
- Coherence and Cohesion: Logical organisation; accurate data comparisons; appropriate linking (e.g. "whereas", "in contrast"); clear progression.`;

const TASK2_FOCUS = `TASK 2 (General/Academic) FOCUS:
- Task Response: Clear position; full development of ideas; relevant examples; argument progression.
- Coherence and Cohesion: Clear paragraphing; logical flow; cohesive devices; topic sentences.`;

const BAND_LIMITERS = `STRICT BAND LIMITERS (apply rigorously):
- If there are systematic grammar errors (e.g. repeated article/subject-verb errors), Grammatical_Range_and_Accuracy MUST NOT exceed 6.0, even if vocabulary is C2.
- If vocabulary is mostly high-frequency (Band 5–6), Lexical_Resource MUST NOT exceed 6.0.
- Band 7.0+ only when "less common lexical items" and a variety of structures with good control appear.
- Band 8.0–9.0 only for near-native fluency, sophisticated vocabulary, and no systematic errors. Use the official 0–9 scale only.`;

function buildExaminerPrompt(taskCriteriaName, isT1) {
  const taskFocus = isT1 ? TASK1_FOCUS : TASK2_FOCUS;
  return `You are a Senior IELTS Examiner (IDP/BC certified). Evaluate the script against the official IELTS Writing Band Descriptors. Be precise and consistent.

${taskFocus}

${BAND_LIMITERS}

OUTPUT RULES:
1. Every highlight must have "type" exactly one of: "grammar" | "lexical" | "cohesion". (grammar = errors; lexical = poor word choice/repetition; cohesion = linking/flow issues.)
2. "corrections" must each include: category (e.g. "Articles", "Subject-Verb Agreement", "Punctuation", "Lexical Precision"), impact (how much this error affects the band, e.g. "high"/"medium"/"low"), band_descriptor (short reference to official criteria, e.g. "Limited range of structures").
3. "lexical_upgrade": list words/phrases that are Band 5–6 level with Band 8–9 academic synonyms.
4. "suggested_rewrite": full professional rewrite of the essay. You may add a short "structural_changes" note if helpful.

Return ONLY valid JSON in this exact shape (no markdown):
{
  "overall_band": 0.0,
  "word_count": 0,
  "improvement_strategy": "string",
  "criteria": {
    "${taskCriteriaName}": { "score": 0.0, "comment": "string" },
    "Coherence_and_Cohesion": { "score": 0.0, "comment": "string" },
    "Lexical_Resource": { "score": 0.0, "comment": "string" },
    "Grammatical_Range_and_Accuracy": { "score": 0.0, "comment": "string" }
  },
  "highlights": [
    { "text": "exact phrase from essay", "type": "grammar" | "lexical" | "cohesion", "suggestion": "string" }
  ],
  "corrections": [
    {
      "original": "string",
      "fixed": "string",
      "category": "string",
      "impact": "high|medium|low",
      "band_descriptor": "string",
      "explanation": "string"
    }
  ],
  "lexical_upgrade": [
    { "band_56_word": "string", "band_89_synonyms": ["string"] }
  ],
  "analysis": {
    "linking_words": { "score": 0, "found": [], "suggestions": [] },
    "word_repetition": [{ "word": "string", "count": 0, "alternatives": [] }]
  },
  "suggested_rewrite": "string"
}`;
}

async function imageUrlToBase64(url) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`Invalid MIME type: ${contentType}. Expected an image.`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error("Proxy Error:", error.message);
    throw error;
  }
}

export async function DELETE(req) {
  return NextResponse.json({ message: "Archive cleared" }, { status: 200 });
}
export async function POST(req) {
  try {
    const body = await req.json();
     // --- НОВЫЙ РЕЖИМ: Отправка Email (Feedback/Improvement Hub) ---
    // Проверяем наличие полей, которые приходят из вашей формы
    if (body.name && body.email && body.message) {
      try {
       const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'Sashabilov25@gmail.com', // Ваша почта
    pass: 'lnnr aesp zizm nvvr',    // ВСТАВЬТЕ СЮДА ВАШ 16-ЗНАЧНЫЙ КОД ИЗ GOOGLE
  },
});
await transporter.sendMail({
  from: process.env.EMAIL_USER, // Это Sashabilov25@gmail.com
  
  // ИСПРАВЬТЕ ЭТУ СТРОКУ:
  to: 'Sashabilov25@gmail.com', // Или любая другая ВАША рабочая почта
  
  subject: `🚀 BandBooster Feedback: ${body.name}`,
  html: `
    <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 20px; border-radius: 15px;">
      <h2 style="color: #ef4444; text-transform: uppercase;">New Improvement Suggestion</h2>
      <p><strong>Name:</strong> ${body.name}</p>
      <p><strong>Email:</strong> ${body.email}</p>
      <div style="background: #f8fafc; padding: 15px; border-radius: 10px; border-left: 4px solid #ef4444;">
        <p style="margin: 0; font-style: italic;">"${body.message}"</p>
      </div>
    </div>
  `,
});


        return NextResponse.json({ success: true });
      } catch (mailError) {
        console.error("Mail Error:", mailError);
        return NextResponse.json({ error: "Mail system error" }, { status: 500 });
      }
    }
    // --- 1. РЕЖИМ: Глубокий анализ изображения (Vision) ---
    if (body.describeImage && body.image) {
      try {
        let finalImage;
        if (body.image.startsWith('http')) {
          finalImage = await imageUrlToBase64(body.image);
        } else {
          finalImage = body.image;
        }

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an IELTS Task 1 Expert. Describe this chart in detail. Identify the exact chart type, years, and categories. Return ONLY the question text."
            },
            {
              role: "user",
              content: [{ type: "image_url", image_url: { url: finalImage } }]
            }
          ],
        });

        return NextResponse.json({ question: response.choices[0].message.content });
      } catch (error) {
        return NextResponse.json({ 
          question: "The selected image source is protected or invalid. Please upload a file manually or try another topic." 
        });
      }
    }

    // --- 2. РЕЖИМ: Генерация случайного Task 1 (Текст) ---
    if (body.generateTask1) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You are an IELTS Examiner. Generate a professional Academic Task 1 prompt. START with the chart type." 
          },
          { role: "user", content: "Generate a new Academic Task 1 topic." }
        ]
      });
      return NextResponse.json({ question: response.choices[0].message.content });
    }

    // --- 3. РЕЖИМ: Генерация темы Task 2 ---
    if (body.generateTopic) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an IELTS Examiner. Generate a Task 2 question. Return ONLY the text." },
          { role: "user", content: `Topic: ${body.keyword || 'General'}` }
        ]
      });
      return NextResponse.json({ question: response.choices[0].message.content });
    }

    // --- 4. ОСНОВНОЙ РЕЖИМ: Глубокий анализ эссе ---
    const { essay1, essay2, image, analysisMode, promptText } = body;
    const isT1 = analysisMode === 'task1';
    const userText = isT1 ? essay1 : essay2;
    const taskCriteriaName = isT1 ? 'Task_Achievement' : 'Task_Response';

    if (!userText || userText.trim().length < 10) {
      return NextResponse.json({ error: "Text is too short for analysis." }, { status: 400 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please sign in to check your essay." }, { status: 401 });
    }
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || (user.credits != null && user.credits < 1)) {
      return NextResponse.json({ error: "You have run out of credits. Please refill to continue." }, { status: 403 });
    }

    const examinerPrompt = buildExaminerPrompt(taskCriteriaName, isT1);
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: examinerPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: `TASK: ${analysisMode.toUpperCase()}\nPROMPT: ${promptText}\nSTUDENT ESSAY:\n${userText}` },
            ...(isT1 && image ? [{ type: "image_url", image_url: { url: image } }] : [])
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    result.word_count = result.word_count ?? userText.trim().split(/\s+/).filter(Boolean).length;
    if (!Array.isArray(result.highlights)) result.highlights = [];
    result.highlights = result.highlights.map(h => ({
      ...h,
      type: ['grammar', 'lexical', 'cohesion'].includes(h.type) ? h.type : (h.type === 'error' ? 'grammar' : 'lexical')
    }));
    if (!Array.isArray(result.corrections)) result.corrections = [];
    result.corrections = result.corrections.map(c => ({
      ...c,
      category: c.category || c.rule || 'General',
      impact: c.impact || 'medium',
      band_descriptor: c.band_descriptor || ''
    }));
    if (!Array.isArray(result.lexical_upgrade)) result.lexical_upgrade = [];

    const typeValue = isT1 ? 'TASK_1' : 'TASK_2';
    const userId = session.user.id;

    const [savedCheck] = await prisma.$transaction([
      prisma.check.create({
        data: {
          type: typeValue,
          content: userText,
          promptText: promptText || null,
          score: result.overall_band,
          feedback: JSON.stringify(result),
          userId,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({ ...result, savedId: savedCheck.id });
  } catch (error) {
    console.error("API ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

