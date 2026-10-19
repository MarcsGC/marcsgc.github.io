/* Gráficalo · gráficos, panel, pantalla completa e imagen */
"use strict";

const TYPES = [
  { id: "bar", g: "cmp", name: () => t("Barras"), icon: '<path d="M4 20V11M10 20V5M16 20v-8M21 20H3"/>' },
  { id: "barh", g: "cmp", name: () => t("Barras horizontales"), icon: '<path d="M4 4v16M4 7h9M4 12h14M4 17h6"/>' },
  { id: "stacked", g: "cmp", name: () => t("Barras apiladas"), icon: '<path d="M6 20v-6h4v6M6 14V9h4v5M14 20v-9h4v9M14 11V5h4v6M3 20h18"/>' },
  { id: "combo", g: "cmp", name: () => t("Barras + línea"), icon: '<path d="M5 20v-7M10 20v-4M15 20v-9M20 20v-6"/><path d="M3 9l6-4 5 3 7-5"/>' },
  { id: "line", g: "evo", name: () => t("Líneas"), icon: '<path d="M3 17l5-6 4 3 8-9"/>' },
  { id: "area", g: "evo", name: () => t("Áreas"), icon: '<path d="M3 19l5-7 4 3 8-9v13z"/>' },
  { id: "pie", g: "prop", name: () => t("Sectores"), icon: '<circle cx="12" cy="12" r="8"/><path d="M12 4v8l6 5"/>' },
  { id: "doughnut", g: "prop", name: () => t("Anillo"), icon: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>' },
  { id: "hist", g: "dist", name: () => t("Histograma"), icon: '<path d="M3 20h18M5 20v-6h4v6M9 20V8h4v12M13 20v-9h4v9M17 20v-4h3"/>' },
  { id: "box", g: "dist", name: () => t("Diagrama de caja"), icon: '<path d="M12 3v4M12 17v4M9 3h6M9 21h6"/><rect x="6" y="7" width="12" height="10" rx="1"/><path d="M6 12h12"/>' },
  { id: "scatter", g: "rel", name: () => t("Dispersión"), icon: '<circle cx="6" cy="16" r="1.6"/><circle cx="11" cy="11" r="1.6"/><circle cx="15" cy="13" r="1.6"/><circle cx="18" cy="6" r="1.6"/>' },
  { id: "radar", g: "rel", name: () => t("Radar"), icon: '<path d="M12 3l8 6-3 10H7L4 9z"/><path d="M12 8l4 3-1.5 4h-5L8 11z"/>' },
  { id: "count", g: "cat", name: () => t("Recuento de categorías"), icon: '<path d="M4 20h16"/><rect x="5" y="11" width="4" height="9"/><rect x="11" y="6" width="4" height="14"/><path d="M17 9h3M17 13h3M17 17h3"/>' }
];
const GROUPS = { cmp: () => t("Comparar"), evo: () => t("Evolución"), prop: () => t("Proporciones"), dist: () => t("Distribución"), rel: () => t("Relación"), cat: () => t("Texto y categorías") };
const MULTI = ["bar", "barh", "stacked", "line", "area", "radar", "box", "combo"];
const SINGLE = ["pie", "doughnut", "hist"];
const CARTESIAN = ["bar", "barh", "stacked", "line", "area", "combo", "scatter", "hist", "box", "count"];
const typeOf = id => TYPES.find(x => x.id === id) || TYPES[0];
const activeChart = () => { const p = cur(); return p.charts.find(c => c.id === p.activeChart) || p.charts[0]; };

/* ---------- complementos de Chart.js ---------- */
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
const yOf = v => (v && typeof v === "object" ? v.y : v);
const valueLabels = {
  id: "valueLabels",
  afterDatasetsDraw(chart, _a, o) {
    if (!o || !o.show) return;
    const { ctx } = chart, k = o.kind;
    ctx.save(); ctx.font = `500 ${o.size}px ${o.font}`;
    chart.data.datasets.forEach((ds, di) => {
      if (ds._noLabels || !chart.isDatasetVisible(di)) return;
      const horiz = chart.options.indexAxis === "y", stacked = !!chart.options.scales?.x?.stacked;
      chart.getDatasetMeta(di).data.forEach((el, i) => {
        const v = yOf(ds.data[i]); if (v == null || !Number.isFinite(v)) return;
        const txt = o.suffix ? fmt(v, 1) + o.suffix : withUnit(fmt(v, 2), ds._u || "");
        if (k === "pie" || k === "doughnut") {
          const tot = ds.data.reduce((s, x) => s + (x || 0), 0); if (v / tot < 0.04) return;
          const pos = el.tooltipPosition(); ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(o.suffix ? txt : fmt((v / tot) * 100, 0) + " %", pos.x, pos.y);
        } else if (stacked) {
          const span = horiz ? Math.abs(el.x - el.base) : Math.abs(el.base - el.y); if (span < 16) return;
          ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(txt, horiz ? (el.x + el.base) / 2 : el.x, horiz ? el.y : (el.y + el.base) / 2);
        } else if (horiz) { ctx.fillStyle = o.ink; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(txt, el.x + 4, el.y); }
        else { ctx.fillStyle = o.ink; ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.fillText(txt, el.x, el.y - 4); }
      });
    });
    ctx.restore();
  }
};
const boxPlugin = {
  id: "boxplot",
  afterDatasetsDraw(chart, _a, o) {
    if (!o || !o.stats) return;
    const ctx = chart.ctx, y = chart.scales.y, meta = chart.getDatasetMeta(0), py = v => y.getPixelForValue(v);
    ctx.save();
    meta.data.forEach((el, i) => {
      const s = o.stats[i]; if (!s) return;
      const x = el.x, w = el.width;
      ctx.strokeStyle = o.colors[i]; ctx.fillStyle = o.colors[i];
      ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - w / 2, py(s.median)); ctx.lineTo(x + w / 2, py(s.median)); ctx.stroke();
      ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(x, py(s.q3)); ctx.lineTo(x, py(s.whiskerHigh)); ctx.moveTo(x, py(s.q1)); ctx.lineTo(x, py(s.whiskerLow));
      ctx.moveTo(x - w / 4, py(s.whiskerHigh)); ctx.lineTo(x + w / 4, py(s.whiskerHigh));
      ctx.moveTo(x - w / 4, py(s.whiskerLow)); ctx.lineTo(x + w / 4, py(s.whiskerLow)); ctx.stroke();
      const my = py(s.mean); ctx.beginPath(); ctx.moveTo(x - 4, my - 4); ctx.lineTo(x + 4, my + 4); ctx.moveTo(x + 4, my - 4); ctx.lineTo(x - 4, my + 4); ctx.stroke();
      s.outliers.forEach(v => { ctx.beginPath(); ctx.arc(x, py(v), 3.5, 0, Math.PI * 2); ctx.stroke(); });
    });
    ctx.restore();
  }
};
const annotPlugin = {
  id: "annot",
  afterDatasetsDraw(chart, _a, o) {
    if (!o || !o.on) return;
    const { ctx, chartArea: A } = chart, fs = o.fs;
    ctx.save(); ctx.textBaseline = "middle";
    const placed = [];
    const free = (x, y, w, h) => !placed.some(r => x < r.x + r.w && x + w > r.x && y < r.y + r.h && y + h > r.y);
    const place = (x, y, w, h, dir) => { let k = 0; while (!free(x, y, w, h) && k++ < 8) y += dir * (h + 3); placed.push({ x, y, w, h }); return y; };
    const chip = (text, x, y, fg, bg, weight = 600, dir = -1) => {
      ctx.font = `${weight} ${fs}px ${o.font}`; const w = ctx.measureText(text).width + 10, h = fs + 8;
      const bx = Math.max(A.left, Math.min(x, A.right - w));
      let by = Math.max(A.top, Math.min(y, A.bottom - h)); by = place(bx, by, w, h, dir);
      ctx.fillStyle = bg; roundRect(ctx, bx, by, w, h, 4); ctx.fill(); ctx.fillStyle = fg; ctx.textAlign = "left"; ctx.fillText(text, bx + 5, by + h / 2);
      return { bx, by, w, h };
    };
    (o.lines || []).forEach(l => {
      const v = l.value; if (!Number.isFinite(v)) return;
      const sc = o.horizontal ? chart.scales.x : chart.scales.y; if (!sc) return;
      const px = sc.getPixelForValue(v);
      if (o.horizontal ? px < A.left || px > A.right : px < A.top || px > A.bottom) return;
      const col = l.color || o.danger;
      ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.setLineDash([6, 4]); ctx.beginPath();
      if (o.horizontal) { ctx.moveTo(px, A.top); ctx.lineTo(px, A.bottom); } else { ctx.moveTo(A.left, px); ctx.lineTo(A.right, px); }
      ctx.stroke(); ctx.setLineDash([]);
      const text = (l.label ? l.label + " · " : "") + fmt(v);
      ctx.font = `600 ${fs}px ${o.font}`; const tw = ctx.measureText(text).width + 10;
      if (o.horizontal) chip(text, px + 4, A.top + 2, col, o.sheet); else chip(text, A.right - tw - 2, px - fs - 10 < A.top ? px + 2 : px - fs - 10, col, o.sheet);
    });
    if (o.markMax || o.markMin) chart.data.datasets.forEach((ds, di) => {
      if (ds._noLabels || !chart.isDatasetVisible(di)) return;
      const vals = ds.data.map(yOf), meta = chart.getDatasetMeta(di);
      const idxOf = cmp => { let b = -1; vals.forEach((v, i) => { if (v != null && Number.isFinite(v) && (b < 0 || cmp(v, vals[b]))) b = i; }); return b; };
      const mark = (i, isMax) => {
        const el = meta.data[i]; if (!el) return; const pos = el.tooltipPosition();
        const col = Array.isArray(ds.borderColor) ? ds.borderColor[i] : ds.borderColor || o.ink;
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2); ctx.stroke();
        const text = (isMax ? t("Máx") : t("Mín")) + " " + fmt(vals[i]);
        ctx.font = `600 ${fs}px ${o.font}`; const w = ctx.measureText(text).width + 10;
        chip(text, pos.x - w / 2, isMax ? pos.y - fs - 20 : pos.y + 12, o.sheet, col, 600, isMax ? -1 : 1);
      };
      if (o.markMax) mark(idxOf((a, b) => a > b), true);
      if (o.markMin) mark(idxOf((a, b) => a < b), false);
    });
    (o.notes || []).forEach(n => {
      if (n.index < 0 || !n.text) return;
      let best = null;
      chart.data.datasets.forEach((ds, di) => {
        if (ds._noLabels || !chart.isDatasetVisible(di)) return;
        const el = chart.getDatasetMeta(di).data[n.index], v = yOf(ds.data[n.index]);
        if (!el || v == null || !Number.isFinite(v)) return; const pos = el.tooltipPosition(); if (!best || pos.y < best.y) best = pos;
      });
      if (!best) return;
      ctx.font = `500 ${fs}px ${o.font}`; const w = ctx.measureText(n.text).width + 14, h = fs + 10;
      const above = best.y - h - 18 >= A.top, bx = Math.max(A.left, Math.min(best.x - w / 2, A.right - w));
      const by = place(bx, above ? best.y - h - 18 : best.y + 18, w, h, above ? -1 : 1);
      ctx.strokeStyle = o.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(best.x, above ? best.y - 5 : best.y + 5); ctx.lineTo(best.x, above ? by + h : by); ctx.stroke();
      ctx.fillStyle = o.ink; roundRect(ctx, bx, by, w, h, 5); ctx.fill();
      ctx.fillStyle = o.sheet; ctx.textAlign = "left"; ctx.fillText(n.text, bx + 7, by + h / 2);
    });
    ctx.restore();
  }
};
const bgFill = { id: "bgfill", beforeDraw(chart, _a, o) { if (!o || !o.color) return; const c = chart.ctx; c.save(); c.fillStyle = o.color; c.fillRect(0, 0, chart.width, chart.height); c.restore(); } };
Chart.register(valueLabels, boxPlugin, annotPlugin, bgFill);

