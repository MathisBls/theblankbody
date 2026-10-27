import { useEffect, useState, type RefObject } from 'react';

export const VIEWPORT_POSITION = {
  above: 'above',
  inside: 'inside',
  below: 'below',
} as const;
export type ViewportPosition = (typeof VIEWPORT_POSITION)[keyof typeof VIEWPORT_POSITION];

// Extending the viewport far in one direction turns "crossed the edge" into a plain intersection,
// so the position stays right even when a jump (anchor, End key) skips the visible area entirely.
const FAR_MARGIN = '100000%';
const VIEWPORT_EXTENDED_UPWARD = `${FAR_MARGIN} 0% 0% 0%`;
const VIEWPORT_EXTENDED_DOWNWARD = `0% 0% ${FAR_MARGIN} 0%`;

interface EdgeState {
  isNotBelow: boolean;
  isNotAbove: boolean;
}

const INITIAL_EDGE_STATE: Record<ViewportPosition, EdgeState> = {
  [VIEWPORT_POSITION.above]: { isNotBelow: true, isNotAbove: false },
  [VIEWPORT_POSITION.inside]: { isNotBelow: true, isNotAbove: true },
  [VIEWPORT_POSITION.below]: { isNotBelow: false, isNotAbove: true },
};

function getViewportPosition({ isNotBelow, isNotAbove }: EdgeState): ViewportPosition {
  if (!isNotBelow) return VIEWPORT_POSITION.below;
  if (!isNotAbove) return VIEWPORT_POSITION.above;
  return VIEWPORT_POSITION.inside;
}

function observeIntersection(element: Element, rootMargin: string, onChange: (isIntersecting: boolean) => void) {
  const observer = new IntersectionObserver(
    (entries) => {
      const lastEntry = entries.at(-1);
      if (lastEntry) onChange(lastEntry.isIntersecting);
    },
    { rootMargin },
  );
  observer.observe(element);
  return observer;
}

/** Where an element sits relative to the viewport: scrolled past, visible, or still ahead. */
export function useViewportPosition(
  elementRef: RefObject<Element | null>,
  initialPosition: ViewportPosition = VIEWPORT_POSITION.inside,
): ViewportPosition {
  const [edgeState, setEdgeState] = useState<EdgeState>(INITIAL_EDGE_STATE[initialPosition]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return undefined;
    const observers = [
      observeIntersection(element, VIEWPORT_EXTENDED_UPWARD, (isNotBelow) =>
        setEdgeState((previous) => ({ ...previous, isNotBelow })),
      ),
      observeIntersection(element, VIEWPORT_EXTENDED_DOWNWARD, (isNotAbove) =>
        setEdgeState((previous) => ({ ...previous, isNotAbove })),
      ),
    ];
    return () => observers.forEach((observer) => observer.disconnect());
  }, [elementRef]);

  return getViewportPosition(edgeState);
}
