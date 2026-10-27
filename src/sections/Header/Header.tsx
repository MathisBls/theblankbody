import { useCallback, useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { MEDIA_PATHS, SECTION_IDS } from '../../config/links';
import { buildSectionHref, ROUTES } from '../../config/routes';
import { FEATURED_BOOK } from '../../data/catalog';
import { translate, type MessageKey } from '../../i18n';
import './Header.css';
import { useSectionNavigation } from './useSectionNavigation';

const SCROLLED_THRESHOLD_PX = 12;
const DESKTOP_NAV_QUERY = '(min-width: 52rem)';
const MENU_ID = 'site-header-menu';
const LOGO_SIZE_PX = 256;
const ESCAPE_KEY = 'Escape';

interface NavItem {
  sectionId: string;
  href: string;
  labelKey: MessageKey;
}

const NAV_ITEMS: readonly NavItem[] = [
  { sectionId: SECTION_IDS.books, href: buildSectionHref(SECTION_IDS.books), labelKey: 'nav.books' },
  { sectionId: SECTION_IDS.about, href: buildSectionHref(SECTION_IDS.about), labelKey: 'nav.about' },
  { sectionId: SECTION_IDS.freeGuide, href: buildSectionHref(SECTION_IDS.freeGuide), labelKey: 'nav.freeGuide' },
];

function useIsScrolled(): boolean {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateScrolled = () => setIsScrolled(window.scrollY > SCROLLED_THRESHOLD_PX);
    updateScrolled();
    window.addEventListener('scroll', updateScrolled, { passive: true });
    return () => window.removeEventListener('scroll', updateScrolled);
  }, []);

  return isScrolled;
}

function focusMainContent(event: MouseEvent<HTMLAnchorElement>): void {
  const main = document.getElementById(SECTION_IDS.mainContent);
  if (!main) return;
  event.preventDefault();
  main.setAttribute('tabindex', '-1');
  main.focus({ preventScroll: true });
  main.scrollIntoView({ block: 'start' });
}

export function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isScrolled = useIsScrolled();
  const { goToSection } = useSectionNavigation();

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    if (isMenuOpen) firstMenuLinkRef.current?.focus();
  }, [isMenuOpen]);

  useEffect(() => {
    const desktopQuery = window.matchMedia(DESKTOP_NAV_QUERY);
    desktopQuery.addEventListener('change', closeMenu);
    return () => desktopQuery.removeEventListener('change', closeMenu);
  }, [closeMenu]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) closeMenu();
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [isMenuOpen, closeMenu]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== ESCAPE_KEY || !isMenuOpen) return;
    closeMenu();
    menuButtonRef.current?.focus();
  };

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) closeMenu();
  };

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    closeMenu();
    goToSection(event, sectionId);
  };

  const toggleMenu = () => setIsMenuOpen((wasOpen) => !wasOpen);

  const headerClassName = [
    'site-header',
    isScrolled ? 'site-header--scrolled' : '',
    isMenuOpen ? 'site-header--menu-open' : '',
  ].join(' ');
  const menuButtonLabel = translate(isMenuOpen ? 'nav.menuClose' : 'nav.menuOpen');

  return (
    <header ref={headerRef} className={headerClassName} onKeyDown={handleKeyDown} onBlur={handleBlur}>
      <a className="site-header__skip-link button button--navy" href={`#${SECTION_IDS.mainContent}`} onClick={focusMainContent}>
        {translate('nav.skipToContent')}
      </a>
      <div className="site-header__bar container">
        <a
          className="site-header__brand"
          href={ROUTES.home}
          aria-label={translate('nav.homeLabel')}
          onClick={(event) => handleNavClick(event, SECTION_IDS.hero)}
        >
          <img
            className="site-header__logo"
            src={MEDIA_PATHS.logo}
            alt=""
            width={LOGO_SIZE_PX}
            height={LOGO_SIZE_PX}
            decoding="async"
          />
          <span className="site-header__brand-name">{translate('meta.brand')}</span>
        </a>

        <nav className="site-header__nav" aria-label={translate('nav.label')}>
          <ul id={MENU_ID} className="site-header__menu">
            {NAV_ITEMS.map((item, index) => (
              <li key={item.sectionId} className="site-header__menu-item">
                <a
                  ref={index === 0 ? firstMenuLinkRef : undefined}
                  className="site-header__link"
                  href={item.href}
                  onClick={(event) => handleNavClick(event, item.sectionId)}
                >
                  {translate(item.labelKey)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions">
          <a
            className="site-header__cta button button--primary"
            href={FEATURED_BOOK.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="site-header__cta-label site-header__cta-label--full">{translate('nav.cta')}</span>
            <span className="site-header__cta-label site-header__cta-label--short">{translate('nav.freeGuide')}</span>
            <span className="visually-hidden"> {translate('common.opensInNewTab')}</span>
          </a>
          <button
            ref={menuButtonRef}
            type="button"
            className="site-header__menu-button"
            aria-expanded={isMenuOpen}
            aria-controls={MENU_ID}
            aria-label={menuButtonLabel}
            onClick={toggleMenu}
          >
            <span className="site-header__menu-icon" aria-hidden="true">
              <span className="site-header__menu-bar" />
              <span className="site-header__menu-bar" />
              <span className="site-header__menu-bar" />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
