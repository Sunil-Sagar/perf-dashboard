import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LatencyBreakdown {
  label: string;
  avg_connect_time: number;
  avg_latency: number;
  avg_processing_time: number;
  avg_total: number;
  count: number;
}

interface LatencyBreakdownChartProps {
  data: {
    by_label: LatencyBreakdown[];
    overall: {
      avg_connect_time: number;
      avg_latency: number;
      avg_processing_time: number;
      avg_total: number;
    };
  };
}

export default function LatencyBreakdownChart({ data }: LatencyBreakdownChartProps) {
  const [brushRange, setBrushRange] = useState<{ startIndex: number; endIndex: number }>({
    startIndex: 0,
    endIndex: data.by_label.length - 1
  });

  if (!data || !data.by_label || data.by_label.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        No latency breakdown data available
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
      newStartIndex = Math.min(brushRange.startIndex + zoomAmount, data.by_label.length - 2);
      newEndIndex = Math.max(brushRange.endIndex - zoomAmount, newStartIndex + 1);
    } else {
      // Zoom out
      newStartIndex = Math.max(brushRange.startIndex - zoomAmount, 0);
      newEndIndex = Math.min(brushRange.endIndex + zoomAmount, data.by_label.length - 1);
    }
    
    setBrushRange({ startIndex: newStartIndex, endIndex: newEndIndex });
  };

  const chartData = data.by_label.slice(brushRange.startIndex, brushRange.endIndex + 1);
  
  // Dynamic angle calculation - bell curve effect
  // Horizontal (0°) when fully zoomed out or fully zoomed in
  // Maximum angle (-30°) at medium zoom level
  const visibleItemCount = chartData.length;
  const totalItemCount = data.by_label.length;
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
          Latency Breakdown by Transaction
        </h3>
        <span 
          style={{ fontSize: '18px', color: '#6b7280', cursor: 'pointer' }} 
          title="Refresh"
          onClick={() => setBrushRange({ startIndex: 0, endIndex: data.by_label.length - 1 })}>
          ↺
        </span>
      </div>

      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>
        Overall Avg: Connect {data.overall.avg_connect_time.toFixed(2)}ms | 
        Latency {data.overall.avg_latency.toFixed(2)}ms | 
        Processing {data.overall.avg_processing_time.toFixed(2)}ms | 
        Total {data.overall.avg_total.toFixed(2)}ms
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 110 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" />
          <XAxis 
            dataKey="label" 
            stroke="var(--text-primary)"
            tick={{ fontSize: 10 }}
            angle={dynamicAngle}
            textAnchor={dynamicAngle < -5 ? "end" : "middle"}
            height={Math.abs(dynamicAngle) > 5 ? 90 : 30}
            interval={0}
          />
          <YAxis 
            stroke="var(--text-primary)"
            label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--card-bg)', 
              border: '1px solid var(--border-color)',
              borderRadius: '4px'
            }}
            formatter={(value: number) => `${value.toFixed(2)}ms`}
          />
          <Legend />
          <Bar dataKey="avg_connect_time" stackId="a" fill="#8b5cf6" name="Connect Time" />
          <Bar dataKey="avg_latency" stackId="a" fill="#3b82f6" name="Latency" />
          <Bar dataKey="avg_processing_time" stackId="a" fill="#10b981" name="Processing Time" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
