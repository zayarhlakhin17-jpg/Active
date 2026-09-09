/**
 * Manhattan Habit & Activity Tracker Types
 */

export type HabitCategory =
  | "engineering"
  | "deep-focus"
  | "health"
  | "mindset"
  | "learning";

export interface Habit {
  id: string;
  title: string;
  description: string;
  category: HabitCategory;
  frequency: "daily" | "weekdays" | "weekly";
  targetCount: number; // e.g. 1 per day, 5 commits, 45 mins
  unit?: string; // e.g. "times", "mins", "commits"
  currentStreak: number;
  bestStreak: number;
  reminderTime?: string; // e.g. "21:00"
  completedDates: string[]; // ISO string "YYYY-MM-DD"
  createdAt: string;
  color: string;
  iconName?: string;
}

export type ScoreRating = "Strong" | "Developing" | "Weak" | "No Evidence";

export interface DailyScoreEntry {
  date: string; // "YYYY-MM-DD"
  score: number; // 0 - 100
  verdict: string; // "Missed target", "Target achieved", "Exemplary", etc.
  executionRatio?: string; // e.g. "0/5" or "5/5"
  commitsCount?: number;
  notes?: string;
  isProvisional?: boolean;
}

export interface OperatingRule {
  number: number;
  title: string;
  rule: string;
}

export interface ManhattanAuditData {
  latestAuditDate: string;
  timeZone: string;
  currentScore: number;
  rating: ScoreRating;
  verdict: string;
  dailyExecution: string; // e.g. "0/5"
  weeklyAcceptance: string; // e.g. "0/6 due Sep13"
  focusRatio: string; // e.g. "UNAVAILABLE" or "85%"
  wasteRatio: string; // e.g. "UNAVAILABLE" or "12%"
  timingStatus: string; // e.g. "Timing Import missing"
  daysLogged: number;
  averageScore: number;
  commitsRecorded: number;
  noEvidenceDays: number;
  history: DailyScoreEntry[];
  operatingRules: OperatingRule[];
}

export interface CleraDiaryEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  dayScore: number;
  executionRate: number; // 0 - 100%
  focusRatio: string;
  verdict: string;
  executiveSummary: string;
  biggestWin: string;
  biggestExecutionLeak: string;
  keyLessonReview: string;
  tomorrowsFirstAction: string;
  openQuestionsBlockers: string;
  cleraSecretaryNote: string;
  updatedAt: string;
}

export interface NotionConfig {
  apiKey: string;
  databaseId: string;
  lastSyncedAt?: string;
  autoSync: boolean;
}

export interface GoogleWorkspaceState {
  isAuthenticated: boolean;
  userEmail: string | null;
  userName: string | null;
  userPhoto: string | null;
  accessToken: string | null;
  lastSyncedSpreadsheetId?: string;
  lastCalendarEventId?: string;
}

export interface QuickWidget {
  id: string;
  type: "quick-habit" | "score-logger" | "stopwatch" | "win-leak-logger" | "kpi-glance";
  title: string;
  enabled: boolean;
}

export interface SyncState {
  isOnline: boolean;
  pendingSyncCount: number;
  lastCloudSync: string | null;
  isSyncing: boolean;
}

// Gamification Models
export interface Badge {
  id: string;
  name: string;
  description: string;
  category: "streak" | "milestone" | "evidence" | "mastery";
  iconName: string;
  unlocked: boolean;
  unlockedAt?: string;
  xpReward: number;
}

export interface UserGamification {
  xp: number;
  level: number;
  title: string;
  streakDays: number;
  highestStreak: number;
  streakMultiplier: number;
  badges: Badge[];
  recentXpGains: {
    id: string;
    amount: number;
    reason: string;
    timestamp: string;
  }[];
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  role: string;
  avatar: string;
  weeklyXp: number;
  totalXp: number;
  streak: number;
  tier: "Grandmaster" | "Master" | "Diamond" | "Emerald" | "Platinum";
  isCurrentUser?: boolean;
}

// Advanced Reporting & Correlation Models
export interface HabitCorrelation {
  habitA: string;
  habitB: string;
  coefficient: number; // -1.0 to 1.0
  relationship: "positive" | "negative" | "neutral";
  insight: string;
  confidence: "High" | "Medium" | "Developing";
  sampleSize: number;
}

export interface QuarterlyTrend {
  quarter: string; // "Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"
  avgScore: number;
  completionRate: number; // %
  totalCommits: number;
  focusHours: number;
  verdict: string;
}

export interface BurnoutMetrics {
  riskScore: number; // 0 (Optimal) to 100 (Critical Burnout)
  status: "Optimal Flow" | "Balanced" | "Mild Fatigue" | "High Burnout Risk";
  recoveryRatio: number; // % of restorative habits vs high-intensity
  consecutiveHeavyDays: number;
  lateNightAudits: number;
  recommendations: string[];
}

// AI Action & Function Execution
export type AiActionType =
  | "LOG_ACTIVITY"
  | "CREATE_HABIT"
  | "LOG_AUDIT"
  | "PROGRESS_SUMMARY";

export interface AiAction {
  type: AiActionType;
  habitTitle?: string;
  habitId?: string;
  activityName?: string;
  reminderTime?: string;
  category?: string;
  completed?: boolean;
  newHabit?: Partial<Habit>;
  auditScore?: number;
  auditNotes?: string;
  summaryPeriod?: "daily" | "weekly" | "monthly";
  targetHabitTitle?: string;
  applied?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  modelUsed?: string;
  action?: AiAction;
}

