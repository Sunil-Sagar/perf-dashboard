import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

interface CombinedAnalysisChartProps {
  data: Array<{
    time: string;
    label: string;
    avg_response_time: number;
  }>;
  threadsData?: Array<{
    time: string;
    active_threads: number;
  }>;
}

const CombinedAnalysisChart = ({ data, threadsData }: CombinedAnalysisChartProps) => {
  // Get unique labels for creating separate lines
  const labels = Array.from(new Set(data.map(d => d.label))).sort();
  
  // State for hiding/showing transactions
  const [hiddenTransactions, setHiddenTransactions] = useState<Set<string>>(new Set());
  
  // Transform data for Recharts format: { time: string, [label]: number, activeThreads?: number }
  const chartData: Record<string, any>[] = [];
  const timeGroups = data.reduce((acc, item) => {
    if (!acc[item.time]) {
      acc[item.time] = { time: item.time };
    }
    acc[item.time][item.label] = item.avg_response_time;
    return acc;
  }, {} as Record<string, any>);
  
  // Add threads data if available
  if (threadsData) {
    threadsData.forEach(item => {
      if (!timeGroups[item.time]) {
        timeGroups[item.time] = { time: item.time };
      }
      timeGroups[item.time].activeThreads = item.active_threads;
    });
  }
  
  Object.values(timeGroups).forEach(group => chartData.push(group));
  
  // Sort by time
  chartData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  
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
      // Zoom in
      newStartIndex = Math.min(brushRange.startIndex + zoomAmount, chartData.length - 2);
      newEndIndex = Math.max(brushRange.endIndex - zoomAmount, newStartIndex + 1);
    } else {
      // Zoom out
      newStartIndex = Math.max(brushRange.startIndex - zoomAmount, 0);
      newEndIndex = Math.min(brushRange.endIndex + zoomAmount, chartData.length - 1);
    }
    
    setBrushRange({ startIndex: newStartIndex, endIndex: newEndIndex });
  };
  
  // Reset zoom function
  const resetZoom = () => {
    setBrushRange({ startIndex: 0, endIndex: chartData.length - 1 });
  };
  
  // Format time for display
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      return (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          maxWidth: '300px'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '13px' }}>
            {date.toLocaleString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: '4px 0', color: entry.color, fontSize: '12px' }}>
              <span style={{ fontWeight: '600' }}>{entry.name}:</span>{' '}
              {entry.dataKey === 'activeThreads' ? entry.value : `${entry.value.toFixed(0)} ms`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Color palette for different transactions
  const colors = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Orange
    '#8b5cf6', // Purple
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#f97316', // Deep Orange
    '#ec4899', // Pink
    '#84cc16', // Lime
    '#6366f1'  // Indigo
  ];
  
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3>Combined Analysis - All Transactions</h3>
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          No data available for combined analysis
        </div>
      </div>
    );
  }
  
  const displayData = chartData.slice(brushRange.startIndex, brushRange.endIndex + 1);
  
  // Dynamic angle calculation - bell curve effect
  // Horizontal (0°) when fully zoomed out or fully zoomed in
  // Maximum angle (-30°) at medium zoom level
  const visibleItemCount = displayData.length;
  const totalItemCount = chartData.length;
  const zoomRatio = visibleItemCount / totalItemCount;
  const dynamicAngle = -30 * Math.sin(zoomRatio * Math.PI); // creates bell curve from 0° → -30° → 0°
  
  return (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '20px', 
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      minHeight: '500px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <div>
          <h3>Response Time by Transaction{threadsData ? ' + Threads' : ''}</h3>
          <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>
            {threadsData 
              ? 'Click legend items to show/hide individual transactions' 
              : `All transactions displayed on a single timeline (${labels.length} transactions)`}
          </p>
        </div>
        <span 
          onClick={resetZoom}
          style={{ fontSize: '18px', color: '#6b7280', cursor: 'pointer' }}
          title="Reset zoom"
        >
          ↺
        </span>
      </div>
      
      <div onWheel={handleWheel}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={displayData}
            margin={{ top: 35, right: 60, left: 60, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="time" 
              tickFormatter={formatTime}
              angle={dynamicAngle}
              textAnchor={dynamicAngle < -5 ? "end" : "middle"}
              height={Math.abs(dynamicAngle) > 5 ? 80 : 30}
              tick={{ fontSize: 12 }}
              minTickGap={30}
            />
            <YAxis 
              yAxisId="left"
              label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            {threadsData && (
              <YAxis 
                yAxisId="right"
                orientation="right"
                label={{ value: 'Active Threads', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              layout="horizontal"
              verticalAlign="top"
              align="center"
              wrapperStyle={{ paddingBottom: '10px', cursor: 'pointer' }}
              iconType="line"
              onClick={(e: any) => {
                const dataKey = e.dataKey;
                if (dataKey && dataKey !== 'activeThreads') {
                  setHiddenTransactions(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(dataKey)) {
                      newSet.delete(dataKey);
                    } else {
                      newSet.add(dataKey);
                    }
                    return newSet;
                  });
                }
              }}
            />
          {labels.map((label, index) => (
            <Line
              key={label}
              yAxisId="left"
              type="monotone"
              dataKey={label}
              stroke={colors[index % colors.length]}
              name={label}
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
              hide={hiddenTransactions.has(label)}
            />
          ))}
          {threadsData && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="activeThreads"
              stroke="#999"
              name="Active Threads"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CombinedAnalysisChart;
