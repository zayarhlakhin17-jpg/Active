import React, { useState, useEffect } from "react";
import { Habit } from "../types";
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface QuickEntryWidgetsProps {
  habits: Habit[];
  onQuickCompleteHabit: (habitId: string) => void;
  onQuickLogScore: (score: number, verdict: string) => void;
  onSaveQuickScratchpad: (win: string, leak: string) => void;
  isOnline: boolean;
  pendingSyncCount: number;
  onTriggerCloudSync: () => void;
  isDarkMode: boolean;
}

export const QuickEntryWidgets: React.FC<QuickEntryWidgetsProps> = ({
  habits,
  onQuickCompleteHabit,
  onQuickLogScore,
  onSaveQuickScratchpad,
  isOnline,
  pendingSyncCount,
  onTriggerCloudSync,
  isDarkMode,
}) => {
  // Deep Work Timer State
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<25 | 90>(25);

  // Scratchpad State
  const [quickWin, setQuickWin] = useState("");
  const [quickLeak, setQuickLeak] = useState("");
  const [scratchpadSaved, setScratchpadSaved] = useState(false);

  // Quick Score slider
  const [sliderScore, setSliderScore] = useState(80);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      // Auto complete Deep Work habit if present
      const deepWorkHabit = habits.find((h) => h.category === "deep-focus");
      if (deepWorkHabit) {
        onQuickCompleteHabit(deepWorkHabit.id);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, habits, onQuickCompleteHabit]);

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(timerMode * 60);
  };
  const switchTimerMode = (mins: 25 | 90) => {
    setTimerMode(mins);
    setIsTimerRunning(false);
    setTimerSeconds(mins * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSaveScratchpad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickWin && !quickLeak) return;
    onSaveQuickScratchpad(quickWin, quickLeak);
    setScratchpadSaved(true);
    setTimeout(() => setScratchpadSaved(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Deep Work Sprint Timer Widget - Lethal Shining Black & White Overlay */}
      <div
        className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between relative overflow-hidden ${
          isDarkMode
            ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent"
            : "bg-white border-slate-200 text-slate-900 shadow-xs"
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Deep Work Sprint</h4>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono">
              <button
                onClick={() => switchTimerMode(25)}
                className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                  timerMode === 25
                    ? "bg-white text-black font-extrabold shadow-[0_0_12px_rgba(255,255,255,0.45)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                25m
              </button>
              <button
                onClick={() => switchTimerMode(90)}
                className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                  timerMode === 90
                    ? "bg-white text-black font-extrabold shadow-[0_0_12px_rgba(255,255,255,0.45)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                90m
              </button>
            </div>
          </div>

          <div className="text-center my-3">
            <div className="text-4xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]">
              {formatTime(timerSeconds)}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1 font-medium">
              {isTimerRunning ? "Deep focus block in progress..." : "Ready to engage focus"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={toggleTimer}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isTimerRunning
                ? "bg-zinc-800 hover:bg-zinc-700 text-white border border-white/30"
                : "bg-white hover:bg-zinc-200 text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] border border-white"
            }`}
          >
            {isTimerRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Start Sprint</span>
              </>
            )}
          </button>
          <button
            onClick={resetTimer}
            className="p-2 rounded-xl border border-white/15 bg-zinc-950 text-zinc-400 hover:text-white hover:border-white/35 transition-all cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Quick Score Evaluator Widget - Lethal Shining Black & White Overlay */}
      <div
        className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between relative overflow-hidden ${
          isDarkMode
            ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent"
            : "bg-white border-slate-200 text-slate-900 shadow-xs"
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Quick Score Test</h4>
            </div>
            <span
              className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-white/10 text-white border border-white/25 shadow-[0_0_10px_rgba(255,255,255,0.15)]"
            >
              {sliderScore >= 80 ? "Strong" : sliderScore >= 60 ? "Developing" : "Weak"}
            </span>
          </div>

          <div className="my-2 text-center">
            <span className="text-3xl font-black font-mono text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">{sliderScore}</span>
            <span className="text-xs text-zinc-400 ml-1 font-mono">/100</span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={sliderScore}
            onChange={(e) => setSliderScore(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
            <span>0</span>
            <span>60 Dev</span>
            <span>80 Strong</span>
            <span>100</span>
          </div>
        </div>

        <button
          onClick={() => {
            const verdict =
              sliderScore >= 80
                ? "Strong execution"
                : sliderScore >= 60
                ? "Developing progress"
                : "Missed target";
            onQuickLogScore(sliderScore, verdict);
          }}
          className="w-full py-2 mt-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-white/20 hover:border-white/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.06)]"
        >
          <Zap className="w-3.5 h-3.5 text-white" />
          <span>Apply to Today's Audit</span>
        </button>
      </div>

      {/* 3. Real-Time Sync & Offline Status Widget - Lethal Shining Black & White Overlay */}
      <div
        className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between relative overflow-hidden ${
          isDarkMode
            ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent"
            : "bg-white border-slate-200 text-slate-900 shadow-xs"
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
              ) : (
                <WifiOff className="w-4 h-4 text-zinc-500" />
              )}
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Cloud &amp; Offline Sync</h4>
            </div>
            <span
              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/25 shadow-[0_0_10px_rgba(255,255,255,0.15)]"
            >
              {isOnline ? "Online" : "Offline Storage"}
            </span>
          </div>

          <div className="text-xs space-y-1.5 my-2 font-mono">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Local Storage:</span>
              <span className="text-white font-bold">Encrypted / Active</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Pending Queue:</span>
              <span className="text-zinc-300">{pendingSyncCount} changes</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Cross-Device:</span>
              <span className="text-white font-bold">Ready</span>
            </div>
          </div>
        </div>

        <button
          onClick={onTriggerCloudSync}
          className="w-full py-2 mt-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)] border border-white cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-black" />
          <span>Synchronize Cloud State</span>
        </button>
      </div>
    </div>
  );
};
