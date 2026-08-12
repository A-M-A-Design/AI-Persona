// Poids du prompt système, par section.
//
// Pourquoi cet outil : la base de connaissance est injectée en entier à chaque
// requête. Le 2026-08-12, l'ajout de six fiches projet a porté le prompt à
// ~25k tokens, soit exactement la limite de 25 000 tokens/minute du tier
// gratuit Mistral — une seule question consommait le quota d'une minute, et le
// chat répondait `429` une fois sur deux. Rien ne l'avait signalé : le prompt
// n'était mesuré nulle part.
//
// Ce script reproduit les règles de sélection de lib/prompt.ts (mêmes filtres,
// mêmes dossiers). Il mesure donc exactement ce qui pèse : la base de
// connaissance et les synthèses d'articles. Les blocs codés en dur (identité,
// garde-fous) sont extraits du source de lib/prompt.ts ; ils représentent ~5 %
// du total et ne bougent quasiment jamais.
//
// Usage : npm run prompt:size
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const KNOWLEDGE = join(ROOT, "knowledge");

// Seuil d'alerte. La limite dure observée côté Mistral est de 25 000
// tokens/minute ; on s'arrête bien en deçà pour laisser la place à l'historique
// de conversation, à la réponse, et à un aller-retour de l'outil lire_article.
const SEUIL_TOKENS = 18_000;

// Le français coûte plus cher que l'anglais en tokens. Ratio calibré sur les
// mesures du 2026-08-12 : ~115 ko de prompt saturaient une fenêtre de 25k.
const CARS_PAR_TOKEN = 4.5;

const tokens = (chars) => Math.round(chars / CARS_PAR_TOKEN);

function chars(p) {
  return existsSync(p) ? readFileSync(p, "utf8").length : 0;
}

/** Les littéraux IDENTITY et GUARDRAILS, lus dans le source plutôt que recopiés
 *  ici : un doublon dériverait en silence. */
function hardcodedChars() {
  const src = readFileSync(join(ROOT, "lib", "prompt.ts"), "utf8");
  let total = 0;
  let trouves = 0;
  for (const nom of ["IDENTITY", "GUARDRAILS"]) {
    const m = src.match(new RegExp(`const ${nom} = \`([\\s\\S]*?)\`;`));
    if (m) {
      total += m[1].length;
      trouves += 1;
    }
  }
  if (trouves < 2) {
    console.error("⚠ IDENTITY/GUARDRAILS introuvables dans lib/prompt.ts — total sous-estimé.");
  }
  return total;
}

/** Même filtre que lib/prompt.ts : les `.md` à la racine, sauf _meta et
 *  tone-of-voice (hissé en tête, compté à part). */
function rootFiles() {
  return readdirSync(KNOWLEDGE)
    .filter((f) => f.endsWith(".md") && f !== "_meta.md" && f !== "tone-of-voice.md")
    .sort();
}

/** readDirSections n'est pas récursif : content-library/en/ n'est pas injecté. */
function mdFiles(dir) {
  const p = join(KNOWLEDGE, dir);
  return existsSync(p) ? readdirSync(p).filter((f) => f.endsWith(".md")).sort() : [];
}

/** Le bloc <articles> ne porte plus le corps des articles mais leur synthèse :
 *  titre, chapô, idées clés, plan. On mesure ici les deux parts qui vivent dans
 *  le markdown — le reste (titres et chapôs) vient de lib/articles.ts et pèse
 *  ~1 ko au total. */
function articleDigestChars() {
  let total = 0;
  const detail = [];
  for (const f of mdFiles("content-library")) {
    const src = readFileSync(join(KNOWLEDGE, "content-library", f), "utf8");
    const lignes = src.split(/\r?\n/).map((l) => l.trim());
    const idees = lignes.find((l) => /^(Idées clés|Key ideas)\s*:/.test(l)) ?? "";
    const plan = lignes.filter((l) => l.startsWith("## ")).join(" · ");
    if (!idees) console.error(`⚠ ${f} n'a pas de ligne « Idées clés : » — le bot n'en connaîtra que le plan.`);
    const poids = idees.length + plan.length;
    total += poids;
    detail.push({ f, poids, corps: src.length });
  }
  return { total, detail };
}

const lignes = [];
let total = 0;
const ajoute = (nom, n) => {
  lignes.push({ nom, n });
  total += n;
};

ajoute("identité + garde-fous", hardcodedChars());
ajoute("tone-of-voice", chars(join(KNOWLEDGE, "tone-of-voice.md")));

const digests = articleDigestChars();
ajoute("articles (synthèses)", digests.total);

for (const f of rootFiles()) ajoute(f, chars(join(KNOWLEDGE, f)));

let projets = 0;
for (const f of mdFiles("projects")) projets += chars(join(KNOWLEDGE, "projects", f));
ajoute(`projects/ (${mdFiles("projects").length} fiches)`, projets);

lignes.sort((a, b) => b.n - a.n);

console.log("\nPoids du prompt système, par section\n");
for (const { nom, n } of lignes) {
  const part = ((100 * n) / total).toFixed(1).padStart(5);
  console.log(`  ${String(n).padStart(7)} car.  ${part} %   ${nom}`);
}

const t = tokens(total);
console.log(`\n  ${String(total).padStart(7)} car.  100.0 %   TOTAL  (~${t.toLocaleString("fr-FR")} tokens estimés)\n`);

const corpsTotal = digests.detail.reduce((s, d) => s + d.corps, 0);
console.log(
  `  Corps des articles gardé hors prompt : ${corpsTotal.toLocaleString("fr-FR")} car. ` +
    `(~${tokens(corpsTotal).toLocaleString("fr-FR")} tokens), chargé à la demande par l'outil lire_article.\n`,
);

if (t > SEUIL_TOKENS) {
  console.error(
    `✗ Le prompt dépasse le seuil de ${SEUIL_TOKENS.toLocaleString("fr-FR")} tokens.\n` +
      `  Sur le tier gratuit Mistral (25 000 tokens/minute), le chat renverra des 429\n` +
      `  dès la deuxième question. Alléger la base, ou basculer CHAT_PROVIDER=anthropic\n` +
      `  dont le cache est déjà câblé (cf. README).\n`,
  );
  process.exit(1);
}

console.log(`✓ Sous le seuil de ${SEUIL_TOKENS.toLocaleString("fr-FR")} tokens.\n`);
