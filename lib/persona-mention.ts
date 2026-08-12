// Découpage d'une réponse du bot en segments : le texte brut, les noms de
// personas cités (qui deviennent des boutons de bascule) et les titres
// d'articles publiés (qui deviennent des liens).
//
// La logique vit ici, hors du composant, parce qu'elle est subtile et qu'elle
// se teste sans navigateur : c'est une affaire d'expressions régulières sur du
// français, pas de rendu.

export type Segment =
  | { type: "texte"; texte: string }
  | { type: "persona"; id: string; libelle: string }
  | { type: "article"; slug: string; libelle: string };

/**
 * Le nom sans son article : le bot écrit « la Libellule », « l'Ours », « the
 * Bear », et parfois en gras markdown. On cherche donc le seul substantif, et
 * on laisse l'expression régulière rattraper ce qui l'entoure.
 */
export function substantif(nom: string): string {
  return nom.replace(/^(l['’]|la |le |les |the )/i, "").trim();
}

const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ARTICLE_DEVANT = /^(?:l['’]|la |le |the )/i;

/**
 * Frontières de mot, écrites en lettres Unicode plutôt qu'avec `\b`.
 *
 * `\b` s'appuie sur `\w`, c'est-à-dire `[A-Za-z0-9_]` : les lettres accentuées
 * en sont exclues, si bien qu'un `\b` placé contre un « é » se déclenche au
 * mauvais endroit. Sur du texte français, c'est intenable.
 */
const AVANT = "(?<![\\p{L}\\p{N}])";
const APRES = "(?![\\p{L}\\p{N}])";

export function segmenterReponse(
  texte: string,
  personas: { id: string; noms: string[] }[],
  titres: { slug: string; titre: string }[],
): Segment[] {
  const mots = personas.flatMap((p) => p.noms.map((n) => ({ id: p.id, mot: substantif(n) })));
  if (mots.length === 0 && titres.length === 0) return [{ type: "texte", texte }];

  // Les titres d'abord dans l'alternance : plusieurs contiennent un nom de
  // persona, et une alternance ordonnée par longueur évite qu'un mot court
  // ampute le titre qui l'englobe.
  // L'échappement s'applique aux seuls littéraux : les alternatives portent
  // ensuite de la syntaxe régulière, qu'il ne faut surtout pas neutraliser.
  const alternatives = [
    ...titres.map((t) => ({ tri: t.titre.length, motif: echapper(t.titre) })),
    ...mots.map((m) => ({
      tri: m.mot.length,
      motif: `(?:l['’]|la |le |the )?${echapper(m.mot)}`,
    })),
  ]
    .sort((a, b) => b.tri - a.tri)
    .map((a) => a.motif);

  // Sans les frontières, « Ours » se déclenchait à l'intérieur de « toujours »,
  // et « Crow » à l'intérieur de « crowd ». Les astérisques du gras markdown
  // restent DANS le groupe capturé, donc la frontière se place à l'extérieur.
  const motif = new RegExp(
    `${AVANT}(\\*{0,2}(?:${alternatives.join("|")})\\*{0,2})${APRES}`,
    "giu",
  );

  const segments: Segment[] = [];
  let dernier = 0;
  let trouve: RegExpExecArray | null;

  const pousserTexte = (fin: number) => {
    if (fin > dernier) segments.push({ type: "texte", texte: texte.slice(dernier, fin) });
  };

  while ((trouve = motif.exec(texte)) !== null) {
    const brut = trouve[0];
    const nu = brut.replace(/\*/g, "");

    const article = titres.find((t) => t.titre.toLowerCase() === nu.toLowerCase());
    if (article) {
      pousserTexte(trouve.index);
      segments.push({ type: "article", slug: article.slug, libelle: nu });
      dernier = trouve.index + brut.length;
      continue;
    }

    const cible = mots.find((m) => nu.toLowerCase().endsWith(m.mot.toLowerCase()));
    if (!cible) continue;

    // « ours » en minuscule et sans article, c'est l'animal ou une coïncidence,
    // pas une invitation à basculer. On n'active le bouton que si le bot a
    // vraiment nommé le persona : article devant, ou majuscule.
    if (!ARTICLE_DEVANT.test(nu) && !/^\p{Lu}/u.test(nu)) continue;

    pousserTexte(trouve.index);
    segments.push({ type: "persona", id: cible.id, libelle: nu });
    dernier = trouve.index + brut.length;
  }

  if (dernier === 0) return [{ type: "texte", texte }];
  pousserTexte(texte.length);
  return segments;
}
