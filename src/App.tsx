import React, { useState, useEffect } from 'react';
import {
  Assignment,
  ClassRoom,
  ClassroomLayout,
  GroupActivity,
  ScoreTransaction,
  Student,
  Submission,
  Subject,
  SystemSettings,
  ClassroomAnnouncement,
  RewardItem,
  RewardRedemption,
  AttendanceRecord,
} from './types';
import {
  INITIAL_ASSIGNMENTS,
  INITIAL_BADGES,
  INITIAL_CLASSES,
  INITIAL_GROUP_ACTIVITIES,
  INITIAL_SCORE_TRANSACTIONS,
  INITIAL_SEATING_LAYOUT,
  INITIAL_SETTINGS,
  INITIAL_STUDENTS,
  INITIAL_SUBJECTS,
  INITIAL_SUBMISSIONS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_REWARDS,
  INITIAL_ATTENDANCE,
  INITIAL_REDEMPTIONS,
} from './data/initialData';
import { NavTab } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { SmartSeatingView } from './components/SmartSeatingView';
import { TeamRandomizerView } from './components/TeamRandomizerView';
import { AssignmentsView } from './components/AssignmentsView';
import { GradebookView } from './components/GradebookView';
import { GamificationView } from './components/GamificationView';
import { GoogleSheetsSetupView } from './components/GoogleSheetsSetupView';
import { ReminderModal } from './components/ReminderModal';
import { StudentView } from './components/StudentView';
import { SibyAIChatWidget } from './components/SibyAIChatWidget';
import { ClassroomManagerModal } from './components/ClassroomManagerModal';
import { SubjectManagerModal } from './components/SubjectManagerModal';
import { ZipGradeScannerView } from './components/ZipGradeScannerView';
import { ReportExportModal } from './components/ReportExportModal';
import { LoginScreen } from './components/LoginScreen';
import { SchoolSettingsModal } from './components/SchoolSettingsModal';

