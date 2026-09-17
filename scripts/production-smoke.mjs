import process from 'node:process';

const baseUrl = String(process.env.PRODUCTION_URL || '').trim().replace(/\/$/, '');
const expectedCommit = String(process.env.EXPECTED_BUILD_COMMIT || '').trim();

if (!baseUrl) {
  console.error('PRODUCTION_URL is required (credentials are not used).');
  process.exitCode = 1;
} else {
  const failures = [];
  const sleep = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));
  const healthUrl = `${baseUrl}/api/health`;
  let healthResponse = null;
  let health = null;
  // Cloudflare may serve the previous Worker version from an edge for a short
  // period immediately after deploy. Retry the authoritative identity check
  // so propagation is not reported as a failed release.
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    try {
      const cacheBust = `?deployment_check=${Date.now()}-${attempt}`;
      const response = await fetch(`${healthUrl}${cacheBust}`, {
        headers: { accept: 'application/json', 'cache-control': 'no-cache' },
      });
      const payload = await response.json().catch(() => null);
      healthResponse = response;
      health = payload;
      const candidateCommit = payload?.data?.build?.commit;
      const identityMatches = expectedCommit
        ? candidateCommit === expectedCommit
        : candidateCommit && candidateCommit !== 'unknown';
      if (response.ok && identityMatches) break;
    } catch {
      healthResponse = null;
      health = null;
    }
    if (attempt < 12) await sleep(2000);
  }
  if (!healthResponse) failures.push('HEALTH_REQUEST_FAILED');
  else if (!health) failures.push('HEALTH_NOT_JSON');
  const healthStatus = healthResponse?.status || 0;
  if (healthResponse && !healthResponse.ok) failures.push(`HEALTH_HTTP_${healthStatus}`);
  const build = health?.data?.build;
  if (!build || typeof build.commit !== 'string' || typeof build.version !== 'string' || typeof build.builtAt !== 'string') {
    failures.push('BUILD_IDENTITY_MISSING');
  } else {
    if (build.version === 'unknown') failures.push('BUILD_VERSION_UNKNOWN');
    if (build.commit === 'unknown' || !/^[0-9a-f]{40}$/i.test(build.commit)) failures.push('BUILD_COMMIT_INVALID');
    if (build.builtAt === 'unknown' || Number.isNaN(Date.parse(build.builtAt))) failures.push('BUILD_TIMESTAMP_INVALID');
  }
  if (expectedCommit && build?.commit !== expectedCommit) failures.push('BUILD_COMMIT_MISMATCH');

  const indexResponse = await fetch(baseUrl, { headers: { accept: 'text/html' } });
  const index = await indexResponse.text();
  if (!indexResponse.ok) failures.push(`INDEX_HTTP_${indexResponse.status}`);
  if (!/<html[\s>]/i.test(index)) failures.push('INDEX_NOT_HTML');
  const assetReference = index.match(/<script[^>]+src="(\/assets\/[^"?]+\.js)"/i)?.[1]
    || index.match(/<link[^>]+href="(\/assets\/[^"?]+\.css)"/i)?.[1];
  if (!assetReference) failures.push('INDEX_ASSET_REFERENCE_MISSING');
  if (assetReference) {
    const assetResponse = await fetch(`${baseUrl}${assetReference}`, { method: 'HEAD' });
    if (!assetResponse.ok) failures.push(`ASSET_HTTP_${assetResponse.status}:${assetReference}`);
  }

  const result = {
    success: failures.length === 0,
    baseUrl,
    health: healthStatus,
    build: build || null,
    index: indexResponse.status,
    assetReference: assetReference || null,
    failures,
  };
  console.log(JSON.stringify(result, null, 2));
  if (failures.length) process.exitCode = 1;
}
