import React from 'react';

interface LmsLogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  /** Deep navy – default #1a3a7a */
  primaryColor?: string;
  /** Cyan/teal accent – default #00b4d8 */
  accentColor?: string;
  /** Gold accent – default #d4a843 */
  goldColor?: string;
}

export function LmsLogo({
  className,
  width = 330,
  height = 120,
  primaryColor = '#1a3a7a',
  accentColor = '#00b4d8',
  goldColor = '#d4a843',
}: LmsLogoProps) {
  const id = React.useId().replace(/:/g, '');

  const bgGradId    = `bg-${id}`;
  const lmsGradId   = `lms-${id}`;
  const goldGradId  = `gold-${id}`;
  const shineGradId = `shine-${id}`;
  const shadowId    = `shadow-${id}`;

  const widthAttr =
    typeof width === 'number' || (typeof width === 'string' && width !== 'auto')
      ? width
      : undefined;
  const heightAttr = typeof height === 'number' ? height : undefined;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 330 120"
      width={widthAttr}
      height={heightAttr}
      className={className}
      aria-label="LMS System"
      role="img"
    >
      <defs>
        {/* Badge gradient: accent → primary */}
        <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   style={{ stopColor: accentColor,  stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: primaryColor, stopOpacity: 1 }} />
        </linearGradient>

        {/* LMS text gradient: accent top → primary bottom */}
        <linearGradient id={lmsGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   style={{ stopColor: accentColor,  stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: primaryColor, stopOpacity: 1 }} />
        </linearGradient>

        {/* Gold for spark / accent */}
        <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   style={{ stopColor: '#ffe066', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: goldColor,  stopOpacity: 1 }} />
        </linearGradient>

        {/* Inner radial shine on badge */}
        <radialGradient id={shineGradId} cx="32%" cy="26%" r="58%">
          <stop offset="0%"   style={{ stopColor: '#fff', stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: '#fff', stopOpacity: 0   }} />
        </radialGradient>

        {/* Soft drop-shadow for badge */}
        <filter id={shadowId} x="-12%" y="-12%" width="124%" height="124%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor={primaryColor} floodOpacity="0.28" />
        </filter>
      </defs>

      {/* ── ICON BADGE ── */}
      <rect x="8" y="8" width="104" height="104" rx="26"
            fill={`url(#${bgGradId})`} filter={`url(#${shadowId})`} />
      <rect x="8" y="8" width="104" height="104" rx="26"
            fill={`url(#${shineGradId})`} />
      <rect x="8" y="8" width="104" height="104" rx="26"
            fill="none" stroke="white" strokeWidth="1.5" opacity="0.22" />

      {/* ── OPEN BOOK ── */}
      {/* Left page */}
      <path d="M 60,28 L 17,35 L 17,96 L 60,90 Z"
            fill="white" opacity="0.9" />
      {/* Right page */}
      <path d="M 60,28 L 103,35 L 103,96 L 60,90 Z"
            fill="white" opacity="0.9" />
      {/* Subtle bottom shadow on pages for depth */}
      <path d="M 17,90 L 60,84 L 103,90 L 103,96 L 60,90 L 17,96 Z"
            fill="white" opacity="0.12" />
      {/* Top arch of pages */}
      <path d="M 17,35 Q 60,26 103,35"
            fill="none" stroke="white" strokeWidth="2" opacity="0.45" />
      {/* Center spine */}
      <line x1="60" y1="27" x2="60" y2="90"
            stroke="white" strokeWidth="2.2" opacity="0.6" />

      {/* Ruled lines – left page (4 lines) */}
      <line x1="22" y1="49" x2="55" y2="47" stroke="white" strokeWidth="1.5" opacity="0.32" />
      <line x1="22" y1="60" x2="55" y2="58" stroke="white" strokeWidth="1.5" opacity="0.32" />
      <line x1="22" y1="71" x2="55" y2="69" stroke="white" strokeWidth="1.5" opacity="0.32" />
      <line x1="22" y1="81" x2="55" y2="79" stroke="white" strokeWidth="1.5" opacity="0.32" />

      {/* Ruled lines – right page (4 lines) */}
      <line x1="65" y1="47" x2="98" y2="49" stroke="white" strokeWidth="1.5" opacity="0.32" />
      <line x1="65" y1="58" x2="98" y2="60" stroke="white" strokeWidth="1.5" opacity="0.32" />
      <line x1="65" y1="69" x2="98" y2="71" stroke="white" strokeWidth="1.5" opacity="0.32" />
      <line x1="65" y1="79" x2="98" y2="81" stroke="white" strokeWidth="1.5" opacity="0.32" />

      {/* ── GOLD SPARK at top of spine ── */}
      <circle cx="60" cy="24" r="5.5" fill={`url(#${goldGradId})`} opacity="0.95" />
      {/* 5-point ray lines */}
      <line x1="60" y1="13" x2="60" y2="17" stroke={`url(#${goldGradId})`} strokeWidth="2" strokeLinecap="round" />
      <line x1="51" y1="16" x2="54" y2="19" stroke={`url(#${goldGradId})`} strokeWidth="2" strokeLinecap="round" />
      <line x1="69" y1="16" x2="66" y2="19" stroke={`url(#${goldGradId})`} strokeWidth="2" strokeLinecap="round" />
      <line x1="47" y1="24" x2="51" y2="24" stroke={`url(#${goldGradId})`} strokeWidth="2" strokeLinecap="round" />
      <line x1="73" y1="24" x2="69" y2="24" stroke={`url(#${goldGradId})`} strokeWidth="2" strokeLinecap="round" />

      {/* ── VERTICAL DIVIDER ── */}
      <rect x="128" y="18" width="2" height="84" rx="1"
            fill={accentColor} opacity="0.3" />

      {/* ── TEXT: LMS ── */}
      <text
        x="148"
        y="87"
        fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
        fontSize="74"
        fontWeight="900"
        fill={`url(#${lmsGradId})`}
        letterSpacing="-2"
      >LMS</text>

      {/* ── TEXT: SYSTEM ── */}
      <text
        x="151"
        y="110"
        fontFamily="'Arial', 'Helvetica Neue', Arial, sans-serif"
        fontSize="21"
        fontWeight="500"
        fill={accentColor}
        letterSpacing="8"
        opacity="0.88"
      >SYSTEM</text>
    </svg>
  );
}
