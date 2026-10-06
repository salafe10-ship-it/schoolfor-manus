export type SchoolStageLogoKey = 'primary' | 'middle' | 'secondary';

type CostCenterLike = {
  id?: unknown;
  code?: unknown;
  costCenterId?: unknown;
  type?: unknown;
  name?: unknown;
  nameAr?: unknown;
  isActive?: unknown;
  [key: string]: unknown;
};

const normalizeAlias = (value: unknown): string => String(value ?? '')
  .trim()
  .toLocaleLowerCase()
  .replace(/^cc[_-]/, '')
  .replace(/^stage[_-]/, '')
  .replace(/[\sـ\u064B-\u065F]/g, '');

const aliasesFor = (center: CostCenterLike): string[] => [
  center.id,
  center.code,
  center.costCenterId,
  center.type,
  center.name,
  center.nameAr
].map(normalizeAlias).filter(Boolean);

const stageLogoKeyForAlias = (value: unknown): SchoolStageLogoKey | null => {
  const alias = normalizeAlias(value).replace(/^st[-_]/, '');
  if (['primary', 'elementary', 'pri'].includes(alias) || alias.includes('ابتدائي')) return 'primary';
  if (['middle', 'intermediate', 'mid'].includes(alias) || alias.includes('متوسط')) return 'middle';
  if (['secondary', 'high', 'highschool', 'hi', 'sec'].includes(alias) || alias.includes('ثانوي')) return 'secondary';
  return null;
};

/**
 * Resolve an active cost center to one of the three stage logos configured for
 * this release. When a directory is supplied, an unknown or inactive center
 * never resolves from its raw input alone.
 */
export const resolveCostCenterStageLogoKey = (
  costCenter: unknown,
  configuredCostCenters?: unknown[]
): SchoolStageLogoKey | null => {
  const suppliedCenter = costCenter && typeof costCenter === 'object'
    ? costCenter as CostCenterLike
    : null;
  if (suppliedCenter?.isActive === false) return null;

  let resolvedCenter: CostCenterLike | null = suppliedCenter;
  if (Array.isArray(configuredCostCenters)) {
    const selectedAliases = suppliedCenter
      ? aliasesFor(suppliedCenter)
      : [normalizeAlias(costCenter)].filter(Boolean);
    resolvedCenter = configuredCostCenters
      .filter((item): item is CostCenterLike => Boolean(item && typeof item === 'object'))
      .filter(center => center.isActive !== false)
      .find(center => {
        if (suppliedCenter && center === suppliedCenter) return true;
        const candidateAliases = aliasesFor(center);
        return selectedAliases.some(alias => candidateAliases.includes(alias));
      }) || null;
  } else if (!resolvedCenter && costCenter != null) {
    const directAlias = String(costCenter).trim();
    resolvedCenter = directAlias ? { id: directAlias, type: directAlias } : null;
  }

  if (!resolvedCenter || resolvedCenter.isActive === false) return null;
  const orderedAliases = [
    resolvedCenter.type,
    resolvedCenter.costCenterId,
    resolvedCenter.code,
    resolvedCenter.id,
    resolvedCenter.name,
    resolvedCenter.nameAr
  ];
  return orderedAliases.map(stageLogoKeyForAlias).find(Boolean) || null;
};
