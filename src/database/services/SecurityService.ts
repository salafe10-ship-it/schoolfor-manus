
import { UserRepository } from '../repositories/UserRepository';
import { User, UserRole } from '../../types';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { IoCContainer } from '../IoCContainer';

export class SecurityService {
  public static $inject = ['UserRepository'];

  constructor(private userRepo: UserRepository) {}

  private static get userRepoInstance(): UserRepository {
    return IoCContainer.getInstance().resolve<UserRepository>('UserRepository');
  }

  public static async authenticate(email: string, passwordHash: string): Promise<User | null> {
    // In real implementation:
    // 1. Fetch user by email
    // 2. Verify password hash
    // 3. Update last login
    EnterpriseLogger.info(`Authentication attempt for ${email}`, "SecurityService");
    return null; // Placeholder
  }

  public static async authorize(userId: string, requiredPermission: string): Promise<boolean> {
    const user = await this.userRepoInstance.getById(userId);
    if (!user) return false;
    
    // Check permissions directly or via roles/groups
    return user.permissions.includes(requiredPermission);
  }

  public static async validatePermission(userId: string, requiredPermission: string): Promise<void> {
    const authorized = await this.authorize(userId, requiredPermission);
    if (!authorized) {
      throw new Error(`غير مصرح لك بالقيام بهذا الإجراء (${requiredPermission})`);
    }
  }

  // Row Level Security (RLS) Helper
  public static async validateTenantAccess(userId: string, targetSchoolId: string): Promise<boolean> {
    const user = await this.userRepoInstance.getById(userId);
    if (!user) return false;
    return user.schoolId === targetSchoolId;
  }
}
