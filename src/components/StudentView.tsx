import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Assignment,
  AttachedFile,
  Badge,
  ClassRoom,
  ClassroomLayout,
  Student,
  Submission,
  Subject,
  ClassroomAnnouncement,
  RewardItem,
  RewardRedemption,
  AttendanceRecord,
  SystemSettings,
} from '../types';
import { MascotSiby } from './MascotSiby';
import { Desk3DIllustration } from './seating3d/Desk3DIllustration';

interface StudentViewProps {
  students: Student[];
  currentStudentId: string;
  onSelectStudentId: (id: string) => void;
  assignments: Assignment[];
  submissions: Submission[];
  subjects: Subject[];
  badges: Badge[];
  layout: ClassroomLayout;
  classes?: ClassRoom[];
  announcements?: ClassroomAnnouncement[];
  rewards?: RewardItem[];
  redemptions?: RewardRedemption[];
  attendanceRecords?: AttendanceRecord[];
  settings?: SystemSettings;
  onLogout: () => void;
  onBackToTeacher?: () => void;
  onRedeemReward?: (studentId: string, rewardId: string) => void;
  onSubmitHomework: (
    assignmentId: string,
    studentId: string,
    options?: {
      answers?: number[];
      method?: 'file' | 'paper' | 'online' | 'quiz';
      fileData?: { name: string; url: string; size?: number | string };
      paperNote?: string;
    }
  ) => void;
}

