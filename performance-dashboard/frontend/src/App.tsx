import { useState, useEffect, useRef } from 'react'
import './App.css'
import FileUpload from './components/FileUpload'
import MetricsDisplay from './components/MetricsDisplay'
import ResponseTimeChart from './components/ResponseTimeChart'
import ThroughputChart from './components/ThroughputChart'
import ErrorRateChart from './components/ErrorRateChart'
import ErrorDistributionChart from './components/ErrorDistributionChart'
import ResponseTimeHistogram from './components/ResponseTimeHistogram'
import LatencyBreakdownChart from './components/LatencyBreakdownChart'
import PercentilesChart from './components/PercentilesChart'
import CombinedAnalysisChart from './components/CombinedAnalysisChart'
import ActiveThreadsChart from './components/ActiveThreadsChart'
import ErrorAnalysis from './components/ErrorAnalysis'
import Recommendations from './components/Recommendations'
import Observations from './components/Observations'
import AdvancedAnalysis from './components/AdvancedAnalysis'
import AdvancedInsights from './components/AdvancedInsights'
import PerSamplerMetrics from './components/PerSamplerMetrics'

function App() {
  const [backendStatus, setBackendStatus] = useState<string>('Checking...')
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadMessage, setUploadMessage] = useState<string>('')
  const [uploadMessageType, setUploadMessageType] = useState<'success' | 'error' | ''>('')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [metricsData, setMetricsData] = useState<any>(null)
  const [uploadedFilename, setUploadedFilename] = useState<string>('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [selectedSampler, setSelectedSampler] = useState<string>('all')
  const [baselineData, setBaselineData] = useState<any>(null)
  const [baselineFilename, setBaselineFilename] = useState<string>('')
  const [showCharts, setShowCharts] = useState<boolean>(true)
  const [timeInterval, setTimeInterval] = useState<string>(
    localStorage.getItem('time-interval-preference') || 'auto'
  )
  
  // SLA Thresholds
  const [slaAvgResponse, setSlaAvgResponse] = useState<number>(500)
  const [slaP90, setSlaP90] = useState<number>(800)
  const [slaP95, setSlaP95] = useState<number>(1000)
  const [slaErrorRate, setSlaErrorRate] = useState<number>(1)
  const [slaThroughput, setSlaThroughput] = useState<number>(100)

  // Load baseline from localStorage on mount
  useEffect(() => {
    const savedBaseline = localStorage.getItem('performance-baseline')
    const savedBaselineFilename = localStorage.getItem('performance-baseline-filename')
    if (savedBaseline) {
      try {
        setBaselineData(JSON.parse(savedBaseline))
        setBaselineFilename(savedBaselineFilename || 'Baseline')
      } catch (e) {
        console.error('Failed to load baseline:', e)
      }
    }
  }, [])

  // Save time interval preference to localStorage
  useEffect(() => {
    localStorage.setItem('time-interval-preference', timeInterval)
  }, [timeInterval])

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
  }, [])

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('app-theme', newTheme)
  }

  // Check backend health on mount
  const checkBackend = async () => {
    setIsRefreshing(true)
    setMessage('')
    setMessageType('')
    
    try {
      const response = await fetch('/health')
      const data = await response.json()
      
      if (data.status === 'healthy') {
        setBackendStatus('Connected')
        setMessage('Backend connection successful!')
        setMessageType('success')
      } else {
        setBackendStatus('Unhealthy')
        setMessage('Backend is unhealthy')
        setMessageType('error')
      }
    } catch (error) {
      setBackendStatus('Disconnected')
      setMessage('Failed to connect to backend. Make sure the server is running.')
      setMessageType('error')
    } finally {
      setIsRefreshing(false)
      // Auto-hide message after 3 seconds
      setTimeout(() => {
        setMessage('')
        setMessageType('')
      }, 3000)
    }
  }

  const handleClearMetrics = () => {
    setMetricsData(null)
    setUploadedFilename('')
    setUploadMessage('')
    setUploadMessageType('')
    setSelectedSampler('all')
  }

  const baselineFileInputRef = useRef<HTMLInputElement>(null)
  const comparisonFileInputRef = useRef<HTMLInputElement>(null)

  const handleLoadComparisonFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const inputEl = e.target
    const reader = new FileReader()
    reader.onload = (ev) => {
      inputEl.value = ''
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        if (!parsed.basic_metrics || !parsed.summary || !parsed.apdex) {
          setMessage('Invalid file — missing required fields (basic_metrics / summary / apdex).')
          setMessageType('error')
          setTimeout(() => { setMessage(''); setMessageType('') }, 4000)
          return
        }
        setMetricsData(parsed)
        setUploadedFilename(file.name)
        setSelectedSampler('all')
        setMessage(`Comparison file loaded: "${file.name}"`)
        setMessageType('success')
        setTimeout(() => { setMessage(''); setMessageType('') }, 3000)
      } catch (err) {
        console.error('Comparison parse error:', err)
        setMessage('Failed to parse file. Ensure it is a valid JSON exported from this app.')
        setMessageType('error')
        setTimeout(() => { setMessage(''); setMessageType('') }, 4000)
      }
    }
    reader.onerror = () => {
      inputEl.value = ''
      setMessage('Could not read the selected file.')
      setMessageType('error')
      setTimeout(() => { setMessage(''); setMessageType('') }, 4000)
    }
    reader.readAsText(file)
  }

  const handleSaveBaseline = () => {
    if (!metricsData) return
    // 1. Save to localStorage for in-app comparison
    localStorage.setItem('performance-baseline', JSON.stringify(metricsData))
    localStorage.setItem('performance-baseline-filename', uploadedFilename)
    setBaselineData(metricsData)
    setBaselineFilename(uploadedFilename)
    // 2. Also download as a .json file so the user can see/store it
    const blob = new Blob([JSON.stringify(metricsData, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = uploadedFilename.replace(/\.[^/.]+$/, '') + '_baseline.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setMessage('Baseline saved and downloaded as JSON!')
    setMessageType('success')
    setTimeout(() => { setMessage(''); setMessageType('') }, 3000)
  }

  const handleExportBaseline = () => {
    const raw = localStorage.getItem('performance-baseline')
    if (!raw) return
    const blob = new Blob([raw], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = (baselineFilename || 'baseline').replace(/\.[^/.]+$/, '') + '_baseline.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setMessage('Baseline exported!')
    setMessageType('success')
    setTimeout(() => { setMessage(''); setMessageType('') }, 2000)
  }

  const handleLoadBaselineFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const inputEl = e.target          // capture ref before async ops
    const reader = new FileReader()
    reader.onload = (ev) => {
      // Reset input INSIDE onload so the file handle is not released early
      inputEl.value = ''
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        // Basic structure check
        if (!parsed.basic_metrics || !parsed.summary || !parsed.apdex) {
          setMessage('Invalid baseline file — missing required fields (basic_metrics / summary / apdex).')
          setMessageType('error')
          setTimeout(() => { setMessage(''); setMessageType('') }, 4000)
          return
        }
        localStorage.setItem('performance-baseline', JSON.stringify(parsed))
        localStorage.setItem('performance-baseline-filename', file.name)
        setBaselineData(parsed)
        setBaselineFilename(file.name)
        setMessage(`Baseline loaded from "${file.name}"!`)
        setMessageType('success')
        setTimeout(() => { setMessage(''); setMessageType('') }, 3000)
      } catch (err) {
        console.error('Baseline parse error:', err)
        setMessage('Failed to parse baseline file. Ensure it is a valid JSON exported from this app.')
        setMessageType('error')
        setTimeout(() => { setMessage(''); setMessageType('') }, 4000)
      }
    }
    reader.onerror = () => {
      inputEl.value = ''
      setMessage('Could not read the selected file.')
      setMessageType('error')
      setTimeout(() => { setMessage(''); setMessageType('') }, 4000)
    }
    reader.readAsText(file)
    // NOTE: Do NOT reset inputEl.value here — that would release the file
    //       handle before the async onload callback fires in Electron.
  }

  const handleResetBaseline = () => {
    localStorage.removeItem('performance-baseline')
    localStorage.removeItem('performance-baseline-filename')
    setBaselineData(null)
    setBaselineFilename('')
    setMessage('Baseline cleared')
    setMessageType('success')
    setTimeout(() => { setMessage(''); setMessageType('') }, 3000)
  }
  const exportToQuickHTML = async () => {
    if (!metricsData) return

    setMessage('Generating executive summary report...')
    setMessageType('success')

    // ── Overall Pass / Fail Verdict ─────────────────────────────────────────
    const overallPass =
      metricsData.summary.error_rate < slaErrorRate &&
      metricsData.basic_metrics.p95_response_time < slaP95 &&
      metricsData.throughput.requests_per_second >= slaThroughput &&
      metricsData.apdex.apdex_score >= 0.85
    const verdictLabel  = overallPass ? '✅  PASS' : '❌  FAIL / NEEDS REVIEW'
    const verdictBg     = overallPass ? '#dcfce7' : '#fee2e2'
    const verdictBorder = overallPass ? '#22c55e' : '#ef4444'
    const verdictText   = overallPass ? '#166534' : '#991b1b'

    // ── Status helpers ──────────────────────────────────────────────────────
    const errorStatus      = metricsData.summary.error_rate < slaErrorRate ? 'success' : metricsData.summary.error_rate < slaErrorRate * 2 ? 'warning' : 'danger'
    const apdexStatus      = metricsData.apdex.apdex_score >= 0.94 ? 'success' : metricsData.apdex.apdex_score >= 0.85 ? 'warning' : 'danger'
    const p95Status        = metricsData.basic_metrics.p95_response_time < slaP95 ? 'success' : metricsData.basic_metrics.p95_response_time < slaP95 * 1.5 ? 'warning' : 'danger'
    const throughputStatus = metricsData.throughput.requests_per_second >= slaThroughput ? 'success' : metricsData.throughput.requests_per_second >= slaThroughput * 0.8 ? 'warning' : 'danger'
    const avgStatus        = metricsData.basic_metrics.avg_response_time < slaAvgResponse ? 'success' : 'danger'

    // ── SLA Compliance rows ──────────────────────────────────────────────────
    const slaRows = [
      { metric: 'Error Rate',        sla: `≤ ${slaErrorRate}%`,           actual: `${metricsData.summary.error_rate.toFixed(2)}%`,                  pass: metricsData.summary.error_rate < slaErrorRate },
      { metric: 'Avg Response Time', sla: `≤ ${slaAvgResponse} ms`,       actual: `${metricsData.basic_metrics.avg_response_time.toFixed(0)} ms`,    pass: metricsData.basic_metrics.avg_response_time < slaAvgResponse },
      { metric: 'P90 Response Time', sla: `≤ ${slaP90} ms`,               actual: `${metricsData.basic_metrics.p90_response_time.toFixed(0)} ms`,    pass: metricsData.basic_metrics.p90_response_time < slaP90 },
      { metric: 'P95 Response Time', sla: `≤ ${slaP95} ms`,               actual: `${metricsData.basic_metrics.p95_response_time.toFixed(0)} ms`,    pass: metricsData.basic_metrics.p95_response_time < slaP95 },
      { metric: 'Throughput',        sla: `≥ ${slaThroughput} req/s`,     actual: `${metricsData.throughput.requests_per_second.toFixed(1)} req/s`,  pass: metricsData.throughput.requests_per_second >= slaThroughput },
      { metric: 'Apdex Score',       sla: '≥ 0.85 (Satisfactory)',        actual: `${metricsData.apdex.apdex_score.toFixed(3)}`,                    pass: metricsData.apdex.apdex_score >= 0.85 },
    ]

    // ── Recommendations ──────────────────────────────────────────────────────
    const recommendations: string[] = []
    if (metricsData.summary.error_rate > slaErrorRate)
      recommendations.push(`Error rate is ${metricsData.summary.error_rate.toFixed(2)}% (SLA: ≤ ${slaErrorRate}%). Focus on top failing endpoints and response codes first.`)
    if (metricsData.basic_metrics.p95_response_time > slaP95)
      recommendations.push(`P95 response time is ${metricsData.basic_metrics.p95_response_time.toFixed(0)} ms (SLA: ≤ ${slaP95} ms). Prioritize high-latency transactions from the table below.`)
    if (metricsData.throughput.requests_per_second < slaThroughput)
      recommendations.push(`Throughput is ${metricsData.throughput.requests_per_second.toFixed(1)} req/s (SLA: ≥ ${slaThroughput} req/s). Review thread model, bottlenecks, and backend scaling.`)
    if (metricsData.apdex.apdex_score < 0.85)
      recommendations.push(`Apdex score (${metricsData.apdex.apdex_score.toFixed(3)}) indicates poor user experience. Investigate slow outliers and frustrated requests.`)
    const topErrCode = metricsData.errors?.error_breakdown
      ? Object.entries(metricsData.errors.error_breakdown as Record<string, number>).sort((a, b) => Number(b[1]) - Number(a[1]))[0]
      : null
    if (topErrCode)
      recommendations.push(`Most frequent error: ${topErrCode[0]} — ${Number(topErrCode[1]).toLocaleString()} occurrences.`)
    if (recommendations.length === 0)
      recommendations.push('All KPIs are within SLA thresholds. Consider saving this run as the new performance baseline.')

    // ── Observations (concise bullet points, with pass/fail coloring) ────────
    const obsPoints: { text: string; pass: boolean | null }[] = []
    const obsCoeffVar = metricsData.basic_metrics.avg_response_time > 0
      ? metricsData.basic_metrics.std_dev / metricsData.basic_metrics.avg_response_time : 0
    const obsSlowestTx   = (metricsData.per_label || []).slice().sort((a: any, b: any) => b.avg_response_time - a.avg_response_time)[0]
    const obsMostErrTx   = (metricsData.per_label || []).filter((t: any) => t.error_rate > 0).sort((a: any, b: any) => b.error_rate - a.error_rate)[0]
    const obsPeakThreads = metricsData.time_series?.thread_series?.length
      ? Math.max(...metricsData.time_series.thread_series.map((t: any) => t.active_threads ?? 0)) : 0
    const obsSlaViolCount = (metricsData.per_label || []).filter((t: any) => t.p95_response_time > slaP95).length
    const errOk = metricsData.summary.error_rate <= slaErrorRate
    obsPoints.push({ pass: errOk, text: errOk
      ? `Error rate ${metricsData.summary.error_rate.toFixed(2)}% is within SLA (≤ ${slaErrorRate}%).`
      : `Error rate ${metricsData.summary.error_rate.toFixed(2)}% exceeds SLA (≤ ${slaErrorRate}%).` })
    const p95Ok = metricsData.basic_metrics.p95_response_time <= slaP95
    obsPoints.push({ pass: p95Ok, text: p95Ok
      ? `P95 response time ${metricsData.basic_metrics.p95_response_time.toFixed(0)} ms is within SLA target of ${slaP95} ms.`
      : `P95 response time ${metricsData.basic_metrics.p95_response_time.toFixed(0)} ms exceeds SLA target of ${slaP95} ms.` })
    const tpOk = metricsData.throughput.requests_per_second >= slaThroughput
    obsPoints.push({ pass: tpOk, text: tpOk
      ? `Throughput ${metricsData.throughput.requests_per_second.toFixed(1)} req/s meets the SLA target of ${slaThroughput} req/s.`
      : `Throughput ${metricsData.throughput.requests_per_second.toFixed(1)} req/s is below the SLA target of ${slaThroughput} req/s.` })
    if (obsSlaViolCount > 0)
      obsPoints.push({ pass: false, text: `${obsSlaViolCount} transaction(s) have P95 exceeding the ${slaP95} ms SLA threshold.` })
    if (obsCoeffVar > 0.5)
      obsPoints.push({ pass: false, text: `High response time variability (CV=${(obsCoeffVar * 100).toFixed(1)}%) indicates unstable conditions under load.` })
    const obsP99 = metricsData.basic_metrics.p99_response_time
    const obsP95v = metricsData.basic_metrics.p95_response_time
    if (obsP99 > 0 && obsP95v > 0) {
      const tailPct = (obsP99 / obsP95v - 1) * 100
      obsPoints.push({ pass: tailPct <= 50, text: `P99 (${obsP99.toFixed(0)} ms) is ${tailPct.toFixed(1)}% above P95 — ${tailPct > 50 ? 'heavy' : 'moderate'} tail latency.` })
    }
    if (obsSlowestTx) obsPoints.push({ pass: obsSlowestTx.avg_response_time <= slaAvgResponse, text: `Slowest transaction: "${obsSlowestTx.label}" — avg ${obsSlowestTx.avg_response_time.toFixed(0)} ms.` })
    if (obsMostErrTx) obsPoints.push({ pass: false, text: `Most error-prone: "${obsMostErrTx.label}" — ${obsMostErrTx.error_rate.toFixed(2)}% error rate (${obsMostErrTx.count.toLocaleString()} samples).` })
    if (obsPeakThreads > 0) obsPoints.push({ pass: null, text: `Peak concurrent users: ${obsPeakThreads} threads.` })
    const apdexOk = metricsData.apdex.apdex_score >= 0.85
    obsPoints.push({ pass: apdexOk, text: `Apdex ${metricsData.apdex.apdex_score.toFixed(3)}: ${metricsData.apdex.satisfied_pct.toFixed(1)}% satisfied, ${metricsData.apdex.tolerating_pct.toFixed(1)}% tolerating, ${metricsData.apdex.frustrated_pct.toFixed(1)}% frustrated.` })
    obsPoints.push({ pass: null, text: `Test: ${metricsData.summary.total_samples.toLocaleString()} requests over ${metricsData.summary.duration_seconds.toFixed(0)} s.` })

    // ── Advanced Insights KPIs ────────────────────────────────────────────────
    const aiPerLabel = metricsData.per_label || []
    const aiPassCount = aiPerLabel.filter((t: any) => t.p95_response_time <= slaP95 && t.error_rate <= slaErrorRate).length
    const aiSlaCompliancePct = aiPerLabel.length > 0 ? Math.round((aiPassCount / aiPerLabel.length) * 100) : 100
    const aiCoeffVar = metricsData.basic_metrics.avg_response_time > 0
      ? metricsData.basic_metrics.std_dev / metricsData.basic_metrics.avg_response_time : 0
    const aiPeakThreads = metricsData.time_series?.thread_series?.length
      ? Math.max(...metricsData.time_series.thread_series.map((t: any) => t.active_threads ?? 1)) : 1
    const aiStabilityScore = Math.max(0, Math.min(100, Math.round(
      100 - (metricsData.summary.error_rate * 3)
          - (Math.max(0, metricsData.basic_metrics.p95_response_time - slaP95) * 0.01)
          - (aiCoeffVar * 50)
    )))
    const aiThreadEff    = aiPeakThreads > 0 ? (metricsData.throughput.requests_per_second / aiPeakThreads).toFixed(2) : '-'
    const aiP95Headroom  = slaP95 > 0 ? Math.max(0, (1 - metricsData.basic_metrics.p95_response_time / slaP95) * 100) : -1
    const aiP95HrStr     = aiP95Headroom >= 0 ? aiP95Headroom.toFixed(1) + '%' : 'N/A'
    const aiStabBorder   = aiStabilityScore >= 85 ? '#22c55e' : aiStabilityScore >= 60 ? '#fbbf24' : '#ef4444'
    const aiStabBg       = aiStabilityScore >= 85 ? '#f0fdf4' : aiStabilityScore >= 60 ? '#fefce8' : '#fef2f2'
    const aiCompBorder   = aiSlaCompliancePct >= 100 ? '#22c55e' : aiSlaCompliancePct >= 80 ? '#fbbf24' : '#ef4444'
    const aiCompBg       = aiSlaCompliancePct >= 100 ? '#f0fdf4' : aiSlaCompliancePct >= 80 ? '#fefce8' : '#fef2f2'
    const aiHrBorder     = aiP95Headroom >= 30 ? '#22c55e' : aiP95Headroom >= 10 ? '#fbbf24' : '#ef4444'
    const aiHrBg         = aiP95Headroom >= 30 ? '#f0fdf4' : aiP95Headroom >= 10 ? '#fefce8' : '#fef2f2'

    // ── Baseline data ─────────────────────────────────────────────────────────
    const toNumber = (value: any): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null)
    const baselineRows = baselineData ? [
      { label: 'Error Rate',        current: toNumber(metricsData.summary?.error_rate),                 baseline: toNumber(baselineData.summary?.error_rate),                 unit: '%',      lowerIsBetter: true },
      { label: 'Avg Response Time', current: toNumber(metricsData.basic_metrics?.avg_response_time),    baseline: toNumber(baselineData.basic_metrics?.avg_response_time),    unit: ' ms',    lowerIsBetter: true },
      { label: 'P95 Response Time', current: toNumber(metricsData.basic_metrics?.p95_response_time),    baseline: toNumber(baselineData.basic_metrics?.p95_response_time),    unit: ' ms',    lowerIsBetter: true },
      { label: 'Throughput',        current: toNumber(metricsData.throughput?.requests_per_second),      baseline: toNumber(baselineData.throughput?.requests_per_second),      unit: ' req/s', lowerIsBetter: false },
      { label: 'Apdex Score',       current: toNumber(metricsData.apdex?.apdex_score),                  baseline: toNumber(baselineData.apdex?.apdex_score),                  unit: '',       lowerIsBetter: false },
    ].filter(row => row.current !== null && row.baseline !== null) : []

    // ── Error analysis data ──────────────────────────────────────────────────
    const errorCodeRows = metricsData.errors?.error_breakdown
      ? Object.entries(metricsData.errors.error_breakdown as Record<string, number>).sort((a, b) => Number(b[1]) - Number(a[1]))
      : []
    const topFailingTx = (metricsData.per_label || [])
      .filter((item: any) => item.error_rate > 0)
      .sort((a: any, b: any) => b.error_rate - a.error_rate || b.count - a.count)
      .slice(0, 5)

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  QUICK HTML TEMPLATE  —  Executive Summary, no charts, print-ready
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance Test Report – ${uploadedFilename}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f4f8; padding: 20px; color: #1a2332; }
    .container { max-width: 1100px; margin: 0 auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.12); border-radius: 8px; overflow: hidden; }
    header { background: linear-gradient(135deg, #1a2332 0%, #2d3e50 100%); color: #c9a26a; padding: 28px 32px; }
    header h1 { font-size: 24px; letter-spacing: 1px; margin-bottom: 4px; }
    header .sub { color: #cbd5e1; font-size: 12px; margin-top: 3px; }
    .verdict { padding: 14px 32px; display: flex; align-items: center; gap: 14px; border-bottom: 3px solid ${verdictBorder}; background: ${verdictBg}; }
    .verdict-label { font-size: 20px; font-weight: 800; color: ${verdictText}; letter-spacing: 0.5px; }
    .verdict-sub { font-size: 12px; color: #64748b; }
    .content { padding: 24px 32px; }
    .section { margin-bottom: 26px; }
    .section-title { font-size: 13px; font-weight: 700; background: #f8fafc; padding: 9px 14px; border-radius: 5px; margin-bottom: 12px; border-left: 4px solid #c9a26a; color: #1a2332; text-transform: uppercase; letter-spacing: 0.6px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(155px, 1fr)); gap: 10px; margin-bottom: 16px; }
    .kpi-box { padding: 14px; border-radius: 7px; border: 2px solid; }
    .kpi-box.success { border-color: #22c55e; background: #f0fdf4; }
    .kpi-box.warning { border-color: #fbbf24; background: #fefce8; }
    .kpi-box.danger  { border-color: #ef4444; background: #fef2f2; }
    .kpi-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #6b7280; margin-bottom: 5px; font-weight: 600; }
    .kpi-value { font-size: 20px; font-weight: 800; color: #1a2332; }
    .info-strip { background: #fafafa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; margin-bottom: 12px; }
    .info-item strong { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 2px; }
    .info-item span { font-size: 12px; color: #334155; font-weight: 500; }
    .sla-strip { background: linear-gradient(135deg, #fef9ec, #fef3c7); border: 1px solid #fde68a; border-radius: 6px; padding: 12px 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
    .sla-strip .info-item strong { color: #92400e; }
    .sla-strip .info-item span { color: #78350f; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }
    thead { background: linear-gradient(135deg, #1a2332 0%, #2d3e50 100%); color: white; }
    thead th { padding: 9px 11px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody tr:hover { background: #f0f9ff; }
    tbody td { padding: 8px 11px; }
    tbody td:first-child { font-weight: 600; color: #1a2332; }
    .pass-cell { color: #16a34a; font-weight: 700; }
    .fail-cell { color: #dc2626; font-weight: 700; }
    .c-success { color: #16a34a; font-weight: 700; }
    .c-warning { color: #d97706; font-weight: 700; }
    .c-danger  { color: #dc2626; font-weight: 700; }
    .bullet-list { list-style: none; display: grid; gap: 7px; }
    .bullet-list li { padding: 9px 13px; border-radius: 5px; background: #f8fafc; border-left: 3px solid #94a3b8; font-size: 12px; color: #334155; }
    .bullet-list li.ok  { border-left-color: #22c55e; background: #f0fdf4; }
    .bullet-list li.bad { border-left-color: #ef4444; background: #fff1f2; }
    .insight-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; }
    .insight-box { padding: 13px 15px; border-radius: 7px; border: 2px solid; }
    .insight-box .ilabel { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #6b7280; margin-bottom: 5px; font-weight: 600; }
    .insight-box .ivalue { font-size: 20px; font-weight: 800; color: #1a2332; }
    footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 32px; text-align: center; font-size: 11px; color: #94a3b8; }
    footer .brand { color: #c9a26a; font-weight: 700; }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; border-radius: 0; }
      .verdict, .kpi-box, .insight-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
<div class="container">

  <header>
    <h1>PERFORMANCE TEST REPORT</h1>
    <div class="sub">Executive Summary &nbsp;|&nbsp; ${uploadedFilename}</div>
    <div class="sub">Generated: ${new Date().toLocaleString()}</div>
  </header>

  <!-- VERDICT BANNER -->
  <div class="verdict">
    <div class="verdict-label">${verdictLabel}</div>
    <div class="verdict-sub">${overallPass
      ? 'All key SLA criteria (Error Rate, P95, Throughput, Apdex) are met.'
      : 'One or more SLA criteria not met — see SLA Compliance table below.'}</div>
  </div>

  <div class="content">

    <!-- 1. EXECUTIVE KPIs + TEST INFO -->
    <div class="section">
      <h2 class="section-title">Executive Summary</h2>
      <div class="kpi-grid">
        <div class="kpi-box ${errorStatus}">
          <div class="kpi-label">Error Rate</div>
          <div class="kpi-value">${metricsData.summary.error_rate.toFixed(2)}%</div>
        </div>
        <div class="kpi-box ${apdexStatus}">
          <div class="kpi-label">Apdex Score</div>
          <div class="kpi-value">${metricsData.apdex.apdex_score.toFixed(3)}</div>
        </div>
        <div class="kpi-box ${p95Status}">
          <div class="kpi-label">P95 Response Time</div>
          <div class="kpi-value">${metricsData.basic_metrics.p95_response_time.toFixed(0)} ms</div>
        </div>
        <div class="kpi-box ${throughputStatus}">
          <div class="kpi-label">Throughput</div>
          <div class="kpi-value">${metricsData.throughput.requests_per_second.toFixed(1)}/s</div>
        </div>
        <div class="kpi-box ${avgStatus}">
          <div class="kpi-label">Avg Response Time</div>
          <div class="kpi-value">${metricsData.basic_metrics.avg_response_time.toFixed(0)} ms</div>
        </div>
        <div class="kpi-box ${errorStatus === 'success' ? 'success' : 'danger'}">
          <div class="kpi-label">Success Rate</div>
          <div class="kpi-value">${metricsData.errors.success_rate.toFixed(1)}%</div>
        </div>
      </div>
      <div class="info-strip">
        <div class="info-item"><strong>Test Period</strong><span>${new Date(metricsData.summary.start_time).toLocaleString()} – ${new Date(metricsData.summary.end_time).toLocaleString()}</span></div>
        <div class="info-item"><strong>Duration</strong><span>${metricsData.summary.duration_seconds.toFixed(0)} s</span></div>
        <div class="info-item"><strong>Total Requests</strong><span>${metricsData.summary.total_samples.toLocaleString()}</span></div>
        <div class="info-item"><strong>Unique Transactions</strong><span>${metricsData.summary.unique_labels}</span></div>
        <div class="info-item"><strong>Passed / Failed</strong><span>${metricsData.summary.passed?.toLocaleString() ?? 'N/A'} / ${metricsData.summary.failed?.toLocaleString() ?? 'N/A'}</span></div>
      </div>
      <div class="sla-strip">
        <div class="info-item"><strong>SLA: Avg RT</strong><span>≤ ${slaAvgResponse} ms</span></div>
        <div class="info-item"><strong>SLA: P90</strong><span>≤ ${slaP90} ms</span></div>
        <div class="info-item"><strong>SLA: P95</strong><span>≤ ${slaP95} ms</span></div>
        <div class="info-item"><strong>SLA: Error Rate</strong><span>≤ ${slaErrorRate}%</span></div>
        <div class="info-item"><strong>SLA: Throughput</strong><span>≥ ${slaThroughput} req/s</span></div>
      </div>
    </div>

    <!-- 2. SLA COMPLIANCE TABLE -->
    <div class="section">
      <h2 class="section-title">SLA Compliance</h2>
      <table>
        <thead><tr><th>KPI</th><th>SLA Target</th><th>Actual Value</th><th>Status</th></tr></thead>
        <tbody>
          ${slaRows.map(r => `
          <tr>
            <td>${r.metric}</td>
            <td>${r.sla}</td>
            <td><strong>${r.actual}</strong></td>
            <td class="${r.pass ? 'pass-cell' : 'fail-cell'}">${r.pass ? '✅ PASS' : '❌ FAIL'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <!-- 3. KEY RECOMMENDATIONS -->
    <div class="section">
      <h2 class="section-title">💡 Key Recommendations</h2>
      <ul class="bullet-list">
        ${recommendations.map((item, i) => `
        <li class="${item.includes('within SLA') || item.includes('baseline') ? 'ok' : 'bad'}">
          <strong>R${i + 1}:</strong> ${item}
        </li>`).join('')}
      </ul>
    </div>

    <!-- 4. KEY OBSERVATIONS -->
    <div class="section">
      <h2 class="section-title">🔎 Key Observations</h2>
      <ul class="bullet-list">
        ${obsPoints.map(o => `<li class="${o.pass === true ? 'ok' : o.pass === false ? 'bad' : ''}">${o.text}</li>`).join('')}
      </ul>
    </div>

    <!-- 5. PERFORMANCE INSIGHTS (KPI boxes only) -->
    <div class="section">
      <h2 class="section-title">🧠 Performance Insights</h2>
      <div class="insight-grid">
        <div class="insight-box" style="border-color:${aiStabBorder}; background:${aiStabBg};">
          <div class="ilabel">Stability Score</div>
          <div class="ivalue">${aiStabilityScore}/100</div>
        </div>
        <div class="insight-box" style="border-color:${aiCompBorder}; background:${aiCompBg};">
          <div class="ilabel">Transaction SLA Compliance</div>
          <div class="ivalue">${aiSlaCompliancePct}%</div>
        </div>
        <div class="insight-box" style="border-color:#94a3b8; background:#f8fafc;">
          <div class="ilabel">Thread Efficiency</div>
          <div class="ivalue">${aiThreadEff} req/s/thr</div>
        </div>
        <div class="insight-box" style="border-color:${aiHrBorder}; background:${aiHrBg};">
          <div class="ilabel">P95 SLA Headroom</div>
          <div class="ivalue">${aiP95HrStr}</div>
        </div>
      </div>
    </div>

    <!-- 6. BASELINE COMPARISON -->
    ${baselineRows.length > 0 ? `
    <div class="section">
      <h2 class="section-title">📊 Baseline Comparison — vs. ${baselineFilename || 'Saved Baseline'}</h2>
      <table>
        <thead><tr><th>Metric</th><th>Baseline</th><th>Current</th><th>Delta</th><th>Trend</th></tr></thead>
        <tbody>
          ${baselineRows.map(row => {
            const cur = Number(row.current); const base = Number(row.baseline)
            const deltaPct = base === 0 ? 0 : ((cur - base) / base) * 100
            const isUnchanged = cur === base
            const improved = !isUnchanged && (row.lowerIsBetter ? cur < base : cur > base)
            const statusClass = isUnchanged ? '' : improved ? 'pass-cell' : 'fail-cell'
            const statusLabel = isUnchanged ? '= No Change' : improved ? '▲ Improved' : '▼ Regressed'
            return `<tr>
              <td>${row.label}</td>
              <td>${base.toFixed(row.label === 'Apdex Score' ? 3 : 2)}${row.unit}</td>
              <td><strong>${cur.toFixed(row.label === 'Apdex Score' ? 3 : 2)}${row.unit}</strong></td>
              <td class="${statusClass}">${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(2)}%</td>
              <td class="${statusClass}">${statusLabel}</td>
            </tr>`
          }).join('')}
        </tbody>
      </table>
    </div>
    ` : `
    <div class="section">
      <h2 class="section-title">📊 Baseline Comparison</h2>
      <div style="padding:11px 14px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:5px; color:#64748b; font-size:12px;">
        No baseline saved. Set a baseline from the dashboard to enable delta comparison in this report.
      </div>
    </div>
    `}

    <!-- 7. PER-TRANSACTION SUMMARY (sorted: worst first) -->
    <div class="section">
      <h2 class="section-title">Per-Transaction Summary</h2>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Transaction</th><th>Samples</th><th>Avg (ms)</th><th>Min (ms)</th><th>Max (ms)</th>
              <th>P90 (ms)</th><th>P95 (ms)</th><th>P99 (ms)</th><th>Error %</th><th>Throughput</th>
            </tr>
          </thead>
          <tbody>
            ${metricsData.per_label
              .slice()
              .sort((a: any, b: any) => b.error_rate - a.error_rate || b.avg_response_time - a.avg_response_time)
              .map((item: any) => {
                const avgC = item.avg_response_time  <= slaAvgResponse ? 'c-success' : 'c-danger'
                const p90C = item.p90_response_time  <= slaP90         ? 'c-success' : 'c-danger'
                const p95C = item.p95_response_time  <= slaP95         ? 'c-success' : 'c-danger'
                const errC = item.error_rate < 1 ? 'c-success' : item.error_rate < 5 ? 'c-warning' : 'c-danger'
                const thrVal = Number.isFinite(item.throughput) ? item.throughput : null
                const thrC = thrVal !== null && thrVal >= slaThroughput ? 'c-success' : 'c-warning'
                return `<tr>
                  <td>${item.label}</td>
                  <td>${item.count.toLocaleString()}</td>
                  <td class="${avgC}">${item.avg_response_time.toFixed(0)}</td>
                  <td>${item.min_response_time.toFixed(0)}</td>
                  <td>${item.max_response_time.toFixed(0)}</td>
                  <td class="${p90C}">${item.p90_response_time.toFixed(0)}</td>
                  <td class="${p95C}">${item.p95_response_time.toFixed(0)}</td>
                  <td>${item.p99_response_time?.toFixed(0) ?? '-'}</td>
                  <td class="${errC}">${item.error_rate.toFixed(2)}%</td>
                  <td class="${thrC}">${thrVal !== null ? thrVal.toFixed(2) + '/s' : '-'}</td>
                </tr>`
              }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- 8. ERROR ANALYSIS (only when failures exist) -->
    ${metricsData.summary.failed > 0 ? `
    <div class="section">
      <h2 class="section-title">🧪 Error Analysis</h2>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:6px; padding:13px;">
          <div style="font-weight:700; margin-bottom:7px; color:#9a3412; font-size:12px;">Top Error Codes</div>
          <ul style="list-style:none; display:grid; gap:5px;">
            ${errorCodeRows.slice(0, 5).map(([code, count]) => {
              const pct = metricsData.summary.failed > 0 ? (Number(count) / metricsData.summary.failed) * 100 : 0
              return `<li style="font-size:11px; color:#7c2d12;"><strong>${code}</strong>: ${Number(count).toLocaleString()} occurrences (${pct.toFixed(1)}% of failures)</li>`
            }).join('')}
          </ul>
        </div>
        <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:6px; padding:13px;">
          <div style="font-weight:700; margin-bottom:7px; color:#991b1b; font-size:12px;">Top Failing Transactions</div>
          <ul style="list-style:none; display:grid; gap:5px;">
            ${topFailingTx.length > 0
              ? topFailingTx.map((item: any) => `<li style="font-size:11px; color:#7f1d1d;"><strong>${item.label}</strong>: ${item.error_rate.toFixed(2)}% (${item.count.toLocaleString()} samples)</li>`).join('')
              : '<li style="font-size:11px; color:#7f1d1d;">No individual failing transactions identified.</li>'}
          </ul>
        </div>
      </div>
    </div>
    ` : ''}

  </div><!-- /content -->

  <footer>
    <div>Generated by <span class="brand">Performance Dashboard</span> &nbsp;|&nbsp; ${new Date().toLocaleString()}</div>
    <div style="margin-top:4px; font-size:10px;">© ${new Date().getFullYear()} Deloitte Consulting LLP. All rights reserved.</div>
  </footer>
</div><!-- /container -->
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = uploadedFilename.replace(/\.[^/.]+$/, '') + '_quick_report.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setMessage('Quick HTML report exported successfully!')
    setMessageType('success')
    setTimeout(() => { setMessage(''); setMessageType('') }, 3000)
  }

  const exportToFullHTML = async () => {
    if (!metricsData) return

    setMessage('Generating comprehensive HTML report with captured charts...')
    setMessageType('success')

    // Capture the actual rendered Recharts SVG charts from the live DOM
    const captureChartsFromDOM = (): Record<string, string> => {
      const captured: Record<string, string> = {}
      const chartKeys = [
        'response-time', 'throughput', 'active-threads', 'error-rate',
        'error-distribution', 'histogram', 'latency-breakdown', 'percentiles', 'combined-analysis'
      ]
      chartKeys.forEach(key => {
        try {
          const container = document.querySelector(`[data-chart="${key}"]`)
          if (!container) return
          const svg = container.querySelector('svg')
          if (!svg) return
          const rect = svg.getBoundingClientRect()
          const svgClone = svg.cloneNode(true) as SVGElement
          if (rect.width > 0 && !svgClone.getAttribute('width')) svgClone.setAttribute('width', String(rect.width))
          if (rect.height > 0 && !svgClone.getAttribute('height')) svgClone.setAttribute('height', String(rect.height))
          if (!svgClone.getAttribute('xmlns')) svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
          const serialized = new XMLSerializer().serializeToString(svgClone)
          captured[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serialized)
        } catch (e) {
          console.warn(`Chart capture failed: ${key}`, e)
        }
      })
      return captured
    }
    const capturedCharts = captureChartsFromDOM()
    const hasCharts = Object.keys(capturedCharts).length > 0

    // Calculate status using SLA thresholds
    const errorStatus = metricsData.summary.error_rate < slaErrorRate ? 'success' : metricsData.summary.error_rate < slaErrorRate * 2 ? 'warning' : 'danger'
    const apdexStatus = metricsData.apdex.apdex_score >= 0.94 ? 'success' : metricsData.apdex.apdex_score >= 0.85 ? 'warning' : 'danger'
    const p95Status = metricsData.basic_metrics.p95_response_time < slaP95 ? 'success' : metricsData.basic_metrics.p95_response_time < slaP95 * 1.5 ? 'warning' : 'danger'
    const throughputStatus = metricsData.throughput.requests_per_second >= slaThroughput ? 'success' : metricsData.throughput.requests_per_second >= slaThroughput * 0.8 ? 'warning' : 'danger'

    // Phase 3: Recommendations
    const fullRecommendations: string[] = []
    if (metricsData.summary.error_rate > slaErrorRate) {
      fullRecommendations.push(`Error rate is ${metricsData.summary.error_rate.toFixed(2)}% (SLA: ≤ ${slaErrorRate}%). Focus on top failing endpoints and response codes first.`)
    }
    if (metricsData.basic_metrics.p95_response_time > slaP95) {
      fullRecommendations.push(`P95 response time is ${metricsData.basic_metrics.p95_response_time.toFixed(0)}ms (SLA: ≤ ${slaP95}ms). Prioritize high-latency transactions from the per-transaction table.`)
    }
    if (metricsData.throughput.requests_per_second < slaThroughput) {
      fullRecommendations.push(`Throughput is ${metricsData.throughput.requests_per_second.toFixed(1)} req/s (SLA: ≥ ${slaThroughput} req/s). Review thread model, bottlenecks, and backend scaling.`)
    }
    if (metricsData.apdex.apdex_score < 0.85) {
      fullRecommendations.push(`Apdex score (${metricsData.apdex.apdex_score.toFixed(3)}) indicates poor user experience. Investigate slow outliers and frustrated requests first.`)
    }
    const fullTopErrorCode = metricsData.errors?.error_breakdown
      ? Object.entries(metricsData.errors.error_breakdown as Record<string, number>).sort((a, b) => Number(b[1]) - Number(a[1]))[0]
      : null
    if (fullTopErrorCode) {
      fullRecommendations.push(`Most frequent error code is ${fullTopErrorCode[0]} with ${Number(fullTopErrorCode[1]).toLocaleString()} occurrences.`)
    }
    if (fullRecommendations.length === 0) {
      fullRecommendations.push('All key KPIs are within SLA thresholds. Keep this run as a release candidate baseline and continue trend monitoring.')
    }

    const fullRecommendationsSectionHTML = `
      <div class="section">
        <h2 class="section-title">💡 RECOMMENDATIONS ENGINE OUTPUT</h2>
        <ul style="list-style: none; padding: 0; margin: 0; display: grid; gap: 10px;">
          ${fullRecommendations.map((item, index) => `
            <li style="padding: 12px 14px; border-radius: 6px; background: #f8fafc; border-left: 4px solid ${item.includes('within SLA') ? '#22c55e' : '#f59e0b'}; font-size: 13px; color: #334155;">
              <strong style="color: #1a2332;">R${index + 1}:</strong> ${item}
            </li>
          `).join('')}
        </ul>
      </div>
    `

    const fullToNumber = (value: any): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null)
    const fullBaselineRows = baselineData ? [
      { label: 'Error Rate', current: fullToNumber(metricsData.summary?.error_rate), baseline: fullToNumber(baselineData.summary?.error_rate), unit: '%', lowerIsBetter: true },
      { label: 'Avg Response Time', current: fullToNumber(metricsData.basic_metrics?.avg_response_time), baseline: fullToNumber(baselineData.basic_metrics?.avg_response_time), unit: ' ms', lowerIsBetter: true },
      { label: 'P95 Response Time', current: fullToNumber(metricsData.basic_metrics?.p95_response_time), baseline: fullToNumber(baselineData.basic_metrics?.p95_response_time), unit: ' ms', lowerIsBetter: true },
      { label: 'Throughput', current: fullToNumber(metricsData.throughput?.requests_per_second), baseline: fullToNumber(baselineData.throughput?.requests_per_second), unit: ' req/s', lowerIsBetter: false },
      { label: 'Apdex Score', current: fullToNumber(metricsData.apdex?.apdex_score), baseline: fullToNumber(baselineData.apdex?.apdex_score), unit: '', lowerIsBetter: false }
    ].filter(row => row.current !== null && row.baseline !== null) : []

    const fullBaselineComparisonSectionHTML = fullBaselineRows.length > 0 ? `
      <div class="section">
        <h2 class="section-title">📊 BASELINE COMPARISON</h2>
        <div style="font-size: 12px; color: #6b7280; margin-bottom: 10px;">Comparing current run against baseline: <strong>${baselineFilename || 'Saved Baseline'}</strong></div>
        <table>
          <thead>
            <tr><th>Metric</th><th>Baseline</th><th>Current</th><th>Delta</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${fullBaselineRows.map(row => {
              const cur = Number(row.current)
              const base = Number(row.baseline)
              const deltaPct = base === 0 ? 0 : ((cur - base) / base) * 100
              const isUnchanged = cur === base
              const improved = !isUnchanged && (row.lowerIsBetter ? cur < base : cur > base)
              const deltaSign = deltaPct > 0 ? '+' : ''
              const cellClass = isUnchanged ? '' : improved ? 'success' : 'danger'
              const statusLabel = isUnchanged ? 'No Change' : improved ? 'Improved' : 'Regressed'
              return `<tr>
                <td>${row.label}</td>
                <td>${base.toFixed(row.label === 'Apdex Score' ? 3 : 2)}${row.unit}</td>
                <td>${cur.toFixed(row.label === 'Apdex Score' ? 3 : 2)}${row.unit}</td>
                <td class="error-cell ${cellClass}">${deltaSign}${deltaPct.toFixed(2)}%</td>
                <td class="error-cell ${cellClass}">${statusLabel}</td>
              </tr>`
            }).join('')}
          </tbody>
        </table>
      </div>
    ` : `
      <div class="section">
        <h2 class="section-title">📊 BASELINE COMPARISON</h2>
        <div style="padding: 12px 14px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; color: #475569; font-size: 13px;">
          Baseline comparison is not available yet. Save a baseline from the dashboard sidebar and export again.
        </div>
      </div>
    `

    const fullErrorCodeRows = metricsData.errors?.error_breakdown
      ? Object.entries(metricsData.errors.error_breakdown as Record<string, number>).sort((a, b) => Number(b[1]) - Number(a[1]))
      : []
    const fullTopFailingTransactions = (metricsData.per_label || [])
      .filter((item: any) => item.error_rate > 0)
      .sort((a: any, b: any) => b.error_rate - a.error_rate || b.count - a.count)
      .slice(0, 5)

    const fullAdvancedErrorAnalysisSectionHTML = `
      <div class="section">
        <h2 class="section-title">🧪 ADVANCED ERROR ANALYSIS</h2>
        ${metricsData.summary.failed > 0 ? `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 12px;">
              <div style="font-weight: 700; margin-bottom: 8px; color: #9a3412; font-size: 13px;">Top Error Codes</div>
              <ul style="list-style: none; margin: 0; padding: 0; display: grid; gap: 6px;">
                ${fullErrorCodeRows.slice(0, 5).map(([code, count]) => {
                  const pct = metricsData.summary.failed > 0 ? (Number(count) / metricsData.summary.failed) * 100 : 0
                  return `<li style="font-size: 12px; color: #7c2d12;"><strong>${code}</strong>: ${Number(count).toLocaleString()} (${pct.toFixed(1)}% of failed)</li>`
                }).join('')}
              </ul>
            </div>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px;">
              <div style="font-weight: 700; margin-bottom: 8px; color: #991b1b; font-size: 13px;">Top Failing Transactions</div>
              <ul style="list-style: none; margin: 0; padding: 0; display: grid; gap: 6px;">
                ${fullTopFailingTransactions.length > 0 ? fullTopFailingTransactions.map((item: any) => `<li style="font-size: 12px; color: #7f1d1d;"><strong>${item.label}</strong>: ${item.error_rate.toFixed(2)}% errors (${item.count.toLocaleString()} samples)</li>`).join('') : '<li style="font-size: 12px;">No failing transactions found.</li>'}
              </ul>
            </div>
          </div>
        ` : `
          <div style="padding: 12px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; color: #166534; font-size: 13px;">
            No failed requests detected in this run. Advanced error signals are clean.
          </div>
        `}
      </div>
    `

    // --- Observations Section ---
    const obsPoints: { text: string; pass: boolean | null }[] = []
    const obsCoeffVar = metricsData.basic_metrics.avg_response_time > 0
      ? metricsData.basic_metrics.std_dev / metricsData.basic_metrics.avg_response_time
      : 0
    const obsSlowestTx = (metricsData.per_label || []).slice().sort((a: any, b: any) => b.avg_response_time - a.avg_response_time)[0]
    const obsMostErrorTx = (metricsData.per_label || []).filter((t: any) => t.error_rate > 0).sort((a: any, b: any) => b.error_rate - a.error_rate)[0]
    const obsPeakThreads = metricsData.time_series?.thread_series?.length
      ? Math.max(...metricsData.time_series.thread_series.map((t: any) => t.active_threads ?? 0))
      : 0
    const obsSlaViolCount = (metricsData.per_label || []).filter((t: any) => t.p95_response_time > slaP95).length
    if (metricsData.summary.error_rate > slaErrorRate)
      obsPoints.push({ text: `Error rate is ${metricsData.summary.error_rate.toFixed(2)}%, exceeding the SLA threshold of ${slaErrorRate}%.`, pass: false })
    else
      obsPoints.push({ text: `Error rate of ${metricsData.summary.error_rate.toFixed(2)}% is within the SLA threshold of ${slaErrorRate}%.`, pass: true })
    if (metricsData.basic_metrics.p95_response_time > slaP95)
      obsPoints.push({ text: `P95 response time (${metricsData.basic_metrics.p95_response_time.toFixed(0)} ms) exceeds the SLA target of ${slaP95} ms.`, pass: false })
    else
      obsPoints.push({ text: `P95 response time of ${metricsData.basic_metrics.p95_response_time.toFixed(0)} ms is within the SLA target of ${slaP95} ms.`, pass: true })
    if (metricsData.throughput.requests_per_second < slaThroughput)
      obsPoints.push({ text: `Throughput (${metricsData.throughput.requests_per_second.toFixed(1)} req/s) is below the SLA target of ${slaThroughput} req/s.`, pass: false })
    else
      obsPoints.push({ text: `Throughput of ${metricsData.throughput.requests_per_second.toFixed(1)} req/s meets the SLA target of ${slaThroughput} req/s.`, pass: true })
    if (obsCoeffVar > 0.5)
      obsPoints.push({ text: `High response time variability (CV=${(obsCoeffVar * 100).toFixed(1)}%, std dev ${metricsData.basic_metrics.std_dev.toFixed(0)} ms) indicates unstable conditions.`, pass: false })
    else
      obsPoints.push({ text: `Response time variability is acceptable (CV=${(obsCoeffVar * 100).toFixed(1)}%, std dev ${metricsData.basic_metrics.std_dev.toFixed(0)} ms).`, pass: true })
    if (obsSlaViolCount > 0) obsPoints.push({ text: `${obsSlaViolCount} transaction(s) have P95 exceeding the ${slaP95} ms SLA threshold.`, pass: false })
    const obsP99 = metricsData.basic_metrics.p99_response_time
    const obsP95top = metricsData.basic_metrics.p95_response_time
    if (obsP99 > 0 && obsP95top > 0) {
      const tailPct = (obsP99 / obsP95top - 1) * 100
      obsPoints.push({ text: `P99 (${obsP99.toFixed(0)} ms) is ${tailPct.toFixed(1)}% above P95 (${obsP95top.toFixed(0)} ms), indicating ${tailPct > 50 ? 'heavy' : 'moderate'} tail latency.`, pass: tailPct > 50 ? false : null })
    }
    if (obsSlowestTx) obsPoints.push({ text: `Slowest transaction: "${obsSlowestTx.label}" — avg ${obsSlowestTx.avg_response_time.toFixed(0)} ms.`, pass: null })
    if (obsMostErrorTx) obsPoints.push({ text: `Most error-prone: "${obsMostErrorTx.label}" — ${obsMostErrorTx.error_rate.toFixed(2)}% errors (${obsMostErrorTx.count.toLocaleString()} samples).`, pass: null })
    if (obsPeakThreads > 0) obsPoints.push({ text: `Peak concurrent users (threads): ${obsPeakThreads}.`, pass: null })
    const obsApdexPass = metricsData.apdex.apdex_score >= 0.85
    obsPoints.push({ text: `Apdex ${metricsData.apdex.apdex_score.toFixed(3)}: ${metricsData.apdex.satisfied_pct.toFixed(1)}% satisfied, ${metricsData.apdex.tolerating_pct.toFixed(1)}% tolerating, ${metricsData.apdex.frustrated_pct.toFixed(1)}% frustrated.`, pass: obsApdexPass })
    obsPoints.push({ text: `Test duration: ${metricsData.summary.duration_seconds.toFixed(0)} s — ${metricsData.summary.total_samples.toLocaleString()} total requests.`, pass: null })
    const observationsSectionHTML = `
      <div class="section">
        <h2 class="section-title">🔎 OBSERVATIONS</h2>
        <ul style="list-style:none; padding:0; margin:0; display:grid; gap:8px;">
          ${obsPoints.map(o => {
            const bg = o.pass === true ? '#f0fdf4' : o.pass === false ? '#fef2f2' : '#f8fafc'
            const border = o.pass === true ? '#22c55e' : o.pass === false ? '#ef4444' : '#64748b'
            return `<li style="padding:10px 14px; border-radius:6px; background:${bg}; border-left:3px solid ${border}; font-size:13px; color:#334155;">${o.text}</li>`
          }).join('')}
        </ul>
      </div>
    `

    // --- Advanced Insights Section ---
    const aiPerLabel = metricsData.per_label || []
    const aiPassCount = aiPerLabel.filter((t: any) => t.p95_response_time <= slaP95 && t.error_rate <= slaErrorRate).length
    const aiSlaCompliancePct = aiPerLabel.length > 0 ? Math.round((aiPassCount / aiPerLabel.length) * 100) : 100
    const aiCoeffVar = metricsData.basic_metrics.avg_response_time > 0
      ? metricsData.basic_metrics.std_dev / metricsData.basic_metrics.avg_response_time
      : 0
    const aiPeakThreads = metricsData.time_series?.thread_series?.length
      ? Math.max(...metricsData.time_series.thread_series.map((t: any) => t.active_threads ?? 1))
      : 1
    const aiStabilityScore = Math.max(0, Math.min(100, Math.round(
      100
      - (metricsData.summary.error_rate * 3)
      - (Math.max(0, metricsData.basic_metrics.p95_response_time - slaP95) * 0.01)
      - (aiCoeffVar * 50)
    )))
    const aiThreadEfficiency = aiPeakThreads > 0 ? (metricsData.throughput.requests_per_second / aiPeakThreads).toFixed(2) : '-'
    const aiP95Headroom = slaP95 > 0 ? Math.max(0, (1 - metricsData.basic_metrics.p95_response_time / slaP95) * 100) : -1
    const aiP95HeadroomStr = aiP95Headroom >= 0 ? aiP95Headroom.toFixed(1) + '%' : 'N/A'
    const aiInsights: { sev: string; text: string }[] = []
    if (aiStabilityScore >= 85) aiInsights.push({ sev: 'success', text: `Stability Score ${aiStabilityScore}/100 — performance meets release thresholds.` })
    else if (aiStabilityScore >= 60) aiInsights.push({ sev: 'warning', text: `Stability Score ${aiStabilityScore}/100 — marginal; address highlighted degradation before release.` })
    else aiInsights.push({ sev: 'danger', text: `Stability Score ${aiStabilityScore}/100 — critical performance issues require immediate attention.` })
    if (aiSlaCompliancePct < 100) aiInsights.push({ sev: 'warning', text: `${aiPerLabel.length - aiPassCount} of ${aiPerLabel.length} transactions failing SLA (P95 > ${slaP95} ms or Error > ${slaErrorRate}%).` })
    else aiInsights.push({ sev: 'success', text: `All ${aiPerLabel.length} transactions pass SLA thresholds.` })
    if (aiP95Headroom >= 0) {
      if (aiP95Headroom < 10) aiInsights.push({ sev: 'danger', text: `Only ${aiP95HeadroomStr} P95 headroom to SLA limit — system is near capacity.` })
      else if (aiP95Headroom < 30) aiInsights.push({ sev: 'warning', text: `P95 headroom is ${aiP95HeadroomStr} — monitor closely under higher load.` })
      else aiInsights.push({ sev: 'success', text: `P95 headroom is ${aiP95HeadroomStr} — adequate response time buffer available.` })
    }
    const aiSevColor: Record<string, string> = { success: '#22c55e', warning: '#f59e0b', danger: '#ef4444' }
    const aiSevBg: Record<string, string> = { success: '#f0fdf4', warning: '#fefce8', danger: '#fff1f2' }
    const aiStabBorder = aiStabilityScore >= 85 ? '#22c55e' : aiStabilityScore >= 60 ? '#fbbf24' : '#ef4444'
    const aiStabBg = aiStabilityScore >= 85 ? '#f0fdf4' : aiStabilityScore >= 60 ? '#fefce8' : '#fef2f2'
    const aiCompBorder = aiSlaCompliancePct >= 100 ? '#22c55e' : aiSlaCompliancePct >= 80 ? '#fbbf24' : '#ef4444'
    const aiCompBg = aiSlaCompliancePct >= 100 ? '#f0fdf4' : aiSlaCompliancePct >= 80 ? '#fefce8' : '#fef2f2'
    const aiHrBorder = aiP95Headroom >= 30 ? '#22c55e' : aiP95Headroom >= 10 ? '#fbbf24' : '#ef4444'
    const aiHrBg = aiP95Headroom >= 30 ? '#f0fdf4' : aiP95Headroom >= 10 ? '#fefce8' : '#fef2f2'
    const advancedInsightsSectionHTML = `
      <div class="section">
        <h2 class="section-title">🧠 ADVANCED INSIGHTS</h2>
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; margin-bottom:16px;">
          <div style="padding:14px; border-radius:8px; border:2px solid ${aiStabBorder}; background:${aiStabBg};">
            <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.8px; color:#6b7280; margin-bottom:6px; font-weight:600;">Stability Score</div>
            <div style="font-size:24px; font-weight:bold; color:#1a2332;">${aiStabilityScore}/100</div>
          </div>
          <div style="padding:14px; border-radius:8px; border:2px solid ${aiCompBorder}; background:${aiCompBg};">
            <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.8px; color:#6b7280; margin-bottom:6px; font-weight:600;">SLA Compliance</div>
            <div style="font-size:24px; font-weight:bold; color:#1a2332;">${aiSlaCompliancePct}%</div>
          </div>
          <div style="padding:14px; border-radius:8px; border:2px solid #94a3b8; background:#f8fafc;">
            <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.8px; color:#6b7280; margin-bottom:6px; font-weight:600;">Thread Efficiency</div>
            <div style="font-size:24px; font-weight:bold; color:#1a2332;">${aiThreadEfficiency} req/s/thr</div>
          </div>
          <div style="padding:14px; border-radius:8px; border:2px solid ${aiHrBorder}; background:${aiHrBg};">
            <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.8px; color:#6b7280; margin-bottom:6px; font-weight:600;">P95 Headroom</div>
            <div style="font-size:24px; font-weight:bold; color:#1a2332;">${aiP95HeadroomStr}</div>
          </div>
        </div>
        <ul style="list-style:none; padding:0; margin:0; display:grid; gap:8px;">
          ${aiInsights.map(b => `<li style="padding:10px 14px; border-radius:6px; background:${aiSevBg[b.sev]}; border-left:3px solid ${aiSevColor[b.sev]}; font-size:13px; color:#334155;">${b.text}</li>`).join('')}
        </ul>
      </div>
    `

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Full Performance Report - ${uploadedFilename}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 15px; color: #1a2332; }
    .container { max-width: 1400px; margin: 0 auto; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    header { background: linear-gradient(135deg, #1a2332 0%, #2d3e50 100%); color: #c9a26a; padding: 30px; text-align: center; }
    header h1 { font-size: 32px; margin-bottom: 10px; letter-spacing: 1.5px; }
    header .subtitle { font-size: 14px; color: #e0e0e0; margin-bottom: 8px; }
    header .filename { color: #c9a26a; font-size: 13px; font-weight: bold; }
    .content { padding: 30px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: bold; background: linear-gradient(135deg, #f5f5f5 0%, #e5e7eb 100%); padding: 12px 18px; border-radius: 6px; margin-bottom: 16px; border-left: 4px solid #c9a26a; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 20px; }
    .kpi-box { padding: 16px; border-radius: 8px; border: 2px solid; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s; }
    .kpi-box:hover { transform: translateY(-3px); box-shadow: 0 6px 16px rgba(0,0,0,0.15); }
    .kpi-box.success { border-color: #22c55e; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); }
    .kpi-box.warning { border-color: #fbbf24; background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); }
    .kpi-box.danger { border-color: #ef4444; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); }
    .kpi-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #6b7280; margin-bottom: 6px; font-weight: 600; }
    .kpi-value { font-size: 24px; font-weight: bold; color: #1a2332; }
    .test-info { background: #fafafa; border: 1px solid #c9a26a; border-radius: 6px; padding: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 20px; }
    .test-info-item { font-size: 12px; }
    .test-info-item strong { display: block; color: #6b7280; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; margin-bottom: 3px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .metric-row { display: flex; justify-content: space-between; padding: 12px 14px; background: #fafafa; border-radius: 6px; font-size: 13px; }
    .metric-row.pass { background: #f0fdf4; border-left: 3px solid #22c55e; }
    .metric-row.fail { background: #fef2f2; border-left: 3px solid #ef4444; }
    .metric-label { color: #4b5563; font-weight: 500; }
    .metric-value { font-weight: bold; color: #1a2332; }
    .metric-value.pass { color: #22c55e; }
    .metric-value.fail { color: #ef4444; }
    .apdex-bars { margin: 12px 0; }
    .apdex-bar { margin-bottom: 12px; }
    .apdex-bar-label { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
    .apdex-bar-bg { background: #e5e7eb; border-radius: 8px; height: 22px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); }
    .apdex-bar-fill { height: 100%; transition: width 0.3s; border-radius: 8px 0 0 8px; }
    .apdex-bar-fill.satisfied { background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%); }
    .apdex-bar-fill.tolerating { background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%); }
    .apdex-bar-fill.frustrated { background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%); }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 6px; overflow: hidden; }
    thead { background: linear-gradient(135deg, #1a2332 0%, #2d3e50 100%); color: white; }
    thead th { padding: 12px 12px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    tbody tr { border-bottom: 1px solid #e5e7eb; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody tr:hover { background: #f0f9ff; }
    tbody td { padding: 12px; font-size: 13px; }
    tbody td:first-child { font-weight: 600; color: #1a2332; }
    .error-cell { font-weight: bold; }
    .error-cell.success { color: #22c55e; }
    .error-cell.warning { color: #fbbf24; }
    .error-cell.danger { color: #ef4444; }
    .error-list { list-style: none; }
    .error-item { padding: 12px 14px; background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 6px; margin-bottom: 10px; display: flex; justify-content: space-between; }
    .error-code { font-weight: bold; color: #dc2626; }
    .error-count { color: #6b7280; font-size: 12px; }
    .charts-section { display: grid; grid-template-columns: 1fr; gap: 20px; margin-top: 15px; }
    .chart-container { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .chart-title { font-size: 15px; font-weight: 600; color: #1a2332; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb; }
    @media (min-width: 1200px) { .charts-section { grid-template-columns: repeat(2, 1fr); } }
    footer { background: #f5f5f5; padding: 16px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; }
    footer .brand { color: #c9a26a; font-weight: bold; font-size: 13px; }
    @media print { body { padding: 0; } .container { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📊 COMPREHENSIVE PERFORMANCE REPORT</h1>
      <p class="subtitle">Full Analysis with Interactive Charts & Recommendations</p>
      <p class="filename">${uploadedFilename}</p>
    </header>
    
    <div class="content">
      <!-- EXECUTIVE SUMMARY -->
      <div class="section">
        <h2 class="section-title">📋 EXECUTIVE SUMMARY</h2>
        
        <div class="kpi-grid">
          <div class="kpi-box ${errorStatus}">
            <div class="kpi-label">Error Rate</div>
            <div class="kpi-value">${metricsData.summary.error_rate.toFixed(2)}%</div>
          </div>
          
          <div class="kpi-box ${apdexStatus}">
            <div class="kpi-label">Apdex Score</div>
            <div class="kpi-value">${metricsData.apdex.apdex_score.toFixed(3)}</div>
          </div>
          
          <div class="kpi-box ${p95Status}">
            <div class="kpi-label">P95 Response Time</div>
            <div class="kpi-value">${metricsData.basic_metrics.p95_response_time.toFixed(0)}ms</div>
          </div>
          
          <div class="kpi-box ${throughputStatus}">
            <div class="kpi-label">Throughput</div>
            <div class="kpi-value">${metricsData.throughput.requests_per_second.toFixed(1)}/s</div>
          </div>
          
          <div class="kpi-box success">
            <div class="kpi-label">Total Samples</div>
            <div class="kpi-value">${metricsData.summary.total_samples.toLocaleString()}</div>
          </div>
          
          <div class="kpi-box ${errorStatus === 'success' ? 'success' : 'danger'}">
            <div class="kpi-label">Success Rate</div>
            <div class="kpi-value">${metricsData.errors.success_rate.toFixed(1)}%</div>
          </div>
        </div>
        
        <div class="test-info">
          <div class="test-info-item">
            <strong>Test Period</strong>
            ${new Date(metricsData.summary.start_time).toLocaleString()} — ${new Date(metricsData.summary.end_time).toLocaleString()}
          </div>
          <div class="test-info-item">
            <strong>Duration</strong>
            ${metricsData.summary.duration_seconds.toFixed(2)} seconds
          </div>
          <div class="test-info-item">
            <strong>Unique Transactions</strong>
            ${metricsData.summary.unique_labels}
          </div>
          <div class="test-info-item">
            <strong>Generated</strong>
            ${new Date().toLocaleString()}
          </div>
        </div>
        
        <div class="test-info" style="margin-top: 14px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 3px solid #f59e0b;">
          <div class="test-info-item">
            <strong>SLA: Avg Response</strong>
            ≤ ${slaAvgResponse} ms
          </div>
          <div class="test-info-item">
            <strong>SLA: P90</strong>
            ≤ ${slaP90} ms
          </div>
          <div class="test-info-item">
            <strong>SLA: P95</strong>
            ≤ ${slaP95} ms
          </div>
          <div class="test-info-item">
            <strong>SLA: Error Rate</strong>
            ≤ ${slaErrorRate}%
          </div>
          <div class="test-info-item">
            <strong>SLA: Throughput</strong>
            ≥ ${slaThroughput} req/s
          </div>
        </div>
      </div>

      ${fullRecommendationsSectionHTML}
      ${fullBaselineComparisonSectionHTML}
      ${fullAdvancedErrorAnalysisSectionHTML}
      ${observationsSectionHTML}
      ${advancedInsightsSectionHTML}
      
      <!-- RESPONSE TIME ANALYSIS -->
      <div class="section">
        <h2 class="section-title">⚡ RESPONSE TIME ANALYSIS</h2>
        <div class="metrics-grid">
          <div class="metric-row ${metricsData.basic_metrics.avg_response_time < slaAvgResponse ? 'pass' : 'fail'}">
            <span class="metric-label">Average Response Time (Target: ≤ ${slaAvgResponse}ms)</span>
            <span class="metric-value ${metricsData.basic_metrics.avg_response_time < slaAvgResponse ? 'pass' : 'fail'}">${metricsData.basic_metrics.avg_response_time.toFixed(2)} ms</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Median Response Time</span>
            <span class="metric-value">${metricsData.basic_metrics.median_response_time.toFixed(2)} ms</span>
          </div>
          <div class="metric-row ${metricsData.basic_metrics.p90_response_time < slaP90 ? 'pass' : 'fail'}">
            <span class="metric-label">90th Percentile (P90) (Target: ≤ ${slaP90}ms)</span>
            <span class="metric-value ${metricsData.basic_metrics.p90_response_time < slaP90 ? 'pass' : 'fail'}">${metricsData.basic_metrics.p90_response_time.toFixed(2)} ms</span>
          </div>
          <div class="metric-row ${metricsData.basic_metrics.p95_response_time < slaP95 ? 'pass' : 'fail'}">
            <span class="metric-label">95th Percentile (P95) (Target: ≤ ${slaP95}ms)</span>
            <span class="metric-value ${metricsData.basic_metrics.p95_response_time < slaP95 ? 'pass' : 'fail'}">${metricsData.basic_metrics.p95_response_time.toFixed(2)} ms</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">99th Percentile (P99)</span>
            <span class="metric-value">${metricsData.basic_metrics.p99_response_time.toFixed(2)} ms</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Min / Max Response Time</span>
            <span class="metric-value">${metricsData.basic_metrics.min_response_time.toFixed(2)} / ${metricsData.basic_metrics.max_response_time.toFixed(2)} ms</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Standard Deviation</span>
            <span class="metric-value">${metricsData.basic_metrics.std_dev.toFixed(2)} ms</span>
          </div>
        </div>
      </div>
      
      <!-- USER SATISFACTION (APDEX) -->
      <div class="section">
        <h2 class="section-title">😊 USER SATISFACTION (APDEX)</h2>
        <div class="apdex-bars">
          <div class="apdex-bar">
            <div class="apdex-bar-label">
              <span>Satisfied (< 500ms): ${metricsData.apdex.satisfied.toLocaleString()} requests</span>
              <span><strong>${metricsData.apdex.satisfied_pct.toFixed(1)}%</strong></span>
            </div>
            <div class="apdex-bar-bg">
              <div class="apdex-bar-fill satisfied" style="width: ${metricsData.apdex.satisfied_pct}%"></div>
            </div>
          </div>
          
          <div class="apdex-bar">
            <div class="apdex-bar-label">
              <span>Tolerating (500-2000ms): ${metricsData.apdex.tolerating.toLocaleString()} requests</span>
              <span><strong>${metricsData.apdex.tolerating_pct.toFixed(1)}%</strong></span>
            </div>
            <div class="apdex-bar-bg">
              <div class="apdex-bar-fill tolerating" style="width: ${metricsData.apdex.tolerating_pct}%"></div>
            </div>
          </div>
          
          <div class="apdex-bar">
            <div class="apdex-bar-label">
              <span>Frustrated (> 2000ms): ${metricsData.apdex.frustrated.toLocaleString()} requests</span>
              <span><strong>${metricsData.apdex.frustrated_pct.toFixed(1)}%</strong></span>
            </div>
            <div class="apdex-bar-bg">
              <div class="apdex-bar-fill frustrated" style="width: ${metricsData.apdex.frustrated_pct}%"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- PER-SAMPLER METRICS -->
      <div class="section">
        <h2 class="section-title">🔍 PER-SAMPLER METRICS</h2>
        <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Samples</th>
              <th>Avg (ms)</th>
              <th>Min (ms)</th>
              <th>Max (ms)</th>
              <th>P90 (ms)</th>
              <th>P95 (ms)</th>
              <th>P99 (ms)</th>
              <th>Error %</th>
              <th>Throughput</th>
            </tr>
          </thead>
          <tbody>
            ${metricsData.per_label.map((item: any) => {
              const avgClass = item.avg_response_time <= slaAvgResponse ? 'success' : 'danger'
              const p90Class = item.p90_response_time <= slaP90 ? 'success' : 'danger'
              const p95Class = item.p95_response_time <= slaP95 ? 'success' : 'danger'
              const errClass = item.error_rate < 1 ? 'success' : item.error_rate < 5 ? 'warning' : 'danger'
              const thrValF = Number.isFinite(item.throughput) ? item.throughput : null
              const thrClass = thrValF !== null && thrValF >= slaThroughput ? 'success' : 'warning'
              return `<tr>
                <td>${item.label}</td>
                <td>${item.count.toLocaleString()}</td>
                <td class="error-cell ${avgClass}">${item.avg_response_time.toFixed(0)}</td>
                <td>${item.min_response_time.toFixed(0)}</td>
                <td>${item.max_response_time.toFixed(0)}</td>
                <td class="error-cell ${p90Class}">${item.p90_response_time.toFixed(0)}</td>
                <td class="error-cell ${p95Class}">${item.p95_response_time.toFixed(0)}</td>
                <td>${item.p99_response_time?.toFixed(0) ?? '-'}</td>
                <td class="error-cell ${errClass}">${item.error_rate.toFixed(2)}%</td>
                <td class="error-cell ${thrClass}">${thrValF !== null ? thrValF.toFixed(2) + '/s' : '-'}</td>
              </tr>`
            }).join('')}
          </tbody>
        </table>
        </div>
      </div>
      
      ${metricsData.summary.failed > 0 && metricsData.errors.error_breakdown ? `
      <!-- ERROR BREAKDOWN -->
      <div class="section">
        <h2 class="section-title">❌ ERROR BREAKDOWN</h2>
        <ul class="error-list">
          ${Object.entries(metricsData.errors.error_breakdown).map(([code, count]) => `
          <li class="error-item">
            <span class="error-code">✗ ${code}</span>
            <span class="error-count">${count} occurrences</span>
          </li>
          `).join('')}
        </ul>
      </div>
      ` : ''}
      
      ${hasCharts ? `
      <!-- PERFORMANCE CHARTS (CAPTURED FROM LIVE DASHBOARD) -->
      <div class="section">
        <h2 class="section-title">📈 PERFORMANCE CHARTS</h2>
        <div style="padding:12px; background:linear-gradient(135deg,#e0f2fe 0%,#bae6fd 100%); border-radius:6px; margin-bottom:18px; font-size:12px; border-left:4px solid #0284c7;">
          <strong>📸 Charts captured directly from the live dashboard</strong> — identical visuals to the desktop app.
        </div>
        <div class="charts-section">
          ${[
            { key: 'response-time',      title: 'Response Time by Transaction' },
            { key: 'throughput',         title: 'Throughput' },
            { key: 'active-threads',     title: 'Active Threads' },
            { key: 'error-rate',         title: 'Error Rate & Count' },
            { key: 'error-distribution', title: 'Error Distribution by Transaction' },
            { key: 'histogram',          title: 'Response Time Distribution (Histogram)' },
            { key: 'latency-breakdown',  title: 'Latency Breakdown by Transaction' },
            { key: 'percentiles',        title: 'Response Time Percentiles Over Time' },
            { key: 'combined-analysis',  title: 'Combined Analysis - All Transactions' },
          ].map(({ key, title }) => capturedCharts[key]
            ? `<div class="chart-container"><h3 class="chart-title">${title}</h3><img src="${capturedCharts[key]}" style="width:100%;height:auto;display:block;" alt="${title}" /></div>`
            : ''
          ).join('')}
        </div>
      </div>
      ` : `
      <div class="section">
        <h2 class="section-title">📈 PERFORMANCE CHARTS</h2>
        <div style="padding:14px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:6px;color:#475569;font-size:13px;">
          Charts were not visible in the dashboard when this report was generated. Scroll down to the charts section in the app and re-export.
        </div>
      </div>
      `}
    </div>
    
    <footer>
      <div>Generated by <span class="brand">Performance Dashboard</span> - Full Report with Advanced Analytics</div>
      <div style="margin-top: 6px;">${new Date().toLocaleString()}</div>
      <div style="margin-top: 6px; font-size: 10px;">© ${new Date().getFullYear()} Deloitte Consulting LLP. All rights reserved.</div>
    </footer>
  </div>
  
</body>
</html>`

    // Create and download HTML file
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = uploadedFilename.replace(/\.[^/.]+$/, '') + '_full_report.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setMessage('Full HTML report exported successfully! Charts are captured from the live dashboard.')
    setMessageType('success')
    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 3000)
  }
  const calculateAutoInterval = (duration: number): number => {
    // duration in seconds
    // Returns interval in seconds
    if (duration < 10) return 0.1        // < 10s: 100ms bins
    if (duration < 60) return 0.5        // < 1min: 500ms bins
    if (duration < 300) return 1         // < 5min: 1s bins
    if (duration < 1800) return 5        // < 30min: 5s bins
    if (duration < 3600) return 10       // < 1hr: 10s bins
    return 30                            // >= 1hr: 30s bins
  }

  const getIntervalValue = (): number => {
    if (timeInterval === 'auto') {
      // Calculate duration from metricsData if available
      if (metricsData?.basic_metrics) {
        const duration = metricsData.basic_metrics.total_samples 
          ? (metricsData.basic_metrics.max_response_time / 1000) 
          : 60 // Default to 60s if can't determine
        return calculateAutoInterval(duration)
      }
      return 1 // Default fallback
    }
    return parseFloat(timeInterval)
  }

  const handleFileSelect = async (file: File) => {
    setIsUploading(true)
    setUploadMessage('Uploading and parsing file...')
    setUploadMessageType('success')
    setMetricsData(null) // Clear previous metrics
    setSelectedSampler('all') // Reset sampler filter

    const formData = new FormData()
    formData.append('file', file)
    // Add interval parameter
    formData.append('interval', getIntervalValue().toString())

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        if (data.metrics) {
          setMetricsData(data.metrics)
          setUploadedFilename(file.name)
          setUploadedFile(file)
          setUploadMessage(`File parsed successfully: ${file.name}`)
        } else {
          setUploadMessage(`File uploaded: ${file.name} (no metrics available)`)
        }
        setUploadMessageType('success')
      } else {
        setUploadMessage(`Upload failed: ${data.error || 'Unknown error'}`)
        setUploadMessageType('error')
      }
    } catch (error) {
      setUploadMessage(`Upload failed: ${error instanceof Error ? error.message : 'Network error'}`)
      setUploadMessageType('error')
    } finally {
      setIsUploading(false)
      // Auto-hide message after 5 seconds
      setTimeout(() => {
        setUploadMessage('')
        setUploadMessageType('')
      }, 5000)
    }
  }

  useEffect(() => {
    checkBackend()
  }, [])

  // Re-fetch data when time interval changes
  useEffect(() => {
    const refetchWithNewInterval = async () => {
      if (!uploadedFile || !metricsData) return

      // Re-send the file with the new interval — fully stateless, works on Vercel
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('interval', getIntervalValue().toString())

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (response.ok && data.metrics) {
          setMetricsData(data.metrics)
          setMessage(`Charts updated with ${getIntervalValue()}s intervals`)
          setMessageType('success')
          setTimeout(() => {
            setMessage('')
            setMessageType('')
          }, 2000)
        }
      } catch (error) {
        console.error('Failed to refetch with new interval:', error)
      }
    }

    // Only refetch if we already have data loaded
    if (uploadedFile && metricsData) {
      refetchWithNewInterval()
    }
  }, [timeInterval]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="App">
      {/* Header Bar */}
      <header className="App-header">
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <div className="header-content">
          <h1>Performance Dashboard</h1>
          <div className="header-status">
            {backendStatus !== 'Checking...' && (
              <span className={`status-badge ${backendStatus.toLowerCase().replace(/[^a-z]/g, '')}`}>
                Backend: {backendStatus}
              </span>
            )}
            <button onClick={checkBackend} disabled={isRefreshing} className="refresh-btn">
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button 
              onClick={exportToQuickHTML} 
              disabled={!metricsData} 
              className="export-btn"
              title="Export Quick HTML Report"
            >
              Quick HTML Report
            </button>
            <button 
              onClick={exportToFullHTML} 
              disabled={!metricsData} 
              className="export-btn"
              title="Export Full HTML Report with Interactive Charts"
            >
              Full HTML Report
            </button>
          </div>
        </div>
      </header>

      {/* Split Layout */}
      <div className="dashboard-container">
        {/* Left Sidebar */}
        <aside className="sidebar">
          {/* File Upload Section */}
          <section className="sidebar-section">
            <h3 className="sidebar-title">Upload Test Results</h3>
            <FileUpload onFileSelect={handleFileSelect} />
            {isUploading && (
              <div className="upload-progress">
                <div className="spinner"></div>
                <p>Uploading...</p>
              </div>
            )}
            {uploadMessage && (
              <div className={`upload-message ${uploadMessageType}`}>
                {uploadMessage}
              </div>
            )}
          </section>

          {/* Loaded Files Section */}
          {uploadedFilename && (
            <section className="sidebar-section">
              <h3 className="sidebar-title">Loaded Files</h3>
              <div className="loaded-file-item">
                <div className="file-info">
                  <span className="file-name">{uploadedFilename}</span>
                  <button className="clear-file-btn" onClick={handleClearMetrics} title="Remove file">
                    ×
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Sampler Filter Section */}
          {metricsData && metricsData.per_label && metricsData.per_label.length > 0 && (
            <section className="sidebar-section">
              <h3 className="sidebar-title">Sampler Filter</h3>
              <select 
                className="sampler-select"
                value={selectedSampler}
                onChange={(e) => setSelectedSampler(e.target.value)}
              >
                <option value="all">All Samplers</option>
                {metricsData.per_label.map((item: any, index: number) => (
                  <option key={index} value={item.label}>
                    {item.label}
                  </option>
                ))}
              </select>
            </section>
          )}

          {/* Time Interval Section */}
          {metricsData && (
            <section className="sidebar-section">
              <h3 className="sidebar-title">Time Granularity</h3>
              <div className="control-group">
                <label>Chart Interval</label>
                <select 
                  value={timeInterval} 
                  onChange={(e) => setTimeInterval(e.target.value)}
                  className="sampler-select"
                  title="Time interval for chart data aggregation"
                >
                  <option value="auto">Auto (Smart Detection)</option>
                  <option value="0.1">100 milliseconds</option>
                  <option value="0.25">250 milliseconds</option>
                  <option value="0.5">500 milliseconds</option>
                  <option value="1">1 second</option>
                  <option value="5">5 seconds</option>
                  <option value="10">10 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="60">1 minute</option>
                </select>
                {timeInterval === 'auto' && (
                  <small style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
                    Currently: {getIntervalValue()}s intervals
                  </small>
                )}
              </div>
            </section>
          )}

          {/* SLA Thresholds Section */}
          <section className="sidebar-section">
            <h3 className="sidebar-title">SLA Thresholds</h3>
            <div className="sla-controls">
              <div className="control-group">
                <label>Avg Response Time (max)</label>
                <div className="input-with-unit">
                  <input 
                    type="number" 
                    value={slaAvgResponse} 
                    onChange={(e) => setSlaAvgResponse(Number(e.target.value))} 
                    min="0" 
                  />
                  <span className="unit">ms</span>
                </div>
              </div>
              <div className="control-group">
                <label>90th Percentile (max)</label>
                <div className="input-with-unit">
                  <input 
                    type="number" 
                    value={slaP90} 
                    onChange={(e) => setSlaP90(Number(e.target.value))} 
                    min="0" 
                  />
                  <span className="unit">ms</span>
                </div>
              </div>
              <div className="control-group">
                <label>95th Percentile (max)</label>
                <div className="input-with-unit">
                  <input 
                    type="number" 
                    value={slaP95} 
                    onChange={(e) => setSlaP95(Number(e.target.value))} 
                    min="0" 
                  />
                  <span className="unit">ms</span>
                </div>
              </div>
              <div className="control-group">
                <label>Error Rate (max)</label>
                <div className="input-with-unit">
                  <input 
                    type="number" 
                    value={slaErrorRate} 
                    onChange={(e) => setSlaErrorRate(Number(e.target.value))} 
                    min="0" 
                    max="100" 
                    step="0.1" 
                  />
                  <span className="unit">%</span>
                </div>
              </div>
              <div className="control-group">
                <label>Throughput (min)</label>
                <div className="input-with-unit">
                  <input 
                    type="number" 
                    value={slaThroughput} 
                    onChange={(e) => setSlaThroughput(Number(e.target.value))} 
                    min="0" 
                  />
                  <span className="unit">req/s</span>
                </div>
              </div>
            </div>
          </section>

          {/* Baseline Section */}
          <section className="sidebar-section">
            <h3 className="sidebar-title">Baseline</h3>
            {/* Hidden file input for loading/replacing baseline */}
            <input
              type="file"
              accept=".json"
              ref={baselineFileInputRef}
              style={{ opacity: 0, position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
              onChange={handleLoadBaselineFromFile}
            />
            {/* Hidden file input for loading a second JSON as the comparison (current) run */}
            <input
              type="file"
              accept=".json"
              ref={comparisonFileInputRef}
              style={{ opacity: 0, position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
              onChange={handleLoadComparisonFromFile}
            />
            {baselineData ? (
              <div className="baseline-info">
                <div className="baseline-status">
                  <span className="baseline-label">Current Baseline:</span>
                  <span className="baseline-filename">{baselineFilename}</span>
                </div>
                <div className="baseline-actions" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                  <button className="save-baseline-btn" onClick={handleExportBaseline}>
                    Export Baseline (.json)
                  </button>
                  <button
                    className="save-baseline-btn"
                    onClick={() => comparisonFileInputRef.current?.click()}
                    title="Load a second JSON to compare against the baseline"
                  >
                    Compare with JSON...
                  </button>
                  <button className="reset-baseline-btn" onClick={() => baselineFileInputRef.current?.click()}>
                    Replace Baseline
                  </button>
                  <button className="reset-baseline-btn" onClick={handleResetBaseline}>
                    Clear Baseline
                  </button>
                </div>
              </div>
            ) : (
              <div className="baseline-empty">
                <p>No baseline set. Save the current run as a baseline to compare future runs.</p>
                {metricsData && (
                  <button className="save-baseline-btn" onClick={handleSaveBaseline}>
                    Save as Baseline
                  </button>
                )}
                <button
                  className="reset-baseline-btn"
                  style={{ marginTop: '6px', width: '100%' }}
                  onClick={() => baselineFileInputRef.current?.click()}
                >
                  Load from File (.json)
                </button>
              </div>
            )}
          </section>

          {/* Display Options */}
          <section className="sidebar-section">
            <h3 className="sidebar-title">Display Options</h3>
            <div className="display-options">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={showCharts}
                  onChange={(e) => setShowCharts(e.target.checked)}
                />
                <span>Show Charts</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span>Show Percentiles</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span>Highlight Anomalies</span>
              </label>
            </div>
          </section>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          {message && (
            <div className={`status-message ${messageType}`}>
              {message}
            </div>
          )}

          {metricsData ? (
            <>
              {/* Live Baseline Comparison — shown at top so it's immediately visible */}
              {baselineData && (() => {
                const toNum = (v: any): number | null => typeof v === 'number' && Number.isFinite(v) ? v : null
                const rows = [
                  { label: 'Error Rate',        cur: toNum(metricsData.summary?.error_rate),              base: toNum(baselineData.summary?.error_rate),              unit: '%',      lowerIsBetter: true,  decimals: 2 },
                  { label: 'Avg Response Time', cur: toNum(metricsData.basic_metrics?.avg_response_time), base: toNum(baselineData.basic_metrics?.avg_response_time), unit: ' ms',    lowerIsBetter: true,  decimals: 0 },
                  { label: 'P95 Response Time', cur: toNum(metricsData.basic_metrics?.p95_response_time), base: toNum(baselineData.basic_metrics?.p95_response_time), unit: ' ms',    lowerIsBetter: true,  decimals: 0 },
                  { label: 'Throughput',        cur: toNum(metricsData.throughput?.requests_per_second),  base: toNum(baselineData.throughput?.requests_per_second),  unit: ' req/s', lowerIsBetter: false, decimals: 1 },
                  { label: 'Apdex Score',       cur: toNum(metricsData.apdex?.apdex_score),               base: toNum(baselineData.apdex?.apdex_score),               unit: '',       lowerIsBetter: false, decimals: 3 },
                ].filter(r => r.cur !== null && r.base !== null) as { label: string; cur: number; base: number; unit: string; lowerIsBetter: boolean; decimals: number }[]
                return (
                  <div style={{ background: 'var(--bg-card, #ffffff)', border: '2px solid var(--accent-primary, #c9a26a)', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #1a2332)', margin: 0 }}>📊 Baseline Comparison</h2>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary, #6b7280)' }}>vs. <strong>{baselineFilename}</strong></span>
                    </div>
                    {rows.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary, #6b7280)', fontSize: '13px' }}>Baseline fields did not match current data structure.</p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <thead>
                            <tr style={{ background: 'var(--bg-header)', color: 'var(--text-header, white)' }}>
                              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Metric</th>
                              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>Baseline</th>
                              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>Current</th>
                              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>Δ Change</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row, i) => {
                              const deltaPct = row.base === 0 ? 0 : ((row.cur - row.base) / row.base) * 100
                              const isUnchanged = row.cur === row.base
                              const improved = !isUnchanged && (row.lowerIsBetter ? row.cur < row.base : row.cur > row.base)
                              const deltaSign = deltaPct > 0 ? '+' : ''
                              const statusColor = isUnchanged ? 'var(--text-secondary, #6b7280)' : improved ? '#22c55e' : '#ef4444'
                              const statusBg   = isUnchanged ? 'rgba(107,114,128,0.15)' : improved ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'
                              const statusLabel = isUnchanged ? '= No Change' : improved ? '▲ Improved' : '▼ Regressed'
                              return (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-light, #e5e7eb)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-tertiary, #f9fafb)' }}>
                                  <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary, #1a2332)' }}>{row.label}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary, #6b7280)' }}>{row.base.toFixed(row.decimals)}{row.unit}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary, #3d3d3d)' }}>{row.cur.toFixed(row.decimals)}{row.unit}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: statusColor }}>{deltaSign}{deltaPct.toFixed(2)}%</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                    <span style={{ background: statusBg, color: statusColor, padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, border: `1px solid ${statusColor}` }}>
                                      {statusLabel}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })()}

              <MetricsDisplay 
                data={metricsData} 
                filename={uploadedFilename}
                selectedSampler={selectedSampler}
              />

              {/* Charts Section */}
              {showCharts && metricsData.time_series && (
                <div className="charts-container">
                  <h2 className="charts-header">📈 Performance Charts</h2>
                  
                  <div className="chart-grid">
                    <div data-chart="response-time">
                      <ResponseTimeChart data={metricsData.time_series.response_time_series} />
                    </div>
                    
                    <div data-chart="throughput">
                      <ThroughputChart 
                        throughputData={metricsData.time_series.throughput_series}
                      />
                    </div>
                    
                    <div data-chart="active-threads">
                      <ActiveThreadsChart data={metricsData.time_series.thread_series} />
                    </div>
                    
                    <div data-chart="error-rate">
                      <ErrorRateChart data={metricsData.time_series.error_series} />
                    </div>
                    
                    {/* Error Analysis Section */}
                    {metricsData.errors && metricsData.errors.error_breakdown && 
                     Object.keys(metricsData.errors.error_breakdown).length > 0 && (
                      <div data-chart="error-analysis" className="chart-full-width">
                        <ErrorAnalysis 
                          errorBreakdown={metricsData.errors.error_breakdown}
                          perLabelData={metricsData.per_label || []}
                          totalRequests={metricsData.summary.total_samples}
                        />
                      </div>
                    )}
                    
                    {/* Phase 2: Test Success Rate (Pie Chart) */}
                    {metricsData.per_label && (
                      <div data-chart="error-distribution">
                        <ErrorDistributionChart data={metricsData.per_label} />
                      </div>
                    )}
                    
                    {/* Phase 1 Charts */}
                    {metricsData.histogram && (
                      <div data-chart="histogram">
                        <ResponseTimeHistogram data={metricsData.histogram} />
                      </div>
                    )}
                    
                    {metricsData.latency_breakdown && (
                      <div data-chart="latency-breakdown">
                        <LatencyBreakdownChart data={metricsData.latency_breakdown} />
                      </div>
                    )}
                    
                    {metricsData.percentiles_over_time && (
                      <div data-chart="percentiles">
                        <PercentilesChart data={metricsData.percentiles_over_time} />
                      </div>
                    )}
                    
                    <div data-chart="combined-analysis" className="chart-full-width">
                      <CombinedAnalysisChart 
                        data={metricsData.time_series.response_time_series} 
                        threadsData={metricsData.time_series.thread_series}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <Recommendations
                metricsData={metricsData}
                slaErrorRate={slaErrorRate}
                slaP95={slaP95}
                slaP90={slaP90}
                slaThroughput={slaThroughput}
                slaAvgResponse={slaAvgResponse}
              />

              {/* Observations */}
              <Observations
                metricsData={metricsData}
                slaErrorRate={slaErrorRate}
                slaP95={slaP95}
                slaP90={slaP90}
                slaThroughput={slaThroughput}
                slaAvgResponse={slaAvgResponse}
              />

              {/* Advanced Analysis */}
              <AdvancedAnalysis metricsData={metricsData} />

              {/* Advanced Insights */}
              <AdvancedInsights
                metricsData={metricsData}
                slaErrorRate={slaErrorRate}
                slaP95={slaP95}
                slaP90={slaP90}
                slaThroughput={slaThroughput}
                slaAvgResponse={slaAvgResponse}
              />

              {/* Per-Sampler Metrics — LAST */}
              <PerSamplerMetrics
                metricsData={metricsData}
                slaErrorRate={slaErrorRate}
                slaP95={slaP95}
                slaP90={slaP90}
                slaThroughput={slaThroughput}
                slaAvgResponse={slaAvgResponse}
              />
            </>
          ) : (
            <>
              {/* Baseline preview when no test file is loaded yet */}
              {baselineData && (() => {
                const toNum = (v: any): number | null => typeof v === 'number' && Number.isFinite(v) ? v : null
                const bm = baselineData.basic_metrics
                const bs = baselineData.summary
                const bt = baselineData.throughput
                const ba = baselineData.apdex
                const kpis = [
                  { label: 'Error Rate',        value: toNum(bs?.error_rate),              unit: '%',      fmt: (n: number) => n.toFixed(2) },
                  { label: 'Avg Response Time', value: toNum(bm?.avg_response_time),        unit: ' ms',    fmt: (n: number) => n.toFixed(0) },
                  { label: 'P95 Response Time', value: toNum(bm?.p95_response_time),        unit: ' ms',    fmt: (n: number) => n.toFixed(0) },
                  { label: 'Throughput',        value: toNum(bt?.requests_per_second),      unit: ' req/s', fmt: (n: number) => n.toFixed(1) },
                  { label: 'Apdex Score',       value: toNum(ba?.apdex_score),              unit: '',       fmt: (n: number) => n.toFixed(3) },
                  { label: 'Total Samples',     value: toNum(bs?.total_samples),            unit: '',       fmt: (n: number) => n.toLocaleString() },
                ].filter(k => k.value !== null) as { label: string; value: number; unit: string; fmt: (n: number) => string }[]
                return (
                  <div style={{ background: 'var(--card-bg, white)', border: '2px solid #c9a26a', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary, #1a2332)', margin: 0 }}>📋 Baseline Loaded</h2>
                      <span style={{ fontSize: '12px', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '12px', padding: '3px 10px', color: '#92400e', fontWeight: 600 }}>{baselineFilename}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>Key metrics from the saved baseline run. Upload a test file to compare against it.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                      {kpis.map((k, i) => (
                        <div key={i} style={{ background: 'var(--bg-secondary, #f9fafb)', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px' }}>
                          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.7px', color: '#6b7280', fontWeight: 600, marginBottom: '6px' }}>{k.label}</div>
                          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary, #1a2332)' }}>{k.fmt(k.value)}<span style={{ fontSize: '13px', fontWeight: 400, color: '#6b7280' }}>{k.unit}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <h2>{baselineData ? 'Upload Test File to Compare' : 'No Data Loaded'}</h2>
                <p>{baselineData ? 'Upload a JTL/CSV result file to run a live comparison against the loaded baseline.' : 'Upload a performance test result file to begin analysis'}</p>
                <div className="supported-formats">
                  <strong>Supported formats:</strong> JTL, CSV, JSON, LOG
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default App