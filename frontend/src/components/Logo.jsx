import React from 'react';

export default function Logo({ className = "w-9 h-9", pulse = false }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${pulse ? 'animate-pulse' : ''}`}
    >
      <defs>
        {/* Main Blue-Green Gradient for the Cross */}
        <linearGradient id="logoCrossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B53FA" />
          <stop offset="45%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        {/* Secondary Leaf Gradient */}
        <linearGradient id="logoLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      {/* 1. Rounded Medical Cross Base */}
      <path 
        d="M 38 18 C 38 11, 43 7, 50 7 C 57 7, 62 11, 62 18 L 62 38 L 82 38 C 89 38, 93 43, 93 50 C 93 57, 89 62, 82 62 L 62 62 L 62 82 C 62 89, 57 93, 50 93 C 43 93, 38 89, 38 82 L 38 62 L 18 62 C 11 62, 7 57, 7 50 C 7 43, 11 38, 18 38 L 38 38 Z" 
        fill="url(#logoCrossGrad)" 
      />

      {/* 2. Left Pill Capsule (in the bottom-left quadrant) */}
      <g transform="translate(23, 62) rotate(-45)">
        {/* Capsule Base */}
        <rect x="0" y="0" width="13" height="28" rx="6.5" fill="#0B53FA" stroke="white" strokeWidth="2.5" />
        {/* White top half */}
        <path d="M 0 6.5 A 6.5 6.5 0 0 1 13 6.5 L 13 14 L 0 14 Z" fill="white" />
        {/* Center Divider Line */}
        <line x1="0" y1="14" x2="13" y2="14" stroke="white" strokeWidth="1.5" />
      </g>

      {/* 3. Green Leaves on the Right Arm */}
      {/* Large Upper Leaf */}
      <path 
        d="M 52 46 C 66 33, 83 22, 88 26 C 93 30, 89 46, 75 58 C 63 68, 55 64, 52 46 Z" 
        fill="url(#logoLeafGrad)" 
        stroke="white" 
        strokeWidth="1.8" 
      />
      {/* Small Lower Leaf */}
      <path 
        d="M 58 54 C 71 47, 83 44, 85 47 C 87 50, 81 61, 70 69 C 60 76, 56 68, 58 54 Z" 
        fill="url(#logoLeafGrad)" 
        stroke="white" 
        strokeWidth="1.5" 
      />

      {/* 4. White Human Silhouette in the Center */}
      {/* Circle Head */}
      <circle cx="50" cy="35" r="7.5" fill="white" />
      {/* Swooping Body line */}
      <path 
        d="M 31 46 C 41 44, 48 48, 50 56 C 52 64, 48 76, 31 86 C 44 84, 54 78, 57 68 C 60 58, 56 50, 50 48 C 45 46, 38 46, 31 46 Z" 
        fill="white" 
      />
      {/* Swooping Arm line */}
      <path 
        d="M 50 48 C 55 45, 65 42, 72 45 C 65 48, 58 50, 50 48 Z" 
        fill="white" 
      />
    </svg>
  );
}
