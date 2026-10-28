import React, { useRef, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Student } from '../types';
import { MascotSiby } from './MascotSiby';

interface LuckyWheelComponentProps {
  students: Student[];
  onAwardExp?: (studentId: string, exp: number, reason: string) => void;
}

const SLICE_COLORS = [
  '#0284c7', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#e11d48', // Rose
];

export const LuckyWheelComponent: React.FC<LuckyWheelComponentProps> = ({
  students,
  onAwardExp,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active pool of student IDs eligible for spin
  const [activePool, setActivePool] = useState<Student[]>(students);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winner, setWinner] = useState<Student | null>(null);
  const [currentRotation, setCurrentRotation] = useState<number>(0);
  const [awardExpAmount, setAwardExpAmount] = useState<number>(10);
  const [expAwarded, setExpAwarded] = useState<boolean>(false);
  const [excludeWinners, setExcludeWinners] = useState<boolean>(true);
  const [winnerHistory, setWinnerHistory] = useState<Student[]>([]);

  // Sync pool when students change
  useEffect(() => {
    setActivePool(students);
  }, [students]);

  // Audio click synthesizer using Web Audio API
  const playTickSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio not permitted or supported
    }
  }, []);

  // Draw wheel on canvas
  const drawWheel = useCallback(
    (rotation: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = canvas.width;
      const center = size / 2;
      const radius = center - 16;
      const count = activePool.length;

      ctx.clearRect(0, 0, size, size);

      if (count === 0) {
        // Empty wheel
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#f1f5f9';
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ไม่มีนักเรียนในวงล้อ', center, center);
        return;
      }

      const sliceAngle = (2 * Math.PI) / count;

      // Draw slices
      activePool.forEach((student, index) => {
        const startAngle = rotation + index * sliceAngle;
        const endAngle = startAngle + sliceAngle;

        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = SLICE_COLORS[index % SLICE_COLORS.length];
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Draw text inside slice
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px sans-serif';

        // Add shadow for readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 3;

        const label = `${student.nickname || student.name.split(' ')[0]} (#${student.studentNumber})`;
        ctx.fillText(label, radius - 20, 5);

        ctx.restore();
      });

      // Outer gold rim
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Outer dots / pegs
      for (let i = 0; i < count; i++) {
        const angle = rotation + i * sliceAngle;
        const pegX = center + (radius - 2) * Math.cos(angle);
        const pegY = center + (radius - 2) * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(pegX, pegY, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Center Hub
      ctx.beginPath();
      ctx.arc(center, center, 32, 0, 2 * Math.PI);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐾', center, center);
    },
    [activePool]
  );

  useEffect(() => {
    drawWheel(currentRotation);
  }, [drawWheel, currentRotation]);

  // Spin wheel function
  const spinWheel = () => {
    if (isSpinning || activePool.length === 0) return;

    setIsSpinning(true);
    setWinner(null);
    setExpAwarded(false);

    // Random winner index
    const count = activePool.length;
    const sliceAngle = (2 * Math.PI) / count;
    const targetIndex = Math.floor(Math.random() * count);

    // Top pointer is at -Math.PI / 2 (12 o'clock)
    // We want the target slice center to align with the pointer at the end of spin
    const targetSliceCenter = targetIndex * sliceAngle + sliceAngle / 2;
    const totalSpins = 6 + Math.floor(Math.random() * 4); // 6 to 9 full spins
    const targetRotation = 2 * Math.PI * totalSpins + (Math.PI * 1.5 - targetSliceCenter);

    const startTime = performance.now();
    const duration = 4500; // 4.5 seconds
    const initialRot = currentRotation % (2 * Math.PI);
    let lastTickIndex = -1;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const newRotation = initialRot + (targetRotation - initialRot) * easeOut;

      // Sound ticker calculation
      const currentAngleNorm = (Math.PI * 1.5 - (newRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const curIndex = Math.floor(currentAngleNorm / sliceAngle);
      if (curIndex !== lastTickIndex) {
        lastTickIndex = curIndex;
        playTickSound();
      }

      setCurrentRotation(newRotation);
      drawWheel(newRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const winningStudent = activePool[targetIndex];
        setWinner(winningStudent);
        setWinnerHistory((prev) => [winningStudent, ...prev]);

        // Celebration Confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Exclude winner from subsequent spins if enabled
        if (excludeWinners && activePool.length > 1) {
          setActivePool((prev) => prev.filter((s) => s.id !== winningStudent.id));
        }
      }
    };

    requestAnimationFrame(animate);
  };

  const handleAwardExp = () => {
    if (!winner || !onAwardExp) return;
    onAwardExp(winner.id, awardExpAmount, 'วงล้อเสี่ยงโชคตอบคำถาม');
    setExpAwarded(true);
  };

  const handleResetPool = () => {
    setActivePool(students);
    setWinner(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎡</span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              วงล้อเสี่ยงโชคไซบี้ (Husky Lucky Wheel)
            </h3>
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              {activePool.length} คนในวงล้อ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            หมุนวงล้อสุ่มตอบคำถามสดในชั้นเรียน พร้อมเสียงประกอบและแจกคะแนน EXP ทันที
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-slate-200/80">
            <input
              type="checkbox"
              checked={excludeWinners}
              onChange={(e) => setExcludeWinners(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
            />
            <span>ตัดชื่อคนที่โดนแล้วออก (ไม่ซ้ำ)</span>
          </label>
          <button
            onClick={handleResetPool}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            🔄 รีเซ็ตทุกคนกลับเข้าวงล้อ
          </button>
        </div>
      </div>

      {/* Main Wheel View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Canvas Wheel */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
          {/* Pointer Needle at top */}
          <div className="relative flex flex-col items-center z-10 -mb-5">
            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[26px] border-t-rose-600 filter drop-shadow-md" />
            <div className="w-3 h-3 bg-amber-400 rounded-full border-2 border-white -mt-1 shadow-xs" />
          </div>

          <div className="relative p-2 bg-gradient-to-b from-amber-200 via-sky-100 to-indigo-100 rounded-full shadow-lg border-4 border-amber-300">
            <canvas
              ref={canvasRef}
              width={420}
              height={420}
              className="max-w-full h-auto rounded-full cursor-pointer transition-transform"
              onClick={spinWheel}
            />
          </div>

          {/* Spin Trigger Button */}
          <button
            onClick={spinWheel}
            disabled={isSpinning || activePool.length === 0}
            className={`mt-6 px-8 py-3.5 rounded-2xl font-bold text-sm tracking-wide shadow-md transition-all flex items-center gap-2 ${
              isSpinning
                ? 'bg-slate-400 text-white cursor-not-allowed opacity-75'
                : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 hover:scale-105 active:scale-95 shadow-amber-500/20'
            }`}
          >
            <span className="text-lg">🐾</span>
            <span>{isSpinning ? 'กำลังหมุนวงล้อ...' : 'หมุนวงล้อเสี่ยงโชค!'}</span>
          </button>
        </div>

        {/* Right Column: Winner Card & History */}
        <div className="lg:col-span-5 space-y-5">
          {winner ? (
            <div className="bg-gradient-to-br from-amber-50 via-sky-50 to-indigo-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-bold shadow-2xs">
                <span>🎉 ผู้โชคดีจากการหมุนวงล้อ</span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-6xl my-2 filter drop-shadow-sm">{winner.avatar}</span>
                <div className="text-xl font-bold text-slate-900">
                  {winner.name} ({winner.nickname})
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  เลขที่ {winner.studentNumber} · รหัส {winner.id}
                </div>
              </div>

              {/* Award EXP Form */}
              <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                <div className="text-xs font-semibold text-slate-700">ให้คะแนนพิเศษทันที:</div>
                <div className="flex items-center justify-center gap-2">
                  {[5, 10, 15, 20].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAwardExpAmount(val)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        awardExpAmount === val
                          ? 'bg-amber-500 text-slate-950 shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      +{val} EXP
                    </button>
                  ))}
                </div>

                {expAwarded ? (
                  <div className="text-xs font-bold text-emerald-600 py-1 bg-emerald-50 rounded-lg">
                    ✨ บันทึกคะแนน +{awardExpAmount} EXP ให้ {winner.nickname} เรียบร้อยแล้ว!
                  </div>
                ) : (
                  <button
                    onClick={handleAwardExp}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1 mt-1"
                  >
                    <span>⭐ ยืนยันให้แต้ม</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3 bg-slate-50/50">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center mx-auto">
                <MascotSiby mood="detective" size="md" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">กดหมุนวงล้อเพื่อเริ่มสุ่ม</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  วงล้อจะหมุนด้วยระบบฟิสิกส์สุ่ม พร้อมเสียงติ๊ก และเลือกนักเรียน 1 คนมาตอบคำถาม
                </p>
              </div>
            </div>
          )}

          {/* Winner History List */}
          {winnerHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  ประวัติผู้โชคดีรอบนี้ ({winnerHistory.length})
                </span>
                <button
                  onClick={() => setWinnerHistory([])}
                  className="text-slate-400 hover:text-slate-600 text-[11px]"
                >
                  ล้างประวัติ
                </button>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {winnerHistory.map((w, idx) => (
                  <div
                    key={`${w.id}-${idx}`}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{w.avatar}</span>
                      <span className="font-semibold text-slate-800">{w.name} ({w.nickname})</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      #{w.studentNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
