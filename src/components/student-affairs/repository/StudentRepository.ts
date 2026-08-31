import { authenticatedRequest } from '../../../utils/authenticatedRequest';

const inFlightStudentLists = new Map<string, Promise<any>>();

/**
 * Student Repository Layer
 * Handles direct network and server API communication (acting as the client repository talking to Supabase / Database through backend proxies).
 */

export const StudentRepository = {
  async repairOperationalEnrollments(reason: string, idempotencyKey: string): Promise<any> {
    if (!idempotencyKey.trim()) throw new Error('مفتاح منع التكرار مطلوب قبل إصلاح ربط القيد.');
    const response = await authenticatedRequest('/api/student-affairs/operational-enrollment-repair', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({ reason })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || 'تعذر إصلاح ربط القيد التشغيلي من الخادم.');
    }
    return data;
  },

  async updateGuardian(studentId: string, payload: Record<string, unknown>): Promise<any> {
    const response = await authenticatedRequest(`/api/students/${encodeURIComponent(studentId)}/guardian`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || "تعذر تحديث بيانات ولي الأمر من المسار الكانوني.");
    }
    return data;
  },

  async saveStudent(studentData: any): Promise<any> {
    const response = await authenticatedRequest("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentData)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || "تعذر حفظ سجل الطالب في الخادم.");
    }
    return data;
  },

  async reinstateStudent(studentId: string, reason = 'إعادة قيد الطالب بعد مراجعة الجهة المختصة.'): Promise<any> {
    const response = await authenticatedRequest(`/api/students/${encodeURIComponent(studentId)}/reinstate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || 'تعذر إعادة قيد الطالب من المسار الكانوني.');
    return data;
  },

  async registerStudent(studentData: any, idempotencyKey: string): Promise<any> {
    if (!idempotencyKey.trim()) throw new Error('مفتاح idempotency مطلوب قبل بدء تسجيل الطالب.');
    const response = await authenticatedRequest("/api/student-registration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify(studentData)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || "تعذر تسجيل الطالب عبر المسار الكانوني.");
    }
    return data;
  },

  async softDeleteStudent(studentId: string): Promise<any> {
    const response = await authenticatedRequest(`/api/students/${studentId}?action=soft`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.reasons?.join('\n') || errData.message || "REPOS_FAIL: فشلت عملية الحذف المنطقي من قاعدة البيانات الحقيقية للخادم");
    }
    return response.json();
  },

  async bulkCreateStudents(studentsList: any[]): Promise<any> {
    const response = await authenticatedRequest("/api/students/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentsList)
    });
    if (!response.ok) {
      throw new Error("Bulk write to backend database failed");
    }
    return response.json();
  },

  async importStudents(rows: any[], idempotencyKey: string): Promise<any> {
    if (!idempotencyKey.trim()) throw new Error('مفتاح منع التكرار مطلوب قبل استيراد دفعة الطلاب.');
    const response = await authenticatedRequest('/api/students/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({ rows })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || 'تعذر اعتماد ملف الطلاب؛ لم يتم حفظ أي صف جزئيًا.');
    return data;
  },

  async executeEnrollmentWorkflow(payload: {
    operation: 'transfer' | 'promote' | 're_enroll';
    studentIds: string[];
    targetClassId?: string;
    targetGradeId: string;
    targetSection: string;
    reason: string;
    idempotencyKey: string;
  }): Promise<any> {
    if (!payload.idempotencyKey.trim()) throw new Error('مفتاح منع التكرار مطلوب قبل تنفيذ عملية القيد.');
    const response = await authenticatedRequest('/api/students/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': payload.idempotencyKey
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || 'تعذر تنفيذ عملية القيد الذرية من الخادم.');
    return data;
  },

  async transferStudent(studentId: string, payload: { classroom: string; section: string; stageId?: string; branchId?: string }): Promise<any> {
    const response = await authenticatedRequest(`/api/students/${studentId}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "فشلت عملية النقل من خادم المنظومة لوجود قيود نشطة.");
    }
    return response.json();
  },

  async promoteStudent(studentId: string, payload: { targetClassroom: string; targetStageId: string; carryOverFees: number }): Promise<any> {
    const response = await authenticatedRequest(`/api/students/${studentId}/promote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "فشلت عملية ترقية الطالب من الخادم لوجود قيود أكاديمية أو مالية.");
    }
    return response.json();
  },

  async reEnrollStudent(studentId: string, payload: { classroom: string; section: string }): Promise<any> {
    const response = await authenticatedRequest(`/api/students/${studentId}/re-enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "فشلت عملية إعادة القيد من الخادم.");
    }
    return response.json();
  },

  async graduateStudent(studentId: string): Promise<any> {
    const response = await authenticatedRequest(`/api/students/${studentId}/graduate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "فشل تخريج الطالب لوجود مستحقات مالية غير مسددة.");
    }
    return response.json();
  },

  async archiveStudent(studentId: string, archive: boolean): Promise<any> {
    const response = await authenticatedRequest(`/api/students/${studentId}/archive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archive })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "فشلت عملية تعديل أرشيف الطالب");
    }
    return response.json();
  },

  async dismissStudent(studentId: string, payload: { type: 'temporary' | 'permanent'; reason: string; decisionNumber: string; authority: string; date: string }): Promise<any> {
    const response = await authenticatedRequest(`/api/students/${studentId}/dismiss`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "فشلت عملية إصدار قرار الفصل من الخادم لوجود خطأ بالنظام.");
    }
    return response.json();
  },

  async restoreStudent(studentId: string): Promise<any> {
    const response = await authenticatedRequest(`/api/students/${studentId}?action=restore`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "فشل فك التجميد وتنشيط القيد.");
    }
    return response.json();
  },

  async permanentDeleteStudent(studentId: string): Promise<any> {
    const response = await authenticatedRequest(`/api/students/${studentId}?action=permanent`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.reasons?.join('\n') || errData.message || "تعذر الحذف لوجود ارتباطات مالية نشطة.");
    }
    return response.json();
  },

  async list(options: { page?: number; limit?: number; search?: string; status?: string; section?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}, signal?: AbortSignal): Promise<any> {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, String(value));
    });
    const requestKey = params.toString();
    const existing = inFlightStudentLists.get(requestKey);
    if (existing) return existing;
    const request = authenticatedRequest(`/api/students?${requestKey}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store"
    }).then(async response => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `فشل جلب بيانات الطلاب من الخادم (${response.status})`);
      }
      return response.json();
    }).finally(() => inFlightStudentLists.delete(requestKey));
    inFlightStudentLists.set(requestKey, request);
    // The shared request is intentionally not aborted by one unmounting view;
    // this prevents duplicate concurrent reads during React navigation.
    void signal;
    return request;
  },

  async exportStudents(options: { search?: string; status?: string; section?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}, signal?: AbortSignal): Promise<{ blob: Blob; fileName: string }> {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, String(value));
    });
    const response = await authenticatedRequest(`/api/students/export?${params.toString()}`, {
      method: 'GET',
      headers: { "Content-Type": "application/json" },
      signal
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'تعذر إنشاء ملف تصدير الطلاب.');
    }
    const blob = await response.blob();
    if (!blob.size) throw new Error('تعذر إنشاء ملف التصدير.');
    const disposition = response.headers.get('content-disposition') || '';
    const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    const quotedName = disposition.match(/filename="([^"]+)"/i)?.[1];
    const fileName = encodedName ? decodeURIComponent(encodedName) : (quotedName || 'students_export.xlsx');
    return { blob, fileName };
  }
};
