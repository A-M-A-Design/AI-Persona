# Changelog

Toutes les évolutions notables de ce projet sont documentées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le
versionnage suit [SemVer](https://semver.org/lang/fr/) :
`0.1.0` → M1 (chat) … `0.5.0` → POC complet, `1.0.0` → MVP public.

## [Unreleased]

### Added

- **Métadonnées de partage, plan du site et données structurées.** Un lien vers
  le portfolio s'affichait **nu** : ni titre, ni image, ni description. Pour un
  site dont le canal principal est LinkedIn, c'était le poste SEO qui coûtait
  le plus cher.

  `metadataBase` se déduit de l'environnement (`lib/site.ts`) : domaine
  explicite, sinon l'URL que Vercel fournit d'office, sinon `localhost`. Sans
  elle, les URL d'aperçu restent relatives — et **aucun réseau social ne va
  chercher une image ainsi désignée**.

  **Les images d'aperçu sont celles du site**, pas une carte générée : le héro
  de l'Ours sur l'accueil, et pour chaque article **son propre visuel**, celui
  de sa card. Un aperçu partagé montre ainsi ce que le lecteur retrouvera en
  arrivant.

  `/sitemap.xml` liste l'accueil et les six articles ; `/robots.txt` ouvre le
  site et ferme `/dev/` — un atelier, pas une page publiée — ainsi que `/api/`,
  dont chaque visite coûte un appel au modèle.

  **Le JSON-LD dit *qui*, pas seulement *quoi*.** `Person` et `WebSite` sur
  l'accueil, `Article` sur chaque article, rattaché au même `@id` d'auteur. Les
  balises `og:` disent à un réseau comment afficher un lien ; les données
  structurées disent à un moteur qu'un humain nommé Arthur Mathon exerce un
  métier précis et signe ces articles. Rien n'y est inventé — tout y figure
  déjà ailleurs dans le site, et une donnée structurée qui affirme plus que la
  page est une donnée fausse.

  Sept tests, dont un qui **récupère chaque image annoncée et exige un 200** :
  une image absente donne un aperçu nu, sans que rien ne le signale.

- **`/api/chat` a enfin une limite de débit par adresse IP.** La route appelait
  un modèle payant avec **notre** clé, sans aucun garde : un script consommait
  le quota — ou la facture — en quelques minutes. C'était le premier poste du
  MVP, et le seul qui protège de l'extérieur.

  Deux fenêtres, qui répondent à deux abus différents. **30 questions par jour**
  — la limite d'usage. Et **5 par minute**, garde-fou et non plafond : sans lui,
  une seule adresse tire ses 30 questions en trois secondes et épuise le quota
  Mistral du compte, qui plafonne à ~2 réponses par minute, **pour tous les
  autres visiteurs en même temps**. Les deux sont réglables par variable
  d'environnement, sans redéploiement.

  La vérification passe **avant tout le reste** — avant de lire le corps, avant
  de résoudre le provider : une requête refusée ne doit rien coûter.

  **Trois messages là où il n'y avait qu'une erreur générique**, parce qu'une
  limite n'est pas une panne et qu'un visiteur qui croit à un bug réessaie ou
  s'en va :

  - *la minute* — « Patientez une minute, puis réessayez — votre conversation
    reste affichée. » Ce qu'il faut faire, et ce qui n'est pas perdu ;
  - *le jour* — le remerciement, puis l'invitation **du persona lui-même** :
    « On boit un café ? », « Croisons nos chemins », « RDV IRL ? », avec LinkedIn
    et l'e-mail. L'invitation vient de `footerHeading`, déjà écrit et déjà dans
    la bonne voix : un second texte aurait divergé du pied de page ;
  - *une panne* garde son message générique, sans quoi on ferait croire à une
    limite atteinte.

  **Le repli en mémoire ne protège pas en production, et le dit.** Sans les
  variables Upstash, un compteur local prend le relais — suffisant en
  développement, inopérant sur une plateforme sans serveur où chaque instance a
  sa propre mémoire et où elles sont éphémères. Le compteur partagé est la
  raison d'être d'Upstash, pas un luxe.


### Fixed

- **L'échelle du champ de saisie monte d'un cran, indice compris.** Le texte
  saisi prend `on-surface-hi` — c'est le contenu de l'utilisateur, il n'a aucune
  raison d'être en retrait — et l'indice `on-surface-mid`. Sur le panneau du
  lanceur, qui force le mode sombre : **16,92:1 / Lc −103** pour la saisie,
  **10,46:1 / Lc −71** pour l'indice, contre Lc −53 auparavant.

  La hiérarchie entre les deux est conservée, et elle compte : un indice qui
  ressemble à une saisie fait croire le champ déjà rempli, c'est le défaut
  classique du placeholder. Mais elle se joue désormais **entre deux valeurs
  lisibles**, et non entre une lisible et une qui ne l'est pas. Le select suit
  la même échelle.

- **`/dev/kit` avait un lien d'évitement qui ne menait nulle part**, puis plus
  de lien du tout. La page a bien un `<main>` — contrairement à ce que j'avais
  écrit — mais pas d'`id="contenu"` : l'ancre que le layout visait n'existait
  pas. Puis l'accès rapide est passé aux pages, et celle-ci n'en a plus eu.
  Les deux sont réglés, et un test le vérifie : page interne, hors périmètre
  d'audit, raison de plus pour que rien ne l'y ramène.


### Changed

- **Le README est à jour de la session, à commencer par un conseil devenu
  faux.** Sa section « Une vague de timeouts à 30,0 s » recommandait
  `rm -rf .next` puis relance immédiate — geste qui **provoque** désormais
  l'échec qu'il prétend écarter, le premier run payant la compilation de
  `/articles/[slug]` pendant que seize workers tapent dessus. Elle décrit
  maintenant les **trois** causes, dont deux sont l'inverse l'une de l'autre
  (cache périmé / cache vide), donne la séquence avec préchauffage, et rappelle
  que la comparaison qui tranche est la suite complète contre la suite complète.

- **La section Accessibilité porte le tableau des angles morts** de chaque
  outil, et le fait qu'**axe-core n'a signalé aucun des neuf défauts trouvés à
  l'usage**. `npm run a11y` enchaîne désormais les trois contrôles — contraste,
  axe, et l'audit systématique — au lieu de documenter un audit qu'il ne lançait
  pas.

- **Le résumé de la session 10 suit** : il listait ce correctif du README comme
  « reste à faire », ce qu'il n'est plus. Une section sur la documentation s'y
  ajoute — un document qui a pris du retard n'est pas neutre, il **coûte** plus
  que son absence, parce qu'on le suit.

- L'introduction dit que **les composants sont écrits dans ce dépôt**, donc que
  le site se construit depuis le seul dépôt ; la règle d'or précise que
  `styles/welds-src/` ne porte plus que l'oracle de `tokens:check` et que rien
  de ce qu'il contient n'est servi ; la structure mentionne `e2e/` et
  `sessions-summary/`.


### Added

- **Résumé de la session 10** dans `sessions-summary/2026-08-13-session-10.md` :
  la réécriture des composants, la passe au lecteur d'écran et ses huit
  correctifs, les trois impossibilités assumées, et les deux erreurs de méthode
  de la session.

- **Le contraste est mesuré sur le rendu, plus seulement sur les tokens.** La
  limite de l'outillage était structurelle : `a11y:contrast` compare des paires
  **déclarées**, donc ne voit rien de ce que personne n'a déclaré. C'est par là
  qu'un indice de saisie à 3,86:1 est passé, sur le champ le plus visible du
  site. Corriger l'instance ne corrigeait pas la classe.

  `audit-a11y.spec.ts` part maintenant de l'autre bout : **chaque texte visible**,
  sa couleur calculée, et le fond effectif obtenu en remontant les ancêtres et en
  composant les transparences. Peu importe l'origine des couleurs — token, valeur
  par défaut du navigateur, héritage. Les indices de saisie sont mesurés aussi,
  par `::placeholder`. Trois personas × deux modes sur l'accueil, plus l'article
  et le panneau : 17 textes mesurés sur l'accueil, 45 sur un article.

  Deux exclusions écrites et motivées : le texte posé sur une image — couvert
  autrement, sur le pire fond possible — et le texte masqué.

  **Détecter le premier cas a demandé deux essais, et les deux ratés sont
  instructifs.** Chercher un `background-image` ne suffit pas : les images du
  site sont des balises `<img>`, si bien que le titre du héro ressortait à
  1,00:1 — sa couleur comparée à celle du fond de page, qu'il ne touche jamais.
  `elementsFromPoint` ne convient pas davantage : c'est un test de **pointeur**,
  qui ignore ce qui est en `pointer-events: none` — précisément le calque de
  texte du héro, absent de la pile retournée. Ce qui marche : une image qui
  recouvre l'élément **et se trouve dans celui qui fournit l'aplat opaque**.
  Sans cette seconde condition, le panneau du lanceur était exclu à tort.

  `docs/accessibilite.md` porte désormais un tableau des angles morts de chaque
  outil — mieux vaut les écrire que les redécouvrir.


- **`npm run a11y:contrast` calcule APCA en parallèle du ratio WCAG.** C'est la
  posture que recommande l'article de Kortic du 2026-04-18 tant que WCAG 3 n'est
  pas ratifié : mesurer les deux pour voir où ils divergent. Seul le ratio fait
  échouer la commande — on ne casse pas une CI sur un brouillon.

  **L'invariant du projet résiste au changement d'algorithme.** Les thèmes sont
  obtenus par rotation de teinte à luminance relative *WCAG 2* constante ; rien
  ne garantissait que la promesse tienne pour APCA, qui n'a ni la même fonction
  de transfert ni le même modèle. Mesuré : **0,8 d'écart de Lc au pire** entre
  les trois personas. La garantie du README vaut donc au-delà de l'algorithme
  pour lequel elle avait été conçue — vérifié plutôt que supposé.

  **Une divergence réelle, et asymétrique.** En mode sombre, le texte saisi dans
  le champ de question donne **Lc −53** pour un ratio de 7,3:1 — le seuil APCA
  usuel d'un texte courant de 16 px est Lc 75. En mode clair, la même paire
  donne **Lc 82**. C'est la polarité que le ratio ignore : il est symétrique,
  la perception ne l'est pas, et le mode sombre est là où il flatte le plus.

  La paire du champ de saisie **n'était pas mesurée du tout** : le script testait
  `on-surface-low` sur `surface`, alors que le champ a son propre fond
  (`surface-container-low`). Ajoutée.


- **Le contraste forcé de Windows est enfin géré.** `forced-colors: active`
  remplace d'autorité les couleurs par la palette du système : les tokens ne
  s'appliquent plus, et **tout ce qui ne reposait que sur une couleur
  disparaît**. Le site n'en tenait aucun compte — vérifié, zéro occurrence.

  Trois endroits en dépendaient. L'**anneau de focus**, qui redevenait celui du
  navigateur, de géométrie imprévisible. Les **chips**, sans bordure au repos :
  leur fond translucide disparaissant, il ne restait qu'un mot posé sur la page,
  et plus rien ne disait que c'était un bouton. Les **conteneurs dessinés par un
  aplat** — bulles du chat, cards, panneaux — qui fusionnaient avec la page.

  L'état inactif reposait sur une opacité, que le mode ignore : il passe en
  `GrayText`. Les visuels restent des images, que le mode n'altère pas — c'est
  le comportement attendu. Trois tests couvrent le mode, émulé par Playwright.

### Fixed

- **L'indice de saisie du champ de question échouait au seuil AA.** Il gardait
  la couleur par défaut du navigateur — `rgb(117, 117, 117)` — soit **3,86:1**
  sur le panneau du lanceur, en 16 px : **sous 4,5:1**. Sur le champ le plus
  visible du site, celui que chaque visiteur lit en arrivant.

  Ni le script de contraste ni axe ne le voyaient. Le premier ne compare que des
  **paires de tokens**, et cette couleur n'en était pas une — personne ne l'avait
  déclarée : le trou était dans la liste, pas dans le calcul. Il a fallu mesurer
  ce que le navigateur **rend**, et non ce que la feuille déclare.

  L'indice est désormais déclaré à `on-surface-low` (7,26:1) et le texte saisi
  passe de `low` à **`on-surface-mid`** (10,46:1) : la hiérarchie visuelle
  demeure, les deux passent. Le select suit la même règle — c'est une valeur
  qu'on lit.

  **Le champ du héro est concerné en permanence**, pas seulement en mode
  sombre : son panneau force `data-color-mode="dark"` puisqu'il est posé sur
  l'image. Vérifié sur les **trois personas × deux modes**, dans le navigateur —
  12 combinaisons, toutes au-dessus de 4,5:1, et l'écart entre personas reste
  infime (7,26 / 7,34 / 7,30), l'invariant de rotation de teinte à l'œuvre.

  `e2e/audit-a11y.spec.ts` mesure désormais le **rendu** et non la déclaration,
  sur les six combinaisons.


- **En mobile, la fin d'une question suggérée passait sous le bouton de
  défilement** : y taper faisait défiler au lieu de poser la question. La
  fenêtre de défilement se retire désormais de 44 px — la largeur du bouton plus
  la gouttière —, si bien que le bouton surplombe du vide et non des chips.

  Un rembourrage **interne** n'aurait pas suffi : il ne déplace que la fin du
  contenu, et une chip longue serait toujours passée sous le bouton aux
  positions intermédiaires. C'est la fenêtre qu'il fallait rétrécir.

  La tolérance qui écartait cette rangée de l'audit est **retirée** : le
  contrôle de zone morte la couvre maintenant comme les autres. Il a fallu
  d'abord le corriger — il mesurait la boîte entière d'un élément, alors qu'une
  chip large déborde de son défileur et que ce qui est rogné n'est ni vu ni
  cliquable. Un élément entièrement rogné en sort désormais, faute de quoi une
  largeur négative donnait un `DOMRect` normalisé ailleurs à l'écran, et des
  zones mortes imaginaires.

### Changed

- **`aria-keyshortcuts` est conservé sur les flèches du carousel**, arbitrage
  écrit dans `docs/accessibilite.md`. L'attribut est annoncé par le lecteur
  d'écran — « Persona suivant, raccourci flèche droite » — pour une touche que
  lui-même intercepte en mode exploration. Il reste néanmoins **exact** : le
  site implémente bien ce raccourci, et l'annonce redevient vraie dès que le
  mode de balayage est coupé. Retirer une métadonnée correcte parce qu'un mode
  d'un lecteur d'écran l'intercepte appauvrirait l'information pour tout le
  monde — à commencer par l'utilisateur clavier sans technologie d'assistance,
  pour qui c'est le seul moyen de découvrir le raccourci.


### Fixed

- **Le bouton de fermeture du panneau mesurait 22 px en mobile.** Sous le
  plancher de 24 × 24 de **WCAG 2.5.8**, critère AA depuis la 2.2. Sa largeur
  était pourtant déclarée à 24 px : le conteneur flex du bandeau la comprimait.
  Une largeur déclarée n'est pas une largeur tenue — `flex: none` la tient.

- **Le titre d'un article était lu deux fois, et le corps mal cadré.** Relevé
  sur VoiceOver.

  Le `<title>` d'une page article reprenait **mot pour mot son `h1`**. Le
  lecteur d'écran annonce le nom de la page à l'ouverture, puis le titre de
  niveau 1 dès qu'on lit : la même phrase, deux fois de suite. Un gabarit de
  métadonnées ajoute désormais « — Arthur Mathon » — ce qui dit aussi de qui est
  le site dans un onglet, un favori ou un partage.

  Le corps portait par ailleurs `lang` **en toutes circonstances**, y compris
  quand il répétait celui de `<html>` : une frontière de langue posée sur
  4 000 caractères, que rien ne justifiait, et que les technologies d'assistance
  traitent comme un changement de voix. L'attribut ne marque plus qu'un vrai
  changement — interface en anglais, article sans traduction. Ce qui le motivait
  reste vrai : la synthèse vocale ne doit pas lire du français avec une voix
  anglaise. C'est ce cas-là, et lui seul, qui est marqué.

- **Le focus ne revenait pas après la fermeture du panneau de conversation.**
  Il retombait sur `<body>` : au lecteur d'écran, l'exploration repartait du
  haut de la page. Le document d'accessibilité affirmait pourtant le contraire —
  le mécanisme existait, il capturait simplement le mauvais élément.

  Deux pièges, tous deux logés dans le panneau. `autoFocus` sur son champ
  s'applique à **l'insertion du nœud dans le DOM**, donc avant que le moindre
  effet ne tourne : un effet lisant `document.activeElement` capturait ce champ,
  et la fermeture y « revenait » — sur un élément qu'elle était en train de
  démonter. Et en **mode strict**, React joue montage → purge → montage, si bien
  qu'une restauration posée dans une purge se déclenchait panneau encore ouvert,
  faisant sortir le focus puis le perdre quand la page redevenait `inert`.

  La restauration passe donc dans `Chat`, qui capture l'ouvrant **dans le
  gestionnaire d'envoi** — un événement, à l'abri du double montage — et le
  rétablit sur la transition de fermeture, après que le panneau a levé l'`inert`.

  Repli assumé : poser une question suggérée la retire des chips, donc l'ouvrant
  a **disparu** à la fermeture. C'est le cas courant, pas l'exception. On revient
  alors au champ du lanceur, là où la conversation a commencé, plutôt qu'en haut
  de page. Trois tests : l'ouvrant quand il survit, le champ quand il a disparu,
  et jamais `<body>`.

- **Le lien « Poser une question » cachait le champ sous la barre.** La barre de
  navigation est collante ; une ancre pose la cible à `top: 0`, donc **dessous**,
  invisible — pendant que le reste de l'écran montrait les articles. On croyait
  avoir été envoyé au mauvais endroit. `scroll-margin-top` corrige les trois
  cibles, et le champ de question remonte d'un panneau entier (72 px séparent le
  haut du lanceur de son champ) pour que l'intitulé « Parlez à l'Ours en moi »
  arrive avec lui : y atterrir seul, au milieu d'un aplat sombre, ne dit pas où
  l'on est.

