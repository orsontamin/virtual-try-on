import React, { useEffect, useState } from 'react';
import { ArrowLeft, Activity, DollarSign, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const BASE_COST_USD = 0.12;
const INPUT_COST_USD = 0.0011;
const TAX_RATE = 0.08; // 8% SST
const EXCHANGE_RATE_MYR = 3.95;

const AnalyticsPage = () => {
  const [stats, setStats] = useState({ count: 0, costUSD: 0, costMYR: 0 });

  useEffect(() => {
    const count = parseInt(localStorage.getItem('vto_usage_count') || '0', 10);
    
    // Calculate per unit total
    const unitCostUSD = (BASE_COST_USD + INPUT_COST_USD);
    const totalUSD = count * unitCostUSD;
    
    // Add Tax
    const totalWithTaxUSD = totalUSD * (1 + TAX_RATE);
    
    // Convert to MYR
    const totalMYR = totalWithTaxUSD * EXCHANGE_RATE_MYR;
    
    setStats({ count, costUSD: totalWithTaxUSD, costMYR: totalMYR });
  }, []);

  const resetStats = () => {
      if (confirm("Are you sure you want to reset analytics?")) {
          localStorage.setItem('vto_usage_count', '0');
          setStats({ count: 0, costUSD: 0, costMYR: 0 });
      }
  };

  return (
    <div className="p-8 h-full">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Metric Cards */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 font-medium">Total Generations</h3>
                    <Activity className="text-blue-500 bg-blue-50 p-2 rounded-lg" size={40} />
                </div>
                <div className="text-4xl font-bold text-slate-800">{stats.count}</div>
                <p className="text-sm text-gray-400 mt-2">Successful API calls</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 font-medium">Estimated Cost (USD)</h3>
                    <DollarSign className="text-green-500 bg-green-50 p-2 rounded-lg" size={40} />
                </div>
                <div className="text-4xl font-bold text-slate-800">${stats.costUSD.toFixed(2)}</div>
                <p className="text-xs text-gray-400 mt-2">
                    ${BASE_COST_USD}/img + Inputs + 8% SST
                </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ring-2 ring-blue-50">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-blue-600 font-bold">Total Cost (MYR)</h3>
                    <span className="text-xl font-bold text-gray-300">RM</span>
                </div>
                <div className="text-4xl font-bold text-slate-800">{stats.costMYR.toFixed(2)}</div>
                <p className="text-sm text-gray-400 mt-2">Exchange Rate: {EXCHANGE_RATE_MYR}</p>
            </div>
        </div>

        {/* Detailed Breakdown Table (Placeholder for future) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Detailed Usage Logs</h3>
                <button onClick={resetStats} className="text-red-500 hover:text-red-700 text-sm font-medium">
                    Reset Data
                </button>
            </div>
            <div className="p-6 text-center text-gray-400 py-12">
                <p>Detailed session logs require a backend database.</p>
                <p className="text-sm mt-2">Currently tracking aggregate local usage only.</p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsPage;
