import SettingsBar from "../../../components/header/SettingsBar";
import QuickAccess from "../../../components/QuickAccess";

// Page kit (interne, non publiée) : audit visuel des composants du site.
//
// Elle avait un `<main>` mais pas d'`id="contenu"` : le lien d'évitement que le
// layout y posait visait donc une ancre inexistante — un lien qui ne menait
// nulle part, sur la seule page qui n'est pas auditée. Depuis que l'accès rapide
// est rendu par chaque page, elle n'en avait plus du tout. Les deux sont réglés.
export default function DevKit() {
  return (
    <>
      <QuickAccess />
      <main className="demo" id="contenu" tabIndex={-1}>
        <div className="demo__header">
          <h1>Kit — composants du site</h1>
        </div>
        <SettingsBar />

        <section>
          <h2>Boutons</h2>
          <button type="button" className="ama-button ama-button--primary">
            Primaire
          </button>
          <button type="button" className="ama-button ama-button--secondary">
            Secondaire
          </button>
          <button type="button" className="ama-button ama-button--tertiary">
            Tertiaire
          </button>
        </section>

        <section>
          <h2>Champ de saisie</h2>
          <div className="ama-input-text" style={{ width: "100%" }}>
            <label className="ama-input-text__label" htmlFor="demo-input">
              Votre question
            </label>
            <div className="ama-input-text__wrapper">
              <input
                id="demo-input"
                className="ama-input-text__input"
                placeholder="Ex. : parle-moi de ton expérience chez Accor"
              />
            </div>
          </div>
        </section>

        <section>
          <h2>Messages</h2>
          <div className="ama-message ama-message--neutral" style={{ width: "100%" }}>
            <div className="ama-message__header">
              <p className="ama-message__text">Message neutre (bulle du bot)</p>
            </div>
          </div>
          <div className="ama-message ama-message--accent" style={{ width: "100%" }}>
            <div className="ama-message__header">
              <p className="ama-message__text">Message accent (bulle utilisateur)</p>
            </div>
          </div>
          <div className="ama-message ama-message--warning" style={{ width: "100%" }}>
            <div className="ama-message__header">
              <p className="ama-message__text">Message d&apos;erreur</p>
            </div>
          </div>
        </section>

        <section>
          <h2>Chips</h2>
          <button type="button" className="ama-chip">Ton parcours</button>
          <button type="button" className="ama-chip">Tes projets</button>
          <button type="button" className="ama-chip ama-chip--selected">
            Ta façon de travailler
          </button>
        </section>

        <section>
          <h2>Skeleton</h2>
          <div className="ama-skeleton chat__skeleton" />
        </section>
      </main>
    </>
  );
}
