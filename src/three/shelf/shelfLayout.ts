import { getBookDimensions, type Book } from '../../data/catalog';

export const SHELF_LAYOUT_MODE = {
  grid: 'grid',
  carousel: 'carousel',
} as const;
export type ShelfLayoutMode = (typeof SHELF_LAYOUT_MODE)[keyof typeof SHELF_LAYOUT_MODE];

export const SHELF_METRICS = {
  slotWidth: 2.8,
  rowGap: 0.85,
  floatGap: 0.22,
  plankThickness: 0.26,
  plankDepth: 1.6,
  plankOverhang: 0.5,
  framePadding: 0.45,
  carouselVisibleSlots: 1.35,
  carouselMaxAspect: 1,
  /** Smallest share of the full stage height kept with fewer rows, so an opened book still reads well. */
  minVisibleHeightFraction: 0.6,
} as const;

const CAMERA_FOV_DEGREES: Record<ShelfLayoutMode, number> = {
  [SHELF_LAYOUT_MODE.grid]: 30,
  [SHELF_LAYOUT_MODE.carousel]: 36,
};

export interface ShelfSlot {
  x: number;
  y: number;
}

export interface ShelfPlankLayout {
  key: string;
  centerX: number;
  /** Y of the plank top surface, where books stand. */
  topY: number;
  width: number;
  isVisible: boolean;
}

