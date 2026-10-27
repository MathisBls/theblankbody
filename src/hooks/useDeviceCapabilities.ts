import { useSyncExternalStore } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const COARSE_POINTER_QUERY = '(pointer: coarse)';

function subscribeToQuery(query: string) {
  return (onChange: () => void) => {
    const mediaQueryList = window.matchMedia(query);
    mediaQueryList.addEventListener('change', onChange);
    return () => mediaQueryList.removeEventListener('change', onChange);
  };
}

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    subscribeToQuery(query),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

let cachedWebglSupport: boolean | undefined;

export function detectWebglSupport(): boolean {
  if (cachedWebglSupport !== undefined) return cachedWebglSupport;
  try {
    const canvas = document.createElement('canvas');
    cachedWebglSupport = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    cachedWebglSupport = false;
  }
  return cachedWebglSupport;
}

export interface DeviceCapabilities {
  prefersReducedMotion: boolean;
  hasCoarsePointer: boolean;
  supportsWebgl: boolean;
  /** True when real-time 3D should be rendered: WebGL available and motion allowed. */
  canRender3d: boolean;
}

export function useDeviceCapabilities(): DeviceCapabilities {
  const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const hasCoarsePointer = useMediaQuery(COARSE_POINTER_QUERY);
  const supportsWebgl = detectWebglSupport();
  return {
    prefersReducedMotion,
    hasCoarsePointer,
    supportsWebgl,
    canRender3d: supportsWebgl && !prefersReducedMotion,
  };
}
