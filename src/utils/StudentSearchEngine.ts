import { Student, Stage, Grade } from '../types';

/**
 * Enterprise Student Search Engine
 * Provides optimized, high-performance, compound, and multi-criteria searching
 * with Arabic/English normalization, numeric compatibility, partial matching,
 * and pre-built memory-efficient indexing.
 */
export class StudentSearchEngine {
  private static indexCache: Map<string, StudentSearchIndexEntry[]> = new Map();

  /**
   * Normalize Arabic and English text to ensure letters match regardless of spelling variations.
   * - Removes Arabic diacritics (harakat)
   * - Normalizes Alef variants (أ, إ, آ, ٱ) to plain Alef (ا)
   * - Normalizes Teh Marbuta (ة) to Heh (ه)
   * - Normalizes Yeh variants (ي, ى, ئ) to plain Yeh (ي)
   * - Converts English to lowercase
   * - Normalizes Eastern Arabic numerals (١٢٣٤٥٦٧٨٩٠) to Western numerals (1234567890)
   */
  public static normalize(text: string | null | undefined): string {
    if (!text) return '';
    
    let str = text.toString().trim().toLowerCase();

    // 1. Normalize numerals: Eastern Arabic (١٢٣٤٥٦٧٨٩٠) to Western (1234567890)
    const easternNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    for (let i = 0; i < 10; i++) {
      str = str.replace(new RegExp(easternNumerals[i], 'g'), i.toString());
    }

    // 2. Remove Arabic diacritics (harakat/diacritics)
    // Range: U+064B to U+065F (Fatha, Damma, Kasra, Tanween, Sukun, Shadda, etc.)
    str = str.replace(/[\u064B-\u065F]/g, '');

    // 3. Normalize Alef variants
    str = str.replace(/[أإآٱ]/g, 'ا');

    // 4. Normalize Teh Marbuta
    str = str.replace(/ة/g, 'ه');

    // 5. Normalize Yeh variants
    str = str.replace(/[ىئ]/g, 'ي');

    // 6. Remove common non-alphanumeric separators for clean substring match
    // Keep letters, numbers, and spaces
    str = str.replace(/[^\w\s\u0600-\u06FF]/g, '');

    return str;
  }

  /**
   * Normalize phone number format (remove non-digits, leading zero, or country code for better matching)
   */
  public static normalizePhone(phone: string | null | undefined): string {
    if (!phone) return '';
    // Strip everything except digits
    let digits = phone.replace(/\D/g, '');
    
    // Normalize Eastern Arabic numerals as well
    const easternNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    for (let i = 0; i < 10; i++) {
      digits = digits.replace(new RegExp(easternNumerals[i], 'g'), i.toString());
    }

    // If country code is prefixed, e.g. 966 or 00966, clean it up for local search
    if (digits.startsWith('966')) {
      digits = digits.substring(3);
    } else if (digits.startsWith('00966')) {
      digits = digits.substring(5);
    }
    
    // Strip leading zero for phone numbers (e.g., 059... -> 59...)
    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }

