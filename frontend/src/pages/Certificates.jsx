import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  PlusCircle,
  Radio,
  RefreshCw,
  Eye,
  Trash2,
  Calendar,
  Building,
  Hash,
  AlertCircle,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { certificateApi, liveCertificateApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LiveStatusBadge from '../components/LiveStatusBadge';
import ConfirmModal from '../components/ConfirmModal';

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Check all live state
  const [checkingAll, setCheckingAll] = useState(false);
  const [checkAllSummary, setCheckAllSummary] = useState(null);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await certificateApi.getCertificates(search, statusFilter);
      if (data.success) {
        setCertificates(data.certificates || []);
      }
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError(err.message || 'Failed to fetch certificates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCertificates();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setError('');
      const res = await certificateApi.delete(deleteTarget._id);
      if (res.success) {
        setSuccessMsg(`Certificate ${deleteTarget.certificateId} was deleted.`);
        setDeleteTarget(null);
        await fetchCertificates();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete certificate.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCheckAllLive = async () => {
    try {
      setCheckingAll(true);
      setError('');
      setCheckAllSummary(null);
      const res = await liveCertificateApi.checkAll();
      if (res.success && res.summary) {
        setCheckAllSummary(res.summary);
        await fetchCertificates();
      }
    } catch (err) {
      setError(err.message || 'Failed to run live check across certificates.');
    } finally {
      setCheckingAll(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Certificates Registry</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage, inspect, search, and monitor all registered digital certificates
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchCertificates}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleCheckAllLive}
            disabled={checkingAll || certificates.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition disabled:opacity-50 cursor-pointer"
          >
            <Radio className={`w-4 h-4 ${checkingAll ? 'animate-pulse' : ''}`} />
            <span>{checkingAll ? 'Checking Live...' : 'Check All Live'}</span>
          </button>

          <Link
            to="/add-certificate"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-200 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Certificate</span>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Live Check Summary Banner */}
      {checkAllSummary && (
        <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl text-indigo-900 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" />
            <span className="text-xs sm:text-sm">
              Live TLS Check Summary &mdash; Checked: <strong>{checkAllSummary.checked}</strong> | Changed:{' '}
              <strong className={checkAllSummary.changed > 0 ? 'text-rose-600' : ''}>
                {checkAllSummary.changed}
              </strong>{' '}
              | Unchanged: <strong className="text-emerald-700">{checkAllSummary.unchanged}</strong> | Failed:{' '}
              <strong className={checkAllSummary.failed > 0 ? 'text-amber-600' : ''}>
                {checkAllSummary.failed}
              </strong>
            </span>
          </div>
          <button
            onClick={() => setCheckAllSummary(null)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 self-end sm:self-auto"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Status Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ID, domain, issuer..."
            className="w-full pl-10 pr-20 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Filter:
          </span>
          {['ALL', 'ACTIVE', 'EXPIRING SOON', 'EXPIRED', 'REVOKED'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition cursor-pointer ${
                statusFilter === filter
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-xs font-medium text-slate-500">Loading certificates...</p>
        </div>
      ) : certificates.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Certificates Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || statusFilter !== 'ALL'
              ? 'No certificates match your search query or filter. Try resetting the filters.'
              : 'No digital certificates are currently recorded. Click below to add or upload one.'}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {(search || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            <Link
              to="/add-certificate"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer"
            >
              Add Certificate
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">Certificate ID</th>
                    <th className="py-3.5 px-4">Domain</th>
                    <th className="py-3.5 px-4">Issuer</th>
                    <th className="py-3.5 px-4">Issue Date</th>
                    <th className="py-3.5 px-4">Expiry Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Live Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {certificates.map((cert) => (
                    <tr key={cert._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-900">
                        {cert.certificateId}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {cert.domain}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 truncate max-w-[160px]" title={cert.issuer}>
                        {cert.issuer}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {new Date(cert.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-800 whitespace-nowrap">
                        {new Date(cert.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={cert.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <LiveStatusBadge
                          checked={cert.liveCertificateChecked}
                          changed={cert.liveCertificateChanged}
                        />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/certificates/${cert._id}`}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="View Certificate Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(cert)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Certificate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View (Section 18: On mobile, use cards instead of forcing a large table) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
            {certificates.map((cert) => (
              <div
                key={cert._id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-tight">
                      {cert.domain}
                    </h3>
                    <span className="font-mono text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Hash className="w-3 h-3 text-slate-400" />
                      {cert.certificateId}
                    </span>
                  </div>
                  <StatusBadge status={cert.status} size="sm" />
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{cert.issuer}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Expires:
                    </span>
                    <span className="font-medium text-slate-800">
                      {new Date(cert.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500">Live Status:</span>
                    <LiveStatusBadge
                      checked={cert.liveCertificateChecked}
                      changed={cert.liveCertificateChanged}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Link
                    to={`/certificates/${cert._id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(cert)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition border border-rose-200 cursor-pointer"
                    title="Delete Certificate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Safe Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Certificate"
        message={`Are you sure you want to delete this certificate? This will permanently remove ${deleteTarget?.certificateId} (${deleteTarget?.domain}) and all its lifecycle history from the database.`}
        confirmText="Delete Certificate"
        cancelText="Cancel"
        isDanger={true}
        isLoading={deleting}
      />
    </div>
  );
};

export default Certificates;
