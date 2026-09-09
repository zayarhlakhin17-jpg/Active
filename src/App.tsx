/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  ManhattanAuditData,
  CleraDiaryEntry,
  Habit,
  GoogleWorkspaceState,
  NotionConfig,
  DailyScoreEntry,
  UserGamification,
  AiAction,
} from "./types";
import {
  loadLocalState,
  saveLocalState,
  pushToCloudSync,
  pullFromCloudSync,
  getPendingSyncCount,
} from "./services/offlineStorage";
import { initialGamification } from "./data/initialData";
import { initAuth } from "./services/firebaseAuth";
import { Visualizer3D } from "./components/Visualizer3D";
import { HabitDashboard } from "./components/HabitDashboard";
import { ManhattanAuditView } from "./components/ManhattanAuditView";
import { CleraDiaryView } from "./components/CleraDiaryView";
import { InteractiveCharts } from "./components/InteractiveCharts";
import { AdvancedAnalytics } from "./components/AdvancedAnalytics";
import { GamificationCenter } from "./components/GamificationCenter";
import { QuickEntryWidgets } from "./components/QuickEntryWidgets";
import { AiChatbot } from "./components/AiChatbot";
import { WorkspaceSyncModal } from "./components/WorkspaceSyncModal";
import { NotionSyncModal } from "./components/NotionSyncModal";
import { AddHabitModal } from "./components/AddHabitModal";
import {
  Flame,
  Shield,
  BookOpen,
  TrendingUp,
  LayoutDashboard,
  Moon,
  Sun,
  Bot,
  FileSpreadsheet,
  Database,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  Bell,
  Trophy,
  Zap,
  Sparkles,
} from "lucide-react";

