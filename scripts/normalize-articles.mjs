// Normalise les articles de knowledge/content-library en markdown structuré.
//
// Ces fichiers sont des extractions PDF : lignes coupées à ~86 caractères en
// plein milieu des phrases, titre répété en texte brut sous le H1, titres de
// section sans balisage, listes en puces « • ». Illisibles à l'écran, et sans
// la structure que la maquette des pages articles suppose (titres de section,
// listes, citations).
//
// La transformation est purement typographique : elle ajoute du balisage et
// recolle les lignes, sans jamais réécrire le texte. L'invariant est vérifié à
// chaque fichier — la suite des mots doit être identique avant/après, sinon le
// script échoue sans rien écrire. Les seules suppressions autorisées sont
// déclarées dans DROPPED et journalisées.
//
// Script à passage unique : le résultat est versionné, on ne le rejoue pas.
// Relançable sans dommage (un fichier déjà normalisé est laissé tel quel).
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = join(process.cwd(), "knowledge", "content-library");

// Largeur de coupe de l'extraction PDF : une ligne nettement plus courte que
// cette valeur est une coupe volontaire (fin de paragraphe ou titre), pas un
// retour à la ligne mécanique.
const WRAP = 70;
const SENTENCE_END = /[.?!:»]["']?$/;

// Appels à l'action du média d'origine, hors corps de l'article.
const DROPPED = [/^Découvrez notre offre/i, /^Offre Design$/i, /^Partager (cet|l')article/i];

// L'export PDF a perdu des sauts de paragraphe, irrécupérables en général.
// Les coupes ci-dessous sont les seules attestées par l'export Notion
// d'Arthur, où le chapô forme un paragraphe distinct en gras : la phrase
// indiquée y ouvre le paragraphe suivant. Aucun mot n'est modifié.
const PARAGRAPH_SPLITS = {
  "roi-design-system.md": ["En effet, en tant que praticien DesignOps"],
};

const words = (s) =>
  s
    .replace(/^#+\s+/gm, "")
    .replace(/^[-*•▪·]\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/[*_`]/g, "")
    .split(/\s+/)
    .filter(Boolean);

/** Un fichier déjà balisé en markdown n'a rien à gagner d'une normalisation. */
function alreadyStructured(raw) {
  const lines = raw.split("\n");
  const headings = (raw.match(/^#{2,}\s+/gm) || []).length;
  const blanks = lines.filter((l) => !l.trim()).length;
  return headings >= 3 && blanks > lines.length / 4;
}

/** Découpe une suite de lignes courtes en titres, sur les fins de phrase. */
function splitHeadings(run) {
  const out = [];
  let cur = [];
  for (const line of run) {
    cur.push(line);
    if (SENTENCE_END.test(line)) {
      out.push(cur);
      cur = [];
    }
  }
  if (cur.length) out.push(cur);
  return out;
}

function normalize(raw, splits = []) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const dropped = []; // texte réellement retiré, vérifié mot à mot plus bas
  const notes = [];

  // 1. En-tête : on conserve le H1 et la ligne de crédit, qui servent la base
  //    de connaissance du bot. On retire en revanche la répétition du titre en
  //    texte brut, artefact de l'export PDF.
  const h1 = (lines[0] || "").replace(/^#\s+/, "").trim();
  const head = [];
  let i = 0;
  while (i < lines.length && (lines[i].startsWith("#") || /^Article rédigé par/.test(lines[i]) || !lines[i].trim())) {
    if (lines[i].trim()) head.push(lines[i].trim());
    i++;
  }
  const titleWords = words(h1).join(" ").toLowerCase();
  let probe = "";
  let j = i;
  while (j < lines.length && probe.length < titleWords.length + 4) {
    probe = words(probe + " " + lines[j]).join(" ").toLowerCase();
    j++;
    if (probe === titleWords) {
      dropped.push(lines.slice(i, j).join(" "));
      notes.push(`titre dupliqué (${j - i} ligne(s))`);
      i = j;
      break;
    }
  }

  // 2. Corps : on parcourt les lignes en distinguant puces, titres et prose.
  const body = lines.slice(i).map((l) => l.trim());
  const blocks = [];
  let para = [];
  let run = [];
  let runOpened = false; // la série courante démarre-t-elle après une fin de phrase ?

  const flushPara = () => {
    if (para.length) blocks.push({ type: "p", lines: [...para] });
    para = [];
  };
  // Une suite de lignes courtes n'est un titre que si elle démarre après une
  // fin de phrase et débouche sur du contenu — sinon c'est la dernière ligne
  // d'un paragraphe, qui est courte elle aussi.
  const flushRun = (openedAfterSentence, followedByContent) => {
    if (!run.length) return;
    if (openedAfterSentence && followedByContent && run.join(" ").length < 110) {
      flushPara();
      for (const h of splitHeadings(run)) blocks.push({ type: "h", lines: h });
    } else {
      para.push(...run);
    }
    run = [];
  };

  for (let k = 0; k < body.length; k++) {
    const line = body[k];

    if (!line) {
      flushRun(runOpened, false);
      flushPara();
      continue;
    }
    if (DROPPED.some((re) => re.test(line))) {
      dropped.push(line);
      notes.push(line);
      continue;
    }

    // Les puces de l'export sont tantôt « • », tantôt « - » (listes déjà
    // saisies en markdown) : les deux ouvrent un item.
    if (/^[-•▪·]\s+/.test(line)) {
      flushRun(runOpened, true);
      flushPara();
      blocks.push({ type: "li", lines: [line.replace(/^[-•▪·]\s+/, "")] });
      continue;
    }
    // Continuation d'une puce : ligne qui suit immédiatement un item et ne
    // démarre pas une nouvelle phrase.
    const last = blocks.at(-1);
    if (last?.type === "li" && !run.length && !para.length && !SENTENCE_END.test(last.lines.at(-1))) {
      last.lines.push(line);
      continue;
    }

    if (line.length < WRAP) {
      // Une fin de phrase clôt la série : ce qui suit est une nouvelle unité,
      // et c'est là que se trouvent les titres. Sans cette coupe, la dernière
      // ligne d'un paragraphe et le titre suivant fusionnent et s'annulent.
      if (run.length && SENTENCE_END.test(run.at(-1))) {
        flushRun(runOpened, true);
        runOpened = true;
      } else if (!run.length) {
        const prev = para.at(-1) ?? blocks.at(-1)?.lines.at(-1) ?? "";
        runOpened = !prev || SENTENCE_END.test(prev);
      }
      run.push(line);
    } else {
      flushRun(runOpened, true);
      para.push(line);
    }
  }
  // En fin de bloc, une série courte est une fin de paragraphe, pas un titre.
  flushRun(runOpened, false);
  flushPara();

  const out = [...head, ""];
  for (const b of blocks) {
    let text = b.lines.join(" ").replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (b.type === "h") {
      if (out.at(-1) !== "") out.push("");
      out.push(`## ${text}`, "");
    } else if (b.type === "li") {
      out.push(`- ${text}`);
    } else {
      for (const marker of splits) {
        const at = text.indexOf(marker);
        if (at > 0) text = `${text.slice(0, at).trim()}\n\n${text.slice(at)}`;
      }
      out.push(text, "");
    }
  }
  return {
    text: out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n",
    dropped,
    notes,
    headWords: words(head.join(" ")).length,
  };
}

// Retire de `seq` la première occurrence de `sub` située à partir de `from`.
// L'offset est indispensable pour le titre dupliqué : il est mot pour mot
// identique au H1 conservé, et sans lui c'est le H1 qui serait retiré.
function removeRun(seq, sub, from = 0) {
  if (!sub.length) return seq;
  for (let n = from; n + sub.length <= seq.length; n++) {
    if (sub.every((w, k) => seq[n + k] === w)) return [...seq.slice(0, n), ...seq.slice(n + sub.length)];
  }
  return seq;
}

let failed = false;
for (const file of readdirSync(DIR).filter((f) => f.endsWith(".md"))) {
  const path = join(DIR, file);
  const raw = readFileSync(path, "utf8");
  if (alreadyStructured(raw)) {
    console.log(`· ${file} — déjà structuré, laissé tel quel`);
    continue;
  }
  const { text, dropped, notes, headWords } = normalize(raw, PARAGRAPH_SPLITS[file] ?? []);

  // Invariant : la suite des mots après normalisation doit être exactement
  // celle d'avant, moins les segments explicitement retirés.
  let expected = words(raw);
  for (const d of dropped) expected = removeRun(expected, words(d), headWords);
  const after = words(text);
  const at = expected.findIndex((w, n) => after[n] !== w);
  if (at !== -1 || after.length !== expected.length) {
    const n = at === -1 ? Math.min(expected.length, after.length) : at;
    console.error(
      `✗ ${file} — divergence au mot ${n} (${expected.length} attendus, ${after.length} obtenus)\n` +
        `   attendu : …${expected.slice(Math.max(0, n - 4), n + 5).join(" ")}…\n` +
        `   obtenu  : …${after.slice(Math.max(0, n - 4), n + 5).join(" ")}…`,
    );
    failed = true;
    continue;
  }
  writeFileSync(path, text, "utf8");
  const h = (text.match(/^## /gm) || []).length;
  const li = (text.match(/^- /gm) || []).length;
  console.log(`✓ ${file} — ${h} titre(s), ${li} item(s)${notes.length ? ` · retiré : ${notes.join(" | ")}` : ""}`);
}
process.exit(failed ? 1 : 0);
