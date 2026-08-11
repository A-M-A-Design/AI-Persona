import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La base de connaissance (markdown) est lue au runtime par la route /api/chat :
  // sans cette ligne, les fichiers ne sont pas embarqués dans la function Vercel.
  outputFileTracingIncludes: {
    "/api/chat": ["./knowledge/**", "./personas/*.json"],
  },
};

export default nextConfig;
