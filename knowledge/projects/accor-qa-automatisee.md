# Accor — QA automatisée du design system

- **Rôle** : conception de la méthode et de l'outillage.
- **Contexte** : vérifier en continu que ce qui est intégré correspond à ce qui
  a été conçu, sur un design system multi-marques servi à plusieurs stacks.
- **Problème** : l'écart entre la maquette et le rendu intégré ne se voit qu'à
  l'œil, tard, à un coût de recette élevé. Le pire est invisible : un
  développeur qui « corrige » une valeur en dur plutôt que d'utiliser la
  variable du système érode le design system sans que personne ne le sache. La
  dérive n'est pas un incident, c'est une lente accumulation.

## Démarche

Trois axes de contrôle, exécutés par composant :

- **Tokens** — détection des valeurs écrites en dur là où le contrat
  d'extraction attend une variable, avec une liste d'exceptions assumées et
  documentée composant par composant.
- **Fonctionnel** — couverture des propriétés, des variantes et de l'anatomie,
  consciente des familles de composants : un composant est confronté à sa
  variante parente, à ses briques de base et à ses composants frères.
- **Accessibilité** — critères WCAG, balayage axe-core filtré sur le critique
  et le sérieux, et sonde clavier (focusabilité, états désactivés, ordre de
  tabulation).

Chaque cas représentatif est sondé dans un navigateur sans interface via
Playwright, avec capture d'écran par variante comme référence de non-régression
visuelle. Les rapports, en Markdown et en JSON, sont publiés en miroir de
l'arborescence des composants, avec un tableau de bord transverse.

## L'escalier de provenance

C'est le cœur du projet, et sa refonte la plus utile. Chaque vérification
s'appuie d'abord sur des **sources déterministes** — les liaisons Figma ↔ code,
puis des règles structurelles de nommage — et ne retombe sur une heuristique
qu'en dernier recours. Surtout : **la provenance de chaque vérification est
imprimée dans le rapport**.

Deux principes ont été posés explicitement. Les conventions de nommage sont un
*détecteur*, jamais une vérité d'échec — elles décrivent une intention, pas un
état. Et aucune vérification ne devient bloquante au seul motif qu'il manque une
source déterministe.

Le gain est contre-intuitif et c'est tout l'intérêt : **le taux de conformité
affiché a baissé, et les rapports sont devenus utilisables**. Ce qui était
compté conforme par défaut est désormais explicitement « hors audit ». Chaque
ligne portant sa source, plus personne ne perd de réunion à contester un
constat : on discute de la correction, plus de la mesure.

## Gains

- **Ce qui n'était vérifiable qu'à l'œil l'est en continu.** Environ 150
  composants suivis, environ 90 audités à chaque campagne, quelques centaines
  de cas sondés et plusieurs milliers de liaisons de tokens contrôlées par
  passe — un volume qu'aucune relecture manuelle n'atteint.
- **La dérive se mesure au lieu de se deviner.** Un écart de token ou
  d'accessibilité est détecté à la passe suivante, pas en recette : il se
  corrige quand il coûte encore peu.
- **Chaque écart devient une décision, pas un débat** : corriger l'intégration,
  ou étendre le contrat. La provenance affichée sur la totalité des
  vérifications est ce qui rend cet arbitrage possible.
- **L'outil de contrôle est lui-même sous contrôle** : 63 tests unitaires — un
  outil de QA non testé ne contrôle rien, il rassure.

## Ce que ce projet illustre

Qu'un rapport de QA ne vaut que par la confiance qu'on lui accorde, et qu'un
score flatteur ne fait gagner personne. Afficher honnêtement ce qu'on ne sait
pas vérifier est ce qui rend le reste crédible — et donc actionnable.

*(Les résultats d'audit détaillés relèvent du client et ne sont pas partagés
ici : contactez Arthur pour parler de la méthode.)*
