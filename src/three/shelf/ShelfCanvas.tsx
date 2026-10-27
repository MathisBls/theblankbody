import { Canvas } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { ShelfScene, type ShelfSceneProps } from './ShelfScene';
import { createShelfMotionState } from './shelfMotion';

const INITIAL_CAMERA = { fov: 30, position: [0, 0, 22], near: 0.5, far: 90 } as const;
const SHADOW_SETTINGS = { type: THREE.PCFShadowMap };
const CANVAS_STYLE = { touchAction: 'pan-y' } as const;

export interface ShelfCanvasProps extends Omit<ShelfSceneProps, 'motionRef'> {
  /** False while the section is off-screen: rendering is paused. */
  isActive: boolean;
}

/** One WebGL canvas for the whole bookshelf. Default export so it can be lazy-loaded. */
export default function ShelfCanvas({ isActive, ...sceneProps }: ShelfCanvasProps) {
  const [initialMotion] = useState(createShelfMotionState);
  const motionRef = useRef(initialMotion);
  const { selectedSlug, onDismiss } = sceneProps;

  const handlePointerMissed = () => {
    if (motionRef.current.wasDragGesture || selectedSlug === null) return;
    onDismiss();
  };

  return (
    <Canvas
      className="shelf-canvas"
      dpr={[1, 2]}
      flat
      shadows={SHADOW_SETTINGS}
      frameloop={isActive ? 'always' : 'never'}
      camera={INITIAL_CAMERA}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={CANVAS_STYLE}
      onPointerMissed={handlePointerMissed}
    >
      <ShelfScene {...sceneProps} motionRef={motionRef} />
    </Canvas>
  );
}
