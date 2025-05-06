/** @type {import('next').NextConfig} */
const nextConfig = {
  // Webpack configuration to handle Node.js modules properly
  webpack: (config, { isServer }) => {
    // Only in the browser build
    if (!isServer) {
      // Mark these packages as external to prevent bundling errors
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        os: false,
        path: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        child_process: false,
        perf_hooks: false,
      };
    }

    return config;
  },
  // Necessary for serverless functions that use Puppeteer
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', 'puppeteer'],
    serverActions: {
      bodySizeLimit: '50mb', // Increase response size limit for the screenshot
    },
  },
};

module.exports = nextConfig; 