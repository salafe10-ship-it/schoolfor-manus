export type PermissionOverrideEffect = 'allow' | 'deny';

export type PermissionOverride = {
  permissionKey: string;
  effect: PermissionOverrideEffect;
};

const normalizedSet = (values: readonly string[] | undefined): Set<string> => new Set(
  (values || []).map((value) => String(value || '').trim()).filter(Boolean),
);

/** Resolve the exact permission set visible in the employee row. Deny always wins. */
export function resolveEffectivePermissions(
  rolePermissionKeys: readonly string[] | undefined,
  overrides: readonly PermissionOverride[] | undefined,
): string[] {
  const effective = normalizedSet(rolePermissionKeys);
  for (const override of overrides || []) {
    if (override.effect === 'allow') effective.add(override.permissionKey);
  }
  for (const override of overrides || []) {
    if (override.effect === 'deny') effective.delete(override.permissionKey);
  }
  return [...effective].sort();
}

/** Persist only differences from the job baseline, keeping the policy easy to audit. */
export function derivePermissionOverrides(
  rolePermissionKeys: readonly string[] | undefined,
  desiredEffectivePermissionKeys: readonly string[] | undefined,
): PermissionOverride[] {
  const baseline = normalizedSet(rolePermissionKeys);
  const desired = normalizedSet(desiredEffectivePermissionKeys);
  const allKeys = new Set([...baseline, ...desired]);
  return [...allKeys]
    .sort()
    .flatMap((permissionKey): PermissionOverride[] => {
      const roleAllows = baseline.has(permissionKey);
      const employeeAllows = desired.has(permissionKey);
      if (roleAllows === employeeAllows) return [];
      return [{ permissionKey, effect: employeeAllows ? 'allow' : 'deny' }];
    });
}

export function hasPermissionMatrixChanges(
  savedEffectivePermissionKeys: readonly string[] | undefined,
  draftEffectivePermissionKeys: readonly string[] | undefined,
): boolean {
  return [...normalizedSet(savedEffectivePermissionKeys)].sort().join('|')
    !== [...normalizedSet(draftEffectivePermissionKeys)].sort().join('|');
}