/** World-space box the camera must keep fully in view. */
export interface ShelfFrame {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

export interface ShelfLayout {
  mode: ShelfLayoutMode;
  fovDegrees: number;
  slotsBySlug: ReadonlyMap<string, ShelfSlot>;
  planks: readonly ShelfPlankLayout[];
  frame: ShelfFrame;
  /**
   * Share of the full-height canvas left visible by the stage (a band centred vertically). Below 1 when the
   * filter leaves fewer rows than the whole catalogue needs, so the stage shrinks instead of showing empty shelves.
   */
  visibleHeightFraction: number;
  /** Height the camera fits in the full canvas: the whole catalogue's, so the book scale stays the same across filters. */
  fitHeight: number;
  /** Horizontal camera travel allowed in carousel mode (both 0 in grid mode). */
  scrollMin: number;
  scrollMax: number;
  slotXs: readonly number[];
}

/** What the DOM stage needs to know about the current layout. */
export interface ShelfLayoutSummary {
  mode: ShelfLayoutMode;
  visibleHeightFraction: number;
}

export const DEFAULT_SHELF_LAYOUT_SUMMARY: ShelfLayoutSummary = {
  mode: SHELF_LAYOUT_MODE.grid,
  visibleHeightFraction: 1,
};

function getTallestBookHeight(books: readonly Book[]): number {
  return books.reduce((tallest, book) => Math.max(tallest, getBookDimensions(book).height), 0);
}

function getRowHeight(tallestBookHeight: number): number {
  return tallestBookHeight + SHELF_METRICS.floatGap + SHELF_METRICS.plankThickness + SHELF_METRICS.rowGap;
}

function getGridFrameSize(columns: number, rows: number, rowHeight: number) {
  return {
    width: columns * SHELF_METRICS.slotWidth + SHELF_METRICS.framePadding * 2,
    height: rows * rowHeight - SHELF_METRICS.rowGap + SHELF_METRICS.framePadding * 2,
  };
}

/** Picks the column count that renders the books the largest for this canvas aspect. */
function findBestColumnCount(bookCount: number, aspect: number, rowHeight: number): number {
  let bestColumns = 1;
  let bestScale = 0;
  for (let columns = 1; columns <= bookCount; columns += 1) {
    const rows = Math.ceil(bookCount / columns);
    const frame = getGridFrameSize(columns, rows, rowHeight);
    const scale = Math.min(aspect / frame.width, 1 / frame.height);
    if (scale > bestScale) {
      bestScale = scale;
      bestColumns = columns;
    }
  }
  return bestColumns;
}

function getBookStandingY(book: Book, plankTopY: number): number {
  return plankTopY + SHELF_METRICS.floatGap + getBookDimensions(book).height / 2;
}

function getCenteredSlotX(indexInRow: number, booksInRow: number): number {
  return (indexInRow - (booksInRow - 1) / 2) * SHELF_METRICS.slotWidth;
}

function buildGridLayout(visibleBooks: readonly Book[], catalogBooks: readonly Book[], aspect: number): ShelfLayout {
  const tallestBookHeight = getTallestBookHeight(catalogBooks);
  const rowHeight = getRowHeight(tallestBookHeight);
  const columns = findBestColumnCount(Math.max(catalogBooks.length, 1), aspect, rowHeight);
  const catalogRows = Math.max(1, Math.ceil(catalogBooks.length / columns));
  const visibleRows = Math.max(1, Math.ceil(visibleBooks.length / columns));
  const getPlankTopY = (row: number) => -row * rowHeight;

  const slotsBySlug = new Map<string, ShelfSlot>();
  visibleBooks.forEach((book, index) => {
    const row = Math.floor(index / columns);
    const booksInRow = Math.min(columns, visibleBooks.length - row * columns);
    slotsBySlug.set(book.slug, {
      x: getCenteredSlotX(index % columns, booksInRow),
      y: getBookStandingY(book, getPlankTopY(row)),
    });
  });

  const plankWidth = columns * SHELF_METRICS.slotWidth + SHELF_METRICS.plankOverhang;
  const planks = Array.from({ length: catalogRows }, (_, row) => ({
    key: `row-${row}`,
    centerX: 0,
    topY: getPlankTopY(row),
    width: plankWidth,
    isVisible: row < visibleRows,
  }));

  const frameSize = getGridFrameSize(columns, visibleRows, rowHeight);
  const catalogFrameSize = getGridFrameSize(columns, catalogRows, rowHeight);
  const visibleHeightFraction = Math.min(
    1,
    Math.max(SHELF_METRICS.minVisibleHeightFraction, frameSize.height / catalogFrameSize.height),
  );
  const frameTop = SHELF_METRICS.floatGap + tallestBookHeight + SHELF_METRICS.framePadding;
  return {
    mode: SHELF_LAYOUT_MODE.grid,
    fovDegrees: CAMERA_FOV_DEGREES[SHELF_LAYOUT_MODE.grid],
    slotsBySlug,
    planks,
    frame: { centerX: 0, centerY: frameTop - frameSize.height / 2, ...frameSize },
    visibleHeightFraction,
    fitHeight: catalogFrameSize.height,
    scrollMin: 0,
    scrollMax: 0,
    slotXs: [],
  };
}

function buildCarouselLayout(visibleBooks: readonly Book[], catalogBooks: readonly Book[]): ShelfLayout {
  const tallestBookHeight = getTallestBookHeight(catalogBooks);
  const slotXs = visibleBooks.map((_, index) => getCenteredSlotX(index, visibleBooks.length));
  const slotsBySlug = new Map<string, ShelfSlot>();
  visibleBooks.forEach((book, index) => {
    slotsBySlug.set(book.slug, { x: slotXs[index] ?? 0, y: getBookStandingY(book, 0) });
  });

  const frameHeight =
    tallestBookHeight + SHELF_METRICS.floatGap + SHELF_METRICS.plankThickness + SHELF_METRICS.framePadding * 2;
  const frameTop = SHELF_METRICS.floatGap + tallestBookHeight + SHELF_METRICS.framePadding;
  return {
    mode: SHELF_LAYOUT_MODE.carousel,
    fovDegrees: CAMERA_FOV_DEGREES[SHELF_LAYOUT_MODE.carousel],
    slotsBySlug,
    planks: [
      {
        key: 'row-0',
        centerX: 0,
        topY: 0,
        width: Math.max(visibleBooks.length, 1) * SHELF_METRICS.slotWidth + SHELF_METRICS.plankOverhang,
        isVisible: true,
      },
    ],
    frame: {
      centerX: 0,
      centerY: frameTop - frameHeight / 2,
      width: SHELF_METRICS.carouselVisibleSlots * SHELF_METRICS.slotWidth,
      height: frameHeight,
    },
    visibleHeightFraction: 1,
    fitHeight: frameHeight,
    scrollMin: slotXs[0] ?? 0,
    scrollMax: slotXs[slotXs.length - 1] ?? 0,
    slotXs,
  };
}

export function getShelfLayoutMode(aspect: number): ShelfLayoutMode {
  return aspect < SHELF_METRICS.carouselMaxAspect ? SHELF_LAYOUT_MODE.carousel : SHELF_LAYOUT_MODE.grid;
}

export function buildShelfLayout(
  visibleBooks: readonly Book[],
  catalogBooks: readonly Book[],
  aspect: number,
): ShelfLayout {
  return getShelfLayoutMode(aspect) === SHELF_LAYOUT_MODE.carousel
    ? buildCarouselLayout(visibleBooks, catalogBooks)
    : buildGridLayout(visibleBooks, catalogBooks, aspect);
}

/** Camera distance at which a `width` x `height` box fills the view. */
export function getFitDistance(width: number, height: number, fovDegrees: number, aspect: number): number {
  const tanHalfFov = Math.tan((fovDegrees * Math.PI) / 360);
  return Math.max(height / 2 / tanHalfFov, width / 2 / (tanHalfFov * aspect));
}

export function findNearestValue(values: readonly number[], target: number): number {
  return values.reduce(
    (nearest, value) => (Math.abs(value - target) < Math.abs(nearest - target) ? value : nearest),
    values[0] ?? target,
  );
}

export const SHELF_REVEAL = {
  /** Delay between two books rising onto the shelf. */
  staggerSeconds: 0.11,
  /** Extra delay before a book's price sticker pops in. */
  stickerDelaySeconds: 0.35,
} as const;
