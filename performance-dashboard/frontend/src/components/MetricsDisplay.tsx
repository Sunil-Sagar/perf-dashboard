import React from 'react';
import './MetricsDisplay.css';

interface MetricsData {
  summary: {
    total_samples: number;
    passed: number;
    failed: number;
    error_rate: number;
    duration_seconds: number;
    unique_labels: number;
    start_time: string;
    end_time: string;
  };
  basic_metrics: {
    avg_response_time: number;
    min_response_time: number;
    max_response_time: number;
    median_response_time: number;
    p90_response_time: number;
    p95_response_time: number;
    p99_response_time: number;
    std_dev: number;
  };
  throughput: {
    total_requests: number;
    duration_seconds: number;
    requests_per_second: number;
    requests_per_minute: number;
  };
  errors: {
    total_requests: number;
    passed: number;
    failed: number;
    error_rate: number;
    success_rate: number;
    error_breakdown: { [key: string]: number };
  };
  per_label: Array<{
    label: string;
    count: number;
    avg_response_time: number;
    min_response_time: number;
    max_response_time: number;
    p90_response_time: number;
    p95_response_time: number;
    error_rate: number;
    throughput: number;
  }>;
  apdex: {
    apdex_score: number;
    satisfied: number;
    tolerating: number;
    frustrated: number;
    satisfied_pct: number;
    tolerating_pct: number;
    frustrated_pct: number;
    t_threshold: number;
    f_threshold: number;
  };
}