/* ---------- construcción de la configuración ---------- */
function noteIndex(label) {
  const p = cur(), d = data();
  return d.rowIdx.findIndex(i => (String(p.rows[i].l ?? "").trim() || `#${i + 1}`) === label);
}
// añade la unidad de cada serie a ejes, etiquetas y tooltips
function buildConfig(ch, mode = "main") {
  const cfg = buildConfig0(ch, mode);
  if (cfg && !cfg.empty) try { addUnits(cfg); } catch {}
  return cfg;
}
function addUnits(cfg) {
  const dss = cfg.data?.datasets || [], o = cfg.options; if (!o || !dss.some(x => x._u)) return;
  const tip = o.plugins.tooltip.callbacks;
  if (!tip.label) tip.label = x => { const v = yOf(x.raw); return ` ${x.dataset.label}: ${Number.isFinite(v) ? withUnit(fmt(v), x.dataset._u || "") : "—"}`; };
  const horiz = o.indexAxis === "y";
  ["y", "y1"].forEach(id => {
    const us = [...new Set(dss.filter(x => (x.yAxisID || "y") === id).map(x => x._u || ""))];
    const ax = horiz && id === "y" ? o.scales?.x : o.scales?.[id];
    if (us.length === 1 && us[0] && ax && !(ax.title && ax.title.display)) ax.title = { display: true, text: us[0], color: css("--muted") };
  });
}
function buildConfig0(ch, mode = "main") {
  const p = cur(), d = data();
  const ink = css("--ink"), muted = css("--muted"), grid = css("--grid"), pal = palette();
  const fsz = { s: 10, m: 12, l: 15 }[ch.font] || 12, fs = mode === "panel" ? Math.max(10, fsz - 1) : fsz;
  Chart.defaults.font.family = css("--body"); Chart.defaults.font.size = fs; Chart.defaults.color = muted;
  const need = msg => ({ empty: msg });
  const legend = { display: ch.legend !== "none", position: ch.legend === "bottom" || mode === "panel" ? "bottom" : "top", labels: { color: ink, boxWidth: 12, font: { size: fs } } };
  const exportTitle = mode === "export" ? ch.title || (p.charts.length > 1 ? `${p.name} · ${ch.name}` : p.name) : ch.title;
  const zmode = ch.type === "scatter" ? "xy" : ch.type === "barh" || (ch.type === "count" && ch.countStyle === "barh") ? "y" : "x";
  const zoomable = CARTESIAN.includes(ch.type) && (mode === "main" || mode === "fs") && !(ch.type === "count" && ["pie", "doughnut"].includes(ch.countStyle));
  const base = {
    responsive: true, maintainAspectRatio: false, animation: mode === "export" ? false : { duration: 250 },
    plugins: {
      legend, tooltip: { callbacks: {} },
      title: { display: !!exportTitle && mode !== "panel", text: exportTitle, color: ink, font: { family: css("--display"), size: fs + 5, weight: "600" }, padding: { bottom: 10 } },
      valueLabels: { show: !!ch.showValues, kind: ch.type, size: Math.max(9, fs - 1), font: css("--mono"), ink },
      boxplot: {}, annot: { on: false }, bgfill: { color: mode === "export" ? css("--sheet") : null },
      zoom: zoomable ? {
        zoom: { wheel: { enabled: true, modifierKey: mode === "fs" ? null : "ctrl" }, pinch: { enabled: mode === "fs" }, mode: zmode, onZoomComplete: () => showZoomReset(mode) },
        pan: { enabled: mode === "fs", mode: zmode, onPanComplete: () => showZoomReset(mode) }
      } : { zoom: { wheel: { enabled: false }, pinch: { enabled: false } }, pan: { enabled: false } }
    },
    scales: {
      x: { ticks: { color: muted }, grid: { color: grid }, title: { display: !!ch.xTitle, text: ch.xTitle, color: muted } },
      y: { ticks: { color: muted, font: { family: css("--mono") } }, grid: { color: grid }, beginAtZero: ch.zero !== false, title: { display: !!ch.yTitle, text: ch.yTitle, color: muted } }
    }
  };
  const annot = horizontal => {
    const notes = (ch.notes || []).map(n => ({ index: noteIndex(n.label), text: n.text }));
    const lv = (ch.lines || []).map(l => l.value).filter(Number.isFinite);
    if (lv.length) { const ax = horizontal ? base.scales.x : base.scales.y; ax.suggestedMin = Math.min(...lv); ax.suggestedMax = Math.max(...lv); ax.grace = "6%"; }
    base.plugins.annot = { on: !!((ch.lines || []).length || ch.markMax || ch.markMin || notes.length), lines: ch.lines || [], markMax: ch.markMax, markMin: ch.markMin, notes, horizontal, fs: Math.max(9, fs - 1), font: css("--body"), ink, sheet: css("--sheet"), danger: css("--amber") };
  };
  const labels = d.labels, sel = ch.series.map(colById).filter(c => c && isNum(c));
  const useTime = (ch.type === "line" || ch.type === "area") && d.ts && d.ts.length > 1 && d.ts.every(Number.isFinite);
  let xMaxExtra = -Infinity;
  const timeAxis = () => {
    const xs = d.ts, mn = Math.min(...xs), mx = Math.max(Math.max(...xs), xMaxExtra), day = 864e5;
    Object.assign(base.scales.x, {
      type: "linear", min: mn, max: mx, ticks: { color: muted, maxRotation: 0, callback: v => fmtDate(isoOf(new Date(v)), data.multiYear) },
      afterBuildTicks: sc => { const days = Math.round((mx - mn) / day), step = Math.max(1, Math.ceil(days / 7)); const out = []; for (let v = mn; v <= mx + 1; v += step * day) out.push({ value: v }); sc.ticks = out; }
    });
    base.plugins.tooltip.callbacks.title = items => items.length ? fmtDate(isoOf(new Date(items[0].parsed.x)), true) : "";
  };
  const pt = (vals) => (useTime ? vals.map((v, k) => ({ x: d.ts[k], y: v })) : vals);
  const meanDs = (c, color, yAxisID) => {
    const m = S.mean(d.vals(c.id)); if (!Number.isFinite(m)) return null;
    return { type: "line", _u: unitOf(c), label: t("Media {s}", { s: colName(c) }), data: useTime ? [{ x: Math.min(...d.ts), y: m }, { x: Math.max(...d.ts), y: m }] : labels.map(() => m), borderColor: color, borderDash: [6, 5], borderWidth: 1.5, pointRadius: 0, fill: false, _noLabels: true, yAxisID };
  };

  if (["bar", "barh", "stacked", "line", "area"].includes(ch.type)) {
    if (!sel.length) return need(t("Elige al menos una serie."));
    if (!sel.some(c => d.vals(c.id).length)) return need(t("Las series elegidas no tienen datos todavía."));
    const kind = ch.type === "line" || ch.type === "area" ? "line" : "bar";
    const ds = sel.map(c => {
      const col = colColor(c);
      return { label: colName(c), _u: unitOf(c), data: pt(d.series(c.id)), borderColor: col, borderWidth: 2,
        backgroundColor: kind === "bar" ? col : alpha(col, ch.type === "area" ? 0.22 : 0.1),
        fill: ch.type === "area" ? "origin" : false, tension: 0.25, pointRadius: mode === "panel" ? 2.5 : 3.5, borderRadius: ch.type === "stacked" ? 0 : 4, spanGaps: true };
    });
    if (ch.showMean && ["bar", "line", "area"].includes(ch.type)) sel.forEach(c => { const m = meanDs(c, colColor(c)); if (m) ds.push(m); });
    if (ch.type === "barh") { base.indexAxis = "y"; base.scales.x.beginAtZero = ch.zero !== false; base.scales.x.ticks.font = { family: css("--mono") }; delete base.scales.y.ticks.font; base.scales.y.beginAtZero = false; }
    if (ch.type === "stacked") { base.scales.x.stacked = true; base.scales.y.stacked = true; }
    if (useTime && (ch.ma7 || ch.trend)) {
      const firstNum = numCols()[0];
      sel.forEach(c => {
        const sr = d.series(c.id), pts = d.ts.map((x, k) => [x, sr[k]]).filter(q => q[1] != null).sort((a, b) => a[0] - b[0]);
        const tag = sel.length > 1 ? " · " + colName(c) : "";
        if (ch.ma7 && pts.length > 2) ds.push({ type: "line", _u: unitOf(c), label: t("Media 7 días") + tag, data: pts.map(([x]) => ({ x, y: S.mean(pts.filter(q => q[0] > x - 7 * 864e5 && q[0] <= x).map(q => q[1])) })), borderColor: alpha(colColor(c), 0.75), borderWidth: 3, pointRadius: 0, fill: false, tension: 0.35, _noLabels: true });
        const tr = ch.trend ? trendInfo(c.id) : null;
        if (tr) {
          const end = Math.min(Math.max(tr.lastTs + 14 * 864e5, c === firstNum && tr.eta ? tr.eta : 0), tr.lastTs + 180 * 864e5);
          xMaxExtra = Math.max(xMaxExtra, end);
          const line = []; for (let k = 0; k <= 20; k++) { const x = tr.fromTs + ((end - tr.fromTs) * k) / 20; line.push({ x, y: tr.at(x / 864e5) }); }
          ds.push({ type: "line", _u: unitOf(c), label: t("Tendencia") + tag, data: line, borderColor: css("--amber"), borderDash: [7, 5], borderWidth: 2, pointRadius: 0, fill: false, _noLabels: true });
        }
      });
    }
    if (useTime) timeAxis();
    if (sel.length === 1 && ds.length === 1) legend.display = false;
    annot(ch.type === "barh");
    if (ch.type === "stacked") base.plugins.annot.markMax = base.plugins.annot.markMin = false;
    return { type: kind, data: { labels, datasets: ds }, options: base };
  }
  if (ch.type === "combo") {
    if (!sel.length) return need(t("Elige al menos una serie."));
    const lines = new Set(ch.lineIds.filter(id => sel.some(c => c.id === id)));
    if (!lines.size && sel.length > 1) lines.add(sel[sel.length - 1].id);
    const bars = sel.filter(c => !lines.has(c.id)), lns = sel.filter(c => lines.has(c.id));
    const ds = [
      ...lns.map(c => ({ type: "line", _u: unitOf(c), label: colName(c), data: d.series(c.id), borderColor: colColor(c), backgroundColor: colColor(c), borderWidth: 2.5, pointRadius: 4, tension: 0.25, yAxisID: bars.length ? "y1" : "y", order: 1, spanGaps: true })),
      ...bars.map(c => ({ type: "bar", _u: unitOf(c), label: colName(c), data: d.series(c.id), backgroundColor: colColor(c), borderColor: colColor(c), borderRadius: 4, yAxisID: "y", order: 2 }))
    ];
    if (ch.showMean) bars.forEach(c => { const m = meanDs(c, colColor(c), "y"); if (m) ds.push(m); });
    if (bars.length && lns.length) {
      base.scales.y1 = { position: "right", grid: { drawOnChartArea: false }, ticks: { color: muted, font: { family: css("--mono") } }, beginAtZero: ch.zero !== false, title: { display: true, text: lns.map(colName).join(", "), color: muted } };
      if (!ch.yTitle) base.scales.y.title = { display: true, text: bars.map(colName).join(", "), color: muted };
    }
    annot(false);
    return { type: "bar", data: { labels, datasets: ds }, options: base };
  }
  if (ch.type === "pie" || ch.type === "doughnut") {
    const c = colById(ch.one) || numCols()[0]; if (!c) return need(t("Añade una columna de números."));
    const items = d.rowIdx.map((ri, k) => ({ label: labels[k], v: d.byId[c.id][ri] })).filter(o => Number.isFinite(o.v) && o.v > 0);
    if (!items.length) return need(t("Para sectores hacen falta valores positivos en la serie elegida."));
    delete base.scales; if (ch.legend === "top") legend.position = "bottom";
    base.cutout = ch.type === "doughnut" ? "58%" : 0;
    base.plugins.tooltip.callbacks.label = x => { const tt = x.dataset.data.reduce((s, v) => s + v, 0); return ` ${x.label}: ${withUnit(fmt(x.raw), unitOf(c))} (${fmt((x.raw / tt) * 100, 1)} %)`; };
    return { type: ch.type, data: { labels: items.map(o => o.label), datasets: [{ label: colName(c), data: items.map(o => o.v), backgroundColor: items.map((_, i) => pal[i % pal.length]), borderColor: css("--sheet"), borderWidth: 2 }] }, options: base };
  }
  if (ch.type === "radar") {
    if (!sel.length) return need(t("Elige al menos una serie."));
    if (labels.length < 3) return need(t("El radar necesita al menos 3 filas con datos."));
    const ds = sel.map(c => ({ label: colName(c), data: d.series(c.id), borderColor: colColor(c), backgroundColor: alpha(colColor(c), 0.15), borderWidth: 2, pointRadius: 3 }));
    base.scales = { r: { beginAtZero: ch.zero !== false, grid: { color: grid }, angleLines: { color: grid }, pointLabels: { color: ink, font: { size: fs } }, ticks: { color: muted, backdropColor: "transparent", font: { family: css("--mono"), size: fs - 2 } } } };
    if (ds.length === 1) legend.display = false;
    return { type: "radar", data: { labels, datasets: ds }, options: base };
  }
  if (ch.type === "scatter") {
    const cx = colById(ch.x), cy = colById(ch.y);
    if (!isNum(cx) || !isNum(cy)) return need(t("Elige las columnas X e Y."));
    const X = d.rowIdx.map(i => d.byId[cx.id][i]), Y = d.rowIdx.map(i => d.byId[cy.id][i]);
    const pts = []; X.forEach((x, k) => { if (Number.isFinite(x) && Number.isFinite(Y[k])) pts.push({ x, y: Y[k] }); });
    if (!pts.length) return need(t("Rellena {a} y {b} en las mismas filas para ver la dispersión.", { a: colName(cx), b: colName(cy) }));
    const dotColor = colColor(cy), lineColor = dotColor === css("--amber") ? css("--accent") : css("--amber");
    const ds = [{ label: t("{y} según {x}", { y: colName(cy), x: colName(cx) }), data: pts, backgroundColor: dotColor, borderColor: dotColor, pointRadius: mode === "panel" ? 4 : 5, _noLabels: true }];
    const f = S.fit(ch.model || "linear", X, Y, fmtSig);
    if (!f.error) {
      const line = []; for (let k = 0; k <= 80; k++) { const x = f.xmin + ((f.xmax - f.xmin) * k) / 80, y = f.predict(x); if (Number.isFinite(y)) line.push({ x, y }); }
      ds.push({ type: "line", label: `${t(f.name)} · R² = ${fmt(f.r2, 3)}`, data: line, borderColor: lineColor, borderWidth: 2, pointRadius: 0, tension: 0, _noLabels: true });
    }
    base.scales.x.type = "linear"; base.scales.y.beginAtZero = false;
    base.scales.x.title = { display: true, text: ch.xTitle || colName(cx), color: muted };
    base.scales.y.title = { display: true, text: ch.yTitle || colName(cy), color: muted };
    base.plugins.tooltip.callbacks.label = x => ` (${fmt(x.raw.x)}; ${fmt(x.raw.y)})`;
    base.plugins.annot = { on: !!(ch.lines || []).length, lines: ch.lines || [], fs: Math.max(9, fs - 1), font: css("--body"), ink, sheet: css("--sheet"), danger: css("--amber") };
    return { type: "scatter", data: { datasets: ds }, options: base };
  }
  if (ch.type === "hist") {
    const c = colById(ch.one) || numCols()[0]; if (!c) return need(t("Añade una columna de números."));
    const vals = d.vals(c.id); if (vals.length < 2) return need(t("El histograma necesita al menos 2 valores."));
    const fr = S.frequency(vals, ch.bins || undefined);
    legend.display = false; base.scales.x.grid.display = false; base.scales.y.ticks.precision = 0; base.scales.y.beginAtZero = true;
    base.scales.y.title = { display: true, text: ch.yTitle || t("Frecuencia"), color: muted };
    base.scales.x.title = { display: true, text: ch.xTitle || colName(c), color: muted };
    annot(false); base.plugins.annot.notes = []; base.plugins.annot.lines = [];
    return { type: "bar", data: { labels: fr.rows.map(r => (fr.grouped ? `${fmt(r.from)}–${fmt(r.to)}` : fmt(r.value))), datasets: [{ label: t("Frecuencia"), data: fr.rows.map(r => r.fi), backgroundColor: colColor(c), borderColor: css("--sheet"), borderWidth: 1, barPercentage: fr.grouped ? 1 : 0.8, categoryPercentage: fr.grouped ? 1 : 0.8 }] }, options: base };
  }
  if (ch.type === "box") {
    const cs = sel.filter(c => d.vals(c.id).length >= 2);
    if (!cs.length) return need(t("Elige series con al menos 2 valores."));
    const st = cs.map(c => S.describe(d.vals(c.id))), colors = cs.map(colColor);
    legend.display = false; base.scales.y.beginAtZero = false; base.scales.x.grid.display = false;
    base.scales.y.suggestedMin = Math.min(...st.map(s => s.min)); base.scales.y.suggestedMax = Math.max(...st.map(s => s.max));
    base.plugins.boxplot = { stats: st, colors };
    base.plugins.tooltip.callbacks.label = x => { const s = st[x.dataIndex]; return [` ${t("Máx")}: ${fmt(s.max)}`, ` Q3: ${fmt(s.q3)}`, ` ${t("Mediana")}: ${fmt(s.median)}`, ` ${t("Media")}: ${fmt(s.mean)}`, ` Q1: ${fmt(s.q1)}`, ` ${t("Mín")}: ${fmt(s.min)}`]; };
    base.plugins.annot = { on: !!(ch.lines || []).length, lines: ch.lines || [], fs: Math.max(9, fs - 1), font: css("--body"), ink, sheet: css("--sheet"), danger: css("--amber") };
    return { type: "bar", data: { labels: cs.map(colName), datasets: [{ label: t("Caja"), data: st.map(s => [s.q1, s.q3]), backgroundColor: colors.map(c => alpha(c, 0.25)), borderColor: colors, borderWidth: 1.5, borderSkipped: false, barPercentage: 0.5 }] }, options: base };
  }
  if (ch.type === "count") {
    const cid = ch.countCol || LABEL;
    if (cid !== LABEL && !colById(cid)) return need(t("Elige qué columna contar."));
    const cats = d.cat(cid), pctOn = !!ch.countPct, suffix = pctOn ? " %" : "";
    base.plugins.valueLabels.suffix = suffix;
    let style = ch.countStyle || "bar";
    const split = ch.splitCol && ch.splitCol !== cid && (ch.splitCol === LABEL || colById(ch.splitCol)) ? ch.splitCol : "";
    if (split && (style === "pie" || style === "doughnut")) style = "stacked";
    const yTitle = pctOn ? "%" : t("Recuento");
    if (!split) {
      const list = S.countCategories(cats); if (!list.length) return need(t("La columna «{c}» está vacía.", { c: nameOf(cid) }));
      const tot = list.reduce((s, x) => s + x.n, 0), vals = list.map(x => (pctOn ? (x.n / tot) * 100 : x.n)), labs = list.map(x => d.catDisplay(cid, x.key));
      const colors = list.map((_, i) => pal[i % pal.length]);
      base.plugins.tooltip.callbacks.label = x => { const n = list[x.dataIndex].n; return ` ${n} (${fmt((n / tot) * 100, 1)} %)`; };
      if (style === "pie" || style === "doughnut") {
        delete base.scales; base.cutout = style === "doughnut" ? "58%" : 0; if (ch.legend === "top") legend.position = "bottom";
        base.plugins.valueLabels.kind = style;
        return { type: style, data: { labels: labs, datasets: [{ label: nameOf(cid), data: vals, backgroundColor: colors, borderColor: css("--sheet"), borderWidth: 2 }] }, options: base };
      }
      legend.display = false;
      const horiz = style === "barh"; if (horiz) { base.indexAxis = "y"; base.scales.x.ticks.font = { family: css("--mono") }; delete base.scales.y.ticks.font; }
      const valAx = horiz ? base.scales.x : base.scales.y; valAx.beginAtZero = true; if (!pctOn) valAx.ticks.precision = 0;
      valAx.title = { display: true, text: (horiz ? ch.xTitle : ch.yTitle) || yTitle, color: muted };
      (horiz ? base.scales.y : base.scales.x).title = { display: true, text: (horiz ? ch.yTitle : ch.xTitle) || nameOf(cid), color: muted };
      base.plugins.valueLabels.kind = "bar";
      return { type: "bar", data: { labels: labs, datasets: [{ label: nameOf(cid), data: vals, backgroundColor: colors, borderColor: colors, borderRadius: 4 }] }, options: base };
    }
    const ct = S.crosstab(cats, d.cat(split)); if (!ct.n) return need(t("No hay filas con las dos columnas rellenas."));
    const rowTot = ct.counts.map(r => r.reduce((s, x) => s + x, 0));
    const ds = ct.colKeys.map((k, j) => ({ label: d.catDisplay(split, k), data: ct.counts.map((r, i) => (pctOn ? (rowTot[i] ? (r[j] / rowTot[i]) * 100 : 0) : r[j])), backgroundColor: pal[j % pal.length], borderColor: pal[j % pal.length], borderRadius: style === "stacked" ? 0 : 3 }));
    const horiz = style === "barh"; if (horiz) { base.indexAxis = "y"; base.scales.x.ticks.font = { family: css("--mono") }; delete base.scales.y.ticks.font; }
    if (style === "stacked") { base.scales.x.stacked = true; base.scales.y.stacked = true; }
    const valAx = horiz ? base.scales.x : base.scales.y; valAx.beginAtZero = true; if (!pctOn) valAx.ticks.precision = 0;
    valAx.title = { display: true, text: yTitle, color: muted }; if (pctOn && style === "stacked") valAx.max = 100;
    (horiz ? base.scales.y : base.scales.x).title = { display: true, text: nameOf(cid), color: muted };
    legend.title = { display: true, text: nameOf(split), color: muted };
    base.plugins.tooltip.callbacks.label = x => ` ${x.dataset.label}: ${ct.counts[x.dataIndex][x.datasetIndex]}${pctOn ? ` (${fmt(x.raw, 1)} %)` : ""}`;
    return { type: "bar", data: { labels: ct.rowKeys.map(k => d.catDisplay(cid, k)), datasets: ds }, options: base };
  }
  return need(t("Tipo de gráfico desconocido."));
}

