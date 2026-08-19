import { ChevronDown, Database, MessageSquare, Send, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnterpriseLogger } from '../database/services/EnterpriseLogger';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getTrustedAccessToken } from '../utils/auth';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export default function AIAssistantPortal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(true); // Default to simulation mode as requested
  const [panelSize, setPanelSize] = useState<'md' | 'lg' | 'xl'>('md'); // Add three dynamic sizing state (Medium, Large, Extra Large)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'مرحباً بك! أنا مساعدك الذكي لنظام سحاب.\n\nلقد تم تفعيل **وضع المحاكاة التفاعلية الذكية** (يعمل محلياً وفورياً).\n\nيمكنك الاستفسار عن أي شيء يخص:\n1. **البيانات والتقارير الفعلية**: مثل سجلات الطلاب، درجات الامتحانات والنتائج، المعلمين والموظفين، الرسوم المالية والفواتير، حركة المستودعات والعهد، باصات النقل، أو سجل الرقابة والعمليات.\n2. **طريقة استخدام النظام**: مثل كيفية الحفظ، البحث، الطباعة، أو كيفية عمل الشاشات المختلفة.\n\nتفضل بطرح سؤالك وسأجيبك فوراً بدقة وموثوقية متناهية.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isLoading, isOpen]);

  // Intelligent client-side response simulation for Cloud School ERP (سحاب)
  const getSimulatedResponse = (query: string): string => {
    const clean = query.trim().toLowerCase();

    // 1. Outside scope check
    const outsideKeywords = [
      'من هو رئيس', 'ما هي عاصمة', 'كيف تبرمج', 'الطقس اليوم', 'ترجمة', 'فلسفة', 'اكواد',
      'برمجة', 'أفضل أكلة', 'معلومات عامة', 'أين يقع', 'ما هو الذكاء', 'سعر الدولار', 'من خلق',
      'كرة القدم', 'رياضة', 'اخبار', 'سياسة', 'اقتصاد'
    ];
    if (outsideKeywords.some(kw => clean.includes(kw))) {
      return "هذا السؤال خارج نطاق النظام، ولا أستطيع الإجابة عنه.";
    }

    // 2. School / Branch Information
    if (clean.includes('فرع') || clean.includes('فروع') || clean.includes('مدرسة') || clean.includes('مدارس') || clean.includes('مجمع')) {
      if (clean.includes('مدير') || clean.includes('مسؤول')) {
        if (clean.includes('نرجس')) {
          return "مدير فرع النرجس هو **أ. أحمد العتيبي**.";
        }
        if (clean.includes('ياسمين')) {
          return "مديرة فرع الياسمين هي **أ. سارة الحربي**.";
        }
        if (clean.includes('ملقا')) {
          return "مدير فرع الملقا هو **أ. عبد العزيز الغامدي**.";
        }
      }
      return "الفروع والمدارس المسجلة بالمجمع الأكاديمي سحاب:\n\n| اسم الفرع/المدرسة | المدير المسؤول | عدد المعلمين | عدد الفصول |\n| :--- | :--- | :--- | :--- |\n| فرع النرجس (بنين) | أ. أحمد العتيبي | 14 معلماً | 8 فصول |\n| فرع الياسمين (بنات) | أ. سارة الحربي | 18 معلمة | 10 فصول |\n| فرع الملقا (ابتدائي) | أ. عبد العزيز الغامدي | 12 معلماً | 6 فصول |";
    }

    // 3. Students Info
    if (clean.includes('طالب') || clean.includes('طلاب') || clean.includes('سارة') || clean.includes('محمد') || clean.includes('أحمد') || clean.includes('ريم')) {
      if (clean.includes('عدد') || clean.includes('كم') || clean.includes('كم عدد')) {
        return "إجمالي السجلات المطابقة:\nعدد الطلاب المقيدين في النظام هو **4 طلاب** مسجلين بالمرحلة الثانوية.";
      }
      if (clean.includes('ريم') || clean.includes('القحطاني')) {
        return "بيانات الطالبة ريم القحطاني:\n• رقم القيد: **S1004**\n• الصف: **الأول الثانوي**\n• الحي السكني: **حي الملقا**\n• حالة الرسوم: **مسددة بالكامل (4,500 ريال)**";
      }
      if (clean.includes('محمد') || clean.includes('عبد الله')) {
        return "بيانات الطالب محمد عبد الله:\n• رقم القيد: **S1001**\n• الصف: **الأول الثانوي**\n• الحي السكني: **حي الياسمين**\n• حالة الرسوم: **مسددة جزئياً (المتبقي: 1,500 ريال)**";
      }
      if (clean.includes('سارة') || clean.includes('الحربي')) {
        return "بيانات الطالبة سارة الحربي:\n• رقم القيد: **S1003**\n• الصف: **الأول الثانوي**\n• الحي السكني: **حي الياسمين**\n• حالة الرسوم: **مستحقة وغير مدفوعة (3,500 ريال)**";
      }
      return "قائمة الطلاب المقيدين بالفصل الأول الثانوي وعناوينهم:\n\n| رقم القيد | اسم الطالب | الصف الدراسي | الحي السكني | حالة الرسوم |\n| :--- | :--- | :--- | :--- | :--- |\n| S1001 | محمد عبد الله | الأول الثانوي | حي الياسمين | مسددة جزئياً |\n| S1002 | أحمد العتيبي | الأول الثانوي | حي النرجس | مسددة بالكامل |\n| S1003 | سارة الحربي | الأول الثانوي | حي الياسمين | مستحقة وغير مدفوعة |\n| S1004 | ريم القحطاني | الأول الثانوي | حي الملقا | مسددة بالكامل |";
    }

    // 4. Teachers & Employees Info
    if (clean.includes('معلم') || clean.includes('معلمين') || clean.includes('مدرس') || clean.includes('مدرسين') || clean.includes('موظف') || clean.includes('موظفين') || clean.includes('رواتب') || clean.includes('خالد') || clean.includes('عبد الرحمن') || clean.includes('يوسف')) {
      if (clean.includes('عدد') || clean.includes('كم') || clean.includes('كم عدد')) {
        return "إجمالي السجلات المطابقة:\nعدد المعلمين والكادر التعليمي المسجل هو **3 معلمين** رئيسيين.";
      }
      return "المعلمون وتخصصاتهم ورواتبهم المسجلة في قاعدة بيانات سحاب:\n\n| اسم المعلم/الموظف | التخصص | الراتب الشهري | حالة الحضور اليوم |\n| :--- | :--- | :--- | :--- |\n| أ. خالد الغامدي | رياضيات | 12,000 ريال | حاضر |\n| أ. عبد الرحمن الشمري | فيزياء | 11,500 ريال | حاضر |\n| أ. يوسف المطيري | كيمياء | 10,800 ريال | غائب |";
    }

    // 5. Invoices & financials
    if (clean.includes('فاتورة') || clean.includes('فواتير') || clean.includes('رسوم') || clean.includes('مالية') || clean.includes('مستحق') || clean.includes('رصيد') || clean.includes('حساب')) {
      return "الفواتير والرسوم المستحقة في كشف الحساب المالي الموحد:\n\n| رقم الفاتورة | اسم الطالب | الرسوم المستحقة | حالة السداد | تاريخ الاستحقاق |\n| :--- | :--- | :--- | :--- | :--- |\n| INV-2026-001 | محمد عبد الله | 5,000 ريال | مسدد جزئياً | 2026-07-15 |\n| INV-2026-002 | أحمد العتيبي | 4,200 ريال | مسددة بالكامل | 2026-06-20 |\n| INV-2026-003 | سارة الحربي | 3,500 ريال | غير مدفوعة | 2026-08-01 |\n| INV-2026-004 | ريم القحطاني | 4,500 ريال | مسددة بالكامل | 2026-06-25 |";
    }

    // 6. Buses & Routes
    if (clean.includes('باص') || clean.includes('باصات') || clean.includes('حافلة') || clean.includes('حافلات') || clean.includes('سائق') || clean.includes('سائقين') || clean.includes('نقل') || clean.includes('مسار') || clean.includes('خطوط')) {
      return "خطوط حافلات النقل المدرسي والمسارات النشطة وصيانتها:\n\n| رقم الحافلة | الحي السكني | اسم السائق | حالة الصيانة والترخيص |\n| :--- | :--- | :--- | :--- |\n| BUS-88 | حي الياسمين | أبو فهد | ممتازة - مرخصة |\n| BUS-92 | حي النرجس | أبو ماجد | ممتازة - مرخصة |\n| BUS-45 | حي الملقا | أبو سارة | تحت الصيانة الدورية |";
    }

    // 7. Inventory & Assets
    if (clean.includes('عهد') || clean.includes('أصول') || clean.includes('مستودع') || clean.includes('مستودعات') || clean.includes('مخزن') || clean.includes('مخازن') || clean.includes('جرد') || clean.includes('كتب') || clean.includes('شاشة') || clean.includes('أجهزة')) {
      return "أصول ومواد العهد المسجلة بالمستودعات والمخازن:\n\n| اسم المادة/الأصل | الكمية | مكان التواجد الحالي | حالة العهدة |\n| :--- | :--- | :--- | :--- |\n| أجهزة كمبيوتر المحمول | 45 | مختبر الحاسب الآلي | عهدة قسم التقنية |\n| شاشات تفاعلية ذكية | 12 | الفصول الدراسية | عهدة إدارة التجهيزات |\n| كتب دراسية (الصف الأول الثانوي) | 350 | المستودع المركزي | عهدة أمين المستودع |";
    }

    // 8. Audit logs
    if (clean.includes('سجل العمليات') || clean.includes('الرقابة') || clean.includes('عمليات') || clean.includes('audit') || clean.includes('سكيورتي') || clean.includes('أمان')) {
      return "آخر العمليات والرقابة الأمنية المسجلة بالتاريخ والوقت:\n\n| الوقت | المستخدم | نوع الإجراء | تفاصيل العملية |\n| :--- | :--- | :--- | :--- |\n| 10:24 ص | مدير النظام | إضافة طالب | تم تسجيل الطالب ريم القحطاني بالفصل الأول الثانوي |\n| 09:15 ص | المحاسب | إصدار فاتورة | تم إصدار فاتورة رسوم دراسية بقيمة 3,500 ريال |\n| 08:30 ص | مسؤول القبول | تعديل ملف | تم تعديل العنوان السكني للطالب محمد عبد الله |\n| 08:00 ص | النظام | فحص أمني | تم التحقق من أمن قواعد البيانات وصلاحيات الوصول |";
    }

    // 9. Exams / Grades
    if (clean.includes('امتحان') || clean.includes('درجة') || clean.includes('درجات') || clean.includes('نتائج') || clean.includes('شهادة') || clean.includes('شهادات')) {
      return "جدول الامتحانات والدرجات المسجلة:\n\n| المادة الدراسية | موعد الامتحان | الملاحظ/المراقب | حالة رصد الدرجات |\n| :--- | :--- | :--- | :--- |\n| رياضيات (1) | 2026-06-15 | أ. خالد الغامدي | تم الرصد والاعتماد |\n| فيزياء (1) | 2026-06-17 | أ. عبد الرحمن الشمري | تم الرصد والاعتماد |\n| كيمياء (1) | 2026-06-19 | أ. يوسف المطيري | معلق - قيد المراجعة |";
    }

    // 10. System Usage Guidance (Rule 2)
    if (
      clean.includes('كيف') || 
      clean.includes('شرح') || 
      clean.includes('طريقة') || 
      clean.includes('خطوات') || 
      clean.includes('زر') || 
      clean.includes('شاشة') || 
      clean.includes('شاشات') || 
      clean.includes('استخدام') ||
      clean.includes('أين أجد')
    ) {
      if (clean.includes('حفظ') || clean.includes('حفظ البيانات')) {
        return "لحفظ البيانات في أي شاشة:\nانقر فوق زر **حفظ** الأخضر المتواجد دائماً أسفل يسار النماذج، وسيتم التخزين والتحديث فوراً في قاعدة البيانات مع تسجيل الإجراء في سجل العمليات.";
      }
      if (clean.includes('بحث') || clean.includes('البحث')) {
        return "للبحث في النظام:\nاستخدم حقل البحث السريع المتواجد في أعلى الشاشة (مثلاً في شؤون الطلاب أو الحسابات) واكتب الاسم أو رقم القيد للفلترة الفورية.";
      }
      if (clean.includes('طباعة') || clean.includes('تصدير') || clean.includes('pdf') || clean.includes('csv')) {
        return "لطباعة أو تصدير التقارير:\nتوجه إلى الشاشة المعنية (مثل تقارير الحسابات أو الشهادات)، ثم انقر على زر **تصدير PDF** أو **تصدير CSV** في شريط الأدوات العلوي للتحميل الفوري.";
      }
      if (clean.includes('امتحان') || clean.includes('امتحانات') || clean.includes('درجات') || clean.includes('نتائج') || clean.includes('شهادة') || clean.includes('شهادات')) {
        return "خطوات رصد الدرجات وإعداد نتائج الامتحانات:\n1. افتح شاشة **الامتحانات والدرجات** من القائمة الجانبية.\n2. اختر الصف الدراسي والمادة واللجنة المراد رصدها.\n3. قم بإدخال درجات الطلاب يدوياً في الخانات المتاحة.\n4. اضغط على زر **حفظ ورصد** لتوليد الشهادات والمعدلات فوراً.";
      }
      if (clean.includes('باص') || clean.includes('باصات') || clean.includes('نقل') || clean.includes('حافلة') || clean.includes('حافلات')) {
        return "خطوات إدارة مسارات وحافلات النقل:\n1. ادخل إلى شاشة **باصات النقل**.\n2. ستظهر لك قائمة بكافة الحافلات المتاحة والحي المرتبط بها وسائقيها وحالة الصيانة.\n3. يمكنك تعديل مسار أي حافلة أو إضافة حافلة جديدة عبر النقر على زر 'إضافة حافلة'.";
      }
      if (clean.includes('موظف') || clean.includes('موظفين') || clean.includes('رواتب') || clean.includes('معلم') || clean.includes('معلمين') || clean.includes('hr')) {
        return "إدارة شؤون الموظفين والمعلمين (HR):\n1. من القائمة الجانبية، اختر شاشة **الموظفون والمعلمون**.\n2. يعرض النظام قوائم المعلمين وتخصصاتهم وحضورهم ورواتبهم.\n3. يمكنك مراجعة وتقييم أداء المعلمين وإدارة مستحقاتهم المالية بيسر.";
      }
      if (clean.includes('مستودع') || clean.includes('مستودعات') || clean.includes('عهد') || clean.includes('أصول') || clean.includes('مخزن') || clean.includes('مخازن')) {
        return "كيفية إدارة المستودعات والعهد المدرسية:\n1. انتقل لشاشة **المستودعات والعهد**.\n2. تعرض القائمة كافة المواد المخزنة (أجهزة، كتب، تفاعلية).\n3. يتيح لك النظام فلترة العهد حسب القسم أو الغرفة لضمان عدم ضياع الأصول.";
      }
      if (clean.includes('حضور') || clean.includes('غياب') || clean.includes('انصراف')) {
        return "خطوات تسجيل حضور وغياب الطلاب:\n1. انتقل لشاشة **الحضور والانصراف** من القائمة.\n2. حدد الصف والشعبة المطلوبة اليوم.\n3. حدد حالة كل طالب (حاضر، غائب، متأخر).\n4. انقر على **حفظ وتحضير** لإرسال إشعارات غياب فورية لأولياء الأمور.";
      }
      if (clean.includes('فرع') || clean.includes('فروع') || clean.includes('مدرسة') || clean.includes('مدارس')) {
        return "إدارة المدارس والفروع:\nانتقل لشاشة **الفروع والمدارس** في الأعلى لمراجعة الهيكل الأكاديمي للمؤسسة، الفروع المعتمدة، وأسماء المدراء الإداريين المسؤولين عن كل فرع.";
      }
      if (clean.includes('سجل العمليات') || clean.includes('الرقابة') || clean.includes('عمليات') || clean.includes('أمان')) {
        return "مراجعة سجل العمليات والرقابة الأمنية:\nافتح شاشة **سجل العمليات والرقابة** لمشاهدة جدول زمني مفصل وموثق بكافة الإجراءات التي تمت داخل النظام، شاملة الوقت، واسم المستخدم، ونوع العملية المنفذة لدعم الشفافية.";
      }
      
      // Default generic usage explanation
      return "للاستفادة من نظام سحاب لإدارة المدارس:\n• استخدم **القائمة الجانبية** للتنقل بين الوحدات (شؤون الطلاب، الامتحانات، الحسابات المالية، المستودعات، الحافلات، حضور وغياب، الموظفون).\n• يدعم النظام الطباعة المباشرة، تصدير ملفات Excel/CSV، وإرسال إشعارات فورية لأولياء الأمور.";
    }

    // 11. Unrequested features
    const featuresUnsupported = ['تواصل', 'دردشة', 'ذكاء اصطناعي مخصص', 'تعديل بيانات', 'حذف طالب', 'تغيير كلمة المرور', 'تغيير الراتب'];
    if (featuresUnsupported.some(f => clean.includes(f))) {
      return "هذه الوظيفة غير متوفرة في الإصدار الحالي من النظام.";
    }

    // 12. Default
    return "لا توجد بيانات مطابقة في قاعدة البيانات.";
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = input.trim();
    if (!query || isLoading) return;

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // If we are in Simulation Mode, trigger immediate client-side simulation response (with typing delay)
    if (isSimulationMode) {
      setTimeout(() => {
        const simResponseText = getSimulatedResponse(query);
        const assistantMsg: Message = {
          id: `assistant-sim-${Date.now()}`,
          sender: 'assistant',
          text: simResponseText,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMsg]);
        setIsLoading(false);
      }, 900);
      return;
    }

    // Otherwise try reaching real API
    try {
      const token = getTrustedAccessToken();
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ prompt: query })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'فشل الاتصال بالمساعد الذكي.');
      }

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: (data && data.success && data.data ? data.data.text : data.text) || 'لا توجد بيانات مطابقة في قاعدة البيانات.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      EnterpriseLogger.warn('AI Cloud call failed. Falling back to high-fidelity local simulator.', "AIAssistantPortal", { details: err });
      
      // Since API failed, immediately fallback to local simulation response gracefully so the app never hangs
      setTimeout(() => {
        const simResponseText = getSimulatedResponse(query);
        const assistantMsg: Message = {
          id: `assistant-fallback-${Date.now()}`,
          sender: 'assistant',
          text: `💡 (ملاحظة: تعذر الاتصال بالخادم، تم تفعيل الإجابة الذكية من محاكي سحاب المحلي)\n\n${simResponseText}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMsg]);
        setIsLoading(false);
      }, 700);
    } finally {
      // In cloud mode, if successful, we set loading to false. In fallback mode, timeout sets it to false.
      if (!isSimulationMode) {
        // Wait briefly for safety
        setTimeout(() => setIsLoading(false), 800);
      }
    }
  };

  const clearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: 'تم مسح المحادثة السابقة بنجاح. كيف يمكنني مساعدتك اليوم؟',
        timestamp: new Date()
      }
    ]);
    setError(null);
  };

  const triggerSampleQuery = (query: string) => {
    setInput(query);
  };

  const sampleQueries = [
    { title: 'الطلاب المقيدون بالصف الأول', query: 'عرض قائمة الطلاب المقيدين بالفصل الأول الثانوي' },
    { title: 'رواتب وتخصصات المعلمين', query: 'كم عدد المعلمين وما هي تخصصاتهم ورواتبهم؟' },
    { title: 'كيفية استخدام شاشات النظام', query: 'كيف أستخدم شاشات النظام وما هي شاشة الامتحانات والدرجات؟' },
    { title: 'الفواتير المستحقة غير المدفوعة', query: 'عرض الفواتير المستحقة غير المدفوعة بالتفصيل' },
    { title: 'أصول المستودعات والعهد المدرسية', query: 'عرض المواد المسجلة في المستودعات والمخازن مع كمياتها ومكان تواجدها' },
    { title: 'كيف أقوم بطباعة التقارير؟', query: 'كيف أستطيع الحفظ أو البحث أو الطباعة للشهادات؟' }
  ];

  // Helper function to render markdown-like structures (especially tables) beautifully
  const renderMessageContent = (text: string) => {
    // Check if the text contains markdown tables (lines starting with pipes)
    if (text.includes('|') && text.includes('-')) {
      const lines = text.split('\n');
      const elements: React.ReactNode[] = [];
      let tableRows: string[][] = [];
      let isInsideTable = false;

      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          isInsideTable = true;
          const cells = trimmed.split('|').map(c => c.trim()).slice(1, -1);
          // Skip the separator line like |---|---|
          if (cells.every(c => c.startsWith('-') || c === '')) {
            return;
          }
          tableRows.push(cells);
        } else {
          if (isInsideTable && tableRows.length > 0) {
            // Render the table we accumulated
            const headers = tableRows[0];
            const rows = tableRows.slice(1);
            elements.push(
              <div key={`table-${idx}`} className="overflow-x-auto my-3 border border-slate-800 bg-slate-950/60 shadow-lg">
                <table className="w-full text-right text-xs font-sans border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-emerald-400">
                      {headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 text-right font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {rows.map((row, ri) => (
                      <tr key={ri} className="hover:bg-slate-900/30 transition-colors">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-3 py-2 whitespace-nowrap">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
            tableRows = [];
            isInsideTable = false;
          }
          if (trimmed) {
            elements.push(<p key={`text-${idx}`} className="mb-2 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{trimmed}</p>);
          }
        }
      });

      // Catch table at the end
      if (isInsideTable && tableRows.length > 0) {
        const headers = tableRows[0];
        const rows = tableRows.slice(1);
        elements.push(
          <div key="table-end" className="overflow-x-auto my-3 border border-slate-800 bg-slate-950/60 shadow-lg">
            <table className="w-full text-right text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-emerald-400">
                  {headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-right font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {rows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-slate-900/30 transition-colors">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 whitespace-nowrap">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      return <div className="space-y-1">{elements}</div>;
    }

    // Basic markdown support for bold "**"
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
      <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-emerald-400">{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </p>
    );
  };

  return (
    <motion.div 
      id="ai_assistant_floating_root" 
      className="fixed bottom-6 left-6 z-[9999] font-sans touch-none cursor-grab active:cursor-grabbing" 
      dir="rtl"
      drag
      dragMomentum={false}
      dragElastic={0.05}
    >
      {/* Floating Action Button (Beautiful Bubble with Label) */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05, y: -3 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 px-5 flex items-center justify-center gap-2.5 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 text-white rounded-[28px] rounded-bl-[4px] shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-[#dfb55a]/60 hover:border-[#dfb55a] transition-all cursor-pointer select-none group relative"
        title="المساعد الذكي (AI) - اسحب للتحريك"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-[28px] rounded-bl-[4px] opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition-colors animate-pulse" />
        </div>
        <span className="relative text-xs font-black tracking-wide text-slate-100 group-hover:text-amber-300 transition-colors font-sans flex items-center gap-1.5">
          <span>المساعد الذكي</span>
          <span className="text-[9px] text-slate-400 font-normal opacity-70">(اسحب)</span>
        </span>
        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping absolute -top-0.5 -right-0.5" />
      </motion.button>

      {/* Floating Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className={`absolute bottom-20 left-0 flex flex-col rounded-3xl border border-slate-800 bg-slate-950/95 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden text-right transition-all duration-300 ${
              panelSize === 'md' ? 'w-96 md:w-[480px] h-[620px] max-h-[calc(100vh-120px)] max-w-[calc(100vw-32px)]' :
              panelSize === 'lg' ? 'w-[92vw] md:w-[720px] h-[740px] max-h-[calc(100vh-100px)] max-w-[calc(100vw-32px)]' :
              'w-[96vw] md:w-[980px] h-[850px] max-h-[calc(100vh-80px)] max-w-[calc(100vw-32px)]'
            }`}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-[#dfb55a]/10 border border-[#dfb55a]/30 rounded-xl">
                  <Sparkles className="w-5 h-5 text-[#dfb55a]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-100">المستكشف الذكي لنظام سحاب</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <p className="text-[10px] text-slate-400 font-bold">مستشعر البيانات وحوكمة النظام نشط</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Size toggle group */}
                <div className="flex items-center bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 text-[10px] font-sans ml-1">
                  <button
                    type="button"
                    onClick={() => setPanelSize('md')}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                      panelSize === 'md' 
                        ? 'bg-[#dfb55a] text-slate-950 font-bold shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                    title="الحجم المتوسط"
                  >
                    وسط
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanelSize('lg')}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                      panelSize === 'lg' 
                        ? 'bg-[#dfb55a] text-slate-950 font-bold shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                    title="الحجم الكبير"
                  >
                    كبير
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanelSize('xl')}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                      panelSize === 'xl' 
                        ? 'bg-[#dfb55a] text-slate-950 font-bold shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                    title="الحجم الكبير جداً"
                  >
                    ضخم
                  </button>
                </div>

                <button
                  type="button"
                  onClick={clearHistory}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-colors cursor-pointer"
                  title="مسح سجل المحادثة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Middle Warning Indicator & Interactive Simulation Toggle */}
            <div className="px-4 py-2 border-b border-slate-800/60 flex items-center justify-between text-[10px] font-sans">
              <span className="text-slate-400 flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>البيانات معزولة ومحمية</span>
              </span>

              {/* Simulation switch */}
              <button
                type="button"
                onClick={() => setIsSimulationMode(!isSimulationMode)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all cursor-pointer select-none ${
                  isSimulationMode 
                    ? 'bg-amber-950/40 text-amber-300 border-amber-900/50 hover:bg-amber-900/30' 
                    : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/30'
                }`}
                title={isSimulationMode ? "اضغط للتبديل للوضع السحابي الفعلي" : "اضغط للتبديل لوضع المحاكاة السريعة"}
              >
                <div className={`w-2 h-2 rounded-full ${isSimulationMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
                <span className="font-bold">
                  {isSimulationMode ? 'وضع المحاكاة نشط' : 'الوضع السحابي نشط'}
                </span>
              </button>

              <span className="text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-orange-400" />
                <span>صلاحية المساعد: قراءة فقط</span>
              </span>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-950/20">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div 
                      className={`max-w-[85%] p-3 border ${
                        msg.sender === 'user' 
                          ? 'bg-slate-800 text-slate-100 rounded-br-none border-slate-700/60 ml-8' 
                          : msg.text.startsWith('⚠️')
                            ? 'bg-rose-950/30 text-rose-200 border-rose-900/40 rounded-bl-none mr-8'
                            : 'text-slate-200 border-slate-800/80 rounded-bl-none mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-800/40 text-[9px] text-slate-500">
                        <span className="font-bold text-slate-400 flex items-center gap-1">
                          {msg.sender === 'user' ? (
                            <>👨‍💼 استعلام مستخدم</>
                          ) : (
                            <>✨ مساعد سحاب الذكي</>
                          )}
                        </span>
                        <span>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-right">
                        {renderMessageContent(msg.text)}
                      </div>
                    </div>
                  </div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <div className="flex justify-end">
                  <div className="bg-slate-900/60 text-slate-300 border border-slate-800 rounded-bl-none p-3 mr-8 flex items-center gap-2.5 shadow-md">
                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-sans">جاري فحص الاستعلام في جداول سحاب...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Footer Form with Input and Quick Queries */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3">
              {/* Query Suggestions Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                <span className="text-[9px] font-black text-slate-500 whitespace-nowrap bg-slate-800/40 px-2 py-1 rounded-lg border border-slate-800/40">استعلام سريع:</span>
                {sampleQueries.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => triggerSampleQuery(item.query)}
                    className="text-[10px] font-bold px-2.5 py-1 bg-slate-800/40 text-slate-300 hover:text-emerald-400 hover:bg-emerald-950/20 border border-slate-800/80 hover:border-emerald-900/40 rounded-full transition-all whitespace-nowrap cursor-pointer select-none"
                  >
                    {item.title}
                  </button>
                ))}
              </div>

              {/* Chat Form */}
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="اكتب استفسارك (مثال: كيف أعد نتائج الطلاب؟)..."
                  disabled={isLoading}
                  className="flex-1 bg-slate-950 text-slate-200 border border-slate-800 focus:border-emerald-500 px-3.5 py-2.5 text-xs md:text-sm focus:outline-none transition-all placeholder:text-slate-600 font-sans"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className={`px-4 py-2.5 flex items-center justify-center gap-1.5 font-bold text-xs transition-all border cursor-pointer select-none ${
                    isLoading || !input.trim()
                      ? 'bg-slate-800/40 text-slate-600 border-slate-800/60'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700 hover:scale-[1.02]'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 transform rotate-180" />
                  <span>استعلام</span>
                </button>
              </form>

              <p className="text-[9px] text-center text-slate-600 font-bold select-none leading-normal">
                تنبيه: هذا المساعد ملزم بالرد على طريقة استخدام نظام سحاب أو البيانات الفعلية المسجلة فيه فقط.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
