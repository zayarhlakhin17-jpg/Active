import React, { useState, useMemo } from "react";
import { NotionConfig, CleraDiaryEntry, ManhattanAuditData, NotionSyncResponse } from "../types";
import { getFirebaseIdToken, auth } from "../services/firebaseAuth";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Eye,
  RefreshCw,
} from "lucide-react";

interface NotionSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: NotionConfig;
  onSaveConfig: (cfg: NotionConfig) => void;
  diary: CleraDiaryEntry;
  auditData: ManhattanAuditData;
  isDarkMode: boolean;
}

export const NotionSyncModal: React.FC<NotionSyncModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  diary,
  auditData,
  isDarkMode,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(diary.date || new Date().toISOString().slice(0, 10));
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
    url?: string;
    pageId?: string;
    schemaWarnings?: string[];
  } | null>(null);

  // Collect available dates from diary, reports, and history
  const availableDates = useMemo(() => {
    const set = new Set<string>();
    if (diary.date) set.add(diary.date);
    if (auditData.reports) {
      auditData.reports.forEach((r) => {
        if (r.date) set.add(r.date);
      });
    }
    if (auditData.history) {
      auditData.history.forEach((h) => {
        if (h.date) set.add(h.date);
      });
    }
    return Array.from(set).filter(Boolean).sort().reverse();
  }, [diary.date, auditData.reports, auditData.history]);

  // Derive preview data strictly for the selected date without inventing values
  const previewEntry = useMemo(() => {
    if (selectedDate === diary.date) {
      return {
        date: diary.date,
        title: `CLERA Executive Diary — ${diary.date}`,
        dayScore: diary.dayScore,
        verdict: diary.verdict,
        executiveSummary: diary.executiveSummary || "",
        biggestWin: diary.biggestWin || "",
        biggestExecutionLeak: diary.biggestExecutionLeak || "",
        tomorrowsFirstAction: diary.tomorrowsFirstAction || "",
        openQuestionsBlockers: diary.openQuestionsBlockers || "",
        evidenceLinks: "",
      };
    }

    const matchingReport = auditData.reports?.find((r) => r.date === selectedDate);
    if (matchingReport) {
      return {
        date: selectedDate,
        title: `CLERA Executive Diary — ${selectedDate}`,
        dayScore: Number(matchingReport.totalScore) || 0,
        verdict: matchingReport.managerAssessment || matchingReport.status || "Logged",
        executiveSummary: matchingReport.plannedDeliverable || matchingReport.practicalWorkBuilt || "",
        biggestWin: matchingReport.practicalWorkBuilt || "",
        biggestExecutionLeak: matchingReport.blockersSummary || "",
        tomorrowsFirstAction: matchingReport.nextAction || "",
        openQuestionsBlockers: matchingReport.blockersSummary || "",
        evidenceLinks: matchingReport.gitCommits || "",
      };
    }

    const matchingHistory = auditData.history.find((h) => h.date === selectedDate);
    if (matchingHistory) {
      return {
        date: selectedDate,
        title: `CLERA Executive Diary — ${selectedDate}`,
        dayScore: matchingHistory.score,
        verdict: matchingHistory.verdict,
        executiveSummary: matchingHistory.notes || "",
        biggestWin: matchingHistory.notes || "",
        biggestExecutionLeak: "",
        tomorrowsFirstAction: "",
        openQuestionsBlockers: "",
        evidenceLinks: matchingHistory.commitsCount ? `${matchingHistory.commitsCount} verified commit(s)` : "",
      };
    }

    return {
      date: selectedDate,
      title: `CLERA Executive Diary — ${selectedDate}`,
      dayScore: diary.dayScore,
      verdict: diary.verdict,
      executiveSummary: diary.executiveSummary || "",
      biggestWin: diary.biggestWin || "",
      biggestExecutionLeak: diary.biggestExecutionLeak || "",
      tomorrowsFirstAction: diary.tomorrowsFirstAction || "",
      openQuestionsBlockers: diary.openQuestionsBlockers || "",
      evidenceLinks: "",
    };
  }, [selectedDate, diary, auditData]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsLoading(true);
    setStatusMsg(null);

    try {
      // 1. Get Firebase ID token for authentication
      const idToken = await getFirebaseIdToken();
      if (!idToken) {
        throw new Error(
          "Authentication required: You must be signed in with your authorized Google account to test Notion. Please sign in via the Google Workspace sync."
        );
      }

      // 2. Call backend test endpoint (no credentials in body)
      const res = await fetch("/api/notion/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          action: "test",
        }),
      });

      const data: NotionSyncResponse = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to reach Notion API");
      }

      const warnings = data.schemaDetails?.warnings;
      setStatusMsg({
        type: "success",
        text: data.message || "Notion integration verified successfully!",
        schemaWarnings: warnings,
      });

      onSaveConfig({
        ...config,
        lastSyncedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Connection failed. Please check server environment and database permissions.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncDiaryEntry = async () => {
    setIsLoading(true);
    setStatusMsg(null);

    try {
      // 1. Get Firebase ID token for authentication
      const idToken = await getFirebaseIdToken();
      if (!idToken) {
        throw new Error(
          "Authentication required: You must be signed in with your authorized Google account to sync to Notion."
        );
      }

      // 2. Call backend sync_entry endpoint with typed entry contract (no client credentials)
      const res = await fetch("/api/notion/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          action: "sync_entry",
          entry: previewEntry,
        }),
      });

      const data: NotionSyncResponse = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Sync to Notion failed");
      }

      const modeText = data.updated ? "Updated existing" : "Created new";
      setStatusMsg({
        type: "success",
        text: `${modeText} entry for ${previewEntry.date} in Notion!`,
        url: data.url,
        pageId: data.pageId,
      });

      onSaveConfig({
        ...config,
        lastSyncedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Sync to Notion failed.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signedInUser = auth.currentUser;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        className={`w-full max-w-xl rounded-2xl border p-5 sm:p-6 shadow-2xl transition-all relative my-6 ${
          isDarkMode
            ? "bg-slate-900 border-slate-700 text-slate-100"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs">
            <Database className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <span>Notion Project Database Sync</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-medium">
                Server-Secured
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Synchronize CLERA Executive Diary and Manhattan scores to your Notion database.
            </p>
          </div>
        </div>

        {/* Server Security & Auth Notice */}
        <div
          className={`p-3 rounded-xl mb-4 border text-xs flex items-start gap-2.5 ${
            isDarkMode ? "bg-slate-800/60 border-slate-700" : "bg-slate-50 border-slate-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-semibold text-slate-200">Private Single-Owner Integration</div>
            <p className="text-[11px] text-slate-400">
              Notion credentials (<code className="font-mono text-slate-300">NOTION_API_KEY</code> &amp;{" "}
              <code className="font-mono text-slate-300">NOTION_DATABASE_ID</code>) are loaded strictly from server
              environment variables.
              {signedInUser ? (
                <span className="block mt-0.5 text-emerald-400 font-medium">
                  Signed in as: {signedInUser.email || signedInUser.uid}
                </span>
              ) : (
                <span className="block mt-0.5 text-amber-400 font-medium">
                  Not signed in. Please sign in via Google Workspace button to authorize Notion sync.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`p-3 mb-4 rounded-xl text-xs space-y-1.5 ${
              statusMsg.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {statusMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span className="font-medium">{statusMsg.text}</span>
              </div>
              {statusMsg.url && (
                <a
                  href={statusMsg.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shrink-0"
                >
                  <span>Open in Notion</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {statusMsg.schemaWarnings && statusMsg.schemaWarnings.length > 0 && (
              <div className="text-[11px] text-amber-300 pl-6 space-y-0.5">
                {statusMsg.schemaWarnings.map((w, idx) => (
                  <div key={idx}>Warning: {w}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Date Picker */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Select Diary Date to Export</span>
          </label>
          <div className="flex items-center gap-2">
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`flex-1 px-3 py-2 rounded-xl border text-xs font-mono transition-colors focus:outline-hidden focus:border-blue-500 ${
                isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-900"
              }`}
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {d} {d === diary.date ? "(Latest Diary Record)" : ""}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`px-3 py-2 rounded-xl border text-xs font-mono transition-colors focus:outline-hidden focus:border-blue-500 ${
                isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-900"
              }`}
            />
          </div>
        </div>

        {/* Live Preview Before Writing */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>Preview Before Writing to Notion</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Score: <strong className="text-slate-100">{previewEntry.dayScore}/100</strong> ({previewEntry.verdict})
            </span>
          </div>

          <div
            className={`p-3.5 rounded-xl border space-y-2 text-xs font-sans max-h-56 overflow-y-auto ${
              isDarkMode ? "bg-slate-950/70 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                Title &amp; Date
              </span>
              <span className="font-semibold text-slate-200">{previewEntry.title}</span>
            </div>

            {previewEntry.executiveSummary && (
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                  Executive Summary
                </span>
                <p className="line-clamp-2 text-slate-300">{previewEntry.executiveSummary}</p>
              </div>
            )}

            {previewEntry.biggestWin && (
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block font-mono">
                  Biggest Win / Practical Work
                </span>
                <p className="line-clamp-2 text-slate-300">{previewEntry.biggestWin}</p>
              </div>
            )}

            {previewEntry.biggestExecutionLeak && (
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 block font-mono">
                  Execution Leak &amp; Blockers
                </span>
                <p className="line-clamp-2 text-slate-300">{previewEntry.biggestExecutionLeak}</p>
              </div>
            )}

            {previewEntry.tomorrowsFirstAction && (
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 block font-mono">
                  Tomorrow's First Action
                </span>
                <p className="line-clamp-1 text-slate-300">{previewEntry.tomorrowsFirstAction}</p>
              </div>
            )}

            {previewEntry.evidenceLinks && (
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block font-mono">
                  Evidence
                </span>
                <p className="font-mono text-[11px] text-slate-300 truncate">{previewEntry.evidenceLinks}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Test Connection &amp; Schema</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSyncDiaryEntry}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
              <span>Sync {selectedDate} to Notion</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
