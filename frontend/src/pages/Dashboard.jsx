import { useState, useEffect } from 'react';
import api from '../api';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank,
  ArrowUpRight, ArrowDownRight, Plus, RefreshCw, Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import AlertBanner from '../components/AlertBanner';
import ChartCard from '../components/ChartCard';

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
  PointElement, LineElement, Filler
);

const CHART_COLORS = [
  '#6366F1', '#8B5CF6', '#06B6D4', '#10B981',
  '#F59E0B', '#F43F5E', '#EC4899', '#3B82F6',
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const StatCard = ({ title, value, subtext, icon: Icon, gradient, trend, trendLabel, index }) => (
  <motion.div
    custom={index}
    variants={cardVariants}
    initial="hidden"
    animate="visible"
    className="card card-hover group"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-dark-muted">{title}</p>
        <h3 className="text-2xl font-bold text-dark-text mt-1.5 truncate">{value}</h3>
        {subtext && <p className="text-xs text-dark-muted mt-1">{subtext}</p>}
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {trend > 0
              ? <ArrowUpRight size={14} className="text-danger-400" />
              : <ArrowDownRight size={14} className="text-success-400" />
            }
            <span className={`text-xs font-medium ${trend > 0 ? 'text-danger-400' : 'text-success-400'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
            {trendLabel && <span className="text-xs text-dark-muted">{trendLabel}</span>}
          </div>
        )}
      </div>
      <div
        className="stat-icon group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-3"
        style={{ background: gradient }}
      >
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [summaryRes, alertsRes, expensesRes] = await Promise.all([
        api.get('/expenses/summary'),
        api.get('/ai/alerts'),
        api.get('/expenses'),
      ]);
      setSummary(summaryRes.data);
      setAlerts(alertsRes.data.alerts || []);
      // Show only current month expenses in recent list
      const now = new Date();
      const currentMonthExpenses = expensesRes.data.filter(e => {
        if (!e.date) return false;
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      setRecentExpenses(currentMonthExpenses.slice(0, 8));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Chart data
  const monthlyTrend = summary?.monthly_trend || [];
  const categoryBreakdown = summary?.category_breakdown || [];

  const barData = {
    labels: monthlyTrend.map(m => m.month),
    datasets: [{
      label: 'Spending (₹)',
      data: monthlyTrend.map(m => m.total),
      backgroundColor: monthlyTrend.map((_, i) =>
        i === monthlyTrend.length - 1 ? '#6366F1' : 'rgba(99,102,241,0.35)'
      ),
      borderColor: '#6366F1',
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const doughnutData = {
    labels: categoryBreakdown.map(c => c.category),
    datasets: [{
      data: categoryBreakdown.map(c => c.total),
      backgroundColor: CHART_COLORS,
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1A1A27',
        titleColor: '#E2E8F0',
        bodyColor: '#94A3B8',
        borderColor: '#2D2D4A',
        borderWidth: 1,
        callbacks: {
          label: (ctx) => ` ₹${ctx.parsed.y?.toLocaleString() || ctx.parsed.toLocaleString()}`,
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
        ticks: { color: '#64748B', font: { size: 11 }, callback: (v) => `₹${(v/1000).toFixed(0)}k` },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94A3B8', font: { size: 11 }, padding: 12, boxWidth: 12, borderRadius: 4 },
      },
      tooltip: {
        backgroundColor: '#1A1A27',
        titleColor: '#E2E8F0',
        bodyColor: '#94A3B8',
        borderColor: '#2D2D4A',
        borderWidth: 1,
        callbacks: {
          label: (ctx) => ` ₹${ctx.parsed.toLocaleString()} (${ctx.dataset.data[ctx.dataIndex] !== 0
            ? Math.round((ctx.parsed / ctx.dataset.data.reduce((a, b) => a + b, 0)) * 100)
            : 0}%)`,
        },
      },
    },
  };

  const spent = summary?.spent || 0;
  const budget = summary?.budget || 0;
  const progress = budget > 0 ? (spent / budget) * 100 : 0;
  const progressColor = progress >= 100
    ? 'linear-gradient(90deg, #F43F5E, #FB7185)'
    : progress >= 80
      ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
      : 'linear-gradient(90deg, #6366F1, #8B5CF6)';

  const currentMonth = summary?.current_month || new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Financial Overview</h1>
          <div className="flex items-center gap-2 mt-1">
            <Calendar size={13} className="text-primary-400" />
            <p className="text-sm text-primary-400 font-medium">{currentMonth}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAll}
            className="btn btn-ghost btn-icon"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <Link to="/expenses" className="btn btn-primary">
            <Plus size={16} /> Add Expense
          </Link>
        </div>
      </div>

      {/* Alerts */}
      <AlertBanner alerts={alerts} />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          index={0}
          title="Monthly Budget"
          value={`₹${budget.toLocaleString()}`}
          subtext={currentMonth}
          icon={Wallet}
          gradient="linear-gradient(135deg, #6366F1, #4F46E5)"
        />
        <StatCard
          index={1}
          title="Spent This Month"
          value={`₹${spent.toLocaleString()}`}
          subtext={`of ₹${budget.toLocaleString()} budget`}
          icon={TrendingDown}
          gradient="linear-gradient(135deg, #F43F5E, #E11D48)"
          trend={summary?.this_month_vs_last}
          trendLabel="vs last month"
        />
        <StatCard
          index={2}
          title="Remaining"
          value={`₹${(summary?.remaining || 0).toLocaleString()}`}
          subtext={summary?.remaining < 0 ? '⚠️ Over budget' : 'Left to spend'}
          icon={TrendingUp}
          gradient={summary?.remaining < 0
            ? 'linear-gradient(135deg, #F43F5E, #E11D48)'
            : 'linear-gradient(135deg, #10B981, #059669)'}
        />
        <StatCard
          index={3}
          title="Savings Rate"
          value={`${summary?.savings_rate || 0}%`}
          subtext="of monthly budget"
          icon={PiggyBank}
          gradient="linear-gradient(135deg, #06B6D4, #0891B2)"
        />
      </div>

      {/* Budget Progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="card"
        style={{ borderColor: progress >= 100 ? 'rgba(244,63,94,0.3)' : progress >= 80 ? 'rgba(245,158,11,0.3)' : 'var(--border)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-dark-text">Monthly Budget Progress</h3>
              <span className="text-xs text-dark-muted">— {currentMonth}</span>
            </div>
            <p className="text-xs text-dark-muted mt-0.5">
              ₹{spent.toLocaleString()} spent of ₹{budget.toLocaleString()} monthly budget
            </p>
          </div>
          <span className={`badge ${progress >= 100 ? 'badge-danger' : progress >= 80 ? 'badge-warning' : 'badge-primary'}`}>
            {progress.toFixed(1)}%
          </span>
        </div>
        <div className="progress-bar h-3">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ background: progressColor }}
          />
        </div>
        <p className="text-xs text-dark-muted mt-2">
          {summary?.remaining < 0
            ? `⚠️ Over budget by ₹${Math.abs(summary.remaining).toLocaleString()} this month`
            : `✅ ₹${(summary?.remaining || 0).toLocaleString()} remaining for ${currentMonth}`}
        </p>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Monthly Spending Trend"
          subtitle={`Last ${monthlyTrend.length} months — all time`}
        >
          {monthlyTrend.length > 0 ? (
            <div className="h-56">
              <Bar data={barData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-dark-muted text-sm">
              No trend data yet. Add expenses to see your pattern.
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Category Breakdown"
          subtitle={`${currentMonth} spending distribution`}
        >
          {categoryBreakdown.length > 0 ? (
            <div className="h-56">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-dark-muted text-sm">
              No expenses this month yet. Start adding!
            </div>
          )}
        </ChartCard>
      </div>

      {/* Recent Transactions — this month */}
      <ChartCard title="This Month's Transactions" subtitle={`Recent expenses for ${currentMonth}`}>
        {recentExpenses.length === 0 ? (
          <p className="text-dark-muted text-sm text-center py-8">
            No expenses this month.{' '}
            <Link to="/expenses" className="text-primary-400 hover:underline">Add your first one →</Link>
          </p>
        ) : (
          <div className="space-y-2">
            {recentExpenses.map((expense, i) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-dark-600/50"
                style={{ background: 'var(--bg-surface-2)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] + '33', color: CHART_COLORS[i % CHART_COLORS.length] }}
                  >
                    {expense.category?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark-text">{expense.title}</p>
                    <p className="text-xs text-dark-muted">
                      {expense.category} · {expense.date ? new Date(expense.date).toLocaleDateString('en-IN') : ''}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-danger-400">
                  -₹{expense.amount?.toLocaleString()}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </ChartCard>
    </div>
  );
};

export default Dashboard;
