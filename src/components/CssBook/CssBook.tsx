import type { CSSProperties } from 'react';
import { getBookDimensions, type Book } from '../../data/catalog';
import { translate } from '../../i18n';
import './CssBook.css';

export interface CssBookProps {
  book: Book;
  /** Rendered width of the front cover, any CSS length. */
  coverWidth?: string;
  /** Y rotation in degrees; 180 shows the back cover. */
  rotationY?: number;
  rotationX?: number;
  isStatic?: boolean;
  className?: string;
}

/** CSS 3D book built from the same front/back/spine images: fallback when WebGL is unavailable. */
export function CssBook({
  book,
  coverWidth = '12rem',
  rotationY = -28,
  rotationX = 6,
  isStatic = false,
  className = '',
}: CssBookProps) {
  const { width, height, thickness } = getBookDimensions(book);
  const style: CSSProperties = {
    '--book-cover-width': coverWidth,
    '--book-aspect': `${width} / ${height}`,
    '--book-thickness-ratio': thickness / width,
    '--book-rotate-y': `${rotationY}deg`,
    '--book-rotate-x': `${rotationX}deg`,
    '--book-accent': book.accent,
  };

  if (isStatic) {
    return (
      <img
        className={`css-book-static ${className}`}
        style={style}
        src={book.images.front}
        alt={translate('books.coverAlt', { title: book.title })}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div className={`css-book ${className}`} style={style} role="img" aria-label={translate('books.coverAlt', { title: book.title })}>
      <div className="css-book__body">
        <img className="css-book__face css-book__front" src={book.images.front} alt="" loading="lazy" decoding="async" />
        <img className="css-book__face css-book__back" src={book.images.back} alt="" loading="lazy" decoding="async" />
        <img className="css-book__face css-book__spine" src={book.images.spine} alt="" loading="lazy" decoding="async" />
        <span className="css-book__face css-book__pages" />
        <span className="css-book__face css-book__pages-top" />
        <span className="css-book__face css-book__pages-bottom" />
      </div>
    </div>
  );
}
