import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PlusCircle,
  Upload,
  Calendar,
  Building,
  Globe,
  Hash,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { certificateApi } from '../services/api';

const AddCertificate = () => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'manual'

  // Manual entry form state
  const [manualForm, setManualForm] = useState({
    certificateId: '',
    domain: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    signatureAlgorithm: 'SHA256withRSA',
  });

  // File upload form state
  const [file, setFile] = useState(null);
  const [uploadDomain, setUploadDomain] = useState('');
  const [uploadCertId, setUploadCertId] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  // Handle Manual Form Change
  const handleManualChange = (e) => {
    setManualForm({
      ...manualForm,
      [e.target.name]: e.target.value,
    });
  };

  // Submit Manual Entry
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const { certificateId, domain, issuer, issueDate, expiryDate } = manualForm;

    // Validation
    if (!certificateId.trim() || !domain.trim() || !issuer.trim() || !issueDate || !expiryDate) {
      setError('All fields are required.');
      return;
    }

    if (new Date(expiryDate) <= new Date(issueDate)) {
      setError('Expiry date must be after issue date.');
      return;
    }

    setLoading(true);
    try {
      const res = await certificateApi.create(manualForm);
      if (res.success) {
        setSuccessMsg(`Certificate '${res.certificate.certificateId}' created successfully.`);
        setTimeout(() => {
          navigate(`/certificates/${res.certificate._id}`);
        }, 1200);
      } else {
        setError(res.message || 'Failed to create certificate.');
      }
    } catch (err) {
      setError(err.message || 'Error occurred while saving certificate.');
    } finally {
      setLoading(false);
    }
  };

  // Submit File Upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!file) {
      setError('Please select a digital certificate file (.crt, .cer, or .pem).');
      return;
    }

    const formData = new FormData();
    formData.append('certificateFile', file);
    if (uploadDomain.trim()) formData.append('domain', uploadDomain.trim());
    if (uploadCertId.trim()) formData.append('certificateId', uploadCertId.trim());

    setLoading(true);
    try {
      const res = await certificateApi.upload(formData);
      if (res.success) {
        setSuccessMsg(
          `Certificate parsed and uploaded successfully! (Domain: ${res.certificate.domain}, Serial: ${res.certificate.liveCertificateSerialNumber || 'Extracted'})`
        );
        setTimeout(() => {
          navigate(`/certificates/${res.certificate._id}`);
        }, 1500);
      } else {
        setError(res.message || 'Failed to upload certificate.');
      }
    } catch (err) {
      setError(err.message || 'Error occurred while parsing uploaded certificate.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearManual = () => {
    setManualForm({
      certificateId: '',
      domain: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      signatureAlgorithm: 'SHA256withRSA',
    });
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back button and page header */}
      <div>
        <Link
          to="/certificates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Certificates</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add Digital Certificate</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Upload an actual X.509 certificate file or record certificate parameters manually
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <span className="font-semibold leading-relaxed">{successMsg}</span>
        </div>
      )}

      {/* Mode Selection Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-6 pt-4 gap-6">
        <button
          type="button"
          onClick={() => {
            setActiveTab('upload');
            setError('');
          }}
          className={`pb-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'upload'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Certificate File</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('manual');
            setError('');
          }}
          className={`pb-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'manual'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Manual Entry</span>
        </button>
      </div>

      {/* Tab 1: File Upload Form */}
      {activeTab === 'upload' && (
        <div className="bg-white p-6 sm:p-8 rounded-b-2xl border border-t-0 border-slate-200/80 shadow-xs space-y-6">
          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-indigo-900 text-xs flex items-start gap-3">
            <Info className="w-5 h-5 shrink-0 text-indigo-600 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold block text-indigo-950 mb-0.5">Automated X.509 Extraction:</span>
              Upload a <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono text-[11px]">.crt</code>,{' '}
              <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono text-[11px]">.cer</code>, or{' '}
              <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono text-[11px]">.pem</code> file. The backend
              will parse Subject, Issuer, Validity Dates, Serial Number, and SHA-256 Fingerprint automatically.
              <br />
              <strong className="text-slate-700">Security notice:</strong> We never request or store private keys.
            </div>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-6">
            {/* Drag & Drop File Input Area */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Certificate File <span className="text-rose-500">*</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-slate-300 rounded-2xl hover:border-indigo-500 transition bg-slate-50/50">
                <div className="space-y-2 text-center">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div className="text-xs text-slate-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer font-semibold text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                    >
                      <span>Choose a certificate file</span>
                      <input
                        id="file-upload"
                        name="certificateFile"
                        type="file"
                        accept=".crt,.cer,.pem"
                        className="sr-only"
                        onChange={(e) => setFile(e.target.files[0])}
                      />
                    </label>
                    <p className="pl-1 inline">or drag and drop here</p>
                  </div>
                  <p className="text-[11px] text-slate-400">Accepted formats: .crt, .cer, .pem (up to 5MB)</p>
                  {file && (
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Custom Domain (Optional)
                </label>
                <input
                  type="text"
                  value={uploadDomain}
                  onChange={(e) => setUploadDomain(e.target.value)}
                  placeholder="Auto-extracted from CN if empty"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Custom Certificate ID (Optional)
                </label>
                <input
                  type="text"
                  value={uploadCertId}
                  onChange={(e) => setUploadCertId(e.target.value)}
                  placeholder="Auto-generated if empty"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                to="/certificates"
                className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !file}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-200 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Parsing & Saving...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload & Parse Certificate</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Manual Entry Form */}
      {activeTab === 'manual' && (
        <div className="bg-white p-6 sm:p-8 rounded-b-2xl border border-t-0 border-slate-200/80 shadow-xs space-y-6">
          <form onSubmit={handleManualSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Certificate ID */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Certificate ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    name="certificateId"
                    value={manualForm.certificateId}
                    onChange={handleManualChange}
                    placeholder="e.g. CERT-2026-001"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Must be unique across the system</p>
              </div>

              {/* Domain */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Domain / Common Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    name="domain"
                    value={manualForm.domain}
                    onChange={handleManualChange}
                    placeholder="e.g. example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Domain name evaluated for live TLS checks</p>
              </div>

              {/* Issuer */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Certificate Issuer <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    name="issuer"
                    value={manualForm.issuer}
                    onChange={handleManualChange}
                    placeholder="e.g. DigiCert Global Root CA, Let's Encrypt..."
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              {/* Issue Date */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Issue Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    name="issueDate"
                    value={manualForm.issueDate}
                    onChange={handleManualChange}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                  <Calendar className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Expiry Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    name="expiryDate"
                    value={manualForm.expiryDate}
                    onChange={handleManualChange}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                  <Calendar className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClearManual}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-200 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving Certificate...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Certificate</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddCertificate;
