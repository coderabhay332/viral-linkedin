/** @type {import('next').NextConfig} */
const nextConfig = {
    // For Vercel deployment — all pages are dynamically rendered (auth-dependent)
    // This prevents Next.js from attempting to statically export pages that use cookies/auth
    reactStrictMode: true,
};

export default nextConfig;
