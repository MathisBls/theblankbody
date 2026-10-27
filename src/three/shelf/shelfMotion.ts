import * as THREE from 'three';
import { FULL_FOCUS_FRAME, type FocusFrame } from './focusPose';

/** Mutable per-frame state shared by the camera rig, the gesture handler and the books (never rendered). */
export interface ShelfMotionState {
  cameraGoal: THREE.Vector3;
  fovDegrees: number;
  aspect: number;
  focusFrame: FocusFrame;
  /** Resting yaw of the open book, always a multiple of PI (odd multiples show the back cover). */
  spinBase: number;
  /** Extra yaw while the open book is being dragged. */
  spinDrag: number;
  /** Camera x the carousel is scrolling towards. */
  scrollTarget: number;
  /** True when the last pointer sequence was a drag, so its trailing click must be ignored. */
  wasDragGesture: boolean;
}

export function createShelfMotionState(): ShelfMotionState {
  return {
    cameraGoal: new THREE.Vector3(0, 0, 20),
    fovDegrees: 30,
    aspect: 1,
    focusFrame: FULL_FOCUS_FRAME,
    spinBase: 0,
    spinDrag: 0,
    scrollTarget: 0,
    wasDragGesture: false,
  };
}

export function isBackCoverYaw(yaw: number): boolean {
  return Math.abs(Math.round(yaw / Math.PI)) % 2 === 1;
}
