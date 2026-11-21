/**
 * Print-safe horizontal bar chart (plain HTML + CSS) for the PDF / print reports
 * that are generated as HTML strings and opened in a new window.
 */
export interface PrintBarRow {
  label: string;
  value: number;
}

const esc = (s: string) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

export function htmlBarChart(title: string, rows: PrintBarRow[], formatter: (n: number) => string = n => n.toLocaleString(), color = '#2a78d6'): string {
  const clean = rows.filter(r => Number(r.value) > 0);
  if (clean.length === 0) {
    return `<div class="dc-chart"><div class="dc-chart-title">${esc(title)}</div><div class="dc-chart-empty">No data for this period.</div></div>`;
  }
  const max = Math.max(...clean.map(r => r.value));
  const bars = clean
    .map(r => {
      const pct = max > 0 ? Math.max(1.5, (r.value / max) * 100) : 0;
      return `<div class="dc-bar-row">
        <div class="dc-bar-label">${esc(r.label)}</div>
        <div class="dc-bar-track"><div class="dc-bar-fill" style="width:${pct.toFixed(1)}%;background:${color};"></div></div>
        <div class="dc-bar-value">${esc(formatter(r.value))}</div>
      </div>`;
    })
    .join('');
  return `<div class="dc-chart"><div class="dc-chart-title">${esc(title)}</div>${bars}</div>`;
}

/** Styles to drop into the <style> block of any generated report */
export const PRINT_CHART_CSS = `
  .dc-chart { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin: 0 0 20px 0; break-inside: avoid; }
  .dc-chart-title { font-size: 8pt; font-weight: 800; text-transform: uppercase; letter-spacing: .4px; color: #334155; margin-bottom: 8px; }
  .dc-chart-empty { font-size: 8pt; color: #94a3b8; }
  .dc-bar-row { display: grid; grid-template-columns: 30% 1fr 22%; align-items: center; gap: 8px; margin: 4px 0; font-size: 8pt; }
  .dc-bar-label { color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .dc-bar-track { background: #f1f5f9; border-radius: 3px; height: 11px; overflow: hidden; }
  .dc-bar-fill { height: 100%; border-radius: 0 3px 3px 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .dc-bar-value { text-align: right; font-family: monospace; font-weight: 700; color: #0f172a; }
`;
