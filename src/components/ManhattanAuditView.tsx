import React, { useState } from "react";
import { ManhattanAuditData, DailyScoreEntry, OperatingRule, ManhattanDailyReport } from "../types";
import {
  ShieldAlert,
  Calendar,
  Clock,
  GitCommit,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  PlusCircle,
  BookOpen,
  RefreshCw,
  ExternalLink,
  CheckSquare,
  Sparkles,
  Layers,
  Award,
  ArrowRight,
} from "lucide-react";

interface ManhattanAuditViewProps {
  auditData: ManhattanAuditData;
  onAddAuditScore: (entry: DailyScoreEntry) => void;
  onOpenWorkspaceModal: () => void;
  onOpenNotionModal: () => void;
  isDarkMode: boolean;
  onSyncManhattan?: () => Promise<void> | void;
  isSyncing?: boolean;
  lastSyncedAt?: string | null;
  syncError?: string | null;
}

export const ManhattanAuditView: React.FC<ManhattanAuditViewProps> = ({
  auditData,
  onAddAuditScore,
  onOpenWorkspaceModal,
  onOpenNotionModal,
  isDarkMode,
  onSyncManhattan,
  isSyncing = false,
  lastSyncedAt = null,
  syncError = null,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newScore, setNewScore] = useState<number>(85);
  const [newVerdict, setNewVerdict] = useState<string>("Strong execution");
  const [newExecutionRatio, setNewExecutionRatio] = useState<string>("5/5");
  const [newCommits, setNewCommits] = useState<number>(2);
  const [newNotes, setNewNotes] = useState<string>("");

  const latestReport: ManhattanDailyReport | undefined = auditData.latestReport;

  const handleSaveAudit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    onAddAuditScore({
      date: today,
      score: Number(newScore),
      verdict: newVerdict,
      executionRatio: newExecutionRatio,
      commitsCount: Number(newCommits),
      notes: newNotes,
      isProvisional: false,
    });
    setShowAddModal(false);
    setNewNotes("");
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Banner & Strict Operating Rules - Lethal Shining Black with White Overlays */}
      <div
        className={`rounded-2xl border p-5 transition-all relative overflow-hidden ${
          isDarkMode
            ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent"
            : "bg-white border-slate-200 text-slate-900 shadow-sm"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 mb-4 border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              <h2 className="text-lg font-black tracking-tight uppercase text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                Manhattan Project — Daily Productivity Dashboard
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-medium flex items-center gap-2 flex-wrap">
              <span>Strict evidence-based reporting · Timezone: {auditData.timeZone}</span>
              {lastSyncedAt && (
                <span className="font-mono text-zinc-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                  Last synced: {lastSyncedAt}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* SYNC MANHATTAN Button */}
            {onSyncManhattan && (
              <button
                onClick={() => onSyncManhattan()}
                disabled={isSyncing}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer shadow-[0_0_20px_rgba(66,133,244,0.35)] disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkMode
                    ? "bg-white text-black hover:bg-zinc-200 border-white"
                    : "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                }`}
                title="Read newest Daily Reports from Manhattan Google Sheet (1KjoOGr4St39gbVGMUP_9x9B9xNQfAHCLNR4QSDq8_1s)"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isSyncing ? "animate-spin text-[#4285F4]" : "text-black"
                  }`}
                />
                <span>{isSyncing ? "Syncing..." : "SYNC MANHATTAN"}</span>
              </button>
            )}

            <button
              onClick={onOpenWorkspaceModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDarkMode
                  ? "bg-zinc-950 border-white/20 text-white hover:border-white/50 hover:bg-zinc-900 shadow-[0_0_15px_rgba(255,255,255,0.06)]"
                  : "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
              <span>Google Sheets Sync</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-zinc-950 text-white hover:bg-white hover:text-black transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/20 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-white group-hover:text-black" />
              <span>Log Audit Score</span>
            </button>
          </div>
        </div>

        {/* Sync Status Banner / Useful Error Message */}
        {syncError && (
          <div className="p-3 rounded-xl border mb-4 bg-rose-500/10 border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-rose-200">Google Sheets Import Error:</span>
              <p className="text-[11px] leading-relaxed text-rose-300">{syncError}</p>
            </div>
          </div>
        )}

        {isSyncing && (
          <div className="p-3 rounded-xl border mb-4 bg-blue-500/10 border-blue-500/30 text-blue-200 text-xs flex items-center gap-2.5 animate-pulse">
            <RefreshCw className="w-4 h-4 shrink-0 text-[#4285F4] animate-spin" />
            <span className="font-mono font-medium">Syncing... Reading Manhattan Daily Reports from Google Sheets ('Daily Reports'!A4:W)...</span>
          </div>
        )}

        {/* Latest Audit Alert Box */}
        <div
          className="p-4 rounded-xl border mb-5 bg-white/5 border-white/25 text-white shadow-[0_0_20px_rgba(255,255,255,0.08)] backdrop-blur-md"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)] mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold tracking-wide uppercase text-zinc-200">
                LATEST AUDIT — {auditData.latestAuditDate} | EVENING SNAPSHOT — provisional, not midnight-final
              </div>
              <div className="font-mono text-sm font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                {auditData.currentScore}/100 {auditData.verdict} | Daily execution {auditData.dailyExecution} | Weekly W03 acceptance {auditData.weeklyAcceptance}
              </div>
              <div className="text-zinc-400 text-[11px] font-mono">
                Focus {auditData.focusRatio} | Waste {auditData.wasteRatio} | {auditData.timingStatus}
              </div>
            </div>
          </div>
        </div>

        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            className={`p-3.5 rounded-xl border ${
              isDarkMode ? "bg-zinc-950/80 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]" : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="text-[11px] text-zinc-400 font-medium">Days Logged</div>
            <div className="text-xl font-black font-mono mt-0.5 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{auditData.daysLogged}</div>
            <div className="text-[10px] text-zinc-300 mt-0.5 font-mono">Continuous audit trail</div>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isDarkMode ? "bg-zinc-950/80 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]" : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="text-[11px] text-zinc-400 font-medium">Average Score</div>
            <div className="text-xl font-black font-mono mt-0.5 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
              {auditData.averageScore}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">Rating: Developing</div>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isDarkMode ? "bg-zinc-950/80 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]" : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="text-[11px] text-zinc-400 font-medium">Commits Recorded</div>
            <div className="text-xl font-black font-mono mt-0.5 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
              {auditData.commitsRecorded}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">Verified git evidence</div>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isDarkMode ? "bg-zinc-950/80 border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]" : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="text-[11px] text-zinc-400 font-medium">No-Evidence Days</div>
            <div className="text-xl font-black font-mono mt-0.5 text-zinc-300">
              {auditData.noEvidenceDays}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">Requires remediation</div>
          </div>
        </div>
      </div>

      {/* 2. Imported Manhattan Daily Report Card (From Google Sheets 'Daily Reports'!A4:W) */}
      {latestReport && (
        <div
          className={`rounded-2xl border p-5 relative overflow-hidden transition-all ${
            isDarkMode
              ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/20 text-white shadow-[0_0_40px_rgba(66,133,244,0.1)] before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-linear-to-r before:from-[#4285F4] before:via-[#EA4335] before:via-[#FBBC05] before:to-[#34A853]"
              : "bg-white border-slate-200 text-slate-900 shadow-md before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-linear-to-r before:from-[#4285F4] before:via-[#EA4335] before:via-[#FBBC05] before:to-[#34A853]"
          }`}
        >
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3.5 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center font-bold shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                <FileSpreadsheet className="w-4 h-4 text-[#34A853]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black tracking-wide uppercase text-white">
                    Imported Manhattan Daily Report
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-[#34A853]/15 text-[#34A853] border border-[#34A853]/30">
                    Live Sheet
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Imported from spreadsheet range <span className="font-mono text-zinc-300">'Daily Reports'!A4:W</span>
                </p>
              </div>
            </div>

            {/* Top Score Badge & Sprint/Status Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-3 py-1 rounded-xl bg-white/10 border border-white/25 text-white flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,255,255,0.1)]">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Total /100</span>
                <span className="font-mono text-base font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
                  {latestReport.totalScore}
                </span>
              </div>

              {latestReport.sprint && (
                <div className="px-2.5 py-1 rounded-xl bg-zinc-950 border border-white/15 text-zinc-300 font-mono text-xs">
                  <span className="text-zinc-500 text-[10px] mr-1">Sprint:</span>
                  <span className="font-bold text-white">{latestReport.sprint}</span>
                </div>
              )}

              {latestReport.status && (
                <div className="px-2.5 py-1 rounded-xl bg-zinc-950 border border-white/15 font-mono text-xs">
                  <span className="text-zinc-500 text-[10px] mr-1">Status:</span>
                  <span className="font-bold text-white uppercase">{latestReport.status}</span>
                </div>
              )}

              {latestReport.completeness && (
                <div className="px-2.5 py-1 rounded-xl bg-zinc-950 border border-white/15 font-mono text-xs">
                  <span className="text-zinc-500 text-[10px] mr-1">Completeness:</span>
                  <span className="font-bold text-[#FBBC05]">{latestReport.completeness}</span>
                </div>
              )}
            </div>
          </div>

          {/* Key Deliverable & Metadata Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block mb-0.5">Date</span>
              <span className="font-bold text-white text-sm">{latestReport.date || "—"}</span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block mb-0.5">Manager Assessment</span>
              <span className="font-sans text-xs font-semibold text-zinc-200">
                {latestReport.managerAssessment || "Pending Assessment"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block mb-0.5">Next First Action</span>
              <span className="font-sans text-xs text-zinc-200 line-clamp-2">
                {latestReport.nextFirstAction || "—"}
              </span>
            </div>
          </div>

          {/* Detailed Report Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Planned Deliverable */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/10">
              <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-[#4285F4]" />
                <span>Planned Deliverable</span>
              </div>
              <p className="font-sans text-zinc-200 leading-relaxed whitespace-pre-line">
                {latestReport.plannedDeliverable || "None specified."}
              </p>
            </div>

            {/* Practical Work Built */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/10">
              <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#34A853]" />
                <span>Practical Work Built</span>
              </div>
              <p className="font-sans text-zinc-200 leading-relaxed whitespace-pre-line">
                {latestReport.practicalWorkBuilt || "None specified."}
              </p>
            </div>

            {/* What I Learned */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/10">
              <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#FBBC05]" />
                <span>What I Learned</span>
              </div>
              <p className="font-sans text-zinc-200 leading-relaxed whitespace-pre-line">
                {latestReport.whatILearned || "None specified."}
              </p>
            </div>

            {/* Git Commits & Evidence */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/10">
              <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5 text-white" />
                <span>Git Commits</span>
              </div>
              <p className="font-mono text-[11px] text-zinc-300 leading-relaxed break-all">
                {latestReport.gitCommits || "No commit hashes provided."}
              </p>

              {latestReport.evidenceLinks && (
                <div className="mt-2.5 pt-2 border-t border-white/10">
                  <span className="text-[10px] text-zinc-400 block mb-1 font-sans">Evidence / Links:</span>
                  <div className="font-mono text-[11px] text-[#4285F4] break-all">
                    {latestReport.evidenceLinks}
                  </div>
                </div>
              )}
            </div>

            {/* Tests / Checks */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/10">
              <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34A853]" />
                <span>Tests / Checks</span>
              </div>
              <p className="font-sans text-zinc-200 leading-relaxed whitespace-pre-line">
                {latestReport.testsChecks || "No test cases or checks logged."}
              </p>
            </div>

            {/* Blockers */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/10">
              <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[#EA4335]" />
                <span>Blockers</span>
              </div>
              <p className="font-sans text-zinc-200 leading-relaxed whitespace-pre-line">
                {latestReport.blockers || "None logged."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Strict Operating Rules & Score Scale Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Score Scale Card */}
        <div
          className={`rounded-2xl border p-4 relative overflow-hidden ${
            isDarkMode ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent" : "bg-white border-slate-200"
          }`}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-white" />
            Audit Score Standard &amp; Meaning
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/10 border border-white/30 text-white font-semibold shadow-[0_0_10px_rgba(255,255,255,0.1)]">
              <span className="font-mono font-bold">80–100 · Strong</span>
              <span>Shipped, tested and evidenced</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/20 text-zinc-200">
              <span className="font-mono font-bold">60–79 · Developing</span>
              <span>Useful progress with important gaps</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-white/10 text-zinc-400">
              <span className="font-mono font-bold">1–59 · Weak</span>
              <span>Activity without enough verified output</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-white/10 text-zinc-500">
              <span className="font-mono font-bold">0 · No Evidence</span>
              <span>No verifiable work submitted</span>
            </div>
          </div>
        </div>

        {/* Operating Rules */}
        <div
          className={`rounded-2xl border p-4 relative overflow-hidden ${
            isDarkMode ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent" : "bg-white border-slate-200"
          }`}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-white" />
            Core Operating Rules
          </h3>
          <div className="space-y-2 text-xs">
            {auditData.operatingRules.map((rule) => (
              <div
                key={rule.number}
                className={`p-2 rounded-lg border flex items-start gap-2.5 ${
                  isDarkMode
                    ? "bg-zinc-950 border-white/10 text-zinc-300"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5 shadow-[0_0_8px_rgba(255,255,255,0.6)]">
                  {rule.number}
                </span>
                <p className="leading-tight">{rule.rule}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Auditable Dated Score Table */}
      <div
        className={`rounded-2xl border p-5 relative overflow-hidden ${
          isDarkMode ? "bg-radial from-zinc-900/90 via-black to-zinc-950 border-white/15 text-white shadow-[0_0_35px_rgba(255,255,255,0.05)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/40 before:to-transparent" : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Dated Score History (Source of Truth)</h3>
            <p className="text-xs text-zinc-400">Historical performance ledger</p>
          </div>
          <span className="text-xs font-mono text-zinc-400">{auditData.history.length} audits</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 font-mono">
                <th className="pb-2.5 font-medium">Date</th>
                <th className="pb-2.5 font-medium">Score</th>
                <th className="pb-2.5 font-medium">Verdict</th>
                <th className="pb-2.5 font-medium">Execution</th>
                <th className="pb-2.5 font-medium">Commits</th>
                <th className="pb-2.5 font-medium">Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {auditData.history.map((entry) => (
                <tr key={entry.date} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 font-semibold text-white">{entry.date}</td>
                  <td className="py-2.5">
                    <span
                      className="px-2 py-0.5 rounded-sm font-bold bg-white/10 border border-white/25 text-white shadow-[0_0_8px_rgba(255,255,255,0.12)]"
                    >
                      {entry.score}
                    </span>
                  </td>
                  <td className="py-2.5 text-zinc-200 font-sans">{entry.verdict}</td>
                  <td className="py-2.5 text-zinc-400">{entry.executionRatio || "—"}</td>
                  <td className="py-2.5 text-zinc-400">{entry.commitsCount || 0}</td>
                  <td className="py-2.5 text-zinc-400 font-sans text-[11px] truncate max-w-xs">
                    {entry.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Score Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl transition-all relative overflow-hidden ${
              isDarkMode ? "bg-black border-white/20 text-white shadow-[0_0_50px_rgba(255,255,255,0.1)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/50 before:to-transparent" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <h3 className="text-base font-bold mb-1 text-white">Log Daily Manhattan Audit</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Enter verified evidence and daily score according to Manhattan operating rules.
            </p>

            <form onSubmit={handleSaveAudit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Audit Score (0 - 100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newScore}
                  onChange={(e) => setNewScore(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-white/20 bg-zinc-950 font-mono text-base font-bold focus:outline-hidden focus:border-white text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Verdict</label>
                <select
                  value={newVerdict}
                  onChange={(e) => setNewVerdict(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/20 bg-zinc-950 focus:outline-hidden focus:border-white text-white"
                >
                  <option value="Strong execution" className="bg-zinc-950 text-white">Strong execution (80–100)</option>
                  <option value="Developing progress" className="bg-zinc-950 text-white">Developing progress (60–79)</option>
                  <option value="Missed target" className="bg-zinc-950 text-white">Missed target (1–59)</option>
                  <option value="No evidence" className="bg-zinc-950 text-white">No verifiable evidence (0)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Execution Ratio</label>
                  <input
                    type="text"
                    placeholder="e.g. 5/5"
                    value={newExecutionRatio}
                    onChange={(e) => setNewExecutionRatio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/20 bg-zinc-950 font-mono focus:outline-hidden focus:border-white text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Commits Pushed</label>
                  <input
                    type="number"
                    min="0"
                    value={newCommits}
                    onChange={(e) => setNewCommits(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-white/20 bg-zinc-950 font-mono focus:outline-hidden focus:border-white text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Evidence &amp; Notes</label>
                <textarea
                  rows={2}
                  placeholder="Key outputs shipped, branch pushed, PR status, test suite results..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/20 bg-zinc-950 focus:outline-hidden focus:border-white text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/15 text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-white text-black font-extrabold shadow-[0_0_15px_rgba(255,255,255,0.4)] border border-white hover:bg-zinc-200 cursor-pointer"
                >
                  Record Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
