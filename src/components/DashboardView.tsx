import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Assignment, ClassRoom, Student, Submission, Subject } from '../types';
import { MascotSiby } from './MascotSiby';

interface DashboardViewProps {
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  classes: ClassRoom[];
  subjects: Subject[];
  activeClassId?: string;
  onSelectClass?: (classId: string) => void;
  onOpenReminder: () => void;
  onNavigateToSeating: () => void;
  onNavigateToRandomizer: () => void;
  onSelectAssignment: (assignmentId: string) => void;
  onSelectStudent: (studentId: string) => void;
  onOpenAIChat?: (initialQuery?: string) => void;
  onOpenReportExport?: () => void;
}

// Tooltip for Assignment Average Scores Bar Chart
const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-sm text-white p-3.5 rounded-xl shadow-xl border border-slate-700/80 text-xs space-y-2 max-w-xs z-50">
        <div>
          <div className="font-bold text-sky-300 text-sm">{data.fullTitle}</div>
          <div className="text-slate-300 text-[11px] flex items-center gap-1.5 mt-0.5">
            <span className="bg-sky-950 text-sky-300 px-1.5 py-0.2 rounded border border-sky-800 font-mono font-semibold">
              {data.subjectCode}
            </span>
            <span>{data.subjectName}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-700/80 space-y-1.5">
          <div className="flex justify-between items-center text-slate-200">
            <span>คะแนนเฉลี่ยห้อง:</span>
            <span className="font-bold text-amber-300 font-mono text-sm">
              {data.avgScore} <span className="text-[11px] font-normal text-slate-400">/ {data.maxScore}</span>
              <span className="ml-1.5 text-xs text-sky-300 font-semibold">({data.percentage}%)</span>
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300 text-[11px]">
            <span>ช่วงคะแนน (Max - Min):</span>
            <span className="font-mono text-slate-100 font-semibold">{data.maxAchieved} - {data.minAchieved} คะแนน</span>
          </div>
          <div className="flex justify-between items-center text-slate-300 text-[11px]">
            <span>ส่งแล้ว:</span>
            <span className="text-emerald-400 font-bold font-mono">
              {data.submittedCount}/{data.studentCount} คน ({Math.round((data.submittedCount / data.studentCount) * 100)}%)
            </span>
          </div>
          {data.missingCount > 0 && (
            <div className="text-[10px] text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50">
              ⚠️ ยังค้างส่ง {data.missingCount} คน
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Tooltip for Submission Status Pie Chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900/95 backdrop-blur-sm text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-700/80 text-xs space-y-1 z-50">
        <div className="font-semibold text-slate-200 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
          <span>{data.name}</span>
        </div>
        <div className="text-sm font-bold font-mono text-sky-300">
          {data.value} <span className="text-xs font-normal text-slate-400">ชิ้น ({data.payload.percentText}%)</span>
        </div>
      </div>
    );
  }
  return null;
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  assignments,
  submissions,
  classes,
  subjects,
  activeClassId,
  onSelectClass,
  onOpenReminder,
  onNavigateToSeating,
  onNavigateToRandomizer,
  onSelectAssignment,
  onSelectStudent,
  onOpenAIChat,
  onOpenReportExport,
}) => {
  const [quickAiInput, setQuickAiInput] = React.useState('');

  // Determine current active class
  const selectedClassId = activeClassId || classes[0]?.id || 'CLS-001';
  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  // Active Class Students
  const activeClassStudents = React.useMemo(() => {
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  const activeStudentIdSet = React.useMemo(() => {
    return new Set(activeClassStudents.map((s) => s.id));
  }, [activeClassStudents]);

  // Active Class Submissions
  const activeClassSubmissions = React.useMemo(() => {
    return submissions.filter((s) => activeStudentIdSet.has(s.studentId));
  }, [submissions, activeStudentIdSet]);

  // Active Class Assignments
  const activeClassAssignments = React.useMemo(() => {
    const assigned = assignments.filter((a) => a.classId === selectedClassId);
    if (assigned.length > 0) return assigned;
    const subAsmIds = new Set(activeClassSubmissions.map((s) => s.assignmentId));
    const matched = assignments.filter((a) => subAsmIds.has(a.id));
    return matched.length > 0 ? matched : assignments;
  }, [assignments, selectedClassId, activeClassSubmissions]);

  // Active Class Submission Breakdown
  const activeSubmitted = activeClassSubmissions.filter((s) => s.status === 'submitted').length;
  const activeLate = activeClassSubmissions.filter((s) => s.status === 'late').length;
  const activeMissing = activeClassSubmissions.filter((s) => s.status === 'missing').length;
  const activeTotalSubs = activeClassSubmissions.length;
  const activeTotalSubmitted = activeSubmitted + activeLate;
  const activeOnTimeRate = activeTotalSubmitted > 0 ? Math.round((activeSubmitted / activeTotalSubmitted) * 100) : 0;
  const activeOverallCompletion = activeTotalSubs > 0 ? Math.round((activeTotalSubmitted / activeTotalSubs) * 100) : 0;

  // Pie chart data for active class
  const pieChartData = React.useMemo(() => {
    if (activeTotalSubs === 0) return [];
    return [
      {
        name: 'ส่งตรงเวลา',
        value: activeSubmitted,
        color: '#10b981',
        percentText: Math.round((activeSubmitted / activeTotalSubs) * 100),
      },
      {
        name: 'ส่งล่าช้า',
        value: activeLate,
        color: '#f59e0b',
        percentText: Math.round((activeLate / activeTotalSubs) * 100),
      },
      {
        name: 'ค้างส่ง',
        value: activeMissing,
        color: '#f43f5e',
        percentText: Math.round((activeMissing / activeTotalSubs) * 100),
      },
    ].filter((item) => item.value > 0);
  }, [activeTotalSubs, activeSubmitted, activeLate, activeMissing]);

  // Submission methods for active class
  const paperSubCount = activeClassSubmissions.filter((s) => s.submissionMethod === 'paper').length;
  const fileSubCount = activeClassSubmissions.filter((s) => s.submissionMethod === 'file').length;
  const onlineSubCount = activeClassSubmissions.filter(
    (s) => s.submissionMethod === 'quiz' || s.submissionMethod === 'online' || !s.submissionMethod
  ).length;

  // Bar chart data: Average Score vs Max Score per assignment in active class
  const barChartData = React.useMemo(() => {
    return activeClassAssignments.map((asm) => {
      const subject = subjects.find((s) => s.id === asm.subjectId);
      const subs = activeClassSubmissions.filter((s) => s.assignmentId === asm.id);
      const scored = subs.filter((s) => typeof s.score === 'number');
      const avg =
        scored.length > 0
          ? Number((scored.reduce((acc, curr) => acc + (curr.score || 0), 0) / scored.length).toFixed(1))
          : 0;
      const scores = scored.map((s) => s.score || 0);
      const maxAchieved = scores.length > 0 ? Math.max(...scores) : 0;
      const minAchieved = scores.length > 0 ? Math.min(...scores) : 0;
      const submitted = subs.filter((s) => s.status === 'submitted' || s.status === 'late').length;

      const shortTitle = asm.title.length > 14 ? asm.title.slice(0, 12) + '...' : asm.title;

      return {
        id: asm.id,
        name: shortTitle,
        fullTitle: asm.title,
        subjectName: subject?.name || 'ทั่วไป',
        subjectCode: subject?.code || '',
        avgScore: avg,
        maxScore: asm.maxScore,
        percentage: asm.maxScore > 0 ? Math.round((avg / asm.maxScore) * 100) : 0,
        maxAchieved,
        minAchieved,
        submittedCount: submitted,
        studentCount: activeClassStudents.length || 1,
        scoredCount: scored.length,
        missingCount: Math.max(0, (activeClassStudents.length || 1) - submitted),
      };
    });
  }, [activeClassAssignments, subjects, activeClassSubmissions, activeClassStudents.length]);

  // Class overall average score %
  const classAvgScorePercent = React.useMemo(() => {
    const scoredBars = barChartData.filter((b) => b.scoredCount > 0);
    if (scoredBars.length === 0) return 0;
    const sum = scoredBars.reduce((acc, curr) => acc + curr.percentage, 0);
    return Math.round(sum / scoredBars.length);
  }, [barChartData]);

  // Highest scoring assignment in active class
  const highestScoringAsm = React.useMemo(() => {
    const scoredBars = barChartData.filter((b) => b.scoredCount > 0);
    if (scoredBars.length === 0) return null;
    return [...scoredBars].sort((a, b) => b.percentage - a.percentage)[0];
  }, [barChartData]);

  // Calculations for general system metrics
  const totalStudents = students.length;
  const totalAssignments = assignments.length;

  // Total submissions status across whole system
  const submittedCount = submissions.filter((s) => s.status === 'submitted' || s.status === 'late').length;
  const missingCount = submissions.filter((s) => s.status === 'missing').length;

  // On-time percentage calculation
  const onTimeCount = submissions.filter((s) => s.status === 'submitted').length;
  const onTimeRate = submittedCount > 0 ? Math.round((onTimeCount / submittedCount) * 100) : 0;

  // Top urgent assignments with missing students
  const urgentAssignments = assignments.map((asm) => {
    const sub = subjects.find((s) => s.id === asm.subjectId);
    const cls = classes.find((c) => c.id === asm.classId);
    const relatedSubmissions = submissions.filter((s) => s.assignmentId === asm.id);
    const missingInAsm = relatedSubmissions.filter((s) => s.status === 'missing').length;
    const submittedInAsm = relatedSubmissions.filter((s) => s.status === 'submitted' || s.status === 'late').length;
    return {
      ...asm,
      subjectName: sub?.name || '',
      subjectCode: sub?.code || '',
      className: cls?.name || '',
      missingCount: missingInAsm,
      submittedCount: submittedInAsm,
    };
  }).sort((a, b) => b.missingCount - a.missingCount);

  // Students needing follow-up (highest missing count)
  const studentFollowUpList = students.map((stu) => {
    const stuSubs = submissions.filter((s) => s.studentId === stu.id);
    const missing = stuSubs.filter((s) => s.status === 'missing').length;
    return {
      ...stu,
      missingCount: missing,
    };
  }).filter((s) => s.missingCount > 0).sort((a, b) => b.missingCount - a.missingCount);

  // Top 5 XP Leaderboard
  const topExpStudents = [...students].sort((a, b) => b.totalExp - a.totalExp).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Hero Welcome & Husky Status Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-indigo-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-48 bottom-0 -mb-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 text-center md:text-left">
            <div className="w-20 h-20 bg-white/10 rounded-2xl p-2 backdrop-blur-xs flex items-center justify-center border border-white/20 shrink-0">
              <MascotSiby
                mood={missingCount > 0 ? 'remind' : 'happy'}
                size="md"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                ยินดีต้อนรับสู่ "ไซบี้ทวงงาน" 🐺
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenReminder}
              className="px-4 py-2.5 text-xs font-bold text-sky-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <span>🔔 คัดลอกข้อความทวงงานลงไลน์</span>
            </button>
            <button
              onClick={onNavigateToSeating}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl transition-colors backdrop-blur-xs"
            >
              🪑 เปิดผังที่นั่งในชั้น
            </button>
            {onOpenReportExport && (
              <button
                onClick={onOpenReportExport}
                className="px-4 py-2.5 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl transition-colors backdrop-blur-xs flex items-center gap-1.5"
              >
                <span>📄 สรุป ปพ.5 / ส่งออก</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Missing Homework */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">งานค้างที่ต้องติดตาม</div>
            <div className="text-2xl font-bold text-amber-600 mt-1 font-mono-numbers">
              {missingCount} <span className="text-xs font-normal text-slate-500">รายการ</span>
            </div>
            <div className="text-[11px] text-amber-700 mt-1">
              จาก {studentFollowUpList.length} คนที่ยังไม่ส่ง
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
            ⚠️
          </div>
        </div>

        {/* Card 2: Submitted On Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">อัตราส่งงานตรงเวลา</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono-numbers">
              {onTimeRate}%
            </div>
            <div className="text-[11px] text-emerald-700 mt-1">
              {onTimeCount} ชิ้นรับโบนัส +10 EXP
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            🎯
          </div>
        </div>

        {/* Card 3: Active Assignments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">งานที่เปิดมอบหมาย</div>
            <div className="text-2xl font-bold text-slate-800 mt-1 font-mono-numbers">
              {totalAssignments} <span className="text-xs font-normal text-slate-500">งาน</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              แบบทดสอบ, ใบงาน, งานกลุ่ม
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-xl font-bold">
            📝
          </div>
        </div>

        {/* Card 4: Total Students In Room */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">นักเรียนในระบบ</div>
            <div className="text-2xl font-bold text-slate-800 mt-1 font-mono-numbers">
              {totalStudents} <span className="text-xs font-normal text-slate-500">คน</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              ห้อง ม.3/1 (16 คน) & ม.3/2
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">
            🎒
          </div>
        </div>
      </div>

      {/* Active Classroom Analytics & Charts Section (Recharts) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
        {/* Section Header with Classroom Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-100 text-sky-700 text-base">📊</span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                สรุปภาพรวมและสถิติห้องเรียน (Active Class Analytics)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              สถิติการส่งงานและระดับคะแนนเฉลี่ยเฉพาะห้อง {currentClass?.name || 'ที่เลือก'} — อัปเดตข้อมูลแบบเรียลไทม์
            </p>
          </div>

          {/* Classroom Selector Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500">เลือกห้องเรียน:</span>
            <div className="inline-flex rounded-xl p-1 bg-slate-100/90 border border-slate-200/80">
              {classes.map((cls) => {
                const isSelected = cls.id === selectedClassId;
                const count = students.filter((s) => s.classId === cls.id).length;
                return (
                  <button
                    key={cls.id}
                    onClick={() => onSelectClass?.(cls.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>🏫 {cls.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected ? 'bg-sky-700/80 text-sky-100' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {count} คน
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Insights Ribbon for Selected Class */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500">คะแนนเฉลี่ยห้องเรียน</span>
            <div className="text-lg font-bold text-sky-700 font-mono-numbers">
              {classAvgScorePercent}%
            </div>
            <div className="text-[10px] text-slate-400">
              {classAvgScorePercent >= 80 ? '🌟 ผลการเรียนดีเยี่ยม' : classAvgScorePercent >= 65 ? '👍 ผลการเรียนเกณฑ์ดี' : '⚠️ ควรทบทวนเนื้อหา'}
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500">อัตราส่งงานสำเร็จ</span>
            <div className="text-lg font-bold text-emerald-600 font-mono-numbers">
              {activeOverallCompletion}%
            </div>
            <div className="text-[10px] text-emerald-700">
              ส่งแล้ว {activeTotalSubmitted} จาก {activeTotalSubs} ชิ้น
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500">งานที่คะแนนสูงสุด</span>
            <div className="text-sm font-bold text-slate-800 truncate" title={highestScoringAsm?.fullTitle}>
              {highestScoringAsm ? highestScoringAsm.name : '-'}
            </div>
            <div className="text-[10px] text-slate-400">
              {highestScoringAsm ? `เฉลี่ย ${highestScoringAsm.avgScore}/${highestScoringAsm.maxScore} (${highestScoringAsm.percentage}%)` : 'ยังไม่มีคะแนน'}
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500">งานค้างที่ต้องเร่งตาม</span>
            <div className="text-lg font-bold text-rose-600 font-mono-numbers">
              {activeMissing} <span className="text-xs font-normal text-slate-500">ชิ้น</span>
            </div>
            <div className="text-[10px] text-rose-600">
              {activeMissing > 0 ? 'ทวงงานผ่านไลน์ได้ทันที' : '✨ ไม่มีงานค้าง'}
            </div>
          </div>
        </div>

        {/* Charts 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Chart 1: Submission Status Donut Chart (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span>🍩 สถานะการส่งงาน</span>
                  <span className="text-[11px] font-normal text-slate-400">({currentClass?.name})</span>
                </h3>
                <span className="text-xs font-mono font-bold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full">
                  รวม {activeTotalSubs} ชิ้น
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                สัดส่วนงานที่ส่งตรงเวลา ส่งล่าช้า และงานที่ยังค้างส่ง
              </p>
            </div>

            {activeTotalSubs === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                ไม่มีข้อมูลการส่งงานในห้องนี้
              </div>
            ) : (
              <div>
                <div className="h-56 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Stat */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold font-mono text-slate-800">
                      {activeOverallCompletion}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">ส่งครบแล้ว</span>
                  </div>
                </div>

                {/* Status Badges Legend */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
                  <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                    <div className="text-[11px] text-emerald-700 font-medium flex items-center justify-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      ตรงเวลา
                    </div>
                    <div className="text-sm font-bold text-emerald-800 font-mono-numbers mt-0.5">
                      {activeSubmitted} <span className="text-[10px] font-normal">({activeTotalSubs > 0 ? Math.round((activeSubmitted / activeTotalSubs) * 100) : 0}%)</span>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                    <div className="text-[11px] text-amber-700 font-medium flex items-center justify-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      ส่งช้า
                    </div>
                    <div className="text-sm font-bold text-amber-800 font-mono-numbers mt-0.5">
                      {activeLate} <span className="text-[10px] font-normal">({activeTotalSubs > 0 ? Math.round((activeLate / activeTotalSubs) * 100) : 0}%)</span>
                    </div>
                  </div>

                  <div className="bg-rose-50 rounded-lg p-2 border border-rose-100">
                    <div className="text-[11px] text-rose-700 font-medium flex items-center justify-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      ค้างส่ง
                    </div>
                    <div className="text-sm font-bold text-rose-800 font-mono-numbers mt-0.5">
                      {activeMissing} <span className="text-[10px] font-normal">({activeTotalSubs > 0 ? Math.round((activeMissing / activeTotalSubs) * 100) : 0}%)</span>
                    </div>
                  </div>
                </div>

                {/* Method Breakdown Pills */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/40 flex items-center justify-between text-[11px] text-slate-500 px-1">
                  <span>ช่องทางส่งงาน:</span>
                  <div className="flex items-center gap-2">
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                      📄 กระดาษ {paperSubCount}
                    </span>
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                      📁 ไฟล์ {fileSubCount}
                    </span>
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                      💻 ออนไลน์ {onlineSubCount}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chart 2: Average Score vs Max Score Bar Chart (7 cols) */}
          <div className="lg:col-span-7 bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span>📊 คะแนนเฉลี่ยแต่ละชิ้นงาน</span>
                  <span className="text-[11px] font-normal text-slate-400">({currentClass?.name})</span>
                </h3>
                <span className="text-xs text-sky-600 font-medium">
                  {barChartData.length} ชิ้นงาน
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                เปรียบเทียบคะแนนเฉลี่ยที่นักเรียนทำได้ กับคะแนนเต็มของแต่ละงาน
              </p>
            </div>

            {barChartData.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                ยังไม่มีข้อมูลชิ้นงานในห้องเรียนนี้
              </div>
            ) : (
              <div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barChartData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        domain={[0, 'auto']}
                      />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
                        formatter={(value) => (value === 'avgScore' ? 'คะแนนเฉลี่ยห้อง' : 'คะแนนเต็ม')}
                      />
                      <Bar
                        dataKey="avgScore"
                        name="avgScore"
                        fill="#0284c7"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      />
                      <Bar
                        dataKey="maxScore"
                        name="maxScore"
                        fill="#cbd5e1"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
                  <span>💡</span>
                  <span>ชี้หรือแตะที่แท่งกราฟเพื่อดูรายละเอียด คะแนนสูงสุด-ต่ำสุด และจำนวนนักเรียนที่ส่งแล้ว</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Siby AI Assistant Dashboard Widget */}
      <div className="bg-gradient-to-br from-indigo-900 via-sky-900 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-sky-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-44 h-44 rounded-full bg-sky-500/10 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
              <MascotSiby mood="detective" size="sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>ไซบี้ AI ผู้ช่วยอัจฉริยะ (Siby AI Assistant)</span>
                  <span className="text-[10px] bg-amber-400 text-amber-950 font-bold px-1.5 py-0.2 rounded-full">
                    ขับเคลื่อนด้วย Gemini
                  </span>
                </h3>
              </div>
              <p className="text-xs text-sky-200 mt-0.5">
                ถามข้อมูล วิเคราะห์แนวโน้มผลการเรียน ชี้เป้านักเรียนที่เรียนไม่ทัน หรือวางแผนจับคู่กลุ่มกิจกรรม
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenAIChat?.()}
            className="px-3.5 py-1.5 text-xs font-bold text-sky-950 bg-sky-300 hover:bg-sky-200 rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0 self-end md:self-auto"
          >
            <span>💬 เปิดหน้าต่างแชท AI</span>
          </button>
        </div>

        {/* Quick Question Chips & Inline Query */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 flex-1">
            <span className="text-[11px] text-sky-300 font-semibold shrink-0">
              คำถามแนะนำ:
            </span>
            <button
              onClick={() =>
                onOpenAIChat?.('ใครกำลังเรียนตามไม่ทันในวิชาคณิตศาสตร์? (Who is falling behind in Math?)')
              }
              className="text-xs bg-white/10 hover:bg-white/20 text-sky-100 hover:text-white px-3 py-1 rounded-lg border border-white/15 whitespace-nowrap transition-colors text-left"
            >
              📐 ใครกำลังเรียนตามไม่ทันในวิชาคณิตศาสตร์?
            </button>
            <button
              onClick={() =>
                onOpenAIChat?.('สรุปแนวโน้มผลการเรียนและพฤติกรรมล่าสุด (Summarize recent performance trends)')
              }
              className="text-xs bg-white/10 hover:bg-white/20 text-sky-100 hover:text-white px-3 py-1 rounded-lg border border-white/15 whitespace-nowrap transition-colors text-left"
            >
              📊 สรุปแนวโน้มผลการเรียนล่าสุด
            </button>
            <button
              onClick={() =>
                onOpenAIChat?.('ใครยังค้างงานมากที่สุด และควรวางแผนทวงงานอย่างไร?')
              }
              className="text-xs bg-white/10 hover:bg-white/20 text-sky-100 hover:text-white px-3 py-1 rounded-lg border border-white/15 whitespace-nowrap transition-colors text-left"
            >
              ⚠️ ใครค้างงานมากที่สุด?
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (quickAiInput.trim()) {
                onOpenAIChat?.(quickAiInput);
                setQuickAiInput('');
              }
            }}
            className="flex items-center gap-1.5 sm:w-64 shrink-0"
          >
            <input
              type="text"
              value={quickAiInput}
              onChange={(e) => setQuickAiInput(e.target.value)}
              placeholder="พิมพ์คำถามถึงไซบี้..."
              className="w-full text-xs bg-white/15 border border-white/20 rounded-xl px-3 py-1.5 text-white placeholder-sky-200/60 focus:outline-none focus:ring-1 focus:ring-sky-300"
            />
            <button
              type="submit"
              className="px-2.5 py-1.5 text-xs font-bold bg-amber-400 text-amber-950 rounded-xl hover:bg-amber-300 shrink-0"
            >
              ถาม 🐾
            </button>
          </form>
        </div>
      </div>

      {/* Main Grid: Urgent Assignments + Students to Follow up + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Urgent Assignments & Fast Tracker */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Urgent Assignment Follow-up */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  📋 สรุปงานและสถานะการส่ง (Assignment Tracker)
                </h3>
                <p className="text-xs text-slate-500">
                  คลิกที่งานเพื่อดูรายชื่อนักเรียน ตรวจให้คะแนน หรือทวงงานรายบุคคล
                </p>
              </div>
              <button
                onClick={onOpenReminder}
                className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
              >
                ทวงงานทั้งหมด &rarr;
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {urgentAssignments.map((asm) => (
                <div
                  key={asm.id}
                  onClick={() => onSelectAssignment(asm.id)}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                        {asm.subjectCode}
                      </span>
                      <span className="text-xs text-slate-500">ห้อง {asm.className}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs font-semibold text-sky-600">
                        {asm.type === 'quiz' ? 'แบบทดสอบปรนัย' : asm.type === 'worksheet' ? 'ใบงาน' : 'งานกลุ่ม'}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-800 hover:text-sky-600 transition-colors">
                      {asm.title}
                    </div>
                    <div className="text-xs text-slate-400">
                      กำหนดส่ง: {new Date(asm.dueDate).toLocaleDateString('th-TH', { dateStyle: 'medium' })} · คะแนนเต็ม {asm.maxScore} คะแนน (+{asm.expReward} EXP)
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-emerald-600 font-medium">ส่งแล้ว {asm.submittedCount}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-amber-600 font-bold font-mono-numbers">
                          ค้าง {asm.missingCount} คน
                        </span>
                      </div>
                      <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5 ml-auto">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{
                            width: `${(asm.submittedCount / (asm.submittedCount + asm.missingCount || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-slate-400 text-sm font-bold">&rsaquo;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts to Smart Classroom Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={onNavigateToSeating}
              className="p-5 bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-200/80 rounded-2xl cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl group-hover:scale-110 transition-transform">🪑</span>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-700">
                  ไซบี้ Smart Seating (ผังที่นั่งอัจฉริยะ)
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                ลากย้ายโต๊ะอิสระ ผูกนักเรียนจริง แตะโต๊ะเพื่อให้คะแนนพฤติกรรมและตอบคำถามสดในคาบเรียน
              </p>
              <div className="mt-3 text-xs font-semibold text-sky-600 flex items-center gap-1">
                เปิดห้องเรียน ม.3/1 &rarr;
              </div>
            </div>

            <div
              onClick={onNavigateToRandomizer}
              className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl group-hover:scale-110 transition-transform">🎲</span>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">
                  ไซบี้สุ่มทีม & จับคู่
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                สุ่มแบ่งกลุ่ม คละความสามารถ จับคู่บัดดี้ฝึกสนทนา บันทึกประวัติ และส่งรายชื่อไปที่ผังที่นั่งได้ทันที
              </p>
              <div className="mt-3 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                เริ่มสุ่มกลุ่มกิจกรรม &rarr;
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Students to Follow Up + EXP Leaderboard */}
        <div className="space-y-6">
          {/* Card: Urgent Students */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>⚠️ นักเรียนที่มีงานค้าง</span>
                <span className="text-xs font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full">
                  {studentFollowUpList.length}
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              รายชื่อนักเรียนที่ต้องเร่งส่งงานเพื่อไม่ให้เสียสถิติ
            </p>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {studentFollowUpList.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  🎉 ไม่มีนักเรียนค้างงานเลย ทุกคนส่งครบ!
                </div>
              ) : (
                studentFollowUpList.map((stu) => (
                  <div
                    key={stu.id}
                    onClick={() => onSelectStudent(stu.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50/50 border border-slate-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{stu.avatar}</span>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {stu.nickname} ({stu.name.split(' ')[0]})
                        </div>
                        <div className="text-[10px] text-slate-400">
                          เลขที่ {stu.studentNumber} · ม.3/1
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        ค้าง {stu.missingCount} ชิ้น
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card: Leaderboard */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>🏆 จ่าฝูงไซบี้ (Top 5 EXP)</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              แต้มความขยันจากการส่งงานตรงเวลาและการมีส่วนร่วม
            </p>

            <div className="space-y-2">
              {topExpStudents.map((stu, idx) => (
                <div
                  key={stu.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-700 border border-amber-300'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-700'
                          : idx === 2
                          ? 'bg-amber-50 text-amber-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-base">{stu.avatar}</span>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {stu.nickname}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Lv.{stu.level} · Streak {stu.streak} 🔥
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono-numbers">
                    <div className="text-xs font-bold text-sky-600">
                      {stu.totalExp} <span className="text-[10px] font-normal text-slate-400">EXP</span>
                    </div>
                    <div className="text-[10px] text-amber-500">
                      🪙 {stu.coins} เหรียญ
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
