export type BuildIdentity = {
  version: string;
  commit: string;
  builtAt: string;
};

const firstDefined = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return 'unknown';
};

export function getBuildIdentity(): BuildIdentity {
  return {
    version: firstDefined('APP_VERSION'),
    commit: firstDefined('RENDER_GIT_COMMIT', 'RENDER_GIT_COMMIT_SHA', 'GIT_COMMIT_SHA', 'BUILD_COMMIT_SHA'),
    builtAt: firstDefined('RENDER_GIT_COMMIT_TIMESTAMP', 'BUILD_TIMESTAMP'),
  };
}
