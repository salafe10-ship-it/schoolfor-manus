import type { InventoryWarehouseLocation, InventoryWarehouseLocationType } from '../../../types';

export const INVENTORY_WAREHOUSE_LOCATION_TYPES: InventoryWarehouseLocationType[] = [
  'receiving', 'storage', 'picking', 'dispatch', 'quarantine'
];

const requiredText = (value: unknown, label: string): string => {
  const result = String(value || '').trim();
  if (!result) throw new Error(`${label} مطلوب.`);
  return result;
};

/** Validate the location tree kept inside the canonical inventory snapshot. */
export const validateWarehouseLocations = (
  locations: unknown,
  warehouseLabel = 'المستودع'
): InventoryWarehouseLocation[] => {
  if (locations === undefined) return [];
  if (!Array.isArray(locations)) throw new Error(`${warehouseLabel} يتطلب قائمة مواقع صالحة.`);

  const ids = new Set<string>();
  const codes = new Set<string>();
  const rows = locations.map((value, index) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`${warehouseLabel} الموقع ${index + 1} غير صالح.`);
    }
    const row = value as Record<string, unknown>;
    const id = requiredText(row.id, `${warehouseLabel} معرف الموقع ${index + 1}`);
    const code = requiredText(row.code, `${warehouseLabel} رمز الموقع ${index + 1}`);
    const name = requiredText(row.name, `${warehouseLabel} اسم الموقع ${index + 1}`);
    const type = String(row.type || '').trim() as InventoryWarehouseLocationType;
    if (!INVENTORY_WAREHOUSE_LOCATION_TYPES.includes(type)) {
      throw new Error(`${warehouseLabel} نوع الموقع ${id} غير معتمد.`);
    }
    const normalizedCode = code.toLocaleLowerCase();
    if (ids.has(id)) throw new Error(`معرف الموقع ${id} مكرر داخل ${warehouseLabel}.`);
    if (codes.has(normalizedCode)) throw new Error(`رمز الموقع ${code} مكرر داخل ${warehouseLabel}.`);
    ids.add(id);
    codes.add(normalizedCode);

    if (row.capacity !== undefined && row.capacity !== null && row.capacity !== '') {
      if (typeof row.capacity !== 'number' || !Number.isFinite(row.capacity) || row.capacity <= 0) {
        throw new Error(`سعة الموقع ${code} يجب أن تكون رقماً موجباً.`);
      }
    }
    const blocked = row.blocked === true;
    if (blocked && !String(row.blockedReason || '').trim()) {
      throw new Error(`سبب حظر الموقع ${code} مطلوب.`);
    }
    return {
      id,
      code,
      name,
      type,
      ...(String(row.parentId || '').trim() ? { parentId: String(row.parentId).trim() } : {}),
      ...(row.capacity !== undefined && row.capacity !== null && row.capacity !== '' ? { capacity: Number(row.capacity) } : {}),
      ...(blocked ? { blocked: true, blockedReason: String(row.blockedReason).trim() } : {})
    };
  });

  const locationIds = new Set(rows.map(row => row.id));
  const locationsById = new Map(rows.map(row => [row.id, row]));
  rows.forEach(row => {
    if (row.parentId && row.parentId === row.id) throw new Error(`الموقع ${row.code} لا يمكن أن يكون أباً لنفسه.`);
    if (row.parentId && !locationIds.has(row.parentId)) throw new Error(`الموقع الأب للموقع ${row.code} غير موجود.`);
  });

  const visitState = new Map<string, 'visiting' | 'visited'>();
  const visit = (id: string): void => {
    const state = visitState.get(id);
    if (state === 'visiting') throw new Error(`تسلسل المواقع في ${warehouseLabel} يحتوي على حلقة عند ${locationsById.get(id)?.code || id}.`);
    if (state === 'visited') return;
    visitState.set(id, 'visiting');
    const parentId = locationsById.get(id)?.parentId;
    if (parentId) visit(parentId);
    visitState.set(id, 'visited');
  };
  rows.forEach(row => visit(row.id));

  return rows;
};
