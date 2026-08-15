-- Enterprise Governance Platform Schema
-- Mission: EIF-02B-P3
-- This migration intentionally excludes business logic, triggers, RLS, RPC,
-- seed data, views, and materialized views.

-- Append-only audit records intentionally do not expose mutable update/delete
-- columns. Role-level mutation privileges are revoked below; privileged database
-- ownership controls remain a deployment concern.
CREATE TABLE audit_change_sets (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid,
    branch_id uuid,
    actor_user_id uuid,
    actor_service_account_id uuid,
    request_id uuid,
    correlation_id uuid,
    source text NOT NULL,
    reason text,
    result text NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_audit_change_sets PRIMARY KEY (id),
    CONSTRAINT fk_audit_change_sets_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_audit_change_sets_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_audit_change_sets_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_audit_change_sets_actor_user FOREIGN KEY (tenant_id, actor_user_id)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_audit_change_sets_actor_service FOREIGN KEY (tenant_id, actor_service_account_id)
        REFERENCES service_accounts (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_audit_change_sets_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_audit_change_sets_source CHECK (length(btrim(source)) > 0),
    CONSTRAINT ck_audit_change_sets_result CHECK (result IN ('success', 'failure', 'partial', 'denied')),
    CONSTRAINT ck_audit_change_sets_single_actor CHECK (num_nonnulls(actor_user_id, actor_service_account_id) <= 1)
);

CREATE TABLE audit_events (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid,
    branch_id uuid,
    change_set_id uuid,
    actor_user_id uuid,
    actor_service_account_id uuid,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    action text NOT NULL,
    source text NOT NULL,
    reason text,
    result text NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    request_id uuid,
    correlation_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_audit_events PRIMARY KEY (id),
    CONSTRAINT fk_audit_events_change_set_scope FOREIGN KEY (tenant_id, change_set_id)
        REFERENCES audit_change_sets (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_audit_events_actor_user FOREIGN KEY (tenant_id, actor_user_id)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_audit_events_actor_service FOREIGN KEY (tenant_id, actor_service_account_id)
        REFERENCES service_accounts (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_audit_events_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_audit_events_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_audit_events_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_audit_events_entity_type CHECK (length(btrim(entity_type)) > 0),
    CONSTRAINT ck_audit_events_action CHECK (length(btrim(action)) > 0),
    CONSTRAINT ck_audit_events_source CHECK (length(btrim(source)) > 0),
    CONSTRAINT ck_audit_events_result CHECK (result IN ('success', 'failure', 'partial', 'denied')),
    CONSTRAINT ck_audit_events_single_actor CHECK (num_nonnulls(actor_user_id, actor_service_account_id) <= 1)
);

CREATE TABLE audit_access_events (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid,
    branch_id uuid,
    actor_user_id uuid,
    actor_service_account_id uuid,
    resource_type text NOT NULL,
    resource_id uuid,
    action text NOT NULL,
    source text NOT NULL,
    reason text,
    result text NOT NULL,
    request_method text,
    request_path text,
    ip_address inet,
    user_agent text,
    request_id uuid,
    correlation_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_audit_access_events PRIMARY KEY (id),
    CONSTRAINT fk_audit_access_events_actor_user FOREIGN KEY (tenant_id, actor_user_id)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_audit_access_events_actor_service FOREIGN KEY (tenant_id, actor_service_account_id)
        REFERENCES service_accounts (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_audit_access_events_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_audit_access_events_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_audit_access_events_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_audit_access_events_resource_type CHECK (length(btrim(resource_type)) > 0),
    CONSTRAINT ck_audit_access_events_action CHECK (length(btrim(action)) > 0),
    CONSTRAINT ck_audit_access_events_source CHECK (length(btrim(source)) > 0),
    CONSTRAINT ck_audit_access_events_result CHECK (result IN ('allowed', 'denied', 'error')),
    CONSTRAINT ck_audit_access_events_single_actor CHECK (num_nonnulls(actor_user_id, actor_service_account_id) <= 1)
);

CREATE TABLE outbox_events (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    event_type text NOT NULL,
    aggregate_type text NOT NULL,
    aggregate_id uuid NOT NULL,
    event_version integer NOT NULL DEFAULT 1,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    payload_hash text NOT NULL,
    idempotency_key text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    retry_count integer NOT NULL DEFAULT 0,
    max_retries integer NOT NULL DEFAULT 10,
    available_at timestamptz NOT NULL DEFAULT now(),
    processing_started_at timestamptz,
    processed_at timestamptz,
    dead_lettered_at timestamptz,
    last_error text,
    request_id uuid,
    correlation_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    status_version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    version integer NOT NULL DEFAULT 1,
    CONSTRAINT pk_outbox_events PRIMARY KEY (id),
    CONSTRAINT fk_outbox_events_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_outbox_events_idempotency UNIQUE (tenant_id, idempotency_key),
    CONSTRAINT uq_outbox_events_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_outbox_events_type CHECK (length(btrim(event_type)) > 0),
    CONSTRAINT ck_outbox_events_aggregate_type CHECK (length(btrim(aggregate_type)) > 0),
    CONSTRAINT ck_outbox_events_event_version CHECK (event_version >= 1),
    CONSTRAINT ck_outbox_events_payload_hash CHECK (length(btrim(payload_hash)) >= 32),
    CONSTRAINT ck_outbox_events_idempotency_key CHECK (length(btrim(idempotency_key)) > 0),
    CONSTRAINT ck_outbox_events_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter')),
    CONSTRAINT ck_outbox_events_retry_count CHECK (retry_count >= 0 AND retry_count <= max_retries),
    CONSTRAINT ck_outbox_events_max_retries CHECK (max_retries >= 0),
    CONSTRAINT ck_outbox_events_version CHECK (version >= 1),
    CONSTRAINT ck_outbox_events_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE workflow_definitions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    definition_key text NOT NULL,
    name text NOT NULL,
    description text,
    subject_type text NOT NULL,
    status text NOT NULL DEFAULT 'draft',
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
    CONSTRAINT pk_workflow_definitions PRIMARY KEY (id),
    CONSTRAINT fk_workflow_definitions_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_workflow_definitions_tenant_key UNIQUE (tenant_id, definition_key),
    CONSTRAINT uq_workflow_definitions_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_workflow_definitions_key CHECK (definition_key ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),
    CONSTRAINT ck_workflow_definitions_name CHECK (length(btrim(name)) > 0),
    CONSTRAINT ck_workflow_definitions_subject CHECK (length(btrim(subject_type)) > 0),
    CONSTRAINT ck_workflow_definitions_status CHECK (status IN ('draft', 'active', 'disabled', 'archived')),
    CONSTRAINT ck_workflow_definitions_version CHECK (version >= 1),
    CONSTRAINT ck_workflow_definitions_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE workflow_versions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    definition_id uuid NOT NULL,
    version_number integer NOT NULL,
    definition_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    payload_hash text NOT NULL,
    status text NOT NULL DEFAULT 'draft',
    published_at timestamptz,
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
    CONSTRAINT pk_workflow_versions PRIMARY KEY (id),
    CONSTRAINT fk_workflow_versions_definition_scope FOREIGN KEY (tenant_id, definition_id)
        REFERENCES workflow_definitions (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_workflow_versions_definition_number UNIQUE (definition_id, version_number),
    CONSTRAINT uq_workflow_versions_definition_id UNIQUE (tenant_id, definition_id, id),
    CONSTRAINT uq_workflow_versions_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_workflow_versions_number CHECK (version_number >= 1),
    CONSTRAINT ck_workflow_versions_payload_hash CHECK (length(btrim(payload_hash)) >= 32),
    CONSTRAINT ck_workflow_versions_status CHECK (status IN ('draft', 'published', 'retired')),
    CONSTRAINT ck_workflow_versions_version CHECK (version >= 1),
    CONSTRAINT ck_workflow_versions_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE workflow_instances (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    definition_id uuid NOT NULL,
    workflow_version_id uuid NOT NULL,
    subject_type text NOT NULL,
    subject_id uuid NOT NULL,
    initiated_by uuid,
    context jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'pending',
    started_at timestamptz,
    completed_at timestamptz,
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
    CONSTRAINT pk_workflow_instances PRIMARY KEY (id),
    CONSTRAINT fk_workflow_instances_definition_scope FOREIGN KEY (tenant_id, definition_id)
        REFERENCES workflow_definitions (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_workflow_instances_version_scope FOREIGN KEY (tenant_id, definition_id, workflow_version_id)
        REFERENCES workflow_versions (tenant_id, definition_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_workflow_instances_initiator FOREIGN KEY (tenant_id, initiated_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_workflow_instances_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_workflow_instances_subject CHECK (length(btrim(subject_type)) > 0),
    CONSTRAINT ck_workflow_instances_status CHECK (status IN ('pending', 'running', 'approved', 'rejected', 'completed', 'cancelled', 'failed')),
    CONSTRAINT ck_workflow_instances_dates CHECK (completed_at IS NULL OR started_at IS NULL OR started_at <= completed_at),
    CONSTRAINT ck_workflow_instances_version CHECK (version >= 1),
    CONSTRAINT ck_workflow_instances_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE workflow_tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    workflow_instance_id uuid NOT NULL,
    task_key text NOT NULL,
    name text NOT NULL,
    sequence integer NOT NULL DEFAULT 1,
    assigned_user_id uuid,
    assigned_role_id uuid,
    status text NOT NULL DEFAULT 'pending',
    due_at timestamptz,
    completed_at timestamptz,
    decision text,
    decision_reason text,
    completed_by uuid,
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
    CONSTRAINT pk_workflow_tasks PRIMARY KEY (id),
    CONSTRAINT fk_workflow_tasks_instance_scope FOREIGN KEY (tenant_id, workflow_instance_id)
        REFERENCES workflow_instances (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_workflow_tasks_assigned_user FOREIGN KEY (tenant_id, assigned_user_id)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_workflow_tasks_assigned_role FOREIGN KEY (tenant_id, assigned_role_id)
        REFERENCES roles (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_workflow_tasks_completed_by FOREIGN KEY (tenant_id, completed_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_workflow_tasks_instance_key UNIQUE (workflow_instance_id, task_key),
    CONSTRAINT uq_workflow_tasks_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_workflow_tasks_key CHECK (length(btrim(task_key)) > 0),
    CONSTRAINT ck_workflow_tasks_name CHECK (length(btrim(name)) > 0),
    CONSTRAINT ck_workflow_tasks_sequence CHECK (sequence > 0),
    CONSTRAINT ck_workflow_tasks_assignment CHECK (num_nonnulls(assigned_user_id, assigned_role_id) <= 1),
    CONSTRAINT ck_workflow_tasks_status CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected', 'escalated', 'completed', 'cancelled')),
    CONSTRAINT ck_workflow_tasks_decision CHECK (decision IS NULL OR decision IN ('approve', 'reject', 'escalate', 'complete')),
    CONSTRAINT ck_workflow_tasks_dates CHECK (completed_at IS NULL OR completed_at >= created_at),
    CONSTRAINT ck_workflow_tasks_version CHECK (version >= 1),
    CONSTRAINT ck_workflow_tasks_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE notification_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid,
    template_key text NOT NULL,
    channel text NOT NULL,
    locale text NOT NULL DEFAULT 'en',
    template_version integer NOT NULL DEFAULT 1,
    subject text,
    body text NOT NULL,
    variables jsonb NOT NULL DEFAULT '[]'::jsonb,
    status text NOT NULL DEFAULT 'draft',
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
    CONSTRAINT pk_notification_templates PRIMARY KEY (id),
    CONSTRAINT fk_notification_templates_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_notification_templates_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_notification_templates_key CHECK (template_key ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),
    CONSTRAINT ck_notification_templates_channel CHECK (channel IN ('email', 'sms', 'push', 'in_app', 'webhook')),
    CONSTRAINT ck_notification_templates_version_number CHECK (template_version >= 1),
    CONSTRAINT ck_notification_templates_variables_array CHECK (jsonb_typeof(variables) = 'array'),
    CONSTRAINT ck_notification_templates_status CHECK (status IN ('draft', 'active', 'retired', 'archived')),
    CONSTRAINT ck_notification_templates_version CHECK (version >= 1),
    CONSTRAINT ck_notification_templates_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE notification_queue (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    template_id uuid,
    recipient_user_id uuid,
    recipient_address text,
    channel text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    idempotency_key text NOT NULL,
    priority integer NOT NULL DEFAULT 100,
    status text NOT NULL DEFAULT 'queued',
    retry_count integer NOT NULL DEFAULT 0,
    max_retries integer NOT NULL DEFAULT 5,
    available_at timestamptz NOT NULL DEFAULT now(),
    processing_started_at timestamptz,
    delivered_at timestamptz,
    last_error text,
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
    CONSTRAINT pk_notification_queue PRIMARY KEY (id),
    CONSTRAINT fk_notification_queue_template FOREIGN KEY (template_id)
        REFERENCES notification_templates (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_notification_queue_recipient FOREIGN KEY (tenant_id, recipient_user_id)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_notification_queue_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_notification_queue_idempotency UNIQUE (tenant_id, idempotency_key),
    CONSTRAINT uq_notification_queue_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_notification_queue_channel CHECK (channel IN ('email', 'sms', 'push', 'in_app', 'webhook')),
    CONSTRAINT ck_notification_queue_recipient CHECK (recipient_user_id IS NOT NULL OR length(btrim(recipient_address)) > 0),
    CONSTRAINT ck_notification_queue_priority CHECK (priority >= 0),
    CONSTRAINT ck_notification_queue_status CHECK (status IN ('queued', 'processing', 'delivered', 'failed', 'dead_letter')),
    CONSTRAINT ck_notification_queue_retry_count CHECK (retry_count >= 0 AND retry_count <= max_retries),
    CONSTRAINT ck_notification_queue_max_retries CHECK (max_retries >= 0),
    CONSTRAINT ck_notification_queue_version CHECK (version >= 1),
    CONSTRAINT ck_notification_queue_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE feature_flags (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid,
    school_id uuid,
    branch_id uuid,
    flag_key text NOT NULL,
    description text,
    scope_type text NOT NULL,
    enabled boolean NOT NULL DEFAULT false,
    rollout_percentage smallint NOT NULL DEFAULT 0,
    targeting_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
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
    CONSTRAINT pk_feature_flags PRIMARY KEY (id),
    CONSTRAINT fk_feature_flags_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_feature_flags_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_feature_flags_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_feature_flags_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_feature_flags_key CHECK (flag_key ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),
    CONSTRAINT ck_feature_flags_scope CHECK (
        (scope_type = 'global' AND tenant_id IS NULL AND school_id IS NULL AND branch_id IS NULL)
        OR (scope_type = 'tenant' AND tenant_id IS NOT NULL AND school_id IS NULL AND branch_id IS NULL)
        OR (scope_type = 'school' AND tenant_id IS NOT NULL AND school_id IS NOT NULL AND branch_id IS NULL)
        OR (scope_type = 'branch' AND tenant_id IS NOT NULL AND school_id IS NOT NULL AND branch_id IS NOT NULL)
    ),
    CONSTRAINT ck_feature_flags_rollout CHECK (rollout_percentage BETWEEN 0 AND 100),
    CONSTRAINT ck_feature_flags_status CHECK (status IN ('active', 'disabled', 'archived')),
    CONSTRAINT ck_feature_flags_version CHECK (version >= 1),
    CONSTRAINT ck_feature_flags_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE setting_definitions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid,
    setting_key text NOT NULL,
    data_type text NOT NULL,
    description text,
    default_value jsonb,
    validation_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
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
    CONSTRAINT pk_setting_definitions PRIMARY KEY (id),
    CONSTRAINT fk_setting_definitions_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_setting_definitions_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_setting_definitions_key CHECK (setting_key ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),
    CONSTRAINT ck_setting_definitions_type CHECK (data_type IN ('string', 'integer', 'number', 'boolean', 'json', 'date', 'datetime')),
    CONSTRAINT ck_setting_definitions_status CHECK (status IN ('active', 'disabled', 'archived')),
    CONSTRAINT ck_setting_definitions_version CHECK (version >= 1),
    CONSTRAINT ck_setting_definitions_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE setting_values (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid,
    school_id uuid,
    branch_id uuid,
    setting_definition_id uuid NOT NULL,
    scope_type text NOT NULL,
    value jsonb NOT NULL,
    effective_from timestamptz NOT NULL DEFAULT now(),
    effective_to timestamptz,
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
    CONSTRAINT pk_setting_values PRIMARY KEY (id),
    CONSTRAINT fk_setting_values_definition FOREIGN KEY (setting_definition_id)
        REFERENCES setting_definitions (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_setting_values_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_setting_values_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_setting_values_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_setting_values_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_setting_values_scope CHECK (
        (scope_type = 'global' AND tenant_id IS NULL AND school_id IS NULL AND branch_id IS NULL)
        OR (scope_type = 'tenant' AND tenant_id IS NOT NULL AND school_id IS NULL AND branch_id IS NULL)
        OR (scope_type = 'school' AND tenant_id IS NOT NULL AND school_id IS NOT NULL AND branch_id IS NULL)
        OR (scope_type = 'branch' AND tenant_id IS NOT NULL AND school_id IS NOT NULL AND branch_id IS NOT NULL)
    ),
    CONSTRAINT ck_setting_values_dates CHECK (effective_to IS NULL OR effective_from < effective_to),
    CONSTRAINT ck_setting_values_status CHECK (status IN ('active', 'disabled', 'archived')),
    CONSTRAINT ck_setting_values_version CHECK (version >= 1),
    CONSTRAINT ck_setting_values_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE system_jobs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid,
    job_key text NOT NULL,
    name text NOT NULL,
    job_type text NOT NULL,
    schedule text,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'active',
    retry_count integer NOT NULL DEFAULT 0,
    max_retries integer NOT NULL DEFAULT 3,
    last_started_at timestamptz,
    last_finished_at timestamptz,
    next_run_at timestamptz,
    last_error text,
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
    CONSTRAINT pk_system_jobs PRIMARY KEY (id),
    CONSTRAINT fk_system_jobs_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_system_jobs_key UNIQUE (job_key),
    CONSTRAINT uq_system_jobs_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_system_jobs_key CHECK (job_key ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),
    CONSTRAINT ck_system_jobs_name CHECK (length(btrim(name)) > 0),
    CONSTRAINT ck_system_jobs_type CHECK (length(btrim(job_type)) > 0),
    CONSTRAINT ck_system_jobs_status CHECK (status IN ('active', 'paused', 'disabled', 'archived')),
    CONSTRAINT ck_system_jobs_retry_count CHECK (retry_count >= 0 AND retry_count <= max_retries),
    CONSTRAINT ck_system_jobs_max_retries CHECK (max_retries >= 0),
    CONSTRAINT ck_system_jobs_version CHECK (version >= 1),
    CONSTRAINT ck_system_jobs_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE INDEX idx_audit_change_sets_tenant_created_at ON audit_change_sets (tenant_id, created_at);
CREATE INDEX idx_audit_change_sets_request_id ON audit_change_sets (tenant_id, request_id);
CREATE INDEX idx_audit_change_sets_correlation_id ON audit_change_sets (tenant_id, correlation_id);

CREATE INDEX idx_audit_events_tenant_entity ON audit_events (tenant_id, entity_type, entity_id, created_at);
CREATE INDEX idx_audit_events_tenant_action ON audit_events (tenant_id, action, created_at);
CREATE INDEX idx_audit_events_change_set ON audit_events (tenant_id, change_set_id);
CREATE INDEX idx_audit_events_request_id ON audit_events (tenant_id, request_id);

CREATE INDEX idx_audit_access_events_tenant_resource ON audit_access_events (tenant_id, resource_type, resource_id, created_at);
CREATE INDEX idx_audit_access_events_tenant_result ON audit_access_events (tenant_id, result, created_at);
CREATE INDEX idx_audit_access_events_request_id ON audit_access_events (tenant_id, request_id);

CREATE INDEX idx_outbox_events_queue ON outbox_events (status, available_at, retry_count);
CREATE INDEX idx_outbox_events_tenant_status ON outbox_events (tenant_id, status, available_at);
CREATE INDEX idx_outbox_events_aggregate ON outbox_events (tenant_id, aggregate_type, aggregate_id);

CREATE INDEX idx_workflow_definitions_tenant_status ON workflow_definitions (tenant_id, status);
CREATE INDEX idx_workflow_versions_definition_status ON workflow_versions (definition_id, status, version_number);
CREATE INDEX idx_workflow_instances_tenant_status ON workflow_instances (tenant_id, status, created_at);
CREATE INDEX idx_workflow_instances_subject ON workflow_instances (tenant_id, subject_type, subject_id);
CREATE INDEX idx_workflow_tasks_queue ON workflow_tasks (tenant_id, status, due_at);
CREATE INDEX idx_workflow_tasks_instance_status ON workflow_tasks (workflow_instance_id, status);
CREATE INDEX idx_workflow_tasks_assigned_user ON workflow_tasks (tenant_id, assigned_user_id, status);
CREATE INDEX idx_workflow_tasks_assigned_role ON workflow_tasks (tenant_id, assigned_role_id, status);

CREATE INDEX idx_notification_templates_lookup ON notification_templates (template_key, channel, locale, status);
CREATE INDEX idx_notification_templates_tenant_status ON notification_templates (tenant_id, status);
CREATE INDEX idx_notification_queue_processing ON notification_queue (status, available_at, priority);
CREATE INDEX idx_notification_queue_tenant_status ON notification_queue (tenant_id, status, available_at);
CREATE INDEX idx_notification_queue_recipient ON notification_queue (tenant_id, recipient_user_id, created_at);

CREATE INDEX idx_feature_flags_scope_lookup ON feature_flags (scope_type, flag_key, status);
CREATE INDEX idx_feature_flags_tenant_scope ON feature_flags (tenant_id, school_id, branch_id, status);

CREATE INDEX idx_setting_definitions_lookup ON setting_definitions (setting_key, status);
CREATE INDEX idx_setting_definitions_tenant_status ON setting_definitions (tenant_id, status);
CREATE INDEX idx_setting_values_scope_lookup ON setting_values (scope_type, setting_definition_id, effective_from);
CREATE INDEX idx_setting_values_tenant_scope ON setting_values (tenant_id, school_id, branch_id, status);

CREATE INDEX idx_system_jobs_due ON system_jobs (status, next_run_at);
CREATE INDEX idx_system_jobs_tenant_status ON system_jobs (tenant_id, status);

CREATE UNIQUE INDEX uq_notification_templates_global_key
    ON notification_templates (template_key, channel, locale, template_version)
    WHERE tenant_id IS NULL;
CREATE UNIQUE INDEX uq_notification_templates_tenant_key
    ON notification_templates (tenant_id, template_key, channel, locale, template_version)
    WHERE tenant_id IS NOT NULL;

CREATE UNIQUE INDEX uq_feature_flags_global_key
    ON feature_flags (flag_key)
    WHERE scope_type = 'global';
CREATE UNIQUE INDEX uq_feature_flags_tenant_key
    ON feature_flags (tenant_id, flag_key)
    WHERE scope_type = 'tenant';
CREATE UNIQUE INDEX uq_feature_flags_school_key
    ON feature_flags (school_id, flag_key)
    WHERE scope_type = 'school';
CREATE UNIQUE INDEX uq_feature_flags_branch_key
    ON feature_flags (branch_id, flag_key)
    WHERE scope_type = 'branch';

CREATE UNIQUE INDEX uq_setting_definitions_global_key
    ON setting_definitions (setting_key)
    WHERE tenant_id IS NULL;
CREATE UNIQUE INDEX uq_setting_definitions_tenant_key
    ON setting_definitions (tenant_id, setting_key)
    WHERE tenant_id IS NOT NULL;

CREATE UNIQUE INDEX uq_setting_values_global_scope
    ON setting_values (setting_definition_id, effective_from)
    WHERE scope_type = 'global';
CREATE UNIQUE INDEX uq_setting_values_tenant_scope
    ON setting_values (setting_definition_id, tenant_id, effective_from)
    WHERE scope_type = 'tenant';
CREATE UNIQUE INDEX uq_setting_values_school_scope
    ON setting_values (setting_definition_id, school_id, effective_from)
    WHERE scope_type = 'school';
CREATE UNIQUE INDEX uq_setting_values_branch_scope
    ON setting_values (setting_definition_id, branch_id, effective_from)
    WHERE scope_type = 'branch';

REVOKE UPDATE, DELETE, TRUNCATE ON audit_change_sets, audit_events, audit_access_events FROM PUBLIC;
REVOKE UPDATE, DELETE, TRUNCATE ON audit_change_sets, audit_events, audit_access_events FROM anon, authenticated;
