# Accor — QA automatisée du design system

- **Rôle** : conception de la méthode et de l'outillage, dans le cadre de la
  mission Design System Manager chez Accor.
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

Le résultat est contre-intuitif et c'est tout l'intérêt : **supprimer le repli
heuristique global a fait baisser le taux de conformité affiché**. Ce qui était
compté comme conforme par défaut est devenu explicitement « hors audit ». Le
rapport est passé d'un document qu'on discutait à un document qu'on croit.

## Résultats

- Environ 150 composants suivis, dont environ 90 audités par campagne, pour
  quelques centaines de cas sondés et plusieurs milliers de liaisons de tokens
  vérifiées à chaque passe.
- Provenance affichée sur la totalité des vérifications, et 63 tests unitaires
  sur l'outillage de QA lui-même — un outil de contrôle qui n'est pas testé ne
  contrôle rien.

## Ce que ce projet illustre

Qu'un rapport de QA ne vaut que par la confiance qu'on lui accorde. Il est plus
utile d'afficher honnêtement ce qu'on ne sait pas vérifier que de produire un
score flatteur : c'est le taux « hors audit » qui a rendu le reste crédible, et
qui a transformé chaque écart détecté en arbitrage explicite — corriger
l'intégration, ou étendre le contrat.

*(Les résultats d'audit détaillés relèvent du client et ne sont pas partagés
ici : contactez Arthur pour parler de la méthode.)*
