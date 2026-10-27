const ICON_VIEW_BOX = '0 0 48 48';
const OUTLINE_WIDTH = 3;

export function BookIcon() {
  return (
    <svg className="step-icon" viewBox={ICON_VIEW_BOX} aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" strokeLinecap="round">
        <path className="step-icon__fill-page" d="M24 12c-5-4-12-4-17-2v27c5-2 12-2 17 2z" />
        <path className="step-icon__fill-page" d="M24 12c5-4 12-4 17-2v27c-5-2-12-2-17 2z" />
        <path fill="none" d="M24 12v27M11 17c3-1 6-1 9 0M11 23c3-1 6-1 9 0M28 17c3-1 6-1 9 0" />
        <path className="step-icon__fill-accent" d="M31 10v12l3-2 3 2V9.6" />
      </g>
    </svg>
  );
}

export function SecureCardIcon() {
  return (
    <svg className="step-icon" viewBox={ICON_VIEW_BOX} aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" strokeLinecap="round">
        <rect className="step-icon__fill-page" x="4" y="10" width="32" height="22" rx="4" />
        <path fill="none" d="M4 17h32M9 26h8" />
        <path fill="none" d="M31 27v-4a6 6 0 0 1 12 0v4" />
        <rect className="step-icon__fill-accent" x="27" y="27" width="20" height="15" rx="3" />
        <path fill="none" d="M37 33v3" />
      </g>
    </svg>
  );
}

export function DownloadIcon() {
  return (
    <svg className="step-icon" viewBox={ICON_VIEW_BOX} aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" strokeLinecap="round">
        <path className="step-icon__fill-page" d="M10 5h20l9 9v29H10z" />
        <path className="step-icon__fill-page" d="M30 5v9h9" />
        <circle className="step-icon__fill-accent" cx="24.5" cy="30" r="9" />
        <path fill="none" d="M24.5 25v9M20.5 30.5l4 4 4-4" />
      </g>
    </svg>
  );
}
