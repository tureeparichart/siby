import React from 'react';
import { MascotSiby } from './MascotSiby';

export type NavTab =
  | 'dashboard'
  | 'assignments'
  | 'seating'
  | 'randomizer'
  | 'zipgrade'
  | 'gradebook'
  | 'gamification'
  | 'sheets';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userRole: 'teacher' | 'student';
  onToggleRole: () => void;
  pendingCount: number;
  onOpenQuickRemind: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  userRole,
  onToggleRole,
  pendingCount,
  onOpenQuickRemind,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 h-16">
        {/* Zone 1: Brand Wordmark */}
        <div
          onClick={() => onTabChange('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center border border-sky-100 group-hover:bg-sky-100 transition-colors">
            <MascotSiby mood="happy" size="sm" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
                ไซบี้ทวงงาน
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-600 bg-sky-50 border border-sky-200/60 rounded px-1.5 py-0.2">
                Siby Edu
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Clean single-line nav links */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            แดชบอร์ด
          </button>

          <button
            onClick={() => onTabChange('assignments')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors relative ${
              activeTab === 'assignments'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            งานที่มอบหมาย
            {pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-mono font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('seating')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'seating'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            ผังที่นั่งอัจฉริยะ
          </button>

          <button
            onClick={() => onTabChange('randomizer')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'randomizer'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            สุ่มทีม & จับคู่
          </button>

          <button
            onClick={() => onTabChange('gradebook')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'gradebook'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            สมุดคะแนน
          </button>

          <button
            onClick={() => onTabChange('gamification')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'gamification'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            EXP & ตรารางวัล
          </button>

          <button
            onClick={() => onTabChange('sheets')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'sheets'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Google Sheets & สำรอง
          </button>
        </nav>

        {/* Zone 3: Quick Action & Role Switch */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onToggleRole}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap shrink-0 ${
              userRole === 'teacher'
                ? 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                : 'border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold'
            }`}
            title="สลับโหมดเพื่อดูหน้าจอมุมมองนักเรียน"
          >
            {userRole === 'teacher' ? 'โหมด: คุณครู 👩‍🏫' : 'มุมมอง: นักเรียน 🎒'}
          </button>

          <button
            onClick={onOpenQuickRemind}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>ทวงงานด่วน</span>
          </button>
        </div>
      </div>

      {/* Mobile nav subbar */}
      <div className="lg:hidden border-t border-slate-100 px-4 py-2 flex items-center gap-1 overflow-x-auto scrollbar-none bg-slate-50">
        {[
          { id: 'dashboard', label: 'แดชบอร์ด' },
          { id: 'assignments', label: 'งานที่มอบหมาย' },
          { id: 'seating', label: 'ผังที่นั่ง' },
          { id: 'randomizer', label: 'สุ่มทีม' },
          { id: 'gradebook', label: 'สมุดคะแนน' },
          { id: 'gamification', label: 'EXP & รางวัล' },
          { id: 'sheets', label: 'Sheets' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id as NavTab)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === item.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
