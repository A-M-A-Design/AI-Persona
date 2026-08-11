// Lecture et découpage du corps d'un article, côté serveur.
//
// La source est la même que celle de la base de connaissance du bot —
// knowledge/content-library/<slug>.md — pour qu'un article n'existe qu'en un
// seul exemplaire : mettre à jour le portfolio reste « éditer un fichier
// markdown, ouvrir une PR ».
//
// Le sous-ensemble markdown reconnu est celui que les articles utilisent
// réellement (titres de niveau 2, listes, gras). Pas de dépendance : un
// analyseur complet ne servirait rien de plus ici.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Lang } from "./i18n";

const DIR = join(process.cwd(), "knowledge", "content-library");

// Les traductions vivent dans un sous-dossier : lib/prompt.ts ne lit que les
// `.md` à la racine de content-library, la base de connaissance du bot reste
// donc inchangée (le modèle traduit à la volée, cf. garde-fou 7).
const EN_DIR = join(DIR, "en");

function sourcePath(slug: string, lang: Lang): string | null {
  const candidates = lang === "en" ? [join(EN_DIR, `${slug}.md`), join(DIR, `${slug}.md`)] : [join(DIR, `${slug}.md`)];
  return candidates.find(existsSync) ?? null;
}

/** Vrai si l'article existe dans cette langue — faux quand on retombe sur le français. */
export function hasTranslation(slug: string, lang: Lang): boolean {
  return lang === "fr" || existsSync(join(EN_DIR, `${slug}.md`));
}

export type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] };

export function hasArticleBody(slug: string): boolean {
  return existsSync(join(DIR, `${slug}.md`));
}

/**
 * Corps de l'article dans les deux langues. La langue d'affichage vit côté
 * client (réglage persisté), alors que la lecture des fichiers est côté
 * serveur : la page transmet donc les deux versions et le composant choisit,
 * comme le fait déjà lib/articles.ts pour le titre et le chapô.
 */
export function readArticleBodies(slug: string): Record<Lang, Block[]> {
  return { fr: readArticleBody(slug, "fr"), en: readArticleBody(slug, "en") };
}

export function readArticleBody(slug: string, lang: Lang = "fr"): Block[] {
  const path = sourcePath(slug, lang);
  if (!path) return [];

  const blocks: Block[] = [];
  let para: string[] = [];
  let items: string[] = [];

  const flushPara = () => {
    if (!para.length) return;
    const text = para.join(" ").trim();
    para = [];
    // Un paragraphe entièrement entre guillemets est une citation : la
    // maquette la compose en serret italique, bordée à gauche.
    if (/^[«"“].*[»"”]\s*$/.test(text)) blocks.push({ type: "quote", text: text.replace(/^[«"“]\s*|\s*[»"”]$/g, "") });
    else blocks.push({ type: "paragraph", text });
  };
  const flushList = () => {
    if (!items.length) return;
    blocks.push({ type: "list", items });
    items = [];
  };

  for (const raw of readFileSync(path, "utf8").split("\n")) {
    const line = raw.trim();

    // Le H1 et la ligne de crédit servent la base de connaissance ; la page
    // tient son titre de lib/articles.ts, qui le porte dans les deux langues.
    // La ligne de crédit est reconnue dans les deux langues : ne filtrer que le
    // français la laissait s'afficher en tête du corps des articles traduits.
    if (line.startsWith("# ") || /^Article (rédigé par|written by)/.test(line)) continue;

    if (!line) {
      flushList();
      flushPara();
      continue;
    }
    if (line.startsWith("#")) {
      flushList();
      flushPara();
      blocks.push({ type: "heading", text: line.replace(/^#+\s*/, "") });
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flushPara();
      items.push(line.replace(/^[-*]\s+/, ""));
      continue;
    }
    if (line.startsWith(">")) {
      flushList();
      flushPara();
      blocks.push({ type: "quote", text: line.replace(/^>\s*/, "") });
      continue;
    }
    flushList();
    para.push(line);
  }
  flushList();
  flushPara();
  return blocks;
}
