import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Search, Filter, Brain, X, Sparkles, Loader2, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  'Food', 'Rent', 'Transport', 'Shopping', 'Entertainment',
  'Health', 'Utilities', 'Education', 'Investment', 'Other'
];

const CATEGORY_COLORS = {
  Food: '#6366F1', Rent: '#8B5CF6', Transport: '#06B6D4', Shopping: '#10B981',
  Entertainment: '#F59E0B', Health: '#F43F5E', Utilities: '#EC4899',
  Education: '#3B82F6', Investment: '#14B8A6', Other: '#64748B',
};

const CATEGORY_ICONS = {
  Food: '🍕', Rent: '🏠', Transport: '🚌', Shopping: '🛍️',
  Entertainment: '🎬', Health: '💊', Utilities: '⚡',
  Education: '📚', Investment: '📈', Other: '💰',
};

// Month navigation helper
const getMonthYear = (date) => ({
  month: date.getMonth(),
  year: date.getFullYear(),
});
const monthLabel = (date) =>
  date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debouncedValue;
}

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '', amount: '', category: '', date: new Date().toISOString().split('T')[0]
  });
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Month navigation — default to current month
  const [viewDate, setViewDate] = useState(new Date());
  const isCurrentMonth = () => {
    const now = new Date();
    return viewDate.getMonth() === now.getMonth() && viewDate.getFullYear() === now.getFullYear();
  };

  // AI categorization state
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const debouncedTitle = useDebounce(formData.title, 600);

  // Auto-categorize on title change
  useEffect(() => {
    if (debouncedTitle.length < 3) {
      setAiSuggestion(null);
      return;
    }
    setAiLoading(true);
    api.post('/ai/categorize', { title: debouncedTitle, amount: formData.amount || undefined })
      .then(res => {
        setAiSuggestion(res.data);
        if (!formData.category || formData.category === '') {
          setFormData(f => ({ ...f, category: res.data.suggested_category }));
        }
      })
      .catch(() => setAiSuggestion(null))
      .finally(() => setAiLoading(false));
  }, [debouncedTitle]);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await api.get('/expenses');
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/expenses', {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      setFormData({ title: '', amount: '', category: '', date: new Date().toISOString().split('T')[0] });
      setAiSuggestion(null);
      setShowForm(false);
      fetchExpenses();
    } catch (err) {
      console.error('Error adding expense:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const prevMonth = () => {
    setViewDate(d => {
      const nd = new Date(d);
      nd.setMonth(nd.getMonth() - 1);
      return nd;
    });
    setFilter('All');
    setSearch('');
  };

  const nextMonth = () => {
    const now = new Date();
    if (viewDate.getMonth() === now.getMonth() && viewDate.getFullYear() === now.getFullYear()) return;
    setViewDate(d => {
      const nd = new Date(d);
      nd.setMonth(nd.getMonth() + 1);
      return nd;
    });
    setFilter('All');
    setSearch('');
  };

  // Filter by selected month + category + search
  const { month, year } = getMonthYear(viewDate);
  const monthExpenses = expenses.filter(e => {
    if (!e.date) return false;
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const allCategories = ['All', ...new Set(monthExpenses.map(e => e.category).filter(Boolean))];

  const filteredExpenses = monthExpenses.filter(e => {
    const matchesFilter = filter === 'All' || e.category === filter;
    const matchesSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.category?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalFiltered = filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const monthTotal = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-10 rounded-2xl" />
      {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
    </div>
  );

  const atCurrentMonth = isCurrentMonth();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">{expenses.length} total transactions tracked</p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setAiSuggestion(null); }}
          className="btn btn-primary"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add Expense'}
        </button>
      </div>

      {/* Add Expense Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="card" style={{ borderColor: 'rgba(99,102,241,0.3)' }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="stat-icon w-8 h-8 rounded-lg" style={{ background: 'rgba(99,102,241,0.2)' }}>
                  <Plus size={16} className="text-primary-400" />
                </div>
                <h3 className="font-semibold text-dark-text">New Expense</h3>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title + AI */}
                <div className="md:col-span-2">
                  <label className="label">Expense Title</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      className="input pr-10"
                      placeholder="e.g. Grocery at BigBasket"
                      value={formData.title}
                      onChange={e => {
                        setFormData({ ...formData, title: e.target.value });
                        if (e.target.value.length < 3) setAiSuggestion(null);
                      }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {aiLoading
                        ? <Loader2 size={15} className="text-primary-400 animate-spin" />
                        : <Brain size={15} className="text-primary-400 opacity-60" />
                      }
                    </div>
                  </div>
                  {aiSuggestion && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 mt-1.5"
                    >
                      <Sparkles size={12} className="text-primary-400" />
                      <span className="text-xs text-dark-muted">
                        AI suggests: <strong className="text-primary-400">{aiSuggestion.suggested_category}</strong>{' '}
                        <span className="text-dark-muted">({Math.round(aiSuggestion.confidence * 100)}% confidence)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData(f => ({ ...f, category: aiSuggestion.suggested_category }))}
                        className="text-xs text-primary-400 hover:underline"
                      >
                        Apply
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="label">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    className="input"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="label">Category</label>
                  <select
                    required
                    className="select"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {CATEGORY_ICONS[cat]} {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary w-full"
                  >
                    {submitting
                      ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                      : <><Plus size={15} /> Save Expense</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Month Navigator ── */}
      <div className="card p-4 flex items-center justify-between"
        style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)' }}>
        <button
          onClick={prevMonth}
          className="btn btn-ghost btn-icon"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center">
            <CalendarDays size={16} className="text-primary-400" />
            <span className="font-semibold text-dark-text">{monthLabel(viewDate)}</span>
            {atCurrentMonth && (
              <span className="badge badge-primary text-xs">Current</span>
            )}
          </div>
          <p className="text-xs text-dark-muted mt-0.5">
            {monthExpenses.length} expense{monthExpenses.length !== 1 ? 's' : ''} · Total:{' '}
            <span className="text-danger-400 font-semibold">₹{monthTotal.toLocaleString()}</span>
          </p>
        </div>
        <button
          onClick={nextMonth}
          disabled={atCurrentMonth}
          className="btn btn-ghost btn-icon disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search expenses…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
          <select
            className="select pl-9 min-w-[160px]"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 flex-wrap">
        {['All', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`btn btn-sm ${filter === cat ? 'btn-primary' : 'btn-secondary'}`}
          >
            {CATEGORY_ICONS[cat] || ''} {cat}
          </button>
        ))}
      </div>

      {/* Expense Table */}
      <div className="card overflow-hidden p-0">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-semibold text-dark-text">
            {filter === 'All' ? `All ${monthLabel(viewDate)} Transactions` : `${filter} — ${monthLabel(viewDate)}`}
            <span className="ml-2 text-xs text-dark-muted">({filteredExpenses.length})</span>
          </h3>
          {filteredExpenses.length > 0 && (
            <span className="text-sm font-bold text-dark-text">
              Total: <span className="text-danger-400">₹{totalFiltered.toLocaleString()}</span>
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          {filteredExpenses.length === 0 ? (
            <div className="py-16 text-center text-dark-muted">
              <p className="text-3xl mb-3">📭</p>
              <p className="font-medium text-dark-text">No expenses found</p>
              <p className="text-sm mt-1">
                {search
                  ? 'Try a different search term.'
                  : `No ${filter !== 'All' ? filter + ' ' : ''}expenses for ${monthLabel(viewDate)}.`}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-dark-muted border-b"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)' }}>
                  <th className="text-left py-3 px-5">Expense</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-right py-3 px-4">Amount</th>
                  <th className="text-right py-3 px-5"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredExpenses.map((expense, i) => (
                    <motion.tr
                      key={expense.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="group border-b transition-colors hover:bg-dark-600/30"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                            style={{ background: (CATEGORY_COLORS[expense.category] || '#6366F1') + '22' }}
                          >
                            {CATEGORY_ICONS[expense.category] || '💰'}
                          </div>
                          <span className="text-sm font-medium text-dark-text">{expense.title}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className="badge text-xs"
                          style={{
                            background: (CATEGORY_COLORS[expense.category] || '#6366F1') + '22',
                            color: CATEGORY_COLORS[expense.category] || '#6366F1',
                          }}
                        >
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-dark-muted">
                        {expense.date ? new Date(expense.date).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        }) : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right text-sm font-bold text-danger-400">
                        -₹{expense.amount?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="btn btn-ghost btn-sm btn-icon opacity-0 group-hover:opacity-100 hover:text-danger-400 transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Expenses;
