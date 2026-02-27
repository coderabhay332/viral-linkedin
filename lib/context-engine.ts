import { INDUSTRY_CONTEXTS } from '@/config/industry-contexts';

export interface UserProfile {
    id?: string;
    user_id: string;
    linkedin_url?: string;
    linkedin_summary?: string;
    industry: string;
    role: string;
    experience_level: string;
    target_audience: string;
    content_goal: string;
    tone_preference: string;
    onboarding_complete?: boolean;
}

export function buildContextLayer(userProfile: UserProfile): string {
    const { industry, content_goal } = userProfile;

    const industryMap = INDUSTRY_CONTEXTS[industry];
    if (industryMap) {
        const topics = industryMap[content_goal];
        if (topics && topics.length > 0) return topics.join(', ');
        const firstGoal = Object.keys(industryMap)[0];
        if (firstGoal) return industryMap[firstGoal].join(', ');
    }

    const otherMap = INDUSTRY_CONTEXTS['Other'];
    const fallback = otherMap?.[content_goal] || otherMap?.['Authority Building'];
    return fallback ? fallback.join(', ') : 'professional growth, thought leadership, industry insights';
}

export function buildIdeaPrompt(userProfile: UserProfile, viralPostExamples: string[] = []): string {
    const contextTopics = buildContextLayer(userProfile);
    const topExamples = viralPostExamples.slice(0, 3);

    const examplesSection = topExamples.length > 0
        ? `\nViral LinkedIn Posts for Style Reference:\nStudy these for: hook structure, paragraph length, emotional pacing, and how they open loops. Do NOT copy topics — only borrow the writing patterns.\n${topExamples.map((p, i) => `--- Example ${i + 1} ---\n${p}`).join('\n\n')}\n`
        : '';

    const linkedinContext = userProfile.linkedin_summary
        ? `\nLinkedIn Profile Summary: ${userProfile.linkedin_summary}`
        : '';

    return `You are a world-class LinkedIn ghostwriter who writes viral, long-form posts.

User Profile:
- Industry: ${userProfile.industry}
- Role: ${userProfile.role}
- Experience Level: ${userProfile.experience_level}
- Target Audience: ${userProfile.target_audience}
- Content Goal: ${userProfile.content_goal}
- Tone: ${userProfile.tone_preference}${linkedinContext}

Relevant topic seeds for this user: ${contextTopics}
${examplesSection}
Generate 2 COMPLETE, READY-TO-POST LinkedIn posts.
These are NOT outlines. These are NOT directions. These are full finished posts.

Each post must:
- Be 300-400 words long
- Start with a scroll-stopping hook line (under 15 words, creates curiosity or tension)
- Use short paragraphs (1-3 lines each) with blank lines between them for LinkedIn readability
- Have a clear narrative arc: tension → development → insight → payoff → CTA
- Include either a numbered list of 3-5 insights in the middle OR a detailed personal story — not both
- Each numbered point (if used) must be 2-3 lines long, not a single short sentence
- End with a natural CTA that feels earned, not forced
- Sound like a real human wrote it — specific, opinionated, not generic
- No hashtags
- No filler openers like "In today's world" or "It's no secret that"
- Match the ${userProfile.tone_preference} tone throughout

Return ONLY valid JSON in this exact format:
{
  "ideas": [
    {
      "hook": "The first line of the post (same as post opening, under 15 words)",
      "angle": "One sentence describing the core argument of this post",
      "format": "Story / Numbered List / Contrarian Take / Lesson / Data Point / Before & After",
      "full_post": "The complete 300-400 word LinkedIn post, fully written, ready to copy-paste. Use \\n\\n for paragraph breaks."
    }
  ]
}`;
}

export function buildReframePrompt(
    idea: { hook: string; angle: string; full_post: string },
    newTone: string
): string {
    return `Rewrite this LinkedIn post in a ${newTone} tone.
Keep the same core topic and argument, but shift the voice, emotional register, and angle.
The rewritten post must be the same length (300-400 words) and remain ready to copy-paste into LinkedIn.

Original post:
${idea.full_post}

Writing Rules:
- Keep the same general structure (hook → development → payoff → CTA)
- Match ${newTone} tone throughout — every sentence should sound like the same person wrote it
- Keep paragraphs short (1-3 lines) with blank lines between them
- No hashtags
- No filler phrases like "In today's world"

Return ONLY valid JSON with this structure:
{
  "hook": "The new first line (under 15 words)",
  "angle": "One sentence describing the core argument",
  "format": "Story / Numbered List / Contrarian Take / Lesson / Data Point / Before & After",
  "full_post": "The complete rewritten post, ready to copy-paste. Use \\n\\n for paragraph breaks."
}`;
}

export function buildExpandPrompt(
    idea: { hook: string; angle: string; story_direction: string; cta: string; key_points?: string[] },
    tone: string
): string {
    const keyPointsSection = idea.key_points && idea.key_points.length > 0
        ? `Key points to cover:\n${idea.key_points.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
        : '';

    return `Write a complete, full-length LinkedIn post based on this idea.

User tone preference: ${tone}
Hook: ${idea.hook}
Angle: ${idea.angle}
Story Direction: ${idea.story_direction}
${keyPointsSection}
CTA: ${idea.cta}

Writing Rules:
- Start with the hook line exactly as written — do not change it
- Use short punchy paragraphs (1-3 lines each) with a blank line between each
- Build emotional momentum — open with tension or a bold claim, develop it in the middle, resolve it before the CTA
- In the middle section, include EITHER a numbered list of insights (3-5 items) OR a detailed story with specific details — not both
- Each numbered point (if used) should be 2-3 lines long, not a single short sentence
- Add an emotional or practical payoff paragraph before the CTA (this is the "so what" moment)
- End naturally with the CTA — it should feel earned, not forced
- No hashtags
- No filler phrases like "In today's world" or "It's no secret that"
- Target length: 300-400 words
- Match ${tone} tone throughout — every sentence should sound like the same person wrote it

Return as plain text only, ready to copy-paste into LinkedIn.`;
}