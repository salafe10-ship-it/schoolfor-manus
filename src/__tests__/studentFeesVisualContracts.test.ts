import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/StudentFinancialPortal.tsx'),
  'utf8',
);
const css = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');
const generalLedgerSource = fs.readFileSync(path.resolve(process.cwd(), 'src/components/GeneralLedgerPortal.tsx'), 'utf8');
const journalEntriesSource = fs.readFileSync(path.resolve(process.cwd(), 'src/modules/accounting/presentation/JournalEntriesTab.tsx'), 'utf8');
const receiptVoucherSource = fs.readFileSync(path.resolve(process.cwd(), 'src/modules/accounting/presentation/ReceiptVoucherTab.tsx'), 'utf8');
const serverSource = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');

describe('student fee presentation contracts', () => {
  it('shows saved installment dates and amounts from the canonical schedule', () => {
    expect(source).toContain('يعرض هذا الجدول مواعيد ومبالغ الخطة المحفوظة في المصدر المالي.');
    expect(source).toContain('selectedInvoiceInstallmentPlan.schedules.map(schedule =>');
    expect(source).toContain("String(schedule.dueDate || '').slice(0, 10)");
    expect(source).toContain('selectedPlanScheduleMismatch');
  });

  it('labels the saved plan total separately from the invoice balance', () => {
    expect(source).toContain("selectedInvoiceInstallmentPlan ? 'إجمالي الخطة المحفوظة' : 'المتبقي على المطالبة'");
    expect(source).toContain('selectedInvoiceInstallmentPlan?.totalAmount ?? installmentPlanTotal');
    expect(source).toContain('المتبقي على المطالبة: {formatActiveCurrencyAmount(installmentPlanTotal)}');
  });

  it('fails closed until prior plans have loaded for the selected student', () => {
    expect(source).toContain('installmentPlansLoadedStudentId === selectedStudent.id');
    expect(source).toContain('!installmentPlansReady || installmentPlansLoading');
    expect(source).toContain('Boolean(selectedInvoiceInstallmentPlan) || generatedInstallments.length === 0');
  });

  it('keeps the full record identifier available while shortening its visible label', () => {
    expect(source).toContain('المعرّف الداخلي الكامل: ${row.reference.fullId}');
    expect(source).toContain('{row.reference.value}');
    expect(source).toContain('[row.id, row.reference.value, row.student, row.studentId, row.description, row.recordType]');
  });

  it('keeps fee-setting header text readable on its dark background', () => {
    expect(css).toContain('.financial-content-viewport .financial-fee-module-header :is(h2, h3, h4)');
    expect(css).toContain('color: #fff6d2 !important;');
  });

  it('keeps financial utility actions at a readable size and touch target', () => {
    expect(css).toContain('#student-financial-portal.financial-reference-management .fee-management-utility-action {');
    expect(css).toContain('min-height: 2.5rem;');
    expect(css).toContain('font-size: 0.75rem;');
  });

  it('uses the resolved school-stage logo in printable student receipts', () => {
    expect(source).toContain('resolveCostCenterStageLogoKey(');
    expect(source).toContain('selectedSchool?.stageLogos?.[stageLogoKey]');
    expect(source).toContain('`/branding/stages/${stageLogoKey}.png`');
    expect(source).toContain('alt="${escapePrintHtml(logoAlt)}"');
  });

  it('prints the relevant stage logo on student ledgers and previews it on financial reports', () => {
    expect(source).toContain('const ledgerStageLogoKey = resolveCostCenterStageLogoKey(');
    expect(source).toContain('${ledgerStageLogoMarkup}');
    expect(source).toContain('selectedSchool?.stageLogos?.[key] || `/branding/stages/${key}.png`');
    expect(source).toContain('aria-label="معاينة تقرير الرسوم المالية"');
  });

  it('opens an in-page landscape report preview using the current filtered rows', () => {
    expect(source).toContain('const handleOpenFinancialReportPreview = () => {');
    expect(source).toContain('portalOnExportPdf = handlePreviewFinancialReport;');
    expect(source).toContain('{financialReportPreviewOpen && createPortal((');
    expect(source).toContain('financialReportRows.map(row => (');
    expect(source).toContain('@page{size:A4 landscape;margin:10mm}');
    expect(source).toContain('طباعة هذه المعاينة');
  });

  it('prints all configured stage logos on consolidated receipt reports', () => {
    expect(source).toContain("const receiptReportStageLogos = buildPrintStageLogos(['primary', 'middle', 'secondary']);");
    expect(source).toContain('${receiptReportStageLogos}');
  });

  it('shows the selected stage logo on the receipt detail preview', () => {
    expect(source).toContain('const selectedReceiptStageLogoKey = selectedStudRv');
    expect(source).toContain('alt={selectedReceiptStageLogoAlt}');
    expect(source).toContain('src={selectedReceiptStageLogoSource}');
  });

  it('shows the active currency in fee settings and prevents stage-mismatched bulk posting', () => {
    expect(source).toContain('المبلغ ({getCurrencyConfigForCode(activeCurrencyCode).symbol})');
    expect(source).toContain('title={`العملة النشطة: ${activeCurrencySymbol}`}');
    expect(source).toContain('القيمة (${activeCurrencySymbol})');
    expect(source).toContain('getReceiptCurrencyConfig(v).symbol');
    expect(source).toContain('massFeeConfigStageMismatch');
    expect(source).toContain('isFeeConfigurationCompatibleWithStage(selectedFeeConfig.type');
    expect(source).toContain('لا يطابق المرحلة');
  });

  it('explains student-specific totals before selection and localizes cost center labels', () => {
    expect(source).toContain(": 'اختر طالبًا'");
    expect(source).toContain('STUDENT_COST_CENTER_LABELS[selectedStudentFeeContext.costCenter]');
  });

  it('labels the mass invoice date as the due date used by the posting workflow', () => {
    expect(source).toContain('تاريخ استحقاق المطالبة');
    expect(source).toContain('const dueDate = massDueDate;');
  });

  it('uses an accessible in-app reason and confirmation dialog for financial reversals', () => {
    expect(source).toContain('title: selectedStudRv.status === \'posted\' ? \'تأكيد عكس سند القبض\'');
    expect(source).toContain("reasonLabel: selectedStudRv.status === 'posted' ? 'سبب عكس السند'");
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain('role="alertdialog"');
    expect(source).toContain('financialActionReason.trim().length < (pendingFinancialAction.reasonMinLength ?? 1)');
    expect(source).toContain("if (typeof cancelReasonInput !== 'string')");
    expect(source).toContain('onClick={() => { void handleCancelStudRv(); }}');
    expect(source).toContain('onClick={() => { void handleDeleteStudRv(); }}');
    expect(source).toContain('pendingFinancialAction.reference && <div dir="ltr"');
    expect(source).not.toContain('window.prompt(');
    expect(source).not.toContain('window.confirm(');
  });

  it('keeps cancelled receipt audit records out of the delete workflow', () => {
    expect(source).toContain("['posted', 'approved', 'saved', 'cancelled'].includes(String(selectedStudRv.status || '').toLowerCase())");
    expect(source).toContain("String(selectedStudRv.status || '').toLowerCase() === 'draft'");
    expect(source).toContain("String(selectedStudRv.status || '').toLowerCase() !== 'draft'");
    expect(source).toContain('يجب الحفاظ على أثره الرقابي');
  });

  it('keeps canonical source journals read-only in the journal list and editor', () => {
    expect(journalEntriesSource).toContain("const isCanonicalSourceJournal = (entry: any) => /^(ERP-JV-|ERP-REV-)/.test(String(entry?.id || ''));");
    expect(journalEntriesSource).toContain('const activeJvIsCanonicalSourceJournal = isCanonicalSourceJournal(activeJvState);');
    expect(journalEntriesSource).toContain('disabled={!journalWritesAreAvailable || activeJvIsCanonicalSourceJournal}');
    expect(journalEntriesSource).toContain('disabled={!journalWritesAreAvailable || isCanonicalSourceEntry}');
    expect(journalEntriesSource).toContain("{isCanonicalSourceEntry ? 'محمي — canonical'");
    expect(generalLedgerSource).toContain("const isCanonicalErpJournalId = (id: unknown) => /^(ERP-JV-|ERP-REV-)/.test(String(id || ''));");
    expect(generalLedgerSource).toContain('if (isCanonicalErpJournalId(activeJvState?.id)) {');
    expect(generalLedgerSource).toContain('if (isCanonicalErpJournalId(jv.id)) {');
    expect(generalLedgerSource).toContain('القيد المصدر الكانوني لا يحذف من دفتر الأستاذ');
  });

  it('distinguishes voucher numbers from canonical journal and system identifiers across screens and exports', () => {
    expect(source).toContain('رقم المستند / معرّف النظام');
    expect(source).toContain("resolveFinancialDocumentReference(v, 'receipt').value");
    expect(source).toContain('المعرّف الداخلي الكامل');
    expect(receiptVoucherSource).toContain("resolveFinancialDocumentReference(rv, 'receipt')");
    expect(generalLedgerSource).toContain("resolveFinancialDocumentReference(selectedPaymentVoucher, 'payment')");
    expect(journalEntriesSource).toContain("resolveFinancialDocumentReference(entry as unknown as Record<string, unknown>, 'journal')");
    expect(journalEntriesSource).toContain('معرّف القيد الداخلي الكامل');
  });

  it('shows official receipt numbers in the student receipt archive and print view', () => {
    expect(source).toContain("resolveFinancialDocumentReference(voucher, 'receipt').value");
    expect(source).toContain('v.receiptVoucherId,');
    expect(source).toContain('رقم السند: {resolveFinancialDocumentReference(selectedStudRv, \'receipt\').value}');
    expect(source).toContain('معرّف النظام: {selectedStudRv.id}');
    expect(source).toContain('رقم سند القبض: ${escapePrintHtml(receiptNumber)}');
    expect(source).not.toContain('receiptReference.fullId');
  });

  it('does not label a database student ID as an academic number', () => {
    expect(source).toContain("const receiptStudentNumber = receiptStudent?.academicId || receiptStudent?.studentCode || 'غير مسجل';");
    expect(source).toContain("const receiptStudentReferenceLabel = receiptStudentNumber === 'غير مسجل' ? 'رقم الطالب' : 'الرقم الأكاديمي';");
    expect(source).toContain('${receiptStudentReferenceLabel}: ${escapePrintHtml(receiptStudentNumber)}');
    expect(source).not.toContain('receiptStudentNumber || v.studentId');
    expect(source).toContain('`معرّف الطالب بالنظام: ${selectedStudRv.studentId}`');
    expect(source).toContain('selectedReceiptStudentNumber');
  });

  it('restores canonical receipt reversal references and notes after reload', () => {
    expect(serverSource).toContain('const reversalJournalId = String(sourcePayload.reversalJournalId || \'\').trim();');
    expect(serverSource).toContain('reversalJournalEntryId: reversalJournalId');
    expect(serverSource).toContain('notes: reversalNotes');
    expect(serverSource).toContain('cancelledBy: String(sourcePayload.reversedBy || sourcePayload.voidedBy || sourcePayload.cancelledBy || \'\')');
    expect(source).toContain('{selectedStudRv.reversalJournalEntryId && (');
  });

  it('keeps verified dashboard balances visible in read-only mode and labels all money values with currency', () => {
    expect(source).toContain('const [financialDatabaseLoaded, setFinancialDatabaseLoaded]');
    expect(source).toContain('if (!financialDatabaseLoaded)');
    expect(source).toContain('aggregateStudentFinancialSnapshot(financialInvoices)');
    expect(source).toContain('formatActiveCurrencyAmount(agingAnalysis.total)');
    expect(source).toContain('formatActiveCurrencyAmount(student.feesRemaining)');
    expect(source).toContain('قراءة موثقة من سجل المطالبات والسندات');
    expect(source).toContain('const today = toLocalDateInputValue(new Date());');
    expect(source).toContain('date: toLocalDateInputValue(new Date())');
  });

  it('shows truthful installment readiness and receipt print status labels', () => {
    expect(source).toContain('لا توجد مطالبة مفتوحة لهذا الطالب.');
    expect(source).toContain('لا توجد مطالبة مفتوحة');
    expect(source).toContain('مرحل ومُوثق في اليومية');
    expect(source).toContain('مسودة محفوظة — غير معتمدة وغير مرحلة');
    expect(source).toContain("String(schedule.dueDate || '').slice(0, 10)");
    expect(source).toContain('المبلغ ({getCurrencyConfigForCode(String(installmentPlanPrintPreview.plan.currency || activeCurrencyCode)).symbol})');
  });

  it('disables fee configuration save until required values are valid', () => {
    expect(source).toContain('!currFeeType.trim() || !currFeeAccount.trim() || !Number.isFinite(currFeeAmount) || currFeeAmount <= 0');
    expect(source).toContain('const normalizedFeeType = currFeeType.trim();');
  });

  it('blocks non-positive or over-discounted student fee demands before issue', () => {
    expect(source).toContain('const invalidAmountRow = feeRows.find(row => !Number.isFinite(Number(row.amount)) || Number(row.amount) < 0);');
    expect(source).toContain('Number(manualDiscountAmount) < 0');
    expect(source).toContain('feeDemandGross <= feeDemandDiscount');
    expect(source).toContain('مبلغ بند «${invalidAmountRow.type}» غير صالح');
  });

  it('derives receipt stage and cost center from registered student or invoice context without defaulting to primary', () => {
    expect(source).toContain('resolveStudentFeeContext(student, stages || [], grades || [], academicClasses || [], costCenters || [])');
    expect(source).toContain('latestInvoiceContext?.costCenter || latestInvoiceContext?.academicStageCode');
    expect(source).not.toContain("? 'secondary' : 'primary'");
  });

  it('uses the record creation date when a financial document date is absent', () => {
    expect(source).toContain('record?.date || record?.receiptDate || record?.invoiceDate || record?.dueDate || record?.createdAt');
    expect(source).toContain('date: normalizeFinancialRecordDate(voucher)');
    expect(source).toContain('date: normalizeFinancialRecordDate(invoice)');
  });

  it('clears the active receipt before applying a new archive search or status filter', () => {
    expect(source).toMatch(/setRvSearch\(e\.target\.value\);\s+setSelectedStudRv\(null\);\s+setStudRvMode\('view'\);/);
    expect(source).toMatch(/setRvStatusFilter\(tab\.id\);\s+setSelectedStudRv\(null\);\s+setStudRvMode\('view'\);/);
  });

  it('moves the floating assistant away from report amounts on compact browser widths', () => {
    expect(css).toContain('@media (max-width: 1024px)');
    expect(css).toContain('#ai_assistant_floating_root');
    expect(css).toContain('left: 0.5rem !important;');
  });

  it('escapes dynamic financial fields before writing print documents', () => {
    expect(source).toContain('<title>سند قبض رقم ${escapePrintHtml(receiptNumber)}</title>');
    expect(source).toContain('<td style="font-weight: bold;">${escapePrintHtml(v.studentName)}</td>');
    expect(source).toContain('<span class="student-card-value">${escapePrintHtml(selectedStudent.name)}</span>');
  });

  it('uses the active school currency across ledger totals, journal detail, and printed receipts', () => {
    expect(generalLedgerSource).toContain("currencyConfig.code : selectedSchool?.currencyCode) || 'SDG'");
    expect(generalLedgerSource).toContain('setCurrency(configuredCurrencyCode)');
    expect(journalEntriesSource).toContain('getCurrencyConfigForCode(String(entry.currency || currency || selectedSchool?.currencyCode || \'SDG\'))');
    expect(serverSource).toContain('financialCurrencyBySource.get(`${entry.sourceType}:${entry.sourceId}`)');
    expect(serverSource).toContain('canonicalJournalEntry: journal');
    expect(journalEntriesSource).not.toContain('value="دينار ليبي (د.ل)"');
    expect(receiptVoucherSource).toContain('amountToArabicWords(receiptAmount, receiptCurrency)');
    expect(receiptVoucherSource).toContain('receiptCurrency.symbol');
  });

  it('projects the canonical posting status back onto linked payment vouchers', () => {
    expect(serverSource).toContain("const canonicalStatus = String(journal?.status || '').trim().toLowerCase();");
    expect(serverSource).toContain("canonicalStatus === 'posted' || canonicalStatus === 'reversed' ? { status: canonicalStatus }");
    expect(serverSource).toContain('canonicalJournalEntry: journal');
  });

  it('derives missing invoice cost centers from the associated student context', () => {
    expect(source).toContain('const studentsById = new Map(students.map(student => [String(student.id), student]));');
    expect(source).toContain('resolveStudentFeeContext(invoiceStudent, stages || [], grades || [], academicClasses || [], costCenters || [])');
    expect(source).toContain('resolvedStudentContext?.costCenter || resolvedStudentContext?.stageType');
  });
});
