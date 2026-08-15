/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Loader2, Search, Filter, X, CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

// 1. Smart Button
export interface SmartButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  disabled?: boolean;
  className?: string;
}

export function SmartButton({ label, icon, isLoading, variant = 'primary', disabled, className = '', ...props }: SmartButtonProps) {
  const base = "flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-xs transition-all duration-200 border cursor-pointer select-none active:scale-[0.98]";
  const variants = {
    primary: "bg-amber-600 hover:bg-amber-700 text-white border-amber-700 shadow-sm",
    secondary: "hover:bg-transparent text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700",
    danger: "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-sm",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600 border-transparent dark:text-slate-300 dark:hover:bg-slate-800"
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      <span>{isLoading ? 'جاري المعالجة...' : label}</span>
    </button>
  );
}

// 2. Smart Card
export interface SmartCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function SmartCard({ title, subtitle, children, actions, className = '' }: SmartCardProps) {
  return (
    <div className={`dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col gap-4 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            {title && <h3 className="font-bold text-slate-900 dark:text-white text-base">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}

// 3. Smart KPI Card
export interface SmartKPICardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  colorTheme?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
}

export function SmartKPICard({ title, value, change, isPositive = true, icon, colorTheme = 'indigo' }: SmartKPICardProps) {
  const themes = {
    indigo: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900/50",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900/50",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-100 dark:border-rose-900/50",
    sky: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/50 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/50",
  };

  return (
    <div className="dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 flex items-center justify-between">
      <div className="space-y-1">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{title}</span>
        <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</div>
        {change && (
          <div className={`text-xs font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            <span>{change}</span>
          </div>
        )}
      </div>
      <div className={`w-12 h-12 flex items-center justify-center border ${themes[colorTheme]}`}>
        {icon}
      </div>
    </div>
  );
}

// 4. Smart Search & Filter
export interface SmartSearchProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onFilterClick?: () => void;
}

export function SmartSearch({ value, onChange, placeholder = "بحث شامل...", onFilterClick }: SmartSearchProps) {
  return (
    <div className="flex items-center gap-3 w-full max-w-md bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">
      <div className="relative flex-1">
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent dark:bg-slate-800 dark:border-slate-700 pr-10 pl-4 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
        />
      </div>
      {onFilterClick && (
        <button
          onClick={onFilterClick}
          className="bg-gradient-to-r from-[#2a1d13] via-[#3a2719] to-[#2a1d13] text-amber-200 font-extrabold"
          title="تصفية متقدمة"
        >
          <Filter className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// 5. Smart Dialog
export interface SmartDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function SmartDialog({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }: SmartDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className={`dark:bg-slate-900 dark:border-slate-800 shadow-2xl w-full ${maxWidth} overflow-hidden flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

// 6. Smart Notification Toast helper
export interface SmartNotificationProps {
  type?: 'success' | 'warning' | 'error' | 'info';
  message: string;
  onClose?: () => void;
}

export function SmartNotificationBanner({ type = 'info', message, onClose }: SmartNotificationProps) {
  const styles = {
    success: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900",
    warning: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900",
    error: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900",
    info: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900"
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    error: <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-amber-600 shrink-0" />
  };

  return (
    <div className={`flex items-center justify-between p-4 border ${styles[type]} my-2`}>
      <div className="flex items-center gap-3">
        {icons[type]}
        <span className="text-xs font-bold">{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
