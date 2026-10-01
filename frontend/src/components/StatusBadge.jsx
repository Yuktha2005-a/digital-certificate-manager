import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Ban } from 'lucide-react';

const StatusBadge = ({ status, size = 'md' }) => {
  const normalizedStatus = (status || '').toUpperCase();

  let config = {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    dot: 'bg-emerald-500',
    icon: ShieldCheck,
    label: 'ACTIVE',
  };

  if (normalizedStatus === 'EXPIRING SOON') {
    config = {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
      label: 'EXPIRING SOON',
    };
  } else if (normalizedStatus === 'EXPIRED') {
    config = {
      bg: 'bg-rose-50 border-rose-200 text-rose-700',
      dot: 'bg-rose-500',
      icon: AlertOctagon,
      label: 'EXPIRED',
    };
  } else if (normalizedStatus === 'REVOKED') {
    config = {
      bg: 'bg-slate-100 border-slate-300 text-slate-700',
      dot: 'bg-slate-500',
      icon: Ban,
      label: 'REVOKED',
    };
  }

  const IconComponent = config.icon;
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs gap-1.5' 
    : 'px-2.5 py-1 text-xs font-semibold gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs tracking-wide uppercase ${sizeClasses} ${config.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      <IconComponent className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
