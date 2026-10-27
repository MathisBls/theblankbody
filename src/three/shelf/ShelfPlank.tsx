import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import { useRef } from 'react';
import * as THREE from 'three';
import { MOTION, THEME_COLORS } from '../../theme';
import { SHELF_METRICS } from './shelfLayout';

const OUTLINE_THICKNESS = 0.07;
const OUTLINE_LENGTH_SCALE = 1.006;
const RAIL_HEIGHT = 0.07;
const HIDDEN_SCALE = 0.0001;
const HIDDEN_DROP = 0.6;

export interface ShelfPlankProps {
  centerX: number;
  topY: number;
  width: number;
  isVisible: boolean;
}

/** Comic-book shelf: a cream plank with a thick ink outline and an orange price rail. */
export function ShelfPlank({ centerX, topY, width, isVisible }: ShelfPlankProps) {
  const groupRef = useRef<THREE.Group>(null);
  const animated = useRef({ width: isVisible ? width : HIDDEN_SCALE, drop: isVisible ? 0 : HIDDEN_DROP });

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const state = animated.current;
    easing.damp(state, 'width', isVisible ? width : HIDDEN_SCALE, MOTION.dampSmoothTime * 2, delta);
    easing.damp(state, 'drop', isVisible ? 0 : HIDDEN_DROP, MOTION.dampSmoothTime * 2, delta);
    group.scale.x = state.width;
    group.position.set(centerX, topY - SHELF_METRICS.plankThickness / 2 - state.drop, 0);
    group.visible = state.width > HIDDEN_SCALE * 10;
  });

  const { plankThickness, plankDepth } = SHELF_METRICS;

  return (
    <group ref={groupRef}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[1, plankThickness, plankDepth]} />
        <meshStandardMaterial color={THEME_COLORS.cream} roughness={0.8} />
      </mesh>
      <mesh scale={[OUTLINE_LENGTH_SCALE, 1, 1]}>
        <boxGeometry args={[1, plankThickness + OUTLINE_THICKNESS, plankDepth + OUTLINE_THICKNESS]} />
        <meshBasicMaterial color={THEME_COLORS.ink} side={THREE.BackSide} />
      </mesh>
      <mesh position={[0, -plankThickness / 2 + RAIL_HEIGHT, plankDepth / 2 + 0.002]}>
        <planeGeometry args={[1, RAIL_HEIGHT]} />
        <meshBasicMaterial color={THEME_COLORS.orange} />
      </mesh>
    </group>
  );
}
