import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
  PointElement, LineElement, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Download, Upload, FileText, BarChart3, TrendingUp, PieChart, Loader2, CheckCircle } from 'lucide-react';
import ChartCard from '../components/ChartCard';

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  BarElement, Title, PointElement, LineElement, Filler
);

const COLORS = ['#6366F1','#8B5CF6','#06B6D4','#10B981','#F59E0B','#F43F5E','#EC4899','#3B82F6'];

const chartTooltipDefaults = {
  backgroundColor: '#1A1A27',
  titleColor: '#E2E8F0',
  bodyColor: '#94A3B8',
  borderColor: '#2D2D4A',
  borderWidth: 1,
};

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);
  const fileInputRef = useRef();

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses/summary');
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/expenses/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadMsg({ type: 'success', text: res.data.message });
      await fetchSummary();
    } catch (err) {
      setUploadMsg({ type: 'error', text: err.response?.data?.detail || 'Upload failed.' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const res = await api.get('/reports/export-pdf', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `budgetwise_report_${new Date().toISOString().slice(0, 10)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExportingPDF(false);
    }
  };

  const monthlyTrend = summary?.monthly_trend || [];
  const categoryBreakdown = summary?.category_breakdown || [];

  // Bar: monthly spending
  const barData = {
    labels: monthlyTrend.map(m => m.month),
    datasets: [{
      label: 'Total Spending (₹)',
      data: monthlyTrend.map(m => m.total),
      backgroundColor: monthlyTrend.map((_, i) =>
        i === monthlyTrend.length - 1 ? '#6366F1' : 'rgba(99,102,241,0.4)'
      ),
      borderColor: '#6366F1',
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  // Doughnut chart
  const doughnutData = {
    labels: categoryBreakdown.map(c => c.category),
    datasets: [{
      data: categoryBreakdown.map(c => c.total),
      backgroundColor: COLORS,
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  // Line: cumulative spending
  let cumulative = 0;
  const lineData = {
    labels: monthlyTrend.map(m => m.month),
    datasets: [{
      label: 'Cumulative Spending (₹)',
      data: monthlyTrend.map(m => { cumulative += m.total; return cumulative; }),
      borderColor: '#06B6D4',
      backgroundColor: 'rgba(6,182,212,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#06B6D4',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
    }],
  };

  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { ...chartTooltipDefaults, callbacks: { label: ctx => ` ₹${ctx.parsed.y?.toLocaleString()}` } },
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', font: { size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', font: { size: 11 }, callback: v => `₹${(v / 1000).toFixed(0)}k` } },
    },
  };
  const lineOptions = { ...barOptions, plugins: { ...barOptions.plugins, legend: { labels: { color: '#94A3B8', font: { size: 11 } } } } };
  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94A3B8', font: { size: 11 }, padding: 12, boxWidth: 12 } },
      tooltip: { ...chartTooltipDefaults, callbacks: { label: ctx => ` ₹${ctx.parsed?.toLocaleString()} (${categoryBreakdown[ctx.dataIndex]?.percent_of_total}%)` } },
    },
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="skeleton h-8 w-36 rounded-xl" />
        <div className="flex gap-2">
          <div className="skeleton h-10 w-32 rounded-xl" />
          <div className="skeleton h-10 w-36 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Financial Reports</h1>
          <p className="page-subtitle">Visualize and export your financial data</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCSVUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn btn-secondary"
          >
            {uploading
              ? <><Loader2 size={15} className="animate-spin" /> Importing…</>
              : <><Upload size={15} /> Import CSV</>
            }
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="btn btn-primary"
          >
            {exportingPDF
              ? <><Loader2 size={15} className="animate-spin" /> Generating…</>
              : <><Download size={15} /> Export PDF</>
            }
          </button>
        </div>
      </div>

      {/* Upload message */}
      {uploadMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={uploadMsg.type === 'success' ? 'alert-warning' : 'alert-danger'}
          style={uploadMsg.type === 'success' ? {
            background: 'rgba(16,185,129,0.1)',
            borderColor: 'rgba(16,185,129,0.3)',
          } : {}}
        >
          {uploadMsg.type === 'success'
            ? <CheckCircle size={16} className="text-success-400 shrink-0" />
            : <FileText size={16} className="text-danger-400 shrink-0" />
          }
          <span className={`text-sm ${uploadMsg.type === 'success' ? 'text-success-300' : 'text-danger-300'}`}>
            {uploadMsg.text}
          </span>
        </motion.div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Spent', value: `₹${(summary?.total_spent || 0).toLocaleString()}`, icon: '💸' },
          { label: 'Budget', value: `₹${(summary?.budget || 0).toLocaleString()}`, icon: '🎯' },
          { label: 'Remaining', value: `₹${(summary?.remaining || 0).toLocaleString()}`, icon: '💰' },
          { label: 'vs Last Month', value: `${summary?.this_month_vs_last > 0 ? '+' : ''}${summary?.this_month_vs_last || 0}%`, icon: '📊' },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="card text-center"
          >
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-xl font-bold text-dark-text">{s.value}</p>
            <p className="text-xs text-dark-muted mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Monthly Spending"
          subtitle="Month-over-month comparison"
          action={<span className="badge badge-primary"><BarChart3 size={12} /> Bar</span>}
        >
          {monthlyTrend.length > 0
            ? <div className="h-56"><Bar data={barData} options={barOptions} /></div>
            : <div className="h-56 flex items-center justify-center text-dark-muted text-sm">No data available</div>
          }
        </ChartCard>

        <ChartCard
          title="Category Distribution"
          subtitle="Where your money goes"
          action={<span className="badge badge-accent"><PieChart size={12} /> Pie</span>}
        >
          {categoryBreakdown.length > 0
            ? <div className="h-56"><Doughnut data={doughnutData} options={doughnutOptions} /></div>
            : <div className="h-56 flex items-center justify-center text-dark-muted text-sm">No data available</div>
          }
        </ChartCard>

        <ChartCard
          title="Cumulative Spending"
          subtitle="Running total over time"
          action={<span className="badge badge-accent"><TrendingUp size={12} /> Line</span>}
          className="lg:col-span-2"
        >
          {monthlyTrend.length > 0
            ? <div className="h-52"><Line data={lineData} options={lineOptions} /></div>
            : <div className="h-52 flex items-center justify-center text-dark-muted text-sm">No data available</div>
          }
        </ChartCard>
      </div>

      {/* Category Table */}
      {categoryBreakdown.length > 0 && (
        <ChartCard title="Category Breakdown" subtitle="Detailed spending per category">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-dark-muted border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="text-left py-2 pb-3">Category</th>
                  <th className="text-right py-2 pb-3">Amount</th>
                  <th className="text-right py-2 pb-3">Transactions</th>
                  <th className="text-right py-2 pb-3">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {categoryBreakdown.map((cat, i) => (
                  <tr key={i} className="hover:bg-dark-700/50 transition-colors">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-dark-text font-medium">{cat.category}</span>
                      </div>
                    </td>
                    <td className="text-right text-dark-text font-semibold">₹{cat.total.toLocaleString()}</td>
                    <td className="text-right text-dark-muted">{cat.count}</td>
                    <td className="text-right">
                      <span className="badge badge-primary">{cat.percent_of_total}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}

      {/* CSV Format Guide */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="card"
        style={{ borderColor: 'rgba(6,182,212,0.2)' }}
      >
        <div className="flex gap-3">
          <FileText size={18} className="text-accent-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-dark-text mb-1">CSV Import Guide</h3>
            <p className="text-xs text-dark-muted mb-3">
              Upload your bank statement or expense CSV. Supported columns (case-insensitive):
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { col: 'date', note: 'Required' },
                { col: 'amount / debit', note: 'Required' },
                { col: 'title / description', note: 'Required' },
                { col: 'category', note: 'Optional (auto-detected)' },
              ].map((c, i) => (
                <div key={i} className="rounded-lg p-3" style={{ background: 'var(--bg-surface-2)' }}>
                  <code className="text-xs text-accent-400 font-mono">{c.col}</code>
                  <p className="text-xs text-dark-muted mt-1">{c.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Reports;
