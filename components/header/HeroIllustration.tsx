"use client";

import PersonaGlyph from "../PersonaGlyph";
import { useSettings } from "../useSettings";

// Illustration héro façon La Linea : le trait continu représente l'avatar
// actif et change avec le select « Avatar Type » (comme sur poulos.co).
export default function HeroIllustration() {
  const { persona } = useSettings();
  return (
    <div className="hero__illustration">
      <PersonaGlyph persona={persona} className="hero__glyph" title={persona} />
    </div>
  );
}
