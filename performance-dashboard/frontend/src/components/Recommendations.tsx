import React, { useState } from 'react'

interface RecommendationItem {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  metric?: string
  actions: string[]
}

interface RecommendationsProps {
  metricsData: any
  slaErrorRate: number
  slaP95: number
  slaP90: number
  slaThroughput: number
  slaAvgResponse: number
}

function buildRecommendations(
  metricsData: any,
  slaErrorRate: number,
  slaP95: number,
  slaP90: number,
  slaThroughput: number,
  slaAvgResponse: number
): RecommendationItem[] {
  const items: RecommendationItem[] = []

  const errorRate = metricsData.summary?.error_rate ?? 0
  const p95 = metricsData.basic_metrics?.p95_response_time ?? 0
  const p90 = metricsData.basic_metrics?.p90_response_time ?? 0
  const avgRT = metricsData.basic_metrics?.avg_response_time ?? 0
  const throughput = metricsData.throughput?.requests_per_second ?? 0
  const apdex = metricsData.apdex?.apdex_score ?? 1

  // Error Rate
  if (errorRate > slaErrorRate) {
    const isCritical = errorRate > slaErrorRate * 2
    const topErrorCode = metricsData.errors?.error_breakdown
      ? Object.entries(metricsData.errors.error_breakdown as Record<string, number>)
          .sort((a, b) => Number(b[1]) - Number(a[1]))[0]
      : null
    items.push({
      id: 'error_rate',
      severity: isCritical ? 'critical' : 'warning',
      title: isCritical ? 'Critical Error Rate' : 'Elevated Error Rate',
      description: `Error rate is above ${slaErrorRate}%, which may impact user experience.${topErrorCode ? ` Most frequent: HTTP ${topErrorCode[0]}.` : ''}`,
      metric: `Error Rate: ${errorRate.toFixed(2)}%`,
      actions: [
        'Review error logs to identify patterns',
        'Check if specific endpoints are failing',
        'Verify external service dependencies',
      ],
    })
  }

  // P95 Response Time
  if (p95 > slaP95) {
    const isCritical = p95 > slaP95 * 1.5
    items.push({
      id: 'p95_breach',
      severity: isCritical ? 'critical' : 'warning',
      title: 'P95 Response Time Breach',
      description: `95th percentile response time exceeds the SLA threshold of ${slaP95}ms. Top 5% of users are experiencing significant delays.`,
      metric: `P95: ${p95.toFixed(0)}ms`,
      actions: [
        'Profile the slowest transactions',
        'Review database query execution plans',
        'Check connection pool sizing and cache hit ratios',
      ],
    })
  }

  // P90 Response Time
  if (p90 > slaP90) {
    items.push({
      id: 'p90_breach',
      severity: 'warning',
      title: 'P90 Response Time Elevated',
      description: `90th percentile response time (${p90.toFixed(0)}ms) exceeds the SLA of ${slaP90}ms, affecting a significant portion of users.`,
      metric: `P90: ${p90.toFixed(0)}ms`,
      actions: [
        'Identify transactions contributing to P90 spike',
        'Consider horizontal scaling or query optimization',
        'Review caching and CDN strategy',
      ],
    })
  }

  // Average Response Time
  if (avgRT > slaAvgResponse) {
    items.push({
      id: 'avg_rt_breach',
      severity: 'warning',
      title: 'Average Response Time Elevated',
      description: `Average response time (${avgRT.toFixed(0)}ms) exceeds the SLA of ${slaAvgResponse}ms. General user experience is degraded.`,
      metric: `Avg RT: ${avgRT.toFixed(0)}ms`,
      actions: [
        'Review application profiling data',
        'Look for N+1 query patterns and blocking calls',
        'Check for unoptimized API endpoints',
      ],
    })
  }

  // Throughput
  if (throughput < slaThroughput) {
    items.push({
      id: 'throughput_low',
      severity: 'warning',
      title: 'Throughput Below Target',
      description: `System throughput (${throughput.toFixed(1)} req/s) is below the SLA minimum of ${slaThroughput} req/s.`,
      metric: `Throughput: ${throughput.toFixed(1)} req/s`,
      actions: [
        'Check for thread contention or resource bottlenecks',
        'Review GC pauses and memory pressure',
        'Compare thread count vs throughput ratio',
      ],
    })
  }

  // Apdex
  if (apdex < 0.85) {
    const isCritical = apdex < 0.70
    items.push({
      id: 'apdex_low',
      severity: isCritical ? 'critical' : 'warning',
      title: isCritical ? 'Poor User Experience (Apdex)' : 'Degraded User Experience (Apdex)',
      description: `Apdex score of ${apdex.toFixed(3)} indicates ${apdex < 0.70 ? 'poor' : 'fair'} user satisfaction. A score ≥ 0.94 is considered excellent.`,
      metric: `Apdex: ${apdex.toFixed(3)}`,
      actions: [
        'Investigate frustrated and tolerating request transactions',
        'Review slow outliers dragging down the score',
        'Set tighter response time targets for critical transactions',
      ],
    })
  }

  // All good
  if (items.length === 0) {
    items.push({
      id: 'all_green',
      severity: 'info',
      title: 'All Systems Within SLA',
      description: 'All key performance indicators are within defined SLA thresholds. System is performing as expected.',
      metric: undefined,
      actions: [
        'Continue monitoring trends across multiple runs',
        'Save this run as a baseline for future comparisons',
      ],
    })
  }

  return items
}

