import ResponseCodeDistributionChart from './ResponseCodeDistributionChart';
import ErrorsByEndpointChart from './ErrorsByEndpointChart';

interface ErrorAnalysisProps {
  errorBreakdown: { [key: string]: number };
  perLabelData: Array<{
    label: string;
    count: number;
    error_rate: number;
  }>;
  totalRequests: number;
}

const ErrorAnalysis = ({ errorBreakdown, perLabelData, totalRequests }: ErrorAnalysisProps) => {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '0'
    }}>
      <h2 style={{
        fontSize: '1.125rem',
        fontWeight: 'bold',
        color: '#1a2332',
        marginBottom: '20px',
        marginTop: '0',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span style={{ color: '#ef4444', fontSize: '1.25rem' }}>⚠️</span> Error Analysis
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '1.5rem'
      }}>
        <ResponseCodeDistributionChart 
          errorBreakdown={errorBreakdown} 
          totalRequests={totalRequests}
        />
        <ErrorsByEndpointChart data={perLabelData} />
      </div>
    </div>
  );
};

export default ErrorAnalysis;
