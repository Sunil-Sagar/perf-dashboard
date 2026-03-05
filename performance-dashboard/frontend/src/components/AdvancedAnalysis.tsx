import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Legend,
  ComposedChart,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'histogram' | 'concurrency' | 'scatter' | 'boxplot' | 'heatmap' | 'correlations'

interface AdvancedAnalysisProps {
  metricsData: any
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const heatmapColor = (value: number, min: number, max: number): string => {
  if (max === min) return '#22c55e'
  const ratio = (value - min) / (max - min)
  const colors = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#991b1b']
  const idx = Math.min(Math.floor(ratio * (colors.length - 1)), colors.length - 2)
  return colors[idx]
}

const pearsonCorr = (xs: number[], ys: number[]): number => {
  const n = xs.length
  if (n < 3) return NaN
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0)
  const dx = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0))
  const dy = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0))
  return dx === 0 || dy === 0 ? NaN : num / (dx * dy)
}

// ─── Tab content components ────────────────────────────────────────────────────

// 1. Histogram
const HistogramTab: React.FC<{ metricsData: any }> = ({ metricsData }) => {
  const data = metricsData.histogram
  if (!data?.buckets?.length) return <EmptyState msg="No histogram data available" />

  const buckets = data.buckets.map((b: any) => ({
    name: b.range,
    count: b.count,
    pct: b.percentage,
  }))

  return (
    <div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
        {data.total_samples?.toLocaleString()} samples · {data.num_buckets} buckets ·
        Range: {data.min_value?.toFixed(0)}ms – {data.max_value?.toFixed(0)}ms
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={buckets} margin={{ top: 4, right: 20, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            interval={0}
            tick={{ fontSize: 10 }}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v: any, name: string) =>
              name === 'count' ? [Number(v).toLocaleString(), 'Requests'] : [`${Number(v).toFixed(1)}%`, 'Percentage']
            }
          />
          <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// 2. Concurrency
const ConcurrencyTab: React.FC<{ metricsData: any }> = ({ metricsData }) => {
  const series: any[] = metricsData.time_series?.thread_series ?? []
  if (!series.length) return <EmptyState msg="No concurrency data available" />

  const data = series.map((p: any) => ({
    time: p.time ?? p.timestamp ?? '',
    threads: p.threads ?? p.value ?? 0,
  }))
  const peak = Math.max(...data.map(d => d.threads))

  return (
    <div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
        Peak concurrent users: <strong>{peak.toLocaleString()}</strong>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 4, right: 20, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="threadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10 }}
            interval={Math.floor(data.length / 8)}
          />
          <YAxis tick={{ fontSize: 11 }} label={{ value: 'Threads', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11 } }} />
          <Tooltip formatter={(v: any) => [Number(v).toLocaleString(), 'Concurrent Users']} />
          <Bar dataKey="threads" fill="url(#threadGrad)" stroke="#3b82f6" strokeWidth={1} radius={[2, 2, 0, 0]} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// 3. Scatter Plot (Response Time vs Throughput per transaction)
const ScatterTab: React.FC<{ metricsData: any }> = ({ metricsData }) => {
  const perLabel: any[] = metricsData.per_label ?? []
  if (perLabel.length < 2) return <EmptyState msg="Not enough transaction data for scatter plot" />

  const data = perLabel.map((t: any) => ({
    name: t.label,
    x: t.throughput ?? 0,
    y: t.avg_response_time ?? 0,
    err: t.error_rate ?? 0,
  }))

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props
    const r = 6
    return (
      <g>
        <circle
          cx={cx} cy={cy} r={r}
          fill={payload.err > 0 ? '#ef4444' : '#6366f1'}
          fillOpacity={0.8}
          stroke={payload.err > 0 ? '#b91c1c' : '#4f46e5'}
          strokeWidth={1}
        />
      </g>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0]?.payload
    return (
      <div style={{ background: '#1a2332', color: '#fff', padding: '8px 12px', borderRadius: 6, fontSize: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.name}</div>
        <div>Throughput: {d.x.toFixed(1)} req/s</div>
        <div>Avg RT: {d.y.toFixed(0)} ms</div>
        <div>Error: {d.err.toFixed(2)}%</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
        Each dot = one transaction · <span style={{ color: '#6366f1' }}>●</span> Clean &nbsp;
        <span style={{ color: '#ef4444' }}>●</span> Has errors
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 4, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="x"
            type="number"
            name="Throughput"
            tick={{ fontSize: 11 }}
            label={{ value: 'Throughput (req/s)', position: 'insideBottom', offset: -10, style: { fontSize: 11 } }}
          />
          <YAxis
            dataKey="y"
            type="number"
            name="Avg RT"
            tick={{ fontSize: 11 }}
            label={{ value: 'Avg Response (ms)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11 } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={data} shape={<CustomDot />} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

// 4. Box Plot (using per_label: min / avg / p90 / p95 / max per transaction)
const BoxPlotTab: React.FC<{ metricsData: any }> = ({ metricsData }) => {
  const perLabel: any[] = metricsData.per_label ?? []
  if (!perLabel.length) return <EmptyState msg="No per-transaction data available" />

  // Build whisker data: base=min, box bottom=avg-min, median=p90-avg, whisker=p95-p90, top-whisker=max-p95
  const data = perLabel.map((t: any) => {
    const min   = t.min_response_time ?? 0
    const avg   = t.avg_response_time ?? 0
    const p90   = t.p90_response_time ?? avg
    const p95   = t.p95_response_time ?? p90
    const max   = t.max_response_time ?? p95
    return {
      name: t.label.length > 14 ? t.label.slice(0, 13) + '…' : t.label,
      min,
      box1: Math.max(0, avg - min),
      box2: Math.max(0, p90 - avg),
      box3: Math.max(0, p95 - p90),
      whisker: Math.max(0, max - p95),
    }
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0]?.payload
    if (!d) return null
    const min  = d.min
    const avg  = d.min + d.box1
    const p90  = avg + d.box2
    const p95  = p90 + d.box3
    const max  = p95 + d.whisker
    return (
      <div style={{ background: '#1a2332', color: '#fff', padding: '8px 12px', borderRadius: 6, fontSize: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        <div>Min:  {min.toFixed(0)} ms</div>
        <div>Avg:  {avg.toFixed(0)} ms</div>
        <div>P90:  {p90.toFixed(0)} ms</div>
        <div>P95:  {p95.toFixed(0)} ms</div>
        <div>Max:  {max.toFixed(0)} ms</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
        Stacked bars show Min → Avg → P90 → P95 → Max per transaction
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 4, right: 20, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" angle={-40} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11 } }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="min"     stackId="box" fill="#e5e7eb" name="Min" />
          <Bar dataKey="box1"    stackId="box" fill="#6ee7b7" name="Avg" />
          <Bar dataKey="box2"    stackId="box" fill="#34d399" name="P90" />
          <Bar dataKey="box3"    stackId="box" fill="#f59e0b" name="P95" />
          <Bar dataKey="whisker" stackId="box" fill="#ef4444" name="Max" radius={[3, 3, 0, 0]} />
          <Legend iconType="square" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// 5. Percentile Heatmap
const HeatmapTab: React.FC<{ metricsData: any }> = ({ metricsData }) => {
  const series: any[] = metricsData.percentiles_over_time ?? []
  if (!series.length) return <EmptyState msg="No percentile-over-time data available" />

  const [metric, setMetric] = useState<'p50' | 'p75' | 'p90' | 'p95' | 'p99'>('p95')

  const values = series.map((p: any) => p[metric] ?? 0)
  const minVal  = Math.min(...values)
  const maxVal  = Math.max(...values)

  const data = series.map((p: any) => ({
    time: p.time ?? '',
    value: p[metric] ?? 0,
  }))

  const CustomBar = (props: any) => {
    const { x, y, width, height, value } = props
    return (
      <rect
        x={x} y={y} width={width} height={height}
        fill={heatmapColor(value, minVal, maxVal)}
        rx={2}
      />
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          Percentile Heatmap Over Time
        </div>
        <select
          value={metric}
          onChange={e => setMetric(e.target.value as any)}
          style={{ fontSize: '12px', padding: '3px 8px', borderRadius: 5, border: '1px solid #e5e7eb', background: 'white', color: '#374151', cursor: 'pointer' }}
        >
          <option value="p50">P50 (Median)</option>
          <option value="p75">P75</option>
          <option value="p90">P90</option>
          <option value="p95">P95</option>
          <option value="p99">P99</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: 60, left: 60, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            label={{ value: 'Response Time (ms)', position: 'insideBottom', offset: -10, style: { fontSize: 11 } }}
          />
          <YAxis
            type="category"
            dataKey="time"
            tick={{ fontSize: 10 }}
            width={55}
            label={{ value: 'Time Interval', angle: -90, position: 'insideLeft', offset: -5, style: { fontSize: 11 } }}
          />
          <Tooltip
            formatter={(v: any) => [`${Number(v).toFixed(0)} ms`, metric.toUpperCase()]}
          />
          <Bar dataKey="value" shape={<CustomBar />} />
        </BarChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
        <span style={{ fontSize: '11px', color: '#6b7280' }}>Fast</span>
        {['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#991b1b'].map((c, i) => (
          <div key={i} style={{ width: 20, height: 12, background: c, borderRadius: 2 }} />
        ))}
        <span style={{ fontSize: '11px', color: '#6b7280' }}>Slow</span>
      </div>
    </div>
  )
}

// 6. Correlations
const CorrelationsTab: React.FC<{ metricsData: any }> = ({ metricsData }) => {
  const perLabel: any[] = metricsData.per_label ?? []
  if (perLabel.length < 4) return <EmptyState msg="Insufficient data for correlation analysis" />

  const metrics = [
    { key: 'avg_response_time',  label: 'Avg RT' },
    { key: 'p95_response_time',  label: 'P95' },
    { key: 'error_rate',         label: 'Error %' },
    { key: 'throughput',        label: 'Throughput' },
    { key: 'count',             label: 'Samples' },
  ]

  const vectors = metrics.map(m => perLabel.map((t: any) => Number(t[m.key] ?? 0)))

  const corrColor = (r: number): string => {
    if (isNaN(r)) return '#f3f4f6'
    const abs = Math.abs(r)
    if (r > 0.6)  return `rgba(99,102,241,${0.3 + abs * 0.7})`
    if (r < -0.6) return `rgba(239,68,68,${0.3 + abs * 0.7})`
    if (abs > 0.3) return `rgba(251,191,36,${0.3 + abs * 0.7})`
    return '#f9fafb'
  }

  return (
    <div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '14px' }}>
        Pearson correlation between per-transaction metrics.
        <span style={{ marginLeft: 8 }}>
          <span style={{ color: '#6366f1', fontWeight: 600 }}>Blue</span> = positive ·&nbsp;
          <span style={{ color: '#ef4444', fontWeight: 600 }}>Red</span> = negative ·&nbsp;
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>Yellow</span> = weak
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '4px' }}>
          <thead>
            <tr>
              <th style={{ padding: '6px 10px', fontSize: '11px', color: '#6b7280', textAlign: 'left' }}></th>
              {metrics.map(m => (
                <th key={m.key} style={{ padding: '6px 10px', fontSize: '11px', color: '#374151', fontWeight: 600, textAlign: 'center' }}>
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((rowM, ri) => (
              <tr key={rowM.key}>
                <td style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                  {rowM.label}
                </td>
                {metrics.map((colM, ci) => {
                  const r = ri === ci ? 1 : pearsonCorr(vectors[ri], vectors[ci])
                  const bg = ri === ci ? '#f3f4f6' : corrColor(r)
                  return (
                    <td
                      key={colM.key}
                      title={isNaN(r) ? 'N/A' : `${rowM.label} vs ${colM.label}: r = ${r.toFixed(3)}`}
                      style={{
                        padding: '10px 14px',
                        textAlign: 'center',
                        background: bg,
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: ri === ci ? 700 : 500,
                        color: ri === ci ? '#6b7280' : (Math.abs(r) > 0.6 ? '#fff' : '#374151'),
                        cursor: 'default',
                        transition: 'opacity 0.15s',
                      }}
                    >
                      {isNaN(r) ? '—' : ri === ci ? '1.00' : r.toFixed(2)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Empty state helper
const EmptyState: React.FC<{ msg: string }> = ({ msg }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '200px', color: '#9ca3af', fontSize: '13px',
  }}>
    {msg}
  </div>
)

// ─── Main Container ────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: 'histogram',    label: 'Histogram' },
  { id: 'concurrency',  label: 'Concurrency' },
  { id: 'scatter',      label: 'Scatter Plot' },
  { id: 'boxplot',      label: 'Box Plot' },
  { id: 'heatmap',      label: 'Percentile Heatmap' },
  { id: 'correlations', label: 'Correlations' },
]

const AdvancedAnalysis: React.FC<AdvancedAnalysisProps> = ({ metricsData }) => {
  const [activeTab, setActiveTab] = useState<TabId>('histogram')
  const [isCollapsed, setIsCollapsed] = useState(false)

  const renderTab = () => {
    switch (activeTab) {
      case 'histogram':    return <HistogramTab    metricsData={metricsData} />
      case 'concurrency':  return <ConcurrencyTab  metricsData={metricsData} />
      case 'scatter':      return <ScatterTab      metricsData={metricsData} />
      case 'boxplot':      return <BoxPlotTab      metricsData={metricsData} />
      case 'heatmap':      return <HeatmapTab      metricsData={metricsData} />
      case 'correlations': return <CorrelationsTab metricsData={metricsData} />
    }
  }

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
          <span style={{ fontSize: '15px', color: 'var(--text-secondary, #6b7280)' }}>⬡</span>
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary, #1a2332)' }}>
            Advanced Analysis
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
        <>
          {/* Tab bar */}
          <div style={{
            display: 'flex', gap: '4px', padding: '10px 18px 0',
            borderBottom: '1px solid var(--border-color, #e5e7eb)',
            overflowX: 'auto',
          }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '7px 14px',
                  border: 'none',
                  borderRadius: '6px 6px 0 0',
                  fontSize: '13px',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: activeTab === tab.id ? '#3b82f6' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'var(--text-secondary, #6b7280)',
                  transition: 'background 0.15s, color 0.15s',
                  marginBottom: '-1px',
                  borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: '18px' }}>
            {renderTab()}
          </div>
        </>
      )}
    </div>
  )
}

export default AdvancedAnalysis
