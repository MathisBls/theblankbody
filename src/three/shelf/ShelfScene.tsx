import { Environment, Lightformer } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { easing } from 'maath';
import { useEffect, useMemo, useState, type RefObject } from 'react';
import * as THREE from 'three';
import { getBookDimensions, type Book } from '../../data/catalog';
import { THEME_COLORS } from '../../theme';
import { getCameraDistanceForFocus, getFocusDistance, type FocusFrame } from './focusPose';
import { ShelfBook } from './ShelfBook';
import {
  buildShelfLayout,
  findNearestValue,
  getFitDistance,
  SHELF_LAYOUT_MODE, SHELF_METRICS, type ShelfLayoutSummary } from './shelfLayout';
import { isBackCoverYaw, type ShelfMotionState } from './shelfMotion';
import { ShelfPlank } from './ShelfPlank';
import { useShelfGesture } from './useShelfGesture';

const CAMERA_SMOOTH_TIME = 0.45;
const FOV_SMOOTH_TIME = 0.3;
const FOV_EPSILON = 0.01;
const KEY_LIGHT_OFFSET = new THREE.Vector3(-5, 9, 11);
const SHADOW_CAMERA_HALF_SIZE = 14;
const BACKDROP_SIZE = 120;

export interface ShelfSceneProps {
  catalogBooks: readonly Book[];
  visibleBooks: readonly Book[];
  motionRef: RefObject<ShelfMotionState>;
  stickerElementsRef: RefObject<Map<string, HTMLElement>>;
  isRevealed: boolean;
  highlightedSlug: string | null;
  selectedSlug: string | null;
  isBackShown: boolean;
  focusFrame: FocusFrame;
  onHoverChange: (slug: string, isHovered: boolean) => void;
  onSelect: (slug: string) => void;
  onDismiss: () => void;
  onToggleBack: () => void;
  onLayoutChange: (summary: ShelfLayoutSummary) => void;
}

function ShelfLights({ motionRef }: { motionRef: RefObject<ShelfMotionState> }) {
  const [keyLight, setKeyLight] = useState<THREE.DirectionalLight | null>(null);

  useFrame(() => {
    if (!keyLight) return;
    const goal = motionRef.current.cameraGoal;
    keyLight.position.set(goal.x + KEY_LIGHT_OFFSET.x, goal.y + KEY_LIGHT_OFFSET.y, KEY_LIGHT_OFFSET.z);
    keyLight.target.position.set(goal.x, goal.y, 0);
    keyLight.target.updateMatrixWorld();
  });

  return (
    <>
      <hemisphereLight args={[THEME_COLORS.cream, THEME_COLORS.beige, 1.15]} />
      <directionalLight
        ref={setKeyLight}
        intensity={2}
        color={THEME_COLORS.white}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-radius={8}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-SHADOW_CAMERA_HALF_SIZE}
        shadow-camera-right={SHADOW_CAMERA_HALF_SIZE}
        shadow-camera-top={SHADOW_CAMERA_HALF_SIZE}
        shadow-camera-bottom={-SHADOW_CAMERA_HALF_SIZE}
        shadow-camera-near={1}
        shadow-camera-far={50}
      />
      <directionalLight position={[8, 3, 6]} intensity={0.7} color={THEME_COLORS.cream} />
      <directionalLight position={[0, 4, -8]} intensity={0.9} color={THEME_COLORS.white} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2} position={[0, 6, 6]} scale={[12, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-8, 1, 4]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer form="ring" intensity={1.5} color={THEME_COLORS.orange} position={[8, 2, 3]} scale={3} />
      </Environment>
      {keyLight ? <primitive object={keyLight.target} /> : null}
    </>
  );
}

