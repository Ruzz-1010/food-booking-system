// src/components/admin/MiniChart.jsx
export default function MiniChart({ data, color = "blue", height = 40 }) {
    const maxValue = Math.max(...data);
  
    const colors = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
      red: "bg-red-500",
    };
  
    return (
      <div className="flex items-end space-x-1" style={{ height: `${height}px` }}>
        {data.map((value, index) => {
          const percentage = (value / maxValue) * 100;
          return (
            <div
              key={index}
              className={`w-2 ${colors[color]} rounded-t transition-all duration-500 hover:opacity-80`}
              style={{ height: `${Math.max(percentage, 10)}%`, minHeight: "4px" }}
              title={value}
            />
          );
        })}
      </div>
    );
  }
  