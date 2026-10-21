import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function runProductionSmoke(baseUrl, expectedCommit = '', options = {}) {
  baseUrl = baseUrl.trim().replace(/\/$/, '');
  const { attempts = 4, timeoutMs = 15000, retryDelayMs = 2000 } = options;
  const failures = [];
  const networkErrors = [];
  const request = (url, init = {}) => fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  const recordNetworkError = (operation, error) => {
    networkErrors.push({ operation, code: String(error?.cause?.code || error?.name || 'REQUEST_FAILED') });
  };
  let healthStatus = 0;
  let build = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await request(`${baseUrl}/api/health?deployment_check=${Date.now()}-${attempt}`, {
        headers: { accept: 'application/json', 'cache-control': 'no-cache' },
      });
      healthStatus = response.status;
      const health = await response.json();
      build = health?.data?.build || null;
      if (response.ok && build?.commit && (!expectedCommit || build.commit === expectedCommit)) break;
    } catch (error) {
      recordNetworkError('health', error);
    }
    if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, retryDelayMs));
  }
  if (!healthStatus) failures.push('HEALTH_REQUEST_FAILED');
  else if (healthStatus !== 200) failures.push(`HEALTH_HTTP_${healthStatus}`);
  if (!build || typeof build.commit !== 'string' || typeof build.version !== 'string' || typeof build.builtAt !== 'string') {
    failures.push('BUILD_IDENTITY_MISSING');
  } else {
    if (!build.version || build.version === 'unknown') failures.push('BUILD_VERSION_UNKNOWN');
    if (!/^[0-9a-f]{40}$/i.test(build.commit)) failures.push('BUILD_COMMIT_INVALID');
    if (Number.isNaN(Date.parse(build.builtAt))) failures.push('BUILD_TIMESTAMP_INVALID');
  }
  if (expectedCommit && build?.commit !== expectedCommit) failures.push('BUILD_COMMIT_MISMATCH');

  let readyStatus = 0;
  try {
    const response = await request(`${baseUrl}/api/ready`, { headers: { 'cache-control': 'no-cache' } });
    readyStatus = response.status;
    const readiness = await response.json();
    if (!response.ok) failures.push(`READY_HTTP_${readyStatus}`);
    else if (readiness?.data?.ready !== true) failures.push('READY_STATE_FALSE');
    if (expectedCommit && readiness?.data?.build?.commit !== expectedCommit) failures.push('READY_BUILD_COMMIT_MISMATCH');
  } catch (error) {
    failures.push('READY_REQUEST_FAILED');
    recordNetworkError('ready', error);
  }

  let indexStatus = 0;
  let assetReference = null;
  let pageOperation = 'index';
  try {
    const response = await request(baseUrl, { headers: { accept: 'text/html', 'cache-control': 'no-cache' } });
    indexStatus = response.status;
    const index = await response.text();
    if (!response.ok) failures.push(`INDEX_HTTP_${indexStatus}`);
    if (!/<html[\s>]/i.test(index)) failures.push('INDEX_NOT_HTML');
    assetReference = index.match(/<script[^>]+src="(\/assets\/[^"?]+\.js)"/i)?.[1]
      || index.match(/<link[^>]+href="(\/assets\/[^"?]+\.css)"/i)?.[1] || null;
    if (!assetReference) failures.push('INDEX_ASSET_REFERENCE_MISSING');
    if (assetReference) {
      pageOperation = 'asset';
      const asset = await request(`${baseUrl}${assetReference}`, { method: 'HEAD' });
      if (!asset.ok) failures.push(`ASSET_HTTP_${asset.status}:${assetReference}`);
    }
  } catch (error) {
    failures.push(pageOperation === 'asset' ? 'ASSET_REQUEST_FAILED' : 'INDEX_REQUEST_FAILED');
    recordNetworkError(pageOperation, error);
  }

  return { success: failures.length === 0, baseUrl, health: healthStatus, ready: readyStatus,
    build, index: indexStatus, assetReference, failures, networkErrors };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const baseUrl = String(process.env.PRODUCTION_URL || '').trim();
  if (!baseUrl) {
    console.error('PRODUCTION_URL is required (credentials are not used).');
    process.exitCode = 1;
  } else {
    const result = await runProductionSmoke(baseUrl, String(process.env.EXPECTED_BUILD_COMMIT || '').trim());
    console.log(JSON.stringify(result, null, 2));
    if (!result.success) process.exitCode = 1;
  }
}
