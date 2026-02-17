import {
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { JmapSessionStore } from "./session.store";
import { JmapSession } from "./session.type";

const INACTIVITY_TIMEOUT = 20 * 60 * 1000;
const CLEAN_UP_INTERVAL = 5 * 60 * 1000;

@Injectable()
export class SessionService implements OnModuleInit, OnModuleDestroy {
  private cleanUpInterval: NodeJS.Timeout | null = null;

  constructor(private readonly jmapSessionStore: JmapSessionStore) {}

  onModuleInit() {
    this.cleanUpInterval = setInterval(
      () => this.purgeInactiveSessions(),
      CLEAN_UP_INTERVAL,
    );
  }

  onModuleDestroy() {
    if (this.cleanUpInterval) {
      clearInterval(this.cleanUpInterval);
      this.cleanUpInterval = null;
    }
  }

  createSession(
    userId: string,
    data: Omit<JmapSession, "lastAccessed" | "userId">,
  ): JmapSession {
    const session: JmapSession = {
      ...data,
      userId,
      lastAccessed: Date.now(),
    };

    this.jmapSessionStore.set(userId, session);
    return session;
  }

  getSession(userId: string): JmapSession {
    const session = this.getValidSessionOrNull(userId);

    if (!session) {
      throw new NotFoundException(
        `Session not found or expired for userId: ${userId}`,
      );
    }

    this.jmapSessionStore.touch(userId);
    return session;
  }

  hasActiveSession(userId: string): boolean {
    return !!this.getValidSessionOrNull(userId);
  }

  peekSession(userId: string): JmapSession | null {
    return this.jmapSessionStore.get(userId);
  }

  updateSession(
    userId: string,
    data: Partial<Omit<JmapSession, "lastAccessed" | "userId">>,
  ): JmapSession {
    const currentSession = this.getSession(userId);

    const updatedSession: JmapSession = {
      ...currentSession,
      ...data,
      lastAccessed: Date.now(),
    };

    this.jmapSessionStore.set(userId, updatedSession);
    return updatedSession;
  }

  deleteSession(userId: string): void {
    this.jmapSessionStore.delete(userId);
  }

  countSessions(): number {
    return this.jmapSessionStore.getAllUserIds().length;
  }

  private isExpired(session: JmapSession): boolean {
    return Date.now() - session.lastAccessed > INACTIVITY_TIMEOUT;
  }

  private purgeInactiveSessions() {
    const sessions = this.jmapSessionStore.getAllSessions();
    for (const [userId, session] of sessions) {
      if (this.isExpired(session)) {
        this.jmapSessionStore.delete(userId);
      }
    }
  }

  private getValidSessionOrNull(userId: string): JmapSession | null {
    const session = this.jmapSessionStore.get(userId);

    if (!session) {
      return null;
    }

    if (this.isExpired(session)) {
      this.jmapSessionStore.delete(userId);
      return null;
    }

    return session;
  }
}
