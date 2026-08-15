import { EnterpriseLogger } from '../database/services/EnterpriseLogger';

/**
 * IdempotencyGuard
 * A professional enterprise-grade Request Lock & Idempotency manager.
 * Prevents double-submissions, network-delay duplicate records, and race conditions.
 */
export class IdempotencyGuard {
  private static activeLocks = new Set<string>();
  private static onStateChangeListeners: (() => void)[] = [];

  public static subscribe(listener: () => void) {
    this.onStateChangeListeners.push(listener);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter(l => l !== listener);
    };
  }

  private static notify() {
    this.onStateChangeListeners.forEach(listener => {
      try {
        listener();
      } catch (e) {
        console.error('Error in IdempotencyGuard listener:', e);
      }
    });
  }

  /**
   * Attempts to acquire a non-blocking lock for a key.
   * If the key is already locked, returns false.
   */
  public static acquire(key: string): boolean {
    if (this.activeLocks.has(key)) {
      EnterpriseLogger.warn(
        `[Idempotency Block] Prevented duplicate execution for key [${key}]. Request is already in progress.`,
        'IdempotencyGuard'
      );
      return false;
    }
    this.activeLocks.add(key);
    EnterpriseLogger.info(
      `[Idempotency Lock] Successfully acquired lock for key [${key}].`,
      'IdempotencyGuard'
    );
    this.notify();
    return true;
  }

  /**
   * Releases a previously acquired lock for a key.
   */
  public static release(key: string): void {
    if (this.activeLocks.has(key)) {
      this.activeLocks.delete(key);
      EnterpriseLogger.info(
        `[Idempotency Lock] Successfully released lock for key [${key}].`,
        'IdempotencyGuard'
      );
      this.notify();
    }
  }

  /**
   * Checks if a key is currently locked.
   */
  public static isLocked(key: string): boolean {
    return this.activeLocks.has(key);
  }

  /**
   * Returns a list of all currently active request locks in the system.
   */
  public static getActiveLocks(): string[] {
    return Array.from(this.activeLocks);
  }

  /**
   * Execute a block of code wrapped in an automatic request lock.
   * If the lock cannot be acquired, throws a customized error message indicating the operation is still running.
   */
  public static async executeWithLock<T>(
    key: string,
    operationDescriptionAr: string,
    block: () => Promise<T> | T
  ): Promise<T> {
    if (!this.acquire(key)) {
      throw new Error(`العملية قيد التنفيذ حالياً... يرجى الانتظار وعدم النقر مجدداً لمنع تكرار السجلات (${operationDescriptionAr})`);
    }
    try {
      // Simulate slight network delay/processing window to showcase idempotency in action
      await new Promise(resolve => setTimeout(resolve, 1500));
      return await block();
    } finally {
      this.release(key);
    }
  }
}
