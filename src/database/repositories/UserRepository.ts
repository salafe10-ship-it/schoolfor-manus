
import { getSupabaseClient } from '../client';
import { User } from '../../types';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';

export class UserRepository {
  public async getById(id: string): Promise<User | undefined> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
          if (!error && data) {
            return this.mapFromDatabase(data);
          }
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch user from Supabase:", "UserRepository", { error: err });
      }
    }
    FallbackStorage.assertCanonicalPersistence(`user read ${id}`);
    return FallbackStorage.getUsers().find(u => u.id === id);
  }

  // Add more methods for CRUD, search, etc.

  private mapFromDatabase(data: any): User {
    return {
      id: data.id,
      schoolId: data.school_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      status: data.status,
      avatar: data.avatar,
      permissions: data.permissions || [],
      groupIds: data.group_ids || [],
      branchIds: data.branch_ids || [],
      costCenterIds: data.cost_center_ids || [],
      lastLogin: data.last_login,
      passwordHash: data.password_hash,
      forcePasswordChange: data.force_password_change,
      twoFactorEnabled: data.two_factor_enabled,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}
