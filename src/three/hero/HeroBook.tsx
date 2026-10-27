import type { ThreeEvent } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import { useRef, useState, type RefObject } from 'react';
import type * as THREE from 'three';
import type { Book } from '../../data/catalog';
import { BookMesh } from '../BookMesh';
import type { HeroInteractionState } from './heroInteraction';

const IDLE_YAW_CENTER = 0.16;
const IDLE_YAW_AMPLITUDE = 0.42;
const IDLE_YAW_SPEED = 0.42;
const IDLE_PITCH_AMPLITUDE = 0.05;
const IDLE_PITCH_SPEED = 0.31;
const PARALLAX_YAW = 0.28;
const PARALLAX_PITCH = 0.16;
const PARALLAX_SHIFT = 0.14;
const PARALLAX_SMOOTH_TIME = 0.35;
const DRAG_SMOOTH_TIME = 0.08;
const DRAG_RETURN_SMOOTH_TIME = 0.7;
const HOVER_OPEN_AMOUNT = 0.25;
const GLOW_AMOUNT = 0.4;
const MOUSE_POINTER_TYPE = 'mouse';

export interface HeroBookProps {
  book: Book;
  interactionRef: RefObject<HeroInteractionState>;
}

/** Featured book with idle sway, mouse parallax, drag-to-turn and a cover that peeks open on hover. */
export function HeroBook({ book, interactionRef }: HeroBookProps) {
  const groupRef = useRef<THREE.Group>(null);
  const smoothedMotion = useRef({ parallaxX: 0, parallaxY: 0, dragYaw: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const interaction = interactionRef.current;
    const motion = smoothedMotion.current;
    const elapsed = state.clock.elapsedTime;

    easing.damp(motion, 'parallaxX', interaction.pointerX, PARALLAX_SMOOTH_TIME, delta);
    easing.damp(motion, 'parallaxY', interaction.pointerY, PARALLAX_SMOOTH_TIME, delta);
    const dragSmoothTime = interaction.isDragging ? DRAG_SMOOTH_TIME : DRAG_RETURN_SMOOTH_TIME;
    easing.damp(motion, 'dragYaw', interaction.dragYaw, dragSmoothTime, delta);

    const idleYaw = IDLE_YAW_CENTER + Math.sin(elapsed * IDLE_YAW_SPEED) * IDLE_YAW_AMPLITUDE;
    const idlePitch = Math.sin(elapsed * IDLE_PITCH_SPEED) * IDLE_PITCH_AMPLITUDE;

    group.rotation.y = idleYaw + motion.dragYaw + motion.parallaxX * PARALLAX_YAW;
    group.rotation.x = idlePitch - motion.parallaxY * PARALLAX_PITCH;
    group.position.x = motion.parallaxX * PARALLAX_SHIFT;
    group.position.y = -motion.parallaxY * PARALLAX_SHIFT;
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    if (event.pointerType === MOUSE_POINTER_TYPE) setIsHovered(true);
  };
  const handlePointerOut = () => setIsHovered(false);

  const openAmount = isHovered ? HOVER_OPEN_AMOUNT : 0;

  return (
    <group ref={groupRef} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
      <BookMesh book={book} openAmount={openAmount} glowAmount={GLOW_AMOUNT} castShadow={false} />
    </group>
  );
}
