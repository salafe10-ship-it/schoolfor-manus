import process from 'node:process';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const environment = String(process.env.EDUPRO_ENVIRONMENT || '').trim().toLowerCase();
const isProductionLike = environment === 'staging' || environment === 'production';
const failures = [];
const warnings = [];

const placeholder = /^(?:your[-_]|replace[-_]|<|https?:\/\/your-|example\.|change[-_]|todo)/i;
const value = (key) => String(process.env[key] || '').trim();
const requireSecret = (key) => {
  const candidate = value(key);
  if (!candidate || placeholder.test(candidate)) failures.push(`${key}_MISSING_OR_PLACEHOLDER`);
  return candidate;
};

if (!isProductionLike) failures.push('EDUPRO_ENVIRONMENT_MUST_BE_STAGING_OR_PRODUCTION');

for (const key of ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'DATABASE_URL', 'JWT_SECRET']) {
  requireSecret(key);
}

if (isProductionLike) requireSecret('PLATFORM_ADMIN_DATABASE_URL');

const expectedRole = value('DATABASE_ROLE_EXPECTED');
if (!expectedRole || !/^edupro_(?:app|staging_app)$/.test(expectedRole)) {
  failures.push('DATABASE_ROLE_EXPECTED_INVALID');
} else if ((environment === 'staging' && expectedRole !== 'edupro_staging_app')
  || (environment === 'production' && expectedRole !== 'edupro_app')) {
  failures.push('DATABASE_ROLE_EXPECTED_DOES_NOT_MATCH_ENVIRONMENT');
}

const readDatabaseUrl = (key) => {
  const candidate = value(key);
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
      failures.push(`${key}_PROTOCOL_INVALID`);
      return null;
    }
    if (!parsed.username) failures.push(`${key}_USERNAME_REQUIRED`);
    return parsed;
  } catch {
    failures.push(`${key}_URL_INVALID`);
    return null;
  }
};

const tenantDatabaseUrl = readDatabaseUrl('DATABASE_URL');
if (tenantDatabaseUrl && expectedRole) {
  const databaseUser = decodeURIComponent(tenantDatabaseUrl.username);
  const roleMatches = databaseUser === expectedRole || databaseUser.startsWith(`${expectedRole}.`);
  if (!roleMatches) failures.push('DATABASE_URL_ROLE_DOES_NOT_MATCH_EXPECTED_ROLE');
}

const platformDatabaseUrl = readDatabaseUrl('PLATFORM_ADMIN_DATABASE_URL');
if (platformDatabaseUrl && tenantDatabaseUrl) {
  if (platformDatabaseUrl.toString() === tenantDatabaseUrl.toString()) {
    failures.push('PLATFORM_ADMIN_DATABASE_URL_MUST_BE_SEPARATE');
  }
  const platformUser = decodeURIComponent(platformDatabaseUrl.username);
  if (expectedRole && (platformUser === expectedRole || platformUser.startsWith(`${expectedRole}.`))) {
    failures.push('PLATFORM_ADMIN_DATABASE_URL_MUST_NOT_USE_TENANT_ROLE');
  }
}

if (value('PGSSL_REJECT_UNAUTHORIZED').toLowerCase() !== 'true') {
  failures.push('PGSSL_REJECT_UNAUTHORIZED_MUST_BE_TRUE');
}

if (value('ALLOW_IFRAME_EMBEDDING').toLowerCase() === 'true' && environment === 'production') {
  failures.push('ALLOW_IFRAME_EMBEDDING_MUST_BE_FALSE_IN_PRODUCTION');
}

if (value('EDUPRO_AI_FORECAST_ENABLED').toLowerCase() === 'true') {
  failures.push('AI_FORECAST_MUST_REMAIN_DISABLED_UNTIL_PRIVACY_APPROVAL');
}

for (const key of ['SUPABASE_URL', 'PUBLIC_APP_URL']) {
  const candidate = value(key);
  if (!candidate) {
    if (key === 'PUBLIC_APP_URL' && isProductionLike) failures.push('PUBLIC_APP_URL_REQUIRED');
    continue;
  }
  try {
    const parsed = new URL(candidate);
    if (!['https:', 'http:'].includes(parsed.protocol)) failures.push(`${key}_PROTOCOL_INVALID`);
    if (isProductionLike && key === 'PUBLIC_APP_URL' && parsed.protocol !== 'https:') failures.push('PUBLIC_APP_URL_MUST_USE_HTTPS');
  } catch {
    failures.push(`${key}_URL_INVALID`);
  }
}

if (!value('GEMINI_API_KEY') && !value('OPENAI_API_KEY')) {
  warnings.push('AI_PROVIDER_NOT_CONFIGURED_ASSISTANT_FEATURES_MUST_STAY_DISABLED');
}

const result = {
  success: failures.length === 0,
  environment: environment || null,
  expectedRole: expectedRole || null,
  checks: {
    requiredSecretsPresent: !failures.some(code => code.includes('MISSING_OR_PLACEHOLDER')),
    sslCertificateVerification: value('PGSSL_REJECT_UNAUTHORIZED').toLowerCase() === 'true',
    iframeEmbedding: value('ALLOW_IFRAME_EMBEDDING').toLowerCase() === 'true' ? 'enabled' : 'disabled',
    aiForecast: value('EDUPRO_AI_FORECAST_ENABLED').toLowerCase() === 'true' ? 'enabled' : 'disabled',
  },
  failures,
  warnings,
};

console.log(JSON.stringify(result, null, 2));
if (!result.success) process.exitCode = 1;
