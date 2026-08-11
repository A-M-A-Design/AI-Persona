import ColorModeToggle from "../components/header/ColorModeToggle";

// Page démo M0 : valide que le contrat --wel-* + composants WDS fonctionnent
// (light/dark inclus). Remplacée par l'interface de chat en M1.
export default function Home() {
  return (
    <main className="demo">
      <div className="demo__header">
        <h1>AI Persona — socle WDS</h1>
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
            <p className="wel-message__text">
              Bonjour ! Je suis la version IA d&apos;Arthur. Posez-moi vos
              questions sur son parcours.
            </p>
          </div>
        </div>
        <div className="wel-message wel-message--accent" style={{ width: "100%" }}>
          <div className="wel-message__header">
            <p className="wel-message__text">
              Quel est ton rôle sur le design system Accor ?
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2>Chips (futures questions suggérées)</h2>
        <button type="button" className="wel-chip">Ton parcours</button>
        <button type="button" className="wel-chip">Tes projets</button>
        <button type="button" className="wel-chip wel-chip--selected">
          Ta façon de travailler
        </button>
      </section>
    </main>
  );
}
