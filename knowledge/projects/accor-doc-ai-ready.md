# Accor — Documentation AI-ready générée pour les agents

- **Rôle** : conception du format, du pipeline de génération et du validateur,
  dans le cadre de la mission Design System Manager chez Accor.
- **Contexte** : rendre le design system Welcome consommable par des agents IA
  qui génèrent du code, sans qu'ils aient à deviner les intentions de design.
- **Problème** : une documentation écrite pour des humains décrit ce qu'un
  composant *est*. Elle ne dit pas à un agent **quand ne pas** l'utiliser, ni ce
  qu'il ne faut jamais lui associer. Résultat : du code généré plausible,
  syntaxiquement correct, et faux au regard du système.

## Démarche

- **Un contrat éditorial en neuf sections obligatoires**, dans cet ordre :
  intention, sentiment porté par chaque variante, cas d'usage recommandés, cas
  à éviter, associations naturelles, combinaisons interdites, règles de
  composition (ce que le composant exige, autorise, interdit), do / don't /
  précautions, et contexte par point de rupture.
- **Un fichier Markdown par composant**, avec en-tête YAML validé — le
  validateur vérifie l'en-tête *et* la présence des neuf sections. Une fiche
  incomplète est détectée automatiquement, pas découverte à l'usage.
- **Génération depuis la plateforme de documentation** via un pont MCP, enrichie
  par le contrat d'extraction : la partie structurelle est dérivée, jamais
  ressaisie. Une vérification déterministe compare les aperçus générés à ce qui
  est publié, avant tout envoi.
- **Ce qui relève du jugement reste humain** : le sentiment porté par une
  variante, les associations pertinentes, les interdits — tout cela sort
  d'ateliers avec les designers, pas d'une inférence. Le pipeline compte les
  sections restant à écrire pour prioriser les ateliers suivants.

## Gains

- **Un agent sait désormais quand *ne pas* utiliser un composant.** La
  génération de code passe du plausible au conforme, et l'équipe design system
  cesse d'être le goulot d'étranglement de chaque décision d'usage.
- **La connaissance tacite devient un actif écrit.** Les interdits, les
  associations, les intentions — ce que trois personnes savaient et
  transmettaient de vive voix — sont documentés, versionnés et opposables. Ils
  survivent aux départs.
- **Une seule source sert les deux publics.** La partie structurelle est dérivée
  du contrat d'extraction, jamais ressaisie : il n'y a pas une documentation
  humaine et une documentation machine à maintenir en parallèle.
- **Le choix du Markdown à en-tête structuré a débloqué la contribution.** Le
  format précédent, en JSON, était illisible pour un designer ; le rendre
  relisible est ce qui a permis de réintroduire les sections de jugement et de
  faire entrer les designers dans la boucle.

## Ce que ce projet illustre

La conviction qu'une documentation de design system doit désormais avoir
**deux lecteurs** : l'humain qui conçoit et l'agent qui génère. Le passage de
l'un à l'autre ne se fait pas en réécrivant la prose, mais en explicitant ce
qui était implicite — les interdits, les associations, les intentions.

*(Les détails internes — contenus, couverture, outillage propriétaire — ne sont
pas partagés ici : contactez Arthur pour en parler de vive voix.)*
