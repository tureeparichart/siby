import React, { useState } from 'react';
import { Assignment, Student, Submission, Subject } from '../types';
import { MascotSiby } from './MascotSiby';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignments: Assignment[];
  students: Student[];
  submissions: Submission[];
  subjects: Subject[];
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  assignments,
  students,
  submissions,
  subjects,
}) => {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(
    assignments[0]?.id || ''
  );
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAssignment = assignments.find((a) => a.id === selectedAssignmentId) || assignments[0];
  const subject = subjects.find((s) => s.id === currentAssignment?.subjectId);

  // Find students who haven't submitted
  const submittedStudentIds = new Set(
    submissions
      .filter((s) => s.assignmentId === currentAssignment?.id && (s.status === 'submitted' || s.status === 'late'))
      .map((s) => s.studentId)
  );

  const missingStudents = students.filter(
    (s) => s.classId === currentAssignment?.classId && !submittedStudentIds.has(s.id)
  );

  // Formatting friendly Thai LINE reminder message
  const generateGroupMessage = () => {
    if (!currentAssignment) return '';
    const dueFormatted = new Date(currentAssignment.dueDate).toLocaleString('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const studentListText =
      missingStudents.length > 0
        ? missingStudents
            .map((s, idx) => `  ${idx + 1}. เลขที่ ${s.studentNumber} ${s.name} (${s.nickname})`)
            .join('\n')
        : '  ✨ ยอดเยี่ยมมาก ทุกคนส่งงานครบแล้ว 100%! ✨';

    return `📢 [แจ้งเตือนจากระบบไซบี้ทวงงาน 🐺🐾]
วิชา: ${subject?.name || 'รายวิชา'} (${subject?.code || ''})
ชื่องาน: "${currentAssignment.title}"
กำหนดส่ง: ⏰ ${dueFormatted} น. (คะแนนเต็ม ${currentAssignment.maxScore} คะแนน | รับ +${currentAssignment.expReward} EXP)

รายชื่อนักเรียนที่ต้องติดตามส่งงาน (${missingStudents.length} คน):
${studentListText}

💡 น้องๆ อย่าลืมส่งให้ตรงเวลาเพื่อรับแต้ม EXP และรักษาสถิติ Streak ไซบี้ขยันนะครับ!
สามารถสอบถามเพิ่มเติมกับคุณครูได้เลยครับ โฮ่งๆ~ 🐶`;
  };

  const generateSimpleNamesList = () => {
    return missingStudents
      .map((s) => `เลขที่ ${s.studentNumber} ${s.nickname} (${s.name})`)
      .join('\n');
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-sky-50/50">
          <div className="flex items-center gap-3">
            <MascotSiby mood="remind" size="sm" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                ระบบไซบี้ทวงงาน — คัดลอกข้อความแจ้งเตือน
              </h2>
              <p className="text-xs text-slate-500">
                พร้อมส่งลงกลุ่มแชท LINE ห้องเรียน หรือแชทผู้ปกครองได้ทันที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Assignment Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              เลือกงานที่ต้องการทวง:
            </label>
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {assignments.map((asm) => {
                const sub = subjects.find((s) => s.id === asm.subjectId);
                return (
                  <option key={asm.id} value={asm.id}>
                    [{sub?.code}] {asm.title} (กำหนดส่ง:{' '}
                    {new Date(asm.dueDate).toLocaleDateString('th-TH')})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-center">
            <div>
              <div className="text-xs text-slate-500">นักเรียนทั้งหมด</div>
              <div className="text-lg font-bold text-slate-800 font-mono-numbers">
                {students.filter((s) => s.classId === currentAssignment?.classId).length}
              </div>
            </div>
            <div>
              <div className="text-xs text-emerald-600 font-medium">ส่งแล้ว</div>
              <div className="text-lg font-bold text-emerald-600 font-mono-numbers">
                {submittedStudentIds.size}
              </div>
            </div>
            <div>
              <div className="text-xs text-amber-600 font-medium">ยังไม่ส่ง (งานค้าง)</div>
              <div className="text-lg font-bold text-amber-600 font-mono-numbers">
                {missingStudents.length}
              </div>
            </div>
          </div>

          {/* Message Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700">
                ตัวอย่างข้อความสำหรับแชทกลุ่ม (LINE / Facebook Group):
              </span>
              <span className="text-[11px] text-slate-400">
                {copiedType === 'group' ? '✅ คัดลอกสำเร็จแล้ว!' : 'กดปุ่มคัดลอกด้านล่าง'}
              </span>
            </div>
            <textarea
              readOnly
              rows={8}
              value={generateGroupMessage()}
              className="w-full text-xs font-mono border border-slate-300 rounded-xl p-3 bg-slate-50 text-slate-800 focus:outline-none select-all"
            />
          </div>

          {/* Copy Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => copyToClipboard(generateGroupMessage(), 'group')}
              className="py-2.5 px-4 text-xs font-bold text-white bg-sky-600 rounded-xl hover:bg-sky-700 transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              <span>📋 คัดลอกข้อความทวงงานทั้งห้อง</span>
              {copiedType === 'group' && <span className="text-sky-200">✓</span>}
            </button>

            <button
              onClick={() => copyToClipboard(generateSimpleNamesList(), 'names')}
              className="py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>📝 คัดลอกเฉพาะรายชื่อคนยังไม่ส่ง ({missingStudents.length} คน)</span>
              {copiedType === 'names' && <span className="text-emerald-600">✓</span>}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            💡 ทริป: ระบบบันทึกเวลาส่งจริงอัตโนมัติ และคำนวณ EXP ให้นักเรียนที่ส่งทันเวลา
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
