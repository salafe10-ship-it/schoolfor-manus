-- Enterprise Core Platform Schema – Foundation
-- Mission: EIF-02B-P1
-- This migration intentionally excludes RLS, RPC, triggers, seed data, views,
-- materialized views, and business-module tables.

CREATE TABLE tenants (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    legal_name text NOT NULL,
    slug text NOT NULL,
    plan_code text NOT NULL DEFAULT 'standard',
    status text NOT NULL DEFAULT 'provisioning',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_tenants PRIMARY KEY (id),
    CONSTRAINT uq_tenants_slug UNIQUE (slug),
    CONSTRAINT ck_tenants_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT ck_tenants_status CHECK (status IN ('provisioning', 'active', 'suspended', 'archived')),
    CONSTRAINT ck_tenants_version CHECK (version >= 1),
    CONSTRAINT ck_tenants_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE subscriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    plan_code text NOT NULL,
    starts_at timestamptz NOT NULL DEFAULT now(),
    ends_at timestamptz,
    seat_limit integer NOT NULL,
    auto_renew boolean NOT NULL DEFAULT true,
    status text NOT NULL DEFAULT 'trial',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_subscriptions PRIMARY KEY (id),
    CONSTRAINT fk_subscriptions_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_subscriptions_tenant_start UNIQUE (tenant_id, starts_at),
    CONSTRAINT ck_subscriptions_plan_code CHECK (length(btrim(plan_code)) > 0),
    CONSTRAINT ck_subscriptions_dates CHECK (ends_at IS NULL OR starts_at < ends_at),
    CONSTRAINT ck_subscriptions_seat_limit CHECK (seat_limit > 0),
    CONSTRAINT ck_subscriptions_status CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
    CONSTRAINT ck_subscriptions_version CHECK (version >= 1),
    CONSTRAINT ck_subscriptions_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE schools (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_code text NOT NULL,
    legal_name text NOT NULL,
    display_name text NOT NULL,
    timezone text NOT NULL DEFAULT 'UTC',
    locale text NOT NULL DEFAULT 'en',
    status text NOT NULL DEFAULT 'provisioning',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_schools PRIMARY KEY (id),
    CONSTRAINT fk_schools_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_schools_tenant_code UNIQUE (tenant_id, school_code),
    CONSTRAINT uq_schools_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_schools_code CHECK (length(btrim(school_code)) > 0),
    CONSTRAINT ck_schools_legal_name CHECK (length(btrim(legal_name)) > 0),
    CONSTRAINT ck_schools_display_name CHECK (length(btrim(display_name)) > 0),
    CONSTRAINT ck_schools_status CHECK (status IN ('provisioning', 'active', 'suspended', 'archived')),
    CONSTRAINT ck_schools_version CHECK (version >= 1),
    CONSTRAINT ck_schools_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE branches (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    branch_code text NOT NULL,
    name text NOT NULL,
    address jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'provisioning',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_branches PRIMARY KEY (id),
    CONSTRAINT fk_branches_school_tenant FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_branches_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_branches_tenant_school_id UNIQUE (tenant_id, school_id, id),
    CONSTRAINT uq_branches_school_code UNIQUE (school_id, branch_code),
    CONSTRAINT ck_branches_code CHECK (length(btrim(branch_code)) > 0),
    CONSTRAINT ck_branches_name CHECK (length(btrim(name)) > 0),
    CONSTRAINT ck_branches_status CHECK (status IN ('provisioning', 'active', 'closed', 'archived')),
    CONSTRAINT ck_branches_version CHECK (version >= 1),
    CONSTRAINT ck_branches_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE academic_years (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    branch_id uuid,
    code text NOT NULL,
    name text NOT NULL,
    starts_on date NOT NULL,
    ends_on date NOT NULL,
    is_current boolean NOT NULL DEFAULT false,
    status text NOT NULL DEFAULT 'planned',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_academic_years PRIMARY KEY (id),
    CONSTRAINT fk_academic_years_school_tenant FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_academic_years_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_academic_years_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_academic_years_tenant_school_id UNIQUE (tenant_id, school_id, id),
    CONSTRAINT uq_academic_years_school_code UNIQUE (school_id, code),
    CONSTRAINT ck_academic_years_code CHECK (length(btrim(code)) > 0),
    CONSTRAINT ck_academic_years_name CHECK (length(btrim(name)) > 0),
    CONSTRAINT ck_academic_years_dates CHECK (starts_on < ends_on),
    CONSTRAINT ck_academic_years_status CHECK (status IN ('planned', 'active', 'closed', 'archived')),
    CONSTRAINT ck_academic_years_version CHECK (version >= 1),
    CONSTRAINT ck_academic_years_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE school_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    setting_key text NOT NULL,
    setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
    effective_from timestamptz NOT NULL DEFAULT now(),
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_school_settings PRIMARY KEY (id),
    CONSTRAINT fk_school_settings_school_tenant FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_school_settings_key UNIQUE (school_id, setting_key, effective_from),
    CONSTRAINT ck_school_settings_key CHECK (length(btrim(setting_key)) > 0),
    CONSTRAINT ck_school_settings_status CHECK (status IN ('draft', 'active', 'retired')),
    CONSTRAINT ck_school_settings_version CHECK (version >= 1),
    CONSTRAINT ck_school_settings_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE facilities (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    facility_type text NOT NULL,
    name text NOT NULL,
    capacity integer,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_facilities PRIMARY KEY (id),
    CONSTRAINT fk_facilities_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_facilities_branch_name UNIQUE (branch_id, name),
    CONSTRAINT ck_facilities_type CHECK (length(btrim(facility_type)) > 0),
    CONSTRAINT ck_facilities_name CHECK (length(btrim(name)) > 0),
    CONSTRAINT ck_facilities_capacity CHECK (capacity IS NULL OR capacity >= 0),
    CONSTRAINT ck_facilities_status CHECK (status IN ('active', 'inactive', 'maintenance', 'archived')),
    CONSTRAINT ck_facilities_version CHECK (version >= 1),
    CONSTRAINT ck_facilities_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE terms (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    branch_id uuid,
    academic_year_id uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    sequence integer NOT NULL,
    starts_on date NOT NULL,
    ends_on date NOT NULL,
    status text NOT NULL DEFAULT 'planned',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_terms PRIMARY KEY (id),
    CONSTRAINT fk_terms_academic_year_scope FOREIGN KEY (tenant_id, school_id, academic_year_id)
        REFERENCES academic_years (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_terms_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_terms_tenant_school_year_id UNIQUE (tenant_id, school_id, academic_year_id, id),
    CONSTRAINT uq_terms_academic_year_code UNIQUE (academic_year_id, code),
    CONSTRAINT ck_terms_code CHECK (length(btrim(code)) > 0),
    CONSTRAINT ck_terms_name CHECK (length(btrim(name)) > 0),
    CONSTRAINT ck_terms_sequence CHECK (sequence > 0),
    CONSTRAINT ck_terms_dates CHECK (starts_on < ends_on),
    CONSTRAINT ck_terms_status CHECK (status IN ('planned', 'active', 'closed', 'archived')),
    CONSTRAINT ck_terms_version CHECK (version >= 1),
    CONSTRAINT ck_terms_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE academic_calendar (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    branch_id uuid,
    academic_year_id uuid NOT NULL,
    term_id uuid,
    event_type text NOT NULL,
    event_date date NOT NULL,
    name text NOT NULL,
    description text,
    is_instruction_day boolean NOT NULL DEFAULT true,
    status text NOT NULL DEFAULT 'planned',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_academic_calendar PRIMARY KEY (id),
    CONSTRAINT fk_academic_calendar_academic_year_scope FOREIGN KEY (tenant_id, school_id, academic_year_id)
        REFERENCES academic_years (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_academic_calendar_term_scope FOREIGN KEY (tenant_id, school_id, academic_year_id, term_id)
        REFERENCES terms (tenant_id, school_id, academic_year_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_academic_calendar_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_academic_calendar_event UNIQUE (academic_year_id, event_date, event_type, name),
    CONSTRAINT ck_academic_calendar_event_type CHECK (length(btrim(event_type)) > 0),
    CONSTRAINT ck_academic_calendar_name CHECK (length(btrim(name)) > 0),
    CONSTRAINT ck_academic_calendar_status CHECK (status IN ('planned', 'active', 'cancelled', 'archived')),
    CONSTRAINT ck_academic_calendar_version CHECK (version >= 1),
    CONSTRAINT ck_academic_calendar_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE INDEX idx_tenants_status ON tenants (status);
CREATE INDEX idx_tenants_created_at ON tenants (created_at);

CREATE INDEX idx_subscriptions_tenant_status ON subscriptions (tenant_id, status);
CREATE INDEX idx_subscriptions_tenant_ends_at ON subscriptions (tenant_id, ends_at);

CREATE INDEX idx_schools_tenant_status ON schools (tenant_id, status);
CREATE INDEX idx_schools_tenant_created_at ON schools (tenant_id, created_at);
CREATE INDEX idx_schools_tenant_display_name ON schools (tenant_id, display_name);

CREATE INDEX idx_branches_school_status ON branches (school_id, status);
CREATE INDEX idx_branches_school_created_at ON branches (school_id, created_at);
CREATE INDEX idx_branches_school_name ON branches (school_id, name);

CREATE INDEX idx_school_settings_school_effective ON school_settings (school_id, effective_from);

CREATE INDEX idx_facilities_branch_status ON facilities (branch_id, status);
CREATE INDEX idx_facilities_branch_type ON facilities (branch_id, facility_type);

CREATE INDEX idx_academic_years_school_status ON academic_years (school_id, status);
CREATE INDEX idx_academic_years_school_dates ON academic_years (school_id, starts_on, ends_on);

CREATE INDEX idx_terms_academic_year_status ON terms (academic_year_id, status);
CREATE INDEX idx_terms_school_dates ON terms (school_id, starts_on, ends_on);

CREATE INDEX idx_academic_calendar_school_date ON academic_calendar (school_id, event_date);
CREATE INDEX idx_academic_calendar_branch_date ON academic_calendar (branch_id, event_date);
