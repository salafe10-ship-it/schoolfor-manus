import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

export interface TrustedAuthTargetResolver {
  verifyTargetAuthUser(authUserId: string): Promise<{ authUserId: string } | null>;
}

/** Deployment-only adapter. Credentials are never accepted from callers. */
export class SupabaseAdminAuthTargetResolver implements TrustedAuthTargetResolver {
  private readonly client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    if (client) {
      this.client = client;
      return;
    }
    const url = String(process.env.SUPABASE_URL || '').trim();
    const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    if (!url || !serviceRoleKey) throw new Error('Deployment-controlled Supabase Auth verification is unavailable.');
    this.client = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  }

  async verifyTargetAuthUser(authUserId: string): Promise<{ authUserId: string } | null> {
    const target = authUserId.trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(target)) return null;
    const { data, error } = await this.client.auth.admin.getUserById(target);
    if (error || !data.user) return null;
    return { authUserId: (data.user as User).id };
  }
}
