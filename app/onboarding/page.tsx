'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
    Loader2, Zap, ChevronRight, ChevronLeft, Check,
    Linkedin, Search, AlertCircle
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────
interface FormData {
    linkedin_url: string;
    linkedin_summary: string;
    industry: string;
    role: string;
    experience_level: string;
    target_audience: string;
    content_goal: string;
    tone_preference: string;
}

// ─── Option sets ─────────────────────────────────────────────
const INDUSTRY_OPTIONS = ['Tech', 'SaaS', 'Marketing', 'Finance', 'Healthcare', 'Real Estate', 'HR', 'Coaching', 'Construction', 'Other'];
const ROLE_OPTIONS = ['Founder', 'Executive', 'Manager', 'Consultant', 'Freelancer', 'Employee', 'Creator'];
const EXPERIENCE_OPTIONS = ['Junior', 'Mid', 'Senior', 'Executive'];
const AUDIENCE_OPTIONS = ['Founders', 'Recruiters', 'Clients', 'Peers', 'General'];
const GOAL_OPTIONS = [
    { value: 'Authority Building', icon: '🏆', desc: 'Become the go-to expert in your field' },
    { value: 'Lead Generation', icon: '🎯', desc: 'Turn followers into paying customers' },
    { value: 'Thought Leadership', icon: '💡', desc: 'Shape conversations and trends' },
    { value: 'Personal Brand', icon: '✨', desc: 'Build a recognizable professional identity' },
];
const TONE_OPTIONS = [
    { value: 'Bold', icon: '⚡', desc: 'Direct, confident, no fluff' },
    { value: 'Inspirational', icon: '🌟', desc: 'Motivating stories and uplifting energy' },
    { value: 'Analytical', icon: '📊', desc: 'Data-driven, structured, objective' },
    { value: 'Storytelling', icon: '📖', desc: 'Personal narratives and vivid examples' },
    { value: 'Contrarian', icon: '🔥', desc: 'Challenge norms, spark debate' },
];

