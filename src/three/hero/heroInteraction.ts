/** Mutable pointer state shared between DOM listeners and the render loop, without React re-renders. */
export interface HeroInteractionState {
  /** Pointer position over the viewport, from -1 to 1 on each axis. */
  pointerX: number;
  pointerY: number;
  /** Extra yaw in radians applied by the user's drag; released drags go back to 0. */
  dragYaw: number;
  isDragging: boolean;
}

export function createHeroInteractionState(): HeroInteractionState {
  return { pointerX: 0, pointerY: 0, dragYaw: 0, isDragging: false };
}
