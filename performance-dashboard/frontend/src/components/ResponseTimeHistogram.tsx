import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface HistogramBucket {
  range: string;
  min: number;
  max: number;
  mid: number;
  count: number;
  percentage: number;
}

interface ResponseTimeHistogramProps {
  data: {
    buckets: HistogramBucket[];
    total_samples: number;
    min_value: number;
    max_value: number;
    num_buckets: number;
  };
}

export default function ResponseTimeHistogram({ data }: ResponseTimeHistogramProps) {
  const [brushRange, setBrushRange] = useState<{ startIndex: number; endIndex: number }>({
    startIndex: 0,
    endIndex: data.buckets.length - 1
  });

  if (!data || !data.buckets || data.buckets.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        No histogram data available
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
      newStartIndex = Math.min(brushRange.startIndex + zoomAmount, data.buckets.length - 2);
      newEndIndex = Math.max(brushRange.endIndex - zoomAmount, newStartIndex + 1);
    } else {
      // Zoom out
      newStartIndex = Math.max(brushRange.startIndex - zoomAmount, 0);
      newEndIndex = Math.min(brushRange.endIndex + zoomAmount, data.buckets.length - 1);
    }
    
    setBrushRange({ startIndex: newStartIndex, endIndex: newEndIndex });
  };

  const chartData = data.buckets.slice(brushRange.startIndex, brushRange.endIndex + 1);
  
  // Dynamic angle calculation based on zoom level
  const visibleItemCount = chartData.length;
  const totalItemCount = data.buckets.length;
  const zoomRatio = visibleItemCount / totalItemCount;
  const dynamicAngle = -30 - (zoomRatio * 60); // ranges from -90 to -30

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
          Response Time Distribution
        </h3>
        <span 
          style={{ fontSize: '18px', color: '#6b7280', cursor: 'pointer' }} 
          title="Refresh"
          onClick={() => setBrushRange({ startIndex: 0, endIndex: data.buckets.length - 1 })}>
          ↺
        </span>
      </div>
      
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>
        Total Samples: {data.total_samples.toLocaleString()} | 
        Range: {data.min_value.toFixed(0)}ms - {data.max_value.toFixed(0)}ms | 
        Buckets: {data.num_buckets}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" />
          <XAxis 
            dataKey="range" 
            stroke="var(--text-primary)"
            tick={{ fontSize: 11 }}
            angle={dynamicAngle}
            textAnchor="end"
            height={80}
            minTickGap={30}
          />
          <YAxis 
            stroke="var(--text-primary)"
            label={{ value: 'Request Count', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--card-bg)', 
              border: '1px solid var(--border-color)',
              borderRadius: '4px'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'count') return [value.toLocaleString(), 'Requests'];
              if (name === 'percentage') return [`${value}%`, 'Percentage'];
              return [value, name];
            }}
          />
          <Legend />
          <Bar dataKey="count" fill="#3b82f6" name="Request Count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
