import { useEffect, useMemo, useRef, type CSSProperties, type RefObject } from 'react';
import { Link } from 'wouter';
import { BookOffer, PriceTag } from '../../components/BookOffer/BookOffer';
import { ChevronIcon } from '../../components/ChevronIcon/ChevronIcon';
import { SECTION_IDS } from '../../config/links';
import { buildSectionHref } from '../../config/routes';
import { findBookBySlug, type Book } from '../../data/catalog';
import { useDeviceCapabilities } from '../../hooks/useDeviceCapabilities';
import { translate } from '../../i18n';
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap';
import { ProductBookStage } from './ProductBookStage';
import { buildProductViewModel } from './productViewModel';
import { StickyBuyBar } from './StickyBuyBar';
import { useViewportPosition, VIEWPORT_POSITION } from './useViewportPosition';
import './ProductPage.css';

const REVEAL = {
  intro: '[data-reveal="intro"]',
  stage: '[data-reveal="stage"]',
  section: '[data-reveal="section"]',
} as const;
const SECTION_REVEAL_START = 'top 85%';

function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

function useProductRevealAnimations(scopeRef: RefObject<HTMLElement | null>, prefersReducedMotion: boolean) {
  useGSAP(
    () => {
      const intro = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.7 } });
      if (prefersReducedMotion) {
        intro.from([REVEAL.stage, REVEAL.intro], { opacity: 0, stagger: 0.05, duration: 0.4 });
      } else {
        intro
          .from(REVEAL.stage, { yPercent: -16, opacity: 0, duration: 1.1, ease: 'back.out(1.7)' })
          .from(REVEAL.intro, { yPercent: 40, opacity: 0, stagger: 0.07 }, 0.15);
      }

      const sectionMotion = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, yPercent: 8 };
      gsap.utils.toArray<HTMLElement>(REVEAL.section).forEach((section) => {
        gsap.from(section, {
          ...sectionMotion,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: section, start: SECTION_REVEAL_START, once: true },
        });
      });
      ScrollTrigger.refresh();
    },
    { scope: scopeRef, dependencies: [prefersReducedMotion], revertOnUpdate: true },
  );
}

interface ProductContentProps {
  book: Book;
}

