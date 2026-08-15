import { describe, expect, it } from "vitest";
import {
  getDiagnosticSampleCount,
  isStagingConnectionDiagnosticsEnabled,
  readConnectionIdentity,
} from "../../server/infrastructure/StagingConnectionDiagnostics";

describe("CONN-SEC-002 Staging connection identity diagnostics", () => {
  it("enables diagnostics only with explicit Staging flags", () => {
    expect(isStagingConnectionDiagnosticsEnabled({ EDUPRO_ENVIRONMENT: "staging", CONN_DIAGNOSTIC_ENABLED: "true" })).toBe(true);
    expect(isStagingConnectionDiagnosticsEnabled({ EDUPRO_ENVIRONMENT: "production", CONN_DIAGNOSTIC_ENABLED: "true" })).toBe(false);
    expect(isStagingConnectionDiagnosticsEnabled({ EDUPRO_ENVIRONMENT: "staging", CONN_DIAGNOSTIC_ENABLED: "false" })).toBe(false);
  });

  it("bounds the diagnostic pool sample count", () => {
    expect(getDiagnosticSampleCount({ CONN_DIAGNOSTIC_SAMPLE_COUNT: "0" })).toBe(1);
    expect(getDiagnosticSampleCount({ CONN_DIAGNOSTIC_SAMPLE_COUNT: "3.9" })).toBe(3);
    expect(getDiagnosticSampleCount({ CONN_DIAGNOSTIC_SAMPLE_COUNT: "99" })).toBe(5);
    expect(getDiagnosticSampleCount({ CONN_DIAGNOSTIC_SAMPLE_COUNT: "invalid" })).toBe(3);
  });

  it("returns only the approved identity fields", async () => {
    const identity = await readConnectionIdentity({
      query: async () => ({
        rows: [{
          current_user: "edupro_staging_app",
          session_user: "edupro_staging_app",
          rolsuper: false,
          rolbypassrls: false,
          password: "must-not-be-returned"
        }]
      })
    });

    expect(identity).toEqual({
      current_user: "edupro_staging_app",
      session_user: "edupro_staging_app",
      rolsuper: false,
      rolbypassrls: false
    });
    expect(identity).not.toHaveProperty("password");
  });
});
