import { useState, useEffect } from 'react';
import api from '../api';
import { motion } from 'framer-motion';
import { Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';

const Insights = () => {
    const [insights, setInsights] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [insightsRes, suggestionsRes] = await Promise.all([
                    api.get('/ai/get-insights'),
                    api.get('/ai/suggest')
                ]);
                setInsights(insightsRes.data.insights);
                setAnomalies(insightsRes.data.anomalies || []);
                setSuggestions(suggestionsRes.data.suggestions);
            } catch (error) {
                console.error('Error fetching insights:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">AI Insights & Suggestions</h1>

            {anomalies.length > 0 && (
                <div className="card bg-red-50 border-red-200">
                    <h2 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
                        <AlertCircle className="text-red-500" />
                        Anomalies Detected
                    </h2>
                    <ul className="list-disc list-inside text-red-600 space-y-1">
                        {anomalies.map((anomaly, index) => (
                            <li key={index}>{anomaly}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Lightbulb className="text-yellow-500" />
                        Spending Insights
                    </h2>
                    {insights.length > 0 ? (
                        insights.map((insight, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="card border-l-4 border-yellow-400"
                            >
                                <p className="text-gray-700">{insight}</p>
                            </motion.div>
                        ))
                    ) : (
                        <p className="text-gray-500 italic">No insights available yet.</p>
                    )}
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <CheckCircle className="text-green-500" />
                        Smart Suggestions
                    </h2>
                    {suggestions.map((suggestion, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="card border-l-4 border-green-400"
                        >
                            <p className="text-gray-700">{suggestion}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Insights;
