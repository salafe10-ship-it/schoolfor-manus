// src/modules/tenant/domain/Tenant.ts
import { Entity } from '../../shared-kernel/domain/Entity';

interface TenantProps {
  name: string;
  subdomain: string;
  isActive: boolean;
}

export class Tenant extends Entity<TenantProps> {
  constructor(props: TenantProps, id?: string) {
    super(props, id);
  }

  public static create(name: string, subdomain: string): Tenant {
    return new Tenant({
      name,
      subdomain,
      isActive: true,
    });
  }
}
