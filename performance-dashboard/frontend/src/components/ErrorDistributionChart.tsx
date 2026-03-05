import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ErrorDistributionChartProps {
  data: Array<{
    label: string;
    count: number;
    error_rate: number;
  }>;
}

const ErrorDistributionChart = ({ data }: ErrorDistributionChartProps) => {
  // Calculate total passed and failed requests across all transactions
  let totalPassed = 0;
  let totalFailed = 0;

  data.forEach(item => {
    const errorCount = Math.round((item.error_rate / 100) * item.count);
    const passedCount = item.count - errorCount;
    totalPassed += passedCount;
    totalFailed += errorCount;
  });

  const totalRequests = totalPassed + totalFailed;
  const passRate = totalRequests > 0 ? (totalPassed / totalRequests) * 100 : 0;
  const failRate = totalRequests > 0 ? (totalFailed / totalRequests) * 100 : 0;

  // Data for the pie chart
  const chartData = [
    { name: 'Passed', value: totalPassed, rate: passRate, color: '#22c55e' },
    { name: 'Failed', value: totalFailed, rate: failRate, color: '#ef4444' }
  ];

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
            {data.name} Requests
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '3px' }}>
            <strong>Count:</strong> {data.value.toLocaleString()}
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>
            <strong>Percentage:</strong> {data.rate.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label renderer for pie slices
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    // For small slices (< 15%), position label outside the donut
    const isSmallSlice = percent < 0.15;
    const radius = isSmallSlice 
      ? outerRadius + 30  // Position outside for small slices
      : innerRadius + (outerRadius - innerRadius) * 0.5; // Center in donut for larger slices
    
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={isSmallSlice ? '#4b5563' : 'white'}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="13px"
        fontWeight="bold"
        style={{ textShadow: isSmallSlice ? 'none' : '1px 1px 2px rgba(0,0,0,0.8)' }}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  // If no data, show a message
  if (totalRequests === 0) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        minHeight: '500px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1a2332', marginBottom: '20px' }}>
          Test Success Rate
        </h3>
        <div style={{
          padding: '40px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          border: '2px solid #9ca3af',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#6b7280', marginBottom: '8px' }}>
            No Data Available
          </p>
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>
            Upload a JMeter results file to see metrics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      minHeight: '500px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1a2332' }}>
          Test Success Rate
        </h3>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          Total Requests: <strong style={{ color: '#1a2332' }}>
            {totalRequests.toLocaleString()}
          </strong>
        </div>
      </div>

      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px', height: '21px' }}>
        Overall pass/fail distribution • Hover for details
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ErrorDistributionChart;
