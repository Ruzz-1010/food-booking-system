// src/components/admin/StatusBadge.jsx
export default function StatusBadge({ status }) {
  const statusConfig = {
    pending: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      label: 'Pending'
    },
    approved: {
      color: 'bg-green-100 text-green-800 border-green-200',
      label: 'Approved'
    },
    active: {
      color: 'bg-green-100 text-green-800 border-green-200',
      label: 'Active'
    },
    rejected: {
      color: 'bg-red-100 text-red-800 border-red-200',
      label: 'Rejected'
    },
    blocked: {
      color: 'bg-red-100 text-red-800 border-red-200',
      label: 'Blocked'
    },
    preparing: {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      label: 'Preparing'
    },
    out_for_delivery: {
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      label: 'Out for Delivery'
    },
    delivered: {
      color: 'bg-green-100 text-green-800 border-green-200',
      label: 'Delivered'
    },
    cancelled: {
      color: 'bg-red-100 text-red-800 border-red-200',
      label: 'Cancelled'
    }
  };

  const config = statusConfig[status] || {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    label: status
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
}