"use client";

// Carousel de fin d'article : les autres articles, en pages successives, avec
// la pagination condensée de la maquette (précédent · compteur · suivant).
//
// Le défilement est celui du navigateur — `scroll-snap` sur la piste — plutôt
// qu'une position calculée en JavaScript : le geste tactile, la molette et la
// navigation au clavier fonctionnent alors d'origine. Le nombre de pages se
// déduit de la géométrie réelle, si bien qu'il suit les breakpoints (3 cartes
// visibles en desktop, 2 en tablette, 1 en mobile) sans les connaître.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Article } from "../../lib/articles";
import { t, type Lang } from "../../lib/i18n";
import ArticleCard from "../ArticleCard";

type Props = {
  articles: Article[];
  lang: Lang;
  persona: string;
};

export default function ArticleCarousel({ articles, lang, persona }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  // Largeur d'une page en pixels, mesurée : `scrollWidth` ne convient pas, les
  // gouttières s'ajoutant entre les cartes sans appartenir à aucune page.
  const stepRef = useRef(0);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  const sync = useCallback(() => {
    const el = trackRef.current;
    const first = el?.firstElementChild;
    if (!el || !first || el.clientWidth === 0) return;

    const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
    const card = first.getBoundingClientRect().width + gap;
    // La dernière carte d'une page n'est pas suivie d'une gouttière : on la
    // rajoute des deux côtés pour que la division tombe juste.
    const perPage = Math.max(1, Math.round((el.clientWidth + gap) / card));
    const total = Math.max(1, Math.ceil(el.children.length / perPage));

    stepRef.current = perPage * card;
    setPages(total);

    // La dernière page est souvent partielle : la piste bute avant la position
    // théorique de son début, et un rapport à la largeur de page y resterait
    // bloqué sur l'avant-dernière. On rapporte donc la position à la course
    // réellement disponible.
    const travel = el.scrollWidth - el.clientWidth;
    setPage(travel <= 1 ? 0 : Math.round((el.scrollLeft / travel) * (total - 1)));
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, [sync, articles]);

  const go = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: direction * (stepRef.current || el.clientWidth), behavior: "smooth" });
  };

  if (articles.length === 0) return null;

  return (
    <section className="carousel" aria-label={t(lang, "moreArticles")}>
      <div className="carousel__track" ref={trackRef}>
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} lang={lang} persona={persona} />
        ))}
      </div>

      {/* Une seule page : la pagination n'aurait rien à piloter. */}
      {pages > 1 && (
        <div className="carousel__pagination">
          <button
            type="button"
            className="carousel__step"
            aria-label={t(lang, "previousArticles")}
            disabled={page === 0}
            onClick={() => go(-1)}
          >
            <span aria-hidden="true">‹</span>
          </button>
          {/* Le compteur suit le défilement, y compris au geste tactile. */}
          <p className="carousel__counter" aria-live="polite">
            {page + 1} / {pages}
          </p>
          <button
            type="button"
            className="carousel__step"
            aria-label={t(lang, "nextArticles")}
            disabled={page >= pages - 1}
            onClick={() => go(1)}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      )}
    </section>
  );
}