export const StudentView: React.FC<StudentViewProps> = ({
  students,
  currentStudentId,
  onSelectStudentId,
  assignments,
  submissions,
  subjects,
  badges,
  layout,
  classes = [],
  announcements = [],
  rewards = [],
  redemptions = [],
  attendanceRecords = [],
  settings,
  onLogout,
  onBackToTeacher,
  onRedeemReward,
  onSubmitHomework,
}) => {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'homework' | 'rewards' | 'announcements' | 'seating' | 'badges'>('homework');
  const [isSelectingProfile, setIsSelectingProfile] = useState<boolean>(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');
  const [searchStudentTerm, setSearchStudentTerm] = useState<string>('');

  // Homework Submission Modals
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [submissionMethodTab, setSubmissionMethodTab] = useState<'file' | 'paper'>('file');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('');
  const [paperSubmissionNote, setPaperSubmissionNote] = useState<string>('ส่งเป็นกระดาษที่โต๊ะครูแล้ว');
  const [studentComment, setStudentComment] = useState<string>('');

  // Quiz Modal State
  const [takingQuizAssignment, setTakingQuizAssignment] = useState<Assignment | null>(null);
  const [quizSelectedAnswers, setQuizSelectedAnswers] = useState<Record<number, number>>({});
  const [viewingAnswerKeyAssignment, setViewingAnswerKeyAssignment] = useState<Assignment | null>(null);

  // Homework filter inside homework tab ('all' | 'pending' | 'submitted')
  const [homeworkFilter, setHomeworkFilter] = useState<'all' | 'pending' | 'submitted'>('all');

  const currentStudent = students.find((s) => s.id === currentStudentId) || students[0];

  // Active classroom object
  const studentClass = classes.find((c) => c.id === currentStudent?.classId);

  // Student's seat in classroom
  const studentDesk = layout.desks.find((d) => d.studentId === currentStudent?.id);

  // Student's assignments (filter by student class)
  const studentAssignments = assignments.filter((a) => a.classId === currentStudent?.classId);

  // Announcements for current student
  const classAnnouncements = announcements.filter(
    (a) => a.classId === 'all' || a.classId === currentStudent?.classId
  );
  const pinnedAnnouncement = classAnnouncements.find((a) => a.isPinned);

  // Student Attendance
  const stuAtt = attendanceRecords.filter((a) => a.studentId === currentStudent?.id);
  const stuAttPercent =
    stuAtt.length > 0
      ? Math.round(
          (stuAtt.filter((a) => a.status === 'present' || a.status === 'late').length / stuAtt.length) * 100
        )
      : 100;

  // Student Redemptions
  const myRedemptions = redemptions.filter((r) => r.studentId === currentStudent?.id);

  // Homework status mapping
  const homeworkItems = studentAssignments.map((asm) => {
    const sub = submissions.find(
      (s) => s.assignmentId === asm.id && s.studentId === currentStudent?.id
    );
    const subRecord: Submission = sub || {
      id: `SUBM-NEW-${asm.id}-${currentStudent?.id}`,
      assignmentId: asm.id,
      studentId: currentStudent?.id || '',
      submittedAt: null,
      status: 'missing',
      maxScore: asm.maxScore,
    };
    return {
      assignment: asm,
      submission: subRecord,
      subject: subjects.find((s) => s.id === asm.subjectId),
    };
  });

  const pendingHomework = homeworkItems.filter((h) => h.submission.status === 'missing');
  const completedHomework = homeworkItems.filter((h) => h.submission.status !== 'missing');

  const filteredHomeworkList =
    homeworkFilter === 'pending'
      ? pendingHomework
      : homeworkFilter === 'submitted'
      ? completedHomework
      : homeworkItems;

  // Submit interactive quiz
  const handleSubmitQuiz = () => {
    if (!takingQuizAssignment || !takingQuizAssignment.questions || !currentStudent) return;

    const answersArray = takingQuizAssignment.questions.map(
      (_, idx) => quizSelectedAnswers[idx] ?? 0
    );

    onSubmitHomework(takingQuizAssignment.id, currentStudent.id, {
      answers: answersArray,
      method: 'quiz',
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    setTakingQuizAssignment(null);
  };

  // Open homework submission dialog
  const handleOpenSubmissionModal = (assignment: Assignment, defaultMethod: 'file' | 'paper' = 'file') => {
    setSubmittingAssignment(assignment);
    setSubmissionMethodTab(defaultMethod);
    setUploadedFileName('');
    setUploadedFileSize('');
    setStudentComment('');
  };

  // Submit file/paper homework
  const handleConfirmSubmitHomework = () => {
    if (!submittingAssignment || !currentStudent) return;

    if (submissionMethodTab === 'file') {
      const fileName = uploadedFileName || `ใบงาน_${submittingAssignment.title}_${currentStudent.name}.pdf`;
      onSubmitHomework(submittingAssignment.id, currentStudent.id, {
        method: 'file',
        fileData: {
          name: fileName,
          url: 'https://example.com/demo-upload.pdf',
          size: uploadedFileSize || '1.8 MB',
        },
      });
    } else {
      onSubmitHomework(submittingAssignment.id, currentStudent.id, {
        method: 'paper',
        paperNote: paperSubmissionNote.trim() || 'ส่งเป็นกระดาษที่โต๊ะครูเรียบร้อยแล้ว',
      });
    }

    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.7 },
    });

    setSubmittingAssignment(null);
  };

  const handleDownloadFile = (file: AttachedFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (size?: number | string) => {
    if (!size) return '';
    if (typeof size === 'number') return `${Math.round(size / 1024)} KB`;
    return String(size);
  };

  const handleSimulateFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setUploadedFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    }
  };

  // Encouraging Mascot Siby quote
  const getEncouragementQuote = () => {
    if (!currentStudent) return '';
    const pendingCount = pendingHomework.length;
    if (pendingCount === 0) {
      return `🎉 ยอดเยี่ยมที่สุดเลยน้อง${currentStudent.nickname}! การบ้านส่งครบสมบูรณ์ 100% แล้ว เก่งมากๆ โฮ่งๆ! 🐾✨`;
    }
    if (pendingCount === 1) {
      return `💪 สู้ๆ น้อง${currentStudent.nickname}! เหลืออีกแค่ 1 งานเท่านั้น รีบส่งเพื่อสะสมแต้ม EXP เลย!`;
    }
    if (pendingCount <= 3) {
      return `โฮ่ง! น้อง${currentStudent.nickname} มีงานรอส่ง ${pendingCount} ชิ้นนะ ส่งเป็นไฟล์หรือส่งที่โต๊ะครูก็ได้ ไซบี้เอาใจช่วย! 🐺`;
    }
    return `น้อง${currentStudent.nickname} ครับ วันนี้มีงานค้าง ${pendingCount} ชิ้นนะ ค่อยๆ วางแผนส่งงานเพื่อเก็บแต้มให้ทันนะ 🌟`;
  };

  // Filter students for profile selection step
  const activeClassIdForSelection = selectedClassFilter || currentStudent?.classId || classes[0]?.id;
  const filteredStudentsForSelection = students
    .filter((s) => !activeClassIdForSelection || s.classId === activeClassIdForSelection)
    .filter(
      (s) =>
        !searchStudentTerm ||
        s.name.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
        s.nickname.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
        String(s.studentNumber).includes(searchStudentTerm)
    );

  // ====================================================
  // SCREEN: SWITCH STUDENT / CLASSROOM PROFILE
  // ====================================================
  if (isSelectingProfile) {
    return (
      <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col p-4 sm:p-6">
        <div className="max-w-2xl w-full mx-auto my-auto bg-white rounded-3xl shadow-2xl text-slate-800 overflow-hidden">
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                <MascotSiby mood="happy" size="sm" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold">สลับชื่อ / เลือกห้องเรียน</h2>
                <p className="text-xs text-sky-100">
                  เลือกห้องและแตะที่ชื่อของตนเองเพื่อดูข้อมูล
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSelectingProfile(false)}
              className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl transition-colors"
            >
              ย้อนกลับ ✕
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Step 1: Select Class */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. เลือกห้องเรียนของคุณ:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {classes.map((cls) => {
                  const isSelected = activeClassIdForSelection === cls.id;
                  const studentCount = students.filter((s) => s.classId === cls.id).length;
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => setSelectedClassFilter(cls.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-300 text-sky-900 font-bold shadow-xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                      }`}
                    >
                      <div className="text-sm font-bold">ห้อง {cls.name}</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                        {studentCount} คน · ครู {cls.advisor}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Search and Select Student */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. แตะเลือกชื่อของคุณ:
                </label>
                <span className="text-xs text-slate-400">
                  {filteredStudentsForSelection.length} คน
                </span>
              </div>

              <input
                type="text"
                placeholder="🔍 ค้นหาด้วยชื่อ เลขที่ หรือชื่อเล่น..."
                value={searchStudentTerm}
                onChange={(e) => setSearchStudentTerm(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto p-1 border border-slate-200 rounded-2xl bg-slate-50">
                {filteredStudentsForSelection.map((s) => {
                  const isCur = s.id === currentStudentId;
                  const pendingCount = assignments.filter((a) => a.classId === s.classId).length;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        onSelectStudentId(s.id);
                        setIsSelectingProfile(false);
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-left transition-all ${
                        isCur
                          ? 'bg-sky-100/80 border-sky-400 ring-2 ring-sky-300 font-bold'
                          : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-lg shrink-0">
                          {s.avatar}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            เลขที่ {s.studentNumber} {s.name} ({s.nickname})
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Lv.{s.level} · ⚡ {s.totalExp} EXP · 🪙 {s.coins}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-sky-600 font-bold shrink-0">
                        เลือก ➔
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onLogout}
                className="text-rose-600 hover:underline font-semibold"
              >
                🚪 ออกจากระบบกลับหน้าแรก
              </button>
              {onBackToTeacher && (
                <button
                  type="button"
                  onClick={onBackToTeacher}
                  className="text-emerald-700 hover:underline font-semibold"
                >
                  👩‍🏫 กลับโหมดครู
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsSelectingProfile(false)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // MAIN FULL-PAGE NATIVE RESPONSIVE STUDENT VIEW
  // ====================================================
  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800 flex flex-col">
      {/* 1. TOP STICKY MOBILE-FIRST HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo & School Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
              <MascotSiby mood="happy" size="sm" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm tracking-tight text-slate-900">
                  ไซบี้ทวงงาน
                </span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-md">
                  โหมดนักเรียน
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                {settings?.schoolName || 'โรงเรียนสาธิตวิทยาคม'} · ภาค {settings?.term || '2'}/{settings?.academicYear || '2569'}
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {onBackToTeacher && (
              <button
                type="button"
                onClick={onBackToTeacher}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors flex items-center gap-1 shadow-xs"
                title="สลับกลับไปยังหน้าจอโหมดคุณครู"
              >
                <span>👩‍🏫</span>
                <span className="hidden sm:inline">กลับโหมดครู</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSelectingProfile(true)}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors flex items-center gap-1"
              title="สลับนักเรียนหรือเลือกห้องเรียนอื่น"
            >
              <span>🔄</span>
              <span className="hidden sm:inline">สลับคน / ห้อง</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1"
              title="ออกจากระบบ"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN SCROLLABLE CONTENT (MAX-W-4XL NATIVE FLOW) */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* HERO STUDENT PROFILE CARD */}
        <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 text-center sm:text-left">
            {/* Avatar & Identity */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative">
                <span className="text-5xl p-3 bg-white/15 rounded-3xl inline-block border border-white/20 backdrop-blur-xs shadow-inner">
                  {currentStudent.avatar}
                </span>
                <span className="absolute -bottom-1 -right-1 text-xs bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full font-bold font-mono shadow-xs">
                  Lv.{currentStudent.level}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    {currentStudent.name}
                  </h1>
                  <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-semibold">
                    ({currentStudent.nickname})
                  </span>
                  <span className="text-xs bg-amber-400 text-amber-950 font-bold px-2.5 py-0.5 rounded-full">
                    ห้อง {studentClass?.name || currentStudent.classId}
                  </span>
                </div>
                <p className="text-xs text-sky-100 mt-1">
                  เลขที่ {currentStudent.studentNumber} · โต๊ะเรียน #{studentDesk?.deskNumber || 'ยังไม่ระบุ'}
                </p>

                {/* Level Progress Bar */}
                <div className="mt-3 max-w-xs w-full">
                  <div className="flex justify-between text-[11px] font-semibold text-sky-100 mb-1">
                    <span>ความก้าวหน้า Level {currentStudent.level}</span>
                    <span>{currentStudent.totalExp % 100} / 100 EXP</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-amber-400 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, currentStudent.totalExp % 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
              <div className="bg-white/15 backdrop-blur-xs rounded-2xl p-2.5 text-center border border-white/10">
                <div className="text-[10px] text-sky-200">แต้ม EXP</div>
                <div className="text-base font-bold text-amber-300 font-mono mt-0.5">
                  ⚡ {currentStudent.totalExp}
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-xs rounded-2xl p-2.5 text-center border border-white/10">
                <div className="text-[10px] text-sky-200">เหรียญ Husky</div>
                <div className="text-base font-bold text-amber-200 font-mono mt-0.5">
                  🪙 {currentStudent.coins}
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-xs rounded-2xl p-2.5 text-center border border-white/10">
                <div className="text-[10px] text-sky-200">งานค้างส่ง</div>
                <div className="text-base font-bold font-mono mt-0.5 text-rose-300">
                  {pendingHomework.length} งาน
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-xs rounded-2xl p-2.5 text-center border border-white/10">
                <div className="text-[10px] text-sky-200">เวลาเรียน</div>
                <div className="text-base font-bold font-mono mt-0.5 text-emerald-300">
                  {stuAttPercent}%
                </div>
              </div>
            </div>
          </div>

          {/* Siby Encouragement Banner */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center gap-2.5 text-xs text-sky-100">
            <span className="text-base">🐺</span>
            <span className="italic">{getEncouragementQuote()}</span>
          </div>
        </div>

        {/* PINNED ANNOUNCEMENT (IF ANY) */}
        {pinnedAnnouncement && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-xl">📢</span>
              <div>
                <div className="font-bold text-amber-950 flex items-center gap-2">
                  <span>{pinnedAnnouncement.title}</span>
                  <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.2 rounded font-bold">
                    ปักหมุดด่วน
                  </span>
                </div>
                <p className="text-amber-800 text-[11px] mt-0.5">{pinnedAnnouncement.content}</p>
              </div>
            </div>
            <span className="text-[10px] text-amber-600 shrink-0 font-mono">
              {pinnedAnnouncement.createdAt}
            </span>
          </div>
        )}

        {/* 3. MOBILE-OPTIMIZED HORIZONTAL NAVIGATION BAR */}
        <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex items-center overflow-x-auto gap-1 select-none">
          <button
            type="button"
            onClick={() => setActiveTab('homework')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'homework'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>📝</span>
            <span>งานของฉัน</span>
            {pendingHomework.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'homework'
                    ? 'bg-amber-400 text-amber-950 font-bold'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {pendingHomework.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seating')}
            className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'seating'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>🪑</span>
            <span>ที่นั่งในห้อง</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'rewards'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>🛍️</span>
            <span>ร้านค้ารางวัล</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'announcements'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>📢</span>
            <span>ประกาศครู</span>
            {classAnnouncements.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full font-mono">
                {classAnnouncements.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('badges')}
            className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'badges'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>🏆</span>
            <span>เหรียญรางวัล</span>
          </button>
        </div>

        {/* 4. TAB CONTENT SECTIONS */}

        {/* === TAB 1: HOMEWORK & SUBMISSIONS === */}
        {activeTab === 'homework' && (
          <div className="space-y-4">
            {/* Filter pills: All, Pending, Submitted */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => setHomeworkFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    homeworkFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทั้งหมด ({homeworkItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHomeworkFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    homeworkFilter === 'pending'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ยังไม่ส่ง ({pendingHomework.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHomeworkFilter('submitted')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    homeworkFilter === 'submitted'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ส่งแล้ว ({completedHomework.length})
                </button>
              </div>

              <div className="text-xs text-slate-500">
                วิชาในห้อง: <strong className="text-slate-700">{subjects.length} วิชา</strong>
              </div>
            </div>

            {/* Empty list state */}
            {filteredHomeworkList.length === 0 && (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-xs space-y-3">
                <div className="text-4xl">🎉</div>
                <h3 className="text-sm font-bold text-slate-800">
                  {homeworkFilter === 'pending' ? 'ไม่มีงานค้างส่งเลย ยอดเยี่ยมมาก!' : 'ไม่มีรายการงาน'}
                </h3>
                <p className="text-xs text-slate-500">
                  คุณครูยังไม่ได้มอบหมายงานใหม่ หรือคุณส่งงานครบเรียบร้อยแล้ว
                </p>
              </div>
            )}

            {/* Homework cards */}
            <div className="space-y-3">
              {filteredHomeworkList.map(({ assignment: asm, submission: sub, subject }) => {
                const isPending = sub.status === 'missing';
                const isScored = typeof sub.score === 'number';

                return (
                  <div
                    key={asm.id}
                    className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all space-y-3 ${
                      isPending ? 'border-amber-200 hover:border-amber-300' : 'border-slate-200'
                    }`}
                  >
                    {/* Top row: Subject, Status pill, Max Score */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: subject?.color || '#0284c7' }}
                        />
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                          {subject?.code || 'ทั่วไป'}
                        </span>
                        <span className="text-xs text-slate-500">{subject?.name}</span>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {sub.status === 'missing' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            ⚠️ ยังไม่ส่ง
                          </span>
                        )}
                        {sub.status === 'submitted' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ ส่งแล้ว
                          </span>
                        )}
                        {sub.status === 'late' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            ⏱️ ส่งล่าช้า
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Assignment Title & Details */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{asm.title}</h3>
                      {asm.description && (
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {asm.description}
                        </p>
                      )}
                    </div>

                    {/* Meta info: Due date, EXP reward, Type */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap pt-1 border-t border-slate-100">
                      <span>📅 กำหนดส่ง: <strong>{asm.dueDate}</strong></span>
                      <span>·</span>
                      <span className="text-amber-700 font-semibold font-mono">
                        ⚡ +{asm.expReward} EXP
                      </span>
                      <span>·</span>
                      <span className="text-slate-600">
                        คะแนนเต็ม: <strong className="text-slate-900">{asm.maxScore}</strong>
                      </span>
                    </div>

                    {/* Score & Feedback if graded */}
                    {isScored && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                        <div className="flex justify-between items-center text-emerald-900 font-bold">
                          <span>คะแนนที่ได้รับ:</span>
                          <span className="text-base font-mono text-emerald-700">
                            {sub.score} / {asm.maxScore} คะแนน
                          </span>
                        </div>
                        {sub.feedback && (
                          <p className="text-[11px] text-emerald-800 pt-1 border-t border-emerald-200">
                            💬 ข้อเสนอแนะจากคุณครู: {sub.feedback}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Attached worksheet file download */}
                    {asm.worksheetFile && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span>📎</span>
                          <span className="font-semibold text-slate-700 truncate">
                            {asm.worksheetFile.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(asm.worksheetFile!)}
                          className="px-2.5 py-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg shrink-0"
                        >
                          📥 ดาวน์โหลด
                        </button>
                      </div>
                    )}

                    {/* Action Buttons for Submitting or Viewing Key */}
                    <div className="flex items-center gap-2 pt-2 flex-wrap">
                      {isPending ? (
                        <>
                          {asm.type === 'quiz' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setTakingQuizAssignment(asm);
                                setQuizSelectedAnswers({});
                              }}
                              className="px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                            >
                              <span>✏️</span>
                              <span>เริ่มทำแบบทดสอบ (Quiz)</span>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenSubmissionModal(asm, 'file')}
                                className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                              >
                                <span>📁</span>
                                <span>ส่งงาน / แนบไฟล์</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenSubmissionModal(asm, 'paper')}
                                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors"
                              >
                                📄 ส่งเป็นกระดาษแล้ว
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span className="text-emerald-600 font-semibold">✓ บันทึกการส่งงานแล้ว</span>
                          {sub.submissionMethod === 'paper' && (
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              ส่งกระดาษที่โต๊ะครู
                            </span>
                          )}
                          {sub.submissionMethod === 'file' && (
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              แนบไฟล์แล้ว ({sub.fileName || 'ไฟล์งาน'})
                            </span>
                          )}
                        </div>
                      )}

                      {/* View Answer Key if released */}
                      {asm.isAnswerKeyVisible && (
                        <button
                          type="button"
                          onClick={() => setViewingAnswerKeyAssignment(asm)}
                          className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl ml-auto"
                        >
                          💡 ดูเฉลย & วิธีทำ
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* === TAB 2: SEATING MAP === */}
        {activeTab === 'seating' && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>🪑 ผังที่นั่งในห้อง {studentClass?.name || 'ของคุณ'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  ตำแหน่งโต๊ะเรียนของคุณถูกเน้นสีฟ้า-ทอง เพื่อให้หาได้ง่าย
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-xl">
                  โต๊ะ #{studentDesk?.deskNumber || 'ยังไม่ระบุ'}
                </span>
              </div>
            </div>

            {/* Board / Screen Position */}
            <div className="w-full py-2 bg-slate-800 text-white text-center text-xs font-bold rounded-xl shadow-xs">
              👨‍🏫 หน้าห้องเรียน (กระดานดำ & โต๊ะครู)
            </div>

            {/* Seating Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-2">
              {layout.desks.map((desk) => {
                const isMyDesk = desk.studentId === currentStudent.id;
                const deskStudent = students.find((s) => s.id === desk.studentId);

                return (
                  <div
                    key={desk.id}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-between min-h-[120px] ${
                      isMyDesk
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400 shadow-md transform scale-105'
                        : deskStudent
                        ? 'bg-white border-slate-200 shadow-2xs'
                        : 'bg-white border-dashed border-slate-200 text-slate-300'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-slate-400">#{desk.deskNumber}</div>
                    
                    {/* Animated 3D Student Desk */}
                    <div className="py-0.5">
                      <Desk3DIllustration
                        student={isMyDesk ? currentStudent : deskStudent}
                        deskNumber={desk.deskNumber}
                        isMyDesk={isMyDesk}
                        actionPose={isMyDesk ? 'cheering' : 'writing'}
                        size="sm"
                      />
                    </div>

                    {isMyDesk ? (
                      <div className="-mt-1">
                        <div className="text-xs font-bold text-amber-950 truncate">
                          โต๊ะของฉัน ⭐
                        </div>
                        <div className="text-[10px] text-amber-800 font-semibold font-mono">
                          ({currentStudent.nickname})
                        </div>
                      </div>
                    ) : deskStudent ? (
                      <div className="-mt-1">
                        <div className="text-[11px] font-semibold text-slate-800 truncate">
                          {deskStudent.nickname}
                        </div>
                        <div className="text-[9px] text-slate-400">เลขที่ {deskStudent.studentNumber}</div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 py-1">โต๊ะว่าง</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* === TAB 3: HUSKY REWARD SHOP === */}
        {activeTab === 'rewards' && (
          <div className="space-y-4">
            {/* Header / Coins balance */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-5 text-white flex items-center justify-between shadow-xs">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <span>🛍️ ร้านค้าของรางวัล Husky Reward</span>
                </h3>
                <p className="text-xs text-amber-100 mt-0.5">
                  ใช้เหรียญที่ได้จากการส่งงานตรงเวลาแลกสิทธิพิเศษและของรางวัลในห้องเรียน
                </p>
              </div>
              <div className="bg-white/20 px-3.5 py-2 rounded-2xl backdrop-blur-xs text-right">
                <div className="text-[10px] text-amber-100">เหรียญคงเหลือ</div>
                <div className="text-lg font-bold font-mono text-white">🪙 {currentStudent.coins}</div>
              </div>
            </div>

            {/* Reward Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {rewards.map((item) => {
                const canAfford = currentStudent.coins >= item.coinCost;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between shadow-xs space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl p-2 bg-amber-50 rounded-2xl border border-amber-100 shrink-0">
                        {item.icon}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-amber-700">
                        🪙 {item.coinCost} เหรียญ
                      </span>
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => {
                          if (onRedeemReward) {
                            onRedeemReward(currentStudent.id, item.id);
                            confetti({ particleCount: 30, spread: 50 });
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs cursor-pointer'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? 'แลกรางวัล 🎁' : 'เหรียญไม่พอ'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* My Redemptions History */}
            {myRedemptions.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  📜 ประวัติการแลกของรางวัลของคุณ:
                </h4>
                <div className="space-y-1.5">
                  {myRedemptions.map((red) => (
                    <div
                      key={red.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{red.rewardTitle}</div>
                        <div className="text-[10px] text-slate-400">{red.redeemedAt}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        อนุมัติแล้ว ✓
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === TAB 4: ANNOUNCEMENTS === */}
        {activeTab === 'announcements' && (
          <div className="space-y-3">
            {classAnnouncements.length === 0 && (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-500">
                ยังไม่มีประกาศใหม่จากคุณครู
              </div>
            )}

            {classAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📢</span>
                    <h3 className="text-sm font-bold text-slate-900">{ann.title}</h3>
                    {ann.isPinned && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        ปักหมุด
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{ann.createdAt}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap pl-6">
                  {ann.content}
                </p>
                <div className="text-[11px] text-slate-400 pt-1 pl-6">
                  ผู้ประกาศ: {ann.author}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === TAB 5: BADGES & EXP TROPHIES === */}
        {activeTab === 'badges' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🏆 ตรารางวัลและความสำเร็จของคุณ</span>
              </h3>
              <p className="text-xs text-slate-500">
                ปลดล็อกเหรียญตราพิเศษจากการส่งงานสม่ำเสมอ ช่วยเหลือเพื่อน และทำคะแนนสอบได้ดี
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {badges.map((b) => {
                  const isUnlocked = currentStudent.badges.includes(b.id);

                  return (
                    <div
                      key={b.id}
                      className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                        isUnlocked
                          ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <span className="text-3xl shrink-0">{b.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{b.title}</span>
                          {isUnlocked && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                              ได้แล้ว
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{b.description}</p>
                        <div className="text-[10px] text-amber-700 font-mono mt-1">
                          โบนัส: +{b.expBonus} EXP
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 5. SUBMISSION MODAL / BOTTOM SHEET (FOR MOBILE ACCESSIBILITY) */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-600 to-indigo-700 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold flex items-center gap-1.5">
                  <span>📤 ส่งงาน: {submittingAssignment.title}</span>
                </h3>
                <p className="text-xs text-sky-100">
                  คะแนนเต็ม {submittingAssignment.maxScore} · ⚡ +{submittingAssignment.expReward} EXP
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmittingAssignment(null)}
                className="p-1 text-white/70 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Method Tabs: File vs Paper */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSubmissionMethodTab('file')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    submissionMethodTab === 'file'
                      ? 'bg-white text-sky-700 shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  📁 แนบไฟล์งาน / รูปภาพ
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionMethodTab('paper')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    submissionMethodTab === 'paper'
                      ? 'bg-white text-sky-700 shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  📄 ส่งเป็นกระดาษที่โต๊ะครู
                </button>
              </div>

              {submissionMethodTab === 'file' ? (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    เลือกไฟล์งานของคุณ (PDF, Word, รูปภาพ):
                  </label>
                  <label className="border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                    <span className="text-3xl mb-1">📁</span>
                    <span className="text-xs font-bold text-sky-900">
                      {uploadedFileName ? uploadedFileName : 'แตะเพื่อเลือกไฟล์จากมือถือหรือคอมพิวเตอร์'}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      {uploadedFileSize ? `ขนาดไฟล์: ${uploadedFileSize}` : 'รองรับรูปถ่ายใบงาน, PDF, เอกสาร'}
                    </span>
                    <input
                      type="file"
                      onChange={handleSimulateFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    ข้อความแจ้งคุณครู (ส่งกระดาษ):
                  </label>
                  <textarea
                    rows={3}
                    value={paperSubmissionNote}
                    onChange={(e) => setPaperSubmissionNote(e.target.value)}
                    placeholder="เช่น ส่งใบงานใส่แฟ้มบนโต๊ะครูเรียบร้อยแล้วครับ..."
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              )}

              {/* Optional Student Comment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเหตุเพิ่มเติมถึงคุณครู (ถ้ามี):
                </label>
                <input
                  type="text"
                  value={studentComment}
                  onChange={(e) => setStudentComment(e.target.value)}
                  placeholder="เช่น ข้อ 3 หนูไม่ค่อยแน่ใจค่ะ..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSubmittingAssignment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmitHomework}
                className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>บันทึกการส่งงาน 🚀</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. INTERACTIVE QUIZ MODAL */}
      {takingQuizAssignment && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-600 to-indigo-700 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold">
                  ✏️ ทำแบบทดสอบ: {takingQuizAssignment.title}
                </h3>
                <p className="text-xs text-sky-100">
                  มี {takingQuizAssignment.questions?.length || 0} ข้อ · คะแนนเต็ม {takingQuizAssignment.maxScore}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTakingQuizAssignment(null)}
                className="p-1 text-white/70 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-6">
              {takingQuizAssignment.questions?.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-start gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-sky-100 text-sky-800 font-mono text-xs">
                      ข้อ {idx + 1}
                    </span>
                    <span>{q.question}</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = quizSelectedAnswers[idx] === optIdx;
                      return (
                        <div
                          key={optIdx}
                          onClick={() =>
                            setQuizSelectedAnswers((prev) => ({ ...prev, [idx]: optIdx }))
                          }
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-sky-100 border-sky-400 text-sky-900 font-bold shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                              isSelected
                                ? 'bg-sky-600 border-sky-600 text-white'
                                : 'border-slate-300 text-slate-500'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                ตอบแล้ว {Object.keys(quizSelectedAnswers).length} / {takingQuizAssignment.questions?.length || 0} ข้อ
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTakingQuizAssignment(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors"
                >
                  ส่งคำตอบแบบทดสอบ 🚀
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. ANSWER KEY & SOLUTION VIEWER */}
      {viewingAnswerKeyAssignment && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <span>💡 เฉลยและคำอธิบาย: {viewingAnswerKeyAssignment.title}</span>
                </h3>
                <p className="text-xs text-indigo-100">เผยแพร่โดยคุณครูผู้สอน</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingAnswerKeyAssignment(null)}
                className="p-1 text-white/70 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {viewingAnswerKeyAssignment.solutionNotes && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-1">
                  <div className="font-bold">📝 สรุปแนวคิด / วิธีทำ:</div>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {viewingAnswerKeyAssignment.solutionNotes}
                  </p>
                </div>
              )}

              {viewingAnswerKeyAssignment.answerKeyFile && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span>📄</span>
                    <span className="font-semibold text-slate-700 truncate">
                      {viewingAnswerKeyAssignment.answerKeyFile.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(viewingAnswerKeyAssignment.answerKeyFile!)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                  >
                    ดาวน์โหลดเฉลย 📥
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setViewingAnswerKeyAssignment(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
