import process from 'node:process';

const baseUrl = String(process.env.PRODUCTION_URL || '').trim().replace(/\/$/, '');
const expectedCommit = String(process.env.EXPECTED_BUILD_COMMIT || '').trim();

if (!baseUrl) {
  console.error('PRODUCTION_URL is required (credentials are not used).');
  process.exitCode = 1;
} else {
  const failures = [];
  const healthResponse = await fetch(`${baseUrl}/api/health`, { headers: { accept: 'application/json' } });
  let health = null;
  try { health = await healthResponse.json(); } catch { failures.push('HEALTH_NOT_JSON'); }
  if (!healthResponse.ok) failures.push(`HEALTH_HTTP_${healthResponse.status}`);
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
    health: healthResponse.status,
    build: build || null,
    index: indexResponse.status,
    assetReference: assetReference || null,
    failures,
  };
  console.log(JSON.stringify(result, null, 2));
  if (failures.length) process.exitCode = 1;
}
