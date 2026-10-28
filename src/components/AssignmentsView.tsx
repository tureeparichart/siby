import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Assignment,
  AssignmentType,
  AttachedFile,
  ClassRoom,
  QuizQuestion,
  Student,
  Submission,
  Subject,
} from '../types';
import { MascotSiby } from './MascotSiby';

interface AssignmentsViewProps {
  assignments: Assignment[];
  classes: ClassRoom[];
  subjects: Subject[];
  students: Student[];
  submissions: Submission[];
  onAddAssignment: (assignment: Assignment) => void;
  onUpdateAssignment: (assignment: Assignment) => void;
  onUpdateSubmission: (submission: Submission) => void;
  onOpenReminderModal: () => void;
  googleDriveFolderName?: string;
  onOpenClassManager?: () => void;
  onOpenSubjectManager?: () => void;
  onNavigateToZipGrade?: () => void;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  assignments,
  classes,
  subjects,
  students,
  submissions,
  onAddAssignment,
  onUpdateAssignment,
  onUpdateSubmission,
  onOpenReminderModal,
  googleDriveFolderName = 'ไซบี้ทวงงาน_ใบงานและเฉลย_2569',
  onOpenClassManager,
  onOpenSubjectManager,
  onNavigateToZipGrade,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Currently viewing assignment for submission details / grading
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(
    assignments[0]?.id || null
  );

