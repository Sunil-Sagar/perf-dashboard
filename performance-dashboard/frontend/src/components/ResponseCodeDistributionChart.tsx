import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ResponseCodeDistributionChartProps {
  errorBreakdown: { [key: string]: number };
  totalRequests: number;
}

const ResponseCodeDistributionChart = ({ errorBreakdown, totalRequests }: ResponseCodeDistributionChartProps) => {
  // Transform error breakdown into chart data
  const chartData = Object.entries(errorBreakdown).map(([code, count]) => ({
    name: `HTTP ${code}`,
    value: count,
    code: code,
    percentage: (count / totalRequests * 100).toFixed(2)
  })).sort((a, b) => b.value - a.value);

  // Color mapping for common HTTP codes
  const getColorForCode = (code: string): string => {
    if (code.startsWith('2')) return '#22c55e'; // Green for 2xx (success)
    if (code.startsWith('3')) return '#3b82f6'; // Blue for 3xx (redirect)
    if (code === '500') return '#ef4444'; // Red for 500
    if (code === '503') return '#dc2626'; // Dark red for 503
    if (code.startsWith('5')) return '#f87171'; // Light red for other 5xx
    if (code.startsWith('4')) return '#f59e0b'; // Orange for 4xx
    return '#6b7280'; // Gray for others
  };

  // Add color to chart data
  const chartDataWithColors = chartData.map(item => ({
    ...item,
    color: getColorForCode(item.code)
  }));

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
          maxWidth: '250px'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '6px', color: data.color, fontSize: '13px' }}>
            {data.name}
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '3px' }}>
            <strong>Count:</strong> {data.value.toLocaleString()}
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>
            <strong>Percentage:</strong> {data.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label renderer
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Hide labels < 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="14px"
        fontWeight="bold"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  if (chartDataWithColors.length === 0) {
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
          Response Code Distribution
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
            All requests completed successfully
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
        Response Code Distribution
      </h3>
      
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
        Total Errors: <strong style={{ color: '#ef4444' }}>
          {chartDataWithColors.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
        </strong>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartDataWithColors}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            innerRadius={50}
            fill="#8884d8"
            dataKey="value"
            animationDuration={800}
          >
            {chartDataWithColors.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResponseCodeDistributionChart;
