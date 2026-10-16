/* Gráficalo · núcleo: estado, proyectos, tabla, importación, ajustes */
"use strict";
const S = window.GStats;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const LOC = () => (LANG === "es" ? "es-ES" : "en-US");
const fmt = (n, d = 2) => (Number.isFinite(n) ? n.toLocaleString(LOC(), { maximumFractionDigits: d }) : "—");
const fmtSig = v => { if (!Number.isFinite(v)) return "—"; const a = Math.abs(v); return v.toLocaleString(LOC(), { maximumSignificantDigits: a >= 1000 ? 7 : 4 }); };
const fmtP = p => (!Number.isFinite(p) ? "—" : p < 0.0001 ? "< " + fmt(0.0001, 4) : fmt(p, 4));
const pct = v => fmt(v * 100, 1) + (LANG === "es" ? " %" : "%");
const uid = () => Math.random().toString(36).slice(2, 9);
const L = i => S.indexLetter(i);
const LABEL = "__label";
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const ICON = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const IC = {
  plus: '<path d="M12 5v14M5 12h14"/>', cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  col: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16M18.5 10v4M16.5 12h4"/>',
  sort: '<path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/>', imp: '<path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 19h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
  xls: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8l8 8M16 8l-8 8"/>', pdf: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
  clear: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
  restore: '<path d="M3 12a9 9 0 103-6.7L3 8"/><path d="M3 3v5h5"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>', help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>', paste: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9z"/>',
  file: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/>', cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>'
};

/* =========================================================
   Ajustes, tema y paletas
   ========================================================= */
const SKEY = "graficalo.settings";
const settings = Object.assign({ theme: "auto", lang: null, tutorialDone: false }, (() => { try { return JSON.parse(localStorage.getItem(SKEY)) || {}; } catch { return {}; } })());
const saveSettings = () => { try { localStorage.setItem(SKEY, JSON.stringify(settings)); } catch {} };
function applyTheme() {
  const r = document.documentElement;
  if (settings.theme === "light" || settings.theme === "dark") r.setAttribute("data-theme", settings.theme); else r.removeAttribute("data-theme");
  const meta = $('meta[name="theme-color"]'); if (meta) meta.content = getComputedStyle(r).getPropertyValue("--sheet").trim() === "#ffffff" ? "#0e6b5c" : "#161e1b";
}
const LIGHT = { "--paper": "#f4f7f5", "--sheet": "#ffffff", "--grid": "#e1e9e5", "--ink": "#17231f", "--muted": "#5b6b65", "--accent": "#0e6b5c", "--accent-soft": "#d6ece6", "--amber": "#c47a12", "--line": "#cfdad5" };
const DARK = { "--paper": "#0f1513", "--sheet": "#161e1b", "--grid": "#1d2824", "--ink": "#e3ece8", "--muted": "#93a59e", "--accent": "#4cc3aa", "--accent-soft": "#183a33", "--amber": "#e8a646", "--line": "#2a3833" };
let THEME_OVERRIDE = null;
const css = n => (THEME_OVERRIDE && THEME_OVERRIDE[n]) || getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const PALETTES = {
  default: { name: "Gráficalo", colors: () => [css("--accent"), css("--amber"), "#5b7fd6", "#c4527a", "#6b9e3a", "#8a63c9", "#d07a4a", "#3a9bb0", "#a8892b", "#7a8794"] },
  pastel: { name: "Pastel", colors: () => ["#7fb8d6", "#f2a490", "#9fcf7d", "#c3a6d6", "#f2c96b", "#8fb0f0", "#e8a06b", "#7fd0e0"] },
  contrast: { name: "Alto contraste", colors: () => ["#0057b8", "#e66100", "#1a9850", "#d01c8b", "#6a3fb5", "#b8860b", "#00838f", "#c62828"] },
  cb: { name: "Apta para daltónicos", colors: () => ["#0072B2", "#E69F00", "#009E73", "#CC79A7", "#56B4E9", "#D55E00", "#F0E442", "#8c8c8c"] },
  gray: { name: "Escala de grises (imprimir)", colors: () => [css("--ink"), "#8a8a8a", "#bdbdbd", "#5e5e5e", "#a3a3a3", "#d4d4d4"] }
};
const palette = () => (PALETTES[cur()?.palette] || PALETTES.default).colors();
const alpha = (hex, a) => { const m = toHex(hex).replace("#", ""); const n = parseInt(m, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
function toHex(color) {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  if (/^#[0-9a-f]{3}$/i.test(color)) return "#" + color.slice(1).split("").map(x => x + x).join("");
  const c = document.createElement("canvas").getContext("2d"); c.fillStyle = color || "#000"; return c.fillStyle.startsWith("#") ? c.fillStyle : "#0e6b5c";
}

/* =========================================================
   Fechas
   ========================================================= */
const pad2 = n => String(n).padStart(2, "0");
const isoOf = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const todayISO = () => isoOf(new Date());
function parseDate(v) { // devuelve "YYYY-MM-DD" o ""
  if (v instanceof Date && !isNaN(v)) return isoOf(v);
  if (typeof v === "number" && v > 20000 && v < 80000) { const d = new Date(Math.round((v - 25569) * 864e5)); return isoOf(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }
  const s = String(v ?? "").trim(); if (!s) return "";
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return valid(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (m) { let y = +m[3]; if (y < 100) y += 2000; const [a, b] = LANG === "en" ? [+m[2], +m[1]] : [+m[1], +m[2]]; return valid(y, b, a) || valid(y, a, b); }
  if (/^\d{5}$/.test(s)) return parseDate(+s);
  return "";
  function valid(y, mo, d) { const dt = new Date(y, mo - 1, d); return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d ? isoOf(dt) : ""; }
}
const tsOf = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).getTime(); };
function fmtDate(iso, withYear) {
  if (!iso) return "";
  const d = new Date(tsOf(iso));
  return d.toLocaleDateString(LOC(), withYear ? { day: "numeric", month: "short", year: "2-digit" } : { day: "numeric", month: "short" });
}

/* =========================================================
   Proyectos y plantillas
   ========================================================= */
const defaultChart = () => ({
  id: uid(), name: "", type: "bar", series: [], one: null, x: null, y: null, model: "linear",
  title: "", xTitle: "", yTitle: "", font: "m", legend: "top", zero: true, showMean: false, showValues: false, bins: null,
  lineIds: [], countCol: LABEL, splitCol: "", countStyle: "bar", countPct: false,
  lines: [], markMax: false, markMin: false, notes: []
});
// colDefs: [nombre, fórmula, tipo] · charts: configuraciones con índices de columna
function mk(name, labelName, colDefs, rows, charts = [{}], stats = {}, extra = {}) {
  const cols = colDefs.map(([n, formula, kind]) => ({ id: uid(), name: n, kind: kind || (formula ? "formula" : "num"), formula: formula || null, color: null }));
  const id = i => (i === "label" ? LABEL : cols[i] ? cols[i].id : null);
  const p = {
    id: uid(), name, labelName, labelType: extra.labelType || "text", cols, palette: "default", filters: [],
    rows: rows.map(r => { const c = {}; cols.forEach((col, i) => { if (col.kind !== "formula" && r[i + 1] !== undefined && r[i + 1] !== "") c[col.id] = extra.raw || LANG === "es" ? String(r[i + 1]) : String(r[i + 1]).replace(/^(-?\d+),(\d+)$/, "$1.$2"); }); return { l: r[0] ?? "", c }; }),
    charts: [], activeChart: null, stats: {}
  };
  const numIdx = cols.map((c, i) => (c.kind !== "text" ? i : -1)).filter(i => i >= 0);
  charts.forEach((cfg, k) => {
    const ch = Object.assign(defaultChart(), cfg);
    ch.name = cfg.name || t("Gráfico {n}", { n: k + 1 });
    ch.series = (cfg.series || numIdx.slice(0, 1)).map(id).filter(Boolean);
    ch.one = id(cfg.one ?? (cfg.series || numIdx)[0] ?? 0);
    ch.x = id(cfg.x ?? numIdx[0] ?? 0); ch.y = id(cfg.y ?? numIdx[1] ?? numIdx[0] ?? 0);
    ch.lineIds = (cfg.lineIds || []).map(id).filter(Boolean);
    ch.countCol = cfg.countCol !== undefined ? id(cfg.countCol) : LABEL; ch.splitCol = cfg.splitCol !== undefined ? id(cfg.splitCol) : "";
    ch.notes = (cfg.notes || []).map(n => ({ label: n.label, text: n.text }));
    p.charts.push(ch);
  });
  p.activeChart = p.charts[0].id;
  Object.entries(stats).forEach(([k, v]) => (p.stats[k] = typeof v === "number" ? id(v) : v === "label" ? LABEL : v));
  return p;
}
function lastDays(n) { const out = []; for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); out.push(isoOf(d)); } return out; }
const TEMPLATES = [
  { key: "blank", name: () => t("En blanco"), desc: () => t("Una columna vacía para empezar de cero."),
    make: () => mk(t("Proyecto nuevo"), t("Etiqueta"), [[t("Valor")]], [["", ""], ["", ""], ["", ""], ["", ""], ["", ""]]) },
  { key: "notas", name: () => t("Notas de clase"), desc: () => t("Tres evaluaciones, la media y la línea de aprobado."),
    make: () => mk(t("Notas de clase"), t("Alumno"), [[t("1ª evaluación")], [t("2ª evaluación")], [t("3ª evaluación")], [t("Media"), `${t("redondear")}((A+B+C)/3; 2)`]],
      [["Ana", "6,5", "7,2", "7,8"], ["Bruno", "8", "8,4", "9"], ["Carla", "4,5", "5,8", "6,2"], ["David", "7", "6,9", "7,4"], ["Elena", "9,2", "9,5", "9,1"], ["Fran", "5,5", "6,1", "5,9"], ["Gema", "6", "7,4", "8"], ["Hugo", "3,8", "5", "5,6"]],
      [{ name: t("Por alumno"), type: "bar", series: [0, 1, 2], lines: [{ value: 5, label: t("Aprobado"), color: "" }] }, { name: t("Distribución"), type: "box", series: [0, 1, 2] }],
      { sumCol: 3, freqCol: 3, regX: 0, regY: 2, testA: 0, testB: 2, testKind: "paired" }) },
  { key: "gastos", name: () => t("Gastos del mes"), desc: () => t("Categorías, euros y porcentaje de cada una."),
    make: () => mk(t("Gastos del mes"), t("Categoría"), [[t("Euros")], [t("% del total"), `${t("redondear")}(A/${t("suma")}(A)*100; 1)`]],
      [[t("Alquiler"), "550"], [t("Comida"), "240"], [t("Transporte"), "60"], [t("Ocio"), "95"], [t("Facturas"), "110"], [t("Otros"), "45"]],
      [{ name: t("Reparto"), type: "doughnut", one: 0, showValues: true, legend: "bottom" }, { name: t("Ranking"), type: "barh", series: [0], showValues: true, markMax: true }]) },
  { key: "peso", name: () => t("Peso corporal"), desc: () => t("Apunta tu peso cada día con un toque: la fecha se pone sola."),
    make: () => mk(t("Peso corporal"), t("Fecha"), [[t("Peso (kg)")], [t("Notas"), null, "text"]], [],
      [{ name: t("Evolución"), type: "line", series: [0], zero: false, markMin: true, markMax: true }], { sumCol: 0 }, { labelType: "date" }) },
  { key: "diario", name: () => t("Registro diario"), desc: () => t("Una fila por día: peso, sueño o lo que quieras seguir."),
    make: () => { const ds = lastDays(10), w = ["72,4", "72,1", "72,3", "71,8", "71,9", "71,5", "71,6", "71,2", "71,4", "70,9"], h = ["7", "6,5", "8", "7,5", "6", "7", "8,5", "7", "6,5", "7,5"];
      return mk(t("Registro diario"), t("Fecha"), [[t("Peso (kg)")], [t("Horas de sueño")]], ds.map((d, i) => [d, w[i], h[i]]),
        [{ name: t("Peso"), type: "line", series: [0], zero: false, markMin: true, showMean: true }, { name: t("Sueño"), type: "bar", series: [1], lines: [{ value: 8, label: t("Objetivo"), color: "" }] }],
        { sumCol: 0, regX: 1, regY: 0 }, { labelType: "date" }); } },
  { key: "deporte", name: () => t("Entrenamiento"), desc: () => t("Kilómetros, minutos y ritmo, con doble eje."),
    make: () => mk(t("Entrenamiento"), t("Día"), [[t("Km")], [t("Minutos")], [t("Ritmo (min/km)"), `${t("redondear")}(B/A; 2)`]],
      [[t("Lunes"), "5", "28"], [t("Martes"), "", ""], [t("Miércoles"), "7,5", "41"], [t("Jueves"), "4", "21"], [t("Viernes"), "", ""], [t("Sábado"), "12", "70"], [t("Domingo"), "6", "33"]],
      [{ name: t("Km y ritmo"), type: "combo", series: [0, 2], lineIds: [2], showValues: true }]) },
  { key: "ventas", name: () => t("Ventas por mes"), desc: () => t("Ventas, gastos y beneficio mes a mes."),
    make: () => mk(t("Ventas por mes"), t("Mes"), [[t("Ventas")], [t("Gastos")], [t("Beneficio"), "A-B"]],
      [[t("Ene"), "1200", "800"], [t("Feb"), "1350", "820"], [t("Mar"), "1280", "900"], [t("Abr"), "1600", "950"], [t("May"), "1750", "1010"], [t("Jun"), "1900", "1100"]],
      [{ name: t("Evolución"), type: "line", series: [0, 1, 2] }, { name: t("Ventas y beneficio"), type: "combo", series: [0, 2], lineIds: [2] }], { regX: 0, regY: 2 }) },
  { key: "relacion", name: () => t("Relación entre dos variables"), desc: () => t("Dos columnas para ver si están relacionadas."),
    make: () => mk(t("Horas de estudio y nota"), t("Alumno"), [[t("Horas de estudio")], [t("Nota")]],
      [["", "2", "4,1"], ["", "4", "5,3"], ["", "5", "6,2"], ["", "7", "6,8"], ["", "8", "7,9"], ["", "10", "8,2"], ["", "3", "5"], ["", "6", "6,1"], ["", "9", "8,8"], ["", "1", "3,2"]],
      [{ name: t("Dispersión"), type: "scatter", x: 0, y: 1 }], { regX: 0, regY: 1, section: "rel" }) },
  { key: "encuesta", name: () => t("Encuesta"), desc: () => t("Respuestas de texto que se cuentan solas."),
    make: () => { const yes = t("Sí"), no = t("No"), sm = t("A veces");
      const rows = [["Ana", "1º", yes, "15"], ["Luis", "1º", sm, "16"], ["Marta", "2º", yes, "16"], ["Pablo", "2º", no, "17"], ["Sara", "1º", yes, "15"], ["Iván", "2º", sm, "17"], ["Noa", "1º", yes, "15"], ["Leo", "2º", no, "16"], ["Vera", "1º", sm, "16"], ["Hugo", "2º", yes, "17"], ["Lola", "1º", yes, "15"], ["Dani", "2º", no, "18"]];
      return mk(t("Encuesta"), t("Persona"), [[t("Curso"), null, "text"], [t("¿Te gusta la app?"), null, "text"], [t("Edad")]], rows,
        [{ name: t("Respuestas"), type: "count", countCol: 1, countStyle: "doughnut", countPct: true, legend: "bottom" }, { name: t("Por curso"), type: "count", countCol: 0, splitCol: 1, countStyle: "stacked" }],
        { sumCol: 1, freqCol: 1, crossRow: 0, crossCol: 1, testKind: "groups", testA: 2, testG: 0, section: "cross" }); } }
];
const samples = () => ["notas", "gastos", "diario", "encuesta", "relacion"].map(k => { const p = TEMPLATES.find(x => x.key === k).make(); p.name += " " + t("(ejemplo)"); return p; });

/* migraciones */
function upgradeV2(p) {
  p.cols.forEach(c => { c.kind = c.kind || (c.formula ? "formula" : "num"); });
  p.labelType = p.labelType || "text"; p.filters = p.filters || []; p.palette = p.palette || "default"; p.stats = p.stats || {};
  if (!p.charts) {
    const ch = Object.assign(defaultChart(), p.chart || {}); ch.id = uid(); ch.name = t("Gráfico {n}", { n: 1 });
    ch.lines = ch.lines || []; ch.notes = ch.notes || []; ch.lineIds = ch.lineIds || [];
    p.charts = [ch]; p.activeChart = ch.id; delete p.chart;
  }
  return p;
}
function migrateV1(old) {
  return old.projects.map(o => {
    const hasB = (o.nameB || "").trim() || o.rows.some(r => String(r[2] ?? "").trim());
    const defs = [[o.nameA || "A"]]; if (hasB) defs.push([o.nameB || "B"]);
    return mk(o.name, t("Etiqueta"), defs, o.rows.map(r => [r[0], r[1], r[2]]),
      [{ type: o.type || "bar", series: hasB ? [0, 1] : [0], showMean: !!o.showMean, showValues: !!o.showValues, bins: o.bins || null }]);
  });
}
function upgradeProject(p) { p = upgradeV2(p); p.charts.forEach(c => { Object.keys(defaultChart()).forEach(k => { if (c[k] === undefined) c[k] = defaultChart()[k]; }); }); return p; }

const KEY = "graficalo.v3";
const load = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
let state;
function initState() {
  state = load(KEY);
  if (!state || !Array.isArray(state.projects) || !state.projects.length) {
    const v2 = load("graficalo.v2"), v1 = load("graficalo.v1");
    if (v2 && Array.isArray(v2.projects) && v2.projects.length) state = { projects: v2.projects.map(upgradeProject), current: v2.current };
    else if (v1 && Array.isArray(v1.projects) && v1.projects.length) state = { projects: migrateV1(v1), current: null };
    else state = { projects: samples(), current: null };
  } else state.projects = state.projects.map(upgradeProject);
  if (!state.projects.find(p => p.id === state.current)) state.current = state.projects[0].id;
}
const cur = () => state.projects.find(p => p.id === state.current);
const saveNow = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { toast(t("No se han podido guardar los cambios: el almacenamiento está lleno.")); } };
const saveSoon = debounce(saveNow, 250);
function persist() { const p = cur(); if (p) p.updated = Date.now(); saveSoon(); trackSoon(); }
// verde si el cambio acerca al objetivo, rojo si aleja; sin objetivo, neutro
function trendClass(diff, last, c) {
  const p = cur(), first = p.cols.find(x => x.kind === "num");
  if (!diff || !Number.isFinite(p.goal) || (c && first && c !== first)) return "";
  return Math.abs(last - p.goal) < Math.abs(last - diff - p.goal) ? "up" : "down";
}

