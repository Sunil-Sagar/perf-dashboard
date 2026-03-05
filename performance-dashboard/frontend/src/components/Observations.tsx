import React, { useState } from 'react'

type ObservationCategory =
  | 'SLA'
  | 'Stability'
  | 'Performance'
  | 'Connection Efficiency'
  | 'Concurrency'
  | 'Error Analysis'

type ObservationSeverity = 'warning' | 'info' | 'critical'

interface ObservationItem {
  id: string
  severity: ObservationSeverity
  text: string
  category: ObservationCategory
}

const categoryColors: Record<ObservationCategory, string> = {
  SLA: '#3b82f6',
  Stability: '#f59e0b',
  Performance: '#8b5cf6',
  'Connection Efficiency': '#06b6d4',
  Concurrency: '#ec4899',
  'Error Analysis': '#ef4444',
}

function buildObservations(
  metricsData: any,
  slaErrorRate: number,
  _slaP95: number,
  _slaP90: number,
  slaThroughput: number,
  slaAvgResponse: number
): ObservationItem[] {
  const obs: ObservationItem[] = []

  void _slaP95; void _slaP90

  const errorRate     = metricsData.summary?.error_rate ?? 0
  void errorRate
  const p95           = metricsData.basic_metrics?.p95_response_time ?? 0
  const p99           = metricsData.basic_metrics?.p99_response_time ?? 0
  const avgRT         = metricsData.basic_metrics?.avg_response_time ?? 0
  const minRT         = metricsData.basic_metrics?.min_response_time ?? 0
  const maxRT         = metricsData.basic_metrics?.max_response_time ?? 0
  const throughput    = metricsData.throughput?.requests_per_second ?? 0
  const apdex         = metricsData.apdex?.apdex_score ?? 1
  const satisfied     = metricsData.apdex?.satisfied ?? 0
  const tolerating    = metricsData.apdex?.tolerating ?? 0
  const frustrated    = metricsData.apdex?.frustrated ?? 0
  const totalSamples  = metricsData.summary?.total_samples ?? 0
  const duration      = metricsData.summary?.duration_seconds ?? 0
  const perLabel: any[] = metricsData.per_label ?? []
  const throughputSeries: any[] = metricsData.time_series?.throughput_series ?? []
  const errorSeries: any[]      = metricsData.time_series?.error_series ?? []
  const threadSeries: any[]     = metricsData.time_series?.thread_series ?? []

  // ── SLA Throughput violations ─────────────────────────────────────────
  if (throughputSeries.length > 0 && slaThroughput > 0) {
    const violations = throughputSeries.filter(
      (pt: any) => (pt.throughput ?? pt.value ?? 0) < slaThroughput
    ).length
    if (violations > 0) {
      obs.push({
        id: 'tp_violations',
        severity: violations > 3 ? 'warning' : 'info',
        text: `Throughput dropped below threshold ${violations} time${violations !== 1 ? 's' : ''} during the test run.`,
        category: 'SLA',
      })
    }
  }

  // ── SLA Error Rate violations in time series ──────────────────────────
  if (errorSeries.length > 0 && slaErrorRate > 0) {
    const errViolations = errorSeries.filter(
      (pt: any) => (pt.error_rate ?? pt.value ?? 0) > slaErrorRate
    ).length
    if (errViolations > 0) {
      obs.push({
        id: 'err_violations',
        severity: errViolations > 5 ? 'critical' : 'warning',
        text: `Error rate exceeded the SLA threshold of ${slaErrorRate}% during ${errViolations} time interval${errViolations !== 1 ? 's' : ''}.`,
        category: 'SLA',
      })
    }
  }

  // ── Network latency vs server processing time ─────────────────────────
  const latencyBreakdown = metricsData.latency_breakdown
  if (latencyBreakdown) {
    const overall = latencyBreakdown.overall
    if (overall) {
      const connectTime  = overall.avg_connect_time ?? 0
      const latency      = overall.avg_latency ?? 0
      const serverTime   = avgRT - latency
      if (connectTime > 0 && serverTime > 0 && connectTime > serverTime) {
        obs.push({
          id: 'network_latency',
          severity: 'warning',
          text: `Network latency (${connectTime.toFixed(0)}ms) exceeds server processing time (${serverTime.toFixed(0)}ms), indicating network-side bottleneck.`,
          category: 'Connection Efficiency',
        })
      } else if (connectTime > 0 && latency > 0) {
        obs.push({
          id: 'network_latency_info',
          severity: 'info',
          text: `Average network latency is ${connectTime.toFixed(0)}ms. Server processing accounts for ${Math.max(0, avgRT - latency).toFixed(0)}ms of total response time.`,
          category: 'Connection Efficiency',
        })
      }
    }
  }

  // ── Metric with most variability ──────────────────────────────────────
  if (throughputSeries.length > 1) {
    const tpVals = throughputSeries.map((p: any) => p.throughput ?? p.value ?? 0)
    const errVals = errorSeries.map((p: any) => p.error_rate ?? p.value ?? 0)

    const cv = (arr: number[]) => {
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length
      if (mean === 0) return 0
      const std = Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length)
      return std / mean
    }

    const tpCV  = cv(tpVals)
    const errCV = cv(errVals)
    const mostVariable = tpCV >= errCV ? 'Throughput' : 'Error rate'

    if (tpCV > 0.15 || errCV > 0.15) {
      obs.push({
        id: 'variability',
        severity: 'info',
        text: `${mostVariable} shows the most variability across the test duration — consider investigating load distribution.`,
        category: 'Stability',
      })
    }
  }

  // ── Slowest transaction ───────────────────────────────────────────────
  if (perLabel.length > 0) {
    const slowest = [...perLabel].sort((a, b) => (b.avg_response_time ?? 0) - (a.avg_response_time ?? 0))[0]
    if (slowest && slowest.avg_response_time > avgRT * 1.4) {
      obs.push({
        id: 'slowest_tx',
        severity: slowest.avg_response_time > slaAvgResponse ? 'warning' : 'info',
        text: `Transaction "${slowest.label}" had the highest average response time at ${slowest.avg_response_time.toFixed(0)}ms.`,
        category: 'Performance',
      })
    }
  }

  // ── Most error-prone transaction ──────────────────────────────────────
  if (perLabel.length > 0) {
    const mostErrors = [...perLabel]
      .filter((t: any) => (t.error_rate ?? 0) > 0)
      .sort((a: any, b: any) => (b.error_rate ?? 0) - (a.error_rate ?? 0))[0]
    if (mostErrors) {
      obs.push({
        id: 'error_tx',
        severity: mostErrors.error_rate > slaErrorRate * 2 ? 'critical' : 'warning',
        text: `Transaction "${mostErrors.label}" has the highest error rate at ${mostErrors.error_rate.toFixed(2)}% (${(mostErrors.count ?? 0).toLocaleString()} samples).`,
        category: 'Error Analysis',
      })
    }
  }

  // ── Response time spread ──────────────────────────────────────────────
  if (maxRT > 0 && minRT >= 0) {
    const spread = maxRT - minRT
    if (spread > avgRT * 5) {
      obs.push({
        id: 'rt_spread',
        severity: 'warning',
        text: `Response time spread of ${spread.toFixed(0)}ms (min: ${minRT.toFixed(0)}ms, max: ${maxRT.toFixed(0)}ms) suggests highly inconsistent performance.`,
        category: 'Stability',
      })
    }
  }

  // ── P99 vs P95 outlier gap ────────────────────────────────────────────
  if (p99 > 0 && p95 > 0 && p99 > p95 * 1.8) {
    obs.push({
      id: 'p99_p95_gap',
      severity: 'warning',
      text: `Large gap between P95 (${p95.toFixed(0)}ms) and P99 (${p99.toFixed(0)}ms) indicates severe outlier spikes affecting the top 1% of requests.`,
      category: 'Performance',
    })
  }

  // ── Apdex breakdown ───────────────────────────────────────────────────
  if (totalSamples > 0 && (satisfied + tolerating + frustrated) > 0) {
    const satPct  = ((satisfied  / totalSamples) * 100).toFixed(1)
    const tolPct  = ((tolerating / totalSamples) * 100).toFixed(1)
    const frusPct = ((frustrated / totalSamples) * 100).toFixed(1)
    obs.push({
      id: 'apdex_breakdown',
      severity: apdex < 0.85 ? 'warning' : 'info',
      text: `User experience breakdown: ${satPct}% satisfied, ${tolPct}% tolerating, ${frusPct}% frustrated (Apdex: ${apdex.toFixed(3)}).`,
      category: 'Performance',
    })
  }

  // ── Peak concurrent threads ───────────────────────────────────────────
  if (threadSeries.length > 0) {
    const peakThreads = Math.max(...threadSeries.map((p: any) => p.threads ?? p.value ?? 0))
    if (peakThreads > 0) {
      obs.push({
        id: 'peak_threads',
        severity: 'info',
        text: `Peak concurrent users during the test: ${peakThreads.toLocaleString()} threads.`,
        category: 'Concurrency',
      })
    }
  }

  // ── Test summary observation ──────────────────────────────────────────
  if (totalSamples > 0 && duration > 0) {
    obs.push({
      id: 'test_summary',
      severity: 'info',
      text: `Test executed ${totalSamples.toLocaleString()} requests over ${duration.toFixed(1)}s at an average rate of ${throughput.toFixed(1)} req/s.`,
      category: 'Performance',
    })
  }

  // ── All clean fallback ────────────────────────────────────────────────
  if (obs.length === 0) {
    obs.push({
      id: 'all_clean',
      severity: 'info',
      text: 'No notable observations. System behaviour is consistent and within expected parameters.',
      category: 'Stability',
    })
  }

  // Sort: critical → warning → info
  const order: Record<ObservationSeverity, number> = { critical: 0, warning: 1, info: 2 }
  return obs.sort((a, b) => order[a.severity] - order[b.severity])
}

