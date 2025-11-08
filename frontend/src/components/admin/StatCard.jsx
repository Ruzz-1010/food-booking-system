// src/components/admin/StatCard.jsx
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ 
  label, 
  value, 
  icon, 
  color = 'blue', 
  trend, 
  subtitle, 
  loading = false 
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    red: 'bg-red-50 border-red-200 text-red-600'
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600'
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-sm font-medium ${trendColors[trend.type]}`}>
            {trend.type === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
        {subtitle && (
          <p className="text-xs text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}