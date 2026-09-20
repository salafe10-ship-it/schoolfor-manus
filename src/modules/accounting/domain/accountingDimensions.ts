export type AccountingDimension = {
  key: string;
  code: string;
  name: string;
  stageId?: string;
  stageName?: string;
  active: boolean;
};

export const normalizeAccountingDimension = (value: unknown): string =>
  String(value || '').trim().toLowerCase().replace(/^cc[_-]/, '').replace(/^stage[_-]/, '');

export const buildAccountingDimensions = (stages: any[] = [], costCenters: any[] = []): AccountingDimension[] => {
  const activeStages = stages.filter(stage => stage?.isActive !== false);
  return costCenters
    .filter(center => center?.isActive !== false)
    .map(center => {
      const stage = activeStages.find(item => String(item.id) === String(center.stageId)
        || normalizeAccountingDimension(item.costCenterId) === normalizeAccountingDimension(center.id)
        || normalizeAccountingDimension(item.costCenterId) === normalizeAccountingDimension(center.code));
      const key = normalizeAccountingDimension(center.code || center.id);
      return {
        key,
        code: String(center.code || center.id || key),
        name: String(center.name || center.nameAr || key),
        stageId: stage?.id || center.stageId,
        stageName: stage?.name,
        active: center.isActive !== false && (!center.stageId || stage?.isActive === true)
      };
    });
};

export const validateAccountingDimension = (value: unknown, dimensions: AccountingDimension[]) => {
  const key = normalizeAccountingDimension(value);
  const match = dimensions.find(item => item.active && (item.key === key || normalizeAccountingDimension(item.code) === key));
  return match ? { valid: true as const, dimension: match } : { valid: false as const, error: `مركز التكلفة/المرحلة غير معرف أو غير نشط: ${String(value || '')}` };
};
