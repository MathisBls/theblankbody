export const SHELF_RENDER_MODE = {
  webgl: 'webgl',
  css3d: 'css3d',
  static: 'static',
} as const;
export type ShelfRenderMode = (typeof SHELF_RENDER_MODE)[keyof typeof SHELF_RENDER_MODE];
export type BookGridVariant = Exclude<ShelfRenderMode, typeof SHELF_RENDER_MODE.webgl>;

/** Real-time 3D when possible, CSS 3D books without WebGL, static covers when motion is reduced. */
export function getShelfRenderMode(canRender3d: boolean, prefersReducedMotion: boolean): ShelfRenderMode {
  if (canRender3d) return SHELF_RENDER_MODE.webgl;
  return prefersReducedMotion ? SHELF_RENDER_MODE.static : SHELF_RENDER_MODE.css3d;
}
