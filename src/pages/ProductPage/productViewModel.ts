import { formatBookCtaLabel, formatBookFormat, formatBookPrice } from '../../components/BookOffer/bookOfferFormat';
import { SECTION_IDS } from '../../config/links';
import { buildProductPath, buildSectionHref, ROUTES } from '../../config/routes';
import {
  BOOK_SERIES,
  BOOKS,
  getOfferKind,
  isBookAvailable,
  OFFER_KIND,
  type Book,
  type BookSeries,
} from '../../data/catalog';
import { translate, translateDynamic } from '../../i18n';

const RELATED_BOOKS_LIMIT = 4;

/** Series colours as theme variables, with a text colour that keeps contrast on top of them. */
const SERIES_PILL_COLORS: Record<BookSeries, { background: string; text: string }> = {
  [BOOK_SERIES.sleep]: { background: 'var(--color-series-sleep)', text: 'var(--color-white)' },
  [BOOK_SERIES.energy]: { background: 'var(--color-series-energy)', text: 'var(--color-ink)' },
  [BOOK_SERIES.posture]: { background: 'var(--color-series-posture)', text: 'var(--color-ink)' },
};

export interface ProductInsideItem {
  key: string;
  label: string;
  text: string;
}

export interface ProductDetailRow {
  key: string;
  label: string;
  value: string;
}

export interface RelatedBookCard {
  book: Book;
  href: string;
  coverAlt: string;
}

export interface ProductGalleryImage {
  key: string;
  src: string;
  alt: string;
  caption: string;
}

export interface ProductViewModel {
  book: Book;
  homeHref: string;
  booksHref: string;
  seriesLabel: string;
  seriesColor: string;
  seriesTextColor: string;
  isAvailable: boolean;
  isOnSale: boolean;
  insideItems: ProductInsideItem[];
  detailRows: ProductDetailRow[];
  galleryImages: ProductGalleryImage[];
  mockup: { src: string; alt: string } | null;
  relatedTitle: string;
  relatedBooks: RelatedBookCard[];
  ctaLabel: string;
}

export function getSeriesLabel(series: BookSeries): string {
  return translateDynamic(`books.series.${series}`, 'product.series');
}

function selectRelatedBooks(book: Book): { isSameSeries: boolean; books: Book[] } {
  const otherBooks = BOOKS.filter((candidate) => candidate.slug !== book.slug);
  const sameSeriesBooks = otherBooks.filter((candidate) => candidate.series === book.series);
  const isSameSeries = sameSeriesBooks.length > 0;
  return {
    isSameSeries,
    books: (isSameSeries ? sameSeriesBooks : otherBooks).slice(0, RELATED_BOOKS_LIMIT),
  };
}

function buildGalleryImages(book: Book): ProductGalleryImage[] {
  if (!isBookAvailable(book)) return [];
  return [
    {
      key: 'front',
      src: book.images.front,
      alt: translate('books.coverAlt', { title: book.title }),
      caption: translate('product.gallery.front'),
    },
    {
      key: 'back',
      src: book.images.back,
      alt: translate('books.backAlt', { title: book.title }),
      caption: translate('product.gallery.back'),
    },
  ];
}

export function buildProductViewModel(book: Book): ProductViewModel {
  const seriesLabel = getSeriesLabel(book.series);
  const isAvailable = isBookAvailable(book);
  const related = selectRelatedBooks(book);
  const seriesColors = SERIES_PILL_COLORS[book.series];

  return {
    book,
    homeHref: ROUTES.home,
    booksHref: buildSectionHref(SECTION_IDS.books),
    seriesLabel,
    seriesColor: seriesColors.background,
    seriesTextColor: seriesColors.text,
    isAvailable,
    isOnSale: getOfferKind(book) !== OFFER_KIND.comingSoon,
    insideItems: book.bullets.map((text, index) => ({
      key: `${index}-${text}`,
      label: translate('product.insideItemLabel', { number: index + 1 }),
      text,
    })),
    detailRows: [
      { key: 'series', label: translate('product.series'), value: seriesLabel },
      { key: 'format', label: translate('books.format'), value: formatBookFormat(book) },
      { key: 'price', label: translate('books.price'), value: formatBookPrice(book) },
      {
        key: 'status',
        label: translate('product.status'),
        value: translate(isAvailable ? 'product.status.available' : 'product.status.comingSoon'),
      },
    ],
    galleryImages: buildGalleryImages(book),
    mockup:
      isAvailable && book.images.mockup
        ? { src: book.images.mockup, alt: translate('product.mockupAlt', { title: book.title }) }
        : null,
    relatedTitle: related.isSameSeries
      ? translate('product.moreFromSeries', { series: seriesLabel })
      : translate('product.otherBooks'),
    relatedBooks: related.books.map((relatedBook) => ({
      book: relatedBook,
      href: buildProductPath(relatedBook.slug),
      coverAlt: translate('books.coverAlt', { title: relatedBook.title }),
    })),
    ctaLabel: formatBookCtaLabel(book),
  };
}
