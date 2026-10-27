import { translate } from '../../i18n';

const SPARKLE_PATH = 'M12 0c1 6.5 5.5 11 12 12-6.5 1-11 5.5-12 12-1-6.5-5.5-11-12-12C6.5 11 11 6.5 12 0Z';
const SPARKLE_VARIANTS = ['one', 'two', 'three', 'four', 'five'] as const;

/** Flat comic-book background: halftone dots, sparkles and a snoring "Zzz". */
export function HeroDecorations() {
  const snoreLabel = translate('hero.snore');

  return (
    <div className="hero-decorations" aria-hidden="true">
      <span className="hero-decorations__halftone hero-decorations__halftone--top" />
      <span className="hero-decorations__halftone hero-decorations__halftone--bottom" />
      {SPARKLE_VARIANTS.map((variant) => (
        <svg
          key={variant}
          className={`hero-decorations__sparkle hero-decorations__sparkle--${variant} hero__pop`}
          viewBox="-2 -2 28 28"
          focusable="false"
        >
          <path className="hero-decorations__sparkle-shape" d={SPARKLE_PATH} />
        </svg>
      ))}
      <span className="hero-decorations__snore hero__pop">
        <span className="hero-decorations__snore-text">{snoreLabel}</span>
      </span>
    </div>
  );
}
