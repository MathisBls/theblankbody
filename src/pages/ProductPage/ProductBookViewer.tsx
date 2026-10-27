import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';
import type { Group } from 'three';
import { getBookDimensions, type Book } from '../../data/catalog';
import { translate } from '../../i18n';
import { BookMesh } from '../../three/BookMesh';
import { MOTION, THEME_COLORS } from '../../theme';
import { useViewportPosition, VIEWPORT_POSITION } from './useViewportPosition';

const CAMERA_POSITION: Vector3Tuple = [0, 0, 7.8];
const CAMERA_FOV = 30;
const DEVICE_PIXEL_RATIO: [number, number] = [1, 2];

const HALF_TURN = Math.PI;
const DRAG_YAW_PER_VIEWER_WIDTH = Math.PI * 1.4;
const DRAG_PITCH_PER_VIEWER_HEIGHT = Math.PI * 0.35;
const MAX_DRAG_PITCH = 0.35;
const INERTIA_PROJECTION_SECONDS = 0.18;
const VELOCITY_SMOOTHING = 0.35;
const MIN_POINTER_INTERVAL_SECONDS = 0.004;
const MILLISECONDS_PER_SECOND = 1000;

const SPRING_STIFFNESS = 55;
const SPRING_DAMPING = 8.5;
const MAX_FRAME_DELTA = 1 / 30;

const REST_PITCH = 0.06;
const IDLE_SWAY_ANGLE = 0.2;
const IDLE_SWAY_SPEED = 0.45;
const IDLE_FLOAT_HEIGHT = 0.08;
const IDLE_FLOAT_SPEED = 1.1;
const OPEN_SPREAD_SHIFT_RATIO = 0.44;
const OPEN_SPREAD_SCALE = 0.9;
const OPEN_ANGLE_ON_OPEN = 1;
const GLOW_AT_REST = 0.65;
const GLOW_WHILE_GRABBED = 1;

const SHADOW_GAP = 0.18;
const SHADOW_SCALE = 7;
const SHADOW_OPACITY = 0.42;
const SHADOW_BLUR = 2.6;
const SHADOW_FAR = 4;
const SHADOW_RESOLUTION = 512;
const ENVIRONMENT_RESOLUTION = 256;
const ENVIRONMENT_FRAMES = 1;

type Vector3Tuple = [number, number, number];

const AMBIENT_LIGHT_INTENSITY = 0.55;

interface LightPlacement {
  position: Vector3Tuple;
  intensity: number;
  distance?: number;
  rotation?: Vector3Tuple;
  scale?: Vector3Tuple | number;
}

const SCENE_LIGHTS: Record<'key' | 'rim' | 'accent' | 'topPanel' | 'sidePanel' | 'accentRing', LightPlacement> = {
  key: { position: [3, 5, 6], intensity: 1.7 },
  rim: { position: [-4, 2, -5], intensity: 0.9 },
  accent: { position: [-3, -1, 4], intensity: 6, distance: 12 },
  topPanel: { position: [0, 3, 5], scale: [7, 2, 1], intensity: 2.2 },
  sidePanel: {
    position: [5, 0, 2],
    rotation: [0, -Math.PI / 2, 0],
    scale: [4, 4, 1],
    intensity: 1.2,
  },
  accentRing: {
    position: [-5, 1, 2],
    rotation: [0, Math.PI / 2, 0],
    scale: 3,
    intensity: 1.4,
  },
};

interface RotationState {
  yaw: number;
  yawVelocity: number;
  restYaw: number;
  pitch: number;
  pitchVelocity: number;
  isDragging: boolean;
  lastPointerX: number;
  lastPointerY: number;
  lastPointerTime: number;
}

function createRotationState(): RotationState {
  return {
    yaw: 0,
    yawVelocity: 0,
    restYaw: 0,
    pitch: REST_PITCH,
    pitchVelocity: 0,
    isDragging: false,
    lastPointerX: 0,
    lastPointerY: 0,
    lastPointerTime: 0,
  };
}

/** Semi-implicit Euler step of an under-damped spring: returns the next [position, velocity]. */
function stepSpring(position: number, velocity: number, target: number, delta: number): readonly [number, number] {
  const acceleration = (target - position) * SPRING_STIFFNESS - velocity * SPRING_DAMPING;
  const nextVelocity = velocity + acceleration * delta;
  return [position + nextVelocity * delta, nextVelocity];
}

