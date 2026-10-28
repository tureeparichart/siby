import React from 'react';

export type SibyMood = 'happy' | 'remind' | 'cheer' | 'detective' | 'sleeping';

interface MascotSibyProps {
  mood?: SibyMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  speechBubble?: string;
  className?: string;
}

export const MascotSiby: React.FC<MascotSibyProps> = ({
  mood = 'happy',
  size = 'md',
  speechBubble,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  };

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Speech Bubble */}
      {speechBubble && (
        <div className="mb-2 max-w-xs px-3 py-1.5 bg-white border border-sky-200 text-slate-800 text-xs rounded-xl shadow-sm relative animate-fade-in font-medium text-center">
          <span>{speechBubble}</span>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-sky-200 transform rotate-45" />
        </div>
      )}

      {/* SVG Husky Mascot */}
      <div className={`${sizeMap[size]} transition-transform duration-300 hover:scale-105 filter drop-shadow-sm`}>
        <svg
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Back Ears (Outer) */}
          <polygon points="32,24 58,68 18,60" fill="#334155" />
          <polygon points="128,24 142,60 102,68" fill="#334155" />

          {/* Inner Ears (Soft Pink) */}
          <polygon points="36,32 52,62 26,56" fill="#fbcfe8" />
          <polygon points="124,32 134,56 108,62" fill="#fbcfe8" />

          {/* Husky Main Head (Slate Dark Grey Top Coat) */}
          <ellipse cx="80" cy="85" rx="55" ry="48" fill="#475569" />

          {/* Husky Cheeks & Snout (White Fur Face Mask) */}
          <path
            d="M 40,88 C 34,106 50,126 80,126 C 110,126 126,106 120,88 C 115,70 104,78 80,68 C 56,78 45,70 40,88 Z"
            fill="#ffffff"
          />

          {/* Distinctive Husky Forehead Mask / Blaze */}
          <path
            d="M 72,50 C 72,42 76,36 80,36 C 84,36 88,42 88,50 C 88,62 94,72 80,75 C 66,72 72,62 72,50 Z"
            fill="#ffffff"
          />
          {/* Eyebrow dots (Husky signature markings) */}
          <ellipse cx="58" cy="62" rx="4.5" ry="3.5" fill="#ffffff" />
          <ellipse cx="102" cy="62" rx="4.5" ry="3.5" fill="#ffffff" />

          {/* Eyes (Vibrant Husky Arctic Cyan Blue) */}
          {mood === 'sleeping' ? (
            <>
              {/* Sleeping happy eye curves */}
              <path d="M 52,80 Q 60,88 68,80" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M 92,80 Q 100,88 108,80" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
              {/* Zzz text */}
              <text x="116" y="50" fill="#38bdf8" fontSize="14" fontWeight="bold">z</text>
              <text x="126" y="38" fill="#0284c7" fontSize="18" fontWeight="bold">Z</text>
            </>
          ) : (
            <>
              {/* Left Eye */}
              <ellipse cx="60" cy="78" rx="8" ry="10" fill="#0284c7" />
              <circle cx="60" cy="78" r="5" fill="#082f49" />
              <circle cx="58" cy="75" r="2.5" fill="#ffffff" />
              <circle cx="62" cy="80" r="1.2" fill="#ffffff" />

              {/* Right Eye */}
              <ellipse cx="100" cy="78" rx="8" ry="10" fill="#0284c7" />
              <circle cx="100" cy="78" r="5" fill="#082f49" />
              <circle cx="98" cy="75" r="2.5" fill="#ffffff" />
              <circle cx="102" cy="80" r="1.2" fill="#ffffff" />
            </>
          )}

          {/* Cute Nose */}
          <path
            d="M 73,95 C 73,92 87,92 87,95 C 87,98 83,102 80,102 C 77,102 73,98 73,95 Z"
            fill="#1e293b"
          />

          {/* Mouth & Tongue */}
          {mood === 'happy' || mood === 'cheer' ? (
            <>
              <path
                d="M 74,103 Q 80,106 86,103"
                stroke="#1e293b"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              {/* Cute little pink tongue */}
              <path
                d="M 77,105 C 77,105 76,114 80,114 C 84,114 83,105 83,105 Z"
                fill="#f43f5e"
              />
            </>
          ) : (
            <path
              d="M 73,102 Q 80,107 87,102"
              stroke="#1e293b"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Soft Husky Cheeks Blush */}
          <ellipse cx="46" cy="92" rx="6" ry="4" fill="#fda4af" opacity="0.6" />
          <ellipse cx="114" cy="92" rx="6" ry="4" fill="#fda4af" opacity="0.6" />

          {/* Blue Collar with Golden Bell / Star */}
          <path
            d="M 46,125 C 65,134 95,134 114,125 L 112,133 C 95,142 65,142 48,133 Z"
            fill="#0284c7"
          />
          <circle cx="80" cy="135" r="6" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
          <circle cx="80" cy="135" r="2" fill="#78350f" />

          {/* Specific Mood Accoutrements */}
          {mood === 'cheer' && (
            <>
              {/* Confetti & Golden Sparkles */}
              <polygon points="20,20 23,26 30,26 24,30 27,37 20,32 14,37 16,30 11,26 18,26" fill="#f59e0b" />
              <polygon points="140,25 142,30 148,30 143,33 145,39 140,35 135,39 137,33 132,30 138,30" fill="#f59e0b" />
              <circle cx="28" cy="46" r="3" fill="#3b82f6" />
              <circle cx="132" cy="50" r="3" fill="#10b981" />
              <circle cx="145" cy="18" r="2.5" fill="#ec4899" />
              {/* Raised Paws */}
              <ellipse cx="26" cy="72" rx="9" ry="7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
              <ellipse cx="134" cy="72" rx="9" ry="7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            </>
          )}

          {mood === 'remind' && (
            <>
              {/* Small Clipboard in hand */}
              <g transform="translate(112, 80) rotate(10)">
                <rect x="0" y="0" width="28" height="36" rx="3" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
                <rect x="6" y="-3" width="16" height="5" rx="1.5" fill="#475569" />
                <line x1="6" y1="8" x2="22" y2="8" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="6" y1="14" x2="20" y2="14" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="6" y1="20" x2="18" y2="20" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
                {/* Checkmark */}
                <path d="M 6,26 L 9,29 L 16,23" stroke="#10b981" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              {/* Paw holding it */}
              <ellipse cx="116" cy="100" rx="7" ry="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            </>
          )}

          {mood === 'detective' && (
            <>
              {/* Magnifying Glass */}
              <g transform="translate(18, 70) rotate(-15)">
                <circle cx="16" cy="16" r="14" stroke="#f59e0b" strokeWidth="3" fill="#e0f2fe" fillOpacity="0.4" />
                <line x1="26" y1="26" x2="42" y2="42" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
              </g>
            </>
          )}
        </svg>
      </div>
    </div>
  );
};
