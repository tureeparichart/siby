import React, { useState, useMemo } from 'react';
import { Student, ClassRoom, Subject, Assignment, Submission, AttendanceRecord, SystemSettings } from '../types';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassRoom[];
  subjects: Subject[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  attendanceRecords: AttendanceRecord[];
  activeClassId: string;
  settings?: SystemSettings;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  classes,
  subjects,
  students,
  assignments,
  submissions,
  attendanceRecords,
  activeClassId,
  settings,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(activeClassId || classes[0]?.id || 'CLS-001');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || 'SUB-001');
  const [viewMode, setViewMode] = useState<'table' | 'individual' | 'print'>('table');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  if (!isOpen) return null;

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Filter students in selected class
  const classStudents = students
    .filter((s) => s.classId === selectedClassId)
    .sort((a, b) => a.studentNumber - b.studentNumber);

  // Filter assignments for selected class and subject
  const relevantAssignments = assignments.filter(
    (a) => (a.classId === selectedClassId || !a.classId) && (a.subjectId === selectedSubjectId || !a.subjectId)
  );

  const totalMaxScore = relevantAssignments.reduce((acc, a) => acc + a.maxScore, 0);

  // Student score summary calculation
  const studentReports = useMemo(() => {
    return classStudents.map((stu) => {
      // Assignment scores
      const assignmentScores: { [asmId: string]: number | string } = {};
      let totalEarned = 0;
      let submittedCount = 0;

      relevantAssignments.forEach((asm) => {
        const sub = submissions.find((s) => s.studentId === stu.id && s.assignmentId === asm.id);
        if (sub && typeof sub.score === 'number') {
          assignmentScores[asm.id] = sub.score;
          totalEarned += sub.score;
          submittedCount++;
        } else if (sub && (sub.status === 'submitted' || sub.status === 'late')) {
          assignmentScores[asm.id] = 'รอตรวจ';
        } else {
          assignmentScores[asm.id] = '-';
        }
      });

      // Attendance calculation for this student in this class
      const stuAtt = attendanceRecords.filter((a) => a.studentId === stu.id);
      const totalDays = stuAtt.length || 1;
      const presentDays = stuAtt.filter((a) => a.status === 'present' || a.status === 'late').length;
      const attendancePercent = stuAtt.length > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

      // Grade calculation based on percentage (0-100)
      const percent = totalMaxScore > 0 ? (totalEarned / totalMaxScore) * 100 : 0;
      let grade = '0';
      if (percent >= 80) grade = '4.0';
      else if (percent >= 75) grade = '3.5';
      else if (percent >= 70) grade = '3.0';
      else if (percent >= 65) grade = '2.5';
      else if (percent >= 60) grade = '2.0';
      else if (percent >= 55) grade = '1.5';
      else if (percent >= 50) grade = '1.0';
      else grade = '0';

      return {
        student: stu,
        assignmentScores,
        totalEarned,
        percent: Number(percent.toFixed(1)),
        grade,
        attendancePercent,
        submittedCount,
        totalAssignments: relevantAssignments.length,
      };
    });
  }, [classStudents, relevantAssignments, submissions, attendanceRecords, totalMaxScore]);

  // Export CSV for Excel
  const handleExportCSV = () => {
    // Header row
    const headers = [
      'เลขที่',
      'รหัสนักเรียน',
      'ชื่อ-นามสกุล',
      'ชื่อเล่น',
      ...relevantAssignments.map((a) => `${a.title} (${a.maxScore} คะแนน)`),
      `คะแนนรวม (${totalMaxScore})`,
      'ร้อยละ (%)',
      'เกรดเฉลี่ย',
      'เวลาเรียน (%)',
      'จำนวนงานที่ส่ง',
    ];

    const rows = studentReports.map((r) => {
      const asmCols = relevantAssignments.map((a) => r.assignmentScores[a.id] ?? '-');
      return [
        r.student.studentNumber,
        r.student.id,
        `"${r.student.name}"`,
        `"${r.student.nickname}"`,
        ...asmCols,
        r.totalEarned,
        r.percent,
        r.grade,
        `${r.attendancePercent}%`,
        `${r.submittedCount}/${r.totalAssignments}`,
      ].join(',');
    });

    // Add BOM for Thai characters in Excel
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `ปพ.5_${currentClass?.name}_${currentSubject?.code}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const activeStudentReport = studentReports.find((r) => r.student.id === (selectedStudentId || classStudents[0]?.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none">
        {/* Modal Top Bar (Hidden during Print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 print:hidden">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center text-xl font-bold">
              📄
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                แบบบันทึกผลการเรียนรู้ (ปพ.5) & ส่งออกคะแนน
              </h2>
              <p className="text-xs text-slate-500">
                สรุปคะแนนเก็บ แบบทดสอบ เกรดเฉลี่ย และสถิติเวลาเรียน พร้อมส่งออก Excel หรือพิมพ์รายงาน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <span>📊 ส่งออก Excel (CSV)</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-bold text-sky-900 bg-sky-100 hover:bg-sky-200 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <span>🖨️ สั่งพิมพ์เอกสาร</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-sm transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter & View Switcher (Hidden during Print) */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white text-xs print:hidden">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">ห้องเรียน:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.gradeLevel})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">รายวิชา:</span>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                viewMode === 'table' ? 'bg-white text-sky-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📋 ตาราง ปพ.5 ทั้งห้อง
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                viewMode === 'individual'
                  ? 'bg-white text-sky-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👤 ใบรายงานเดี่ยว (Student Card)
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {viewMode === 'table' && (
            <div>
              {/* Printable Official Header */}
              <div className="text-center space-y-1 mb-5">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  แบบบันทึกผลการเรียนรู้ประจำชั้นเรียน (ปพ.5)
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {settings?.schoolName || 'โรงเรียนสาธิตวิทยาคม'} · ภาคเรียนที่ {settings?.term || '2'} ปีการศึกษา {settings?.academicYear || '2569'}
                </h3>
                <div className="text-xs text-slate-600 flex items-center justify-center gap-3">
                  <span>
                    <strong>ชั้นมัธยมศึกษา:</strong> {currentClass?.name}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>วิชา:</strong> {currentSubject?.code} {currentSubject?.name}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>ครูผู้สอน:</strong> {currentSubject?.teacher}
                  </span>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 font-bold">
                      <th className="p-2.5 text-center w-12 border-r border-slate-200">เลขที่</th>
                      <th className="p-2.5 w-44 border-r border-slate-200">ชื่อ - สกุล</th>
                      {relevantAssignments.map((a) => (
                        <th key={a.id} className="p-2 text-center border-r border-slate-200 min-w-20">
                          <div className="truncate max-w-24 font-semibold" title={a.title}>
                            {a.title}
                          </div>
                          <div className="text-[10px] text-slate-500 font-normal">({a.maxScore} คะแนน)</div>
                        </th>
                      ))}
                      <th className="p-2.5 text-center bg-sky-50 text-sky-900 font-bold border-r border-slate-200 min-w-20">
                        รวม ({totalMaxScore})
                      </th>
                      <th className="p-2.5 text-center bg-sky-50 text-sky-900 font-bold border-r border-slate-200 min-w-16">
                        ร้อยละ
                      </th>
                      <th className="p-2.5 text-center bg-amber-50 text-amber-900 font-bold border-r border-slate-200 min-w-14">
                        เกรด
                      </th>
                      <th className="p-2.5 text-center border-r border-slate-200 min-w-20">เวลาเรียน</th>
                      <th className="p-2.5 text-center min-w-16">ส่งงาน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentReports.map((row) => (
                      <tr key={row.student.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2 text-center font-mono font-bold text-slate-700 border-r border-slate-100">
                          {row.student.studentNumber}
                        </td>
                        <td className="p-2 border-r border-slate-100">
                          <div className="font-semibold text-slate-800">{row.student.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {row.student.nickname} ({row.student.id})
                          </div>
                        </td>
                        {relevantAssignments.map((a) => {
                          const val = row.assignmentScores[a.id];
                          return (
                            <td key={a.id} className="p-2 text-center font-mono border-r border-slate-100">
                              {typeof val === 'number' ? (
                                <span className="font-semibold text-slate-800">{val}</span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">{val}</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="p-2 text-center font-mono font-bold text-sky-800 bg-sky-50/50 border-r border-slate-100">
                          {row.totalEarned}
                        </td>
                        <td className="p-2 text-center font-mono text-slate-700 bg-sky-50/50 border-r border-slate-100">
                          {row.percent}%
                        </td>
                        <td className="p-2 text-center font-mono font-bold text-amber-700 bg-amber-50/50 border-r border-slate-100">
                          {row.grade}
                        </td>
                        <td className="p-2 text-center font-mono border-r border-slate-100">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                              row.attendancePercent >= 80 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                            }`}
                          >
                            {row.attendancePercent}%
                          </span>
                        </td>
                        <td className="p-2 text-center font-mono text-slate-600">
                          {row.submittedCount}/{row.totalAssignments}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Official Signatures Row */}
              <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs text-slate-600 print:mt-12">
                <div className="space-y-6">
                  <div>ลงชื่อ......................................................</div>
                  <div>({currentSubject?.teacher})</div>
                  <div className="text-[11px] text-slate-500">ครูผู้สอนประจำวิชา</div>
                </div>
                <div className="space-y-6">
                  <div>ลงชื่อ......................................................</div>
                  <div>({currentClass?.advisor})</div>
                  <div className="text-[11px] text-slate-500">ครูประจำชั้น</div>
                </div>
                <div className="space-y-6">
                  <div>ลงชื่อ......................................................</div>
                  <div>(......................................................)</div>
                  <div className="text-[11px] text-slate-500">หัวหน้าฝ่ายวิชาการ</div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'individual' && (
            <div className="space-y-4">
              {/* Student Selector */}
              <div className="flex items-center gap-2 print:hidden">
                <span className="text-xs font-semibold text-slate-600">เลือกนักเรียน:</span>
                <select
                  value={selectedStudentId || classStudents[0]?.id}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800"
                >
                  {classStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      เลขที่ {s.studentNumber} - {s.name} ({s.nickname})
                    </option>
                  ))}
                </select>
              </div>

              {activeStudentReport && (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-6 print:border-none print:p-0">
                  {/* Card Header */}
                  <div className="text-center border-b border-slate-200 pb-4">
                    <div className="text-xs text-slate-500 font-semibold uppercase">
                      {settings?.schoolName || 'โรงเรียนสาธิตวิทยาคม'} · ฝ่ายวิชาการ
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      ใบรายงานผลการเรียนรู้และพฤติกรรมรายบุคคล
                    </h3>
                    <div className="text-xs text-slate-600 mt-1">
                      ภาคเรียนที่ {settings?.term || '2'} ปีการศึกษา {settings?.academicYear || '2569'} · ชั้นมัธยมศึกษาปีที่ {currentClass?.name}
                    </div>
                  </div>

                  {/* Student Profile Info */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{activeStudentReport.student.avatar}</span>
                      <div>
                        <div className="text-base font-bold text-slate-900">
                          {activeStudentReport.student.name} ({activeStudentReport.student.nickname})
                        </div>
                        <div className="text-xs text-slate-500">
                          รหัสประจำตัว: {activeStudentReport.student.id} · เลขที่ {activeStudentReport.student.studentNumber} · ห้อง {currentClass?.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">เกรดเฉลี่ยวิชา</div>
                      <div className="text-2xl font-bold font-mono text-sky-700">
                        {activeStudentReport.grade}
                      </div>
                    </div>
                  </div>

                  {/* Breakdown Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-3 bg-slate-100/80 font-bold text-xs text-slate-700">
                      คะแนนชิ้นงานและแบบทดสอบ: {currentSubject?.name}
                    </div>
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 text-left">รายการงาน</th>
                          <th className="p-2.5 text-center w-24">คะแนนเต็ม</th>
                          <th className="p-2.5 text-center w-24">คะแนนที่ได้</th>
                          <th className="p-2.5 text-center w-28">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {relevantAssignments.map((a) => {
                          const val = activeStudentReport.assignmentScores[a.id];
                          return (
                            <tr key={a.id}>
                              <td className="p-2.5 font-medium text-slate-800">{a.title}</td>
                              <td className="p-2.5 text-center font-mono text-slate-500">{a.maxScore}</td>
                              <td className="p-2.5 text-center font-mono font-bold text-sky-700">
                                {typeof val === 'number' ? val : '-'}
                              </td>
                              <td className="p-2.5 text-center">
                                {typeof val === 'number' ? (
                                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium text-[11px]">
                                    ตรวจแล้ว
                                  </span>
                                ) : (
                                  <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-medium text-[11px]">
                                    ยังไม่ส่ง
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-sky-50/50 font-bold border-t border-slate-200 text-slate-800">
                        <tr>
                          <td className="p-2.5">คะแนนรวมทั้งหมด</td>
                          <td className="p-2.5 text-center font-mono">{totalMaxScore}</td>
                          <td className="p-2.5 text-center font-mono text-sky-800">
                            {activeStudentReport.totalEarned} ({activeStudentReport.percent}%)
                          </td>
                          <td className="p-2.5 text-center text-amber-700">
                            เกรด {activeStudentReport.grade}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Gamification Stats */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="text-[11px] text-slate-400">EXP สะสม</div>
                      <div className="text-base font-bold font-mono text-indigo-700">
                        {activeStudentReport.student.totalExp} EXP (Lv.{activeStudentReport.student.level})
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="text-[11px] text-slate-400">เหรียญทองสะสม</div>
                      <div className="text-base font-bold font-mono text-amber-600">
                        🪙 {activeStudentReport.student.coins} เหรียญ
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="text-[11px] text-slate-400">สถิติเวลาเรียน</div>
                      <div className="text-base font-bold font-mono text-emerald-700">
                        {activeStudentReport.attendancePercent}% (ผ่านเกณฑ์)
                      </div>
                    </div>
                  </div>

                  {/* Signatures for Parent Report */}
                  <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
                    <div className="space-y-4">
                      <div>ลงชื่อ......................................................</div>
                      <div>({currentSubject?.teacher})</div>
                      <div className="text-[11px] text-slate-500">ครูประจำวิชา</div>
                    </div>
                    <div className="space-y-4">
                      <div>ลงชื่อ......................................................</div>
                      <div>(......................................................)</div>
                      <div className="text-[11px] text-slate-500">ผู้ปกครองรับทราบ</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
