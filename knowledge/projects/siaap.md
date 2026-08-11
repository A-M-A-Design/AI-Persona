# SIAAP — Environnement de pilotage de production, back office et design system

- **Rôle** : Lead Product. Équipe : 1 dev front, 3 devs back, 2 data
  ingénieurs, 1 scrum master. Durée : 1,5 an (2022-23). Budget : 1,4 M€.
- **Contexte** : le SIAAP, service public industriel du traitement des eaux
  franciliennes (9 usines, une vingtaine d'outils applicatifs), veut valoriser
  son lac de données et industrialiser l'évolution de ses outils de
  production — plusieurs milliers d'indicateurs à piloter.

## Démarche

- Méthode Scrum avec deux ateliers de co-conception par sprint de deux
  semaines ; comptes rendus systématiques ; prototype testé chaque semaine par
  le directeur de production.
- Reprise du design system existant (Sketch) et migration vers Figma ;
  résorption de la dette technique du DS.
- Organisation des fichiers de conception calquée sur le découpage des
  sections de production des usines : le PO retrouve intuitivement une
  structure familière — baisse de la charge mentale.
- Maquettage avec les **données réelles de production** pour éviter les
  surprises à la mise en production ; association des composants UI à la base
  de données pour faciliter le hand-off.
- **Data storytelling** : chaque besoin est traduit en langage data
  (« comparer des catégories », « visualiser deux tendances sur 24 h ») puis
  associé à une représentation argumentée (clustered bar chart, line chart…)
  avec alternatives — le modèle CHRTS (Catégoriser, Hiérarchiser, Relationnel,
  Temporel, Spatial) guide les choix et évite les débats esthétiques.
- 200 écrans et une soixantaine de gabarits pour le prototype complet d'une
  usine, sur **5 breakpoints** (mobile, tablette portrait/paysage, desktop,
  TV).
- Conception orientée opérateurs : palettes de seuils d'alerte et de danger,
  tendances par iconographie, remontée des erreurs de niveau 2-3 vers les
  indicateurs de niveau 1, **dark mode** pour les environnements peu lumineux.
- Back office : prévisualisation des formules de calcul, auto-complétion,
  gestion d'erreurs champ par champ — la prévention d'erreurs traitée à la
  source.
- Coordination de la QA : qualifier chaque anomalie (conception, intégration
  front, ou données).

## Résultats

- Utilisateurs très satisfaits de leur implication via les ateliers.
- Transition réussie depuis la gestion des indicateurs sous Excel.
- Dette technique du design system résorbée.
- Le client a perçu la valeur du design dans un applicatif métier complexe et
  technique.
