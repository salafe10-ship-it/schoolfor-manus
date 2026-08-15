import { getSupabaseClient } from '../client';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { Teacher, Employee } from '../../types';
import { EmployeeValidator } from '../../validation/validators';
import { IBaseRepository } from './IBaseRepository';

/**
 * Repository class handling CRUD and fetching operations for Teachers and Employees.
 * Fully conforms to the IBaseRepository<Employee> enterprise interface.
 */
export class EmployeeRepository implements IBaseRepository<Employee> {
  // Instance methods delegating to static methods for interface compliance

  /**
   * Retrieves an employee by ID.
   */
  public async getById(schoolId: string, id: string): Promise<Employee | null> {
    return EmployeeRepository.getById(schoolId, id);
  }

  /**
   * Retrieves all employees matching criteria.
   */
  public async getAll(schoolId: string, options?: any): Promise<Employee[]> {
    return EmployeeRepository.getAll(schoolId, options);
  }

  /**
   * Creates a new employee.
   */
  public async create(schoolId: string, item: Partial<Employee>): Promise<Employee> {
    return EmployeeRepository.create(schoolId, item);
  }

  /**
   * Updates an existing employee.
   */
  public async update(schoolId: string, id: string, item: Partial<Employee>): Promise<Employee> {
    return EmployeeRepository.update(schoolId, id, item);
  }

  /**
   * Deletes an employee.
   */
  public async delete(schoolId: string, id: string): Promise<boolean> {
    return EmployeeRepository.delete(schoolId, id);
  }

  /**
   * Checks if an employee exists.
   */
  public async exists(schoolId: string, id: string): Promise<boolean> {
    return EmployeeRepository.exists(schoolId, id);
  }

  /**
   * Counts employees matching the criteria.
   */
  public async count(schoolId: string, options?: any): Promise<number> {
    return EmployeeRepository.count(schoolId, options);
  }

  // --- Static Methods ---

