import React, { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ScatterChart, Scatter, ReferenceLine,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdvancedInsightsProps {
  metricsData: any
  slaErrorRate: number
  slaP95: number
  slaP90: number
  slaThroughput: number
  slaAvgResponse: number
}

// ─── Computation helpers ───────────────────────────────────────────────────────

/** Simple linear regression: returns predicted y at `atX` using points */
function linearPredict(points: { x: number; y: number }[], atX: number): number {
  const n = points.length
  if (n < 2) return 0
  const mx = points.reduce((s, p) => s + p.x, 0) / n
  const my = points.reduce((s, p) => s + p.y, 0) / n
  const num = points.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0)
  const den = points.reduce((s, p) => s + (p.x - mx) ** 2, 0)
  const slope = den === 0 ? 0 : num / den
  const intercept = my - slope * mx
  return slope * atX + intercept
}

/** Coefficient of variation (%) */
const cv = (arr: number[]): number => {
  if (!arr.length) return 0
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length
  if (mean === 0) return 0
  const std = Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length)
  return (std / mean) * 100
}

// ─── KPI Box ──────────────────────────────────────────────────────────────────

type Severity = 'good' | 'warning' | 'critical'

const KPIBox: React.FC<{
  title: string
  value: string
  sub: string
  sev: Severity
  icon: string
}> = ({ title, value, sub, sev, icon }) => {
  const colors: Record<Severity, { bg: string; accent: string; text: string }> = {
    good:     { bg: '#f0fdf4', accent: '#22c55e', text: '#166534' },
    warning:  { bg: '#fffbeb', accent: '#f59e0b', text: '#92400e' },
    critical: { bg: '#fef2f2', accent: '#ef4444', text: '#991b1b' },
  }
  const c = colors[sev]
  return (
    <div style={{
      flex: '1 1 180px',
      background: c.bg,
      border: `1px solid ${c.accent}40`,
      borderRadius: '10px',
      padding: '16px 18px',
      minWidth: '160px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>{title}</span>
      </div>
      <div style={{ fontSize: '26px', fontWeight: 700, color: c.text, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>{sub}</div>
      <div style={{ marginTop: '8px', height: '4px', background: '#e5e7eb', borderRadius: '2px' }}>
        <div style={{ height: '100%', background: c.accent, borderRadius: '2px', width: value.replace(/[^0-9.]/g, '') + '%', maxWidth: '100%' }} />
      </div>
    </div>
  )
}

// ─── Insight bullet list ───────────────────────────────────────────────────────

type BulletSev = 'info' | 'warning' | 'critical' | 'positive'

const InsightBullet: React.FC<{ text: string; sev: BulletSev }> = ({ text, sev }) => {
  const map: Record<BulletSev, { icon: string; color: string }> = {
    positive: { icon: '✅', color: '#166534' },
    info:     { icon: 'ℹ️', color: '#1e40af' },
    warning:  { icon: '⚠️', color: '#92400e' },
    critical: { icon: '🔴', color: '#991b1b' },
  }
  const m = map[sev]
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '8px 12px',
      background: sev === 'critical' ? '#fef2f2' : sev === 'warning' ? '#fffbeb' : sev === 'positive' ? '#f0fdf4' : '#eff6ff',
      borderRadius: '6px',
      marginBottom: '6px',
    }}>
      <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>{m.icon}</span>
      <span style={{ fontSize: '12px', color: m.color, lineHeight: 1.5 }}>{text}</span>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

const AdvancedInsights: React.FC<AdvancedInsightsProps> = ({
  metricsData, slaErrorRate, slaP95, slaP90, slaThroughput, slaAvgResponse,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // ── Derived metrics ─────────────────────────────────────────────────────────

  const insights = useMemo(() => {
    const summary         = metricsData?.summary ?? {}
    const basicMetrics    = metricsData?.basic_metrics ?? {}
    const apdex           = metricsData?.apdex ?? {}
    const perLabel: any[] = metricsData?.per_label ?? []
    const timeSeries      = metricsData?.time_series ?? {}
    const percOverTime: any[] = metricsData?.percentiles_over_time ?? []

    // ── Stability Score (0-100) ─────────────────────────────────────────────
    let stabilityScore = 100
    const errorRate    = summary.error_rate ?? basicMetrics.error_rate ?? 0
    const avgRT        = summary.avg_response_time ?? basicMetrics.avg_response_time ?? 0
    const p95          = basicMetrics.p95_response_time ?? 0
    const throughput   = metricsData?.throughput?.requests_per_second ?? 0
    const apdexScore   = apdex.apdex_score ?? 0

    if (errorRate > slaErrorRate * 2)       stabilityScore -= 30
    else if (errorRate > slaErrorRate)       stabilityScore -= 15
    if (p95 > slaP95 * 1.5)                 stabilityScore -= 25
    else if (p95 > slaP95)                   stabilityScore -= 12
    if (avgRT > slaAvgResponse * 1.5)        stabilityScore -= 15
    else if (avgRT > slaAvgResponse)         stabilityScore -= 8
    if (apdexScore > 0 && apdexScore < 0.7)  stabilityScore -= 20
    else if (apdexScore > 0 && apdexScore < 0.85) stabilityScore -= 10
    stabilityScore = Math.max(0, stabilityScore)
    const stabSev: Severity = stabilityScore >= 75 ? 'good' : stabilityScore >= 50 ? 'warning' : 'critical'

    // ── SLA Compliance (% of sampler-level checks that pass) ─────────────────
    let slaChecks = 0, slaPasses = 0
    perLabel.forEach(t => {
      slaChecks += 4
      if ((t.error_rate ?? 0) <= slaErrorRate) slaPasses++
      if ((t.p95_response_time ?? 0) <= slaP95) slaPasses++
      if ((t.p90_response_time ?? 0) <= slaP90) slaPasses++
      if ((t.throughput ?? 0) >= slaThroughput || slaThroughput === 0) slaPasses++
    })
    const slaCompliance = slaChecks === 0 ? 100 : Math.round((slaPasses / slaChecks) * 100)
    const slaSev: Severity = slaCompliance >= 90 ? 'good' : slaCompliance >= 70 ? 'warning' : 'critical'

    // ── Thread Efficiency  = throughput / peak-threads ──────────────────────
    const threadSeries: any[] = timeSeries.thread_series ?? []
    const peakThreads = threadSeries.length
      ? Math.max(...threadSeries.map((t: any) => t.active_threads ?? 0))
      : 0
    const threadEff = peakThreads > 0 ? throughput / peakThreads : 0
    const threadEffSev: Severity = threadEff >= 2 ? 'good' : threadEff >= 0.5 ? 'warning' : 'critical'

    // ── Capacity Projection: using last 10 time-series throughput points ───
    const tpSeries: any[] = timeSeries.throughput_series ?? []
    const projPoints = tpSeries.slice(-10).map((p: any, i: number) => ({
      x: i,
      y: p.value ?? p.throughput ?? 0,
    }))
    const projectedMax = projPoints.length >= 2
      ? linearPredict(projPoints, projPoints.length + 4)
      : throughput
    const projSev: Severity = projectedMax >= slaThroughput ? 'good' : projectedMax >= slaThroughput * 0.8 ? 'warning' : 'critical'

    // ── SLA Compliance timeline (per percentilesOverTime point) ─────────────
    const slaTimeline = percOverTime.map((p: any) => ({
      time:    p.time ?? '',
      p95:     p.p95 ?? 0,
      p90:     p.p90 ?? 0,
      slaP95:  slaP95,
      slaP90:  slaP90,
      pass:    (p.p95 ?? 0) <= slaP95 ? 1 : 0,
    }))

    // ── Capacity scatter (throughput_series x=index, y=value) ────────────────
    const capacityScatter = tpSeries.map((p: any, i: number) => ({
      x: i,
      y: p.value ?? p.throughput ?? 0,
    }))
    // Add regression line points
    const regLine = capacityScatter.length >= 2
      ? [
          { rx: 0, ry: linearPredict(capacityScatter, 0) },
          { rx: capacityScatter.length - 1, ry: linearPredict(capacityScatter, capacityScatter.length - 1) },
          { rx: capacityScatter.length + 4,  ry: Math.max(0, linearPredict(capacityScatter, capacityScatter.length + 4)) },
        ]
      : []

    // ── Analysis insight bullets ─────────────────────────────────────────────
    const bullets: { text: string; sev: BulletSev }[] = []

    if (apdexScore >= 0.9)
      bullets.push({ text: `Excellent Apdex score of ${apdexScore.toFixed(2)} — ${Math.round((apdex.satisfied_pct ?? 0))}% of requests satisfied users.`, sev: 'positive' })
    else if (apdexScore >= 0.7)
      bullets.push({ text: `Acceptable Apdex of ${apdexScore.toFixed(2)} but ${Math.round((apdex.tolerating_pct ?? 0))}% of requests are in the tolerating zone — consider tuning.`, sev: 'warning' })
    else if (apdexScore > 0)
      bullets.push({ text: `Poor Apdex ${apdexScore.toFixed(2)} — ${Math.round((apdex.frustrated_pct ?? 0))}% of users frustrated. Reduce P95 response time aggressively.`, sev: 'critical' })

    if (errorRate > slaErrorRate * 2)
      bullets.push({ text: `Error rate ${errorRate.toFixed(2)}% is ${(errorRate / slaErrorRate).toFixed(1)}x over SLA (${slaErrorRate}%). Investigate error distribution immediately.`, sev: 'critical' })
    else if (errorRate > slaErrorRate)
      bullets.push({ text: `Error rate ${errorRate.toFixed(2)}% exceeds SLA of ${slaErrorRate}%.`, sev: 'warning' })
    else
      bullets.push({ text: `Error rate ${errorRate.toFixed(2)}% is within SLA (${slaErrorRate}%).`, sev: 'positive' })

    if (p95 > slaP95)
      bullets.push({ text: `P95 response time ${p95.toFixed(0)}ms breaches SLA of ${slaP95}ms. Focus on top-variance samplers.`, sev: p95 > slaP95 * 1.5 ? 'critical' : 'warning' })
    else
      bullets.push({ text: `P95 response time ${p95.toFixed(0)}ms is within SLA of ${slaP95}ms.`, sev: 'positive' })

    if (threadEff > 0) {
      const teSev: BulletSev = threadEffSev === 'good' ? 'positive' : threadEffSev === 'warning' ? 'warning' : 'critical'
      bullets.push({
        text: `Thread Efficiency: ${threadEff.toFixed(2)} req/s per thread (${peakThreads} peak threads, ${throughput.toFixed(1)} req/s peak throughput).`,
        sev: teSev,
      })
    }

    const tpCV = cv((timeSeries.throughput_series ?? []).map((t: any) => t.value ?? t.throughput ?? 0))
    if (tpCV > 30)
      bullets.push({ text: `Throughput is highly variable (CV ${tpCV.toFixed(0)}%). Indicates possible GC pauses, connection pool saturation, or spike patterns.`, sev: 'warning' })
    else if (tpCV > 0)
      bullets.push({ text: `Throughput is relatively stable (CV ${tpCV.toFixed(0)}%).`, sev: 'positive' })

    if (slaCompliance < 70)
      bullets.push({ text: `Only ${slaCompliance}% of SLA checks passed across all samplers. Multiple transactions need remediation.`, sev: 'critical' })

    if (projectedMax < slaThroughput && slaThroughput > 0)
      bullets.push({ text: `Projected throughput trend (${projectedMax.toFixed(1)} req/s) is below SLA target (${slaThroughput} req/s). System may degrade under sustained load.`, sev: 'warning' })

    if (!bullets.length)
      bullets.push({ text: 'All key metrics are within acceptable ranges.', sev: 'positive' })

    return {
      stabilityScore, stabSev,
      slaCompliance, slaSev,
      threadEff, peakThreads, threadEffSev,
      projectedMax, projSev,
      slaTimeline, capacityScatter, regLine,
      bullets,
    }
  }, [metricsData, slaErrorRate, slaP95, slaP90, slaThroughput, slaAvgResponse])

  // ── Render ──────────────────────────────────────────────────────────────────

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
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', cursor: 'pointer',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color, #e5e7eb)',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '15px', color: 'var(--text-secondary, #6b7280)' }}>🔬</span>
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary, #1a2332)' }}>
            Advanced Insights
          </span>
        </div>
        <span style={{
          fontSize: '12px', color: 'var(--text-secondary, #9ca3af)',
          transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s', display: 'inline-block',
        }}>
          ∨
        </span>
      </div>

      {!isCollapsed && (
        <div style={{ padding: '18px' }}>

          {/* Row 1 — KPI Boxes */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <KPIBox
              title="Stability Score"
              value={`${insights.stabilityScore}`}
              sub="Composite health out of 100"
              sev={insights.stabSev}
              icon="📈"
            />
            <KPIBox
              title="SLA Compliance"
              value={`${insights.slaCompliance}`}
              sub="% sampler-level checks passing"
              sev={insights.slaSev}
              icon="✅"
            />
            <KPIBox
              title="Thread Efficiency"
              value={`${insights.threadEff.toFixed(2)}`}
              sub={`req/s per thread (${insights.peakThreads} peak)`}
              sev={insights.threadEffSev}
              icon="⚡"
            />
            <KPIBox
              title="Capacity Projection"
              value={`${insights.projectedMax.toFixed(1)}`}
              sub="Projected throughput (req/s) +4 intervals"
              sev={insights.projSev}
              icon="🔭"
            />
          </div>

          {/* Row 2 — Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>

            {/* SLA Compliance Timeline */}
            <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontWeight: 600, fontSize: '13px', color: '#374151', marginBottom: '10px' }}>
                P95/P90 vs SLA Over Time
              </div>
              {insights.slaTimeline.length > 1 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={insights.slaTimeline} margin={{ top: 4, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10 }}
                      interval={Math.floor(insights.slaTimeline.length / 5)}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: any, name: string) => [`${Number(v).toFixed(0)} ms`, name]} />
                    <ReferenceLine y={insights.slaTimeline[0]?.slaP95 ?? 0} stroke="#ef4444" strokeDasharray="4 3" label={{ value: 'P95 SLA', fontSize: 9, fill: '#ef4444', position: 'right' }} />
                    <ReferenceLine y={insights.slaTimeline[0]?.slaP90 ?? 0} stroke="#f59e0b" strokeDasharray="4 3" label={{ value: 'P90 SLA', fontSize: 9, fill: '#f59e0b', position: 'right' }} />
                    <Line type="monotone" dataKey="p95" stroke="#6366f1" dot={false} strokeWidth={2} name="P95" />
                    <Line type="monotone" dataKey="p90" stroke="#10b981" dot={false} strokeWidth={1.5} name="P90" strokeDasharray="5 3" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>
                  No percentile-over-time data
                </div>
              )}
            </div>

            {/* Capacity Projection Scatter */}
            <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontWeight: 600, fontSize: '13px', color: '#374151', marginBottom: '10px' }}>
                Throughput Trend & Capacity Projection
              </div>
              {insights.capacityScatter.length > 1 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <ScatterChart margin={{ top: 4, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="x" type="number" name="Interval" tick={{ fontSize: 10 }} label={{ value: 'Time Interval', position: 'insideBottom', offset: -10, style: { fontSize: 10 } }} />
                    <YAxis type="number" tick={{ fontSize: 10 }} label={{ value: 'req/s', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: any, name: string) => [Number(v).toFixed(1), name]} />
                    <ReferenceLine y={slaThroughput > 0 ? slaThroughput : undefined} stroke="#ef4444" strokeDasharray="4 3" label={{ value: 'Target', fontSize: 9, fill: '#ef4444', position: 'right' }} />
                    {/* Projected regression line */}
                    {insights.regLine.length > 1 && (
                      <Scatter
                        data={insights.regLine.map(p => ({ x: p.rx, y: p.ry }))}
                        fill="transparent"
                        line={{ stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5 3' }}
                        name="Trend"
                        shape={() => <></>}
                      />
                    )}
                    <Scatter data={insights.capacityScatter} fill="#6366f1" fillOpacity={0.7} name="Throughput" />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>
                  Insufficient throughput series data
                </div>
              )}
            </div>
          </div>

          {/* Row 3 — Analysis Insights bullets */}
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#374151', marginBottom: '10px' }}>
              Analysis Insights
            </div>
            {insights.bullets.map((b, i) => (
              <InsightBullet key={i} text={b.text} sev={b.sev} />
            ))}
          </div>

        </div>
      )}
    </div>
  )
}

export default AdvancedInsights
