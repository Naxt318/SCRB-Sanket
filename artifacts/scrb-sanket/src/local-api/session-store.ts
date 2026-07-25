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
  private auditLog: AuditEntry[] = [];

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
  }

  getAuditLog(limit = 50): AuditEntry[] {
    return this.auditLog.slice(0, limit);
  }
}

export const sessionStore = new SessionStore();
