import { useState, useEffect } from 'react';
import api from '../api';
import { motion } from 'framer-motion';
import {
  Save, Upload, FileText, CheckCircle, AlertCircle, Wallet, Calendar, TrendingDown
} from 'lucide-react';

const Settings = () => {
  const [budget, setBudget] = useState('');
  const [currentBudget, setCurrentBudget] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentMonth = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  useEffect(() => { fetchBudget(); }, []);

  const fetchBudget = async () => {
    try {
      const res = await api.get('/budget');
      setBudget(res.data.amount || '');
      setCurrentBudget(res.data.amount || 0);
    } catch (error) {
      console.error('Error fetching budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3500);
  };

  const handleBudgetUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/budget', {
        amount: parseFloat(budget),
        month: new Date().toISOString().slice(0, 7),
      });
      setCurrentBudget(parseFloat(budget));
      showMessage('success', `Monthly budget set to ₹${parseFloat(budget).toLocaleString()} for ${currentMonth}`);
    } catch (error) {
      showMessage('error', 'Failed to update budget. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append('file', uploadFile);

    setUploading(true);
    try {
      const res = await api.post('/expenses/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showMessage('success', res.data.message);
      setUploadFile(null);
    } catch (error) {
      showMessage('error', error.response?.data?.detail || 'Upload failed. Check your CSV format.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-10 rounded-2xl w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your budget and import expense data</p>
      </div>

      {/* Toast Message */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium ${
            message.type === 'success'
              ? 'bg-success-500/10 border-success-500/30 text-success-400'
              : 'bg-danger-500/10 border-danger-500/30 text-danger-400'
          }`}
        >
          {message.type === 'success'
            ? <CheckCircle size={18} />
            : <AlertCircle size={18} />}
          {message.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Budget Settings */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card space-y-5"
        >
          <div className="flex items-center gap-3">
            <div className="stat-icon w-10 h-10 rounded-xl" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              <Wallet size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-dark-text">Monthly Budget</h2>
              <p className="text-xs text-dark-muted">Set your spending limit per month</p>
            </div>
          </div>

          {/* Current Status */}
          {currentBudget > 0 && (
            <div className="p-3 rounded-xl flex items-center gap-3"
              style={{ background: 'var(--bg-surface-2)' }}>
              <Calendar size={15} className="text-primary-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-dark-muted">Current budget for</p>
                <p className="text-sm font-semibold text-dark-text">
                  {currentMonth} — <span className="text-primary-400">₹{currentBudget.toLocaleString()}</span>
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleBudgetUpdate} className="space-y-4">
            <div>
              <label className="label">Monthly Limit (₹)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="input"
                placeholder="e.g. 25000"
                min="1"
                required
              />
              <p className="text-xs text-dark-muted mt-1.5">
                This applies to all monthly calculations — spending, savings, and alerts.
              </p>
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary w-full">
              {saving ? 'Saving…' : <><Save size={15} /> Save Budget</>}
            </button>
          </form>
        </motion.div>

        {/* CSV Import */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card space-y-5"
        >
          <div className="flex items-center gap-3">
            <div className="stat-icon w-10 h-10 rounded-xl" style={{ background: 'linear-gradient(135deg, #06B6D4, #0891B2)' }}>
              <Upload size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-dark-text">Import Expenses</h2>
              <p className="text-xs text-dark-muted">Bulk import from a CSV file</p>
            </div>
          </div>

          <form onSubmit={handleFileUpload} className="space-y-4">
            <div>
              <label className="label">Upload CSV File</label>
              <div
                className="rounded-xl p-6 text-center cursor-pointer relative transition-all duration-200"
                style={{
                  border: `2px dashed ${uploadFile ? '#6366F1' : 'var(--border)'}`,
                  background: uploadFile ? 'rgba(99,102,241,0.05)' : 'var(--bg-surface-2)',
                }}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2 pointer-events-none">
                  <FileText className="mx-auto text-dark-muted" size={24} />
                  <p className="text-sm text-dark-text font-medium">
                    {uploadFile ? uploadFile.name : 'Click to choose or drag & drop'}
                  </p>
                  <p className="text-xs text-dark-muted">CSV columns: date, amount, title, category (optional)</p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl text-xs text-dark-muted space-y-1"
              style={{ background: 'var(--bg-surface-2)' }}>
              <p className="font-semibold text-dark-text flex items-center gap-1"><TrendingDown size={12} /> Expected columns:</p>
              <p>• <code className="text-primary-400">date</code> — transaction date</p>
              <p>• <code className="text-primary-400">amount</code> — expense amount</p>
              <p>• <code className="text-primary-400">title</code> — description / narration</p>
              <p>• <code className="text-primary-400">category</code> — (optional, AI auto-fills)</p>
            </div>

            <button
              type="submit"
              disabled={!uploadFile || uploading}
              className="btn btn-secondary w-full"
            >
              {uploading
                ? <><span className="animate-spin inline-block mr-1">⟳</span> Importing…</>
                : <><Upload size={15} /> Import CSV</>
              }
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
