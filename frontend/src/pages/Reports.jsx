import { useState, useEffect } from 'react';
import api from '../api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Reports = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchExpenses();
    }, []);

    if (loading) return <div>Loading...</div>;

    // Process data for charts
    const categoryTotals = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {});

    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);

    const chartData = {
        labels: categories,
        datasets: [
            {
                label: 'Expenses by Category',
                data: amounts,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
            },
        },
    };

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold">Financial Reports</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card">
                    <h3 className="font-bold text-lg mb-4 text-center">Expense Distribution</h3>
                    <div className="h-[300px] flex justify-center">
                        {expenses.length > 0 ? (
                            <Doughnut data={chartData} options={options} />
                        ) : (
                            <div className="flex items-center justify-center text-gray-400">No data available</div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <h3 className="font-bold text-lg mb-4 text-center">Category Breakdown</h3>
                    <div className="h-[300px] flex justify-center">
                        {expenses.length > 0 ? (
                            <Bar data={chartData} options={options} />
                        ) : (
                            <div className="flex items-center justify-center text-gray-400">No data available</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 className="font-bold text-lg mb-4">AI Insights</h3>
                <ul className="space-y-2 text-gray-600">
                    {expenses.length === 0 && <li>No data to generate insights. Start adding expenses!</li>}
                    {expenses.length > 0 && (
                        <>
                            <li>Your highest spending category is <strong>{categories[amounts.indexOf(Math.max(...amounts))]}</strong> (₹{Math.max(...amounts).toLocaleString()}).</li>
                            <li>You have made a total of <strong>{expenses.length}</strong> transactions.</li>
                        </>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default Reports;
