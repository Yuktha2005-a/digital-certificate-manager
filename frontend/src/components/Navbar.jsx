import React from 'react';
import { Menu, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onOpenSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-slate-900">Certificate Manager</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
          {user?.name?.split(' ')[0] || 'Admin'}
        </span>
      </div>
    </header>
  );
};

export default Navbar;