interface MetricsDisplayProps {
  data: MetricsData;
  filename: string;
  selectedSampler: string;
}

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ data, filename, selectedSampler }) => {
  const { summary, basic_metrics, throughput, errors, per_label, apdex } = data;

  // Filter per_label data based on selectedSampler
  const filteredPerLabel = selectedSampler === 'all' 
    ? per_label 
    : per_label.filter(item => item.label === selectedSampler);

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const getApdexRating = (score: number): string => {
    if (score >= 0.94) return 'Excellent';
    if (score >= 0.85) return 'Good';
    if (score >= 0.70) return 'Fair';
    if (score >= 0.50) return 'Poor';
    return 'Unacceptable';
  };

  const getApdexColor = (score: number): string => {
    if (score >= 0.94) return '#22c55e';
    if (score >= 0.85) return '#84cc16';
    if (score >= 0.70) return '#eab308';
    if (score >= 0.50) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="metrics-display">
      <div className="metrics-header">
        <h2>Performance Analysis Results</h2>
        <span className="filename-badge">{filename}</span>
      </div>

      {/* Overview Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{color: '#3b82f6'}}>▲</div>
          <div className="metric-content">
            <h3>Total Requests</h3>
            <div className="metric-value">{formatNumber(summary.total_samples)}</div>
            <div className="metric-detail">
              <span className="success">+ {summary.passed} passed</span>
              {summary.failed > 0 && (
                <span className="error">X {summary.failed} failed</span>
              )}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{color: '#f59e0b'}}>▼</div>
          <div className="metric-content">
            <h3>Avg Response Time</h3>
            <div className="metric-value">{formatTime(basic_metrics.avg_response_time)}</div>
            <div className="metric-detail">
              P95: {formatTime(basic_metrics.p95_response_time)}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{color: '#8b5cf6'}}>{'>'}</div>
          <div className="metric-content">
            <h3>Throughput</h3>
            <div className="metric-value">{formatNumber(throughput.requests_per_second)}</div>
            <div className="metric-detail">req/sec</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{color: '#10b981'}}>◉</div>
          <div className="metric-content">
            <h3>Apdex Score</h3>
            <div 
              className="metric-value"
              style={{ color: getApdexColor(apdex.apdex_score) }}
            >
              {apdex.apdex_score.toFixed(3)}
            </div>
            <div className="metric-detail">{getApdexRating(apdex.apdex_score)}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{color: '#ef4444'}}>X</div>
          <div className="metric-content">
            <h3>Error Rate</h3>
            <div 
              className="metric-value"
              style={{ color: summary.error_rate > 5 ? '#ef4444' : summary.error_rate > 1 ? '#f97316' : '#22c55e' }}
            >
              {summary.error_rate.toFixed(2)}%
            </div>
            <div className="metric-detail">
              {summary.error_rate === 0 ? 'Perfect!' : `${summary.failed} failures`}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{color: '#6366f1'}}>◷</div>
          <div className="metric-content">
            <h3>Duration</h3>
            <div className="metric-value">{formatTime(summary.duration_seconds * 1000)}</div>
            <div className="metric-detail">{summary.unique_labels} transactions</div>
          </div>
        </div>
      </div>

      {/* Response Time Details */}
      <div className="metrics-section">
        <h3>Response Time Breakdown</h3>
        <div className="percentile-grid">
          <div className="percentile-item">
            <span className="percentile-label">Min</span>
            <span className="percentile-value">{formatTime(basic_metrics.min_response_time)}</span>
          </div>
          <div className="percentile-item">
            <span className="percentile-label">Median (P50)</span>
            <span className="percentile-value">{formatTime(basic_metrics.median_response_time)}</span>
          </div>
          <div className="percentile-item">
            <span className="percentile-label">P90</span>
            <span className="percentile-value">{formatTime(basic_metrics.p90_response_time)}</span>
          </div>
          <div className="percentile-item">
            <span className="percentile-label">P95</span>
            <span className="percentile-value">{formatTime(basic_metrics.p95_response_time)}</span>
          </div>
          <div className="percentile-item">
            <span className="percentile-label">P99</span>
            <span className="percentile-value">{formatTime(basic_metrics.p99_response_time)}</span>
          </div>
          <div className="percentile-item">
            <span className="percentile-label">Max</span>
            <span className="percentile-value">{formatTime(basic_metrics.max_response_time)}</span>
          </div>
        </div>
      </div>

      {/* Per Transaction Metrics */}
      <div className="metrics-section">
        <h3>Transaction Details</h3>
        <div className="table-container">
          <table className="metrics-table">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Count</th>
                <th>Avg Time</th>
                <th>P90</th>
                <th>P95</th>
                <th>Error Rate</th>
                <th>Throughput</th>
              </tr>
            </thead>
            <tbody>
              {filteredPerLabel.map((label, index) => (
                <tr key={index}>
                  <td className="label-cell">{label.label}</td>
                  <td>{formatNumber(label.count)}</td>
                  <td>{formatTime(label.avg_response_time)}</td>
                  <td>{formatTime(label.p90_response_time)}</td>
                  <td>{formatTime(label.p95_response_time)}</td>
                  <td>
                    <span 
                      className={`error-badge ${label.error_rate > 5 ? 'high' : label.error_rate > 1 ? 'medium' : 'low'}`}
                    >
                      {label.error_rate.toFixed(2)}%
                    </span>
                  </td>
                  <td>{formatNumber(label.throughput)} req/s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apdex Details */}
      <div className="metrics-section">
        <h3>Apdex Score Details</h3>
        <div className="apdex-container">
          <div className="apdex-score-large" style={{ color: getApdexColor(apdex.apdex_score) }}>
            {apdex.apdex_score.toFixed(3)}
          </div>
          <div className="apdex-rating">{getApdexRating(apdex.apdex_score)}</div>
          <div className="apdex-breakdown">
            <div className="apdex-bar">
              <div 
                className="apdex-segment satisfied"
                style={{ width: `${apdex.satisfied_pct}%` }}
                title={`Satisfied: ${apdex.satisfied} (${apdex.satisfied_pct.toFixed(1)}%)`}
              ></div>
              <div 
                className="apdex-segment tolerating"
                style={{ width: `${apdex.tolerating_pct}%` }}
                title={`Tolerating: ${apdex.tolerating} (${apdex.tolerating_pct.toFixed(1)}%)`}
              ></div>
              <div 
                className="apdex-segment frustrated"
                style={{ width: `${apdex.frustrated_pct}%` }}
                title={`Frustrated: ${apdex.frustrated} (${apdex.frustrated_pct.toFixed(1)}%)`}
              ></div>
            </div>
            <div className="apdex-legend">
              <div className="legend-item">
                <span className="legend-color satisfied"></span>
                <span>Satisfied ({apdex.satisfied})</span>
                <span className="legend-value">{apdex.satisfied_pct.toFixed(1)}%</span>
              </div>
              <div className="legend-item">
                <span className="legend-color tolerating"></span>
                <span>Tolerating ({apdex.tolerating})</span>
                <span className="legend-value">{apdex.tolerating_pct.toFixed(1)}%</span>
              </div>
              <div className="legend-item">
                <span className="legend-color frustrated"></span>
                <span>Frustrated ({apdex.frustrated})</span>
                <span className="legend-value">{apdex.frustrated_pct.toFixed(1)}%</span>
              </div>
            </div>
            <div className="apdex-thresholds">
              <small>Thresholds: Satisfied ≤ {apdex.t_threshold}ms, Frustrated &gt; {apdex.f_threshold}ms</small>
            </div>
          </div>
        </div>
      </div>

      {/* Error Breakdown (if errors exist) */}
      {summary.failed > 0 && Object.keys(errors.error_breakdown).length > 0 && (
        <div className="metrics-section">
          <h3 style={{color: '#ef4444'}}>Error Breakdown</h3>
          <div className="error-breakdown">
            {Object.entries(errors.error_breakdown).map(([code, count]) => (
              <div key={code} className="error-item">
                <span className="error-code">{code}</span>
                <span className="error-count">{count} occurrences</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsDisplay;
