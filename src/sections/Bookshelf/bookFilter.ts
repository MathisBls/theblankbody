import { BOOK_SERIES, SERIES_ORDER, type Book, type BookSeries } from '../../data/catalog';
import { translate, translateDynamic } from '../../i18n';

export const ALL_BOOKS_FILTER = 'all';
export type BookFilter = BookSeries | typeof ALL_BOOKS_FILTER;
export const BOOK_FILTERS: readonly BookFilter[] = [ALL_BOOKS_FILTER, ...SERIES_ORDER];

export interface SeriesPalette {
  fill: string;
  ink: string;
}

const NEUTRAL_PALETTE: SeriesPalette = { fill: 'var(--color-ink)', ink: 'var(--color-white)' };

const SERIES_PALETTES: Record<BookSeries, SeriesPalette> = {
  [BOOK_SERIES.sleep]: { fill: 'var(--color-series-sleep)', ink: 'var(--color-white)' },
  [BOOK_SERIES.energy]: { fill: 'var(--color-series-energy)', ink: 'var(--color-ink)' },
  [BOOK_SERIES.posture]: { fill: 'var(--color-series-posture)', ink: 'var(--color-ink)' },
};

export function getSeriesPalette(series: BookSeries): SeriesPalette {
  return SERIES_PALETTES[series];
}

export function getFilterPalette(filter: BookFilter): SeriesPalette {
  return filter === ALL_BOOKS_FILTER ? NEUTRAL_PALETTE : getSeriesPalette(filter);
}

export function filterBooks(books: readonly Book[], filter: BookFilter): readonly Book[] {
  return filter === ALL_BOOKS_FILTER ? books : books.filter((book) => book.series === filter);
}

export function formatFilterLabel(filter: BookFilter): string {
  return filter === ALL_BOOKS_FILTER
    ? translate('books.filter.all')
    : translateDynamic(`books.filter.${filter}`, 'books.filter.all');
}

export function formatSeriesLabel(series: BookSeries): string {
  return translateDynamic(`books.series.${series}`, 'books.panelLabel');
}
