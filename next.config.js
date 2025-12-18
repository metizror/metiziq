/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure API routes are properly handled
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Fix for pdfkit - prevent bundling so font files are accessible
  serverExternalPackages: ["pdfkit"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Fix for pdfkit in server-side rendering
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'canvas',
      });
    }
    return config;
  },
};

module.exports = nextConfig;



