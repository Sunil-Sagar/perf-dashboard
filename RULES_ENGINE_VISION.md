# Rules Engine Vision — Performance Dashboard
## Deferred Feature: AI-Like Rule-Based Analysis from `.txt` File

**Status**: PLANNED — Build after Phase 4 is complete  
**Created**: February 26, 2026  
**Owner**: TBD

---

## 1. Vision Summary

Build a deterministic, rule-based analysis engine that reads a user-defined `rules.txt` file
alongside the uploaded JTL file. The engine evaluates conditions against computed JTL metrics,
substitutes SLA threshold placeholders with live values, and outputs structured:

- **Observations** (what the data shows)
- **Recommendations** (what to do about it)
- **Severity classification** (critical / warning / info)

No AI API. No cloud dependency. The `rules.txt` file IS the intelligence.
The script is the executor.

---

## 2. How It Works — End-to-End Flow

```
Step 1: User sets SLA Thresholds in the app UI
        (error_rate, P95, P90, throughput, avg_response)
        ↓
Step 2: User places rules.txt in the same folder as their JTL file
        (rules.txt uses {sla_*} and {metric_*} placeholders)
        ↓
Step 3: User uploads JTL → backend computes all metrics
        ↓
Step 4: Rule Engine reads rules.txt
        → substitutes {sla_error_rate} with actual SLA value
        → substitutes {error_rate} with computed metric value
        → evaluates each CONDITION (>, <, >=, <=, ==)
        ↓
Step 5: Matching rules fire their OBSERVATION + RECOMMENDATION
        ↓
Step 6: Output renders in:
        - Live Dashboard (new "Analysis" panel)
        - Quick HTML Report
        - Full HTML Report
```

---

## 3. rules.txt — File Format (Structured Blocks)

Recommended format: **YAML-like key-value blocks**, one rule per block, separated by blank lines.
Easy to read in Notepad, easy to parse in Python/JS, zero ambiguity.

### Format Specification

```
RULE: <unique_rule_id>
CONDITION: <metric> <operator> <threshold_placeholder_or_value>
SEVERITY: critical | warning | info
OBSERVATION: <message with {placeholders}>
RECOMMENDATION: <action text with {placeholders}>
```

### Placeholder Types

| Placeholder | Source | Example |
|---|---|---|
| `{sla_error_rate}` | SLA Threshold set in app UI | `5` |
| `{sla_p95}` | SLA Threshold set in app UI | `3000` |
| `{sla_p90}` | SLA Threshold set in app UI | `2000` |
| `{sla_throughput}` | SLA Threshold set in app UI | `100` |
| `{sla_avg_response}` | SLA Threshold set in app UI | `1500` |
| `{error_rate}` | Computed from JTL | `7.3` |
| `{p95}` | Computed from JTL | `4200` |
| `{p90}` | Computed from JTL | `3100` |
| `{throughput}` | Computed from JTL | `87.4` |
| `{avg_response}` | Computed from JTL | `1820` |
| `{total_samples}` | Computed from JTL | `10000` |
| `{total_errors}` | Computed from JTL | `730` |
| `{top_error_code}` | Computed from JTL | `500` |
| `{top_failing_transaction}` | Computed from JTL | `POST /api/checkout` |
| `{baseline_p95}` | Loaded baseline file | `2800` |
| `{baseline_throughput}` | Loaded baseline file | `110` |

---

## 4. Sample rules.txt File

```
RULE: high_error_rate
CONDITION: error_rate > {sla_error_rate}
SEVERITY: critical
OBSERVATION: Error rate ({error_rate}%) has breached the SLA threshold of {sla_error_rate}%. {total_errors} out of {total_samples} requests failed. Most frequent error: HTTP {top_error_code}.
RECOMMENDATION: Investigate server-side logs for {top_error_code} errors immediately. Review application exception handling. Check infrastructure health dashboards. The transaction with the most failures was: {top_failing_transaction}.

RULE: p95_breach
CONDITION: p95 > {sla_p95}
SEVERITY: critical
OBSERVATION: 95th percentile response time ({p95}ms) has exceeded the agreed SLA of {sla_p95}ms. Users in the top 5% slowest requests are experiencing severely degraded performance.
RECOMMENDATION: Profile the slowest transactions. Review database query execution plans. Check connection pool sizing and cache hit ratios. Compare with baseline P95 of {baseline_p95}ms.

RULE: p90_breach
CONDITION: p90 > {sla_p90}
SEVERITY: warning
OBSERVATION: 90th percentile response time ({p90}ms) exceeded the SLA of {sla_p90}ms. This affects a significant portion of your user base.
RECOMMENDATION: Identify transactions contributing to the P90 spike. Consider horizontal scaling or query optimization.

RULE: throughput_below_target
CONDITION: throughput < {sla_throughput}
SEVERITY: warning
OBSERVATION: Throughput ({throughput} req/s) fell below the SLA minimum of {sla_throughput} req/s. The system could not sustain required load.
RECOMMENDATION: Check for thread contention, connection pool exhaustion, or GC pauses. Compare against baseline throughput of {baseline_throughput} req/s.

RULE: avg_response_breach
CONDITION: avg_response > {sla_avg_response}
SEVERITY: warning
OBSERVATION: Average response time ({avg_response}ms) exceeded the SLA of {sla_avg_response}ms. General user experience is degraded.
RECOMMENDATION: Review application profiling data. Look for N+1 query patterns, synchronous blocking calls, and unoptimized API endpoints.

RULE: throughput_regression_vs_baseline
CONDITION: throughput < baseline_throughput * 0.80
SEVERITY: warning
OBSERVATION: Throughput has regressed by more than 20% compared to the baseline run ({baseline_throughput} req/s → {throughput} req/s).
RECOMMENDATION: Review recent code deployments and infrastructure changes. Run a bisect test to isolate the regression.

RULE: all_green
CONDITION: error_rate <= {sla_error_rate} AND p95 <= {sla_p95} AND throughput >= {sla_throughput}
SEVERITY: info
OBSERVATION: All key SLA metrics are within acceptable thresholds. System is performing as expected under the tested load.
RECOMMENDATION: No immediate action required. Continue monitoring trends across multiple runs to detect gradual degradation.
```

