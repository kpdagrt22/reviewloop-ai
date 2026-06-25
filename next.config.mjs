/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optional integrations (stripe/twilio/resend) are loaded dynamically and may be absent.
  // Keep them out of the server bundle trace unless installed.
  serverExternalPackages: ["stripe", "twilio", "resend"],
};

export default nextConfig;
