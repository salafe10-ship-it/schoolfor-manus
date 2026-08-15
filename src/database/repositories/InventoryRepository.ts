import { getSupabaseClient } from '../client';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { InventoryItem } from '../../types';
import { InventoryValidator } from '../../validation/validators';
import { IBaseRepository } from './IBaseRepository';

/**
 * Repository class handling CRUD and data fetching operations for School Inventory.
 * Fully conforms to the IBaseRepository<InventoryItem> enterprise interface.
 */
export class InventoryRepository implements IBaseRepository<InventoryItem> {
  // Instance methods delegating to static methods for interface compliance

  /**
   * Retrieves an inventory item by ID.
   */
  public async getById(schoolId: string, id: string): Promise<InventoryItem | null> {
    return InventoryRepository.getById(schoolId, id);
  }

  /**
   * Retrieves all inventory items matching options.
   */
  public async getAll(schoolId: string, options?: any): Promise<InventoryItem[]> {
    return InventoryRepository.getAll(schoolId, options);
  }

  /**
   * Creates a new inventory item.
   */
  public async create(schoolId: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
    return InventoryRepository.create(schoolId, item);
  }

  /**
   * Updates an existing inventory item.
   */
  public async update(schoolId: string, id: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
    return InventoryRepository.update(schoolId, id, item);
  }

  /**
   * Deletes an inventory item.
   */
  public async delete(schoolId: string, id: string): Promise<boolean> {
    return InventoryRepository.delete(schoolId, id);
  }

  /**
   * Checks if an inventory item exists.
   */
  public async exists(schoolId: string, id: string): Promise<boolean> {
    return InventoryRepository.exists(schoolId, id);
  }

  /**
   * Counts inventory items matching options.
   */
  public async count(schoolId: string, options?: any): Promise<number> {
    return InventoryRepository.count(schoolId, options);
  }

  // --- Static Methods ---

  /**
   * Retrieves an inventory item by its unique ID.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Unique inventory item ID.
   */
  public static async getById(schoolId: string, id: string): Promise<InventoryItem | null> {
    const rows = await FallbackStorage.performRead<InventoryItem>(
      schoolId,
      'inventory.getById',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        const { data, error } = await supabase.from('inventory').select('*').eq('school_id', schoolId).eq('id', id).maybeSingle();
        if (error) throw error;
        return data ? [data as InventoryItem] : [];
      },
      () => FallbackStorage.getInventory().filter(item => item.schoolId === schoolId && item.id === id)
    );
    return rows[0] || null;
  }

  /**
   * Retrieves all inventory items with optional filters.
   * @param schoolId - School enterprise tenant ID.
   * @param options - Filters.
   */
  public static async getAll(
    schoolId: string,
    options?: { branchId?: string; categoryId?: string; search?: string }
  ): Promise<InventoryItem[]> {
    return FallbackStorage.performRead<InventoryItem>(
      schoolId,
      'inventory.getAll',
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client is unavailable');
        let query = supabase.from('inventory').select('*').eq('school_id', schoolId);
        if (options?.branchId) query = query.eq('branch_id', options.branchId);
        if (options?.categoryId) query = query.eq('category_id', options.categoryId);
        if (options?.search) query = query.ilike('name', `%${options.search}%`);
        const { data, error } = await query.order('name', { ascending: true });
        if (error) throw error;
        return (data || []) as InventoryItem[];
      },
      () => {
        let items = FallbackStorage.getInventory().filter(i => i.schoolId === schoolId);
        if (options?.branchId) items = items.filter(i => i.warehouseId === options.branchId);
        if (options?.categoryId) items = items.filter(i => i.categoryId === options.categoryId);
        if (options?.search) {
          const sLower = options.search.toLowerCase();
          items = items.filter(i => i.name.toLowerCase().includes(sLower));
        }
        return items;
      }
    );
  }

  /**
   * Creates/inserts a new inventory item.
   * @param schoolId - School enterprise tenant ID.
   * @param item - Partial item data.
   */
  public static async create(schoolId: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
    return this.save(schoolId, item);
  }

  /**
   * Updates an existing inventory item.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Unique inventory item ID.
   * @param item - Partial item updates.
   */
  public static async update(schoolId: string, id: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
    return this.save(schoolId, { ...item, id });
  }

  /**
   * Core helper for saving or updating an inventory item.
   */
  public static async save(schoolId: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
    const id = item.id || `inv_item_${Date.now()}`;
    const newItem: InventoryItem = {
      ...item as InventoryItem,
      id,
      schoolId,
      quantity: item.quantity || 0,
      minLevel: item.minLevel || 0,
      maxLevel: item.maxLevel || 0,
      reorderLevel: item.reorderLevel || 0,
      costPrice: item.costPrice || 0,
      salePrice: item.salePrice || 0,
      vatRate: item.vatRate || 0,
      status: item.status || 'active',
      inventoryAccountId: item.inventoryAccountId || '',
      costOfGoodsAccountId: item.costOfGoodsAccountId || '',
      adjustmentAccountId: item.adjustmentAccountId || '',
      costCenterId: item.costCenterId || ''
    };

    // Prevent any data from reaching database/storage before validation
    InventoryValidator.validate(newItem);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .upsert({ ...newItem, school_id: schoolId })
          .select()
          .single();
        if (!error && data) return data as InventoryItem;
      } catch (err: any) {
        EnterpriseLogger.error("Failed to save inventory item in Supabase:", "InventoryRepository", { error: err });
      }
    }

    FallbackStorage.assertCanonicalPersistence(`inventory save ${id}`);

    const all = FallbackStorage.getInventory();
    const idx = all.findIndex(i => i.schoolId === schoolId && i.id === id);
    if (idx > -1) {
      all[idx] = { ...all[idx], ...newItem };
    } else {
      all.push(newItem);
    }
    FallbackStorage.saveInventory(all);
    return newItem;
  }

  /**
   * Deletes an inventory item from database.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Unique inventory item ID.
   */
  public static async delete(schoolId: string, id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('inventory')
          .delete()
          .eq('school_id', schoolId)
          .eq('id', id);
        if (!error) return true;
      } catch (err: any) {
        EnterpriseLogger.error("Failed to delete inventory item from Supabase:", "InventoryRepository", { error: err });
      }
    }

    FallbackStorage.assertCanonicalPersistence(`inventory delete ${id}`);

    const all = FallbackStorage.getInventory();
    const filtered = all.filter(i => !(i.schoolId === schoolId && i.id === id));
    if (filtered.length === all.length) return false;
    FallbackStorage.saveInventory(filtered);
    return true;
  }

  /**
   * Verifies if an inventory item exists.
   * @param schoolId - School enterprise tenant ID.
   * @param id - Unique inventory item ID.
   */
  public static async exists(schoolId: string, id: string): Promise<boolean> {
    const item = await this.getById(schoolId, id);
    return item !== null;
  }

  /**
   * Counts the total matched inventory items under tenant isolation.
   * @param schoolId - School enterprise tenant ID.
   * @param options - Filters.
   */
  public static async count(schoolId: string, options?: any): Promise<number> {
    const list = await this.getAll(schoolId, options);
    return list.length;
  }
}
