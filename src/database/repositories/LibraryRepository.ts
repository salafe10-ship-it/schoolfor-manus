import { getSupabaseClient } from '../client';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { IBaseRepository } from './IBaseRepository';

/**
 * Repository class handling CRUD and data fetching operations for School Library.
 * Fully conforms to the IBaseRepository<any> enterprise interface.
 */
export class LibraryRepository implements IBaseRepository<any> {
  // Instance methods delegating to static methods for interface compliance

  /**
   * Retrieves a library book by ID.
   */
  public async getById(schoolId: string, id: string): Promise<any | null> {
    return LibraryRepository.getById(schoolId, id);
  }

  /**
   * Retrieves all library books matching options.
   */
  public async getAll(schoolId: string, options?: any): Promise<any[]> {
    return LibraryRepository.getAll(schoolId, options);
  }

  /**
   * Creates a new library book.
   */
  public async create(schoolId: string, item: any): Promise<any> {
    return LibraryRepository.create(schoolId, item);
  }

  /**
   * Updates an existing library book.
   */
  public async update(schoolId: string, id: string, item: any): Promise<any> {
    return LibraryRepository.update(schoolId, id, item);
  }

  /**
   * Deletes a library book.
   */
  public async delete(schoolId: string, id: string): Promise<boolean> {
    return LibraryRepository.delete(schoolId, id);
  }

  /**
   * Checks if a library book exists.
   */
  public async exists(schoolId: string, id: string): Promise<boolean> {
    return LibraryRepository.exists(schoolId, id);
  }

  /**
   * Counts library books matching options.
   */
  public async count(schoolId: string, options?: any): Promise<number> {
    return LibraryRepository.count(schoolId, options);
  }

  // --- Static Methods ---

  /**
   * Checks if a student has any borrowed books.
   */
  public static async hasBorrowedBooks(schoolId: string, studentId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      FallbackStorage.assertCanonicalPersistence(`borrowed books read ${studentId}`);
      return false;
    }
    const { data, error } = await supabase.from('borrowed_books').select('id').eq('student_id', studentId).eq('returned_at', null);
    return error ? false : (data && data.length > 0);
  }

  /**
   * Retrieves a single library book by its unique ID.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Unique library book ID.
   */
  public static async getById(schoolId: string, id: string): Promise<any | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('library')
          .select('*')
          .eq('school_id', schoolId)
          .eq('id', id)
          .single();
        if (!error && data) return data;
      } catch (err: any) {
        EnterpriseLogger.error("Failed to query library book by ID:", "LibraryRepository", { error: err });
      }
    }
    FallbackStorage.assertCanonicalPersistence(`library book read ${id}`);
    const book = FallbackStorage.getLibrary().find(b => b.id === id && (b.schoolId === schoolId || b.school_id === schoolId));
    return book || null;
  }

  /**
   * Retrieves all books belonging to a school.
   * @param schoolId - School enterprise tenant ID.
   * @param options - Filters.
   */
  public static async getAll(schoolId: string, options?: { search?: string }): Promise<any[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase
          .from('library')
          .select('*')
          .eq('school_id', schoolId);

        if (options?.search) {
          query = query.or(`title.ilike.%${options.search}%,author.ilike.%${options.search}%`);
        }

        const { data, error } = await query;
        if (!error && data) return data;
      } catch (err: any) {
        EnterpriseLogger.error("Failed to query library books from Supabase:", "LibraryRepository", { error: err });
      }
    }

    FallbackStorage.assertCanonicalPersistence(`library books read ${schoolId}`);
    let books = FallbackStorage.getLibrary().filter(b => b.schoolId === schoolId || b.school_id === schoolId);
    if (options?.search) {
      const sLower = options.search.toLowerCase();
      books = books.filter(b => 
        b.title.toLowerCase().includes(sLower) || 
        b.author.toLowerCase().includes(sLower)
      );
    }
    return books;
  }

  /**
   * Creates/inserts a new library book.
   */
  public static async create(schoolId: string, item: any): Promise<any> {
    return this.save(schoolId, item);
  }

  /**
   * Updates an existing library book.
   */
  public static async update(schoolId: string, id: string, item: any): Promise<any> {
    return this.save(schoolId, { ...item, id });
  }

  /**
   * Core helper for saving or updating a library book.
   */
  public static async save(schoolId: string, book: any): Promise<any> {
    const id = book.id || `book_${Date.now()}`;
    const newBook = {
      ...book,
      id,
      school_id: schoolId
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('library')
          .upsert(newBook)
          .select()
          .single();
        if (!error && data) return data;
      } catch (err: any) {
        EnterpriseLogger.error("Failed to save book to Supabase:", "LibraryRepository", { error: err });
      }
    }

    FallbackStorage.assertCanonicalPersistence(`library book write ${id}`);
    const all = FallbackStorage.getLibrary();
    const idx = all.findIndex(b => b.id === id);
    const savedBook = { ...book, id, schoolId };
    if (idx > -1) {
      all[idx] = { ...all[idx], ...savedBook };
    } else {
      all.push(savedBook);
    }
    FallbackStorage.saveLibrary(all);
    return savedBook;
  }

  /**
   * Deletes a library book by ID.
   */
  public static async delete(schoolId: string, id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('library')
          .delete()
          .eq('school_id', schoolId)
          .eq('id', id);
        if (!error) return true;
      } catch (err: any) {
        EnterpriseLogger.error("Failed to delete book from Supabase:", "LibraryRepository", { error: err });
      }
    }

    FallbackStorage.assertCanonicalPersistence(`library book delete ${id}`);
    const all = FallbackStorage.getLibrary();
    const filtered = all.filter(b => b.id !== id);
    if (filtered.length === all.length) return false;
    FallbackStorage.saveLibrary(filtered);
    return true;
  }

  /**
   * Verifies if a book exists.
   */
  public static async exists(schoolId: string, id: string): Promise<boolean> {
    const book = await this.getById(schoolId, id);
    return book !== null;
  }

  /**
   * Counts the library books.
   */
  public static async count(schoolId: string, options?: any): Promise<number> {
    const list = await this.getAll(schoolId, options);
    return list.length;
  }
}
