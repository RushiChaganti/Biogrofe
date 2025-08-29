// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/Biogrofe",       
  assetPrefix: "/Biogrofe/",    
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;