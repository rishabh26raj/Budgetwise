import { useState, useEffect } from 'react';
import api from '../api';
import { motion } from 'framer-motion';
import { Plus, Trash2, Search, Filter } from 'lucide-react';

const CATEGORIES = ['Food', 'Transport', 'Education', 'Loans', 'Rent', 'Entertainment', 'Healthcare', 'Shopping', 'Other'];

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ title: '', amount: '', category: '', date: new Date().toISOString().split('T')[0] });
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const res = await api.get('/expenses');
            setExpenses(res.data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/expenses', formData);
            setFormData({ title: '', amount: '', category: '', date: new Date().toISOString().split('T')[0] });
            setShowForm(false);
            fetchExpenses();
        } catch (error) {
            console.error('Error adding expense:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                await api.delete(`/expenses/${id}`);
                fetchExpenses();
            } catch (error) {
                console.error('Error deleting expense:', error);
            }
        }
    };

    const filteredExpenses = filter === 'All' ? expenses : expenses.filter(e => e.category === filter);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold">Expense Management</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Expense
                </button>
            </div>

            {showForm && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="card bg-gray-50 border-primary/20"
                >
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Title</label>
                            <input
                                type="text"
                                required
                                className="input"
                                placeholder="e.g. Grocery"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Amount (₹)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                className="input"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Category</label>
                            <select
                                required
                                className="input"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="">Select Category</option>
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Date</label>
                            <input
                                type="date"
                                required
                                className="input"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary h-[42px] md:col-span-4">
                            Save Expense
                        </button>
                    </form>
                </motion.div>
            )}

            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg">Recent Transactions</h3>
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-400" />
                        <select
                            className="text-sm border-none focus:ring-0 text-gray-600 font-medium bg-transparent"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-gray-100">
                                <th className="pb-3 font-medium text-gray-500 pl-4">Title</th>
                                <th className="pb-3 font-medium text-gray-500">Category</th>
                                <th className="pb-3 font-medium text-gray-500">Date</th>
                                <th className="pb-3 font-medium text-gray-500 text-right">Amount</th>
                                <th className="pb-3 font-medium text-gray-500 text-right pr-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredExpenses.map((expense) => (
                                <tr key={expense.id} className="group hover:bg-gray-50 transition-colors">
                                    <td className="py-4 pl-4 font-medium text-gray-900">{expense.title}</td>
                                    <td className="py-4">
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td className="py-4 text-gray-500 text-sm">
                                        {new Date(expense.date).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 text-right font-bold text-gray-900">
                                        ₹{expense.amount.toLocaleString()}
                                    </td>
                                    <td className="py-4 text-right pr-4">
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredExpenses.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-gray-500">
                                        No expenses found. Add one above!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Expenses;