- **Les commandes flottantes n'étaient pas centrées sur la barre.** Les trois
  liens d'accès rapide et le bouton de raccourcis se collaient au bord haut
  (`top: 8px`), soit **10 px trop haut** en desktop et 2 px en mobile, alors que
  les chips de la barre, eux, sont centrés. Ils partagent désormais la hauteur de
  la barre par une variable `--nav-hauteur`, et se centrent dessus quelle que
  soit leur propre taille. Défaut antérieur à cette PR — un seul lien
  d'évitement le rendait discret, trois le rendent voyants.

- **Le champ de question était annoncé deux fois.** Son nom accessible venait
  d'un `<label>` masqué visuellement : même nom accessible qu'un
  `aria-label`, mais **un nœud de texte de plus dans l'arbre**. En mode
  exploration, le lecteur d'écran lisait « Votre question », puis « Votre
  question, zone d'édition, Posez-moi n'importe quelle question ! ». Le libellé
  passe en `aria-label`, et l'arbre ne le porte plus qu'une fois.

  Ce que l'audit d'août avait corrigé reste acquis : le nom accessible est
  **distinct de l'indice de saisie**, qui s'efface à la première frappe. C'était
  cela le défaut d'alors, pas la nature de l'attribut — le `<label>` masqué
  était la bonne réponse à la mauvaise question.

  Défaut inaudible autrement : ni axe, ni la lecture du code, ni un test de nom
  accessible ne le voient. Il fallait écouter. Le test compte désormais les
  occurrences du nom dans l'arbre du lanceur et en exige **une seule**.

