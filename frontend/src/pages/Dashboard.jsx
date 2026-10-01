import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Ban,
  Radio,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Globe,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { certificateApi, liveCertificateApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LiveStatusBadge from '../components/LiveStatusBadge';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
    revoked: 0,
    liveChecked: 0,
    certChanged: 0,
    notChecked: 0,
  });
  const [attentionRequired, setAttentionRequired] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingAll, setCheckingAll] = useState(false);
  const [checkAllSummary, setCheckAllSummary] = useState(null);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await certificateApi.getStats();
      if (data.success) {
        setStats(data.stats);
        setAttentionRequired(data.attentionRequired || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Could not load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCheckAllLive = async () => {
    try {
      setCheckingAll(true);
      setCheckAllSummary(null);
      setError('');
      const res = await liveCertificateApi.checkAll();
      if (res.success && res.summary) {
        setCheckAllSummary(res.summary);
        // Refresh dashboard stats after live checking
        await fetchDashboardData();
      }
    } catch (err) {
      setError(err.message || 'Failed to check live certificates.');
    } finally {
      setCheckingAll(false);
    }
  };

  if (loading && !stats.total) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-600">Loading dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Certificate Lifecycle Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Centralized visibility of digital certificates, expiry timelines, and real-time TLS status
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleCheckAllLive}
            disabled={checkingAll || stats.total === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-200 transition disabled:opacity-50 cursor-pointer"
          >
            <Radio className={`w-4 h-4 ${checkingAll ? 'animate-pulse text-indigo-200' : ''}`} />
            <span>{checkingAll ? 'Checking Live TLS...' : 'Check All Live'}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError('')}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Check All Live Summary Alert */}
      {checkAllSummary && (
        <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl text-indigo-900 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <span className="font-semibold block sm:inline">Live Certificate Check Complete:</span>{' '}
              <span className="text-slate-700 text-xs sm:text-sm">
                Checked: <strong className="text-slate-900">{checkAllSummary.checked}</strong> | Changed:{' '}
                <strong className={checkAllSummary.changed > 0 ? 'text-rose-600' : 'text-slate-900'}>
                  {checkAllSummary.changed}
                </strong>{' '}
                | Unchanged: <strong className="text-emerald-700">{checkAllSummary.unchanged}</strong> | Failed:{' '}
                <strong className={checkAllSummary.failed > 0 ? 'text-amber-600' : 'text-slate-900'}>
                  {checkAllSummary.failed}
                </strong>
              </span>
            </div>
          </div>
          <button
            onClick={() => setCheckAllSummary(null)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 self-end sm:self-auto"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Section 9: Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Certs
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.total}</div>
            <p className="text-[11px] text-slate-400 mt-1">In management</p>
          </div>
        </div>

        {/* Active */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Active
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-700">{stats.active}</div>
            <p className="text-[11px] text-emerald-600/80 mt-1">&gt; 30 days valid</p>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Expiring Soon
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-amber-700">{stats.expiringSoon}</div>
            <p className="text-[11px] text-amber-600/80 mt-1">&le; 30 days remaining</p>
          </div>
        </div>

        {/* Expired */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
              Expired
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-rose-700">{stats.expired}</div>
            <p className="text-[11px] text-rose-600/80 mt-1">Validity lapsed</p>
          </div>
        </div>

        {/* Revoked */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Revoked
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-slate-700">{stats.revoked}</div>
            <p className="text-[11px] text-slate-400 mt-1">Decommissioned</p>
          </div>
        </div>
      </div>

      {/* Section 10: Live Monitoring Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Live TLS Monitoring Status</h2>
              <p className="text-xs text-slate-500">Real-time port 443 handshake comparison with stored certificates</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-blue-700">Live Checked</span>
              <div className="text-2xl font-bold text-blue-900 mt-0.5">{stats.liveChecked}</div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></div>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-rose-700">Certificate Changed</span>
              <div className="text-2xl font-bold text-rose-900 mt-0.5">{stats.certChanged}</div>
            </div>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-600">Not Checked</span>
              <div className="text-2xl font-bold text-slate-800 mt-0.5">{stats.notChecked}</div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
          </div>
        </div>
      </div>

      {/* Section 10: Attention Required Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Attention Required</h2>
              <p className="text-xs text-slate-500">
                Certificates that are expiring soon, expired, revoked, or have live certificate changes
              </p>
            </div>
          </div>
          <Link
            to="/alerts"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
          >
            <span>View Alerts Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {attentionRequired.length === 0 ? (
          <div className="p-8 text-center">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-semibold text-slate-800">All Systems Nominal</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No certificates currently require immediate administrator attention. All monitored certificates are active.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {attentionRequired.slice(0, 5).map((cert) => {
              const now = new Date();
              const expiry = new Date(cert.expiryDate);
              const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={cert._id}
                  className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <StatusBadge status={cert.status} size="sm" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">
                          {cert.domain}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          ({cert.certificateId})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Issuer: {cert.issuer} • Expires:{' '}
                        <span className="font-medium text-slate-700">
                          {new Date(cert.expiryDate).toLocaleDateString()}
                        </span>
                        {cert.status !== 'REVOKED' && (
                          <span className="ml-1 text-slate-400">
                            ({daysLeft > 0 ? `${daysLeft} days remaining` : `${Math.abs(daysLeft)} days overdue`})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <LiveStatusBadge
                      checked={cert.liveCertificateChecked}
                      changed={cert.liveCertificateChanged}
                    />
                    <Link
                      to={`/certificates/${cert._id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                    >
                      <span>Manage</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {attentionRequired.length > 5 && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              to="/alerts"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              + {attentionRequired.length - 5} more certificates need attention &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
