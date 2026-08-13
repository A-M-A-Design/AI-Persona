# Accessibilité

Audit du 12 août 2026, cible **WCAG 2.2 niveau AA**. Couvre l'accueil, les
pages articles et le panneau de conversation, sur les trois personas, les deux
modes de couleur et quatre largeurs (1440 / 1000 / 375 / 320).

**Complété le même jour pour la v2** — le héro est devenu un slideshow, et le
panneau de conversation a gagné des liens. Voir « La v2 » en fin de document.

La page `/dev/kit` est hors périmètre : elle n'est pas publiée.

## Ce que l'outillage couvre

| Commande | Ce qu'elle vérifie |
| --- | --- |
| `npm run a11y:contrast` | Toutes les paires texte/fond du thème, 3 personas × 2 modes |
| `npx playwright test e2e/a11y.spec.ts` | Balayage axe-core + tests nominatifs, 4 largeurs |
| `npx playwright test e2e/audit-a11y.spec.ts` | Audit systématique : annonces en double, zones mortes, taille de cible, structure |

**Le balayage automatique ne suffit pas, et il faut le dire.** Lancé sur le code
d'avant correction avec les seules règles WCAG, axe-core ne signalait **aucune**
des treize anomalies de cet audit — 42 règles passées, zéro violation. En
ajoutant la famille `best-practice`, il en attrapait **une** (le saut de niveau
de titre) et en signalait une seconde comme « à vérifier » (`aria-label` sur un
élément générique). Les onze autres ont été trouvées à la lecture du code et à
l'inspection de l'arbre d'accessibilité.

C'est la raison d'être de la section « Ce que le lecteur d'écran annonce »
ci-dessous : ce qui compte n'est pas l'absence de violation mécanique, mais ce
qui est réellement dit, et dans quel ordre.

**La passe du 2026-08-13 l'a confirmé de la pire façon.** Sept défauts ont été
trouvés **à l'usage**, au lecteur d'écran ou à la main, alors qu'axe-core passait
au vert sur tous : un libellé annoncé deux fois, un titre de page identique à son
`h1`, un `lang` redondant sur 4 000 caractères, un focus qui ne revenait pas
après la modale, un chevron qui volait le clic sur 20 % d'un contrôle, une ancre
qui posait sa cible sous la barre collante, un bouton à 22 px.

Aucun n'était visible dans le code sans l'entendre ou l'essayer. `audit-a11y.spec.ts`
en tire les classes et les vérifie désormais à chaque run — c'est la seule façon
de ne pas les redécouvrir une deuxième fois.

## Constats et corrections

Sévérité : **B** bloquant · **M** majeur · **m** mineur. Tous corrigés.

### Lecteur d'écran

| Sév. | Constat | Correction |
| --- | --- | --- |
| **B** | La réponse en streaming était rendue dans un conteneur `aria-live="polite"` englobant tout le fil : à chaque token reçu, le paragraphe entier était ré-annoncé depuis le début. La question de l'utilisateur y était annoncée elle aussi, alors qu'il venait de la taper. | Le fil n'est plus une région live. Une région `role="status"` hors écran reçoit deux valeurs par échange : « Réponse en cours… » au départ, puis la réponse complète une fois le flux terminé. |
| **B** | `aria-label` posé sur un `<div>` sans rôle, pour le groupe de questions suggérées : ARIA l'ignore sur un élément générique, le groupe n'avait donc aucun nom. | `role="group"`, qui rend le libellé effectif. |
| **M** | Le champ de saisie portait un `aria-label` **identique à son placeholder**, et aucun `<label>`. L'indice de saisie disparaît à la première frappe ; le nom accessible disparaissait avec lui du champ de vision. | `<label>` masqué visuellement, distinct de l'indice : « Votre question » contre « Posez-moi n'importe quelle question ! ». L'`aria-label` est retiré. |
| **M** | Le nom accessible d'une card était la concaténation de tout son contenu : « Société, Comment remettre en mouvement une entreprise traumatisée ?, Lire l'article ». Le surtitre passait devant l'essentiel. | `aria-labelledby` sur le lien, pointant le CTA puis le titre → « Lire l'article, Comment remettre en mouvement une entreprise traumatisée ? ». Le surtitre reste lisible en exploration. |
| **M** | Saut de niveau de titre sur l'accueil : `h1` du héro puis `h3` des cards, sans `h2`. Les deux grilles n'étaient que des blocs anonymes. | Un `h2` masqué nomme chaque grille (« Articles à la une », « Autres articles »), qui deviennent des régions. |
| **m** | Le carousel avait un `aria-label` mais aucun titre : absent de la liste des titres, par laquelle un lecteur d'écran parcourt une page. Son compteur annonçait « 2 / 5 », qui ne veut rien dire à l'oreille. | `h2` masqué, et une phrase parallèle au compteur visible : « Page 2 sur 5 ». |
| **m** | Le libellé visible du chip de réglage doublait la valeur du `<select>` qu'il enveloppe : « Ours » puis « Type d'avatar, Ours ». | Le doublon visuel passe en `aria-hidden`. |
| **m** | Aucun lien d'évitement : au clavier, il fallait retraverser les réglages à chaque page. | Lien d'évitement en premier élément focalisable, visible dès qu'il reçoit le focus, vers `#contenu`. |