// ─── Component ───────────────────────────────────────────────
export default function OnboardingPage() {
    const router = useRouter();
    const { toast } = useToast();
    // ⚠️ AUTH BYPASS — in real mode, fetch user from supabase
    const supabase = createBrowserSupabaseClient();

    const [step, setStep] = useState(0); // 0=LinkedIn, 1=Profile, 2=Preferences
    const [analyzing, setAnalyzing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [analysisError, setAnalysisError] = useState('');

    const [formData, setFormData] = useState<FormData>({
        linkedin_url: '',
        linkedin_summary: '',
        industry: '',
        role: '',
        experience_level: '',
        target_audience: '',
        content_goal: '',
        tone_preference: '',
    });

    const set = (key: keyof FormData, value: string) =>
        setFormData(prev => ({ ...prev, [key]: value }));

    // ── Step 0: Analyze LinkedIn ──────────────────────────────
    const analyzeLinkedIn = async () => {
        if (!formData.linkedin_url.includes('linkedin.com/in/')) {
            setAnalysisError('Please enter a valid LinkedIn URL (e.g. linkedin.com/in/yourname)');
            return;
        }
        setAnalysisError('');
        setAnalyzing(true);
        try {
            const res = await fetch('/api/analyze-linkedin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ linkedinUrl: formData.linkedin_url }),
            });
            const data = await res.json();
            if (res.ok) {
                setFormData(prev => ({
                    ...prev,
                    industry: data.industry || '',
                    role: data.role || '',
                    experience_level: data.experience_level || '',
                    linkedin_summary: data.summary || '',
                }));
                setStep(1);
            } else {
                setAnalysisError(data.error || 'Analysis failed — please try again.');
            }
        } catch {
            setAnalysisError('Network error — check your connection.');
        } finally {
            setAnalyzing(false);
        }
    };

    const skipLinkedIn = () => setStep(1);

    // ── Step 2: Submit ────────────────────────────────────────
    const submit = async () => {
        if (!formData.content_goal || !formData.tone_preference || !formData.target_audience) {
            toast({ title: 'Please complete all selections', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }
            const userId = user.id;

            const { error } = await supabase.from('user_profiles').upsert(
                {
                    user_id: userId,
                    linkedin_url: formData.linkedin_url,
                    linkedin_summary: formData.linkedin_summary,
                    industry: formData.industry,
                    role: formData.role,
                    experience_level: formData.experience_level,
                    target_audience: formData.target_audience,
                    content_goal: formData.content_goal,
                    tone_preference: formData.tone_preference,
                    onboarding_complete: true,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' }
            );
            if (error) throw error;

            toast({ title: '🎉 Profile saved!', description: 'Taking you to your dashboard...' });
            router.push('/dashboard');
        } catch (err: any) {
            toast({ title: 'Error saving profile', description: err.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const progress = ((step + 1) / 3) * 100;

    return (
        <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center p-4">
            {/* Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-blue-600/8 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-xl relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-6">
                        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">IdeaLinked</span>
                    </div>

                    {/* Step pills */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {['LinkedIn', 'Your Profile', 'Preferences'].map((label, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${i < step ? 'bg-blue-600/30 text-blue-300' :
                                    i === step ? 'bg-blue-600 text-white' :
                                        'bg-white/5 text-slate-500'
                                    }`}>
                                    {i < step ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
                                    {label}
                                </div>
                                {i < 2 && <div className={`w-6 h-px ${i < step ? 'bg-blue-600' : 'bg-white/10'}`} />}
                            </div>
                        ))}
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-white/10 rounded-full h-1 mb-8">
                        <div className="bg-blue-500 h-1 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                {/* ── STEP 0: LinkedIn URL ── */}
                {step === 0 && (
                    <div>
                        <div className="mb-8 text-center">
                            <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Linkedin className="w-7 h-7 text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Connect your LinkedIn</h2>
                            <p className="text-slate-400 mt-2">Our AI will analyze your profile and auto-fill your details</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">LinkedIn Profile URL</label>
                                <div className="relative">
                                    <input
                                        type="url"
                                        value={formData.linkedin_url}
                                        onChange={e => { set('linkedin_url', e.target.value); setAnalysisError(''); }}
                                        placeholder="https://linkedin.com/in/your-name"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/8 transition pr-12"
                                        onKeyDown={e => e.key === 'Enter' && analyzeLinkedIn()}
                                    />
                                    <Linkedin className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                </div>
                                {analysisError && (
                                    <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        {analysisError}
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={analyzeLinkedIn}
                                disabled={analyzing || !formData.linkedin_url}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
                            >
                                {analyzing ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> AI is reading your profile...</>
                                ) : (
                                    <><Search className="w-4 h-4 mr-2" /> Analyze my LinkedIn</>
                                )}
                            </Button>

                            <button
                                onClick={skipLinkedIn}
                                className="w-full py-3 text-slate-500 hover:text-slate-300 text-sm transition"
                            >
                                Skip — I&apos;ll fill in my details manually
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 1: Confirm Profile ── */}
                {step === 1 && (
                    <div>
                        <div className="mb-6 text-center">
                            <h2 className="text-2xl font-bold text-white">Confirm your profile</h2>
                            <p className="text-slate-400 mt-1">
                                {formData.linkedin_summary
                                    ? 'AI pre-filled these based on your LinkedIn — edit anything that&apos;s off'
                                    : 'Tell us a bit about yourself'
                                }
                            </p>
                        </div>

                        {formData.linkedin_summary && (
                            <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                                <p className="text-blue-200 text-sm italic">&ldquo;{formData.linkedin_summary}&rdquo;</p>
                            </div>
                        )}

                        <div className="space-y-5">
                            {/* Industry */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Industry</label>
                                <div className="flex flex-wrap gap-2">
                                    {INDUSTRY_OPTIONS.map(opt => (
                                        <button key={opt} onClick={() => set('industry', opt)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${formData.industry === opt
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                                                }`}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Role</label>
                                <div className="flex flex-wrap gap-2">
                                    {ROLE_OPTIONS.map(opt => (
                                        <button key={opt} onClick={() => set('role', opt)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${formData.role === opt
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                                                }`}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Experience */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Experience Level</label>
                                <div className="flex gap-2">
                                    {EXPERIENCE_OPTIONS.map(opt => (
                                        <button key={opt} onClick={() => set('experience_level', opt)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.experience_level === opt
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                                                }`}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <Button onClick={() => setStep(0)} variant="outline"
                                className="border-white/10 bg-white/5 hover:bg-white/10 text-white">
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                            <Button
                                onClick={() => {
                                    if (!formData.industry || !formData.role || !formData.experience_level) {
                                        toast({ title: 'Please fill in all fields', variant: 'destructive' });
                                        return;
                                    }
                                    setStep(2);
                                }}
                                className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: Content Preferences ── */}
                {step === 2 && (
                    <div>
                        <div className="mb-6 text-center">
                            <h2 className="text-2xl font-bold text-white">Content preferences</h2>
                            <p className="text-slate-400 mt-1">What do you want your content to do for you?</p>
                        </div>

                        <div className="space-y-6">
                            {/* Goal */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-3">Content Goal</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {GOAL_OPTIONS.map(opt => (
                                        <button key={opt.value} onClick={() => set('content_goal', opt.value)}
                                            className={`p-4 rounded-xl border text-left transition-all ${formData.content_goal === opt.value
                                                ? 'bg-blue-600/20 border-blue-500'
                                                : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                                                }`}>
                                            <div className="text-xl mb-1">{opt.icon}</div>
                                            <div className="text-sm font-semibold text-white">{opt.value}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Audience */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Target Audience</label>
                                <div className="flex flex-wrap gap-2">
                                    {AUDIENCE_OPTIONS.map(opt => (
                                        <button key={opt} onClick={() => set('target_audience', opt)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.target_audience === opt
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                                                }`}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tone */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-3">Content Tone</label>
                                <div className="space-y-2">
                                    {TONE_OPTIONS.map(opt => (
                                        <button key={opt.value} onClick={() => set('tone_preference', opt.value)}
                                            className={`w-full flex items-center gap-4 p-3.5 rounded-xl border text-left transition-all ${formData.tone_preference === opt.value
                                                ? 'bg-blue-600/20 border-blue-500'
                                                : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                                                }`}>
                                            <span className="text-2xl">{opt.icon}</span>
                                            <div>
                                                <div className="text-sm font-semibold text-white">{opt.value}</div>
                                                <div className="text-xs text-slate-400">{opt.desc}</div>
                                            </div>
                                            {formData.tone_preference === opt.value && (
                                                <div className="ml-auto w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <Button onClick={() => setStep(1)} variant="outline"
                                className="border-white/10 bg-white/5 hover:bg-white/10 text-white">
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                            <Button
                                onClick={submit}
                                disabled={saving || !formData.content_goal || !formData.tone_preference || !formData.target_audience}
                                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold">
                                {saving ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                                ) : (
                                    <>Let&apos;s Go! <ChevronRight className="w-4 h-4 ml-1" /></>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
