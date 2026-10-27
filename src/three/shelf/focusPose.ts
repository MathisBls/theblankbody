import type * as THREE from 'three';
import type { BookDimensions } from '../../data/catalog';
import { SHELF_METRICS } from './shelfLayout';

/** Free area of the canvas (not covered by the detail panel), in normalised device coordinates. */
export interface FocusFrame {
  centerX: number;
  centerY: number;
  widthFraction: number;
  heightFraction: number;
}

export const FULL_FOCUS_FRAME: FocusFrame = { centerX: 0, centerY: 0, widthFraction: 1, heightFraction: 1 };

const FOCUS_FILL_RATIO = 0.74;
const MIN_FOCUS_DISTANCE = 4.5;
const MIN_GAP_IN_FRONT_OF_SHELF = 1.4;

/** Camera-to-book distance at which the book fills the free area of the view. */
export function getFocusDistance(
  fovDegrees: number,
  aspect: number,
  focusFrame: FocusFrame,
  dimensions: BookDimensions,
  isOpen: boolean,
): number {
  const tanHalfFov = Math.tan((fovDegrees * Math.PI) / 360);
  const spreadWidth = isOpen ? dimensions.width * 2 + dimensions.thickness : dimensions.width;
  const distanceForHeight = dimensions.height / 2 / (FOCUS_FILL_RATIO * tanHalfFov * focusFrame.heightFraction);
  const distanceForWidth = spreadWidth / 2 / (FOCUS_FILL_RATIO * tanHalfFov * aspect * focusFrame.widthFraction);
  return Math.max(distanceForHeight, distanceForWidth, MIN_FOCUS_DISTANCE);
}

/** Smallest camera distance (to the shelf plane) that keeps a focused book in front of the shelf. */
export function getCameraDistanceForFocus(focusDistance: number): number {
  return focusDistance + SHELF_METRICS.plankDepth / 2 + MIN_GAP_IN_FRONT_OF_SHELF;
}

/** Where the opened book floats: centred in the free area, as large as it fits, in front of the shelf. */
export function computeFocusPosition(
  cameraGoal: THREE.Vector3,
  fovDegrees: number,
  aspect: number,
  focusFrame: FocusFrame,
  dimensions: BookDimensions,
  isOpen: boolean,
  target: THREE.Vector3,
): THREE.Vector3 {
  const tanHalfFov = Math.tan((fovDegrees * Math.PI) / 360);
  const maxDistance = cameraGoal.z - SHELF_METRICS.plankDepth / 2 - MIN_GAP_IN_FRONT_OF_SHELF;
  const distance = Math.min(getFocusDistance(fovDegrees, aspect, focusFrame, dimensions, isOpen), maxDistance);

  const spreadCenterOffset = isOpen ? dimensions.width / 2 : 0;
  return target.set(
    cameraGoal.x + focusFrame.centerX * distance * tanHalfFov * aspect + spreadCenterOffset,
    cameraGoal.y + focusFrame.centerY * distance * tanHalfFov,
    cameraGoal.z - distance,
  );
}
