import { expect, test } from "@playwright/test";
import { segmenterReponse, type Segment } from "../lib/persona-mention";

// Ces cas ne touchent pas au navigateur : ils valident la brique qui décide
// quels mots d'une réponse deviennent cliquables. Le cas « toujours » est celui
// qu'Arthur a observé — « ours » y était détecté au milieu du mot et rendait
// une partie du texte cliquable.

const PERSONAS = [
  { id: "ours", noms: ["L'Ours", "The Bear"] },
  { id: "corneille", noms: ["La Corneille", "The Crow"] },
  { id: "libellule", noms: ["La Libellule", "The Dragonfly"] },
];

const TITRES = [
  { slug: "roi-design-system", titre: "Comment mesurer le ROI d'un Design Système ?" },
];

const decouper = (texte: string) => segmenterReponse(texte, PERSONAS, TITRES);
const personas = (texte: string) =>
  decouper(texte)
    .filter((s): s is Extract<Segment, { type: "persona" }> => s.type === "persona")
    .map((s) => s.libelle);

/** Le texte rendu doit toujours être celui d'origine, quel que soit le découpage. */
const recompose = (texte: string) =>
  decouper(texte)
    .map((s) => (s.type === "texte" ? s.texte : s.libelle))
    .join("");

test.describe("aucune détection au milieu d'un mot", () => {
  const PIEGES = [
    "Je réponds toujours à cette question.", // « ours » dans « toujours »
    "Le pourtour de la carte reste net.",
    "There was a crowd of designers.", // « crow » dans « crowd »
    "He had a long beard.", // « bear » dans « beard »
    "Un ourson n'est pas un persona.",
    "Les contours du composant.",
  ];

  for (const texte of PIEGES) {
    test(`« ${texte} » ne produit aucun bouton`, () => {
      expect(personas(texte)).toEqual([]);
      expect(recompose(texte)).toBe(texte);
    });
  }
});

test.describe("le persona nommé reste détecté", () => {
  // [texte, libellés attendus, texte recomposé s'il diffère de l'entrée]
  const CAS: [string, string[], string?][] = [
    ["Demande à l'Ours, c'est son domaine.", ["l'Ours"]],
    // Le gras markdown est reconnu, et ses astérisques ne sont pas rendues :
    // le bouton porte le nom, pas la syntaxe.
    [
      "Bascule vers **la Libellule** pour creuser.",
      ["la Libellule"],
      "Bascule vers la Libellule pour creuser.",
    ],
    ["The Crow covers product questions.", ["The Crow"]],
    ["Parles-en à la Corneille.", ["la Corneille"]],
    ["L'Ours en dirait plus.", ["L'Ours"]],
    // Sans article mais capitalisé : c'est bien le persona.
    ["Ours répondra mieux que moi.", ["Ours"]],
    // Ponctuation collée : la frontière ne doit pas l'exiger comme lettre.
    ["Vois avec l'Ours, il saura.", ["l'Ours"]],
    ["Deux pistes : l'Ours et la Corneille.", ["l'Ours", "la Corneille"]],
  ];

  for (const [texte, attendu, rendu] of CAS) {
    test(`« ${texte} »`, () => {
      expect(personas(texte)).toEqual(attendu);
      expect(recompose(texte)).toBe(rendu ?? texte);
    });
  }
});

test("« ours » en minuscule et sans article reste du texte", () => {
  // L'animal, pas le persona — le bot nomme toujours le persona avec son
  // article ou sa majuscule.
  expect(personas("Il y a des ours dans les Pyrénées.")).toEqual([]);
});

test("un titre d'article devient un lien, et l'emporte sur le mot qu'il contient", () => {
  const segments = decouper("Voir « Comment mesurer le ROI d'un Design Système ? » pour le détail.");
  const articles = segments.filter((s) => s.type === "article");
  expect(articles).toHaveLength(1);
  expect(articles[0]).toMatchObject({ slug: "roi-design-system" });
  expect(recompose("Voir « Comment mesurer le ROI d'un Design Système ? » pour le détail.")).toBe(
    "Voir « Comment mesurer le ROI d'un Design Système ? » pour le détail.",
  );
});

test("le persona actif n'est pas proposé à lui-même", () => {
  const sansOurs = PERSONAS.filter((p) => p.id !== "ours");
  const segments = segmenterReponse("Demande à l'Ours.", sansOurs, TITRES);
  expect(segments.every((s) => s.type === "texte")).toBe(true);
});

test("le texte sans aucune mention traverse intact", () => {
  const texte = "Une réponse ordinaire, sans nom propre ni titre.";
  expect(decouper(texte)).toEqual([{ type: "texte", texte }]);
});
