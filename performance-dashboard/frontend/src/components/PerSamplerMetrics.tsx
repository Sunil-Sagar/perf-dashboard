import React, { useMemo, useState } from 'react'

interface PerSamplerMetricsProps {
  metricsData: any
  slaErrorRate: number
  slaP95: number
  slaP90: number
  slaThroughput: number
  slaAvgResponse: number
}

type SortKey =
  | 'label' | 'count' | 'avg_response_time' | 'min_response_time'
  | 'max_response_time' | 'p90_response_time' | 'p95_response_time' | 'p99_response_time'
  | 'error_rate' | 'throughput'

// ─── SVG Time-Series Trend Sparkline ────────────────────────────────────────
// Plots avg response time over time for this specific transaction label.
// Color = trend direction: green (stable/improving), yellow (mild degradation),
//         red (significant degradation). Fallback to flat line when < 2 points.

const Sparkline: React.FC<{ values: number[] }> = ({ values }) => {
  const W = 72, H = 24, PAD = 3

  // Fallback: flat line if not enough time-series data for this label
  const pts = values.length >= 2 ? values : null

  if (!pts) {
    // Draw a neutral flat dashed line — indicates no over-time data
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2}
          stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="3 2" />
      </svg>
    )
  }

  const minV = Math.min(...pts)
  const maxV = Math.max(...pts)
  const range = Math.max(maxV - minV, 1)
  const n    = pts.length

  const xs = pts.map((_v, i) => PAD + (i / (n - 1)) * (W - PAD * 2))
  // Higher RT = higher on chart (lower SVG y = visually higher)
  const ys = pts.map(v => H - PAD - ((v - minV) / range) * (H - PAD * 2))

  // Smooth bezier path
  let d = `M ${xs[0].toFixed(1)},${ys[0].toFixed(1)}`
  for (let i = 1; i < n; i++) {
    const cpx = (xs[i - 1] + xs[i]) / 2
    d += ` C ${cpx.toFixed(1)},${ys[i - 1].toFixed(1)} ${cpx.toFixed(1)},${ys[i].toFixed(1)} ${xs[i].toFixed(1)},${ys[i].toFixed(1)}`
  }

  // Color = trend direction (first half avg vs second half avg)
  const mid   = Math.floor(n / 2)
  const early = pts.slice(0, mid).reduce((a, b) => a + b, 0) / Math.max(mid, 1)
  const late  = pts.slice(mid).reduce((a, b) => a + b, 0) / Math.max(n - mid, 1)
  const changePct = early > 0 ? ((late - early) / early) * 100 : 0
  const stroke = changePct <= 5 ? '#22c55e'    // stable or improving
               : changePct <= 20 ? '#f59e0b'   // mild degradation
               : '#ef4444'                      // significant degradation

  // Tiny area fill for readability
  const areaPath = d
    + ` L ${xs[n - 1].toFixed(1)},${(H - PAD).toFixed(1)}`
    + ` L ${xs[0].toFixed(1)},${(H - PAD).toFixed(1)} Z`

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d={areaPath} fill={stroke} fillOpacity={0.08} />
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* First and last anchor dots */}
      <circle cx={xs[0].toFixed(1)}     cy={ys[0].toFixed(1)}     r={1.8} fill={stroke} opacity={0.7} />
      <circle cx={xs[n-1].toFixed(1)}   cy={ys[n-1].toFixed(1)}   r={1.8} fill={stroke} opacity={0.9} />
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pct = (v: number, digits = 2) => `${v.toFixed(digits)}%`
const ms  = (v: number)            => `${v.toFixed(0)}`
const rps = (v: number)            => `${v.toFixed(1)}`

