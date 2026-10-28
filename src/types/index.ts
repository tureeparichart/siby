export type AssignmentType = 'worksheet' | 'quiz' | 'group' | 'project';
export type SubmissionStatus = 'submitted' | 'late' | 'missing';
export type ScoreCategory = 'academic' | 'exp' | 'behavior' | 'participation';

export interface Student {
  id: string; // e.g. STU-001
  studentNumber: number;
  name: string;
  nickname: string;
  avatar: string;
  classId: string;
  gender: 'M' | 'F';
  totalExp: number;
  coins: number;
  level: number;
  streak: number;
  badges: string[]; // Badge IDs
  academicGpaEstimate?: number;
  isPresent?: boolean; // For daily attendance/grouping
}

export interface ClassRoom {
  id: string; // e.g. CLS-001
  name: string; // e.g. ม.3/1
  gradeLevel: string;
  roomCode: string;
  advisor: string;
  totalStudents: number;
}

export interface Subject {
  id: string; // e.g. SUB-001
  code: string; // e.g. ว23101
  name: string; // e.g. วิทยาศาสตร์ 3
  teacher: string;
  color: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  points: number;
  explanation?: string;
}

export interface AttachedFile {
  name: string;
  url: string;
  size?: number | string;
  driveFileId?: string;
  uploadedAt?: string;
}

export interface Assignment {
  id: string; // e.g. ASM-001
  title: string;
  description: string;
  classId: string;
  subjectId: string;
  type: AssignmentType;
  assignedDate: string;
  dueDate: string;
  maxScore: number;
  expReward: number;
  questions?: QuizQuestion[];
  instructions?: string;
  groupSize?: number;
  worksheetFile?: AttachedFile;
  answerKeyFile?: AttachedFile;
  solutionNotes?: string;
  isAnswerKeyVisible?: boolean; // When true, students can view answer key & solutions
}

export interface Submission {
  id: string; // e.g. SUBM-001
  assignmentId: string;
  studentId: string;
  submittedAt: string | null;
  status: SubmissionStatus;
  score?: number;
  maxScore: number;
  feedback?: string;
  quizAnswers?: number[];
  fileUrl?: string;
  fileName?: string;
  groupName?: string;
  submissionMethod?: 'file' | 'paper' | 'online' | 'quiz';
  paperNote?: string;
}

export interface Desk {
  id: string;
  x: number; // percentage or px
  y: number;
  rotation: number; // 0, 90, 180, 270
  studentId: string | null;
  deskNumber: number;
  teamId?: string | null;
}

export interface ClassroomLayout {
  id: string;
  classId: string;
  name: string;
  desks: Desk[];
  boardPosition: { x: number; y: number; width: number; label: string };
  teacherDesk: { x: number; y: number; label: string };
  doorPosition: { x: number; y: number; label: string };
  windowPosition: { x: number; y: number; label: string };
}

export interface ScoreTransaction {
  id: string;
  studentId: string;
  amount: number;
  category: ScoreCategory;
  reason: string;
  awardedBy: string;
  timestamp: string;
  assignmentId?: string;
}

export interface GroupTeam {
  id: string;
  name: string;
  color: string;
  studentIds: string[];
  activityScore?: number;
}

export interface GroupActivity {
  id: string;
  classId: string;
  subjectId: string;
  activityName: string;
  date: string;
  groupCount: number;
  mode: 'random' | 'ability_balanced' | 'pairs';
  teams: GroupTeam[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: string;
  expBonus: number;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  actor: string;
}

export type AttendanceStatus = 'present' | 'late' | 'leave' | 'absent';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note?: string;
}

export interface ClassroomAnnouncement {
  id: string;
  classId: string; // 'all' or classId
  title: string;
  content: string;
  createdAt: string;
  author: string;
  category: 'exam' | 'urgent' | 'homework' | 'general';
  isPinned?: boolean;
}

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  coinCost: number;
  icon: string;
  category: 'privilege' | 'item' | 'fun';
}

export interface RewardRedemption {
  id: string;
  studentId: string;
  studentName: string;
  rewardId: string;
  rewardTitle: string;
  coinCost: number;
  redeemedAt: string;
  status: 'pending' | 'approved' | 'used';
}

export interface SystemSettings {
  academicYear: string;
  term: string;
  schoolName: string;
  onTimeExpReward: number;
  streakBonusExp: number;
  googleSheetWebAppUrl: string;
  googleDriveFolderId?: string;
  googleDriveFolderName?: string;
  lastBackupDate?: string;
}
