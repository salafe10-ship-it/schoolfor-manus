export type StartupReadinessState = 'INITIALIZING' | 'READY' | 'DEGRADED' | 'FAILED';

export interface StartupReadinessSnapshot {
  state: StartupReadinessState;
  database: 'PENDING' | 'CONNECTED' | 'UNAVAILABLE' | 'FAILED';
  ready: boolean;
  startedAt: string;
  completedAt: string | null;
  reason: string | null;
}

export function createStartupReadiness() {
  const startedAt = new Date().toISOString();
  let snapshot: StartupReadinessSnapshot = {
    state: 'INITIALIZING',
    database: 'PENDING',
    ready: false,
    startedAt,
    completedAt: null,
    reason: null,
  };

  const complete = (next: StartupReadinessSnapshot['state'], database: StartupReadinessSnapshot['database'], reason: string | null) => {
    snapshot = {
      ...snapshot,
      state: next,
      database,
      ready: next === 'READY',
      completedAt: new Date().toISOString(),
      reason,
    };
  };

  return {
    markDatabaseConnected: () => complete('READY', 'CONNECTED', null),
    markDatabaseUnavailable: (reason: string) => complete('DEGRADED', 'UNAVAILABLE', reason),
    markFailed: (reason: string) => complete('FAILED', 'FAILED', reason),
    snapshot: (): StartupReadinessSnapshot => ({ ...snapshot }),
  };
}
