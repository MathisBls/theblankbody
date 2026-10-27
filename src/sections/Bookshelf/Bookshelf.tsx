import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { CssBook } from '../../components/CssBook/CssBook';
import { SECTION_IDS } from '../../config/links';
import { BOOKS, findBookBySlug } from '../../data/catalog';
import { useDeviceCapabilities } from '../../hooks/useDeviceCapabilities';
import { translate, translatePlural } from '../../i18n';
import { BookDetailPanel } from './BookDetailPanel';
import { BookGrid } from './BookGrid';
import { BookFilterChips } from './BookFilterChips';
import { ALL_BOOKS_FILTER, BOOK_FILTERS, filterBooks, type BookFilter } from './bookFilter';
import { getShelfRenderMode, SHELF_RENDER_MODE } from './shelfRenderMode';
import { ShelfStage } from './ShelfStage';
import { useInViewport } from './useInViewport';
import './Bookshelf.css';

const REVEAL_ROOT_MARGIN = '0px 0px -25% 0px';
const PANEL_BOOK_WIDTH = '8rem';
const PANEL_BOOK_YAW_DEGREES = { front: -22, back: 158 } as const;

function focusBookTrigger(container: HTMLElement | null, slug: string): void {
  container?.querySelector<HTMLElement>(`[data-book-trigger="${CSS.escape(slug)}"]`)?.focus({ preventScroll: true });
}

export function Bookshelf() {
  const titleId = useId();
  const { canRender3d, prefersReducedMotion } = useDeviceCapabilities();
  const renderMode = getShelfRenderMode(canRender3d, prefersReducedMotion);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const isRevealed = useInViewport(sectionRef, { rootMargin: REVEAL_ROOT_MARGIN, isLatched: true });

  const [activeFilter, setActiveFilter] = useState<BookFilter>(ALL_BOOKS_FILTER);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [displayedSlug, setDisplayedSlug] = useState<string | null>(null);
  const [isBackShown, setIsBackShown] = useState(false);
  const selectedSlugRef = useRef(selectedSlug);

  useEffect(() => {
    selectedSlugRef.current = selectedSlug;
  }, [selectedSlug]);

  const visibleBooks = useMemo(() => filterBooks(BOOKS, activeFilter), [activeFilter]);
  const bookCountByFilter = useMemo(
    () => new Map(BOOK_FILTERS.map((filter) => [filter, filterBooks(BOOKS, filter).length])),
    [],
  );

  const openBook = useCallback((slug: string) => {
    setSelectedSlug(slug);
    setDisplayedSlug(slug);
    setIsBackShown(false);
  }, []);

  const closeBook = useCallback(() => {
    const slug = selectedSlugRef.current;
    if (slug === null) return;
    selectedSlugRef.current = null;
    setSelectedSlug(null);
    setIsBackShown(false);
    focusBookTrigger(sectionRef.current, slug);
  }, []);

  const toggleBack = useCallback(() => setIsBackShown((isShown) => !isShown), []);

  const changeFilter = (filter: BookFilter) => {
    setActiveFilter(filter);
    closeBook();
  };

  const displayedBook = displayedSlug ? (findBookBySlug(displayedSlug) ?? null) : null;
  const isWebgl = renderMode === SHELF_RENDER_MODE.webgl;
  const isCss3d = renderMode === SHELF_RENDER_MODE.css3d;
  const countLabel = translatePlural('books.count', visibleBooks.length);
  const isEmpty = visibleBooks.length === 0;
  const panelBookYaw = isBackShown ? PANEL_BOOK_YAW_DEGREES.back : PANEL_BOOK_YAW_DEGREES.front;
  const panelMedia =
    displayedBook && !isWebgl ? (
      <CssBook book={displayedBook} coverWidth={PANEL_BOOK_WIDTH} isStatic={!isCss3d} rotationY={panelBookYaw} />
    ) : null;
  const gridVariant = isCss3d ? SHELF_RENDER_MODE.css3d : SHELF_RENDER_MODE.static;

  return (
    <section
      ref={sectionRef}
      id={SECTION_IDS.books}
      className={`bookshelf ${isRevealed ? 'bookshelf--revealed' : ''}`}
      aria-labelledby={titleId}
    >
      <div className="container bookshelf__header">
        <p className="eyebrow">{translate('books.eyebrow')}</p>
        <h2 id={titleId} className="bookshelf__title">
          {translate('books.title')}
        </h2>
        <p className="bookshelf__subtitle">{translate('books.subtitle')}</p>
      </div>

      <div className="container bookshelf__toolbar">
        <BookFilterChips activeFilter={activeFilter} bookCountByFilter={bookCountByFilter} onFilterChange={changeFilter} />
        <p className="bookshelf__count" aria-live="polite">
          {countLabel}
        </p>
      </div>

      <div className={`bookshelf__body ${isWebgl ? 'bookshelf__body--wide' : 'container'}`}>
        {isWebgl ? (
          <ShelfStage
            catalogBooks={BOOKS}
            visibleBooks={visibleBooks}
            selectedSlug={selectedSlug}
            isBackShown={isBackShown}
            isRevealed={isRevealed}
            panelRef={panelRef}
            stageRef={stageRef}
            onSelect={openBook}
            onClose={closeBook}
            onToggleBack={toggleBack}
          />
        ) : isEmpty ? (
          <p className="bookshelf-empty">{translate('books.empty')}</p>
        ) : (
          <BookGrid
            books={visibleBooks}
            variant={gridVariant}
            selectedSlug={selectedSlug}
            isRevealed={isRevealed}
            onSelect={openBook}
          />
        )}
      </div>

      <BookDetailPanel
        ref={panelRef}
        book={displayedBook}
        isOpen={selectedSlug !== null}
        onClose={closeBook}
        isBackShown={isBackShown}
        onToggleBack={isWebgl || isCss3d ? toggleBack : undefined}
        hint={isWebgl ? translate('books.dragHint') : undefined}
        media={panelMedia}
        insideRef={isWebgl ? stageRef : undefined}
      />
    </section>
  );
}
