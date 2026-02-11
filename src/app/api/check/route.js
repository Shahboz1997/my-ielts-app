import { NextResponse } from 'next/server';
import OpenAI from 'openai';

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
          content: `You are an ELITE and HYPER-CRITICAL IELTS Senior Examiner. Analyze ONLY ${analysisMode.toUpperCase()} strictly following official descriptors.
        
        CRITICAL ANALYSIS PROTOCOL (APPLY RIGOROUSLY):
        
        1. SPELLING & TYPOS: Identify non-existent or hybridized words. 
           Example: "wealthcial" -> Fix: "financial" (Rule: Spelling).

        2. GRAMMAR & ARTICLES: Flag missing articles for singular countable nouns. 
           Example: "go to expensive doctor" -> Fix: "go to an expensive doctor" (Rule: Article Usage).
           Example: "Money is necessary" -> Fix: "Money is a necessity" (Rule: Grammar).

        3. PUNCTUATION & STRUCTURE: Identify "comma splices".
           Example: "I have a friend, he is rich" -> Fix: "I have a friend who is rich" (Rule: Sentence Structure).

        4. LEXICAL REPETITION: Ban overused "Band 4-5" words (good, bad, big, things).
           Example: "money is good" -> "financial stability is beneficial".
           Example: "feel good" -> "feel content/satisfied".

        5. ACADEMIC TONE: Replace conversational fillers and "childish" phrasing.
           Example: "I want to talk about this" -> "This essay will examine both views".
           Example: "Money is the best" -> "Wealth is the most significant factor".

        SCORING HARSHNESS:
        - Cap Lexical Resource at 7.0 if text uses predictable clichés.
        - Award 8.0+ ONLY for "Uncommon Lexical Items" and precise academic collocations.

      DYNAMIC CORRECTIONS LOGIC:
      In the "corrections" array, adapt "rule" and "explanation" based on the Lexical Resource score:
      - Band 2.0-4.0: Rule: "Basic Clarity". Explanation: Focus on fundamental intelligibility.
      - Band 5.0-6.0: Rule: "Vocabulary Variety". Explanation: Avoid repetitive and simple adjectives.
      - Band 7.0-7.5: Rule: "Lexical Sophistication". Explanation: Use academic synonyms to break the Band 7 barrier.
      - Band 8.0-9.0: Rule: "Precise Collocation". Explanation: Native-like precision and sophisticated terminology.

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


// export async function POST(req) {
//   try {
//     const body = await req.json();

//     // --- 1. РЕЖИМ: Глубокий анализ изображения (Vision) ---
//     if (body.describeImage && body.image) {
//       try {
//         let finalImage;
//         if (body.image.startsWith('http')) {
//           finalImage = await imageUrlToBase64(body.image);
//         } else {
//           finalImage = body.image;
//         }

//         const response = await openai.chat.completions.create({
//           model: "gpt-4o",
//           messages: [
//             {
//               role: "system",
//               content: "You are an IELTS Task 1 Expert. Describe this chart in detail. Identify the exact chart type, years, and categories. Return ONLY the question text."
//             },
//             {
//               role: "user",
//               content: [{ type: "image_url", image_url: { url: finalImage } }]
//             }
//           ],
//         });

//         return NextResponse.json({ question: response.choices[0].message.content });
//       } catch (error) {
//         return NextResponse.json({ 
//           question: "The selected image source is protected or invalid. Please upload a file manually or try another topic." 
//         });
//       }
//     }

//     // --- 2. РЕЖИМ: Генерация случайного Task 1 (Текст) ---
//     if (body.generateTask1) {
//       const response = await openai.chat.completions.create({
//         model: "gpt-4o-mini",
//         messages: [
//           { 
//             role: "system", 
//             content: "You are an IELTS Examiner. Generate a professional Academic Task 1 prompt. START with the chart type." 
//           },
//           { role: "user", content: "Generate a new Academic Task 1 topic." }
//         ]
//       });
//       return NextResponse.json({ question: response.choices[0].message.content });
//     }

//     // --- 3. РЕЖИМ: Генерация темы Task 2 ---
//     if (body.generateTopic) {
//       const response = await openai.chat.completions.create({
//         model: "gpt-4o-mini",
//         messages: [
//           { role: "system", content: "You are an IELTS Examiner. Generate a Task 2 question. Return ONLY the text." },
//           { role: "user", content: `Topic: ${body.keyword || 'General'}` }
//         ]
//       });
//       return NextResponse.json({ question: response.choices[0].message.content });
//     }

//     // --- 4. ОСНОВНОЙ РЕЖИМ: Глубокий анализ эссе ---
//     const { essay1, essay2, image, analysisMode, promptText } = body;
//     const isT1 = analysisMode === 'task1';
//     const userText = isT1 ? essay1 : essay2;
//     const taskCriteriaName = isT1 ? 'Task_Achievement' : 'Task_Response';

//     if (!userText || userText.trim().length < 10) {
//       return NextResponse.json({ error: "Text is too short for analysis." }, { status: 400 });
//     }

//     const response = await openai.chat.completions.create({
//       model: "gpt-4o", 
//       messages: [
//         {
//           role: "system",
//           content: `You are an ELITE and HYPER-CRITICAL IELTS Senior Examiner. Analyze ONLY ${analysisMode.toUpperCase()} strictly following official descriptors.
        
