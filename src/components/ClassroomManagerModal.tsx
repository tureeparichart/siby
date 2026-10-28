import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ClassRoom, Student } from '../types';
import { MascotSiby } from './MascotSiby';

interface StudentRowItem {
  id: string;
  studentNumber: number;
  name: string;
  nickname: string;
  gender: 'M' | 'F';
  avatar: string;
}

interface ClassroomManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassRoom[];
  activeClassId: string;
  onSelectClass: (classId: string) => void;
  onAddClass: (newClass: ClassRoom, customStudents?: Student[]) => void;
  onUpdateClass?: (updatedClass: ClassRoom, updatedStudents: Student[]) => void;
  students: Student[];
  onResetClassData?: (classId: string) => void;
}

const SAMPLE_STUDENTS: Array<{ name: string; nickname: string; gender: 'M' | 'F' }> = [
  { name: 'ด.ช. ภูผา ธาราทิพย์', nickname: 'ภูผา', gender: 'M' },
  { name: 'ด.ช. กฤษณะ วงศ์สว่าง', nickname: 'กาย', gender: 'M' },
  { name: 'ด.ญ. กานต์พิชชา รุ่งเรือง', nickname: 'กานต์', gender: 'F' },
  { name: 'ด.ญ. ชัญญา เจริญศิลป์', nickname: 'เนย', gender: 'F' },
  { name: 'ด.ช. ณภัทร สุริยันต์', nickname: 'ภัทร', gender: 'M' },
  { name: 'ด.ญ. ธัญชนก รัตนโกสินทร์', nickname: 'พลอย', gender: 'F' },
  { name: 'ด.ช. ปัณณธร เกียรติสกุล', nickname: 'ปัน', gender: 'M' },
  { name: 'ด.ญ. มนัสนันท์ ทวีชัย', nickname: 'มิ้นท์', gender: 'F' },
  { name: 'ด.ช. วรภัทร ชาญวิทย์', nickname: 'วิน', gender: 'M' },
  { name: 'ด.ญ. สิรินดา สิริโชค', nickname: 'ริน', gender: 'F' },
  { name: 'ด.ช. อัครพงษ์ วิเศษศรี', nickname: 'อาร์ม', gender: 'M' },
  { name: 'ด.ญ. อารียา ประเสริฐสุข', nickname: 'แอม', gender: 'F' },
];

