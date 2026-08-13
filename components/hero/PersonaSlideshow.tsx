"use client";

// Héro de la v2 : un slideshow pleine largeur, une slide par persona. Changer
// de slide change le persona — donc le thème de toute la page — et le sélecteur
// de la barre suit. L'inverse est vrai aussi.
//
// Le persona est la seule source de vérité : le composant ne tient pas d'index
// à lui. Il lit `settings.persona`, fait défiler la piste jusqu'à la slide
// correspondante, et écrit le persona quand la piste bouge. Un index local en
// parallèle ferait diverger les deux et rendrait la boucle instable.
//
// Le défilement est celui du navigateur — `scroll-snap` sur la piste — comme
// pour le carousel d'articles : geste tactile, molette et clavier fonctionnent
// d'origine, sans position calculée en JavaScript.
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { HERO_IMAGES, type ColorMode } from "../../lib/articles";
import { ArrowLeftIcon, ArrowRightIcon, PauseIcon, PlayIcon } from "../Icons";
import { t, tf } from "../../lib/i18n";
import { prefersReducedMotion, scrollBehavior } from "../../lib/motion";
import type { PersonaPublic } from "../chat/Chat";
import Composer from "../chat/Composer";
import SuggestedQuestions from "../chat/SuggestedQuestions";
import { persistSetting, SETTINGS_EVENT, useSettings } from "../useSettings";

/** Délai entre deux slides, repris du composant slideshow du WDS. */
const DELAI = 5000;

type Props = {
  personas: PersonaPublic[];
  colorMode: ColorMode;
  disabled: boolean;
  /** Questions du persona actif, déjà filtrées de celles qui ont servi. */
  questions: string[];
  onSend: (text: string) => void;
  /** Le panneau de conversation est ouvert : le persona ne doit plus bouger seul. */
  paused: boolean;
};