### Clavier et focus

| Sév. | Constat | Correction |
| --- | --- | --- |
| **B** | Les chips persona et langue enveloppent un `<select>` en `opacity: 0`. Le focus se posait sur ce select invisible : **aucun indicateur de focus** (WCAG 2.4.7), le clavier traversait les réglages à l'aveugle. | `.site-nav__chip:has(.site-nav__select:focus-visible)` reprend l'anneau des composants WDS. |
| **m** | `.carousel__step` retombait sur l'anneau par défaut du navigateur, posé sur un aplat primaire sombre. | Anneau explicite au token `focus`. |
| **m** | Le bouton d'envoi était `disabled` tant que le champ était vide : il sortait de l'ordre de tabulation, le lecteur d'écran ne le rencontrait donc jamais et rien n'expliquait son absence. | `aria-disabled` et sortie anticipée à la soumission. Il reste atteignable et annoncé « indisponible ». Le rendu inactif est inchangé, le WDS traitant déjà les deux attributs à l'identique. |

### Mouvement et structure

| Sév. | Constat | Correction |
| --- | --- | --- |
| **M** | Deux défilements `behavior: "smooth"` ne consultaient pas `prefers-reduced-motion` : une media query ne peut pas neutraliser une valeur passée à une API. | `lib/motion.ts` : `scrollBehavior()` retombe sur `auto` quand le réglage système le demande. |
| **m** | L'arrière-plan restait exploitable quand le panneau était ouvert. `aria-modal` suffit aux lecteurs récents, mais ne retire ni les liens de la tabulation ni le contenu du mode exploration des plus anciens. | Le panneau est monté en portail sur `<body>` — il est en position fixe, le rendu ne change pas — et ses frères reçoivent `inert` le temps de la conversation. |
| **m** | La redistribution à 320 px (WCAG 1.4.10) n'avait jamais été vérifiée : les tests s'arrêtaient à 375. | Quatrième projet Playwright à 320 px, sur lequel seule la suite d'accessibilité tourne — les autres décrivent la maquette, qui s'arrête à 375. |

## Les limites de l'outillage, et ce qui les couvre

Chaque outil de ce projet a un angle mort, et il vaut mieux l'écrire que le
redécouvrir.

| Outil | Ce qu'il voit | Son angle mort |
| --- | --- | --- |
| `a11y:contrast` | des **paires de tokens** déclarées | toute couleur qui n'est pas un token |
| axe-core | les manquements mécaniques du DOM | ce qui est *annoncé*, et dans quel ordre |
| `audit-a11y.spec.ts` | les classes de défauts déjà rencontrées | celles qu'on n'a pas encore vues |

**Le trou du script de contraste a coûté un défaut réel.** L'indice de saisie du
champ de question gardait la couleur par défaut du navigateur —
`rgb(117, 117, 117)`, soit **3,86:1** sur le panneau du lanceur, en 16 px, sous
le seuil AA. Personne ne l'avait déclarée : elle n'était donc dans aucune paire,
et le script ne pouvait pas la voir. **Le trou était dans la liste, pas dans le
calcul** — et une liste ne se complète que quand on pense à la compléter.

### Le balayage du contraste rendu