export default function App() {
  // Persistence via localStorage with fallback to initial sample data
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('siby_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [classes, setClasses] = useState<ClassRoom[]>(() => {
    const saved = localStorage.getItem('siby_classes');
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
  });

  const [activeClassId, setActiveClassId] = useState<string>(() => {
    const saved = localStorage.getItem('siby_active_class_id');
    return saved || 'CLS-001';
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('siby_subjects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((s: Subject) => s.code?.startsWith('ว') || s.name?.includes('พันธุศาสตร์'))) {
          return INITIAL_SUBJECTS;
        }
        return parsed;
      } catch {
        return INITIAL_SUBJECTS;
      }
    }
    return INITIAL_SUBJECTS;
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('siby_assignments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((a: Assignment) => a.title?.includes('เมนเดล') || a.title?.includes('DNA'))) {
          return INITIAL_ASSIGNMENTS;
        }
        return parsed;
      } catch {
        return INITIAL_ASSIGNMENTS;
      }
    }
    return INITIAL_ASSIGNMENTS;
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('siby_submissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((s: Submission) => s.feedback?.includes('เมนเดล'))) {
          return INITIAL_SUBMISSIONS;
        }
        return parsed;
      } catch {
        return INITIAL_SUBMISSIONS;
      }
    }
    return INITIAL_SUBMISSIONS;
  });

  const [layout, setLayout] = useState<ClassroomLayout>(() => {
    const saved = localStorage.getItem('siby_seating_layout');
    return saved ? JSON.parse(saved) : INITIAL_SEATING_LAYOUT;
  });

  const [scoreTransactions, setScoreTransactions] = useState<ScoreTransaction[]>(() => {
    const saved = localStorage.getItem('siby_score_transactions');
    return saved ? JSON.parse(saved) : INITIAL_SCORE_TRANSACTIONS;
  });

  const [groupHistory, setGroupHistory] = useState<GroupActivity[]>(() => {
    const saved = localStorage.getItem('siby_group_history');
    return saved ? JSON.parse(saved) : INITIAL_GROUP_ACTIVITIES;
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('siby_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('siby_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [announcements, setAnnouncements] = useState<ClassroomAnnouncement[]>(() => {
    const saved = localStorage.getItem('siby_announcements');
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  const [rewards, setRewards] = useState<RewardItem[]>(() => {
    const saved = localStorage.getItem('siby_rewards');
    return saved ? JSON.parse(saved) : INITIAL_REWARDS;
  });

  const [rewardRedemptions, setRewardRedemptions] = useState<RewardRedemption[]>(() => {
    const saved = localStorage.getItem('siby_redemptions');
    return saved ? JSON.parse(saved) : INITIAL_REDEMPTIONS;
  });

  // UI Navigation & Modals
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [userRole, setUserRole] = useState<'teacher' | 'student'>('teacher');
  const [isReminderOpen, setIsReminderOpen] = useState<boolean>(false);
  const [isStudentPortalOpen, setIsStudentPortalOpen] = useState<boolean>(false);
  const [isClassManagerOpen, setIsClassManagerOpen] = useState<boolean>(false);
  const [isSubjectManagerOpen, setIsSubjectManagerOpen] = useState<boolean>(false);
  const [isReportExportOpen, setIsReportExportOpen] = useState<boolean>(false);
  const [isSchoolSettingsOpen, setIsSchoolSettingsOpen] = useState<boolean>(false);
  const [authRole, setAuthRole] = useState<'teacher' | 'student' | null>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState<boolean>(false);
  const [initialAIQuery, setInitialAIQuery] = useState<string>('');
  const [activeStudentId, setActiveStudentId] = useState<string>(students[0]?.id || 'STU-001');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isTabletCollapsed, setIsTabletCollapsed] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('siby_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('siby_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('siby_active_class_id', activeClassId);
  }, [activeClassId]);

  useEffect(() => {
    localStorage.setItem('siby_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('siby_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem('siby_seating_layout', JSON.stringify(layout));
  }, [layout]);

  useEffect(() => {
    localStorage.setItem('siby_score_transactions', JSON.stringify(scoreTransactions));
  }, [scoreTransactions]);

  useEffect(() => {
    localStorage.setItem('siby_group_history', JSON.stringify(groupHistory));
  }, [groupHistory]);

  useEffect(() => {
    localStorage.setItem('siby_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('siby_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('siby_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('siby_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('siby_rewards', JSON.stringify(rewards));
  }, [rewards]);

  useEffect(() => {
    localStorage.setItem('siby_redemptions', JSON.stringify(rewardRedemptions));
  }, [rewardRedemptions]);

  // Attendance Toggle handler for a student
  const handleToggleStudentAttendance = (studentId: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setAttendanceRecords((prev) => {
      const existing = prev.find((r) => r.studentId === studentId && r.date === todayStr);
      const student = students.find((s) => s.id === studentId);
      if (!existing) {
        return [
          ...prev,
          {
            id: `ATT-${Date.now()}-${studentId}`,
            studentId,
            classId: student?.classId || activeClassId,
            date: todayStr,
            status: 'late',
          },
        ];
      }
      const cycleMap: Record<string, 'present' | 'late' | 'leave' | 'absent'> = {
        present: 'late',
        late: 'leave',
        leave: 'absent',
        absent: 'present',
      };
      const nextStatus = cycleMap[existing.status] || 'present';
      return prev.map((r) =>
        r.id === existing.id ? { ...r, status: nextStatus } : r
      );
    });
  };

  // Mark all present handler
  const handleMarkAllPresent = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const targetStudents = students.filter((s) => s.classId === activeClassId);
    setAttendanceRecords((prev) => {
      const targetIds = new Set(targetStudents.map((s) => s.id));
      const filteredPrev = prev.filter(
        (r) => !(targetIds.has(r.studentId) && r.date === todayStr)
      );
      const newRecords: AttendanceRecord[] = targetStudents.map((s) => ({
        id: `ATT-${Date.now()}-${s.id}`,
        studentId: s.id,
        classId: s.classId,
        date: todayStr,
        status: 'present',
      }));
      return [...filteredPrev, ...newRecords];
    });
  };

  // Redeem reward handler
  const handleRedeemReward = (studentId: string, rewardId: string) => {
    const reward = rewards.find((r) => r.id === rewardId);
    const student = students.find((s) => s.id === studentId);
    if (!reward || !student || student.coins < reward.coinCost) return;

    // Deduct coins
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, coins: s.coins - reward.coinCost } : s
      )
    );

    // Create redemption record
    const newRedemption: RewardRedemption = {
      id: `RED-${Date.now()}`,
      studentId: student.id,
      studentName: `${student.name} (${student.nickname})`,
      rewardId: reward.id,
      rewardTitle: reward.title,
      coinCost: reward.coinCost,
      redeemedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'approved',
    };
    setRewardRedemptions((prev) => [newRedemption, ...prev]);
  };

  // Handlers
  const handleAddSubject = (newSub: Subject) => {
    setSubjects((prev) => [...prev, newSub]);
  };

  const handleUpdateSubject = (updatedSub: Subject) => {
    setSubjects((prev) => prev.map((s) => (s.id === updatedSub.id ? updatedSub : s)));
  };

  const handleDeleteSubject = (subjectId: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
  };

  const handleAddAssignment = (newAsm: Assignment) => {
    setAssignments((prev) => [newAsm, ...prev]);
  };

  const handleUpdateAssignment = (updatedAsm: Assignment) => {
    setAssignments((prev) => prev.map((a) => (a.id === updatedAsm.id ? updatedAsm : a)));
  };

  const handleAddClass = (newClass: ClassRoom, customStudents?: Student[]) => {
    setClasses((prev) => [...prev, newClass]);
    if (customStudents && customStudents.length > 0) {
      setStudents((prev) => [...prev, ...customStudents]);
    } else {
      const sampleAvatars = ['🐶', '🦊', '🐱', '🐰', '🐼', '🐨', '🐯', '🦁', '🐵', '🦉', '🐸', '🦄'];
      const nicknames = ['เจมส์', 'พลอย', 'กันต์', 'มายด์', 'วิน', 'บีม', 'ฟ้า', 'นนท์', 'มุก', 'พีท', 'เบลล์', 'ภูมิ'];
      const firstNames = ['กิตติศักดิ์', 'พรปวีณ์', 'ธนดล', 'พิมพ์ลภัส', 'วชิรวิชญ์', 'ชญานิศ', 'กานต์รวี', 'นนทภัทร', 'มัณฑนา', 'พิชญุตม์', 'วรัญญา', 'ภัทรดนัย'];
      const lastNames = ['สุวรรณโชติ', 'เจริญรัตนกุล', 'วัฒนพาณิชย์', 'เลิศปัญญากุล', 'รุ่งเรืองวิทย์', 'เตชะวณิช', 'อิทธิโภคิน', 'มณีรัตน์', 'พิชัยสงคราม', 'ศิริเกษมโชค', 'บวรเกียรติ', 'ธนทรัพย์ไพศาล'];

      const newStudents: Student[] = Array.from({ length: 12 }, (_, i) => ({
        id: `STU-${newClass.id}-${String(i + 1).padStart(3, '0')}`,
        studentNumber: i + 1,
        name: `${firstNames[i]} ${lastNames[i]}`,
        nickname: nicknames[i],
        avatar: sampleAvatars[i % sampleAvatars.length],
        classId: newClass.id,
        gender: i % 2 === 0 ? 'M' : 'F',
        streak: Math.floor(Math.random() * 5) + 1,
        totalExp: 180 + i * 25,
        level: 2,
        coins: 10 + i * 2,
        badges: ['bdg-first-submit'],
        academicGpaEstimate: 3.0,
        isPresent: true,
      }));

      setStudents((prev) => [...prev, ...newStudents]);
    }
  };

  const handleUpdateClass = (updatedClass: ClassRoom, updatedStudents: Student[]) => {
    setClasses((prev) => prev.map((c) => (c.id === updatedClass.id ? updatedClass : c)));
    setStudents((prev) => {
      const remaining = prev.filter(
        (s) => s.classId !== updatedClass.id && s.classId !== updatedClass.name
      );
      return [...remaining, ...updatedStudents];
    });
  };

  const handleResetClassData = (classId: string) => {
    // 1. Reset students in this classroom
    setStudents((prev) =>
      prev.map((s) => {
        if (s.classId === classId || s.classId === classes.find((c) => c.id === classId)?.name) {
          return {
            ...s,
            totalExp: 100,
            level: 1,
            coins: 0,
            streak: 1,
            isPresent: true,
          };
        }
        return s;
      })
    );

    // 2. Reset submissions for assignments of this classroom
    const classAssignmentIds = assignments.filter((a) => a.classId === classId).map((a) => a.id);
    const classStudentIds = students
      .filter((s) => s.classId === classId || s.classId === classes.find((c) => c.id === classId)?.name)
      .map((s) => s.id);

    setSubmissions((prev) =>
      prev.map((sub) => {
        if (classAssignmentIds.includes(sub.assignmentId) || classStudentIds.includes(sub.studentId)) {
          return {
            ...sub,
            status: 'missing',
            score: undefined,
            submittedAt: null,
            quizAnswers: undefined,
            feedback: undefined,
            fileUrl: undefined,
            fileName: undefined,
            paperNote: undefined,
          };
        }
        return sub;
      })
    );

    // 3. Clear attendance records for this classroom
    setAttendanceRecords((prev) =>
      prev.filter((att) => att.classId !== classId && !classStudentIds.includes(att.studentId))
    );

    // 4. Clear score transactions for students in this classroom
    setScoreTransactions((prev) => prev.filter((tx) => !classStudentIds.includes(tx.studentId)));
  };

  const handleUpdateSubmission = (updatedSub: Submission) => {
    setSubmissions((prev) => {
      const idx = prev.findIndex(
        (s) =>
          s.id === updatedSub.id ||
          (s.assignmentId === updatedSub.assignmentId && s.studentId === updatedSub.studentId)
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedSub;
        return copy;
      }
      return [...prev, updatedSub];
    });
  };

  const handleAddScoreTransaction = (tx: Omit<ScoreTransaction, 'id' | 'timestamp'>) => {
    const newTx: ScoreTransaction = {
      ...tx,
      id: `TX-${Date.now()}`,
      timestamp: new Date().toLocaleString('th-TH'),
    };
    setScoreTransactions((prev) => [...prev, newTx]);

    // Update student EXP or Level
    setStudents((prev) =>
      prev.map((stu) => {
        if (stu.id === tx.studentId) {
          const expGain =
            tx.category === 'exp' ? tx.amount : tx.category === 'participation' ? tx.amount * 5 : 5;
          const newExp = Math.max(0, stu.totalExp + expGain);
          const newLevel = Math.max(1, Math.min(5, Math.floor(newExp / 100) + 1));
          return {
            ...stu,
            totalExp: newExp,
            level: newLevel,
          };
        }
        return stu;
      })
    );
  };

  const handleAddBatchScoreTransactions = (
    studentIds: string[],
    amount: number,
    category: 'academic' | 'exp' | 'behavior' | 'participation',
    reason: string
  ) => {
    const timestamp = new Date().toLocaleString('th-TH');
    const newTxs: ScoreTransaction[] = studentIds.map((studentId, idx) => ({
      id: `TX-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      studentId,
      amount,
      category,
      reason,
      awardedBy: 'คุณครูปาริชาติ (ผังที่นั่งอัจฉริยะ - ให้คะแนนหลายคน)',
      timestamp,
    }));

    setScoreTransactions((prev) => [...prev, ...newTxs]);

    setStudents((prev) =>
      prev.map((stu) => {
        if (studentIds.includes(stu.id)) {
          const expGain =
            category === 'exp' ? amount : category === 'participation' ? amount * 5 : 5;
          const newExp = Math.max(0, stu.totalExp + expGain);
          const newLevel = Math.max(1, Math.min(5, Math.floor(newExp / 100) + 1));
          return {
            ...stu,
            totalExp: newExp,
            level: newLevel,
          };
        }
        return stu;
      })
    );
  };

  const handleManualAwardExp = (studentId: string, amount: number, coins: number, reason: string) => {
    handleAddScoreTransaction({
      studentId,
      amount,
      category: 'exp',
      reason,
      awardedBy: 'คุณครู (คะแนนพิเศษ)',
    });

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              coins: s.coins + coins,
            }
          : s
      )
    );
  };

  const handleAwardGroupScore = (
    _teamId: string,
    studentIds: string[],
    score: number,
    exp: number,
    reason: string
  ) => {
    studentIds.forEach((stuId) => {
      handleAddScoreTransaction({
        studentId: stuId,
        amount: exp,
        category: 'exp',
        reason: `${reason} (วิชาการ: +${score})`,
        awardedBy: 'คุณครู (กิจกรรมกลุ่ม)',
      });
    });
  };

  const handleSaveGroupActivity = (activity: GroupActivity) => {
    setGroupHistory((prev) => [activity, ...prev]);
  };

  const handleSubmitHomeworkFromStudent = (
    assignmentId: string,
    studentId: string,
    options?: {
      answers?: number[];
      method?: 'file' | 'paper' | 'online' | 'quiz';
      fileData?: { name: string; url: string; size?: number | string };
      paperNote?: string;
    }
  ) => {
    const asm = assignments.find((a) => a.id === assignmentId);
    if (!asm) return;

    let calcScore: number | undefined = undefined;
    const answers = options?.answers;
    if (asm.type === 'quiz' && asm.questions && answers) {
      calcScore = 0;
      answers.forEach((ans, idx) => {
        if (asm.questions![idx] && ans === asm.questions![idx].correctOptionIndex) {
          calcScore! += asm.questions![idx].points;
        }
      });
    }

    const now = new Date();
    const isLate = now.getTime() > new Date(asm.dueDate).getTime();
    const status = isLate ? 'late' : 'submitted';
    const method = options?.method || (answers ? 'quiz' : 'file');

    let feedbackMsg = 'ส่งงานเรียบร้อย รอครูตรวจ';
    if (calcScore !== undefined) {
      feedbackMsg = `ทำแบบทดสอบได้ ${calcScore}/${asm.maxScore}`;
    } else if (method === 'paper') {
      feedbackMsg = 'ส่งเป็นกระดาษที่โต๊ะครูเรียบร้อย (รอครูตรวจให้คะแนน)';
    } else if (method === 'file') {
      feedbackMsg = options?.fileData?.name ? `ส่งไฟล์ "${options.fileData.name}" เรียบร้อย (รอตรวจ)` : 'ส่งไฟล์งานเรียบร้อย';
    }

    const newSub: Submission = {
      id: `SUBM-${Date.now()}`,
      assignmentId,
      studentId,
      submittedAt: now.toISOString(),
      status,
      score: calcScore,
      maxScore: asm.maxScore,
      quizAnswers: answers,
      submissionMethod: method,
      paperNote: options?.paperNote,
      fileName: options?.fileData?.name,
      fileUrl: options?.fileData?.url,
      feedback: feedbackMsg,
    };

    handleUpdateSubmission(newSub);

    // Award on-time EXP!
    if (!isLate) {
      handleAddScoreTransaction({
        studentId,
        amount: asm.expReward,
        category: 'exp',
        reason: `ส่งงานตรงเวลา "${asm.title}" (${method === 'paper' ? 'กระดาษ' : 'ออนไลน์'})`,
        awardedBy: 'ไซบี้ทวงงาน อัตโนมัติ',
      });
    }
  };

  // Missing homework count across all active assignments
  const pendingCount = submissions.filter((s) => s.status === 'missing').length;

  // JSON Backup String
  const fullBackupData = JSON.stringify(
    {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      students,
      classes,
      subjects,
      assignments,
      submissions,
      layout,
      scoreTransactions,
      groupHistory,
      settings,
    },
    null,
    2
  );

  // If not logged in, show the LoginScreen
  if (authRole === null) {
    return (
      <LoginScreen
        classes={classes}
        students={students}
        settings={settings}
        onLoginTeacher={() => {
          setAuthRole('teacher');
          setUserRole('teacher');
        }}
        onLoginStudent={(studentId, classId) => {
          setAuthRole('student');
          setUserRole('student');
          setActiveClassId(classId);
          setActiveStudentId(studentId);
          setIsStudentPortalOpen(true);
        }}
      />
    );
  }

  // If logged in as student, display the full-page native mobile-first student view
  if (authRole === 'student') {
    return (
      <StudentView
        settings={settings}
        students={students}
        currentStudentId={activeStudentId}
        onSelectStudentId={setActiveStudentId}
        assignments={assignments}
        submissions={submissions}
        subjects={subjects}
        badges={INITIAL_BADGES}
        layout={layout}
        classes={classes}
        announcements={announcements}
        rewards={rewards}
        redemptions={rewardRedemptions}
        attendanceRecords={attendanceRecords}
        onLogout={() => {
          setAuthRole(null);
          setUserRole('teacher');
          setIsStudentPortalOpen(false);
        }}
        onRedeemReward={handleRedeemReward}
        onSubmitHomework={handleSubmitHomeworkFromStudent}
      />
    );
  }

  // If in teacher session but switched to student preview mode
  if (userRole === 'student') {
    return (
      <StudentView
        settings={settings}
        students={students}
        currentStudentId={activeStudentId}
        onSelectStudentId={setActiveStudentId}
        assignments={assignments}
        submissions={submissions}
        subjects={subjects}
        badges={INITIAL_BADGES}
        layout={layout}
        classes={classes}
        announcements={announcements}
        rewards={rewards}
        redemptions={rewardRedemptions}
        attendanceRecords={attendanceRecords}
        onBackToTeacher={() => {
          setUserRole('teacher');
          setIsStudentPortalOpen(false);
        }}
        onLogout={() => {
          setAuthRole(null);
          setUserRole('teacher');
          setIsStudentPortalOpen(false);
        }}
        onRedeemReward={handleRedeemReward}
        onSubmitHomework={handleSubmitHomeworkFromStudent}
      />
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-800">
      {/* Responsive Left Sidebar: Desktop Full, Tablet Collapsible, Mobile Drawer */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        pendingCount={pendingCount}
        userRole={userRole}
        onToggleRole={() => {
          if (userRole === 'teacher') {
            setUserRole('student');
            setIsStudentPortalOpen(true);
          } else {
            setUserRole('teacher');
            setIsStudentPortalOpen(false);
          }
        }}
        onOpenQuickRemind={() => setIsReminderOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isTabletCollapsed={isTabletCollapsed}
        onToggleTabletCollapse={() => setIsTabletCollapsed((prev) => !prev)}
        onOpenAIChat={() => setIsAIChatOpen(true)}
        classes={classes}
        activeClassId={activeClassId}
        onSelectClass={setActiveClassId}
        onOpenClassManager={() => setIsClassManagerOpen(true)}
        onLogout={() => {
          setAuthRole(null);
          setUserRole('teacher');
        }}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Sticky Top Header with Breadcrumbs & Single Mode Switcher */}
        <TopHeader
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          isTabletCollapsed={isTabletCollapsed}
          onToggleTabletCollapse={() => setIsTabletCollapsed((prev) => !prev)}
          userRole={userRole}
          onToggleRole={() => {
            if (userRole === 'teacher') {
              setUserRole('student');
              setIsStudentPortalOpen(true);
            } else {
              setUserRole('teacher');
              setIsStudentPortalOpen(false);
            }
          }}
        />

        {/* Dynamic SPA Module Container (Pure in-page switch, Scrollable, No Reload) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              students={students}
              assignments={assignments}
              submissions={submissions}
              classes={classes}
              subjects={subjects}
              activeClassId={activeClassId}
              onSelectClass={setActiveClassId}
              onOpenReminder={() => setIsReminderOpen(true)}
              onNavigateToSeating={() => setActiveTab('seating')}
              onNavigateToRandomizer={() => setActiveTab('randomizer')}
              onSelectAssignment={(_asmId) => {
                setActiveTab('assignments');
              }}
              onSelectStudent={(stuId) => {
                setActiveStudentId(stuId);
                setUserRole('student');
              }}
              onOpenAIChat={(query) => {
                if (query) setInitialAIQuery(query);
                setIsAIChatOpen(true);
              }}
              onOpenReportExport={() => setIsReportExportOpen(true)}
            />
          )}

          {activeTab === 'assignments' && (
            <AssignmentsView
              assignments={assignments}
              classes={classes}
              subjects={subjects}
              students={students}
              submissions={submissions}
              onAddAssignment={handleAddAssignment}
              onUpdateAssignment={handleUpdateAssignment}
              onUpdateSubmission={handleUpdateSubmission}
              onOpenReminderModal={() => setIsReminderOpen(true)}
              googleDriveFolderName={settings.googleDriveFolderName}
              onOpenClassManager={() => setIsClassManagerOpen(true)}
              onOpenSubjectManager={() => setIsSubjectManagerOpen(true)}
              onNavigateToZipGrade={() => setActiveTab('zipgrade')}
            />
          )}

          {activeTab === 'seating' && (
            <SmartSeatingView
              layout={layout}
              onUpdateLayout={setLayout}
              students={students}
              submissions={submissions}
              scoreTransactions={scoreTransactions}
              onAddScoreTransaction={handleAddScoreTransaction}
              onAddBatchScoreTransactions={handleAddBatchScoreTransactions}
              onSelectStudentProfile={(stuId) => {
                setActiveStudentId(stuId);
                setUserRole('student');
              }}
              attendanceRecords={attendanceRecords}
              onToggleStudentAttendance={handleToggleStudentAttendance}
              onMarkAllPresent={handleMarkAllPresent}
            />
          )}

          {activeTab === 'randomizer' && (
            <TeamRandomizerView
              students={students}
              subjects={subjects}
              groupHistory={groupHistory}
              classes={classes}
              activeClassId={activeClassId}
              onSaveGroupActivity={handleSaveGroupActivity}
              onAwardGroupScore={handleAwardGroupScore}
              onAwardIndividualExp={(stuId, exp, reason) =>
                handleManualAwardExp(stuId, exp, 1, reason)
              }
              onOpenSubjectManager={() => setIsSubjectManagerOpen(true)}
            />
          )}

          {activeTab === 'zipgrade' && (
            <ZipGradeScannerView
              students={students}
              assignments={assignments}
              submissions={submissions}
              classes={classes}
              activeClassId={activeClassId}
              onUpdateSubmission={handleUpdateSubmission}
              onAddScoreTransaction={handleAddScoreTransaction}
              onSelectStudentProfile={(stuId) => {
                setActiveStudentId(stuId);
                setUserRole('student');
              }}
            />
          )}

          {activeTab === 'gradebook' && (
            <GradebookView
              students={students}
              assignments={assignments}
              submissions={submissions}
              classes={classes}
              subjects={subjects}
              onUpdateSubmission={handleUpdateSubmission}
              onOpenSubjectManager={() => setIsSubjectManagerOpen(true)}
              onNavigateToZipGrade={() => setActiveTab('zipgrade')}
              onOpenReportExport={() => setIsReportExportOpen(true)}
            />
          )}

          {activeTab === 'gamification' && (
            <GamificationView
              students={students}
              badges={INITIAL_BADGES}
              transactions={scoreTransactions}
              onAwardManualExp={handleManualAwardExp}
            />
          )}

          {activeTab === 'sheets' && (
            <GoogleSheetsSetupView
              settings={settings}
              onUpdateSettings={setSettings}
              fullDataBackupJson={fullBackupData}
              onOpenSchoolSettings={() => setIsSchoolSettingsOpen(true)}
              onRestoreBackup={(jsonStr) => {
                try {
                  const parsed = JSON.parse(jsonStr);
                  if (parsed.students) setStudents(parsed.students);
                  if (parsed.assignments) setAssignments(parsed.assignments);
                  if (parsed.submissions) setSubmissions(parsed.submissions);
                  if (parsed.layout) setLayout(parsed.layout);
                } catch {
                  // backup format error
                }
              }}
            />
          )}
        </main>
      </div>

      {/* Classroom Manager Modal (Multiple classrooms creation & switcher & reset) */}
      <ClassroomManagerModal
        isOpen={isClassManagerOpen}
        onClose={() => setIsClassManagerOpen(false)}
        classes={classes}
        activeClassId={activeClassId}
        onSelectClass={setActiveClassId}
        onAddClass={handleAddClass}
        onUpdateClass={handleUpdateClass}
        onResetClassData={handleResetClassData}
        students={students}
      />

      {/* Subject Manager Modal (Add/Edit/Delete Subjects) */}
      <SubjectManagerModal
        isOpen={isSubjectManagerOpen}
        onClose={() => setIsSubjectManagerOpen(false)}
        subjects={subjects}
        onAddSubject={handleAddSubject}
        onUpdateSubject={handleUpdateSubject}
        onDeleteSubject={handleDeleteSubject}
      />

      {/* Reminder Message Generator Modal */}
      <ReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        assignments={assignments}
        students={students}
        submissions={submissions}
        subjects={subjects}
      />



      {/* Report & Gradebook Export Modal (PhorPhor 5 & Individual Report Card) */}
      <ReportExportModal
        isOpen={isReportExportOpen}
        onClose={() => setIsReportExportOpen(false)}
        classes={classes}
        subjects={subjects}
        students={students}
        assignments={assignments}
        submissions={submissions}
        attendanceRecords={attendanceRecords}
        activeClassId={activeClassId}
        settings={settings}
      />

      {/* School Settings Modal (School Name, Term, Academic Year) */}
      <SchoolSettingsModal
        isOpen={isSchoolSettingsOpen}
        onClose={() => setIsSchoolSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings(newSettings)}
      />

      {/* Siby AI Assistant Chatbot Widget */}
      <SibyAIChatWidget
        students={students}
        assignments={assignments}
        submissions={submissions}
        classes={classes}
        subjects={subjects}
        isOpen={isAIChatOpen}
        onToggleOpen={(open) => setIsAIChatOpen(open)}
        initialQuery={initialAIQuery}
        onOpenReminderModal={() => setIsReminderOpen(true)}
        onNavigateToSeating={() => setActiveTab('seating')}
      />
    </div>
  );
}
