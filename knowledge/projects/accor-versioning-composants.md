# Accor — Versioning outillé des composants

- **Rôle** : définition du barème, du format de changelog et de la chaîne
  d'outils, dans le cadre de la mission Design System Manager chez Accor.
- **Contexte** : le design system Welcome est consommé par plusieurs stacks
  front simultanément. Un composant y bouge en permanence.
- **Problème** : sans langage commun sur « ce qui a changé et si ça me casse »,
  les équipes d'intégration découvrent les ruptures en recette. Et la question
  n'est pas seulement technique : une équipe qui ne sait pas évaluer le coût
  d'une montée de version ne monte pas de version.

## Démarche

- **Un barème SemVer en trois classes**, écrit et opposable :
  *MAJOR* quand une propriété ou un élément d'anatomie disparaît, qu'un type
  change ou qu'une valeur par défaut change ; *MINOR* pour un ajout de
  propriété, de variante ou d'élément ; *PATCH* pour une correction de chemin ou
  de valeur de token, un effet, un style de texte.
- **Une taxonomie orthogonale de neuf catégories de changement** (chemin de
  token, migration d'un token sémantique vers un token de composant, ajout de
  token, effet, style de texte, anatomie, propriété, mise en page,
  comportement) : le barème dit la gravité, la catégorie dit la nature.
- **Un changelog par composant, au format imposé** : une section « pourquoi »
  obligatoire, puis chaque changement listé avec l'élément touché, la propriété,
  la valeur avant, la valeur après et l'impact, et un résumé chiffré par classe.
  Les changements d'instance ne sont pas du versioning et en sont exclus.
- **Ce qui est outillé** : la ré-extraction, la validation de schéma, la
  propagation de version, la gestion de branche et la publication. **Ce qui
  reste humain** : la validation du numéro de version proposé et la fusion. Le
  diff et la prose du changelog sont rédigés par l'agent contre le barème, puis
  relus — jamais appliqués sans accord.
- **Une règle d'or de gouvernance** : toute modification d'un fichier
  structurant appelle un changelog dédié ; le contenu généré, non. Le test de
  décision tient en une phrase — « est-ce que régresser ce changement peut
  casser un flux de travail ? ».

## Gains

- **« Est-ce que ça me casse ? » a désormais une réponse écrite**, datée et
  toujours au même format. Un intégrateur évalue le coût d'une montée de version
  sans ouvrir Figma ni solliciter l'équipe design system.
- **Le changelog a cessé d'être un coût.** C'est ce qui décide tout : une
  discipline qu'on paie à chaque changement finit par être contournée. Ici le
  diff et la prose sont produits par l'agent contre le barème, l'humain relit et
  tranche — c'est ce qui a rendu tenable d'en produire près de 500 sur quelque
  270 composants, plus une centaine sur l'outillage lui-même.
- **La dette d'adoption devient visible, donc arbitrable.** Le cas qui résume la
  philosophie : un renommage de propriétés, rupture d'API sur le papier, a été
  **tenu à version constante** tant que le code ne l'avait pas adopté. La
  version suit l'usage réel, pas la maquette — et l'écart entre les deux se lit
  au lieu de se subir.

## Ce que ce projet illustre

Que le versioning d'un design system est un **objet de gouvernance avant d'être
un objet technique**. Automatiser le calcul du diff est facile ; le difficile
est de se mettre d'accord sur ce qui mérite un numéro, et de tenir cet accord
quand il devient gênant.

*(Les détails internes — historique, arbitrages, outillage propriétaire — ne
sont pas partagés ici : contactez Arthur pour en parler de vive voix.)*
