import React from 'react';
import { NavTab } from './Navbar';

interface TopHeaderProps {
  activeTab: NavTab;
  onOpenMobileMenu: () => void;
  isTabletCollapsed: boolean;
  onToggleTabletCollapse: () => void;
  userRole: 'teacher' | 'student';
  onToggleRole: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  isTabletCollapsed,
  onToggleTabletCollapse,
  userRole,
  onToggleRole,
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string; icon: string }> = {
    dashboard: {
      title: 'แดชบอร์ดสรุปผล',
      subtitle: 'ภาพรวมงานค้าง อัตราส่งงาน และลีดเดอร์บอร์ด',
      icon: '📊',
    },
    assignments: {
      title: 'งานที่มอบหมาย & ตรวจงาน',
      subtitle: 'ใบงาน แบบทดสอบปรนัยอัตโนมัติ และงานกลุ่ม',
      icon: '📝',
    },
    seating: {
      title: 'ไซบี้ Smart Seating — ผังที่นั่งอัจฉริยะ',
      subtitle: 'จัดโต๊ะอิสระ แตะโต๊ะให้คะแนนพฤติกรรมระหว่างสอน',
      icon: '🪑',
    },
    randomizer: {
      title: 'ไซบี้สุ่มทีม & จับคู่',
      subtitle: 'สุ่มกลุ่ม คละความสามารถ และจับคู่บัดดี้ฝึกสนทนา',
      icon: '🎲',
    },
    zipgrade: {
      title: 'ระบบตรวจกระดาษข้อสอบปรนัย (ZipGrade OMR)',
      subtitle: 'ถ่ายภาพสแกนกระดาษคำตอบ ปรนัย ตรวจเทียบเฉลย และบันทึกคะแนนอัตโนมัติ',
      icon: '📷',
    },
    gradebook: {
      title: 'สมุดบันทึกคะแนน (Gradebook)',
      subtitle: 'สรุปคะแนนวิชาการ แยกจาก EXP พร้อมส่งออก CSV/Excel',
      icon: '📋',
    },
    gamification: {
      title: 'ระบบ EXP & ตรารางวัลไซบี้',
      subtitle: 'แรงจูงใจสะสมแต้ม เลเวล และตรารางวัลประจำห้อง',
      icon: '🏆',
    },
    sheets: {
      title: 'Google Sheets & Google Apps Script',
      subtitle: 'การเชื่อมโยงฐานข้อมูลจริงและสำรองข้อมูล Google Drive',
      icon: '⚙️',
    },
  };

  const current = titles[activeTab] || titles.dashboard;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-3 sm:px-6 shadow-xs select-none">
      {/* Left: Hamburger (Mobile) + Tablet Toggle + Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors md:hidden shrink-0"
          title="เปิดเมนูนำทาง"
          aria-label="Open navigation menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Tablet Toggle Button */}
        <button
          type="button"
          onClick={onToggleTabletCollapse}
          className="hidden md:flex lg:hidden p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
          title={isTabletCollapsed ? 'ขยาย Sidebar' : 'ย่อ Sidebar'}
        >
          <span className="text-sm">{isTabletCollapsed ? '▶' : '◀'}</span>
        </button>

        {/* Breadcrumb & Module Title */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base shrink-0">{current.icon}</span>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
              {current.title}
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 hidden xl:block truncate max-w-sm">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Right side: Only the mode button */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleRole}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap shadow-2xs flex items-center gap-1.5 ${
            userRole === 'teacher'
              ? 'border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100'
              : 'border-emerald-300 bg-emerald-50 text-emerald-800'
          }`}
          title="สลับโหมดมุมมอง"
        >
          <span>{userRole === 'teacher' ? '👩‍🏫' : '🎒'}</span>
          <span>{userRole === 'teacher' ? 'โหมดคุณครู' : 'โหมดนักเรียน'}</span>
        </button>
      </div>
    </header>
  );
};
