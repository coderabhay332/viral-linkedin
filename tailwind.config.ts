import type { Config } from 'tailwindcss';

const config: Config = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		extend: {
			colors: {
				background: '#0A0F1E',
				foreground: '#ffffff',
				card: {
					DEFAULT: '#111827',
					foreground: '#ffffff',
				},
				primary: {
					DEFAULT: '#2563EB',
					foreground: '#ffffff',
				},
				secondary: {
					DEFAULT: '#1e293b',
					foreground: '#94a3b8',
				},
				muted: {
					DEFAULT: '#1e293b',
					foreground: '#64748b',
				},
				accent: {
					DEFAULT: '#3b82f6',
					foreground: '#ffffff',
				},
				border: 'rgba(255,255,255,0.08)',
				input: 'rgba(255,255,255,0.06)',
				ring: '#2563EB',
				destructive: {
					DEFAULT: '#ef4444',
					foreground: '#ffffff',
				},
			},
			borderRadius: {
				lg: '0.75rem',
				md: '0.5rem',
				sm: '0.375rem',
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
			},
			animation: {
				'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
				shimmer: 'shimmer 1.5s infinite',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
};

export default config;
