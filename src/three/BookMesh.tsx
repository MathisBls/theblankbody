import { useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { easing } from 'maath';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getBookDimensions, type Book } from '../data/catalog';
import { MOTION, THEME_COLORS } from '../theme';
import {
  getHaloTexture,
  getPageEdgeTextureAlongU,
  getPageEdgeTextureAlongV,
} from './bookTextures';
import { createFirstPageTexture, createInsideCoverTexture } from './bookInsideTextures';

const COVER_THICKNESS = 0.028;
const COVER_OVERHANG = 0.035;
const CORNER_RADIUS = 0.07;
const FACE_OFFSET = 0.0006;
const MAX_ANISOTROPY = 8;
const COVER_SELF_ILLUMINATION = 0.28;

const ROUNDED_SIDE = { left: 'left', right: 'right' } as const;
type RoundedSide = (typeof ROUNDED_SIDE)[keyof typeof ROUNDED_SIDE];

export interface BookMeshProps {
  book: Book;
  /** Target opening of the front cover, from 0 (closed) to 1 (open). Damped internally. */
  openAmount?: number;
  /** Target strength of the series-colour glow, from 0 to 1. Damped internally. */
  glowAmount?: number;
  castShadow?: boolean;
}

/** Cover outline with square corners on the spine side and rounded corners on the fore-edge. */
function createCoverShape(width: number, height: number, roundedSide: RoundedSide): THREE.Shape {
  const halfHeight = height / 2;
  const radius = CORNER_RADIUS;
  const shape = new THREE.Shape();
  if (roundedSide === ROUNDED_SIDE.right) {
    shape.moveTo(0, -halfHeight);
    shape.lineTo(width - radius, -halfHeight);
    shape.quadraticCurveTo(width, -halfHeight, width, -halfHeight + radius);
    shape.lineTo(width, halfHeight - radius);
    shape.quadraticCurveTo(width, halfHeight, width - radius, halfHeight);
    shape.lineTo(0, halfHeight);
  } else {
    shape.moveTo(width, -halfHeight);
    shape.lineTo(width, halfHeight);
    shape.lineTo(radius, halfHeight);
    shape.quadraticCurveTo(0, halfHeight, 0, halfHeight - radius);
    shape.lineTo(0, -halfHeight + radius);
    shape.quadraticCurveTo(0, -halfHeight, radius, -halfHeight);
  }
  shape.closePath();
  return shape;
}

function createCoverFaceGeometry(width: number, height: number, roundedSide: RoundedSide): THREE.ShapeGeometry {
  const geometry = new THREE.ShapeGeometry(createCoverShape(width, height, roundedSide), 8);
  const positions = geometry.getAttribute('position');
  const uvs = geometry.getAttribute('uv');
  for (let index = 0; index < positions.count; index += 1) {
    uvs.setXY(index, positions.getX(index) / width, (positions.getY(index) + height / 2) / height);
  }
  uvs.needsUpdate = true;
  return geometry;
}

