# Jems — Création d'une offre Design System industrialisée

- **Rôle** : Lead Designer, avec deux développeurs front. Durée : 1 an.
- **Contexte** : Jems, société de conseil spécialisée dans la data, veut
  diversifier son activité avec une offre Design portée par
  l'industrialisation.
- **Problématique** : comment créer une offre Design System déployable à
  l'échelle et adaptée à l'environnement technique et fonctionnel du client ?

## Démarche

1. **Audit interne (3 semaines)** : interviews de dix acteurs de toute la
   chaîne de production (dev front/back, UX, UI, PO…). Insights clés : manque
   de transparence qui induit de la méfiance ; chaque métier a son langage et
   ses outils ; multiplication des outils = changements de contexte et erreurs
   humaines ; pas de source de vérité commune (Figma pour les designers,
   GitLab pour les devs…) ; un design system seul ne suffit pas, il faut un
   programme d'intégration et de contribution dans la durée.
2. **Roadmap (1 semaine)**, partagée aux participants et aux sponsors (Head of
   Design, CTO, tech leads) pour sécuriser le soutien au projet.
3. **Benchmark (2 semaines)** des design systems et flux de production du
   marché : hétérogénéité générale, mais convergence de toutes les solutions
   d'industrialisation vers les **tokens**.
4. **Conceptualisation du flux de travail (2 semaines)** :
   - Équipe design : langage visuel (DA), documentation, composants Figma,
     système de tokens créé avec **Tokens Studio** ;
   - Transformation automatisée : tokens JSON → **Style Dictionary** → sorties
     par plateforme (CSS, SCSS, JS…) ;
   - Équipe développement : intégration des décisions « tokenisées », jusqu'au
     CI/CD de la conception au code ;
   - Source de vérité unique partagée dans Git.
5. **Alignement produit** avec les entités du groupe (Nantes, Bruxelles) via
   un atelier réunissant un designer et un développeur par entité —
   l'occasion de cartographier les divergences opérationnelles du groupe.
6. **Deux POC (2 mois)** sur Angular et Vite.js : prouver que le flux et les
   chaînes d'automatisation fonctionnent dans les deux sens (Figma ↔
   environnement de développement).
7. **Design final (8 mois)** : librairie de composants, fondations avec
   contrôle d'accessibilité, système de tokens gérant le multi-marque et le
   multi-thème (dark/light).

## Résultats

- Première offre du catalogue Jems portée par le Design et le Digital.
- KPI définis avec le Head of Design : time to market, tickets de recette,
  marge, satisfaction client, volume de composants et de code.
- Managers convaincus de la valeur du DesignOps ; collaboration
  designers/ingénieurs renforcée ; standardisation des méthodes et outils à
  l'échelle du groupe.

## Enseignement

Le design, s'il sort de son périmètre traditionnel, devient un moteur de
changement stratégique : la conception produit était au cœur du projet, mais
ce sont les objectifs business et structurels qui ont guidé sa réalisation.
