import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Badge, ScoreTransaction, Student } from '../types';
import { MascotSiby } from './MascotSiby';

interface GamificationViewProps {
  students: Student[];
  badges: Badge[];
  transactions: ScoreTransaction[];
  onAwardManualExp: (studentId: string, amount: number, coins: number, reason: string) => void;
}

export const GamificationView: React.FC<GamificationViewProps> = ({
  students,
  badges,
  transactions,
  onAwardManualExp,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [customExp, setCustomExp] = useState<number>(20);
  const [customCoins, setCustomCoins] = useState<number>(10);
  const [customReason, setCustomReason] = useState<string>('มีจิตสาธารณะ ช่วยจัดห้องเรียน');

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Level thresholds
  const getLevelInfo = (exp: number) => {
    if (exp >= 500) return { title: 'ไซบี้มหาบัณฑิต (Grand Master)', level: 5, maxExp: 600, badge: '🎓' };
    if (exp >= 400) return { title: 'จ่าฝูงฮัสกี้ (Alpha Husky)', level: 4, maxExp: 500, badge: '👑' };
    if (exp >= 250) return { title: 'ไซบี้จอมขยัน (Hardworking)', level: 3, maxExp: 400, badge: '🐺' };
    if (exp >= 150) return { title: 'ไซบี้ฝึกหัด (Apprentice)', level: 2, maxExp: 250, badge: '🐾' };
    return { title: 'ลูกหมามือใหม่ (Rookie Pup)', level: 1, maxExp: 150, badge: '🐶' };
  };

  const handleGrantExp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    onAwardManualExp(selectedStudentId, customExp, customCoins, customReason);
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Sort students by EXP for leaderboard
  const sortedStudents = [...students].sort((a, b) => b.totalExp - a.totalExp);

  return (
    <div className="space-y-6">
      {/* Gamification Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 text-center md:text-left">
          <div className="w-20 h-20 bg-white/10 rounded-2xl p-2 backdrop-blur-xs flex items-center justify-center border border-white/20 shrink-0">
            <MascotSiby mood="cheer" size="md" />
          </div>
          <div>
            <div className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 inline-block mb-1">
              Siby Gamified Learning System 🐺✨
            </div>
            <h2 className="text-2xl font-bold">ระบบสะสมแต้ม EXP & ตรารางวัลไซบี้</h2>
            <p className="text-sm text-amber-100 max-w-xl mt-1">
              กระตุ้นให้นักเรียนส่งงานตรงเวลา มีวินัย และมีส่วนร่วมในชั้นเรียนด้วยแต้ม EXP เหรียญทอง และฉายาประจำระดับ
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Leaderboard & Badges */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leaderboard */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  🏆 ลีดเดอร์บอร์ดไซบี้ทวงงาน (Class Leaderboard)
                </h3>
                <p className="text-xs text-slate-500">
                  อันดับความขยันและคะแนนสะสมตลอดภาคเรียน
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {sortedStudents.map((stu, idx) => {
                const lvl = getLevelInfo(stu.totalExp);
                const progressPct = Math.min(100, Math.round((stu.totalExp / lvl.maxExp) * 100));

                return (
                  <div
                    key={stu.id}
                    className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold font-mono text-xs ${
                          idx === 0
                            ? 'bg-amber-400 text-amber-950 shadow-xs'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-100 text-amber-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-2xl">{stu.avatar}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {stu.nickname} ({stu.name})
                          </span>
                          <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.2 rounded border border-sky-200/50">
                            {lvl.badge} {lvl.title}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Streak {stu.streak} สัปดาห์ 🔥 · ตรารางวัล {stu.badges.length} เหรียญ
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono-numbers text-sm font-bold text-sky-600">
                        {stu.totalExp} <span className="text-[10px] text-slate-400 font-normal">EXP</span>
                      </div>
                      <div className="text-[11px] text-amber-600 font-medium">
                        🪙 {stu.coins} เหรียญ
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Badges Showcase */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              🎖️ ตรารางวัลทั้งหมดในระบบ (Unlockable Badges)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3"
                >
                  <span className="text-3xl p-1 bg-white rounded-lg border border-slate-100 shadow-xs">
                    {b.icon}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{b.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{b.description}</p>
                    <div className="mt-1.5 text-[10px] font-semibold text-amber-600 font-mono">
                      +{b.expBonus} EXP เมื่อปลดล็อก
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Teacher Award Points Tool + Transaction History */}
        <div className="space-y-6">
          {/* Grant EXP Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚡ ครูมอบคะแนนพิเศษไซบี้</span>
            </h3>
            <p className="text-xs text-slate-500">
              มอบ EXP หรือเหรียญทองเพื่อเป็นกำลังใจให้นักเรียนที่มีพัฒนาการยอดเยี่ยม
            </p>

            <form onSubmit={handleGrantExp} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เลือกนักเรียน:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                >
                  {students.map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      #{stu.studentNumber} {stu.name} ({stu.nickname})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    แต้ม EXP:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={customExp}
                    onChange={(e) => setCustomExp(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เหรียญทอง 🪙:
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={customCoins}
                    onChange={(e) => setCustomCoins(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เหตุผล / กิจกรรม:
                </label>
                <input
                  type="text"
                  required
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="เช่น ช่วยครูยกของ, อธิบายบทเรียนให้เพื่อน"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>🎉 มอบแต้มและเหรียญรางวัล</span>
              </button>
            </form>
          </div>

          {/* XP Transactions History Log */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              📝 ประวัติธุรกรรมแต้ม (XP Transactions)
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {transactions.slice().reverse().map((tx) => {
                const stu = students.find((s) => s.id === tx.studentId);
                return (
                  <div
                    key={tx.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">
                        {stu?.nickname || 'นักเรียน'}: {tx.reason}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        โดย {tx.awardedBy} · {tx.timestamp}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 shrink-0 ml-2">
                      +{tx.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
