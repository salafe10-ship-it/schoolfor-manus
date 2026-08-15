import React, { useState } from 'react';

type PasswordRecoveryScreenProps = {
  accessToken: string;
  refreshToken: string;
  onCompleted: () => void;
};

export default function PasswordRecoveryScreen({
  accessToken,
  refreshToken,
  onCompleted
}: PasswordRecoveryScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 12) {
      setError('يجب أن تتكون كلمة المرور من 12 حرفًا أو أكثر.');
      return;
    }
    if (password !== confirmation) {
      setError('تأكيد كلمة المرور غير مطابق.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/auth/password-recovery/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, refreshToken, password })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'تعذر تحديث كلمة المرور.');
      }

      window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
      setPassword('');
      setConfirmation('');
      setMessage('تم تحديث كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.');
    } catch (requestError: any) {
      setError(requestError?.message || 'تعذر تحديث كلمة المرور.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-white" dir="rtl">
      <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl border border-amber-500/30 bg-slate-900 p-7 shadow-2xl">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-black text-amber-300">تعيين كلمة مرور جديدة</h1>
          <p className="text-sm text-slate-300">استخدم كلمة مرور جديدة لحساب EduPro.</p>
        </div>

        <label className="block space-y-2 text-sm font-bold">
          <span>كلمة المرور الجديدة</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 outline-none focus:border-amber-400"
            required
          />
        </label>

        <label className="block space-y-2 text-sm font-bold">
          <span>تأكيد كلمة المرور</span>
          <input
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 outline-none focus:border-amber-400"
            required
          />
        </label>

        {error && <p className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</p>}
        {message && <p className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-3 text-sm text-emerald-200">{message}</p>}

        {message ? (
          <button type="button" onClick={onCompleted} className="w-full rounded-lg bg-amber-500 px-4 py-3 font-black text-slate-950">
            العودة إلى تسجيل الدخول
          </button>
        ) : (
          <button type="submit" disabled={isSaving} className="w-full rounded-lg bg-amber-500 px-4 py-3 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-60">
            {isSaving ? 'جاري تحديث كلمة المرور...' : 'حفظ كلمة المرور الجديدة'}
          </button>
        )}
      </form>
    </main>
  );
}
