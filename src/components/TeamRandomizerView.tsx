import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ClassRoom, GroupActivity, GroupTeam, Student, Subject } from '../types';
import { MascotSiby } from './MascotSiby';
import { LuckyWheelComponent } from './LuckyWheelComponent';

interface TeamRandomizerViewProps {
  students: Student[];
  subjects: Subject[];
  groupHistory: GroupActivity[];
  classes?: ClassRoom[];
  activeClassId?: string;
  onSaveGroupActivity: (activity: GroupActivity) => void;
  onAwardGroupScore: (teamId: string, studentIds: string[], score: number, exp: number, reason: string) => void;
  onAwardIndividualExp?: (studentId: string, exp: number, reason: string) => void;
  onOpenSubjectManager?: () => void;
}

interface DrawnStudentRecord {
  student: Student;
  drawnAt: string;
  awardedExp?: number;
  reason?: string;
}

export const TeamRandomizerView: React.FC<TeamRandomizerViewProps> = ({
  students,
  subjects,
  groupHistory,
  classes = [],
  activeClassId,
  onSaveGroupActivity,
  onAwardGroupScore,
  onAwardIndividualExp,
  onOpenSubjectManager,
}) => {
  // Main view mode: Individual Randomizer vs. Group/Team Randomizer vs. Lucky Wheel
  const [mainMode, setMainMode] = useState<'individual' | 'team' | 'wheel'>('individual');

  // Classroom filter
  const [selectedClassId, setSelectedClassId] = useState<string>(activeClassId || classes[0]?.id || 'all');

  // Filter students based on classroom if selected
  const classStudents = students.filter((s) => {
    if (selectedClassId && selectedClassId !== 'all') {
      return s.classId === selectedClassId;
    }
    return true;
  });

  // Present/Absent attendance toggle
  const [presentMap, setPresentMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    students.forEach((s) => {
      initial[s.id] = s.isPresent !== false;
    });
    return initial;
  });

  // Active students present today in current class filter
  const activeStudents = classStudents.filter((s) => presentMap[s.id] !== false);

  // ----------------------------------------------------
  // INDIVIDUAL RANDOMIZER STATE
  // ----------------------------------------------------
  // Mode: 'no-repeat' (สุ่มแบบไม่ซ้ำ) vs. 'repeat' (สุ่มแบบซ้ำได้)
  const [individualMode, setIndividualMode] = useState<'no-repeat' | 'repeat'>('no-repeat');
  // Remaining pool of student IDs for 'no-repeat' mode
  const [remainingStudentIds, setRemainingStudentIds] = useState<string[]>([]);
  // Current drawn student
  const [currentDrawnStudent, setCurrentDrawnStudent] = useState<Student | null>(null);
  // Shuffling animation state
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [displayTempStudent, setDisplayTempStudent] = useState<Student | null>(null);
  // Drawn history for this session
  const [drawnHistory, setDrawnHistory] = useState<DrawnStudentRecord[]>([]);
  // EXP award input for lucky student
  const [individualExpAmount, setIndividualExpAmount] = useState<number>(10);
  const [individualExpReason, setIndividualExpReason] = useState<string>('ตอบคำถามในชั้นเรียนได้ยอดเยี่ยม');
  const [expAwardedSuccess, setExpAwardedSuccess] = useState<boolean>(false);

  // Initialize remaining student IDs when activeStudents or classroom changes
  useEffect(() => {
    const ids = activeStudents.map((s) => s.id);
    setRemainingStudentIds(ids);
  }, [selectedClassId, students.length]);

  // Reset Individual Pool
  const handleResetIndividualPool = () => {
    const ids = activeStudents.map((s) => s.id);
    setRemainingStudentIds(ids);
    setCurrentDrawnStudent(null);
    setExpAwardedSuccess(false);
  };

  // Run Individual Draw
  const handleDrawIndividual = () => {
    if (activeStudents.length === 0) return;

    let candidatePool: Student[] = [];

    if (individualMode === 'no-repeat') {
      // Filter active students still in the remaining pool
      candidatePool = activeStudents.filter((s) => remainingStudentIds.includes(s.id));
      if (candidatePool.length === 0) {
        // Pool is exhausted, reset
        candidatePool = [...activeStudents];
        setRemainingStudentIds(activeStudents.map((s) => s.id));
      }
    } else {
      // Repeat mode: draw freely from all active students
      candidatePool = [...activeStudents];
    }

    if (candidatePool.length === 0) return;

    setIsSpinning(true);
    setExpAwardedSuccess(false);

    // Pick winner in advance
    const winner = candidatePool[Math.floor(Math.random() * candidatePool.length)];

    // Shuffling animation effect
    let shuffleCount = 0;
    const maxShuffles = 16;
    const interval = setInterval(() => {
      const randIndex = Math.floor(Math.random() * activeStudents.length);
      setDisplayTempStudent(activeStudents[randIndex]);
      shuffleCount++;

      if (shuffleCount >= maxShuffles) {
        clearInterval(interval);
        setDisplayTempStudent(winner);
        setCurrentDrawnStudent(winner);
        setIsSpinning(false);

        // Update remaining pool if no-repeat
        if (individualMode === 'no-repeat') {
          setRemainingStudentIds((prev) => prev.filter((id) => id !== winner.id));
        }

        // Add to history
        const record: DrawnStudentRecord = {
          student: winner,
          drawnAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        setDrawnHistory((prev) => [record, ...prev]);

        confetti({
          particleCount: 55,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }, 90);
  };

  // Award EXP directly to the lucky student
  const handleAwardIndividualExp = () => {
    if (!currentDrawnStudent || !onAwardIndividualExp) return;

    onAwardIndividualExp(currentDrawnStudent.id, individualExpAmount, individualExpReason);
    setExpAwardedSuccess(true);

    // Update in drawn history
    setDrawnHistory((prev) =>
      prev.map((rec, idx) =>
        idx === 0
          ? { ...rec, awardedExp: individualExpAmount, reason: individualExpReason }
          : rec
      )
    );

    confetti({ particleCount: 35, spread: 50 });
    setTimeout(() => setExpAwardedSuccess(false), 3000);
  };

  // Put student back into the pool (undo exclusion)
  const handlePutBackToPool = (studentId: string) => {
    if (!remainingStudentIds.includes(studentId)) {
      setRemainingStudentIds((prev) => [...prev, studentId]);
    }
  };

  // ----------------------------------------------------
  // TEAM RANDOMIZER STATE
  // ----------------------------------------------------
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [activityName, setActivityName] = useState<string>('กิจกรรมฝึกปฏิบัติการ & อภิปรายกลุ่ม');
  const [randomMode, setRandomMode] = useState<'random' | 'ability_balanced' | 'pairs'>('random');
  const [targetType, setTargetType] = useState<'groupCount' | 'memberCount'>('groupCount');
  const [targetValue, setTargetValue] = useState<number>(4);

  // Current Generated Teams
  const [generatedTeams, setGeneratedTeams] = useState<GroupTeam[]>([]);
  const [isTeamShuffling, setIsTeamShuffling] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // Group Scoring Modal
  const [scoringTeam, setScoringTeam] = useState<GroupTeam | null>(null);
  const [groupScoreAmount, setGroupScoreAmount] = useState<number>(5);
  const [groupExpAmount, setGroupExpAmount] = useState<number>(10);
  const [groupScoreNote, setGroupScoreNote] = useState<string>('นำเสนองานกลุ่มยอดเยี่ยม');

  const TEAM_COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#6366f1', // Indigo
  ];

  const TEAM_NAMES = [
    'ทีมไซบี้ 1 (Alpha)',
    'ทีมไซบี้ 2 (Beta)',
    'ทีมไซบี้ 3 (Gamma)',
    'ทีมไซบี้ 4 (Delta)',
    'ทีมไซบี้ 5 (Epsilon)',
    'ทีมไซบี้ 6 (Zeta)',
    'ทีมไซบี้ 7 (Eta)',
    'ทีมไซบี้ 8 (Theta)',
  ];

  // Generate Group Teams
  const handleGenerateGroups = () => {
    if (activeStudents.length === 0) return;

    setIsTeamShuffling(true);

    setTimeout(() => {
      let pool = [...activeStudents];

      let numTeams = 2;
      if (randomMode === 'pairs') {
        numTeams = Math.ceil(pool.length / 2);
      } else if (targetType === 'groupCount') {
        numTeams = Math.max(2, Math.min(pool.length, targetValue));
      } else {
        numTeams = Math.max(2, Math.ceil(pool.length / targetValue));
      }

      const teams: GroupTeam[] = Array.from({ length: numTeams }, (_, i) => ({
        id: `TEAM-${Date.now()}-${i + 1}`,
        name: randomMode === 'pairs' ? `คู่ไซบี้ที่ ${i + 1}` : TEAM_NAMES[i % TEAM_NAMES.length],
        color: TEAM_COLORS[i % TEAM_COLORS.length],
        studentIds: [],
      }));

      if (randomMode === 'ability_balanced') {
        pool.sort((a, b) => (b.academicGpaEstimate || 3.0) - (a.academicGpaEstimate || 3.0));
        let teamIdx = 0;
        let direction = 1;
        pool.forEach((student) => {
          teams[teamIdx].studentIds.push(student.id);
          teamIdx += direction;
          if (teamIdx >= numTeams) {
            teamIdx = numTeams - 1;
            direction = -1;
          } else if (teamIdx < 0) {
            teamIdx = 0;
            direction = 1;
          }
        });
      } else {
        // Pure random shuffle
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        pool.forEach((student, index) => {
          teams[index % numTeams].studentIds.push(student.id);
        });
      }

      setGeneratedTeams(teams);
      setIsTeamShuffling(false);

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
    }, 500);
  };

  const handleCopyTeamsToClipboard = () => {
    if (generatedTeams.length === 0) return;

    let text = `📢 ผลการสุ่มกลุ่มไซบี้ — ${activityName}\n📅 วันที่: ${new Date().toLocaleDateString('th-TH')}\n`;
    generatedTeams.forEach((team) => {
      text += `\n📌 ${team.name} (${team.studentIds.length} คน):\n`;
      team.studentIds.forEach((id) => {
        const stu = students.find((s) => s.id === id);
        if (stu) {
          text += `  • เลขที่ ${stu.studentNumber} ${stu.nickname} (${stu.name.split(' ')[0]})\n`;
        }
      });
    });

    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handleConfirmAwardGroupScore = () => {
    if (!scoringTeam) return;

    onAwardGroupScore(
      scoringTeam.id,
      scoringTeam.studentIds,
      groupScoreAmount,
      groupExpAmount,
      `คะแนนกลุ่ม (${scoringTeam.name}): ${groupScoreNote}`
    );

    setGeneratedTeams((prev) =>
      prev.map((t) => (t.id === scoringTeam.id ? { ...t, activityScore: groupScoreAmount } : t))
    );

    confetti({ particleCount: 35, spread: 60 });
    setScoringTeam(null);
  };

  // Displayed student during spin or final
  const shownStudent = isSpinning ? displayTempStudent : currentDrawnStudent;

  return (
    <div className="space-y-6">
      {/* Header Banner & Mode Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-600 text-white flex items-center justify-center font-bold text-2xl shadow-xs">
            🎲
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900">
                ไซบี้ระบบสุ่มอัจฉริยะ (Siby Smart Picker)
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                {mainMode === 'individual' ? '🎯 สุ่มรายบุคคล' : '👥 สุ่มจัดกลุ่ม'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              สุ่มนักเรียนรายบุคคลแบบซ้ำ/ไม่ซ้ำ พร้อมแจก EXP หรือสุ่มแบ่งกลุ่มคละความสามารถ
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setMainMode('individual')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mainMode === 'individual'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎯 สุ่มรายบุคคล (เดี่ยว)
          </button>
          <button
            type="button"
            onClick={() => setMainMode('wheel')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mainMode === 'wheel'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎡 วงล้อเสี่ยงโชค (Wheel)
          </button>
          <button
            type="button"
            onClick={() => setMainMode('team')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mainMode === 'team'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👥 สุ่มแบ่งกลุ่ม & บัดดี้ (ทีม)
          </button>
        </div>
      </div>

      {/* Classroom Filter Bar */}
      <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-slate-200 gap-3 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">🏫 ห้องเรียน:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="border border-slate-300 rounded-lg py-1 px-2.5 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">ทุกห้องเรียน ({students.length} คน)</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({students.filter((s) => s.classId === cls.id).length} คน)
              </option>
            ))}
          </select>
          <span className="text-slate-400">·</span>
          <span className="text-slate-600">
            มาเรียนวันนี้: <strong className="text-emerald-600 font-mono-numbers">{activeStudents.length}</strong> / {classStudents.length} คน
          </span>
        </div>

        {onOpenSubjectManager && (
          <button
            type="button"
            onClick={onOpenSubjectManager}
            className="text-xs text-sky-700 hover:text-sky-800 font-semibold flex items-center gap-1 hover:underline"
          >
            <span>📚 จัดการรายวิชา ({subjects.length})</span>
          </button>
        )}
      </div>

      {/* ==================================================== */}
      {/* LUCKY WHEEL VIEW                                     */}
      {/* ==================================================== */}
      {mainMode === 'wheel' && (
        <LuckyWheelComponent
          students={activeStudents}
          onAwardExp={onAwardIndividualExp}
        />
      )}

      {/* ==================================================== */}
      {/* 1. INDIVIDUAL RANDOMIZER VIEW                        */}
      {/* ==================================================== */}
      {mainMode === 'individual' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Settings, Mode Toggle & Pool Status */}
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>⚙️ รูปแบบการสุ่มเดี่ยว</span>
              </h3>

              {/* Mode Selection: Repeat vs. No-Repeat */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  เงื่อนไขการสุ่ม:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIndividualMode('no-repeat')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      individualMode === 'no-repeat'
                        ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-200'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span>🔄 สุ่มแบบไม่ซ้ำ</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      ไม่ซ้ำคนเดิมจนกว่าจะสุ่มครบทุกคนในห้อง
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIndividualMode('repeat')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      individualMode === 'repeat'
                        ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-200'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span>🔁 สุ่มแบบซ้ำได้</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      ทุกคนมีโอกาสถูกสุ่มเท่ากันทุกครั้ง
                    </p>
                  </button>
                </div>
              </div>

              {/* Pool Status & Progress */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    {individualMode === 'no-repeat' ? 'นักเรียนที่เหลือในรอบนี้:' : 'นักเรียนทั้งหมด:'}
                  </span>
                  <span className="font-mono font-bold text-indigo-700 text-sm">
                    {individualMode === 'no-repeat'
                      ? `${remainingStudentIds.length} / ${activeStudents.length} คน`
                      : `${activeStudents.length} คน`}
                  </span>
                </div>

                {individualMode === 'no-repeat' && (
                  <>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            activeStudents.length > 0
                              ? ((activeStudents.length - remainingStudentIds.length) / activeStudents.length) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>สุ่มไปแล้ว: {activeStudents.length - remainingStudentIds.length} คน</span>
                      <span>เหลือ: {remainingStudentIds.length} คน</span>
                    </div>
                  </>
                )}

                {individualMode === 'no-repeat' && (
                  <button
                    type="button"
                    onClick={handleResetIndividualPool}
                    className="w-full mt-2 py-1.5 px-3 text-xs font-semibold text-slate-600 hover:text-indigo-700 hover:bg-white rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>🔄 รีเซ็ตรอบใหม่ (เริ่มสุ่มใหม่ทุกคน)</span>
                  </button>
                )}
              </div>

              {/* Spin Trigger Button */}
              <button
                type="button"
                onClick={handleDrawIndividual}
                disabled={isSpinning || activeStudents.length === 0}
                className="w-full py-3.5 px-4 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className={`text-lg ${isSpinning ? 'animate-spin' : ''}`}>🎲</span>
                <span>{isSpinning ? 'ไซบี้กำลังสุ่ม...' : 'กดสุ่มนักเรียนผู้โชคดี!'}</span>
              </button>
            </div>

            {/* Attendance Quick Filter */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  เช็คชื่อเข้าเรียน ({activeStudents.length}/{classStudents.length})
                </h4>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const allPresent: Record<string, boolean> = {};
                      students.forEach((s) => (allPresent[s.id] = true));
                      setPresentMap(allPresent);
                      setRemainingStudentIds(students.map((s) => s.id));
                    }}
                    className="text-[10px] text-sky-600 hover:underline"
                  >
                    มาทุกคน
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                แตะเพื่อติ๊กชื่อคนที่ไม่มาเรียน จะไม่ถูกดึงชื่อมาสุ่ม
              </p>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 pr-1">
                {classStudents.map((s) => (
                  <label
                    key={s.id}
                    className="py-1.5 px-1 flex items-center justify-between hover:bg-slate-50 rounded-lg cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={presentMap[s.id] !== false}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setPresentMap((prev) => ({ ...prev, [s.id]: val }));
                          if (!val) {
                            setRemainingStudentIds((prev) => prev.filter((id) => id !== s.id));
                          } else if (individualMode === 'no-repeat') {
                            setRemainingStudentIds((prev) => [...prev, s.id]);
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-mono text-slate-400">#{s.studentNumber}</span>
                      <span className="font-medium text-slate-800">{s.nickname} ({s.name.split(' ')[0]})</span>
                    </div>
                    <span className="text-base">{s.avatar}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Center & Right Columns: The Lucky Student Stage & History */}
          <div className="lg:col-span-2 space-y-5">
            {/* The Lucky Student Stage */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-sky-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden min-h-[380px] flex flex-col justify-between">
              {/* Background Glows */}
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Stage Top Bar */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs uppercase tracking-widest text-indigo-200 font-bold">
                    {individualMode === 'no-repeat' ? 'โหมดสุ่มเดี่ยว (ไม่ซ้ำคน)' : 'โหมดสุ่มเดี่ยว (สุ่มซ้ำได้)'}
                  </span>
                </div>
                {individualMode === 'no-repeat' && (
                  <span className="text-xs font-mono bg-white/10 px-3 py-1 rounded-full text-indigo-100 border border-white/10">
                    เหลือในคิว {remainingStudentIds.length} คน
                  </span>
                )}
              </div>

              {/* Stage Main Body: Avatar, Name, and Animation */}
              <div className="relative z-10 py-6 my-auto text-center flex flex-col items-center">
                {shownStudent ? (
                  <div className="animate-fade-in flex flex-col items-center">
                    {/* Glowing Avatar */}
                    <div className="relative mb-4">
                      <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white/10 border-2 border-indigo-400/50 backdrop-blur-md flex items-center justify-center text-6xl sm:text-7xl shadow-2xl transition-all duration-300 ${
                        isSpinning ? 'scale-95 animate-pulse' : 'scale-105 ring-4 ring-indigo-400/30'
                      }`}>
                        {shownStudent.avatar}
                      </div>
                      <span className="absolute -bottom-2 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-mono font-bold text-xs px-3 py-0.5 rounded-full shadow-md">
                        เลขที่ {shownStudent.studentNumber}
                      </span>
                    </div>

                    {/* Name & Nickname */}
                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                      น้อง{shownStudent.nickname} ({shownStudent.name})
                    </h3>
                    <p className="text-xs sm:text-sm text-indigo-200 mt-1 flex items-center gap-2">
                      <span>ห้อง {shownStudent.classId}</span>
                      <span>·</span>
                      <span className="text-amber-300 font-semibold font-mono">Lv.{shownStudent.level}</span>
                      <span>·</span>
                      <span className="text-sky-300 font-semibold font-mono">⚡ {shownStudent.totalExp} EXP</span>
                    </p>

                    {/* Mascot Speech Bubble */}
                    <div className="mt-4 max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex items-center gap-3 text-left">
                      <MascotSiby mood={isSpinning ? 'detective' : 'cheer'} size="sm" />
                      <p className="text-xs text-indigo-100 leading-relaxed">
                        {isSpinning
                          ? 'กำลังหมุนวงล้อค้นหาผู้โชคดี... ลุ้นกันหน่อยเร้ววว!'
                          : `โฮ่ง! ขอเชิญ น้อง${shownStudent.nickname} เลขที่ ${shownStudent.studentNumber} ออกมาตอบคำถามหรือทำกิจกรรมครับ! 🐾🎉`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center py-8">
                    <MascotSiby mood="happy" size="lg" />
                    <h3 className="text-lg font-bold text-white mt-3">
                      พร้อมสุ่มนักเรียนแล้ว!
                    </h3>
                    <p className="text-xs text-indigo-200 mt-1 max-w-sm">
                      กดปุ่ม "กดสุ่มนักเรียนผู้โชคดี" ทางซ้ายมือ เพื่อเริ่มการสุ่มแบบ {individualMode === 'no-repeat' ? 'ไม่ซ้ำคน' : 'ซ้ำได้'}
                    </p>
                  </div>
                )}
              </div>

              {/* Stage Bottom Actions: Award EXP directly & Draw Next */}
              {currentDrawnStudent && !isSpinning && (
                <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-indigo-200 font-medium">ให้ EXP ทันที:</span>
                    {[5, 10, 15].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => {
                          setIndividualExpAmount(amount);
                          if (onAwardIndividualExp) {
                            onAwardIndividualExp(currentDrawnStudent.id, amount, individualExpReason);
                            setExpAwardedSuccess(true);
                            setTimeout(() => setExpAwardedSuccess(false), 2500);
                            confetti({ particleCount: 25, spread: 50 });
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-xs transition-colors"
                      >
                        +{amount} EXP
                      </button>
                    ))}
                    {expAwardedSuccess && (
                      <span className="text-xs text-emerald-300 font-bold animate-bounce">
                        ✓ แจกแล้ว!
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {individualMode === 'no-repeat' && (
                      <button
                        type="button"
                        onClick={() => handlePutBackToPool(currentDrawnStudent.id)}
                        className="px-3 py-1.5 text-xs text-indigo-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                        title="นำกลับเข้าวงล้อเพื่อสุ่มได้อีกครั้ง"
                      >
                        ↩️ คืนเข้าวงล้อ
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleDrawIndividual}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <span>🎲 สุ่มคนถัดไป</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Drawn History in this Session */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📜 ประวัติการสุ่มในรอบนี้ ({drawnHistory.length} ครั้ง)</span>
                </h4>
                {drawnHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDrawnHistory([])}
                    className="text-[11px] text-slate-400 hover:text-slate-600"
                  >
                    ล้างประวัติ
                  </button>
                )}
              </div>

              {drawnHistory.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  ยังไม่มีประวัติการสุ่มในรอบนี้ เมื่อคุณครูกดสุ่ม รายชื่อผู้โชคดีจะปรากฏที่นี่
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {drawnHistory.map((rec, idx) => (
                    <div
                      key={`${rec.student.id}-${idx}`}
                      className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0">{rec.student.avatar}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            #{rec.student.studentNumber} {rec.student.nickname}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            เวลา {rec.drawnAt}
                          </p>
                        </div>
                      </div>

                      {rec.awardedExp && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full shrink-0">
                          +{rec.awardedExp} EXP
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. TEAM / GROUP RANDOMIZER VIEW                      */}
      {/* ==================================================== */}
      {mainMode === 'team' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Team Randomizer Settings */}
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>⚙️ ตั้งค่าการสุ่มทีม & กลุ่ม</span>
              </h3>

              {/* Subject Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รายวิชา:
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      [{sub.code}] {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Activity Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อกิจกรรม:
                </label>
                <input
                  type="text"
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="เช่น การทดลองแล็บ, อภิปรายกลุ่ม"
                />
              </div>

              {/* Randomization Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รูปแบบการจัดสรร:
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="randomMode"
                      value="random"
                      checked={randomMode === 'random'}
                      onChange={() => setRandomMode('random')}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-800">🎲 สุ่มอิสระ (Pure Random)</div>
                      <div className="text-[10px] text-slate-400">สลับชื่อแบบสุ่มล้วน ยุติธรรมเท่าเทียม</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="randomMode"
                      value="ability_balanced"
                      checked={randomMode === 'ability_balanced'}
                      onChange={() => setRandomMode('ability_balanced')}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-800">⚖️ คละความสามารถ (Balanced)</div>
                      <div className="text-[10px] text-slate-400">เกลี่ยเพื่อนเก่ง-ปานกลาง-ช่วยเหลือกันทุกกลุ่ม</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="randomMode"
                      value="pairs"
                      checked={randomMode === 'pairs'}
                      onChange={() => setRandomMode('pairs')}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-800">👥 จับคู่บัดดี้ (Pair Practice)</div>
                      <div className="text-[10px] text-slate-400">จับคู่ 2 คนสำหรับสนทนาหรือฝึกทำโจทย์</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Group Size Controls (hidden in pairs mode) */}
              {randomMode !== 'pairs' && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700">เกณฑ์แบ่ง:</span>
                    <div className="flex gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setTargetType('groupCount')}
                        className={`px-2 py-0.5 rounded ${targetType === 'groupCount' ? 'bg-sky-600 text-white font-bold' : 'bg-slate-100 text-slate-600'}`}
                      >
                        ระบุจำนวนกลุ่ม
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetType('memberCount')}
                        className={`px-2 py-0.5 rounded ${targetType === 'memberCount' ? 'bg-sky-600 text-white font-bold' : 'bg-slate-100 text-slate-600'}`}
                      >
                        ระบุคนต่อกลุ่ม
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={2}
                      max={Math.min(10, activeStudents.length)}
                      value={targetValue}
                      onChange={(e) => setTargetValue(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="font-mono font-bold text-sm text-sky-700 w-12 text-right">
                      {targetValue} {targetType === 'groupCount' ? 'กลุ่ม' : 'คน/กล.'}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleGenerateGroups}
                disabled={isTeamShuffling || activeStudents.length === 0}
                className="w-full py-3 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isTeamShuffling ? 'กำลังสุ่มจัดกลุ่ม...' : '🎲 สุ่มจัดกลุ่มทันที'}</span>
              </button>
            </div>
          </div>

          {/* Right Columns: Generated Teams Display */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {generatedTeams.length > 0 ? `ผลการจัดกลุ่ม (${generatedTeams.length} กลุ่ม)` : 'ผลการจัดกลุ่ม'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    แตะที่กลุ่มเพื่อให้คะแนน หรือคัดลอกส่งให้นักเรียน
                  </p>
                </div>

                {generatedTeams.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyTeamsToClipboard}
                      className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <span>{copiedSuccess ? '✓ คัดลอกแล้ว' : '📋 คัดลอกรายชื่อ'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newAct: GroupActivity = {
                          id: `GRP-${Date.now()}`,
                          classId: selectedClassId === 'all' ? (classes[0]?.id || 'CLS-001') : selectedClassId,
                          activityName: activityName,
                          subjectId: selectedSubjectId,
                          date: new Date().toLocaleDateString('th-TH'),
                          groupCount: generatedTeams.length,
                          mode: randomMode,
                          teams: generatedTeams,
                        };
                        onSaveGroupActivity(newAct);
                        alert('บันทึกผลกิจกรรมกลุ่มลงในประวัติเรียบร้อย');
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors"
                    >
                      💾 บันทึกกิจกรรมนี้
                    </button>
                  </div>
                )}
              </div>

              {generatedTeams.length === 0 ? (
                <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-3">
                  <div className="text-3xl">👥</div>
                  <p className="text-xs">
                    ยังไม่มีการสุ่มกลุ่ม กรุณาตั้งค่าแล้วกดปุ่ม "สุ่มจัดกลุ่มทันที" ด้านซ้ายมือ
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedTeams.map((team) => (
                    <div
                      key={team.id}
                      className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/60 flex flex-col justify-between shadow-2xs"
                    >
                      <div
                        className="px-3.5 py-2.5 text-white flex items-center justify-between"
                        style={{ backgroundColor: team.color }}
                      >
                        <div className="font-bold text-xs truncate">{team.name}</div>
                        <div className="text-[11px] font-mono bg-black/20 px-2 py-0.5 rounded-full">
                          {team.studentIds.length} คน
                        </div>
                      </div>

                      <div className="p-3 space-y-2 flex-1">
                        {team.studentIds.map((stuId) => {
                          const stu = students.find((s) => s.id === stuId);
                          if (!stu) return null;
                          return (
                            <div
                              key={stu.id}
                              className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-base">{stu.avatar}</span>
                                <div>
                                  <div className="font-bold text-slate-800">
                                    {stu.nickname} ({stu.name.split(' ')[0]})
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    เลขที่ {stu.studentNumber} · Lv.{stu.level}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                        {team.activityScore !== undefined ? (
                          <span className="text-emerald-600 font-bold">
                            ให้คะแนนแล้ว: +{team.activityScore}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">ยังไม่ได้ให้คะแนน</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setScoringTeam(team)}
                          className="px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors border border-sky-200"
                        >
                          ⭐ ให้คะแนนกลุ่มนี้
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Group Scoring Modal */}
      {scoringTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    ให้คะแนน {scoringTeam.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    สมาชิกในกลุ่มทุกคน ({scoringTeam.studentIds.length} คน) จะได้รับแต้มนี้พร้อมกัน
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScoringTeam(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  คะแนนวิชาการ (Academic Score):
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={groupScoreAmount}
                  onChange={(e) => setGroupScoreAmount(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  แต้ม EXP พิเศษประจำกิจกรรม:
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={groupExpAmount}
                  onChange={(e) => setGroupExpAmount(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  เหตุผล / บันทึกชื่นชม:
                </label>
                <input
                  type="text"
                  value={groupScoreNote}
                  onChange={(e) => setGroupScoreNote(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                  placeholder="เช่น นำเสนองานกลุ่มชัดเจน ทำงานร่วมกันดี"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setScoringTeam(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmAwardGroupScore}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
              >
                บันทึกคะแนนกลุ่ม
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
