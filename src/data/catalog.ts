import rawCatalog from '../../content/catalog.json';
import { EXTERNAL_LINKS } from '../config/links';
import { THEME_COLORS } from '../theme';

export const BOOK_STATUS = {
  available: 'available',
  comingSoon: 'coming-soon',
} as const;
export type BookStatus = (typeof BOOK_STATUS)[keyof typeof BOOK_STATUS];

export const BOOK_SERIES = {
  sleep: 'Sleep',
  energy: 'Energy',
  posture: 'Posture',
} as const;
export type BookSeries = (typeof BOOK_SERIES)[keyof typeof BOOK_SERIES];
export const SERIES_ORDER: readonly BookSeries[] = [BOOK_SERIES.sleep, BOOK_SERIES.energy, BOOK_SERIES.posture];

export const SERIES_COLORS: Record<BookSeries, string> = {
  [BOOK_SERIES.sleep]: THEME_COLORS.navy,
  [BOOK_SERIES.energy]: THEME_COLORS.orange,
  [BOOK_SERIES.posture]: THEME_COLORS.green,
};

const FALLBACK_COVER_SIZE_PX = { front: [1600, 2400], spine: [180, 2400] } as const;

export interface BookImages {
  front: string;
  back: string;
  spine: string;
  mockup?: string;
}

/** Same field names as content/catalog.json, with image paths resolved to optimized web URLs. */
export interface Book {
  slug: string;
  title: string;
  subtitle: string;
  series: BookSeries;
  accent: string;
  status: BookStatus;
  price: string;
  pages: number | null;
  format: string;
  url: string;
  blurb: string;
  bullets: string[];
  images: BookImages;
  cover_size_px: { front: readonly [number, number]; spine: readonly [number, number] };
  file?: string;
}

/** 3D dimensions in world units: covers are 2 units wide, the rest follows the image ratios. */
export interface BookDimensions {
  width: number;
  height: number;
  thickness: number;
}

const COVER_WORLD_WIDTH = 2;

function toMediaUrl(contentPath: string): string {
  return `/media/${contentPath.replace(/\.[a-z]+$/i, '.webp')}`;
}

function isBookStatus(value: string): value is BookStatus {
  return Object.values<string>(BOOK_STATUS).includes(value);
}

function isBookSeries(value: string): value is BookSeries {
  return Object.values<string>(BOOK_SERIES).includes(value);
}

function toSizePair(value: unknown, fallback: readonly [number, number]): readonly [number, number] {
  if (Array.isArray(value) && value.length === 2 && value.every((item) => typeof item === 'number')) {
    return [value[0], value[1]];
  }
  return fallback;
}

type RawBook = (typeof rawCatalog)[number];

function parseBook(rawBook: RawBook): Book {
  const series = isBookSeries(rawBook.series) ? rawBook.series : BOOK_SERIES.sleep;
  const status = isBookStatus(rawBook.status) ? rawBook.status : BOOK_STATUS.comingSoon;
  const rawImages: Partial<Record<keyof BookImages, string>> = rawBook.images;

  return {
    slug: rawBook.slug,
    title: rawBook.title,
    subtitle: rawBook.subtitle,
    series,
    accent: rawBook.accent || SERIES_COLORS[series],
    status,
    price: rawBook.price,
    pages: rawBook.pages,
    format: rawBook.format,
    url: rawBook.url ?? EXTERNAL_LINKS.beacons,
    blurb: rawBook.blurb,
    bullets: rawBook.bullets,
    images: {
      front: toMediaUrl(rawImages.front ?? `books/${rawBook.slug}/front.png`),
      back: toMediaUrl(rawImages.back ?? `books/${rawBook.slug}/back.png`),
      spine: toMediaUrl(rawImages.spine ?? `books/${rawBook.slug}/spine.png`),
      mockup: rawImages.mockup ? toMediaUrl(rawImages.mockup) : undefined,
    },
    cover_size_px: {
      front: toSizePair(rawBook.cover_size_px?.front, FALLBACK_COVER_SIZE_PX.front),
      spine: toSizePair(rawBook.cover_size_px?.spine, FALLBACK_COVER_SIZE_PX.spine),
    },
    file: 'file' in rawBook && typeof rawBook.file === 'string' ? `/media/${rawBook.file}` : undefined,
  };
}

export const BOOKS: readonly Book[] = rawCatalog.map(parseBook);

export const FEATURED_BOOK: Book =
  BOOKS.find((book) => book.status === BOOK_STATUS.available) ?? BOOKS[0];

export function isBookAvailable(book: Book): boolean {
  return book.status === BOOK_STATUS.available;
}

export function findBookBySlug(slug: string): Book | undefined {
  return BOOKS.find((book) => book.slug === slug);
}

export const OFFER_KIND = {
  free: 'free',
  paid: 'paid',
  comingSoon: 'coming-soon',
} as const;
export type OfferKind = (typeof OFFER_KIND)[keyof typeof OFFER_KIND];

const FREE_PRICE_LABEL = 'free';

/** Commercial state of a book: free download, paid product, or not on sale yet. */
export function getOfferKind(book: Book): OfferKind {
  if (!isBookAvailable(book)) return OFFER_KIND.comingSoon;
  return book.price.trim().toLowerCase() === FREE_PRICE_LABEL ? OFFER_KIND.free : OFFER_KIND.paid;
}

export function getBookDimensions(book: Book): BookDimensions {
  const [frontWidthPx, frontHeightPx] = book.cover_size_px.front;
  const [spineWidthPx] = book.cover_size_px.spine;
  return {
    width: COVER_WORLD_WIDTH,
    height: (COVER_WORLD_WIDTH * frontHeightPx) / frontWidthPx,
    thickness: (COVER_WORLD_WIDTH * spineWidthPx) / frontWidthPx,
  };
}
