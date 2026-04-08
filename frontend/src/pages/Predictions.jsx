import { useState, useEffect } from 'react';
import api from '../api';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus,
  Brain, BarChart2, Info, Zap
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ChartCard from '../components/ChartCard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const TrendIcon = ({ trend }) => {
  if (trend === 'increasing') return <TrendingUp size={20} className="text-danger-400" />;
  if (trend === 'decreasing') return <TrendingDown size={20} className="text-success-400" />;
  return <Minus size={20} className="text-warning-400" />;
};

const trendLabel = (t) => ({
  increasing: { text: 'Spending is rising', color: 'text-danger-400', badge: 'badge-danger' },
  decreasing: { text: 'Spending is falling', color: 'text-success-400', badge: 'badge-success' },
  stable: { text: 'Spending is stable', color: 'text-warning-400', badge: 'badge-warning' },
}[t] || { text: 'Analyzing…', color: 'text-dark-muted', badge: 'badge-primary' });

const Predictions = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ai/predict-next-month')
      .then(res => setPrediction(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-40 rounded-2xl" />
      <div className="skeleton h-72 rounded-2xl" />
      <div className="skeleton h-32 rounded-2xl" />
    </div>
  );

  const forecasts = prediction?.monthly_forecasts || [];
  const trend = prediction?.trend || 'stable';
  const trendInfo = trendLabel(trend);

  // Line chart
  const lineData = {
    labels: forecasts.map(f => f.month),
    datasets: [
      {
        label: 'Predicted Expense (₹)',
        data: forecasts.map(f => f.predicted),
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99,102,241,0.12)',
        fill: true,
        tension: 0.45,
        pointBackgroundColor: '#6366F1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 9,
      },
      {
        label: 'Upper Bound',
        data: forecasts.map((f, i) => i === 0 ? prediction.upper_bound : f.predicted * 1.12),
        borderColor: 'rgba(244,63,94,0.3)',
        backgroundColor: 'rgba(244,63,94,0.05)',
        borderDash: [6, 4],
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Lower Bound',
        data: forecasts.map((f, i) => i === 0 ? prediction.lower_bound : f.predicted * 0.88),
        borderColor: 'rgba(16,185,129,0.3)',
        backgroundColor: 'rgba(16,185,129,0.05)',
        borderDash: [6, 4],
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94A3B8', font: { size: 11 }, boxWidth: 12, padding: 16 },
      },
      tooltip: {
        backgroundColor: '#1A1A27',
        titleColor: '#E2E8F0',
        bodyColor: '#94A3B8',
        borderColor: '#2D2D4A',
        borderWidth: 1,
        callbacks: {
          label: (ctx) => ` ₹${ctx.parsed.y?.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#64748B', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#64748B', font: { size: 11 },
          callback: (v) => `₹${(v / 1000).toFixed(0)}k`,
        },
      },
    },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Expense Predictions</h1>
        <p className="page-subtitle">Regression-based 3-month spending forecast</p>
      </div>

      {/* Primary Prediction Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
          border: '1px solid rgba(99,102,241,0.3)',
        }}
      >
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366F1, transparent)' }} />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Brain size={18} className="text-primary-400" />
              <p className="text-sm font-medium text-primary-300">AI Prediction — Next Month</p>
            </div>
            <h2 className="text-5xl font-bold text-white mb-3">
              ₹{(prediction?.prediction || 0).toLocaleString()}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`badge ${trendInfo.badge}`}>
                <TrendIcon trend={trend} />
                {trendInfo.text}
              </span>
              <span className="badge badge-primary">
                Confidence: ±12%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:min-w-[240px]">
            <div className="rounded-xl p-3" style={{ background: 'rgba(99,102,241,0.2)' }}>
              <p className="text-xs text-primary-300 mb-1">Lower Bound</p>
              <p className="text-lg font-bold text-white">₹{(prediction?.lower_bound || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(244,63,94,0.15)' }}>
              <p className="text-xs text-danger-300 mb-1">Upper Bound</p>
              <p className="text-lg font-bold text-white">₹{(prediction?.upper_bound || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Forecast Chart */}
      <ChartCard
        title="3-Month Spending Forecast"
        subtitle="Predicted spending trend with confidence bands"
      >
        {forecasts.length > 0 ? (
          <div className="h-64">
            <Line data={lineData} options={lineOptions} />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-dark-muted text-sm">
            Add expenses and set a budget for precise forecasting.
          </div>
        )}
      </ChartCard>

      {/* Monthly Breakdown */}
      {forecasts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {forecasts.map((f, i) => (
            <motion.div
              key={f.month}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card text-center"
            >
              <p className="text-xs uppercase tracking-wider text-dark-muted mb-1">
                Month {i + 1} ({f.month})
              </p>
              <p className="text-2xl font-bold text-dark-text">₹{f.predicted.toLocaleString()}</p>
              <div className="mt-2 text-xs text-dark-muted">
                Range: ₹{Math.round(f.predicted * 0.88).toLocaleString()} – ₹{Math.round(f.predicted * 1.12).toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="flex gap-4 items-start">
          <div className="stat-icon flex-shrink-0" style={{ background: 'rgba(6,182,212,0.15)' }}>
            <Info size={20} className="text-accent-400" />
          </div>
          <div>
            <h3 className="font-semibold text-dark-text mb-2">How This Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              {[
                {
                  icon: <BarChart2 size={16} className="text-primary-400" />,
                  title: 'Gradient Boosting Model',
                  desc: 'Trained on 240+ data points with seasonal month encoding (sin/cos) for accurate seasonality detection.'
                },
                {
                  icon: <TrendingUp size={16} className="text-success-400" />,
                  title: 'Rolling Average Features',
                  desc: '3-month rolling mean of your past spending is used as a feature to capture personal spending trends.'
                },
                {
                  icon: <Zap size={16} className="text-warning-400" />,
                  title: 'Linear Trend Direction',
                  desc: 'A separate linear regression model determines the overall spending trend (rising, falling, stable).'
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-2">
                  <div className="mt-0.5">{item.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-dark-text">{item.title}</p>
                    <p className="text-xs text-dark-muted mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Predictions;