- **L'anneau de focus ne suivait pas la bordure des éléments visés.** Deux
  causes distinctes derrière le même symptôme.

  **Les cibles de saut dessinaient l'anneau du navigateur.** `main` et la grille
  d'articles portent `tabindex="-1"` pour que le focus s'y pose vraiment ; le
  navigateur y traçait alors *son* indicateur — un rectangle de 1 px encadrant
  tout le bloc, qui ne suit aucune bordure et ne ressemble à rien d'autre sur le
  site. Il est retiré plutôt que stylé : ces conteneurs ne sont pas des
  commandes, ils ne sont pas dans l'ordre de tabulation, et WCAG 2.4.7 ne vise
  que les composants opérables au clavier. Le retour au clavier, c'est le
  défilement ; au lecteur d'écran, c'est l'annonce du repère atteint.

  **Les anneaux étaient écrits en dur** — `border-width-strong` et `2px`
  d'offset — alors que l'export porte trois tokens faits pour ça :
  `focus.outline-width`, `-offset` et `-style`. Douze déclarations basculées.
  Conséquence visible : l'offset passe de 2 à **3 px**, valeur du token. Le
  champ de saisie s'en écartait plus encore, avec un anneau de **1 px collé à sa
  bordure**, seul de son espèce — il rejoint les autres.

  **`focus-fallback` n'est pas employé, et c'est délibéré.** Le token existe
  pour les fonds colorés où le token principal manque de contraste ; mesure
  faite, la palette de ce site n'en présente aucun — `focus` tient partout, au
  pire **3,99:1**, quand le repli tomberait à **2,88:1** sur
  `surface-alternative` en mode sombre. L'employer aurait dégradé l'indicateur.
  Trois paires sont ajoutées à `npm run a11y:contrast`, au seuil 3:1 de WCAG
  1.4.11 : le jour où la palette bouge, c'est là qu'on le verra, au lieu de le
  supposer.

  `e2e/focus.spec.ts` vérifie que **toutes** les commandes portent le même
  anneau (2 px, solid, offset 3 px), que les deux cibles de saut n'en portent
  aucun, et qu'aucune valeur n'est réécrite en dur dans la feuille servie.

### Added

- **`e2e/audit-a11y.spec.ts` — un audit systématique des défauts qui échappent
  aux outils.** Neuf contrôles, quatre largeurs, trois écrans. Chacun vient d'un
  défaut **réel** relevé à l'usage pendant la session, et qu'axe-core n'avait pas
  signalé : il passait au vert sur tous.

  Trois familles, tirées de ce que la passe au lecteur d'écran a montré :

  - **Annonces en double** — un `<title>` qui reprend le `h1`, un nom de
    contrôle répété en texte à côté de lui, une région live qui mêle forme
    visuelle et forme parlée, un `lang` qui répète celui du document. Le point
    commun : le même texte existe deux fois dans l'arbre, à deux titres.
  - **Pointeur et cibles** — aucune zone morte sur un contrôle (un pseudo-élément
    masqué passe au-dessus et vole le clic), et le plancher de 24 × 24 px.
  - **Structure** — un seul `h1` exposé, aucun focalisable sous `aria-hidden`,
    et toute cible d'ancre qui dégage la barre collante.

  Les tolérances sont écrites et motivées dans le fichier : les slides inactives
  du carrousel sont `inert`, un contrôle inactif ne reçoit volontairement pas le
  pointeur, et le rang de questions suggérées passe sous son bouton de
  défilement en mobile. **Une tolérance sans raison écrite est une régression
  déguisée.**


- **Un accès rapide ouvre le document**, tiré d'une passe au lecteur d'écran.
  Trois constats, trois réponses.

  **Rien ne disait ce qu'est ce site.** Le premier élément annoncé était « lien,
  Aller au contenu », puis la barre de réglages. Le nom du site n'existait que
  dans le `<title>` — annoncé à un moment que l'utilisateur ne contrôle pas, et
  jamais retrouvable en exploration. Il est désormais du contenu, en tête :
  « Arthur Mathon — portfolio conversationnel », suivi de **« Poser une question
  à Arthur »** puis **« Voir les articles »**, et enfin le lien d'évitement
  d'origine. Les deux premiers posent le focus sur une commande, le troisième
  mène au contenu pour le lire : deux besoins distincts, trois liens.

  **Les raccourcis à touche unique n'atteignent pas un lecteur d'écran.**
  `docs/accessibilite.md` l'annonçait comme une limite probable ; la passe l'a
  confirmé, `?` compris. En mode exploration, NVDA et JAWS réservent les lettres
  à leur propre navigation — `f` va au champ de formulaire suivant. **Ce n'est
  pas contournable côté page** : la touche est consommée avant que le document
  ne la voie. D'où la réponse structurelle plutôt qu'un correctif : les mêmes
  destinations existent en contrôles réels, atteignables à la tabulation comme
  à l'exploration. Les raccourcis restent un confort pour le clavier nu, ils ne
  sont plus le seul chemin vers quoi que ce soit.

  L'accès rapide est rendu **par chaque page** et non par le layout : ses
  destinations en dépendent — une page article n'a ni lanceur ni grille, elle
  n'offre donc que le contenu. Un raccourci vers une cible absente ne vaut rien.

### Changed

- **Le carousel suit le mode de navigation** : figé au clavier, relancé à la
  souris. `components/NavMode.tsx` pose `data-nav-mode` sur `<html>` et le
  mémorise.

  La demande était « mettre en pause quand un lecteur d'écran est actif ».
  **C'est impossible** : aucune API n'expose la présence d'une technologie
  d'assistance, et les heuristiques qui circulent — chaîne d'agent utilisateur,
  `forced-colors` — sont autant du pistage que de l'approximation. Un mode de
  navigation n'y change rien : c'est **le même signal**, des événements clavier,
  et non une détection de lecteur d'écran.

  Ce qu'il change, c'est la **forme** du signal. La première version posait un
  verrou à sens unique — une touche, et l'animation était perdue pour de bon,
  mémorisée. Un mode est un état **réversible** : l'utilisateur de lecteur
  d'écran, qui ne produit aucun événement pointeur, reste en mode clavier toute
  sa visite ; le visiteur voyant qui appuie une fois sur `Tab` retrouve
  l'animation dès qu'il reprend la souris. Le coût assumé de la première
  version disparaît.

  Trois réglages en découlent, chacun pour une raison :

  - **le tactile ne bascule rien** — un lecteur d'écran mobile balaye l'écran et
    produit les mêmes `pointerdown` qu'un doigt ordinaire ; les distinguer est
    impossible, donc seule la souris fait foi (`pointerType`) ;
  - **les touches de saisie ne comptent pas** — écrire dans un champ, c'est
    éditer, et le lanceur de conversation vit dans ce carousel ;
  - **le bouton lecture prime sur le mode** — sans quoi il serait un contrôle
    sans effet pour qui navigue au clavier, et `aria-pressed` annoncerait « en
    lecture » un carousel immobile.

- **Les composants sont écrits ici, sur le préfixe `ama`.** `styles/components/`
  remplace le CSS extrait du WDS Accor : `.ama-button` (et `.ama-button-icon`),
  `.ama-chip`, `.ama-input-text`, `.ama-message`, `.ama-select`,
  `.ama-skeleton`. Les classes suivent désormais les tokens — le contrat était
  déjà passé à `--ama-*`, le vocabulaire des classes le rejoint, et il n'y a
  plus qu'un seul préfixe à connaître dans le projet.

  **`app/layout.tsx` n'importe plus `styles/welds-src/components.css`.** C'est
  ce qui débloque le déploiement : ce fichier est gitignoré (règle d'or : l'IP
  Accor n'entre jamais dans l'historique), donc un build depuis le seul dépôt ne
  pouvait pas aboutir. Il aboutit maintenant, vérifié par `npm run build` sur un
  `styles/welds-src/` sans `components.css`.

  **175 Ko → 19 Ko**, et versionnés. L'écart ne vient pas d'un travail de
  compression : le paquet livrait 12 composants dont **6 n'étaient référencés
  nulle part**, répétait les règles de `button` dans chaque fichier, et
  transportait des utilitaires (`.hidden`, `.sm\:flex`…) que le site n'emploie
  pas. Restaient 6 composants réellement servis — 5 en production, le
  `skeleton` n'existant que sur la page kit interne.

  **Correctif de la même série.** La première version de cette réécriture
  dessinait les chevrons (chip déroulant, select) avec deux bords d'un carré
  tourné à 45°, au lieu du masque SVG d'origine : un « V » plus épais et à
  angles vifs, visiblement différent. Signalé par Arthur, revenu à un masque
  SVG — tracé écrit ici, un polyligne à bouts arrondis.

  **Les sélecteurs de la barre de navigation avaient une zone morte, et elle
  est antérieure à cette réécriture.** Cliquer le chevron du chip (avatar,
  langue) n'ouvrait pas la liste. Mesuré sur `a726420`, avant tout changement :
  **inerte de 63 % à 83 % de la largeur**, exactement l'emprise du chevron.

  La cause tient en une ligne de spécification : **`mask-image` crée un contexte
  d'empilement**, comme `transform` ou `opacity`. Le chevron `::after`, qui suit
  le `<select>` dans l'ordre du document, est donc peint **au-dessus** de ce
  `<select>` que le chip superpose en absolu — et il en interceptait le clic.
  Le chevron est décoratif : `pointer-events: none` le rend transparent au
  pointeur. On vise justement le chevron pour ouvrir une liste, ce qui rend le
  défaut d'autant plus visible à l'usage.

  Deuxième foyer, celui-là introduit ici puis corrigé : la barre de réglages de
  la page kit posait un glyphe `▾` *frère* du `<select>`, qui recevait le clic
  sans rien en faire et doublait le chevron du composant. Glyphe retiré, le
  composant dessine seul.

  `e2e/selects.spec.ts` **balaye toute la largeur** des deux sélecteurs, tous
  les 2 px, et n'accepte aucun point qui n'atteigne pas le `<select>`. Une
  première version échantillonnait 8 %, 50 % et 94 % : elle **encadrait la zone
  morte sans jamais la toucher**, et passait au vert. Trois points ne décrivent
  pas une surface.

  Le rendu est inchangé, y compris là où la fidélité coûtait quelque chose :
  `.ama-chip` n'a **pas** de bordure au repos, parce que le persona libellule
  pose son liseré rétro en ne réglant que `border-width`/`border-style` et
  compte donc sur `currentColor` — lui donner une `border-color` la lui aurait
  volée.

  Trois écarts avaient en revanche été introduits **sans être signalés**, et
  sont revenus aux valeurs d'avant : le rayon du skeleton (4 px littéraux, et
  non le token `container-low` qui vaut 6 px), `margin: 0` sur
  `.ama-message__text` — qui resserrait le bandeau d'erreur du chat — et
  l'alignement vertical dans l'enveloppe du select. Le seul reste est le
  rembourrage droit du contrôle, élargi pour dégager le chevron : sans lui une
  option longue passe dessous.

  Deux écarts assumés, tous deux invisibles : l'état pressé du bouton
  primaire lit `--ama-comp-btn-primary-pressed-fg-color` au lieu de
  `--ama-sem-color-on-accent` (le WDS n'utilisait le token dédié que pour les
  niveaux secondaire et tertiaire), et `.ama-skeleton` cesse de battre sous
  `prefers-reduced-motion` sans perdre son aplat.

  Les six fichiers sont réunis par `styles/components/index.css`, et le layout
  n'importe que lui. Ce détail n'en est pas un : importer les six séparément
  depuis `layout.tsx` faisait **passer la suite de 1,1 à 2,8 minutes et échouer
  21 tests**, tous en timeout à 30,0 s sur `networkidle` et tous en desktop.
  Aucune assertion n'était fausse — le serveur de développement recompilait six
  modules CSS distincts pendant que seize workers tapaient dessus. Joués seuls,
  ces 21 tests passaient : c'est ce qui rend le symptôme trompeur, et c'est
  pourquoi la comparaison qui tranche est **la suite complète contre la suite
  complète**, jamais un spec isolé.

