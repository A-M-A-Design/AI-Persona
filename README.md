# AI Persona — Arthur Mathon

Portfolio conversationnel : un recruteur ouvre une URL et discute avec la
**version IA d'Arthur** (Design System Lead/Product/Ops) pour découvrir son
parcours, ses projets et sa façon de travailler. Trois personas switchables —
🐻 Ours (chaleureux, défaut), 🐦‍⬛ Corneille (mystérieux), ✨ Libellule
(rétro 16-bit) — en light/dark et FR/EN.

L'interface est elle-même une démo de compétence design system : chaque persona
est un thème complet respectant un contrat de ~870 variables CSS (`--wel-*`),
sur le modèle du theming multi-marques d'Accor.

## Prérequis (Windows)

- Node ≥ 20 (`node --version`)
- Le zip `welds-mcp-v3.zip` à la racine du projet (assets WDS — **non commité**)
- Une clé API : Mistral ([console.mistral.ai](https://console.mistral.ai/api-keys), tier
  gratuit) ou Anthropic ([console.anthropic.com](https://console.anthropic.com)) —
  le provider se choisit avec `CHAT_PROVIDER`

## Setup

```powershell
npm install
npm run welds:install        # extrait les assets WDS vers styles/welds-src/ (gitignoré)
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
| `npm run welds:install` | Extraction des assets WDS depuis le zip |
| `npm run themes:build` | Génération des 3 thèmes persona (M3) |
| `npm run tokens:build` | Construction de `tokens/` — l'export `1.0.0_AMaDesignTokens` ([doc](docs/tokens.md)) |
| `npm run tokens:check` | Vérification que l'export de tokens redonne exactement `styles/generated/*.css` |
| `npm run tokens:pack` | Emballage de `tokens/` en `1.0.0_AMaDesignTokens_<date>.zip`, importable dans Tokens Studio |
| `npm run a11y` | Audit d'accessibilité complet : contraste puis balayage axe-core |
| `npm run a11y:contrast` | Audit de contraste WCAG AA des thèmes générés |
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

#### Une vague de timeouts à 30,0 s n'est pas une régression

`reuseExistingServer: true` récupère le serveur de développement déjà lancé — y
compris celui d'un run précédent, avec son cache périmé. Après un changement de
CSS ou de configuration un peu large, cela se manifeste par une trentaine
d'échecs groupés sur les pages articles et les tests de thème, **tous à
exactement 30,0 s**, ce qui ressemble trait pour trait à une régression du code.

Le signal, c'est la durée ronde et identique, pas le contenu des assertions.
Avant de conclure quoi que ce soit :

```bash
# le PID du port 3000, puis Stop-Process — TaskStop ne tue que le wrapper npm
rm -rf .next
NODE_EXTRA_CA_CERTS="$HOME/.certs/corporate-ca.pem" npx playwright test
```

Vécu le 2026-08-12 pendant la bascule vers `--ama-*`, qui triplait le poids des
thèmes : 252 passés au lieu de 287, alors que le CSS était valide et l'export
vérifié. Après ménage, 287 passés en 1,2 min.

### Contraste des thèmes

Les thèmes sont obtenus par rotation de teinte du template WDS. Chaque couleur
transformée est **ramenée à la luminance relative WCAG de l'originale** : les
ratios de contraste du système sont donc préservés par construction, pour
toutes les paires texte/fond à la fois.

Conserver la clarté HSL ne suffirait pas — le vert pèse 0,7152 dans la
luminance relative contre 0,0722 pour le bleu, si bien qu'une rotation
bleu → cyan éclaircit fortement la couleur à clarté constante et fait chuter
le contraste d'un texte clair posé dessus.

Après toute modification de `personas/mappings/*.map.json`, relancer
`npm run themes:build` puis `npm run a11y:contrast` : le script échoue (code 1)
si une paire passe sous 4,5:1, dégradés et fonds semi-transparents compris.

## Accessibilité

Cible **WCAG 2.2 AA**. L'audit, les constats corrigés, ce que le lecteur
d'écran annonce à chaque étape et la procédure de vérification manuelle sont
dans [`docs/accessibilite.md`](docs/accessibilite.md).

`npm run a11y` enchaîne le contrôle de contraste et le balayage axe-core. À
retenir : sur ce site, **axe-core seul ne détectait aucune des anomalies de
l'audit** avec les règles WCAG. Le balayage ferme la porte aux régressions
mécaniques, il ne remplace pas la lecture du code ni la passe manuelle.

## Règle d'or (workflow git)

1. **Jamais de commit direct sur `main`** — une branche par changement :
   `feat/<scope>-<sujet>`, `fix/…`, `kb/…` (base de connaissance), `chore/…`, `docs/…`
2. **Chaque PR met à jour le CHANGELOG** (section `[Unreleased]`, format Keep a Changelog)
3. Commits conventionnels : `feat(chat): …`, `kb(projects): …` — scopes : `chat`, `theme`, `kb`, `i18n`, `ui`, `infra`, `docs`
4. **IP Accor** : `styles/welds-src/`, les zips et PDF sont gitignorés et ne doivent jamais apparaître dans un diff
5. **Tokens** : le CSS applicatif ne consomme que `--wel-sem-*` et
   `--wel-comp-*` — jamais les primitives `--wel-prim-*` ni les alias
   `bsem`/`bcomp` (couches internes du système). Les fichiers de thème
   *générés* définissent toutes les couches : c'est leur rôle.

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
- `styles/` — `welds-src/` (extrait localement, gitignoré) · `generated/` (thèmes persona)
- `scripts/` — outillage Node (`.mjs`)
- `docs/` — plan de test et golden questions