/* =========================================================
   Deshacer y rehacer
   ========================================================= */
const HIST = {};
const snapFields = ["name", "labelName", "labelType", "cols", "rows", "charts", "filters", "palette", "goal"];
const snap = p => JSON.stringify(snapFields.map(k => p[k]));
const hist = () => (HIST[state.current] = HIST[state.current] || { past: [], future: [], last: snap(cur()) });
function track() {
  const h = hist(), s = snap(cur());
  if (s === h.last) return;
  h.past.push(h.last); if (h.past.length > 80) h.past.shift();
  h.future = []; h.last = s; updateUndo();
}
const trackSoon = debounce(track, 450);
function restoreSnap(s) { const p = cur(), v = JSON.parse(s); snapFields.forEach((k, i) => (p[k] = v[i])); }
function undo() {
  track(); const h = hist(); if (!h.past.length) return;
  h.future.push(h.last); h.last = h.past.pop(); restoreSnap(h.last); afterHistory(t("Deshecho"));
}
function redo() {
  track(); const h = hist(); if (!h.future.length) return;
  h.past.push(h.last); h.last = h.future.pop(); restoreSnap(h.last); afterHistory(t("Rehecho"));
}
function afterHistory(msg) { dirty(); saveNow(); renderProjects(); renderTable(); refresh(); updateUndo(); toast(msg); }
function updateUndo() { const h = HIST[state.current]; $("#undoBtn").disabled = !h || !h.past.length; $("#redoBtn").disabled = !h || !h.future.length; }

/* =========================================================
   Datos calculados (caché)
   ========================================================= */
