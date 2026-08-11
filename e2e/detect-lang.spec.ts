import { expect, test } from "@playwright/test";
import { detectLang } from "../lib/detect-lang";

// Ces cas ne touchent pas au navigateur : ils valident la seule brique qui
// décide de la langue de réponse. Le cas « What is your current role? » est
// celui qui échouait quand la décision était laissée au modèle.
const CAS: [string, "fr" | "en" | null][] = [
  ["What is your current role?", "en"],
  ["Tell me about the SIAAP project", "en"],
  ["How do you work with developers?", "en"],
  ["What did you do at JEMS?", "en"],
  ["Quel est ton poste actuel ?", "fr"],
  ["Parle-moi du projet SIAAP", "fr"],
  ["Comment travailles-tu avec les développeurs ?", "fr"],
  ["C'est quoi ta vision d'un bon design system ?", "fr"],
  ["Combien gagnes-tu chez Accor ?", "fr"],
  // Trop court ou sans signal : on laisse l'appelant retomber sur l'interface.
  ["", null],
  ["SIAAP", null],
  ["ok", null],
];

// Fonctions pures : pas de navigateur, donc rejouées à l'identique par chaque
// projet de largeur. C'est instantané et sans effet de bord.
test.describe("Détection de langue", () => {
  for (const [texte, attendu] of CAS) {
    test(`« ${texte || "(vide)"} » → ${attendu ?? "indéterminé"}`, () => {
      expect(detectLang(texte)).toBe(attendu);
    });
  }

  test("les diacritiques pèsent plus qu'un mot isolé", () => {
    expect(detectLang("Design system très intégré")).toBe("fr");
  });
});
