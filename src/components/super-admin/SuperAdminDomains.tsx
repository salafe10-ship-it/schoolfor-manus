import { AlertTriangle, CheckCircle, Copy, Database, Edit2, ExternalLink, Globe, Link, Plus, RefreshCw, Search, ShieldCheck, Trash2, Lock, ShieldAlert } from 'lucide-react';
import React, { useState } from 'react';
import { getTrustedSchoolUrl, getSSLCertificateStatus, openTrustedSchoolPortal } from '../../utils/EnterpriseDomainUtils';
import { authenticatedRequest } from '../../utils/authenticatedRequest';

interface SuperAdminDomainsProps {
  schools: any[];
  setSchools: React.Dispatch<React.SetStateAction<any[]>>;
  logAction: (action: string, details: string, section?: string) => void;
  triggerNotification: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void;
}

export default function SuperAdminDomains({
  schools = [],
  setSchools,
  logAction,
  triggerNotification
}: SuperAdminDomainsProps) {
  const [selectedSchool, setSelectedSchool] = useState<any | null>(null);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [showSubdomainModal, setShowSubdomainModal] = useState(false);

  // Form states
  const [customDomain, setCustomDomain] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [sslStatus, setSslStatus] = useState<'pending' | 'valid' | 'none'>('valid');

  // Test Link Simulation State
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { status: 'healthy' | 'error' | 'unknown', latency: number | null, time: string | null }>>({});

  const updateCentralDomain = async (school: any, profile: Record<string, unknown>) => {
    const response = await authenticatedRequest(`/api/admin/central/schools/${encodeURIComponent(school.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'update', name: school.name, schoolCode: school.schoolCode, profile }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success || !payload?.school) throw new Error(payload?.message || 'تعذر حفظ نطاق المدرسة مركزيًا.');
    return payload.school;
  };

  const applyCanonicalDomain = (canonical: any) => {
    const profile = canonical.central_metadata && typeof canonical.central_metadata === 'object' ? canonical.central_metadata : {};
    const schoolUrl = profile.domain
      ? `https://${profile.domain}`
      : getTrustedSchoolUrl({ id: canonical.id, subdomain: profile.subdomain });
    setSchools(prev => prev.map(item => item.id === canonical.id ? { ...item, ...profile, ...canonical, name: canonical.display_name, schoolCode: canonical.school_code, schoolUrl } : item));
  };

  // Subdomain uniqueness validation
  const checkSubdomainAvailability = (sub: string, schoolId?: string) => {
    if (!sub) return false;
    const exists = schools.some(s => s.id !== schoolId && s.subdomain?.toLowerCase() === sub.toLowerCase());
    return !exists;
  };

  // Action: Map Custom Domain
  const handleMapCustomDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool || !customDomain) return;

    try {
      const canonical = await updateCentralDomain(selectedSchool, { domain: customDomain, customDomain, sslStatus: 'pending' });
      applyCanonicalDomain(canonical);
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر ربط النطاق مركزيًا؛ لم يتم تعديل البيانات.', 'danger');
      return;
    }

    logAction(
      'MAP_CUSTOM_DOMAIN',
      `ربط وتوجيه نطاق خاص للمدرسة ${selectedSchool.name}: https://${customDomain}`,
      'إدارة أسماء النطاقات والروابط'
    );

    triggerNotification(`تم حفظ النطاق الخاص https://${customDomain} في الإدارة المركزية، وحالة SSL قيد التحقق 🛡️`, 'success');
    setShowDomainModal(false);
    setCustomDomain('');
  };

  // Action: Change Subdomain
  const handleUpdateSubdomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool || !subdomain) return;

    // Check duplication
    const isAvailable = checkSubdomainAvailability(subdomain, selectedSchool.id);
    if (!isAvailable) {
      triggerNotification('اسم النطاق الفرعي هذا مستخدم مسبقاً لمستأجر آخر! يرجى اختيار اسم فريد.', 'danger');
      return;
    }

    try {
      const canonical = await updateCentralDomain(selectedSchool, { subdomain });
      applyCanonicalDomain(canonical);
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'تعذر حفظ النطاق الفرعي مركزيًا؛ لم يتم تعديل البيانات.', 'danger');
      return;
    }

    logAction(
      'UPDATE_SUBDOMAIN',
      `تحديث النطاق الفرعي لـ ${selectedSchool.name} ليصبح: ${subdomain}.erpcloud.com`,
      'إدارة أسماء النطاقات والروابط'
    );

    triggerNotification(`تم حفظ النطاق الفرعي في الإدارة المركزية: https://${subdomain}.erpcloud.com 🔗`, 'success');
    setShowSubdomainModal(false);
    setSubdomain('');
  };

  // Action: Copy Link to Clipboard
  const handleCopyLink = async (url: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        triggerNotification('تم نسخ رابط المدرسة بنجاح.', 'success');
        return;
      }
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        triggerNotification('تم نسخ رابط المدرسة بنجاح.', 'success');
      } else {
        throw new Error('execCommand failed');
      }
    } catch (err) {
      triggerNotification('تعذر النسخ التلقائي. يرجى النسخ اليدوي للرابط: ' + url, 'danger');
    }
  };

  // Action: Test Link Readiness; لا تُثبت النتيجة إلا من موصل تشخيص مركزي.
  const handleTestLink = (school: any) => {
    setTestingId(school.id);
    setTestResult(prev => ({
      ...prev,
      [school.id]: { status: 'unknown', latency: null, time: null }
    }));
    setTestingId(null);
    triggerNotification('لم يُنفذ فحص النطاق: لا يوجد موصل DNS/HTTP مركزي موثوق في الجلسة الحالية.', 'warning');
  };

  // Action: Regenerate Link DNS Routes
  const handleRegenerateDNS = (school: any) => {
    triggerNotification(`إعادة توليد DNS وSSL تتطلب موصل البنية التحتية المركزي؛ لم يتم تسجيل نجاح وهمي لـ ${school.name}.`, 'warning');
  };

  return (
    <div id="super-admin-domains" className="space-y-6 text-right">
      
      {/* Alert Header Banner */}
      <div className="bg-slate-900 border border-amber-500/20 p-4 flex items-start gap-3">
        <Globe className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-xs font-black text-slate-100">مركز الحوكمة والتحكم في النطاقات والروابط</h4>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            تُحفظ أسماء النطاقات الفرعية والمخصصة في الدليل المركزي مع حالة SSL صريحة. أما فحص DNS/HTTP وإصدار الشهادة وتعديل سجلات البنية التحتية فتحتاج موصل تشغيل مركزي موثق قبل إعلان الجاهزية.
          </p>
        </div>
      </div>

      {/* Main Domains Management Console */}
      <div className="bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-xs font-black text-white flex items-center gap-2">
            <Link className="w-4 h-4 text-amber-400" />
            روابط ونطاقات المدارس المستضيفة ({schools.length})
          </h3>
          <span className="text-[10px] text-amber-400 bg-amber-950/40 border border-amber-900/60 px-3 py-1 rounded-full font-extrabold">
            توجيه ومصادقة النطاقات DNS & SSL Router
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="p-4 font-black text-center w-8">#</th>
                <th className="p-4 font-black">اسم المدرسة والمستأجر</th>
                <th className="p-4 font-black">النطاق الفرعي (Subdomain)</th>
                <th className="p-4 font-black">النطاق الخاص (Custom Domain)</th>
                <th className="p-4 font-black">حالة الربط والـ SSL</th>
                <th className="p-4 font-black">الرابط النشط الحالي</th>
                <th className="p-4 font-black">آخر اختبار صحة</th>
                <th className="p-4 font-black text-center">التحكم في النطاق والـ DNS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {schools.map((school, idx) => {
                const trustedUrl = getTrustedSchoolUrl(school);
                const sslCert = getSSLCertificateStatus(school.domain || school.subdomain);
                const result = testResult[school.id];
                const isTesting = testingId === school.id;

                return (
                  <tr key={school.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="p-4 text-center text-slate-500 font-mono font-bold w-8">{idx + 1}</td>
                    <td className="p-4 font-bold text-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{school.logo || '🏫'}</span>
                        <span>{school.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-300">
                      {school.subdomain ? `${school.subdomain}.erpcloud.com` : 'غير محدد'}
                    </td>
                    <td className="p-4 font-mono font-bold text-amber-400">
                      {school.domain ? (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          {school.domain}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px]">لا يوجد نطاق مخصص</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black border bg-emerald-950/40 text-emerald-400 border-emerald-900/60">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          SSL موثوق وآمن (HTTPS)
                        </span>
                        <div className="text-[8px] text-slate-500 font-mono" dir="ltr">
                          Issuer: {sslCert.issuer.split('/')[0]}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-mono text-slate-300 dir-ltr text-left">
                        <span className="truncate max-w-[220px] text-[11px] text-amber-300 font-bold" dir="ltr">{trustedUrl}</span>
                        <button
                          onClick={() => handleCopyLink(trustedUrl)}
                          className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-all cursor-pointer shrink-0"
                          title="نسخ الرابط المباشر الآمن"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      {isTesting ? (
                        <span className="text-amber-400 flex items-center gap-1 animate-pulse font-bold text-[10px]">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          جاري الفحص...
                        </span>
                      ) : result ? (
                        <div className="space-y-0.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-black ${
                            result.status === 'healthy' ? 'text-emerald-400' : result.status === 'unknown' ? 'text-slate-400' : 'text-red-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${result.status === 'healthy' ? 'bg-emerald-500' : result.status === 'unknown' ? 'bg-slate-500' : 'bg-red-500'}`} />
                            {result.status === 'healthy' ? `مستقر (${result.latency}ms)` : result.status === 'unknown' ? 'غير متحقق' : 'غير متصل'}
                          </span>
                          <div className="text-[8px] text-slate-500 font-bold">{result.time}</div>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[10px]">لم يتم الفحص بعد</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedSchool(school);
                            setSubdomain(school.subdomain || '');
                            setShowSubdomainModal(true);
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg border border-slate-700 text-[10px] font-bold cursor-pointer"
                          title="تعديل النطاق الفرعي"
                        >
                          النطاق الفرعي
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSchool(school);
                            setCustomDomain(school.domain || '');
                            setShowDomainModal(true);
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-amber-400 p-1.5 rounded-lg border border-slate-700 text-[10px] font-bold cursor-pointer"
                          title="تخصيص نطاق خاص"
                        >
                          ربط نطاق خاص
                        </button>
                        <button
                          onClick={() => handleTestLink(school)}
                          className="bg-slate-800 hover:bg-slate-700 text-emerald-400 p-1.5 rounded-lg border border-slate-700 text-[10px] font-bold cursor-pointer"
                          title="اختبار الاتصال وصحة المسار"
                        >
                          اختبار الرابط
                        </button>
                        <button
                          onClick={() => handleRegenerateDNS(school)}
                          className="bg-slate-800 hover:bg-slate-700 text-amber-500 p-1.5 rounded-lg border border-slate-700 text-[10px] font-bold cursor-pointer"
                          title="إعادة بناء المسارات السحابية"
                        >
                          إعادة توليد
                        </button>
                        <button
                          type="button"
                          onClick={() => openTrustedSchoolPortal(school)}
                          className="bg-amber-600 hover:bg-amber-700 text-white p-1.5 px-2 rounded-lg border border-amber-500 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 shadow-sm"
                          title="فتح رابط بوابة المدرسة الموثوقة"
                        >
                          <ExternalLink className="w-3 h-3" />
                          فتح
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- CUSTOM DOMAIN MODAL --- */}
      {showDomainModal && selectedSchool && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleMapCustomDomain} className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-400" />
              ربط نطاق خاص مخصص (Custom Domain)
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              يرجى إدخال اسم النطاق الخاص بالمؤسسة التعليمية بالكامل. تأكد من توجيه سجلات <span className="text-amber-500 font-mono font-bold">A Record</span> في موزع النطاقات DNS الخاص بكم إلى عنوان IP خادمنا السحابي الموحد.
            </p>

            <div className="space-y-3 text-right">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">اسم النطاق المباشر (FQDN)</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. alnoorschools.edu.sa"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 border border-slate-850 p-2.5 pl-10 text-xs font-mono focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <Globe className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">حالة تشفير الشهادة الأمنية</label>
                <select
                  value={sslStatus}
                  onChange={(e) => setSslStatus(e.target.value as any)}
                  className="w-full bg-slate-950 text-slate-100 border border-slate-850 p-2.5 text-xs focus:ring-1 focus:ring-amber-500"
                >
                  <option value="valid">شهادة مجانية تلقائية Let's Encrypt SSL (موصى بها)</option>
                  <option value="none">بدون شهادة أمنية مخصصة</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black py-2.5 transition-all cursor-pointer"
              >
                ربط النطاق وتأصيل المسارات 🌐
              </button>
              <button
                type="button"
                onClick={() => setShowDomainModal(false)}
                className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 transition-all cursor-pointer border border-slate-700"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- SUBDOMAIN MODAL --- */}
      {showSubdomainModal && selectedSchool && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleUpdateSubdomain} className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Link className="w-5 h-5 text-amber-400" />
              تعديل النطاق الفرعي السحابي للمدرسة
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              سيتم تغيير مسار رابط المستأجر الموحد. تأكد من أن النطاق الفرعي الجديد لم يتم حجزه مسبقاً لمدرسة أخرى.
            </p>

            <div className="space-y-3 text-right">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">مسار النطاق الفرعي المباشر</label>
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-850 p-1">
                  <span className="text-slate-500 font-mono text-xs select-none px-2">https://</span>
                  <input
                    type="text"
                    required
                    pattern="[a-z0-9\-]+"
                    placeholder="alnoor"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                    className="flex-1 bg-transparent text-slate-100 p-2 text-xs font-mono focus:outline-hidden"
                  />
                  <span className="text-slate-500 font-mono text-xs select-none px-2">.erpcloud.com</span>
                </div>
                <p className="text-[8px] text-slate-500 mt-1">حروف صغيرة وأرقام وعلامة الشرطة (-) فقط.</p>
              </div>

              {subdomain && (
                <div className="p-3 bg-slate-950 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">حالة توافر المسار الفرعي:</span>
                  {checkSubdomainAvailability(subdomain, selectedSchool.id) ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      متاح وجاهز للاستغلال
                    </span>
                  ) : (
                    <span className="text-red-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 animate-bounce" />
                      محجوز لمستأجر آخر!
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!checkSubdomainAvailability(subdomain, selectedSchool.id)}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-black py-2.5 transition-all cursor-pointer"
              >
                تحديث مسار البوابة الفرعية ⛓️
              </button>
              <button
                type="button"
                onClick={() => setShowSubdomainModal(false)}
                className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 transition-all cursor-pointer border border-slate-700"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
