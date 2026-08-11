# Base de connaissance — mode d'emploi

Chaque fichier `.md` de ce dossier est injecté dans le system prompt du bot,
balisé par son nom de fichier (`bio.md` → `<bio>…</bio>`). Les sous-dossiers
`projects/` et `content-library/` sont regroupés dans `<projects>` et
`<articles>`.

Règles d'édition :

1. **Uniquement des faits vérifiés** — le bot a interdiction d'inventer, mais
   il répète ce qui est écrit ici. Ce dossier EST la source de vérité.
2. **Curation confidentialité avant import** : rien d'interne Accor (chiffres,
   roadmaps, noms internes non publics) — c'est la vraie ligne de défense,
   pas le prompt.
3. Un fichier = un sujet. Markdown simple, titres `##`, pas de tableaux complexes.
4. Toute modification passe par une branche `kb/…` + PR + entrée CHANGELOG
   (règle d'or).

Ce fichier `_meta.md` n'est PAS injecté dans le prompt.
