import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PercentileData {
  time: string;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

interface PercentilesChartProps {
  data: PercentileData[];
}

export default function PercentilesChart({ data }: PercentilesChartProps) {
  const [brushRange, setBrushRange] = useState<{ startIndex: number; endIndex: number }>({
    startIndex: 0,
    endIndex: data.length - 1
  });

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        No percentile data available
      </div>
    );
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.02;
    const direction = e.deltaY < 0 ? -1 : 1;
    const currentRange = brushRange.endIndex - brushRange.startIndex;
    const zoomAmount = Math.max(1, Math.floor(currentRange * zoomFactor));
    
    let newStartIndex = brushRange.startIndex;
    let newEndIndex = brushRange.endIndex;
    
    if (direction < 0) {
      // Zoom in
      newStartIndex = Math.min(brushRange.startIndex + zoomAmount, data.length - 2);
      newEndIndex = Math.max(brushRange.endIndex - zoomAmount, newStartIndex + 1);
    } else {
      // Zoom out
      newStartIndex = Math.max(brushRange.startIndex - zoomAmount, 0);
      newEndIndex = Math.min(brushRange.endIndex + zoomAmount, data.length - 1);
    }
    
    setBrushRange({ startIndex: newStartIndex, endIndex: newEndIndex });
  };

  const chartData = data.slice(brushRange.startIndex, brushRange.endIndex + 1);

  // Format time for display
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Dynamic angle calculation - bell curve effect
  // Horizontal (0°) when fully zoomed out or fully zoomed in
  // Maximum angle (-30°) at medium zoom level
  const visibleItemCount = chartData.length;
  const totalItemCount = data.length;
  const zoomRatio = visibleItemCount / totalItemCount;
  const dynamicAngle = -30 * Math.sin(zoomRatio * Math.PI); // creates bell curve from 0° → -30° → 0°

  return (
    <div 
      style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        minHeight: '500px'
      }}
      onWheel={handleWheel}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
          Response Time Percentiles Over Time
        </h3>
        <span 
          style={{ fontSize: '18px', color: '#6b7280', cursor: 'pointer' }} 
          title="Refresh"
          onClick={() => setBrushRange({ startIndex: 0, endIndex: data.length - 1 })}>
          ↺
        </span>
      </div>

      {/* Spacer to match Latency chart's info line height */}
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px', height: '21px' }}>
        &nbsp;
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" />
          <XAxis 
            dataKey="time" 
            stroke="var(--text-primary)"
            tickFormatter={formatTime}
            minTickGap={50}
            angle={dynamicAngle}
            textAnchor={dynamicAngle < -5 ? "end" : "middle"}
            height={Math.abs(dynamicAngle) > 5 ? 80 : 30}
          />
          <YAxis 
            stroke="var(--text-primary)"
            label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--card-bg)', 
              border: '1px solid var(--border-color)',
              borderRadius: '4px'
            }}
            labelFormatter={formatTime}
            formatter={(value: number) => `${value.toFixed(2)}ms`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="p50" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={false}
            name="P50 (Median)"
          />
          <Line 
            type="monotone" 
            dataKey="p75" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={false}
            name="P75"
          />
          <Line 
            type="monotone" 
            dataKey="p90" 
            stroke="#f59e0b" 
            strokeWidth={2}
            dot={false}
            name="P90"
          />
          <Line 
            type="monotone" 
            dataKey="p95" 
            stroke="#ef4444" 
            strokeWidth={2}
            dot={false}
            name="P95"
          />
          <Line 
            type="monotone" 
            dataKey="p99" 
            stroke="#7c3aed" 
            strokeWidth={2.5}
            dot={false}
            name="P99"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
