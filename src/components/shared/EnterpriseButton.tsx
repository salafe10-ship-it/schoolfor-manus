import { Loader2 } from 'lucide-react';
import React from 'react';
interface EnterpriseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  onClick?: () => void;
  disabled?: boolean;
}

export default function EnterpriseButton({
  label,
  icon,
  isLoading,
  variant = 'primary',
  disabled,
  ...props
}: EnterpriseButtonProps) {
  const baseStyles = "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all duration-200 border";
  
  const variants = {
    primary: "bg-amber-600 hover:bg-amber-700 text-white border-amber-700 shadow-sm",
    secondary: "hover:bg-transparent text-slate-700 border-slate-200 shadow-sm",
    danger: "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600 border-transparent"
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        icon
      )}
      <span>{isLoading ? 'جاري التنفيذ...' : label}</span>
    </button>
  );
}
