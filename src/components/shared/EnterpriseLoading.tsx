/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export function EnterpriseSkeleton({ className = "h-4 w-full" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg ${className}`} />
  );
}

export function EnterpriseProgress({ value = 50 }: { value?: number }) {
  return (
    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
      <div 
        className="bg-amber-600 h-full transition-all duration-300 rounded-full"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

export function EnterpriseLoadingOverlay({ message = "جاري تحميل البيانات المؤسسية..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 gap-3 min-h-[300px]">
      <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{message}</span>
    </div>
  );
}
