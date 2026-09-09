import React, { useState } from "react";
import { Habit, HabitCategory } from "../types";
import {
  CheckCircle,
  Circle,
  Flame,
  Plus,
  Bell,
  Sparkles,
  Filter,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import confetti from "canvas-confetti";

interface HabitDashboardProps {
  habits: Habit[];
  onToggleHabit: (habitId: string, date: string) => void;
  onAddHabitClick: () => void;
  onScheduleReminder: (habit: Habit) => void;
  isDarkMode: boolean;
}

export const HabitDashboard: React.FC<HabitDashboardProps> = ({
  habits,
  onToggleHabit,
  onAddHabitClick,
  onScheduleReminder,
  isDarkMode,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const today = new Date().toISOString().slice(0, 10);

  // Play subtle synthesis tone on completion
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // AudioContext might be blocked until user interacts
    }
  };

  const handleCheck = (habit: Habit) => {
    const isCompleted = habit.completedDates.includes(today);
    if (!isCompleted) {
      playChime();
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
        colors: [habit.color || "#3b82f6", "#10b981", "#f59e0b"],
      });
    }
    onToggleHabit(habit.id, today);
  };

  const filteredHabits = habits.filter((h) => {
    if (selectedCategory === "all") return true;
    return h.category === selectedCategory;
  });

  const completedTodayCount = habits.filter((h) =>
    h.completedDates.includes(today)
  ).length;

  const categories: { id: string; label: string }[] = [
    { id: "all", label: "All Habits" },
    { id: "engineering", label: "Engineering" },
    { id: "deep-focus", label: "Deep Focus" },
    { id: "mindset", label: "Mindset" },
    { id: "health", label: "Health & Recovery" },
  ];

  return (
    <div
      className={`rounded-2xl border p-5 transition-all relative overflow-hidden ${
        isDarkMode
          ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(0,0,0,0.8)] before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-linear-to-r before:from-[#4285F4] before:via-[#EA4335] before:via-[#FBBC05] before:to-[#34A853]"
          : "bg-white border-slate-200 text-slate-900 shadow-sm"
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Daily Habit Execution &amp; Goals</span>
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold font-mono bg-white/10 text-white border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]" />
              {completedTodayCount}/{habits.length} Complete
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 font-normal">
            Strict daily routines aligned with Manhattan evidence targets
          </p>
        </div>

        <button
          onClick={onAddHabitClick}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-white hover:bg-zinc-200 text-black transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] border border-white active:scale-98 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>Add Custom Habit</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? "bg-white text-black font-extrabold shadow-[0_0_15px_rgba(255,255,255,0.35)] border border-white"
                : isDarkMode
                ? "bg-zinc-950 text-zinc-400 hover:text-white border border-white/10 hover:border-white/30"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Habit Items List */}
      <div className="space-y-2.5">
        {filteredHabits.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-400">
            No habits in this category yet. Click "Add Custom Habit" above.
          </div>
        ) : (
          filteredHabits.map((habit) => {
            const isCompleted = habit.completedDates.includes(today);

            // Gemini 4-Color Category Mapping
            const getCategoryBadgeClass = (category: string) => {
              switch (category) {
                case "engineering":
                  return "bg-[#4285F4]/10 border-[#4285F4]/30 text-[#4285F4] shadow-[0_0_8px_rgba(66,133,244,0.15)]";
                case "deep-focus":
                  return "bg-[#EA4335]/10 border-[#EA4335]/30 text-[#EA4335] shadow-[0_0_8px_rgba(234,67,53,0.15)]";
                case "mindset":
                  return "bg-[#FBBC05]/10 border-[#FBBC05]/30 text-[#FBBC05] shadow-[0_0_8px_rgba(251,188,5,0.15)]";
                case "health":
                  return "bg-[#34A853]/10 border-[#34A853]/30 text-[#34A853] shadow-[0_0_8px_rgba(52,168,83,0.15)]";
                default:
                  return "bg-white/10 border-white/20 text-white";
              }
            };

            return (
              <div
                key={habit.id}
                className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                  isCompleted
                    ? isDarkMode
                      ? "bg-white/5 border-white/25 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                      : "bg-emerald-50/50 border-emerald-200 text-slate-900"
                    : isDarkMode
                    ? "bg-zinc-950/80 border-white/10 hover:border-white/30 text-zinc-200 hover:bg-zinc-900/60"
                    : "bg-slate-50/60 border-slate-200/80 hover:border-slate-300"
                }`}
              >
                {/* Left: Checkbox + Titles */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <button
                    onClick={() => handleCheck(habit)}
                    className="focus:outline-hidden text-zinc-400 hover:text-white transition-transform active:scale-90 cursor-pointer"
                    title={isCompleted ? "Mark incomplete" : "Mark completed today"}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-[#34A853] fill-[#34A853]/20 drop-shadow-[0_0_8px_rgba(52,168,83,0.8)]" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-600 hover:text-white" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold truncate ${
                          isCompleted ? "line-through opacity-75 text-zinc-400" : "text-white"
                        }`}
                      >
                        {habit.title}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-semibold font-mono border ${getCategoryBadgeClass(
                          habit.category
                        )}`}
                      >
                        {habit.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-normal">
                      {habit.description}
                    </p>
                  </div>
                </div>

                {/* Right: Streak badge + Action */}
                <div className="flex items-center gap-2.5 ml-2">
                  <div
                    className="flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border border-white/15 bg-black text-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    title={`Current streak: ${habit.currentStreak} days | Best: ${habit.bestStreak} days`}
                  >
                    <Flame className="w-3.5 h-3.5 fill-[#EA4335]/40 text-[#EA4335] drop-shadow-[0_0_6px_rgba(234,67,53,0.8)]" />
                    <span>{habit.currentStreak}d</span>
                  </div>

                  {habit.reminderTime && (
                    <button
                      onClick={() => onScheduleReminder(habit)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title={`Automated reminder: ${habit.reminderTime} (Click to schedule in Calendar)`}
                    >
                      <Bell className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
