export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { callPerplexity, safeParseJSON } from '@/lib/perplexity';
export const maxDuration = 60;
interface LinkedInAnalysis {
    industry: string;
    role: string;
    experience_level: string;
    summary: string;
}

export async function POST(req: NextRequest) {
    try {
        const { linkedinUrl } = await req.json();

        if (!linkedinUrl || !linkedinUrl.includes('linkedin.com/in/')) {
            return NextResponse.json({ error: 'Please provide a valid LinkedIn profile URL' }, { status: 400 });
        }

        const prompt = `You are a professional profile analyzer. A user has provided their LinkedIn profile URL: ${linkedinUrl}

Based on clues in the URL slug (name, title keywords, industry terms) and general knowledge, infer the most likely professional profile for this person.

Return ONLY valid JSON in this exact format:
{
  "industry": "one of: Tech, Marketing, Finance, Healthcare, Real Estate, HR, Coaching, SaaS, Construction, Other",
  "role": "one of: Founder, Manager, Freelancer, Executive, Consultant, Employee, Creator",
  "experience_level": "one of: Junior, Mid, Senior, Executive",
  "summary": "A 1-2 sentence professional summary of who this person likely is based on their LinkedIn URL slug. Be specific but acknowledge this is an inference."
}

Only return the JSON object, nothing else.`;

        const { content } = await callPerplexity(prompt, 1024, 0.3);
        const parsed = safeParseJSON<LinkedInAnalysis>(content);

        if (!parsed || !parsed.industry || !parsed.role) {
            // Return sensible defaults if parsing fails
            return NextResponse.json({
                industry: 'Tech',
                role: 'Founder',
                experience_level: 'Senior',
                summary: "We couldn't fully analyze this profile — please review and confirm your details below.",
            });
        }

        return NextResponse.json(parsed);
    } catch (error) {
        console.error('LinkedIn analysis error:', error);
        return NextResponse.json({ error: 'Failed to analyze LinkedIn profile' }, { status: 500 });
    }
}
