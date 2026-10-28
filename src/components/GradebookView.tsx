import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Assignment, ClassRoom, Student, Submission, Subject } from '../types';
import { MascotSiby } from './MascotSiby';

interface GradebookViewProps {
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  classes: ClassRoom[];
  subjects: Subject[];
  onUpdateSubmission?: (submission: Submission) => void;
  onOpenSubjectManager?: () => void;
  onNavigateToZipGrade?: () => void;
  onOpenReportExport?: () => void;
}

interface ScoreEditTarget {
  student: Student;
  assignment: Assignment;
  submission?: Submission;
}

export const GradebookView: React.FC<GradebookViewProps> = ({
  students,
  assignments,
  submissions,
  classes,
  subjects,
  onUpdateSubmission,
  onOpenSubjectManager,
  onNavigateToZipGrade,
  onOpenReportExport,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'CLS-001');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Manual Score Entry Modal state
  const [editTarget, setEditTarget] = useState<ScoreEditTarget | null>(null);
  const [editScore, setEditScore] = useState<number | string>('');
  const [editStatus, setEditStatus] = useState<'submitted' | 'late' | 'missing'>('submitted');
  const [editMethod, setEditMethod] = useState<'paper' | 'file' | 'online' | 'quiz'>('paper');
  const [editFeedback, setEditFeedback] = useState<string>('');
  const [editPaperNote, setEditPaperNote] = useState<string>('');

  // Filter students by selected class
  const classStudents = students.filter((s) => s.classId === selectedClassId);

  // Filter assignments
  const relevantAssignments = assignments.filter((a) => {
    if (a.classId !== selectedClassId) return false;
    if (selectedSubjectId !== 'all' && a.subjectId !== selectedSubjectId) return false;
    return true;
  });

  // Total possible academic points
  const totalPossiblePoints = relevantAssignments.reduce((sum, a) => sum + a.maxScore, 0);

  // Search filter
  const displayedStudents = classStudents.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.nickname.toLowerCase().includes(term) ||
      s.studentNumber.toString() === term
    );
  });

  // Calculate student total score
  const getStudentTotal = (studentId: string) => {
    let earned = 0;
    relevantAssignments.forEach((asm) => {
      const sub = submissions.find(
        (s) => s.assignmentId === asm.id && s.studentId === studentId
      );
      if (sub && sub.score !== undefined) {
        earned += sub.score;
      }
    });
    return earned;
  };

  // Open Score Editor for a specific cell
  const handleOpenScoreEditor = (student: Student, assignment: Assignment) => {
    const sub = submissions.find(
      (s) => s.assignmentId === assignment.id && s.studentId === student.id
    );

    setEditTarget({ student, assignment, submission: sub });
    setEditScore(sub && sub.score !== undefined ? sub.score : assignment.maxScore);
    setEditStatus(sub ? sub.status : 'submitted');
    setEditMethod(sub?.submissionMethod || 'paper');
    setEditFeedback(sub?.feedback || '');
    setEditPaperNote(sub?.paperNote || (sub?.submissionMethod === 'paper' ? 'ส่งเป็นกระดาษที่โต๊ะครู' : ''));
  };

  // Save manual score entry
  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !onUpdateSubmission) return;

    const numScore = editScore === '' ? undefined : Math.max(0, Math.min(editTarget.assignment.maxScore, Number(editScore)));

    const now = new Date().toISOString();
    const updatedSub: Submission = {
      id: editTarget.submission?.id || `SUBM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      assignmentId: editTarget.assignment.id,
      studentId: editTarget.student.id,
      submittedAt: editTarget.submission?.submittedAt || (editStatus !== 'missing' ? now : null),
      status: editStatus,
      score: editStatus === 'missing' ? undefined : numScore,
      maxScore: editTarget.assignment.maxScore,
      submissionMethod: editMethod,
      paperNote: editMethod === 'paper' ? (editPaperNote.trim() || 'ส่งเป็นกระดาษที่โต๊ะครู') : undefined,
      feedback: editFeedback.trim() || (editMethod === 'paper' ? 'ครูตรวจงานกระดาษเรียบร้อย' : 'บันทึกคะแนนเรียบร้อย'),
      fileUrl: editTarget.submission?.fileUrl,
      fileName: editTarget.submission?.fileName,
    };

    onUpdateSubmission(updatedSub);
    confetti({ particleCount: 30, spread: 50 });
    setEditTarget(null);
  };

  // Export to CSV with UTF-8 BOM for Microsoft Excel compatibility
  const handleExportCSV = () => {
    const cls = classes.find((c) => c.id === selectedClassId);
    const sub = subjects.find((s) => s.id === selectedSubjectId);

    // Build headers
    const headers = [
      'เลขที่',
      'รหัสนักเรียน',
      'ชื่อ-นามสกุล',
      'ชื่อเล่น',
      ...relevantAssignments.map((a) => `"${a.title.replace(/"/g, '""')} (เต็ม ${a.maxScore})"`),
      'คะแนนรวมที่ได้',
      'คะแนนเต็ม',
      'ร้อยละ (%)',
      'เกรดประมาณการ',
      'แต้มสะสม EXP',
      'เลเวลไซบี้',
    ];

    const rows = displayedStudents.map((stu) => {
      const earned = getStudentTotal(stu.id);
      const percentage = totalPossiblePoints > 0 ? ((earned / totalPossiblePoints) * 100).toFixed(1) : '0';
      const pctNum = Number(percentage);
      let grade = '0';
      if (pctNum >= 80) grade = '4.0';
      else if (pctNum >= 75) grade = '3.5';
      else if (pctNum >= 70) grade = '3.0';
      else if (pctNum >= 65) grade = '2.5';
      else if (pctNum >= 60) grade = '2.0';
      else if (pctNum >= 55) grade = '1.5';
      else if (pctNum >= 50) grade = '1.0';

      const assignmentScores = relevantAssignments.map((asm) => {
        const subRecord = submissions.find(
          (s) => s.assignmentId === asm.id && s.studentId === stu.id
        );
        return subRecord && subRecord.score !== undefined ? subRecord.score : '0';
      });

      return [
        stu.studentNumber,
        stu.id,
        `"${stu.name}"`,
        `"${stu.nickname}"`,
        ...assignmentScores,
        earned,
        totalPossiblePoints,
        percentage,
        grade,
        stu.totalExp,
        `"Lv.${stu.level}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Siby_Gradebook_${cls?.name || 'Class'}_${sub ? sub.code : 'All'}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Filters and Actions Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Class Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              ห้องเรียน:
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({students.filter((s) => s.classId === c.id).length} คน)
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              รายวิชา:
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="all">ทุกรายวิชา ({assignments.length} ชิ้นงาน)</option>
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
                  className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl border border-slate-200 transition-colors"
                  title="จัดการรายวิชาที่คุณครูสอน"
                >
                  ⚙️
                </button>
              )}
            </div>
          </div>

          {/* Search box */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              ค้นหานักเรียน:
            </label>
            <input
              type="text"
              placeholder="ชื่อ, ชื่อเล่น, หรือเลขที่..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-3 py-2 w-44 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Right side: Export & ZipGrade scanner */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {onOpenReportExport && (
            <button
              type="button"
              onClick={onOpenReportExport}
              className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="แบบบันทึกผลการเรียนรู้ ปพ.5 & ส่งออก Excel และพิมพ์ A4"
            >
              <span>📄 ปพ.5 / ส่งออก</span>
            </button>
          )}

          {onNavigateToZipGrade && (
            <button
              type="button"
              onClick={onNavigateToZipGrade}
              className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="เปิดระบบตรวจกระดาษคำตอบปรนัยด้วยการสแกนแบบ ZipGrade"
            >
              <span>📷 สแกนตรวจ ZipGrade</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shadow-2xs flex items-center gap-2 border border-slate-200 cursor-pointer"
            title="ส่งออกไฟล์ CSV พร้อมเปิดใน Microsoft Excel หรือ Google Sheets ได้ทันที"
          >
            <span>📥 ส่งออก CSV (Excel)</span>
          </button>
        </div>
      </div>

      {/* Manual Score Entry Notice / Help Bar */}
      <div className="bg-sky-50/80 border border-sky-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 flex-wrap text-xs">
        <div className="flex items-center gap-2.5">
          <MascotSiby mood="happy" size="sm" />
          <p className="text-sky-950">
            <strong className="font-semibold">💡 คุณครูสามารถกรอกคะแนนเองได้โดยตรง:</strong> คลิกหรือแตะที่ช่องคะแนนของนักเรียนแต่ละคนเพื่อระบุคะแนนได้ทันที สำหรับชิ้นงานที่นักเรียนส่งเป็นกระดาษหรือไม่ได้ส่งในระบบ
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
            📄 = ส่งเป็นกระดาษ
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
            📁 = ส่งไฟล์/ระบบ
          </span>
        </div>
      </div>

      {/* Main Gradebook Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              ตารางคะแนนเก็บและตัดเกรดประจำห้อง
            </h3>
            <p className="text-xs text-slate-400">
              คะแนนวิชาการแยกออกจากแต้มสะสม EXP อย่างชัดเจนเพื่อความถูกต้องตามระเบียบวัดผล
            </p>
          </div>
          <div className="text-xs font-mono font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            คะแนนเต็มรวม: {totalPossiblePoints} คะแนน ({relevantAssignments.length} ชิ้นงาน)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-3 w-12 font-mono text-center">เลขที่</th>
                <th className="py-3 px-3 min-w-[160px]">ชื่อ - สกุล</th>
                {relevantAssignments.map((asm) => (
                  <th key={asm.id} className="py-3 px-3 min-w-[130px] text-center border-l border-slate-200/60">
                    <div className="font-semibold text-slate-800 line-clamp-1" title={asm.title}>
                      {asm.title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      เต็ม {asm.maxScore} คะแนน
                    </div>
                  </th>
                ))}
                <th className="py-3 px-3 text-right bg-slate-100 font-bold border-l border-slate-200 min-w-[90px]">
                  รวม ({totalPossiblePoints})
                </th>
                <th className="py-3 px-3 text-right bg-slate-100 font-bold min-w-[80px]">
                  ร้อยละ
                </th>
                <th className="py-3 px-3 text-center bg-slate-100 font-bold min-w-[70px]">
                  เกรด
                </th>
                <th className="py-3 px-3 text-right bg-sky-50 text-sky-800 font-bold border-l border-sky-100 min-w-[90px]">
                  ⚡ EXP รวม
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedStudents.map((stu) => {
                const earned = getStudentTotal(stu.id);
                const percentage = totalPossiblePoints > 0 ? ((earned / totalPossiblePoints) * 100).toFixed(1) : '0';
                const pctNum = Number(percentage);
                let grade = '0';
                let gradeColor = 'text-slate-600';
                if (pctNum >= 80) {
                  grade = '4.0';
                  gradeColor = 'text-emerald-600 font-bold';
                } else if (pctNum >= 70) {
                  grade = '3.0';
                  gradeColor = 'text-sky-600 font-bold';
                } else if (pctNum >= 60) {
                  grade = '2.0';
                  gradeColor = 'text-amber-600';
                } else if (pctNum >= 50) {
                  grade = '1.0';
                  gradeColor = 'text-orange-600';
                } else {
                  grade = '0';
                  gradeColor = 'text-red-500 font-bold';
                }

                return (
                  <tr key={stu.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-center text-slate-400">
                      {stu.studentNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">
                        {stu.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {stu.nickname} · ID: {stu.id}
                      </div>
                    </td>

                    {/* Interactive Assignment Score Cells */}
                    {relevantAssignments.map((asm) => {
                      const sub = submissions.find(
                        (s) => s.assignmentId === asm.id && s.studentId === stu.id
                      );

                      const hasScore = sub && sub.score !== undefined;
                      const isPaper = sub?.submissionMethod === 'paper';
                      const isFile = sub?.submissionMethod === 'file';
                      const isMissing = !sub || sub.status === 'missing';

                      return (
                        <td
                          key={asm.id}
                          onClick={() => handleOpenScoreEditor(stu, asm)}
                          className="py-2.5 px-2 text-center border-l border-slate-100 cursor-pointer hover:bg-sky-50/80 transition-colors group relative font-mono-numbers"
                          title="คลิกเพื่อกรอกคะแนน หรือแก้ไขคะแนน"
                        >
                          <div className="flex items-center justify-center gap-1">
                            {hasScore ? (
                              <div className="flex items-center gap-1">
                                {isPaper && (
                                  <span className="text-[10px] text-amber-700 bg-amber-100 px-1 py-0.2 rounded font-sans font-bold" title="ส่งเป็นกระดาษ">
                                    📄
                                  </span>
                                )}
                                {isFile && (
                                  <span className="text-[10px] text-sky-700 bg-sky-100 px-1 py-0.2 rounded font-sans font-bold" title="ส่งเป็นไฟล์">
                                    📁
                                  </span>
                                )}
                                <span className="font-bold text-slate-900 group-hover:text-sky-700">
                                  {sub.score}
                                </span>
                              </div>
                            ) : isMissing ? (
                              <span className="text-amber-500 text-[10px] font-sans px-1.5 py-0.5 rounded bg-amber-50 group-hover:bg-amber-100">
                                ค้าง
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-sky-500 ml-0.5">
                              ✏️
                            </span>
                          </div>
                        </td>
                      );
                    })}

                    {/* Total Earned */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 border-l border-slate-200 bg-slate-50/40">
                      {earned}
                    </td>

                    {/* Percentage */}
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700 bg-slate-50/40">
                      {percentage}%
                    </td>

                    {/* Grade */}
                    <td className={`py-2.5 px-3 text-center font-mono ${gradeColor} bg-slate-50/40`}>
                      {grade}
                    </td>

                    {/* Gamified EXP */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-700 bg-sky-50/40 border-l border-sky-100">
                      {stu.totalExp}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Score Entry Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-sky-50/80">
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 bg-white rounded-xl shadow-2xs border border-sky-100">
                  {editTarget.student.avatar}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    กรอกคะแนน: {editTarget.student.name} ({editTarget.student.nickname})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    เลขที่ {editTarget.student.studentNumber} · ห้อง {editTarget.student.classId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveScore} className="p-5 space-y-4 text-xs">
              {/* Assignment Info Badge */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    ชิ้นงาน / ใบงาน
                  </div>
                  <div className="font-bold text-slate-800 text-xs mt-0.5">
                    {editTarget.assignment.title}
                  </div>
                </div>
                <div className="text-right font-mono text-slate-600 font-bold">
                  เต็ม {editTarget.assignment.maxScore} คะแนน
                </div>
              </div>

              {/* Submission Method: Paper vs File */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  รูปแบบการส่งงาน:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditMethod('paper')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      editMethod === 'paper'
                        ? 'border-amber-500 bg-amber-50/80 text-amber-900 ring-2 ring-amber-200'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span>📄 ส่งเป็นกระดาษ</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      ส่งชิ้นงานจริงที่โต๊ะครู
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditMethod('file')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      editMethod === 'file'
                        ? 'border-sky-500 bg-sky-50/80 text-sky-900 ring-2 ring-sky-200'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span>📁 ส่งเป็นไฟล์/ระบบ</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      ส่งผ่านระบบออนไลน์
                    </p>
                  </button>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  สถานะการส่ง:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus('submitted')}
                    className={`py-1.5 px-2 rounded-lg border text-center font-medium ${
                      editStatus === 'submitted'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    ✓ ส่งแล้ว
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus('late')}
                    className={`py-1.5 px-2 rounded-lg border text-center font-medium ${
                      editStatus === 'late'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    ⏳ ส่งสาย
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditStatus('missing');
                      setEditScore('');
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-center font-medium ${
                      editStatus === 'missing'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    ✕ ค้างส่ง
                  </button>
                </div>
              </div>

              {/* Score Input & Quick buttons */}
              {editStatus !== 'missing' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">
                      คะแนนที่ได้ (0 - {editTarget.assignment.maxScore}):
                    </label>
                    <div className="flex gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setEditScore(editTarget.assignment.maxScore)}
                        className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200"
                      >
                        เต็ม ({editTarget.assignment.maxScore})
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditScore(Math.round(editTarget.assignment.maxScore * 0.8))}
                        className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold hover:bg-sky-200"
                      >
                        80%
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditScore(Math.round(editTarget.assignment.maxScore * 0.5))}
                        className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold hover:bg-amber-200"
                      >
                        ผ่าน (50%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditScore(0)}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                      >
                        0
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={editTarget.assignment.maxScore}
                    step={0.5}
                    required
                    value={editScore}
                    onChange={(e) => setEditScore(e.target.value)}
                    className="w-full text-base font-mono font-bold border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    placeholder="กรอกตัวเลขคะแนน"
                  />
                </div>
              )}

              {/* Note / Feedback */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {editMethod === 'paper' ? 'บันทึกงานกระดาษ / ข้อเสนอแนะ:' : 'ข้อเสนอแนะของครู:'}
                </label>
                <input
                  type="text"
                  value={editMethod === 'paper' ? editPaperNote : editFeedback}
                  onChange={(e) => {
                    if (editMethod === 'paper') {
                      setEditPaperNote(e.target.value);
                    } else {
                      setEditFeedback(e.target.value);
                    }
                  }}
                  placeholder={editMethod === 'paper' ? 'เช่น ส่งที่โต๊ะครูคาบเช้า ลายมือเรียบร้อย' : 'คำแนะนำให้นักเรียน'}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  ✓ บันทึกคะแนน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
