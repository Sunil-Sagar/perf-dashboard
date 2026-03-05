import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ErrorsByEndpointChartProps {
  data: Array<{
    label: string;
    count: number;
    error_rate: number;
  }>;
}

const ErrorsByEndpointChart = ({ data }: ErrorsByEndpointChartProps) => {
  // Calculate error count for each endpoint
  const errorData = data
    .map(item => ({
      name: item.label,
      errorCount: Math.round((item.error_rate / 100) * item.count),
      errorRate: item.error_rate,
      totalCount: item.count
    }))
    .filter(item => item.errorCount > 0) // Only show endpoints with errors
    .sort((a, b) => b.errorCount - a.errorCount); // Sort by error count descending

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          padding: '12px',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxWidth: '280px'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '6px', color: '#1a2332', fontSize: '13px' }}>
            {data.name}
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '3px' }}>
            <strong style={{ color: '#ef4444' }}>Errors:</strong> {data.errorCount.toLocaleString()} / {data.totalCount.toLocaleString()}
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>
            <strong>Error Rate:</strong> {data.errorRate.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom bar label
  const renderBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
      <text
        x={x + width + 5}
        y={y + 10}
        fill="#6b7280"
        fontSize="11px"
        fontWeight="500"
      >
        {value}
      </text>
    );
  };

  if (errorData.length === 0) {
    return (
      <div style={{
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        padding: '20px',
        border: '1px solid #e5e7eb',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1a2332', marginBottom: '20px' }}>
          Errors by Endpoint
        </h3>
        <div style={{
          padding: '40px',
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          border: '2px solid #22c55e',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
          <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#22c55e', marginBottom: '8px' }}>
            No Errors Detected
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            All endpoints completed successfully
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      padding: '20px',
      border: '1px solid #e5e7eb',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1a2332', marginBottom: '8px' }}>
        Errors by Endpoint
      </h3>
      
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
        Showing {errorData.length} endpoint{errorData.length !== 1 ? 's' : ''} with errors
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={errorData}
          layout="vertical"
          margin={{ top: 5, right: 50, left: 10, bottom: 20 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={true} vertical={false} />
          <XAxis 
            type="number" 
            stroke="#9ca3af"
            style={{ fontSize: '11px' }}
            label={{ value: 'Error Count', position: 'insideBottom', offset: 0, fontSize: '11px', fill: '#6b7280' }}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            stroke="#9ca3af"
            style={{ fontSize: '11px' }}
            width={150}
            tick={{ fill: '#4b5563' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(239, 68, 68, 0.05)' }} />
          <Bar 
            dataKey="errorCount" 
            fill="#ef4444"
            radius={[0, 4, 4, 0]}
            label={renderBarLabel}
            barSize={20}
          >
            {errorData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill="#f87171" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ErrorsByEndpointChart;
