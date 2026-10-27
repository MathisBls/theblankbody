import { getOfferKind, OFFER_KIND, type Book } from '../../data/catalog';
import { translate } from '../../i18n';
import { formatBookCtaLabel, formatBookFormat, formatBookPrice, getBookCtaClassName } from './bookOfferFormat';
import './BookOffer.css';

export interface PriceTagProps {
  book: Book;
  className?: string;
}

/** Comic-style price sticker: "Free", "$9" or "Coming soon". */
export function PriceTag({ book, className = '' }: PriceTagProps) {
  return (
    <span className={`price-tag price-tag--${getOfferKind(book)} ${className}`}>{formatBookPrice(book)}</span>
  );
}

export interface BookOfferProps {
  book: Book;
  isLarge?: boolean;
}

/** Price, buy/download CTA and reassurance list, shared by the side panel and the product page. */
export function BookOffer({ book, isLarge = false }: BookOfferProps) {
  const isOnSale = getOfferKind(book) !== OFFER_KIND.comingSoon;
  const ctaClassName = `${getBookCtaClassName(book)} ${isLarge ? 'button--large' : ''} book-offer__cta`;

  return (
    <div className={`book-offer ${isLarge ? 'book-offer--large' : ''}`}>
      <div className="book-offer__row">
        <PriceTag book={book} />
        <span className="book-offer__format">{formatBookFormat(book)}</span>
      </div>
      <a className={ctaClassName} href={book.url} target="_blank" rel="noopener noreferrer">
        {formatBookCtaLabel(book)}
        <span className="visually-hidden"> {translate('common.opensInNewTab')}</span>
      </a>
      {isOnSale ? (
        <ul className="book-offer__trust">
          <li>{translate('books.instantDownload')}</li>
          <li>{translate('books.readAnywhere')}</li>
          <li>{translate('books.secureCheckout')}</li>
        </ul>
      ) : (
        <p className="book-offer__hint">{translate('books.notifyHint')}</p>
      )}
    </div>
  );
}
