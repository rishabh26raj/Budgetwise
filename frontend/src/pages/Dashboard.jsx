import { useState, useEffect } from 'react';
import api from '../api';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold mt-1">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
        {trend && (
            <div className="mt-4 flex items-center gap-1 text-sm">
                <span className={trend > 0 ? 'text-red-500' : 'text-green-500'}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
                <span className="text-gray-400">vs last month</span>
            </div>
        )}
    </motion.div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        budget: 0,
        spent: 0,
        remaining: 0,
        categories: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [expensesRes, budgetRes] = await Promise.all([
                    api.get('/expenses'),
                    api.get('/budget')
                ]);

                const expenses = expensesRes.data;
                const budget = budgetRes.data.amount || 0;
                const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
                const uniqueCategories = new Set(expenses.map(e => e.category)).size;

                setStats({
                    budget,
                    spent: totalSpent,
                    remaining: budget - totalSpent,
                    categories: uniqueCategories
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div>Loading...</div>;

    const progress = stats.budget > 0 ? (stats.spent / stats.budget) * 100 : 0;
    const progressColor = progress > 90 ? 'bg-red-500' : progress > 75 ? 'bg-yellow-500' : 'bg-green-500';

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Financial Overview</h1>
                <Link to="/expenses" className="btn btn-primary">
                    + Add Expense
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Monthly Budget"
                    value={`₹${stats.budget.toLocaleString()}`}
                    icon={Wallet}
                    color="bg-gradient-to-br from-blue-400 to-blue-600"
                />
                <StatCard
                    title="Total Spent"
                    value={`₹${stats.spent.toLocaleString()}`}
                    icon={TrendingDown}
                    color="bg-gradient-to-br from-red-400 to-red-600"
                />
                <StatCard
                    title="Remaining"
                    value={`₹${stats.remaining.toLocaleString()}`}
                    icon={TrendingUp}
                    color="bg-gradient-to-br from-green-400 to-green-600"
                />
            </div>

            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Budget Progress</h3>
                    <span className="text-gray-500">{progress.toFixed(1)}% used</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${progressColor}`}
                    />
                </div>
                <p className="text-center mt-4 text-gray-500 text-sm">
                    {stats.remaining < 0
                        ? `You have exceeded your budget by ₹${Math.abs(stats.remaining).toLocaleString()}`
                        : `You have ₹${stats.remaining.toLocaleString()} remaining this month`
                    }
                </p>
            </div>

            {/* Recent Activity could go here */}
        </div>
    );
};

export default Dashboard;
