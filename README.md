# AI Persona — Arthur Mathon

Portfolio conversationnel : un recruteur ouvre une URL et discute avec la
**version IA d'Arthur** (Design System Lead/Product/Ops) pour découvrir son
parcours, ses projets et sa façon de travailler. Trois personas switchables —
🐻 Ours (chaleureux, défaut), 🐦‍⬛ Corneille (mystérieux), ✨ Libellule
(rétro 16-bit) — en light/dark et FR/EN.

L'interface est elle-même une démo de compétence design system : chaque persona
est un thème complet respectant un contrat de ~1600 variables CSS (`--ama-*`),
résolu depuis l'export de tokens [`tokens/`](docs/tokens.md), sur le modèle du
theming multi-marques d'Accor.

Les composants sont **écrits dans ce dépôt** ([`styles/components/`](styles/components/)),
sur ce même contrat : le site ne dépend plus d'aucun CSS extrait, et se construit
donc depuis le seul dépôt.

## Prérequis (Windows)

- Node ≥ 20 (`node --version`)
- Le zip `welds-mcp-v3.zip` à la racine du projet (thème WDS — **non commité**).
  Facultatif pour faire tourner le site : il ne sert qu'à `npm run tokens:check`,
  qui compare les thèmes générés à une référence obtenue par un autre chemin.
  `npm run dev` et `npm run build` n'en dépendent pas.
