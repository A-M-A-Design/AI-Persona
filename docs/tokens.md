# 1.0.0_AMaDesignTokens

L'export de tokens du portfolio, dérivé de l'export Accor
`2.2.2_AccorDesignTokens` (zip gitignoré, IP Accor).

| | |
| --- | --- |
| **Source committée** | `tokens/` — 16 fichiers, 793 Ko |
| `npm run tokens:build` | (re)construit `tokens/` depuis le zip Accor |
| `npm run tokens:check` | vérifie qu'il redonne exactement `styles/generated/*.css` |
| `npm run tokens:pack` | emballe `1.0.0_AMaDesignTokens_<date>_<heure>.zip` |

Le **zip** reprend la forme de l'export Accor, dossiers compris : il s'importe
tel quel dans Tokens Studio. C'est un artefact rebuildable, gitignoré comme tous
les zips — la source de vérité reste le dossier `tokens/`. `tokens:pack` relance
`tokens:check` avant d'emballer et refuse d'écrire s'il échoue : distribuer un
paquet dont personne n'a vérifié la non-régression n'aurait pas de sens.

## Ce que c'est, et ce que ce n'est pas encore

C'est un **artefact parallèle**. Les thèmes servis au navigateur —
`styles/generated/*.css` — restent produits par `scripts/build-themes.mjs` à
partir du `theme.css` du paquet WDS installé. `tokens/` ne les alimente pas
encore ; `tokens:check` prouve seulement que les deux chaînes coïncident.

En revanche le **contrat CSS a basculé** : `--ama-*` est désormais la source, et
`--wel-*` une couche d'alias. Voir « La double émission » plus bas.

## La double émission

```css
[data-persona="ours"][data-color-mode="dark"] {
  --ama-sem-color-surface: #0a0702;
  --wel-sem-color-surface: var(--ama-sem-color-surface);
}
```

Le CSS applicatif (`app/`, `components/`, `persona-extras.css`) consomme
**`--ama-*` uniquement**. `--wel-*` n'existe plus que pour
`styles/welds-src/components.css`, régénéré par `npm run welds:install` et qui
consomme `var(--wel-…)` **en dur** : on ne peut pas le migrer, seulement le
remplacer par des composants réécrits. Cette couche disparaîtra ce jour-là.

**L'alias est émis dans le bloc même où la source est déclarée**, jamais une
seule fois sur `:root`. Ce n'est pas une précaution théorique : une propriété
personnalisée est substituée sur l'élément qui la déclare, donc un alias posé à
la racine serait figé sur la valeur qui y règne. Or `ArticleCard` porte
`data-persona` et `data-color-mode="dark"` sur un **descendant** — une card
sombre dans une page claire. Un alias unique à la racine leur ferait toutes
perdre leur thème. `tokens:check` refuse cette situation, et le test de mutation
le vérifie.

Coût de la couche : **210 → 568 Ko brut, 23 → 50 Ko gzip** pour les trois
thèmes. Temporaire, et c'est la moitié du poids qui part avec elle.

## La chaîne

Inchangée par rapport au WDS, au préfixe près :

```
ama.sem.color.surface → {ama.web.bSem.color.light.surface} → {ama.prim.color.grey.100}
 colorModes/light.json       brands/<avatar>.json                primitives/<avatar>.json
```

| Dossier | Contenu | Dépend de l'avatar |
| --- | --- | --- |
| `primitives/numbers.json` | `ama.prim.sizing.*` | non |
| `primitives/<avatar>.json` | `ama.prim.color.*`, **teintées** | oui |
| `brands/<avatar>.json` | `ama.web.bSem.*`, `ama.web.bComp.*` | oui (polices, overrides) |
| `colorModes/{light,dark}.json` | `ama.sem.*`, `ama.comp.*` | non |
| `breakpoints/*.json` | `ama.sem.*`, `ama.comp.*` | non |

Les trois marques — `ours`, `corneille`, `libellule` — dérivent toutes de
`brands/brandbook`, la seule des quatorze marques Accor retenue : c'est celle
que reflète le `theme.css` installé. Les treize autres, et les primitives qui
leur étaient propres, ne sont pas reprises.

## Où vit la couleur de l'avatar

**Uniquement dans les primitives.** Les couches d'alias et sémantique sont
identiques d'un avatar à l'autre.

C'est possible parce que la teinte de `scripts/lib/persona-color.mjs` est une
fonction pure de la couleur : teinter les primitives puis résoudre la chaîne
donne exactement le même résultat que résoudre puis teinter — ce que fait
`build-themes.mjs` sur un `theme.css` déjà aplati. Les deux pipelines partagent
littéralement la même fonction, et c'est la condition de la vérification.

La transformation ramène chaque couleur à la **luminance relative WCAG** de son
origine : les ratios de contraste du système sont préservés par construction,
pour toutes les paires texte/fond à la fois.

## La vérification

`npm run tokens:check` résout la chaîne complète pour **3 avatars × 2 modes ×
5 breakpoints** et compare chaque valeur à la variable CSS correspondante de
`styles/generated/*.css`. Toute divergence fait échouer la commande.

```
4875 valeurs comparées · 0 divergence(s) · 0 variable(s) CSS sans token
6 primitive(s) propres à AMa, déclarées et hors comparaison
4875 alias --wel-* vérifiés dans le bloc de leur source
```

Le préfixe comparé est réglable par `TOKENS_CSS_PREFIX` (`ama` par défaut) :
c'est ce qui a permis de vérifier la bascule du contrat sans réécrire l'oracle.

Le vérificateur ne partage **aucun code** avec le générateur, pas même la
transformation de teinte : il relit le CSS et refait la résolution de son côté.
Un oracle qui importerait le générateur validerait ses propres erreurs.

