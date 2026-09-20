/// <reference types="@cloudflare/workers-types/experimental" />

import { httpServerHandler } from "cloudflare:node";
import { env } from "cloudflare:workers";
import { AsyncLocalStorage } from "node:async_hooks";

type CloudflareBindings = {
  ASSETS: Fetcher;
  HYPERDRIVE?: { connectionString: string };
  HYPERDRIVE_ADMIN?: { connectionString: string };
  [key: string]: unknown;
};
type WorkerRequest = Parameters<NonNullable<ExportedHandler["fetch"]>>[0];

declare const __EDUPRO_BUILD_VERSION__: unknown;
declare const __EDUPRO_BUILD_COMMIT__: unknown;
declare const __EDUPRO_BUILD_TIMESTAMP__: unknown;

const compiledBuildIdentity = {
  APP_VERSION: typeof __EDUPRO_BUILD_VERSION__ === "string" ? __EDUPRO_BUILD_VERSION__ : "",
  BUILD_COMMIT_SHA: typeof __EDUPRO_BUILD_COMMIT__ === "string" ? __EDUPRO_BUILD_COMMIT__ : "",
  BUILD_TIMESTAMP: typeof __EDUPRO_BUILD_TIMESTAMP__ === "string" ? __EDUPRO_BUILD_TIMESTAMP__ : "",
} as const;

const buildIdentityGlobals = globalThis as typeof globalThis & {
  __EDUPRO_BUILD_IDENTITY__?: { version: string; commit: string; builtAt: string };
};
buildIdentityGlobals.__EDUPRO_BUILD_IDENTITY__ = {
  version: compiledBuildIdentity.APP_VERSION,
  commit: compiledBuildIdentity.BUILD_COMMIT_SHA,
  builtAt: compiledBuildIdentity.BUILD_TIMESTAMP,
};

const runtimeEnvKeys = [
  "EDUPRO_ENVIRONMENT", "SUPABASE_URL", "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL", "DIRECT_URL",
  "PLATFORM_ADMIN_DATABASE_URL", "DATABASE_ROLE_EXPECTED",
  "PGSSL_REJECT_UNAUTHORIZED", "JWT_SECRET", "PUBLIC_APP_URL",
  "ALLOW_IFRAME_EMBEDDING", "EDUPRO_AI_FORECAST_ENABLED", "GEMINI_API_KEY",
  "OPENAI_API_KEY",
  // Financial write-phase controls must reach process.env before server.ts
  // initializes; otherwise the reviewed fail-closed gate stays locked even
  // when the controls are configured in the Cloudflare production Worker.
  "FINANCIAL_ERP_MODE", "FINANCIAL_WRITES_LOCKED",
  "APP_VERSION", "BUILD_COMMIT_SHA", "BUILD_TIMESTAMP",
] as const;

function configureProcessEnvironment(bindings: CloudflareBindings): void {
  const processEnvironment = process.env as Record<string, string | undefined>;
  if (bindings.HYPERDRIVE?.connectionString || bindings.HYPERDRIVE_ADMIN?.connectionString) {
    processEnvironment.EDUPRO_CLOUDFLARE_HYPERDRIVE = 'true';
  }
  for (const key of runtimeEnvKeys) {
    const bindingValue = bindings[key];
    const compiledValue = compiledBuildIdentity[key as keyof typeof compiledBuildIdentity];
    const value = typeof bindingValue === "string" && bindingValue.length > 0
      ? bindingValue
      : compiledValue;
    if (typeof value === "string" && value.length > 0) processEnvironment[key] = value;
  }
  if (bindings.HYPERDRIVE?.connectionString) {
    const configuredDatabaseUrl = typeof bindings.DATABASE_URL === 'string'
      ? bindings.DATABASE_URL
      : processEnvironment.DATABASE_URL;
    if (configuredDatabaseUrl) processEnvironment.EDUPRO_CONFIGURED_DATABASE_URL = configuredDatabaseUrl;
    processEnvironment.DATABASE_URL = bindings.HYPERDRIVE.connectionString;
  }
  if (bindings.HYPERDRIVE_ADMIN?.connectionString) {
    const configuredAdminDatabaseUrl = typeof bindings.PLATFORM_ADMIN_DATABASE_URL === 'string'
      ? bindings.PLATFORM_ADMIN_DATABASE_URL
      : processEnvironment.PLATFORM_ADMIN_DATABASE_URL;
    if (configuredAdminDatabaseUrl) processEnvironment.EDUPRO_CONFIGURED_ADMIN_DATABASE_URL = configuredAdminDatabaseUrl;
    processEnvironment.PLATFORM_ADMIN_DATABASE_URL = bindings.HYPERDRIVE_ADMIN.connectionString;
  }
}

let apiHandlerPromise: Promise<ExportedHandler> | undefined;

async function getApiHandler(bindings: CloudflareBindings): Promise<ExportedHandler> {
  if (!apiHandlerPromise) {
    apiHandlerPromise = (async () => {
      configureProcessEnvironment(bindings);
      (globalThis as { __EDUPRO_CLOUDFLARE__?: boolean; __EDUPRO_ASYNC_LOCAL_STORAGE__?: typeof AsyncLocalStorage }).__EDUPRO_CLOUDFLARE__ = true;
      (globalThis as { __EDUPRO_ASYNC_LOCAL_STORAGE__?: typeof AsyncLocalStorage }).__EDUPRO_ASYNC_LOCAL_STORAGE__ = AsyncLocalStorage;
      const { createApp } = await import("./server.ts");
      const app = await createApp({ cloudflare: true });
      if (!app) throw new Error("Cloudflare application initialization returned no Express app.");
      app.listen(3000);
      return httpServerHandler({ port: 3000 });
    })();
  }
  return apiHandlerPromise;
}

export default {
  async fetch(request: WorkerRequest, rawBindings: CloudflareBindings, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      const apiHandler = await getApiHandler(rawBindings);
      if (!apiHandler.fetch) throw new Error("Cloudflare Node HTTP handler is unavailable.");
      return apiHandler.fetch(request, rawBindings, ctx);
    }
    return rawBindings.ASSETS.fetch(request);
  },
};