function ProductContent({ book }: ProductContentProps) {
  const rootRef = useRef<HTMLElement>(null);
  const offerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const { prefersReducedMotion } = useDeviceCapabilities();
  const viewModel = useMemo(() => buildProductViewModel(book), [book]);
  const offerPosition = useViewportPosition(offerRef);
  const endPosition = useViewportPosition(endRef, VIEWPORT_POSITION.below);
  useProductRevealAnimations(rootRef, prefersReducedMotion);

  const isStickyBarVisible = offerPosition === VIEWPORT_POSITION.above && endPosition === VIEWPORT_POSITION.below;
  const seriesStyle: CSSProperties = {
    '--series-color': viewModel.seriesColor,
    '--series-text-color': viewModel.seriesTextColor,
  };
  const labels = {
    breadcrumb: translate('product.breadcrumbLabel'),
    home: translate('product.home'),
    books: translate('nav.books'),
    backToBooks: translate('product.backToBooks'),
    comingSoon: translate('books.badge.comingSoon'),
    whatsInside: translate('product.whatsInside'),
    details: translate('product.details'),
    gallery: translate('product.gallery.title'),
  };

  return (
    <main id={SECTION_IDS.mainContent} ref={rootRef} className="product-page" style={seriesStyle}>
      <div className="container">
        <nav className="product-breadcrumb" aria-label={labels.breadcrumb}>
          <ol className="product-breadcrumb__list">
            <li>
              <Link href={viewModel.homeHref}>{labels.home}</Link>
              <ChevronIcon className="product-breadcrumb__separator" />
            </li>
            <li>
              <a href={viewModel.booksHref}>{labels.books}</a>
              <ChevronIcon className="product-breadcrumb__separator" />
            </li>
            <li aria-current="page">{book.title}</li>
          </ol>
          <a className="product-breadcrumb__back" href={viewModel.booksHref}>
            <ChevronIcon isPointingLeft /> {labels.backToBooks}
          </a>
        </nav>

        <section className="product-hero" aria-labelledby="product-title">
          <div className="product-hero__visual" data-reveal="stage">
            <ProductBookStage book={book} />
          </div>

          <div className="product-hero__info">
            <div className="product-hero__tags" data-reveal="intro">
              <span className="product-series-pill">{viewModel.seriesLabel}</span>
              {!viewModel.isAvailable && <span className="product-badge">{labels.comingSoon}</span>}
            </div>
            <h1 id="product-title" className="product-hero__title" data-reveal="intro">
              {book.title}
            </h1>
            <p className="product-hero__subtitle" data-reveal="intro">
              {book.subtitle}
            </p>
            <div ref={offerRef} className="product-hero__offer" data-reveal="intro">
              <BookOffer book={book} isLarge />
            </div>
          </div>
        </section>

        <section className="product-section product-inside" aria-labelledby="product-inside-title" data-reveal="section">
          <h2 id="product-inside-title" className="product-section__title">
            {labels.whatsInside}
          </h2>
          <p className="product-inside__blurb">{book.blurb}</p>
          <ol className="product-inside__list">
            {viewModel.insideItems.map((item) => (
              <li key={item.key} className="product-inside__card">
                <span className="product-inside__pill">{item.label}</span>
                <p className="product-inside__text">{item.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="product-section product-details" aria-labelledby="product-details-title" data-reveal="section">
          <h2 id="product-details-title" className="product-section__title">
            {labels.details}
          </h2>
          <table className="product-details__table">
            <thead>
              <tr>
                <th scope="col" colSpan={2}>
                  {book.title}
                </th>
              </tr>
            </thead>
            <tbody>
              {viewModel.detailRows.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {viewModel.galleryImages.length > 0 && (
          <section className="product-section product-gallery" aria-labelledby="product-gallery-title" data-reveal="section">
            <h2 id="product-gallery-title" className="product-section__title">
              {labels.gallery}
            </h2>
            <div className="product-gallery__covers">
              {viewModel.galleryImages.map((image) => (
                <figure key={image.key} className="product-gallery__figure">
                  <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
                  <figcaption className="product-gallery__caption">{image.caption}</figcaption>
                </figure>
              ))}
            </div>
            {viewModel.mockup && (
              <img
                className="product-gallery__mockup"
                src={viewModel.mockup.src}
                alt={viewModel.mockup.alt}
                loading="lazy"
                decoding="async"
              />
            )}
          </section>
        )}

        {viewModel.relatedBooks.length > 0 && (
          <section className="product-section product-related" aria-labelledby="product-related-title" data-reveal="section">
            <h2 id="product-related-title" className="product-section__title">
              {viewModel.relatedTitle}
            </h2>
            <ul className="product-related__list">
              {viewModel.relatedBooks.map((related) => (
                <li key={related.book.slug}>
                  <Link href={related.href} className="product-related__card">
                    <img
                      className="product-related__cover"
                      src={related.book.images.front}
                      alt={related.coverAlt}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="product-related__title">{related.book.title}</span>
                    <PriceTag book={related.book} className="product-related__price" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <div ref={endRef} className="product-page__end" />
      </div>

      <StickyBuyBar viewModel={viewModel} isVisible={isStickyBarVisible} />
    </main>
  );
}

function ProductNotFound() {
  const view = {
    booksHref: buildSectionHref(SECTION_IDS.books),
    title: translate('product.notFound.title'),
    text: translate('product.notFound.text'),
    backToBooks: translate('product.backToBooks'),
  };
  return (
    <main id={SECTION_IDS.mainContent} className="product-page product-page--not-found">
      <div className="container product-not-found">
        <h1 className="product-not-found__title">{view.title}</h1>
        <p className="product-not-found__text">{view.text}</p>
        <a className="button button--primary" href={view.booksHref}>
          {view.backToBooks}
        </a>
      </div>
    </main>
  );
}

export interface ProductPageProps {
  slug: string;
}

export function ProductPage({ slug }: ProductPageProps) {
  const book = findBookBySlug(slug);
  const pageTitle = translate('product.pageTitle', {
    title: book ? book.title : translate('product.notFound.title'),
  });
  useDocumentTitle(pageTitle);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [slug]);

  if (!book) return <ProductNotFound />;
  return <ProductContent key={book.slug} book={book} />;
}
