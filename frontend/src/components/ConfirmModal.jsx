import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDanger = true,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center">
        {isDanger && (
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-4 border border-rose-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
        )}
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">{message}</p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2 ${
            isDanger
              ? 'bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-200'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200'
          }`}
        >
          {isLoading && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          )}
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