/* ---------- vista de gráficos ---------- */
let mainChart = null;
const chartVisible = () => currentView === "view-chart" || (wide() && currentView !== "view-panel");
function renderChartTitle() { $("#chartTitle").textContent = cur().name; $("#panelTitle").textContent = cur().name; }
function renderChartUI() { renderChartTitle(); renderChartTabs(); renderChartControls(); renderChart(); }
function renderChartTabs() {
  const p = cur(), a = activeChart();
  $("#chartTabs").innerHTML = p.charts.map(c => `<button role="tab" data-ch="${c.id}" aria-selected="${c.id === a.id}">${esc(c.name)}</button>`).join("") + `<button class="add" data-ch="__new" title="${t("Nuevo gráfico")}">＋ ${t("Gráfico")}</button>`;
}
$("#chartTabs").addEventListener("click", e => {
  const b = e.target.closest("[data-ch]"); if (!b) return;
  const p = cur();
  if (b.dataset.ch === "__new") {
    const nums = numCols(), txts = p.cols.filter(c => c.kind === "text");
    const ch = Object.assign(defaultChart(), { name: t("Gráfico {n}", { n: p.charts.length + 1 }) });
    if (nums.length) { ch.type = "bar"; ch.series = nums.slice(0, 4).map(c => c.id); ch.one = nums[0].id; ch.x = nums[0].id; ch.y = (nums[1] || nums[0]).id; }
    else { ch.type = "count"; ch.countCol = (txts[0] || {}).id || LABEL; }
    p.charts.push(ch); p.activeChart = ch.id; persist(); renderChartUI(); typeSheet();
  } else { p.activeChart = b.dataset.ch; saveSoon(); renderChartUI(); }
});
$("#chartMenuBtn").addEventListener("click", () => {
  const p = cur(), ch = activeChart(), i = p.charts.indexOf(ch);
  openSheet(`<h3>${esc(ch.name)}</h3><div class="menulist">
    ${menuItem("rename", IC.edit, t("Renombrar gráfico"))}
    ${menuItem("dup", IC.copy, t("Duplicar gráfico"))}
    ${menuItem("left", '<path d="M15 6l-6 6 6 6"/>', t("Mover a la izquierda"))}
    ${menuItem("del", IC.clear, t("Borrar gráfico"), p.charts.length < 2 ? t("Un proyecto necesita al menos un gráfico") : "", "danger")}
    </div><div class="actions"><button class="btn ghost" data-act="close">${t("Cerrar")}</button></div>`,
  act => {
    if (act === "rename") {
      openSheet(`<h3>${t("Renombrar gráfico")}</h3><div class="field"><input type="text" id="chName" value="${esc(ch.name)}" aria-label="${t("Nombre")}"></div>
        <div class="actions"><button class="btn ghost" data-act="close">${t("Cancelar")}</button><button class="btn primary" data-act="ok">${t("Guardar")}</button></div>`,
      a2 => { if (a2 === "ok") { ch.name = $("#chName").value.trim() || ch.name; persist(); renderChartTabs(); closeSheet(); } });
      setTimeout(() => $("#chName").select(), 60);
    }
    if (act === "dup") { const c = JSON.parse(JSON.stringify(ch)); c.id = uid(); c.name = ch.name + " " + t("(copia)"); p.charts.splice(i + 1, 0, c); p.activeChart = c.id; persist(); renderChartUI(); closeSheet(); }
    if (act === "left" && i > 0) { [p.charts[i - 1], p.charts[i]] = [p.charts[i], p.charts[i - 1]]; persist(); renderChartTabs(); closeSheet(); }
    if (act === "del" && p.charts.length > 1) { p.charts.splice(i, 1); p.activeChart = p.charts[Math.max(0, i - 1)].id; persist(); renderChartUI(); closeSheet(); toast(t("Gráfico borrado"), t("Deshacer"), undo); }
  });
});
$("#typeBtn").addEventListener("click", typeSheet);
function typeSheet() {
  const ch = activeChart();
  openSheet(`<h3>${t("Tipo de gráfico")}</h3>${Object.entries(GROUPS).map(([g, gn]) => `<div class="typegroup"><div class="label">${gn()}</div><div class="typegrid">${TYPES.filter(x => x.g === g).map(x => `<button data-act="type:${x.id}" aria-pressed="${x.id === ch.type}">${ICON(x.icon)}<span>${x.name()}</span></button>`).join("")}</div></div>`).join("")}
    <div class="actions"><button class="btn ghost" data-act="close">${t("Cerrar")}</button></div>`,
  act => {
    if (!act.startsWith("type:")) return;
    const p = cur(); ch.type = act.slice(5);
    const nums = numCols();
    if (MULTI.includes(ch.type) && !ch.series.length && nums[0]) ch.series = [nums[0].id];
    if (ch.type === "combo" && ch.series.length < 2 && nums.length > 1) ch.series = nums.slice(0, 2).map(c => c.id);
    if (ch.type === "count" && (!ch.countCol || (ch.countCol !== LABEL && !colById(ch.countCol)))) ch.countCol = (p.cols.find(c => c.kind === "text") || {}).id || LABEL;
    persist(); closeSheet(); renderChartUI();
  });
}
function chips(list, isOn, attr) { return `<div class="chips">${list.map(c => `<button data-${attr}="${c.id}" aria-pressed="${isOn(c.id)}"><i style="background:${colColor(c)}"></i>${esc(colName(c))}</button>`).join("")}</div>`; }
function colSelect(id, value, list, extra = "") { return `<select id="${id}">${extra}${list.map(c => `<option value="${c.id}" ${c.id === value ? "selected" : ""}>${esc(c.id === LABEL ? colName(LABEL) : `${L(cur().cols.indexOf(c))} · ${colName(c)}`)}</option>`).join("")}</select>`; }
function renderChartControls() {
  if (!cur()) return;
  const p = cur(), ch = activeChart(), nums = numCols();
  ch.series = ch.series.filter(id => nums.some(c => c.id === id));
  ch.one = validId(ch.one || ch.series[0], 0);
  $("#typeBtn").innerHTML = ICON(typeOf(ch.type).icon) + `<span>${esc(typeOf(ch.type).name())}</span> ▾`;
  let html = "";
  if (MULTI.includes(ch.type)) {
    html += `<div class="label">${t("Series")}</div>` + chips(nums, id => ch.series.includes(id), "s");
    if (ch.type === "combo") {
      const selCols = nums.filter(c => ch.series.includes(c.id));
      html += `<div class="label" style="margin-top:4px">${t("En línea, con su propio eje a la derecha")}</div>` + (selCols.length > 1 ? chips(selCols, id => ch.lineIds.includes(id) || (!ch.lineIds.some(x => ch.series.includes(x)) && id === selCols[selCols.length - 1].id), "ln") : `<p class="hint">${t("Elige al menos dos series.")}</p>`);
    }
  } else if (SINGLE.includes(ch.type)) {
    html += `<div class="label">${t("Serie")}</div>` + chips(nums, id => id === ch.one, "one");
  } else if (ch.type === "scatter") {
    ch.x = validId(ch.x, 0); ch.y = validId(ch.y, 1);
    html += `<div class="sel-row"><label>X ${colSelect("chX", ch.x, nums)}</label><label>Y ${colSelect("chY", ch.y, nums)}</label><label>${t("Ajuste")} <select id="chModel">${Object.entries(S.MODELS).map(([k, n]) => `<option value="${k}" ${k === ch.model ? "selected" : ""}>${t(n)}</option>`).join("")}</select></label></div>`;
  } else if (ch.type === "count") {
    const all = [{ id: LABEL }, ...p.cols];
    html += `<div class="sel-row"><label>${t("Contar")} ${colSelect("chCount", ch.countCol || LABEL, all)}</label>
      <label>${t("Dividir por")} ${colSelect("chSplit", ch.splitCol || "", all.filter(c => c.id !== ch.countCol), `<option value="">${t("— Nada —")}</option>`)}</label>
      <label>${t("Estilo")} <select id="chStyle">${[["bar", t("Barras")], ["barh", t("Barras horizontales")], ["stacked", t("Barras apiladas")], ["pie", t("Sectores")], ["doughnut", t("Anillo")]].map(([v, n]) => `<option value="${v}" ${v === ch.countStyle ? "selected" : ""} ${ch.splitCol && (v === "pie" || v === "doughnut") ? "disabled" : ""}>${n}</option>`).join("")}</select></label>
      <label><input type="checkbox" id="chPct" ${ch.countPct ? "checked" : ""}> ${t("En porcentaje")}</label></div>`;
  }
  $("#chartCtl").innerHTML = html;
  const o = [];
  if (["bar", "line", "area", "combo"].includes(ch.type)) o.push(`<label><input type="checkbox" id="optMean" ${ch.showMean ? "checked" : ""}> ${t("Línea de la media")}</label>`);
  if (["bar", "barh", "stacked", "line", "area", "combo", "pie", "doughnut", "count"].includes(ch.type)) o.push(`<label><input type="checkbox" id="optValues" ${ch.showValues ? "checked" : ""}> ${t("Mostrar valores")}</label>`);
  if ((ch.type === "line" || ch.type === "area") && p.labelType === "date") o.push(`<label><input type="checkbox" id="optMa" ${ch.ma7 ? "checked" : ""}> ${t("Media 7 días")}</label>`, `<label><input type="checkbox" id="optTrend" ${ch.trend ? "checked" : ""}> ${t("Tendencia")}</label>`);
  if (ch.type === "hist") o.push(`<label>${t("Intervalos")} <input type="number" id="optBins" min="2" max="40" placeholder="auto" value="${ch.bins || ""}"></label>`);
  if (CARTESIAN.includes(ch.type) && !(ch.type === "count" && ["pie", "doughnut"].includes(ch.countStyle))) o.push(`<span class="hint">${wide() ? t("Ctrl + rueda para ampliar") : t("Pantalla completa para ampliar")}</span>`);
  $("#opts").innerHTML = o.join("");
}
$("#chartCtl").addEventListener("click", e => {
  const ch = activeChart(), b = e.target.closest("[data-s],[data-ln],[data-one]"); if (!b) return;
  const nums = numCols().map(c => c.id);
  if (b.dataset.s) { const id = b.dataset.s; ch.series = ch.series.includes(id) ? ch.series.filter(s => s !== id) : nums.filter(c => c === id || ch.series.includes(c)); }
  if (b.dataset.ln) {
    const id = b.dataset.ln, selIds = nums.filter(c => ch.series.includes(c));
    let cur2 = ch.lineIds.filter(x => selIds.includes(x)); if (!cur2.length) cur2 = [selIds[selIds.length - 1]];
    cur2 = cur2.includes(id) ? cur2.filter(x => x !== id) : [...cur2, id];
    if (cur2.length >= selIds.length) { toast(t("Deja al menos una serie en barras")); return; }
    ch.lineIds = cur2.length ? cur2 : ["__none"];
  }
  if (b.dataset.one) ch.one = b.dataset.one;
  persist(); renderChartControls(); renderChart();
});
$("#chartCtl").addEventListener("change", e => {
  const ch = activeChart(), id = e.target.id;
  if (id === "chX") ch.x = e.target.value; if (id === "chY") ch.y = e.target.value; if (id === "chModel") ch.model = e.target.value;
  if (id === "chCount") { ch.countCol = e.target.value; if (ch.splitCol === ch.countCol) ch.splitCol = ""; }
  if (id === "chSplit") { ch.splitCol = e.target.value; if (ch.splitCol && ["pie", "doughnut"].includes(ch.countStyle)) ch.countStyle = "stacked"; }
  if (id === "chStyle") ch.countStyle = e.target.value;
  if (id === "chPct") ch.countPct = e.target.checked;
  persist(); renderChartControls(); renderChart();
});
$("#opts").addEventListener("change", e => {
  const ch = activeChart();
  if (e.target.id === "optMean") ch.showMean = e.target.checked;
  if (e.target.id === "optValues") ch.showValues = e.target.checked;
  if (e.target.id === "optMa") ch.ma7 = e.target.checked;
  if (e.target.id === "optTrend") ch.trend = e.target.checked;
  persist(); renderChart();
});
$("#opts").addEventListener("input", e => { if (e.target.id !== "optBins") return; const v = parseInt(e.target.value, 10); activeChart().bins = v >= 2 && v <= 40 ? v : null; persist(); renderChartSoon(); });
const renderChartSoon = debounce(() => renderChart(), 150);
function renderChart() {
  if (!cur()) return;
  if (mainChart) { mainChart.destroy(); mainChart = null; }
  $("#zoomReset").hidden = true;
  const ch = activeChart(); $("#chart").setAttribute("aria-label", ch.name);
  const cfg = buildConfig(ch, "main"), empty = $("#chartEmpty");
  if (cfg.empty) { empty.hidden = false; empty.textContent = cfg.empty; return; }
  empty.hidden = true;
  if (!chartVisible()) return;
  mainChart = new Chart($("#chart"), cfg);
}
function showZoomReset(mode) { $(mode === "fs" ? "#fsReset" : "#zoomReset").hidden = false; }
$("#zoomReset").addEventListener("click", () => { mainChart?.resetZoom(); $("#zoomReset").hidden = true; });

