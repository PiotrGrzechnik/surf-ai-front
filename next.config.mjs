const allowedGmails = process.env.ALLOWED_GMAILS ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    ALLOWED_GMAILS: allowedGmails
  }
};

export default nextConfig;
