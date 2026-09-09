import {
  ManhattanAuditData,
  CleraDiaryEntry,
  Habit,
  NotionConfig,
  UserGamification,
} from "../types";
import {
  initialManhattanData,
  initialCleraDiary,
  initialHabits,
  initialGamification,
} from "../data/initialData";

const STORAGE_KEYS = {
  HABITS: "manhattan_habits_v1",
  AUDIT: "manhattan_audit_v1",
  DIARY: "manhattan_diary_v1",
  NOTION: "manhattan_notion_v1",
  GAMIFICATION: "manhattan_gamification_v1",
  PENDING_SYNC: "manhattan_pending_sync_queue",
  THEME: "manhattan_theme_preference",
};

export interface StoredState {
  habits: Habit[];
  auditData: ManhattanAuditData;
  diary: CleraDiaryEntry;
  notionConfig: NotionConfig;
  gamification: UserGamification;
  lastLocalSavedAt: string;
}

export function loadLocalState(): StoredState {
  try {
    const rawHabits = localStorage.getItem(STORAGE_KEYS.HABITS);
    const rawAudit = localStorage.getItem(STORAGE_KEYS.AUDIT);
    const rawDiary = localStorage.getItem(STORAGE_KEYS.DIARY);
    const rawNotion = localStorage.getItem(STORAGE_KEYS.NOTION);
    const rawGamification = localStorage.getItem(STORAGE_KEYS.GAMIFICATION);

    // Sanitize Notion config: remove any legacy apiKey or secret tokens
    let sanitizedNotion: NotionConfig = { databaseId: "", autoSync: false };
    if (rawNotion) {
      try {
        const parsed = JSON.parse(rawNotion);
        sanitizedNotion = {
          databaseId: parsed.databaseId || "",
          autoSync: Boolean(parsed.autoSync),
          lastSyncedAt: parsed.lastSyncedAt,
        };
        // If legacy apiKey existed in storage, sanitize localStorage now
        if ("apiKey" in parsed) {
          localStorage.setItem(STORAGE_KEYS.NOTION, JSON.stringify(sanitizedNotion));
        }
      } catch {
        sanitizedNotion = { databaseId: "", autoSync: false };
      }
    }

    return {
      habits: rawHabits ? JSON.parse(rawHabits) : initialHabits,
      auditData: rawAudit ? JSON.parse(rawAudit) : initialManhattanData,
      diary: rawDiary ? JSON.parse(rawDiary) : initialCleraDiary,
      notionConfig: sanitizedNotion,
      gamification: rawGamification
        ? JSON.parse(rawGamification)
        : initialGamification,
      lastLocalSavedAt: new Date().toISOString(),
    };
  } catch (e) {
    console.error("Failed to load state from localStorage:", e);
    return {
      habits: initialHabits,
      auditData: initialManhattanData,
      diary: initialCleraDiary,
      notionConfig: { databaseId: "", autoSync: false },
      gamification: initialGamification,
      lastLocalSavedAt: new Date().toISOString(),
    };
  }
}

export function saveLocalState(state: {
  habits?: Habit[];
  auditData?: ManhattanAuditData;
  diary?: CleraDiaryEntry;
  notionConfig?: NotionConfig;
  gamification?: UserGamification;
}) {
  try {
    if (state.habits) {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(state.habits));
    }
    if (state.auditData) {
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(state.auditData));
    }
    if (state.diary) {
      localStorage.setItem(STORAGE_KEYS.DIARY, JSON.stringify(state.diary));
    }
    if (state.notionConfig) {
      // Ensure no apiKey or token is stored
      const { ...safeNotion } = state.notionConfig as any;
      delete safeNotion.apiKey;
      localStorage.setItem(STORAGE_KEYS.NOTION, JSON.stringify(safeNotion));
    }
    if (state.gamification) {
      localStorage.setItem(
        STORAGE_KEYS.GAMIFICATION,
        JSON.stringify(state.gamification)
      );
    }

    // Queue for cloud sync if offline or needed
    addToPendingSyncQueue({
      type: "FULL_UPDATE",
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Failed to save state to localStorage:", e);
  }
}

export function getPendingSyncCount(): number {
  try {
    const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) || "[]");
    return queue.length;
  } catch {
    return 0;
  }
}

export function addToPendingSyncQueue(item: any) {
  try {
    const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) || "[]");
    queue.push(item);
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(queue));
  } catch (e) {
    console.warn("Queue error:", e);
  }
}

export function clearPendingSyncQueue() {
  localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify([]));
}

// Push local state to server cloud sync
export async function pushToCloudSync(userId: string, data: StoredState): Promise<boolean> {
  try {
    // Ensure no Notion API key or sensitive credentials are ever sent in cloud payload
    const safeNotion = {
      databaseId: data.notionConfig?.databaseId || "",
      autoSync: Boolean(data.notionConfig?.autoSync),
      lastSyncedAt: data.notionConfig?.lastSyncedAt,
    };
    const sanitizedPayload = {
      ...data,
      notionConfig: safeNotion,
    };

    const res = await fetch("/api/cloud/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        mode: "push",
        payload: sanitizedPayload,
      }),
    });
    if (res.ok) {
      clearPendingSyncQueue();
      return true;
    }
    return false;
  } catch (e) {
    console.warn("Cloud sync push failed, keeping in offline queue:", e);
    return false;
  }
}

// Pull latest cloud state
export async function pullFromCloudSync(userId: string): Promise<StoredState | null> {
  try {
    const res = await fetch("/api/cloud/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        mode: "pull",
      }),
    });
    const result = await res.json();
    if (result.success && result.data) {
      return result.data as StoredState;
    }
    return null;
  } catch (e) {
    console.warn("Cloud sync pull failed:", e);
    return null;
  }
}
