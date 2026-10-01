import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

const LiveStatusBadge = ({ checked, changed }) => {
  if (!checked) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
        <span>Not Checked</span>
      </span>
    );
  }

  if (changed) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
        <span>Changed</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
      <span>Live Verified</span>
    </span>
  );
};

export default LiveStatusBadge;
