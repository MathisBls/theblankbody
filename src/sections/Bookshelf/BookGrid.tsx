import { useId, type CSSProperties, type PointerEvent } from 'react';
import { CssBook } from '../../components/CssBook/CssBook';
import { PriceTag } from '../../components/BookOffer/BookOffer';
import { formatBookPrice } from '../../components/BookOffer/bookOfferFormat';
import { isBookAvailable, type Book } from '../../data/catalog';
import { translate } from '../../i18n';
import { formatSeriesLabel } from './bookFilter';
import { SHELF_RENDER_MODE, type BookGridVariant } from './shelfRenderMode';


const GRID_COVER_WIDTH = '9.5rem';
const GRID_BOOK_ROTATION_DEGREES = { x: 4, y: -18 } as const;
const TILT_X_PROPERTY = '--tilt-x';
const TILT_Y_PROPERTY = '--tilt-y';

export interface BookGridProps {
  books: readonly Book[];
  variant: BookGridVariant;
  selectedSlug: string | null;
  isRevealed: boolean;
  onSelect: (slug: string) => void;
}

interface BookCardViewModel {
  book: Book;
  label: string;
  summary: string;
  descriptionId: string;
  seriesLabel: string;
  isOnSale: boolean;
  isExpanded: boolean;
  style: CSSProperties;
}

function setCardTilt(event: PointerEvent<HTMLButtonElement>) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  card.style.setProperty(TILT_X_PROPERTY, String(((event.clientX - rect.left) / rect.width) * 2 - 1));
  card.style.setProperty(TILT_Y_PROPERTY, String(((event.clientY - rect.top) / rect.height) * 2 - 1));
}

function resetCardTilt(event: PointerEvent<HTMLButtonElement>) {
  event.currentTarget.style.removeProperty(TILT_X_PROPERTY);
  event.currentTarget.style.removeProperty(TILT_Y_PROPERTY);
}

/** Fallback catalogue without WebGL (CSS 3D books) or with reduced motion (static covers). */
export function BookGrid({ books, variant, selectedSlug, isRevealed, onSelect }: BookGridProps) {
  const idPrefix = useId();
  const isCss3d = variant === SHELF_RENDER_MODE.css3d;
  const cards: BookCardViewModel[] = books.map((book, index) => ({
    book,
    label: translate('books.openBook', { title: book.title }),
    summary: translate('books.bookSummary', { series: formatSeriesLabel(book.series), price: formatBookPrice(book) }),
    descriptionId: `${idPrefix}-${book.slug}`,
    seriesLabel: formatSeriesLabel(book.series),
    isOnSale: isBookAvailable(book),
    isExpanded: book.slug === selectedSlug,
    style: { '--card-index': index },
  }));

  return (
    <ul
      className={`book-grid book-grid--${variant} ${isRevealed ? 'book-grid--revealed' : ''}`}
      aria-label={translate('books.shelfLabel')}
    >
      {cards.map((card) => (
        <li key={card.book.slug} className="book-grid__item" style={card.style}>
          <button
            type="button"
            className="book-grid__card"
            data-book-trigger={card.book.slug}
            aria-haspopup="dialog"
            aria-expanded={card.isExpanded}
            aria-label={card.label}
            aria-describedby={card.descriptionId}
            onClick={() => onSelect(card.book.slug)}
            onPointerMove={isCss3d ? setCardTilt : undefined}
            onPointerLeave={isCss3d ? resetCardTilt : undefined}
          >
            <span className="book-grid__cover">
              <CssBook
                book={card.book}
                coverWidth={GRID_COVER_WIDTH}
                isStatic={!isCss3d}
                rotationY={GRID_BOOK_ROTATION_DEGREES.y}
                rotationX={GRID_BOOK_ROTATION_DEGREES.x}
              />
              <span className="book-grid__sticker" aria-hidden="true">
                {card.isOnSale ? (
                  <PriceTag book={card.book} />
                ) : (
                  <span className="shelf-sticker__badge">{translate('books.badge.comingSoon')}</span>
                )}
              </span>
            </span>
            <span className="book-grid__series">{card.seriesLabel}</span>
            <span className="book-grid__title">{card.book.title}</span>
          </button>
          <span id={card.descriptionId} className="visually-hidden">
            {card.summary}
          </span>
        </li>
      ))}
    </ul>
  );
}