function createCoverBodyGeometry(width: number, height: number): THREE.ExtrudeGeometry {
  const geometry = new THREE.ExtrudeGeometry(createCoverShape(width, height, ROUNDED_SIDE.right), {
    depth: COVER_THICKNESS,
    bevelEnabled: false,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -COVER_THICKNESS / 2);
  return geometry;
}

function ignoreRaycast(): void {}

export function BookMesh({ book, openAmount = 0, glowAmount = 0, castShadow = true }: BookMeshProps) {
  const { width, height, thickness } = getBookDimensions(book);
  const maxAnisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy());
  const [frontTexture, backTexture, spineTexture] = useTexture([
    book.images.front,
    book.images.back,
    book.images.spine,
  ]);

  useLayoutEffect(() => {
    for (const texture of [frontTexture, backTexture, spineTexture]) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(MAX_ANISOTROPY, maxAnisotropy);
      texture.needsUpdate = true;
    }
  }, [frontTexture, backTexture, spineTexture, maxAnisotropy]);

  const pagesWidth = width - COVER_OVERHANG;
  const pagesHeight = height - COVER_OVERHANG * 2;
  const pagesDepth = thickness - COVER_THICKNESS * 2;

  const geometries = useMemo(
    () => ({
      coverBody: createCoverBodyGeometry(width, height),
      frontFace: createCoverFaceGeometry(width, height, ROUNDED_SIDE.right),
      backFace: createCoverFaceGeometry(width, height, ROUNDED_SIDE.left),
    }),
    [width, height],
  );
  useEffect(
    () => () => Object.values(geometries).forEach((geometry) => geometry.dispose()),
    [geometries],
  );

  const innerPageTexture = useMemo(() => createFirstPageTexture(book), [book]);
  const endpaperTexture = useMemo(() => createInsideCoverTexture(book), [book]);
  useEffect(() => () => {
    innerPageTexture.dispose();
    endpaperTexture.dispose();
  }, [innerPageTexture, endpaperTexture]);

  const materials = useMemo(() => {
    const cream = new THREE.MeshStandardMaterial({ color: THEME_COLORS.cream, roughness: 0.85 });
    const coverEdge = new THREE.MeshStandardMaterial({
      color: book.accent,
      roughness: 0.55,
      emissive: new THREE.Color(book.accent),
      emissiveIntensity: 0,
    });
    const pageEdgeU = new THREE.MeshStandardMaterial({ map: getPageEdgeTextureAlongU(), roughness: 0.9 });
    const pageEdgeV = new THREE.MeshStandardMaterial({ map: getPageEdgeTextureAlongV(), roughness: 0.9 });
    const innerPage = new THREE.MeshStandardMaterial({ map: innerPageTexture, roughness: 0.9 });
    const endpaper = new THREE.MeshStandardMaterial({ map: endpaperTexture, roughness: 0.7 });
    // A little self-illumination keeps printed colours close to the real cover under the scene lights.
    const createCoverMaterial = (texture: THREE.Texture) =>
      new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.42,
        metalness: 0.02,
        emissive: new THREE.Color(THEME_COLORS.white),
        emissiveMap: texture,
        emissiveIntensity: COVER_SELF_ILLUMINATION,
      });
    const front = createCoverMaterial(frontTexture);
    const back = createCoverMaterial(backTexture);
    const spine = createCoverMaterial(spineTexture);
    // Drawn first in the opaque pass without depth test, so the book always paints over its own halo.
    const halo = new THREE.SpriteMaterial({
      map: getHaloTexture(),
      color: book.accent,
      transparent: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    });
    return { cream, coverEdge, pageEdgeU, pageEdgeV, innerPage, endpaper, front, back, spine, halo };
  }, [book.accent, frontTexture, backTexture, spineTexture, innerPageTexture, endpaperTexture]);
  useEffect(
    () => () => Object.values(materials).forEach((material) => material.dispose()),
    [materials],
  );

  // Box face order: +x, -x, +y, -y, +z, -z
  const pageBlockMaterials = useMemo(
    () => [
      materials.pageEdgeU,
      materials.cream,
      materials.pageEdgeV,
      materials.pageEdgeV,
      materials.innerPage,
      materials.cream,
    ],
    [materials],
  );
  const spineMaterials = useMemo(
    () => [
      materials.coverEdge,
      materials.spine,
      materials.coverEdge,
      materials.coverEdge,
      materials.coverEdge,
      materials.coverEdge,
    ],
    [materials],
  );
  const coverBodyMaterials = useMemo(() => [materials.cream, materials.coverEdge], [materials]);

  const frontHingeRef = useRef<THREE.Group>(null);
  const animatedMaterialsRef = useRef<{ halo: THREE.SpriteMaterial; coverEdge: THREE.MeshStandardMaterial }>(null);
  useEffect(() => {
    animatedMaterialsRef.current = { halo: materials.halo, coverEdge: materials.coverEdge };
  }, [materials]);
  const animatedState = useRef({ open: openAmount, glow: glowAmount });

  useFrame((_, delta) => {
    const state = animatedState.current;
    easing.damp(state, 'open', openAmount, MOTION.dampSmoothTime * 1.6, delta);
    easing.damp(state, 'glow', glowAmount, MOTION.dampSmoothTime, delta);
    if (frontHingeRef.current) frontHingeRef.current.rotation.y = -MOTION.openAngle * state.open;
    const animatedMaterials = animatedMaterialsRef.current;
    if (!animatedMaterials) return;
    animatedMaterials.halo.opacity = state.glow * 0.75;
    animatedMaterials.coverEdge.emissiveIntensity = state.glow * 0.45;
  });

  const halfWidth = width / 2;
  const coverZ = thickness / 2 - COVER_THICKNESS / 2;

  return (
    <group>
      <sprite
        material={materials.halo}
        position={[0, 0, -thickness * 1.5]}
        scale={[width * 2.3, height * 1.65, 1]}
        renderOrder={-1}
        raycast={ignoreRaycast}
      />

      <mesh
        position={[-halfWidth + pagesWidth / 2 + COVER_OVERHANG * 0.1, 0, 0]}
        material={pageBlockMaterials}
        castShadow={castShadow}
        receiveShadow
      >
        <boxGeometry args={[pagesWidth, pagesHeight, pagesDepth]} />
      </mesh>

      <mesh position={[-halfWidth - COVER_THICKNESS / 2, 0, 0]} material={spineMaterials} castShadow={castShadow}>
        <boxGeometry args={[COVER_THICKNESS, height, thickness]} />
      </mesh>

      <group ref={frontHingeRef} position={[-halfWidth, 0, coverZ]}>
        <mesh geometry={geometries.coverBody} material={coverBodyMaterials} castShadow={castShadow} />
        <mesh
          geometry={geometries.frontFace}
          material={materials.front}
          position={[0, 0, COVER_THICKNESS / 2 + FACE_OFFSET]}
        />
        <mesh
          geometry={geometries.backFace}
          material={materials.endpaper}
          position={[width, 0, -COVER_THICKNESS / 2 - FACE_OFFSET]}
          rotation={[0, Math.PI, 0]}
        />
      </group>

      <group position={[-halfWidth, 0, -coverZ]}>
        <mesh geometry={geometries.coverBody} material={coverBodyMaterials} castShadow={castShadow} receiveShadow />
        <mesh
          geometry={geometries.backFace}
          material={materials.back}
          position={[width, 0, -COVER_THICKNESS / 2 - FACE_OFFSET]}
          rotation={[0, Math.PI, 0]}
        />
      </group>
    </group>
  );
}
