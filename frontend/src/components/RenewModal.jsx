import React, { useState } from 'react';
import Modal from './Modal';
import { Calendar, AlertCircle } from 'lucide-react';

const RenewModal = ({ isOpen, onClose, onRenew, certificate, isLoading }) => {
  const [expiryDate, setExpiryDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!expiryDate) {
      setError('Please select a new expiry date.');
      return;
    }

    if (certificate && certificate.issueDate) {
      const issueTime = new Date(certificate.issueDate).getTime();
      const newExpiryTime = new Date(expiryDate).getTime();
      if (newExpiryTime <= issueTime) {
        setError('New expiry date must be later than current issue date.');
        return;
      }
    }

    onRenew(expiryDate);
  };

  const handleClose = () => {
    setError('');
    setExpiryDate('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Renew Certificate">
      <form onSubmit={handleSubmit} className="space-y-4">
        {certificate && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span className="font-medium text-slate-700">Domain:</span>
              <span className="font-mono">{certificate.domain}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-700">Issue Date:</span>
              <span>{new Date(certificate.issueDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-700">Current Expiry:</span>
              <span className="text-amber-600 font-medium">
                {new Date(certificate.expiryDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            New Expiry Date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              required
            />
            <Calendar className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Specify the extended validity date for this certificate.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            )}
            Confirm Renewal
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RenewModal;