function isBackFacingYaw(yaw: number): boolean {
  return Math.abs(Math.round(yaw / HALF_TURN)) % 2 === 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface ViewerSceneProps {
  book: Book;
  isOpen: boolean;
  isGrabbed: boolean;
  rotationRef: RefObject<RotationState>;
}

function ViewerScene({ book, isOpen, isGrabbed, rotationRef }: ViewerSceneProps) {
  const bookGroupRef = useRef<Group>(null);
  const spreadState = useRef({ shift: 0, scale: 1 });
  const { width, height } = getBookDimensions(book);

  useFrame((state, frameDelta) => {
    const group = bookGroupRef.current;
    if (!group) return;
    const delta = Math.min(frameDelta, MAX_FRAME_DELTA);
    const rotation = rotationRef.current;

    if (!rotation.isDragging) {
      [rotation.yaw, rotation.yawVelocity] = stepSpring(rotation.yaw, rotation.yawVelocity, rotation.restYaw, delta);
      [rotation.pitch, rotation.pitchVelocity] = stepSpring(rotation.pitch, rotation.pitchVelocity, REST_PITCH, delta);
    }

    const elapsed = state.clock.elapsedTime;
    const idleWeight = rotation.isDragging || isOpen ? 0 : 1;
    const sway = Math.sin(elapsed * IDLE_SWAY_SPEED) * IDLE_SWAY_ANGLE * idleWeight;
    const spread = spreadState.current;
    easing.damp(spread, 'shift', isOpen ? width * OPEN_SPREAD_SHIFT_RATIO : 0, MOTION.dampSmoothTime * 2, delta);
    easing.damp(spread, 'scale', isOpen ? OPEN_SPREAD_SCALE : 1, MOTION.dampSmoothTime * 2, delta);

    group.scale.setScalar(spread.scale);
    group.rotation.set(rotation.pitch, rotation.yaw + sway, 0);
    group.position.set(spread.shift * spread.scale, Math.sin(elapsed * IDLE_FLOAT_SPEED) * IDLE_FLOAT_HEIGHT, 0);
  });

  return (
    <>
      <ambientLight intensity={AMBIENT_LIGHT_INTENSITY} />
      <directionalLight {...SCENE_LIGHTS.key} color={THEME_COLORS.white} />
      <directionalLight {...SCENE_LIGHTS.rim} color={THEME_COLORS.cream} />
      <pointLight {...SCENE_LIGHTS.accent} color={book.accent} />
      <Environment resolution={ENVIRONMENT_RESOLUTION} frames={ENVIRONMENT_FRAMES}>
        <Lightformer form="rect" {...SCENE_LIGHTS.topPanel} color={THEME_COLORS.white} />
        <Lightformer form="rect" {...SCENE_LIGHTS.sidePanel} color={THEME_COLORS.cream} />
        <Lightformer form="ring" {...SCENE_LIGHTS.accentRing} color={book.accent} />
      </Environment>

      <group ref={bookGroupRef}>
        <BookMesh
          book={book}
          openAmount={isOpen ? OPEN_ANGLE_ON_OPEN : 0}
          glowAmount={isGrabbed ? GLOW_WHILE_GRABBED : GLOW_AT_REST}
          castShadow={false}
        />
      </group>

      <ContactShadows
        position={[0, -height / 2 - SHADOW_GAP, 0]}
        scale={SHADOW_SCALE}
        opacity={SHADOW_OPACITY}
        blur={SHADOW_BLUR}
        far={SHADOW_FAR}
        resolution={SHADOW_RESOLUTION}
        color={THEME_COLORS.navyDeep}
      />
    </>
  );
}

export interface ProductBookViewerProps {
  book: Book;
  isOpen: boolean;
  isShowingBack: boolean;
  onSideChange: (isShowingBack: boolean) => void;
}

/** Interactive WebGL book: idle float, drag to rotate with spring inertia, snaps to the nearest cover. */
export function ProductBookViewer({ book, isOpen, isShowingBack, onSideChange }: ProductBookViewerProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef<RotationState>(createRotationState());
  const [isGrabbed, setIsGrabbed] = useState(false);
  const viewportPosition = useViewportPosition(surfaceRef);
  const frameloop = viewportPosition === VIEWPORT_POSITION.inside ? 'always' : 'never';

  useEffect(() => {
    const rotation = rotationRef.current;
    if (isBackFacingYaw(rotation.restYaw) !== isShowingBack) rotation.restYaw += HALF_TURN;
  }, [isShowingBack]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const rotation = rotationRef.current;
    rotation.isDragging = true;
    rotation.yawVelocity = 0;
    rotation.pitchVelocity = 0;
    rotation.lastPointerX = event.clientX;
    rotation.lastPointerY = event.clientY;
    rotation.lastPointerTime = event.timeStamp;
    setIsGrabbed(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rotation = rotationRef.current;
    if (!rotation.isDragging || !event.isPrimary) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const yawStep = ((event.clientX - rotation.lastPointerX) / bounds.width) * DRAG_YAW_PER_VIEWER_WIDTH;
    const pitchStep = ((event.clientY - rotation.lastPointerY) / bounds.height) * DRAG_PITCH_PER_VIEWER_HEIGHT;
    const elapsedSeconds = Math.max(
      (event.timeStamp - rotation.lastPointerTime) / MILLISECONDS_PER_SECOND,
      MIN_POINTER_INTERVAL_SECONDS,
    );

    rotation.yaw += yawStep;
    rotation.pitch = clamp(rotation.pitch + pitchStep, -MAX_DRAG_PITCH, MAX_DRAG_PITCH);
    rotation.yawVelocity += (yawStep / elapsedSeconds - rotation.yawVelocity) * VELOCITY_SMOOTHING;
    rotation.lastPointerX = event.clientX;
    rotation.lastPointerY = event.clientY;
    rotation.lastPointerTime = event.timeStamp;
  };

  const handlePointerRelease = (event: PointerEvent<HTMLDivElement>) => {
    const rotation = rotationRef.current;
    if (!rotation.isDragging || !event.isPrimary) return;
    rotation.isDragging = false;
    const projectedYaw = rotation.yaw + rotation.yawVelocity * INERTIA_PROJECTION_SECONDS;
    rotation.restYaw = Math.round(projectedYaw / HALF_TURN) * HALF_TURN;
    setIsGrabbed(false);
    onSideChange(isBackFacingYaw(rotation.restYaw));
  };

  return (
    <div
      ref={surfaceRef}
      className={`product-viewer ${isGrabbed ? 'product-viewer--grabbed' : ''}`}
      role="img"
      aria-label={translate('product.viewerLabel', { title: book.title })}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerRelease}
      onPointerCancel={handlePointerRelease}
    >
      <Canvas
        dpr={DEVICE_PIXEL_RATIO}
        frameloop={frameloop}
        camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
        gl={{ antialias: true, alpha: true }}
      >
        <ViewerScene book={book} isOpen={isOpen} isGrabbed={isGrabbed} rotationRef={rotationRef} />
      </Canvas>
    </div>
  );
}
