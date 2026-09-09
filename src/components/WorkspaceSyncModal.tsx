import React, { useState } from "react";
import { GoogleWorkspaceState, ManhattanAuditData, CleraDiaryEntry, Habit } from "../types";
import {
  googleSignIn,
  logout as authLogout,
  getAccessToken,
} from "../services/firebaseAuth";
import {
  syncToGoogleSheets,
  scheduleCalendarEvent,
  sendDailyDigestEmail,
  exportDiaryToGoogleDoc,
} from "../services/workspaceApi";
import {
  FileSpreadsheet,
  Calendar,
  Mail,
  FileText,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Sparkles,
} from "lucide-react";

interface WorkspaceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceState: GoogleWorkspaceState;
  onUpdateWorkspaceState: (newState: Partial<GoogleWorkspaceState>) => void;
  auditData: ManhattanAuditData;
  diary: CleraDiaryEntry;
  habits: Habit[];
  isDarkMode: boolean;
}

export const WorkspaceSyncModal: React.FC<WorkspaceSyncModalProps> = ({
  isOpen,
  onClose,
  workspaceState,
  onUpdateWorkspaceState,
  auditData,
  diary,
  habits,
  isDarkMode,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Explicit confirmation state for mutating Workspace operations
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    action: "sheets" | "calendar" | "gmail" | "docs";
    title: string;
    description: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    try {
      setLoadingAction("auth");
      setErrorMessage(null);
      const res = await googleSignIn();
      if (res) {
        onUpdateWorkspaceState({
          isAuthenticated: true,
          userEmail: res.user.email,
          userName: res.user.displayName,
          userPhoto: res.user.photoURL,
          accessToken: res.accessToken,
        });
        setSuccessMessage(`Signed in as ${res.user.displayName || res.user.email}`);
      }
    } catch (err: any) {
      console.error("Sign in failed:", err);
      setErrorMessage(err?.message || "Failed to sign in with Google.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleLogout = async () => {
    await authLogout();
    onUpdateWorkspaceState({
      isAuthenticated: false,
      userEmail: null,
      userName: null,
      userPhoto: null,
      accessToken: null,
    });
    setSuccessMessage("Signed out successfully.");
  };

  const executeConfirmedAction = async () => {
    if (!pendingConfirmation) return;
    const action = pendingConfirmation.action;
    setPendingConfirmation(null);
    setLoadingAction(action);
    setErrorMessage(null);
    setSuccessMessage(null);
    setExternalUrl(null);

    try {
      if (action === "sheets") {
        const result = await syncToGoogleSheets(auditData, habits);
        setSuccessMessage("Daily Manhattan audits & habits synchronized to Google Sheets!");
        setExternalUrl(result.url);
      } else if (action === "calendar") {
        // Schedule today's 10 PM Manhattan audit review
        const today = new Date();
        today.setHours(22, 0, 0, 0); // 10:00 PM
        const result = await scheduleCalendarEvent({
          summary: "Manhattan Project: 10 PM Strict Audit & Timing Review",
          description: "Evidence-based check: daytime screenshots, code commits, branch diff, and finalized Timing Import.",
          startTime: today.toISOString(),
          durationMinutes: 30,
        });
        setSuccessMessage("10 PM Daily Audit event added to your Google Calendar!");
        setExternalUrl(result.htmlLink);
      } else if (action === "gmail") {
        if (!workspaceState.userEmail) {
          throw new Error("No user email address available to send the digest to.");
        }
        await sendDailyDigestEmail(workspaceState.userEmail, auditData, diary);
        setSuccessMessage(`Daily Manhattan audit digest sent to ${workspaceState.userEmail}!`);
      } else if (action === "docs") {
        const result = await exportDiaryToGoogleDoc(diary, auditData);
        setSuccessMessage("CLERA Daily Executive Diary exported to Google Docs!");
        setExternalUrl(result.url);
      }
    } catch (err: any) {
      console.error("Workspace API error:", err);
      setErrorMessage(err?.message || "Workspace operation failed. Please check permissions.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`w-full max-w-xl rounded-2xl border p-5 shadow-2xl transition-all relative ${
          isDarkMode
            ? "bg-slate-900 border-slate-700 text-slate-100"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">Google Workspace Synchronization</h3>
            <p className="text-xs text-slate-400">
              Integrate Google Sheets, Calendar, Gmail, and Docs with user permission.
            </p>
          </div>
        </div>

        {/* Auth Status & Google Sign In Button */}
        <div
          className={`p-4 rounded-xl border mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"
          }`}
        >
          {workspaceState.isAuthenticated ? (
            <div className="flex items-center gap-3">
              {workspaceState.userPhoto ? (
                <img
                  src={workspaceState.userPhoto}
                  alt={workspaceState.userName || "User"}
                  className="w-10 h-10 rounded-full border border-emerald-500/40"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  {workspaceState.userName?.slice(0, 1) || "U"}
                </div>
              )}
              <div className="text-xs">
                <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Google Account Connected</span>
                </div>
                <div className="text-slate-400">{workspaceState.userEmail}</div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400">
              Connect your Google Workspace account to enable automatic sync and reminders.
            </div>
          )}

          <div>
            {workspaceState.isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            ) : (
              /* Official GSI Material Button styling from skill instructions */
              <button
                onClick={handleSignIn}
                disabled={loadingAction === "auth"}
                className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white text-slate-800 border border-slate-300 font-semibold text-xs shadow-xs hover:bg-slate-50 active:scale-98 transition-all disabled:opacity-50"
              >
                {loadingAction === "auth" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                )}
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Status Notifications */}
        {successMessage && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successMessage}
            </span>
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-semibold underline text-emerald-300 ml-2"
              >
                <span>View</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
          {/* Sheets Card */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}
          >
            <div>
              <div className="flex items-center gap-2 font-bold text-emerald-500 mb-1">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Google Sheets</span>
              </div>
              <p className="text-slate-400 text-[11px] mb-3">
                Export daily score history, execution ratios, and active habit statistics into a spreadsheet.
              </p>
            </div>
            <button
              onClick={() =>
                setPendingConfirmation({
                  action: "sheets",
                  title: "Sync with Google Sheets",
                  description:
                    "This will create or update a 'Manhattan Project Productivity Audit' spreadsheet in your Google Drive and write your latest audit score history and habit logs.",
                })
              }
              disabled={!workspaceState.isAuthenticated || loadingAction !== null}
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              {loadingAction === "sheets" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5" />
              )}
              <span>Sync to Sheets</span>
            </button>
          </div>

          {/* Calendar Card */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}
          >
            <div>
              <div className="flex items-center gap-2 font-bold text-blue-500 mb-1">
                <Calendar className="w-4 h-4" />
                <span>Google Calendar</span>
              </div>
              <p className="text-slate-400 text-[11px] mb-3">
                Schedule today's 10:00 PM Manhattan Audit &amp; Timing Review checkpoint with a 10-minute pop-up reminder.
              </p>
            </div>
            <button
              onClick={() =>
                setPendingConfirmation({
                  action: "calendar",
                  title: "Add 10 PM Review to Calendar",
                  description:
                    "This will schedule a 30-minute '10 PM Strict Audit & Timing Review' block on your primary Google Calendar for tonight.",
                })
              }
              disabled={!workspaceState.isAuthenticated || loadingAction !== null}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              {loadingAction === "calendar" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Calendar className="w-3.5 h-3.5" />
              )}
              <span>Schedule 10 PM Audit</span>
            </button>
          </div>

          {/* Gmail Card */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}
          >
            <div>
              <div className="flex items-center gap-2 font-bold text-rose-500 mb-1">
                <Mail className="w-4 h-4" />
                <span>Gmail Digest</span>
              </div>
              <p className="text-slate-400 text-[11px] mb-3">
                Dispatch an automated executive digest email containing your daily score, wins, leaks, and tomorrow's action.
              </p>
            </div>
            <button
              onClick={() =>
                setPendingConfirmation({
                  action: "gmail",
                  title: "Send Daily Audit via Gmail",
                  description: `This will send an executive email summary of today's Manhattan Audit and Clera Diary to ${workspaceState.userEmail}.`,
                })
              }
              disabled={!workspaceState.isAuthenticated || loadingAction !== null}
              className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              {loadingAction === "gmail" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Mail className="w-3.5 h-3.5" />
              )}
              <span>Email Daily Digest</span>
            </button>
          </div>

          {/* Google Docs Card */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}
          >
            <div>
              <div className="flex items-center gap-2 font-bold text-indigo-500 mb-1">
                <FileText className="w-4 h-4" />
                <span>Google Docs</span>
              </div>
              <p className="text-slate-400 text-[11px] mb-3">
                Generate a formatted, collaborative Google Doc for today's CLERA Daily Executive Diary.
              </p>
            </div>
            <button
              onClick={() =>
                setPendingConfirmation({
                  action: "docs",
                  title: "Export Diary to Google Docs",
                  description:
                    "This will create a new document named 'CLERA Executive Diary - " +
                    diary.date +
                    "' in your Google Drive containing your full audit analysis.",
                })
              }
              disabled={!workspaceState.isAuthenticated || loadingAction !== null}
              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              {loadingAction === "docs" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              <span>Export to Docs</span>
            </button>
          </div>
        </div>

        {/* Mandatory User Confirmation Dialog */}
        {pendingConfirmation && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div
              className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl ${
                isDarkMode ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm mb-2 text-amber-500">
                <AlertCircle className="w-5 h-5" />
                <span>Confirm Workspace Operation</span>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                {pendingConfirmation.description}
              </p>
              <div className="flex justify-end gap-2 text-xs font-semibold">
                <button
                  onClick={() => setPendingConfirmation(null)}
                  className="px-3 py-1.5 rounded-lg border text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirmedAction}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
                >
                  Confirm &amp; Proceed
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