- **`npm run welds:install` n'extrait plus que le thème.** `template.theme.css`
  ne sert plus qu'à une chose : servir d'oracle à `npm run tokens:check`. C'est
  un outil de vérification, pas une dépendance de build. Un `components.css`
  laissé par une extraction antérieure est supprimé, pour qu'il ne subsiste rien
  qui ait l'air de servir.

### Added

- **`npm run css:check` refuse les pannes silencieuses du contrat.** Une
  variable CSS absente ne produit ni erreur ni avertissement : la déclaration
  est ignorée et le composant perd sa couleur sans que rien ne le dise. Le
  script vérifie que chaque `var(--ama-*)` du CSS applicatif est définie dans
  **les trois** thèmes — un token présent chez `ours` mais pas chez `libellule`
  ne se verrait qu'en naviguant jusqu'à ce persona, dans ce mode, sur cet
  écran —, qu'aucune primitive ni alias n'est lu (`sem`/`comp` seulement) et
  qu'aucun `--wel-*` ne revient. 201 références vérifiées.

- **Le corps des articles ne part plus dans le prompt.** Il y pesait 56 ko —
  plus que tout le reste de la base réuni — pour un contenu que la plupart des
  conversations n'abordent jamais, et qui est déjà publié en entier sur
  `/articles/<slug>`. Le prompt n'en porte plus que la **synthèse** : titre
  exact, chapô, idées clés, plan. Le texte intégral se charge **à la demande**,
  par l'outil `lire_article` déclaré dans la route du chat (`stopWhen` à trois
  étapes : appel, résultat, rédaction). Rien n'est perdu : ce qui n'est plus
  transporté reste accessible.

  Le principe « un article n'existe qu'en un seul exemplaire »
  (`lib/article-body.ts`) est préservé : les **idées clés vivent dans l'article
  lui-même**, en tête, sur une ligne `Idées clés :` que le rendu de page écarte
  — comme il écarte déjà le H1 et la ligne de crédit. Le plan, lui, est dérivé
  des titres de section, donc toujours en phase avec le texte. Un test e2e
  vérifie que cette ligne ne s'affiche dans aucune des deux langues : c'est la
  contrepartie du compromis.

  La consigne d'appel de l'outil a dû être **explicite jusqu'à l'énumération**
  (« une citation, un exemple, une image, une métaphore, une formulation… »,
  et « en cas de doute, appelle l'outil »). Formulée plus sobrement, le modèle
  répondait de mémoire depuis la synthèse : jamais faux, mais approximatif là
  où le texte disait mieux.

  Déclencheur : le golden test du 2026-08-12 a échoué sept fois sur dix en
  `429`. La base injectée atteignait ~25 000 tokens, soit **exactement** la
  limite de 25 000 tokens/minute du tier gratuit Mistral — une question
  consommait le quota d'une minute. **115 ko → 60 ko, ~13 300 tokens estimés.**

- **`npm run prompt:size`**, mesure du prompt section par section, en échec
  au-delà de 18 000 tokens estimés. Le plafond avait été franchi sans que rien
  ne le signale : le prompt n'était mesuré nulle part. Le script reproduit les
  règles de sélection de `lib/prompt.ts` et lit les littéraux `IDENTITY` /
  `GUARDRAILS` dans le source plutôt que de les recopier — un doublon dériverait
  en silence. Il avertit aussi quand un article n'a pas de ligne `Idées clés :`.

### Fixed

- **Un nom de persona était détecté au milieu d'un mot** : dans « je réponds
  toujours », les quatre lettres `ours` devenaient un bouton de bascule, au
  beau milieu du texte. Le motif de détection n'avait aucune frontière de mot ;
  l'anglais était exposé de la même façon (`crow` dans « crowd », `bear` dans
  « beard »).

  Les frontières sont posées en lettres Unicode (`(?<![\p{L}\p{N}])`) et non
  avec `\b` : `\b` s'appuie sur `[A-Za-z0-9_]`, d'où les lettres accentuées sont
  exclues — sur du texte français, il se déclenche au mauvais endroit.

  Second garde-fou : un « ours » en minuscule et **sans article** reste du
  texte. Le bot nomme toujours le persona avec son article (« l'Ours ») ou sa
  majuscule ; le mot nu, lui, désigne l'animal.

  Le découpage quitte le composant pour `lib/persona-mention.ts`, où il se teste
  sans navigateur — même raison que `lib/detect-lang.ts` : une logique subtile
  sur du français mérite ses cas écrits. `e2e/persona-mention.spec.ts` couvre
  les pièges (« toujours », « pourtour », « ourson », « crowd », « beard »), les
  détections légitimes dans les deux langues, le gras markdown, et le fait qu'un
  titre d'article l'emporte sur le nom de persona qu'il contient.

### Changed

- **Déduplication de la base**, à information constante : la liste des six
  chantiers d'industrialisation était écrite deux fois presque au mot près
  (`expertise.md` et `projects/accor-wds.md`) — `expertise.md` renvoie
  désormais aux fiches au lieu de les résumer ; et la mention « dans le cadre de
  la mission Design System Manager chez Accor », répétée à l'identique dans les
  six fiches chantier, est retirée : l'appartenance est déjà portée par le
  regroupement `<projects>` et par `accor-wds.md`.

  **Les sept clauses de confidentialité en fin de fiche sont conservées**, bien
  que redondantes avec le garde-fou n° 4. Le plan prévoyait de les supprimer ;
  la mesure a montré que la cible était déjà atteinte sans elles, et 1,1 ko ne
  justifie pas d'affaiblir un comportement que trois golden questions vérifient.

- **Le README documente le budget du prompt** : le quota Mistral, le seuil du
  script, et la bascule `CHAT_PROVIDER=anthropic` comme levier disponible — le
  `cacheControl` est déjà posé sur le préfixe stable, il n'attend qu'un provider
  qui en tienne compte. Rien n'est basculé : le portfolio reste démontrable sur
  un tier gratuit.

- **Six fiches projet sur l'industrialisation du design system Accor** dans
  `knowledge/projects/` : extraction Figma et contrats de données, documentation
  AI-ready, versioning outillé, QA automatisée, Code Connect, assistant
  conversationnel sur le corpus. Chacune suit la même trame — problème,
  démarche, **gains**, ce que le projet illustre. La base ne décrivait la
  mission Accor que par cinq puces génériques ; le persona Libellule (« l'IA et
  les Operations ») n'avait donc rien de concret à citer, et Code Connect
  n'apparaissait nulle part. `accor-wds.md` devient le hub qui les annonce, et
  `expertise.md` remplace la mention isolée des serveurs MCP par les six
  chantiers.

  **Curation** : ordres de grandeur et méthode uniquement. Aucun compte de
  défauts (overrides, violations d'accessibilité, verdicts par composant) — ce
  sont des audits du produit du client. Aucun identifiant Figma, dépôt, branche,
  préfixe CSS ou chemin de token Accor, aucun nom de tiers.

  **Les sections de résultats disent un gain, pas un volume vérifié.** Retirer
  les comptes de défauts avait laissé des fiches qui énuméraient ce qu'on
  contrôle au lieu de ce qu'on y gagne : une extraction sept fois plus rapide,
  un contexte d'IA qui porte une fois et demie plus de composants, un développeur
  qui copie le vrai code au lieu de le réinventer, une latence divisée par
  quatre. Seuls des chiffres mesurés sont repris — aucune estimation de temps
  économisé.
- **Golden questions étendues à 27** (`docs/eval-questions.md`), renumérotées :
  cinq questions sur l'industrialisation, dont une qui vérifie que le bot ne
  prétend **pas** que le versioning « bumpe tout seul », et deux nouveaux pièges
  de confidentialité (identifiants Figma, nombre de bugs d'accessibilité).

- **`1.0.0_AMaDesignTokens`** : l'export de tokens du portfolio, dérivé de
  l'export Accor 2.2.2. Trois marques, une par avatar, toutes issues de
  `brands/brandbook` — les treize autres marques Accor et leurs primitives
  disparaissent. Préfixe `ama`, format DTCG, chaîne **sémantique → alias →
  primitive** conservée telle quelle. `npm run tokens:build` construit `tokens/`
  depuis le zip gitignoré, `npm run tokens:pack` en tire
  `1.0.0_AMaDesignTokens_<date>_<heure>.zip` — même forme que l'export Accor,
  donc importable tel quel dans Tokens Studio. Le zip est un artefact
  rebuildable et gitignoré ; la source committée est le dossier `tokens/`, et
  l'emballage refuse d'écrire si `tokens:check` échoue. La doc complète est dans
  `docs/tokens.md`.

  La couleur de l'avatar ne vit que dans les **primitives** : les couches d'alias
  et sémantique sont identiques d'un avatar à l'autre. C'est possible parce que
  la teinte est une fonction pure de la couleur — teinter puis résoudre donne le
  même résultat que résoudre puis teinter, ce que fait déjà `build-themes.mjs`.

  L'export est un artefact **parallèle** : `styles/generated/*.css` reste produit
  depuis le `theme.css` WDS. `styles/welds-src/components.css` consomme
  `var(--wel-…)` en dur, donc les thèmes doivent continuer d'émettre `--wel-*`
  jusqu'à la réécriture perso des composants.
- **`npm run tokens:check`, vérificateur de non-régression.** Il résout la chaîne
  complète pour 3 avatars × 2 modes × 5 breakpoints et compare chaque valeur à la
  variable CSS correspondante de `styles/generated/*.css` : **4875 valeurs
  comparées, 0 divergence**, et aucune variable du CSS sans token qui la produise.
  Écrit **avant** le générateur, et sans partager une ligne avec lui — pas même
  la transformation de teinte : un oracle qui importerait le générateur
  validerait ses propres erreurs. Testé par mutation, décaler d'une unité une
  primitive lève 50 divergences par propagation.
- **Chaque persona porte un domaine** : l'ours le design system, la corneille
  le produit, la libellule l'IA et les operations. Le domaine vit dans
  `personas/*.json` — sous-titre du héro, intitulé du lanceur et questions
  suggérées en découlent. Le bot répond à tout, mais cadre ses réponses selon
  son domaine, et **invite à basculer vers le bon persona** quand la question
  relève d'un autre, en disant comment. Une seule invitation par réponse : sans
  ce garde-fou, la redirection devient un tic de fin de message. **Le nom du
  persona cité est cliquable** dans la réponse : la bascule se fait sans
  quitter la conversation, pour creuser dans la foulée.
- **Les articles cités dans une réponse deviennent des liens vers leur page.**
  Le prompt liste les articles publiés et demande le titre exact, faute de quoi
  l'application ne peut pas le reconnaître ; les deux détections — persona et
  article — cohabitent dans le même passage sur le texte.
- **Le héro devient un slideshow**, une slide par persona, d'après la maquette
  v2. Reprend le comportement du composant slideshow du WDS : lecture
  automatique au moment où le carrousel entre dans la fenêtre, 5 s entre deux
  slides, boucle infinie. Changer de slide change le thème et le sélecteur de
  la barre ; changer au sélecteur fait défiler la piste **et met la lecture en
  pause** — agir dans le carrousel ne l'interrompt pas, le quitter pour la
  barre si. **Le survol de la souris suspend le défilement** — et le focus
  clavier avec, pour la même raison —, suspension passagère qui se relâche dès
  qu'on s'en va, sans toucher à l'état du bouton. La lecture s'arrête aussi
  quand l'onglet passe en arrière-plan, quand le panneau de conversation
  s'ouvre, et `prefers-reduced-motion` la neutralise entièrement.

### Changed

- **Les thèmes sont générés depuis `tokens/`.** `build-themes.mjs` résout la
  chaîne sémantique → alias → primitive et écrit `styles/generated/*.css` ; le
  `theme.css` du WDS n'alimente plus le site. Aucune valeur ne change : +328
  octets bruts et +484 gzip sur les trois thèmes, soit les deux primitives du
  `surface-alternative` que la référence ne porte pas, et l'en-tête.

  **L'ancien pipeline devient l'oracle**, sous `scripts/build-themes-wds.mjs`.
  Il ne produit plus rien de servi : il dérive les mêmes couleurs par une tout
  autre route — teinte des littéraux du CSS aplati, sans jamais résoudre un
  alias ni lire `tokens/` — et `tokens:check` le lance dans un dossier
  temporaire pour comparer les 4875 valeurs des sept portées, dans les deux sens.

  C'est ce qui empêche l'oracle de devenir circulaire : un vérificateur qui
  relirait `tokens/` pour valider un CSS engendré depuis `tokens/` resterait
  vert quoi qu'il arrive. `check-tokens.mjs` n'importe donc rien de
  `scripts/lib/token-css.mjs`, où vit toute la connaissance du format. Éprouvé
  par mutation des deux côtés : quatre erreurs d'encodage du générateur
  (graisses, diviseur rem, opacité, alpha) et trois retouches du fichier servi,
  toutes détectées.

  La référence disparaîtra avec `styles/welds-src/`, à la réécriture des
  composants — il faudra alors un autre oracle.
- **Le contrat CSS bascule sur `--ama-*`, sans couche d'alias.** Tout ce que sert
  le navigateur consomme `--ama-*` : le CSS applicatif (191 occurrences dans
  `app/`, `components/`, `persona-extras.css`, `check-contrast.mjs`) comme les
  composants WDS.

  Le paquet d'Accor parle `--wel-*` sur 2810 références. Le renommage a lieu à un
  seul endroit, le plus en amont possible : `install-welds.mjs`, à l'extraction,
  sur le `theme.css` comme sur les composants. `build-themes.mjs` n'a donc jamais
  à connaître l'ancien nom, et les thèmes restent à 210 Ko brut / 23 Ko gzip.

  Ce chantier avait d'abord pris un autre chemin, sur une contrainte non
  vérifiée — « le fichier est régénéré, tout renommage y serait détruit ». Vrai
  d'une édition **à la main** ; faux fait par l'installateur, où la
  transformation est reproductible par construction. Le détour a coûté une couche
  d'alias de 358 Ko, un piège de portée CSS à désamorcer et son audit dédié, tout
  cela supprimé par une ligne une fois la contrainte examinée. Consigné dans
  `docs/tokens.md` : quand une contrainte impose une architecture coûteuse, la
  vérifier avant de la contourner.

  `tokens:check` refuse tout `--wel-*` dans les six fichiers du contrat : s'il en
  revenait un, plus aucun thème ne le définirait et les composants perdraient
  leurs couleurs **en silence** — un test de contraste ne mesure que ce qui est
  peint, pas ce qui a disparu. Les deux voies de retour en arrière sont vérifiées
  par mutation.
- **Le README consigne le piège du serveur de développement résiduel.**
  `reuseExistingServer: true` récupère le serveur d'un run précédent avec son
  cache périmé : après un changement de CSS un peu large, cela donne une
  trentaine d'échecs Playwright groupés, **tous à exactement 30,0 s**, qui
  ressemblent trait pour trait à une régression. Le signal est la durée ronde et
  identique, pas le contenu des assertions.
- **La transformation de teinte des personas passe dans
  `scripts/lib/persona-color.mjs`**, partagée par le générateur de thèmes et
  celui de tokens. Les deux chaînes doivent rendre la même couleur au bit près,
  ce qui ne peut être vrai que si la fonction est littéralement la même. Sortie
  de `build-themes.mjs` identique au bit près après extraction.
- **L'invitation du pied de page devient propre au persona** et ne dit plus
  « Discutons » : c'était le libellé du bouton d'envoi, et le doublon laissait
  croire que le pied de page ouvrait lui aussi la conversation. L'ours propose
  « On boit un café ? », la corneille « Croisons nos chemins », la libellule
  « RDV IRL ? ». Le texte rejoint `personas/*.json`, seule source des textes de
  persona.
- **La barre de navigation et le pied de page passent sur
  `surface-alternative`** : ils se détachent de la page sans dépendre de leur
  seule ombre portée. Le token existe dans la bibliothèque Figma et dans
  l'export 2.2.2 mais pas dans le `theme.css` du paquet WDS installé ; il est
  donc injecté dans le pipeline de thèmes, à retirer quand le paquet le
  livrera. En clair il vaut la valeur brandbook ; en sombre, où l'export lui
  donne exactement celle de `surface`, il est dérivé du fond sombre avec le
  même écart de luminance qu'en clair — 1,071 à 1,078 sur les trois personas,
  dans les deux modes.

### Fixed

- **`npm run themes:build` refuse de tourner sur une extraction WDS périmée.**
  `styles/welds-src/` est gitignoré : il survit aux changements de branche. Une
  extraction antérieure à la bascule `--ama-*` consomme encore `var(--wel-…)`,
  que plus aucun thème ne définit — boutons, chips et champs perdraient leurs
  couleurs **en silence**, une variable absente ne cassant rien de visible côté
  CSS. Le script s'arrête et renvoie vers `npm run welds:install`. C'est le cas
  normal après un `git pull` qui traverse cette bascule, pas un cas tordu : il
  fallait donc le rattraper au moment où il se produit, et pas seulement dans
  `tokens:check`, que rien n'oblige à lancer.
- **Le héro défilait tout seul au chargement**, de l'ours vers le persona
  mémorisé, comme si le carrousel démarrait de lui-même. Le thème, lui, était
  déjà le bon dès la première image : seule la piste rattrapait sa position.

  `useSettings` rend les défauts SSR pour éviter un écart d'hydratation, puis lit
  `<html>` dans son effet de montage — où le script anti-flash a déjà posé le
  persona mémorisé. Le slideshow rattrapait donc sa slide *après* l'hydratation,
  et ce rattrapage passait par la même animation qu'un changement voulu.

  Un déplacement de la piste n'est désormais animé que s'il a une cause : lecture
  automatique, bouton, clavier ou sélecteur de la barre, qui passent tous par un
  événement de réglages. La restauration initiale n'en a pas, et se fait donc
  d'un bloc. Test de régression : une animation laisse des positions
  intermédiaires, un saut n'en laisse aucune — il en relevait 25 avant le
  correctif, zéro après.
- **Quatre variables de thème n'existaient nulle part.**
  `--wel-sem-border-width-focus`, `--wel-sem-border-width-thin`,
  `--wel-sem-font-sizes-body-xs` et `--wel-sem-line-heights-body-xs` étaient
  consommées par `globals.css` sans jamais être définies — ni par les thèmes, ni
  par les composants, ni par l'export de tokens. Six usages sur huit avaient une
  valeur de repli et passaient donc inaperçus ; **les deux autres n'en avaient
  pas** (`.article__kicker`), et sa taille comme son interligne retombaient
  silencieusement sur l'héritage. Remplacées par les tokens réels, dont la
  valeur est exactement celle des replis : `border-width-strong` (2 px),
  `border-width-default` (1 px) et `font-sizes`/`line-heights-caption`
  (0,75 rem / 1 rem) — `caption` étant le token du surtitre en capitales.
  Trouvé en cartographiant les consommateurs avant la bascule vers `--ama-*`.
- **Le chat retombait en erreur à chaque redémarrage du serveur de
  développement.** Derrière l'interception TLS de l'entreprise, `fetch` côté
  Node échoue avec `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` tant que
  `NODE_EXTRA_CA_CERTS` ne pointe pas le bundle de certificats — l'API répond
  alors `error` sans autre explication, et le symptôme est déroutant puisque
  curl et le navigateur passent. La variable ne pouvait pas venir de
  `.env.local`, Node la lisant au démarrage du process. `dev`, `build` et
  `start` passent désormais par `scripts/with-ca.mjs`, qui la pose depuis
  `~/.certs/corporate-ca.pem` quand le fichier existe et qu'elle n'est pas
  déjà définie. Sans bundle, la commande est lancée inchangée.
- **Le balayage axe du panneau de conversation mesurait les contrastes pendant
  son animation d'entrée** : le panneau y est encore partiellement
  transparent, et les couleurs composées avec l'arrière-plan faisaient échouer
  la règle `color-contrast` sans que la page posée ait le moindre défaut. Le
  test attend désormais la fin des animations en cours.
- **Le titre du pied de page écrasait les boutons sur la libellule.** Press
  Start 2P est une pixel font à chasse fixe : chaque glyphe occupe un em plein,
  et « Discutons ! » y faisait 286 px contre 136 pour le même texte en
  Fraunces, ne laissant que 15 px de marge sur 343 en mobile.
  `subtitle-lg` passe à 1 rem pour ce seul persona, comme `display-md` et
  `display-sm` le font déjà pour la même raison.
- **Audit d'accessibilité complet** (WCAG 2.2 AA), consigné dans
  `docs/accessibilite.md` — treize anomalies corrigées. Les trois bloquantes :
  la réponse du chat était ré-annoncée en entier à chaque token reçu, faute
  d'être sortie du conteneur `aria-live` ; le groupe de questions suggérées
  n'avait aucun nom, `aria-label` étant ignoré sur un élément générique ; et
  les chips de réglage n'affichaient **aucun indicateur de focus**, le focus se
  posant sur un `<select>` rendu transparent.
- **Le nom accessible des cards commence par l'action** : « Lire l'article,
  Comment remettre en mouvement une entreprise traumatisée ? », au lieu de la
  concaténation de tout le contenu de la card, surtitre en tête.
- **Le champ de saisie a un libellé distinct de son indice** : le placeholder
  disparaît à la première frappe, le nom accessible doit tenir.
- Lien d'évitement, hiérarchie de titres complétée sur l'accueil, titre du
  carousel, compteur annoncé en phrase, `prefers-reduced-motion` respecté par
  les défilements pilotés en JavaScript, arrière-plan rendu `inert` pendant la
  conversation, bouton d'envoi inactif qui reste atteignable au clavier.

### Added

- **Pied de page collant**, présent sur toutes les pages : « Discutons ! »
  suivi des boutons LinkedIn et e-mail. Il fait le pendant de la barre de
  navigation — mêmes retraits, même ombre, projetée vers le haut — et vaut
  64 px de haut à toutes les largeurs, là où la barre descend de 80 à 64 en
  mobile. `position: sticky` plutôt que `fixed` : la barre garde sa place dans
  le flux, donc rien n'est masqué en bas de page.

### Changed

- **La carte contact disparaît de l'accueil** : les liens qu'elle portait sont
  passés dans le pied de page, où ils suivent le lecteur sur toutes les pages.
- **Les pages articles ouvrent leur barre par un bouton d'accueil**, à gauche,
  en lieu et place de la pilule « Retour ». Le libellé du lien reste
  « Retour à l'accueil » pour les lecteurs d'écran.
- **Les contrôles de la barre suivent la maquette au pixel** : 40 px en desktop
  et tablette, 32 en mobile, dans une barre de 80 puis 64. Le bouton d'icône
  WDS n'ayant pas de largeur propre, sa boîte se déduisait du contenu et
  dépassait de 2 px ; le chip retombait de son côté à 38.

- **Images servies en WebP** : les douze visuels (héros et articles) passent de
  PNG/JPEG à WebP — 1 854 Ko à 1 002 Ko, soit 46 % de moins.
- **L'illustration du héro suit le mode de couleur.** La maquette dessine deux
  scènes distinctes par persona, pas une variation de traitement : l'ours
  contemple la montagne de jour en clair et sous la lune en sombre. Six visuels
  exportés (`public/hero/<persona>-<mode>.jpg`), servis en JPEG plutôt qu'en
  PNG — le dossier passe de 3,7 Mo à 1,2 Mo pour deux fois plus d'images.
- **L'accueil compose les six articles** : deux grandes cards puis une rangée
  de quatre cards étroites, d'après la maquette mise à jour. La carte contact
  quitte la grille — elle en occupait deux colonnes — et s'étend désormais sur
  toute la largeur sous les deux grilles.

### Added

- **Normalisation des articles sources** (`scripts/normalize-articles.mjs`).
  Les fichiers de `knowledge/content-library/` étaient des extractions PDF :
  lignes coupées à ~86 caractères en plein milieu des phrases, titre répété en
  texte brut sous le H1, titres de section sans balisage, listes en puces
  « • ». Le script les recolle en markdown structuré et **vérifie fichier par
  fichier que la suite des mots est identique avant et après**, aux seuls
  segments explicitement retirés près ; il refuse d'écrire sinon. La
  transformation est typographique, aucun texte n'est réécrit.
- **Deux articles ajoutés** : « Le design système au service de vos besoins en
  data visualisation » (texte fourni par Arthur, visuel exporté de la maquette)
  et « Comment le Design peut répondre aux enjeux actuels des entreprises ? »,
  dont le texte était déjà dans la base de connaissance sans être affiché — son
  visuel est la couverture d'Olivier Hamant citée en référence dans l'article.
  Six articles au total, tous traduits en anglais. La grille d'accueil en
  compose quatre, comme la maquette ; le carousel les propose tous.
- **Carousel en fin d'article** : les autres articles y défilent, trois par page
  en desktop, deux en tablette, une en mobile, avec la pagination condensée de
  la maquette (précédent · compteur · suivant). Le défilement est celui du
  navigateur — `scroll-snap` — donc le geste tactile et le clavier fonctionnent
  d'origine ; le nombre de pages se déduit de la géométrie des cartes et suit
  les breakpoints sans les connaître. Le carousel occupe toute la largeur de
  contenu, là où la colonne de lecture reste resserrée.
- **Les quatre articles sont traduits en anglais** (`knowledge/content-library/en/`).
  La page sert la version correspondant à la langue choisie ; le titre, le
  surtitre et le chapô suivaient déjà ce réglage. Le sous-dossier `en/` n'entre
  pas dans la base de connaissance du bot, qui ne lit que la racine — le modèle
  continue de traduire à la volée.
- **Une page par article**, générée statiquement (`/articles/<slug>`), d'après
  les trois frames de la maquette. Les boutons « Lire l'article » de l'accueil
  mènent désormais au site et non plus au profil LinkedIn. Colonne de lecture
  de 850 px en desktop et 550 en tablette ; en mobile l'article occupe toute la
  largeur. Surtitre, titre et chapô suivent la langue choisie ; le corps est
  annoncé en français, langue de rédaction des articles.

### Fixed

- La rangée de chips s'estompe sous son bouton de défilement, et le bloc
  reprend le retrait bas de 28 px de la maquette avant l'illustration.
- **Le héro mobile ne suivait pas la maquette.** Le champ de saisie était
  rectangulaire avec un bouton rond posé à côté, sur toute la largeur ; la
  maquette dessine un champ en pilule occupant 311 px, la flèche d'envoi
  **à l'intérieur** à droite, et laisse l'illustration en pleine largeur
  (343 px). La rangée de chips reçoit son bouton de défilement, rendu
  uniquement lorsqu'elle déborde — donc jamais en desktop, où les chips
  passent à la ligne.
- **La pilule « Retour » recouvrait le texte de l'article.** Posée au-dessus de
  l'article, elle occupait exactement l'emplacement où démarre la colonne de
  lecture dès que la fenêtre passait sous ~1100 px. Elle est désormais portée
  par la barre de navigation, déjà collante, à toutes les largeurs.
- En thème Libellule, la police d'affichage — une pixel font très large —
  faisait déborder le titre d'article hors de la colonne mobile de 311 px et
  provoquait un défilement horizontal de toute la page.
- **Le premier affichage d'une illustration prenait plus d'une minute.** Next
  propose par défaut l'AVIF, que tout navigateur récent réclame via son en-tête
  `Accept` ; l'encodage AVIF d'une illustration de 2624 × 1248 dépassait la
  minute, et le visiteur attendait d'autant. `images.formats` est restreint au
  WebP : 5 ms mesurées contre plus de 60 s, pour un gain de poids marginal sur
  des sources déjà en WebP. Le symptôme s'est manifesté en test, par des
  chargements de page qui n'aboutissaient jamais en mode sombre — le mode dont
  les visuels n'avaient pas encore été encodés.
- **Le bouton de défilement des chips disparaissait en mode sombre.** Son fond
  reprenait la surface de la page et l'ombre portée y est invisible : il ne
  restait que le chevron, sans forme, rayon ni retrait perceptibles. Il porte
  désormais une surface surélevée et la bordure des chips.
- **Le titre d'une card sans visuel était invisible.** Son contenu est composé
  en mode sombre — ce qui le rend lisible sur une photo — mais sans image
  dessous il se retrouvait en clair sur la surface claire de la page, soit un
  contraste de 1:1. Ces cards portent désormais l'aplat de thème prévu :
  19,15:1.
- **La ligne de crédit s'affichait en tête des articles traduits.** Le
  découpage du markdown ne filtrait que sa forme française, si bien que
  « Article written by Arthur Mathon… » ouvrait le corps des six versions
  anglaises. La parité de structure FR/EN est désormais testée sur les
  paragraphes, pas seulement sur les titres et les listes.
- **`.gitignore` : le motif `article/` n'était pas ancré** et excluait donc
  n'importe quel dossier de ce nom à toute profondeur — dont
  `components/article/`, absent du dépôt sans que rien ne le signale
  localement. Ancré à `/article/` ; les documents sources d'Arthur restent
  exclus, doublés par `*.docx`.
- La chaîne « Nouvelle version — bientôt en ligne » est retirée : depuis que
  chaque article a sa page, aucune card ne peut plus se trouver dans cet état.
- **Des commentaires de relecture Word s'affichaient dans les articles.**
  L'extraction PDF avait laissé sept annotations (« Commented [MA1] : … »,
  « Revoir le titre », « Rajouter les références ») dans le corps du texte, ainsi
  qu'un « Bouton » resté en placeholder. Retirés, avec les césures cassées par
  l'export (« ci- dessous ») et quatre titres de section absorbés dans des
  paragraphes ou des listes.

- **Le bot ne suivait pas la langue de l'utilisateur.** Une question posée en
  anglais avec l'interface en français obtenait une réponse en français, la
  base de connaissance étant elle-même rédigée en français. Renforcer la
  consigne n'a réglé que les questions longues. La langue est désormais
  **déterminée côté serveur** (`lib/detect-lang.ts`) à partir du message posé,
  puis imposée au modèle ; le réglage d'interface ne sert que de repli quand le
  message ne porte pas assez de signal. 5/5 sur les cas qui échouaient.
- Le bot sortait de la première personne dès qu'il assumait d'être une IA
  (« ce n'est pas moi qui suis chez Accor, mais Arthur »). Le garde-fou de
  transparence l'interdit désormais, avec une exception pour « es-tu le vrai
  Arthur ? », où la distinction est justement la réponse attendue.

### Changed

- **Base de connaissance précisée par Arthur** sur cinq points : le poste chez
  Accor (accompagnement des équipes techniques, QA, architecture de tokens
  multi-marque, outils d'industrialisation appuyés sur l'IA), la définition
  d'un bon design system (produit en évolution, gouvernance alignée sur les
  objectifs business, IA et personnalisation en 2026), le travail avec les
  développeurs (arbitrage entre réalités techniques et intentions de
  conception) et l'usage de l'IA (à toutes les échelles de création de valeur).
  Les attendus correspondants de `docs/eval-questions.md` suivent.
- La KB ne nomme plus de provider de modèle : le chat est branché sur une API
  configurable. Le développement mené en binôme avec Claude reste mentionné,
  c'est un fait distinct.

### Added

- **Interface refondue d'après la maquette Figma** : header à chips alignés à
  droite (avatar, langue) et toggle clair/sombre ; héro avec titre, sous-titre
  et barre de chat posée en débord sur l'illustration du persona ; deux grilles
  d'articles en cards-image (deux grandes carrées, puis des cards étroites
  partageant la rangée avec la carte contact). Le footer disparaît, remplacé
  par cette carte contact.
- La conversation s'ouvre dans un **panneau modal** (`ChatModal`) : 640 px
  centré sur un scrim en desktop, plein écran en tablette et mobile. Le fil
  s'ancre en bas, la question posée est une pastille sombre et la réponse du
  texte simple. Échap et clic sur le scrim ferment, le focus est piégé dans le
  panneau puis rendu à l'élément d'origine, et la page ne défile plus derrière.
- Les questions suggérées **se consomment** : une question déjà posée
  disparaît des chips, dans le héro comme dans le panneau.
- **Barre de navigation collante** (`aem.header-navigation`) : pleine largeur,
  80 px, fond de surface et ombre portée, elle reste en haut au défilement et
  porte les trois contrôles (avatar, langue, mode). Ses contrôles suivent les
  marges de la page ; le panneau de conversation la recouvre.
- Bouton **« Démarrer une nouvelle conversation »** dans l'en-tête du panneau :
  il vide le fil et restaure les questions suggérées sans fermer le panneau.
  Il n'apparaît qu'une fois la conversation entamée, et reste inactif pendant
  une réponse en cours.
- **Tests end-to-end Playwright** (`npm run test:e2e`) : 13 scénarios × 3
  largeurs (1440 / 1000 / 375), couvrant les régressions rencontrées — icône du
  slot, bouton inactif et son survol, ouverture du panneau, bouton nouvelle
  conversation, défilement du fil, Échap, lisibilité des cards en mode sombre,
  débordement des titres en libellule. Les réponses du chat sont simulées, donc
  aucun quota consommé.
- `npm run shots` : captures d'écran de l'app pour comparaison avec les frames
  Figma.
- `npm run a11y:contrast` : audit WCAG AA des thèmes générés (3 personas × 2
  modes × 10 paires texte/fond), qui évalue les deux extrémités des dégradés et
  compose les fonds semi-transparents sur la surface. Sortie 1 en cas d'échec.
- **Titres et surtitres d'articles bilingues** : `title` et `kicker` passent en
  `Record<Lang, string>` et suivent la bascule FR/EN, comme le reste de l'UI.
- Transition d'ouverture et de fermeture du panneau de conversation (fondu du
  scrim, fondu + glissement du panneau, `ease-in-out`), neutralisée sous
  `prefers-reduced-motion`.
