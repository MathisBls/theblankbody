import { useRef } from 'react';
import { MEDIA_PATHS, SECTION_IDS } from '../../config/links';
import { BOOK_SERIES, SERIES_ORDER, type BookSeries } from '../../data/catalog';
import { translate, type MessageKey } from '../../i18n';
import { gsap, useGSAP } from '../../lib/gsap';
import { MOTION_QUERIES, REVEAL_START } from '../../lib/motionQueries';
import './AboutBlank.css';

const TITLE_ID = 'about-blank-title';
const ILLUSTRATION_SIZE_PX = { width: 449, height: 799 } as const;

const SERIES_CHIP_MODIFIER: Record<BookSeries, string> = {
  [BOOK_SERIES.sleep]: 'about-blank__chip--sleep',
  [BOOK_SERIES.energy]: 'about-blank__chip--energy',
  [BOOK_SERIES.posture]: 'about-blank__chip--posture',
};

const POINT_KEYS: readonly { titleKey: MessageKey; textKey: MessageKey }[] = [
  { titleKey: 'about.point1.title', textKey: 'about.point1.text' },
  { titleKey: 'about.point2.title', textKey: 'about.point2.text' },
  { titleKey: 'about.point3.title', textKey: 'about.point3.text' },
];

const POINTS = POINT_KEYS.map(({ titleKey, textKey }, index) => ({
  id: titleKey,
  number: index + 1,
  title: translate(titleKey),
  text: translate(textKey),
}));

const SERIES_CHIPS = SERIES_ORDER.map((series) => {
  const labelKey: MessageKey = `books.filter.${series}`;
  return { series, label: translate(labelKey), className: `about-blank__chip ${SERIES_CHIP_MODIFIER[series]}` };
});

export function AboutBlank() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mediaMatcher = gsap.matchMedia();
      mediaMatcher.add(MOTION_QUERIES, (context) => {
        if (context.conditions?.reducesMotion) {
          gsap.utils.toArray<HTMLElement>('.about-blank__panel-wrap, .about-blank__content').forEach((group) => {
            gsap.from(group, { autoAlpha: 0, duration: 0.8, scrollTrigger: { trigger: group, start: REVEAL_START, once: true } });
          });
          return;
        }

        gsap
          .timeline({ scrollTrigger: { trigger: '.about-blank__panel-wrap', start: REVEAL_START, once: true } })
          .from('.about-blank__panel', {
            xPercent: -35,
            yPercent: 10,
            rotation: -16,
            autoAlpha: 0,
            duration: 1.2,
            ease: 'expo.out',
          })
          .from(
            '.about-blank__bubble',
            {
              scale: 0,
              rotation: -18,
              transformOrigin: '15% 100%',
              duration: 1.1,
              ease: 'elastic.out(1, 0.45)',
            },
            '-=0.65',
          );

        gsap.fromTo(
          '.about-blank__illustration',
          { yPercent: -7 },
          {
            yPercent: 7,
            ease: 'none',
            scrollTrigger: { trigger: '.about-blank__panel', start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );

        gsap
          .timeline({ scrollTrigger: { trigger: '.about-blank__content', start: REVEAL_START, once: true } })
          .from('.about-blank__intro > *', { autoAlpha: 0, y: 40, duration: 0.9, ease: 'expo.out', stagger: 0.08 })
          .from(
            '.about-blank__point',
            { autoAlpha: 0, x: 48, duration: 0.8, ease: 'expo.out', stagger: 0.12 },
            '-=0.55',
          )
          .from('.about-blank__series > *:not(ul)', { autoAlpha: 0, y: 24, duration: 0.6, ease: 'expo.out' }, '-=0.4')
          .from(
            '.about-blank__chip',
            { scale: 0, rotation: -25, duration: 0.8, ease: 'back.out(3)', stagger: 0.1 },
            '-=0.35',
          );
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id={SECTION_IDS.about} className="about-blank" aria-labelledby={TITLE_ID}>
      <div className="container about-blank__layout">
        <figure className="about-blank__panel-wrap">
          <div className="about-blank__panel">
            <img
              className="about-blank__illustration"
              src={MEDIA_PATHS.illustration}
              alt={translate('about.illustrationAlt')}
              width={ILLUSTRATION_SIZE_PX.width}
              height={ILLUSTRATION_SIZE_PX.height}
              loading="lazy"
              decoding="async"
            />
          </div>
          <p className="about-blank__bubble">{translate('about.fact')}</p>
        </figure>

        <div className="about-blank__content">
          <div className="about-blank__intro">
            <p className="eyebrow eyebrow--on-dark">{translate('about.eyebrow')}</p>
            <h2 id={TITLE_ID} className="about-blank__title">
              {translate('about.title')}
            </h2>
            <p className="about-blank__lead">{translate('about.lead')}</p>
          </div>

          <ul className="about-blank__points">
            {POINTS.map((point) => (
              <li key={point.id} className="about-blank__point">
                <span className="about-blank__point-number" aria-hidden="true">
                  {point.number}
                </span>
                <div>
                  <h3 className="about-blank__point-title">{point.title}</h3>
                  <p className="about-blank__point-text">{point.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="about-blank__series">
            <h3 className="about-blank__series-title">{translate('about.series.title')}</h3>
            <p className="about-blank__series-text">{translate('about.series.text')}</p>
            <ul className="about-blank__chips">
              {SERIES_CHIPS.map((chip) => (
                <li key={chip.series} className={chip.className}>
                  <span className="about-blank__chip-band" aria-hidden="true" />
                  {chip.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
