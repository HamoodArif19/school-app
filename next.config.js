/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // allow cloudinary images if used in production
    domains: ['res.cloudinary.com'],
  },
  api: {
    bodyParser: false, // We'll use formidable on endpoints that need file uploads
  },
};

module.exports = nextConfig;