//         SCORING HARSHNESS & BAND 8+ BARRIERS:
//         1. THE "SAFE" PENALTY: If the essay is accurate but uses predictable academic clichés, CAP Lexical Resource at 7.0.
//         2. BAND 8.0+ REQUIREMENT: Only award 8.0+ if the text uses "Uncommon Lexical Items".
//         3. JUSTIFICATION: In every "comment", if the score is < 9.0, justify the score cap.

//       DYNAMIC CORRECTIONS LOGIC:
//       In the "corrections" array, adapt "rule" and "explanation" based on the Lexical Resource score:
//       - Band 2.0-4.0: Rule: "Basic Clarity". Explanation: Focus on being understood.
//       - Band 5.0-6.0: Rule: "Vocabulary Variety". Explanation: Focus on avoiding repetition of simple words.
//       - Band 7.0-7.5: Rule: "Lexical Sophistication". Explanation: Focus on breaking the Band 9.0 barrier with academic synonyms.
//       - Band 8.0-9.0: Rule: "Precise Collocation". Explanation: Focus on native-like precision and rare academic terms.

//       Return response strictly in JSON format:
//       {
//         "overall_band": 0.0,
//         "word_count": 0,
//         "improvement_strategy": "string",
//         "criteria": { 
//           "${taskCriteriaName}": { "score": 0.0, "comment": "string" }, 
//           "Coherence_and_Cohesion": { "score": 0.0, "comment": "string" }, 
//           "Lexical_Resource": { "score": 0.0, "comment": "string" }, 
//           "Grammatical_Range_and_Accuracy": { "score": 0.0, "comment": "string" } 
//         },
//         "highlights": [{ "text": "string", "type": "linking" | "error", "suggestion": "string" }],
//         "analysis": {
//           "linking_words": { "score": 0, "found": [], "suggestions": [] },
//           "word_repetition": [{ "word": "string", "count": 0, "alternatives": [] }],
//           "topic_vocabulary": [{ "phrase": "string", "level": "C1" }]
//         },
//         "corrections": [
//           {
//             "original": "string",
//             "fixed": "string",
//             "rule": "Dynamic Rule based on Score",
//             "explanation": "Dynamic Explanation based on Score mentioning the specific Band barrier."
//           }
//         ],
//         "suggested_rewrite": "string"
//       }`
//         },
//         {
//           role: "user",
//           content: [
//             { type: "text", text: `TASK: ${analysisMode.toUpperCase()}\nPROMPT: ${promptText}\nSTUDENT ESSAY: ${userText}` },
//             ...(isT1 && image ? [{ type: "image_url", image_url: { url: image } }] : [])
//           ]
//         }
//       ],
//       response_format: { type: "json_object" }
//     });

//     const result = JSON.parse(response.choices[0].message.content);
//     result.word_count = userText.trim().split(/\s+/).filter(Boolean).length;

//     return NextResponse.json(result);

//   } catch (error) {
//     console.error("API ERROR:", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }
