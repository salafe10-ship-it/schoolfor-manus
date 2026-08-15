import { EnterpriseIdentity, Session } from './types';

export class IdentityEngine {
  private static sessions: Map<string, Session> = new Map();

  static createSession(identity: EnterpriseIdentity, deviceId: string, ipAddress: string, context: { academicYearId: string, branchId: string }): Session {
    const session: Session = {
      id: `sess_${Date.now()}`,
      identityId: identity.id,
      deviceId,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1hr
      lastActivity: new Date().toISOString(),
      ipAddress,
      context
    };
    
    this.sessions.set(session.id, session);
    console.log('[IdentityEngine] Session created:', session.id);
    return session;
  }

  static checkSessionTimeout(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return true;
    
    const idleTimeout = 30 * 60 * 1000; // 30 mins
    const lastActivity = new Date(session.lastActivity).getTime();
    if (Date.now() - lastActivity > idleTimeout) {
      this.revokeSession(sessionId);
      return true; // timed out
    }
    return false;
  }

  static rotateSession(sessionId: string, newDeviceId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    this.revokeSession(sessionId);
    return this.createSession(
      { id: session.identityId } as EnterpriseIdentity, // Placeholder
      newDeviceId,
      session.ipAddress,
      session.context
    );
  }

  static revokeSession(sessionId: string) {
    this.sessions.delete(sessionId);
    console.log('[IdentityEngine] Session revoked:', sessionId);
  }

  static getActiveSessions(): Session[] {
    return Array.from(this.sessions.values());
  }
}
