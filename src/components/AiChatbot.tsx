import React, { useState, useRef, useEffect } from "react";
import {
  ChatMessage,
  ManhattanAuditData,
  CleraDiaryEntry,
  Habit,
  AiAction,
} from "../types";
import {
  Bot,
  Send,
  Sparkles,
  Brain,
  Minimize2,
  Maximize2,
  Trash2,
  CornerDownLeft,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  PlusCircle,
  TrendingUp,
} from "lucide-react";

interface AiChatbotProps {
  auditData: ManhattanAuditData;
  diary: CleraDiaryEntry;
  habits: Habit[];
  isDarkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
  onAutoScheduleRequest?: (actionSummary: string) => void;
  onExecuteAction?: (action: AiAction) => void;
}

export const AiChatbot: React.FC<AiChatbotProps> = ({
  auditData,
  diary,
  habits,
  isDarkMode,
  isOpen,
  onClose,
  onAutoScheduleRequest,
  onExecuteAction,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro-1",
      role: "assistant",
      content:
        "Greetings. I am Clera AI, your executive intelligence and productivity advisor. I can analyze your Manhattan Project audit, uphold evidence rules, log completed activities (e.g., 'I just finished a 30-minute run'), configure new habits, and summarize weekly performance.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [highThinking, setHighThinking] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          highThinking,
          contextData: {
            latestScore: auditData.currentScore,
            verdict: auditData.verdict,
            dailyExecution: auditData.dailyExecution,
            weeklyAcceptance: auditData.weeklyAcceptance,
            biggestLeak: diary.biggestExecutionLeak,
            tomorrowsAction: diary.tomorrowsFirstAction,
            habits: habits.map((h) => ({
              id: h.id,
              title: h.title,
              streak: h.currentStreak,
              completedDates: h.completedDates,
              completedToday: h.completedDates.includes(new Date().toISOString().slice(0, 10)),
            })),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Server failed to respond");
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.reply || "No reply received.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: data.modelUsed,
        action: data.action,
      };

      setMessages((prev) => [...prev, botMsg]);

      // Execute action if present
      if (data.action && onExecuteAction) {
        onExecuteAction(data.action);
      }
    } catch (err: any) {
      console.error("AI chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `Advisor Notice: ${err.message || "Failed to reach AI service. Verify GEMINI_API_KEY."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 w-full sm:w-96 md:w-[440px] h-[580px] max-h-[85vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-300 relative ${
        isDarkMode
          ? "bg-radial from-zinc-900 via-black to-zinc-950 border-white/20 text-white shadow-[0_0_50px_rgba(255,255,255,0.1)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-linear-to-r before:from-transparent before:via-white/50 before:to-transparent"
          : "bg-white border-slate-300 text-slate-900"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.4)]">
            <Bot className="w-4 h-4 text-black" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-1.5 text-white">
              <span>Clera AI Executive</span>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">
              Natural Language Action Core
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* High Thinking Toggle */}
          <button
            onClick={() => setHighThinking(!highThinking)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-semibold border transition-all cursor-pointer ${
              highThinking
                ? "bg-white/10 border-white/35 text-white shadow-[0_0_10px_rgba(255,255,255,0.15)]"
                : "bg-zinc-950 border-white/10 text-zinc-400"
            }`}
            title="Toggle Gemini 3.1 Pro High Thinking Mode"
          >
            <Brain className="w-3 h-3 text-white" />
            <span>{highThinking ? "High Reasoning" : "Fast Mode"}</span>
          </button>

          <button
            onClick={() =>
              setMessages([
                {
                  id: "intro-reset",
                  role: "assistant",
                  content: "Session memory cleared. Standing by for instructions.",
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              ])
            }
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Minimize Assistant"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-2 border-b border-white/10 bg-zinc-950/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
        <button
          onClick={() => handleSendMessage("I just finished a 30-minute run")}
          className="px-2.5 py-1 rounded-full whitespace-nowrap bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium cursor-pointer transition-all"
        >
          🏃 Log 30m Run
        </button>
        <button
          onClick={() => handleSendMessage("Remind me to drink water every hour")}
          className="px-2.5 py-1 rounded-full whitespace-nowrap bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium cursor-pointer transition-all"
        >
          💧 New Habit: Water
        </button>
        <button
          onClick={() => handleSendMessage("How did I do on my meditation and habits this week?")}
          className="px-2.5 py-1 rounded-full whitespace-nowrap bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium cursor-pointer transition-all"
        >
          📈 Weekly Progress
        </button>
        <button
          onClick={() => handleSendMessage("What is tomorrow's first action to eliminate execution leaks?")}
          className="px-2.5 py-1 rounded-full whitespace-nowrap bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium cursor-pointer transition-all"
        >
          ⚡ Morning Kickoff
        </button>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl p-3 leading-relaxed ${
                msg.role === "user"
                  ? "bg-white text-black font-semibold rounded-br-xs shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                  : isDarkMode
                  ? "bg-zinc-950 text-zinc-100 border border-white/15 rounded-bl-xs shadow-[0_0_12px_rgba(0,0,0,0.5)]"
                  : "bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-xs"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Action Banner if triggered */}
              {msg.action && (
                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-2 text-[11px] font-mono">
                  {msg.action.type === "LOG_ACTIVITY" && (
                    <div className="flex items-center gap-1.5 text-white">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Action Applied: Activity logged &amp; +50 XP granted</span>
                    </div>
                  )}
                  {msg.action.type === "CREATE_HABIT" && (
                    <div className="flex items-center gap-1.5 text-white">
                      <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Action Applied: Habit configured &amp; added to tracker</span>
                    </div>
                  )}
                  {msg.action.type === "LOG_AUDIT" && (
                    <div className="flex items-center gap-1.5 text-white">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Action Applied: Audit score recorded ({msg.action.auditScore}/100)</span>
                    </div>
                  )}
                  {msg.action.type === "PROGRESS_SUMMARY" && (
                    <div className="flex items-center gap-1.5 text-white">
                      <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                      <span>Weekly Evidence Progress Calculated</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-1 px-1 font-mono">
              <span>{msg.timestamp}</span>
              {msg.modelUsed && (
                <span className="text-[9px] opacity-75">· {msg.modelUsed}</span>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl max-w-[80%] bg-zinc-950 border border-white/15 text-zinc-300 text-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            <span>Clera AI is reasoning through rules &amp; command actions...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <div className="p-3 border-t border-white/10 bg-black/80 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Try: 'I just finished a 30m run' or 'Remind me to drink water'"
            className="flex-1 px-3.5 py-2 rounded-xl border border-white/20 bg-zinc-950 text-white placeholder-zinc-500 text-xs focus:outline-hidden focus:border-white transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-40 text-black font-extrabold transition-all shadow-[0_0_15px_rgba(255,255,255,0.4)] border border-white cursor-pointer"
          >
            <Send className="w-4 h-4 text-black" />
          </button>
        </form>
      </div>
    </div>
  );
};
