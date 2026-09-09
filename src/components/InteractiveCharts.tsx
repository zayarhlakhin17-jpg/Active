import React, { useState } from "react";
import { DailyScoreEntry, Habit } from "../types";
import { TrendingUp, Calendar as CalendarIcon, CheckCircle2, Award } from "lucide-react";

interface InteractiveChartsProps {
  scoreHistory: DailyScoreEntry[];
  habits: Habit[];
  isDarkMode: boolean;
}

export const InteractiveCharts: React.FC<InteractiveChartsProps> = ({
  scoreHistory,
  habits,
  isDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<"trend" | "matrix" | "monthly">("trend");
  const [hoveredEntry, setHoveredEntry] = useState<DailyScoreEntry | null>(null);

  // Sort history chronologically for chart display
  const sortedHistory = [...scoreHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingY = 30;

  const minScore = 0;
  const maxScore = 100;

  // Coordinate mapper
  const getX = (index: number) => {
    if (sortedHistory.length <= 1) return svgWidth / 2;
    return (
      paddingX +
      (index / (sortedHistory.length - 1)) * (svgWidth - paddingX * 2)
    );
  };

  const getY = (score: number) => {
    const clamped = Math.max(minScore, Math.min(maxScore, score));
    return (
      svgHeight -
      paddingY -
      (clamped / (maxScore - minScore)) * (svgHeight - paddingY * 2)
    );
  };

  // Generate SVG path
  const linePath = sortedHistory.reduce((acc, entry, index) => {
    const x = getX(index);
    const y = getY(entry.score);
    return index === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, "");

  const areaPath = sortedHistory.length > 0
    ? `${linePath} L ${getX(sortedHistory.length - 1)} ${svgHeight - paddingY} L ${getX(0)} ${svgHeight - paddingY} Z`
    : "";

  // Last 30 days matrix generation
  const today = new Date();
  const past30Days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (27 - i));
    return d.toISOString().slice(0, 10);
  });

  return (
    <div
      className={`rounded-2xl border p-5 transition-all ${
        isDarkMode
          ? "bg-slate-900/90 border-slate-800 text-slate-100"
          : "bg-white border-slate-200 text-slate-900 shadow-sm"
      }`}
    >
      {/* Header & Mode Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Performance &amp; Trend Analytics
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Interactive daily score progression and 28-day habit matrix
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab("trend")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "trend"
                ? "bg-white dark:bg-slate-700 font-semibold shadow-xs text-blue-600 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Score Trend
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "matrix"
                ? "bg-white dark:bg-slate-700 font-semibold shadow-xs text-blue-600 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Habit Matrix
          </button>
          <button
            onClick={() => setActiveTab("monthly")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "monthly"
                ? "bg-white dark:bg-slate-700 font-semibold shadow-xs text-blue-600 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Monthly Audit
          </button>
        </div>
      </div>

      {/* Tab 1: Interactive Score Trend Chart */}
      {activeTab === "trend" && (
        <div className="space-y-3">
          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-56 select-none overflow-visible"
            >
              <defs>
                <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Threshold guidelines */}
              {/* 80 Strong Line */}
              <line
                x1={paddingX}
                y1={getY(80)}
                x2={svgWidth - paddingX}
                y2={getY(80)}
                stroke="#10b981"
                strokeWidth="1"
                strokeDasharray="4 4"
                strokeOpacity="0.4"
              />
              <text
                x={paddingX - 8}
                y={getY(80) + 3}
                fill="#10b981"
                fontSize="10"
                textAnchor="end"
                className="font-mono font-medium"
              >
                80 (Strong)
              </text>

              {/* 60 Developing Line */}
              <line
                x1={paddingX}
                y1={getY(60)}
                x2={svgWidth - paddingX}
                y2={getY(60)}
                stroke="#6366f1"
                strokeWidth="1"
                strokeDasharray="4 4"
                strokeOpacity="0.3"
              />
              <text
                x={paddingX - 8}
                y={getY(60) + 3}
                fill="#6366f1"
                fontSize="10"
                textAnchor="end"
                className="font-mono font-medium"
              >
                60 (Dev)
              </text>

              {/* Baseline 0 */}
              <line
                x1={paddingX}
                y1={getY(0)}
                x2={svgWidth - paddingX}
                y2={getY(0)}
                stroke={isDarkMode ? "#334155" : "#e2e8f0"}
                strokeWidth="1"
              />

              {/* Area gradient */}
              {areaPath && (
                <path d={areaPath} fill="url(#scoreAreaGradient)" />
              )}

              {/* Line path */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Data Points */}
              {sortedHistory.map((entry, index) => {
                const x = getX(index);
                const y = getY(entry.score);
                const isHovered = hoveredEntry?.date === entry.date;
                const pointColor =
                  entry.score >= 80
                    ? "#10b981"
                    : entry.score >= 60
                    ? "#6366f1"
                    : "#ef4444";

                return (
                  <g
                    key={entry.date}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredEntry(entry)}
                    onMouseLeave={() => setHoveredEntry(null)}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 7 : 4.5}
                      fill={pointColor}
                      stroke={isDarkMode ? "#0f172a" : "#ffffff"}
                      strokeWidth="2"
                      className="transition-all duration-200"
                    />
                    <text
                      x={x}
                      y={svgHeight - 10}
                      fill={isDarkMode ? "#94a3b8" : "#64748b"}
                      fontSize="9"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      {entry.date.slice(5)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Hovered or Latest Details Bar */}
          <div
            className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
              isDarkMode
                ? "bg-slate-800/50 border-slate-700/60"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            {hoveredEntry ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-semibold font-mono text-blue-500">
                    {hoveredEntry.date}
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="font-bold">Score: {hoveredEntry.score}/100</span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${
                      hoveredEntry.score >= 80
                        ? "bg-emerald-500/10 text-emerald-500"
                        : hoveredEntry.score >= 60
                        ? "bg-indigo-500/10 text-indigo-500"
                        : "bg-rose-500/10 text-rose-500"
                    }`}
                  >
                    {hoveredEntry.verdict}
                  </span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 italic">
                  {hoveredEntry.notes || "No notes logged for this audit."}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between w-full text-slate-500 dark:text-slate-400">
                <span>Hover over any data point to inspect audit snapshot notes.</span>
                <span className="font-mono font-medium">
                  {sortedHistory.length} Daily Audits Logged
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: 28-Day Habit Consistency Matrix */}
      {activeTab === "matrix" && (
        <div className="space-y-4">
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[500px]">
              {/* Day headers */}
              <div className="grid grid-cols-[140px_repeat(28,minmax(0,1fr))] gap-1 text-[10px] text-slate-400 font-mono mb-2">
                <div>Habit</div>
                {past30Days.map((d, i) => (
                  <div key={d} className="text-center">
                    {i % 7 === 0 ? d.slice(8) : ""}
                  </div>
                ))}
              </div>

              {/* Habit rows */}
              <div className="space-y-1.5">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    className="grid grid-cols-[140px_repeat(28,minmax(0,1fr))] gap-1 items-center"
                  >
                    <div className="text-xs font-medium truncate pr-2" title={habit.title}>
                      {habit.title}
                    </div>
                    {past30Days.map((d) => {
                      const completed = habit.completedDates.includes(d);
                      return (
                        <div
                          key={d}
                          title={`${habit.title} on ${d}: ${
                            completed ? "Completed" : "Not logged"
                          }`}
                          className={`h-4 rounded-xs transition-colors cursor-pointer ${
                            completed
                              ? "bg-emerald-500 hover:bg-emerald-400"
                              : isDarkMode
                              ? "bg-slate-800 hover:bg-slate-700"
                              : "bg-slate-100 hover:bg-slate-200"
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-200 dark:bg-slate-800" />
              Incomplete / Pending
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
              Verified Complete
            </span>
          </div>
        </div>
      )}

      {/* Tab 3: Monthly Audit Summary Report */}
      {activeTab === "monthly" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              className={`p-3.5 rounded-xl border ${
                isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="text-xs text-slate-500">Average September Score</div>
              <div className="text-2xl font-black font-mono text-blue-500 mt-1">60.5</div>
              <p className="text-[11px] text-slate-400 mt-1">Developing benchmark rating</p>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="text-xs text-slate-500">Shipped Commits</div>
              <div className="text-2xl font-black font-mono text-emerald-500 mt-1">13</div>
              <p className="text-[11px] text-slate-400 mt-1">Across 13 logged workdays</p>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="text-xs text-slate-500">Weekly W03 Acceptance</div>
              <div className="text-2xl font-black font-mono text-amber-500 mt-1">0/6</div>
              <p className="text-[11px] text-slate-400 mt-1">Due Sep 13 (High Priority)</p>
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed ${
              isDarkMode ? "bg-slate-800/30 border-slate-800 text-slate-300" : "bg-blue-50/50 border-blue-100 text-slate-700"
            }`}
          >
            <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-blue-500" />
              Executive Trend Evaluation
            </div>
            Recent delivery demonstrated peak execution on Sep 06 (100) and Sep 07 (86), followed by a sharp dip on Sep 08 (17) due to unevidenced inventory slice work. Recommended remediation: Enforce operating rule #1 (all daytime work captured as evidence) and resume the single issue-to-PR delivery chain before expanding scope.
          </div>
        </div>
      )}
    </div>
  );
};
