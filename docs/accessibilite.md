# Accessibilité

Audit du 12 août 2026, cible **WCAG 2.2 niveau AA**. Couvre l'accueil, les
pages articles et le panneau de conversation, sur les trois personas, les deux
modes de couleur et quatre largeurs (1440 / 1000 / 375 / 320).

La page `/dev/kit` est hors périmètre : elle n'est pas publiée.

## Ce que l'outillage couvre

| Commande | Ce qu'elle vérifie |
| --- | --- |
| `npm run a11y:contrast` | Toutes les paires texte/fond du thème, 3 personas × 2 modes |
| `npx playwright test e2e/a11y.spec.ts` | Balayage axe-core + tests nominatifs, 4 largeurs |

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

## Ce que le lecteur d'écran annonce

Relevé sur l'arbre d'accessibilité réel du navigateur, après correction.

### Accueil, à l'ouverture

```
lien « Aller au contenu »
bannière
  liste déroulante « Type d'avatar » — Ours sélectionné
  liste déroulante « Langue » — FR sélectionné
  bouton « Mode couleur — Sombre »
contenu principal
  titre niveau 1 « Bonjour, je suis Arthur ! »
  paragraphe « Designaut passionné de Design System, Product et Operations »
  zone de texte « Votre question »
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
5. Échap ferme, le focus revient sur l'élément qui avait ouvert le panneau.

Pendant toute la conversation, la page derrière est `inert` : ni tabulation, ni
exploration.

### Ouvrir un article

Le bouton d'accueil de la barre annonce « lien, Retour à l'accueil ». La page
article présente son titre en niveau 1, ses sections en niveau 2, puis la
région « Autres articles » avec sa pagination : « bouton Articles précédents
(indisponible) », « Page 1 sur 2 », « bouton Articles suivants ».

Le corps d'un article non traduit porte `lang="fr"` même quand l'interface est
en anglais : la synthèse vocale ne lit pas du français avec une voix anglaise.

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
   carousel et des questions suggérées doivent être instantanés.
