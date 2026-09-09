import React, { useState } from "react";
import { NotionConfig, CleraDiaryEntry, ManhattanAuditData } from "../types";
import {
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  ArrowRight,
  ExternalLink,
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
  const [apiKey, setApiKey] = useState(config.apiKey || "");
  const [databaseId, setDatabaseId] = useState(config.databaseId || "");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!apiKey || !databaseId) {
      setStatusMsg({
        type: "error",
        text: "Please provide both your Notion API Key (Internal Integration Token) and Database ID.",
      });
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/notion/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          apiKey,
          databaseId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reach Notion API");
      }

      setStatusMsg({
        type: "success",
        text: data.message || "Notion integration verified successfully!",
      });

      onSaveConfig({
        ...config,
        apiKey,
        databaseId,
        lastSyncedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Connection failed. Please check token permissions and database sharing.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncDiaryEntry = async () => {
    if (!apiKey || !databaseId) {
      setStatusMsg({
        type: "error",
        text: "Please provide both your Notion API Key and Database ID before syncing.",
      });
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/notion/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync_entry",
          apiKey,
          databaseId,
          entry: {
            title: `CLERA Executive Diary — ${diary.date}`,
            date: diary.date,
            score: diary.dayScore,
            verdict: diary.verdict,
            executiveSummary: diary.executiveSummary,
            biggestWin: diary.biggestWin,
            biggestExecutionLeak: diary.biggestExecutionLeak,
            nextAction: diary.tomorrowsFirstAction,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Sync to Notion failed");
      }

      setStatusMsg({
        type: "success",
        text: `Successfully synced entry for ${diary.date} to Notion! (Page ID: ${data.pageId || "created"})`,
      });

      onSaveConfig({
        ...config,
        apiKey,
        databaseId,
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`w-full max-w-lg rounded-2xl border p-5 shadow-2xl transition-all relative ${
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

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">Notion Project Database Sync</h3>
            <p className="text-xs text-slate-400">
              Synchronize Manhattan Project logs and Clera Executive Diary to your Notion workspace.
            </p>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`p-3 mb-4 rounded-xl text-xs flex items-center gap-2 ${
              statusMsg.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="space-y-3 text-xs mb-5">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Notion Internal Integration Token (API Key)
            </label>
            <input
              type="password"
              placeholder="secret_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border font-mono bg-transparent focus:outline-hidden focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Created at notion.so/my-integrations. (Never saved to public repos)
            </p>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Notion Database ID
            </label>
            <input
              type="text"
              placeholder="32-character database string"
              value={databaseId}
              onChange={(e) => setDatabaseId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border font-mono bg-transparent focus:outline-hidden focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Ensure you have invited your integration to the database via Notion page menu &rarr; Connections.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Test Connection</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSyncDiaryEntry}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
              <span>Sync Today's Diary</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
