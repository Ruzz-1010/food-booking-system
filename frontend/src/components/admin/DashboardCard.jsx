// src/components/admin/DashboardCard.jsx
export default function DashboardCard({ title, icon, actions, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon}
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}