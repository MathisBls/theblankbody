import * as THREE from 'three';
import { THEME_COLORS } from '../theme';

const PAGE_STRIPE_COUNT = 90;
const STRIPE_CANVAS_LENGTH = 512;
const STRIPE_CANVAS_DEPTH = 8;
const HALO_CANVAS_SIZE = 256;

let pageEdgeAlongU: THREE.CanvasTexture | undefined;
let pageEdgeAlongV: THREE.CanvasTexture | undefined;
let haloTexture: THREE.CanvasTexture | undefined;

export function createCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D | null] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return [canvas, canvas.getContext('2d')];
}

export function toTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function drawPageStripes(isAlongU: boolean): THREE.CanvasTexture {
  const width = isAlongU ? STRIPE_CANVAS_LENGTH : STRIPE_CANVAS_DEPTH;
  const height = isAlongU ? STRIPE_CANVAS_DEPTH : STRIPE_CANVAS_LENGTH;
  const [canvas, context] = createCanvas(width, height);
  if (context) {
    context.fillStyle = THEME_COLORS.pageEdge;
    context.fillRect(0, 0, width, height);
    context.fillStyle = THEME_COLORS.pageLine;
    const step = STRIPE_CANVAS_LENGTH / PAGE_STRIPE_COUNT;
    for (let index = 0; index < PAGE_STRIPE_COUNT; index += 1) {
      const offset = index * step + (index % 3) * 0.6;
      if (isAlongU) context.fillRect(offset, 0, 1.4, height);
      else context.fillRect(0, offset, width, 1.4);
    }
  }
  return toTexture(canvas);
}

/** Page-block texture whose stripes vary along U (fore-edge face). */
export function getPageEdgeTextureAlongU(): THREE.CanvasTexture {
  pageEdgeAlongU ??= drawPageStripes(true);
  return pageEdgeAlongU;
}

/** Page-block texture whose stripes vary along V (top and bottom faces). */
export function getPageEdgeTextureAlongV(): THREE.CanvasTexture {
  pageEdgeAlongV ??= drawPageStripes(false);
  return pageEdgeAlongV;
}

export function getHaloTexture(): THREE.CanvasTexture {
  if (haloTexture) return haloTexture;
  const [canvas, context] = createCanvas(HALO_CANVAS_SIZE, HALO_CANVAS_SIZE);
  if (context) {
    const center = HALO_CANVAS_SIZE / 2;
    const gradient = context.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.45, 'rgba(255,255,255,0.45)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, HALO_CANVAS_SIZE, HALO_CANVAS_SIZE);
  }
  haloTexture = toTexture(canvas);
  return haloTexture;
}