let cache = null;
const dirty = () => { cache = null; };
const colById = id => cur().cols.find(c => c.id === id);
const isNum = c => c && c.kind !== "text";
const numCols = () => cur().cols.filter(isNum);
function colName(c) { if (c === LABEL) return cur().labelName || t("Etiqueta"); return c ? c.name || L(cur().cols.indexOf(c)) : "—"; }
const nameOf = id => (id === LABEL ? colName(LABEL) : colName(colById(id)));
function colColor(c) { const p = cur(), i = p.cols.indexOf(c), pal = palette(); return (c && c.color) || pal[Math.max(0, i) % pal.length]; }
function validId(id, fallbackIdx = 0, onlyNum = true) {
  const list = onlyNum ? numCols() : cur().cols;
  return list.some(c => c.id === id) ? id : (list[fallbackIdx] || list[0] || {}).id;
}
function labelText(p, i) {
  const l = String(p.rows[i].l ?? "").trim();
  if (p.labelType === "date") return l ? fmtDate(l, data.multiYear) : `#${i + 1}`;
  return l || `#${i + 1}`;
}
function data() {
  const p = cur();
  if (cache && cache.p === p) return cache;
  const raw = p.rows.map(r => p.cols.map(c => r.c[c.id] ?? ""));
  const { values, errors } = S.computeTable(p.cols.map(c => ({ formula: c.kind === "formula" ? c.formula : null })), raw);
  const byId = {}, errById = {}, txt = {};
  p.cols.forEach((c, j) => { byId[c.id] = values[j]; errById[c.id] = errors[j]; if (c.kind === "text") txt[c.id] = p.rows.map(r => String(r.c[c.id] ?? "").trim()); });
  const inputs = p.cols.filter(c => c.kind !== "formula"), base = inputs.length ? inputs : p.cols;
  const has = i => base.some(c => (c.kind === "text" ? txt[c.id][i] !== "" : Number.isFinite(byId[c.id][i])));
  const allIdx = p.rows.map((_, i) => i).filter(has);
  const pass = i => (p.filters || []).every(f => passFilter(p, i, f, byId, txt));
  const rowIdx = allIdx.filter(pass);
  if (p.labelType === "date") { const ys = new Set(rowIdx.map(i => String(p.rows[i].l).slice(0, 4)).filter(Boolean)); data.multiYear = ys.size > 1; }
  const labels = rowIdx.map(i => labelText(p, i));
  const catOf = (id, i) => {
    if (id === LABEL) return p.labelType === "date" ? String(p.rows[i].l || "") : String(p.rows[i].l ?? "").trim();
    const c = colById(id); if (!c) return "";
    if (c.kind === "text") return txt[id][i];
    const v = byId[id][i]; return Number.isFinite(v) ? fmt(v, 4) : "";
  };
  return (cache = {
    p, byId, errById, txt, rowIdx, allIdx, labels, pass,
    ts: p.labelType === "date" ? rowIdx.map(i => (p.rows[i].l ? tsOf(p.rows[i].l) : NaN)) : null,
    series: id => rowIdx.map(i => (Number.isFinite(byId[id]?.[i]) ? byId[id][i] : null)),
    vals: id => rowIdx.map(i => byId[id]?.[i]).filter(Number.isFinite),
    cat: id => rowIdx.map(i => catOf(id, i)),
    catDisplay: (id, k) => (id === LABEL && p.labelType === "date" && k ? fmtDate(k, true) : k)
  });
}
const filtered = () => (cur().filters || []).length > 0;

/* filtros */
const OPS = { eq: "=", ne: "≠", gt: ">", ge: "≥", lt: "<", le: "≤", has: () => t("contiene"), empty: () => t("está vacío"), full: () => t("no está vacío") };
const opLabel = o => (typeof OPS[o] === "function" ? OPS[o]() : OPS[o]);
function passFilter(p, i, f, byId, txt) {
  let raw, num;
  if (f.col === LABEL) { raw = String(p.rows[i].l ?? "").trim(); num = p.labelType === "date" ? NaN : S.parseNum(raw); }
  else { const c = p.cols.find(x => x.id === f.col); if (!c) return true; if (c.kind === "text") { raw = txt[c.id][i]; num = S.parseNum(raw); } else { num = byId[c.id][i]; raw = Number.isFinite(num) ? String(num) : ""; } }
  if (f.op === "empty") return raw === "";
  if (f.op === "full") return raw !== "";
  const val = String(f.val ?? "").trim();
  if (f.op === "has") return raw.toLowerCase().includes(val.toLowerCase());
  let a, b;
  const isDate = f.col === LABEL && p.labelType === "date";
  if (isDate) { a = raw; b = parseDate(val) || val; }
  else { const vb = S.parseNum(val); if (Number.isFinite(num) && Number.isFinite(vb)) { a = num; b = vb; } else { a = raw.toLowerCase(); b = val.toLowerCase(); } }
  if (a === "" && f.op !== "ne") return false;
  switch (f.op) { case "eq": return a === b; case "ne": return a !== b; case "gt": return a > b; case "ge": return a >= b; case "lt": return a < b; case "le": return a <= b; }
  return true;
}

/* =========================================================
   Cabecera: proyectos
   ========================================================= */
