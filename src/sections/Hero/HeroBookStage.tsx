import { lazy, Suspense, useCallback, useState } from 'react';
import { CssBook } from '../../components/CssBook/CssBook';
import type { Book } from '../../data/catalog';
import { useDeviceCapabilities } from '../../hooks/useDeviceCapabilities';
import { translate } from '../../i18n';

const HeroBookCanvas = lazy(() =>
  import('../../three/hero/HeroBookCanvas').then((module) => ({ default: module.HeroBookCanvas })),
);

const STAGE_MODE = {
  webgl: 'webgl',
  cssBook: 'css-book',
  staticCover: 'static-cover',
} as const;
type StageMode = (typeof STAGE_MODE)[keyof typeof STAGE_MODE];

const COVER_WIDTH = 'var(--hero-cover-width)';
const CSS_BOOK_ROTATION_Y = -24;

function getStageMode(canRender3d: boolean, prefersReducedMotion: boolean): StageMode {
  if (canRender3d) return STAGE_MODE.webgl;
  return prefersReducedMotion ? STAGE_MODE.staticCover : STAGE_MODE.cssBook;
}

export interface HeroBookStageProps {
  book: Book;
}

/** Big featured book: real-time 3D when possible, CSS 3D without WebGL, flat cover for reduced motion. */
export function HeroBookStage({ book }: HeroBookStageProps) {
  const { canRender3d, prefersReducedMotion, hasCoarsePointer } = useDeviceCapabilities();
  const [isSceneReady, setIsSceneReady] = useState(false);
  const handleSceneReady = useCallback(() => setIsSceneReady(true), []);

  const stageMode = getStageMode(canRender3d, prefersReducedMotion);
  const isWebgl = stageMode === STAGE_MODE.webgl;
  const isDragHintVisible = isWebgl && hasCoarsePointer;
  const stageClassName = `hero-stage hero-stage--${stageMode} ${isSceneReady ? 'hero-stage--scene-ready' : ''}`;

  return (
    <div className={stageClassName}>
      <div className="hero-stage__backdrop" aria-hidden="true">
        <span className="hero-stage__disc" />
        <span className="hero-stage__ring" />
        <svg className="hero-stage__moon" viewBox="0 0 64 64" focusable="false">
          <path d="M40 6a26 26 0 1 0 18 40A22 22 0 0 1 40 6Z" />
        </svg>
      </div>

      <div className="hero-stage__book">
        {isWebgl ? (
          <>
            <div className="hero-stage__placeholder" aria-hidden="true">
              <CssBook book={book} coverWidth={COVER_WIDTH} isStatic />
            </div>
            <Suspense fallback={null}>
              <HeroBookCanvas book={book} onReady={handleSceneReady} />
            </Suspense>
          </>
        ) : (
          <div className="hero-stage__fallback">
            <CssBook
              book={book}
              coverWidth={COVER_WIDTH}
              rotationY={CSS_BOOK_ROTATION_Y}
              isStatic={stageMode === STAGE_MODE.staticCover}
            />
          </div>
        )}
      </div>

      {isDragHintVisible && <p className="hero-stage__hint">{translate('hero.dragHint')}</p>}
    </div>
  );
}