/* ---------- personalizar ---------- */
$("#customBtn").addEventListener("click", customSheet);
function customSheet() {
  const p = cur(), ch = activeChart();
  const seg = (k, opts) => `<div class="seg" role="group" data-seg="${k}">${opts.map(([v, l]) => `<button data-act="seg:${k}:${v}" aria-pressed="${v === ch[k]}">${l}</button>`).join("")}</div>`;
  const rowsOpts = sel => data().rowIdx.map(i => { const raw = String(p.rows[i].l ?? "").trim() || `#${i + 1}`; return `<option value="${esc(raw)}" ${raw === sel ? "selected" : ""}>${esc(labelText(p, i))}</option>`; }).join("");
  const canNotes = !["pie", "doughnut", "scatter", "hist", "box", "count", "radar"].includes(ch.type);
  const canMarks = canNotes && ch.type !== "stacked";
  const canLines = CARTESIAN.includes(ch.type) && !["count", "hist"].includes(ch.type);
  openSheet(`<h3>${t("Personalizar gráfico")}</h3>
    <div class="field"><label class="label" for="cTitle">${t("Título")}</label><input type="text" id="cTitle" value="${esc(ch.title)}" placeholder="${t("Sin título")}"></div>
    <div class="row2">
      <div class="field"><label class="label" for="cX">${t("Nombre del eje X")}</label><input type="text" id="cX" value="${esc(ch.xTitle)}"></div>
      <div class="field"><label class="label" for="cY">${t("Nombre del eje Y")}</label><input type="text" id="cY" value="${esc(ch.yTitle)}"></div>
    </div>
    <div class="setrow"><span class="label">${t("Tamaño de letra")}</span>${seg("font", [["s", t("Pequeña")], ["m", t("Normal")], ["l", t("Grande")]])}</div>
    <div class="setrow"><span class="label">${t("Leyenda")}</span>${seg("legend", [["top", t("Arriba")], ["bottom", t("Abajo")], ["none", t("Oculta")]])}</div>
    <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="cZero" ${ch.zero !== false ? "checked" : ""}> ${t("Empezar el eje en cero")}</label>
    <h4>${t("Paleta de colores")}</h4>
    <div class="palettes">${Object.entries(PALETTES).map(([k, v]) => `<button data-act="pal:${k}" aria-pressed="${(p.palette || "default") === k}"><span class="sw">${v.colors().slice(0, 6).map(c => `<i style="background:${c}"></i>`).join("")}</span>${t(v.name)}</button>`).join("")}</div>
    <details class="help"><summary>${t("Colores de cada serie")}</summary><div class="colorlist" style="margin-top:8px">${numCols().map(c => `<label><input type="color" data-color="${c.id}" value="${toHex(colColor(c))}"><span>${esc(colName(c))}</span></label>`).join("")}</div>
      <button class="btn small ghost" data-act="resetColors" style="margin-top:6px">${t("Volver a los colores de la paleta")}</button></details>
    ${canLines || canMarks || canNotes ? `<h4>${t("Anotaciones")}</h4>` : ""}
    ${canLines ? `<div class="field"><span class="label">${t("Líneas de referencia")}</span><div class="listrows" id="lnRows">${(ch.lines || []).map((l, i) => `<div class="listrow" data-i="${i}"><input class="n" type="text" inputmode="decimal" data-l="value" value="${esc(Number.isFinite(l.value) ? String(l.value).replace(".", DEC()) : "")}" placeholder="${t("Valor")}"><input type="text" data-l="label" value="${esc(l.label)}" placeholder="${t("Texto (opcional)")}"><button class="x" data-act="rmline:${i}" aria-label="${t("Quitar")}">×</button></div>`).join("")}</div>
      <button class="btn small" data-act="addline" style="align-self:flex-start">${ICON(IC.plus)}${t("Añadir línea (objetivo, aprobado…)")}</button></div>` : ""}
    ${canMarks ? `<div class="checks"><label><input type="checkbox" id="cMax" ${ch.markMax ? "checked" : ""}> ${t("Resaltar el valor máximo")}</label><label><input type="checkbox" id="cMin" ${ch.markMin ? "checked" : ""}> ${t("Resaltar el valor mínimo")}</label></div>` : ""}
    ${canNotes ? `<div class="field"><span class="label">${t("Notas sobre un punto")}</span><div class="listrows" id="ntRows">${(ch.notes || []).map((n, i) => `<div class="listrow" data-i="${i}"><select data-n="label">${rowsOpts(n.label)}</select><input type="text" data-n="text" value="${esc(n.text)}" placeholder="${t("Texto de la nota")}"><button class="x" data-act="rmnote:${i}" aria-label="${t("Quitar")}">×</button></div>`).join("")}</div>
      <button class="btn small" data-act="addnote" style="align-self:flex-start" ${data().rowIdx.length ? "" : "disabled"}>${ICON(IC.plus)}${t("Añadir nota")}</button></div>` : ""}
    <div class="actions"><button class="btn primary" data-act="close">${t("Hecho")}</button></div>`,
  act => {
    if (act.startsWith("seg:")) { const [, k, v] = act.split(":"); ch[k] = v; $$(`[data-seg="${k}"] button`).forEach(b => b.setAttribute("aria-pressed", b.dataset.act === act)); persist(); renderChart(); }
    if (act.startsWith("pal:")) { p.palette = act.slice(4); $$(".palettes button").forEach(b => b.setAttribute("aria-pressed", b.dataset.act === act)); $$("[data-color]").forEach(i => (i.value = toHex(colColor(colById(i.dataset.color))))); persist(); renderTable(); renderChartUI(); }
    if (act === "resetColors") { p.cols.forEach(c => (c.color = null)); $$("[data-color]").forEach(i => (i.value = toHex(colColor(colById(i.dataset.color))))); persist(); renderTable(); renderChartUI(); }
    if (act === "addline") { readAnn(); ch.lines.push({ value: NaN, label: "", color: "" }); persist(); customSheet(); setTimeout(() => $$("#lnRows [data-l=value]").pop()?.focus(), 60); }
    if (act.startsWith("rmline:")) { readAnn(); ch.lines.splice(+act.slice(7), 1); persist(); renderChart(); customSheet(); }
    if (act === "addnote") { readAnn(); const i = data().rowIdx[0]; ch.notes.push({ label: String(p.rows[i].l ?? "").trim() || `#${i + 1}`, text: "" }); persist(); customSheet(); setTimeout(() => $$("#ntRows [data-n=text]").pop()?.focus(), 60); }
    if (act.startsWith("rmnote:")) { readAnn(); ch.notes.splice(+act.slice(7), 1); persist(); renderChart(); customSheet(); }
  });
  const readAnn = () => {
    $$("#lnRows .listrow").forEach(r => { const l = ch.lines[+r.dataset.i]; l.value = S.parseNum(r.querySelector("[data-l=value]").value); l.label = r.querySelector("[data-l=label]").value; });
    $$("#ntRows .listrow").forEach(r => { const n = ch.notes[+r.dataset.i]; n.label = r.querySelector("[data-n=label]").value; n.text = r.querySelector("[data-n=text]").value; });
  };
  const upd = () => { ch.title = $("#cTitle").value; ch.xTitle = $("#cX").value; ch.yTitle = $("#cY").value; ch.zero = $("#cZero").checked; if ($("#cMax")) { ch.markMax = $("#cMax").checked; ch.markMin = $("#cMin").checked; } readAnn(); persist(); renderChartSoon(); };
  $("#sheetCard").addEventListener("input", e => { if (e.target.matches("[data-color]")) { colById(e.target.dataset.color).color = e.target.value; persist(); renderChartSoon(); renderTableSoon(); } else upd(); });
  $("#sheetCard").addEventListener("change", e => { if (!e.target.matches("[data-color]")) upd(); });
}
const renderTableSoon = debounce(() => renderTable(), 300);

