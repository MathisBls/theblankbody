import { useCallback, useEffect, useRef, type MouseEvent } from 'react';
import { useLocation } from 'wouter';
import { SECTION_IDS } from '../../config/links';
import { buildSectionHref, ROUTES } from '../../config/routes';
import { useDeviceCapabilities } from '../../hooks/useDeviceCapabilities';

const HASH_PREFIX = '#';
const MAIN_MOUSE_BUTTON = 0;

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.button === MAIN_MOUSE_BUTTON && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
  );
}

function scrollToSection(sectionId: string, behavior: ScrollBehavior): void {
  const section = document.getElementById(sectionId);
  if (section && sectionId !== SECTION_IDS.hero) {
    section.scrollIntoView({ behavior, block: 'start' });
    return;
  }
  window.scrollTo({ top: 0, behavior });
}

function getInitialHashSectionId(): string | null {
  const hash = window.location.hash;
  return hash.startsWith(HASH_PREFIX) && hash.length > HASH_PREFIX.length ? hash.slice(HASH_PREFIX.length) : null;
}

/**
 * Links to home-page sections that smooth-scroll on the home page and, from any other route,
 * navigate home first then jump to the section once it has rendered.
 */
export function useSectionNavigation() {
  const [location, navigate] = useLocation();
  const { prefersReducedMotion } = useDeviceCapabilities();
  const pendingSectionIdRef = useRef<string | null>(getInitialHashSectionId());
  const isHome = location === ROUTES.home;

  useEffect(() => {
    const pendingSectionId = pendingSectionIdRef.current;
    if (!isHome || pendingSectionId === null) return;
    pendingSectionIdRef.current = null;
    scrollToSection(pendingSectionId, 'instant');
  }, [isHome]);

  const goToSection = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
      if (!isPlainLeftClick(event)) return;
      event.preventDefault();
      const isTop = sectionId === SECTION_IDS.hero;
      const targetHref = isTop ? ROUTES.home : buildSectionHref(sectionId);

      if (isHome) {
        window.history.replaceState(window.history.state, '', targetHref);
        scrollToSection(sectionId, prefersReducedMotion ? 'instant' : 'smooth');
        return;
      }
      pendingSectionIdRef.current = sectionId;
      navigate(targetHref);
    },
    [isHome, navigate, prefersReducedMotion],
  );

  return { goToSection };
}