const severityIcon: Record<ObservationSeverity, { icon: string; color: string; bg: string }> = {
  critical: { icon: '⚠', color: '#dc2626', bg: '#fef2f2' },
  warning:  { icon: 'ⓘ', color: '#d97706', bg: '#fffbeb' },
  info:     { icon: 'ⓘ', color: '#3b82f6', bg: '#eff6ff' },
}

interface ObservationsProps {
  metricsData: any
  slaErrorRate: number
  slaP95: number
  slaP90: number
  slaThroughput: number
  slaAvgResponse: number
}

const Observations: React.FC<ObservationsProps> = ({
  metricsData,
  slaErrorRate,
  slaP95,
  slaP90,
  slaThroughput,
  slaAvgResponse,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const items = buildObservations(
    metricsData,
    slaErrorRate,
    slaP95,
    slaP90,
    slaThroughput,
    slaAvgResponse
  )

  const warningCount = items.filter(i => i.severity !== 'info').length
  const badgeCount   = warningCount > 0 ? warningCount : items.length

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
          <span style={{ fontSize: '15px', color: 'var(--text-secondary, #6b7280)' }}>👁</span>
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary, #1a2332)' }}>
            Observations
          </span>
          <span style={{
            background: warningCount > 0 ? '#f59e0b' : '#3b82f6',
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
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {items.map((item, idx) => {
            const { icon, color, bg } = severityIcon[item.severity]
            const catColor = categoryColors[item.category]
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '11px 14px',
                  borderRadius: '7px',
                  background: idx % 2 === 0
                    ? 'var(--hover-bg, #f9fafb)'
                    : 'transparent',
                }}
              >
                {/* Icon circle */}
                <div style={{
                  flexShrink: 0,
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  color,
                  marginTop: '1px',
                }}>
                  {icon}
                </div>

                {/* Text + category tag */}
                <div>
                  <div style={{
                    fontSize: '13px',
                    color: 'var(--text-primary, #1f2937)',
                    lineHeight: '1.5',
                    marginBottom: '4px',
                  }}>
                    {item.text}
                  </div>
                  <span style={{
                    display: 'inline-block',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: catColor,
                    letterSpacing: '0.3px',
                    textTransform: 'uppercase',
                  }}>
                    {item.category}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Observations