/* ---------- pantalla completa ---------- */
let fsChart = null;
$("#fsBtn").addEventListener("click", openFullscreen);
async function openFullscreen() {
  const ch = activeChart(), cfg = buildConfig(ch, "fs");
  if (cfg.empty) { toast(cfg.empty); return; }
  $("#fs").hidden = false; $("#fsTitle").textContent = ch.title || ch.name; $("#fsReset").hidden = true;
  const zoomable = !!cfg.options.plugins.zoom?.pan?.enabled; $("#fsHint").hidden = !zoomable;
  try { await $("#fs").requestFullscreen?.(); await screen.orientation?.lock?.("landscape"); } catch {}
  setTimeout(() => { fsChart?.destroy(); fsChart = new Chart($("#fsChart"), buildConfig(ch, "fs")); }, 120);
}
function closeFullscreen() {
  fsChart?.destroy(); fsChart = null; $("#fs").hidden = true;
  try { screen.orientation?.unlock?.(); } catch {}
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
}
$("#fsClose").addEventListener("click", closeFullscreen);
$("#fsReset").addEventListener("click", () => { fsChart?.resetZoom(); $("#fsReset").hidden = true; });
document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && !$("#fs").hidden) closeFullscreen(); });

/* ---------- panel ---------- */
let panelCharts = [];
function destroyPanel() { panelCharts.forEach(c => c.destroy()); panelCharts = []; }
function renderPanel() {
  if (!cur()) return;
  destroyPanel();
  const p = cur(), d = data();
  renderChartTitle(); updateCount();
  const sl = summaryLine(); $("#sumLinePanel").hidden = !sl; $("#sumLinePanel").innerHTML = sl;
  const tiles = [];
  numCols().slice(0, 8).forEach(c => {
    const v = d.vals(c.id); if (!v.length) return;
    const s = S.describe(v), dot = `<i style="background:${colColor(c)}"></i>`;
    if (p.labelType === "date" && v.length >= 2) {
      const ser = d.series(c.id).filter(x => x != null), last = ser[ser.length - 1], prev = ser[ser.length - 2], diff = last - prev;
      tiles.push(`<div class="kpi"><span class="k">${dot}${esc(colName(c))} · ${t("último")}</span><span class="v">${fmtU(last, c)}</span><span class="s"><span class="${trendClass(diff, last, c)}">${diff > 0 ? "▲" : diff < 0 ? "▼" : "="} ${fmt(Math.abs(diff))}</span> · ${t("media")} ${fmt(s.mean)}</span></div>`);
    } else tiles.push(`<div class="kpi"><span class="k">${dot}${esc(colName(c))} · ${t("media")}</span><span class="v">${fmtU(s.mean, c)}</span><span class="s">${t("total")} ${fmtU(s.sum, c)} · n ${s.n}</span><span class="s">${fmt(s.min)} – ${fmt(s.max)}</span></div>`);
  });
  p.cols.filter(c => c.kind === "text").slice(0, 3).forEach(c => {
    const list = S.countCategories(d.cat(c.id)); if (!list.length) return;
    const tot = list.reduce((a, x) => a + x.n, 0), top = [...list].sort((a, b) => b.n - a.n)[0];
    tiles.push(`<div class="kpi"><span class="k"><i style="border:1px solid var(--muted)"></i>${esc(colName(c))} · ${t("más común")}</span><span class="v">${esc(top.key)}</span><span class="s">${top.n} ${t("de")} ${tot} (${fmt((top.n / tot) * 100, 0)} %) · ${list.length} ${t("categorías")}</span></div>`);
  });
  $("#kpis").innerHTML = tiles.join("") || `<p class="hint">${t("Añade datos para ver el resumen.")}</p>`;
  $("#panelGrid").innerHTML = p.charts.map(c => `<div class="pcard"><div class="vhead"><h3>${esc(c.name)}</h3><button class="btn small" data-open="${c.id}">${t("Abrir")}</button></div><div class="box"><canvas data-pc="${c.id}" role="img" aria-label="${esc(c.name)}"></canvas><div class="empty" data-pe="${c.id}" hidden></div></div></div>`).join("");
  if (currentView !== "view-panel") return;
  p.charts.forEach(c => {
    const cfg = buildConfig(c, "panel");
    if (cfg.empty) { const e = $(`[data-pe="${c.id}"]`); e.hidden = false; e.textContent = cfg.empty; return; }
    panelCharts.push(new Chart($(`[data-pc="${c.id}"]`), cfg));
  });
}
$("#panelGrid").addEventListener("click", e => { const b = e.target.closest("[data-open]"); if (!b) return; cur().activeChart = b.dataset.open; saveSoon(); showView("view-chart"); renderChartUI(); });

