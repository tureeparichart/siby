import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Subject } from '../types';
import { MascotSiby } from './MascotSiby';

interface SubjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onAddSubject: (newSubject: Subject) => void;
  onUpdateSubject: (updatedSubject: Subject) => void;
  onDeleteSubject: (subjectId: string) => void;
}

const PRESET_COLORS = [
  '#0284c7', // Sky Blue
  '#059669', // Emerald Green
  '#7c3aed', // Purple
  '#d97706', // Amber
  '#dc2626', // Red
  '#db2777', // Pink
  '#0891b2', // Cyan
  '#4f46e5', // Indigo
];

export const SubjectManagerModal: React.FC<SubjectManagerModalProps> = ({
  isOpen,
  onClose,
  subjects,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
}) => {
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  // Form states
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [teacher, setTeacher] = useState<string>('ครูปาริชาติ เทพพิทักษ์');
  const [color, setColor] = useState<string>(PRESET_COLORS[0]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingSubjectId(null);
    setCode('');
    setName('');
    setTeacher('ครูปาริชาติ เทพพิทักษ์');
    setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setErrorMessage('');
  };

  const handleStartEdit = (sub: Subject) => {
    setIsAdding(false);
    setEditingSubjectId(sub.id);
    setCode(sub.code);
    setName(sub.name);
    setTeacher(sub.teacher);
    setColor(sub.color || PRESET_COLORS[0]);
    setErrorMessage('');
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingSubjectId(null);
    setErrorMessage('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setErrorMessage('กรุณากรอกรหัสวิชาและชื่อรายวิชาให้ครบถ้วน');
      return;
    }

    if (isAdding) {
      // Check duplicate code
      if (subjects.some((s) => s.code.toLowerCase() === code.trim().toLowerCase())) {
        setErrorMessage(`รหัสวิชา "${code.trim()}" มีอยู่ในระบบแล้ว`);
        return;
      }

      const newSubject: Subject = {
        id: `SUB-${Date.now().toString(36).toUpperCase()}`,
        code: code.trim(),
        name: name.trim(),
        teacher: teacher.trim() || 'คุณครูผู้สอน',
        color,
      };

      onAddSubject(newSubject);
      confetti({ particleCount: 35, spread: 60 });
      setIsAdding(false);
    } else if (editingSubjectId) {
      const updated: Subject = {
        id: editingSubjectId,
        code: code.trim(),
        name: name.trim(),
        teacher: teacher.trim() || 'คุณครูผู้สอน',
        color,
      };
      onUpdateSubject(updated);
      setEditingSubjectId(null);
    }
  };

  const handleConfirmDelete = (sub: Subject) => {
    onDeleteSubject(sub.id);
    if (editingSubjectId === sub.id) {
      setEditingSubjectId(null);
    }
    setSubjectToDelete(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-sky-50/70">
          <div className="flex items-center gap-3">
            <MascotSiby mood="happy" size="sm" />
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>จัดการรายวิชาที่คุณครูสอน</span>
                <span className="text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-semibold">
                  {subjects.length} วิชา
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                เพิ่ม แก้ไข หรือลบรายวิชา กำหนดรหัสวิชา และสีประจำวิชา
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
          {/* Add / Edit Form */}
          {(isAdding || editingSubjectId) ? (
            <form onSubmit={handleSave} className="p-4 rounded-xl border border-sky-200 bg-sky-50/40 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>{isAdding ? '➕ เพิ่มรายวิชาใหม่' : '✏️ แก้ไขข้อมูลรายวิชา'}</span>
                </h3>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  ยกเลิก
                </button>
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                  ⚠️ {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสวิชา <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="เช่น ว23101, ค23101"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อรายวิชา <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น วิทยาศาสตร์ 3, ฟิสิกส์พื้นฐาน"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ครูผู้สอน
                  </label>
                  <input
                    type="text"
                    value={teacher}
                    onChange={(e) => setTeacher(e.target.value)}
                    placeholder="เช่น ครูปาริชาติ เทพพิทักษ์"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    สีประจำวิชา (Color Tag)
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'hover:scale-105 opacity-80'
                        }`}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-sky-100">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors"
                >
                  {isAdding ? 'บันทึกรายวิชาใหม่' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                รายวิชาทั้งหมดในระบบ ({subjects.length})
              </span>
              <button
                type="button"
                onClick={handleStartAdd}
                className="px-3 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span>➕ เพิ่มรายวิชา</span>
              </button>
            </div>
          )}

          {/* Deletion Confirmation Banner */}
          {subjectToDelete && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs space-y-2 animate-fade-in">
              <div className="font-bold text-red-900 flex items-center gap-1.5">
                <span>⚠️ ยืนยันการลบรายวิชา:</span>
                <span className="font-mono bg-red-100 text-red-900 px-2 py-0.5 rounded border border-red-200">
                  [{subjectToDelete.code}] {subjectToDelete.name}
                </span>
              </div>
              <p className="text-[11px] text-red-700">
                คุณแน่ใจหรือไม่ว่าต้องการลบรายวิชานี้ออกจากระบบ? (งานที่สร้างไว้ก่อนหน้าจะยังคงอยู่แต่จะแสดงเป็นวิชาทั่วไป)
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleConfirmDelete(subjectToDelete)}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1"
                >
                  <span>🗑️ ยืนยันลบรายวิชา</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubjectToDelete(null)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {subjects.length === 0 && (
            <div className="text-center py-10 text-slate-500 bg-slate-50/80 rounded-2xl border border-dashed border-slate-300 space-y-2">
              <div className="text-3xl">📚</div>
              <div className="font-semibold text-xs text-slate-700">ยังไม่มีรายวิชาในระบบ</div>
              <p className="text-[11px] text-slate-400">
                คุณครูสามารถกดปุ่ม "+ เพิ่มรายวิชา" ด้านบนเพื่อเพิ่มวิชาที่สอนได้ทันที
              </p>
            </div>
          )}

          {/* Subject Cards List */}
          <div className="space-y-2.5">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white shadow-2xs flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-3.5 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: sub.color || '#0284c7' }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {sub.code}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {sub.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      ผู้สอน: {sub.teacher}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(sub)}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors border border-slate-200"
                    title="แก้ไขรายวิชา"
                  >
                    ✏️ แก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubjectToDelete(sub)}
                    className="px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                    title="ลบรายวิชา"
                  >
                    🗑️ ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>💡 การเพิ่ม/ลบรายวิชาจะอัปเดตตัวเลือกในหน้ามอบหมายงาน สมุดคะแนน และการสุ่มทีมทันที</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