function renderProjects() {
  $("#projectSel").innerHTML = state.projects.map(p => `<option value="${p.id}" ${p.id === state.current ? "selected" : ""}>${esc(p.name)}</option>`).join("");
}
$("#projectSel").addEventListener("change", e => { track(); state.current = e.target.value; hist(); dirty(); saveNow(); renderAll(); });
function addProject(p) { track(); state.projects.push(p); state.current = p.id; hist(); dirty(); saveNow(); renderAll(); }
$("#newProject").addEventListener("click", () => {
  openSheet(`<h3>${t("Nuevo proyecto")}</h3><p class="hint">${t("Elige una plantilla. Las que traen datos los tienen de ejemplo: cámbialos por los tuyos.")}</p>
    <div class="tpls">${TEMPLATES.map(x => `<button data-act="tpl:${x.key}"><b>${esc(x.name())}</b><small>${esc(x.desc())}</small></button>`).join("")}</div>
    <div class="actions"><button class="btn ghost" data-act="close">${t("Cancelar")}</button></div>`,
  act => {
    if (!act.startsWith("tpl:")) return;
    const x = TEMPLATES.find(y => y.key === act.slice(4)), p = x.make();
    let n = 2; const base = p.name; while (state.projects.some(q => q.name === p.name)) p.name = `${base} ${n++}`;
    addProject(p); closeSheet(); showView("view-data");
    setTimeout(() => $("#tbody input")?.focus(), 80);
  });
});
$("#undoBtn").addEventListener("click", undo);
$("#redoBtn").addEventListener("click", redo);
document.addEventListener("keydown", e => {
  if (!(e.ctrlKey || e.metaKey) || !$("#sheet").hidden) return;
  const ed = e.target.closest?.("input,textarea,select,[contenteditable]");
  if (ed) return;
  const k = e.key.toLowerCase();
  if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
  else if (k === "y" || (k === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
});

/* =========================================================
   Menú principal
   ========================================================= */
$("#menuBtn").addEventListener("click", openMenu);
function menuItem(act, icon, label, sub, cls = "") { return `<button data-act="${act}" class="${cls}">${ICON(icon)}<span>${label}${sub ? `<small>${sub}</small>` : ""}</span></button>`; }
function openMenu() {
  const p = cur();
  openSheet(`<h3>${t("Menú")}</h3>
    <div class="label">${t("Proyecto")} · ${esc(p.name)}</div>
    <div class="menulist">
      ${menuItem("rename", IC.edit, t("Renombrar"))}
      ${menuItem("dup", IC.copy, t("Duplicar"))}
      ${menuItem("pdf", IC.pdf, t("Informe en PDF"), t("Gráficos, estadísticas y datos, listo para entregar"))}
      ${menuItem("xlsx", IC.xls, t("Exportar a Excel"))}
      ${menuItem("link", IC.link, t("Compartir proyecto"), t("Crea un enlace con los datos dentro"))}
      ${menuItem("tsv", IC.paste, t("Copiar datos (para pegar en Excel)"))}
      ${menuItem("clear", IC.clear, t("Vaciar datos"))}
      ${menuItem("delete", IC.clear, t("Borrar proyecto"), "", "danger")}
    </div>
    <div class="label">${t("App")}</div>
    <div class="menulist">
      ${menuItem("backup", IC.save, t("Guardar copia de seguridad"), t("Todos tus proyectos en un archivo"))}
      ${menuItem("restore", IC.restore, t("Restaurar copia de seguridad"))}
      ${menuItem("settings", IC.sun, t("Tema e idioma"))}
      ${menuItem("tutorial", IC.help, t("Ver el tutorial"))}
      ${menuItem("about", IC.info, t("Acerca de Gráficalo"))}
    </div>
    <div class="actions"><button class="btn ghost" data-act="close">${t("Cerrar")}</button></div>`,
  act => {
    if (act === "rename") renameSheet();
    if (act === "dup") { const c = JSON.parse(JSON.stringify(p)); c.id = uid(); c.name = p.name + " " + t("(copia)"); addProject(c); closeSheet(); toast(t("Proyecto duplicado")); }
    if (act === "pdf") pdfSheet();
    if (act === "xlsx") exportExcel();
    if (act === "link") shareProjectLink();
    if (act === "tsv") copyText(toTSV()).then(ok => toast(ok ? t("Datos copiados. Pégalos en Excel o Sheets.") : t("No se pudo copiar")));
    if (act === "clear") confirmSheet(t("Vaciar datos"), t("Se borrarán todos los valores de la tabla. Las columnas y los gráficos se mantienen. Puedes deshacerlo."), t("Vaciar"), () => {
      p.rows = Array.from({ length: 5 }, () => ({ l: "", c: {} })); p.filters = []; dirty(); persist(); renderAll(); toast(t("Datos vaciados"));
    });
    if (act === "delete") confirmSheet(t("Borrar proyecto"), t("¿Borrar «{name}» y todos sus datos? No se puede deshacer.", { name: p.name }), t("Borrar"), () => {
      delete HIST[p.id];
      state.projects = state.projects.filter(x => x.id !== p.id);
      if (!state.projects.length) state.projects = samples();
      state.current = state.projects[0].id; hist(); dirty(); saveNow(); renderAll(); toast(t("Proyecto borrado"));
    });
    if (act === "backup") backupSheet();
    if (act === "restore") $("#backupIn").click();
    if (act === "settings") settingsSheet();
    if (act === "tutorial") { closeSheet(); showOnboarding(); }
    if (act === "about") aboutSheet();
  });
}
function renameSheet() {
  const p = cur();
  openSheet(`<h3>${t("Renombrar proyecto")}</h3><div class="field"><label class="label" for="renameIn">${t("Nombre")}</label><input type="text" id="renameIn" value="${esc(p.name)}"></div>
    <div class="actions"><button class="btn ghost" data-act="close">${t("Cancelar")}</button><button class="btn primary" data-act="ok">${t("Guardar")}</button></div>`,
  act => { if (act === "ok") { p.name = $("#renameIn").value.trim() || p.name; persist(); renderProjects(); renderChartTitle(); renderPanel(); closeSheet(); } });
  setTimeout(() => $("#renameIn").select(), 60);
}
function confirmSheet(title, text, okLabel, fn) {
  openSheet(`<h3>${esc(title)}</h3><p>${esc(text)}</p><div class="actions"><button class="btn ghost" data-act="close">${t("Cancelar")}</button><button class="btn danger" data-act="ok">${esc(okLabel)}</button></div>`,
    act => { if (act === "ok") { closeSheet(); fn(); } });
}
function settingsSheet() {
  const seg = (k, opts) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button data-act="${k}:${v}" aria-pressed="${(settings[k] || "auto") === v}">${l}</button>`).join("")}</div>`;
  openSheet(`<h3>${t("Tema e idioma")}</h3>
    <div class="setrow"><span>${t("Tema")}</span>${seg("theme", [["auto", t("Automático")], ["light", t("Claro")], ["dark", t("Oscuro")]])}</div>
    <div class="setrow"><span>${t("Idioma")}</span><div class="seg" role="group"><button data-act="lang:es" aria-pressed="${LANG === "es"}">Español</button><button data-act="lang:en" aria-pressed="${LANG === "en"}">English</button></div></div>
    <div class="actions"><button class="btn primary" data-act="close">${t("Hecho")}</button></div>`,
  act => {
    const [k, v] = act.split(":");
    if (k === "theme") { settings.theme = v; saveSettings(); applyTheme(); renderTable(); refresh(); settingsSheet(); }
    if (k === "lang") { settings.lang = v; saveSettings(); setLang(v); settingsSheet(); }
  });
}
function setLang(v) {
  LANG = v; S.setLocale({ decimalComma: v === "es" }); document.documentElement.lang = v;
  translateStatic(); dirty(); renderAll();
}
function translateStatic() {
  $$("[data-t]").forEach(el => (el.textContent = t(el.dataset.t)));
  $$("[data-t-title]").forEach(el => { el.title = t(el.dataset.tTitle); el.setAttribute("aria-label", t(el.dataset.tTitle)); });
  $$("[data-t-aria]").forEach(el => el.setAttribute("aria-label", t(el.dataset.tAria)));
  $("#addRow").innerHTML = ICON(IC.plus) + t("Fila");
  $("#addToday").innerHTML = ICON(IC.cal) + t("Hoy");
  $("#addCol").innerHTML = ICON(IC.col) + t("Columna");
  $("#sortBtn").innerHTML = ICON(IC.sort) + t("Ordenar y filtrar");
  $("#importBtn").innerHTML = ICON(IC.imp) + t("Importar");
  $("#copyStats").textContent = t("Copiar todo");
  $("#zoomReset").textContent = t("Restablecer zoom"); $("#fsReset").textContent = t("Restablecer zoom");
  $("#fsHint").textContent = t("Pellizca para ampliar y arrastra para moverte.");
}
function aboutSheet() {
  openSheet(`<h3>${t("Acerca de Gráficalo")}</h3>
    <p>${t("Versión {v}. Gratis, sin anuncios y sin registro. Tus datos se guardan solo en este dispositivo.", { v: APP_VERSION })}</p>
    <p class="hint">${t("Hecho con software libre: Chart.js, chartjs-plugin-zoom y Hammer.js (MIT), SheetJS (Apache 2.0), jsPDF y jsPDF-AutoTable (MIT) y Tesseract.js (Apache 2.0).")}</p>
    <p class="hint"><a href="privacidad.html" target="_blank" rel="noopener" style="color:var(--accent)">${t("Política de privacidad")}</a></p>
    <div class="actions"><button class="btn primary" data-act="close">${t("Cerrar")}</button></div>`, () => {});
}
const APP_VERSION = "3.1";

/* =========================================================
   Tabla de datos
   ========================================================= */
function renderTable() {
  const p = cur(), d = data(), inSet = new Set(d.rowIdx);
  const lt = p.labelType === "date";
  $("#thead").innerHTML = `<tr><th class="num-col">#</th>
    <th><button class="colhead" data-col="${LABEL}" title="${t("Editar columna")}"><span class="l">${lt ? t("Fecha") : t("Etiqueta")}</span><span class="n">${esc(colName(LABEL))}</span></button></th>
    ${p.cols.map((c, j) => `<th><button class="colhead" data-col="${c.id}" title="${t("Editar columna")}"><span class="l"><i style="background:${c.kind === "text" ? "transparent;border:1px solid var(--muted)" : colColor(c)}"></i>${L(j)}${c.kind === "formula" ? " · ƒ" : c.kind === "text" ? " · Aa" : ""}${d.errById[c.id] && c.kind === "formula" ? ' <b class="warn">!</b>' : ""}</span><span class="n">${esc(c.name || L(j))}</span></button></th>`).join("")}
    <th><button class="addcol" id="addColHead" title="${t("Añadir columna")}" aria-label="${t("Añadir columna")}">＋</button></th></tr>`;
  $("#tbody").innerHTML = p.rows.map((r, i) => `<tr data-i="${i}" class="${filtered() && d.allIdx.includes(i) && !inSet.has(i) ? "out" : ""}"><td class="num-col">${i + 1}</td>
    <td>${lt ? `<input type="date" id="c${i}_l" data-k="l" value="${esc(r.l)}" aria-label="${t("Fecha")} ${i + 1}">` : `<input type="text" id="c${i}_l" data-k="l" value="${esc(r.l)}" aria-label="${t("Etiqueta")} ${i + 1}">`}</td>
    ${p.cols.map(c => c.kind === "formula"
      ? `<td class="calc${d.errById[c.id] ? " err" : ""}" data-fc="${c.id}" data-r="${i}">${d.errById[c.id] ? "!" : fmtSig(d.byId[c.id][i])}</td>`
      : c.kind === "text"
        ? `<td><input type="text" id="c${i}_${c.id}" data-k="${c.id}" list="dl_${c.id}" value="${esc(r.c[c.id] ?? "")}" aria-label="${esc(c.name)} ${i + 1}"></td>`
        : `<td><input type="text" inputmode="decimal" class="num" id="c${i}_${c.id}" data-k="${c.id}" value="${esc(r.c[c.id] ?? "")}" aria-label="${esc(c.name)} ${i + 1}"></td>`).join("")}
    <td><button class="del" data-del="${i}" aria-label="${t("Borrar fila")} ${i + 1}">×</button></td></tr>`).join("");
  renderDatalists();
  $("#addToday").hidden = !lt;
  updateCount(); renderFilterBar();
}
function renderDatalists() {
  const p = cur();
  $("#dlists").outerHTML = `<div id="dlists">${p.cols.filter(c => c.kind === "text").map(c => {
    const vals = [...new Set(p.rows.map(r => String(r.c[c.id] ?? "").trim()).filter(Boolean))].slice(0, 50);
    return `<datalist id="dl_${c.id}">${vals.map(v => `<option value="${esc(v)}">`).join("")}</datalist>`;
  }).join("")}</div>`;
}
function updateCalcCells() {
  const d = data();
  $$("#tbody td[data-fc]").forEach(td => { const id = td.dataset.fc, v = d.byId[id]?.[+td.dataset.r]; td.textContent = d.errById[id] ? "!" : fmtSig(v); });
  if (filtered()) { const inSet = new Set(d.rowIdx); $$("#tbody tr").forEach(tr => { const i = +tr.dataset.i; tr.classList.toggle("out", d.allIdx.includes(i) && !inSet.has(i)); }); }
}
function updateCount() {
  const d = data(), n = d.rowIdx.length;
  $("#rowCount").textContent = filtered() ? t("{n} de {m} filas", { n, m: d.allIdx.length }) : n === 1 ? t("1 fila con datos") : t("{n} filas con datos", { n });
  ["#chartFiltered", "#statsFiltered", "#panelFiltered"].forEach(s => { const el = $(s); el.hidden = !filtered(); el.textContent = t("Filtrado: {n} de {m}", { n, m: d.allIdx.length }); });
}
function renderFilterBar() {
  const p = cur(), bar = $("#filterBar");
  if (!filtered()) { bar.hidden = true; return; }
  bar.hidden = false;
  bar.innerHTML = `<span>${ICON(IC.sort).replace("<svg", '<svg width="16" height="16" style="vertical-align:-3px"')} <b>${t("Filtro activo")}</b>: ${p.filters.map(f => `${esc(nameOf(f.col))} ${esc(opLabel(f.op))} ${f.op === "empty" || f.op === "full" ? "" : esc(f.val)}`).join(" · ")}</span>
    <span class="grp"><button class="btn small" data-fb="edit">${t("Editar")}</button><button class="btn small" data-fb="clear">${t("Quitar")}</button></span>`;
}
$("#filterBar").addEventListener("click", e => {
  const b = e.target.closest("[data-fb]"); if (!b) return;
  if (b.dataset.fb === "edit") sortFilterSheet();
  else { cur().filters = []; dirty(); persist(); renderTable(); refresh(); toast(t("Filtro quitado")); }
});
$("#thead").addEventListener("click", e => {
  const b = e.target.closest("[data-col]"); if (b) return b.dataset.col === LABEL ? openLabelColumn() : openColumn(b.dataset.col);
  if (e.target.closest("#addColHead")) addColumn();
});
const refreshSoon = debounce(() => refresh(), 220);
$("#tbody").addEventListener("input", e => {
  const tr = e.target.closest("tr"); if (!tr) return;
  const r = cur().rows[+tr.dataset.i], k = e.target.dataset.k;
  if (k === "l") r.l = e.target.value; else if (e.target.value === "") delete r.c[k]; else r.c[k] = e.target.value;
  dirty(); persist(); updateCalcCells(); updateCount(); refreshSoon();
});
$("#tbody").addEventListener("change", e => { if (e.target.list) renderDatalists(); });
$("#tbody").addEventListener("keydown", e => {
  if (e.key !== "Enter" || !e.target.dataset.k) return;
  e.preventDefault();
  const i = +e.target.closest("tr").dataset.i, k = e.target.dataset.k;
  if (i === cur().rows.length - 1) { cur().rows.push({ l: "", c: {} }); dirty(); renderTable(); }
  document.getElementById(`c${i + 1}_${k}`)?.focus();
});
$("#tbody").addEventListener("click", e => {
  const d = e.target.closest("[data-del]"); if (!d) return;
  cur().rows.splice(+d.dataset.del, 1); if (!cur().rows.length) cur().rows.push({ l: "", c: {} });
  dirty(); persist(); renderTable(); refresh();
  toast(t("Fila borrada"), t("Deshacer"), undo);
});
function addRowAndFocus(label = "") {
  cur().rows.push({ l: label, c: {} }); dirty(); persist(); renderTable();
  const w = $("#tablewrap"); w.scrollTop = w.scrollHeight;
  const i = cur().rows.length - 1, first = cur().cols.find(c => c.kind !== "formula");
  document.getElementById(label && first ? `c${i}_${first.id}` : `c${i}_l`)?.focus();
}
$("#addRow").addEventListener("click", () => addRowAndFocus(""));
$("#addToday").addEventListener("click", () => {
  const p = cur(), today = todayISO(), ex = p.rows.findIndex(r => r.l === today);
  if (ex >= 0) { const first = p.cols.find(c => c.kind !== "formula"); document.getElementById(`c${ex}_${first ? first.id : "l"}`)?.focus(); toast(t("Ya hay una fila de hoy")); return; }
  const empty = p.rows.findIndex(r => !r.l && !Object.keys(r.c).length);
  if (empty >= 0) { p.rows.splice(empty, 1); }
  addRowAndFocus(today);
});
$("#addCol").addEventListener("click", () => addColumn());
function addColumn() {
  const p = cur(), c = { id: uid(), name: t("Serie {l}", { l: L(p.cols.length) }), kind: "num", formula: null, color: null };
  p.cols.push(c);
  const ch = activeChart(); if (ch && ["bar", "barh", "stacked", "line", "area", "radar", "box", "combo"].includes(ch.type)) ch.series.push(c.id);
  dirty(); persist(); renderTable(); refresh(); openColumn(c.id, true);
}

/* reescribe las letras de las fórmulas cuando se mueven o borran columnas */
function remapFormulas(p, map) {
  p.cols.forEach(c => {
    if (c.kind !== "formula" || !c.formula) return;
    c.formula = c.formula.replace(/\b([A-Z]{1,2})\b(?!\s*\()/g, m => { const o = S.letterIndex(m), n = map[o]; return n === undefined ? m : n < 0 ? "#" : L(n); });
  });
}
function openColumn(id, isNew = false) {
  const p = cur(), c = colById(id), j = p.cols.indexOf(c);
  const letters = p.cols.map((_, k) => L(k)).filter((_, k) => k !== j && p.cols[k].kind !== "text");
  const a = letters[0] || "A", b = letters[1] || a, sep = LANG === "es" ? ";" : ",";
  const ex = [`${a}+${b}`, `${a}-${b}`, `(${a}+${b})/2`, `${a}/${t("suma")}(${a})*100`, `${t("redondear")}(${a}${sep} 1)`, `${a}-${t("media")}(${a})`, `${t("si")}(${a}>=5${sep} 1${sep} 0)`];
  let kind = c.kind, autoColor = !c.color;
  openSheet(`<h3>${t("Columna {l}", { l: L(j) })}</h3>
    <div class="row2">
      <div class="field"><label class="label" for="colName">${t("Nombre")}</label><input type="text" id="colName" value="${esc(c.name)}"></div>
      <div class="field"><label class="label" for="colColor">${t("Color")}</label><div style="display:flex;gap:8px;align-items:center"><input type="color" id="colColor" value="${toHex(colColor(c))}"><button class="btn small ghost" data-act="autocolor">${t("Automático")}</button></div></div>
    </div>
    <div class="field"><span class="label">${t("Contenido")}</span>
      <div class="seg" role="group" id="kindSeg"><button data-act="kind:num" aria-pressed="${kind === "num"}">${t("Números")}</button><button data-act="kind:text" aria-pressed="${kind === "text"}">${t("Texto")}</button><button data-act="kind:formula" aria-pressed="${kind === "formula"}">${t("Fórmula")}</button></div>
      <p class="hint" id="kindHint"></p></div>
    <div id="fBox" ${kind !== "formula" ? "hidden" : ""} class="field">
      <label class="label" for="colFormula">${t("Fórmula (usa las letras de las columnas)")}</label>
      <input type="text" id="colFormula" value="${esc(c.formula || "")}" placeholder="${esc(ex[2])}" autocomplete="off" autocapitalize="characters" spellcheck="false" style="font-family:var(--mono)">
      <p id="fMsg" class="hint"></p>
      <div class="examples">${ex.map(x => `<button data-act="ex:${esc(x)}">${esc(x)}</button>`).join("")}</div>
      <details class="help"><summary>${t("¿Qué puedo escribir?")}</summary><ul>
        <li>${t("Letras de columna: {a} y números", { a: "<code>A</code>, <code>B</code>…" })}</li>
        <li>${t("Operaciones:")} <code>+ - * / ^</code> ${t("y paréntesis")}</li>
        <li>${t("Por fila:")} <code>${t("redondear")}(x${sep} n)</code>, <code>${t("raiz")}(x)</code>, <code>abs(x)</code>, <code>ln(x)</code>, <code>log(x)</code>, <code>exp(x)</code>, <code>${t("pot")}(x${sep} n)</code>, <code>min(…)</code>, <code>max(…)</code>, <code>${t("si")}(${t("condición")}${sep} ${t("sí")}${sep} no)</code></li>
        <li>${t("De toda la columna:")} <code>${t("suma")}(A)</code>, <code>${t("media")}(A)</code>, <code>${t("mediana")}(A)</code>, <code>${t("desv")}(A)</code>, <code>${t("contar")}(A)</code>, <code>min(A)</code>, <code>max(A)</code></li>
        <li>${t("Separa los argumentos con {s}", { s: `<code>${sep}</code>` })}</li></ul></details>
    </div>
    <div class="actions" style="justify-content:space-between">
      <div style="display:flex;gap:6px">
        <button class="btn small" data-act="left" ${j === 0 ? "disabled" : ""} aria-label="${t("Mover a la izquierda")}">◀</button>
        <button class="btn small" data-act="right" ${j === p.cols.length - 1 ? "disabled" : ""} aria-label="${t("Mover a la derecha")}">▶</button>
        <button class="btn small danger" data-act="del" ${p.cols.length < 2 ? "disabled" : ""}>${t("Borrar")}</button>
      </div>
      <div style="display:flex;gap:6px"><button class="btn ghost" data-act="close">${t("Cancelar")}</button><button class="btn primary" data-act="save">${t("Guardar")}</button></div>
    </div>`,
  act => {
    if (act.startsWith("kind:")) {
      kind = act.slice(5);
      $$("#kindSeg button").forEach(x => x.setAttribute("aria-pressed", x.dataset.act === act));
      $("#fBox").hidden = kind !== "formula"; kindHint(); if (kind === "formula") { $("#colFormula").focus(); check(); }
    }
    if (act.startsWith("ex:")) { $("#colFormula").value = act.slice(3); check(); }
    if (act === "autocolor") { const prev = c.color; c.color = null; $("#colColor").value = toHex(colColor(c)); c.color = prev; autoColor = true; }
    if (act === "save") {
      c.name = $("#colName").value.trim() || L(j);
      c.color = autoColor ? null : $("#colColor").value;
      if (kind === "formula") {
        const f = $("#colFormula").value.trim();
        if (!f) { $("#fMsg").className = "err"; $("#fMsg").textContent = t("Escribe una fórmula o elige otro tipo de contenido."); return; }
        c.formula = f;
      } else c.formula = null;
      c.kind = kind;
      if (kind === "text") p.charts.forEach(ch => { ch.series = ch.series.filter(s => s !== id); ch.lineIds = ch.lineIds.filter(s => s !== id); });
      dirty(); persist(); renderTable(); refresh(); closeSheet();
    }
    if (act === "left" || act === "right") {
      const k = act === "left" ? j - 1 : j + 1, map = {}; p.cols.forEach((_, i) => (map[i] = i)); map[j] = k; map[k] = j;
      [p.cols[j], p.cols[k]] = [p.cols[k], p.cols[j]]; remapFormulas(p, map);
      dirty(); persist(); renderTable(); refresh(); openColumn(id);
    }
    if (act === "del") confirmSheet(t("Borrar columna"), t("Se borrará la columna {l} y sus datos. Las fórmulas que la usen dejarán de funcionar. Puedes deshacerlo.", { l: L(j) }), t("Borrar columna"), () => {
      const map = {}; p.cols.forEach((_, i) => (map[i] = i < j ? i : i === j ? -1 : i - 1));
      p.cols.splice(j, 1); p.rows.forEach(r => delete r.c[id]); remapFormulas(p, map);
      p.charts.forEach(ch => { ch.series = ch.series.filter(s => s !== id); ch.lineIds = ch.lineIds.filter(s => s !== id); });
      dirty(); persist(); renderTable(); refresh(); toast(t("Columna borrada"), t("Deshacer"), undo);
    });
  });
  const kindHint = () => { $("#kindHint").textContent = kind === "num" ? t("Valores numéricos para gráficos y estadísticas.") : kind === "text" ? t("Categorías o respuestas (Sí / No, curso, color…). Se cuentan en gráficos de recuento y tablas cruzadas.") : t("Se calcula sola a partir de otras columnas."); };
  kindHint();
  $("#colColor").addEventListener("input", () => { autoColor = false; });
  const check = () => {
    const f = $("#colFormula").value.trim(), msg = $("#fMsg");
    if (!f) { msg.className = "hint"; msg.textContent = t("Ejemplo: {e}", { e: ex[2] }); return; }
    try {
      const comp = S.compileFormula(f, p.cols.length);
      if (comp.deps.includes(j)) throw new Error(t("La fórmula no puede usar su propia columna."));
      const trial = p.cols.map((k, i) => ({ formula: i === j ? f : k.kind === "formula" ? k.formula : null }));
      const res = S.computeTable(trial, p.rows.map(r => p.cols.map(k => r.c[k.id] ?? "")));
      if (res.errors[j]) throw new Error(res.errors[j]);
      const ok = res.values[j].filter(Number.isFinite);
      msg.className = "ok"; msg.textContent = ok.length ? "✓ " + ok.slice(0, 4).map(fmtSig).join(" · ") + (ok.length > 4 ? " …" : "") : t("✓ Fórmula correcta (aún no hay valores)");
    } catch (err) { msg.className = "err"; msg.textContent = tErr(err.message); }
  };
  $("#colFormula").addEventListener("input", check);
  if (kind === "formula") check();
  if (isNew) setTimeout(() => $("#colName").select(), 60);
}
function openLabelColumn() {
  const p = cur(); let type = p.labelType;
  const bad = () => p.rows.filter(r => String(r.l ?? "").trim() && !parseDate(r.l)).length;
  openSheet(`<h3>${t("Columna de etiquetas")}</h3>
    <div class="field"><label class="label" for="lblName">${t("Nombre")}</label><input type="text" id="lblName" value="${esc(p.labelName)}"></div>
    <div class="field"><span class="label">${t("Tipo")}</span><div class="seg" role="group" id="lblSeg"><button data-act="t:text" aria-pressed="${type === "text"}">${t("Texto")}</button><button data-act="t:date" aria-pressed="${type === "date"}">${t("Fecha")}</button></div>
    <p class="hint" id="lblHint"></p></div>
    <div class="actions"><button class="btn ghost" data-act="close">${t("Cancelar")}</button><button class="btn primary" data-act="save">${t("Guardar")}</button></div>`,
  act => {
    if (act.startsWith("t:")) { type = act.slice(2); $$("#lblSeg button").forEach(x => x.setAttribute("aria-pressed", x.dataset.act === act)); hint(); }
    if (act === "save") {
      p.labelName = $("#lblName").value.trim() || t("Etiqueta");
      if (type !== p.labelType) {
        if (type === "date") p.rows.forEach(r => { r.l = parseDate(r.l); });
        else p.rows.forEach(r => { if (r.l) r.l = fmtDate(r.l, true); });
        p.labelType = type;
      }
      dirty(); persist(); renderTable(); refresh(); closeSheet();
    }
  });
  const hint = () => {
    const n = bad();
    $("#lblHint").innerHTML = type === "date"
      ? esc(t("Cada fila es un día. Los gráficos de líneas y áreas respetan la distancia entre fechas y aparece el botón «Hoy».")) + (p.labelType !== "date" && n ? ` <b class="warn">${esc(t("{n} etiquetas no son fechas y se quedarán vacías.", { n }))}</b>` : "")
      : esc(t("Nombres, categorías o lo que quieras."));
  };
  hint();
}

/* ordenar y filtrar */
$("#sortBtn").addEventListener("click", () => sortFilterSheet());
function catCols() { return [{ id: LABEL, name: colName(LABEL) }, ...cur().cols.map(c => ({ id: c.id, name: colName(c) }))]; }
function sortFilterSheet() {
  const p = cur(); const fs = JSON.parse(JSON.stringify(p.filters || []));
  const colOpts = sel => catCols().map(c => `<option value="${c.id}" ${c.id === sel ? "selected" : ""}>${esc(c.name)}</option>`).join("");
  const opOpts = sel => Object.keys(OPS).map(o => `<option value="${o}" ${o === sel ? "selected" : ""}>${esc(opLabel(o))}</option>`).join("");
  const draw = () => {
    openSheet(`<h3>${t("Ordenar y filtrar")}</h3>
      <h4>${t("Ordenar filas")}</h4>
      <div class="sel-row"><select id="sortCol">${colOpts(LABEL)}</select>
        <div class="seg" role="group"><button data-act="sort:asc">${t("Ascendente")}</button><button data-act="sort:desc">${t("Descendente")}</button></div></div>
      <p class="hint">${t("Cambia el orden de la tabla. Puedes deshacerlo.")}</p>
      <h4>${t("Filtrar")}</h4>
      <p class="hint">${t("Los gráficos y las estadísticas usan solo las filas que cumplen todas las condiciones.")}</p>
      <div class="listrows" id="fRows">${fs.map((f, i) => `<div class="listrow" data-i="${i}"><select data-f="col">${colOpts(f.col)}</select><select data-f="op" style="flex:0 0 auto">${opOpts(f.op)}</select><input type="text" data-f="val" value="${esc(f.val ?? "")}" ${f.op === "empty" || f.op === "full" ? "hidden" : ""} placeholder="${t("valor")}"><button class="x" data-act="rm:${i}" aria-label="${t("Quitar")}">×</button></div>`).join("") || `<p class="hint">${t("Sin condiciones.")}</p>`}</div>
      <div class="actions" style="justify-content:space-between"><button class="btn small" data-act="addf">${ICON(IC.plus)}${t("Añadir condición")}</button>
        <div class="grp"><button class="btn ghost" data-act="clearf" ${fs.length ? "" : "disabled"}>${t("Quitar filtros")}</button><button class="btn primary" data-act="apply">${t("Aplicar")}</button></div></div>`,
    act => {
      if (act.startsWith("sort:")) {
        const id = $("#sortCol").value, dir = act === "sort:asc" ? 1 : -1, d = data();
        const key = i => { if (id === LABEL) return String(p.rows[i].l ?? ""); const c = colById(id); return c.kind === "text" ? d.txt[id][i] : d.byId[id][i]; };
        const idx = p.rows.map((_, i) => i).sort((x, y) => {
          const a = key(x), b = key(y), ea = a === "" || a === undefined || (typeof a === "number" && !Number.isFinite(a)), eb = b === "" || b === undefined || (typeof b === "number" && !Number.isFinite(b));
          if (ea || eb) return ea - eb;
          return (typeof a === "number" && typeof b === "number" ? a - b : S.keyCmp(a, b)) * dir;
        });
        p.rows = idx.map(i => p.rows[i]); dirty(); persist(); renderTable(); refresh(); closeSheet(); toast(t("Filas ordenadas"), t("Deshacer"), undo);
      }
      if (act === "addf") { read(); fs.push({ col: LABEL, op: "eq", val: "" }); draw(); }
      if (act.startsWith("rm:")) { read(); fs.splice(+act.slice(3), 1); draw(); }
      if (act === "clearf") { p.filters = []; dirty(); persist(); renderTable(); refresh(); closeSheet(); toast(t("Filtro quitado")); }
      if (act === "apply") { read(); p.filters = fs.filter(f => f.op === "empty" || f.op === "full" || String(f.val).trim() !== ""); dirty(); persist(); renderTable(); refresh(); closeSheet(); if (p.filters.length) toast(t("Filtro aplicado: {n} filas", { n: data().rowIdx.length })); }
    });
    $$("#fRows [data-f=op]").forEach(s => s.addEventListener("change", () => { s.parentElement.querySelector("[data-f=val]").hidden = s.value === "empty" || s.value === "full"; }));
  };
  const read = () => $$("#fRows .listrow").forEach(r => { const f = fs[+r.dataset.i]; f.col = r.querySelector("[data-f=col]").value; f.op = r.querySelector("[data-f=op]").value; f.val = r.querySelector("[data-f=val]").value; });
  draw();
}
function toTSV() {
  const p = cur(), d = data();
  const head = [p.labelName || t("Etiqueta"), ...p.cols.map(c => c.name)];
  const num = v => (Number.isFinite(v) ? String(v).replace(".", LANG === "es" ? "," : ".") : "");
  const rows = p.rows.map((r, i) => [r.l, ...p.cols.map(c => (c.kind === "formula" ? num(d.byId[c.id][i]) : r.c[c.id] ?? ""))]);
  return [head, ...rows].map(r => r.join("\t")).join("\n");
}

/* =========================================================
   Importar
   ========================================================= */
$("#importBtn").addEventListener("click", () => {
  openSheet(`<h3>${t("Importar datos")}</h3>
    <div class="menulist">
      ${menuItem("paste", IC.paste, t("Pegar datos"), t("Copiados de Excel, Google Sheets o un CSV"))}
      ${menuItem("file", IC.file, t("Abrir un archivo"), t("Excel (.xlsx, .xls, .ods) o CSV"))}
      ${menuItem("photo", IC.cam, t("Foto de una tabla"), t("Lee los números de una foto (beta)"))}
    </div>
    <div class="actions"><button class="btn ghost" data-act="close">${t("Cancelar")}</button></div>`,
  act => { if (act === "paste") pasteSheet(); if (act === "file") $("#fileIn").click(); if (act === "photo") $("#photoIn").click(); });
});
function parseText(text) {
  const lines = text.replace(/\r/g, "").split("\n");
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  if (!lines.length) return [];
  const first = lines.find(l => l.trim()) || "";
  const sep = ["\t", ";", ","].find(s => first.includes(s)) || "\t";
  return lines.map(l => {
    const out = []; let cell = "", q = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (ch === '"') { if (q && l[i + 1] === '"') { cell += '"'; i++; } else q = !q; }
      else if (ch === sep && !q) { out.push(cell); cell = ""; }
      else cell += ch;
    }
    out.push(cell); return out.map(x => x.trim());
  });
}
function fromMatrix(m, forceHeader) {
  m = m.map(r => r.map(x => (x instanceof Date ? isoOf(x) : x === null || x === undefined ? "" : String(x).trim())));
  m = m.filter(r => r.some(x => x !== ""));
  if (!m.length) return null;
  const width = Math.max(...m.map(r => r.length));
  m = m.map(r => { const c = [...r]; while (c.length < width) c.push(""); return c; });
  const keep = []; for (let j = 0; j < width; j++) if (m.some(r => r[j] !== "")) keep.push(j);
  m = m.map(r => keep.map(j => r[j]));
  const w = keep.length, numeric = x => Number.isFinite(S.parseNum(x)), dateLike = x => /[-/.]/.test(x) && !!parseDate(x);
  const colIsNum = (rows, j) => { const v = rows.map(r => r[j]).filter(x => x !== ""); return v.length > 0 && v.filter(numeric).length >= v.length / 2; };
  let header;
  if (forceHeader !== undefined) header = forceHeader && m.length > 1;
  else header = m.length > 1 && (m[0].some((x, j) => x !== "" && !numeric(x) && colIsNum(m.slice(1), j)) || (m[0].every(x => x !== "" && !numeric(x)) && new Set(m[0]).size === w && m.slice(1).some(r => r.some(numeric))));
  const head = header ? m[0] : null, body = header ? m.slice(1) : m;
  const c0 = body.map(r => r[0]).filter(x => x !== "");
  const dateCol = c0.length && c0.filter(dateLike).length >= c0.length * 0.8;
  const labelCol = w > 1 && (dateCol || c0.filter(x => !numeric(x)).length >= c0.length / 2) && !(w > 1 && body.every(r => r[0] === "" || numeric(r[0])) );
  const start = labelCol ? 1 : 0;
  const cols = [];
  for (let j = start; j < w; j++) cols.push({ j, kind: colIsNum(body, j) ? "num" : "text", name: (head && head[j]) || t("Serie {l}", { l: L(cols.length) }) });
  if (!cols.length) return null;
  return {
    header: !!header, labelName: labelCol && head ? head[0] || t("Etiqueta") : t("Etiqueta"), labelType: dateCol && labelCol ? "date" : "text",
    cols, rows: body.map(r => [labelCol ? (dateCol ? parseDate(r[0]) : r[0]) : "", ...cols.map(c => r[c.j])]),
    preview: [head, ...body.slice(0, 6)].filter(Boolean), hasHeadRow: !!head
  };
}
function importFlow(sheets, suggestedName) {
  let idx = 0, forced;
  const draw = () => {
    const tb = fromMatrix(sheets[idx].matrix, forced);
    const nNum = tb ? tb.cols.filter(c => c.kind === "num").length : 0, nTxt = tb ? tb.cols.length - nNum : 0;
    openSheet(`<h3>${t("Importar datos")}</h3>
      ${sheets.length > 1 ? `<div class="field"><label class="label" for="sheetSel">${t("Hoja")}</label><select id="sheetSel">${sheets.map((s, i) => `<option value="${i}" ${i === idx ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></div>` : ""}
      ${tb ? `<div class="preview"><table>${tb.preview.slice(0, 7).map((r, k) => `<tr class="${k === 0 && tb.hasHeadRow ? "h" : ""}">${r.slice(0, 8).map(x => `<td>${esc(x)}</td>`).join("")}</tr>`).join("")}</table></div>
        <label style="display:flex;gap:8px;align-items:center;font-size:.9rem"><input type="checkbox" id="hdrChk" ${tb.header ? "checked" : ""}> ${t("La primera fila son los nombres de las columnas")}</label>
        <p class="hint">${t("{r} filas · {n} columnas de números · {x} de texto", { r: tb.rows.length, n: nNum, x: nTxt })}${tb.labelType === "date" ? " · " + t("fechas detectadas") : ""}</p>`
      : `<p class="err">${t("No he encontrado datos que se puedan importar.")}</p>`}
      <div class="actions"><button class="btn ghost" data-act="close">${t("Cancelar")}</button>
        ${tb ? `<button class="btn" data-act="replace">${t("Reemplazar el proyecto actual")}</button><button class="btn primary" data-act="new">${t("Crear proyecto nuevo")}</button>` : ""}</div>`,
    act => {
      if (!tb) return;
      const numIdx = tb.cols.map((c, i) => (c.kind === "num" ? i : -1)).filter(i => i >= 0), txtIdx = tb.cols.map((c, i) => (c.kind === "text" ? i : -1)).filter(i => i >= 0);
      const chart = numIdx.length ? { type: tb.labelType === "date" ? "line" : "bar", series: numIdx.slice(0, 6), x: numIdx[0], y: numIdx[1] ?? numIdx[0] } : { type: "count", countCol: txtIdx[0], countStyle: "bar" };
      const build = () => mk(suggestedName || t("Datos importados"), tb.labelName, tb.cols.map(c => [c.name, null, c.kind]), tb.rows, [chart],
        { regX: numIdx[0] ?? 0, regY: numIdx[1] ?? numIdx[0] ?? 0, sumCol: numIdx[0] ?? txtIdx[0] ?? 0 }, { labelType: tb.labelType, raw: true });
      if (act === "new") { addProject(build()); closeSheet(); toast(t("{n} filas importadas", { n: tb.rows.length })); showView("view-data"); }
      if (act === "replace") {
        const p = cur(), n = build();
        Object.assign(p, { labelName: n.labelName, labelType: n.labelType, cols: n.cols, rows: n.rows, charts: n.charts, activeChart: n.activeChart, stats: n.stats, filters: [] });
        dirty(); persist(); renderAll(); closeSheet(); toast(t("{n} filas importadas", { n: tb.rows.length }), t("Deshacer"), undo);
      }
    });
    $("#sheetSel")?.addEventListener("change", e => { idx = +e.target.value; forced = undefined; draw(); });
    $("#hdrChk")?.addEventListener("change", e => { forced = e.target.checked; draw(); });
  };
  draw();
}
function pasteSheet(prefill = "", note = "") {
  openSheet(`<h3>${t("Pegar datos")}</h3>
    <p class="hint">${note || t("Copia celdas desde Excel, Google Sheets o un CSV y pégalas aquí. La primera fila puede ser el encabezado y la primera columna las etiquetas.")}</p>
    <textarea id="pasteArea" placeholder="${t("Mes")}\t${t("Ventas")}\t${t("Gastos")}&#10;${t("Ene")}\t1200\t800&#10;${t("Feb")}\t1350\t820">${esc(prefill)}</textarea>
    <div class="actions"><button class="btn ghost" data-act="close">${t("Cancelar")}</button><button class="btn primary" data-act="ok">${t("Continuar")}</button></div>`,
  act => {
    if (act !== "ok") return;
    const m = parseText($("#pasteArea").value);
    if (!m.length) { toast(t("Pega primero algunos datos")); return; }
    importFlow([{ name: t("Datos"), matrix: m }]);
  });
  setTimeout(() => $("#pasteArea").focus(), 60);
}
const scripts = {};
function loadScript(src) {
  return (scripts[src] = scripts[src] || new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = src;
    s.onload = res; s.onerror = () => { delete scripts[src]; rej(new Error(t("No se pudo cargar un componente de la app. Ábrela una vez con conexión a internet."))); };
    document.head.appendChild(s);
  }));
}
const loadXLSX = () => (window.XLSX ? Promise.resolve() : loadScript("lib/xlsx.full.min.js"));
$("#fileIn").addEventListener("change", async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  const name = f.name.replace(/\.[^.]+$/, "");
  try {
    if (/\.(xlsx|xls|ods)$/i.test(f.name)) {
      toast(t("Leyendo el archivo…"));
      const [, buf] = await Promise.all([loadXLSX(), f.arrayBuffer()]);
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const sheets = wb.SheetNames.map(n => ({ name: n, matrix: XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: "" }) })).filter(s => s.matrix.length);
      if (!sheets.length) throw new Error(t("El archivo no tiene datos."));
      importFlow(sheets, name);
    } else {
      let text = await f.text();
      if (text.includes("\uFFFD")) text = new TextDecoder("windows-1252").decode(await f.arrayBuffer());
      const m = parseText(text); if (!m.length) throw new Error(t("El archivo está vacío."));
      importFlow([{ name: t("Datos"), matrix: m }], name);
    }
  } catch (err) { toast(err.message || t("No se pudo leer el archivo")); }
});

/* =========================================================
   Hojas, avisos, portapapeles
   ========================================================= */
let sheetHandler = null, lastFocus = null;
function openSheet(html, handler) {
  if ($("#sheet").hidden) lastFocus = document.activeElement;
  const old = $("#sheetCard"), fresh = old.cloneNode(false); old.replaceWith(fresh); // quita los oyentes de la hoja anterior
  $("#sheetCard").innerHTML = html; sheetHandler = handler; $("#sheet").hidden = false; $("#sheetCard").scrollTop = 0;
  setTimeout(() => { if (!document.activeElement?.closest("#sheetCard")) $("#sheetCard").focus({ preventScroll: true }); }, 30);
}
function closeSheet() { $("#sheet").hidden = true; sheetHandler = null; lastFocus?.focus?.({ preventScroll: true }); }
$("#sheet").addEventListener("click", e => {
  if (e.target.id === "sheet") return closeSheet();
  const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
  if (b.dataset.act === "close") return closeSheet();
  if (sheetHandler) sheetHandler(b.dataset.act, b);
});
document.addEventListener("keydown", e => { if (e.key === "Escape") { if (!$("#fs").hidden) closeFullscreen(); else if (!$("#sheet").hidden) closeSheet(); } });
let toastT;
function toast(m, actLabel, actFn) {
  const el = $("#toast"); el.innerHTML = `<span>${esc(m)}</span>${actLabel ? `<button>${esc(actLabel)}</button>` : ""}`; el.hidden = false;
  if (actLabel) el.querySelector("button").onclick = () => { el.hidden = true; actFn(); };
  clearTimeout(toastT); toastT = setTimeout(() => (el.hidden = true), actLabel ? 4500 : 2600);
}
async function copyText(s) {
  try { await navigator.clipboard.writeText(s); return true; } catch {
    try { const ta = document.createElement("textarea"); ta.value = s; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok; } catch { return false; }
  }
}
// traduce los mensajes de error del motor de fórmulas
function tErr(m) {
  const rules = [[/^No entiendo «(.*)»\.$/, "No entiendo «{x}»."], [/^Falta «(.*)»\.$/, "Falta «{x}»."], [/^«(.*)» no es una columna ni una función conocida\.$/, "«{x}» no es una columna ni una función conocida."],
    [/^La columna (.*) no existe\.$/, "La columna {x} no existe."], [/^No conozco la función «(.*)»\.$/, "No conozco la función «{x}»."], [/^Sobra «(.*)»\.$/, "Sobra «{x}»."]];
  for (const [re, k] of rules) { const mm = m.match(re); if (mm) return t(k, { x: mm[1] }); }
  return t(m);
}

/* =========================================================
   Vistas
   ========================================================= */
let currentView = "view-data";
const wide = () => window.innerWidth >= 1000;
function showView(id) {
  currentView = id;
  $$("main.views > .view").forEach(v => (v.hidden = v.id !== id));
  $$("#tabs [data-view]").forEach(b => b.setAttribute("aria-selected", b.dataset.view === id));
  $("#views").classList.toggle("panel-mode", id === "view-panel");
  $$("#modeSeg button").forEach(b => b.setAttribute("aria-pressed", (b.dataset.mode === "panel") === (id === "view-panel")));
  if (id === "view-chart" || (wide() && id !== "view-panel")) renderChart();
  if (id === "view-panel") renderPanel(); else destroyPanel();
  if (!wide()) window.scrollTo(0, 0);
}
$$("#tabs [data-view]").forEach(b => b.addEventListener("click", () => showView(b.dataset.view)));
$("#modeSeg").addEventListener("click", e => { const b = e.target.closest("[data-mode]"); if (b) showView(b.dataset.mode === "panel" ? "view-panel" : "view-chart"); });

/* =========================================================
   Tutorial
   ========================================================= */
function showOnboarding() {
  const ink = "var(--ink)", acc = "var(--accent)", amb = "var(--amber)", ln = "var(--line)";
  const slides = [
    { h: t("Escribe o importa tus datos"), p: t("Rellena la tabla, pega desde Excel, abre un archivo o haz una foto a una tabla."),
      svg: `<rect x="30" y="20" width="200" height="110" rx="10" fill="var(--sheet)" stroke="${ln}" stroke-width="2"/><path d="M30 46h200M30 72h200M30 98h200M95 20v110M162 20v110" stroke="${ln}" stroke-width="2"/><rect x="104" y="54" width="48" height="12" rx="3" fill="${acc}" opacity=".25"/><rect x="40" y="29" width="40" height="9" rx="3" fill="${ink}" opacity=".7"/><rect x="104" y="29" width="40" height="9" rx="3" fill="${ink}" opacity=".7"/><rect x="171" y="29" width="40" height="9" rx="3" fill="${ink}" opacity=".7"/>` },
    { h: t("Elige el gráfico"), p: t("Trece tipos, varios gráficos por proyecto y un panel para verlos todos juntos."),
      svg: `<path d="M40 130h190" stroke="${ln}" stroke-width="2"/><rect x="52" y="80" width="26" height="50" rx="4" fill="${acc}"/><rect x="92" y="50" width="26" height="80" rx="4" fill="${acc}"/><rect x="132" y="66" width="26" height="64" rx="4" fill="${acc}"/><rect x="172" y="30" width="26" height="100" rx="4" fill="${amb}"/><path d="M50 70l50-30 40 18 60-36" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>` },
    { h: t("Entiende tus números"), p: t("Estadísticas, frecuencias, regresiones y contrastes, con explicaciones y el cálculo paso a paso."),
      svg: `<rect x="40" y="24" width="180" height="104" rx="10" fill="var(--sheet)" stroke="${ln}" stroke-width="2"/><text x="56" y="56" font-family="var(--mono)" font-size="16" fill="${ink}">x̄ = ${fmt(6.31)}</text><text x="56" y="84" font-family="var(--mono)" font-size="16" fill="${ink}">s = ${fmt(1.77)}</text><text x="56" y="112" font-family="var(--mono)" font-size="16" fill="${acc}">R² = ${fmt(0.957, 3)}</text><circle cx="190" cy="56" r="14" fill="${acc}" opacity=".2"/><text x="185" y="62" font-size="16" fill="${acc}">i</text>` }
  ];
  let k = 0;
  const draw = () => {
    const s = slides[k];
    $("#onb").innerHTML = `<div class="card" role="dialog" aria-modal="true"><svg class="ill" viewBox="0 0 260 150" aria-hidden="true">${s.svg}</svg>
      <h3>${esc(s.h)}</h3><p>${esc(s.p)}</p><div class="dots">${slides.map((_, i) => `<i class="${i === k ? "on" : ""}"></i>`).join("")}</div>
      <div class="actions"><button class="btn ghost" data-o="skip">${t("Saltar")}</button><button class="btn primary" data-o="next">${k < slides.length - 1 ? t("Siguiente") : t("Empezar")}</button></div></div>`;
    $("#onb").hidden = false; $("#onb [data-o=next]").focus();
  };
  const done = () => { $("#onb").hidden = true; settings.tutorialDone = true; saveSettings(); };
  $("#onb").onclick = e => { const b = e.target.closest("[data-o]"); if (!b) return; if (b.dataset.o === "skip") done(); else if (k < slides.length - 1) { k++; draw(); } else done(); };
  draw();
}


/* =========================================================
   Registro rápido (proyectos con fechas)
   ========================================================= */
const quickCols = () => cur().cols.filter(c => c.kind !== "formula").slice(0, 4);
let quickDate = null;
function renderQuick() {
  const p = cur(), on = p.labelType === "date" && quickCols().length > 0;
  ["#quick", "#quickPanel"].forEach(sel => { const el = $(sel); el.hidden = !on; if (!on) el.innerHTML = ""; });
  if (!on) return;
  const date = quickDate || todayISO(), isToday = date === todayISO();
  const ri = p.rows.findIndex(r => r.l === date), row = ri >= 0 ? p.rows[ri] : null;
  const d = data(), first = quickCols().find(c => c.kind === "num");
  const ph = c => { if (c.kind === "text") return ""; const v = d.vals(c.id); return v.length ? fmt(d.series(c.id).filter(x => x != null).pop()) : ""; };
  const stats = first ? quickStats(first) : "";
  const html = pre => `<div class="qhead"><b>${t("Registro rápido")}</b>
      <span class="qdate">${isToday ? t("Hoy") + ", " : ""}<input type="date" data-q="date" value="${date}" max="${todayISO()}" aria-label="${t("Fecha")}"></span></div>
    <div class="qfields">${quickCols().map(c => `<label>${esc(colName(c))}<input type="text" ${c.kind === "num" ? 'inputmode="decimal"' : 'class="txt"'} data-qc="${c.id}" id="${pre}_${c.id}" value="${esc(row ? row.c[c.id] ?? "" : "")}" placeholder="${esc(ph(c))}" enterkeyhint="done" autocomplete="off"></label>`).join("")}</div>
    <div class="qrow"><button class="btn primary" data-q="save">${ICON(row ? IC.edit : IC.plus)}${row ? t("Actualizar") : t("Guardar")}</button>${first ? `<button class="btn" data-q="goal">${t("Objetivo")}${Number.isFinite(p.goal) ? ": " + fmt(p.goal) : ""}</button>` : ""}</div>
    ${stats ? `<div class="qstats">${stats}</div>` : ""}`;
  const focused = document.activeElement && document.activeElement.closest(".quick") ? document.activeElement.id : null;
  $("#quick").innerHTML = html("qd"); $("#quickPanel").innerHTML = html("qp");
  if (focused && document.getElementById(focused)) document.getElementById(focused).focus();
}
function quickStats(c) {
  const p = cur(), d = data(), ser = d.series(c.id), pts = [];
  ser.forEach((v, k) => { if (v != null && d.ts && Number.isFinite(d.ts[k])) pts.push([d.ts[k], v]); });
  if (!pts.length) return `<span>${t("Escribe tu primer valor y pulsa Guardar. La fecha se pone sola.")}</span>`;
  pts.sort((a, b) => a[0] - b[0]);
  const last = pts[pts.length - 1], prev = pts[pts.length - 2], firstP = pts[0];
  const arrow = x => (x ? `<span class="${trendClass(x, last[1], c)}">${x > 0 ? "▲" : "▼"} ${fmt(Math.abs(x))}</span>` : "=");
  const out = [`<span>${t("Último")}: <b>${fmt(last[1])}</b> (${fmtDate(isoOf(new Date(last[0])))})</span>`];
  if (prev) out.push(`<span>${arrow(last[1] - prev[1])} ${t("desde el anterior")}</span>`);
  if (pts.length > 2) out.push(`<span>${arrow(last[1] - firstP[1])} ${t("desde el {d}", { d: fmtDate(isoOf(new Date(firstP[0]))) })}</span>`);
  const wk = pts.filter(x => x[0] > last[0] - 7 * 864e5).map(x => x[1]);
  if (wk.length > 1) out.push(`<span>${t("Media 7 días")}: <b>${fmt(S.mean(wk))}</b></span>`);
  if (Number.isFinite(p.goal)) { const r = last[1] - p.goal; out.push(Math.abs(r) < 1e-9 ? `<span class="up">${t("¡Objetivo conseguido!")}</span>` : `<span>${t("A {x} del objetivo", { x: `<b>${fmt(Math.abs(r))}</b>` })}</span>`); }
  return out.join("");
}
function quickSave(box) {
  const p = cur(), date = box.querySelector("[data-q=date]").value || todayISO();
  const vals = {}; let any = false;
  box.querySelectorAll("[data-qc]").forEach(i => { const v = i.value.trim(); if (v !== "") { vals[i.dataset.qc] = v; any = true; } });
  if (!any) { toast(t("Escribe al menos un valor")); box.querySelector("[data-qc]")?.focus(); return; }
  const bad = quickCols().find(c => c.kind === "num" && vals[c.id] !== undefined && !Number.isFinite(S.parseNum(vals[c.id])));
  if (bad) { toast(t("«{v}» no es un número", { v: vals[bad.id] })); return; }
  let r = p.rows.find(x => x.l === date);
  const existed = !!r;
  if (!r) { r = { l: date, c: {} }; p.rows = p.rows.filter(x => String(x.l ?? "").trim() || Object.keys(x.c).length); p.rows.push(r); }
  Object.assign(r.c, vals);
  p.rows.sort((a, b) => (!a.l) - (!b.l) || String(a.l).localeCompare(String(b.l)));
  quickDate = null; dirty(); persist(); renderTable(); refresh();
  toast(existed ? t("Actualizado · {d}", { d: fmtDate(date, true) }) : t("Guardado · {d}", { d: fmtDate(date, true) }), t("Deshacer"), undo);
  document.activeElement?.blur?.();
}
function goalSheet() {
  const p = cur();
  openSheet(`<h3>${t("Objetivo")}</h3><p class="hint">${t("Aparecerá como una línea en tus gráficos y verás cuánto te falta.")}</p>
    <div class="field"><input type="text" inputmode="decimal" id="goalIn" value="${Number.isFinite(p.goal) ? esc(String(p.goal).replace(".", LANG === "es" ? "," : ".")) : ""}" placeholder="${t("Ej.: 70")}" style="font-family:var(--mono);font-size:1.4rem"></div>
    <div class="actions"><button class="btn ghost" data-act="rm" ${Number.isFinite(p.goal) ? "" : "disabled"}>${t("Quitar objetivo")}</button><button class="btn primary" data-act="ok">${t("Guardar")}</button></div>`,
  act => {
    const label = t("Objetivo");
    const setLines = v => p.charts.forEach(ch => { ch.lines = (ch.lines || []).filter(l => !l._goal); if (Number.isFinite(v) && ["line", "area", "bar", "combo"].includes(ch.type)) ch.lines.push({ value: v, label, color: "", _goal: true }); });
    if (act === "ok") { const v = S.parseNum($("#goalIn").value); if (!Number.isFinite(v)) { toast(t("Escribe un número")); return; } p.goal = v; setLines(v); }
    if (act === "rm") { delete p.goal; setLines(NaN); }
    if (act === "ok" || act === "rm") { persist(); refresh(); closeSheet(); }
  });
  setTimeout(() => $("#goalIn").select(), 60);
}
["#quick", "#quickPanel"].forEach(sel => {
  const box = $(sel);
  box.addEventListener("click", e => { const b = e.target.closest("[data-q]"); if (!b || b.tagName === "INPUT") return; if (b.dataset.q === "save") quickSave(box); if (b.dataset.q === "goal") goalSheet(); });
  box.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches("[data-qc]")) { e.preventDefault(); quickSave(box); } });
  box.addEventListener("change", e => { if (e.target.dataset.q === "date") { quickDate = e.target.value && e.target.value !== todayISO() ? e.target.value : null; renderQuick(); } });
});
function openQuickFromShortcut() {
  const dated = state.projects.filter(p => p.labelType === "date" && p.cols.length).sort((a, b) => (b.updated || 0) - (a.updated || 0));
  const target = (cur().labelType === "date" ? cur() : null) || dated[0];
  if (!target) return;
  if (target !== cur()) { state.current = target.id; hist(); dirty(); renderAll(); }
  showView("view-data"); setTimeout(() => { const i = $("#quick [data-qc]"); i?.focus(); }, 150);
}

/* =========================================================
   Ciclo de renderizado
   ========================================================= */
function refresh() { updateCount(); renderQuick(); renderChartUI(); renderStats(); if (currentView === "view-panel") renderPanel(); }
function renderAll() { dirty(); renderProjects(); renderTable(); refresh(); updateUndo(); }