/* ---------- imagen del gráfico ---------- */
function renderChartImage(ch, { w = 760, h = 460, theme = "light", scale = 2.6 } = {}) {
  THEME_OVERRIDE = theme === "dark" ? DARK : LIGHT;
  try {
    const cfg = buildConfig(ch, "export"); if (cfg.empty) return null;
    const holder = $("#offscreen"); holder.innerHTML = "";
    const cv = document.createElement("canvas"); cv.style.width = w + "px"; cv.style.height = h + "px"; cv.width = w; cv.height = h; holder.appendChild(cv);
    cfg.options.responsive = false; cfg.options.devicePixelRatio = scale;
    const c = new Chart(cv, cfg); const url = cv.toDataURL("image/png"); c.destroy(); holder.innerHTML = "";
    return url;
  } finally { THEME_OVERRIDE = null; }
}
const dataURLtoBlob = url => fetch(url).then(r => r.blob());
$("#exportBtn").addEventListener("click", () => imageSheet("light"));
function imageSheet(theme) {
  const ch = activeChart(), url = renderChartImage(ch, { theme });
  if (!url) { toast(t("Primero añade datos al gráfico")); return; }
  const name = (ch.title || `${cur().name} ${ch.name}`).replace(/[\\/:*?"<>|]/g, "").trim() + ".png";
  openSheet(`<h3>${t("Imagen del gráfico")}</h3>
    <div class="setrow"><span class="label">${t("Fondo")}</span><div class="seg" role="group"><button data-act="th:light" aria-pressed="${theme === "light"}">${t("Claro")}</button><button data-act="th:dark" aria-pressed="${theme === "dark"}">${t("Oscuro")}</button></div></div>
    <img src="${url}" alt="${esc(ch.name)}">
    <p class="hint">${t("Si no se descarga, mantén pulsada la imagen y elige «Guardar imagen».")}</p>
    <div class="actions"><button class="btn" data-act="dl">${ICON(IC.imp)}${t("Descargar")}</button><button class="btn primary" data-act="share">${ICON(IC.share)}${t("Compartir")}</button></div>`,
  async act => {
    if (act.startsWith("th:")) imageSheet(act.slice(3));
    if (act === "dl") downloadBlob(await dataURLtoBlob(url), name);
    if (act === "share") shareFile(await dataURLtoBlob(url), name, ch.title || ch.name);
  });
}
window.addEventListener("resize", debounce(() => { if (!cur()) return; const w = wide(); if (w !== renderChart._w) { renderChart._w = w; renderChartControls(); renderChart(); } }, 200));
