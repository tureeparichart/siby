import React from 'react';
import { MascotSiby } from './MascotSiby';
import { NavTab } from './Navbar';
import { ClassRoom } from '../types';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  pendingCount: number;
  userRole: 'teacher' | 'student';
  onToggleRole: () => void;
  onOpenQuickRemind: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isTabletCollapsed: boolean;
  onToggleTabletCollapse: () => void;
  onOpenAIChat: () => void;
  classes?: ClassRoom[];
  activeClassId?: string;
  onSelectClass?: (classId: string) => void;
  onOpenClassManager?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingCount,
  userRole,
  onToggleRole,
  onOpenQuickRemind,
  isMobileOpen,
  onCloseMobile,
  isTabletCollapsed,
  onToggleTabletCollapse,
  onOpenAIChat,
  classes = [],
  activeClassId,
  onSelectClass,
  onOpenClassManager,
  onLogout,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'แดชบอร์ด',
      icon: '📊',
      desc: 'สรุปภาพรวมห้องเรียน',
    },
    {
      id: 'assignments' as NavTab,
      label: 'งานที่มอบหมาย',
      icon: '📝',
      desc: 'สั่งงาน ตรวจข้อสอบ',
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'seating' as NavTab,
      label: 'ผังที่นั่งอัจฉริยะ',
      icon: '🪑',
      desc: 'จัดโต๊ะ ให้คะแนนสด',
    },
    {
      id: 'randomizer' as NavTab,
      label: 'สุ่มทีม & จับคู่',
      icon: '🎲',
      desc: 'คละกลุ่ม บัดดี้ฝึกสนทนา',
    },
    {
      id: 'zipgrade' as NavTab,
      label: 'สแกนตรวจ ZipGrade',
      icon: '📷',
      desc: 'ตรวจกระดาษคำตอบ ปรนัย',
    },
    {
      id: 'gradebook' as NavTab,
      label: 'สมุดคะแนน',
      icon: '📋',
      desc: 'รายงานผล ส่งออก CSV',
    },
    {
      id: 'gamification' as NavTab,
      label: 'EXP & ตรารางวัล',
      icon: '🏆',
      desc: 'ลีดเดอร์บอร์ดไซบี้',
    },
    {
      id: 'sheets' as NavTab,
      label: 'Google Sheets',
      icon: '⚙️',
      desc: 'Apps Script & สำรอง',
    },
  ];

  const currentClass = classes.find((c) => c.id === activeClassId) || classes[0];

  const handleSelectTab = (tab: NavTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:static flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out shrink-0 select-none shadow-sm md:shadow-none ${
          // Mobile Drawer state:
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'
        } ${
          // Tablet / Desktop responsive width:
          isTabletCollapsed ? 'md:w-20' : 'md:w-64 lg:w-72'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between h-16 shrink-0">
          <div
            onClick={() => handleSelectTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center border border-sky-100 group-hover:bg-sky-100 transition-colors shrink-0">
              <MascotSiby mood="happy" size="sm" />
            </div>

            {/* Title (Hidden in Tablet Collapsed Mode) */}
            <div className={`transition-opacity duration-200 ${isTabletCollapsed ? 'md:hidden' : 'block'}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors whitespace-nowrap">
                  ไซบี้ทวงงาน
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 border border-sky-200/60 rounded px-1.5 py-0.2">
                  Edu
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {currentClass ? `ห้อง ${currentClass.name} (${currentClass.totalStudents} คน)` : 'ระบบจัดการชั้นเรียน'}
              </p>
            </div>
          </div>

          {/* Close button on Mobile Drawer */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1 text-slate-400 hover:text-slate-600 md:hidden rounded-lg hover:bg-slate-100"
            title="ปิดเมนู"
          >
            ✕
          </button>
        </div>

        {/* Classroom Switcher Bar (Hidden in Tablet Collapsed Mode) */}
        {!isTabletCollapsed && classes.length > 0 && onSelectClass && onOpenClassManager && (
          <div className="px-3 pt-3 pb-1 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-semibold text-slate-600 flex items-center gap-1">
                <span>🏫</span> ห้องเรียนปัจจุบัน:
              </span>
              <button
                type="button"
                onClick={onOpenClassManager}
                className="text-[10px] font-bold text-sky-600 hover:text-sky-800 transition-colors"
              >
                + จัดการห้อง
              </button>
            </div>
            <select
              value={activeClassId}
              onChange={(e) => onSelectClass(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg py-1.5 px-2 font-medium text-slate-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.totalStudents} คน)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation Modules List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
          <div className={`px-2 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider ${isTabletCollapsed ? 'md:hidden' : 'block'}`}>
            เมนูระบบห้องเรียน
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                title={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all relative group ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                } ${isTabletCollapsed ? 'md:justify-center md:px-0' : ''}`}
              >
                <span className="text-lg shrink-0 group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>

                {/* Text Label (Hidden if tablet collapsed) */}
                <div className={`flex-1 truncate ${isTabletCollapsed ? 'md:hidden' : 'block'}`}>
                  <div className="text-xs truncate">{item.label}</div>
                  <div
                    className={`text-[10px] truncate ${
                      isActive ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {item.desc}
                  </div>
                </div>

                {/* Pending Badge */}
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                      isActive
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-amber-500 text-white'
                    } ${isTabletCollapsed ? 'md:absolute md:top-1.5 md:right-1.5' : ''}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions & Role Switcher */}
        <div className="p-3 border-t border-slate-100 space-y-2 shrink-0 bg-slate-50/50">
          {/* Quick AI Assistant Button */}
          <button
            type="button"
            onClick={onOpenAIChat}
            className={`w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-700 hover:from-sky-700 hover:to-indigo-800 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors ${
              isTabletCollapsed ? 'md:px-0' : ''
            }`}
            title="ถามไซบี้ AI"
          >
            <span>🐺</span>
            <span className={isTabletCollapsed ? 'md:hidden' : 'inline'}>ไซบี้ AI Assistant</span>
          </button>

          {/* Quick Reminder button */}
          <button
            type="button"
            onClick={onOpenQuickRemind}
            className={`w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors ${
              isTabletCollapsed ? 'md:px-0' : ''
            }`}
            title="คัดลอกข้อความทวงงานด่วน"
          >
            <span>🔔</span>
            <span className={isTabletCollapsed ? 'md:hidden' : 'inline'}>ทวงงานด่วน</span>
          </button>

          {/* Switch Role Button */}
          <button
            type="button"
            onClick={onToggleRole}
            className={`w-full py-2 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
              isTabletCollapsed ? 'md:px-0' : ''
            }`}
            title="สลับโหมดมุมมอง"
          >
            <span>{userRole === 'teacher' ? '👩‍🏫' : '🎒'}</span>
            <span className={isTabletCollapsed ? 'md:hidden' : 'inline'}>
              {userRole === 'teacher' ? 'โหมดคุณครู' : 'มุมมองนักเรียน'}
            </span>
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className={`w-full py-2 px-3 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                isTabletCollapsed ? 'md:px-0' : ''
              }`}
              title="ออกจากระบบ"
            >
              <span>🚪</span>
              <span className={isTabletCollapsed ? 'md:hidden' : 'inline'}>ออกจากระบบ</span>
            </button>
          )}

          {/* Tablet Collapse Toggle (Visible on md screens) */}
          <div className="hidden md:flex justify-center pt-1">
            <button
              type="button"
              onClick={onToggleTabletCollapse}
              className="text-[11px] text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200/60 transition-colors w-full text-center"
              title={isTabletCollapsed ? 'ขยาย Sidebar' : 'ย่อ Sidebar'}
            >
              {isTabletCollapsed ? '➔' : '◀ ย่อแถบข้าง'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