export const ClassroomManagerModal: React.FC<ClassroomManagerModalProps> = ({
  isOpen,
  onClose,
  classes,
  activeClassId,
  onSelectClass,
  onAddClass,
  onUpdateClass,
  students,
  onResetClassData,
}) => {
  // Navigation: 'list' (all classes), 'add' (new class with student table), 'edit' (edit class with student table)
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [confirmResetClassId, setConfirmResetClassId] = useState<string | null>(null);

  // Classroom fields
  const [className, setClassName] = useState<string>('ม.3/3');
  const [gradeLevel, setGradeLevel] = useState<string>('มัธยมศึกษาปีที่ 3');
  const [roomCode, setRoomCode] = useState<string>('3103');
  const [advisor, setAdvisor] = useState<string>('ครูปาริชาติ เทพพิทักษ์');

  // Individual Student Table state
  const [studentRows, setStudentRows] = useState<StudentRowItem[]>([]);

  // Excel / Google Sheets Paste Helper Drawer
  const [isPasteDrawerOpen, setIsPasteDrawerOpen] = useState<boolean>(false);
  const [pasteText, setPasteText] = useState<string>('');
  const [pasteMode, setPasteMode] = useState<'replace' | 'append'>('replace');
  const [copySuccessToast, setCopySuccessToast] = useState<string | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (copySuccessToast) {
      const timer = setTimeout(() => setCopySuccessToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [copySuccessToast]);

  // When opening add mode, set default fields
  const handleOpenAdd = () => {
    const nextNum = classes.length + 1;
    setClassName(`ม.3/${nextNum}`);
    setGradeLevel('มัธยมศึกษาปีที่ 3');
    setRoomCode(`310${nextNum}`);
    setAdvisor('ครูปาริชาติ เทพพิทักษ์');

    // Default sample student rows
    const initialRows: StudentRowItem[] = SAMPLE_STUDENTS.slice(0, 8).map((s, idx) => ({
      id: `NEW-ROW-${Date.now()}-${idx + 1}`,
      studentNumber: idx + 1,
      name: s.name,
      nickname: s.nickname,
      gender: s.gender,
      avatar: s.gender === 'M' ? '👦🏻' : '👧🏻',
    }));
    setStudentRows(initialRows);
    setEditingClassId(null);
    setViewMode('add');
  };

  // When opening edit mode for an existing class
  const handleOpenEdit = (cls: ClassRoom) => {
    setClassName(cls.name);
    setGradeLevel(cls.gradeLevel);
    setRoomCode(cls.roomCode);
    setAdvisor(cls.advisor);
    setEditingClassId(cls.id);

    const existingClassStudents = students
      .filter((s) => s.classId === cls.id || s.classId === cls.name)
      .sort((a, b) => a.studentNumber - b.studentNumber);

    if (existingClassStudents.length > 0) {
      setStudentRows(
        existingClassStudents.map((s) => ({
          id: s.id,
          studentNumber: s.studentNumber,
          name: s.name,
          nickname: s.nickname,
          gender: s.gender || 'M',
          avatar: s.avatar || (s.gender === 'F' ? '👧🏻' : '👦🏻'),
        }))
      );
    } else {
      // Empty or fallback rows
      setStudentRows([
        {
          id: `ROW-${Date.now()}-1`,
          studentNumber: 1,
          name: '',
          nickname: '',
          gender: 'M',
          avatar: '👦🏻',
        },
      ]);
    }

    setViewMode('edit');
  };

  if (!isOpen) return null;

  // Add blank student row
  const handleAddRow = () => {
    const nextNumber =
      studentRows.length > 0
        ? Math.max(...studentRows.map((r) => r.studentNumber || 0)) + 1
        : 1;

    setStudentRows((prev) => [
      ...prev,
      {
        id: `ROW-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        studentNumber: nextNumber,
        name: '',
        nickname: '',
        gender: 'M',
        avatar: '👦🏻',
      },
    ]);
  };

  // Delete student row
  const handleDeleteRow = (index: number) => {
    setStudentRows((prev) => {
      const copy = prev.filter((_, i) => i !== index);
      // Automatically re-number sequentially
      return copy.map((item, idx) => ({
        ...item,
        studentNumber: idx + 1,
      }));
    });
  };

  // Update a field in a student row
  const handleUpdateRow = (
    index: number,
    field: keyof StudentRowItem,
    value: string | number
  ) => {
    setStudentRows((prev) => {
      const copy = [...prev];
      const target = { ...copy[index], [field]: value };

      // Auto-detect gender and avatar from Thai prefix if name is updated
      if (field === 'name' && typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.startsWith('ด.ญ.') || trimmed.startsWith('นางสาว') || trimmed.startsWith('น.ส.')) {
          target.gender = 'F';
          target.avatar = '👧🏻';
        } else if (trimmed.startsWith('ด.ช.') || trimmed.startsWith('นาย')) {
          target.gender = 'M';
          target.avatar = '👦🏻';
        }
      }

      copy[index] = target;
      return copy;
    });
  };

  // Populate sample students (12 Thai students)
  const handleLoadSampleStudents = () => {
    const rows: StudentRowItem[] = SAMPLE_STUDENTS.map((s, idx) => ({
      id: `SAMPLE-${Date.now()}-${idx + 1}`,
      studentNumber: idx + 1,
      name: s.name,
      nickname: s.nickname,
      gender: s.gender,
      avatar: s.gender === 'M' ? '👦🏻' : '👧🏻',
    }));
    setStudentRows(rows);
    setCopySuccessToast('โหลดรายชื่อนักเรียนตัวอย่าง 12 คนเรียบร้อยแล้ว');
  };

  // Clear all rows
  const handleClearAllRows = () => {
    if (confirm('คุณครูต้องการล้างรายชื่อนักเรียนในตารางทั้งหมดใช่หรือไม่?')) {
      setStudentRows([]);
    }
  };

  // Copy whole table to clipboard in Excel/Sheets format (Tab delimited)
  const handleCopyTableToClipboard = () => {
    if (studentRows.length === 0) {
      alert('ไม่มีข้อมูลในตารางให้คัดลอก');
      return;
    }

    const header = 'เลขที่\tชื่อ - นามสกุล\tชื่อเล่น / ฉายา';
    const lines = studentRows.map(
      (r) => `${r.studentNumber}\t${r.name.trim()}\t${r.nickname.trim()}`
    );
    const textToCopy = [header, ...lines].join('\n');

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopySuccessToast(
          `คัดลอกรายชื่อนักเรียน ${studentRows.length} คน เรียบร้อย! สามารถวาง (Ctrl+V) ลงใน Excel หรือ Google Sheets ได้ทันที`
        );
      })
      .catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopySuccessToast(`คัดลอกรายชื่อนักเรียน ${studentRows.length} คน เรียบร้อย`);
      });
  };

  // Parse pasted text from Excel, Google Sheets, or CSV
  const handleParseAndApplyPaste = () => {
    if (!pasteText.trim()) {
      alert('กรุณาวางข้อความจาก Excel หรือ Google Sheets ในช่องข้อความ');
      return;
    }

    const rawLines = pasteText.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const parsedRows: StudentRowItem[] = [];
    let runningNum = pasteMode === 'append' ? studentRows.length + 1 : 1;

    rawLines.forEach((line) => {
      // Skip header line if detected
      if (
        line.includes('เลขที่') ||
        line.includes('ชื่อ - นามสกุล') ||
        line.includes('ชื่อ-สกุล') ||
        line.includes('ฉายา') ||
        line.includes('ลำดับ')
      ) {
        return;
      }

      // Detect separator: Tab (\t) is default from Excel/Sheets copy, fallback to comma (,)
      let parts = line.split('\t');
      if (parts.length === 1 && line.includes(',')) {
        parts = line.split(',');
      }

      const p0 = parts[0]?.trim() || '';
      const p1 = parts[1]?.trim() || '';
      const p2 = parts[2]?.trim() || '';

      let num = runningNum;
      let name = '';
      let nickname = '';

      if (parts.length >= 3) {
        // Format: [1, "ด.ช. สมชาย", "ชาย"]
        const parsedNum = parseInt(p0, 10);
        if (!isNaN(parsedNum)) {
          num = parsedNum;
          name = p1;
          nickname = p2;
        } else {
          // Format: ["ด.ช. สมชาย", "ชาย", "1"]
          name = p0;
          nickname = p1;
          const maybeNum = parseInt(p2, 10);
          if (!isNaN(maybeNum)) num = maybeNum;
        }
      } else if (parts.length === 2) {
        // Format: [1, "ด.ช. สมชาย"] OR ["ด.ช. สมชาย", "ชาย"]
        const parsedNum = parseInt(p0, 10);
        if (!isNaN(parsedNum)) {
          num = parsedNum;
          name = p1;
        } else {
          name = p0;
          nickname = p1;
        }
      } else {
        // Format: ["ด.ช. สมชาย"]
        name = p0;
      }

      if (!name) return;

      // Extract gender and avatar
      let gender: 'M' | 'F' = 'M';
      let avatar = '👦🏻';
      if (name.startsWith('ด.ญ.') || name.startsWith('นางสาว') || name.startsWith('น.ส.')) {
        gender = 'F';
        avatar = '👧🏻';
      } else if (name.startsWith('ด.ช.') || name.startsWith('นาย')) {
        gender = 'M';
        avatar = '👦🏻';
      }

      parsedRows.push({
        id: `PASTE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        studentNumber: num,
        name,
        nickname,
        gender,
        avatar,
      });

      runningNum++;
    });

    if (parsedRows.length === 0) {
      alert('ไม่พบรายชื่อนักเรียนที่สามารถแยกได้ กรุณาตรวจสอบรูปแบบข้อความ');
      return;
    }

    if (pasteMode === 'replace') {
      setStudentRows(parsedRows);
    } else {
      setStudentRows((prev) => [...prev, ...parsedRows]);
    }

    setPasteText('');
    setIsPasteDrawerOpen(false);
    setCopySuccessToast(`นำเข้ารายชื่อนักเรียน ${parsedRows.length} คน จาก Excel เรียบร้อยแล้ว!`);
  };

  // Submit Handler (for Add or Edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) {
      alert('กรุณาระบุชื่อห้องเรียน');
      return;
    }

    // Filter valid student rows (must have a name)
    const validRows = studentRows.filter((r) => r.name.trim().length > 0);

    if (viewMode === 'add') {
      const newClassId = `CLS-${String(classes.length + 1).padStart(3, '0')}`;
      const newClass: ClassRoom = {
        id: newClassId,
        name: className.trim(),
        gradeLevel: gradeLevel.trim() || 'มัธยมศึกษาปีที่ 3',
        roomCode: roomCode.trim() || '101',
        advisor: advisor.trim() || 'คุณครู',
        totalStudents: validRows.length,
      };

      const finalStudents: Student[] = validRows.map((r, idx) => ({
        id: `STU-${newClass.id}-${String(idx + 1).padStart(3, '0')}`,
        studentNumber: r.studentNumber || idx + 1,
        name: r.name.trim(),
        nickname: r.nickname.trim() || r.name.trim().split(' ')[0],
        avatar: r.avatar || (r.gender === 'F' ? '👧🏻' : '👦🏻'),
        classId: newClass.id,
        gender: r.gender,
        streak: 1,
        totalExp: 100,
        level: 1,
        coins: 20,
        badges: ['BDG-001'],
        academicGpaEstimate: 3.0,
        isPresent: true,
      }));

      onAddClass(newClass, finalStudents);
      onSelectClass(newClass.id);
      confetti({ particleCount: 50, spread: 70 });
      setViewMode('list');
    } else if (viewMode === 'edit' && editingClassId) {
      const targetClass = classes.find((c) => c.id === editingClassId);
      if (!targetClass) return;

      const updatedClass: ClassRoom = {
        ...targetClass,
        name: className.trim(),
        gradeLevel: gradeLevel.trim(),
        roomCode: roomCode.trim(),
        advisor: advisor.trim(),
        totalStudents: validRows.length,
      };

      const finalStudents: Student[] = validRows.map((r, idx) => {
        // preserve existing student fields if they already exist
        const existing = students.find((s) => s.id === r.id);
        return {
          id: existing ? existing.id : `STU-${targetClass.id}-${String(idx + 1).padStart(3, '0')}`,
          studentNumber: r.studentNumber || idx + 1,
          name: r.name.trim(),
          nickname: r.nickname.trim() || r.name.trim().split(' ')[0],
          avatar: r.avatar || existing?.avatar || (r.gender === 'F' ? '👧🏻' : '👦🏻'),
          classId: targetClass.id,
          gender: r.gender,
          streak: existing?.streak ?? 1,
          totalExp: existing?.totalExp ?? 100,
          level: existing?.level ?? 1,
          coins: existing?.coins ?? 20,
          badges: existing?.badges ?? ['BDG-001'],
          academicGpaEstimate: existing?.academicGpaEstimate ?? 3.0,
          isPresent: existing?.isPresent ?? true,
        };
      });

      if (onUpdateClass) {
        onUpdateClass(updatedClass, finalStudents);
      }
      onSelectClass(updatedClass.id);
      confetti({ particleCount: 35, spread: 50 });
      setViewMode('list');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Toast Notification */}
        {copySuccessToast && (
          <div className="bg-emerald-600 text-white text-xs font-medium px-4 py-2.5 flex items-center justify-between shadow-md animate-fade-in">
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>{copySuccessToast}</span>
            </div>
            <button
              onClick={() => setCopySuccessToast(null)}
              className="text-emerald-200 hover:text-white ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-sky-50 via-white to-blue-50">
          <div className="flex items-center gap-3">
            <MascotSiby mood="happy" size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {viewMode === 'list'
                    ? 'จัดการห้องเรียน (Classroom Manager)'
                    : viewMode === 'add'
                    ? 'เพิ่มห้องเรียนใหม่ พร้อมตารางนักเรียนรายบุคคล'
                    : `แก้ไขข้อมูลห้องเรียนและรายชื่อนักเรียน (${className})`}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                  รองรับ Excel / Sheets
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {viewMode === 'list'
                  ? 'ครูสามารถเพิ่มห้องเรียนได้หลายห้อง และสลับสอนแต่ละห้องได้ทันที'
                  : 'กำหนดข้อมูลห้องเรียน และกรอกตารางนักเรียน (เลขที่, ชื่อ นามสกุล, ชื่อเล่น) เพิ่ม/ลบ หรือคัดลอกวาง'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 text-lg leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {viewMode === 'list' ? (
            /* ================= VIEW: CLASSROOM LIST ================= */
            <>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    ห้องเรียนทั้งหมดของคุณครู ({classes.length} ห้อง)
                  </span>
                  <p className="text-[11px] text-slate-400">
                    คลิกห้องเพื่อสลับไปสอน หรือกด "แก้ไขรายชื่อ" เพื่อจัดการนักเรียนรายบุคคล
                  </p>
                </div>
                <button
                  onClick={handleOpenAdd}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <span className="text-sm">＋</span>
                  <span>เพิ่มห้องเรียนใหม่</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {classes.map((cls) => {
                  const classStudents = students.filter(
                    (s) => s.classId === cls.id || s.classId === cls.name
                  );
                  const isSelected = activeClassId === cls.id;

                  return (
                    <div
                      key={cls.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-sky-50/90 border-sky-400 ring-2 ring-sky-200 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold ${
                              isSelected
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            🏫
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900">
                                ห้อง {cls.name}
                              </h3>
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                ห้อง {cls.roomCode}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {cls.gradeLevel}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              ครูที่ปรึกษา: {cls.advisor}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                            <span>👥</span>
                            <span>{classStudents.length} คน</span>
                          </span>
                        </div>
                      </div>

                      {/* Card actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cls)}
                            className="px-2.5 py-1 text-xs text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors flex items-center gap-1 font-medium"
                          >
                            <span>✏️</span>
                            <span>แก้ไขรายชื่อ</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmResetClassId(cls.id)}
                            className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 font-medium"
                            title="รีเซ็ตคะแนนและข้อมูลการส่งงานของห้องนี้"
                          >
                            <span>🔄</span>
                            <span>รีเซ็ตห้อง</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onSelectClass(cls.id)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                            isSelected
                              ? 'bg-sky-600 text-white cursor-default'
                              : 'bg-slate-100 text-slate-700 hover:bg-sky-100 hover:text-sky-800'
                          }`}
                        >
                          {isSelected ? '✓ ใช้งานอยู่' : 'เลือกสอนห้องนี้'}
                        </button>
                      </div>

                      {/* Confirmation Prompt for Resetting Classroom Data */}
                      {confirmResetClassId === cls.id && (
                        <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2 animate-fade-in">
                          <div className="font-bold text-rose-900 flex items-center gap-1">
                            <span>⚠️ รีเซ็ตข้อมูลห้อง {cls.name}?</span>
                          </div>
                          <p className="text-[11px] text-rose-700 leading-relaxed">
                            ระบบจะรีเซ็ตสถานะการส่งงาน คะแนนการบ้าน แต้ม EXP และการเช็คชื่อของนักเรียนในห้อง {cls.name} ทั้งหมดเพื่อเริ่มบันทึกใหม่
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (onResetClassData) {
                                  onResetClassData(cls.id);
                                }
                                setConfirmResetClassId(null);
                                setCopySuccessToast(`รีเซ็ตข้อมูลห้องเรียน ${cls.name} เรียบร้อยแล้ว!`);
                              }}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors shadow-2xs"
                            >
                              ยืนยันรีเซ็ต 🔄
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmResetClassId(null)}
                              className="px-3 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* ================= VIEW: ADD / EDIT CLASSROOM & ROSTER TABLE ================= */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Classroom Basic Info Section */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🏫</span>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      ข้อมูลห้องเรียน (Class Details)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    ← กลับหน้ารายการห้อง
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ชื่อห้องเรียน: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="เช่น ม.3/3, ม.1/4"
                      className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ระดับชั้น:
                    </label>
                    <input
                      type="text"
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      placeholder="เช่น มัธยมศึกษาปีที่ 3"
                      className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      รหัสห้อง / เลขห้อง:
                    </label>
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      placeholder="เช่น 3103"
                      className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ครูที่ปรึกษา / ครูประจำชั้น:
                    </label>
                    <input
                      type="text"
                      value={advisor}
                      onChange={(e) => setAdvisor(e.target.value)}
                      placeholder="เช่น ครูปาริชาติ"
                      className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Excel Paste Drawer Modal / Expandable Panel */}
              {isPasteDrawerOpen && (
                <div className="bg-sky-50 border-2 border-dashed border-sky-400 p-4 rounded-xl space-y-3 animate-fade-in shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📋</span>
                      <h4 className="text-xs font-bold text-sky-900">
                        วางข้อมูลจาก Microsoft Excel หรือ Google Sheets
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPasteDrawerOpen(false)}
                      className="text-xs text-sky-700 hover:text-sky-950 font-bold"
                    >
                      ✕ ปิด
                    </button>
                  </div>

                  <p className="text-[11px] text-sky-800 leading-relaxed">
                    คุณครูสามารถคลุมดำตารางใน <strong>Excel</strong> หรือ <strong>Google Sheets</strong>{' '}
                    (คอลัมน์: <em>เลขที่, ชื่อ นามสกุล, ชื่อเล่น/ฉายา</em> หรือแค่ <em>ชื่อ นามสกุล</em>) แล้วกด{' '}
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-sky-300 text-[10px] font-mono shadow-2xs">Ctrl + C</kbd>{' '}
                    และกด <kbd className="px-1.5 py-0.5 bg-white rounded border border-sky-300 text-[10px] font-mono shadow-2xs">Ctrl + V</kbd>{' '}
                    วางลงในกล่องข้อความด้านล่างนี้ได้เลย ระบบจะแยกคอลัมน์ให้อัตโนมัติ!
                  </p>

                  <textarea
                    rows={5}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="ตัวอย่างการวางข้อมูล:&#10;1&#9;ด.ช. ภูผา ธาราทิพย์&#9;ภูผา&#10;2&#9;ด.ช. กฤษณะ วงศ์สว่าง&#9;กาย&#10;3&#9;ด.ญ. กานต์พิชชา รุ่งเรือง&#9;กานต์"
                    className="w-full text-xs font-mono p-2.5 bg-white border border-sky-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-4 text-xs text-slate-700">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="pasteMode"
                          checked={pasteMode === 'replace'}
                          onChange={() => setPasteMode('replace')}
                          className="text-sky-600 focus:ring-sky-500"
                        />
                        <span>แทนที่ข้อมูลเดิมในตาราง</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="pasteMode"
                          checked={pasteMode === 'append'}
                          onChange={() => setPasteMode('append')}
                          className="text-sky-600 focus:ring-sky-500"
                        />
                        <span>เพิ่มต่อท้ายแถวเดิม</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPasteText('');
                          setIsPasteDrawerOpen(false);
                        }}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={handleParseAndApplyPaste}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs flex items-center gap-1"
                      >
                        <span>✓ นำเข้าสู่ตาราง</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Student Table Header Toolbar */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">
                      ตารางข้อมูลนักเรียนรายบุคคล
                    </span>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                      {studentRows.filter((r) => r.name.trim()).length} คน
                    </span>
                  </div>

                  {/* Quick Action Toolbar */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsPasteDrawerOpen(!isPasteDrawerOpen)}
                      className="px-2.5 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                      title="วางข้อมูลจาก Microsoft Excel หรือ Google Sheets"
                    >
                      <span>📋</span>
                      <span>วางจาก Excel / Sheets</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyTableToClipboard}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
                      title="คัดลอกตารางไปวางใน Excel หรือ Google Sheets"
                    >
                      <span>📄</span>
                      <span>คัดลอกตาราง</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLoadSampleStudents}
                      className="px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1"
                      title="ใส่รายชื่อตัวอย่าง 12 คนเพื่อทดสอบ"
                    >
                      <span>🎲</span>
                      <span>โหลดตัวอย่าง</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <span>＋</span>
                      <span>เพิ่มแถว</span>
                    </button>

                    {studentRows.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllRows}
                        className="px-2 py-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                        title="ล้างรายชื่อทั้งหมด"
                      >
                        ล้างทั้งหมด
                      </button>
                    )}
                  </div>
                </div>

                {/* Individual Student Roster Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                  <div className="max-h-[380px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200 shadow-2xs">
                        <tr>
                          <th className="py-2.5 px-3 w-16 text-center border-r border-slate-200">
                            1. เลขที่
                          </th>
                          <th className="py-2.5 px-3 min-w-[200px] border-r border-slate-200">
                            2. ชื่อ - นามสกุล
                          </th>
                          <th className="py-2.5 px-3 min-w-[130px] border-r border-slate-200">
                            3. ชื่อเล่น / ฉายา
                          </th>
                          <th className="py-2.5 px-3 w-24 text-center border-r border-slate-200">
                            เพศ
                          </th>
                          <th className="py-2.5 px-3 w-14 text-center">
                            ลบ
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentRows.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-10 text-center text-slate-400">
                              <div className="space-y-1.5">
                                <p className="text-sm font-medium text-slate-500">
                                  ยังไม่มีรายชื่อนักเรียนในตาราง
                                </p>
                                <p className="text-xs">
                                  กดปุ่ม <strong>"＋ เพิ่มแถว"</strong> เพื่อพิมพ์รายบุคคล หรือกด{' '}
                                  <strong>"📋 วางจาก Excel / Sheets"</strong> เพื่อนำเข้าทีละหลายคน
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          studentRows.map((row, idx) => (
                            <tr
                              key={row.id}
                              className="hover:bg-sky-50/40 transition-colors group"
                            >
                              {/* 1. เลขที่ */}
                              <td className="py-1.5 px-2 text-center border-r border-slate-100">
                                <input
                                  type="number"
                                  min={1}
                                  value={row.studentNumber}
                                  onChange={(e) =>
                                    handleUpdateRow(
                                      idx,
                                      'studentNumber',
                                      parseInt(e.target.value, 10) || 1
                                    )
                                  }
                                  className="w-12 text-center font-mono font-bold text-slate-800 border border-slate-200 rounded p-1 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                                />
                              </td>

                              {/* 2. ชื่อ - นามสกุล */}
                              <td className="py-1.5 px-3 border-r border-slate-100">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm select-none">
                                    {row.avatar}
                                  </span>
                                  <input
                                    type="text"
                                    value={row.name}
                                    onChange={(e) =>
                                      handleUpdateRow(idx, 'name', e.target.value)
                                    }
                                    placeholder="เช่น ด.ช. ภูผา ธาราทิพย์"
                                    className="w-full text-xs text-slate-800 border border-transparent hover:border-slate-200 focus:border-sky-400 focus:bg-white rounded p-1 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                                  />
                                </div>
                              </td>

                              {/* 3. ชื่อเล่น / ฉายา */}
                              <td className="py-1.5 px-3 border-r border-slate-100">
                                <input
                                  type="text"
                                  value={row.nickname}
                                  onChange={(e) =>
                                    handleUpdateRow(idx, 'nickname', e.target.value)
                                  }
                                  placeholder="เช่น ภูผา, เจมส์"
                                  className="w-full text-xs text-slate-800 border border-transparent hover:border-slate-200 focus:border-sky-400 focus:bg-white rounded p-1 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                                />
                              </td>

                              {/* เพศ & ไอคอน */}
                              <td className="py-1.5 px-2 text-center border-r border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextGender = row.gender === 'M' ? 'F' : 'M';
                                    const nextAvatar = nextGender === 'M' ? '👦🏻' : '👧🏻';
                                    setStudentRows((prev) => {
                                      const copy = [...prev];
                                      copy[idx] = {
                                        ...copy[idx],
                                        gender: nextGender,
                                        avatar: nextAvatar,
                                      };
                                      return copy;
                                    });
                                  }}
                                  className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                                    row.gender === 'M'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}
                                  title="คลิกเพื่อสลับเพศ ชาย/หญิง"
                                >
                                  {row.gender === 'M' ? '👦 ชาย' : '👧 หญิง'}
                                </button>
                              </td>

                              {/* ลบแถว */}
                              <td className="py-1.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRow(idx)}
                                  className="w-7 h-7 inline-flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                  title="ลบแถวนี้"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer info */}
                  <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                      <span>
                        จำนวนนักเรียนในตาราง:{' '}
                        <strong className="text-slate-800">
                          {studentRows.filter((r) => r.name.trim()).length}
                        </strong>{' '}
                        คน
                      </span>
                      <span>
                        (ชาย{' '}
                        {
                          studentRows.filter(
                            (r) => r.name.trim() && r.gender === 'M'
                          ).length
                        }{' '}
                        คน, หญิง{' '}
                        {
                          studentRows.filter(
                            (r) => r.name.trim() && r.gender === 'F'
                          ).length
                        }{' '}
                        คน)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="text-sky-600 hover:text-sky-800 font-bold text-xs flex items-center gap-1"
                    >
                      <span>＋</span>
                      <span>เพิ่มแถวใหม่ต่อท้าย</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <span>✓</span>
                    <span>
                      {viewMode === 'add'
                        ? `บันทึกห้องเรียนใหม่ (${
                            studentRows.filter((r) => r.name.trim()).length
                          } คน)`
                        : `บันทึกการแก้ไขห้อง ${className}`}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>สลับห้องเพื่อดูผังที่นั่ง งาน และสมุดบันทึกคะแนนของแต่ละชั้น</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
