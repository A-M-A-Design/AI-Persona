# Accor — Code Connect : lier Figma au code réellement rendu

- **Rôle** : conception et mise en œuvre de la chaîne de liaison et de
  publication, dans le cadre de la mission Design System Manager chez Accor.
- **Contexte** : refermer l'écart entre la maquette et le code, à l'endroit
  précis où le développeur regarde — le mode développeur de Figma.
- **Problème** : par défaut, Figma propose au développeur un CSS générique,
  déduit du dessin, sans rapport avec le composant réel du design system. Le
  développeur repart de zéro et réinvente un markup qui existait déjà. Chaque
  réinvention est une divergence de plus.

## Démarche

- **Lier chaque composant Figma à son snippet réellement rendu**, extrait du DOM
  de la démonstration Storybook — pas déduit du contrat, mais capturé du rendu.
  Les correspondances entre une valeur de variante et sa classe CSS sont
  dérivées en rendant réellement chaque valeur, ce qui évite les pièges que
  personne ne devine à la lecture d'un nom.
- **Un modèle paramétré** : une liaison par nœud, Figma injectant les valeurs de
  la variante sélectionnée. Une liaison fourre-tout qui montrerait le même
  exemple pour toutes les variantes est un anti-pattern explicite.
- **Une règle de décision structurante : l'anatomie se décide au rendu, jamais
  d'après le nom de l'état.** Un état qui ne change qu'un attribut passe par un
  attribut de racine. Un état qui en change plusieurs à la fois — l'erreur mute
  la classe racine, pose les attributs d'accessibilité sur l'élément *imbriqué*
  et non sur la racine, et ajoute un sous-arbre de message — exige une liaison
  dédiée par variante. Deviner d'après le nom de l'état place les attributs au
  mauvais endroit.
- **Cinq portes avant publication** : complétude des liaisons (aucune propriété
  Figma non liée), correction vérifiée au rendu (chaque valeur produit bien la
  bonne classe), analyse statique, prévisualisation en mode développeur,
  simulation sur des instances réelles. Deux de ces portes interrogent le Figma
  *live* et non le cache : la vérité sur les propriétés, c'est le nœud.
- **Une publication en « clean-sync », entrelacée nœud par nœud** : l'outil
  officiel ne supprime jamais les liaisons devenues obsolètes, qui subsistent en
  « zombies » et s'affichent au développeur. Purger puis republier composant par
  composant — et non tout purger puis tout republier — évite la fenêtre pendant
  laquelle le design system apparaît déconnecté.

## Résultats

- Une cinquantaine de composants liés, déclinés en **trois saveurs de code**
  sur les mêmes nœuds Figma — HTML/BEM, Vue et Nuxt — pour que chaque
  développeur reçoive l'idiome de sa stack depuis la même maquette.
- Publication conditionnée à zéro liaison manquante et zéro écart au rendu.
- L'historique Git comme seul mécanisme de retour arrière : la plateforme
  n'historise pas les snippets publiés, donc la discipline de commit *est* la
  sécurité.

## Ce que ce projet illustre

Que la valeur d'un design system se joue au dernier mètre. Toute
l'architecture de tokens et de composants ne sert à rien si, au moment de coder,
le développeur voit autre chose que le vrai code — dans la bonne variante, avec
l'accessibilité correcte incluse.

*(Les détails internes — identifiants Figma, inventaire, code des composants —
ne sont pas partagés ici : contactez Arthur pour en parler de vive voix.)*
