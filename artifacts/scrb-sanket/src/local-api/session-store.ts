// In-memory session store for chat history and audit log — lives entirely
// in the browser tab for this session. There's no server anymore, so
// there's nothing to persist to; this mirrors the original Cloud Function's
// in-memory store (which was itself ephemeral, resetting on every cold
// start) just as faithfully, minus the server round-trip.

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  language: string;
  timestamp: string;
  reasoning?: string[];
  sources?: string[];
}

export interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  role: string;
  query: string;
  timestamp: string;
  resultsCount: number;
  ipAddress: string;
}

class SessionStore {
  private sessions: Map<string, ChatMessage[]> = new Map();
  private readonly auditKey = "scrb_sanket_audit_log";
  private auditLog: AuditEntry[] = this.loadAuditLog();

  private loadAuditLog(): AuditEntry[] {
    try {
      const stored = JSON.parse(localStorage.getItem(this.auditKey) ?? "null") as AuditEntry[] | null;
      if (stored?.length) return stored;
    } catch {
      // Fall through to synthetic demonstration entries.
    }
    return [
      { id: "AUD-DEMO-001", userId: "usr-supervisor", userName: "DSP M. Nair", role: "supervisor", query: "Reviewed Bengaluru Urban chain-snatching early warning", timestamp: "2026-07-24T09:42:00.000Z", resultsCount: 19, ipAddress: "demo-local" },
      { id: "AUD-DEMO-002", userId: "usr-investigator", userName: "Insp. R. Kumar", role: "investigator", query: "Searched recurring late-night burglary MO patterns", timestamp: "2026-07-24T08:17:00.000Z", resultsCount: 12, ipAddress: "demo-local" },
      { id: "AUD-DEMO-003", userId: "usr-admin", userName: "SP J. Reddy", role: "admin", query: "Generated statewide explainable risk review", timestamp: "2026-07-23T16:05:00.000Z", resultsCount: 6, ipAddress: "demo-local" },
    ];
  }

  private persistAuditLog(): void {
    try {
      localStorage.setItem(this.auditKey, JSON.stringify(this.auditLog));
    } catch {
      // Storage can be unavailable in hardened browser modes; memory still works.
    }
  }

  getHistory(sessionId: string): ChatMessage[] {
    return this.sessions.get(sessionId) ?? [];
  }

  addMessage(msg: ChatMessage): void {
    const existing = this.sessions.get(msg.sessionId) ?? [];
    existing.push(msg);
    this.sessions.set(msg.sessionId, existing);
    if (existing.length > 100) {
      this.sessions.set(msg.sessionId, existing.slice(-100));
    }
  }

  clearHistory(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  addAuditEntry(entry: AuditEntry): void {
    this.auditLog.unshift(entry);
    if (this.auditLog.length > 500) {
      this.auditLog = this.auditLog.slice(0, 500);
    }
    this.persistAuditLog();
  }

  getAuditLog(limit = 50): AuditEntry[] {
    return this.auditLog.slice(0, limit);
  }
}

export const sessionStore = new SessionStore();
