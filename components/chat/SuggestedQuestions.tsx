"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scrollBehavior } from "../../lib/motion";

type Props = {
  label: string;
  questions: string[];
  onPick: (question: string) => void;
  className?: string;
  /**
   * Ajoute le bouton de défilement de la maquette mobile. Il ne s'affiche que
   * si la rangée déborde réellement : en desktop les chips passent à la ligne,
   * donc rien ne dépasse et le bouton reste absent — sans media query.
   */
  scrollable?: boolean;
  nextLabel?: string;
};

export default function SuggestedQuestions({
  label,
  questions,
  onPick,
  className = "chat__suggestions",
  scrollable = false,
  nextLabel,
}: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);

  const sync = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setHasMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    if (!scrollable) return;
    const el = rowRef.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    // La rangée change de largeur au redimensionnement comme au changement de
    // langue : un observateur évite de recalculer à chaque rendu.
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, [scrollable, sync, questions]);

  // `role="group"` : ARIA ignore aria-label sur un élément générique, la rangée
  // n'avait donc aucun nom. Le rôle rend le libellé effectif et regroupe les
  // pastilles au lieu de les livrer isolées.
  const row = (
    <div className={className} role="group" aria-label={label} ref={rowRef}>
      {questions.map((q) => (
        <button key={q} type="button" className="wel-chip" onClick={() => onPick(q)}>
          {q}
        </button>
      ))}
    </div>
  );

  if (!scrollable) return row;

  return (
    <div className={`suggestions${hasMore ? " suggestions--more" : ""}`}>
      {row}
      {hasMore && (
        <button
          type="button"
          className="suggestions__next"
          aria-label={nextLabel}
          onClick={() => rowRef.current?.scrollBy({ left: 220, behavior: scrollBehavior() })}
        >
          <span aria-hidden="true">›</span>
        </button>
      )}
    </div>
  );
}
