// src/modules/authorization/domain/Policy.ts
import { Entity } from '../../shared-kernel/domain/Entity';

export type PolicyEffect = 'ALLOW' | 'DENY';

interface PolicyProps {
  name: string;
  effect: PolicyEffect;
  resource: string;
  action: string;
  conditions: Record<string, any>;
  tenantId: string;
  createdAt: Date;
}

export class Policy extends Entity<PolicyProps> {
  constructor(props: PolicyProps, id?: string) {
    super(props, id);
  }

  public static create(props: Omit<PolicyProps, 'createdAt'>): Policy {
    return new Policy({
      ...props,
      createdAt: new Date(),
    });
  }

  get effect(): PolicyEffect { return this.props.effect; }
  get resource(): string { return this.props.resource; }
  get action(): string { return this.props.action; }
  get conditions(): Record<string, any> { return this.props.conditions; }
  get tenantId(): string { return this.props.tenantId; }
}
