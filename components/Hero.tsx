"use client";

// Héro de la maquette : titre, sous-titre, puis la barre de chat posée en
// débord sur l'illustration du persona actif (gap négatif dans Figma, porté
// ici par --hero-overlap).
//
// Les questions suggérées vivent dans la carte du lanceur, sous le champ :
// c'est là qu'elles se lisent comme une alternative à la saisie.
import Image from "next/image";
import { HERO_IMAGES } from "../lib/articles";
import { t, type Lang } from "../lib/i18n";
import Composer from "./chat/Composer";
import SuggestedQuestions from "./chat/SuggestedQuestions";

type Props = {
  lang: Lang;
  persona: string;
  disabled: boolean;
  questions: string[];
  onSend: (text: string) => void;
};

export default function Hero({ lang, persona, disabled, questions, onSend }: Props) {
  const image = HERO_IMAGES[persona] ?? HERO_IMAGES.ours;

  return (
    <section className="hero">
      <div className="hero__heading">
        <h1 className="hero__title">{t(lang, "heroTitle")}</h1>
        <p className="hero__subtitle">{t(lang, "heroSubtitle")}</p>
      </div>

      <div className="hero__stage">
        <div className="hero__bar">
          <div className="launcher">
            <Composer
              className="launcher__row"
              disabled={disabled}
              placeholder={t(lang, "askAnything")}
              sendLabel={t(lang, "letsChat")}
              onSend={onSend}
            />
            <SuggestedQuestions
              className="launcher__suggestions"
              label={t(lang, "suggestions")}
              questions={questions}
              onPick={onSend}
            />
          </div>
        </div>
        {/* Illustration décorative : le sens est porté par le titre. */}
        <div className="hero__media">
          <Image
            className="hero__image"
            src={image}
            alt=""
            fill
            sizes="(max-width: 1279px) 100vw, 1312px"
            priority
          />
        </div>
      </div>
    </section>
  );
}
