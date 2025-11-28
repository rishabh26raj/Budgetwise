import { useState, useEffect } from 'react';
import api from '../api';
import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle } from 'lucide-react';

const Predictions = () => {
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrediction = async () => {
            try {
                const res = await api.get('/ai/predict-next-month');
                setPrediction(res.data);
            } catch (error) {
                console.error('Error fetching prediction:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPrediction();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Expense Predictions</h1>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-indigo-100 font-medium mb-1">Predicted Expense for Next Month</p>
                        <h2 className="text-4xl font-bold">₹{prediction?.prediction?.toLocaleString() || 0}</h2>
                        <p className="mt-4 text-indigo-100 text-sm">{prediction?.message}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <TrendingUp size={32} className="text-white" />
                    </div>
                </div>
            </motion.div>

            <div className="card">
                <div className="flex gap-3 items-start">
                    <AlertCircle className="text-blue-500 shrink-0 mt-1" />
                    <div>
                        <h3 className="font-bold text-lg mb-2">How this works</h3>
                        <p className="text-gray-600">
                            Our AI analyzes your spending patterns, current budget, and historical data to forecast your expenses for the upcoming month.
                            This helps you plan better and stay within your limits.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Predictions;
