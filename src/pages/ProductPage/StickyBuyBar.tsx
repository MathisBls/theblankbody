import { PriceTag } from '../../components/BookOffer/BookOffer';
import { getBookCtaClassName } from '../../components/BookOffer/bookOfferFormat';
import { translate } from '../../i18n';
import type { ProductViewModel } from './productViewModel';

export interface StickyBuyBarProps {
  viewModel: ProductViewModel;
  isVisible: boolean;
}

/** Mobile-only bottom bar keeping price and CTA at hand once the main offer has scrolled away. */
export function StickyBuyBar({ viewModel, isVisible }: StickyBuyBarProps) {
  const view = {
    label: translate('product.stickyBarLabel'),
    newTabHint: translate('common.opensInNewTab'),
    ctaClassName: `${getBookCtaClassName(viewModel.book)} sticky-buy-bar__cta`,
    stateClassName: isVisible ? 'sticky-buy-bar--visible' : '',
  };

  return (
    <aside className={`sticky-buy-bar ${view.stateClassName}`} aria-label={view.label} inert={!isVisible}>
      <div className="sticky-buy-bar__summary">
        <span className="sticky-buy-bar__title">{viewModel.book.title}</span>
        <PriceTag book={viewModel.book} />
      </div>
      <a className={view.ctaClassName} href={viewModel.book.url} target="_blank" rel="noopener noreferrer">
        {viewModel.ctaLabel}
        <span className="visually-hidden"> {view.newTabHint}</span>
      </a>
    </aside>
  );
}
