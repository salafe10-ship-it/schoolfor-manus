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

  async listStudentDocuments(studentId: string): Promise<any[]> {
    const response = await authenticatedRequest(`/api/students/${encodeURIComponent(studentId)}/documents?limit=100`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || 'تعذر تحميل صور ومستندات الطالب.');
    return Array.isArray(data?.data) ? data.data : [];
  },

  async listStudentDocumentCategories(search = ''): Promise<any[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await authenticatedRequest(`/api/student-document-categories${query}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || 'تعذر تحميل تصنيفات مستندات الطالب.');
    return Array.isArray(data?.data) ? data.data : [];
  },

  async ensureStudentDocumentCategory(categoryCode: string, displayName: string): Promise<string> {
    const normalizedCode = categoryCode.trim().toUpperCase();
    const existing = await this.listStudentDocumentCategories(normalizedCode);
    const category = existing.find(item => String(item?.category_code || item?.categoryCode || '').toUpperCase() === normalizedCode);
    if (category?.id) return String(category.id);
    const response = await authenticatedRequest('/api/student-document-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': `student-document-category-${normalizedCode}-${crypto.randomUUID()}` },
      body: JSON.stringify({ categoryCode: normalizedCode, displayName, description: `مستند طالب اختياري: ${displayName}` })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || `تعذر تهيئة تصنيف المستند ${displayName}.`);
    const categoryId = data?.data?.categoryId || data?.data?.id;
    if (!categoryId) throw new Error(`لم يُرجع الخادم معرف تصنيف المستند ${displayName}.`);
    return String(categoryId);
  },

  async ensureStudentProfilePhotoCategory(): Promise<string> {
    return this.ensureStudentDocumentCategory('STUDENT_PROFILE_PHOTO', 'الصورة الشخصية للطالب');
  },

  async getStudentDocumentContent(documentId: string): Promise<string> {
    const response = await authenticatedRequest(`/api/student-documents/${encodeURIComponent(documentId)}/content`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || 'تعذر إنشاء رابط الصورة الخاصة.');
    const url = data?.data?.url;
    if (!url) throw new Error('لم يُرجع الخادم رابط الصورة الخاصة.');
    return String(url);
  },

  async uploadStudentProfilePhoto(studentId: string, file: File): Promise<string> {
    const categoryId = await this.ensureStudentProfilePhotoCategory();
    const documents = await this.listStudentDocuments(studentId);
    const existing = documents.find(item => String(item?.category_code || item?.categoryCode || '').toUpperCase() === 'STUDENT_PROFILE_PHOTO');
    const query = new URLSearchParams({
      originalFileName: file.name || 'student-profile-photo',
      ...(existing ? { revisionReason: 'تحديث الصورة الشخصية من ملف الطالب.' } : {
        categoryId,
        documentReference: `STUDENT-PHOTO-${studentId}-${Date.now()}`,
        title: 'الصورة الشخصية للطالب',
        description: 'صورة شخصية خاصة بملف الطالب.',
        classification: 'confidential',
        verificationStatus: 'not_required'
      })
    });
    const endpoint = existing
      ? `/api/student-documents/${encodeURIComponent(existing.id)}/content-versions?${query.toString()}`
      : `/api/students/${encodeURIComponent(studentId)}/document-content?${query.toString()}`;
    const response = await authenticatedRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': file.type,
        'Idempotency-Key': `student-profile-photo-${studentId}-${crypto.randomUUID()}`
      },
      body: file
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || 'تعذر رفع الصورة الشخصية إلى التخزين الخاص.');
    const documentId = existing?.id || data?.data?.documentId;
    if (!documentId) throw new Error('لم يُرجع الخادم معرف مستند الصورة الشخصية.');
    return this.getStudentDocumentContent(String(documentId));
  },

  async uploadStudentDocument(studentId: string, file: File, categoryCode: string, title: string): Promise<any> {
    const categoryId = await this.ensureStudentDocumentCategory(categoryCode, title);
    const documents = await this.listStudentDocuments(studentId);
    const existing = documents.find(item => String(item?.category_code || item?.categoryCode || '').toUpperCase() === categoryCode.toUpperCase());
    const query = new URLSearchParams({
      originalFileName: file.name || 'student-document',
      ...(existing ? { revisionReason: `تحديث ${title} من ملف الطالب.` } : {
        categoryId,
        documentReference: `STUDENT-DOC-${categoryCode}-${studentId}-${Date.now()}`,
        title,
        description: `مستند اختياري من ملف الطالب: ${title}`,
        classification: 'confidential',
        verificationStatus: 'not_required'
      })
    });
    const response = await authenticatedRequest(
      existing
        ? `/api/student-documents/${encodeURIComponent(existing.id)}/content-versions?${query.toString()}`
        : `/api/students/${encodeURIComponent(studentId)}/document-content?${query.toString()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': file.type, 'Idempotency-Key': `student-document-${categoryCode}-${studentId}-${crypto.randomUUID()}` },
        body: file
      }
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || `تعذر رفع ${title}.`);
    return data?.data || data;
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
