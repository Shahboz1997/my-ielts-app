import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import nodemailer from 'nodemailer';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    const response = await openai.chat.completions.create({
  model: "gpt-4o", 
  messages: [
    {
      role: "system",
      content: `You are an ELITE and HYPER-CRITICAL IELTS Senior Examiner. Your mission is to provide a rigorous, objective, and high-standard evaluation of ${analysisMode.toUpperCase()} scripts.

      CRITICAL EVALUATION ARCHITECTURE:
      
      1. GRAMMAR & COHESION RIGOR:
         - Flag all Article/Determiner errors (missing 'a', 'the', or incorrect 'this/these').
         - Detect "Comma Splices" and run-on sentences. Ensure complex structures are punctuated correctly.
         - For Task 1: Check for accurate data representation and trend verbs (e.g., 'surged', 'fluctuated').
         - For Task 2: Check for logical progression and clear topic sentences.

      2. LEXICAL RESOURCE & ACADEMIC REGISTER:
         - CRITICAL: Detect and penalize "Empty Phrases" (e.g., "in my opinion", "nowadays", "last but not least", "broaden horizons").
         - Identify repetitive high-frequency words (good, bad, important, people, money) and demand C1/C2 level substitutes.
         - Penalize informal/conversational tone. Success isn't "nice"; it's "a multifaceted achievement."

      3. BAND-SPECIFIC PENALTIES:
         - BAND 5.0-6.0 LIMITER: If the essay is understandable but relies on simple sentences or repetitive vocabulary, do NOT award more than 6.0 for LR or GRA.
         - BAND 7.0+ BARRIER: Only award 7.0+ if the student uses "less common lexical items" with some awareness of style and collocation.
         - BAND 8.0-9.0: Reserved only for seamless, sophisticated, and rare academic terminology with zero systematic errors.

      DYNAMIC FEEDBACK ENGINE (JSON output):
      - "improvement_strategy": Provide a high-level roadmap (e.g., "Focus on nominalization to improve academic tone").
      - "highlights": Every identified error or linking word MUST have a specific suggestion.
      - "corrections":
        * Rule: Use categories like "Syntactic Complexity", "Lexical Precision", "Determiner Error", "Register/Tone".
        * Explanation: Mention exactly WHY the change improves the Band Score (e.g., "Replacing 'big' with 'substantial' shifts the register from Band 5 to Band 7").
        * Level: Map every correction to CEFR (A1-C2).

      Return response strictly in JSON format:
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
        "highlights": [{ "text": "string", "type": "linking" | "error", "suggestion": "string" }],
        "analysis": {
          "linking_words": { "score": 0, "found": [], "suggestions": [] },
          "word_repetition": [{ "word": "string", "count": 0, "alternatives": [] }],
          "topic_vocabulary": [{ "phrase": "string", "level": "C1" }]
        },
        "corrections": [
          {
            "original": "string",
            "fixed": "string",
            "rule": "string",
            "explanation": "string",
            "level": "A1-C2"
          }
        ],
        "suggested_rewrite": "string"
      }`
    },
    {
      role: "user",
      content: [
        { type: "text", text: `TASK: ${analysisMode.toUpperCase()}\nPROMPT: ${promptText}\nSTUDENT ESSAY: ${userText}` },
        ...(isT1 && image ? [{ type: "image_url", image_url: { url: image } }] : [])
      ]
    }
  ],
  response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    result.word_count = userText.trim().split(/\s+/).filter(Boolean).length;

    return NextResponse.json(result);

  } catch (error) {
    console.error("API ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