export function ShelfScene({
  catalogBooks,
  visibleBooks,
  motionRef,
  stickerElementsRef,
  isRevealed,
  highlightedSlug,
  selectedSlug,
  isBackShown,
  focusFrame,
  onHoverChange,
  onSelect,
  onDismiss,
  onToggleBack,
  onLayoutChange,
}: ShelfSceneProps) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const aspect = size.height > 0 ? size.width / size.height : 1;
  const layout = useMemo(() => buildShelfLayout(visibleBooks, catalogBooks, aspect), [visibleBooks, catalogBooks, aspect]);
  const [isSpinning, setIsSpinning] = useState(false);
  const hasSelection = selectedSlug !== null;
  const selectedDimensions = useMemo(() => {
    const selectedBook = catalogBooks.find((book) => book.slug === selectedSlug);
    return selectedBook ? getBookDimensions(selectedBook) : null;
  }, [catalogBooks, selectedSlug]);

  useShelfGesture(motionRef, { layout, hasSelection, isBackShown, onSpinningChange: setIsSpinning, onToggleBack });

  useEffect(() => {
    onLayoutChange({ mode: layout.mode, visibleHeightFraction: layout.visibleHeightFraction });
  }, [layout.mode, layout.visibleHeightFraction, onLayoutChange]);

  useEffect(() => {
    const motion = motionRef.current;
    motion.spinBase = 0;
    motion.spinDrag = 0;
  }, [motionRef, selectedSlug]);

  useEffect(() => {
    const motion = motionRef.current;
    if (isBackCoverYaw(motion.spinBase) !== isBackShown) motion.spinBase += Math.PI;
  }, [motionRef, isBackShown]);

  useEffect(() => {
    const motion = motionRef.current;
    motion.scrollTarget = findNearestValue(layout.slotXs, motion.scrollTarget);
  }, [motionRef, layout]);

  useEffect(() => {
    const highlightedSlot = highlightedSlug ? layout.slotsBySlug.get(highlightedSlug) : undefined;
    if (layout.mode === SHELF_LAYOUT_MODE.carousel && highlightedSlot) motionRef.current.scrollTarget = highlightedSlot.x;
  }, [motionRef, highlightedSlug, layout]);

  useFrame((_, delta) => {
    const motion = motionRef.current;
    motion.aspect = aspect;
    motion.fovDegrees = layout.fovDegrees;
    motion.focusFrame = focusFrame;
    motion.scrollTarget = THREE.MathUtils.clamp(motion.scrollTarget, layout.scrollMin, layout.scrollMax);

    const { frame } = layout;
    const fitDistance =
      getFitDistance(frame.width, layout.fitHeight, layout.fovDegrees, aspect) + SHELF_METRICS.plankDepth / 2;
    const focusCameraDistance = selectedDimensions
      ? getCameraDistanceForFocus(getFocusDistance(layout.fovDegrees, aspect, focusFrame, selectedDimensions, true))
      : 0;
    const distance = Math.max(fitDistance, focusCameraDistance);
    const goalX = layout.mode === SHELF_LAYOUT_MODE.carousel ? motion.scrollTarget : frame.centerX;
    motion.cameraGoal.set(goalX, frame.centerY, distance);
    easing.damp3(camera.position, motion.cameraGoal, CAMERA_SMOOTH_TIME, delta);

    if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - layout.fovDegrees) > FOV_EPSILON) {
      easing.damp(camera, 'fov', layout.fovDegrees, FOV_SMOOTH_TIME, delta);
      camera.updateProjectionMatrix();
    }
  });

  const visibleIndexBySlug = useMemo(
    () => new Map(visibleBooks.map((book, index) => [book.slug, index])),
    [visibleBooks],
  );

  return (
    <>
      <ShelfLights motionRef={motionRef} />
      <mesh position={[0, 0, -SHELF_METRICS.plankDepth / 2 - 0.05]} receiveShadow>
        <planeGeometry args={[BACKDROP_SIZE, BACKDROP_SIZE]} />
        <shadowMaterial color={THEME_COLORS.ink} opacity={0.1} />
      </mesh>
      {layout.planks.map((plank) => (
        <ShelfPlank key={plank.key} centerX={plank.centerX} topY={plank.topY} width={plank.width} isVisible={plank.isVisible} />
      ))}
      {catalogBooks.map((book, catalogIndex) => (
        <ShelfBook
          key={book.slug}
          book={book}
          revealIndex={visibleIndexBySlug.get(book.slug) ?? catalogIndex}
          slot={layout.slotsBySlug.get(book.slug)}
          isRevealed={isRevealed}
          isHighlighted={!hasSelection && highlightedSlug === book.slug}
          isSelected={selectedSlug === book.slug}
          hasSelection={hasSelection}
          isBackShown={isBackShown}
          isSpinning={isSpinning}
          motionRef={motionRef}
          stickerElementsRef={stickerElementsRef}
          onHoverChange={onHoverChange}
          onSelect={onSelect}
          onDismiss={onDismiss}
        />
      ))}
    </>
  );
}
