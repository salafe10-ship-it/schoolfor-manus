type AgentName = 'SOL' | 'LUNA';

type AgentResult = {
  agent: AgentName;
  model: string;
  output: string;
};

const OPENAI_URL = 'https://api.openai.com/v1/responses';

function requireOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not configured.');
  return key;
}

async function runAgent(agent: AgentName, instructions: string, input: unknown): Promise<AgentResult> {
  const key = requireOpenAIKey();
  const model = agent === 'SOL'
    ? (process.env.SOL_MODEL || 'gpt-5.6-sol')
    : (process.env.LUNA_MODEL || 'gpt-5.6-luna');
  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      reasoning: { effort: agent === 'SOL' ? 'high' : 'medium' },
      input: [
        { role: 'system', content: [{ type: 'input_text', text: instructions }] },
        { role: 'user', content: [{ type: 'input_text', text: JSON.stringify(input) }] },
      ],
    }),
  });
  const body = await response.json() as any;
  if (!response.ok) throw new Error(body?.error?.message || `${agent} request failed.`);
  const output = body.output_text || body.output?.flatMap((item: any) => item.content || [])
    .map((item: any) => item.text || '').join('') || '';
  return { agent, model, output };
}

export async function reviewAndImplement(input: {
  goal: string;
  files?: Array<{ path: string; content: string }>;
  constraints?: string[];
}) {
  const sol = await runAgent('SOL', `أنت SOL 5.6 — دورك المراجعة ووضع خطة الإصلاح فقط.
راجع المشروع والمدخلات على مراحل Infrastructure/Code/Database/Security/Buttons/Workflow/Missing Functions/Benchmark/UAT/Regression.
أخرج JSON صحيحًا فقط بالمفاتيح: findings, plan, acceptanceCriteria, blockedRisks.
كل نتيجة يجب أن تحمل PASS أو FAIL أو FIXED أو UNVERIFIED أو NOT APPLICABLE مع دليل مختصر.
اجعل الخطة محددة بالوحدة والملف والسبب والتغيير والاختبار والمخاطر.
لا تقترح تجاوز Authentication أو Authorization أو RBAC أو RLS أو Tenant Isolation، ولا تعتبر رسالة نجاح دليل Persistence.`, input);
  const luna = await runAgent('LUNA', `أنت LUNA 5.6 — دورك تنفيذ خطة SOL داخل نطاق المشروع فقط.
استلم تقرير SOL ونفذ الإصلاحات الآمنة المحددة فيه على مستوى الملفات، ثم أخرج JSON صحيحًا فقط بالمفاتيح:
changes (path, patch, reason), tests, checkpoint, remainingRisks.
لا توسع النطاق، لا تلمس ملفات خارج الطلب، لا تعطل Authentication/Authorization/RBAC/RLS، لا تحذف Validation، ولا تخترع نجاح اختبارات أو Persistence أو Runtime UAT.
إذا تعذر التنفيذ أو التحقق فسجل UNVERIFIED بدل الادعاء.`, { request: input, solReview: sol.output });
  const finalReview = await runAgent('SOL', `أنت SOL 5.6 في بوابة المراجعة النهائية المستقلة.
تحقق من توافق تغييرات LUNA مع خطة SOL، ومن الأدلة والاختبارات وعدم وجود تجاوزات أمنية.
أخرج JSON صحيحًا فقط بالمفاتيح: approved, corrections, requiredTests, releaseNotes.
لا توافق إذا كانت اختبارات أساسية مفقودة أو كانت النتيجة مجرد اقتراح نصي بلا تنفيذ مثبت؛ استخدم UNVERIFIED عند غياب الدليل.`, { request: input, solReview: sol.output, lunaImplementation: luna.output });
  return { sol, luna, finalReview };
}
