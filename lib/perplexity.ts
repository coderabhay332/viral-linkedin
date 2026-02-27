// ✅ Switched from Perplexity to Google Gemini API
// Uses the same exported function signatures so no other files need to change.

const GEMINI_MODEL = 'gemini-3-flash-preview';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function callPerplexity(
    prompt: string,
    maxTokens: number = 4000,
    temperature: number = 0.8
): Promise<{ content: string; tokensUsed: number }> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
        throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [{ text: prompt }],
                },
            ],
            generationConfig: {
                maxOutputTokens: maxTokens,
                temperature,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log(data);

    const content: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokensUsed: number =
        (data.usageMetadata?.promptTokenCount || 0) +
        (data.usageMetadata?.candidatesTokenCount || 0);

    return { content, tokensUsed };
}

export function safeParseJSON<T>(content: string): T | null {
    try {
        // Strip markdown code fences if present
        const cleaned = content
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
        return JSON.parse(cleaned) as T;
    } catch {
        // Try to extract JSON from the content
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]) as T;
            } catch {
                return null;
            }
        }
        return null;
    }
}
