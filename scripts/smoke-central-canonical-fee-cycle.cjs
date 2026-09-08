require('dotenv/config');
const { randomUUID } = require('node:crypto');
const { Pool } = require('pg');

const CENTRAL_SCHOOL_CODE = 'CENTRAL-SCHOOL';
const connectionString = process.env.PLATFORM_ADMIN_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_CONNECTION_REQUIRED');
const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 10000, ssl: { rejectUnauthorized: false }, application_name: 'edupro-central-canonical-fee-smoke' });

function assert(condition, message) {
  if (!condition) throw new Error(`SMOKE_ASSERTION_FAILED: ${message}`);
}

function dateText(date) {
  return date.toISOString().slice(0, 10);
}

function addMonths(date, months) {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  return next;
}

async function audit(client, tenantId, schoolId, actorId, entityType, entityId, action, metadata) {
  await client.query(`
    INSERT INTO public.audit_events
      (id, tenant_id, school_id, actor_user_id, entity_type, entity_id, action, source, result, metadata)
    VALUES ($1,$2,$3,$4,$5,$6,$7,'CanonicalStudentFeeSmoke','success',$8::jsonb)
  `, [randomUUID(), tenantId, schoolId, actorId, entityType, entityId, action, JSON.stringify(metadata || {})]);
}

