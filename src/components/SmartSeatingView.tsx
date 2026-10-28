import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { AttendanceRecord, AttendanceStatus, ClassroomLayout, Desk, ScoreTransaction, Student, Submission } from '../types';
import { Classroom3DView } from './seating3d/Classroom3DView';
import { Desk3DIllustration } from './seating3d/Desk3DIllustration';

interface SmartSeatingViewProps {
  layout: ClassroomLayout;
  onUpdateLayout: (updated: ClassroomLayout) => void;
  students: Student[];
  submissions: Submission[];
  scoreTransactions: ScoreTransaction[];
  onAddScoreTransaction: (tx: Omit<ScoreTransaction, 'id' | 'timestamp'>) => void;
  onAddBatchScoreTransactions?: (
    studentIds: string[],
    amount: number,
    category: 'academic' | 'exp' | 'behavior' | 'participation',
    reason: string
  ) => void;
  onSelectStudentProfile: (studentId: string) => void;
  attendanceRecords?: AttendanceRecord[];
  onToggleStudentAttendance?: (studentId: string) => void;
  onMarkAllPresent?: () => void;
}

export const SmartSeatingView: React.FC<SmartSeatingViewProps> = ({
  layout,
  onUpdateLayout,
  students,
  submissions,
  scoreTransactions,
  onAddScoreTransaction,
  onAddBatchScoreTransactions,
  onSelectStudentProfile,
  attendanceRecords = [],
  onToggleStudentAttendance,
  onMarkAllPresent,
}) => {
  // View Dimension: '3d' (interactive animated 3D classroom) or '2d' (flat layout)
  const [viewDimension, setViewDimension] = useState<'3d' | '2d'>('3d');

  // Mode: 'view' (for teaching & scoring) or 'edit' (for moving desks) or 'attendance' (for roll call)
  const [mode, setMode] = useState<'view' | 'edit' | 'attendance'>('view');
  const [selectedDeskId, setSelectedDeskId] = useState<string | null>(null);

  // Multi-Student Selection State
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Batch Scoring Modal state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [batchScoreType, setBatchScoreType] = useState<'behavior' | 'participation' | 'exp' | 'academic'>('participation');
  const [batchScoreAmount, setBatchScoreAmount] = useState<number>(2);
  const [batchScoreReason, setBatchScoreReason] = useState<string>('ร่วมตอบคำถามและมีส่วนร่วมในชั้นเรียน');

  // Single Quick Scoring Modal state
  const [scoringDesk, setScoringDesk] = useState<Desk | null>(null);
  const [scoreType, setScoreType] = useState<'behavior' | 'participation' | 'exp'>('participation');
  const [scoreAmount, setScoreAmount] = useState<number>(1);
  const [scoreReason, setScoreReason] = useState<string>('ยกมือตอบคำถามถูกต้อง');

  // Success Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dragging state inside visual canvas
  const [draggingDeskId, setDraggingDeskId] = useState<string | null>(null);

  // Student binding selector modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [assigningDesk, setAssigningDesk] = useState<Desk | null>(null);
  const [selectedStudentForDesk, setSelectedStudentForDesk] = useState<string>('');

  // Seated students collection
  const seatedStudentIds = new Set(
    layout.desks.map((d) => d.studentId).filter((id): id is string => !!id)
  );

  const seatedStudents = students.filter((s) => seatedStudentIds.has(s.id));

  // Attendance helper for today
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const getStudentAttendance = (studentId: string): AttendanceStatus => {
    const record = attendanceRecords.find(
      (r) => r.studentId === studentId && (r.date === todayDateStr || !r.date)
    );
    return record?.status || 'present';
  };

  const presentCount = seatedStudents.filter((s) => getStudentAttendance(s.id) === 'present').length;
  const lateCount = seatedStudents.filter((s) => getStudentAttendance(s.id) === 'late').length;
  const leaveCount = seatedStudents.filter((s) => getStudentAttendance(s.id) === 'leave').length;
  const absentCount = seatedStudents.filter((s) => getStudentAttendance(s.id) === 'absent').length;

  // Toggle single student selection in multi-select mode
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  // Helper selectors
  const handleSelectAllSeated = () => {
    setSelectedStudentIds(new Set(seatedStudents.map((s) => s.id)));
  };

  const handleSelectCompletedOnly = () => {
    const ids = seatedStudents
      .filter((s) => !submissions.some((sub) => sub.studentId === s.id && sub.status === 'missing'))
      .map((s) => s.id);
    setSelectedStudentIds(new Set(ids));
  };

  const handleSelectMissingOnly = () => {
    const ids = seatedStudents
      .filter((s) => submissions.some((sub) => sub.studentId === s.id && sub.status === 'missing'))
      .map((s) => s.id);
    setSelectedStudentIds(new Set(ids));
  };

  const handleSelectFrontRow = () => {
    // Desks in top half of canvas (y <= 55%)
    const frontDeskStudentIds = layout.desks
      .filter((d) => d.y <= 55 && d.studentId)
      .map((d) => d.studentId as string);
    setSelectedStudentIds(new Set(frontDeskStudentIds));
  };

  const handleSelectBackRow = () => {
    // Desks in bottom half of canvas (y > 55%)
    const backDeskStudentIds = layout.desks
      .filter((d) => d.y > 55 && d.studentId)
      .map((d) => d.studentId as string);
    setSelectedStudentIds(new Set(backDeskStudentIds));
  };

  const handleClearSelection = () => {
    setSelectedStudentIds(new Set());
  };

  // Show Toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Execute Batch Score Awarding
  const handleExecuteBatchAward = (amount: number, type: 'behavior' | 'participation' | 'exp' | 'academic', reason: string) => {
    const ids = Array.from(selectedStudentIds);
    if (ids.length === 0) return;

    if (onAddBatchScoreTransactions) {
      onAddBatchScoreTransactions(ids, amount, type, reason);
    } else {
      ids.forEach((studentId) => {
        onAddScoreTransaction({
          studentId,
          amount,
          category: type === 'academic' ? 'exp' : type,
          reason,
          awardedBy: 'คุณครูปาริชาติ (ผังที่นั่งอัจฉริยะ - ให้คะแนนหลายคน)',
        });
      });
    }

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });

    triggerToast(`🎉 บันทึกคะแนน (${amount > 0 ? `+${amount}` : amount} คะแนน) ให้นักเรียน ${ids.length} คน เรียบร้อยแล้ว!`);
    setIsBatchModalOpen(false);
    setSelectedStudentIds(new Set());
  };

  // Handle Desk Drag
  const handleDeskDrag = (deskId: string, e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'edit') return;
    const canvas = e.currentTarget.parentElement;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const xPercent = Math.max(5, Math.min(95, ((moveEvent.clientX - rect.left) / rect.width) * 100));
      const yPercent = Math.max(18, Math.min(92, ((moveEvent.clientY - rect.top) / rect.height) * 100));

      onUpdateLayout({
        ...layout,
        desks: layout.desks.map((d) =>
          d.id === deskId ? { ...d, x: Math.round(xPercent), y: Math.round(yPercent) } : d
        ),
      });
    };

    const handleMouseUp = () => {
      setDraggingDeskId(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    setDraggingDeskId(deskId);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Quick Preset Layout Generators
  const applyPresetLayout = (preset: 'grid4x4' | 'uShape' | 'groupsOf4') => {
    const newDesks: Desk[] = [];
    const currentAssignments = layout.desks.map((d) => d.studentId);

    if (preset === 'grid4x4') {
      let idx = 0;
      const xCols = [20, 40, 60, 80];
      const yRows = [28, 46, 64, 82];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          newDesks.push({
            id: `DSK-${idx + 1}`,
            deskNumber: idx + 1,
            x: xCols[c],
            y: yRows[r],
            rotation: 0,
            studentId: currentAssignments[idx] || null,
          });
          idx++;
        }
      }
    } else if (preset === 'groupsOf4') {
      const clusters = [
        { cx: 30, cy: 38 },
        { cx: 70, cy: 38 },
        { cx: 30, cy: 74 },
        { cx: 70, cy: 74 },
      ];
      let idx = 0;
      clusters.forEach((cl) => {
        newDesks.push({ id: `DSK-${idx + 1}`, deskNumber: idx + 1, x: cl.cx - 8, y: cl.cy - 7, rotation: 0, studentId: currentAssignments[idx] || null });
        idx++;
        newDesks.push({ id: `DSK-${idx + 1}`, deskNumber: idx + 1, x: cl.cx + 8, y: cl.cy - 7, rotation: 0, studentId: currentAssignments[idx] || null });
        idx++;
        newDesks.push({ id: `DSK-${idx + 1}`, deskNumber: idx + 1, x: cl.cx - 8, y: cl.cy + 7, rotation: 180, studentId: currentAssignments[idx] || null });
        idx++;
        newDesks.push({ id: `DSK-${idx + 1}`, deskNumber: idx + 1, x: cl.cx + 8, y: cl.cy + 7, rotation: 180, studentId: currentAssignments[idx] || null });
        idx++;
      });
    } else if (preset === 'uShape') {
      let idx = 0;
      // Left wing (4 desks)
      [30, 45, 60, 75].forEach((y) => {
        newDesks.push({ id: `DSK-${idx + 1}`, deskNumber: idx + 1, x: 18, y, rotation: 90, studentId: currentAssignments[idx] || null });
        idx++;
      });
      // Bottom wing (8 desks)
      [28, 36, 44, 52, 60, 68, 76, 84].forEach((x) => {
        newDesks.push({ id: `DSK-${idx + 1}`, deskNumber: idx + 1, x, y: 84, rotation: 0, studentId: currentAssignments[idx] || null });
        idx++;
      });
      // Right wing (4 desks)
      [75, 60, 45, 30].forEach((y) => {
        newDesks.push({ id: `DSK-${idx + 1}`, deskNumber: idx + 1, x: 88, y, rotation: 270, studentId: currentAssignments[idx] || null });
        idx++;
      });
    }

    onUpdateLayout({
      ...layout,
      desks: newDesks,
    });
  };

  // Add Desk
  const handleAddDesk = () => {
    const nextNumber = layout.desks.length + 1;
    const newDesk: Desk = {
      id: `DSK-${Date.now()}`,
      deskNumber: nextNumber,
      x: 50,
      y: 50,
      rotation: 0,
      studentId: null,
    };
    onUpdateLayout({
      ...layout,
      desks: [...layout.desks, newDesk],
    });
  };

  // Remove Desk
  const handleRemoveDesk = (deskId: string) => {
    onUpdateLayout({
      ...layout,
      desks: layout.desks.filter((d) => d.id !== deskId),
    });
    if (selectedDeskId === deskId) setSelectedDeskId(null);
  };

  // Rotate Desk
  const handleRotateDesk = (deskId: string) => {
    onUpdateLayout({
      ...layout,
      desks: layout.desks.map((d) =>
        d.id === deskId ? { ...d, rotation: ((d.rotation + 90) % 360) } : d
      ),
    });
  };

  // Assign Student to Desk
  const handleAssignStudent = () => {
    if (!assigningDesk) return;
    onUpdateLayout({
      ...layout,
      desks: layout.desks.map((d) => {
        if (d.id === assigningDesk.id) {
          return { ...d, studentId: selectedStudentForDesk || null };
        }
        if (selectedStudentForDesk && d.studentId === selectedStudentForDesk) {
          return { ...d, studentId: null };
        }
        return d;
      }),
    });
    setIsAssignModalOpen(false);
    setAssigningDesk(null);
  };

  // Live in-class Score Awarding (Single)
  const handleAwardSingleScore = () => {
    if (!scoringDesk || !scoringDesk.studentId) return;

    onAddScoreTransaction({
      studentId: scoringDesk.studentId,
      amount: scoreAmount,
      category: scoreType,
      reason: scoreReason,
      awardedBy: 'ครูปาริชาติ (ผังที่นั่งอัจฉริยะ)',
    });

    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.6 },
    });

    const stu = students.find((s) => s.id === scoringDesk.studentId);
    triggerToast(`✓ มอบคะแนนให้ ${stu?.nickname || 'นักเรียน'} สำเร็จ!`);
    setScoringDesk(null);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold animate-fade-in">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Controls Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-lg">
            🪑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                ไซบี้ Smart Seating — ผังที่นั่งอัจฉริยะ
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                {layout.name}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {mode === 'view'
                ? isMultiSelectMode
                  ? '✨ โหมดเลือกหลายคน: แตะโต๊ะนักเรียนที่ต้องการเพื่อให้คะแนนพร้อมกัน'
                  : 'โหมดสอนสด: แตะโต๊ะนักเรียนเพื่อบวกคะแนนพฤติกรรม หรือเปิดโหมดเลือกหลายคนเพื่อบวกคะแนนกลุ่ม'
                : 'โหมดจัดห้อง: ลากโต๊ะไปวางตามใจชอบ หมุน หรือเพิ่ม-ลบโต๊ะ'}
            </p>
          </div>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 3D / 2D Dimension Switcher */}
          <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex items-center shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setViewDimension('3d');
                if (mode === 'edit') setMode('view');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                viewDimension === '3d'
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🌟 ผัง 3D ขยับได้</span>
              <span className="text-[9px] bg-white/25 px-1 py-0.2 rounded font-mono">3D</span>
            </button>
            <button
              type="button"
              onClick={() => setViewDimension('2d')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                viewDimension === '2d'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📋 ผัง 2D</span>
            </button>
          </div>

          {mode !== 'edit' ? (
            <>
              {/* Multi-Select Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  setIsMultiSelectMode((prev) => !prev);
                  if (isMultiSelectMode) {
                    setSelectedStudentIds(new Set());
                  }
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 shadow-2xs ${
                  isMultiSelectMode
                    ? 'bg-sky-600 text-white border-sky-600 ring-2 ring-sky-300'
                    : 'bg-white text-sky-700 border-sky-300 hover:bg-sky-50'
                }`}
                title="คลิกเพื่อเปิด/ปิดการเลือกนักเรียนทีละหลายคนเพื่อบวกคะแนน"
              >
                <span>{isMultiSelectMode ? '✓ โหมดเลือกหลายคน (เปิดอยู่)' : '✨ ให้คะแนนทีละหลายคน'}</span>
                {selectedStudentIds.size > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white text-sky-800 text-[10px] font-bold">
                    {selectedStudentIds.size}
                  </span>
                )}
              </button>

              {/* Attendance Mode Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'attendance' ? 'view' : 'attendance');
                  setIsMultiSelectMode(false);
                  setSelectedStudentIds(new Set());
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 shadow-2xs ${
                  mode === 'attendance'
                    ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300'
                    : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                }`}
                title="คลิกเพื่อเปิดโหมดเช็คชื่อเข้าชั้นเรียน"
              >
                <span>⏱️ {mode === 'attendance' ? 'กำลังเช็คชื่อ (เปิดอยู่)' : 'เช็คชื่อเข้าเรียน'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('edit');
                  setViewDimension('2d');
                  setIsMultiSelectMode(false);
                  setSelectedStudentIds(new Set());
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span>✏️ ปรับแต่งผังโต๊ะ</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleAddDesk}
                className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 transition-colors"
              >
                + เพิ่มโต๊ะเรียน
              </button>

              <div className="relative inline-block text-left group">
                <button className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1">
                  รูปแบบผังสำเร็จรูป ▾
                </button>
                <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 hidden group-hover:block z-30">
                  <button
                    onClick={() => applyPresetLayout('grid4x4')}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-700"
                  >
                    ผังมาตรฐาน 4 แถว (4x4)
                  </button>
                  <button
                    onClick={() => applyPresetLayout('groupsOf4')}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-700"
                  >
                    ผังกลุ่มโต๊ะ 4 เกาะ
                  </button>
                  <button
                    onClick={() => applyPresetLayout('uShape')}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-700"
                  >
                    ผังเกือกม้า (รูปตัว U)
                  </button>
                </div>
              </div>

              <button
                onClick={() => setMode('view')}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
              >
                เสร็จสิ้น / เริ่มสอน
              </button>
            </>
          )}
        </div>
      </div>

      {/* Multi-Select Quick Filters Bar (Visible when multi-select mode is ON) */}
      {mode === 'view' && isMultiSelectMode && (
        <div className="bg-sky-50/90 border border-sky-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-sky-900 flex items-center gap-1">
              <span>🎯</span> เลือกด่วน:
            </span>
            <button
              type="button"
              onClick={handleSelectAllSeated}
              className="px-2.5 py-1 rounded-lg bg-white border border-sky-300 text-sky-800 hover:bg-sky-100 font-medium transition-colors"
            >
              ทั้งห้อง ({seatedStudents.length} คน)
            </button>
            <button
              type="button"
              onClick={handleSelectCompletedOnly}
              className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-medium transition-colors"
            >
              ⭐ ส่งงานครบ
            </button>
            <button
              type="button"
              onClick={handleSelectMissingOnly}
              className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 font-medium transition-colors"
            >
              ⚠️ มีงานค้าง
            </button>
            <button
              type="button"
              onClick={handleSelectFrontRow}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              🪑 แถวหน้า
            </button>
            <button
              type="button"
              onClick={handleSelectBackRow}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              🪑 แถวหลัง
            </button>
            {selectedStudentIds.size > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-2 py-1 text-slate-500 hover:text-slate-700 underline text-xs"
              >
                ล้างที่เลือก ({selectedStudentIds.size})
              </button>
            )}
          </div>

          <div className="text-xs text-sky-900 font-semibold">
            {selectedStudentIds.size === 0 ? (
              <span>แตะที่โต๊ะในผังเพื่อเลือกนักเรียน</span>
            ) : (
              <span className="bg-sky-200/80 px-2.5 py-0.5 rounded-full">
                เลือกแล้ว {selectedStudentIds.size} คน
              </span>
            )}
          </div>
        </div>
      )}

      {/* Attendance Mode Banner */}
      {mode === 'attendance' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-emerald-100 rounded-lg text-emerald-800 text-sm">⏱️</span>
            <div>
              <div className="font-bold text-emerald-950">
                โหมดเช็คชื่อเข้าชั้นเรียน (แตะที่โต๊ะเพื่อเปลี่ยนสถานะ: มา ➔ สาย ➔ ลา ➔ ขาด)
              </div>
              <div className="text-[11px] text-emerald-800 flex items-center gap-3 mt-0.5">
                <span>มา: <strong className="text-emerald-700 font-mono font-bold">{presentCount}</strong></span>
                <span>สาย: <strong className="text-amber-700 font-mono font-bold">{lateCount}</strong></span>
                <span>ลา: <strong className="text-sky-700 font-mono font-bold">{leaveCount}</strong></span>
                <span>ขาด: <strong className="text-rose-700 font-mono font-bold">{absentCount}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onMarkAllPresent && (
              <button
                type="button"
                onClick={() => {
                  onMarkAllPresent();
                  confetti({ particleCount: 30, spread: 40 });
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1"
              >
                <span>✓ เช็คมาทุกคน</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setMode('view')}
              className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold rounded-lg transition-colors"
            >
              เสร็จสิ้น ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Classroom Canvas (3D vs 2D) */}
      {viewDimension === '3d' && mode !== 'edit' ? (
        <Classroom3DView
          layout={layout}
          students={students}
          submissions={submissions}
          attendanceRecords={attendanceRecords}
          selectedStudentIds={selectedStudentIds}
          selectedDeskId={selectedDeskId}
          onSelectDesk={(deskId, studentId) => {
            setSelectedDeskId(deskId);
            if (studentId && isMultiSelectMode) {
              toggleStudentSelection(studentId);
            }
          }}
          onDeskClick={(desk, student) => {
            setSelectedDeskId(desk.id);
            if (mode === 'attendance' && student && onToggleStudentAttendance) {
              onToggleStudentAttendance(student.id);
              return;
            }
            if (mode === 'view' && student) {
              if (isMultiSelectMode) {
                toggleStudentSelection(student.id);
              } else {
                setScoringDesk(desk);
              }
            } else if (!student) {
              setAssigningDesk(desk);
              setSelectedStudentForDesk('');
              setIsAssignModalOpen(true);
            }
          }}
          mode={mode}
          isMultiSelectMode={isMultiSelectMode}
        />
      ) : (
        <div className="relative bg-slate-100/80 rounded-2xl border-2 border-dashed border-slate-300 min-h-[620px] p-4 overflow-hidden select-none shadow-inner">
          {/* Whiteboard / Chalkboard */}
          <div
            className="absolute transform -translate-x-1/2 bg-slate-800 text-slate-200 text-xs font-bold py-1.5 px-6 rounded-md shadow-md flex items-center justify-center gap-2 border border-slate-600"
            style={{
              left: `${layout.boardPosition.x}%`,
              top: `${layout.boardPosition.y}%`,
              width: `${layout.boardPosition.width}%`,
            }}
          >
            <span>⬛ {layout.boardPosition.label} (ทิศหน้าห้องเรียน)</span>
          </div>

          {/* Teacher's Desk */}
          <div
            className="absolute transform -translate-x-1/2 bg-amber-100 border-2 border-amber-400 text-amber-900 rounded-lg p-2 text-center shadow-xs flex flex-col items-center justify-center"
            style={{
              left: `${layout.teacherDesk.x}%`,
              top: `${layout.teacherDesk.y}%`,
              width: '120px',
              height: '52px',
            }}
          >
            <span className="text-xs font-bold">{layout.teacherDesk.label}</span>
            <span className="text-[10px] text-amber-700">โต๊ะครูผู้สอน 👩‍🏫</span>
          </div>

          {/* Classroom Door */}
          <div
            className="absolute transform -translate-x-1/2 bg-slate-200 border border-slate-400 text-slate-700 text-[10px] font-bold px-3 py-1 rounded"
            style={{
              left: `${layout.doorPosition.x}%`,
              top: `${layout.doorPosition.y}%`,
            }}
          >
            🚪 {layout.doorPosition.label}
          </div>

          {/* Classroom Window */}
          <div
            className="absolute transform -translate-y-1/2 bg-sky-100 border border-sky-300 text-sky-800 text-[10px] font-semibold px-2 py-4 rounded writing-mode-vertical"
            style={{
              right: '8px',
              top: `${layout.windowPosition.y}%`,
            }}
          >
            🪟 ระเบียง/หน้าต่าง
          </div>

          {/* Render Student Desks with 3D Animated Illustration */}
          {layout.desks.map((desk) => {
            const student = students.find((s) => s.id === desk.studentId);
            const hasMissingWork = student
              ? submissions.some((sub) => sub.studentId === student.id && sub.status === 'missing')
              : false;
            const isSelectedInMulti = student ? selectedStudentIds.has(student.id) : false;
            const isSelected = selectedDeskId === desk.id;

            return (
              <div
                key={desk.id}
                onMouseDown={(e) => handleDeskDrag(desk.id, e)}
                onClick={() => {
                  setSelectedDeskId(desk.id);
                  if (mode === 'attendance' && student && onToggleStudentAttendance) {
                    onToggleStudentAttendance(student.id);
                    return;
                  }
                  if (mode === 'view' && student) {
                    if (isMultiSelectMode) {
                      toggleStudentSelection(student.id);
                    } else {
                      setScoringDesk(desk);
                    }
                  }
                }}
                style={{
                  left: `${desk.x}%`,
                  top: `${desk.y}%`,
                  transform: `translate(-50%, -50%) rotate(${desk.rotation}deg)`,
                }}
                className={`absolute transition-all ${
                  mode === 'edit'
                    ? 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-sky-400'
                    : 'cursor-pointer hover:scale-105'
                } ${
                  isSelectedInMulti
                    ? 'ring-4 ring-sky-500 scale-105 z-20 shadow-lg'
                    : isSelected
                    ? 'ring-2 ring-sky-600 shadow-md'
                    : 'shadow-xs'
                }`}
              >
                <div
                  className={`w-32 sm:w-36 min-h-[114px] rounded-2xl border flex flex-col justify-between p-1.5 transition-colors relative shadow-2xs ${
                    isSelectedInMulti
                      ? 'bg-sky-50 border-sky-400 font-semibold'
                      : student
                      ? hasMissingWork
                        ? 'bg-amber-50/95 border-amber-300'
                        : 'bg-white border-slate-200'
                      : 'bg-slate-50/70 border-dashed border-slate-300'
                  }`}
                >
                  {/* Attendance Mode Status Badge */}
                  {mode === 'attendance' && student && (
                    <div className="absolute -top-2.5 -right-2 z-30">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs border ${
                          getStudentAttendance(student.id) === 'present'
                            ? 'bg-emerald-500 text-white border-emerald-600'
                            : getStudentAttendance(student.id) === 'late'
                            ? 'bg-amber-500 text-slate-950 border-amber-600'
                            : getStudentAttendance(student.id) === 'leave'
                            ? 'bg-sky-500 text-white border-sky-600'
                            : 'bg-rose-600 text-white border-rose-700'
                        }`}
                      >
                        {getStudentAttendance(student.id) === 'present' && 'มา ✓'}
                        {getStudentAttendance(student.id) === 'late' && 'สาย ⏳'}
                        {getStudentAttendance(student.id) === 'leave' && 'ลา ✉️'}
                        {getStudentAttendance(student.id) === 'absent' && 'ขาด ✕'}
                      </span>
                    </div>
                  )}

                  {/* Multi-Select Checkmark Badge */}
                  {student && isMultiSelectMode && (
                    <div className="absolute -top-2 -right-2 z-30">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 shadow-xs transition-transform ${
                          isSelectedInMulti
                            ? 'bg-sky-600 border-white text-white scale-110'
                            : 'bg-white border-slate-300 text-transparent hover:border-sky-400'
                        }`}
                      >
                        ✓
                      </div>
                    </div>
                  )}

                  {/* Desk Top Bar: Number & Status Indicator */}
                  <div className="flex items-center justify-between text-[10px] px-1">
                    <span className="font-mono font-bold text-slate-400">
                      #{desk.deskNumber}
                    </span>
                    {student ? (
                      <span className="flex items-center gap-1 font-mono-numbers">
                        <span className="text-amber-500 font-bold">★ Lv.{student.level}</span>
                        {hasMissingWork ? (
                          <span className="w-2 h-2 rounded-full bg-amber-500" title="มีงานค้างส่ง" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="ส่งงานครบ" />
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[9px]">ว่าง</span>
                    )}
                  </div>

                  {/* Desk Center: 3D Animated Student Desk Illustration */}
                  {student ? (
                    <div className="flex flex-col items-center justify-center py-0.5">
                      <Desk3DIllustration
                        student={student}
                        deskNumber={desk.deskNumber}
                        isSelected={isSelectedInMulti}
                        hasMissingWork={hasMissingWork}
                        actionPose={isSelectedInMulti ? 'raise_hand' : hasMissingWork ? 'idle' : 'writing'}
                        size="sm"
                      />
                      <div className="text-xs font-bold text-slate-800 truncate -mt-0.5 max-w-[110px] text-center">
                        {student.nickname}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[110px] text-center">
                        เลขที่ {student.studentNumber} · {student.name.split(' ')[0]}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-1">
                      <Desk3DIllustration
                        deskNumber={desk.deskNumber}
                        size="sm"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssigningDesk(desk);
                          setSelectedStudentForDesk('');
                          setIsAssignModalOpen(true);
                        }}
                        className="text-[10px] font-semibold text-sky-600 hover:text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 mt-1"
                      >
                        + ผูกนักเรียน
                      </button>
                    </div>
                  )}

                  {/* Desk Footer: Quick Action in Edit Mode */}
                  {mode === 'edit' && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]"
                    >
                      <button
                        onClick={() => handleRotateDesk(desk.id)}
                        title="หมุนโต๊ะ 90 องศา"
                        className="text-slate-500 hover:text-sky-600 px-1"
                      >
                        🔄
                      </button>
                      <button
                        onClick={() => {
                          setAssigningDesk(desk);
                          setSelectedStudentForDesk(desk.studentId || '');
                          setIsAssignModalOpen(true);
                        }}
                        title="เปลี่ยนนักเรียน"
                        className="text-slate-500 hover:text-sky-600 px-1"
                      >
                        👤
                      </button>
                      <button
                        onClick={() => handleRemoveDesk(desk.id)}
                        title="ลบโต๊ะนี้"
                        className="text-red-400 hover:text-red-600 px-1"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Batch Action Bar (Appears when 1 or more students are selected) */}
      {selectedStudentIds.size > 0 && (
        <div className="sticky bottom-4 z-40 bg-slate-900/95 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-3 backdrop-blur-md animate-fade-in">
          <div className="flex items-center gap-3 overflow-hidden w-full md:w-auto">
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {selectedStudentIds.size}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>เลือกนักเรียนแล้ว {selectedStudentIds.size} คน</span>
                <span className="text-slate-400 font-normal">พร้อมให้คะแนนกลุ่ม</span>
              </div>
              {/* Selected chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-md pt-1 scrollbar-none">
                {Array.from(selectedStudentIds).map((id) => {
                  const s = students.find((stu) => stu.id === id);
                  if (!s) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-[11px] text-slate-200 border border-slate-700 shrink-0"
                    >
                      <span>{s.avatar}</span>
                      <span>{s.nickname}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStudentSelection(id);
                        }}
                        className="text-slate-400 hover:text-red-400 ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Score Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            <button
              type="button"
              onClick={() => handleExecuteBatchAward(1, 'participation', 'ตอบคำถามในชั้นเรียน (ให้คะแนนกลุ่ม)')}
              className="px-3 py-1.5 text-xs font-bold text-sky-900 bg-sky-200 hover:bg-sky-100 rounded-xl transition-all shadow-xs"
              title="บวก 1 คะแนนตอบคำถามให้ทุกคนที่เลือก"
            >
              +1 🙋‍♂️ ตอบคำถาม
            </button>
            <button
              type="button"
              onClick={() => handleExecuteBatchAward(2, 'behavior', 'ร่วมมือทำกิจกรรมกลุ่มและช่วยเหลือเพื่อน')}
              className="px-3 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-300 hover:bg-emerald-200 rounded-xl transition-all shadow-xs"
              title="บวก 2 คะแนนพฤติกรรมและความร่วมมือ"
            >
              +2 🤝 ช่วยเพื่อน
            </button>
            <button
              type="button"
              onClick={() => handleExecuteBatchAward(5, 'exp', 'คะแนนพิเศษไซบี้ (กลุ่มกิจกรรม)')}
              className="px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs"
              title="บวก 5 EXP ให้ทุกคนที่เลือก"
            >
              +5 ⚡ EXP
            </button>
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs"
            >
              🎯 กำหนดคะแนนละเอียด...
            </button>
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="ยกเลิกการเลือก"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Classroom Legend */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
          <span className="font-semibold text-slate-800">สัญลักษณ์ผังห้อง:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> ส่งงานครบ
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> มีงานค้าง
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> โต๊ะว่าง
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> กำลังเลือกหลายคน
          </span>
        </div>

        <div className="text-xs text-slate-500">
          โต๊ะทั้งหมด: <span className="font-bold text-slate-800 font-mono-numbers">{layout.desks.length}</span> โต๊ะ · มีนักเรียนนั่งประจำ: <span className="font-bold text-emerald-600 font-mono-numbers">{seatedStudentIds.size}</span> คน
        </div>
      </div>

      {/* Batch Scoring Modal (กำหนดคะแนนละเอียดให้หลายคนพร้อมกัน) */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-sky-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎯</span>
                <div>
                  <h3 className="text-base font-bold">
                    มอบคะแนนพร้อมกันให้นักเรียน ({selectedStudentIds.size} คน)
                  </h3>
                  <p className="text-xs text-sky-100">
                    คะแนนจะถูกบันทึกลงชีตและเพิ่ม EXP ให้นักเรียนทุกคนที่เลือกทันที
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1 rounded-lg text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Selected Students Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  รายชื่อนักเรียนที่ได้รับคะแนน ({selectedStudentIds.size} คน):
                </label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {Array.from(selectedStudentIds).map((id) => {
                    const stu = students.find((s) => s.id === id);
                    if (!stu) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 shadow-2xs"
                      >
                        <span>{stu.avatar}</span>
                        <span className="font-semibold">{stu.nickname}</span>
                        <span className="text-[10px] text-slate-400">#{stu.studentNumber}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Score Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ประเภทคะแนน:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBatchScoreType('participation');
                      setBatchScoreReason('ร่วมตอบคำถามและมีส่วนร่วมในชั้นเรียน');
                    }}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                      batchScoreType === 'participation'
                        ? 'bg-sky-50 border-sky-400 text-sky-800 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🙋‍♂️ ตอบคำถาม
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchScoreType('behavior');
                      setBatchScoreReason('ช่วยเพื่อน / ทำงานกลุ่มร่วมกันดีเยี่ยม');
                    }}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                      batchScoreType === 'behavior'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🤝 พฤติกรรม
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchScoreType('exp');
                      setBatchScoreReason('คะแนนพิเศษไซบี้ประจำคาบ');
                    }}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                      batchScoreType === 'exp'
                        ? 'bg-amber-50 border-amber-400 text-amber-800 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ⚡ แต้ม EXP
                  </button>
                </div>
              </div>

              {/* Score Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  จำนวนคะแนนต่อคน:
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 5, 10, -1].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBatchScoreAmount(amt)}
                      className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
                        batchScoreAmount === amt
                          ? amt > 0
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-red-600 text-white border-red-600'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {amt > 0 ? `+${amt}` : amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Score Reason Input with Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  เหตุผล / บันทึกกิจกรรม:
                </label>
                <input
                  type="text"
                  value={batchScoreReason}
                  onChange={(e) => setBatchScoreReason(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="เช่น ทำงานกลุ่มร่วมกันดีเด่น, ตอบคำถามการทดลอง"
                />

                {/* Preset Reason Pills */}
                <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                  <span className="text-[10px] text-slate-400">ตัวอย่าง:</span>
                  {[
                    'ร่วมตอบคำถามกิจกรรมกลุ่ม',
                    'ช่วยเพื่อนอธิบายบทเรียน',
                    'ส่งงานตรงเวลาครบทุกคน',
                    'ตั้งใจเรียนและมีวินัยดีเยี่ยม',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBatchScoreReason(preset)}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                รวมคะแนนแจกทั้งสิ้น: <strong className="text-emerald-600 font-mono">+{batchScoreAmount * selectedStudentIds.size}</strong> แต้ม
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteBatchAward(batchScoreAmount, batchScoreType, batchScoreReason)}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                >
                  ✓ บันทึกคะแนนให้ทั้ง {selectedStudentIds.size} คน
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-Class Live Scoring Modal (แตะโต๊ะเพื่อบวกคะแนนรายบุคคล) */}
      {scoringDesk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            {(() => {
              const student = students.find((s) => s.id === scoringDesk.studentId);
              if (!student) return null;

              return (
                <>
                  <div className="p-5 bg-gradient-to-r from-sky-600 to-indigo-700 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{student.avatar}</span>
                      <div>
                        <h3 className="text-base font-bold">
                          {student.name} ({student.nickname})
                        </h3>
                        <p className="text-xs text-sky-100">
                          เลขที่ {student.studentNumber} · โต๊ะ #{scoringDesk.deskNumber} · เลเวล {student.level} ({student.totalExp} EXP)
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setScoringDesk(null)}
                      className="p-1 rounded-lg text-white/70 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Scoring Options */}
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        ประเภทคะแนน:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setScoreType('participation');
                            setScoreReason('ยกมือตอบคำถามถูกต้อง');
                          }}
                          className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                            scoreType === 'participation'
                              ? 'bg-sky-50 border-sky-400 text-sky-800 font-bold'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          🙋‍♂️ ตอบคำถาม
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setScoreType('behavior');
                            setScoreReason('ช่วยเพื่อน / ตั้งใจเรียนดีเด่น');
                          }}
                          className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                            scoreType === 'behavior'
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          🤝 พฤติกรรม
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setScoreType('exp');
                            setScoreReason('คะแนนพิเศษไซบี้');
                          }}
                          className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                            scoreType === 'exp'
                              ? 'bg-amber-50 border-amber-400 text-amber-800 font-bold'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          ⚡ แต้ม EXP
                        </button>
                      </div>
                    </div>

                    {/* Score Amount */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        จำนวนคะแนนที่มอบให้:
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 5, -1].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setScoreAmount(amt)}
                            className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
                              scoreAmount === amt
                                ? amt > 0
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-red-600 text-white border-red-600'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {amt > 0 ? `+${amt}` : amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reason input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        เหตุผล / กิจกรรม:
                      </label>
                      <input
                        type="text"
                        value={scoreReason}
                        onChange={(e) => setScoreReason(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        placeholder="เช่น ร่วมแสดงความคิดเห็น, ทำการทดลองสำเร็จ"
                      />
                    </div>

                    {/* Switch to Multi-Select Shortcut */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMultiSelectMode(true);
                          setSelectedStudentIds(new Set([student.id]));
                          setScoringDesk(null);
                        }}
                        className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1"
                      >
                        <span>✨ ต้องการให้คะแนนหลายคนพร้อมกัน?</span>
                      </button>
                    </div>

                    {/* Recent Transaction History for this Student */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-500 mb-2">
                        ประวัติคะแนนล่าสุดของ {student.nickname}:
                      </div>
                      <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                        {scoreTransactions
                          .filter((t) => t.studentId === student.id)
                          .slice(-3)
                          .reverse()
                          .map((t) => (
                            <div
                              key={t.id}
                              className="text-[11px] flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-100"
                            >
                              <span className="text-slate-600 truncate">{t.reason}</span>
                              <span
                                className={`font-mono font-bold shrink-0 ml-2 ${
                                  t.amount >= 0 ? 'text-emerald-600' : 'text-red-500'
                                }`}
                              >
                                {t.amount >= 0 ? `+${t.amount}` : t.amount}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectStudentProfile(student.id);
                        setScoringDesk(null);
                      }}
                      className="text-xs text-sky-600 hover:text-sky-800 font-medium"
                    >
                      ดูข้อมูลโปรไฟล์เต็ม &rarr;
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setScoringDesk(null)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={handleAwardSingleScore}
                        className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                      >
                        ✓ บันทึกคะแนนลงชีต
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Assign Student to Desk Modal */}
      {isAssignModalOpen && assigningDesk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              ผูกนักเรียนกับโต๊ะ #{assigningDesk.deskNumber}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              เลือกนักเรียนประจำโต๊ะ (ระบบจะป้องกันการผูกนักเรียนคนเดิมซ้ำอัตโนมัติ)
            </p>

            <div className="space-y-3">
              <select
                value={selectedStudentForDesk}
                onChange={(e) => setSelectedStudentForDesk(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">-- ไม่ระบุ (โต๊ะว่าง) --</option>
                {students.map((stu) => {
                  const currentDeskOfStudent = layout.desks.find((d) => d.studentId === stu.id);
                  const isSeatedElsewhere = currentDeskOfStudent && currentDeskOfStudent.id !== assigningDesk.id;
                  return (
                    <option key={stu.id} value={stu.id}>
                      เลขที่ {stu.studentNumber} {stu.name} ({stu.nickname})
                      {isSeatedElsewhere ? ` [นั่งโต๊ะ #${currentDeskOfStudent.deskNumber} อยู่]` : ''}
                    </option>
                  );
                })}
              </select>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleAssignStudent}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
                >
                  บันทึกที่นั่ง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
