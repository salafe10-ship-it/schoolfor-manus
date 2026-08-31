-- Keep central school routing identifiers unique among live records.
-- DNS/SSL provisioning remains an external concern, but duplicate names must
-- be rejected transactionally before a provider is attached.

CREATE UNIQUE INDEX IF NOT EXISTS uq_schools_live_central_subdomain
    ON public.schools (lower(NULLIF(btrim(central_metadata->>'subdomain'), '')))
    WHERE deleted_at IS NULL
      AND NULLIF(btrim(central_metadata->>'subdomain'), '') IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_schools_live_central_domain
    ON public.schools (lower(COALESCE(NULLIF(btrim(central_metadata->>'domain'), ''), NULLIF(btrim(central_metadata->>'customDomain'), ''))))
    WHERE deleted_at IS NULL
      AND COALESCE(NULLIF(btrim(central_metadata->>'domain'), ''), NULLIF(btrim(central_metadata->>'customDomain'), '')) IS NOT NULL;
