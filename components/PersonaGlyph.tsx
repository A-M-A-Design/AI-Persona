// Glyphes des avatars, style « La Linea » (Osvaldo Cavandoli) : un trait
// continu qui entre par la gauche, dessine l'animal de profil et ressort à
// droite. Trait = couleur primaire du thème actif (donc il change avec le
// persona et le color mode).
type Props = {
  persona: string;
  className?: string;
  title?: string;
};

const PATHS: Record<string, string> = {
  // Ours : croupe ronde, dos, petite oreille, museau, patte avant.
  ours: "M0,120 H72 C74,96 84,74 112,66 C150,55 186,56 212,62 C216,50 230,48 234,60 C256,64 274,74 282,86 L296,92 C290,99 278,102 266,102 L260,120 H400",
  // Corneille : queue effilée, dos, tête, bec pointu, poitrail, patte.
  corneille:
    "M0,120 H64 L94,88 L108,97 C130,74 162,60 198,58 C220,57 236,60 242,68 L274,76 L242,82 C236,97 224,108 208,113 L204,120 H400",
  // Libellule : corps fin horizontal, deux ailes en boucle, tête ronde.
  libellule:
    "M0,120 H68 C88,116 98,104 106,94 L140,86 C158,82 176,80 190,79 C182,46 216,38 218,72 C226,44 262,40 256,76 C272,74 286,72 296,71 C304,64 314,66 316,73 C318,80 310,85 302,84 C270,88 234,92 200,96 C176,99 152,105 132,111 C120,115 106,119 92,120 H400",
};

export default function PersonaGlyph({ persona, className, title }: Props) {
  const d = PATHS[persona] ?? PATHS.ours;
  return (
    <svg
      viewBox="0 0 400 140"
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      fill="none"
    >
      <path
        d={d}
        stroke="var(--wel-sem-color-primary, currentColor)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