`audit-a11y.spec.ts` part désormais de l'autre bout : **chaque texte visible de
la page**, sa couleur calculée, et le fond effectif obtenu en remontant les
ancêtres et en composant les transparences. Peu importe d'où viennent les
couleurs — token, valeur par défaut du navigateur, héritage, composition. Les
indices de saisie sont mesurés aussi, par le pseudo-élément `::placeholder`.

Trois personas × deux modes sur l'accueil, plus la page article et le panneau.
Volumes réels : 17 textes mesurés sur l'accueil, 45 sur un article, 9 dans le
panneau — le reste de la page y étant `inert`.

**Deux exclusions, écrites et motivées :**

- **le texte posé sur une image** — héro, cards. Le fond n'est pas une couleur ;
  le composer contre celle qui est derrière donnerait un chiffre faux. Ces cas
  sont couverts autrement : `check-contrast.mjs` les évalue sur le pire fond
  possible, une image blanche sous le voile ;
- **le texte masqué** (`.a11y-hidden`, `aria-hidden`, `[inert]`), qui n'est pas
  lu à l'écran.

Détecter le premier cas a demandé deux essais. Un `background-image` ne suffit
pas : les images du site sont des balises `<img>`, et remonter le DOM n'y voit
qu'une couleur — le titre du héro ressortait à 1,00:1, sa couleur étant celle du
fond de page qu'il ne touche jamais. `elementsFromPoint` ne convient pas non
plus : c'est un test de **pointeur**, qui ignore ce qui est en
`pointer-events: none`, précisément le calque de texte du héro.

Ce qui marche : chercher une image qui **recouvre** l'élément **et se trouve
dans celui qui fournit l'aplat opaque** — elle se peint alors entre cet aplat et
le texte. Sans cette seconde condition, le panneau du lanceur était exclu à
tort : il a son propre fond, posé par-dessus l'image du héro.

## Ce que le lecteur d'écran annonce

Relevé sur l'arbre d'accessibilité réel du navigateur, après correction.

### Accueil, à l'ouverture

```
navigation « Accès rapide »
  « Arthur Mathon — portfolio conversationnel »
  lien « Poser une question à Arthur »
  lien « Voir les articles »
  lien « Aller au contenu »
bannière
  liste déroulante « Type d'avatar » — Ours sélectionné
  liste déroulante « Langue » — FR sélectionné
  bouton « Mode couleur — Sombre »
contenu principal
  titre niveau 1 « Bonjour, je suis Arthur ! »
  paragraphe « Designaut passionné de Design System, Product et Operations »
  zone de texte « Votre question » — **une seule fois** : un `<label>` masqué
    visuellement aurait été lu en plus, comme texte, avant le champ lui-même
  bouton « Discutons » (indisponible)
  groupe « Questions suggérées »
    bouton « Raconte-moi ton parcours »
    …
  région « Articles à la une »
    titre niveau 2 « Articles à la une »
    lien « Lire l'article, Comment remettre en mouvement une entreprise traumatisée ? »
    …
  région « Autres articles »
pied de page
  paragraphe « Discutons ! »
  lien « LinkedIn » · lien « E-mail »
```

### Poser une question

1. Le panneau s'ouvre : « dialogue, Arthur Mathon », le focus va au champ.
2. Statut : « Réponse en cours… » — **une fois**.
3. Statut : la réponse complète — **une fois**, à la fin du flux.
4. Le fil reste lisible en exploration : « Qui es-tu ? » puis la réponse.
5. Échap ferme, et le focus revient sur l'élément qui avait ouvert le panneau
   — ou, quand il a disparu, sur le champ du lanceur. Poser une question
   suggérée la retire des chips : l'ouvrant n'existe alors plus, et c'est le
   cas courant. **Jamais `<body>`**, d'où l'exploration repartirait du haut de
   la page. La restauration vit dans `Chat` et non dans le panneau : celui-ci
   prend le focus par `autoFocus` avant tout effet, et le mode strict de React
   joue montage → purge → montage, ce qui déclenchait une restauration
   panneau encore ouvert.

Pendant toute la conversation, la page derrière est `inert` : ni tabulation, ni
exploration.

### Ouvrir un article

Le bouton d'accueil de la barre annonce « lien, Retour à l'accueil ». La page
article présente son titre en niveau 1, ses sections en niveau 2, puis la
région « Autres articles » avec sa pagination : « bouton Articles précédents
(indisponible) », « Page 1 sur 2 », « bouton Articles suivants ».

