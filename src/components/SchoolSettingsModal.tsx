import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SystemSettings } from '../types';
import { MascotSiby } from './MascotSiby';

interface SchoolSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
}

export const SchoolSettingsModal: React.FC<SchoolSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [schoolName, setSchoolName] = useState<string>(settings.schoolName || 'โรงเรียนสาธิตวิทยาคม');
  const [term, setTerm] = useState<string>(settings.term || '2');
  const [academicYear, setAcademicYear] = useState<string>(settings.academicYear || '2569');
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSchoolName(settings.schoolName || 'โรงเรียนสาธิตวิทยาคม');
      setTerm(settings.term || '2');
      setAcademicYear(settings.academicYear || '2569');
      setIsSavedSuccess(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim() || !term.trim() || !academicYear.trim()) {
      return;
    }

    const updated: SystemSettings = {
      ...settings,
      schoolName: schoolName.trim(),
      term: term.trim(),
      academicYear: academicYear.trim(),
    };

    onUpdateSettings(updated);
    setIsSavedSuccess(true);
    confetti({ particleCount: 40, spread: 60 });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 text-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <MascotSiby mood="happy" size="sm" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>ตั้งค่าข้อมูลโรงเรียนและปีการศึกษา</span>
                <span className="text-[10px] bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded-full">
                  สถานศึกษา
                </span>
              </h2>
              <p className="text-xs text-sky-100 mt-0.5">
                กำหนดชื่อโรงเรียน ภาคเรียน และปีการศึกษาสำหรับแสดงผลและออกเอกสาร ปพ.5
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* School Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>🏫 ชื่อโรงเรียน / สถานศึกษา</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="เช่น โรงเรียนสาธิตวิทยาคม"
              className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50/50 hover:bg-white transition-colors"
            />
            <p className="text-[11px] text-slate-400">
              ชื่อนี้จะปรากฏบนหัวข้อระบบ หน้ารายงาน และการส่งออกเอกสาร ปพ.5
            </p>
          </div>

          {/* Term / Semester & Academic Year Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Term / Semester */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>📅 ภาคเรียน</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="เช่น 1 หรือ 2"
                  className="flex-1 text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50/50 hover:bg-white transition-colors"
                />
              </div>
              {/* Quick Preset Buttons */}
              <div className="flex gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setTerm('1')}
                  className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-colors ${
                    term === '1'
                      ? 'bg-sky-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ภาคเรียนที่ 1
                </button>
                <button
                  type="button"
                  onClick={() => setTerm('2')}
                  className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-colors ${
                    term === '2'
                      ? 'bg-sky-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ภาคเรียนที่ 2
                </button>
              </div>
            </div>

            {/* Academic Year */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>🎓 ปีการศึกษา (พ.ศ.)</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="เช่น 2568, 2569"
                className="w-full text-sm font-mono border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50/50 hover:bg-white transition-colors"
              />
              {/* Quick Year Presets */}
              <div className="flex gap-1.5 pt-1">
                {['2567', '2568', '2569'].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setAcademicYear(yr)}
                    className={`px-2 py-1 text-[11px] rounded-lg font-mono transition-colors ${
                      academicYear === yr
                        ? 'bg-sky-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Current Configuration Preview */}
          <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-center justify-between text-xs text-sky-950">
            <div className="flex items-center gap-2">
              <span className="text-base">📌</span>
              <div>
                <div className="font-bold">ข้อมูลปัจจุบันที่จะแสดง:</div>
                <div className="text-[11px] text-sky-800">
                  {schoolName || 'โรงเรียน'} · ภาคเรียนที่ {term}/{academicYear}
                </div>
              </div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              ซิงค์อัตโนมัติ
            </span>
          </div>

          {isSavedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
              <span>✅</span>
              <span className="font-bold">บันทึกข้อมูลโรงเรียน ภาคเรียน และปีการศึกษาเรียบร้อยแล้ว!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>💾 บันทึกการตั้งค่า</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
