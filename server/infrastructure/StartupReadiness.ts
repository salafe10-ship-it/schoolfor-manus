export type StartupReadinessState = 'INITIALIZING' | 'READY' | 'DEGRADED' | 'FAILED';

export interface StartupReadinessSnapshot {
  state: StartupReadinessState;
  database: 'PENDING' | 'CONNECTED' | 'UNAVAILABLE' | 'FAILED';
  dataPlane: 'PENDING' | 'RESTRICTED' | 'NOT_REQUIRED' | 'UNSAFE' | 'UNAVAILABLE';
  databaseRole: string | null;
  expectedDatabaseRoles: string[];
  ready: boolean;
  startedAt: string;
  completedAt: string | null;
  reason: string | null;
}

export function createStartupReadiness() {
  const startedAt = new Date().toISOString();
  let notifyCompleted!: () => void;
  const completed = new Promise<void>((resolve) => { notifyCompleted = resolve; });
  let snapshot: StartupReadinessSnapshot = {
    state: 'INITIALIZING',
    database: 'PENDING',
    dataPlane: 'PENDING',
    databaseRole: null,
    expectedDatabaseRoles: [],
    ready: false,
    startedAt,
    completedAt: null,
    reason: null,
  };

  const complete = (
    next: StartupReadinessSnapshot['state'],
    database: StartupReadinessSnapshot['database'],
    dataPlane: StartupReadinessSnapshot['dataPlane'],
    reason: string | null,
    databaseRole: string | null = null,
    expectedDatabaseRoles: string[] = [],
  ) => {
    snapshot = {
      ...snapshot,
      state: next,
      database,
      dataPlane,
      databaseRole,
      expectedDatabaseRoles: [...expectedDatabaseRoles],
      ready: next === 'READY',
      completedAt: new Date().toISOString(),
      reason,
    };
    notifyCompleted();
  };

  return {
    markDatabaseConnected: (databaseRole?: string, expectedDatabaseRoles: string[] = []) => complete(
      'READY',
      'CONNECTED',
      databaseRole ? 'RESTRICTED' : 'NOT_REQUIRED',
      null,
      databaseRole || null,
      expectedDatabaseRoles,
    ),
    markUnsafeDataPlaneRole: (databaseRole: string | null, expectedDatabaseRoles: string[]) => complete(
      'FAILED',
      'CONNECTED',
      'UNSAFE',
      'Restricted database role verification failed.',
      databaseRole,
      expectedDatabaseRoles,
    ),
    markDatabaseUnavailable: (reason: string) => complete('DEGRADED', 'UNAVAILABLE', 'UNAVAILABLE', reason),
    markFailed: (reason: string) => complete('FAILED', 'FAILED', 'UNAVAILABLE', reason),
    snapshot: (): StartupReadinessSnapshot => ({ ...snapshot }),
    waitUntilSettled: async (timeoutMs = 2000): Promise<StartupReadinessSnapshot> => {
      if (snapshot.state !== 'INITIALIZING') return { ...snapshot };
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          completed,
          new Promise<void>((resolve) => { timeout = setTimeout(resolve, timeoutMs); }),
        ]);
      } finally {
        if (timeout !== undefined) clearTimeout(timeout);
      }
      return { ...snapshot };
    },
  };
}
