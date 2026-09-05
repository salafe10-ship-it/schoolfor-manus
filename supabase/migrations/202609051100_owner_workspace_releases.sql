-- Owner workspace, versioned templates, and school-targeted releases.
-- This is a platform control-plane schema. It never stores student or
-- operational school records and is intentionally closed to browser roles.

BEGIN;

CREATE TABLE IF NOT EXISTS public.platform_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    template_key text NOT NULL,
    name text NOT NULL,
    description text,
    version integer NOT NULL DEFAULT 1,
    status text NOT NULL DEFAULT 'draft',
    manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by_auth_user_id uuid,
    updated_by_auth_user_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_platform_templates PRIMARY KEY (id),
    CONSTRAINT uq_platform_templates_key UNIQUE (template_key),
    CONSTRAINT ck_platform_templates_key CHECK (template_key ~ '^[a-z0-9](?:[a-z0-9._-]{0,126}[a-z0-9])?$'),
    CONSTRAINT ck_platform_templates_name CHECK (length(btrim(name)) BETWEEN 2 AND 160),
    CONSTRAINT ck_platform_templates_version CHECK (version >= 1),
    CONSTRAINT ck_platform_templates_status CHECK (status IN ('draft', 'published', 'archived')),
    CONSTRAINT ck_platform_templates_manifest_object CHECK (jsonb_typeof(manifest) = 'object')
);

CREATE TABLE IF NOT EXISTS public.platform_school_releases (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL,
    template_id uuid,
    release_version integer NOT NULL,
    release_kind text NOT NULL DEFAULT 'features',
    scope text NOT NULL DEFAULT 'school',
    channel text NOT NULL DEFAULT 'stable',
    status text NOT NULL DEFAULT 'active',
    title text NOT NULL,
    notes text,
    feature_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by_auth_user_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    activated_at timestamptz NOT NULL DEFAULT now(),
    rolled_back_at timestamptz,
    CONSTRAINT pk_platform_school_releases PRIMARY KEY (id),
    CONSTRAINT fk_platform_school_releases_school FOREIGN KEY (school_id)
        REFERENCES public.schools (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_platform_school_releases_template FOREIGN KEY (template_id)
        REFERENCES public.platform_templates (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_platform_school_releases_version UNIQUE (school_id, release_version),
    CONSTRAINT ck_platform_school_releases_version CHECK (release_version >= 1),
    CONSTRAINT ck_platform_school_releases_kind CHECK (release_kind IN ('features', 'template', 'combined')),
    CONSTRAINT ck_platform_school_releases_scope CHECK (scope IN ('school', 'selected', 'global')),
    CONSTRAINT ck_platform_school_releases_channel CHECK (channel IN ('stable', 'pilot')),
    CONSTRAINT ck_platform_school_releases_status CHECK (status IN ('active', 'rolled_back')),
    CONSTRAINT ck_platform_school_releases_title CHECK (length(btrim(title)) BETWEEN 2 AND 200),
    CONSTRAINT ck_platform_school_releases_feature_object CHECK (jsonb_typeof(feature_overrides) = 'object'),
    CONSTRAINT ck_platform_school_releases_payload_object CHECK (jsonb_typeof(payload) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_platform_school_releases_school_created
    ON public.platform_school_releases (school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_school_releases_template
    ON public.platform_school_releases (template_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_school_releases_channel_status
    ON public.platform_school_releases (channel, status, created_at DESC);

-- The application server uses the dedicated platform connection/service role.
-- Browser roles must never read or mutate release manifests directly.
ALTER TABLE public.platform_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_school_releases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.platform_templates FROM anon, authenticated;
REVOKE ALL ON TABLE public.platform_school_releases FROM anon, authenticated;

COMMENT ON TABLE public.platform_templates IS
  'Versioned owner-controlled configuration templates; no tenant operational data.';
COMMENT ON TABLE public.platform_school_releases IS
  'Audited per-school rollout records for template and feature releases.';

NOTIFY pgrst, 'reload schema';
COMMIT;
