-- Canonical ERP journals and audit events are append-only at the database role
-- boundary. Reversal documents represent corrections; UPDATE/DELETE must not
-- be available to the authenticated application role.

BEGIN;

REVOKE UPDATE, DELETE ON TABLE public.erp_financial_audit_events FROM authenticated;
REVOKE UPDATE, DELETE ON TABLE public.erp_general_ledger FROM authenticated;

DROP POLICY IF EXISTS p_erp_financial_audit_events_scope ON public.erp_financial_audit_events;
CREATE POLICY p_erp_financial_audit_events_select_scope
    ON public.erp_financial_audit_events
    FOR SELECT TO authenticated
    USING (
        tenant_id::text = current_setting('app.tenant_id', true)
        AND school_id::text = current_setting('app.school_id', true)
    );

CREATE POLICY p_erp_financial_audit_events_insert_scope
    ON public.erp_financial_audit_events
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id::text = current_setting('app.tenant_id', true)
        AND school_id::text = current_setting('app.school_id', true)
    );

DROP POLICY IF EXISTS p_erp_general_ledger_scope ON public.erp_general_ledger;
CREATE POLICY p_erp_general_ledger_select_scope
    ON public.erp_general_ledger
    FOR SELECT TO authenticated
    USING (
        tenant_id::text = current_setting('app.tenant_id', true)
        AND school_id::text = current_setting('app.school_id', true)
    );

CREATE POLICY p_erp_general_ledger_insert_scope
    ON public.erp_general_ledger
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id::text = current_setting('app.tenant_id', true)
        AND school_id::text = current_setting('app.school_id', true)
    );

COMMIT;
