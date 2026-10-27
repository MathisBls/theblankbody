import { Fragment, useRef } from 'react';
import { PriceTag } from '../../components/BookOffer/BookOffer';
import { formatBookFormat } from '../../components/BookOffer/bookOfferFormat';
import { SECTION_IDS } from '../../config/links';
import { FEATURED_BOOK } from '../../data/catalog';
import { translate } from '../../i18n';
import { gsap, useGSAP } from '../../lib/gsap';
import { HeroBookStage } from './HeroBookStage';
import { HeroDecorations } from './HeroDecorations';
import './Hero.css';

const MOTION_QUERY = {
  allowed: '(prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
} as const;

interface TitleWord {
  key: string;
  text: string;
  className: string;
  isHighlighted: boolean;
}

function normalizeWord(word: string): string {
  return word.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
}

function buildTitleWords(title: string, highlightedWord: string): TitleWord[] {
  const normalizedHighlight = normalizeWord(highlightedWord);
  return title.split(/\s+/).map((text, index) => {
    const isHighlighted = normalizeWord(text) === normalizedHighlight;
    return {
      key: `${index}-${text}`,
      text,
      className: isHighlighted ? 'hero__word hero__word--highlight' : 'hero__word',
      isHighlighted,
    };
  });
}

const TITLE_WORDS = buildTitleWords(translate('hero.title'), translate('hero.titleHighlight'));
const BOOKS_SECTION_HREF = `#${SECTION_IDS.books}`;

function playIntroAnimation() {
  const timeline = gsap.timeline({ defaults: { ease: 'expo.out' } });
  timeline
    .from('.hero__word', { yPercent: 115, rotate: 7, duration: 1.1, stagger: 0.09 })
    .from('.hero__stage-intro', { scale: 0.82, autoAlpha: 0, duration: 1.4, ease: 'back.out(1.4)' }, 0.15)
    .from('.hero__squiggle-path', { strokeDashoffset: 1, duration: 0.7, ease: 'power2.inOut' }, 0.75)
    .from('.hero__reveal', { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.08 }, 0.45)
    .from('.hero__pop', { scale: 0, autoAlpha: 0, duration: 0.8, stagger: 0.06, ease: 'back.out(2.2)' }, 0.6);
}

function attachScrollOutAnimation(section: HTMLElement) {
  const scrollTrigger = { trigger: section, start: 'top top', end: 'bottom top', scrub: 0.6 };
  gsap.to('.hero__stage-scroll', { yPercent: 14, scale: 0.88, ease: 'none', scrollTrigger });
  gsap.to('.hero__copy-scroll', { yPercent: -10, autoAlpha: 0.35, ease: 'none', scrollTrigger });
}

function playReducedMotionFade() {
  gsap.from('.hero__inner', { autoAlpha: 0, duration: 0.6, ease: 'power1.out' });
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      const matchMedia = gsap.matchMedia();
      matchMedia.add(MOTION_QUERY.allowed, () => {
        playIntroAnimation();
        attachScrollOutAnimation(section);
      });
      matchMedia.add(MOTION_QUERY.reduced, playReducedMotionFade);
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id={SECTION_IDS.hero} className="hero" aria-labelledby="hero-title">
      <HeroDecorations />

      <div className="hero__inner container">
        <div className="hero__copy">
          <div className="hero__copy-scroll">
            <p className="hero__eyebrow hero__reveal">{translate('hero.eyebrow')}</p>
            <h1 id="hero-title" className="hero__title">
              {TITLE_WORDS.map((word) => (
                <Fragment key={word.key}>
                  <span className="hero__word-mask">
                    <span className={word.className}>
                      {word.text}
                      {word.isHighlighted && (
                        <svg className="hero__squiggle" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                          <path className="hero__squiggle-path" pathLength={1} d="M3 13C38 4 62 18 100 10s66-8 97 1" />
                        </svg>
                      )}
                    </span>
                  </span>{' '}
                </Fragment>
              ))}
            </h1>
            <p className="hero__subtitle hero__reveal">{translate('hero.subtitle')}</p>
          </div>
        </div>

        <div className="hero__stage">
          <div className="hero__stage-scroll">
            <div className="hero__stage-intro">
              <HeroBookStage book={FEATURED_BOOK} />
            </div>
          </div>
        </div>

        <div className="hero__actions hero__reveal">
          <div className="hero__ctas">
            <a className="button button--primary button--large" href={FEATURED_BOOK.url} target="_blank" rel="noopener noreferrer">
              {translate('hero.ctaPrimary')}
              <span className="visually-hidden"> {translate('common.opensInNewTab')}</span>
            </a>
            <a className="button button--ghost button--large" href={BOOKS_SECTION_HREF}>
              {translate('hero.ctaSecondary')}
            </a>
          </div>
          <div className="hero__offer">
            <PriceTag book={FEATURED_BOOK} className="hero__price" />
            <span className="hero__offer-details">
              <strong className="hero__offer-title">{FEATURED_BOOK.title}</strong>
              <span>{formatBookFormat(FEATURED_BOOK)} · {translate('books.instantDownload')}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
