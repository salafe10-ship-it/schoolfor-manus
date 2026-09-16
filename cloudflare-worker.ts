/// <reference types="@cloudflare/workers-types/experimental" />

import { httpServerHandler } from "cloudflare:node";
import { env } from "cloudflare:workers";

type CloudflareBindings = {
  ASSETS: Fetcher;
  HYPERDRIVE?: { connectionString: string };
  [key: string]: unknown;
};
type WorkerRequest = Parameters<NonNullable<ExportedHandler["fetch"]>>[0];

const runtimeEnvKeys = [
  "EDUPRO_ENVIRONMENT", "SUPABASE_URL", "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL", "DIRECT_URL",
  "PLATFORM_ADMIN_DATABASE_URL", "DATABASE_ROLE_EXPECTED",
  "PGSSL_REJECT_UNAUTHORIZED", "JWT_SECRET", "PUBLIC_APP_URL",
  "ALLOW_IFRAME_EMBEDDING", "EDUPRO_AI_FORECAST_ENABLED", "GEMINI_API_KEY",
  "OPENAI_API_KEY",
] as const;

function configureProcessEnvironment(bindings: CloudflareBindings): void {
  const processEnvironment = process.env as Record<string, string | undefined>;
  for (const key of runtimeEnvKeys) {
    const value = bindings[key];
    if (typeof value === "string" && value.length > 0) processEnvironment[key] = value;
  }
  if (bindings.HYPERDRIVE?.connectionString) {
    processEnvironment.DATABASE_URL = bindings.HYPERDRIVE.connectionString;
  }
}

let apiHandlerPromise: Promise<ExportedHandler> | undefined;

async function getApiHandler(bindings: CloudflareBindings): Promise<ExportedHandler> {
  if (!apiHandlerPromise) {
    apiHandlerPromise = (async () => {
      configureProcessEnvironment(bindings);
      (globalThis as { __EDUPRO_CLOUDFLARE__?: boolean }).__EDUPRO_CLOUDFLARE__ = true;
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
