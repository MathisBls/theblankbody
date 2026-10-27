import { lazy, Suspense, useState, type ReactNode } from 'react';
import { CssBook } from '../../components/CssBook/CssBook';
import type { Book } from '../../data/catalog';
import { useDeviceCapabilities, type DeviceCapabilities } from '../../hooks/useDeviceCapabilities';
import { translate } from '../../i18n';

const ProductBookViewer = lazy(() =>
  import('./ProductBookViewer').then((module) => ({ default: module.ProductBookViewer })),
);

const VIEWER_MODE = {
  webgl: 'webgl',
  css: 'css',
  still: 'still',
} as const;
type ViewerMode = (typeof VIEWER_MODE)[keyof typeof VIEWER_MODE];

const CSS_BOOK_WIDTH = 'min(16rem, 52vw)';
const CSS_BOOK_FRONT_ROTATION = -22;
const CSS_BOOK_BACK_ROTATION = 180;

function getViewerMode(capabilities: DeviceCapabilities): ViewerMode {
  if (capabilities.canRender3d) return VIEWER_MODE.webgl;
  if (capabilities.supportsWebgl || capabilities.prefersReducedMotion) return VIEWER_MODE.still;
  return VIEWER_MODE.css;
}

export interface ProductBookStageProps {
  book: Book;
}

/** Product hero visual: 3D viewer when possible, CSS book without WebGL, flat covers with reduced motion. */
export function ProductBookStage({ book }: ProductBookStageProps) {
  const viewerMode = getViewerMode(useDeviceCapabilities());
  const [isOpen, setIsOpen] = useState(false);
  const [isShowingBack, setIsShowingBack] = useState(false);

  const toggleOpen = () => {
    setIsOpen((wasOpen) => !wasOpen);
    setIsShowingBack(false);
  };
  const toggleSide = () => {
    setIsShowingBack((wasShowingBack) => !wasShowingBack);
    setIsOpen(false);
  };

  const view = {
    isWebgl: viewerMode === VIEWER_MODE.webgl,
    controlsLabel: translate('product.viewerControlsLabel'),
    dragHint: translate('product.dragHint'),
    openLabel: translate(isOpen ? 'product.closeBook' : 'product.openBook'),
    sideLabel: translate(isShowingBack ? 'product.showFront' : 'product.showBack'),
    cssRotation: isShowingBack ? CSS_BOOK_BACK_ROTATION : CSS_BOOK_FRONT_ROTATION,
    stillSrc: isShowingBack ? book.images.back : book.images.front,
    stillAlt: translate(isShowingBack ? 'books.backAlt' : 'books.coverAlt', { title: book.title }),
    loadingAlt: translate('books.coverAlt', { title: book.title }),
  };

  const visualByMode: Record<ViewerMode, ReactNode> = {
    [VIEWER_MODE.webgl]: (
      <Suspense
        fallback={
          <div className="product-stage__still">
            <img className="product-stage__cover" src={book.images.front} alt={view.loadingAlt} decoding="async" />
          </div>
        }
      >
        <ProductBookViewer book={book} isOpen={isOpen} isShowingBack={isShowingBack} onSideChange={setIsShowingBack} />
      </Suspense>
    ),
    [VIEWER_MODE.css]: (
      <div className="product-stage__still">
        <CssBook book={book} coverWidth={CSS_BOOK_WIDTH} rotationY={view.cssRotation} />
      </div>
    ),
    [VIEWER_MODE.still]: (
      <div className="product-stage__still">
        <img className="product-stage__cover" src={view.stillSrc} alt={view.stillAlt} decoding="async" />
      </div>
    ),
  };

  return (
    <div className="product-stage">
      <div className="product-stage__frame">{visualByMode[viewerMode]}</div>

      <div className="product-stage__controls" role="group" aria-label={view.controlsLabel}>
        {view.isWebgl && (
          <button type="button" className="product-stage__toggle" onClick={toggleOpen}>
            {view.openLabel}
          </button>
        )}
        <button type="button" className="product-stage__toggle" onClick={toggleSide}>
          {view.sideLabel}
        </button>
      </div>
      {view.isWebgl && <p className="product-stage__hint">{view.dragHint}</p>}
    </div>
  );
}