- Une clé API : Mistral ([console.mistral.ai](https://console.mistral.ai/api-keys), tier
  gratuit) ou Anthropic ([console.anthropic.com](https://console.anthropic.com)) —
  le provider se choisit avec `CHAT_PROVIDER`

## Setup

```powershell
npm install
npm run welds:install        # facultatif : thème WDS vers styles/welds-src/ (gitignoré)
Copy-Item .env.example .env.local   # puis renseigner la clé du provider choisi
npm run dev                  # http://localhost:3000
```

### Derrière un proxy d'entreprise

Sur un poste dont le TLS est intercepté (cas du réseau Accor), les appels
sortants de Node échouent avec `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` : `curl`
utilise le magasin de certificats Windows, Node embarque le sien. Le chat
renvoie alors une erreur générique alors que la clé API est valide.

Exporter le magasin Windows une fois, dans `~/.certs/corporate-ca.pem` :

```powershell
$sb = New-Object System.Text.StringBuilder
foreach ($s in @("Cert:\LocalMachine\Root","Cert:\CurrentUser\Root","Cert:\LocalMachine\CA")) {
  Get-ChildItem $s -ErrorAction SilentlyContinue | ForEach-Object {
    [void]$sb.AppendLine("-----BEGIN CERTIFICATE-----")
    [void]$sb.AppendLine([Convert]::ToBase64String($_.RawData,'InsertLineBreaks'))
    [void]$sb.AppendLine("-----END CERTIFICATE-----")
  }
}
New-Item -ItemType Directory "$HOME\.certs" -Force | Out-Null
Set-Content "$HOME\.certs\corporate-ca.pem" $sb.ToString() -Encoding ascii
```

C'est tout : `dev`, `build` et `start` passent par `scripts/with-ca.mjs`, qui
pose `NODE_EXTRA_CA_CERTS` sur ce chemin s'il existe et si la variable n'est
pas déjà définie, puis délègue. Le chat fonctionne donc après un simple
`npm run dev`, depuis n'importe quel terminal.

Deux choses à savoir :

- **`.env.local` ne peut pas porter cette variable.** Node lit
  `NODE_EXTRA_CA_CERTS` au démarrage du process, bien avant que Next ne charge
  le moindre fichier d'environnement. D'où le lanceur.
- **Les autres outils Node ne sont pas couverts** : `npm install`, un
  `node script.mjs` lancé à la main, ou un serveur MCP échoueront toujours.
  Pour les couvrir tous, rendre la variable permanente :
  `setx NODE_EXTRA_CA_CERTS "$HOME\.certs\corporate-ca.pem"`, puis rouvrir le
  terminal. Le lanceur respecte alors ce réglage sans l'écraser.

Sans bundle sur la machine, les commandes s'exécutent inchangées : le dépôt
reste utilisable hors du réseau de l'entreprise.

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` / `start` | Build et serveur de prod |
| `npm run check` | Vérification TypeScript (`tsc --noEmit`) |
| `npm run welds:install` | Extraction du thème WDS depuis le zip — oracle de `tokens:check`, pas une dépendance de build |
| `npm run css:check` | Vérifie que le CSS applicatif ne lit que des tokens `sem`/`comp` définis dans les 3 thèmes |
| `npm run themes:build` | Génération des 3 thèmes persona depuis `tokens/` |
| `npm run tokens:build` | Construction de `tokens/` — l'export `1.0.0_AMaDesignTokens` ([doc](docs/tokens.md)) |
| `npm run tokens:check` | Compare les thèmes servis à une référence dérivée du WDS par un autre chemin |
| `npm run tokens:pack` | Emballage de `tokens/` en `1.0.0_AMaDesignTokens_<date>.zip`, importable dans Tokens Studio |
| `npm run a11y` | Audit d'accessibilité complet : contraste, balayage axe-core, **et l'audit systématique** |
| `npm run a11y:contrast` | Contraste WCAG AA des thèmes, **et APCA en parallèle** (informatif) |
| `npm run test:e2e` | Tests Playwright (1440 / 1000 / 375, plus 320 pour l'accessibilité) |
| `npm run shots` | Captures d'écran dans `e2e/__screenshots__/` (`-- --all` pour 3 personas × 2 modes × 3 largeurs) |

### Tests end-to-end

Première utilisation : `npx playwright install chromium`.

Les tests visent `http://localhost:3000` et **non** `127.0.0.1` : Next 16 restreint
les origines autorisées en développement et renvoie 403 sur `/_next/*` aux
autres. Les chunks ne se chargent alors pas, la page n'hydrate jamais, et tout
paraît inerte sans qu'aucune erreur ne soit visible côté serveur.

Les réponses du chat sont simulées (`e2e/helpers.ts`) : les tests ne consomment
pas le quota du provider et ne dépendent pas d'une réponse non déterministe.

#### Une vague de timeouts à 30,0 s n'est presque jamais une régression

Le signal, c'est la **durée ronde et identique**, pas le contenu des assertions.
Trois causes le produisent, et deux d'entre elles sont l'inverse l'une de
l'autre.

**Le cache périmé.** `reuseExistingServer: true` récupère le serveur de
développement déjà lancé, y compris celui d'un run précédent. Après un
changement de CSS un peu large, une trentaine d'échecs groupés sur les pages
articles et les tests de thème.

**Le cache vide — l'inverse, et le piège.** Vider `.next` puis lancer la suite
aussitôt **provoque** l'échec : le premier run paie la compilation de
`/articles/[slug]` pendant que seize workers tapent dessus. Il faut donc
**préchauffer les routes** avant de mesurer quoi que ce soit.

**Trop de modules CSS importés depuis `app/layout.tsx`.** Six imports séparés
faisaient passer la suite de 1,1 à 2,8 minutes et échouer 21 tests. D'où
`styles/components/index.css`, qui n'en présente qu'un.

La séquence qui donne un résultat exploitable :

```bash
# 1. le PID du port 3000, puis Stop-Process — TaskStop ne tue que le wrapper npm
rm -rf .next
npm run dev &                    # attendre « Ready in »
# 2. préchauffer : sans cela, le premier run échoue tout seul
curl -s -o /dev/null localhost:3000/ localhost:3000/articles/roi-design-system
npx playwright test
```

**Et la comparaison qui tranche est la suite complète contre la suite
complète** — jamais un spec isolé. Vécu le 2026-08-13 : 21 tests en échec dans
la suite, les mêmes 21 verts joués seuls. Un spec isolé passe dans les trois cas
ci-dessus ; c'est ce qui rend le symptôme trompeur.

### Contraste des thèmes

Les thèmes sont obtenus par rotation de teinte du template WDS. Chaque couleur
transformée est **ramenée à la luminance relative WCAG de l'originale** : les
ratios de contraste du système sont donc préservés par construction, pour
toutes les paires texte/fond à la fois.

Conserver la clarté HSL ne suffirait pas — le vert pèse 0,7152 dans la
luminance relative contre 0,0722 pour le bleu, si bien qu'une rotation
bleu → cyan éclaircit fortement la couleur à clarté constante et fait chuter
le contraste d'un texte clair posé dessus.

**Vérifié, et pas seulement pour WCAG.** L'invariant est construit sur la
luminance relative *WCAG 2* ; rien ne garantissait a priori qu'il vaille pour
APCA, l'algorithme perceptuel de WCAG 3, qui n'a ni la même fonction de
transfert ni le même modèle. Mesure faite, l'écart de Lc entre les trois
personas est de **0,8 au pire** : la rotation de teinte préserve aussi le
contraste perceptuel.

`npm run a11y:contrast` calcule désormais **les deux en parallèle**. Seul le
ratio WCAG fait échouer la commande — WCAG 3 n'est pas ratifié et APCA est en
phase de finalisation. APCA sert à voir les **divergences**, là où le ratio dit
oui et la perception dit moins :

- **En mode sombre, le texte saisi tombe à Lc −53** pour un ratio de 7,3:1.
  Le seuil APCA usuel d'un texte courant de 16 px est Lc 75. En mode clair, la
  même paire donne Lc 82. C'est la polarité que le ratio ignore : il est
  symétrique, la perception ne l'est pas.

Après toute modification de `personas/mappings/*.map.json`, relancer
`npm run themes:build` puis `npm run a11y:contrast` : le script échoue (code 1)
si une paire passe sous 4,5:1, dégradés et fonds semi-transparents compris.

## Partage et indexation

Rien de tout cela ne se voit à l'écran : un aperçu cassé ne se remarque qu'au
moment où l'on partage un lien, c'est-à-dire trop tard. `e2e/seo.spec.ts` le
vérifie donc par la mesure — y compris que **chaque image annoncée répond
vraiment en 200**, une image absente donnant un aperçu nu sans rien signaler.

| | |
| --- | --- |
| `metadataBase` | déduit de l'environnement (`lib/site.ts`) — sans elle, les URL d'aperçu restent relatives et aucun réseau social ne les suit |
| Image de l'accueil | le héro de l'Ours, persona par défaut |
| Image d'un article | **son propre visuel**, celui de sa card sur l'accueil |
| `/sitemap.xml` | l'accueil et les six articles |
| `/robots.txt` | ouvre le site, ferme `/dev/` et `/api/` |
| JSON-LD | `Person` + `WebSite` sur l'accueil, `Article` sur chaque article |

**Les vraies images plutôt qu'une carte générée** : un aperçu partagé montre
ainsi ce que le lecteur retrouvera en arrivant. Une carte composée à la volée
aurait affiché un visuel que le site ne montre nulle part.

**`/api/` est fermé** : rien à y indexer, et chaque visite de la route de chat
coûte un appel au modèle. Un robot n'a pas à consommer le quota.

**Le JSON-LD dit *qui*, pas seulement *quoi*.** Les balises `og:` disent à un
réseau comment afficher un lien ; les données structurées disent à un moteur
qu'un humain nommé Arthur Mathon exerce un métier précis et signe ces articles.
C'est ce qui relie le site à une personne plutôt qu'à une suite de mots-clés —
l'objet même d'un portfolio. Rien n'y est inventé : tout y figure déjà ailleurs
dans le site, et une donnée structurée qui affirme plus que la page est une
donnée fausse.

Le domaine se pose par `NEXT_PUBLIC_SITE_URL` le jour où il existe. D'ici là,
Vercel fournit le sien et les aperçus fonctionnent dès le premier déploiement.

## Limite de débit

`/api/chat` appelle un modèle payant avec **notre** clé. Sans limite, un script
consomme le quota — ou la facture — en quelques minutes.

Deux fenêtres par adresse IP, qui répondent à deux abus différents :

| Fenêtre | Défaut | Ce qu'elle protège |
| --- | --- | --- |
| Par jour | **30 questions** | l'usage : au-delà, la conversation a dit ce qu'elle avait à dire |
| Par minute | 5 | le quota du provider, qui plafonne à ~2 réponses/minute pour **tous** les visiteurs |

Le second est un **garde-fou, pas un plafond d'usage** : sans lui, une seule
adresse tire ses 30 questions en trois secondes et épuise le quota Mistral du
compte pour tout le monde en même temps. Les deux valeurs sont réglables par
variable d'environnement, sans redéploiement de code.

**Ce que le visiteur lit** — trois messages là où il n'y avait qu'une erreur
générique, parce qu'une limite n'est pas une panne :

- **la minute** : « Patientez une minute, puis réessayez — votre conversation
  reste affichée. » Explicite sur la marche à suivre, et rassurant sur ce qui
  est conservé : un visiteur qui croit avoir tout perdu s'en va au lieu
  d'attendre ;
- **le jour** : le remerciement, puis l'invitation du persona lui-même —
  « On boit un café ? », « Croisons nos chemins », « RDV IRL ? » — et deux vraies
  sorties, LinkedIn et l'e-mail. L'invitation vient de `footerHeading` : pas de
  second texte qui divergerait du pied de page ;
- **une panne** garde son message générique, sans quoi on ferait croire à une
  limite atteinte.

### Upstash, et pourquoi le repli ne suffit pas

Sans `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`, un compteur en
mémoire prend le relais. **Il ne protège pas en production** : sur une
plateforme sans serveur, chaque instance a sa propre mémoire et elles sont
éphémères — un attaquant qui frappe assez vite parle à autant de compteurs
qu'il y a d'instances. Le compteur partagé est la raison d'être d'Upstash, pas
un luxe.

Vérifier la route directement, sans passer par l'interface :

```bash
for i in $(seq 1 7); do
  curl -s -o /dev/null -w "%{http_code} " -X POST localhost:3000/api/chat \
    -H 'Content-Type: application/json' -H 'x-forwarded-for: 203.0.113.7' \
    -d '{"messages":[{"role":"user","parts":[{"type":"text","text":"test"}]}]}'
done   # 200 200 200 200 200 429 429
```

## Accessibilité

Cible **WCAG 2.2 AA**. L'audit, les constats corrigés, ce que le lecteur
d'écran annonce à chaque étape et la procédure de vérification manuelle sont
dans [`docs/accessibilite.md`](docs/accessibilite.md).

`npm run a11y` enchaîne le contrôle de contraste et le balayage axe-core.

**Chaque outil a un angle mort**, et le savoir vaut mieux que le redécouvrir.
Sur ce site, **axe-core n'a signalé aucun des neuf défauts trouvés à l'usage** —
ni ceux de l'audit d'août, ni ceux de la passe au lecteur d'écran du 13.

| Outil | Ce qu'il voit | Son angle mort |
| --- | --- | --- |
| `a11y:contrast` | des **paires de tokens déclarées** | toute couleur que personne n'a déclarée |
| axe-core | les manquements mécaniques du DOM | ce qui est *annoncé*, et dans quel ordre |
| `audit-a11y.spec.ts` | les classes de défauts déjà rencontrées | celles qu'on n'a pas encore vues |

`npx playwright test e2e/audit-a11y.spec.ts` couvre ce que les deux autres
laissent passer : annonces en double, zones mortes au pointeur, taille de cible
(WCAG 2.5.8), structure, contraste forcé, et le **contraste rendu** — chaque
texte visible, sa couleur calculée, son fond composé, quelle que soit l'origine
des couleurs. C'est ce dernier contrôle qui a rattrapé un indice de saisie à
3,86:1, invisible aux deux autres parce que sa couleur venait du navigateur et
n'était donc dans aucune paire.

Le détail, les tolérances et leurs raisons sont dans
[`docs/accessibilite.md`](docs/accessibilite.md).

## Déploiement

Le dépôt se construit seul : aucun asset extrait, aucune dépendance à l'IP
Accor. `npm run build` suffit.

### Variables à poser sur Vercel

| Variable | Obligatoire | Sans elle |
| --- | --- | --- |
| `MISTRAL_API_KEY` | **oui** | le chat renvoie une erreur |
| `UPSTASH_REDIS_REST_URL` | **oui** | la limite de débit ne protège pas (cf. plus haut) |
| `UPSTASH_REDIS_REST_TOKEN` | **oui** | idem |
| `NEXT_PUBLIC_SITE_URL` | non | Vercel fournit son URL ; à poser le jour où un domaine existe |
| `CHAT_PROVIDER` | non | `mistral` par défaut |
| `RATE_LIMIT_PAR_JOUR` / `_PAR_MINUTE` | non | 30 et 5 |

Les cocher pour **Production** *et* **Preview** : une préversion sans clé Upstash
est une route de chat ouverte, sur la même clé de modèle.

### Mesure d'audience

Vercel Analytics et Speed Insights sont montés **en production seulement**.
Laissés inconditionnels, ils chargent en développement un script de débogage
depuis `va.vercel-scripts.com` — deux requêtes vers un tiers à chaque page, y
compris pendant toute la suite de tests, qui n'a aucune raison de dépendre du
réseau. Un test le vérifie (`e2e/seo.spec.ts`).

Ni l'un ni l'autre **ne pose de cookie** ni n'identifie personne : ils comptent
des pages vues et des référents. C'est ce qui dispense d'un bandeau de
consentement. Retirer les deux composants de `app/layout.tsx` suffit à tout
désactiver.

### Après le premier déploiement

1. **Vérifier l'aperçu de partage** en collant l'URL dans un message LinkedIn en
   brouillon : titre, description et image doivent apparaître.
2. **Vérifier la limite de débit** : les journaux Vercel doivent afficher
   `[rate-limit] compteur partagé Upstash` au premier appel. S'ils affichent
   `repli EN MÉMOIRE`, les variables ne sont pas arrivées.
3. **Refaire une passe au lecteur d'écran sur l'URL de production** : en
   développement, Next.js injecte sa surcouche d'outils — un arrêt de tabulation
   de plus et un logo « N » qui n'existent pas en production.

## Règle d'or (workflow git)

1. **Jamais de commit direct sur `main`** — une branche par changement :
   `feat/<scope>-<sujet>`, `fix/…`, `kb/…` (base de connaissance), `chore/…`, `docs/…`
2. **Chaque PR met à jour le CHANGELOG** (section `[Unreleased]`, format Keep a Changelog)
3. Commits conventionnels : `feat(chat): …`, `kb(projects): …` — scopes : `chat`, `theme`, `kb`, `i18n`, `ui`, `infra`, `docs`
4. **IP Accor** : `styles/welds-src/`, les zips et PDF sont gitignorés et ne
   doivent jamais apparaître dans un diff. Le dossier ne porte plus que le thème
   servant d'oracle à `tokens:check` — **rien de ce qu'il contient n'est servi**,
   et le build n'en dépend pas
5. **Tokens** : le CSS applicatif ne consomme que `--ama-sem-*` et
   `--ama-comp-*` — jamais les primitives `--ama-prim-*` ni les alias
   `bsem`/`bcomp` (couches internes du système). Les fichiers de thème
   *générés* définissent toutes les couches : c'est leur rôle. `--wel-*`
   n'existe plus nulle part ([`docs/tokens.md`](docs/tokens.md)).

### Mettre à jour la base de connaissance (rituel)

```powershell
git switch -c kb/maj-projets
# … éditer les fichiers dans knowledge/ …
npm run prompt:size                 # le prompt tient-il encore dans le quota ?
git add knowledge/ ; git commit -m "kb(projects): ajout du projet X"
git push -u origin kb/maj-projets   # puis ouvrir la PR
```

## Le budget du prompt

Toute la base de connaissance part dans le prompt système **à chaque requête**.
Ce n'est pas gratuit : le 2026-08-12, l'ajout de six fiches projet l'a porté à
~25 000 tokens, soit exactement la limite de **25 000 tokens par minute** du
tier gratuit Mistral. Une seule question consommait le quota d'une minute, et le
chat renvoyait `429` une fois sur deux — sans que rien ne l'ait signalé.

`npm run prompt:size` mesure le prompt section par section et **échoue au-delà
de 18 000 tokens estimés**. À lancer après toute modification de `knowledge/`.

Deux leviers quand le compteur monte :

- **Le corps des articles ne voyage plus.** Le prompt n'en porte que la synthèse
  — titre, chapô, idées clés, plan ; le texte intégral se charge à la demande,
  via l'outil `lire_article` déclaré dans la route du chat. Les ~60 000
  caractères d'articles ne coûtent donc plus rien tant que la conversation ne
  porte pas sur l'un d'eux.
- **Le prompt caching, déjà câblé mais inerte.** Le préfixe stable est
  rigoureusement identique pour les six combinaisons persona × langue, et
  `lib/model.ts` pose déjà un `cacheControl` dessus — mais Mistral n'expose
  aucun point de cache, seul Anthropic en tient compte. Passer
  `CHAT_PROVIDER=anthropic` dans `.env.local` suffit à l'activer : ~90 %
  d'économie d'input dès la 2ᵉ requête. Pour un trafic clairsemé, un TTL d'1 h
  (`cacheControl: { type: "ephemeral", ttl: "1h" }`) survit mieux entre deux
  visiteurs que les 5 minutes par défaut.

## Structure

- `app/` — pages Next.js + route API du chat
- `components/` — UI (chat, header, providers)
- `knowledge/` — base de connaissance markdown (la matière du bot)
- `personas/` — définition des 3 personas (ton, questions suggérées, mapping de thème)
- `styles/` — `components/` (les composants du site, `.ama-*`) · `generated/` (thèmes persona) · `welds-src/` (thème WDS extrait localement, gitignoré)
- `e2e/` — Playwright. `a11y.spec.ts` (axe + tests nommés) et `audit-a11y.spec.ts`
  (les classes de défauts trouvées à l'usage) tournent aussi à 320 px
- `scripts/` — outillage Node (`.mjs`)
- `docs/` — accessibilité, tokens, plan de test et golden questions
- `sessions-summary/` — un compte rendu par session, écrit **après** la PR
