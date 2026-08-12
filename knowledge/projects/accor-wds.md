# Accor — Design system Welcome (WDS)

- **Rôle** : Design System Manager (consultant), depuis mars 2025.
- **Contexte** : Accor, groupe hôtelier mondial, opère une dizaine de marques
  (Sofitel, Fairmont, Raffles, Pullman, Novotel, ibis, Mövenpick, Swissôtel,
  MGallery…) sur un design system commun, Welcome (WDS).

## Missions

- **Accompagnement des équipes techniques** dans l'intégration du design
  system, sur les différentes stacks du groupe (Vue et Adobe Experience
  Manager), avec suivi de l'implémentation.
- **QA** du design system : conformité des intégrations, accessibilité,
  cohérence entre les plateformes Web et App.
- **Architecture de tokens supportant le multi-marque** : chaque marque est un
  thème complet sur un contrat commun d'environ 870 variables (primitives →
  sémantique → composants), avec light/dark et typographies responsives par
  breakpoint.
- Gestion de la **librairie de composants core** et de son cycle de vie.
- **Industrialisation de la chaîne de design**, en s'appuyant sur l'IA — c'est
  la part la plus substantielle de la mission (voir ci-dessous).

## Le programme d'industrialisation

Six chantiers, décrits chacun dans sa propre fiche, qui s'enchaînent : le
contrat d'extraction sert de socle à tout le reste.

1. **Extraction automatisée des composants Figma et contrats de données** — la
   maquette devient une source de vérité machine-lisible et versionnée.
2. **Documentation AI-ready** — un contrat éditorial en neuf sections, généré et
   validé, pour que les agents sachent *quand ne pas* utiliser un composant.
3. **Versioning outillé des composants** — barème SemVer opposable, changelog
   par composant, portes de validation humaines.
4. **QA automatisée** — trois axes (tokens, fonctionnel, accessibilité) et un
   escalier de provenance qui affiche d'où vient chaque vérification.
5. **Code Connect** — le vrai code du design system dans le mode développeur de
   Figma, par variante et en trois saveurs de stack.
6. **Assistant conversationnel sur le corpus** — interroger le design system en
   langage naturel, avec citations obligatoires et refus hors index.

## Ce que ce projet illustre

Le theming multi-marques à grande échelle : une architecture de tokens
suffisamment robuste pour servir des identités très différentes sans dupliquer
les composants. C'est exactement le principe repris par ce portfolio : les
trois personas (Ours, Corneille, Libellule) sont trois « marques » sur le même
contrat de variables.

*(Les détails internes — chiffres, roadmap, organisation — ne sont pas
partagés ici : contactez Arthur pour en parler de vive voix.)*
