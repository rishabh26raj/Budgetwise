import { useState, useEffect } from 'react';
import api from '../api';
import { motion } from 'framer-motion';
import { Save, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const Settings = () => {
    const [budget, setBudget] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchBudget();
    }, []);

    const fetchBudget = async () => {
        try {
            const res = await api.get('/budget');
            setBudget(res.data.amount);
        } catch (error) {
            console.error('Error fetching budget:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBudgetUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/budget', {
                amount: parseFloat(budget),
                month: new Date().toISOString().slice(0, 7) // Current month YYYY-MM
            });
            setMessage({ type: 'success', text: 'Budget updated successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update budget.' });
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
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setMessage({ type: 'success', text: res.data.message });
            setUploadFile(null);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.detail || 'Upload failed.' });
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold">Settings</h1>

            {message.text && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}
                >
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Budget Settings */}
                <div className="card">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <FileText className="text-primary" />
                        Monthly Budget
                    </h2>
                    <form onSubmit={handleBudgetUpdate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Set your monthly budget limit (₹)
                            </label>
                            <input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="input"
                                placeholder="e.g. 20000"
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-full flex items-center justify-center gap-2">
                            <Save size={18} />
                            Save Budget
                        </button>
                    </form>
                </div>

                {/* Data Management */}
                <div className="card">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Upload className="text-primary" />
                        Import Data
                    </h2>
                    <form onSubmit={handleFileUpload} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Upload Expenses CSV
                            </label>
                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="space-y-2 pointer-events-none">
                                    <Upload className="mx-auto text-gray-400" size={24} />
                                    <p className="text-sm text-gray-500">
                                        {uploadFile ? uploadFile.name : 'Click to upload or drag and drop'}
                                    </p>
                                    <p className="text-xs text-gray-400">CSV format: date, category, amount, title</p>
                                </div>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={!uploadFile || uploading}
                            className="btn btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {uploading ? 'Uploading...' : 'Import CSV'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
