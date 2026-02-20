import axios from 'axios';

// Промпты лучше держать здесь или импортировать
const IELTS_PROMPTS = {
  'Task 1': "You are an IELTS Task 1 Expert...", 
  'Task 2': "You are an IELTS Task 2 Expert..."
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { userTask, userPrompt } = req.body;

  try {
    const systemMessage = IELTS_PROMPTS[userTask];

    const response = await axios.post('https://api.openai.com', {
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7
    }, {
      headers: { 
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).json({ result: response.data.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate' });
  }
}