export default function PersonaSlideshow({
  personas,
  colorMode,
  disabled,
  questions,
  onSend,
  paused,
}: Props) {
  const { persona, lang } = useSettings();
  const pisteRef = useRef<HTMLDivElement>(null);
  const [lecture, setLecture] = useState(true);
  const [visible, setVisible] = useState(false);
  // Suspension passagère : la souris survole le carrousel, ou le clavier y a
  // le focus. Contrairement à la bascule et au sélecteur, elle ne touche pas
  // à l'état de lecture — le défilement reprend dès qu'on s'en va.
  const [survol, setSurvol] = useState(false);

  // Retient qui a demandé le dernier changement de persona. Un changement venu
  // du slideshow lui-même ne doit pas interrompre la lecture ; un changement
  // venu du sélecteur de la barre, si — c'est la règle demandée.

  /**
   * Un déplacement de la piste n'est animé que s'il a une cause : lecture
   * automatique, bouton, clavier, ou sélecteur de la barre — tous passent par
   * un événement de réglages, et le posent donc à vrai.
   *
   * Le tout premier déplacement n'en a pas. `useSettings` rend les défauts SSR
   * pour éviter un écart d'hydratation, puis lit `<html>` dans son effet de
   * montage, où le script anti-flash a déjà posé le persona mémorisé : le
   * composant rattrape alors sa slide. Animé, ce rattrapage donne à voir un
   * défilement de la première slide vers la sienne, comme si le carrousel
   * démarrait tout seul — le thème, lui, était déjà bon dès la première frame.
   */
  const anime = useRef(false);

  const index = Math.max(
    0,
    personas.findIndex((p) => p.id === persona),
  );
  const actif = personas[index] ?? personas[0];

  // Le modulo porte la boucle infinie entre la dernière et la première slide.
  const allerA = useCallback(
    (cible: number) => {
      const suivant = personas[(cible + personas.length) % personas.length];
      if (!suivant || suivant.id === persona) return;
      anime.current = true;
      document.documentElement.setAttribute("data-persona", suivant.id);
      persistSetting({ persona: suivant.id }, "slideshow");
    },
    [personas, persona],
  );

  // La piste suit le persona, d'où qu'il vienne.
  useEffect(() => {
    const el = pisteRef.current;
    if (!el) return;
    const cible = index * el.clientWidth;
    if (Math.abs(el.scrollLeft - cible) > 4) {
      el.scrollTo({ left: cible, behavior: anime.current ? scrollBehavior() : "auto" });
    }
  }, [index]);

  // Un changement venu d'ailleurs — le sélecteur de la barre — arrête la
  // lecture automatique. Un changement venu du slideshow, non : agir dans le
  // carrousel ne l'interrompt pas, le quitter pour la barre si.
  useEffect(() => {
    const onReglage = (e: Event) => {
      // Tout changement porté par un événement a une cause : il s'anime.
      anime.current = true;
      const source = (e as CustomEvent<{ source?: string }>).detail?.source;
      if (source && source !== "slideshow") setLecture(false);
    };
    window.addEventListener(SETTINGS_EVENT, onReglage);
    return () => window.removeEventListener(SETTINGS_EVENT, onReglage);
  }, []);

  // Le défilement manuel — geste, molette, clavier — écrit le persona.
  useEffect(() => {
    const el = pisteRef.current;
    if (!el) return;
    let attente: ReturnType<typeof setTimeout>;
    const sync = () => {
      clearTimeout(attente);
      // On attend l'arrêt du défilement : pendant l'inertie, les positions
      // intermédiaires désigneraient des personas qu'on ne fait que traverser.
      attente = setTimeout(() => {
        if (el.clientWidth === 0) return;
        const vu = Math.round(el.scrollLeft / el.clientWidth);
        const cible = personas[vu];
        if (cible && cible.id !== persona) {
          document.documentElement.setAttribute("data-persona", cible.id);
          persistSetting({ persona: cible.id }, "slideshow");
        }
      }, 120);
    };
    el.addEventListener("scroll", sync, { passive: true });
    return () => {
      clearTimeout(attente);
      el.removeEventListener("scroll", sync);
    };
  }, [personas, persona]);

  // La lecture ne démarre qu'une fois le slideshow entré dans la fenêtre.
  useEffect(() => {
    const el = pisteRef.current;
    if (!el) return;
    const observateur = new IntersectionObserver(
      ([entree]) => setVisible(entree.isIntersecting),
      { threshold: 0.4 },
    );
    observateur.observe(el);
    return () => observateur.disconnect();
  }, []);

  // Lecture automatique : visible, non interrompue, onglet au premier plan, et
  // mouvement non réduit. La boucle est infinie — le modulo de `allerA` s'en
  // charge.
  useEffect(() => {
    if (!lecture || !visible || paused || survol || prefersReducedMotion()) return;
    if (typeof document !== "undefined" && document.hidden) return;
    const minuteur = setInterval(() => allerA(index + 1), DELAI);
    return () => clearInterval(minuteur);
  }, [lecture, visible, paused, survol, index, allerA]);

  // Onglet en arrière-plan : rien ne doit continuer de tourner.
  useEffect(() => {
    const onVisibilite = () => {
      if (document.hidden) setVisible(false);
      else if (pisteRef.current) {
        const r = pisteRef.current.getBoundingClientRect();
        setVisible(r.bottom > 0 && r.top < window.innerHeight);
      }
    };
    document.addEventListener("visibilitychange", onVisibilite);
    return () => document.removeEventListener("visibilitychange", onVisibilite);
  }, []);

  const total = personas.length;

  return (
    <section
      className="slideshow"
      aria-roledescription={t(lang, "carousel")}
      aria-label={t(lang, "personaCarousel")}
      // Le survol suspend le défilement : on ne lit pas une slide qui s'en va
      // sous le curseur. `pointerType` filtre le tactile, où `pointerenter`
      // se déclenche à la première touche et ne repartirait jamais.
      onPointerEnter={(e) => e.pointerType === "mouse" && setSurvol(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setSurvol(false)}
      // Même raison au clavier : le focus posé dans le carrousel ne doit pas
      // voir le persona changer sous lui.
      onFocus={() => setSurvol(true)}
      onBlur={() => setSurvol(false)}
      /*
        Raccourcis actifs uniquement quand le focus est dans le carrousel :
        c'est la troisième échappatoire de WCAG 2.1.4, celle qui dispense d'un
        réglage de désactivation — la touche n'existe pas ailleurs dans la page.

        Les flèches seulement. Le champ de saisie vit dans ce même carrousel,
        et l'espace y servirait à écrire ; les flèches elles-mêmes sont donc
        rendues au champ dès que le focus s'y trouve.
      */
      onKeyDown={(e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        const cible = e.target as HTMLElement;
        if (cible.closest("input, textarea, select, [contenteditable]")) return;
        e.preventDefault();
        allerA(index + (e.key === "ArrowRight" ? 1 : -1));
      }}
    >
      {/* Focalisable : les slides inactives sont `inert`, la piste n'a donc
          aucun contenu atteignable au clavier. Sans ce point d'entrée, elle ne
          se fait défiler qu'à la souris ou au doigt. */}
      <div
        className="slideshow__track"
        ref={pisteRef}
        tabIndex={0}
        role="group"
        aria-label={t(lang, "slideshowTrack")}
      >
        {personas.map((p, i) => (
          <div
            className="slideshow__slide"
            key={p.id}
            role="group"
            aria-roledescription={t(lang, "slide")}
            aria-label={`${tf(lang, "slidePosition", { n: i + 1, total })} — ${p.name[lang]}`}
            // Hors de vue, la slide sort aussi de l'ordre de tabulation et de
            // l'exploration : trois titres identiques annoncés à la suite
            // n'apprendraient rien.
            inert={i !== index}
          >
            <Image
              className="slideshow__image"
              src={(HERO_IMAGES[p.id] ?? HERO_IMAGES.ours)[colorMode]}
              alt=""
              fill
              sizes="100vw"
              priority={i === 0}
            />
            {/* Posé sur le voile de l'image : le contenu force le mode sombre,
                comme les cards d'article. Sans ça, on-surface-hi resterait
                foncé en mode clair — du texte sombre sur une image sombre. */}
            <div
              className="slideshow__content"
              data-persona={p.id}
              data-color-mode="dark"
            >
              <h1 className="slideshow__title">{t(lang, "heroTitle")}</h1>
              <p className="slideshow__tagline">{p.tagline[lang]}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Contrôles posés en haut de l'image, comme la maquette : bascule de
          lecture à gauche, pas à pas à droite. */}
      <div className="slideshow__controls">
        <button
          type="button"
          className="ama-button-icon ama-button-icon--secondary ama-button-icon--sm slideshow__play"
          aria-pressed={lecture}
          aria-label={t(lang, lecture ? "pauseSlideshow" : "playSlideshow")}
          onClick={() => {
            // Le bouton garde le focus après le clic, et le focus suspend le
            // défilement : sans cette levée, « lecture » n'aurait relancé
            // qu'une fois le focus parti ailleurs.
            setSurvol(false);
            setLecture((v) => !v);
          }}
        >
          {lecture ? <PauseIcon /> : <PlayIcon />}
        </button>

        <div className="slideshow__steps">
          <button
            type="button"
            className="ama-button-icon ama-button-icon--secondary ama-button-icon--sm"
            aria-label={t(lang, "previousPersona")}
            aria-keyshortcuts="ArrowLeft"
            onClick={() => allerA(index - 1)}
          >
            <ArrowLeftIcon />
          </button>
          <button
            type="button"
            className="ama-button-icon ama-button-icon--secondary ama-button-icon--sm"
            aria-label={t(lang, "nextPersona")}
            aria-keyshortcuts="ArrowRight"
            onClick={() => allerA(index + 1)}
          >
            <ArrowRightIcon />
          </button>
        </div>
      </div>

      {/* Un seul lanceur pour les trois slides : trois champs de saisie
          identiques dans la page n'apporteraient rien et brouilleraient la
          navigation au clavier. Son intitulé et ses questions suivent le
          persona affiché. */}
      <div className="slideshow__launcher">
        <div
          className="launcher launcher--hero"
          data-persona={actif.id}
          data-color-mode="dark"
        >
          <p className="launcher__heading">{actif.chatHeading[lang]}</p>
          <Composer
            className="launcher__row"
            disabled={disabled}
            placeholder={t(lang, "askAnything")}
            label={t(lang, "questionLabel")}
            sendLabel={t(lang, "letsChat")}
            onSend={onSend}
          />
          <SuggestedQuestions
            className="launcher__suggestions"
            label={t(lang, "suggestions")}
            questions={questions}
            onPick={onSend}
            scrollable
            nextLabel={t(lang, "moreQuestions")}
          />
        </div>
      </div>

      {/* Le changement de persona repeint toute la page : sans annonce, il est
          muet pour un lecteur d'écran. */}
      <p className="a11y-hidden" role="status">
        {tf(lang, "personaActive", { name: actif.name[lang] })}
      </p>
    </section>
  );
}
