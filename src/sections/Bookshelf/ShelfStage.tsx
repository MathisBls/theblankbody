import {
  lazy,
  Suspense,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type RefObject,
} from 'react';
import { PriceTag } from '../../components/BookOffer/BookOffer';
import { formatBookPrice } from '../../components/BookOffer/bookOfferFormat';
import { isBookAvailable, type Book } from '../../data/catalog';
import { translate } from '../../i18n';
import { FULL_FOCUS_FRAME, type FocusFrame } from '../../three/shelf/focusPose';
import {
  DEFAULT_SHELF_LAYOUT_SUMMARY,
  SHELF_LAYOUT_MODE,
  SHELF_REVEAL,
  type ShelfLayoutSummary,
} from '../../three/shelf/shelfLayout';
import { formatSeriesLabel } from './bookFilter';
import { PANEL_SHEET_MEDIA_QUERY } from './BookDetailPanel';
import { useInViewport } from './useInViewport';

const ShelfCanvas = lazy(() => import('../../three/shelf/ShelfCanvas'));

const CANVAS_PRELOAD_MARGIN = '60% 0px';
const MIN_FREE_WIDTH_FRACTION = 0.35;
const MIN_FREE_HEIGHT_FRACTION = 0.3;
const FOCUS_VISIBLE_SELECTOR = ':focus-visible';

export interface ShelfStageProps {
  catalogBooks: readonly Book[];
  visibleBooks: readonly Book[];
  selectedSlug: string | null;
  isBackShown: boolean;
  isRevealed: boolean;
  panelRef: RefObject<HTMLElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  onSelect: (slug: string) => void;
  onClose: () => void;
  onToggleBack: () => void;
}

interface BookStickerViewModel {
  book: Book;
  isOnSale: boolean;
  isVisible: boolean;
  style: CSSProperties;
}

interface BookTriggerViewModel {
  slug: string;
  label: string;
  summary: string;
  isExpanded: boolean;
}

function readScrollPaddingTop(): number {
  const value = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
  return Number.isFinite(value) ? value : 0;
}

/** Part of the stage left visible by the detail panel (right drawer or bottom sheet), in stage NDC. */
function measureStageFocusFrame(stage: HTMLElement, panel: HTMLElement): FocusFrame {
  const stageRect = stage.getBoundingClientRect();
  if (stageRect.width === 0 || stageRect.height === 0) return FULL_FOCUS_FRAME;

  if (window.matchMedia(PANEL_SHEET_MEDIA_QUERY).matches) {
    const freeHeight = window.innerHeight - panel.offsetHeight - readScrollPaddingTop();
    const heightFraction = Math.min(1, Math.max(MIN_FREE_HEIGHT_FRACTION, freeHeight / stageRect.height));
    return { centerX: 0, centerY: 1 - heightFraction, widthFraction: 1, heightFraction };
  }

  const panelLeft = window.innerWidth - panel.offsetWidth - (window.innerWidth - document.documentElement.clientWidth);
  const freeLeft = Math.max(stageRect.left, 0);
  const freeRight = Math.min(stageRect.right, panelLeft);
  const widthFraction = (freeRight - freeLeft) / stageRect.width;
  if (widthFraction < MIN_FREE_WIDTH_FRACTION) return FULL_FOCUS_FRAME;
  const freeCenter = (freeLeft + freeRight) / 2;
  return {
    centerX: ((freeCenter - stageRect.left) / stageRect.width) * 2 - 1,
    centerY: 0,
    widthFraction,
    heightFraction: 1,
  };
}

/** The canvas keeps the full stage height and the stage shows a centred band of it: maps stage NDC to canvas NDC. */
function toCanvasFocusFrame(stageFrame: FocusFrame, visibleHeightFraction: number): FocusFrame {
  return {
    ...stageFrame,
    centerY: stageFrame.centerY * visibleHeightFraction,
    heightFraction: stageFrame.heightFraction * visibleHeightFraction,
  };
}

