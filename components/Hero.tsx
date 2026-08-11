"use client";

// Héro de la maquette : titre, sous-titre, puis la barre de chat posée en
// débord sur l'illustration du persona actif (gap négatif dans Figma, porté
// ici par --hero-overlap).
import { HERO_IMAGES } from "../lib/articles";
import { t, type Lang } from "../lib/i18n";
import Composer from "./chat/Composer";

type Props = {
  lang: Lang;
  persona: string;
  disabled: boolean;
  onSend: (text: string) => void;
};

export default function Hero({ lang, persona, disabled, onSend }: Props) {
  const image = HERO_IMAGES[persona] ?? HERO_IMAGES.ours;

  return (
    <section className="hero">
      <div className="hero__heading">
        <h1 className="hero__title">{t(lang, "heroTitle")}</h1>
        <p className="hero__subtitle">{t(lang, "heroSubtitle")}</p>
      </div>

      <div className="hero__stage">
        <div className="hero__bar">
          <Composer
            className="launcher"
            disabled={disabled}
            placeholder={t(lang, "askAnything")}
            sendLabel={t(lang, "letsChat")}
            onSend={onSend}
          />
        </div>
        {/* Illustration décorative : le sens est porté par le titre. */}
        <div className="hero__media">
          <img className="hero__image" src={image} alt="" />
        </div>
      </div>
    </section>
  );
}
