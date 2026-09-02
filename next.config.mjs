/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: Cloudflare Pages serves the `out/` directory directly.
  // No server runtime, so every route is prerendered at build time.
  output: 'export',

  // The export target has no Image Optimization server behind it.
  images: { unoptimized: true },

  // Emit `/work/index.html` rather than `/work.html`, which is what
  // Cloudflare Pages expects for clean URLs without a redirect rule.
  trailingSlash: true,
};

export default nextConfig;
