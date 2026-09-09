import React, { useState } from "react";
import {
  HabitCorrelation,
  QuarterlyTrend,
  BurnoutMetrics,
  Habit,
  DailyScoreEntry,
} from "../types";
import {
  initialHabitCorrelations,
  initialQuarterlyTrends,
  initialBurnoutMetrics,
} from "../data/initialData";
import {
  TrendingUp,
  Activity,
  AlertTriangle,
  HeartPulse,
  Brain,
  Layers,
  Sparkles,
  Info,
  Calendar,
  CheckCircle2,
  Zap,
} from "lucide-react";

interface AdvancedAnalyticsProps {
  scoreHistory: DailyScoreEntry[];
  habits: Habit[];
  isDarkMode: boolean;
}

export function AdvancedAnalytics({
  scoreHistory,
  habits,
  isDarkMode,
}: AdvancedAnalyticsProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<"quarterly" | "yearly">("quarterly");
  const [selectedCorrelation, setSelectedCorrelation] = useState<HabitCorrelation>(
    initialHabitCorrelations[0]
  );

  const correlations = initialHabitCorrelations;
  const quarterlyData = initialQuarterlyTrends;
  const burnout = initialBurnoutMetrics;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Horizon Selector */}
      <div
        className={`p-6 rounded-2xl border transition-all relative overflow-hidden ${
          isDarkMode
            ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent"
            : "bg-white border-slate-200 text-slate-900 shadow-sm"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-white/10 text-white border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                <Activity className="w-5 h-5 text-white" />
              </span>
              <h2 className="text-xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                Advanced Reporting &amp; Correlation Intelligence
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl font-medium">
              Cross-habit dependency mapping, statistical Pearson correlations, multi-quarter trend trajectory, and proactive burnout prevention indicators.
            </p>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-zinc-950 border border-white/15 self-start md:self-auto">
            <button
              onClick={() => setActiveTimeframe("quarterly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTimeframe === "quarterly"
                  ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Quarterly Trajectory
            </button>
            <button
              onClick={() => setActiveTimeframe("yearly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTimeframe === "yearly"
                  ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Yearly Horizons
            </button>
          </div>
        </div>
      </div>

      {/* 2. Habit Correlation Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Correlation Matrix Cards (7 cols) */}
        <div
          className={`lg:col-span-7 p-6 rounded-2xl border transition-all relative overflow-hidden ${
            isDarkMode
              ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent"
              : "bg-white border-slate-200 text-slate-900 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Cross-Habit Correlations</h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/20">
              Pearson r Analysis
            </span>
          </div>

          <p className="text-xs text-zinc-400 mb-4">
            How habits impact one another. Select a pair to inspect statistical evidence and causal insights:
          </p>

          <div className="space-y-3">
            {correlations.map((item, idx) => {
              const isSelected = selectedCorrelation.habitA === item.habitA && selectedCorrelation.habitB === item.habitB;
              const isPositive = item.coefficient > 0;
              const absScore = Math.abs(item.coefficient);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedCorrelation(item)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-white/60 bg-white/10 ring-1 ring-white/50 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                      : isDarkMode
                      ? "border-white/10 bg-zinc-950/60 hover:border-white/30 text-white"
                      : "border-slate-200 bg-slate-50/60 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
                        <span className="truncate text-white font-bold">{item.habitA}</span>
                        <span className="text-zinc-400 font-mono">&harr;</span>
                        <span className="truncate text-zinc-200">{item.habitB}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                        {item.insight}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-xs font-extrabold px-2 py-0.5 rounded-md ${
                          absScore >= 0.8
                            ? "bg-white text-black border border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                            : "bg-white/10 text-white border border-white/20"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {item.coefficient.toFixed(2)} r
                      </span>
                      <span className="block text-[10px] text-zinc-400 mt-0.5 font-mono">
                        {item.confidence} Conf. ({item.sampleSize}d)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Correlation Deep Dive & Scatter Simulation (5 cols) */}
        <div
          className={`lg:col-span-5 p-6 rounded-2xl border flex flex-col justify-between transition-all relative overflow-hidden ${
            isDarkMode
              ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent"
              : "bg-white border-slate-200 text-slate-900 shadow-sm"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                Correlation Deep Dive
              </span>
              <span className="text-xs font-bold font-mono text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]">
                {selectedCorrelation.coefficient > 0 ? "Strong Synergy" : "Inverse Friction"}
              </span>
            </div>

            <h4 className="font-bold text-sm text-white">
              {selectedCorrelation.habitA}
            </h4>
            <div className="text-xs text-zinc-400 font-mono my-0.5">&darr; correlates with</div>
            <h4 className="font-bold text-sm text-white mb-4">
              {selectedCorrelation.habitB}
            </h4>

            {/* Visual Scatter Graphic */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-white/15 mb-4 shadow-[0_0_20px_rgba(0,0,0,0.6)]">
              <div className="h-32 relative flex items-end justify-between px-2 pb-2 border-b border-l border-white/20">
                {/* Simulated Scatter Nodes */}
                {[
                  { x: 15, y: 25 },
                  { x: 30, y: 40 },
                  { x: 45, y: 50 },
                  { x: 55, y: 65 },
                  { x: 70, y: 78 },
                  { x: 85, y: 88 },
                  { x: 92, y: 94 },
                ].map((pt, i) => (
                  <div
                    key={i}
                    className="absolute w-2.5 h-2.5 rounded-full bg-white border border-zinc-300 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                    style={{
                      left: `${pt.x}%`,
                      bottom: selectedCorrelation.coefficient > 0 ? `${pt.y}%` : `${100 - pt.y}%`,
                    }}
                    title={`Point ${i + 1}: ${pt.x}% vs ${pt.y}%`}
                  />
                ))}

                {/* Trend line overlay */}
                <div
                  className={`absolute left-0 w-full h-0.5 ${
                    selectedCorrelation.coefficient > 0
                      ? "bg-white rotate-[-22deg] origin-bottom-left shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                      : "bg-white/60 rotate-[22deg] origin-top-left"
                  }`}
                  style={{ bottom: selectedCorrelation.coefficient > 0 ? "10%" : "90%" }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono mt-2">
                <span>Low Execution</span>
                <span>Scatter Trend Line</span>
                <span>Peak Execution</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/15 text-xs text-zinc-200 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 mb-1 text-white">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Executive Insight</span>
              </div>
              {selectedCorrelation.insight}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 text-[11px] text-zinc-400 flex items-center justify-between font-mono">
            <span>Confidence: {selectedCorrelation.confidence}</span>
            <span>Sample: {selectedCorrelation.sampleSize} Records</span>
          </div>
        </div>
      </div>

      {/* 3. Long-Term Multi-Quarter Trend Horizon */}
      <div
        className={`p-6 rounded-2xl border transition-all relative overflow-hidden ${
          isDarkMode
            ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent"
            : "bg-white border-slate-200 text-slate-900 shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              {activeTimeframe === "quarterly" ? "Quarterly Trajectory Analysis (2026)" : "Multi-Year Executive Horizon"}
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">Moving Average &amp; Volume</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quarterlyData.map((q, idx) => {
            const isCurrent = q.quarter.includes("Current");
            const isProjected = q.quarter.includes("Projected");

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
                  isCurrent
                    ? "border-white/50 bg-white/10 ring-1 ring-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    : isProjected
                    ? "border-dashed border-white/30 bg-white/5"
                    : isDarkMode
                    ? "border-white/10 bg-zinc-950/80"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs font-mono text-white">{q.quarter}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-mono font-extrabold bg-white text-black shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                    {q.avgScore.toFixed(1)}/100
                  </span>
                </div>

                {/* Score Progress Bar */}
                <div className="w-full bg-zinc-800 rounded-full h-1.5 my-2">
                  <div
                    className="h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                    style={{ width: `${q.avgScore}%` }}
                  />
                </div>

                <div className="space-y-1 text-[11px] font-mono text-zinc-400 mt-3">
                  <div className="flex justify-between">
                    <span>Completion:</span>
                    <span className="text-white font-bold">{q.completionRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Audited Commits:</span>
                    <span className="text-white font-bold">{q.totalCommits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deep Focus:</span>
                    <span className="text-white font-bold">{q.focusHours}h</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-zinc-400 truncate">
                  {q.verdict}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Burnout Risk & Fatigue Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Burnout Risk Indicator (5 cols) */}
        <div
          className={`lg:col-span-5 p-6 rounded-2xl border transition-all relative overflow-hidden ${
            isDarkMode
              ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent"
              : "bg-white border-slate-200 text-slate-900 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Burnout &amp; Fatigue Radar</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-md font-mono font-bold bg-white text-black shadow-[0_0_8px_rgba(255,255,255,0.4)]">
              {burnout.status}
            </span>
          </div>

          <div className="flex items-center justify-center my-4">
            <div className="relative w-40 h-40 flex flex-col items-center justify-center rounded-full border-4 border-zinc-800 bg-zinc-950 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
              <div
                className="absolute inset-0 rounded-full border-4 border-white shadow-[0_0_15px_rgba(255,255,255,0.6)]"
                style={{
                  clipPath: `polygon(0 0, 100% 0, 100% ${burnout.riskScore}%, 0 ${burnout.riskScore}%)`,
                }}
              />
              <span className="text-3xl font-black font-mono text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{burnout.riskScore}</span>
              <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Risk Index</span>
              <span className="text-[10px] text-zinc-300 font-mono mt-1">&lt; 40 Optimal</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono text-zinc-400 pt-2 border-t border-white/10">
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/10">
              <span className="block text-[10px] text-zinc-500">Recovery Ratio</span>
              <span className="font-bold text-white">{burnout.recoveryRatio}% of habits</span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/10">
              <span className="block text-[10px] text-zinc-500">Late Audits (&gt;23:00)</span>
              <span className="font-bold text-white">{burnout.lateNightAudits} logged</span>
            </div>
          </div>
        </div>

        {/* Intelligence Alert & Remediation (7 cols) */}
        <div
          className={`lg:col-span-7 p-6 rounded-2xl border flex flex-col justify-between transition-all relative overflow-hidden ${
            isDarkMode
              ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent"
              : "bg-white border-slate-200 text-slate-900 shadow-sm"
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Potential Leaks &amp; Burnout Defenses</h3>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Calculated from your 7-test baseline, late-night audits, and supplementary lab diversions:
            </p>

            <div className="space-y-3">
              {burnout.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-white/15 bg-zinc-950/80 text-xs text-zinc-200 flex items-start gap-3"
                >
                  <AlertTriangle className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block mb-0.5">Remediation #{idx + 1}</span>
                    <span>{rec}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
            <span className="font-mono">Operating Rule #2 Enforcement Active</span>
            <span className="text-white font-semibold cursor-pointer hover:underline">
              View Audit Policy &rarr;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