Le corps d'un article non traduit porte `lang="fr"` même quand l'interface est
en anglais : la synthèse vocale ne lit pas du français avec une voix anglaise.
**Et seulement dans ce cas** : l'attribut marque un *changement* de langue. Posé
systématiquement, il répétait le `lang` de `<html>` sur 4 000 caractères — une
frontière que rien ne justifiait.

Le titre du document ne reprend plus le `h1` : un gabarit lui ajoute
« — Arthur Mathon ». Le lecteur d'écran annonce le nom de la page à l'ouverture,
puis le titre de niveau 1 dès qu'on lit ; à l'identique, la même phrase était
entendue deux fois de suite. Relevé sur VoiceOver.

## Non-défauts vérifiés

À ne pas « corriger » lors d'un prochain passage :

- **`alt=""` sur les illustrations** (héro, visuels d'article et de card) : elles
  sont décoratives, le sens est porté par les titres voisins. Un texte de
  remplacement y ajouterait du bruit.
- **Landmarks** `banner`, `main`, `contentinfo` présents sur les deux routes.
- **Piège de focus et restauration du focus** du panneau : implémentés et testés.
- **`role="alert"`** sur le message d'erreur du chat.
- **Cibles tactiles** : 32 px minimum partout, au-dessus du plancher de 24 px.
- **`NEXT-ROUTE-ANNOUNCER`** : la région live vide en fin de `<body>` est le
  dispositif d'annonce de changement de route de Next, pas un oubli.
- **Le libellé masqué du bouton d'envoi en mobile** : la maquette réduit
  l'action à une icône ; le libellé est retiré de l'écran, jamais du nom
  accessible.

## La v2 — slideshow et liens dans la conversation

Le héro est devenu un carrousel de trois slides, une par persona, et les
réponses du bot portent désormais des éléments interactifs. Deux défauts réels
en sont sortis, **tous deux invisibles au balayage automatique**.

### Ce qui a été trouvé

| Sév. | Constat | Correction |
| --- | --- | --- |
| **B** | La piste défilante était un **arrêt de tabulation sans nom**. Rendue focalisable pour répondre à une violation axe (`scrollable-region-focusable`, les slides inactives étant `inert`), elle n'avait jamais reçu de libellé : le clavier s'y posait sans savoir où il était. | `role="group"` et un nom — « Faire défiler les personas ». |
| **M** | L'accroche du héro était à **3,18:1** sur les trois personas, sous le seuil AA. Elle est posée sur le voile fort de l'illustration : `check-contrast.mjs` ne connaissait que les paires de tokens, et la règle `color-contrast` d'axe ne se prononce pas sur du texte au-dessus d'une image. | Passée de `on-surface-mid` à `on-surface-hi`, soit 5,11:1 — même arbitrage que les surtitres de card. Les deux paires du slideshow sont entrées dans le script. |

Le premier a été trouvé en **relevant le parcours clavier arrêt par arrêt** ;
une liste figée de sélecteurs ne l'aurait pas vu, l'élément fautif ayant été
ajouté après coup. Ce relevé est désormais un test : il exige de chacun des dix
premiers arrêts un nom accessible et un anneau de focus visible.

### Le slideshow

- `role="region"`, `aria-roledescription="carrousel"`, nommé « Choisir un
  persona ». Chaque slide est un `group` « 2 sur 3 — La Corneille ».
- **Les slides inactives sont `inert`** : trois titres de niveau 1 identiques
  annoncés à la suite n'apprendraient rien.
- Bascule de lecture avec `aria-pressed`, flèches nommées, et une **région de
  statut** qui annonce le persona actif — sans elle, le changement de thème de
  toute la page serait muet.
- **Lecture automatique** : elle satisfait WCAG 2.2.2 par sa bascule, et
  `prefers-reduced-motion` la neutralise entièrement. Elle se suspend aussi au
  survol, au focus clavier, quand l'onglet passe en arrière-plan et quand le
  panneau s'ouvre.
- **La navigation au clavier le fige**, et la souris le relance. La demande
  était « mettre en pause quand un lecteur d'écran est actif » : **c'est
  impossible**. Aucune API n'expose la présence d'une technologie d'assistance,
  et les heuristiques qui circulent — chaîne d'agent utilisateur,
  `forced-colors` — sont autant du pistage que de l'approximation.

  Ce qu'on observe, c'est la **façon de naviguer** (`components/NavMode.tsx`,
  attribut `data-nav-mode` sur `<html>`, mémorisé). Un utilisateur de lecteur
  d'écran navigue au clavier et ne produit **aucun** événement pointeur : il
  reste en mode clavier toute sa visite, et le contenu ne change jamais sous sa
  lecture. `Tab` est la touche fiable — le mode exploration la laisse passer là
  où il consomme les flèches.

  **Le mode est réversible**, et c'est ce qui le distingue du verrou qu'il
  remplace : le visiteur voyant qui appuie une fois sur `Tab` retrouve
  l'animation dès qu'il reprend la souris. Trois réglages en découlent :

  - **le tactile ne bascule rien** — un lecteur d'écran mobile balaye l'écran et
    produit les mêmes `pointerdown` qu'un doigt ordinaire, impossible à
    distinguer ; seule la souris fait foi (`pointerType`) ;
  - **les touches de saisie ne comptent pas** — écrire dans un champ, c'est
    éditer, et le lanceur de conversation vit dans ce carrousel ;
  - **le bouton lecture prime sur le mode** — sans quoi il serait un contrôle
    sans effet pour qui navigue au clavier.

### Les raccourcis clavier du carrousel

Les flèches gauche et droite changent de slide, **uniquement quand le focus est
dans le carrousel**. C'est la troisième échappatoire de **WCAG 2.1.4 Character
Key Shortcuts** : le raccourci n'existe pas ailleurs dans la page, ce qui
dispense d'un mécanisme de désactivation ou de remappage.

Deux réserves, délibérées :

- **Les flèches sont rendues au champ de saisie** dès que le focus s'y trouve —
  il vit dans le carrousel, et sans cette réserve on ne pourrait plus y déplacer
  le curseur. Même chose pour les `select` et tout champ éditable.
- **Pas de raccourci sur l'espace** pour la lecture, pour la même raison : dans
  un champ de texte, l'espace sert à écrire.

Les deux boutons portent `aria-keyshortcuts`, qui déclare le raccourci sans
l'activer — le comportement reste porté par le gestionnaire.

Ce périmètre volontairement étroit évite le risque principal des raccourcis à
touche unique : en mode exploration, les lecteurs d'écran réservent les lettres
à leur propre navigation, et un raccourci global n'atteindrait pas la page ou
entrerait en collision.

### Les raccourcis globaux

Trois raccourcis à touche unique valent partout dans le site — **M** vers le
contenu, **N** vers les réglages, **F** vers le pied de page — plus **?** qui
ouvre l'aide.

Valant partout, ils relèvent de la **première échappatoire de 2.1.4** : une case
à cocher dans l'aide les désactive, et le choix est persisté. **L'aide reste
atteignable raccourcis coupés** — c'est le chemin du retour, sans quoi la
désactivation serait sans appel.

Trois gardes protègent la saisie :

- aucun modificateur (`Ctrl`, `Alt`, `Meta`) ne déclenche quoi que ce soit ;
- **jamais dans un champ ni un `select`** — ce dernier utilise déjà les lettres
  pour choisir une option ;
- `Échap` ferme l'aide, comme toute boîte de dialogue.

La découverte passe par un bouton « Raccourcis clavier », hors écran au repos et
visible dès qu'il reçoit le focus, sur le modèle du lien d'évitement. Un
raccourci que personne ne connaît ne sert personne.

**Ce que cela ne résout pas** : en mode exploration, les lecteurs d'écran
réservent les lettres à leur propre navigation. M, N et F ne leur parviendront
probablement pas. Les flèches du carrousel, portées au focus, échappent à cette
limite — c'est la raison de leur périmètre plus étroit.

**Confirmé par la passe du 2026-08-13** : aucun des raccourcis à touche unique,
`?` compris, n'atteint la page lecteur d'écran actif. Ce n'est pas contournable
côté page — la touche est consommée avant que le document ne la voie, et aucune
API ne permet ni de le savoir ni de s'y opposer.

La réponse est donc structurelle : les destinations qui comptent existent
**aussi en contrôles réels**, dans l'accès rapide en tête de document (voir
« Accueil, à l'ouverture »). Les raccourcis restent un confort pour le clavier
nu ; ils ne sont plus le seul chemin vers quoi que ce soit.

### `aria-keyshortcuts` : conservé, et pourquoi

Les deux flèches du carrousel portent `aria-keyshortcuts="ArrowLeft"` /
`"ArrowRight"`. L'attribut est **fait pour être annoncé** : le lecteur d'écran
dit « Persona suivant, raccourci flèche droite » — pour une touche que lui-même
intercepte en mode exploration.

**Arbitrage du 2026-08-13 : on le garde.** L'attribut est exact, le site
implémente bien ce raccourci, et l'annonce redevient vraie dès que le mode de
balayage est coupé (`Verr. Maj + Espace` au Narrateur). Retirer une métadonnée
correcte parce qu'un mode d'un lecteur d'écran l'intercepte appauvrirait
l'information pour tout le monde, à commencer par l'utilisateur clavier sans
technologie d'assistance, pour qui c'est le seul moyen de découvrir le
raccourci.

Ce que cela suppose est écrit ici plutôt que corrigé ailleurs : **l'annonce vaut
mode de balayage désactivé.**

### Contraste forcé

Windows en contraste élevé (`forced-colors: active`) remplace d'autorité les
couleurs par sa palette : les tokens ne s'appliquent plus, et **tout ce qui ne
reposait que sur une couleur disparaît**. Le site n'en tenait aucun compte
jusqu'au 2026-08-13.

Trois endroits en dépendaient :

- **l'anneau de focus**, qui devenait celui du système, de géométrie
  imprévisible → `outline-color: Highlight` ;
- **les chips**, sans bordure au repos : leur fond translucide disparaissant,
  il ne restait qu'un mot posé sur la page → bordure `ButtonText`, `Highlight`
  à la sélection ;
- **les conteneurs dessinés par un aplat** — bulles du chat, cards d'article,
  panneaux — qui fusionnaient avec la page → contour `CanvasText`.

L'état inactif reposait sur une opacité, que le mode ignore : il passe en
`GrayText`. Les visuels d'articles et le héro restent des images, que le mode
n'altère pas — c'est le comportement attendu, et le voile qui porte leur texte
est déjà opaque.

### Les liens dans les réponses

Le nom d'un persona cité devient un **bouton** de bascule, le titre d'un article
publié un **lien** vers sa page. Tous deux sont soulignés et en gras, jamais
distingués par la seule couleur (WCAG 1.4.1), et portent un anneau de focus.
Le bouton de persona a un nom accessible explicite — « Basculer vers la
Libellule » — le libellé visible seul n'annonçant pas ce qu'il fait.

### Ce qui reste à vérifier

L'arbre d'accessibilité du panneau, avec ses nouveaux liens, n'a pas été relevé
comme l'a été celui de l'accueil. Le balayage axe n'y signale rien, mais ce
document doit dire ce qui est annoncé, pas seulement ce qui est conforme.

## Vérification manuelle

Le balayage automatique et les tests ne remplacent pas une passe réelle. À
rejouer après tout changement de structure :

1. **Clavier seul**, sans souris : `Tab` depuis le chargement → le lien
   d'évitement doit apparaître en premier et être visible. Puis parcourir
   réglages → question → panneau → Échap → card → article → carousel. À aucun
   moment le focus ne doit disparaître de l'écran ni sortir du panneau ouvert.
2. **Lecteur d'écran** (NVDA sur Windows, VoiceOver sur macOS) : parcourir
   l'accueil par la liste des titres, puis par la liste des liens — les liens
   doivent commencer par « Lire l'article ». Poser une question et vérifier que
   la réponse est annoncée une seule fois, à la fin.
3. **Zoom à 200 %** et fenêtre à 320 px : aucun défilement horizontal, aucun
   contenu tronqué.
4. **`prefers-reduced-motion`** activé au niveau du système : les défilements du
   carousel et des questions suggérées doivent être instantanés, et **le
   slideshow du héro ne doit pas défiler seul**.
5. **Le slideshow au clavier** : tabuler jusqu'à la piste, la faire défiler aux
   flèches, vérifier que le persona et le thème suivent et que la lecture
   automatique se suspend tant que le focus y reste.
