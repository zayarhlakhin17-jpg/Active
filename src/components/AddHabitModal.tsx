import React, { useState } from "react";
import { Habit, HabitCategory } from "../types";
import { X, Plus, Sparkles } from "lucide-react";

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHabit: (habit: Habit) => void;
  isDarkMode: boolean;
}

const COLOR_PALETTE = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#f43f5e", // Rose
];

export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  isOpen,
  onClose,
  onAddHabit,
  isDarkMode,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<HabitCategory>("engineering");
  const [frequency, setFrequency] = useState<"daily" | "weekdays" | "weekly">("daily");
  const [targetCount, setTargetCount] = useState(1);
  const [unit, setUnit] = useState("session");
  const [reminderTime, setReminderTime] = useState("20:00");
  const [color, setColor] = useState(COLOR_PALETTE[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      frequency,
      targetCount: Number(targetCount) || 1,
      unit: unit.trim() || "times",
      currentStreak: 0,
      bestStreak: 0,
      reminderTime,
      completedDates: [],
      createdAt: new Date().toISOString().slice(0, 10),
      color,
    };

    onAddHabit(newHabit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl transition-all relative ${
          isDarkMode
            ? "bg-slate-900 border-slate-700 text-slate-100"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Plus className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold">New Evidence-Aligned Habit</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Habit Title</label>
            <input
              type="text"
              placeholder="e.g., Code Review & Unit Assertion Check"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border bg-transparent font-medium focus:outline-hidden focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Description / Target Outcome</label>
            <input
              type="text"
              placeholder="e.g., Ensure green assertions before 18:00 cutoff"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border bg-transparent focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as HabitCategory)}
                className="w-full px-3 py-2 rounded-xl border bg-transparent focus:outline-hidden focus:border-blue-500"
              >
                <option value="engineering" className="dark:bg-slate-900">Engineering</option>
                <option value="deep-focus" className="dark:bg-slate-900">Deep Focus</option>
                <option value="mindset" className="dark:bg-slate-900">Mindset</option>
                <option value="health" className="dark:bg-slate-900">Health</option>
                <option value="learning" className="dark:bg-slate-900">Learning</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border bg-transparent focus:outline-hidden focus:border-blue-500"
              >
                <option value="daily" className="dark:bg-slate-900">Daily</option>
                <option value="weekdays" className="dark:bg-slate-900">Weekdays</option>
                <option value="weekly" className="dark:bg-slate-900">Weekly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Daily Target &amp; Unit</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value))}
                  className="w-16 px-3 py-2 rounded-xl border bg-transparent font-mono focus:outline-hidden focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="commits, mins, etc."
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border bg-transparent focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Automated Reminder Time</label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-transparent font-mono focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Accent Theme</label>
            <div className="flex items-center gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? "scale-125 ring-2 ring-blue-500" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs"
            >
              Create Habit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
