import fs from 'node:fs';
import path from 'node:path';

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

const readBuildArtifact = (): Partial<BuildIdentity> => {
  const artifactPath = process.env.BUILD_IDENTITY_PATH?.trim() || path.join(process.cwd(), 'dist', 'build-identity.json');
  try {
    const parsed = JSON.parse(fs.readFileSync(artifactPath, 'utf8')) as Partial<BuildIdentity>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export function getBuildIdentity(): BuildIdentity {
  const artifact = readBuildArtifact();
  return {
    version: firstDefined('APP_VERSION') !== 'unknown' ? firstDefined('APP_VERSION') : artifact.version || 'unknown',
    commit: firstDefined('RENDER_GIT_COMMIT', 'RENDER_GIT_COMMIT_SHA', 'GIT_COMMIT_SHA', 'BUILD_COMMIT_SHA') !== 'unknown'
      ? firstDefined('RENDER_GIT_COMMIT', 'RENDER_GIT_COMMIT_SHA', 'GIT_COMMIT_SHA', 'BUILD_COMMIT_SHA')
      : artifact.commit || 'unknown',
    builtAt: firstDefined('BUILD_TIMESTAMP') !== 'unknown' ? firstDefined('BUILD_TIMESTAMP') : artifact.builtAt || 'unknown',
  };
}