const severityConfig = {
  critical: {
    icon: '⚠',
    iconBg: '#fef2f2',
    iconColor: '#dc2626',
    borderColor: '#ef4444',
    bg: '#fff5f5',
    titleColor: '#991b1b',
  },
  warning: {
    icon: '⚠',
    iconBg: '#fffbeb',
    iconColor: '#d97706',
    borderColor: '#fbbf24',
    bg: '#fefce8',
    titleColor: '#92400e',
  },
  info: {
    icon: '✓',
    iconBg: '#f0fdf4',
    iconColor: '#16a34a',
    borderColor: '#86efac',
    bg: '#f0fdf4',
    titleColor: '#15803d',
  },
}

const Recommendations: React.FC<RecommendationsProps> = ({
  metricsData,
  slaErrorRate,
  slaP95,
  slaP90,
  slaThroughput,
  slaAvgResponse,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const items = buildRecommendations(
    metricsData,
    slaErrorRate,
    slaP95,
    slaP90,
    slaThroughput,
    slaAvgResponse
  )

  const nonInfoCount = items.filter(i => i.severity !== 'info').length
  const badgeCount = nonInfoCount > 0 ? nonInfoCount : items.length

  return (
    <div style={{
      background: 'var(--card-bg, #fff)',
      border: '1px solid var(--border-color, #e5e7eb)',
      borderRadius: '10px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      marginBottom: '16px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div
        onClick={() => setIsCollapsed(prev => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          cursor: 'pointer',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color, #e5e7eb)',
          background: 'var(--card-bg, #fff)',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '15px', color: 'var(--text-secondary, #6b7280)' }}>⏱</span>
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary, #1a2332)' }}>
            Recommendations
          </span>
          <span style={{
            background: nonInfoCount > 0 ? '#3b82f6' : '#22c55e',
            color: 'white',
            borderRadius: '12px',
            padding: '1px 8px',
            fontSize: '11px',
            fontWeight: 700,
            lineHeight: '18px',
            minWidth: '20px',
            textAlign: 'center',
          }}>
            {badgeCount}
          </span>
        </div>
        <span style={{
          fontSize: '12px',
          color: 'var(--text-secondary, #9ca3af)',
          transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          display: 'inline-block',
        }}>
          ∨
        </span>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map(item => {
            const cfg = severityConfig[item.severity]
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  background: cfg.bg,
                  border: `1px solid ${cfg.borderColor}`,
                }}
              >
                {/* Icon */}
                <div style={{
                  flexShrink: 0,
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: cfg.iconBg,
                  border: `1.5px solid ${cfg.borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  color: cfg.iconColor,
                  marginTop: '1px',
                }}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: '13px',
                    color: cfg.titleColor,
                    marginBottom: '3px',
                  }}>
                    {item.title}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary, #6b7280)',
                    marginBottom: '7px',
                    lineHeight: '1.5',
                  }}>
                    {item.description}
                  </div>

                  {/* Metric badge */}
                  {item.metric && (
                    <span style={{
                      display: 'inline-block',
                      background: 'rgba(0,0,0,0.06)',
                      borderRadius: '5px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: cfg.titleColor,
                      marginBottom: '8px',
                    }}>
                      {item.metric}
                    </span>
                  )}

                  {/* Action bullets */}
                  <ul style={{
                    margin: 0,
                    paddingLeft: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                  }}>
                    {item.actions.map((action, i) => (
                      <li key={i} style={{
                        fontSize: '12px',
                        color: 'var(--text-primary, #374151)',
                        lineHeight: '1.4',
                      }}>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Recommendations
