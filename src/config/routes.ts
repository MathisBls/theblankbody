export const ROUTES = {
  home: '/',
  product: '/books/:slug',
  terms: '/terms',
  privacy: '/privacy',
} as const;

export function buildProductPath(slug: string): string {
  return `/books/${slug}`;
}

/** Link to a home-page section that works from any route. */
export function buildSectionHref(sectionId: string): string {
  return `/#${sectionId}`;
}
