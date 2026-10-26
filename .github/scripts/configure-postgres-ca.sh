#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${PLATFORM_ADMIN_DATABASE_CA:-}" ]]; then
  echo 'Missing environment secret PLATFORM_ADMIN_DATABASE_CA; refusing PostgreSQL TLS verification without the trusted Supabase CA.' >&2
  exit 1
fi

ca_file="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/platform-admin-database-ca.crt"
umask 077
printf '%s\n' "$PLATFORM_ADMIN_DATABASE_CA" > "$ca_file"
openssl x509 -in "$ca_file" -noout >/dev/null
echo "NODE_EXTRA_CA_CERTS=$ca_file" >> "$GITHUB_ENV"
echo 'Trusted database CA configured for subsequent Node.js steps.'
