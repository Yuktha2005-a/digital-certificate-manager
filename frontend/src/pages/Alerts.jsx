import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  Ban,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Radio,
  Clock,
  Filter,
} from 'lucide-react';
import { certificateApi, liveCertificateApi } from '../services/api';

const Alerts = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, EXPIRING_SOON, EXPIRED, REVOKED, CHANGED
  const [lastChecked, setLastChecked] = useState(new Date());
  const [checkingLive, setCheckingLive] = useState(false);
  const [error, setError] = useState('');

  const fetchAlertData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await certificateApi.getCertificates();
      if (res.success) {
        setCertificates(res.certificates || []);
        setLastChecked(new Date());
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message || 'Failed to fetch alert data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertData();

    // Auto-refresh every 60 seconds while page is open (Section 26)
    const interval = setInterval(() => {
      fetchAlertData();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleCheckAgain = async () => {
    try {
      setCheckingLive(true);
      setError('');
      // Trigger check all live TLS handshakes
      await liveCertificateApi.checkAll();
      // Then re-fetch certificates to reflect updated live statuses
      await fetchAlertData();
    } catch (err) {
      setError(err.message || 'Failed to refresh and check live certificates.');
    } finally {
      setCheckingLive(false);
    }
  };

  // Group certificates into alert categories
  const now = new Date();

  const expiringSoonList = certificates.filter((c) => c.status === 'EXPIRING SOON');
  const expiredList = certificates.filter((c) => c.status === 'EXPIRED');
  const revokedList = certificates.filter((c) => c.status === 'REVOKED');
  const changedList = certificates.filter((c) => c.liveCertificateChecked && c.liveCertificateChanged);

  const totalAlertsCount =
    expiringSoonList.length + expiredList.length + revokedList.length + changedList.length;

  // Filtered alert cards list
  let displayAlerts = [];

  if (activeFilter === 'ALL' || activeFilter === 'EXPIRING_SOON') {
    expiringSoonList.forEach((c) =>
      displayAlerts.push({
        type: 'EXPIRING_SOON',
        cert: c,
        badge: 'Warning',
        title: '⚠ Certificate Expiring Soon',
        color: 'border-amber-200 bg-amber-50/40 text-amber-800',
        icon: AlertTriangle,
        iconColor: 'text-amber-600 bg-amber-100',
      })
    );
  }

  if (activeFilter === 'ALL' || activeFilter === 'EXPIRED') {
    expiredList.forEach((c) =>
      displayAlerts.push({
        type: 'EXPIRED',
        cert: c,
        badge: 'Critical',
        title: '🔴 Certificate Expired',
        color: 'border-rose-200 bg-rose-50/40 text-rose-800',
        icon: AlertOctagon,
        iconColor: 'text-rose-600 bg-rose-100',
      })
    );
  }

  if (activeFilter === 'ALL' || activeFilter === 'REVOKED') {
    revokedList.forEach((c) =>
      displayAlerts.push({
        type: 'REVOKED',
        cert: c,
        badge: 'Revoked',
        title: '⛔ Certificate Revoked',
        color: 'border-slate-300 bg-slate-100/50 text-slate-800',
        icon: Ban,
        iconColor: 'text-slate-600 bg-slate-200',
      })
    );
  }

  if (activeFilter === 'ALL' || activeFilter === 'CHANGED') {
    changedList.forEach((c) =>
      displayAlerts.push({
        type: 'CHANGED',
        cert: c,
        badge: 'Live Anomaly',
        title: '🔄 Live Certificate Changed',
        color: 'border-indigo-200 bg-indigo-50/40 text-indigo-900',
        icon: Radio,
        iconColor: 'text-indigo-600 bg-indigo-100',
      })
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security & Expiry Alerts</h1>
            {totalAlertsCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                {totalAlertsCount}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Last Checked: <strong className="text-slate-700">{lastChecked.toLocaleTimeString()}</strong> (Auto-refreshes every 60s)
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAlertData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleCheckAgain}
            disabled={checkingLive}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-200 transition disabled:opacity-50 cursor-pointer"
          >
            <Radio className={`w-4 h-4 ${checkingLive ? 'animate-pulse' : ''}`} />
            <span>{checkingLive ? 'Inspecting Live TLS...' : 'Check Again'}</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
            activeFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Alerts ({totalAlertsCount})
        </button>

        <button
          onClick={() => setActiveFilter('EXPIRING_SOON')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'EXPIRING_SOON'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Expiring Soon ({expiringSoonList.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('EXPIRED')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'EXPIRED'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span>Expired ({expiredList.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('CHANGED')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'CHANGED'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          <span>Live Changed ({changedList.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('REVOKED')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'REVOKED'
              ? 'bg-slate-700 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          <span>Revoked ({revokedList.length})</span>
        </button>
      </div>

      {/* Alert Cards Container */}
      {loading && certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-xs font-medium text-slate-500">Scanning certificate alerts...</p>
        </div>
      ) : displayAlerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Active Alerts</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeFilter !== 'ALL'
              ? 'No certificates match this alert category.'
              : 'All digital certificates are healthy, active, and matching their live counterparts.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayAlerts.map((alert, index) => {
            const cert = alert.cert;
            const Icon = alert.icon;
            const expiry = new Date(cert.expiryDate);
            const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            return (
              <div
                key={`${alert.type}-${cert._id}-${index}`}
                className={`p-5 rounded-2xl border ${alert.color} bg-white shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${alert.iconColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 leading-tight">{alert.title}</h3>
                        <span className="text-[11px] font-mono text-slate-500">ID: {cert.certificateId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100/80 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Target Domain:</span>
                      <strong className="text-slate-900 font-semibold">{cert.domain}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Issuer:</span>
                      <span className="text-slate-700 truncate max-w-[200px]" title={cert.issuer}>
                        {cert.issuer}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Expiry Date:</span>
                      <span className="text-slate-800 font-medium">
                        {new Date(cert.expiryDate).toLocaleDateString()}
                      </span>
                    </div>

                    {alert.type === 'EXPIRING_SOON' && (
                      <div className="flex items-center justify-between font-semibold text-amber-700 bg-amber-50 p-2 rounded-lg">
                        <span>Days Remaining:</span>
                        <span>{daysLeft} days</span>
                      </div>
                    )}

                    {alert.type === 'EXPIRED' && (
                      <div className="flex items-center justify-between font-semibold text-rose-700 bg-rose-50 p-2 rounded-lg">
                        <span>Validity Status:</span>
                        <span>Expired {Math.abs(daysLeft)} days ago</span>
                      </div>
                    )}

                    {alert.type === 'REVOKED' && (
                      <div className="p-2 rounded-lg bg-slate-50 text-slate-700 space-y-0.5">
                        <span className="font-semibold block text-[11px] text-slate-500">Revocation Reason:</span>
                        <p className="italic text-xs">{cert.revocationReason || 'No reason specified'}</p>
                      </div>
                    )}

                    {alert.type === 'CHANGED' && (
                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                        <span className="font-semibold block text-xs">Live Fingerprint Mismatch:</span>
                        <p className="text-[11px] text-rose-700">
                          The live website certificate fingerprint differs from the stored record in the database.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                  <Link
                    to={`/certificates/${cert._id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition cursor-pointer"
                  >
                    <span>Manage Certificate</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Alerts;
