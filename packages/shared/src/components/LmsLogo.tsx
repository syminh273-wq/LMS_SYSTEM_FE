import React from 'react';

interface LmsLogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  primaryColor?: string;
  accentColor?: string;
  goldColor?: string;
}

export function LmsLogo({
  className,
  width = 380,
  height = 120,
  primaryColor = '#0d4a8a',
  accentColor = '#4db8e8',
  goldColor: _goldColor,
}: LmsLogoProps) {
  const id = React.useId().replace(/:/g, '');

  const bookGradId = `book-${id}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 380 120"
      width={width}
      height={height}
      className={className}
      aria-label="LMS System"
      role="img"
    >
      <defs>
        <linearGradient id={bookGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: accentColor, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: primaryColor, stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Book outline - left cover */}
      <path
        d="M 15,15 L 15,95 Q 15,100 20,100 L 70,100 L 70,20 Q 70,15 65,15 Z"
        fill="none"
        stroke={primaryColor}
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* Book outline - right cover */}
      <path
        d="M 125,15 L 125,95 Q 125,100 120,100 L 70,100 L 70,20 Q 70,15 75,15 Z"
        fill="none"
        stroke={primaryColor}
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* Book pages - left */}
      <path
        d="M 22,22 L 22,92 Q 22,95 25,95 L 68,95 L 68,25 Q 68,22 65,22 Z"
        fill="none"
        stroke={accentColor}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Book pages - right */}
      <path
        d="M 118,22 L 118,92 Q 118,95 115,95 L 72,95 L 72,25 Q 72,22 75,22 Z"
        fill="none"
        stroke={accentColor}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Circuit lines - left page */}
      <line x1="35" y1="75" x2="35" y2="55" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="35" cy="52" r="3" fill={accentColor} />

      <line x1="50" y1="80" x2="50" y2="50" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="47" r="3" fill={accentColor} />

      <line x1="60" y1="85" x2="60" y2="60" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="60" cy="57" r="3" fill={accentColor} />

      {/* Circuit lines - right page */}
      <line x1="80" y1="85" x2="80" y2="65" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="80" cy="62" r="3" fill={accentColor} />

      <line x1="95" y1="80" x2="95" y2="55" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="95" cy="52" r="3" fill={accentColor} />

      <line x1="105" y1="75" x2="105" y2="60" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="105" cy="57" r="3" fill={accentColor} />

      {/* Upward arrow */}
      <path
        d="M 40,85 L 100,30 L 100,50 L 115,50 L 115,20 L 85,20 L 85,35 L 30,85 Z"
        fill={accentColor}
        opacity="0.85"
      />

      {/* LMS Text */}
      <text
        x="145"
        y="75"
        fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
        fontSize="72"
        fontWeight="900"
        fill={primaryColor}
        letterSpacing="-1"
      >LMS</text>

      {/* System Text */}
      <text
        x="148"
        y="108"
        fontFamily="'Arial', 'Helvetica Neue', Arial, sans-serif"
        fontSize="36"
        fontWeight="400"
        fill={primaryColor}
        opacity="0.85"
      >System</text>
    </svg>
  );
}