export default function App() {
  // Theme state: dark mode default for premium executive look
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("manhattan_theme_preference");
    return savedTheme !== "light";
  });

  // Core Data States
  const [habits, setHabits] = useState<Habit[]>([]);
  const [auditData, setAuditData] = useState<ManhattanAuditData | null>(null);
  const [diary, setDiary] = useState<CleraDiaryEntry | null>(null);
  const [gamification, setGamification] = useState<UserGamification>(initialGamification);
  const [notionConfig, setNotionConfig] = useState<NotionConfig>({
    apiKey: "",
    databaseId: "",
    autoSync: false,
  });

  // Active View Tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "habits" | "audit" | "diary" | "analytics" | "gamification"
  >("overview");

  // Google Workspace state
  const [workspaceState, setWorkspaceState] = useState<GoogleWorkspaceState>({
    isAuthenticated: false,
    userEmail: null,
    userName: null,
    userPhoto: null,
    accessToken: null,
  });

  // Modals & Drawers
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isNotionModalOpen, setIsNotionModalOpen] = useState(false);
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  // Network & Sync State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Initialize Data from Local Storage
  useEffect(() => {
    const initial = loadLocalState();
    setHabits(initial.habits);
    setAuditData(initial.auditData);
    setDiary(initial.diary);
    setNotionConfig(initial.notionConfig);
    if (initial.gamification) {
      setGamification(initial.gamification);
    }
    setPendingSyncCount(getPendingSyncCount());
  }, []);

  // Sync dark class on root document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("manhattan_theme_preference", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("manhattan_theme_preference", "light");
    }
  }, [isDarkMode]);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast("Online connection restored. Local state synchronized.");
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast("Offline mode active. Edits safely queued in local storage.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setWorkspaceState({
          isAuthenticated: true,
          userEmail: user.email,
          userName: user.displayName,
          userPhoto: user.photoURL,
          accessToken: token,
        });
      },
      () => {
        setWorkspaceState((prev) => ({
          ...prev,
          isAuthenticated: false,
          accessToken: null,
        }));
      }
    );

    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setSyncToast(msg);
    setTimeout(() => setSyncToast(null), 3000);
  };

  // Gamification XP Awarder
  const awardXp = (basePoints: number, reason: string) => {
    setGamification((prev) => {
      const added = Math.round(basePoints * (prev.streakMultiplier || 1));
      const newXp = prev.xp + added;
      const newLevel = Math.floor(newXp / 500) + 1;

      // Check milestone badges
      const updatedBadges = prev.badges.map((b) => {
        if (!b.unlocked) {
          if (b.id === "badge-1" && prev.streakDays >= 1) {
            return { ...b, unlocked: true, unlockedAt: new Date().toISOString().slice(0, 10) };
          }
          if (b.id === "badge-7d-ignition" && prev.streakDays >= 7) {
            return { ...b, unlocked: true, unlockedAt: new Date().toISOString().slice(0, 10) };
          }
          if (b.id === "badge-30d-titan" && prev.streakDays >= 30) {
            return { ...b, unlocked: true, unlockedAt: new Date().toISOString().slice(0, 10) };
          }
        }
        return b;
      });

      const updated: UserGamification = {
        ...prev,
        xp: newXp,
        level: Math.max(prev.level, newLevel),
        badges: updatedBadges,
        recentXpGains: [
          {
            id: `xp-${Date.now()}`,
            amount: added,
            reason,
            timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
          },
          ...prev.recentXpGains.slice(0, 5),
        ],
      };

      saveLocalState({ gamification: updated });
      return updated;
    });
  };

  // Toggle Habit completion for a date
  const handleToggleHabit = (habitId: string, date: string) => {
    setHabits((prev) => {
      let isNewlyCompleted = false;

      const updated = prev.map((h) => {
        if (h.id !== habitId) return h;
        const exists = h.completedDates.includes(date);
        isNewlyCompleted = !exists;

        const newCompleted = exists
          ? h.completedDates.filter((d) => d !== date)
          : [...h.completedDates, date];

        // Recalculate streak
        const newStreak = exists
          ? Math.max(0, h.currentStreak - 1)
          : h.currentStreak + 1;
        const newBest = Math.max(h.bestStreak, newStreak);

        return {
          ...h,
          completedDates: newCompleted,
          currentStreak: newStreak,
          bestStreak: newBest,
        };
      });

      saveLocalState({ habits: updated });
      setPendingSyncCount(getPendingSyncCount());

      if (isNewlyCompleted) {
        awardXp(30, "Habit completed on schedule");
      }

      return updated;
    });
  };

  // Add custom habit
  const handleAddHabit = (newHabit: Habit) => {
    setHabits((prev) => {
      const updated = [newHabit, ...prev];
      saveLocalState({ habits: updated });
      setPendingSyncCount(getPendingSyncCount());
      return updated;
    });
    awardXp(50, `Configured new habit: "${newHabit.title}"`);
    showToast(`Added habit: "${newHabit.title}" (+50 XP)`);
  };

  // Handle Natural Language Actions dispatched by AI Chatbot
  const handleExecuteAiAction = (action: AiAction) => {
    const today = new Date().toISOString().slice(0, 10);

    if (action.type === "LOG_ACTIVITY") {
      // Find matching habit or default to first habit
      const targetHabit =
        habits.find(
          (h) =>
            action.activityName &&
            (h.title.toLowerCase().includes(action.activityName.toLowerCase()) ||
              action.activityName.toLowerCase().includes(h.title.toLowerCase()))
        ) || habits[0];

      if (targetHabit) {
        handleToggleHabit(targetHabit.id, today);
        awardXp(50, `AI Logged: ${action.activityName || targetHabit.title}`);
        showToast(
          `🏃 Logged activity for "${targetHabit.title}" (+50 XP)`
        );
      }
    } else if (action.type === "CREATE_HABIT") {
      const newHabit: Habit = {
        id: `habit-${Date.now()}`,
        title: action.habitTitle || "New AI Scheduled Habit",
        description: `Automated habit initiated via Clera AI advisor${
          action.reminderTime ? ` (Reminder: ${action.reminderTime})` : ""
        }.`,
        category: (action.category as any) || "deep-focus",
        frequency: "daily",
        targetCount: 1,
        unit: "times",
        currentStreak: 1,
        bestStreak: 1,
        completedDates: [today],
        reminderTime: action.reminderTime || "09:00",
        createdAt: today,
        color: "indigo",
        iconName: "Zap",
      };

      handleAddHabit(newHabit);
      awardXp(100, `AI Automated: "${newHabit.title}"`);
      showToast(`✨ AI created habit: "${newHabit.title}" (+100 XP)`);
    } else if (action.type === "LOG_AUDIT") {
      if (typeof action.auditScore === "number") {
        handleAddAuditScore({
          date: today,
          score: action.auditScore,
          verdict: action.auditScore >= 80 ? "Strong execution" : "Developing progress",
          executionRatio: action.auditScore >= 80 ? "5/5" : "3/5",
          commitsCount: 2,
          notes: "Audit recorded automatically via Clera AI Chatbot command.",
        });
        awardXp(75, `Audit Score Recorded: ${action.auditScore}/100`);
      }
    } else if (action.type === "PROGRESS_SUMMARY") {
      showToast("Clera AI calculated your weekly habit evidence summary.");
      setActiveTab("analytics");
    }
  };

  // Log a new or edited audit score
  const handleAddAuditScore = (entry: DailyScoreEntry) => {
    if (!auditData) return;

    const existingIndex = auditData.history.findIndex((h) => h.date === entry.date);
    let newHistory = [...auditData.history];
    if (existingIndex >= 0) {
      newHistory[existingIndex] = entry;
    } else {
      newHistory = [entry, ...newHistory];
    }

    const newAvg = Number(
      (newHistory.reduce((a, b) => a + b.score, 0) / newHistory.length).toFixed(1)
    );

    const updatedAudit: ManhattanAuditData = {
      ...auditData,
      latestAuditDate: entry.date,
      currentScore: entry.score,
      verdict: entry.verdict.toUpperCase(),
      rating:
        entry.score >= 80
          ? "Strong"
          : entry.score >= 60
          ? "Developing"
          : entry.score > 0
          ? "Weak"
          : "No Evidence",
      dailyExecution: entry.executionRatio || auditData.dailyExecution,
      averageScore: newAvg,
      history: newHistory,
      daysLogged: newHistory.length,
    };

    setAuditData(updatedAudit);
    saveLocalState({ auditData: updatedAudit });
    setPendingSyncCount(getPendingSyncCount());
    showToast(`Audit recorded for ${entry.date}: Score ${entry.score}/100`);
  };

  // Update Diary
  const handleUpdateDiary = (updatedDiary: CleraDiaryEntry) => {
    setDiary(updatedDiary);
    saveLocalState({ diary: updatedDiary });
    setPendingSyncCount(getPendingSyncCount());
    showToast("Clera Executive Diary updated.");
  };

  // Quick Score Logger
  const handleQuickLogScore = (score: number, verdict: string) => {
    const today = new Date().toISOString().slice(0, 10);
    handleAddAuditScore({
      date: today,
      score,
      verdict,
      executionRatio: score >= 80 ? "5/5" : score >= 60 ? "3/5" : "0/5",
      commitsCount: score >= 80 ? 2 : 1,
      notes: "Quick audit snapshot from dashboard widget.",
    });
  };

  // Cloud Sync trigger
  const handleTriggerCloudSync = async () => {
    if (!auditData || !diary) return;
    showToast("Initiating cross-device cloud sync...");
    const userId = workspaceState.userEmail || "anonymous_executive";
    const success = await pushToCloudSync(userId, {
      habits,
      auditData,
      diary,
      notionConfig,
      gamification,
      lastLocalSavedAt: new Date().toISOString(),
    });

    if (success) {
      setPendingSyncCount(0);
      showToast("Cloud state synchronized successfully.");
    } else {
      showToast("Cloud sync queued in local storage.");
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const completedTodayCount = habits.filter((h) =>
    h.completedDates.includes(todayStr)
  ).length;

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDarkMode
          ? "bg-black text-white selection:bg-white selection:text-black"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* 1. Executive Top Navigation Bar - Lethal Shining Black with White Overlays */}
      {/* Sticky Executive Header with Gemini 4-Color Flow Hairline */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-all relative ${
          isDarkMode
            ? "bg-black/95 border-white/15 shadow-[0_4px_30px_rgba(0,0,0,0.95)] before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-linear-to-r before:from-[#4285F4] before:via-[#EA4335] before:via-[#FBBC05] before:to-[#34A853]"
            : "bg-white/95 border-slate-200/80 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-linear-to-r before:from-[#4285F4] before:via-[#EA4335] before:via-[#FBBC05] before:to-[#34A853]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo & Evidence Tag */}
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-black shadow-[0_0_20px_rgba(255,255,255,0.15)] border border-white/30 tracking-wider">
              <span>M</span>
              {/* Gemini 4-dot indicator in logo */}
              <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 p-0.5 bg-black rounded-full border border-white/20">
                <span className="w-1 h-1 rounded-full bg-[#4285F4]" />
                <span className="w-1 h-1 rounded-full bg-[#EA4335]" />
                <span className="w-1 h-1 rounded-full bg-[#FBBC05]" />
                <span className="w-1 h-1 rounded-full bg-[#34A853]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                  MANHATTAN
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-sm bg-white/10 border border-white/20 text-zinc-200 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4] shadow-[0_0_6px_rgba(66,133,244,0.8)]" />
                  Audit Verified
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 truncate hidden sm:block font-medium">
                Strict Evidence-Based Habit &amp; Executive Diary System
              </p>
            </div>
          </div>

          {/* Integration Status & Utility Actions */}
          <div className="flex items-center gap-2">
            {/* Google Workspace Button */}
            <button
              onClick={() => setIsWorkspaceModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                workspaceState.isAuthenticated
                  ? "bg-white/10 border-white/40 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  : isDarkMode
                  ? "bg-zinc-950 border-white/15 text-zinc-300 hover:text-white hover:border-white/30 hover:bg-zinc-900 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
              title="Google Workspace (Sheets, Calendar, Gmail, Docs)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#34A853] drop-shadow-[0_0_6px_rgba(52,168,83,0.8)]" />
              <span className="hidden sm:inline">
                {workspaceState.isAuthenticated ? "Google Connected" : "Workspace"}
              </span>
            </button>

            {/* Notion Sync Button */}
            <button
              onClick={() => setIsNotionModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                notionConfig.apiKey
                  ? "bg-white/10 border-white/40 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  : isDarkMode
                  ? "bg-zinc-950 border-white/15 text-zinc-300 hover:text-white hover:border-white/30 hover:bg-zinc-900 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
              title="Notion Database Integration"
            >
              <Database className="w-3.5 h-3.5 text-[#4285F4] drop-shadow-[0_0_6px_rgba(66,133,244,0.8)]" />
              <span className="hidden sm:inline">Notion</span>
            </button>

            {/* Online / Offline Status */}
            <div
              className={`p-1.5 rounded-xl border text-xs flex items-center justify-center ${
                isOnline
                  ? "border-white/20 text-[#34A853] bg-white/5 shadow-[0_0_10px_rgba(52,168,83,0.2)]"
                  : "border-zinc-700 text-zinc-500 bg-zinc-900/50"
              }`}
              title={isOnline ? "Connected & Online" : "Working in Offline Mode"}
            >
              {isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-[#34A853] drop-shadow-[0_0_6px_rgba(52,168,83,0.8)]" />
              ) : (
                <WifiOff className="w-3.5 h-3.5" />
              )}
            </div>

            {/* Gamification Level & XP Pill - Clean Monochrome with Amber Accent */}
            <button
              onClick={() => setActiveTab("gamification")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border border-white/20 bg-zinc-950 text-white hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.5)]"
              title="View Gamification Badges, Streaks & Leaderboard"
            >
              <Trophy className="w-3.5 h-3.5 text-[#FBBC05] drop-shadow-[0_0_6px_rgba(251,188,5,0.8)]" />
              <span className="hidden sm:inline">L{gamification.level}</span>
              <span className="drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]">{gamification.xp.toLocaleString()} XP</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode((prev) => !prev)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDarkMode
                  ? "bg-zinc-950 border-white/15 text-zinc-300 hover:text-white hover:border-white/40 hover:bg-zinc-900"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* AI Advisor Button - Gemini AI Studio Radiant Button */}
            <button
              onClick={() => setIsAiChatOpen(true)}
              className="relative group p-[1.5px] rounded-xl overflow-hidden active:scale-98 transition-all cursor-pointer shadow-[0_0_25px_rgba(66,133,244,0.3)]"
            >
              <div className="absolute inset-0 bg-linear-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] animate-pulse" />
              <div className="relative px-3.5 py-1.5 rounded-[10px] bg-black text-white text-xs font-extrabold flex items-center gap-1.5 group-hover:bg-zinc-900 transition-colors">
                <Bot className="w-4 h-4 text-[#4285F4] drop-shadow-[0_0_6px_rgba(66,133,244,0.9)]" />
                <span className="hidden sm:inline">Clera AI</span>
              </div>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs - Black & White with Gemini 4-Color Accents */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-white text-black font-extrabold shadow-[0_0_20px_rgba(255,255,255,0.4)] border border-white"
                : "text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5 hover:border-white/20"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[#FBBC05] drop-shadow-[0_0_6px_rgba(251,188,5,0.7)]" />
            <span>Overview &amp; 3D Core</span>
          </button>

          <button
            onClick={() => setActiveTab("habits")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "habits"
                ? "bg-white text-black font-extrabold shadow-[0_0_20px_rgba(255,255,255,0.4)] border border-white"
                : "text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5 hover:border-white/20"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#EA4335] fill-[#EA4335]/30 drop-shadow-[0_0_6px_rgba(234,67,53,0.8)]" />
            <span>Daily Habits</span>
            <span
              className={`text-[10px] px-1.5 rounded-full font-mono font-bold ${
                activeTab === "habits"
                  ? "bg-black text-[#EA4335]"
                  : "bg-white/10 text-zinc-200 border border-white/15"
              }`}
            >
              {completedTodayCount}/{habits.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "audit"
                ? "bg-white text-black font-extrabold shadow-[0_0_20px_rgba(255,255,255,0.4)] border border-white"
                : "text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5 hover:border-white/20"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#4285F4] drop-shadow-[0_0_6px_rgba(66,133,244,0.8)]" />
            <span>Manhattan Audit</span>
            {auditData && (
              <span
                className={`text-[10px] px-1.5 rounded-full font-mono font-bold ${
                  activeTab === "audit"
                    ? "bg-black text-[#4285F4]"
                    : "bg-white/10 text-zinc-200 border border-white/15"
                }`}
              >
                {auditData.currentScore}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("diary")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "diary"
                ? "bg-white text-black font-extrabold shadow-[0_0_20px_rgba(255,255,255,0.4)] border border-white"
                : "text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5 hover:border-white/20"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#34A853] drop-shadow-[0_0_6px_rgba(52,168,83,0.8)]" />
            <span>Clera Diary</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "analytics"
                ? "bg-white text-black font-extrabold shadow-[0_0_20px_rgba(255,255,255,0.4)] border border-white"
                : "text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5 hover:border-white/20"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#4285F4] drop-shadow-[0_0_6px_rgba(66,133,244,0.8)]" />
            <span>Analytics &amp; Correlations</span>
          </button>

          <button
            onClick={() => setActiveTab("gamification")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "gamification"
                ? "bg-white text-black font-extrabold shadow-[0_0_20px_rgba(255,255,255,0.4)] border border-white"
                : "text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5 hover:border-white/20"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-[#FBBC05] drop-shadow-[0_0_6px_rgba(251,188,5,0.8)]" />
            <span>Gamification</span>
            <span
              className={`text-[10px] px-1.5 rounded-full font-mono font-bold ${
                activeTab === "gamification"
                  ? "bg-black text-[#FBBC05]"
                  : "bg-white/10 text-zinc-200 border border-white/15"
              }`}
            >
              {gamification.streakDays}d
            </span>
          </button>
        </div>
      </header>

      {/* Toast Notification Banner */}
      {syncToast && (
        <div className="fixed top-20 right-4 z-50 px-4 py-2 rounded-xl bg-black/95 border border-white/30 text-white text-xs shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center gap-2 animate-in fade-in slide-in-from-top-2 backdrop-blur-xl">
          <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* TAB 1: OVERVIEW & 3D MOMENTUM CORE */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Top Grid: 3D Momentum Sphere + High-Level Manhattan Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 3D Sphere (7 cols) */}
              <div className="lg:col-span-7">
                <Visualizer3D
                  score={auditData?.currentScore ?? 17}
                  habitsCompleted={completedTodayCount}
                  totalHabits={habits.length}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Right Manhattan Quick Audit & Status Card (5 cols) - Black & White with Gemini Color Flow */}
              <div
                className={`lg:col-span-5 relative overflow-hidden rounded-2xl border p-5 flex flex-col justify-between h-72 transition-all ${
                  isDarkMode
                    ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(0,0,0,0.8)] before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-linear-to-r before:from-[#4285F4] before:via-[#EA4335] before:via-[#FBBC05] before:to-[#34A853]"
                    : "bg-white border-slate-200 text-slate-900 shadow-sm"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                        Evening Snapshot · Asia/Yangon
                      </span>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-md font-mono font-bold border ${
                        auditData?.currentScore && auditData.currentScore >= 80
                          ? "bg-white/10 text-white border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                          : auditData?.currentScore && auditData.currentScore >= 60
                          ? "bg-white/10 text-zinc-200 border-white/20"
                          : "bg-black text-zinc-300 border-white/15"
                      }`}
                    >
                      {auditData?.rating ?? "Weak"}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black font-mono text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                      {auditData?.currentScore ?? 17}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">/100</span>
                    <span className="text-xs font-bold uppercase ml-2 px-2 py-0.5 rounded-sm bg-white/10 border border-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                      {auditData?.verdict ?? "MISSED TARGET"}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed mt-2 line-clamp-3 font-normal">
                    {diary?.executiveSummary ??
                      "Daily evidence verification active. All daytime work must connect to branch diffs and issue tracking."}
                  </p>
                </div>

                <div className="border-t border-white/10 pt-3 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Daily Execution</span>
                    <span className="font-bold text-white flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]" />
                      {auditData?.dailyExecution ?? "0/5"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Weekly Acceptance</span>
                    <span className="font-bold text-zinc-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FBBC05]" />
                      {auditData?.weeklyAcceptance ?? "0/6 due Sep13"}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab("audit")}
                    className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-sans text-xs font-extrabold shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all cursor-pointer"
                  >
                    View Audit
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Entry Widgets Bar */}
            <QuickEntryWidgets
              habits={habits}
              onQuickCompleteHabit={(id) => handleToggleHabit(id, todayStr)}
              onQuickLogScore={handleQuickLogScore}
              onSaveQuickScratchpad={(win, leak) => {
                if (diary) {
                  handleUpdateDiary({
                    ...diary,
                    biggestWin: win || diary.biggestWin,
                    biggestExecutionLeak: leak || diary.biggestExecutionLeak,
                  });
                }
              }}
              isOnline={isOnline}
              pendingSyncCount={pendingSyncCount}
              onTriggerCloudSync={handleTriggerCloudSync}
              isDarkMode={isDarkMode}
            />

            {/* Habit Dashboard Preview */}
            <HabitDashboard
              habits={habits}
              onToggleHabit={handleToggleHabit}
              onAddHabitClick={() => setIsAddHabitModalOpen(true)}
              onScheduleReminder={(habit) => {
                setIsWorkspaceModalOpen(true);
              }}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* TAB 2: HABITS & GOAL TRACKING */}
        {activeTab === "habits" && (
          <div className="space-y-6">
            <HabitDashboard
              habits={habits}
              onToggleHabit={handleToggleHabit}
              onAddHabitClick={() => setIsAddHabitModalOpen(true)}
              onScheduleReminder={() => setIsWorkspaceModalOpen(true)}
              isDarkMode={isDarkMode}
            />

            {/* 28-day habit matrix */}
            {auditData && (
              <InteractiveCharts
                scoreHistory={auditData.history}
                habits={habits}
                isDarkMode={isDarkMode}
              />
            )}
          </div>
        )}

        {/* TAB 3: MANHATTAN PROJECT AUDIT */}
        {activeTab === "audit" && auditData && (
          <div className="space-y-6">
            <ManhattanAuditView
              auditData={auditData}
              onAddAuditScore={handleAddAuditScore}
              onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
              onOpenNotionModal={() => setIsNotionModalOpen(true)}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* TAB 4: CLERA EXECUTIVE DIARY */}
        {activeTab === "diary" && diary && auditData && (
          <div className="space-y-6">
            <CleraDiaryView
              diary={diary}
              auditData={auditData}
              onUpdateDiary={handleUpdateDiary}
              onExportToDocs={() => setIsWorkspaceModalOpen(true)}
              onSendGmailDigest={() => setIsWorkspaceModalOpen(true)}
              onTriggerAiDiagnosis={() => setIsAiChatOpen(true)}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* TAB 5: ANALYTICS, CORRELATIONS & INTERACTIVE CHARTS */}
        {activeTab === "analytics" && auditData && (
          <div className="space-y-8">
            <AdvancedAnalytics
              scoreHistory={auditData.history}
              habits={habits}
              isDarkMode={isDarkMode}
            />

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black font-mono tracking-wider uppercase mb-4 text-slate-400">
                Detailed Activity Heatmaps &amp; Trajectories
              </h3>
              <InteractiveCharts
                scoreHistory={auditData.history}
                habits={habits}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        )}

        {/* TAB 6: EXECUTIVE GAMIFICATION & MILESTONES */}
        {activeTab === "gamification" && (
          <div className="space-y-6">
            <GamificationCenter
              gamification={gamification}
              isDarkMode={isDarkMode}
            />
          </div>
        )}
      </main>

      {/* Floating AI Chatbot Assistant */}
      {auditData && diary && (
        <AiChatbot
          auditData={auditData}
          diary={diary}
          habits={habits}
          isDarkMode={isDarkMode}
          isOpen={isAiChatOpen}
          onClose={() => setIsAiChatOpen(false)}
          onExecuteAction={handleExecuteAiAction}
        />
      )}

      {/* Google Workspace Integration Modal */}
      {auditData && diary && (
        <WorkspaceSyncModal
          isOpen={isWorkspaceModalOpen}
          onClose={() => setIsWorkspaceModalOpen(false)}
          workspaceState={workspaceState}
          onUpdateWorkspaceState={(s) => setWorkspaceState((prev) => ({ ...prev, ...s }))}
          auditData={auditData}
          diary={diary}
          habits={habits}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Notion Sync Modal */}
      {auditData && diary && (
        <NotionSyncModal
          isOpen={isNotionModalOpen}
          onClose={() => setIsNotionModalOpen(false)}
          config={notionConfig}
          onSaveConfig={(cfg) => {
            setNotionConfig(cfg);
            saveLocalState({ notionConfig: cfg });
            showToast("Notion integration settings saved.");
          }}
          diary={diary}
          auditData={auditData}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Add Custom Habit Modal */}
      <AddHabitModal
        isOpen={isAddHabitModalOpen}
        onClose={() => setIsAddHabitModalOpen(false)}
        onAddHabit={handleAddHabit}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

