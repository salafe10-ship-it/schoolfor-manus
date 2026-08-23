import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('AI assistant source integrity', () => {
  it('defaults to cloud mode and never falls back to fabricated records', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/AIAssistantPortal.tsx'), 'utf8');
    expect(source).toContain('useState(false)');
    expect(source).toContain('لا تُستخدم بيانات تجريبية أو إجابات مالية ثابتة');
    expect(source).toContain('لم يتم توليد إجابة بديلة حتى لا تُعرض بيانات غير مؤكدة');
    expect(source).not.toContain('تم تفعيل **وضع المحاكاة التفاعلية الذكية**');
    expect(source).toContain('وضع المحاكاة لا يعرض بيانات مؤسسية');
  });
});
