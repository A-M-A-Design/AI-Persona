import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La base de connaissance (markdown) est lue au runtime par la route /api/chat :
  // sans cette ligne, les fichiers ne sont pas embarqués dans la function Vercel.
  outputFileTracingIncludes: {
    "/api/chat": ["./knowledge/**", "./personas/*.json"],
  },
  images: {
    // WebP uniquement. Par défaut Next propose aussi l'AVIF, que tout
    // navigateur récent demande via son en-tête Accept ; or l'encodage AVIF
    // d'une illustration de 2624 × 1248 dépasse la minute sur cette machine —
    // le premier visiteur attendrait d'autant. Mesuré : 5 ms en WebP contre
    // plus de 60 s en AVIF, pour un gain de poids marginal sur des sources
    // déjà en WebP.
    formats: ["image/webp"],
  },
};

export default nextConfig;