---

## 5. Rule Engine Logic (Python Pseudo-code)

```python
def evaluate_rules(rules_txt_path, metrics, sla_thresholds):
    rules = parse_rules(rules_txt_path)           # parse blocks from txt
    placeholders = {**sla_thresholds, **metrics}  # merge both sources
    fired_rules = []

    for rule in rules:
        condition = rule['CONDITION']
        # substitute placeholders: "error_rate > {sla_error_rate}" → "7.3 > 5"
        evaluated = substitute_placeholders(condition, placeholders)
        if eval_condition(evaluated):             # safe eval: only >, <, >=, <=, ==, AND, OR
            observation = substitute_placeholders(rule['OBSERVATION'], placeholders)
            recommendation = substitute_placeholders(rule['RECOMMENDATION'], placeholders)
            fired_rules.append({
                'rule_id': rule['RULE'],
                'severity': rule['SEVERITY'],
                'observation': observation,
                'recommendation': recommendation
            })

    return fired_rules  # sorted by severity: critical → warning → info
```

---

## 6. Where rules.txt Lives

- **Per-project**: `rules.txt` sits in the same folder as the JTL file
- **Fallback**: If no `rules.txt` is found in JTL folder, load a `default_rules.txt` from the app's config directory
- **Discovery**: Backend detects `rules.txt` in the JTL directory automatically — no separate "Load Rules File" button needed

---

## 7. Output Rendering

| Location | What is shown |
|---|---|
| Live Dashboard | New "📋 Analysis & Recommendations" panel — cards per fired rule, color-coded by severity |
| Quick HTML Report | New section below Executive Summary — list of fired rules |
| Full HTML Report | Enhanced section with severity badges, full observation + recommendation text |

---

## 8. Open Questions — Answer These Before Building

### Q1: rules.txt Discovery
- When the JTL is uploaded via the app, does the backend receive the file path or just the file content (as multipart upload)?
- **Impact**: If only content, we cannot auto-discover `rules.txt` from the same folder. We would need either a second file upload input OR a configured default path.

### Q2: Default rules.txt Ownership
- Should the app ship with a **default `rules.txt`** template that the user copies and customizes per project?
- Or should the first run prompt the user to create one?

### Q3: rules.txt Encoding
- Should rules be in pure `.txt` or is `.yaml` acceptable for the user?
- Pure `.txt` with the KEY: VALUE block format is more "Notepad-friendly" for non-devs.

### Q4: Condition Complexity
- Do we need support for **AND / OR** compound conditions?
  - Example: `CONDITION: error_rate > {sla_error_rate} AND p95 > {sla_p95}` (both must be true)
  - This is more powerful but adds parser complexity.
- Or keep it **single condition per rule** only?

### Q5: Baseline Dependency
- Rules referencing `{baseline_*}` placeholders — what happens if no baseline is loaded?
  - Skip the rule? Show a "No baseline loaded" warning? Use zero as fallback?

### Q6: Rule Priority / Conflict
- If both `high_error_rate` AND `all_green` fire (unlikely but edge case) — how do we handle contradictions?
- Suggestion: Mutual exclusion logic for `info` rules (only fire `all_green` if NO critical/warning rules fired).

### Q7: User-Editable from Inside App
- Should there be an in-app editor (textarea in a modal) to view and edit `rules.txt` content without leaving the tool?
- Or is external Notepad editing sufficient?

### Q8: Versioning
- Should `rules.txt` include a version header so the engine can warn if an old format is loaded?
  - Example: `VERSION: 1.0` at top of file.

### Q9: HTML Export Scope
- Phase 3 Full HTML already has a hardcoded recommendations section (built in App.tsx).
- When rules engine is added, should it **replace** that hardcoded section or **append** to it?

### Q10: Error Handling in Rules
- What should happen when a `rules.txt` has a malformed rule (missing CONDITION, typo in key)?
  - Skip and continue? Show a validation warning in the UI?

---

## 9. Suggested Build Order (When Ready)

1. **Backend**: `rule_engine.py` — parser + evaluator + placeholder substitution
2. **Backend**: New Flask endpoint `POST /api/analyze-rules` — receives `rules_txt_content` + `metrics` + `sla_thresholds`, returns fired rules JSON
3. **Frontend**: Load `rules.txt` via file input OR auto-detect from JTL path
4. **Frontend**: Call `/api/analyze-rules` after JTL metrics load
5. **Frontend**: New `AnalysisRecommendations.tsx` component — renders fired rules as severity cards
6. **Frontend**: Inject fired rules into Quick HTML + Full HTML export templates
7. **Testing**: Unit tests for `rule_engine.py` covering: all operators, AND/OR, placeholder substitution, malformed rules, missing baseline, all-green rule

---

## 10. Files to Create (When Building)

| File | Purpose |
|---|---|
| `backend/rule_engine.py` | Parser + evaluator |
| `backend/app.py` | New `/api/analyze-rules` endpoint |
| `frontend/src/components/AnalysisRecommendations.tsx` | Dashboard panel for fired rules |
| `frontend/public/default_rules.txt` | Shipped default rules template |
| `rules.txt` | Per-project rules file (user creates alongside JTL) |

---

*Document Status: OPEN — Pending answers to Q1–Q10 before implementation begins.*
