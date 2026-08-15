// src/modules/identity/domain/User.ts

export class User {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly mfaEnabled: boolean,
    public readonly isActive: boolean
  ) {}

  public static create(tenantId: string, email: string, passwordHash: string): User {
    // Domain invariant checks
    if (!email.includes('@')) {
      throw new Error('Invalid email format');
    }
    return new User(
      crypto.randomUUID(),
      tenantId,
      email,
      passwordHash,
      false,
      true
    );
  }
}
