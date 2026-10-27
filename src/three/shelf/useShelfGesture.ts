import { useThree } from '@react-three/fiber';
import { useEffect, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { CLICK_DRAG_TOLERANCE_PX } from './ShelfBook';
import { findNearestValue, SHELF_LAYOUT_MODE, SHELF_METRICS, type ShelfLayout } from './shelfLayout';
import { isBackCoverYaw, type ShelfMotionState } from './shelfMotion';

const SPIN_RADIANS_PER_PX = 0.012;
const CAROUSEL_INERTIA_SECONDS = 0.2;
const VELOCITY_SMOOTHING = 0.75;
const PRIMARY_BUTTON = 0;

export interface ShelfGestureOptions {
  layout: ShelfLayout;
  hasSelection: boolean;
  isBackShown: boolean;
  onSpinningChange: (isSpinning: boolean) => void;
  onToggleBack: () => void;
}

interface PointerTracking {
  pointerId: number;
  startX: number;
  startY: number;
  startScroll: number;
  lastX: number;
  lastTime: number;
  velocityX: number;
  isDragging: boolean;
}

function getWorldUnitsPerPixel(motion: ShelfMotionState, canvasWidth: number): number {
  const visibleWidth = 2 * motion.cameraGoal.z * Math.tan((motion.fovDegrees * Math.PI) / 360) * motion.aspect;
  return canvasWidth > 0 ? visibleWidth / canvasWidth : 0;
}

/**
 * Horizontal drags on the canvas: spin the open book, or scroll the shelf in carousel mode.
 * Vertical movement is left to the browser (`touch-action: pan-y`) so the page keeps scrolling.
 */
export function useShelfGesture(motionRef: RefObject<ShelfMotionState>, options: ShelfGestureOptions): void {
  const canvas = useThree((state) => state.gl.domElement);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    let tracking: PointerTracking | null = null;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== PRIMARY_BUTTON) return;
      const motion = motionRef.current;
      motion.wasDragGesture = false;
      tracking = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startScroll: motion.scrollTarget,
        lastX: event.clientX,
        lastTime: event.timeStamp,
        velocityX: 0,
        isDragging: false,
      };
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!tracking || event.pointerId !== tracking.pointerId) return;
      const motion = motionRef.current;
      const { layout, hasSelection, onSpinningChange } = optionsRef.current;
      const canDrag = hasSelection || layout.mode === SHELF_LAYOUT_MODE.carousel;
      const deltaX = event.clientX - tracking.startX;
      const deltaY = event.clientY - tracking.startY;

      if (!tracking.isDragging) {
        const isHorizontalDrag = Math.abs(deltaX) > CLICK_DRAG_TOLERANCE_PX && Math.abs(deltaX) > Math.abs(deltaY);
        if (!canDrag || !isHorizontalDrag) return;
        tracking.isDragging = true;
        motion.wasDragGesture = true;
        canvas.setPointerCapture(event.pointerId);
        if (hasSelection) onSpinningChange(true);
      }

      const elapsed = Math.max(event.timeStamp - tracking.lastTime, 1);
      const instantVelocity = ((event.clientX - tracking.lastX) / elapsed) * 1000;
      tracking.velocityX = tracking.velocityX * VELOCITY_SMOOTHING + instantVelocity * (1 - VELOCITY_SMOOTHING);
      tracking.lastX = event.clientX;
      tracking.lastTime = event.timeStamp;

      if (hasSelection) {
        motion.spinDrag = deltaX * SPIN_RADIANS_PER_PX;
      } else {
        motion.scrollTarget = THREE.MathUtils.clamp(
          tracking.startScroll - deltaX * getWorldUnitsPerPixel(motion, canvas.clientWidth),
          layout.scrollMin,
          layout.scrollMax,
        );
      }
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (!tracking || event.pointerId !== tracking.pointerId) return;
      const { isDragging, velocityX } = tracking;
      tracking = null;
      if (!isDragging) return;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      const motion = motionRef.current;
      const { layout, hasSelection, isBackShown, onSpinningChange, onToggleBack } = optionsRef.current;

      if (hasSelection) {
        motion.spinBase = Math.round((motion.spinBase + motion.spinDrag) / Math.PI) * Math.PI;
        motion.spinDrag = 0;
        onSpinningChange(false);
        if (isBackCoverYaw(motion.spinBase) !== isBackShown) onToggleBack();
        return;
      }

      const inertiaDistance = THREE.MathUtils.clamp(
        -velocityX * CAROUSEL_INERTIA_SECONDS * getWorldUnitsPerPixel(motion, canvas.clientWidth),
        -SHELF_METRICS.slotWidth,
        SHELF_METRICS.slotWidth,
      );
      const projectedScroll = motion.scrollTarget + inertiaDistance;
      motion.scrollTarget = THREE.MathUtils.clamp(
        findNearestValue(layout.slotXs, projectedScroll),
        layout.scrollMin,
        layout.scrollMax,
      );
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerEnd);
    canvas.addEventListener('pointercancel', handlePointerEnd);
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerEnd);
      canvas.removeEventListener('pointercancel', handlePointerEnd);
    };
  }, [canvas, motionRef]);
}
