import React, { useState } from "react";
import { UserGamification, Badge, LeaderboardEntry } from "../types";
import { initialLeaderboard } from "../data/initialData";
import {
  Trophy,
  Flame,
  Award,
  Zap,
  Crown,
  ShieldCheck,
  Footprints,
  GitPullRequest,
  CheckCircle2,
  Lock,
  Star,
  Users,
  TrendingUp,
  Sparkles,
} from "lucide-react";

interface GamificationCenterProps {
  gamification: UserGamification;
  isDarkMode: boolean;
}

export function GamificationCenter({
  gamification,
  isDarkMode,
}: GamificationCenterProps) {
  const [activeLeaderboardScope, setActiveLeaderboardScope] = useState<"weekly" | "allTime">("weekly");
  const [badgeFilter, setBadgeFilter] = useState<"all" | "unlocked" | "locked">("all");

  const leaderboard = initialLeaderboard;

  // Level XP calculations (e.g. 500 XP per level)
  const currentLevelXp = (gamification.level - 1) * 500;
  const nextLevelXp = gamification.level * 500;
  const xpInCurrentLevel = gamification.xp - currentLevelXp;
  const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / 500) * 100));

  const filteredBadges = gamification.badges.filter((b) => {
    if (badgeFilter === "unlocked") return b.unlocked;
    if (badgeFilter === "locked") return !b.unlocked;
    return true;
  });

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case "Footprints":
        return <Footprints className="w-5 h-5" />;
      case "Flame":
        return <Flame className="w-5 h-5" />;
      case "Award":
        return <Award className="w-5 h-5" />;
      case "Zap":
        return <Zap className="w-5 h-5" />;
      case "Crown":
        return <Crown className="w-5 h-5" />;
      case "ShieldCheck":
        return <ShieldCheck className="w-5 h-5" />;
      case "GitPullRequest":
        return <GitPullRequest className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Top Executive Gamification Banner & Prominent Streak Display */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Level & XP Overview (7 cols) */}
        <div
          className={`md:col-span-7 p-6 rounded-2xl border transition-all relative overflow-hidden ${
            isDarkMode
              ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-amber-500/20 text-white shadow-[0_0_35px_rgba(245,158,11,0.06)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-amber-400/50 before:to-transparent"
              : "bg-white border-slate-200 text-slate-900 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-linear-to-b from-amber-300 via-amber-400 to-yellow-500 text-black flex items-center justify-center font-black text-xl shadow-[0_0_22px_rgba(245,158,11,0.55)] border border-amber-300">
                L{gamification.level}
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300/80">
                  Operating Rank
                </span>
                <h2 className="text-lg font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                  {gamification.title}
                </h2>
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black font-mono text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.65)]">
                {gamification.xp.toLocaleString()}
              </span>
              <span className="text-xs text-amber-200/60 font-mono block">Total XP</span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-1.5 mt-4">
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>Progress to Level {gamification.level + 1}</span>
              <span className="text-amber-300 font-bold drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]">
                {xpInCurrentLevel} / 500 XP ({Math.round(progressPercent)}%)
              </span>
            </div>
            <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden border border-white/10">
              <div
                className="bg-linear-to-r from-amber-400 via-yellow-300 to-amber-200 h-2.5 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/10 text-center">
            <div>
              <span className="text-[10px] text-zinc-400 font-mono block">Multiplier</span>
              <span className="font-mono font-bold text-amber-300 text-sm drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]">
                {gamification.streakMultiplier}x XP
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-mono block">Badges Earned</span>
              <span className="font-mono font-bold text-emerald-400 text-sm drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]">
                {gamification.badges.filter((b) => b.unlocked).length} / {gamification.badges.length}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-mono block">Cohort Rank</span>
              <span className="font-mono font-bold text-amber-400 text-sm drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]">
                #2 Grandmaster
              </span>
            </div>
          </div>
        </div>

        {/* Prominent Streak Counter (5 cols) */}
        <div
          className={`md:col-span-5 p-6 rounded-2xl border flex flex-col justify-between transition-all relative overflow-hidden ${
            isDarkMode
              ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-orange-500/25 text-white shadow-[0_0_35px_rgba(249,115,22,0.08)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-orange-400/60 before:to-transparent"
              : "bg-white border-slate-200 text-slate-900 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-orange-300/80">
              Discipline Streak
            </span>
            <span className="px-2 py-0.5 rounded-md bg-orange-500/15 border border-orange-400/40 text-orange-300 text-xs font-mono font-bold shadow-[0_0_12px_rgba(249,115,22,0.3)]">
              Active Fire
            </span>
          </div>

          <div className="flex items-center gap-4 my-3">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-amber-500/20 via-orange-500/20 to-red-500/10 border border-orange-500/40 text-white flex items-center justify-center shadow-[0_0_22px_rgba(249,115,22,0.4)]">
              <Flame className="w-8 h-8 fill-orange-400 text-orange-400 drop-shadow-[0_0_12px_rgba(249,115,22,0.95)]" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black font-mono text-transparent bg-clip-text bg-linear-to-r from-amber-300 via-yellow-200 to-orange-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
                  {gamification.streakDays}
                </span>
                <span className="text-sm font-bold text-orange-300 font-mono">DAYS</span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Highest recorded: <span className="text-amber-300 font-bold font-mono">{gamification.highestStreak} days</span>
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-400/20 text-xs text-orange-200/90 flex items-center justify-between">
            <span>Streak multiplier bonus active:</span>
            <span className="font-bold font-mono text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]">+{Math.round((gamification.streakMultiplier - 1) * 100)}% extra XP</span>
          </div>
        </div>
      </div>

      {/* 2. Badges & Milestones Section */}
      <div
        className={`p-6 rounded-2xl border transition-all relative overflow-hidden ${
          isDarkMode
            ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-amber-400/40 before:to-transparent"
            : "bg-white border-slate-200 text-slate-900 shadow-sm"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <h3 className="text-base font-bold text-white">Milestones &amp; Achievement Badges</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Unlock prestigious credentials through strict evidence verification and habit consistency.
            </p>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-zinc-950 border border-white/15 self-start sm:self-auto">
            <button
              onClick={() => setBadgeFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                badgeFilter === "all"
                  ? "bg-linear-to-r from-amber-400 to-yellow-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              All ({gamification.badges.length})
            </button>
            <button
              onClick={() => setBadgeFilter("unlocked")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                badgeFilter === "unlocked"
                  ? "bg-linear-to-r from-amber-400 to-yellow-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Unlocked ({gamification.badges.filter((b) => b.unlocked).length})
            </button>
            <button
              onClick={() => setBadgeFilter("locked")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                badgeFilter === "locked"
                  ? "bg-linear-to-r from-amber-400 to-yellow-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Locked ({gamification.badges.filter((b) => !b.unlocked).length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBadges.map((badge) => {
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-xl border relative transition-all overflow-hidden ${
                  badge.unlocked
                    ? "border-amber-400/35 bg-radial from-zinc-900/80 via-black to-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.1)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-amber-400/60 before:to-transparent"
                    : "border-white/10 bg-zinc-950/60 opacity-60 hover:opacity-90"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      badge.unlocked
                        ? "bg-linear-to-b from-amber-300 via-amber-400 to-yellow-500 text-black shadow-[0_0_16px_rgba(245,158,11,0.5)] font-bold border border-amber-300"
                        : "bg-zinc-900 text-zinc-500 border border-white/10"
                    }`}
                  >
                    {getBadgeIcon(badge.iconName)}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-400/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                      +{badge.xpReward} XP
                    </span>
                    {badge.unlocked && (
                      <span className="block text-[9px] text-amber-300 font-mono mt-0.5 font-bold">
                        Unlocked
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>{badge.name}</span>
                  {!badge.unlocked && <Lock className="w-3 h-3 text-zinc-500" />}
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {badge.description}
                </p>

                {badge.unlockedAt && (
                  <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-amber-200/70 font-mono">
                    Earned on {badge.unlockedAt}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Executive Leaderboard & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Executive Cohort Leaderboard (8 cols) */}
        <div
          className={`lg:col-span-8 p-6 rounded-2xl border transition-all relative overflow-hidden ${
            isDarkMode
              ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-amber-400/50 before:to-transparent"
              : "bg-white border-slate-200 text-slate-900 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <h3 className="text-base font-bold text-white">Executive Cohort Leaderboard</h3>
            </div>
            <div className="flex items-center p-1 rounded-xl bg-zinc-950 border border-white/15 text-xs font-semibold">
              <button
                onClick={() => setActiveLeaderboardScope("weekly")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeLeaderboardScope === "weekly"
                    ? "bg-linear-to-r from-amber-400 to-yellow-400 text-black font-extrabold shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Weekly Sprint
              </button>
              <button
                onClick={() => setActiveLeaderboardScope("allTime")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeLeaderboardScope === "allTime"
                    ? "bg-linear-to-r from-amber-400 to-yellow-400 text-black font-extrabold shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                All-Time
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-400 mb-4">
            Ranked by auditable output, evidence verification rate, and habit discipline among peer practitioners:
          </p>

          <div className="space-y-2.5">
            {leaderboard.map((user) => {
              return (
                <div
                  key={user.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                    user.isCurrentUser
                      ? "border-amber-400/50 bg-amber-500/10 ring-1 ring-amber-400/40 shadow-[0_0_22px_rgba(245,158,11,0.12)]"
                      : isDarkMode
                      ? "border-white/10 bg-zinc-950/60 hover:border-amber-400/30"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      className={`w-6 text-center font-mono font-black text-sm ${
                        user.rank === 1
                          ? "text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]"
                          : user.rank === 2
                          ? "text-slate-200 drop-shadow-[0_0_8px_rgba(226,232,240,0.6)]"
                          : user.rank === 3
                          ? "text-amber-600"
                          : "text-zinc-500"
                      }`}
                    >
                      #{user.rank}
                    </span>

                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-xl object-cover border border-white/20"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm truncate text-white">{user.name}</span>
                        {user.isCurrentUser && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-linear-to-r from-amber-400 to-yellow-400 text-black font-mono font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.6)]">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-400 truncate block">
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div className="hidden sm:block">
                      <span className="text-[10px] text-zinc-500 font-mono block">Tier</span>
                      <span className="text-xs font-bold font-mono text-zinc-200">
                        {user.tier}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono block">Streak</span>
                      <span className="text-xs font-bold font-mono text-white flex items-center justify-end gap-1">
                        <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400 drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
                        <span className="drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]">{user.streak}d</span>
                      </span>
                    </div>
                    <div className="w-20">
                      <span className="text-[10px] text-zinc-500 font-mono block">
                        {activeLeaderboardScope === "weekly" ? "Weekly XP" : "Total XP"}
                      </span>
                      <span className="text-sm font-black font-mono text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]">
                        {(activeLeaderboardScope === "weekly" ? user.weeklyXp : user.totalXp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent XP Activity Feed (4 cols) */}
        <div
          className={`lg:col-span-4 p-6 rounded-2xl border flex flex-col justify-between transition-all relative overflow-hidden ${
            isDarkMode
              ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-amber-400/40 before:to-transparent"
              : "bg-white border-slate-200 text-slate-900 shadow-sm"
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">XP Audit Log</h3>
            </div>

            <div className="space-y-3">
              {gamification.recentXpGains.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-zinc-950 border border-white/10 text-xs shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-emerald-400 font-mono drop-shadow-[0_0_6px_rgba(52,211,153,0.7)]">+{item.amount} XP</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{item.timestamp}</span>
                  </div>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {item.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 text-[11px] text-amber-300/80 text-center font-mono">
            Next Level 7 unlocks at 2,000 XP (+150 XP needed)
          </div>
        </div>
      </div>
    </div>
  );
}
