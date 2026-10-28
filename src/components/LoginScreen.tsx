import React, { useState } from 'react';
import { ClassRoom, Student, SystemSettings } from '../types';
import { MascotSiby } from './MascotSiby';

interface LoginScreenProps {
  classes: ClassRoom[];
  students: Student[];
  settings: SystemSettings;
  onLoginTeacher: () => void;
  onLoginStudent: (studentId: string, classId: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  classes,
  students,
  settings,
  onLoginTeacher,
  onLoginStudent,
}) => {
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student'>('teacher');

  // Teacher Form State
  const [teacherPassword, setTeacherPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [teacherError, setTeacherError] = useState<string>('');

  // Student Form State
  const [studentClassId, setStudentClassId] = useState<string>(classes[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [studentError, setStudentError] = useState<string>('');

  // Filter students by selected classroom
  const currentClassStudents = students
    .filter((s) => s.classId === studentClassId)
    .sort((a, b) => a.studentNumber - b.studentNumber);

  // Search filter inside classroom
  const filteredStudents = currentClassStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.nickname.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      String(s.studentNumber).includes(studentSearchQuery)
  );

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError('');

    // Teacher password check (strictly 1234, no hints on UI)
    if (teacherPassword === '1234') {
      onLoginTeacher();
    } else {
      setTeacherError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      setTeacherPassword('');
    }
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    if (!selectedStudentId) {
      setStudentError('กรุณาเลือกชื่อของตนเองเพื่อเข้าสู่ระบบ');
      return;
    }

    onLoginStudent(selectedStudentId, studentClassId);
  };

  const handleSelectStudentCard = (stuId: string) => {
    setSelectedStudentId(stuId);
    setStudentError('');
    onLoginStudent(stuId, studentClassId);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 flex flex-col justify-between p-4 sm:p-6 text-slate-100">
      {/* Top Bar with School & Term badge */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-md">
            <MascotSiby mood="happy" size="sm" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
              <span>ไซบี้ทวงงาน</span>
              <span className="text-[10px] bg-sky-500/30 text-sky-200 border border-sky-400/30 px-1.5 py-0.2 rounded-md font-mono">
                Edu Portal
              </span>
            </div>
            <div className="text-[11px] text-sky-200/80">
              {settings.schoolName || 'โรงเรียนสาธิตวิทยาคม'}
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3 py-1 rounded-full border border-white/15 text-xs text-sky-200">
          <span>📅</span>
          <span>
            ภาคเรียนที่ {settings.term || '2'} / ปีการศึกษา {settings.academicYear || '2569'}
          </span>
        </div>
      </div>

      {/* Main Login Card Container */}
      <div className="w-full max-w-xl mx-auto my-auto py-6">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 p-6 sm:p-8 text-white text-center relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-inner">
                <MascotSiby
                  mood={selectedRole === 'teacher' ? 'detective' : 'happy'}
                  size="md"
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                ยินดีต้อนรับสู่ระบบติดตามห้องเรียน
              </h1>
              <p className="text-xs sm:text-sm text-sky-100 max-w-md mx-auto">
                กรุณาเลือกบทบาทของคุณเพื่อเข้าสู่ระบบงานและการเรียนรู้
              </p>
            </div>
          </div>

          {/* Role Selection Switcher Tabs */}
          <div className="p-3 bg-slate-100/90 border-b border-slate-200 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('teacher');
                setTeacherError('');
              }}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                selectedRole === 'teacher'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span className="text-base sm:text-lg">👩‍🏫</span>
              <span>โหมดคุณครู (Teacher)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('student');
                setStudentError('');
              }}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                selectedRole === 'student'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span className="text-base sm:text-lg">🎒</span>
              <span>โหมดนักเรียน (Student)</span>
            </button>
          </div>

          {/* Role Card Body */}
          <div className="p-6 sm:p-8">
            {/* TEACHER MODE LOGIN */}
            {selectedRole === 'teacher' && (
              <form onSubmit={handleTeacherSubmit} className="space-y-5 animate-fade-in">
                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 text-xs text-sky-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>👩‍🏫 สำหรับคุณครูผู้สอน</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    เข้าถึงระบบมอบหมายงาน ตรวจคะแนน จัดผังที่นั่ง สรุปผล ปพ.5 และการบริหารจัดการห้องเรียน
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    รหัสผ่านเข้าสู่ระบบคุณครู
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      value={teacherPassword}
                      onChange={(e) => {
                        setTeacherPassword(e.target.value);
                        if (teacherError) setTeacherError('');
                      }}
                      placeholder="กรุณากรอกรหัสผ่านคุณครู"
                      className="w-full text-sm border border-slate-300 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50/50 hover:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-sm p-1"
                      title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showPassword ? '👁️' : '🔒'}
                    </button>
                  </div>
                </div>

                {teacherError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                    <span>⚠️</span>
                    <span>{teacherError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <span>เข้าสู่ระบบคุณครู 🚀</span>
                </button>
              </form>
            )}

            {/* STUDENT MODE LOGIN */}
            {selectedRole === 'student' && (
              <form onSubmit={handleStudentSubmit} className="space-y-5 animate-fade-in">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <span>🎒 สำหรับนักเรียน (ไม่ต้องใส่รหัสผ่าน)</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    เลือกห้องเรียนและชื่อของตนเองเพื่อดูงานที่ได้รับมอบหมาย ส่งการบ้าน ตรวจคะแนน และดูผังที่นั่ง
                  </p>
                </div>

                {/* Step 1: Select Classroom */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>1. เลือกห้องเรียนของคุณ</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      มีทั้งหมด {classes.length} ห้อง
                    </span>
                  </label>
                  <select
                    value={studentClassId}
                    onChange={(e) => {
                      setStudentClassId(e.target.value);
                      setSelectedStudentId('');
                      setStudentError('');
                    }}
                    className="w-full text-sm border border-slate-300 rounded-xl px-4 py-3 bg-slate-50/50 hover:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition-colors cursor-pointer font-medium"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        ห้อง {cls.name} (ครูที่ปรึกษา: {cls.advisor} · {cls.totalStudents} คน)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Select Student Name */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      2. เลือกชื่อของตนเอง
                    </label>
                    <span className="text-[11px] text-sky-600 font-semibold">
                      ห้องนี้มีนักเรียน {currentClassStudents.length} คน
                    </span>
                  </div>

                  {/* Student Search filter input */}
                  {currentClassStudents.length > 8 && (
                    <input
                      type="text"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      placeholder="🔍 ค้นหาด้วยชื่อ เลขที่ หรือชื่อเล่น..."
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  )}

                  {/* Student Grid / List */}
                  <div className="max-h-60 overflow-y-auto space-y-1.5 p-1 border border-slate-200 rounded-2xl bg-slate-50/50">
                    {filteredStudents.map((stu) => {
                      const isSelected = selectedStudentId === stu.id;
                      return (
                        <div
                          key={stu.id}
                          onClick={() => handleSelectStudentCard(stu.id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-sky-50 border-sky-400 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50/30'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0 border border-slate-200">
                              {stu.avatar}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                                  เลขที่ {stu.studentNumber}
                                </span>
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {stu.name}
                                </span>
                                <span className="text-xs text-sky-600 font-semibold">
                                  ({stu.nickname})
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                                <span>⭐ Lv.{stu.level}</span>
                                <span>⚡ {stu.totalExp} EXP</span>
                                <span>🪙 {stu.coins} เหรียญ</span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${
                                isSelected
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-700'
                              }`}
                            >
                              เลือก ➔
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {filteredStudents.length === 0 && (
                      <div className="text-center py-6 text-xs text-slate-400">
                        ไม่พบรายชื่อนักเรียนที่ค้นหา
                      </div>
                    )}
                  </div>
                </div>

                {studentError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                    <span>⚠️</span>
                    <span>{studentError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!selectedStudentId}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <span>เข้าสู่ระบบและดูข้อมูลนักเรียน 🎒➔</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-5xl mx-auto text-center text-xs text-sky-200/60 py-3">
        ไซบี้ทวงงาน (Siby Classroom Tracker) · ระบบติดตามและประเมินผลการเรียนรู้แบบเรียลไทม์
      </div>
    </div>
  );
};
