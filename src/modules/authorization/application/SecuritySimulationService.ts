import { Resource, Action } from '../domain/Permission';

export interface SimulationResult {
  logs: string[];
  isAllowed: boolean;
}

export class SecuritySimulationService {
  static runSimulation(role: string, resource: string, action: string): SimulationResult {
    const timestamp = new Date().toLocaleTimeString();
    const logs = [
      `[${timestamp}] [SecurityGatekeeper] 📥 استلام طلب تنفيذ عملية من المعرف الجغرافي للفرع الرئيسي...`,
      `[${timestamp}] [SecurityGatekeeper] 🔑 جاري فك وتدقيق الـ JWT Token الصادر وتحليل بيانات الهوية والارتباط...`,
      `[${timestamp}] [RBACEngine] 🔍 التحقق من دور المستخدم: (${role})`,
      `[${timestamp}] [RBACEngine] 📑 البحث في مصفوفة الصلاحيات المعتمدة للبحث عن المعلمة: (${resource}:${action})`
    ];

    // Define mock policy matching our ROLE_PERMISSIONS
    const rolePermissionsMock: Record<string, string[]> = {
      superadmin: ['*'],
      financial_manager: ['*'],
      accountant: [
        'student:view', 'student:print', 'student:export',
        'invoice:view', 'invoice:insert', 'invoice:edit', 'invoice:export', 'invoice:print',
        'ledger:view', 'ledger:insert', 'ledger:edit', 'ledger:post', 'ledger:export', 'ledger:print'
      ],
      cashier: [
        'invoice:view', 'invoice:insert', 'invoice:print'
      ],
      student_affairs: [
        'student:view', 'student:insert', 'student:edit', 'student:export', 'student:print', 'student:import',
        'attendance:view', 'attendance:insert', 'attendance:edit', 'attendance:export', 'attendance:print'
      ],
      control: [
        'exam:view', 'exam:insert', 'exam:edit', 'exam:delete', 'exam:approve', 'exam:cancel', 'exam:post', 'exam:export', 'exam:print'
      ],
      hr_manager: [
        'hr:view', 'hr:insert', 'hr:edit', 'hr:delete', 'hr:approve', 'hr:cancel', 'hr:post', 'hr:export', 'hr:print',
        'attendance:view', 'attendance:insert', 'attendance:edit'
      ],
      teacher: [
        'student:view', 'attendance:view', 'attendance:insert', 'attendance:edit', 'exam:view'
      ],
      auditor: [
        'student:view', 'student:export', 'student:print',
        'invoice:view', 'invoice:export', 'invoice:print',
        'ledger:view', 'ledger:export', 'ledger:print',
        'attendance:view', 'attendance:export', 'attendance:print',
        'exam:view', 'exam:export', 'exam:print',
        'report:view', 'report:export', 'report:print'
      ],
      parent: [
        'student:view', 'exam:view'
      ]
    };

    const hasWildcard = rolePermissionsMock[role]?.includes('*');
    const specificPerm = `${resource}:${action}`;
    const isAllowed = hasWildcard || rolePermissionsMock[role]?.includes(specificPerm);

    logs.push(`[${timestamp}] [ZeroTrustShield] 🛡️ التحقق من خلو حركة المعاملة الحساسة من محاولات تصعيد الامتيازات (No Privilege Escalation)...`);
    logs.push(`[${timestamp}] [AuditLogger] 📝 تسجيل الحركة في أرشيف الحماية الأمني العام للمؤسسة بنجاح.`);
      
    if (isAllowed) {
      logs.push(`[${timestamp}] [ZeroTrustShield] ✅ تمت المصادقة بنجاح على المعلمة أمنياً (ACCESS GRANTED).`);
    } else {
      logs.push(`[${timestamp}] [ZeroTrustShield] ❌ تم حجب محاولة التنفيذ لعدم كفاية الامتيازات على الخادم (ACCESS DENIED - Code: 403).`);
    }
    
    return { logs, isAllowed };
  }
}
