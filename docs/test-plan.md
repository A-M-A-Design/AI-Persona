# Plan de test

Checklists de validation par milestone — à cocher dans la PR correspondante.

## M0 — Socle ✅ (validé le 2026-08-11)

- [x] `npm run dev` : page avec composants WDS correctement stylés
- [x] `data-color-mode="dark"` bascule le rendu
- [x] `styles/welds-src/` absent de `git status`

## M1 — Chat streaming

- [x] UI chat rendue (composer, questions suggérées)
- [x] Erreur propre sans clé API (500 JSON explicite)
- [ ] Conversation fluide en streaming avec une clé valide
- [ ] Le bot parle à la première personne

## M2 — Base de connaissance

- [ ] Golden questions 1–12 : faits exacts, zéro invention
- [ ] Golden questions 13–17 (pièges) : refus propre + redirection contact
- [ ] Prompt caching actif (`cache_read_input_tokens` > 0 dès la 2e requête)

## M3 — Theming 3 personas

- [ ] Switch instantané sans flash entre les 3 personas
- [ ] Dark OK dans les 3 (6 combinaisons)
- [ ] Libellule : coins 0, ombres dures, pixel font sur titres, body lisible
- [ ] Contrôle contraste (DevTools) sur les textes principaux
- [ ] `/dev/kit` : tous les composants × 3 personas × 2 modes

## M4 — Personnalités + i18n

- [ ] Golden questions 18–20 (ton et langues)
- [ ] Toggle EN → UI en anglais et réponse suivante du bot en anglais

## M5 — Polish POC

- [ ] Parcours recruteur complet (question suggérée → 5 échanges → switch
      persona → switch langue → reload avec historique) desktop + mobile
- [ ] Nouvelle conversation ; états d'erreur et de chargement
