# Accor — Assistant conversationnel sur le corpus du design system

- **Rôle** : conception et développement du pilote.
- **Contexte** : aboutissement des autres briques d'industrialisation — une
  fois que contrats, documentation, rapports de QA, tokens, changelogs et
  liaisons Figma ↔ code existent sous forme structurée, ils deviennent un
  corpus interrogeable.
- **Problème** : la connaissance d'un design system est éclatée entre une
  dizaine de sources, et personne ne détient l'ensemble. Des questions
  quotidiennes — « quels composants cassent si je touche ce token ? », « d'où
  vient cette règle d'usage ? » — n'ont pas de réponse rapide, et coûtent à
  chercher, et croiser plusieurs sources à la main.

## Démarche

- **Indexation de tout le corpus** — une douzaine de types de contenus, plus de
  douze mille fragments — avec un modèle d'embeddings open source et une base
  vectorielle locale.
- **Récupération hybride** : similarité sémantique, recherche exacte, routeurs
  d'intention selon le type de question, et héritage documentaire via le graphe
  des familles de composants. La rédaction de la réponse est confiée à un
  modèle de langage.
- **Le cœur du travail est le contrat anti-hallucination**, pas le RAG :
  - citation obligatoire de la source pour chaque affirmation ;
  - refus explicite hors index, avec indication de ce qui manque ;
  - **portes de refus déterministes** — un composant inconnu déclenche un refus
    par code, pas au jugement du modèle ;
  - **cloison éditoriale** : les règles d'usage ne peuvent venir que de la
    documentation éditoriale, jamais être déduites de la structure. La
    structure décrit ce qu'un composant *est*, pas quand l'utiliser ;
  - les comptages sont annoncés comme **borne basse**, jamais comme vérité — un
    chiffre approché et honnête vaut mieux qu'un chiffre faux et net.
- **Évaluation avant mise en service**, avec des seuils fixés *à l'avance* :
  un jeu de questions de référence versionné, dont plusieurs dont la bonne
  réponse *est* un refus.

## Gains

- **Une question qui demandait de croiser plusieurs sources à la main se règle
  en quelques secondes.** « Quels composants consomment ce token ? », « d'où
  vient cette règle d'usage ? » : la réponse arrive sourcée, et l'expertise
  cesse de dépendre de la disponibilité d'une personne.
- **La réponse est vérifiable.** Chaque affirmation porte sa source : on peut
  remonter au fichier, ce qui transforme un assistant en outil de travail plutôt
  qu'en oracle. Et le refus est une fonctionnalité — quatre refus corrects sur
  quatre sur les questions hors index.
- **Qualité mesurée avant mise en service, contre des seuils fixés à
  l'avance** : rappel de 1,00 pour un seuil à 0,80, 97 % de réponses notées A ou
  B pour un seuil à 70 %. Le jeu de référence de 37 questions est versionné, donc
  rejouable à chaque évolution.
- **Latence divisée par quatre**, de 12,3 à 3,1 secondes, avec un serveur
  résident gardant les modèles chargés — le seuil à partir duquel on interroge
  l'outil par réflexe plutôt qu'en dernier recours.
- **Le corpus ne sort pas** : la récupération est entièrement locale, seule la
  rédaction passe par un modèle, avec deux backends interchangeables.

## Ce que ce projet illustre

Exactement le principe de ce portfolio conversationnel : un modèle qui ne répond
qu'à partir d'un corpus curé, avec interdiction d'inventer, et une campagne
d'évaluation qui le prouve. Ce site en est la version artisanale — une base de
connaissance en markdown et une liste de questions de référence rejouées à
chaque modification. Le pilote Accor en est la version industrielle.

L'enseignement principal n'est pas technique : la qualité d'un assistant se
joue moins dans la récupération que dans **ce qu'on lui interdit de dire**.

*(Les détails internes — corpus, résultats par question, outillage propriétaire
— ne sont pas partagés ici : contactez Arthur pour en parler de vive voix.)*
