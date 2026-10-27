import { useCallback, useEffect, useId, useRef, type CSSProperties, type KeyboardEvent, type ReactNode, type Ref, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'wouter';
import { BookOffer } from '../../components/BookOffer/BookOffer';
import { buildProductPath } from '../../config/routes';
import type { Book } from '../../data/catalog';
import { translate } from '../../i18n';
import { formatSeriesLabel, getSeriesPalette } from './bookFilter';
import './BookDetailPanel.css';

/** Below this width the panel becomes a bottom sheet (keep in sync with BookDetailPanel.css). */
export const PANEL_SHEET_MEDIA_QUERY = '(max-width: 47.9375rem)';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const ESCAPE_KEY = 'Escape';
const TAB_KEY = 'Tab';

export interface BookDetailPanelProps {
  /** Book shown in the panel; kept after closing so the slide-out still has content. */
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  isBackShown?: boolean;
  /** When provided, a button lets the visitor turn the book to see its back cover. */
  onToggleBack?: () => void;
  /** Optional visual of the book (fallback modes, where no 3D book floats next to the panel). */
  media?: ReactNode;
  hint?: string;
  /** Clicks inside this element are not treated as "outside" clicks (e.g. the 3D stage handles its own). */
  insideRef?: RefObject<HTMLElement | null>;
  ref?: Ref<HTMLElement>;
}

function isNodeInside(container: HTMLElement | null | undefined, target: EventTarget | null): boolean {
  return container !== null && container !== undefined && target instanceof Node && container.contains(target);
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">
      <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Accessible side panel (bottom sheet on small screens) with a book's details and offer. */
export function BookDetailPanel({
  book,
  isOpen,
  onClose,
  isBackShown = false,
  onToggleBack,
  media,
  hint,
  insideRef,
  ref,
}: BookDetailPanelProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus({ preventScroll: true });
  }, [isOpen, book]);

  useEffect(() => {
    if (!isOpen) return;
    const handleDocumentKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === ESCAPE_KEY) onCloseRef.current();
    };
    const handleDocumentPointerDown = (event: PointerEvent) => {
      if (isNodeInside(panelRef.current, event.target) || isNodeInside(insideRef?.current, event.target)) return;
      onCloseRef.current();
    };
    document.addEventListener('keydown', handleDocumentKeyDown);
    document.addEventListener('pointerdown', handleDocumentPointerDown);
    return () => {
      document.removeEventListener('keydown', handleDocumentKeyDown);
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
    };
  }, [isOpen, insideRef]);

  const trapFocus = (event: KeyboardEvent<HTMLElement>) => {
    const panel = panelRef.current;
    if (event.key !== TAB_KEY || !panel) return;
    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const setPanelElement = useCallback(
    (element: HTMLElement | null) => {
      panelRef.current = element;
      if (typeof ref === 'function') ref(element);
      else if (ref) ref.current = element;
    },
    [ref],
  );

  const palette = book ? getSeriesPalette(book.series) : null;
  const seriesStyle: CSSProperties = palette ? { '--series-fill': palette.fill, '--series-ink': palette.ink } : {};
  const seriesLabel = book ? formatSeriesLabel(book.series) : '';
  const flipLabel = translate(isBackShown ? 'books.flipFront' : 'books.flip');
  const productPath = book ? buildProductPath(book.slug) : '';

  return createPortal(
    <aside
      ref={setPanelElement}
      className={`book-panel ${isOpen ? 'book-panel--open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-hidden={!isOpen}
      inert={!isOpen}
      onKeyDown={trapFocus}
    >
      {book ? (
        <div className="book-panel__scroll">
          <div className="book-panel__top">
            <span className="book-panel__series" style={seriesStyle}>
              {seriesLabel}
            </span>
            <button
              ref={closeButtonRef}
              type="button"
              className="book-panel__close"
              aria-label={translate('books.close')}
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </div>

          {media ? <div className="book-panel__media">{media}</div> : null}

          {onToggleBack ? (
            <div className="book-panel__turn">
              <button type="button" className="button button--ghost book-panel__flip" onClick={onToggleBack}>
                {flipLabel}
              </button>
              {hint ? <p className="book-panel__hint">{hint}</p> : null}
            </div>
          ) : null}

          <h2 id={titleId} className="book-panel__title">
            {book.title}
          </h2>
          <p className="book-panel__subtitle">{book.subtitle}</p>
          <p className="book-panel__blurb">{book.blurb}</p>

          <h3 className="book-panel__inside">{translate('books.inside')}</h3>
          <ul className="book-panel__bullets">
            {book.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>

          <div className="book-panel__offer">
            <BookOffer book={book} />
          </div>

          <Link href={productPath} className="book-panel__details" onClick={onClose}>
            {translate('product.viewDetails')}
            <ArrowIcon />
          </Link>
        </div>
      ) : null}
    </aside>,
    document.body,
  );
}
