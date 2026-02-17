import { Injectable } from "@nestjs/common";
import { JmapSession } from "./session.type";

@Injectable()
export class JmapSessionStore {
  private readonly store = new Map<string, JmapSession>();

  get(userId: string): JmapSession | null {
    return this.store.get(userId) ?? null;
  }

  set(userId: string, session: JmapSession): void {
    this.store.set(userId, session);
  }

  delete(userId: string): void {
    this.store.delete(userId);
  }

  has(userId: string): boolean {
    return this.store.has(userId);
  }

  touch(userId: string): void {
    const session = this.store.get(userId);
    if (session) {
      session.lastAccessed = Date.now();
      this.store.set(userId, session);
    }
  }

  getAllSessions(): Map<string, JmapSession> {
    return this.store;
  }

  getAllUserIds(): string[] {
    return Array.from(this.store.keys());
  }
}
