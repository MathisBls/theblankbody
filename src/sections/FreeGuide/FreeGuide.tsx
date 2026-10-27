import { useRef } from 'react';
import { PriceTag } from '../../components/BookOffer/BookOffer';
import { SECTION_IDS } from '../../config/links';
import { FEATURED_BOOK } from '../../data/catalog';
import { translate, translatePlural, type MessageKey } from '../../i18n';
import { gsap, useGSAP } from '../../lib/gsap';
import { MOTION_QUERIES, REVEAL_START } from '../../lib/motionQueries';
import './FreeGuide.css';

const TITLE_ID = 'free-guide-title';
const BULLET_KEYS: readonly MessageKey[] = ['guide.bullet1', 'guide.bullet2', 'guide.bullet3'];

function buildGuideVisual() {
  const { images, cover_size_px: coverSize, title } = FEATURED_BOOK;
  const [width, height] = coverSize.front;
  return { src: images.front, alt: translate('guide.mockupAlt', { title }), width, height };
}

function formatGuideMeta(): string {
  const { pages, format } = FEATURED_BOOK;
  return pages === null ? format : translate('guide.meta', { pages: translatePlural('books.pages', pages) });
}

const GUIDE_VISUAL = buildGuideVisual();
const GUIDE_META = formatGuideMeta();
const BULLETS = BULLET_KEYS.map((key) => ({ key, text: translate(key) }));

function CheckIcon() {
  return (
    <svg className="free-guide__check" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle className="free-guide__check-badge" cx="16" cy="16" r="13.5" strokeWidth={3} />
      <path
        className="free-guide__check-mark"
        d="M9.5 16.5l4.5 4.5 9-10"
        fill="none"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FreeGuide() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mediaMatcher = gsap.matchMedia();
      mediaMatcher.add(MOTION_QUERIES, (context) => {
        const scrollTrigger = { trigger: '.free-guide__layout', start: REVEAL_START, once: true };

        if (context.conditions?.reducesMotion) {
          gsap.from('.free-guide__visual, .free-guide__content', { autoAlpha: 0, duration: 0.8, stagger: 0.15, scrollTrigger });
          return;
        }

        gsap
          .timeline({ scrollTrigger })
          .from('.free-guide__visual', {
            autoAlpha: 0,
            y: 100,
            rotation: 8,
            scale: 0.88,
            duration: 1.3,
            ease: 'expo.out',
          })
          .from(
            '.free-guide__content > *',
            { autoAlpha: 0, y: 36, duration: 0.9, ease: 'expo.out', stagger: 0.08 },
            0.15,
          )
          .from(
            '.free-guide__check',
            { scale: 0, rotation: -90, duration: 0.7, ease: 'back.out(3)', stagger: 0.12 },
            0.6,
          );

        gsap.fromTo(
          '.free-guide__mockup',
          { yPercent: 6 },
          {
            yPercent: -6,
            ease: 'none',
            scrollTrigger: { trigger: '.free-guide__layout', start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id={SECTION_IDS.freeGuide} className="free-guide" aria-labelledby={TITLE_ID}>
      <div className="container free-guide__layout">
        <div className="free-guide__visual">
          <div className="free-guide__mockup">
            <div className="free-guide__sheet free-guide__sheet--page" aria-hidden="true">
              <span className="free-guide__page-title" />
              <span className="free-guide__page-line" />
              <span className="free-guide__page-line free-guide__page-line--short" />
              <span className="free-guide__page-box" />
              <span className="free-guide__page-card" />
              <span className="free-guide__page-card" />
            </div>
            <img
              className="free-guide__sheet free-guide__sheet--cover"
              src={GUIDE_VISUAL.src}
              alt={GUIDE_VISUAL.alt}
              width={GUIDE_VISUAL.width}
              height={GUIDE_VISUAL.height}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        <div className="free-guide__content">
          <p className="eyebrow eyebrow--on-dark">{translate('guide.eyebrow')}</p>
          <h2 id={TITLE_ID} className="free-guide__title">
            {translate('guide.title')}
          </h2>
          <p className="free-guide__lead">{translate('guide.lead')}</p>

          <ul className="free-guide__bullets">
            {BULLETS.map((bullet) => (
              <li key={bullet.key} className="free-guide__bullet">
                <CheckIcon />
                <span>{bullet.text}</span>
              </li>
            ))}
          </ul>

          <div className="free-guide__offer">
            <PriceTag book={FEATURED_BOOK} />
            <span className="free-guide__meta">{GUIDE_META}</span>
          </div>

          <a
            className="button button--primary button--large free-guide__cta"
            href={FEATURED_BOOK.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {translate('guide.cta')}
            <svg className="free-guide__cta-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M4 12h15M13 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="visually-hidden"> {translate('common.opensInNewTab')}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
