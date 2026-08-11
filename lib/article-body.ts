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

const DIR = join(process.cwd(), "knowledge", "content-library");

export type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] };

export function hasArticleBody(slug: string): boolean {
  return existsSync(join(DIR, `${slug}.md`));
}

export function readArticleBody(slug: string): Block[] {
  const path = join(DIR, `${slug}.md`);
  if (!existsSync(path)) return [];

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
    if (line.startsWith("# ") || /^Article rédigé par/.test(line)) continue;

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
