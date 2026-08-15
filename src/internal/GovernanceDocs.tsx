import { ArrowRight, Book, BookOpen, Check, ChevronRight, Clipboard, Code, Cpu, Download, FileText, HardDrive, HelpCircle, Layers, RefreshCw, RotateCw, Search, Server, Settings, ShieldCheck, Sparkles, Terminal } from 'lucide-react';
import React, { useState } from 'react';
interface GovernanceDocsProps {
  triggerNotification: (msg: string, type: 'success' | 'warning' | 'danger' | 'info') => void;
}

export default function GovernanceDocs({ triggerNotification }: GovernanceDocsProps) {
  // --- States ---
  const [activeGuide, setActiveGuide] = useState<'install' | 'ops' | 'backup' | 'upgrade' | 'changelog'>('install');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    triggerNotification('تم نسخ الأمر البرمجي إلى الحافظة! 📋', 'success');
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Changelog data
  const changelogData = [
    {
      version: 'v2.4.0-enterprise',
      date: '2026-07-11',
      title: 'إصدار حوكمة الأمان الفائق وإدارة الأرصدة والكنترول المدرسي',
      badge: 'إصدار مستقر للإنتاج',
      type: 'stable',
      items: [
        'إضافة بوابات التدقيق الفني المزدوج (Audit Trail) للمراقبة الفورية للأموال قبل وبعد التعديل.',
        'تثبيت محاكيات وعزل المستأجرين (Tenant Isolation) لربط الفروع بقاعدة بيانات فرعية مشفرة ومستقلة.',
        'دمج محرك الاستعادة للنقاط الزمنية (PITR) للرجوع بالزمن لأي دقيقة في آخر 7 أيام تلقائياً.',
        'تعزيز مطهر المدخلات وترميز المخرجات (XSS & SQL Injection Filters) لمنع هجمات الاختراق وحماية الهويات.'
      ]
    },
    {
      version: 'v2.2.0-rc1',
      date: '2026-05-18',
      title: 'إصدار الكنترول والشهادات والقيود المحاسبية التلقائية المزدوجة',
      badge: 'Release Candidate',
      type: 'rc',
      items: [
        'أتمتة القيود المحاسبية بالدفتر العام فور استلام سندات القبض أو دفع المصروفات المدرسية.',
        'حظر الدرجات وإغلاق لجان الكنترول بعد الاعتماد النهائي مع إغلاق شاشات الرصد.',
        'تحسين توافق الشاشات والهيدر مع الهواتف الذكية وتخفيض زمن تحميل لوحات البيانات بنسبة 45%.'
      ]
    },
    {
      version: 'v2.0.0-beta',
      date: '2026-02-05',
      title: 'إصدار النواة الكبرى وترقية خوارزميات المساعد الذكي AI',
      badge: 'رائد فني',
      type: 'beta',
      items: [
        'ربط المساعد الذكي بأحدث حزمة برمجية من Google @google/genai SDK لدقة التوقعات.',
        'تفعيل التقارير والرسوم البيانية التفاعلية باستخدام d3 و recharts بشكل معزول وسريع.',
        'إصلاح ثغرة مطابقة الحضور وإجراء فحص ذاتي للنظام (System Health center).'
      ]
    }
  ];

  // Dummy command snippets
  const snippets = {
    installNpm: 'npm install --include=dev\nnpm run build',
    dockerSetup: 'docker-compose up -d --build\ndocker logs -f edupro_app',
    backupCommand: 'pg_dump -h cloud-sql-pg -U db_master_user -d edupro -F c -b -v -f /backups/edupro_prod_$(date +%Y%m%d).dump',
    restoreCommand: 'pg_restore -h cloud-sql-pg -U db_master_user -d edupro -v /backups/edupro_prod_20260711_instant.dump',
    upgradeCommand: 'git pull origin main\nnpm ci\nnpm run db:migrate\nnpm run build\npm2 restart edupro'
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-right" dir="rtl">
      
      {/* Banner / Header */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-right">
        <div className="space-y-2">
          <div className="flex items-center gap-2 justify-start">
            <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase">أدلة التشغيل والمستندات</span>
            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 text-[10px] font-black px-2 py-0.5 rounded-full">جاهز للإنتاج</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">سادساً: أدلة التشغيل القياسية والجاهزية المهنية (Operational Readiness)</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-3xl text-right">
            الدليل الشامل المعتمد للمهندسين والمشرفين لتركيب وتشغيل وإدارة نظام EduPro ERP وتفادي الأخطاء البشرية. يشمل الأوامر الدقيقة لخطوات التثبيت، والتشغيل المحاسبي، والنسخ واستعادة قاعدة البيانات، وتحديث النظام وسجل الإصدارات المتكامل.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Book className="w-10 h-10 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 p-2 rounded-2xl border border-indigo-100 dark:border-indigo-900/60" />
        </div>
      </div>

      {/* Grid Menu of Guides */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* Navigation Sidebar (3 Cols) */}
        <div className="lg:col-span-3 space-y-2">
          {[
            { id: 'install', title: '1. دليل التثبيت السحابي (Installation)', icon: Terminal, desc: 'طريقة تنصيب النظام وإعدادات الخادم' },
            { id: 'ops', title: '2. دليل التشغيل والعمليات (Operations)', icon: BookOpen, desc: 'إدارة شؤون المعلمين، والطلاب والقيود' },
            { id: 'backup', title: '3. دليل النسخ والاستعادة (Backup Manual)', icon: HardDrive, desc: 'توليد واسترجاع لقطات الـ SQL' },
            { id: 'upgrade', title: '4. دليل الترقية السنوية (Upgrade Guide)', icon: RefreshCw, desc: 'كيفية تحديث الشيفرة وقواعد البيانات' },
            { id: 'changelog', title: '5. سجل التغييرات التاريخي (Changelog)', icon: FileText, desc: 'أرشيف الإصدارات والتحسينات المعتمدة' }
          ].map(guide => (
            <button
              key={guide.id}
              type="button"
              onClick={() => {
                setActiveGuide(guide.id as any);
                triggerNotification(`عرض ${guide.title}`, 'info');
              }}
              className={`w-full text-right p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                activeGuide === guide.id 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <ChevronRight className={`w-4 h-4 shrink-0 ${activeGuide === guide.id ? 'text-white' : 'text-slate-400'}`} />
              <div className="text-right">
                <p className="font-black text-xs">{guide.title}</p>
                <span className={`text-[9.5px] block mt-1 ${activeGuide === guide.id ? 'text-indigo-200' : 'text-slate-400'}`}>{guide.desc}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Dynamic Content Panel (9 Cols) */}
        <div className="lg:col-span-9 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs">
          
          {/* 1. INSTALLATION GUIDE */}
          {activeGuide === 'install' && (
            <div className="space-y-6">
              <div className="border-b border-slate-150 dark:border-slate-850 pb-3">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-indigo-500" />
                  <span>دليل التثبيت السحابي والتهيئة للإنتاج (Cloud Deployment & Installation)</span>
                </h3>
              </div>

              <div className="space-y-4 text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
                <p>
                  يتم تشغيل تطبيق EduPro ERP كأحد تطبيقات Node.js المزدوجة (React + Express) التي تدعم الحاويات السحابية المعزولة وتتصل بقاعدة بيانات PostgreSQL من خلال Cloud SQL لضمان عزل الفروع وحفظ القيود المالية دفترياً بشكل دقيق.
                </p>

                <div className="space-y-3.5">
                  <h4 className="font-black text-xs text-slate-800 dark:text-slate-100">المتطلبات الأساسية للنظام (System Prerequisites):</h4>
                  <ul className="list-disc list-inside space-y-1.5 pr-2">
                    <li>بيئة عمل <strong className="text-indigo-600 dark:text-indigo-400">Node.js v18+</strong> أو أحدث.</li>
                    <li>محرك قاعدة بيانات <strong className="text-indigo-600 dark:text-indigo-400">PostgreSQL v15+</strong> أو خدمة Cloud SQL.</li>
                    <li>أداة الحاويات <strong className="text-indigo-600 dark:text-indigo-400">Docker & Docker Compose</strong> (موصى بها لإطلاق الفروع سريعاً).</li>
                  </ul>
                </div>

                {/* Step 1: Packages install snippet */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-2.5 rounded-t-xl border-t border-x border-slate-200/60 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleCopy(snippets.installNpm, 'npm')}
                      className="text-[10px] font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-md text-indigo-600 cursor-pointer hover:bg-slate-100"
                    >
                      {copiedText === 'npm' ? 'تم النسخ!' : 'نسخ الكود'}
                    </button>
                    <span className="text-[11px] font-bold text-slate-500">1. تثبيت الحزم وبناء ملفات الإنتاج المجمعة:</span>
                  </div>
                  <pre className="p-3 bg-slate-950 text-[11px] font-mono text-indigo-300 rounded-b-xl border-b border-x border-slate-800 text-left overflow-x-auto whitespace-pre-wrap leading-normal" dir="ltr">
                    {snippets.installNpm}
                  </pre>
                </div>

                {/* Step 2: Docker compose config */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-2.5 rounded-t-xl border-t border-x border-slate-200/60 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleCopy(snippets.dockerSetup, 'docker')}
                      className="text-[10px] font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-md text-indigo-600 cursor-pointer hover:bg-slate-100"
                    >
                      {copiedText === 'docker' ? 'تم النسخ!' : 'نسخ الكود'}
                    </button>
                    <span className="text-[11px] font-bold text-slate-500">2. إطلاق البيئة المجمعة عبر Docker Compose:</span>
                  </div>
                  <pre className="p-3 bg-slate-950 text-[11px] font-mono text-indigo-300 rounded-b-xl border-b border-x border-slate-800 text-left overflow-x-auto whitespace-pre-wrap leading-normal" dir="ltr">
                    {snippets.dockerSetup}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* 2. OPERATIONS MANUAL */}
          {activeGuide === 'ops' && (
            <div className="space-y-6">
              <div className="border-b border-slate-150 dark:border-slate-850 pb-3">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  <span>دليل التشغيل وإدارة العمليات الأكاديمية والمالية (Operations Guide)</span>
                </h3>
              </div>

              <div className="space-y-5 text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
                <p>
                  يركز دليل التشغيل على ضبط سير العمل المحاسبي والرقابي، لضمان تطابق الأرصدة المالية دفترياً ومنع ارتكاب الأخطاء اليدوية في لجان الكنترول وشؤون الطلاب.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Card 1: Academic Operations */}
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-2">
                    <h4 className="font-black text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 justify-end">
                      <span>إدارة شؤون المدارس والطلاب</span>
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    </h4>
                    <p className="text-[10.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                      - <strong>إضافة الطلاب:</strong> يجب ربط كل طالب بسجل ولي الأمر والرقم الوطني لإلغاء الازدواجية دفترياً.<br/>
                      - <strong>الكنترول والدرجات:</strong> بمجرد رصد درجات لجنة الامتحان، يتوجب على المشرف النقر على "قفل واعتماد الدرجات" لفرض حظر التعديل التلقائي لضمان نزاهة وسلامة التقارير.
                    </p>
                  </div>

                  {/* Card 2: Financial Integrity */}
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-2">
                    <h4 className="font-black text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 justify-end">
                      <span>الضوابط المحاسبية وسندات الصرف</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    </h4>
                    <p className="text-[10.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                      - <strong>القيود المزدوجة:</strong> لا توجد حسابات معلقة؛ يرحل النظام القيود فور توليد الفاتورة أو إقرار سند قبض الرسوم.<br/>
                      - <strong>الحسابات العامة:</strong> يجب التحقق من توازن ميزان المراجعة قبل قفل الفترات المحاسبية الشهرية لمنع وجود فوارق نقدية بالصندوق.
                    </p>
                  </div>

                </div>

                <div className="bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/50 p-4 rounded-2xl space-y-2">
                  <p className="text-amber-800 dark:text-amber-400 font-black text-xs flex items-center gap-1.5 justify-start">
                    <HelpCircle className="w-4 h-4" />
                    <span>المراقبة الذاتية والـ Health Center:</span>
                  </p>
                  <p className="text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-200/70">
                    لمراقبة العمليات بشكل مباشر وفحص سلامة الروابط وصحة الاتصال، استخدم شاشة "مركز الصحة الفنية" من القائمة الجانبية؛ ستقوم الشاشة بتقديم تحليل ذكي عن صحة استهلاك الذاكرة وسرعة استجابة ملقمات الحوكمة.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. BACKUP & RECOVERY MANUAL */}
          {activeGuide === 'backup' && (
            <div className="space-y-6">
              <div className="border-b border-slate-150 dark:border-slate-850 pb-3">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-indigo-500" />
                  <span>دليل النسخ الاحتياطي والاستعادة واسترجاع الكوارث (Backup & Recovery Manual)</span>
                </h3>
              </div>

              <div className="space-y-4 text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
                <p>
                  تقوم سياسة الحوكمة في EduPro على مبدأ التخزين المزدوج المشفر لحماية السجلات المالية والدرجات. يجب نسخ قاعدة البيانات دورياً بنمطين: نسخ تلقائي سحابي كل ساعتين، ونسخ يدوي فوري قبل إجراء أي تعديل بنيوي أو تغيير برميجي.
                </p>

                {/* Backup bash command */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-2.5 rounded-t-xl border-t border-x border-slate-200/60 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleCopy(snippets.backupCommand, 'bCmd')}
                      className="text-[10px] font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-md text-indigo-600 cursor-pointer hover:bg-slate-100"
                    >
                      {copiedText === 'bCmd' ? 'تم النسخ!' : 'نسخ الكود'}
                    </button>
                    <span className="text-[11px] font-bold text-slate-500">أمر أرشفة وتصدير قاعدة البيانات (PostgreSQL Backup):</span>
                  </div>
                  <pre className="p-3 bg-slate-950 text-[11px] font-mono text-indigo-300 rounded-b-xl border-b border-x border-slate-800 text-left overflow-x-auto whitespace-pre-wrap leading-normal" dir="ltr">
                    {snippets.backupCommand}
                  </pre>
                </div>

                {/* Restore bash command */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-2.5 rounded-t-xl border-t border-x border-slate-200/60 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleCopy(snippets.restoreCommand, 'rCmd')}
                      className="text-[10px] font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-md text-indigo-600 cursor-pointer hover:bg-slate-100"
                    >
                      {copiedText === 'rCmd' ? 'تم النسخ!' : 'نسخ الكود'}
                    </button>
                    <span className="text-[11px] font-bold text-slate-500">أمر استعادة النسخة في حال حدوث عطل (PostgreSQL Restore):</span>
                  </div>
                  <pre className="p-3 bg-slate-950 text-[11px] font-mono text-indigo-300 rounded-b-xl border-b border-x border-slate-800 text-left overflow-x-auto whitespace-pre-wrap leading-normal" dir="ltr">
                    {snippets.restoreCommand}
                  </pre>
                </div>

                <div className="bg-rose-50/50 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-900/40 p-4 rounded-2xl">
                  <span className="text-[11px] font-black text-rose-800 dark:text-rose-400 block mb-1">⚠️ تنبيه أمني فائق الأهمية (Security Hardening Note):</span>
                  <p className="text-[10.5px] leading-relaxed text-rose-900/80 dark:text-rose-300/80">
                    تُخزن جميع ملفات النسخ الاحتياطي في سلة تخزين سحابية مغلقة (Private Cloud Storage Bucket) مشفرة بمفاتيح AES-256 تديرها سياج حماية شبكية مخصصة لمنع الاختراق أو الاستيراد من خوادم خارجية غير معتمدة فندقياً.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. UPGRADE GUIDE */}
          {activeGuide === 'upgrade' && (
            <div className="space-y-6">
              <div className="border-b border-slate-150 dark:border-slate-850 pb-3">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-indigo-500" />
                  <span>دليل الترقية السنوية وتحديث النظام (Yearly Upgrade Manual)</span>
                </h3>
              </div>

              <div className="space-y-4 text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
                <p>
                  لضمان تحديث النظام بسلاسة ودون توقف الخدمات (Zero-Downtime Deployment)، يجب اتباع تسلسل الترقية المعتمد والذي يضمن عمل الفحص التلقائي وتدقيق الشيفرة قبل الاعتماد النهائي في الإنتاج.
                </p>

                <div className="space-y-3">
                  <h4 className="font-black text-xs text-slate-800 dark:text-slate-100">خطوات التحديث المعيارية (Release Upgrade Steps):</h4>
                  <ol className="list-decimal list-inside space-y-2 pr-2">
                    <li>أخذ نسخة احتياطية فورية لقاعدة البيانات (سنداً لـ دليل البند الثالث).</li>
                    <li>سحب التحديث البرمجي الأخير من فرع المستودع الرئيسي الموثق <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600 font-mono font-bold">git pull origin main</code>.</li>
                    <li>تثبيت الحزم الجديدة وتحديث الاعتماديات مع عزل المتأثرات.</li>
                    <li>ترحيل الهيكلية وقواعد البيانات المحدثة عن طريق مشغّل الـ Migrations.</li>
                    <li>تنفيذ البناء النهائي وإعادة تشغيل الخدمة باستخدام مدراء العمليات مثل PM2 أو حاويات Docker.</li>
                  </ol>
                </div>

                {/* Upgrade CLI snippet */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-2.5 rounded-t-xl border-t border-x border-slate-200/60 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleCopy(snippets.upgradeCommand, 'uCmd')}
                      className="text-[10px] font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-md text-indigo-600 cursor-pointer hover:bg-slate-100"
                    >
                      {copiedText === 'uCmd' ? 'تم النسخ!' : 'نسخ الكود'}
                    </button>
                    <span className="text-[11px] font-bold text-slate-500">مجموعة أوامر الترقية وتحديث قواعد البيانات (Upgrade Script Sequence):</span>
                  </div>
                  <pre className="p-3 bg-slate-950 text-[11px] font-mono text-indigo-300 rounded-b-xl border-b border-x border-slate-800 text-left overflow-x-auto whitespace-pre-wrap leading-normal" dir="ltr">
                    {snippets.upgradeCommand}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* 5. CHANGELOG */}
          {activeGuide === 'changelog' && (
            <div className="space-y-6">
              <div className="border-b border-slate-150 dark:border-slate-850 pb-3">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <span>سجل الإصدارات والتحديثات التاريخية للنظام (Enterprise Changelog)</span>
                </h3>
              </div>

              <div className="space-y-6 text-xs text-right">
                
                {changelogData.map((release, i) => (
                  <div key={i} className="relative pl-0 pr-6 border-r-2 border-slate-100 dark:border-slate-800 pb-6 last:pb-0">
                    
                    {/* Timeline dot */}
                    <div className="absolute top-1 right-[-6px] w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-900" />
                    
                    <div className="bg-slate-50 dark:bg-slate-850/60 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-3 text-right">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex items-center gap-2 justify-start">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                            release.type === 'stable' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' :
                            release.type === 'rc' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600' :
                            'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
                          }`}>
                            {release.badge}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px] font-bold">{release.date}</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                          <code className="text-indigo-600 dark:text-indigo-400 font-mono text-xs sm:text-sm ml-2">{release.version}</code>
                          <span>{release.title}</span>
                        </h4>
                      </div>

                      <ul className="space-y-1.5 list-disc list-inside text-slate-600 dark:text-slate-300 font-medium pr-2">
                        {release.items.map((item, idx) => (
                          <li key={idx} className="leading-relaxed">{item}</li>
                        ))}
                      </ul>
                    </div>

                  </div>
                ))}

              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
