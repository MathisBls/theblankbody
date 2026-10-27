import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { easing } from 'maath';
import { Suspense, useMemo, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';
import { getBookDimensions, type Book } from '../../data/catalog';
import { MOTION, THEME_COLORS } from '../../theme';
import { BookMesh } from '../BookMesh';
import { computeFocusPosition } from './focusPose';
import { SHELF_REVEAL, type ShelfSlot } from './shelfLayout';
import type { ShelfMotionState } from './shelfMotion';
import { BOUNCY_SPRING, SOFT_SPRING, springScalar, springVector3, type ScalarSpringState } from './spring';

export const CLICK_DRAG_TOLERANCE_PX = 8;

const HIDDEN_SCALE = 0.0001;
const VISIBLE_SCALE_THRESHOLD = 0.01;
const HIDDEN_DROP = 2.6;
const HOVER_FORWARD = 0.45;
const BACKGROUND_PUSH = -2.4;
const BACKGROUND_OPACITY = 0.15;
const FADE_SMOOTH_TIME = 0.22;
const OPAQUE_SNAP_THRESHOLD = 0.995;
const SPINE_TURN = 0.32;
const HOVER_TILT = { x: 0.16, y: 0.24 } as const;
const IDLE_FLOAT = { amplitude: 0.06, speed: 1.1, phaseStep: 1.37 } as const;
const IDLE_SWAY = { yaw: 0.05, roll: 0.015, speed: 0.6 } as const;
const FOCUS_SWAY = { yaw: 0.07, pitch: 0.03, speed: 0.5 } as const;
const ARRIVAL_DISTANCE = 0.35;
const SPIN_SMOOTH_TIME = 0.28;
const DRAG_SMOOTH_TIME = 0.06;
/** Offset from the cover's top-right corner: the sticker sits on the corner, not over the printed bottom tag. */
const STICKER_CORNER_OFFSET = { x: -0.05, y: 0 } as const;
const STICKER_PLACED_VISIBILITY = 'visible';

export interface ShelfBookProps {
  book: Book;
  /** Position among the visible books, used to stagger the rise onto the shelf. */
  revealIndex: number;
  /** Undefined when the book is filtered out. */
  slot: ShelfSlot | undefined;
  isRevealed: boolean;
  isHighlighted: boolean;
  isSelected: boolean;
  hasSelection: boolean;
  isBackShown: boolean;
  isSpinning: boolean;
  motionRef: RefObject<ShelfMotionState>;
  /** DOM price stickers (outside the canvas), positioned every frame over each book. */
  stickerElementsRef: RefObject<Map<string, HTMLElement>>;
  onHoverChange: (slug: string, isHovered: boolean) => void;
  onSelect: (slug: string) => void;
  onDismiss: () => void;
}

interface ShelfBookAnimation {
  velocity: THREE.Vector3;
  target: THREE.Vector3;
  pointerLocal: THREE.Vector3;
  stickerAnchor: THREE.Vector3;
  /** Pointer position over the cover, from -1 to 1 on both axes. */
  tilt: THREE.Vector2;
  scale: ScalarSpringState;
  lastSlot: ShelfSlot;
  /**
   * Seconds of animation played by this book. R3F resets its own clock whenever the frameloop is paused
   * off-screen, so reveal timing relies on this monotonic time instead.
   */
  elapsed: number;
  /** Time at which the book rises onto the shelf; null while hidden. */
  appearAt: number | null;
  /** Opacity of the book, lowered while another book is open. */
  opacity: number;
  isFadeApplied: boolean;
  isInitialized: boolean;
}

function setMaterialOpacity(material: THREE.Material, opacity: number): void {
  const isTransparent = opacity < 1;
  if (material.transparent !== isTransparent) {
    material.transparent = isTransparent;
    material.depthWrite = !isTransparent;
    material.needsUpdate = true;
  }
  material.opacity = opacity;
}

let traversalOpacity = 1;

function applyTraversalOpacity(object: THREE.Object3D): void {
  if (!(object instanceof THREE.Mesh)) return;
  const material: THREE.Material | THREE.Material[] = object.material;
  if (Array.isArray(material)) {
    for (const entry of material) setMaterialOpacity(entry, traversalOpacity);
  } else {
    setMaterialOpacity(material, traversalOpacity);
  }
}

/**
 * Fades the book's own meshes (sprites such as the halo keep their dedicated blending). Traverses on each call
 * rather than caching materials, since BookMesh swaps them once its textures load; the visitor allocates nothing.
 */
function setBookOpacity(root: THREE.Object3D, opacity: number): void {
  traversalOpacity = opacity;
  root.traverse(applyTraversalOpacity);
}

function BookPlaceholder({ width, height, thickness }: { width: number; height: number; thickness: number }) {
  return (
    <mesh castShadow>
      <boxGeometry args={[width, height, thickness]} />
      <meshStandardMaterial color={THEME_COLORS.cream} roughness={0.9} />
    </mesh>
  );
}

export function ShelfBook({
  book,
  revealIndex,
  slot,
  isRevealed,
  isHighlighted,
  isSelected,
  hasSelection,
  isBackShown,
  isSpinning,
  motionRef,
  stickerElementsRef,
  onHoverChange,
  onSelect,
  onDismiss,
}: ShelfBookProps) {
  const dimensions = useMemo(() => getBookDimensions(book), [book]);
  const isPresent = isRevealed && slot !== undefined;
  const [hasArrived, setHasArrived] = useState(false);
  const isOpen = isSelected && hasArrived && !isBackShown && !isSpinning;
  const isInBackground = hasSelection && !isSelected;

  const positionGroupRef = useRef<THREE.Group>(null);
  const rotationGroupRef = useRef<THREE.Group>(null);
  const bodyGroupRef = useRef<THREE.Group>(null);
  const animation = useRef<ShelfBookAnimation>({
    velocity: new THREE.Vector3(),
    target: new THREE.Vector3(),
    pointerLocal: new THREE.Vector3(),
    stickerAnchor: new THREE.Vector3(),
    tilt: new THREE.Vector2(),
    scale: { value: HIDDEN_SCALE, velocity: 0 },
    lastSlot: slot ?? { x: 0, y: 0 },
    elapsed: 0,
    appearAt: null,
    opacity: 1,
    isFadeApplied: false,
    isInitialized: false,
  });


  useFrame((state, delta) => {
    const positionGroup = positionGroupRef.current;
    const rotationGroup = rotationGroupRef.current;
    if (!positionGroup || !rotationGroup) return;
    const current = animation.current;
    const motion = motionRef.current;
    if (slot) current.lastSlot = slot;
    current.elapsed += delta;
    const time = current.elapsed;
    const phase = revealIndex * IDLE_FLOAT.phaseStep;

    if (!current.isInitialized) {
      positionGroup.position.set(current.lastSlot.x, current.lastSlot.y - HIDDEN_DROP, 0);
      positionGroup.scale.setScalar(HIDDEN_SCALE);
      current.isInitialized = true;
    }

    if (isPresent && current.appearAt === null) current.appearAt = time + revealIndex * SHELF_REVEAL.staggerSeconds;
    if (!isPresent) current.appearAt = null;
    const isShown = isSelected || (current.appearAt !== null && time >= current.appearAt);

    const target = current.target;
    if (isSelected) {
      computeFocusPosition(motion.cameraGoal, motion.fovDegrees, motion.aspect, motion.focusFrame, dimensions, isOpen, target);
    } else if (isShown) {
      const float = Math.sin(time * IDLE_FLOAT.speed + phase) * IDLE_FLOAT.amplitude;
      const depth = isHighlighted ? HOVER_FORWARD : isInBackground ? BACKGROUND_PUSH : 0;
      target.set(current.lastSlot.x, current.lastSlot.y + float + (isHighlighted ? MOTION.hoverLift : 0), depth);
    } else {
      target.set(current.lastSlot.x, current.lastSlot.y - HIDDEN_DROP, 0);
    }
    springVector3(positionGroup.position, current.velocity, target, isSelected ? SOFT_SPRING : BOUNCY_SPRING, delta);

    springScalar(current.scale, isShown ? 1 : HIDDEN_SCALE, BOUNCY_SPRING, delta);
    const scale = Math.max(current.scale.value, HIDDEN_SCALE);
    positionGroup.scale.setScalar(scale);
    positionGroup.visible = scale > VISIBLE_SCALE_THRESHOLD;

    if (isSelected) {
      const yaw = motion.spinBase + motion.spinDrag + Math.sin(time * FOCUS_SWAY.speed) * FOCUS_SWAY.yaw;
      const pitch = Math.sin(time * FOCUS_SWAY.speed * 0.8) * FOCUS_SWAY.pitch;
      easing.dampE(rotationGroup.rotation, [pitch, yaw, 0], isSpinning ? DRAG_SMOOTH_TIME : SPIN_SMOOTH_TIME, delta);
    } else if (isHighlighted) {
      easing.dampE(
        rotationGroup.rotation,
        [-current.tilt.y * HOVER_TILT.x, SPINE_TURN + current.tilt.x * HOVER_TILT.y, 0],
        MOTION.dampSmoothTime,
        delta,
      );
    } else {
      const sway = time * IDLE_SWAY.speed + phase;
      easing.dampE(
        rotationGroup.rotation,
        [0, Math.sin(sway) * IDLE_SWAY.yaw, Math.sin(sway * 1.3) * IDLE_SWAY.roll],
        MOTION.dampSmoothTime * 2,
        delta,
      );
    }

    const bodyGroup = bodyGroupRef.current;
    if (bodyGroup) {
      easing.damp(current, 'opacity', isInBackground ? BACKGROUND_OPACITY : 1, FADE_SMOOTH_TIME, delta);
      if (!isInBackground && current.opacity > OPAQUE_SNAP_THRESHOLD) current.opacity = 1;
      if (current.opacity < 1 || current.isFadeApplied) {
        setBookOpacity(bodyGroup, current.opacity);
        current.isFadeApplied = current.opacity < 1;
      }
    }

    const isNearFocus =positionGroup.position.distanceTo(target) < ARRIVAL_DISTANCE;
    if (isSelected && !hasArrived && isNearFocus) setHasArrived(true);
    if (!isSelected && hasArrived) setHasArrived(false);

    const sticker = stickerElementsRef.current.get(book.slug);
    if (sticker) {
      const anchor = current.stickerAnchor.set(
        dimensions.width / 2 + STICKER_CORNER_OFFSET.x,
        dimensions.height / 2 + STICKER_CORNER_OFFSET.y,
        dimensions.thickness,
      );
      positionGroup.localToWorld(anchor).project(state.camera);
      const left = ((anchor.x + 1) / 2) * state.size.width;
      const top = ((1 - anchor.y) / 2) * state.size.height;
      sticker.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
      sticker.style.visibility = STICKER_PLACED_VISIBILITY;
    }
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (isPresent) onHoverChange(book.slug, true);
  };

  const handlePointerOut = () => {
    animation.current.tilt.set(0, 0);
    onHoverChange(book.slug, false);
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    const positionGroup = positionGroupRef.current;
    if (!positionGroup || isSelected) return;
    const local = positionGroup.worldToLocal(animation.current.pointerLocal.copy(event.point));
    animation.current.tilt.set(
      THREE.MathUtils.clamp(local.x / (dimensions.width / 2), -1, 1),
      THREE.MathUtils.clamp(local.y / (dimensions.height / 2), -1, 1),
    );
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > CLICK_DRAG_TOLERANCE_PX || isSelected || !isPresent) return;
    if (hasSelection) {
      onDismiss();
      return;
    }
    onSelect(book.slug);
  };

  return (
    <group ref={positionGroupRef}>
      <group ref={rotationGroupRef}>
        <group ref={bodyGroupRef}>
          <Suspense fallback={<BookPlaceholder {...dimensions} />}>
            <BookMesh
              book={book}
              openAmount={isOpen ? 1 : 0}
              glowAmount={isHighlighted || isSelected ? 1 : 0}
              castShadow={!isInBackground}
            />
          </Suspense>
        </group>
        <mesh
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onPointerMove={handlePointerMove}
          onClick={handleClick}
        >
          <boxGeometry args={[dimensions.width, dimensions.height, dimensions.thickness * 1.4]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </group>
    </group>
  );
}
