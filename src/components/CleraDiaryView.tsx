import React, { useState } from "react";
import { CleraDiaryEntry, ManhattanAuditData } from "../types";
import {
  BookOpen,
  Trophy,
  Flame,
  AlertTriangle,
  Lightbulb,
  ArrowRightCircle,
  HelpCircle,
  FileText,
  Mail,
  Share2,
  Edit3,
  Bot,
} from "lucide-react";

interface CleraDiaryViewProps {
  diary: CleraDiaryEntry;
  auditData: ManhattanAuditData;
  onUpdateDiary: (entry: CleraDiaryEntry) => void;
  onExportToDocs: () => void;
  onSendGmailDigest: () => void;
  onTriggerAiDiagnosis: () => void;
  isDarkMode: boolean;
}

export const CleraDiaryView: React.FC<CleraDiaryViewProps> = ({
  diary,
  auditData,
  onUpdateDiary,
  onExportToDocs,
  onSendGmailDigest,
  onTriggerAiDiagnosis,
  isDarkMode,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDiary, setEditedDiary] = useState<CleraDiaryEntry>(diary);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDiary({
      ...editedDiary,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-5">
      {/* Header Banner - Lethal Shining Black & White Overlay */}
      <div
        className={`rounded-2xl border p-5 transition-all relative overflow-hidden ${
          isDarkMode
            ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent"
            : "bg-white border-slate-200 text-slate-900 shadow-sm"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-4 border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
              <h2 className="text-lg font-black tracking-tight uppercase text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                CLERA — Daily Executive Diary
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">
              One final daily record: decisions, execution, lessons, and tomorrow's handoff.
            </p>
          </div>

          {/* Quick Integration Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onTriggerAiDiagnosis}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-white text-black hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)] border border-white cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-black" />
              <span>AI Deep Analysis</span>
            </button>

            <button
              onClick={onExportToDocs}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDarkMode
                  ? "bg-zinc-950 border-white/20 text-white hover:border-white/50 hover:bg-zinc-900 shadow-[0_0_15px_rgba(255,255,255,0.06)]"
                  : "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-white" />
              <span>Google Docs</span>
            </button>

            <button
              onClick={onSendGmailDigest}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDarkMode
                  ? "bg-zinc-950 border-white/20 text-white hover:border-white/50 hover:bg-zinc-900 shadow-[0_0_15px_rgba(255,255,255,0.06)]"
                  : "bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100"
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-white" />
              <span>Gmail Digest</span>
            </button>

            <button
              onClick={() => setIsEditing((prev) => !prev)}
              className="p-2 rounded-xl border border-white/20 bg-zinc-950 text-white hover:border-white/50 transition-colors cursor-pointer"
              title="Edit Daily Record"
            >
              <Edit3 className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>

        {/* Snapshot Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono text-xs">
          <div className="p-2.5 rounded-xl border border-white/10 bg-zinc-950/80 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
            <span className="text-[10px] text-zinc-400 uppercase block">Latest Date</span>
            <span className="font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{diary.date}</span>
          </div>

          <div className="p-2.5 rounded-xl border border-white/10 bg-zinc-950/80 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
            <span className="text-[10px] text-zinc-400 uppercase block">Day Score</span>
            <span className="font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
              {diary.dayScore}/100
            </span>
          </div>

          <div className="p-2.5 rounded-xl border border-white/10 bg-zinc-950/80 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
            <span className="text-[10px] text-zinc-400 uppercase block">Execution Rate</span>
            <span className="font-bold text-white">{diary.executionRate}%</span>
          </div>

          <div className="p-2.5 rounded-xl border border-white/10 bg-zinc-950/80 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
            <span className="text-[10px] text-zinc-400 uppercase block">Focus Ratio</span>
            <span className="text-zinc-300 font-medium">{diary.focusRatio}</span>
          </div>

          <div className="p-2.5 rounded-xl border border-white/10 bg-zinc-950/80 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
            <span className="text-[10px] text-zinc-400 uppercase block">Verdict</span>
            <span className="font-bold text-white">{diary.verdict}</span>
          </div>
        </div>
      </div>

      {/* Edit Form vs View Mode */}
      {isEditing ? (
        <form
          onSubmit={handleSave}
          className={`rounded-2xl border p-5 space-y-4 text-xs relative overflow-hidden ${
            isDarkMode ? "bg-radial from-zinc-900 via-black to-zinc-950 border-white/20 text-white shadow-[0_0_40px_rgba(255,255,255,0.08)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent" : "bg-white border-slate-200"
          }`}
        >
          <div className="font-bold text-sm text-white">Edit Today's Executive Record</div>

          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Executive Summary</label>
            <textarea
              rows={3}
              value={editedDiary.executiveSummary}
              onChange={(e) => setEditedDiary({ ...editedDiary, executiveSummary: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-white/20 bg-zinc-950 text-white focus:border-white focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Biggest Win</label>
              <textarea
                rows={2}
                value={editedDiary.biggestWin}
                onChange={(e) => setEditedDiary({ ...editedDiary, biggestWin: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-white/20 bg-zinc-950 text-white focus:border-white focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Biggest Execution Leak</label>
              <textarea
                rows={2}
                value={editedDiary.biggestExecutionLeak}
                onChange={(e) => setEditedDiary({ ...editedDiary, biggestExecutionLeak: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-white/20 bg-zinc-950 text-white focus:border-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Key Lesson / Review</label>
              <textarea
                rows={2}
                value={editedDiary.keyLessonReview}
                onChange={(e) => setEditedDiary({ ...editedDiary, keyLessonReview: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-white/20 bg-zinc-950 text-white focus:border-white focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Tomorrow's First Action (Under 10 mins)</label>
              <textarea
                rows={2}
                value={editedDiary.tomorrowsFirstAction}
                onChange={(e) => setEditedDiary({ ...editedDiary, tomorrowsFirstAction: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-white/20 bg-zinc-950 text-white focus:border-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl border border-white/15 text-zinc-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-white text-black font-extrabold shadow-[0_0_15px_rgba(255,255,255,0.4)] border border-white hover:bg-zinc-200 cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Executive Summary Card */}
          <div
            className={`rounded-2xl border p-5 transition-all relative overflow-hidden ${
              isDarkMode ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-white" />
              Executive Summary
            </div>
            <p className="text-xs leading-relaxed text-zinc-200">
              {diary.executiveSummary}
            </p>
          </div>

          {/* Win vs Leak Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Win */}
            <div
              className={`rounded-2xl border p-5 transition-all relative overflow-hidden ${
                isDarkMode ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent" : "bg-emerald-50/50 border-emerald-200"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white mb-2">
                <Trophy className="w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
                Biggest Win
              </div>
              <p className="text-xs leading-relaxed text-zinc-200">
                {diary.biggestWin}
              </p>
            </div>

            {/* Leak */}
            <div
              className={`rounded-2xl border p-5 transition-all relative overflow-hidden ${
                isDarkMode ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent" : "bg-rose-50/50 border-rose-200"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                <AlertTriangle className="w-4 h-4 text-zinc-400" />
                Biggest Execution Leak
              </div>
              <p className="text-xs leading-relaxed text-zinc-200">
                {diary.biggestExecutionLeak}
              </p>
            </div>
          </div>

          {/* Key Lesson & Tomorrow's Action */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Lesson */}
            <div
              className={`rounded-2xl border p-5 transition-all relative overflow-hidden ${
                isDarkMode ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent" : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white mb-2">
                <Lightbulb className="w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
                Key Lesson / Review
              </div>
              <p className="text-xs leading-relaxed text-zinc-200">
                {diary.keyLessonReview}
              </p>
            </div>

            {/* Tomorrow's Action */}
            <div
              className={`rounded-2xl border p-5 transition-all relative overflow-hidden ${
                isDarkMode ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent" : "bg-blue-50/50 border-blue-200"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white mb-2">
                <ArrowRightCircle className="w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
                Tomorrow's First Action (&lt;10 Mins)
              </div>
              <p className="text-xs leading-relaxed text-white font-medium">
                {diary.tomorrowsFirstAction}
              </p>
            </div>
          </div>

          {/* Blockers & Clera Note */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Blockers */}
            <div
              className={`rounded-2xl border p-5 transition-all relative overflow-hidden ${
                isDarkMode ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent" : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                <HelpCircle className="w-4 h-4 text-zinc-400" />
                Open Questions / Blockers
              </div>
              <p className="text-xs leading-relaxed text-zinc-300">
                {diary.openQuestionsBlockers}
              </p>
            </div>

            {/* Clera's Secretary Note */}
            <div
              className={`rounded-2xl border p-5 transition-all relative overflow-hidden ${
                isDarkMode ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent" : "bg-indigo-50/50 border-indigo-200"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white mb-2">
                <Bot className="w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
                Clera's Secretary Note
              </div>
              <p className="text-xs leading-relaxed text-zinc-200 italic">
                "{diary.cleraSecretaryNote}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
