import type { InventoryItem } from '../../types';
import { getItemWarehouseBalances } from './inventoryCanonical';

export interface InventoryCapabilities {
  write?: boolean;
  approve?: boolean;
  settings?: boolean;
  boardApprove?: boolean;
  financialWrite?: boolean;
}

export const roundInventoryMoney = (value: number) => Number(value.toFixed(2));

// A zero reorder level means the legacy minimum remains the reorder threshold.
export const inventoryReorderThreshold = (item: InventoryItem) => Number(item.reorderLevel || item.minLevel || 0);

export const itemBelongsToWarehouse = (item: InventoryItem, warehouseId: string) =>
  item.warehouseId === warehouseId || Object.prototype.hasOwnProperty.call(getItemWarehouseBalances(item), warehouseId);

export function canApproveInventoryAmount(amount: number, capabilities: InventoryCapabilities, settings: Record<string, any> = {}) {
  if (!capabilities.approve) return false;
  const managerLimit = Number(settings.managerApprovalLimit || 0);
  const boardLimit = Number(settings.boardApprovalLimit || 0);
  if (boardLimit > 0 && amount > boardLimit) return false;
  return !(managerLimit > 0 && amount > managerLimit) || capabilities.boardApprove === true;
}