Il vérifie les deux sens : aucune variable `--wel-*` du CSS généré ne doit
rester sans token qui la produise. Les seules exceptions sont une liste fermée
de six primitives (voir plus bas).

**Il a été testé par mutation** : décaler d'une unité une primitive de couleur
lève 50 divergences par propagation, et chaque zone authorée à la main — nuance
sombre du `surface-alternative`, ré-aliasage des liens sombres, overrides de la
libellule — est détectée individuellement. Refaire ce test après toute retouche
du vérificateur : un oracle qui ne peut plus échouer ne protège plus de rien.

## Les quatre écarts assumés

Tout le reste est du renommage. Ces quatre points sont les seules décisions.

### 1. `surface-alternative`, absent du paquet installé

Le token existe dans l'export Accor mais pas dans le `theme.css` livré ici —
`build-themes.mjs` l'injecte déjà, en rattrapage local du contrat de tokens.

- **Clair** : `{ama.prim.color.tropos.97}` = `#F5F6FF`, la valeur brandbook, soit
  exactement ce qu'injecte `build-themes.mjs`. Aucun écart.
- **Sombre** : l'export Accor donne au token la valeur exacte de `surface` — la
  barre ne s'y détacherait que par son ombre. On dérive donc une nuance au même
  écart de contraste qu'en clair (1,076), portée par une primitive nouvelle,
  `ama.prim.color.navalGrey.6`. C'est **la seule valeur authorée par AMa** de
  tout l'export ; son numéro suit la convention Accor, la clarté L\* CIE, et le
  générateur échoue si les deux cessent de correspondre.

Ces deux primitives n'existent pas dans le CSS généré — `tropos.97` parce que
rien ne la référence dans le `theme.css` installé, `navalGrey.6` parce qu'elle
est nouvelle. Elles forment la liste `AMA_ONLY_PRIMITIVES` du vérificateur : six
entrées, soit deux par avatar. La couche que l'application consomme réellement —
`sem` et `comp`, dont `--wel-sem-color-surface-alternative` — reste comparée
intégralement.

### 2. Les liens en mode sombre, figés sur la production

Le paquet WDS installé donne au lien sombre survolé une couleur **plus sombre**
qu'au repos, et à l'état pressé une couleur d'une autre famille. L'export 2.2.2
corrige les deux. Le critère du chantier étant la non-régression stricte, la
chaîne `ama` est réalignée sur ce que le site affiche aujourd'hui :

| token | export 2.2.2 | retenu (= production) |
| --- | --- | --- |
| `bSem.color.dark.hover.link` | `tropos.84` (`#BED2FF`) | `tropos.49` (`#2A71DB`) |
| `bSem.color.dark.pressed.link` | `tropos.64` (`#629AFF`) | `royalBlue.65` (`#9492FF`) |

Un simple ré-aliasage vers des primitives existantes : aucune valeur littérale
n'est introduite. **À lever au profit des valeurs 2.2.2** lors de la réécriture
des composants — c'est un bug Accor délibérément conservé, pas un choix de
design.

### 3. Les chemins réalignés sur les noms de variables

Deux endroits où le chemin Accor ne donne pas le nom de variable émis :

- les primitives alpha, rangées sous `alpha.<opacité>.<famille>.<n>` quand le
  CSS les nomme `alpha-<étiquette>-<opacité>` — l'ordre s'inverse, et la famille
  devient `white` ou `black` quand la base est un extrême ;
- `leg.blueGrey.brandbook.96`, seul segment en un mot que le CSS coupe quand
  même en `brand-book`.

Les chemins sont alignés sur la sortie CSS, définitions **et** références. Le nom
de variable se déduit alors du chemin sans aucune exception — c'est ce qui rend
la comparaison mécanique possible.

### 4. Les `font-styles`, rétablis comme tokens

Le `theme.css` émet quatorze variables `font-styles` que l'export Accor ne porte
pas : elles n'existent que dans son générateur CSS. Elles sont rétablies en
calquant l'arborescence de `fontWeights` — mêmes feuilles, donc mêmes noms de
variables. Seuls les sous-titres sont en italique.

## Les overrides des avatars

`personas/mappings/<avatar>.map.json` porte les réglages de la libellule (coins
durs, ombres arcade sans flou, échelle typographique rétro) sous forme de motifs
de variables CSS, parce que `build-themes.mjs` opère sur du CSS.

Le générateur de tokens **relit la même liste** : pour chaque motif il retrouve
les tokens `sem`/`comp` dont le nom de variable correspond, remonte d'un cran
leur alias, et écrit dans `bSem`/`bComp`. La valeur reste authorée à un seul
endroit, et les deux pipelines ne peuvent pas diverger.

## Descriptions

Les `$description` de l'export Accor sont conservées telles quelles, sur
décision explicite : l'export reste auto-documenté et lisible dans Tokens
Studio. Ce sont des textes rédigés par Accor, et ils entrent donc dans
l'historique git — c'est la seule entorse consentie à la règle « IP Accor jamais
dans git », qui vaut toujours pour `styles/welds-src/` et les zips.

## Reste à faire

- **Retirer la couche d'alias `--wel-*`** quand les composants WDS seront
  réécrits : supprimer `addWelAliases` de `build-themes.mjs` et l'audit
  correspondant de `check-tokens.mjs`. C'est la moitié du poids des thèmes.
- Brancher le pipeline sur `tokens/` — les thèmes sortent encore du `theme.css`
  WDS, pas de l'export.
- Retirer les familles de primitives héritées (`ama.prim.color.leg.*`, 130
  tokens) une fois qu'aucun composant ne les référence. Elles sont conservées
  pour l'instant parce que le CSS généré les émet, et que le vérificateur exige
  qu'aucune variable ne reste sans token.
- Lever le figeage des liens sombres (§2).
