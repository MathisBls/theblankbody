/** gsap.matchMedia() conditions shared by the scroll-revealed sections. */
export const MOTION_QUERIES = {
  allowsMotion: '(prefers-reduced-motion: no-preference)',
  reducesMotion: '(prefers-reduced-motion: reduce)',
} as const;

export const REVEAL_START = 'top 80%';