  /**
   * Retrieves a single employee by unique ID.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Unique employee ID.
   */
  public static async getById(schoolId: string, id: string): Promise<Employee | null> {
    const rows = await FallbackStorage.performRead<Employee>(
      schoolId,
      'employees.getById',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase.from('employees').select('*').eq('school_id', schoolId).eq('id', id).maybeSingle();
        if (error) throw error;
        return data ? [data as Employee] : [];
      },
      () => FallbackStorage.getEmployees().filter(employee => employee.schoolId === schoolId && employee.id === id)
    );
    return rows[0] || null;
  }

  /**
   * Retrieves all employees for a school.
   * @param schoolId - School enterprise tenant ID.
   * @param options - Additional options.
   */
  public static async getAll(schoolId: string, options?: any): Promise<Employee[]> {
    return this.getAllEmployees(schoolId, options);
  }

  /**
   * Creates a new employee.
   * @param schoolId - School enterprise tenant ID.
   * @param item - Partial employee data.
   */
  public static async create(schoolId: string, item: Partial<Employee>): Promise<Employee> {
    return this.saveEmployee(schoolId, item);
  }

  /**
   * Updates an existing employee.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Unique employee ID.
   * @param item - Employee updates.
   */
  public static async update(schoolId: string, id: string, item: Partial<Employee>): Promise<Employee> {
    return this.saveEmployee(schoolId, { ...item, id });
  }

  /**
   * Deletes an employee by ID.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Unique employee ID.
   */
  public static async delete(schoolId: string, id: string): Promise<boolean> {
    return this.deleteEmployee(schoolId, id);
  }

  /**
   * Checks if an employee exists in the database.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Unique employee ID.
   */
  public static async exists(schoolId: string, id: string): Promise<boolean> {
    const emp = await this.getById(schoolId, id);
    return emp !== null;
  }

  /**
   * Counts total employees under tenant isolation.
   * @param schoolId - School enterprise tenant ID.
   * @param options - Filtering parameters.
   */
  public static async count(schoolId: string, options?: any): Promise<number> {
    const list = await this.getAll(schoolId, options);
    return list.length;
  }

  // --- Teachers Helper / Custom CRUD ---

  /**
   * Retrieves all teachers for a school with optional filters.
   */
  public static async getAllTeachers(
    schoolId: string, 
    options?: { branchId?: string; search?: string }
  ): Promise<Teacher[]> {
    return FallbackStorage.performRead<Teacher>(
      schoolId,
      'teachers.getAll',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        let query = supabase.from('teachers').select('*').eq('school_id', schoolId);
        if (options?.branchId) query = query.eq('branch_id', options.branchId);
        if (options?.search) query = query.ilike('name', `%${options.search}%`);
        const { data, error } = await query.order('name', { ascending: true });
        if (error) throw error;
        return (data || []) as Teacher[];
      },
      () => {
        let teachers = FallbackStorage.getTeachers().filter(t => t.schoolId === schoolId);
        if (options?.branchId) teachers = teachers.filter(t => t.branchId === options.branchId);
        if (options?.search) {
          const sLower = options.search.toLowerCase();
          teachers = teachers.filter(t => t.name.toLowerCase().includes(sLower));
        }
        return teachers;
      }
    );
  }

  /**
   * Saves or updates a teacher record.
   */
  public static async saveTeacher(schoolId: string, teacher: Partial<Teacher>): Promise<Teacher> {
    const id = teacher.id || `teach_${Date.now()}`;
    const newTeacher: Teacher = {
      ...(teacher as any),
      id,
      schoolId,
      status: teacher.status || 'active',
      salary: teacher.salary || 0,
      assignedClasses: teacher.assignedClasses || []
    };

    // Validate as employee (role is "Teacher" / "معلم")
    EmployeeValidator.validate({ ...newTeacher, role: 'معلم' });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('teachers')
          .upsert({ ...newTeacher, school_id: schoolId })
          .select()
          .single();
        if (!error && data) return data as Teacher;
      } catch (err: any) {
        EnterpriseLogger.error("Failed to save teacher to Supabase:", "EmployeeRepository", { error: err });
      }
    }

    FallbackStorage.assertCanonicalPersistence(`teacher save ${id}`);

    const all = FallbackStorage.getTeachers();
    const idx = all.findIndex(t => t.schoolId === schoolId && t.id === id);
    if (idx > -1) {
      all[idx] = { ...all[idx], ...newTeacher };
    } else {
      all.push(newTeacher);
    }
    FallbackStorage.saveTeachers(all);
    return newTeacher;
  }

  /**
   * Deletes a teacher.
   */
  public static async deleteTeacher(schoolId: string, id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('teachers')
          .delete()
          .eq('school_id', schoolId)
          .eq('id', id);
        if (!error) return true;
      } catch (err: any) {
        EnterpriseLogger.error("Failed to delete teacher from Supabase:", "EmployeeRepository", { error: err });
      }
    }

    FallbackStorage.assertCanonicalPersistence(`teacher delete ${id}`);

    const all = FallbackStorage.getTeachers();
    const filtered = all.filter(t => !(t.schoolId === schoolId && t.id === id));
    if (filtered.length === all.length) return false;
    FallbackStorage.saveTeachers(filtered);
    return true;
  }

  // --- Employees Helper / Custom CRUD ---

  /**
   * Retrieves employees with search filters.
   */
  public static async getAllEmployees(
    schoolId: string,
    options?: { search?: string }
  ): Promise<Employee[]> {
    return FallbackStorage.performRead<Employee>(
      schoolId,
      'employees.getAll',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        let query = supabase.from('employees').select('*').eq('school_id', schoolId);
        if (options?.search) query = query.ilike('name', `%${options.search}%`);
        const { data, error } = await query.order('name', { ascending: true });
        if (error) throw error;
        return (data || []) as Employee[];
      },
      () => {
        let employees = FallbackStorage.getEmployees().filter(e => e.schoolId === schoolId);
        if (options?.search) {
          const sLower = options.search.toLowerCase();
          employees = employees.filter(e => e.name.toLowerCase().includes(sLower));
        }
        return employees;
      }
    );
  }

  /**
   * Saves or updates an employee.
   */
  public static async saveEmployee(schoolId: string, employee: Partial<Employee>): Promise<Employee> {
    const id = employee.id || `emp_${Date.now()}`;
    const newEmployee: Employee = {
      ...(employee as any),
      id,
      schoolId,
      status: employee.status || 'active',
      salary: employee.salary || 0
    };

    // Validate the employee before writing to any database/storage
    EmployeeValidator.validate(newEmployee);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('employees')
          .upsert({ ...newEmployee, school_id: schoolId })
          .select()
          .single();
        if (!error && data) return data as Employee;
      } catch (err: any) {
        EnterpriseLogger.error("Failed to save employee to Supabase:", "EmployeeRepository", { error: err });
      }
    }

    FallbackStorage.assertCanonicalPersistence(`employee save ${id}`);

    const all = FallbackStorage.getEmployees();
    const idx = all.findIndex(e => e.schoolId === schoolId && e.id === id);
    if (idx > -1) {
      all[idx] = { ...all[idx], ...newEmployee };
    } else {
      all.push(newEmployee);
    }
    FallbackStorage.saveEmployees(all);
    return newEmployee;
  }

  /**
   * Deletes an employee.
   */
  public static async deleteEmployee(schoolId: string, id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('school_id', schoolId)
          .eq('id', id);
        if (!error) return true;
      } catch (err: any) {
        EnterpriseLogger.error("Failed to delete employee from Supabase:", "EmployeeRepository", { error: err });
      }
    }

    FallbackStorage.assertCanonicalPersistence(`employee delete ${id}`);

    const all = FallbackStorage.getEmployees();
    const filtered = all.filter(e => !(e.schoolId === schoolId && e.id === id));
    if (filtered.length === all.length) return false;
    FallbackStorage.saveEmployees(filtered);
    return true;
  }
}
