/**
 * ADR Learning Center — Training Intelligence
 * Data Types and Contracts for Dashboard and Codex Integration
 */

export type DatabaseSource = 'PTU' | 'PTO' | 'Otomasi' | 'Staff' | 'Eksternal';

export type TrainingStatus = 'Terlaksana' | 'Berjalan' | 'Mendatang' | 'Dibatalkan';

export type AttendanceStatus = 'Hadir' | 'Izin' | 'Tidak Hadir' | 'Belum Diisi';

export interface L1AspectScores {
  materi: number; // 1.0 - 5.0
  trainer: number;
  fasilitas: number;
  penyelenggaraan: number;
}

export interface Participant {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  division: string;
  attendance: AttendanceStatus;
  pretestScore: number | null; // null represents empty/not taken, NOT 0
  posttestScore: number | null; // null represents empty/not taken, NOT 0
  l1Completed: boolean;
  l1Scores?: L1AspectScores;
}

export interface TrainingSession {
  id: string;
  sessionCode: string;
  period: string; // e.g., '2026-10', '2026-11', 'Q3-2026', 'Q4-2026'
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  trainer: string; // empty string indicates missing trainer
  location: string; // empty string indicates missing room
  status: TrainingStatus;
  budgetPlan: number; // in IDR
  actualCost: number; // in IDR (simulated)
  participants: Participant[];
}

export interface TrainingProgram {
  id: string;
  code: string;
  title: string;
  source: DatabaseSource;
  department: string;
  division: string;
  plannedClasses: number;
  sessions: TrainingSession[];
}

export interface FilterState {
  period: string; // 'all', '2026-Q4', '2026-11', '2026-10', etc.
  source: string; // 'Semua' | DatabaseSource
  department: string; // 'Semua' | department name
  searchQuery: string;
}

export interface TargetConfig {
  l1Target: number; // default: 4.25
  attendanceThreshold: number; // default: 85 (%)
  scoreDeltaTarget: number; // default: 15 (points)
  passingGrade: number; // default: 75 (points)
}

export type FindingCategory =
  | 'Kehadiran Belum Diisi'
  | 'Evaluasi Belum Lengkap'
  | 'Training Mendatang Tidak Lengkap'
  | 'Status Pelaksanaan Belum Jelas'
  | 'Konflik Data';

export interface SupervisorFinding {
  id: string;
  category: FindingCategory;
  severity: 'Tinggi' | 'Sedang' | 'Rendah';
  title: string;
  programTitle: string;
  sessionCode: string;
  department: string;
  source: DatabaseSource;
  evidenceCount: number;
  evidenceDetails: string[];
  inspectorRecommendation: string;
  reviewStatus: 'Perlu Ditinjau' | 'Ditinjau Demo';
}

export interface ViewSettings {
  showCEO: boolean;
  showL1: boolean;
  showL2: boolean;
  showSupervisor: boolean;
  showBudgetVsActualChart: boolean;
  showCostTrendChart: boolean;
  showSourceCompositionChart: boolean;
  showL1AspectsChart: boolean;
  showL1ProgramChart: boolean;
  showL1ResponseDonut: boolean;
  showL1TrendChart: boolean;
  showPlanVsActualChart: boolean;
  showAttendanceDonut: boolean;
  showPrePostPairedChart: boolean;
  showDeltaScoreChart: boolean;
  showAttendanceTrendChart: boolean;
  showFindingsCategoryChart: boolean;
}
