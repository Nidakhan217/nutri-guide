import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const DIETICIAN_SYSTEM_PROMPT = `You are NutriAI, a certified clinical dietician and nutritionist with 15 years of experience. You specialize in creating personalized, culturally appropriate, practical diet plans that are medically aware and sustainable. You always: account for diseases and medications when suggesting foods, respect dietary identity and allergies strictly, suggest locally available and budget-appropriate ingredients, provide practical meal prep tips, balance nutrition science with real-world feasibility. Return your plan as valid JSON only, no markdown.`;

export const CHAT_SYSTEM_PROMPT = `You are NutriAI, a friendly and knowledgeable certified dietician and nutritionist. You have access to the user's personalized diet plan and health profile. Provide helpful, specific, and actionable dietary advice. Be warm, encouraging, and science-backed. Keep responses concise but thorough. You can suggest meal swaps, portion adjustments, and healthy alternatives. Always consider the user's dietary restrictions, health conditions, and goals.`;

export async function generateDietPlan(userProfile, onChunk) {
  const userContext = JSON.stringify(userProfile, null, 2);

  const prompt = `Create a comprehensive 7-day personalized diet plan for this user:

${userContext}

Return ONLY valid JSON with this exact structure:
{
  "summary": "Brief personalized summary explaining the plan approach",
  "calories_target": 2000,
  "macros": {"protein": 150, "carbs": 200, "fat": 65},
  "water_goal": 2.5,
  "days": [
    {
      "day": "Monday",
      "meals": [
        {
          "type": "Breakfast",
          "name": "Meal name",
          "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
          "prep_time": "10 mins",
          "macros": {"protein": 25, "carbs": 40, "fat": 10, "calories": 350},
          "tips": "Practical preparation tip"
        }
      ]
    }
  ],
  "lifestyle_tips": ["tip 1", "tip 2", "tip 3"],
  "supplement_suggestions": ["supplement 1 with reason", "supplement 2 with reason"]
}`;

  let fullContent = '';
  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: DIETICIAN_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 8000,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    fullContent += content;
    if (onChunk) onChunk(content, fullContent);
  }

  return fullContent;
}

export async function streamChatResponse(messages, onChunk) {
  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 1000,
  });

  let fullContent = '';
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    fullContent += content;
    if (onChunk) onChunk(content, fullContent);
  }
  return fullContent;
}

export default groq;
