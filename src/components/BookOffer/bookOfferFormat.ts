import { getOfferKind, OFFER_KIND, type Book, type OfferKind } from '../../data/catalog';
import { translate, translatePlural } from '../../i18n';

export function formatBookPrice(book: Book): string {
  const offerKind = getOfferKind(book);
  if (offerKind === OFFER_KIND.free) return translate('books.price.free');
  if (offerKind === OFFER_KIND.comingSoon) return translate('books.price.comingSoon');
  return translate('books.price.paid', { price: book.price });
}

export function formatBookCtaLabel(book: Book): string {
  const offerKind = getOfferKind(book);
  if (offerKind === OFFER_KIND.free) return translate('books.cta.available');
  if (offerKind === OFFER_KIND.comingSoon) return translate('books.cta.comingSoon');
  return translate('books.cta.paid', { price: book.price });
}

export function formatBookFormat(book: Book): string {
  return book.pages === null
    ? book.format
    : `${book.format} · ${translatePlural('books.pages', book.pages)}`;
}

const CTA_CLASS_BY_OFFER: Record<OfferKind, string> = {
  [OFFER_KIND.free]: 'button button--primary',
  [OFFER_KIND.paid]: 'button button--primary',
  [OFFER_KIND.comingSoon]: 'button button--navy',
};

export function getBookCtaClassName(book: Book): string {
  return CTA_CLASS_BY_OFFER[getOfferKind(book)];
}
