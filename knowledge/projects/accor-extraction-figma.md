# Accor — Extraction automatisée des composants Figma et contrats de données

- **Rôle** : conception et développement du pipeline.
- **Contexte** : brique de fondation de l'industrialisation du design system
  Welcome. Tout le reste — documentation, QA, Code Connect, assistant — se
  branche dessus.
- **Problème** : la maquette Figma est la source de vérité structurelle du
  design system, mais elle est illisible par une machine. Chaque document
  dérivé — spécification, documentation, tableau de correspondance — est
  recopié à la main, et diverge dès la première itération du composant.

## Démarche

- **Extraction dans le bac à sable du plugin Figma**, et non via l'API REST :
  certaines métadonnées, les slots notamment, n'existent tout simplement pas
  côté REST. L'extracteur est piloté depuis un agent IA via MCP, ce qui permet
  de le lancer sur un composant ou sur un lot sans quitter la conversation.
- **Un contrat de données par composant**, sérialisé en YAML et validé par un
  schéma : propriétés et leurs types, anatomie unifiée sur toutes les variantes
  (un élément qui n'existe que dans une variante secondaire est capturé et
  marqué comme tel), styles rangés en huit classes alignées sur les familles
  CSS, références de tokens typées, différentiels entre variantes, métadonnées
  de traçabilité.
- **Validateur écrit sur mesure, sans dépendance** — un contrat qui ne passe
  pas le schéma n'entre pas dans le dépôt.
- **Orchestration par lots** : le corps de l'extracteur est déposé une fois en
  stockage plugin, chaque lot ne transporte plus qu'un talon de quelques lignes,
  et les composants d'un même lot sont extraits en parallèle.

## Gains

- **La spécification d'un composant n'est plus rédigée, elle est dérivée.** Près
  de 300 contrats vivent dans Git et se régénèrent : la divergence entre la
  maquette et sa description cesse d'être une fatalité de calendrier.
- **Une ré-extraction complète du catalogue redevient une opération de
  routine** là où c'était un chantier. Six composants sont
  extraits en 1,5 seconde contre une dizaine en séquentiel, soit un facteur
  sept, et le talon de démarrage divise par vingt le code transporté à chaque
  lot.
- **Un contexte d'IA porte environ une fois et demie plus de composants** : la
  refonte du format a retiré 33 % du volume sur 279 composants appariés, avec
  97 % d'entre eux compactés et aucune perte sémantique.
- **Moins de volume et pourtant plus de fidélité** : le format capture ce que le
  précédent perdait en silence, notamment les surcharges d'instances
  imbriquées — des écarts de rendu qui ne se voyaient qu'à l'œil, en recette.

## Ce que ce projet illustre

Qu'un design system n'est exploitable par une IA que s'il existe d'abord un
**contrat**. Extraire n'est pas le sujet : le sujet est de décider ce qu'un
composant *est*, de le figer dans un schéma, et de refuser tout ce qui n'y
entre pas. C'est le même réflexe que pour une architecture de tokens.

*(Les détails internes — identifiants de fichiers, inventaire des composants,
outillage propriétaire — ne sont pas partagés ici : contactez Arthur pour en
parler de vive voix.)*