- **Visuels exportés de la maquette** : 3 illustrations de héro (`public/hero/`)
  et 4 visuels d'articles (`public/articles/`). Servis par `next/image`, qui
  les convertit en WebP à la volée — le héro tombe de 1,64 Mo à 88 Ko.

- **Choix du provider de chat** (`lib/model.ts`) : `CHAT_PROVIDER` sélectionne
  `mistral` (défaut) ou `anthropic`. La route `/api/chat` ne connaît plus ni le
  SDK du provider, ni le nom de sa variable de clé, ni sa capacité de cache.
  Motif : le tier Experiment de Mistral est gratuit (~1 Md tokens/mois), ce qui
  permet de déployer le portfolio sans coût récurrent.
- Garde-fou de configuration : un `CHAT_MODEL` appartenant visiblement à l'autre
  provider (`claude-*` avec `CHAT_PROVIDER=mistral`, et réciproquement) échoue
  avec un message explicite au lieu d'un 400 opaque de l'API. Un identifiant
  inconnu passe, pour ne pas bloquer sur un modèle plus récent que ce code.

- `sessions-summary/` : un résumé versionné par session de travail
  (décisions, livraisons, incidents, reste à faire) — documentation du
  processus de fabrication du projet.

- **Héro illustré + selects + articles + footer** : illustration héro façon
  La Linea (un trait continu par avatar, couleur primaire du thème actif —
  change avec l'avatar sélectionné, comme poulos.co) ; les 3 contrôles
  deviennent des selects WDS sans emoji (« Avatar Type », « Language »,
  « Color Mode ») ; bloc « Articles » sous le chat (une card WDS par article,
  liens LinkedIn) ; footer avec liens LinkedIn et e-mail. L'avatar du chat
  reprend le glyphe La Linea.

### Fixed

- **Lanceur non conforme en mobile.** La maquette y abandonne la carte : le
  champ et les chips reposent directement sur la page (ni fond, ni rayon, ni
  ombre, ni retrait), l'action se réduit à une icône au bout du champ, les
  chips défilent horizontalement au lieu de passer à la ligne, et le bloc ne
  déborde plus sur l'illustration (gap à 0 contre −55). L'implémentation
  empilait au contraire champ et bouton en colonne dans la carte. Ratio de
  l'image porté à 3/2 et écart du titre à 16, comme la frame 375 ; le padding
  de la carte passe à 16 en tablette. `.wel-icon-slot` ne
  fournit ni taille ni fond : c'est un `inline-flex` en `line-height: 0` qui
  attend un `<i>` ou un `<svg>` enfant, si bien qu'un caractère texte
  s'effondrait. Le slot reçoit un SVG et reprend la boîte de la maquette
  (76 px, radius 2, fond `accent-container-low`).
- **Titres de cards débordants en thème libellule.** Press Start 2P est un
  pixel monospace dont l'avance approche 1 em par caractère : à `display-md`
  les titres sortaient de leur bloc. La marque libellule abaisse désormais la
  **valeur de son token** `display-md` (1 rem) dans son mapping, plutôt que de
  le surcharger depuis le CSS applicatif — c'est le mécanisme par lequel une
  marque Accor pose ses propres valeurs bSem, `brands/movenpickWIP.json`
  portant par exemple `display.md = 34` là où `brands/all.json` est à 32.

- **Texte des cards article illisible en mode sombre.** Il consommait
  `on-primary`, qui s'inverse d'un mode à l'autre : en sombre le libellé
  devenait quasi noir sur un voile noir (`#0f0800` pour l'ours). Les liaisons de
  la maquette sont `on-surface-hi` pour le titre et `on-surface-low` pour le
  surtitre ; le contenu de la card force désormais le mode sombre localement
  (`data-persona` + `data-color-mode` sur `.article-card__body`), puisqu'il
  repose toujours sur un voile foncé quel que soit le mode de la page — c'est
  ce que fait la maquette, où le titre vaut `#f7f9fb` en clair comme en sombre.
- Voile du bloc de texte des cards porté de 54 % à 60 % : à 54 % le titre
  tombait à 4,15:1 sur une image claire. Le surtitre prend `on-surface-hi` au
  lieu de `on-surface-low` (2,21:1) — `on-surface-mid` ne monte qu'à 3,18:1, et
  atteindre AA avec `low` demanderait un voile à 80 %. La hiérarchie reste
  portée par la taille, l'italique et les capitales.

- **L'état inactif des boutons garde son libellé lisible.** Le WDS efface le
  bouton entier (opacité 0,38 sur le fond *et* le libellé), soit 1,25:1. Le
  libellé reste désormais pleinement opaque et c'est le fond qui devient
  translucide — 24 % de la primaire, laissant transparaître l'arrière-plan :
  8,88 à 9,78:1 selon les combinaisons, sans que le bouton cesse de se lire
  comme inactif. `pointer-events: none` est réaffirmé, donc aucune interaction
  au survol.

- **Contraste insuffisant sur les boutons de certains thèmes.** La
  transformation de teinte conservait la *clarté HSL*, pas la *luminance
  relative WCAG* — deux grandeurs différentes, le vert pesant 0,7152 dans la
  seconde contre 0,0722 pour le bleu. Une rotation bleu → cyan éclaircissait
  donc la couleur à clarté constante. Deux paires tombaient sous AA en
  libellule clair : bouton primaire à 4,24:1 (extrémité claire de son dégradé)
  et lien à 2,97:1. Chaque couleur transformée est désormais ramenée à la
  luminance de l'originale, ce qui préserve tous les ratios par construction ;
  les mêmes paires montent à 7,15:1 et 7,45:1.

- **Le fil de conversation ne défilait pas** quand il dépassait la hauteur du
  panneau : `justify-content: flex-end` sur un conteneur en `overflow: auto`
  fait déborder le contenu au-dessus de la zone scrollable, hors d'atteinte de
  la barre de défilement. L'ancrage en bas passe désormais par une marge
  automatique sur le premier enfant.

### Changed

- **La typographie responsive passe par les tokens WDS.** Les tailles de la
  maquette (titre 62/48/38 px, radius 6 px) sont exactement les valeurs de
  `--wel-sem-font-sizes-display-2xl` et `--wel-sem-border-radius-container-low`
  selon les breakpoints du thème : aucune media query de texte n'est écrite,
  seules les grilles et les marges en ont.
- `lib/articles.ts` porte désormais un surtitre et un visuel par article ;
  `ArticlesSection` rend les deux grilles de la maquette.

### Removed

- `SiteFooter`, `HeaderSubtitle`, `HeroIllustration` et `MessageBubble` : la
  maquette ne les utilise plus. Le panneau de conversation n'affiche pas
  d'avatar, `PersonaGlyph` n'est donc plus référencé (conservé sur demande).
- Clés i18n devenues sans emploi : `subtitle`, `welcome`, `placeholder`,
  `send`, `newChat`, `articlesTitle`, `readOnLinkedIn`, `footerEmail`.

- **Le prompt caching devient spécifique à Anthropic.** Le provider Mistral
  n'expose aucun breakpoint de cache : sous `CHAT_PROVIDER=mistral`, les
  ~22 000 tokens du prefix stable (identité + garde-fous + base de
  connaissance) repartent en entier à chaque requête. Sur le tier gratuit
  c'est du quota, pas du coût — environ 45 000 requêtes par mois. Le
  breakpoint `cacheControl` n'est plus posé que sur le chemin Anthropic.
- `.env.example` documente les deux providers ; `CHAT_MODEL` est désormais
  relatif au `CHAT_PROVIDER` actif.

- Article « entreprise traumatisée » remplacé par la **v2 enrichie** (docx),
  nettoyée des notes de travail et annotations de relecture — dans la base de
  connaissance et le bloc Articles.
- La page devient scrollable (héro → chat à hauteur fixe → articles → footer) ;
  suppression des anciens toggles chips au profit de la SettingsBar.

- **i18n FR/EN (M4)** : dictionnaire maison typé (`lib/i18n.ts`), `LangToggle`
  (UI + `<html lang>` + langue du bot au message suivant), hook partagé
  `useSettings` (persona/langue/mode synchronisés entre tous les composants via
  un événement), sous-titre et libellés localisés. Les modulateurs de
  personnalité et questions suggérées FR/EN étaient en place depuis M1.

- **Theming des 3 personas (M3)** : `scripts/build-themes.mjs` génère un thème
  complet par persona depuis le template WDS — transformation des couleurs par
  règles de teinte HSL (luminance préservée → contrastes light/dark intacts,
  teintes sémantiques rouge/vert/jaune conservées), remplacement des familles
  de polices, overrides de variables, rescope `[data-persona]` ×
  `[data-color-mode]` (6 combinaisons).
- Fonts par persona via `next/font` : Fraunces + Nunito Sans (Ours),
  Cormorant Garamond + Work Sans (Corneille), Press Start 2P + VT323
  (Libellule).
- `PersonaSwitcher` (radiogroup) sur l'accueil et `/dev/kit` ; le chat suit le
  persona actif en direct (questions suggérées, avatar, voix au prochain
  message).
- Libellule rétro/16-bit via le contrat : radius 0, ombres dures sans flou,
  corps de texte agrandi ; extras hors contrat minimes (`persona-extras.css` :
  pixelated, bordures 2px).
- Règle tokens documentée : le CSS applicatif ne consomme que `--wel-sem-*` /
  `--wel-comp-*` (jamais prim/bsem/bcomp).

- **Base de connaissance réelle (M2)** : bio, expertise, philosophie, façon de
  travailler, FAQ et tone of voice curés depuis l'export Notion, le profil
  LinkedIn (PDF) et les articles ; 6 fiches projets (Accor WDS, Jems ×2,
  SIAAP, Gaumont, AI Persona) ; 5 articles complets dans `content-library/`.
- **Prompt caching Anthropic** : la partie stable du system prompt (KB) porte
  un breakpoint `cacheControl` — ~90 % d'économie d'input dès la 2e requête,
  partagée entre les 6 combinaisons persona×langue.
- `docs/eval-questions.md` : 20 golden questions (faits, pièges, ton, langues)
  et `docs/test-plan.md` : checklists de validation par milestone.

### Changed

- Modèle du chat par défaut du projet : `claude-haiku-4-5` (maîtrise des
  coûts, choix utilisateur) — configurable via `CHAT_MODEL`.

- **Chat streaming (M1)** : route `/api/chat` (Vercel AI SDK v7 → Anthropic,
  modèle configurable via `CHAT_MODEL`), UI de chat complète (bulles WDS,
  composer, questions suggérées, skeleton, erreurs), bornes serveur
  (message ≤ 2000 caractères, historique ≤ 30 messages, sortie ≤ 1500 tokens).
- Assemblage du system prompt (`lib/prompt.ts`) : identité + garde-fous
  (ancrage factuel strict, rôle, confidentialité) + base de connaissance
  balisée + modulateur de persona + langue — ordre pensé pour le prompt caching.
- Définition des 3 personas (`personas/*.json`) : modulateur de ton et
  questions suggérées FR/EN pour Ours 🐻, Corneille 🐦‍⬛, Libellule ✨.
- `knowledge/` : structure de la base de connaissance (bio placeholder,
  `_meta.md` avec les règles d'édition).
- Page `/dev/kit` : audit visuel des composants WDS (l'accueil devient le chat).

### Socle M0

- Socle Next.js 16 (App Router, TypeScript) sans Tailwind — le styling repose
  entièrement sur le contrat de variables `--wel-*`.
- `scripts/install-welds.mjs` : extraction locale des assets WDS (thème
  brandbook + 12 composants CSS) vers `styles/welds-src/`, dossier **gitignoré**
  — l'IP Accor n'entre jamais dans l'historique git.
- Page démo M0 : boutons, champ de saisie, messages et chips WDS.
- Toggle light/dark via l'attribut `data-color-mode` (natif au thème WDS),
  persisté en localStorage avec script anti-flash.
- Config `outputFileTracingIncludes` pour embarquer la future base de
  connaissance dans les functions Vercel.
- Docs du socle : README (setup Windows), `.env.example`, template de PR
  imposant la règle d'or (branche dédiée + CHANGELOG + tests).
