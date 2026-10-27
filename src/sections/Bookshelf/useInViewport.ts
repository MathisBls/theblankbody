import { useEffect, useState, type RefObject } from 'react';

export interface InViewportOptions {
  rootMargin?: string;
  /** Stay true once the element has been seen. */
  isLatched?: boolean;
}

export function useInViewport(
  elementRef: RefObject<HTMLElement | null>,
  { rootMargin = '0px', isLatched = false }: InViewportOptions = {},
): boolean {
  const [isInViewport, setIsInViewport] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      if (isLatched && !entry.isIntersecting) return;
      setIsInViewport(entry.isIntersecting);
      if (isLatched && entry.isIntersecting) observer.disconnect();
    }, { rootMargin });
    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, rootMargin, isLatched]);

  return isInViewport;
}
