import { ContactShadows, Environment, Float, Lightformer } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import type { Book } from '../../data/catalog';
import { translate } from '../../i18n';
import { THEME_COLORS } from '../../theme';
import { HeroBook } from './HeroBook';
import { createHeroInteractionState } from './heroInteraction';
import './HeroBookCanvas.css';

const CAMERA_HEIGHT = 1.3;
const CAMERA_DISTANCE = 8.3;
const CAMERA_POSITION: [number, number, number] = [0, CAMERA_HEIGHT, CAMERA_DISTANCE];
const CAMERA_ROTATION: [number, number, number] = [-Math.atan2(CAMERA_HEIGHT, CAMERA_DISTANCE), 0, 0];
const CAMERA_FOV = 30;
const DEVICE_PIXEL_RATIO_RANGE: [number, number] = [1, 2];
const DRAG_YAW_PER_CANVAS_WIDTH = Math.PI * 1.2;
const MOUSE_POINTER_TYPE = 'mouse';
const CANVAS_RESIZE_OPTIONS = { offsetSize: true } as const;
const FRAME_LOOP = { running: 'always', paused: 'never' } as const;

export interface HeroBookCanvasProps {
  book: Book;
  /** Called once the book textures are loaded and the 3D book is on screen. */
  onReady: () => void;
}

function SceneReadySignal({ onReady }: { onReady: () => void }) {
  useEffect(() => onReady(), [onReady]);
  return null;
}

function useIsElementVisible(elementRef: RefObject<HTMLElement | null>): boolean {
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return undefined;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry?.isIntersecting ?? true));
    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef]);
  return isVisible;
}

/** Real-time 3D hero book: lazy-loaded so three.js never blocks the first paint. */
export function HeroBookCanvas({ book, onReady }: HeroBookCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef(createHeroInteractionState());
  const dragStartRef = useRef({ clientX: 0, dragYaw: 0 });
  const isVisible = useIsElementVisible(wrapperRef);

  useEffect(() => {
    const handleWindowPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== MOUSE_POINTER_TYPE) return;
      const interaction = interactionRef.current;
      interaction.pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      interaction.pointerY = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleWindowPointerMove);
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    interaction.isDragging = true;
    dragStartRef.current = { clientX: event.clientX, dragYaw: interaction.dragYaw };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.dragging = 'true';
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    if (!interaction.isDragging) return;
    const canvasWidth = event.currentTarget.clientWidth || 1;
    const deltaX = event.clientX - dragStartRef.current.clientX;
    interaction.dragYaw = dragStartRef.current.dragYaw + (deltaX / canvasWidth) * DRAG_YAW_PER_CANVAS_WIDTH;
  };

  const handlePointerRelease = (event: ReactPointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    interaction.isDragging = false;
    interaction.dragYaw = 0;
    delete event.currentTarget.dataset.dragging;
  };

  const frameLoop = isVisible ? FRAME_LOOP.running : FRAME_LOOP.paused;

  return (
    <div
      ref={wrapperRef}
      className="hero-book-canvas"
      role="img"
      aria-label={translate('hero.bookLabel')}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerRelease}
      onPointerCancel={handlePointerRelease}
    >
      <Canvas
        flat
        dpr={DEVICE_PIXEL_RATIO_RANGE}
        frameloop={frameLoop}
        resize={CANVAS_RESIZE_OPTIONS}
        camera={{ position: CAMERA_POSITION, rotation: CAMERA_ROTATION, fov: CAMERA_FOV }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 6]} intensity={1.4} color={THEME_COLORS.white} />
        <directionalLight position={[-5, 1.5, -2]} intensity={0.9} color={THEME_COLORS.orange} />
        <Environment resolution={128}>
          <Lightformer form="rect" intensity={2.2} position={[0, 3, 5]} scale={[8, 2.5, 1]} color={THEME_COLORS.white} />
          <Lightformer form="rect" intensity={1.2} position={[-6, 0, 2]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} color={THEME_COLORS.cream} />
          <Lightformer form="ring" intensity={1.4} position={[5, 2, -3]} scale={3} color={THEME_COLORS.orange} />
        </Environment>
        <Suspense fallback={null}>
          <Float speed={1.6} rotationIntensity={0.12} floatIntensity={0.7} floatingRange={[-0.08, 0.08]}>
            <HeroBook book={book} interactionRef={interactionRef} />
          </Float>
          <SceneReadySignal onReady={onReady} />
        </Suspense>
        <ContactShadows
          position={[0, -1.95, 0]}
          scale={5.5}
          far={2.6}
          blur={2.8}
          opacity={0.45}
          resolution={256}
          color={THEME_COLORS.ink}
        />
      </Canvas>
    </div>
  );
}
