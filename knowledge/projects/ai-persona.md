# AI Persona — ce portfolio conversationnel

- **Rôle** : conception et direction du produit ; développement mené en
  binôme avec Claude (l'IA d'Anthropic), en workflow agentique.
- **Contexte** : remplacer un portfolio Notion/PDF difficile à maintenir par
  une expérience que les recruteurs ont envie d'explorer — et qui démontre en
  elle-même les compétences design system d'Arthur.

## Principe

- Un chat en streaming avec la version IA d'Arthur (API Claude), nourrie
  exclusivement d'une base de connaissance en markdown issue de son vrai
  portfolio, de ses articles et de son profil — maintenue comme un design
  system : modulaire, versionnée dans Git, chaque modification passant par une
  branche et une pull request.
- **Trois personas switchables**, chacun étant un thème complet sur un contrat
  d'environ 870 variables CSS (primitives → sémantique → composants), sur le
  modèle du theming multi-marques d'Accor : l'Ours (chaleureux, par défaut),
  la Corneille (mystérieuse), la Libellule (rétro 16-bit). Light/dark et
  FR/EN inclus — soit douze combinaisons d'expérience sur les mêmes
  composants.

## Ce que le projet démontre

- Une architecture de tokens robuste : changer de persona ne touche pas un
  composant, seulement les valeurs du contrat.
- L'IA intégrée à la pratique du design : le même principe que ses travaux
  d'outillage MCP chez Accor, appliqué à sa propre marque.
- Une maintenance pensée pour durer : mettre à jour le portfolio = éditer un
  fichier markdown, ouvrir une PR.
