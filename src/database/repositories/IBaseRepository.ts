/**
 * Unified data access contract for all repository systems in the application.
 * Ensures consistent behavior, transaction safety, and RLS/tenant validation.
 */
export interface IBaseRepository<T> {
  /**
   * Retrieves a single entity by its unique ID under tenant isolation.
   * 
   * @param schoolId - The enterprise school identifier for tenant isolation.
   * @param id - The unique ID of the record.
   * @returns The found record, or null if it does not exist.
   */
  getById(schoolId: string, id: string): Promise<T | null>;

  /**
   * Retrieves all entities belonging to a school, with optional filtering.
   * 
   * @param schoolId - The enterprise school identifier for tenant isolation.
   * @param options - Filtering, sorting, searching, or pagination parameters.
   * @returns A promise resolving to an array of entities, or a paginated response.
   */
  getAll(schoolId: string, options?: any): Promise<T[] | { data: T[]; count: number } | any>;

  /**
   * Inserts a new entity into the storage engine.
   * 
   * @param schoolId - The enterprise school identifier for tenant isolation.
   * @param item - The partial entity data to be created.
   * @returns The fully persisted entity with database defaults and generated ID.
   */
  create(schoolId: string, item: Partial<T>): Promise<T>;

  /**
   * Updates an existing entity inside the storage engine.
   * 
   * @param schoolId - The enterprise school identifier for tenant isolation.
   * @param id - The unique ID of the record.
   * @param item - The updated attributes.
   * @returns The fully updated entity.
   */
  update(schoolId: string, id: string, item: Partial<T>): Promise<T>;

  /**
   * Permanently deletes an entity by its unique ID.
   * 
   * @param schoolId - The enterprise school identifier for tenant isolation.
   * @param id - The unique ID of the record.
   * @returns True if deletion succeeded, false otherwise.
   */
  delete(schoolId: string, id: string): Promise<boolean>;

  /**
   * Verifies if an entity exists in the storage engine.
   * 
   * @param schoolId - The enterprise school identifier for tenant isolation.
   * @param id - The unique ID of the record.
   * @returns True if the entity exists, false otherwise.
   */
  exists(schoolId: string, id: string): Promise<boolean>;

  /**
   * Counts the total number of entities matching the given criteria.
   * 
   * @param schoolId - The enterprise school identifier for tenant isolation.
   * @param options - Filtering options for counting.
   * @returns The total number of matched entities.
   */
  count(schoolId: string, options?: any): Promise<number>;
}
