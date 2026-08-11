import ColorModeToggle from "../../../components/header/ColorModeToggle";

// Page kit (POC uniquement) : audit visuel des composants WDS.
// En M3 : tous les composants × 3 personas × 2 modes.
export default function DevKit() {
  return (
    <main className="demo">
      <div className="demo__header">
        <h1>Kit — composants WDS</h1>
        <ColorModeToggle />
      </div>

      <section>
        <h2>Boutons</h2>
        <button type="button" className="wel-button wel-button--primary">
          Primaire
        </button>
        <button type="button" className="wel-button wel-button--secondary">
          Secondaire
        </button>
        <button type="button" className="wel-button wel-button--tertiary">
          Tertiaire
        </button>
      </section>

      <section>
        <h2>Champ de saisie</h2>
        <div className="wel-input-text" style={{ width: "100%" }}>
          <label className="wel-input-text__label" htmlFor="demo-input">
            Votre question
          </label>
          <div className="wel-input-text__wrapper">
            <input
              id="demo-input"
              className="wel-input-text__input"
              placeholder="Ex. : parle-moi de ton expérience chez Accor"
            />
          </div>
        </div>
      </section>

      <section>
        <h2>Messages</h2>
        <div className="wel-message wel-message--neutral" style={{ width: "100%" }}>
          <div className="wel-message__header">
            <p className="wel-message__text">Message neutre (bulle du bot)</p>
          </div>
        </div>
        <div className="wel-message wel-message--accent" style={{ width: "100%" }}>
          <div className="wel-message__header">
            <p className="wel-message__text">Message accent (bulle utilisateur)</p>
          </div>
        </div>
        <div className="wel-message wel-message--warning" style={{ width: "100%" }}>
          <div className="wel-message__header">
            <p className="wel-message__text">Message d&apos;erreur</p>
          </div>
        </div>
      </section>

      <section>
        <h2>Chips</h2>
        <button type="button" className="wel-chip">Ton parcours</button>
        <button type="button" className="wel-chip">Tes projets</button>
        <button type="button" className="wel-chip wel-chip--selected">
          Ta façon de travailler
        </button>
      </section>

      <section>
        <h2>Skeleton</h2>
        <div className="wel-skeleton chat__skeleton" />
      </section>
    </main>
  );
}