/** The WebGL bookshelf plus an accessible layer of buttons mirroring the 3D books. */
export function ShelfStage({
  catalogBooks,
  visibleBooks,
  selectedSlug,
  isBackShown,
  isRevealed,
  panelRef,
  stageRef,
  onSelect,
  onClose,
  onToggleBack,
}: ShelfStageProps) {
  const isNearViewport = useInViewport(stageRef, { rootMargin: CANVAS_PRELOAD_MARGIN, isLatched: true });
  const isInViewport = useInViewport(stageRef);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [focusedSlug, setFocusedSlug] = useState<string | null>(null);
  const [layoutSummary, setLayoutSummary] = useState<ShelfLayoutSummary>(DEFAULT_SHELF_LAYOUT_SUMMARY);
  const [stageFocusFrame, setStageFocusFrame] = useState<FocusFrame>(FULL_FOCUS_FRAME);
  const wasSelectedRef = useRef(false);
  const [initialStickerElements] = useState(() => new Map<string, HTMLElement>());
  const stickerElementsRef = useRef(initialStickerElements);

  const registerSticker = (slug: string) => (element: HTMLElement | null) => {
    if (element) stickerElementsRef.current.set(slug, element);
    else stickerElementsRef.current.delete(slug);
  };

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const panel = panelRef.current;
    if (selectedSlug === null || !stage || !panel) {
      wasSelectedRef.current = false;
      return;
    }
    const isSheet = window.matchMedia(PANEL_SHEET_MEDIA_QUERY).matches;
    // The page's scroll-padding-top keeps the stage clear of the fixed header when centring it.
    if (!wasSelectedRef.current) stage.scrollIntoView({ block: isSheet ? 'start' : 'center', behavior: 'smooth' });
    wasSelectedRef.current = true;

    const updateFocusFrame = () => setStageFocusFrame(measureStageFocusFrame(stage, panel));
    updateFocusFrame();
    window.addEventListener('resize', updateFocusFrame);
    return () => window.removeEventListener('resize', updateFocusFrame);
  }, [selectedSlug, stageRef, panelRef]);

  const handleHoverChange = useCallback((slug: string, isHovered: boolean) => {
    setHoveredSlug((current) => {
      if (isHovered) return slug;
      return current === slug ? null : current;
    });
  }, []);

  const handleTriggerFocus = (slug: string) => (event: FocusEvent<HTMLButtonElement>) => {
    if (event.currentTarget.matches(FOCUS_VISIBLE_SELECTOR)) setFocusedSlug(slug);
  };

  const handleTriggerBlur = () => setFocusedSlug(null);

  const triggers: BookTriggerViewModel[] = visibleBooks.map((book) => ({
    slug: book.slug,
    label: translate('books.openBook', { title: book.title }),
    summary: translate('books.bookSummary', { series: formatSeriesLabel(book.series), price: formatBookPrice(book) }),
    isExpanded: book.slug === selectedSlug,
  }));
  const visibleIndexBySlug = new Map(visibleBooks.map((book, index) => [book.slug, index]));
  const stickers: BookStickerViewModel[] = catalogBooks.map((book) => {
    const visibleIndex = visibleIndexBySlug.get(book.slug);
    return {
      book,
      isOnSale: isBookAvailable(book),
      isVisible: isRevealed && selectedSlug === null && visibleIndex !== undefined,
      style: {
        '--sticker-delay': `${(visibleIndex ?? 0) * SHELF_REVEAL.staggerSeconds + SHELF_REVEAL.stickerDelaySeconds}s`,
      },
    };
  });
  const highlightedSlug = hoveredSlug ?? focusedSlug;
  const isPointerOverBook = hoveredSlug !== null && selectedSlug === null;
  const isCarousel = layoutSummary.mode === SHELF_LAYOUT_MODE.carousel;
  const isEmpty = visibleBooks.length === 0;
  const focusFrame = useMemo(
    () => toCanvasFocusFrame(stageFocusFrame, layoutSummary.visibleHeightFraction),
    [stageFocusFrame, layoutSummary.visibleHeightFraction],
  );
  const stageStyle: CSSProperties = { '--shelf-visible-fraction': layoutSummary.visibleHeightFraction };
  const loader = (
    <div className="shelf-stage__loader" role="status">
      <span className="shelf-stage__spinner" aria-hidden="true" />
      {translate('books.loading')}
    </div>
  );

  return (
    <>
      <div
        ref={stageRef}
        className={`shelf-stage ${isPointerOverBook ? 'shelf-stage--pointer' : ''} ${selectedSlug ? 'shelf-stage--focused' : ''}`}
        style={stageStyle}
      >
        <div className="shelf-stage__viewport">
          {isNearViewport ? (
            <Suspense fallback={loader}>
              <ShelfCanvas
                isActive={isInViewport}
                catalogBooks={catalogBooks}
                visibleBooks={visibleBooks}
                isRevealed={isRevealed}
                highlightedSlug={highlightedSlug}
                selectedSlug={selectedSlug}
                isBackShown={isBackShown}
                focusFrame={focusFrame}
                onHoverChange={handleHoverChange}
                onSelect={onSelect}
                onDismiss={onClose}
                onToggleBack={onToggleBack}
                onLayoutChange={setLayoutSummary}
                stickerElementsRef={stickerElementsRef}
              />
            </Suspense>
          ) : (
            loader
          )}

          <div className="shelf-stage__stickers" aria-hidden="true">
            {stickers.map((sticker) => (
              <div key={sticker.book.slug} ref={registerSticker(sticker.book.slug)} className="shelf-stage__sticker">
                <div className={`shelf-sticker ${sticker.isVisible ? 'shelf-sticker--visible' : ''}`} style={sticker.style}>
                  {sticker.isOnSale ? (
                    <PriceTag book={sticker.book} />
                  ) : (
                    <span className="shelf-sticker__badge">{translate('books.badge.comingSoon')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isEmpty ? <p className="shelf-stage__empty bookshelf-empty">{translate('books.empty')}</p> : null}

        <ul className="shelf-stage__triggers visually-hidden" aria-label={translate('books.shelfLabel')}>
          {triggers.map((trigger) => (
            <li key={trigger.slug}>
              <button
                type="button"
                className="shelf-stage__trigger"
                data-book-trigger={trigger.slug}
                aria-haspopup="dialog"
                aria-expanded={trigger.isExpanded}
                onClick={() => onSelect(trigger.slug)}
                onFocus={handleTriggerFocus(trigger.slug)}
                onBlur={handleTriggerBlur}
              >
                <span>{trigger.label}</span> <span>{trigger.summary}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {isCarousel ? (
        <p className="shelf-stage__hint" aria-hidden="true">
          {translate('books.swipeHint')}
        </p>
      ) : null}
    </>
  );
}
