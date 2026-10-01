import React, { useState } from 'react';
import Modal from './Modal';
import { Ban, AlertCircle } from 'lucide-react';

const RevokeModal = ({ isOpen, onClose, onRevoke, certificate, isLoading }) => {
  const [reason, setReason] = useState('Certificate is no longer required.');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for revocation.');
      return;
    }
    onRevoke(reason.trim());
  };

  const handleClose = () => {
    setError('');
    setReason('Certificate is no longer required.');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Revoke Certificate">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
          <Ban className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold block text-rose-900 mb-0.5">Important Warning:</span>
            Revoking a certificate permanently deactivates it. Revoked certificates cannot be renewed or reinstated.
          </div>
        </div>

        {certificate && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span className="font-medium text-slate-700">Domain:</span>
              <span className="font-mono">{certificate.domain}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-700">Certificate ID:</span>
              <span className="font-mono">{certificate.certificateId}</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Revocation Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows="3"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition"
            placeholder="e.g. Key compromise, domain decommissioned, superseded..."
            required
          />
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
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm shadow-rose-200 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            )}
            Confirm Revocation
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RevokeModal;
