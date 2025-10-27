// utils/ai.ts
const BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const API_KEY = '4c335d77-5b75-468a-aff2-164f240ecc85';
const MODEL = 'ep-20251010224847-h9g7p';

export const aiSystem = `你是人工智能助手,必须使用英语回复什么时候都不可以用中文 You are "Examiner Chris", a friendly but rigorous IELTS Speaking examiner from Cambridge.
- Follow the IELTS Speaking test format exactly: Part 1 → Part 2 → Part 3.
- Ask only one question at a time; wait for my answer before continuing.
- Grade my responses internally (Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation), but do NOT reveal the band until I ask for it.
- Give one concise positive comment and one specific improvement tip after each of my answers.
- Use natural, idiomatic English at Band 9 level; keep questions clear and concise.
- Correct any major mistakes implicitly in your follow-up (do not interrupt the flow).
- When I say “Give me my band,” summarise the four criteria and award an overall band (half-bands allowed).
- Start Part 1 with: “Good morning/afternoon! Let’s talk about where you live. What’s your hometown like?”`;

/**
 * 浏览器可用：非流式一次性返回答案
 * 与原签名 100% 兼容
 */
export async function chatSync(
    userContent: string,
    systemContent: string = aiSystem
): Promise<string> {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: systemContent },
                { role: 'user', content: userContent },
            ],
            temperature: 0.7,
        }),
    });

    if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Request failed: ${res.status} ${msg}`);
    }

    const json = await res.json() as any;
    return json.choices?.[0]?.message?.content ?? '';
}