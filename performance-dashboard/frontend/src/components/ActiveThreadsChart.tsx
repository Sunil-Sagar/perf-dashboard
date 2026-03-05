import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

interface ActiveThreadsChartProps {
  data: Array<{
    time: string;
    active_threads: number;
  }>;
}

const ActiveThreadsChart = ({ data }: ActiveThreadsChartProps) => {
  // Sort by time
  const chartData = [...data].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  
  // State for zoom range
  const [brushRange, setBrushRange] = useState<{ startIndex: number; endIndex: number }>({
    startIndex: 0,
    endIndex: chartData.length - 1
  });
  
  // Mouse wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const zoomFactor = 0.02;
    const direction = e.deltaY < 0 ? -1 : 1;
    
    const currentRange = brushRange.endIndex - brushRange.startIndex;
    const zoomAmount = Math.max(1, Math.floor(currentRange * zoomFactor));
    
    let newStartIndex = brushRange.startIndex;
    let newEndIndex = brushRange.endIndex;
    
    if (direction < 0) {
      newStartIndex = Math.min(brushRange.startIndex + zoomAmount, chartData.length - 2);
      newEndIndex = Math.max(brushRange.endIndex - zoomAmount, newStartIndex + 1);
    } else {
      newStartIndex = Math.max(brushRange.startIndex - zoomAmount, 0);
      newEndIndex = Math.min(brushRange.endIndex + zoomAmount, chartData.length - 1);
    }
    
    if (newEndIndex > newStartIndex && newStartIndex >= 0 && newEndIndex < chartData.length) {
      setBrushRange({ startIndex: newStartIndex, endIndex: newEndIndex });
    }
  };
  
  // Format time for display
  const formatTime = (time: string) => {
    const date = new Date(time);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const displayData = chartData.slice(brushRange.startIndex, brushRange.endIndex + 1);

  return (
    <div 
      style={{ 
        width: '100%', 
        minHeight: '500px',
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
      }}
      onWheel={handleWheel}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1a2332' }}>Active Threads</h3>
        <span 
          style={{ fontSize: '18px', color: '#6b7280', cursor: 'pointer' }} 
          title="Reset zoom"
          onClick={() => setBrushRange({ startIndex: 0, endIndex: chartData.length - 1 })}
        >
          ↺
        </span>
      </div>

      {/* Spacer to match charts with info lines */}
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px', height: '21px' }}>
        &nbsp;
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="time" 
            tickFormatter={formatTime}
            tick={{ fontSize: 12 }}
            stroke="#666"
            minTickGap={50}
          />
          <YAxis 
            stroke="#666"
            tick={{ fontSize: 12 }}
            label={{ value: 'Thread Count', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            labelFormatter={(label) => {
              const date = new Date(label);
              return date.toLocaleString();
            }}
            formatter={(value: number) => [value, 'Active Threads']}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '8px'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="active_threads" 
            stroke="#8b5cf6" 
            strokeWidth={2.5}
            strokeDasharray="5 5"
            dot={false}
            name="Active Threads"
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ActiveThreadsChart;
