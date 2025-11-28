import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, CreditCard, PieChart, LogOut, User, TrendingUp, Lightbulb, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="text-2xl">💰</span>
                        <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            BudgetWise
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-1">
                        <Link to="/">
                            <div className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${isActive('/') ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <LayoutDashboard size={18} />
                                Dashboard
                            </div>
                        </Link>
                        <Link to="/expenses">
                            <div className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${isActive('/expenses') ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <CreditCard size={18} />
                                Expenses
                            </div>
                        </Link>
                        <Link to="/reports">
                            <div className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${isActive('/reports') ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <PieChart size={18} />
                                Reports
                            </div>
                        </Link>
                        <Link to="/predictions">
                            <div className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${isActive('/predictions') ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <TrendingUp size={18} />
                                Predictions
                            </div>
                        </Link>
                        <Link to="/insights">
                            <div className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${isActive('/insights') ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <Lightbulb size={18} />
                                Insights
                            </div>
                        </Link>
                        <Link to="/settings">
                            <div className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${isActive('/settings') ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <SettingsIcon size={18} />
                                Settings
                            </div>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-600">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="hidden sm:block font-medium">{user?.username}</span>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
