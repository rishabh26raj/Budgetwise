import { useState, useEffect } from 'react';
import api from '../api';
import { motion } from 'framer-motion';
import {
  Lightbulb, AlertCircle, CheckCircle,
  Users, TrendingUp, TrendingDown, Star, Zap
} from 'lucide-react';
import AlertBanner from '../components/AlertBanner';

const CATEGORY_ICONS = {
  Food: '🍕', Rent: '🏠', Transport: '🚌', Shopping: '🛍️',
  Entertainment: '🎬', Health: '💊', Utilities: '⚡',
  Education: '📚', Investment: '📈', Other: '💰',
};

const Insights = () => {
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/ai/get-insights'),
      api.get('/ai/alerts'),
      api.get('/ai/suggest'),
    ])
      .then(([insightsRes, alertsRes, suggestRes]) => {
        setData(insightsRes.data);
        setAlerts(alertsRes.data.alerts || []);
        setSuggestions(suggestRes.data.suggestions || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-48 rounded-xl" />
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  );

  const insights = data?.insights || [];
  const peerComparisons = data?.peer_comparisons || [];
  const categoryStats = data?.category_stats || [];
  const anomalies = data?.anomalies || [];
  const savingsRate = data?.savings_rate || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">AI Insights</h1>
        <p className="page-subtitle">Personalized spending analysis powered by ML</p>
      </div>

      {/* Alerts */}
      <AlertBanner alerts={alerts} />

      {/* Savings Rate Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6"
        style={{
          background: savingsRate >= 20
            ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))'
            : savingsRate >= 0
              ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))'
              : 'linear-gradient(135deg, rgba(244,63,94,0.2), rgba(225,29,72,0.1))',
          border: '1px solid rgba(99,102,241,0.2)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-dark-muted mb-1">Current Savings Rate</p>
            <p className="text-4xl font-bold text-white">{savingsRate}%</p>
            <p className="text-sm text-dark-muted mt-1">
              {savingsRate >= 20 ? '🎉 Excellent! Keep it up.' : savingsRate >= 10 ? '👍 Good, aim for 20%.' : savingsRate >= 0 ? '⚡ Try saving more each month.' : '🚨 You\'re over budget!'}
            </p>
          </div>
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9155" fill="none"
                stroke={savingsRate >= 20 ? '#10B981' : savingsRate >= 0 ? '#6366F1' : '#F43F5E'}
                strokeWidth="3"
                strokeDasharray={`${Math.max(0, Math.min(savingsRate, 100))}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
              {savingsRate}%
            </span>
          </div>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Spending Insights */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb size={18} className="text-warning-400" />
            <h2 className="font-semibold text-dark-text">Spending Insights</h2>
          </div>
          {insights.length > 0 ? insights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card border-l-4"
              style={{ borderLeftColor: '#F59E0B' }}
            >
              <div className="flex gap-3">
                <Lightbulb size={16} className="text-warning-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-dark-text" dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </div>
            </motion.div>
          )) : (
            <div className="card text-center py-8 text-dark-muted text-sm">
              Add more expenses to unlock AI insights.
            </div>
          )}
        </div>

        {/* Smart Suggestions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-success-400" />
            <h2 className="font-semibold text-dark-text">Smart Suggestions</h2>
          </div>
          {suggestions.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card border-l-4"
              style={{ borderLeftColor: '#10B981' }}
            >
              <div className="flex gap-3">
                <Star size={16} className="text-success-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-dark-text">{s}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Peer Comparison */}
      {peerComparisons.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-accent-400" />
            <h2 className="font-semibold text-dark-text">How You Compare to Others</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {peerComparisons.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="card"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{CATEGORY_ICONS[p.category] || '💰'}</span>
                    <div>
                      <p className="font-semibold text-dark-text text-sm">{p.category}</p>
                      <p className="text-xs text-dark-muted">Your avg: ₹{p.your_spending.toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`badge ${p.difference_pct > 0 ? 'badge-danger' : 'badge-success'}`}>
                    {p.difference_pct > 0
                      ? <><TrendingUp size={11} /> +{p.difference_pct}%</>
                      : <><TrendingDown size={11} /> {p.difference_pct}%</>
                    }
                  </span>
                </div>
                <p className="text-xs text-dark-muted">{p.message}</p>
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between text-dark-muted">
                    <span>Your spend</span>
                    <span className="font-medium text-dark-text">₹{p.your_spending.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-dark-muted">
                    <span>Avg user</span>
                    <span className="font-medium text-dark-text">₹{p.avg_spending.toLocaleString()}</span>
                  </div>
                  <div className="progress-bar mt-2">
                    <div className="progress-fill"
                      style={{
                        width: `${Math.min((p.your_spending / (p.avg_spending * 2)) * 100, 100)}%`,
                        background: p.difference_pct > 0
                          ? 'linear-gradient(90deg, #F43F5E, #FB7185)'
                          : 'linear-gradient(90deg, #10B981, #34D399)',
                      }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Category Stats */}
      {categoryStats.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-primary-400" />
            <h2 className="font-semibold text-dark-text">Category Breakdown</h2>
          </div>
          <div className="card">
            <div className="space-y-4">
              {categoryStats.map((cat, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span>{CATEGORY_ICONS[cat.category] || '💰'}</span>
                      <span className="text-sm font-medium text-dark-text">{cat.category}</span>
                      <span className="text-xs text-dark-muted">({cat.count} transactions)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-dark-muted">{cat.percent_of_total}%</span>
                      <span className="text-sm font-bold text-dark-text">₹{cat.total.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.percent_of_total}%` }}
                      transition={{ delay: i * 0.05, duration: 0.6 }}
                      style={{
                        background: `linear-gradient(90deg, ${
                          ['#6366F1','#8B5CF6','#06B6D4','#10B981','#F59E0B','#F43F5E','#EC4899','#3B82F6'][i % 8]
                        }, ${
                          ['#4F46E5','#7C3AED','#0891B2','#059669','#D97706','#E11D48','#DB2777','#2563EB'][i % 8]
                        })`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={18} className="text-danger-400" />
            <h2 className="font-semibold text-dark-text">Unusual Expenses Detected</h2>
          </div>
          <div className="space-y-3">
            {anomalies.map((anomaly, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="alert-danger"
              >
                <AlertCircle size={16} className="text-danger-400 shrink-0 mt-0.5" />
                <p className="text-sm text-danger-300">{anomaly}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Insights;
