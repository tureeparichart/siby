import React from 'react';
import { Student } from '../../types';

interface Desk3DIllustrationProps {
  student?: Student;
  deskNumber: number;
  isSelected?: boolean;
  hasMissingWork?: boolean;
  isMyDesk?: boolean;
  actionPose?: 'writing' | 'raise_hand' | 'cheering' | 'idle';
  size?: 'sm' | 'md' | 'lg';
}

export const Desk3DIllustration: React.FC<Desk3DIllustrationProps> = ({
  student,
  deskNumber,
  isSelected = false,
  hasMissingWork = false,
  isMyDesk = false,
  actionPose = 'writing',
  size = 'md',
}) => {
  const isGirl =
    student?.avatar === '👧' ||
    student?.avatar === '👩‍🦰' ||
    student?.nickname?.includes('หญิง') ||
    student?.nickname?.includes('แพรว') ||
    student?.nickname?.includes('พลอย') ||
    student?.nickname?.includes('ฟ้า') ||
    student?.nickname?.includes('มิ้นท์');

  const hairColors = ['#1e293b', '#312e81', '#451a03', '#1e1b4b', '#172554'];
  const charCode = (student?.name?.charCodeAt(0) || 0) + deskNumber;
  const hairColor = hairColors[charCode % hairColors.length];

  // Dimensions
  const dims = {
    sm: { w: 90, h: 70 },
    md: { w: 124, h: 88 },
    lg: { w: 150, h: 110 },
  }[size];

  // CSS Animation Style ID
  const animSuffix = `stu-${deskNumber}-${student?.id || 'empty'}`;

  return (
    <div
      className="relative flex items-center justify-center select-none overflow-visible"
      style={{ width: `${dims.w}px`, height: `${dims.h}px` }}
    >
      <style>{`
        @keyframes deskScribble_${animSuffix} {
          0%, 100% { transform: rotate(0deg) translate(0px, 0px); }
          25% { transform: rotate(-5deg) translate(-1.5px, 0.5px); }
          50% { transform: rotate(3deg) translate(1px, -0.5px); }
          75% { transform: rotate(-3deg) translate(-1px, 0.8px); }
        }
        @keyframes deskBreathe_${animSuffix} {
          0%, 100% { transform: translateY(0px) scaleY(1); }
          50% { transform: translateY(-1.2px) scaleY(1.02); }
        }
        @keyframes deskHeadBob_${animSuffix} {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          50% { transform: rotate(${hasMissingWork ? '3deg' : '-2deg'}) translateY(-0.8px); }
        }
        @keyframes deskRaiseHand_${animSuffix} {
          0%, 100% { transform: rotate(-25deg) translateY(-2px); }
          50% { transform: rotate(-35deg) translateY(-5px); }
        }
        @keyframes deskCheer_${animSuffix} {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-4px) scale(1.04); }
        }
      `}</style>

      <svg
        viewBox="0 0 160 120"
        width={dims.w}
        height={dims.h}
        className="overflow-visible drop-shadow-sm"
      >
        <defs>
          {/* Desk Wood Gradient */}
          <linearGradient id={`woodTop_${animSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5cc84" />
            <stop offset="100%" stopColor="#d99b4f" />
          </linearGradient>

          <linearGradient id={`woodSide_${animSuffix}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c58435" />
            <stop offset="100%" stopColor="#965c19" />
          </linearGradient>

          {/* Chair Wood Gradient */}
          <linearGradient id={`chairGrad_${animSuffix}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e8a860" />
            <stop offset="100%" stopColor="#b67123" />
          </linearGradient>

          {/* Contact Shadow Gradient */}
          <radialGradient id={`shadow_${animSuffix}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Ground Contact Shadow */}
        <ellipse cx="80" cy="108" rx="60" ry="10" fill={`url(#shadow_${animSuffix})`} />

        {/* 2. CHAIR (Behind desk in 3D perspective) */}
        {/* Chair Backrest */}
        <g transform="translate(80, 52)">
          <path
            d="M -22 -14 L 22 -14 Q 24 -14 24 -11 L 22 2 Q 22 4 20 4 L -20 4 Q -22 4 -22 2 L -24 -11 Q -24 -14 -22 -14 Z"
            fill={`url(#chairGrad_${animSuffix})`}
            stroke="#8c4f0f"
            strokeWidth="1.2"
          />
          {/* Chair metal bars */}
          <line x1="-12" y1="4" x2="-12" y2="24" stroke="#64748b" strokeWidth="2.5" />
          <line x1="12" y1="4" x2="12" y2="24" stroke="#64748b" strokeWidth="2.5" />
        </g>

        {/* 3. STUDENT BODY (If desk is occupied) */}
        {student ? (
          <g
            style={{
              animation:
                actionPose === 'cheering' || isMyDesk
                  ? `deskCheer_${animSuffix} 1.6s ease-in-out infinite`
                  : `deskBreathe_${animSuffix} 2.8s ease-in-out infinite`,
              transformOrigin: '80px 75px',
            }}
          >
            {/* Sitting Legs & Thai School Uniform Bottom */}
            <path
              d="M 64 74 L 96 74 L 98 88 L 62 88 Z"
              fill={isGirl ? '#1e3a8a' : '#78350f'}
              stroke="#0f172a"
              strokeWidth="1"
            />

            {/* School Uniform Torso (White shirt with blue/khaki collar) */}
            <path
              d="M 66 52 L 94 52 L 98 75 L 62 75 Z"
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth="1.2"
            />
            {/* Navy Neck Tie */}
            <polygon points="80,54 83,68 80,72 77,68" fill="#1e40af" />
            {/* Student ID badge */}
            <circle cx="88" cy="62" r="2.2" fill="#f59e0b" />

            {/* Student Head (Bobbing / Tilting Kinematics) */}
            <g
              style={{
                animation: `deskHeadBob_${animSuffix} 3.2s ease-in-out infinite`,
                transformOrigin: '80px 42px',
              }}
            >
              {/* Head Base */}
              <ellipse cx="80" cy="40" rx="14" ry="15" fill="#fed7aa" stroke="#fba76a" strokeWidth="1" />

              {/* Rosy Cheeks */}
              <circle cx="71" cy="43" r="2.8" fill="#f43f5e" fillOpacity="0.45" />
              <circle cx="89" cy="43" r="2.8" fill="#f43f5e" fillOpacity="0.45" />

              {/* Eyes */}
              {hasMissingWork ? (
                // Sleepy/puzzled eyes
                <g>
                  <path d="M 72 38 Q 75 36 78 38" stroke="#1e293b" strokeWidth="1.8" fill="none" />
                  <path d="M 82 38 Q 85 36 88 38" stroke="#1e293b" strokeWidth="1.8" fill="none" />
                </g>
              ) : (
                // Bright happy round eyes with shine
                <g>
                  <circle cx="75" cy="39" r="2.2" fill="#0f172a" />
                  <circle cx="85" cy="39" r="2.2" fill="#0f172a" />
                  <circle cx="76" cy="38" r="0.8" fill="#ffffff" />
                  <circle cx="86" cy="38" r="0.8" fill="#ffffff" />
                </g>
              )}

              {/* Smile / Mouth */}
              <path
                d={hasMissingWork ? 'M 77 46 Q 80 44 83 46' : 'M 76 45 Q 80 49 84 45'}
                stroke="#991b1b"
                strokeWidth="1.2"
                fill="none"
              />

              {/* Hair (Boy/Girl 3D Hairstyle) */}
              {isGirl ? (
                <g>
                  {/* Top Hair */}
                  <path
                    d="M 64 38 Q 63 24 80 24 Q 97 24 96 38 Q 90 32 80 33 Q 70 32 64 38 Z"
                    fill={hairColor}
                  />
                  {/* Side Hair / Ponytail */}
                  <path d="M 63 36 Q 60 48 62 52 L 66 50 Z" fill={hairColor} />
                  <path d="M 97 36 Q 100 48 98 52 L 94 50 Z" fill={hairColor} />
                  {/* Cute Red Hair Clip */}
                  <circle cx="68" cy="28" r="2.5" fill="#ef4444" />
                </g>
              ) : (
                <g>
                  {/* Short Spiky / Neat Boy Hair */}
                  <path
                    d="M 64 36 Q 63 22 80 23 Q 97 22 96 36 Q 90 28 80 30 Q 70 28 64 36 Z"
                    fill={hairColor}
                  />
                  {/* Forehead fringe strands */}
                  <path d="M 72 26 L 75 32 L 78 28 L 81 33 L 85 27" stroke={hairColor} strokeWidth="1.8" />
                </g>
              )}
            </g>

            {/* Left Arm (Resting on table holding notebook) */}
            <path
              d="M 64 56 Q 58 68 64 74 L 72 74 Q 68 68 68 58 Z"
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth="1"
            />
            {/* Left Hand */}
            <circle cx="70" cy="74" r="3.2" fill="#fed7aa" />

            {/* Right Arm (Animated Kinematics: Writing or Raising Hand!) */}
            {actionPose === 'raise_hand' || isSelected ? (
              // Raising hand high!
              <g
                style={{
                  animation: `deskRaiseHand_${animSuffix} 1.2s ease-in-out infinite`,
                  transformOrigin: '94px 54px',
                }}
              >
                <path d="M 94 54 Q 106 38 102 24 L 97 26 Q 99 38 90 56 Z" fill="#f8fafc" stroke="#cbd5e1" />
                <circle cx="102" cy="22" r="4" fill="#fed7aa" />
                {/* 2 Fingers / Wave */}
                <path d="M 100 20 L 100 15 M 103 20 L 103 14" stroke="#fed7aa" strokeWidth="1.5" />
              </g>
            ) : (
              // Active Writing scribbling with pencil!
              <g
                style={{
                  animation: `deskScribble_${animSuffix} 0.6s linear infinite`,
                  transformOrigin: '92px 60px',
                }}
              >
                <path
                  d="M 94 56 Q 102 66 94 74 L 88 74 Q 94 66 90 58 Z"
                  fill="#f8fafc"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                <circle cx="90" cy="74" r="3.2" fill="#fed7aa" />
                {/* Yellow Pencil in hand */}
                <line x1="88" y1="73" x2="82" y2="76" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                <circle cx="81.5" cy="76.2" r="1" fill="#0f172a" />
              </g>
            )}
          </g>
        ) : (
          // Empty Desk Chair View
          <g>
            <rect x="70" y="66" width="20" height="4" rx="2" fill="#94a3b8" />
            <text x="80" y="62" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">
              ว่าง
            </text>
          </g>
        )}

        {/* 4. SCHOOL DESK TABLE (Isometric 3D Box in Foreground) */}
        <g>
          {/* Desk Metal Legs */}
          {/* Back Left Leg */}
          <line x1="38" y1="88" x2="38" y2="105" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
          {/* Back Right Leg */}
          <line x1="122" y1="88" x2="122" y2="105" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
          {/* Front Left Leg */}
          <line x1="32" y1="94" x2="32" y2="108" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" />
          {/* Front Right Leg */}
          <line x1="128" y1="94" x2="128" y2="108" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" />

          {/* Under-table Metal Storage Shelf */}
          <polygon points="40,84 120,84 124,88 36,88" fill="#475569" />

          {/* Table Front Apron Panel */}
          <polygon points="34,80 126,80 126,90 34,90" fill={`url(#woodSide_${animSuffix})`} />

          {/* Table Top Surface (Isometric 3D Beveled Quad) */}
          <polygon
            points="32,74 128,74 122,64 38,64"
            fill={`url(#woodTop_${animSuffix})`}
            stroke="#b47426"
            strokeWidth="1.2"
          />

          {/* Table Top Edge Chamfer Highlight */}
          <polygon points="32,74 128,74 128,77 32,77" fill="#f8dfa5" />

          {/* 5. TABLETOP PROPS */}
          {/* Open Blue Notebook */}
          <polygon points="68,69 92,69 90,66 69,66" fill="#60a5fa" />
          <polygon points="70,69 90,69 89,67 71,67" fill="#ffffff" />

          {/* Cyan Water Tumbler */}
          <ellipse cx="112" cy="67" rx="3.5" ry="1.8" fill="#38bdf8" />
          <rect x="108.5" y="62" width="7" height="5" rx="1.5" fill="#0284c7" />

          {/* Desk Number Plate */}
          <rect x="36" y="65" width="14" height="6" rx="1.5" fill="#1e293b" />
          <text x="43" y="70" fontSize="5" fontWeight="bold" fill="#f8fafc" textAnchor="middle">
            #{deskNumber}
          </text>
        </g>

        {/* 6. GOLDEN SELECTION RING / HIGHLIGHT */}
        {isSelected && (
          <ellipse
            cx="80"
            cy="108"
            rx="64"
            ry="11"
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />
        )}
        {isMyDesk && (
          <ellipse
            cx="80"
            cy="108"
            rx="64"
            ry="11"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
          />
        )}
      </svg>
    </div>
  );
};
