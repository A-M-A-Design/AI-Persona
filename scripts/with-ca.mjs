/**
 * Lance une commande avec le certificat racine de l'entreprise chargé.
 *
 * Derrière l'interception TLS d'Accor, `fetch` côté Node échoue avec
 * `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` tant que `NODE_EXTRA_CA_CERTS` ne pointe
 * pas le bundle. L'API de chat répond alors `error` sans autre explication, et
 * le symptôme est déroutant : curl passe, le navigateur passe, seul le serveur
 * échoue.
 *
 * La variable ne peut pas venir de `.env.local` : Node lit `NODE_EXTRA_CA_CERTS`
 * au démarrage du process, bien avant que Next ne charge le moindre fichier
 * d'environnement. Elle doit donc être présente dans l'environnement du
 * process — d'où ce lanceur, qui la pose puis délègue.
 *
 * Sans bundle sur la machine, la commande est lancée telle quelle : le
 * dépôt reste utilisable hors du réseau de l'entreprise et en CI.
 *
 * Usage : node scripts/with-ca.mjs <commande> [args…]
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DEFAUT = join(homedir(), ".certs", "corporate-ca.pem");

const [commande, ...args] = process.argv.slice(2);
if (!commande) {
  console.error("usage : node scripts/with-ca.mjs <commande> [args…]");
  process.exit(2);
}

const env = { ...process.env };
// Un réglage explicite de l'utilisateur l'emporte, y compris s'il pointe
// ailleurs : on ne fait que combler l'absence.
if (!env.NODE_EXTRA_CA_CERTS && existsSync(DEFAUT)) {
  env.NODE_EXTRA_CA_CERTS = DEFAUT;
  console.log(`• certificat d'entreprise chargé depuis ${DEFAUT}`);
} else if (!env.NODE_EXTRA_CA_CERTS) {
  console.log(
    "• aucun bundle de certificats trouvé — si le chat répond « error », voir la section TLS du README",
  );
}

// `shell: true` : sur Windows, les binaires de node_modules/.bin sont des
// scripts .cmd, que spawn ne sait pas exécuter directement.
const enfant = spawn(commande, args, { stdio: "inherit", shell: true, env });

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => enfant.kill(signal));
}

enfant.on("exit", (code, signal) => {
  // Le code de sortie doit remonter tel quel : Playwright et la CI en dépendent.
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
