import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Radio,
  Clock,
  Shield,
  ShieldAlert,
  Globe,
  FileText,
  Calendar,
  Building,
  Key,
  Trash2,
  Ban,
  CheckCircle2,
  AlertTriangle,
  History,
  AlertOctagon,
  Copy,
  Check,
} from 'lucide-react';
import { certificateApi, liveCertificateApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LiveStatusBadge from '../components/LiveStatusBadge';
import RenewModal from '../components/RenewModal';
import RevokeModal from '../components/RevokeModal';
import ConfirmModal from '../components/ConfirmModal';

const CertificateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveChecking, setLiveChecking] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Feedback states
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  const fetchCertificateDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await certificateApi.getById(id);
      if (res.success && res.certificate) {
        setCertificate(res.certificate);
      } else {
        setError('Certificate not found.');
      }
    } catch (err) {
      console.error('Error fetching certificate:', err);
      setError(err.message || 'Certificate not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificateDetails();
  }, [id]);

  // Check Live Certificate Action
  const handleCheckLive = async () => {
    try {
      setLiveChecking(true);
      setError('');
      setSuccessMsg('');
      const res = await liveCertificateApi.checkLive(id);
      if (res.success) {
        setSuccessMsg(res.message);
        setCertificate(res.certificate);
      } else {
        setError(res.message || 'Failed to check live certificate.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to live certificate.');
    } finally {
      setLiveChecking(false);
    }
  };

  // Renew Certificate Action
  const handleRenew = async (expiryDate) => {
    try {
      setActionLoading(true);
      setError('');
      const res = await certificateApi.renew(certificate._id, expiryDate);
      if (res.success) {
        setSuccessMsg('Certificate renewed successfully.');
        setCertificate(res.certificate);
        setIsRenewOpen(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to renew certificate.');
    } finally {
      setActionLoading(false);
    }
  };

  // Revoke Certificate Action
  const handleRevoke = async (revocationReason) => {
    try {
      setActionLoading(true);
      setError('');
      const res = await certificateApi.revoke(certificate._id, revocationReason);
      if (res.success) {
        setSuccessMsg('Certificate has been revoked.');
        setCertificate(res.certificate);
        setIsRevokeOpen(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to revoke certificate.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Certificate Action
  const handleDelete = async () => {
    try {
      setActionLoading(true);
      setError('');
      const res = await certificateApi.delete(certificate._id);
      if (res.success) {
        navigate('/certificates');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete certificate.');
      setActionLoading(false);
    }
  };

  // Copy helper
  const handleCopyFingerprint = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-600">Loading certificate details...</p>
      </div>
    );
  }

  if (error && !certificate) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Certificate Not Found</h2>
        <p className="text-sm text-slate-500">{error}</p>
        <Link
          to="/certificates"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Registry</span>
        </Link>
      </div>
    );
  }

  // Format lifecycle history newest first
  const historyList = (certificate.lifecycleHistory || []).slice().reverse();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <Link
            to="/certificates"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Certificates</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {certificate.domain}
            </h1>
            <StatusBadge status={certificate.status} />
            <LiveStatusBadge
              checked={certificate.liveCertificateChecked}
              changed={certificate.liveCertificateChanged}
            />
          </div>
          <p className="text-xs font-mono text-slate-500 mt-1">
            ID: <span className="font-semibold text-slate-700">{certificate.certificateId}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCheckLive}
            disabled={liveChecking}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-200 transition disabled:opacity-50 cursor-pointer"
          >
            <Radio className={`w-4 h-4 ${liveChecking ? 'animate-pulse text-indigo-200' : ''}`} />
            <span>{liveChecking ? 'Checking Live...' : 'Check Live'}</span>
          </button>

          <button
            onClick={() => setIsRenewOpen(true)}
            disabled={certificate.status === 'REVOKED'}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title={certificate.status === 'REVOKED' ? 'Revoked certificates cannot be renewed' : 'Renew Certificate'}
          >
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <span>Renew</span>
          </button>

          <button
            onClick={() => setIsRevokeOpen(true)}
            disabled={certificate.status === 'REVOKED'}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title={certificate.status === 'REVOKED' ? 'Already revoked' : 'Revoke Certificate'}
          >
            <Ban className="w-4 h-4 text-rose-500" />
            <span>Revoke</span>
          </button>

          <button
            onClick={() => setIsDeleteOpen(true)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-transparent hover:border-rose-200 cursor-pointer"
            title="Delete Certificate"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">
            <span className="font-semibold block">Operation Alert</span>
            <span className="text-xs">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <div className="flex-1">
            <span className="font-semibold block">Success</span>
            <span className="text-xs">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Section 28: Stored vs Live Website Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Stored vs Live Website Certificate</h2>
              <p className="text-xs text-slate-500">
                Direct comparison between internal record and live TLS handshake over port 443
              </p>
            </div>
          </div>

          <div>
            {!certificate.liveCertificateChecked ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                Not Checked Yet
              </span>
            ) : certificate.liveCertificateChanged ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Certificate Changed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Certificate Matches
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5 w-1/4">Field</th>
                <th className="py-3 px-5 w-3/8">Stored Certificate</th>
                <th className="py-3 px-5 w-3/8">Live Website Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Issuer */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-3.5 px-5 font-semibold text-slate-700 flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" />
                  Issuer
                </td>
                <td className="py-3.5 px-5 text-slate-800">{certificate.issuer}</td>
                <td className="py-3.5 px-5 text-slate-800">
                  {certificate.liveCertificateChecked
                    ? certificate.liveCertificateIssuer || 'Unknown'
                    : <span className="text-slate-400 italic">Run Live Check</span>}
                </td>
              </tr>

              {/* Serial Number */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-3.5 px-5 font-semibold text-slate-700 flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-400" />
                  Serial Number
                </td>
                <td className="py-3.5 px-5 font-mono text-xs text-slate-700">
                  {certificate.liveCertificateSerialNumber || (certificate.source === 'UPLOAD' ? 'Extracted' : 'N/A')}
                </td>
                <td className="py-3.5 px-5 font-mono text-xs text-slate-700">
                  {certificate.liveCertificateChecked
                    ? certificate.liveCertificateSerialNumber || 'N/A'
                    : <span className="text-slate-400 italic">Run Live Check</span>}
                </td>
              </tr>

              {/* Fingerprint (SHA-256) */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-3.5 px-5 font-semibold text-slate-700 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" />
                  SHA-256 Fingerprint
                </td>
                <td className="py-3.5 px-5 font-mono text-xs break-all text-slate-700">
                  {certificate.fingerprint256 || 'N/A'}
                </td>
                <td className="py-3.5 px-5 font-mono text-xs break-all">
                  {certificate.liveCertificateChecked ? (
                    <span
                      className={
                        certificate.liveCertificateChanged
                          ? 'text-rose-600 font-semibold bg-rose-50 px-1 py-0.5 rounded'
                          : 'text-slate-700'
                      }
                    >
                      {certificate.liveCertificateFingerprint256 || 'N/A'}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Run Live Check</span>
                  )}
                </td>
              </tr>

              {/* Expiry Date */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-3.5 px-5 font-semibold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Expiry Date
                </td>
                <td className="py-3.5 px-5 font-medium text-slate-800">
                  {new Date(certificate.expiryDate).toLocaleDateString()}
                </td>
                <td className="py-3.5 px-5 font-medium text-slate-800">
                  {certificate.liveCertificateChecked && certificate.liveCertificateExpiryDate
                    ? new Date(certificate.liveCertificateExpiryDate).toLocaleDateString()
                    : <span className="text-slate-400 italic">Run Live Check</span>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {certificate.liveCertificateChecked && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>
              Last Live TLS Inspection:{' '}
              <strong className="text-slate-700 font-medium">
                {certificate.liveCertificateLastChecked
                  ? new Date(certificate.liveCertificateLastChecked).toLocaleString()
                  : 'N/A'}
              </strong>
            </span>
            <button
              onClick={handleCheckLive}
              disabled={liveChecking}
              className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              Re-check Live Now
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Certificate Information & Live Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Stored Certificate Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Certificate Information</h2>
              <p className="text-xs text-slate-500">Stored parameters and metadata</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">Certificate ID</span>
              <span className="font-mono font-medium text-slate-800 text-sm mt-0.5 block">
                {certificate.certificateId}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">Domain</span>
              <span className="font-semibold text-slate-900 text-sm mt-0.5 block truncate">
                {certificate.domain}
              </span>
            </div>

            <div className="col-span-2">
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">Issuer</span>
              <span className="font-medium text-slate-800 mt-0.5 block">{certificate.issuer}</span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">Issue Date</span>
              <span className="font-medium text-slate-800 mt-0.5 block">
                {new Date(certificate.issueDate).toLocaleDateString()}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">Expiry Date</span>
              <span className="font-medium text-slate-800 mt-0.5 block">
                {new Date(certificate.expiryDate).toLocaleDateString()}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">Source</span>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                {certificate.source}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">Certificate Type</span>
              <span className="font-medium text-slate-800 mt-0.5 block">{certificate.certificateType}</span>
            </div>

            {certificate.originalFileName && (
              <div className="col-span-2">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Original File Name</span>
                <span className="font-mono text-slate-700 mt-0.5 block">{certificate.originalFileName}</span>
              </div>
            )}

            {certificate.status === 'REVOKED' && (
              <div className="col-span-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-rose-800 font-semibold text-xs block">Revocation Reason:</span>
                <p className="text-rose-700 text-xs mt-0.5">{certificate.revocationReason || 'No reason specified'}</p>
              </div>
            )}

            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                  SHA-256 Fingerprint
                </span>
                {certificate.fingerprint256 && (
                  <button
                    type="button"
                    onClick={() => handleCopyFingerprint(certificate.fingerprint256)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    {copiedFingerprint ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 break-all">
                {certificate.fingerprint256 || 'Not recorded'}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Live TLS State & Handshake details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Live TLS Handshake</h2>
                <p className="text-xs text-slate-500">Live server response over HTTPS</p>
              </div>
            </div>

            <button
              onClick={handleCheckLive}
              disabled={liveChecking}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${liveChecking ? 'animate-spin' : ''}`} />
              <span>Verify Now</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">Live Checked</span>
              <span className="mt-1 block">
                <LiveStatusBadge
                  checked={certificate.liveCertificateChecked}
                  changed={certificate.liveCertificateChanged}
                />
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">Last Checked</span>
              <span className="font-medium text-slate-800 mt-1 block">
                {certificate.liveCertificateLastChecked
                  ? new Date(certificate.liveCertificateLastChecked).toLocaleString()
                  : 'Never'}
              </span>
            </div>

            <div className="col-span-2">
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">Live Issuer</span>
              <span className="font-medium text-slate-800 mt-0.5 block">
                {certificate.liveCertificateIssuer || 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">Live Expiry Date</span>
              <span className="font-medium text-slate-800 mt-0.5 block">
                {certificate.liveCertificateExpiryDate
                  ? new Date(certificate.liveCertificateExpiryDate).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">Certificate Changed</span>
              <span className="font-semibold mt-0.5 block">
                {certificate.liveCertificateChanged ? (
                  <span className="text-rose-600">YES &mdash; Fingerprint Differs</span>
                ) : (
                  <span className="text-emerald-600">NO &mdash; In Sync</span>
                )}
              </span>
            </div>

            <div className="col-span-2">
              <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Live SHA-256 Fingerprint
              </span>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 break-all">
                {certificate.liveCertificateFingerprint256 || 'Run live check to inspect'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 27: Certificate Lifecycle History */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Certificate Lifecycle History</h2>
            <p className="text-xs text-slate-500">
              Immutable audit trail of creations, live inspections, renewals, and revocations
            </p>
          </div>
        </div>

        {historyList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No lifecycle activity recorded yet.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {historyList.map((item, idx) => {
              let dotColor = 'bg-indigo-600';
              let badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
              let label = 'Activity';

              if (item.action === 'CREATED') {
                dotColor = 'bg-emerald-500';
                badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                label = 'Certificate Created';
              } else if (item.action === 'LIVE_CHECK') {
                dotColor = 'bg-blue-500';
                badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                label = 'Live Certificate Checked';
              } else if (item.action === 'RENEWED') {
                dotColor = 'bg-amber-500';
                badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                label = 'Certificate Renewed';
              } else if (item.action === 'REVOKED') {
                dotColor = 'bg-rose-500';
                badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                label = 'Certificate Revoked';
              }

              return (
                <div key={item._id || idx} className="relative group">
                  {/* Timeline bullet */}
                  <div
                    className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full ${dotColor} ring-4 ring-white shadow-xs`}
                  />

                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-1.5 hover:bg-slate-50 transition">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-md border tracking-wide uppercase ${badgeColor}`}
                      >
                        {label}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(item.performedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Renew Modal */}
      <RenewModal
        isOpen={isRenewOpen}
        onClose={() => setIsRenewOpen(false)}
        onRenew={handleRenew}
        certificate={certificate}
        isLoading={actionLoading}
      />

      {/* Revoke Modal */}
      <RevokeModal
        isOpen={isRevokeOpen}
        onClose={() => setIsRevokeOpen(false)}
        onRevoke={handleRevoke}
        certificate={certificate}
        isLoading={actionLoading}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Certificate"
        message={`Are you sure you want to delete certificate ${certificate.certificateId} (${certificate.domain})? This operation is permanent.`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
        isDanger={true}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default CertificateDetails;
