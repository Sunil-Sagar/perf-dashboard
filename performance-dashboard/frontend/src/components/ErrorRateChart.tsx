import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

interface ErrorRateChartProps {
  data: Array<{
    time: string;
    error_rate: number;
    error_count: number;
    total_count: number;
  }>;
}

const ErrorRateChart = ({ data }: ErrorRateChartProps) => {
  // Sort by time
  const chartData = [...data].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  
  // State for zoom range
  const [brushRange, setBrushRange] = useState<{ startIndex: number; endIndex: number }>({
    startIndex: 0,
    endIndex: chartData.length - 1
  });
  
  // Mouse wheel zoom handler (slower zoom speed)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const zoomFactor = 0.02; // Reduced from 0.1 for slower, more controlled zoom
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

  return (
    <div 
      style={{ width: '100%', minHeight: '500px', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
      onWheel={handleWheel}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1a2332' }}>Error Rate</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span 
            style={{ fontSize: '18px', color: '#6b7280', cursor: 'pointer' }} 
            title="Refresh"
            onClick={() => setBrushRange({ startIndex: 0, endIndex: chartData.length - 1 })}
          >↺</span>
        </div>
      </div>
      
      {/* Spacer to match Distribution chart's info line height */}
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px', height: '21px' }}>
        &nbsp;
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData.slice(brushRange.startIndex, brushRange.endIndex + 1)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fee2e2" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#fee2e2" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="time" 
            tickFormatter={formatTime}
            stroke="#6b7280"
            style={{ fontSize: '11px' }}
            minTickGap={50}
          />
          <YAxis 
            yAxisId="left"
            label={{ value: 'Error Rate (%)', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#ef4444' } }}
            stroke="#ef4444"
            style={{ fontSize: '11px' }}
            domain={[0, 'auto']}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            label={{ value: 'Error Count', angle: 90, position: 'insideRight', style: { fontSize: '12px', fill: '#f97316' } }}
            stroke="#f97316"
            style={{ fontSize: '11px' }}
          />
          <Tooltip 
            labelFormatter={formatTime}
            contentStyle={{ 
              background: 'white', 
              border: '1px solid #e5e7eb', 
              borderRadius: '6px',
              fontSize: '12px'
            }}
            formatter={(value: any, name: string) => {
              if (name === 'Error Rate') return [`${value.toFixed(2)}%`, name];
              if (name === 'Errors') return [`${Math.round(value)} errors`, name];
              return [value, name];
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '11px' }}
            iconType="line"
          />
          <Bar
            yAxisId="right"
            dataKey="error_count"
            fill="#f97316"
            name="Errors"
            opacity={0.7}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="error_rate"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            name="Error Rate"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ErrorRateChart;
