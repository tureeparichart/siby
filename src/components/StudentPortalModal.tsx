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

interface StudentPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  onLogout?: () => void;
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

export const StudentPortalModal: React.FC<StudentPortalModalProps> = ({
  isOpen,
  onClose,
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
  onRedeemReward,
  onSubmitHomework,
}) => {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'homework' | 'rewards' | 'announcements' | 'seating' | 'badges'>('homework');
  const [isSelectingProfile, setIsSelectingProfile] = useState<boolean>(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');

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

  if (!isOpen) return null;

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
    setPaperSubmissionNote('ส่งเป็นกระดาษที่โต๊ะครูเรียบร้อย');
    setStudentComment('');
  };

  // Confirm file or paper submission
  const handleConfirmSubmission = () => {
    if (!submittingAssignment || !currentStudent) return;

    if (submissionMethodTab === 'file') {
      const fileName = uploadedFileName.trim() || `ใบงาน_${submittingAssignment.title}_${currentStudent.nickname}.pdf`;
      const fileSize = uploadedFileSize || '1.4 MB';

      onSubmitHomework(submittingAssignment.id, currentStudent.id, {
        method: 'file',
        fileData: {
          name: fileName,
          url: '#',
          size: fileSize,
        },
      });
    } else {
      // Paper submission
      onSubmitHomework(submittingAssignment.id, currentStudent.id, {
        method: 'paper',
        paperNote: paperSubmissionNote.trim() || 'ส่งเป็นกระดาษที่โต๊ะครูแล้ว',
      });
    }

    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.6 },
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

  // Simulated file upload selector
  const handleSimulateFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setUploadedFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    }
  };

  // ----------------------------------------------------
  // ENCOURAGING MASCOT QUOTE GENERATOR
  // ----------------------------------------------------
  const getEncouragementQuote = () => {
    if (!currentStudent) return '';
    const pendingCount = pendingHomework.length;
    if (pendingCount === 0) {
      return `🎉 ยอดเยี่ยมที่สุดเลยน้อง${currentStudent.nickname}! งานทุกชิ้นส่งครบสมบูรณ์แล้ว น้องไซบี้ขอปรบมือให้ดังๆ โฮ่งๆ! 🐾✨`;
    }
    if (pendingCount === 1) {
      return `💪 สู้ๆ ครับน้อง${currentStudent.nickname}! เหลืออีกเพียง 1 งานเท่านั้น จะพิชิตภารกิจครบ 100% แล้ว รีบส่งเพื่อสะสมแต้ม EXP เลย!`;
    }
    if (pendingCount <= 3) {
      return `โฮ่ง! น้อง${currentStudent.nickname} มีงานรอส่ง ${pendingCount} ชิ้นนะ ค่อยๆ ทำทีละชิ้น หรือส่งเป็นกระดาษที่โต๊ะครูก็ได้ ไซบี้เอาใจช่วยเสมอครับ!`;
    }
    return `น้อง${currentStudent.nickname} ครับ วันนี้มีงานค้าง ${pendingCount} ชิ้นนะ วางแผนจัดการเวลาและเลือกส่งเป็นไฟล์หรือกระดาษได้เลย ไซบี้เป็นกำลังใจให้เต็มที่! 🌟`;
  };

  // Filter students for profile selection step
  const activeClassIdForSelection = selectedClassFilter || currentStudent?.classId || classes[0]?.id;
  const filteredStudentsForSelection = students.filter(
    (s) => !activeClassIdForSelection || s.classId === activeClassIdForSelection
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* ==================================================== */}
        {/* STEP 1 & 2: ONBOARDING PROFILE PICKER                */}
        {/* ==================================================== */}
        {isSelectingProfile ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MascotSiby mood="happy" size="sm" />
                <div>
                  <h2 className="text-base font-bold">เข้าสู่ระบบโหมดนักเรียน (Student Portal)</h2>
                  <p className="text-xs text-sky-100">
                    ขั้นตอนที่ 1: เลือกห้องเรียน → ขั้นตอนที่ 2: แตะเลือกชื่อของตัวเอง
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectingProfile(false)}
                className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl transition-colors"
              >
                กลับหน้าเดิม ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Step 1: Classroom Selection */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <span>🏫 ขั้นตอนที่ 1: เลือกห้องเรียนของคุณ</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {classes.map((cls) => {
                    const isSelected = activeClassIdForSelection === cls.id;
                    const studentCount = students.filter((s) => s.classId === cls.id).length;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => setSelectedClassFilter(cls.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300 text-indigo-900 font-bold shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="text-sm font-bold">{cls.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {studentCount} คน
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Student Name Selection */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>👤 ขั้นตอนที่ 2: แตะเลือกชื่อของตัวเอง ({filteredStudentsForSelection.length} คน)</span>
                  <span className="text-[11px] text-indigo-600 font-normal">
                    ห้อง {classes.find((c) => c.id === activeClassIdForSelection)?.name || activeClassIdForSelection}
                  </span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {filteredStudentsForSelection.map((s) => {
                    const isCurrent = currentStudent?.id === s.id;
                    const pendingForStu = assignments.filter((a) => a.classId === s.classId)
                      .filter((a) => {
                        const sub = submissions.find((sub) => sub.assignmentId === a.id && sub.studentId === s.id);
                        return !sub || sub.status === 'missing';
                      }).length;

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          onSelectStudentId(s.id);
                          setIsSelectingProfile(false);
                          confetti({ particleCount: 30, spread: 50 });
                        }}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                          isCurrent
                            ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-300 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-3xl p-1.5 bg-slate-100 rounded-xl shrink-0">
                          {s.avatar}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-slate-400">
                              #{s.studentNumber}
                            </span>
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {s.nickname}
                            </span>
                            <span className="text-[10px] bg-amber-100 text-amber-900 font-mono px-1 rounded">
                              Lv.{s.level}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {s.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px]">
                            <span className="text-sky-700 font-mono font-medium">⚡ {s.totalExp} EXP</span>
                            {pendingForStu > 0 ? (
                              <span className="text-amber-700 font-medium">ค้าง {pendingForStu} งาน</span>
                            ) : (
                              <span className="text-emerald-600 font-medium">ครบ ✓</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>💡 เลือกรหัสและชื่อของตนเองเพื่อดูงาน คะแนน และส่งงาน</span>
              <button
                type="button"
                onClick={() => setIsSelectingProfile(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        ) : (
          /* ==================================================== */
          /* REGULAR STUDENT PORTAL VIEW                          */
          /* ==================================================== */
          <>
            {/* Student Profile Header Banner */}
            <div className="p-5 bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <span className="text-4xl p-2.5 bg-white/10 rounded-2xl inline-block border border-white/20">
                    {currentStudent.avatar}
                  </span>
                  <span className="absolute -bottom-1 -right-1 text-xs bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded-full font-bold font-mono">
                    Lv.{currentStudent.level}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold">{currentStudent.name}</h2>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      ({currentStudent.nickname})
                    </span>
                    <span className="text-xs bg-amber-400/90 text-amber-950 font-bold px-2 py-0.5 rounded-full">
                      ห้อง {studentClass?.name || currentStudent.classId}
                    </span>
                  </div>
                  <div className="text-[11px] text-sky-200/90 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>เลขที่ {currentStudent.studentNumber}</span>
                    <span>·</span>
                    <span>ที่นั่ง: โต๊ะ #{studentDesk?.deskNumber || 'ยังไม่ระบุ'}</span>
                    {settings?.schoolName && (
                      <>
                        <span>·</span>
                        <span className="text-sky-300 font-medium">
                          {settings.schoolName} (ภาค {settings.term}/{settings.academicYear})
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs font-mono-numbers flex-wrap">
                    <span className="text-amber-300 font-bold">⚡ {currentStudent.totalExp} EXP</span>
                    <span className="text-white/60">·</span>
                    <span className="text-amber-200 font-medium">🪙 {currentStudent.coins} เหรียญ</span>
                    <span className="text-white/60">·</span>
                    <span className="text-orange-300">🔥 Streak {currentStudent.streak}</span>
                    <span className="text-white/60">·</span>
                    <span className="text-emerald-300 font-semibold">⏱️ เวลาเรียน {stuAttPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Switch Profile or Logout */}
              <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsSelectingProfile(true)}
                  className="px-3 py-1.5 text-xs font-bold bg-white text-indigo-900 hover:bg-sky-50 rounded-xl transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-end"
                >
                  <span>🔄 สลับห้อง / เลือกชื่อตัวเอง</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onLogout) {
                      onLogout();
                    } else {
                      onClose();
                    }
                  }}
                  className="px-3 py-1 text-xs text-rose-200 hover:text-white bg-rose-500/30 hover:bg-rose-500/50 border border-rose-300/30 rounded-lg self-start sm:self-end transition-colors flex items-center gap-1"
                >
                  <span>🚪 ออกจากระบบ / สลับผู้ใช้</span>
                </button>
              </div>
            </div>

            {/* Pinned Announcement Alert Banner */}
            {pinnedAnnouncement && (
              <div className="mx-5 mt-4 p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 bg-amber-200 rounded-lg text-amber-900 text-sm">📢</span>
                  <div>
                    <div className="font-bold text-amber-950 flex items-center gap-2">
                      <span>{pinnedAnnouncement.title}</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-semibold">
                        ปักหมุด
                      </span>
                    </div>
                    <div className="text-slate-600 text-[11px] mt-0.5 line-clamp-1">
                      {pinnedAnnouncement.content}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('announcements')}
                  className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold rounded-lg text-[11px] shrink-0"
                >
                  อ่านประกาศ &rarr;
                </button>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="px-5 border-b border-slate-200 bg-slate-50 flex items-center gap-2 pt-2 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('homework')}
                className={`px-3 sm:px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'homework'
                    ? 'border-sky-600 text-sky-700 bg-white rounded-t-lg font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                📚 การบ้านและงาน ({pendingHomework.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rewards')}
                className={`px-3 sm:px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'rewards'
                    ? 'border-sky-600 text-sky-700 bg-white rounded-t-lg font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                🎁 ร้านค้าแลกรางวัล ({rewards.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('announcements')}
                className={`px-3 sm:px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'announcements'
                    ? 'border-sky-600 text-sky-700 bg-white rounded-t-lg font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                📢 ประกาศ ({classAnnouncements.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('seating')}
                className={`px-3 sm:px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'seating'
                    ? 'border-sky-600 text-sky-700 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                🪑 ที่นั่งในห้อง
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('badges')}
                className={`px-3 sm:px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'badges'
                    ? 'border-sky-600 text-sky-700 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                🎖️ ตรารางวัล ({currentStudent.badges.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {activeTab === 'homework' && (
                <div className="space-y-4">
                  {/* Mascot Encouragement Box */}
                  <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 flex items-center gap-4 shadow-2xs">
                    <MascotSiby
                      mood={pendingHomework.length > 0 ? 'remind' : 'cheer'}
                      size="md"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-sky-950">
                        {getEncouragementQuote()}
                      </h4>
                      <p className="text-[11px] text-sky-800 mt-1">
                        💡 งานทุกชิ้นสามารถเลือกส่งได้ทั้ง <strong>แบบไฟล์ (Upload)</strong> หรือ <strong>ส่งเป็นกระดาษที่โต๊ะครู</strong>
                      </p>
                    </div>
                  </div>

                  {/* Pending Assignments */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      งานที่ยังไม่ส่ง ({pendingHomework.length})
                    </h3>
                    {pendingHomework.length === 0 ? (
                      <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-dashed border-slate-200">
                        ✨ ไม่มีงานค้างเลย ยอดเยี่ยมมาก!
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingHomework.map(({ assignment, subject }) => (
                          <div
                            key={assignment.id}
                            className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                                    {subject?.code}
                                  </span>
                                  <span className="text-xs font-bold text-slate-800">
                                    {assignment.title}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                                    {assignment.type === 'quiz' ? '📝 แบบทดสอบปรนัย' : assignment.type === 'worksheet' ? '📄 ใบงาน' : '👥 งานกลุ่ม'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 mt-1">
                                  {assignment.description}
                                </p>
                                <div className="text-[10px] text-amber-700 mt-1.5 flex items-center gap-2 flex-wrap font-mono-numbers">
                                  <span>⏰ กำหนดส่ง: {new Date(assignment.dueDate).toLocaleString('th-TH')}</span>
                                  <span>·</span>
                                  <span>เต็ม {assignment.maxScore} คะแนน (+{assignment.expReward} EXP)</span>
                                </div>
                              </div>

                              {/* Submission Action Buttons */}
                              <div className="shrink-0 flex items-center gap-2 flex-wrap">
                                {assignment.type === 'quiz' ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTakingQuizAssignment(assignment);
                                      setQuizSelectedAnswers({});
                                    }}
                                    className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors"
                                  >
                                    ✍️ ทำแบบทดสอบ
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    {/* Submit as File button */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenSubmissionModal(assignment, 'file')}
                                      className="px-3 py-1.5 text-xs font-bold text-sky-800 bg-sky-100 hover:bg-sky-200 border border-sky-300 rounded-xl shadow-2xs transition-colors flex items-center gap-1"
                                      title="อัปโหลดไฟล์ส่งงาน"
                                    >
                                      <span>📁 ส่งแบบไฟล์</span>
                                    </button>

                                    {/* Submit as Paper button */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenSubmissionModal(assignment, 'paper')}
                                      className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl shadow-2xs transition-colors flex items-center gap-1"
                                      title="ส่งเป็นกระดาษที่โต๊ะครู"
                                    >
                                      <span>📄 ส่งเป็นกระดาษ</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Attached Files & Answer Key Section */}
                            <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between gap-2 flex-wrap text-xs">
                              {/* Worksheet file */}
                              <div className="flex items-center gap-2">
                                {assignment.worksheetFile ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadFile(assignment.worksheetFile!)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 text-[11px] font-medium transition-colors border border-sky-200"
                                    title="ดาวน์โหลดใบงานจาก Google Drive"
                                  >
                                    <span>📄 ดาวน์โหลดใบงาน ({assignment.worksheetFile.name})</span>
                                    <span className="text-[10px] text-sky-600 font-mono">({formatFileSize(assignment.worksheetFile.size)})</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-slate-400">ไม่มีไฟล์ใบงานแนบ</span>
                                )}
                              </div>

                              {/* Answer key status */}
                              <div>
                                {assignment.isAnswerKeyVisible ? (
                                  <button
                                    type="button"
                                    onClick={() => setViewingAnswerKeyAssignment(assignment)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold transition-colors border border-emerald-300 shadow-xs"
                                  >
                                    <span>🔓 ดูเฉลยและวิธีทำละเอียด</span>
                                  </button>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-medium border border-slate-200"
                                    title="คุณครูจะเปิดให้ดูเฉลยเมื่อถึงเวลาเฉลยหรือส่งงานครบ"
                                  >
                                    <span>🔒 เฉลยยังไม่เปิดให้ดู</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Completed Assignments */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      งานที่ส่งแล้ว ({completedHomework.length})
                    </h3>
                    <div className="space-y-2.5">
                      {completedHomework.map(({ assignment, submission, subject }) => (
                        <div
                          key={assignment.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-col gap-2.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800">
                                  [{subject?.code}] {assignment.title}
                                </span>
                                {submission.submissionMethod === 'paper' && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                                    📄 ส่งเป็นกระดาษ
                                  </span>
                                )}
                                {submission.submissionMethod === 'file' && (
                                  <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.2 rounded">
                                    📁 ส่งไฟล์ {submission.fileName && `(${submission.fileName})`}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                สถานะ: {submission.status === 'submitted' ? 'ส่งตรงเวลา ✓' : 'ส่งสาย ⏳'}
                                {submission.paperNote && ` · "${submission.paperNote}"`}
                                {submission.feedback && ` · "${submission.feedback}"`}
                              </div>
                            </div>
                            <div className="text-right font-mono-numbers">
                              <span className="font-bold text-emerald-600 text-sm">
                                {submission.score !== undefined ? `${submission.score}/${assignment.maxScore}` : 'รอตรวจ'}
                              </span>
                            </div>
                          </div>

                          {/* Worksheet & Answer key toolbar */}
                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap text-xs">
                            <div className="flex items-center gap-2">
                              {assignment.worksheetFile && (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFile(assignment.worksheetFile!)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200/70 hover:bg-slate-300 text-slate-700 text-[10px] font-medium transition-colors"
                                >
                                  <span>📄 ใบงาน: {assignment.worksheetFile.name}</span>
                                </button>
                              )}
                            </div>

                            <div>
                              {assignment.isAnswerKeyVisible ? (
                                <button
                                  type="button"
                                  onClick={() => setViewingAnswerKeyAssignment(assignment)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors"
                                >
                                  <span>🔓 ตรวจสอบเฉลย & วิธีทำ</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                  <span>🔒 ครูยังไม่เปิดให้ดูเฉลย</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'seating' && (
                <div className="space-y-4">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                    <span className="text-4xl">🪑</span>
                    <h4 className="text-sm font-bold text-slate-800">
                      โต๊ะประจำของน้อง{currentStudent.nickname}: โต๊ะ #{studentDesk?.deskNumber || '1'}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      ตั้งอยู่ในห้องเรียน {studentClass?.name || currentStudent.classId} คุณครูสามารถแตะโต๊ะเพื่อแจกแต้มความดีและ EXP ระหว่างเรียนได้
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'badges' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {badges.map((b) => {
                    const isEarned = currentStudent.badges.includes(b.id);
                    return (
                      <div
                        key={b.id}
                        className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                          isEarned
                            ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 opacity-50'
                        }`}
                      >
                        <span className="text-3xl">{b.icon}</span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            {b.title} {isEarned && '✓'}
                          </h4>
                          <p className="text-[10px] text-slate-500">{b.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Rewards Shop Tab */}
              {activeTab === 'rewards' && (
                <div className="space-y-5">
                  {/* Coin Balance Banner */}
                  <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 p-5 rounded-2xl text-amber-950 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/30 backdrop-blur-xs rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                        🪙
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-amber-900">เหรียญทองสะสมของคุณ</div>
                        <div className="text-2xl font-bold font-mono">
                          {currentStudent.coins} <span className="text-xs font-normal">เหรียญ</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs max-w-xs text-amber-900 hidden sm:block">
                      💡 ส่งงานตรงเวลา ได้รับ +10 EXP และสะสมเหรียญไปแลกรางวัลคูปองสิทธิพิเศษได้เลย!
                    </div>
                  </div>

                  {/* Rewards Catalog */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      รายการรางวัลและคูปองที่แลกได้ ({rewards.length} รายการ)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {rewards.map((rew) => {
                        const canAfford = currentStudent.coins >= rew.coinCost;
                        return (
                          <div
                            key={rew.id}
                            className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between gap-3 hover:border-amber-300 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-3xl p-2 bg-slate-50 rounded-xl shrink-0">{rew.icon}</span>
                              <div className="space-y-1">
                                <h4 className="font-bold text-slate-900 text-xs">{rew.title}</h4>
                                <p className="text-[11px] text-slate-500 leading-relaxed">{rew.description}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <span className="text-xs font-bold text-amber-600 font-mono">
                                🪙 {rew.coinCost} เหรียญ
                              </span>
                              <button
                                type="button"
                                disabled={!canAfford}
                                onClick={() => {
                                  if (onRedeemReward && canAfford) {
                                    onRedeemReward(currentStudent.id, rew.id);
                                    confetti({ particleCount: 40, spread: 50 });
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                                  canAfford
                                    ? 'bg-amber-400 hover:bg-amber-300 text-amber-950 cursor-pointer active:scale-95'
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
                  </div>

                  {/* My Redeemed Coupons */}
                  {myRedemptions.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-slate-200">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        คูปองที่คุณแลกแล้ว ({myRedemptions.length} รายการ)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {myRedemptions.map((r) => (
                          <div
                            key={r.id}
                            className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-800">{r.rewardTitle}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                แลกเมื่อ: {r.redeemedAt} · ใช้ไป {r.coinCost} เหรียญ
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : r.status === 'used'
                                  ? 'bg-slate-200 text-slate-600'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {r.status === 'approved' ? '✓ พร้อมใช้งาน' : r.status === 'used' ? 'ใช้แล้ว' : '⏳ รอครูอนุมัติ'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Announcements Tab */}
              {activeTab === 'announcements' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      กระดานประกาศห้องเรียน ({classAnnouncements.length})
                    </h3>
                  </div>

                  {classAnnouncements.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      ยังไม่มีประกาศใหม่ในห้องเรียนนี้
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {classAnnouncements.map((ann) => (
                        <div
                          key={ann.id}
                          className={`p-4 rounded-xl border transition-all ${
                            ann.isPinned
                              ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-200'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {ann.isPinned && (
                                <span className="text-[10px] font-bold bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded">
                                  📌 ปักหมุด
                                </span>
                              )}
                              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{ann.title}</h4>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {ann.createdAt}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 mt-2 leading-relaxed whitespace-pre-line">
                            {ann.content}
                          </p>
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                            <span>ผู้ประกาศ: {ann.author}</span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                              ห้อง {ann.classId === 'all' ? 'ทุกห้อง' : studentClass?.name || ann.classId}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 px-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                ระบบไซบี้ทวงงาน — โหมดนักเรียน 🎒
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </>
        )}
      </div>

      {/* ==================================================== */}
      {/* SUBMIT HOMEWORK MODAL (CHOICE: FILE VS PAPER)         */}
      {/* ==================================================== */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 px-5 border-b border-slate-100 bg-sky-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ส่งงาน: {submittingAssignment.title}
                </h3>
                <p className="text-[11px] text-slate-500">
                  เลือกส่งแบบไฟล์ หรือส่งเป็นกระดาษที่โต๊ะครู
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmittingAssignment(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Method Tabs: File vs Paper */}
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSubmissionMethodTab('file')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    submissionMethodTab === 'file'
                      ? 'border-sky-600 bg-sky-50 text-sky-950 ring-2 ring-sky-200 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>📁 ส่งแบบไฟล์ (Upload)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal mt-1">
                    แนบไฟล์ PDF, รูปภาพ หรือเอกสาร
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSubmissionMethodTab('paper')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    submissionMethodTab === 'paper'
                      ? 'border-amber-600 bg-amber-50 text-amber-950 ring-2 ring-amber-200 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>📄 ส่งเป็นกระดาษ</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal mt-1">
                    ส่งชิ้นงานจริงที่โต๊ะครู
                  </p>
                </button>
              </div>

              {/* Form Tab 1: File Upload */}
              {submissionMethodTab === 'file' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      เลือกไฟล์เพื่อส่งงาน:
                    </label>
                    <div className="border-2 border-dashed border-sky-300 rounded-xl p-4 text-center bg-sky-50/40 hover:bg-sky-50 transition-colors">
                      <input
                        type="file"
                        onChange={handleSimulateFileSelect}
                        className="hidden"
                        id="student-file-upload-input"
                      />
                      <label
                        htmlFor="student-file-upload-input"
                        className="cursor-pointer flex flex-col items-center gap-1.5"
                      >
                        <span className="text-2xl">📤</span>
                        <span className="font-bold text-sky-700 text-xs">
                          {uploadedFileName ? 'เปลี่ยนไฟล์ที่เลือก' : 'แตะเพื่อเลือกไฟล์จากเครื่อง'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          รองรับ PDF, JPG, PNG, DOCX (สูงสุด 25MB)
                        </span>
                      </label>
                    </div>

                    {uploadedFileName && (
                      <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                        <span className="truncate font-medium">📎 {uploadedFileName}</span>
                        <span className="text-[10px] font-mono shrink-0 ml-2 text-emerald-700">{uploadedFileSize}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Tab 2: Paper Submission */}
              {submissionMethodTab === 'paper' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                    <div className="font-bold mb-1 flex items-center gap-1">
                      <span>📄 ส่งชิ้นงานเป็นกระดาษ:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      เมื่อน้องกดส่ง ระบบจะบันทึกสถานะว่าน้องได้นำใบงานกระดาษไปวางส่งที่โต๊ะคุณครูแล้ว และแจ้งเตือนคุณครูให้ตรวจให้คะแนน
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      ระบุสถานที่ / เวลาส่ง:
                    </label>
                    <input
                      type="text"
                      value={paperSubmissionNote}
                      onChange={(e) => setPaperSubmissionNote(e.target.value)}
                      placeholder="เช่น ส่งที่โต๊ะครูปาริชาติ ห้อง 3103 ช่วงพักเที่ยง"
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Student Comment to Teacher */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ข้อความถึงคุณครู (ถ้ามี):
                </label>
                <input
                  type="text"
                  value={studentComment}
                  onChange={(e) => setStudentComment(e.target.value)}
                  placeholder="เช่น ทำเสร็จเรียบร้อยครับ, ข้อ 4 เขียนอธิบายเพิ่ม"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 px-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSubmittingAssignment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmission}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                ✓ ยืนยันการส่งงาน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAKING QUIZ MODAL                                    */}
      {/* ==================================================== */}
      {takingQuizAssignment && takingQuizAssignment.questions && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {takingQuizAssignment.title}
                </h3>
                <p className="text-xs text-slate-500">
                  ตอบคำถามให้ครบทุกข้อ แล้วกดส่งเพื่อรับคะแนนและ EXP ทันที
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTakingQuizAssignment(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {takingQuizAssignment.questions.map((q, qIndex) => (
                <div key={q.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="text-xs font-bold text-slate-800">
                    ข้อที่ {qIndex + 1}. {q.question} ({q.points} คะแนน)
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {q.options.map((opt, optIndex) => (
                      <label
                        key={optIndex}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          quizSelectedAnswers[qIndex] === optIndex
                            ? 'bg-sky-50 border-sky-400 text-sky-900 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`quiz-q-${qIndex}`}
                          checked={quizSelectedAnswers[qIndex] === optIndex}
                          onChange={() =>
                            setQuizSelectedAnswers((prev) => ({
                              ...prev,
                              [qIndex]: optIndex,
                            }))
                          }
                          className="text-sky-600 focus:ring-sky-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                ตอบแล้ว: {Object.keys(quizSelectedAnswers).length}/{takingQuizAssignment.questions.length} ข้อ
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTakingQuizAssignment(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs"
                >
                  ส่งคำตอบและรับคะแนน
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEWING ANSWER KEY & EXPLANATIONS MODAL             */}
      {/* ==================================================== */}
      {viewingAnswerKeyAssignment && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 bg-emerald-50/50 -m-6 mb-2 p-5 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    🔓 เฉลยอย่างเป็นทางการ
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {viewingAnswerKeyAssignment.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  เฉลยและวิธีทำละเอียดที่คุณครูเปิดให้นักเรียนศึกษา
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingAnswerKeyAssignment(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {viewingAnswerKeyAssignment.answerKeyFile && (
              <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-sky-900">
                    📄 ไฟล์เฉลย: {viewingAnswerKeyAssignment.answerKeyFile.name}
                  </div>
                  <div className="text-[10px] text-sky-700 font-mono">
                    Google Drive · {formatFileSize(viewingAnswerKeyAssignment.answerKeyFile.size)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadFile(viewingAnswerKeyAssignment.answerKeyFile!)}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 text-white font-bold hover:bg-sky-700 shadow-xs"
                >
                  ดาวน์โหลดไฟล์เฉลย
                </button>
              </div>
            )}

            {viewingAnswerKeyAssignment.solutionNotes && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <h4 className="text-xs font-bold text-slate-800">คำอธิบายและแนวคิดวิธีทำ:</h4>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {viewingAnswerKeyAssignment.solutionNotes}
                </p>
              </div>
            )}

            {viewingAnswerKeyAssignment.questions && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  เฉลยรายข้อ ({viewingAnswerKeyAssignment.questions.length} ข้อ)
                </h4>
                {viewingAnswerKeyAssignment.questions.map((q, idx) => (
                  <div key={q.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs">
                    <div className="font-bold text-slate-900">
                      ข้อ {idx + 1}. {q.question}
                    </div>
                    <div className="text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      คำตอบที่ถูกต้อง: {q.options[q.correctOptionIndex]}
                    </div>
                    {q.explanation && (
                      <div className="text-[11px] text-slate-600 pl-1">
                        💡 <em>คำอธิบาย:</em> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-slate-100 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingAnswerKeyAssignment(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                ปิดหน้าต่างเฉลย
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
