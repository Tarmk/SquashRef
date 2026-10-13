import { useId } from 'react';

/**
 * Squash racket and ball. A squash ball is small and dark with yellow dots,
 * which is what tells it apart from a tennis or badminton logo.
 */
export default function SquashLogo({ className = 'w-8 h-8', title = 'Squash Referee' }: { className?: string; title?: string }) {
  // Unique per instance: the header and the page can both show the logo.
  const clipId = `squash-logo-head-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <defs>
        <clipPath id={clipId}>
          <ellipse cx="32" cy="20" rx="10.5" ry="14.5" />
        </clipPath>
      </defs>
      <g transform="rotate(-40 32 32)" fill="none" stroke="currentColor" strokeLinecap="round">
        <g clipPath={`url(#${clipId})`} strokeWidth="1.2" opacity="0.55">
          <path d="M24 4v34M28 4v34M32 4v34M36 4v34M40 4v34M16 10h32M16 15h32M16 20h32M16 25h32M16 30h32" />
        </g>
        <ellipse cx="32" cy="20" rx="12" ry="16" strokeWidth="3.5" />
        <path d="M26 33.5 32 42l6-8.5" strokeWidth="3" strokeLinejoin="round" />
        <path d="M32 42v8" strokeWidth="3.5" />
        <path d="M32 50v11" strokeWidth="6" />
      </g>
      <circle cx="48" cy="17" r="6.5" fill="#1f2937" />
      <circle cx="45.6" cy="15.2" r="1.5" fill="#facc15" />
      <circle cx="50.4" cy="18.8" r="1.5" fill="#facc15" />
    </svg>
  );
}
