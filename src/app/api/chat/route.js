// import { OpenAIStream, StreamingTextResponse } from 'ai'; // npm install ai
// import OpenAI from 'openai';

// // Инициализация клиента
// const openai = new OpenAI({ 
//   apiKey: process.env.OPENAI_API_KEY 
// });

// export async function POST(req) {
//   try {
//     const { messages, essayContext } = await req.json();
    
//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       // Включаем стриминг для useChat
//       stream: true, 
//       messages: [
//         { 
//           role: "system", 
//           content: `Ты — личный репетитор IELTS. Твоя задача — отвечать на вопросы студента по его эссе. 
//           КОНТЕКСТ ЭССЕ: "${essayContext}". 
//           Отвечай кратко, профессионально и мотивирующе на русском языке.` 
//         },
//         ...messages
//       ],
//     });

//     // Преобразуем ответ OpenAI в поток данных
//     const stream = OpenAIStream(response);

//     // Возвращаем StreamingTextResponse — это критически важно для хука useChat
//     return new StreamingTextResponse(stream);

//   } catch (e) {
//     console.error("Chat API error:", e);
//     return new Response(JSON.stringify({ error: "Ошибка сервера" }), { 
//       status: 500,
//       headers: { 'Content-Type': 'application/json' }
//     });
//   }
// }


// // app/api/chat/route.js
// import { NextResponse } from 'next/server';
// import OpenAI from 'openai';
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// export async function POST(req) {
//   try {
//     const { messages, essayContext } = await req.json();
    
//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         { role: "system", content: `Ты — личный репетитор IELTS. Твоя задача — отвечать на вопросы студента по его эссе. Контекст эссе: "${essayContext}". Отвечай кратко, профессионально и мотивирующе.` },
//         ...messages
//       ],
//       // Отключите response_format: { type: "json_object" }, 
//       // так как для чата лучше использовать обычный текст.
//     });

//     // ИСПРАВЛЕННАЯ СТРОКА: Правильный путь доступа к содержимому сообщения
//     const aiResponseContent = response.choices[0].message.content;

//     // Возвращаем ответ клиенту в виде JSON объекта
//     return NextResponse.json({ content: aiResponseContent });

//   } catch (e) {
//     console.error("Chat API error:", e); // Логируем ошибку сервера
//     return NextResponse.json({ error: "Ошибка сервера: Чат не отвечает" }, { status: 500 });
//   }
// }