    return digits;
  }

  /**
   * Builds an optimized indexed cache of students' searchable tokens to avoid recalculating normalizations.
   * This provides lightning-fast search in O(N) where normalization overhead is completely avoided.
   */
  public static buildIndex(students: Student[], schoolId: string): StudentSearchIndexEntry[] {
    const cacheKey = `${schoolId}_${students.length}_${students.map(s => s.id + s.version).join('_').substring(0, 50)}`;
    
    if (this.indexCache.has(cacheKey)) {
      return this.indexCache.get(cacheKey)!;
    }

    const indexedEntries = students
      .filter(s => s.schoolId === schoolId && !s.isDeleted)
      .map(student => {
        // Index all searchable fields
        const normalizedName = this.normalize(student.name);
        const normalizedParentName = this.normalize(student.parentName);
        const normalizedMotherName = this.normalize(student.motherName);
        const normalizedNationalId = this.normalize(student.nationalId);
        const normalizedAcademicId = this.normalize(student.academicId);
        const normalizedStudentCode = this.normalize(student.studentCode);
        const normalizedClassroom = this.normalize(student.classroom);
        const normalizedSection = this.normalize(student.section);
        const normalizedAcademicYear = this.normalize(student.academicYear);
        
        // Normalize phones
        const phoneTokens = [
          this.normalizePhone(student.parentPhone),
          this.normalizePhone(student.motherPhone),
          this.normalizePhone(student.parentPhone ? student.parentPhone.substring(1) : '')
        ].filter(Boolean);

        return {
          student,
          normalizedName,
          normalizedParentName,
          normalizedMotherName,
          normalizedNationalId,
          normalizedAcademicId,
          normalizedStudentCode,
          normalizedClassroom,
          normalizedSection,
          normalizedAcademicYear,
          phoneTokens
        };
      });

    // Cache the build
    this.indexCache.set(cacheKey, indexedEntries);
    return indexedEntries;
  }

  /**
   * Core Enterprise Search Method (Compound and Multi-criteria)
   */
  public static search(
    students: Student[],
    options: StudentSearchOptions
  ): Student[] {
    const {
      schoolId,
      query = '',
      stageId = '',
      gradeName = '',
      section = '',
      status = '',
      academicYear = '',
      // Detailed fields for advanced targeted search
      targetName = '',
      targetNationalId = '',
      targetPhone = '',
      targetParentName = '',
      targetAcademicId = '',
      targetStudentCode = ''
    } = options;

    // Build or fetch optimized pre-normalized index entries
    const indexedStudents = this.buildIndex(students, schoolId);

    // Normalize search criteria
    const normalizedQuery = this.normalize(query);
    const normalizedQueryPhone = this.normalizePhone(query);

    const normTargetName = this.normalize(targetName);
    const normTargetNationalId = this.normalize(targetNationalId);
    const normTargetPhone = this.normalizePhone(targetPhone);
    const normTargetParentName = this.normalize(targetParentName);
    const normTargetAcademicId = this.normalize(targetAcademicId);
    const normTargetStudentCode = this.normalize(targetStudentCode);

    return indexedStudents
      .filter(entry => {
        const s = entry.student;

        // 1. General search query (البحث الفوري الشامل والمشترك)
        if (normalizedQuery) {
          const matchesText = 
            entry.normalizedName.includes(normalizedQuery) ||
            entry.normalizedParentName.includes(normalizedQuery) ||
            entry.normalizedMotherName.includes(normalizedQuery) ||
            entry.normalizedNationalId.includes(normalizedQuery) ||
            entry.normalizedAcademicId.includes(normalizedQuery) ||
            entry.normalizedStudentCode.includes(normalizedQuery) ||
            entry.normalizedClassroom.includes(normalizedQuery) ||
            entry.normalizedSection.includes(normalizedQuery);

          // Phone matching
          const matchesPhone = entry.phoneTokens.some(phone => 
            phone.includes(normalizedQueryPhone) || normalizedQueryPhone.includes(phone)
          );

          if (!matchesText && !matchesPhone) {
            return false;
          }
        }

        // 2. Multi-criteria Target Name
        if (normTargetName && !entry.normalizedName.includes(normTargetName)) {
          return false;
        }

        // 3. Multi-criteria National ID / Parent ID
        if (normTargetNationalId && !entry.normalizedNationalId.includes(normTargetNationalId)) {
          // Check father ID in nested family structures if any
          const matchesFamilyNid = s.parentsAndGuardians?.some(p => 
            p.nid && this.normalize(p.nid).includes(normTargetNationalId)
          );
          if (!matchesFamilyNid) {
            return false;
          }
        }

        // 4. Multi-criteria Targeted Phone
        if (normTargetPhone) {
          const matchesPhone = entry.phoneTokens.some(phone => phone.includes(normTargetPhone));
          if (!matchesPhone) {
            return false;
          }
        }

        // 5. Multi-criteria Targeted Parent Name
        if (normTargetParentName && !entry.normalizedParentName.includes(normTargetParentName)) {
          return false;
        }

        // 6. Multi-criteria Targeted Academic ID
        if (normTargetAcademicId && !entry.normalizedAcademicId.includes(normTargetAcademicId)) {
          return false;
        }

        // 7. Multi-criteria Targeted Student Code
        if (normTargetStudentCode && !entry.normalizedStudentCode.includes(normTargetStudentCode)) {
          return false;
        }

        // 8. Stage Filter
        if (stageId && s.stageId !== stageId) {
          // Fallback legacy logic if stageId doesn't match directly
          if (stageId === 'stage_kg' || stageId === 'kindergarten') {
            const isKg = s.classroom.includes('الروضة') || s.classroom.includes('تمهيدي') || s.classroom.includes('بستان');
            if (!isKg) return false;
          } else if (stageId === 'stage_primary' || stageId === 'primary') {
            const isPrimary = !s.classroom.includes('الإعدادي') && !s.classroom.includes('المتوسط') && !s.classroom.includes('الثانوي') && !s.classroom.includes('الروضة') && !s.classroom.includes('تمهيدي') && !s.classroom.includes('بستان');
            if (!isPrimary) return false;
          } else if (stageId === 'stage_middle' || stageId === 'middle') {
            const isMiddle = s.classroom.includes('الإعدادي') || s.classroom.includes('المتوسط');
            if (!isMiddle) return false;
          } else if (stageId === 'stage_high' || stageId === 'high') {
            const isHigh = s.classroom.includes('الثانوي');
            if (!isHigh) return false;
          } else {
            return false;
          }
        }

        // 9. Grade/Classroom Filter
        if (gradeName && s.classroom !== gradeName) {
          return false;
        }

        // 10. Section Filter
        if (section) {
          const normSec = this.normalize(section);
          if (!entry.normalizedSection.includes(normSec)) {
            return false;
          }
        }

        // 11. Status Filter
        if (status && s.status !== status) {
          return false;
        }

        // 12. Academic Year Filter
        if (academicYear) {
          const normYear = this.normalize(academicYear);
          if (!entry.normalizedAcademicYear.includes(normYear)) {
            return false;
          }
        }

        return true;
      })
      .map(entry => entry.student);
  }
}

export interface StudentSearchIndexEntry {
  student: Student;
  normalizedName: string;
  normalizedParentName: string;
  normalizedMotherName: string;
  normalizedNationalId: string;
  normalizedAcademicId: string;
  normalizedStudentCode: string;
  normalizedClassroom: string;
  normalizedSection: string;
  normalizedAcademicYear: string;
  phoneTokens: string[];
}

export interface StudentSearchOptions {
  schoolId: string;
  query?: string;
  stageId?: string;
  gradeName?: string;
  section?: string;
  status?: string;
  academicYear?: string;
  
  // targeted search inputs for Advanced Compound queries
  targetName?: string;
  targetNationalId?: string;
  targetPhone?: string;
  targetParentName?: string;
  targetAcademicId?: string;
  targetStudentCode?: string;
}