  // Modal to create assignment
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newType, setNewType] = useState<AssignmentType>('worksheet');
  const [newSubjectId, setNewSubjectId] = useState<string>(subjects[0]?.id || '');
  const [newClassId, setNewClassId] = useState<string>(classes[0]?.id || '');
  const [newDueDate, setNewDueDate] = useState<string>('2026-10-30T23:59');
  const [newMaxScore, setNewMaxScore] = useState<number>(10);
  const [newExpReward, setNewExpReward] = useState<number>(15);
  
  // Files and Answer key state in create modal
  const [newWorksheetFile, setNewWorksheetFile] = useState<AttachedFile | null>(null);
  const [newAnswerKeyFile, setNewAnswerKeyFile] = useState<AttachedFile | null>(null);
  const [newSolutionNotes, setNewSolutionNotes] = useState<string>('');
  const [newIsAnswerKeyVisible, setNewIsAnswerKeyVisible] = useState<boolean>(false);

  // Modal to edit files / answer key of existing assignment
  const [editingAssignmentFiles, setEditingAssignmentFiles] = useState<Assignment | null>(null);

  // Modal to preview answer key
  const [previewAnswerAssignment, setPreviewAnswerAssignment] = useState<Assignment | null>(null);

  // Optional quiz questions builder inside create modal
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    {
      id: 'Q-1',
      question: 'โจทย์คำถามข้อที่ 1...',
      options: ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง'],
      correctOptionIndex: 0,
      points: 5,
    },
    {
      id: 'Q-2',
      question: 'โจทย์คำถามข้อที่ 2...',
      options: ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง'],
      correctOptionIndex: 1,
      points: 5,
    },
  ]);

  // Grading Modal for single submission
  const [gradingSubmission, setGradingSubmission] = useState<{
    submission: Submission;
    student: Student;
  } | null>(null);
  const [inputScore, setInputScore] = useState<number>(10);
  const [inputFeedback, setInputFeedback] = useState<string>('');

  // Filtering
  const filteredAssignments = assignments.filter((a) => {
    if (selectedClassId !== 'all' && a.classId !== selectedClassId) return false;
    if (selectedSubjectId !== 'all' && a.subjectId !== selectedSubjectId) return false;
    if (selectedType !== 'all' && a.type !== selectedType) return false;
    return true;
  });

  const activeAssignment = assignments.find((a) => a.id === activeAssignmentId);
  const activeSubject = subjects.find((s) => s.id === activeAssignment?.subjectId);
  const activeClass = classes.find((c) => c.id === activeAssignment?.classId);

  // Students belonging to the active assignment's class
  const classStudents = students.filter((s) => s.classId === activeAssignment?.classId);

  // Map student submissions
  const studentSubmissionRows = classStudents.map((stu) => {
    const sub = submissions.find(
      (s) => s.assignmentId === activeAssignment?.id && s.studentId === stu.id
    );
    return {
      student: stu,
      submission: sub || {
        id: `SUBM-TEMP-${stu.id}`,
        assignmentId: activeAssignment?.id || '',
        studentId: stu.id,
        submittedAt: null,
        status: 'missing' as const,
        maxScore: activeAssignment?.maxScore || 10,
      },
    };
  });

  // Toggle Answer Key visibility directly
  const handleToggleAnswerKey = (assignmentId: string, currentStatus?: boolean) => {
    const asm = assignments.find((a) => a.id === assignmentId);
    if (!asm) return;

    const updated: Assignment = {
      ...asm,
      isAnswerKeyVisible: !currentStatus,
    };

    onUpdateAssignment(updated);

    if (!currentStatus) {
      confetti({
        particleCount: 30,
        spread: 60,
      });
      alert(`🔓 เปิดให้นักเรียนดูเฉลยของงาน "${asm.title}" เรียบร้อยแล้ว!`);
    } else {
      alert(`🔒 ปิดการแสดงผลเฉลยของงาน "${asm.title}" แล้ว (นักเรียนจะไม่เห็นเฉลย)`);
    }
  };

  // Helper to handle local file upload to simulated Google Drive
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'worksheet' | 'answerKey') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const newAttachedFile: AttachedFile = {
      name: file.name,
      url: URL.createObjectURL(file),
      size: sizeStr,
      driveFileId: `DRV-${Date.now()}`,
      uploadedAt: new Date().toLocaleDateString('th-TH'),
    };

    if (type === 'worksheet') {
      setNewWorksheetFile(newAttachedFile);
    } else {
      setNewAnswerKeyFile(newAttachedFile);
    }
  };

  // Auto-grade all quiz submissions
  const handleAutoGradeQuizzes = () => {
    if (!activeAssignment || activeAssignment.type !== 'quiz' || !activeAssignment.questions) return;

    let gradedCount = 0;
    studentSubmissionRows.forEach(({ student, submission }) => {
      if (submission.status === 'submitted' && submission.quizAnswers) {
        let calcScore = 0;
        submission.quizAnswers.forEach((ans, idx) => {
          const q = activeAssignment.questions![idx];
          if (q && ans === q.correctOptionIndex) {
            calcScore += q.points;
          }
        });

        onUpdateSubmission({
          ...submission,
          score: calcScore,
          feedback: `ตรวจอัตโนมัติ: ได้ ${calcScore}/${activeAssignment.maxScore} คะแนน`,
        });
        gradedCount++;
      }
    });

    confetti({ particleCount: 30, spread: 60 });
    alert(`🎉 ตรวจข้อสอบปรนัยอัตโนมัติสำเร็จแล้ว ${gradedCount} คน!`);
  };

  // Handle Save Assignment
  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newAsm: Assignment = {
      id: `ASM-00${assignments.length + 1}`,
      title: newTitle,
      description: newDesc,
      classId: newClassId,
      subjectId: newSubjectId,
      type: newType,
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: newDueDate,
      maxScore: Number(newMaxScore),
      expReward: Number(newExpReward),
      questions: newType === 'quiz' ? quizQuestions : undefined,
      worksheetFile: newWorksheetFile || undefined,
      answerKeyFile: newAnswerKeyFile || undefined,
      solutionNotes: newSolutionNotes || undefined,
      isAnswerKeyVisible: newIsAnswerKeyVisible,
    };

    onAddAssignment(newAsm);
    setIsCreateModalOpen(false);
    setActiveAssignmentId(newAsm.id);
    setNewTitle('');
    setNewDesc('');
    setNewWorksheetFile(null);
    setNewAnswerKeyFile(null);
    setNewSolutionNotes('');
    setNewIsAnswerKeyVisible(false);

    confetti({
      particleCount: 40,
      spread: 70,
    });
  };

  // Handle Save Grade
  const handleSaveGrading = () => {
    if (!gradingSubmission) return;

    onUpdateSubmission({
      ...gradingSubmission.submission,
      score: Number(inputScore),
      feedback: inputFeedback,
      status: gradingSubmission.submission.status === 'missing' ? 'submitted' : gradingSubmission.submission.status,
    });

    confetti({ particleCount: 20, spread: 45 });
    setGradingSubmission(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Filter & New Assignment Action */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none font-medium"
            >
              <option value="all">ทุกห้องเรียน</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  ห้อง {c.name} ({c.gradeLevel})
                </option>
              ))}
            </select>

            {onOpenClassManager && (
              <button
                type="button"
                onClick={onOpenClassManager}
                className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold px-2 py-1 rounded bg-sky-50 border border-sky-200"
                title="เพิ่มหรือจัดการห้องเรียน"
              >
                + เพิ่มห้องเรียน
              </button>
            )}
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-1">
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">ทุกรายวิชา</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.code}] {s.name}
                </option>
              ))}
            </select>
            {onOpenSubjectManager && (
              <button
                type="button"
                onClick={onOpenSubjectManager}
                className="p-1.5 text-xs text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                title="จัดการเพิ่ม/ลดรายวิชา"
              >
                ⚙️
              </button>
            )}
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">ทุกประเภทงาน</option>
            <option value="worksheet">ใบงาน (Worksheet)</option>
            <option value="quiz">แบบทดสอบ (Quiz)</option>
            <option value="group">งานกลุ่ม (Group)</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenSubjectManager && (
            <button
              type="button"
              onClick={onOpenSubjectManager}
              className="px-3 py-1.5 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              title="จัดการ เพิ่ม แก้ไข หรือลบรายวิชา"
            >
              <span>📚 จัดการรายวิชา</span>
            </button>
          )}

          {onNavigateToZipGrade && (
            <button
              onClick={onNavigateToZipGrade}
              className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              title="เปิดระบบตรวจกระดาษคำตอบปรนัยด้วยการสแกนแบบ ZipGrade"
            >
              <span>📷 สแกน ZipGrade</span>
            </button>
          )}

          <button
            onClick={onOpenReminderModal}
            className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>🔔 คัดลอกข้อความทวงงาน</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors"
          >
            + มอบหมายงานใหม่
          </button>
        </div>
      </div>

      {/* Main Grid: Left List + Right Submissions Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Assignments List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              รายการงานที่มอบหมาย ({filteredAssignments.length})
            </h3>
            <span className="text-[11px] text-slate-400">
              📂 Google Drive: {googleDriveFolderName}
            </span>
          </div>

          <div className="space-y-2.5">
            {filteredAssignments.map((asm) => {
              const sub = subjects.find((s) => s.id === asm.subjectId);
              const cls = classes.find((c) => c.id === asm.classId);
              const isSelected = activeAssignmentId === asm.id;

              const relatedSubs = submissions.filter((s) => s.assignmentId === asm.id);
              const totalClassStudents = students.filter((s) => s.classId === asm.classId).length;
              const submittedCount = relatedSubs.filter(
                (s) => s.status === 'submitted' || s.status === 'late'
              ).length;
              const missingCount = Math.max(0, totalClassStudents - submittedCount);

              return (
                <div
                  key={asm.id}
                  onClick={() => setActiveAssignmentId(asm.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50/70 border-sky-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {sub?.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        ห้อง {cls?.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Answer Key Visibility Indicator */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          asm.isAnswerKeyVisible
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                        title={asm.isAnswerKeyVisible ? 'เปิดให้นักเรียนดูเฉลยแล้ว' : 'ปิดเฉลยอยู่'}
                      >
                        {asm.isAnswerKeyVisible ? '🔓 เฉลยเปิดแล้ว' : '🔒 ซ่อนเฉลย'}
                      </span>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          asm.type === 'quiz'
                            ? 'bg-purple-100 text-purple-700'
                            : asm.type === 'worksheet'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {asm.type === 'quiz' ? 'ข้อสอบปรนัย' : asm.type === 'worksheet' ? 'ใบงาน' : 'งานกลุ่ม'}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{asm.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {asm.description}
                  </p>

                  {/* File Badges on card */}
                  <div className="flex items-center gap-2 mt-2">
                    {asm.worksheetFile && (
                      <span className="text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.2 rounded border border-sky-200 truncate max-w-[150px]">
                        📄 {asm.worksheetFile.name}
                      </span>
                    )}
                    {asm.answerKeyFile && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200 truncate max-w-[150px]">
                        🔑 มีไฟล์เฉลย
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      ⏰ ครบกำหนด: {new Date(asm.dueDate).toLocaleDateString('th-TH')}
                    </span>
                    <div className="flex items-center gap-2 font-mono-numbers">
                      <span className="text-emerald-600 font-semibold">
                        ส่งแล้ว {submittedCount}/{totalClassStudents}
                      </span>
                      {missingCount > 0 && (
                        <span className="text-amber-600 font-bold">
                          (ค้าง {missingCount})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 cols): Selected Assignment Submissions & Scoring Matrix */}
        <div className="lg:col-span-7 space-y-4">
          {activeAssignment ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-sky-700">
                    [{activeSubject?.code}] {activeSubject?.name} · ห้อง {activeClass?.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    รหัสงาน: <span className="font-mono">{activeAssignment.id}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{activeAssignment.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">{activeAssignment.description}</p>
                </div>

                {/* Answer Key Visibility Control Banner (Crucial Requirement) */}
                <div
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                    activeAssignment.isAnswerKeyVisible
                      ? 'bg-emerald-50/90 border-emerald-300'
                      : 'bg-amber-50/70 border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {activeAssignment.isAnswerKeyVisible ? '🔓' : '🔒'}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>
                          {activeAssignment.isAnswerKeyVisible
                            ? 'สถานะเฉลย: เปิดให้นักเรียนดูแล้ว'
                            : 'สถานะเฉลย: ปิดอยู่ (ซ่อนจากนักเรียน)'}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                            activeAssignment.isAnswerKeyVisible
                              ? 'bg-emerald-200 text-emerald-900'
                              : 'bg-amber-200 text-amber-900'
                          }`}
                        >
                          {activeAssignment.isAnswerKeyVisible ? 'นักเรียนดูได้' : 'นักเรียนดูไม่ได้'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {activeAssignment.isAnswerKeyVisible
                          ? 'นักเรียนจะเห็นปุ่ม "ดูเฉลยและวิธีทำละเอียด" ในหน้าส่งงานของตนเอง'
                          : 'นักเรียนจะเห็นข้อความแจ้งว่า "รอคุณครูอนุญาตหลังจากส่งงานครบ"'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {(activeAssignment.answerKeyFile || activeAssignment.solutionNotes) && (
                      <button
                        onClick={() => setPreviewAnswerAssignment(activeAssignment)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
                      >
                        👁️ ดูตัวอย่างเฉลย
                      </button>
                    )}

                    <button
                      onClick={() =>
                        handleToggleAnswerKey(activeAssignment.id, activeAssignment.isAnswerKeyVisible)
                      }
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 ${
                        activeAssignment.isAnswerKeyVisible
                          ? 'bg-slate-800 text-white hover:bg-slate-900'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      <span>
                        {activeAssignment.isAnswerKeyVisible ? '🔒 ปิดการดูเฉลย' : '🔓 เปิดให้ดูเฉลย'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Attached Files Section & Google Drive indicator */}
                <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span>📁 ไฟล์ใบงาน & ไฟล์เฉลย (Google Drive)</span>
                      <span className="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.2 rounded border border-sky-200">
                        โฟลเดอร์: {googleDriveFolderName}
                      </span>
                    </span>
                    <button
                      onClick={() => setEditingAssignmentFiles(activeAssignment)}
                      className="text-xs text-sky-600 hover:text-sky-800 font-semibold"
                    >
                      ✏️ จัดการไฟล์/เฉลย
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                    {/* Worksheet file */}
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div className="truncate pr-2">
                        <span className="text-[10px] text-slate-400 block">ไฟล์ใบงาน (นักเรียนดาวน์โหลดได้):</span>
                        {activeAssignment.worksheetFile ? (
                          <a
                            href={activeAssignment.worksheetFile.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-sky-700 hover:underline truncate block"
                          >
                            📄 {activeAssignment.worksheetFile.name} ({activeAssignment.worksheetFile.size})
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">ยังไม่มีไฟล์ใบงานแนบ</span>
                        )}
                      </div>
                    </div>

                    {/* Answer Key file */}
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div className="truncate pr-2">
                        <span className="text-[10px] text-slate-400 block">ไฟล์เฉลยละเอียด:</span>
                        {activeAssignment.answerKeyFile ? (
                          <span className="font-semibold text-emerald-700 truncate block">
                            🔑 {activeAssignment.answerKeyFile.name} ({activeAssignment.answerKeyFile.size})
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">ยังไม่มีไฟล์เฉลยแนบ</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score & EXP Info Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                  <div className="flex items-center gap-4">
                    <span>
                      คะแนนเต็ม: <strong className="text-slate-800">{activeAssignment.maxScore}</strong> คะแนน
                    </span>
                    <span>
                      รางวัลตรงเวลา: <strong className="text-amber-600">+{activeAssignment.expReward} EXP</strong>
                    </span>
                  </div>

                  {activeAssignment.type === 'quiz' && (
                    <button
                      onClick={handleAutoGradeQuizzes}
                      className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <span>⚡ ตรวจข้อสอบปรนัยอัตโนมัติ</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Submissions Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="py-2.5 px-3 font-mono">เลขที่</th>
                      <th className="py-2.5 px-3">ชื่อ - สกุล</th>
                      <th className="py-2.5 px-3">สถานะการส่ง</th>
                      <th className="py-2.5 px-3 text-right">คะแนนวิชาการ</th>
                      <th className="py-2.5 px-3 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentSubmissionRows.map(({ student, submission }) => {
                      const isMissing = submission.status === 'missing';
                      const isLate = submission.status === 'late';

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                            #{student.studentNumber}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">
                              {student.nickname} ({student.name})
                            </div>
                            {submission.feedback && (
                              <div className="text-[10px] text-slate-400 italic">
                                💬 {submission.feedback}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isMissing ? (
                                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 inline-block">
                                  ยังไม่ส่ง ⚠️
                                </span>
                              ) : isLate ? (
                                <span className="text-[11px] font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 inline-block">
                                  ส่งสาย ⏳
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-block">
                                  ส่งตรงเวลา ✓
                                </span>
                              )}
                              {submission.submissionMethod === 'paper' && (
                                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded" title={submission.paperNote || 'ส่งเป็นกระดาษ'}>
                                  📄 กระดาษ
                                </span>
                              )}
                              {submission.submissionMethod === 'file' && (
                                <span className="text-[10px] bg-sky-100 text-sky-900 font-bold px-1.5 py-0.2 rounded" title={submission.fileName || 'ส่งเป็นไฟล์'}>
                                  📁 ไฟล์
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono-numbers">
                            {submission.score !== undefined ? (
                              <span className="font-bold text-slate-800 text-sm">
                                {submission.score}{' '}
                                <span className="text-[10px] text-slate-400 font-normal">
                                  /{submission.maxScore}
                                </span>
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">ยังไม่ตรวจ</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => {
                                setGradingSubmission({ submission, student });
                                setInputScore(submission.score ?? activeAssignment.maxScore);
                                setInputFeedback(submission.feedback || '');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors border border-sky-200"
                            >
                              ตรวจ/แก้คะแนน
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400">
              กรุณาเลือกงานจากรายการด้านซ้ายเพื่อดูรายละเอียด
            </div>
          )}
        </div>
      </div>

      {/* Create Assignment Modal with File & Answer Key Uploader */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MascotSiby mood="happy" size="sm" />
                <span>สร้างงานที่มอบหมายใหม่ & แนบเฉลย</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หัวข้องาน / ชื่อชิ้นงาน:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="เช่น ใบงานที่ 3 เรื่อง การสังเคราะห์ด้วยแสง"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รายละเอียด / คำสั่ง:
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="อธิบายคำชี้แจงในการทำใบงาน หรือเกณฑ์การให้คะแนน"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ประเภทงาน:
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as AssignmentType)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="worksheet">ใบงาน (Worksheet)</option>
                    <option value="quiz">แบบทดสอบปรนัย (Quiz)</option>
                    <option value="group">งานกลุ่ม (Group)</option>
                    <option value="project">โครงงาน (Project)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    วิชา:
                  </label>
                  <select
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.code}] {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ห้องเรียน:
                  </label>
                  <select
                    value={newClassId}
                    onChange={(e) => setNewClassId(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        ห้อง {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    กำหนดส่ง (Deadline):
                  </label>
                  <input
                    type="datetime-local"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    คะแนนเต็ม:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newMaxScore}
                    onChange={(e) => setNewMaxScore(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    แต้ม EXP ส่งตรงเวลา:
                  </label>
                  <input
                    type="number"
                    min={5}
                    value={newExpReward}
                    onChange={(e) => setNewExpReward(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              {/* File Upload Section (Worksheet File & Answer Key) */}
              <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-sky-900">
                  <span>📁 อัพโหลดไฟล์ใบงาน & ไฟล์เฉลย (Google Drive)</span>
                  <span className="text-[10px] text-sky-700 font-normal">
                    บันทึกลง: {googleDriveFolderName}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Upload Worksheet */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      1. อัพโหลดไฟล์ใบงาน (PDF, Docx, รูปภาพ):
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload(e, 'worksheet')}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200"
                    />
                    {newWorksheetFile && (
                      <div className="mt-1 text-[11px] text-emerald-700 font-medium">
                        ✓ เลือกไฟล์: {newWorksheetFile.name} ({newWorksheetFile.size})
                      </div>
                    )}
                  </div>

                  {/* Upload Answer Key */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      2. อัพโหลดไฟล์เฉลย (PDF, รูปภาพ):
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload(e, 'answerKey')}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200"
                    />
                    {newAnswerKeyFile && (
                      <div className="mt-1 text-[11px] text-emerald-700 font-medium">
                        ✓ เลือกไฟล์เฉลย: {newAnswerKeyFile.name} ({newAnswerKeyFile.size})
                      </div>
                    )}
                  </div>
                </div>

                {/* Solution Notes Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    คำอธิบายเฉลยและวิธีทำเพิ่มเติม:
                  </label>
                  <textarea
                    rows={2}
                    value={newSolutionNotes}
                    onChange={(e) => setNewSolutionNotes(e.target.value)}
                    placeholder="เขียนเฉลยหรือวิธีคิด เพื่อให้นักเรียนอ่านเมื่อคุณครูกดเปิดให้ดูเฉลย"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                {/* Initial Visibility Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newIsAnswerKeyVisible}
                    onChange={(e) => setNewIsAnswerKeyVisible(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    🔓 เปิดให้นักเรียนดูเฉลยทันที (หากไม่ติ๊ก นักเรียนจะไม่เห็นเฉลยจนกว่าครูจะกดเปิด)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
                >
                  ✓ มอบหมายงานลงระบบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Files and Answer Key Modal for Existing Assignment */}
      {editingAssignmentFiles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  จัดการไฟล์ใบงานและเฉลย: {editingAssignmentFiles.title}
                </h3>
                <p className="text-xs text-slate-500">
                  อัพโหลดไฟล์ใหม่ หรือตั้งค่าการเปิด/ปิดเฉลยสำหรับนักเรียน
                </p>
              </div>
              <button
                onClick={() => setEditingAssignmentFiles(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Answer Key Toggle */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  สถานะการดูเฉลยของนักเรียน:
                </div>
                <div className="text-[11px] text-slate-500">
                  {editingAssignmentFiles.isAnswerKeyVisible
                    ? '🔓 เปิดให้นักเรียนดูเฉลยแล้ว'
                    : '🔒 ปิดอยู่ (นักเรียนยังไม่เห็นเฉลย)'}
                </div>
              </div>
              <button
                onClick={() => {
                  const updated: Assignment = {
                    ...editingAssignmentFiles,
                    isAnswerKeyVisible: !editingAssignmentFiles.isAnswerKeyVisible,
                  };
                  onUpdateAssignment(updated);
                  setEditingAssignmentFiles(updated);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                  editingAssignmentFiles.isAnswerKeyVisible
                    ? 'bg-slate-800 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {editingAssignmentFiles.isAnswerKeyVisible ? '🔒 ปิดเฉลย' : '🔓 เปิดให้ดูเฉลย'}
              </button>
            </div>

            {/* Change Worksheet File */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เปลี่ยนไฟล์ใบงาน:
              </label>
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const updated: Assignment = {
                      ...editingAssignmentFiles,
                      worksheetFile: {
                        name: file.name,
                        url: URL.createObjectURL(file),
                        size: `${Math.round(file.size / 1024)} KB`,
                        driveFileId: `DRV-${Date.now()}`,
                        uploadedAt: new Date().toLocaleDateString('th-TH'),
                      },
                    };
                    onUpdateAssignment(updated);
                    setEditingAssignmentFiles(updated);
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-100 file:text-sky-700"
              />
              {editingAssignmentFiles.worksheetFile && (
                <div className="mt-1 text-[11px] text-sky-700">
                  ไฟล์ปัจจุบัน: {editingAssignmentFiles.worksheetFile.name}
                </div>
              )}
            </div>

            {/* Change Answer Key File */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เปลี่ยนไฟล์เฉลยละเอียด:
              </label>
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const updated: Assignment = {
                      ...editingAssignmentFiles,
                      answerKeyFile: {
                        name: file.name,
                        url: URL.createObjectURL(file),
                        size: `${Math.round(file.size / 1024)} KB`,
                        driveFileId: `DRV-${Date.now()}`,
                        uploadedAt: new Date().toLocaleDateString('th-TH'),
                      },
                    };
                    onUpdateAssignment(updated);
                    setEditingAssignmentFiles(updated);
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-700"
              />
              {editingAssignmentFiles.answerKeyFile && (
                <div className="mt-1 text-[11px] text-emerald-700">
                  ไฟล์ปัจจุบัน: {editingAssignmentFiles.answerKeyFile.name}
                </div>
              )}
            </div>

            {/* Solution Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ข้อความเฉลย / วิธีคิด:
              </label>
              <textarea
                rows={3}
                value={editingAssignmentFiles.solutionNotes || ''}
                onChange={(e) => {
                  const updated: Assignment = {
                    ...editingAssignmentFiles,
                    solutionNotes: e.target.value,
                  };
                  onUpdateAssignment(updated);
                  setEditingAssignmentFiles(updated);
                }}
                className="w-full text-xs border border-slate-300 rounded-lg p-2"
                placeholder="เขียนวิธีทำหรือเฉลย..."
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingAssignmentFiles(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
              >
                บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Answer Key Preview Modal for Teacher */}
      {previewAnswerAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔑</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    เฉลยและวิธีทำ: {previewAnswerAssignment.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {previewAnswerAssignment.isAnswerKeyVisible
                      ? '🔓 นักเรียนเห็นเฉลยนี้แล้ว'
                      : '🔒 ซ่อนอยู่ (นักเรียนยังไม่เห็นเฉลยนี้)'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewAnswerAssignment(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Download File if exists */}
            {previewAnswerAssignment.answerKeyFile && (
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-950">
                    ไฟล์เฉลยละเอียด (PDF / เอกสาร):
                  </div>
                  <div className="text-[11px] text-emerald-800">
                    {previewAnswerAssignment.answerKeyFile.name} ({previewAnswerAssignment.answerKeyFile.size})
                  </div>
                </div>
                <a
                  href={previewAnswerAssignment.answerKeyFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  ดาวน์โหลดไฟล์
                </a>
              </div>
            )}

            {/* Solution Notes */}
            {previewAnswerAssignment.solutionNotes ? (
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-1">
                  คำอธิบายวิธีคิดและแนวทางคำตอบ:
                </h4>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs whitespace-pre-wrap text-slate-800 leading-relaxed font-mono">
                  {previewAnswerAssignment.solutionNotes}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">
                ไม่มีข้อความเฉลยเพิ่มเติม
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  handleToggleAnswerKey(
                    previewAnswerAssignment.id,
                    previewAnswerAssignment.isAnswerKeyVisible
                  );
                  setPreviewAnswerAssignment((prev) =>
                    prev ? { ...prev, isAnswerKeyVisible: !prev.isAnswerKeyVisible } : null
                  );
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                  previewAnswerAssignment.isAnswerKeyVisible
                    ? 'bg-slate-800 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {previewAnswerAssignment.isAnswerKeyVisible
                  ? '🔒 ปิดการแสดงผลเฉลย'
                  : '🔓 เปิดให้นักเรียนดูเฉลยทันที'}
              </button>

              <button
                onClick={() => setPreviewAnswerAssignment(null)}
                className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ตรวจงาน: {gradingSubmission.student.name}
                </h3>
                <p className="text-xs text-slate-500">
                  เลขที่ {gradingSubmission.student.studentNumber} ({gradingSubmission.student.nickname})
                </p>
              </div>
              <button
                onClick={() => setGradingSubmission(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                คะแนนที่ได้ (เต็ม {gradingSubmission.submission.maxScore}):
              </label>
              <input
                type="number"
                max={gradingSubmission.submission.maxScore}
                min={0}
                value={inputScore}
                onChange={(e) => setInputScore(Number(e.target.value))}
                className="w-full text-base font-bold font-mono border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                คำแนะนำและข้อเสนอแนะ (Feedback):
              </label>
              <textarea
                rows={3}
                value={inputFeedback}
                onChange={(e) => setInputFeedback(e.target.value)}
                placeholder="เช่น ลายมือเรียบร้อยมาก หรือ ทบทวนเรื่องขั้นตอนที่ 2 เพิ่มเติม"
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setGradingSubmission(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveGrading}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
              >
                ✓ บันทึกคะแนน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