(async () => {
  const client = await pool.connect();
  let rolledBack = false;
  const runId = randomUUID();
  let ids = {};
  try {
    await client.query('BEGIN');
    const schoolResult = await client.query(`
      SELECT id, tenant_id, display_name, central_metadata
        FROM public.schools
       WHERE school_code=$1 AND status='active' AND deleted_at IS NULL
       LIMIT 1
       FOR SHARE
    `, [CENTRAL_SCHOOL_CODE]);
    const school = schoolResult.rows[0];
    assert(school, 'central school not found');
    assert(school.central_metadata?.portal_profile === 'owner_controlled', 'target is not owner-controlled central school');
    assert(school.central_metadata?.ownerWorkspace?.mode === 'owner', 'target is not central owner workspace');

    const actorResult = await client.query(`
      SELECT id, display_name
        FROM public.users
       WHERE tenant_id=$1 AND school_id=$2 AND status='active' AND deleted_at IS NULL
       ORDER BY created_at
       LIMIT 1
    `, [school.tenant_id, school.id]);
    const actor = actorResult.rows[0];
    assert(actor, 'central active actor not found');

    const existingStudentResult = await client.query(`
      SELECT id, student_number, preferred_name, legal_first_name, legal_middle_name, legal_last_name, branch_id
        FROM public.students
       WHERE tenant_id=$1 AND school_id=$2 AND status IN ('active','admitted','applicant') AND deleted_at IS NULL
       ORDER BY created_at
       LIMIT 1
    `, [school.tenant_id, school.id]);
    let student = existingStudentResult.rows[0];
    let syntheticStudent = false;
    if (!student) {
      syntheticStudent = true;
      const studentId = randomUUID();
      const studentNumber = `SMOKE-${runId.slice(0, 8).toUpperCase()}`;
      const created = await client.query(`
        INSERT INTO public.students
          (id, tenant_id, school_id, student_number, legal_first_name, legal_last_name,
           date_of_birth, status, version, created_at, updated_at, created_by, updated_by)
        VALUES ($1,$2,$3,$4,'اختبار','الرسوم','2015-01-01','active',1,now(),now(),$5,$5)
        RETURNING id, student_number, legal_first_name, legal_last_name, branch_id
      `, [studentId, school.tenant_id, school.id, studentNumber, actor.id]);
      student = created.rows[0];
    }

    const today = new Date();
    const todayText = dateText(today);
    const firstDueDate = dateText(addMonths(today, 1));
    const templateId = `smoke-template-${runId}`;
    const assignmentId = randomUUID();
    const invoiceId = randomUUID();
    const planId = randomUUID();
    const paymentAttemptId = randomUUID();
    const receiptId = `smoke-receipt-${runId}`;
    const allocationId = randomUUID();
    ids = { templateId, assignmentId, invoiceId, planId, paymentAttemptId, receiptId, allocationId, studentId: student.id };

    await client.query(`
      INSERT INTO public.student_fee_templates
        (tenant_id, school_id, id, code, name, category, amount, currency, revenue_account,
         receivable_account, academic_year_id, financial_period, version, status, effective_from,
         eligibility_rules, installment_policy, created_by, updated_by)
      VALUES ($1,$2,$3,$4,'اختبار دورة الرسوم','tuition',300,'SAR','4100','1201','SMOKE-2026','SMOKE-09',1,'active',$5,'{}','{}',$6,$6)
    `, [school.tenant_id, school.id, templateId, `SMOKE-${runId.slice(0, 8)}`, todayText, actor.id]);

    const grossAmount = 300;
    const discountAmount = 0;
    const netAmount = 300;
    const assignmentKey = `smoke-assignment:${runId}`;
    await client.query(`
      INSERT INTO public.student_fee_assignments
        (tenant_id, school_id, id, student_id, template_id, academic_year_id, academic_period_id,
         gross_amount, discount_amount, net_amount, due_date, status, idempotency_key, source, created_by)
      VALUES ($1,$2,$3,$4,$5,'SMOKE-2026','SMOKE-T1',$6,$7,$8,$9,'invoiced',$10,'smoke',$11)
    `, [school.tenant_id, school.id, assignmentId, student.id, templateId, grossAmount, discountAmount, netAmount, firstDueDate, assignmentKey, actor.id]);

    await client.query(`
      INSERT INTO public.student_fee_invoices
        (tenant_id, school_id, id, branch_id, student_id, student_name, item, amount, tax_amount,
         paid_amount, remaining_amount, invoice_date, due_date, status, source_payload, updated_by,
         template_id, academic_year_id, academic_period_id, currency, idempotency_key, version)
      VALUES ($1,$2,$3,$4,$5,'اختبار الرسوم','رسوم دراسية',300,0,0,300,$6,$7,'issued',$8::jsonb,$9,$10,'SMOKE-2026','SMOKE-T1','SAR',$11,1)
    `, [school.tenant_id, school.id, invoiceId, student.branch_id || null, String(student.id), todayText, firstDueDate, JSON.stringify({ source: 'smoke', runId }), actor.id, templateId, `smoke-invoice:${runId}`]);
    await audit(client, school.tenant_id, school.id, actor.id, 'student_fee_invoice', invoiceId, 'issue', { runId });

    await client.query(`
      INSERT INTO public.student_fee_installment_plans
        (tenant_id, school_id, id, invoice_id, student_id, template_id, total_amount, frequency,
         method, installment_count, currency, status, policy, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,300,'monthly','equal',3,'SAR','approved',$7::jsonb,$8)
    `, [school.tenant_id, school.id, planId, invoiceId, student.id, templateId, JSON.stringify({ gracePeriodDays: 0 }), actor.id]);
    const scheduleRows = [];
    for (let i = 0; i < 3; i += 1) {
      const scheduleId = randomUUID();
      const dueDate = dateText(addMonths(today, i + 1));
      const row = await client.query(`
        INSERT INTO public.student_fee_installment_schedules
          (tenant_id, school_id, id, plan_id, installment_number, due_date, amount, paid_amount,
           penalty_amount, waived_penalty_amount, status)
        VALUES ($1,$2,$3,$4,$5,$6,100,0,0,0,'scheduled')
        RETURNING id, installment_number, due_date, amount, paid_amount, status
      `, [school.tenant_id, school.id, scheduleId, planId, i + 1, dueDate]);
      scheduleRows.push(row.rows[0]);
    }
    assert(scheduleRows.length === 3, 'three installment rows were not created');
    assert(scheduleRows.reduce((sum, row) => sum + Number(row.amount), 0) === 300, 'installment schedule does not balance');
    await audit(client, school.tenant_id, school.id, actor.id, 'student_fee_installment_plan', planId, 'create', { runId, count: 3 });

    await client.query(`
      INSERT INTO public.student_fee_payment_attempts
        (tenant_id, school_id, id, student_id, amount, currency, provider, provider_reference,
         idempotency_key, status, metadata)
      VALUES ($1,$2,$3,$4,100,'SAR','smoke_gateway',$5,$6,'succeeded',$7::jsonb)
    `, [school.tenant_id, school.id, paymentAttemptId, student.id, `smoke-provider:${runId}`, `smoke-payment:${runId}`, JSON.stringify({ runId })]);
    await audit(client, school.tenant_id, school.id, actor.id, 'student_fee_payment_attempt', paymentAttemptId, 'confirm', { runId, amount: 100 });

    await client.query(`
      INSERT INTO public.student_fee_receipts
        (tenant_id, school_id, id, student_id, student_name, receipt_date, amount, payment_method,
         receiving_account, operational_type, against_text, status, source_payload, updated_by)
      VALUES ($1,$2,$3,$4,'اختبار الرسوم',$5,100,'smoke_gateway','smoke-clearing','student_fee','بوابة الاختبار','approved',$6::jsonb,$7)
    `, [school.tenant_id, school.id, receiptId, String(student.id), todayText, JSON.stringify({ paymentAttemptId, runId }), actor.id]);
    await client.query(`UPDATE public.student_fee_payment_attempts SET receipt_id=$4, updated_at=now() WHERE tenant_id=$1 AND school_id=$2 AND id=$3`, [school.tenant_id, school.id, paymentAttemptId, receiptId]);
    await audit(client, school.tenant_id, school.id, actor.id, 'student_fee_payment_attempt', paymentAttemptId, 'settle', { runId, receiptId });

    await client.query(`
      INSERT INTO public.student_fee_allocations
        (tenant_id, school_id, id, receipt_id, invoice_id, installment_schedule_id, amount, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,100,$7)
    `, [school.tenant_id, school.id, allocationId, receiptId, invoiceId, scheduleRows[0].id, actor.id]);
    await client.query(`
      UPDATE public.student_fee_invoices
         SET paid_amount=100, remaining_amount=200, status='partial', version=version+1, updated_at=now(), updated_by=$1
       WHERE tenant_id=$2 AND school_id=$3 AND id=$4
    `, [actor.id, school.tenant_id, school.id, invoiceId]);
    await client.query(`
      UPDATE public.student_fee_installment_schedules
         SET paid_amount=100, status='paid', version=version+1
       WHERE tenant_id=$1 AND school_id=$2 AND id=$3
    `, [school.tenant_id, school.id, scheduleRows[0].id]);
    await audit(client, school.tenant_id, school.id, actor.id, 'student_fee_allocation', allocationId, 'allocate', { runId, receiptId, invoiceId, amount: 100 });

    const report = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM public.student_fee_invoices WHERE tenant_id=$1 AND school_id=$2 AND id=$3) AS invoices,
        (SELECT COALESCE(SUM(amount + tax_amount),0)::numeric FROM public.student_fee_invoices WHERE tenant_id=$1 AND school_id=$2 AND id=$3) AS billed,
        (SELECT COALESCE(SUM(paid_amount),0)::numeric FROM public.student_fee_invoices WHERE tenant_id=$1 AND school_id=$2 AND id=$3) AS paid,
        (SELECT COALESCE(SUM(remaining_amount),0)::numeric FROM public.student_fee_invoices WHERE tenant_id=$1 AND school_id=$2 AND id=$3) AS remaining,
        (SELECT COUNT(*)::int FROM public.student_fee_installment_schedules WHERE tenant_id=$1 AND school_id=$2 AND plan_id=$4) AS schedules,
        (SELECT COUNT(*)::int FROM public.student_fee_installment_schedules WHERE tenant_id=$1 AND school_id=$2 AND plan_id=$4 AND status='paid') AS paid_schedules,
        (SELECT COALESCE(SUM(amount),0)::numeric FROM public.student_fee_allocations WHERE tenant_id=$1 AND school_id=$2 AND invoice_id=$3) AS allocated,
        (SELECT status FROM public.student_fee_payment_attempts WHERE tenant_id=$1 AND school_id=$2 AND id=$5) AS payment_status,
        (SELECT status FROM public.student_fee_receipts WHERE tenant_id=$1 AND school_id=$2 AND id=$6) AS receipt_status,
        (SELECT receipt_id FROM public.student_fee_payment_attempts WHERE tenant_id=$1 AND school_id=$2 AND id=$5) AS settled_receipt_id
    `, [school.tenant_id, school.id, invoiceId, planId, paymentAttemptId, receiptId]);
    const state = report.rows[0];
    assert(Number(state.invoices) === 1, 'invoice report count');
    assert(Number(state.billed) === 300, 'invoice report billed total');
    assert(Number(state.paid) === 100, 'invoice report paid total');
    assert(Number(state.remaining) === 200, 'invoice report remaining total');
    assert(Number(state.schedules) === 3, 'installment report count');
    assert(Number(state.paid_schedules) === 1, 'paid installment report count');
    assert(Number(state.allocated) === 100, 'allocation report total');
    assert(state.payment_status === 'succeeded', 'payment status');
    assert(state.receipt_status === 'approved', 'receipt status');
    assert(state.settled_receipt_id === receiptId, 'settlement receipt link');

    await client.query('ROLLBACK');
    rolledBack = true;
    const cleanup = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM public.student_fee_templates WHERE school_id=$1 AND id=$2) AS templates,
        (SELECT COUNT(*)::int FROM public.student_fee_assignments WHERE school_id=$1 AND id=$3) AS assignments,
        (SELECT COUNT(*)::int FROM public.student_fee_invoices WHERE school_id=$1 AND id=$4) AS invoices,
        (SELECT COUNT(*)::int FROM public.student_fee_payment_attempts WHERE school_id=$1 AND id=$5) AS payment_attempts,
        (SELECT COUNT(*)::int FROM public.student_fee_receipts WHERE school_id=$1 AND id=$6) AS receipts,
        (SELECT COUNT(*)::int FROM public.student_fee_allocations WHERE school_id=$1 AND id=$7) AS allocations
    `, [school.id, templateId, assignmentId, invoiceId, paymentAttemptId, receiptId, allocationId]);
    const cleanupState = cleanup.rows[0];
    assert(Object.values(cleanupState).every((value) => Number(value) === 0), 'rollback left smoke rows behind');

    console.log(JSON.stringify({
      success: true,
      mode: 'transactional_smoke_rollback',
      target: { schoolId: school.id, tenantId: school.tenant_id, displayName: school.display_name },
      fixture: syntheticStudent ? 'synthetic_student_rolled_back' : 'existing_active_student_rolled_back',
      cycle: ['create_claim', 'installment_plan', 'payment', 'settlement', 'allocation', 'report'],
      report: state,
      cleanup: cleanupState,
      dataPersisted: false,
    }, null, 2));
  } catch (error) {
    if (!rolledBack) {
      try { await client.query('ROLLBACK'); } catch { /* preserve original error */ }
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
})().catch((error) => { console.error(error.stack || error.message || String(error)); process.exitCode = 1; });
