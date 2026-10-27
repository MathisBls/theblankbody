import { useRef, type ComponentType } from 'react';
import { translate, type MessageKey } from '../../i18n';
import { gsap, useGSAP } from '../../lib/gsap';
import './HowItWorks.css';
import { MOTION_QUERIES, REVEAL_START } from '../../lib/motionQueries';
import { BookIcon, DownloadIcon, SecureCardIcon } from './StepIcons';

const TITLE_ID = 'how-it-works-title';

interface Step {
  number: number;
  titleKey: MessageKey;
  textKey: MessageKey;
  Icon: ComponentType;
  accentClassName: string;
}

const STEPS: readonly Step[] = [
  {
    number: 1,
    titleKey: 'howItWorks.step1.title',
    textKey: 'howItWorks.step1.text',
    Icon: BookIcon,
    accentClassName: 'how-step--navy',
  },
  {
    number: 2,
    titleKey: 'howItWorks.step2.title',
    textKey: 'howItWorks.step2.text',
    Icon: SecureCardIcon,
    accentClassName: 'how-step--orange',
  },
  {
    number: 3,
    titleKey: 'howItWorks.step3.title',
    textKey: 'howItWorks.step3.text',
    Icon: DownloadIcon,
    accentClassName: 'how-step--green',
  },
];

const STEP_VIEW_MODELS = STEPS.map((step) => ({
  ...step,
  label: translate('howItWorks.stepLabel', { number: step.number }),
  title: translate(step.titleKey),
  text: translate(step.textKey),
}));

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mediaMatcher = gsap.matchMedia();
      mediaMatcher.add(MOTION_QUERIES, (context) => {
        const reducesMotion = Boolean(context.conditions?.reducesMotion);
        const scrollTrigger = { trigger: '.how-it-works__steps', start: REVEAL_START, once: true };

        gsap.from('.how-it-works__heading > *', {
          autoAlpha: 0,
          y: reducesMotion ? 0 : 32,
          duration: 0.8,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: '.how-it-works__heading', start: REVEAL_START, once: true },
        });

        if (reducesMotion) {
          gsap.from('.how-step', { autoAlpha: 0, duration: 0.6, stagger: 0.1, scrollTrigger });
          return;
        }

        const timeline = gsap.timeline({ scrollTrigger });
        timeline
          .from('.how-step', {
            autoAlpha: 0,
            y: 90,
            rotation: (index: number) => (index % 2 === 0 ? -8 : 8),
            scale: 0.9,
            duration: 0.9,
            ease: 'back.out(1.5)',
            stagger: 0.14,
          })
          .from(
            '.how-step__pill',
            { scale: 0, rotation: -20, duration: 0.6, ease: 'elastic.out(1, 0.55)', stagger: 0.14 },
            0.3,
          )
          .from(
            '.how-step__icon',
            { scale: 0.4, autoAlpha: 0, duration: 0.7, ease: 'back.out(2.4)', stagger: 0.14 },
            0.35,
          );
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="how-it-works" aria-labelledby={TITLE_ID}>
      <div className="container">
        <header className="how-it-works__heading">
          <p className="eyebrow how-it-works__eyebrow">{translate('howItWorks.eyebrow')}</p>
          <h2 id={TITLE_ID} className="how-it-works__title">
            {translate('howItWorks.title')}
          </h2>
        </header>

        <ol className="how-it-works__steps">
          {STEP_VIEW_MODELS.map(({ number, label, title, text, Icon, accentClassName }) => (
            <li key={number} className={`how-step ${accentClassName}`}>
              <div className="how-step__top">
                <span className="how-step__pill">{label}</span>
                <span className="how-step__icon">
                  <Icon />
                </span>
              </div>
              <h3 className="how-step__title">{title}</h3>
              <p className="how-step__text">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
