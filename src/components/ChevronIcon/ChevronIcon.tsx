import './ChevronIcon.css';

export interface ChevronIconProps {
  isPointingLeft?: boolean;
  className?: string;
}

/** Decorative chevron that inherits the text colour and scales with the font size. */
export function ChevronIcon({ isPointingLeft = false, className = '' }: ChevronIconProps) {
  const directionClassName = isPointingLeft ? 'chevron-icon--left' : '';
  return (
    <svg className={`chevron-icon ${directionClassName} ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