const slaCell = (value: number, limit: number, higher_is_better = false) => {
  const pass = higher_is_better ? value >= limit : value <= limit
  return (
    <span style={{
      color: pass ? '#166534' : '#991b1b',
      background: pass ? '#f0fdf4' : '#fef2f2',
      borderRadius: '4px',
      padding: '1px 5px',
      fontSize: '11px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {value.toFixed(value < 10 ? 2 : 0)}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PerSamplerMetrics: React.FC<PerSamplerMetricsProps> = ({
  metricsData, slaErrorRate, slaP95, slaP90, slaThroughput, slaAvgResponse,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [sortKey, setSortKey]     = useState<SortKey>('avg_response_time')
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('desc')
  const [filterText, setFilterText] = useState('')
  const [page, setPage]           = useState(0)
  const PAGE_SIZE = 15

  const perLabel: any[] = metricsData?.per_label ?? []

  // Build label → avg_response_time[] map from time-series (real over-time trend per label)
  const labelTrendMap = useMemo(() => {
    const rtSeries: any[] = metricsData?.time_series?.response_time_series ?? []
    const map: Record<string, number[]> = {}
    // response_time_series is sorted by time already; just collect in order
    rtSeries.forEach((pt: any) => {
      const lbl = pt.label
      if (!lbl) return
      if (!map[lbl]) map[lbl] = []
      map[lbl].push(pt.avg_response_time ?? 0)
    })
    return map
  }, [metricsData])

  const sorted = useMemo(() => {
    const filtered = perLabel.filter(r =>
      r.label?.toLowerCase().includes(filterText.toLowerCase())
    )
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? (sortKey === 'label' ? '' : 0)
      const bv = b[sortKey] ?? (sortKey === 'label' ? '' : 0)
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return sortDir === 'asc'
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number)
    })
  }, [perLabel, sortKey, sortDir, filterText])

  const pages = Math.ceil(sorted.length / PAGE_SIZE) || 1
  const visible = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
    setPage(0)
  }

  const SortHeader: React.FC<{ k: SortKey; label: string; align?: string }> = ({ k, label, align = 'right' }) => (
    <th
      onClick={() => handleSort(k)}
      style={{
        padding: '8px 10px', fontSize: '11px', fontWeight: 600,
        color: sortKey === k ? '#3b82f6' : '#6b7280',
        cursor: 'pointer', whiteSpace: 'nowrap',
        textAlign: align as any,
        userSelect: 'none',
        borderBottom: '2px solid #e5e7eb',
        background: '#f9fafb',
      }}
    >
      {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : '⇅'}
    </th>
  )

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
          <span style={{ fontSize: '15px', color: 'var(--text-secondary, #6b7280)' }}>📋</span>
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary, #1a2332)' }}>
            Per-Sampler Metrics
          </span>
          <span style={{
            fontSize: '11px', fontWeight: 600, color: '#6b7280',
            background: '#f3f4f6', borderRadius: '10px', padding: '2px 8px',
          }}>
            {sorted.length} transaction{sorted.length !== 1 ? 's' : ''}
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
        <div>
          {/* Filter + summary bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 18px', borderBottom: '1px solid #f3f4f6', gap: '12px', flexWrap: 'wrap',
          }}>
            <input
              type="text"
              placeholder="Filter by transaction name…"
              value={filterText}
              onChange={e => { setFilterText(e.target.value); setPage(0) }}
              onClick={e => e.stopPropagation()}
              style={{
                fontSize: '12px', padding: '5px 10px', borderRadius: '6px',
                border: '1px solid #e5e7eb', background: 'white', color: '#374151',
                width: '240px', outline: 'none',
              }}
            />
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
              Colored cells = SLA pass (green) / fail (red) · Trend = avg RT over time · 🟢 stable · 🟡 mild degradation · 🔴 significant degradation
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr>
                  <SortHeader k="label"            label="Transaction"        align="left" />
                  <SortHeader k="count"             label="Samples"            />
                  <SortHeader k="avg_response_time" label="Avg RT (ms)"        />
                  <SortHeader k="min_response_time" label="Min (ms)"           />
                  <SortHeader k="max_response_time" label="Max (ms)"           />
                  <SortHeader k="p90_response_time" label="P90 (ms)"           />
                  <SortHeader k="p95_response_time" label="P95 (ms)"           />
                  <SortHeader k="p99_response_time" label="P99 (ms)"           />
                  <SortHeader k="error_rate"        label="Error %"            />
                  <SortHeader k="throughput"        label="Throughput (r/s)"   />
                  <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 600, color: '#6b7280', textAlign: 'center', background: '#f9fafb', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap' }}>
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                      No transactions match the filter.
                    </td>
                  </tr>
                ) : visible.map((row, i) => {
                  const isEven = i % 2 === 0
                  return (
                    <tr key={row.label} style={{ background: isEven ? '#ffffff' : '#f9fafb' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 500, color: '#1a2332', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={row.label}>
                        {row.label}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#374151' }}>
                        {Number(row.count ?? 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        {slaAvgResponse > 0
                          ? slaCell(row.avg_response_time ?? 0, slaAvgResponse)
                          : ms(row.avg_response_time ?? 0)}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#374151' }}>
                        {ms(row.min_response_time ?? 0)}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#374151' }}>
                        {ms(row.max_response_time ?? 0)}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        {slaP90 > 0
                          ? slaCell(row.p90_response_time ?? 0, slaP90)
                          : ms(row.p90_response_time ?? 0)}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        {slaP95 > 0
                          ? slaCell(row.p95_response_time ?? 0, slaP95)
                          : ms(row.p95_response_time ?? 0)}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#374151' }}>
                        {ms(row.p99_response_time ?? 0)}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        {slaErrorRate > 0
                          ? slaCell(row.error_rate ?? 0, slaErrorRate)
                          : pct(row.error_rate ?? 0)}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        {slaThroughput > 0
                          ? slaCell(row.throughput ?? 0, slaThroughput, true)
                          : rps(row.throughput ?? 0)}
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <Sparkline values={labelTrendMap[row.label] ?? []} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', padding: '10px 18px', borderTop: '1px solid #f3f4f6',
            }}>
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                style={{
                  padding: '4px 10px', fontSize: '12px', borderRadius: '5px',
                  border: '1px solid #e5e7eb', background: page === 0 ? '#f9fafb' : 'white',
                  cursor: page === 0 ? 'default' : 'pointer', color: page === 0 ? '#d1d5db' : '#374151',
                }}
              >← Prev</button>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                Page {page + 1} of {pages}
              </span>
              <button
                disabled={page >= pages - 1}
                onClick={() => setPage(p => p + 1)}
                style={{
                  padding: '4px 10px', fontSize: '12px', borderRadius: '5px',
                  border: '1px solid #e5e7eb', background: page >= pages - 1 ? '#f9fafb' : 'white',
                  cursor: page >= pages - 1 ? 'default' : 'pointer', color: page >= pages - 1 ? '#d1d5db' : '#374151',
                }}
              >Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PerSamplerMetrics
