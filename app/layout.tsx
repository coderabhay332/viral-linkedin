import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'IdeaLinked — Personalized LinkedIn Content Ideas',
    description:
        'Generate personalized, viral LinkedIn post ideas powered by AI. Built for founders, creators, and professionals.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body className={`${inter.className} bg-[#0A0F1E] text-white antialiased`}>
                {children}
                <Toaster />
            </body>
        </html>
    );
}
