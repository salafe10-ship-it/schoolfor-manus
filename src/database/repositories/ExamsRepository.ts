import { getSupabaseClient } from '../client';
import { FallbackStorage } from './FallbackStorage';
import { ExamValidator } from '../../validation/validators';
import { IBaseRepository } from './IBaseRepository';
import { UnitOfWork } from '../UnitOfWork';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { SQLCommandBuilder } from '../transactions/SQLCommand';

/**
 * Repository class handling CRUD and fetching operations for Exams configurations and database.
 * Fully conforms to the IBaseRepository<any> enterprise interface.
 */
export class ExamsRepository implements IBaseRepository<any> {
  // Instance methods delegating to static methods for interface compliance

  /**
   * Retrieves exams by ID.
   */
  public async getById(schoolId: string, id: string): Promise<any | null> {
    return ExamsRepository.getById(schoolId, id);
  }

  /**
   * Retrieves all exam objects.
   */
  public async getAll(schoolId: string, options?: any): Promise<any[]> {
    return ExamsRepository.getAll(schoolId, options);
  }

  /**
   * Creates/upserts the exam block.
   */
  public async create(schoolId: string, item: any): Promise<any> {
    return ExamsRepository.create(schoolId, item);
  }

  /**
   * Updates the exam block.
   */
  public async update(schoolId: string, id: string, item: any): Promise<any> {
    return ExamsRepository.update(schoolId, id, item);
  }

  /**
   * Deletes exams config block.
   */
  public async delete(schoolId: string, id: string): Promise<boolean> {
    return ExamsRepository.delete(schoolId, id);
  }

  /**
   * Checks if exams configuration block exists.
   */
  public async exists(schoolId: string, id: string): Promise<boolean> {
    return ExamsRepository.exists(schoolId, id);
  }

  /**
   * Counts the exam configuration blocks.
   */
  public async count(schoolId: string, options?: any): Promise<number> {
    return ExamsRepository.count(schoolId, options);
  }

  // --- Static Methods ---

  /**
   * Checks if there are active exams for the student.
   */
  public static async hasActiveExams(schoolId: string, studentId: string): Promise<boolean> {
    const exams = await this.getExams(schoolId);
    // Simple check: if exam config exists, assume potentially active exams
    return exams && Object.keys(exams).length > 0;
  }

  /**
   * Retrieves exams by ID (defaults to retrieving the school's full exams settings).
   * @param schoolId - School enterprise tenant ID.
   * @param id - Entity ID (ignored for the exams collection config).
   */
  public static async getById(schoolId: string, id: string): Promise<any | null> {
    return this.getExams(schoolId);
  }

  /**
   * Retrieves all exams configuration.
   * @param schoolId - School enterprise tenant ID.
   * @param options - Ignored.
   */
  public static async getAll(schoolId: string, options?: any): Promise<any[]> {
    const exams = await this.getExams(schoolId);
    return exams ? [exams] : [];
  }

  /**
   * Saves exams configuration.
   * @param schoolId - School enterprise tenant ID.
   * @param item - Exam database schema data.
   */
  public static async create(schoolId: string, item: any): Promise<any> {
    await this.saveExams(schoolId, item);
    return item;
  }

  /**
   * Updates exams configuration.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Ignored.
   * @param item - Exam database schema data updates.
   */
  public static async update(schoolId: string, id: string, item: any): Promise<any> {
    await this.saveExams(schoolId, item);
    return item;
  }

  /**
   * Deletes exams configuration (resets to empty database).
   * @param schoolId - School enterprise tenant ID.
   * @param id - Ignored.
   */
  public static async delete(schoolId: string, id: string): Promise<boolean> {
    await this.saveExams(schoolId, {});
    return true;
  }

  /**
   * Checks if an exams configuration is saved for the school.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Ignored.
   */
  public static async exists(schoolId: string, id: string): Promise<boolean> {
    const exams = await this.getExams(schoolId);
    return exams && Object.keys(exams).length > 0;
  }

  /**
   * Counts the configuration entries for exams (0 or 1).
   * @param schoolId - School enterprise tenant ID.
   * @param options - Ignored.
   */
  public static async count(schoolId: string, options?: any): Promise<number> {
    const hasConfig = await this.exists(schoolId, '');
    return hasConfig ? 1 : 0;
  }

  /**
   * Retrieves exams configuration database document.
   */
  public static async getExams(schoolId: string): Promise<any> {
    const pending = UnitOfWork.getPendingById('exams_database', 'exams_data');
    if (pending) {
      if (pending.deleted) return {};
      return pending.data;
    }

    // Canonical reads depend on the central client, not on the health of the
    // emergency local store. Coupling the two made an empty/disabled fallback
    // incorrectly turn a healthy Supabase read into HTTP 500.
    const supabase = getSupabaseClient();
    if (!supabase) {
      FallbackStorage.assertCanonicalPersistence('exams database read without a central client');
      return {};
    }
    try {
      const { data, error } = await supabase
        .from('exams_database')
        .select('data')
        .eq('school_id', schoolId)
        .maybeSingle();

      if (error) throw error;
      // No configured cycle is a valid canonical empty state.
      return data?.data && typeof data.data === 'object' ? data.data : {};
    } catch (err: any) {
      EnterpriseLogger.error("Failed to fetch exams database from Supabase:", "ExamsRepository", { error: err?.message || err });
      FallbackStorage.assertCanonicalPersistence('exams database read after central failure');
    }
    return {};
  }

  /**
   * Saves the exams configuration database document.
   */
  public static async saveExams(schoolId: string, examsData: any): Promise<boolean> {
    // Validate the exams database structure before saving
    ExamValidator.validateDatabase(examsData);

    if (UnitOfWork.isTransactionActive()) {
      const command = SQLCommandBuilder.create({
        sqlText: `UPDATE exams_database SET data = $1 WHERE school_id = $2;`,
        parameters: [JSON.stringify(examsData), schoolId],
        executionContext: 'Save Exams'
      });
      UnitOfWork.enlistCreate('exams_database', 'exams_data', examsData, command);
      return true;
    }

    return FallbackStorage.performWrite<boolean>(
      schoolId,
      'exams_database',
      schoolId,
      'UPDATE',
      examsData,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client available");
        const { error } = await supabase
          .from('exams_database')
          .upsert({
            school_id: schoolId,
            data: examsData,
            updated_at: new Date().toISOString()
          }, { onConflict: 'school_id' });
        if (error) throw error;
        return true;
      },
      () => {
        FallbackStorage.saveExams(examsData);
      }
    );
  }
}
