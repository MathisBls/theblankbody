// Mirror of styles/tokens.css for code that cannot read CSS variables (Three.js materials).
export const THEME_COLORS = {
  navy: '#2B3A67',
  navyDeep: '#1B2A5C',
  orange: '#FF7A1A',
  green: '#2FA36B',
  beige: '#ECE0CC',
  cream: '#FFFAF2',
  pageEdge: '#F4EAD8',
  pageLine: '#E3D5BD',
  ink: '#1D2440',
  white: '#FFFFFF',
} as const;

export const MOTION = {
  hoverLift: 0.35,
  openAngle: Math.PI * 0.88,
  dampSmoothTime: 0.18,
} as const;
