/* Gráficalo · interfaz */
"use strict";
const S = window.GStats;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (n, d = 2) => (Number.isFinite(n) ? n.toLocaleString("es-ES", { maximumFractionDigits: d }) : "—");
const fmtSig = v => { if (!Number.isFinite(v)) return "—"; const a = Math.abs(v); return v.toLocaleString("es-ES", { maximumSignificantDigits: a >= 1000 ? 7 : 4 }); };
const uid = () => Math.random().toString(36).slice(2, 9);
const L = i => S.indexLetter(i);
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const FIXED = ["#5b7fd6", "#c4527a", "#6b9e3a", "#8a63c9", "#d07a4a", "#3a9bb0", "#a8892b", "#7a8794"];
const palette = () => [css("--accent"), css("--amber"), ...FIXED];
const alpha = (hex, a) => {
  const m = String(hex).replace("#", "");
  const n = parseInt(m.length === 3 ? m.split("").map(c => c + c).join("") : m, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/* =========================================================
   Proyectos, plantillas y almacenamiento
   ========================================================= */
const defaultChart = () => ({ type: "bar", series: [], x: null, y: null, model: "linear", title: "", xTitle: "", yTitle: "", font: "m", legend: "top", zero: true, showMean: false, showValues: false, bins: null });
function mk(name, labelName, colDefs, rows, chart = {}, stats = {}) {
  const cols = colDefs.map(([n, formula, color]) => ({ id: uid(), name: n, formula: formula || null, color: color || null }));
  const p = {
    id: uid(), name, labelName, cols,
    rows: rows.map(r => { const c = {}; cols.forEach((col, i) => { if (!col.formula && r[i + 1] !== undefined && r[i + 1] !== "") c[col.id] = String(r[i + 1]); }); return { l: r[0] ?? "", c }; }),
    chart: Object.assign(defaultChart(), chart), stats: Object.assign({}, stats)
  };
  const byIdx = i => cols[i] && cols[i].id;
  p.chart.series = (chart.series || [0]).map(byIdx).filter(Boolean);
  p.chart.one = byIdx(chart.one ?? (chart.series || [0])[0]);
  p.chart.x = byIdx(chart.x ?? 0); p.chart.y = byIdx(chart.y ?? 1) || byIdx(0);
  return p;
}
const TEMPLATES = [
  { key: "blank", name: "En blanco", desc: "Una columna vacía para empezar de cero.",
    make: () => mk("Proyecto nuevo", "Etiqueta", [["Valor"]], [["", ""], ["", ""], ["", ""], ["", ""], ["", ""]]) },
  { key: "notas", name: "Notas de clase", desc: "Tres evaluaciones y la media de cada alumno.",
    make: () => mk("Notas de clase", "Alumno", [["1ª evaluación"], ["2ª evaluación"], ["3ª evaluación"], ["Media", "redondear((A+B+C)/3; 2)"]],
      [["Ana", "6,5", "7,2", "7,8"], ["Bruno", "8", "8,4", "9"], ["Carla", "4,5", "5,8", "6,2"], ["David", "7", "6,9", "7,4"], ["Elena", "9,2", "9,5", "9,1"], ["Fran", "5,5", "6,1", "5,9"], ["Gema", "6", "7,4", "8"], ["Hugo", "3,8", "5", "5,6"]],
      { type: "bar", series: [0, 1, 2], showMean: false }, { sumCol: 3, freqCol: 3, regX: 0, regY: 2 }) },
  { key: "gastos", name: "Gastos del mes", desc: "Categorías, euros y porcentaje de cada una.",
    make: () => mk("Gastos del mes", "Categoría", [["Euros"], ["% del total", "redondear(A/suma(A)*100; 1)"]],
      [["Alquiler", "550"], ["Comida", "240"], ["Transporte", "60"], ["Ocio", "95"], ["Facturas", "110"], ["Otros", "45"]],
      { type: "doughnut", series: [0], showValues: true, legend: "bottom" }) },
  { key: "deporte", name: "Entrenamiento", desc: "Kilómetros, minutos y ritmo calculado.",
    make: () => mk("Entrenamiento", "Día", [["Km"], ["Minutos"], ["Ritmo (min/km)", "redondear(B/A; 2)"]],
      [["Lun", "5", "28"], ["Mar", "", ""], ["Mié", "7,5", "41"], ["Jue", "4", "21"], ["Vie", "", ""], ["Sáb", "12", "70"], ["Dom", "6", "33"]],
      { type: "bar", series: [0], showValues: true }) },
  { key: "ventas", name: "Ventas por mes", desc: "Ventas, gastos y beneficio mes a mes.",
    make: () => mk("Ventas por mes", "Mes", [["Ventas"], ["Gastos"], ["Beneficio", "A-B"]],
      [["Ene", "1200", "800"], ["Feb", "1350", "820"], ["Mar", "1280", "900"], ["Abr", "1600", "950"], ["May", "1750", "1010"], ["Jun", "1900", "1100"]],
      { type: "line", series: [0, 1, 2] }, { regX: 0, regY: 2 }) },
  { key: "relacion", name: "Relación entre dos variables", desc: "Dos columnas para ver si están relacionadas.",
    make: () => mk("Horas de estudio y nota", "Alumno", [["Horas de estudio"], ["Nota"]],
      [["", "2", "4,1"], ["", "4", "5,3"], ["", "5", "6,2"], ["", "7", "6,8"], ["", "8", "7,9"], ["", "10", "8,2"], ["", "3", "5"], ["", "6", "6,1"], ["", "9", "8,8"], ["", "1", "3,2"]],
      { type: "scatter", series: [0, 1], x: 0, y: 1 }, { regX: 0, regY: 1 }) }
];
const samples = () => ["notas", "gastos", "relacion", "ventas"].map(k => { const p = TEMPLATES.find(t => t.key === k).make(); p.name += " (ejemplo)"; return p; });

const KEY = "graficalo.v2", OLDKEY = "graficalo.v1";
const store = {
  load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }
};
function migrateV1(old) {
  return old.projects.map(o => {
    const hasB = (o.nameB || "").trim() || o.rows.some(r => String(r[2] ?? "").trim());
    const defs = [[o.nameA || "A"]]; if (hasB) defs.push([o.nameB || "B"]);
    const typeMap = { hist: "hist", pie: "pie", scatter: "scatter", line: "line", bar: "bar" };
    return mk(o.name, "Etiqueta", defs, o.rows.map(r => [r[0], r[1], r[2]]),
      { type: typeMap[o.type] || "bar", series: hasB ? [0, 1] : [0], showMean: !!o.showMean, showValues: !!o.showValues, bins: o.bins || null });
  });
}
let state = store.load(KEY);
if (!state || !Array.isArray(state.projects) || !state.projects.length) {
  const old = store.load(OLDKEY);
  state = { projects: old && Array.isArray(old.projects) && old.projects.length ? migrateV1(old) : samples(), current: null };
}
if (!state.projects.find(p => p.id === state.current)) state.current = state.projects[0].id;
const cur = () => state.projects.find(p => p.id === state.current);
let saveT; const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => store.save(state), 250); };

/* =========================================================
   Datos calculados (con caché)
   ========================================================= */
let cache = null;
const dirty = () => { cache = null; };
function data() {
  if (cache && cache.p === cur()) return cache;
  const p = cur();
  const raw = p.rows.map(r => p.cols.map(c => r.c[c.id] ?? ""));
  const { values, errors } = S.computeTable(p.cols, raw);
  const byId = {}, errById = {};
  p.cols.forEach((c, j) => { byId[c.id] = values[j]; errById[c.id] = errors[j]; });
  const dataCols = p.cols.filter(c => !c.formula).length ? p.cols.filter(c => !c.formula) : p.cols;
  const rowIdx = p.rows.map((_, i) => i).filter(i => dataCols.some(c => Number.isFinite(byId[c.id][i])));
  const labels = rowIdx.map(i => String(p.rows[i].l || "").trim() || `#${i + 1}`);
  return (cache = {
    p, byId, errById, rowIdx, labels,
    series: id => rowIdx.map(i => (Number.isFinite(byId[id]?.[i]) ? byId[id][i] : null)),
    vals: id => (byId[id] || []).filter(Number.isFinite)
  });
}
const colById = id => cur().cols.find(c => c.id === id);
const colName = c => (c ? c.name || L(cur().cols.indexOf(c)) : "—");
const colColor = c => { const p = cur(), i = p.cols.indexOf(c); return c.color || palette()[i % palette().length]; };
function validId(id, fallbackIdx = 0) { const p = cur(); return p.cols.some(c => c.id === id) ? id : (p.cols[fallbackIdx] || p.cols[0] || {}).id; }

/* =========================================================
   Proyectos (cabecera)
   ========================================================= */
function renderProjects() {
  $("#projectSel").innerHTML = state.projects.map(p => `<option value="${p.id}" ${p.id === state.current ? "selected" : ""}>${esc(p.name)}</option>`).join("");
}
$("#projectSel").addEventListener("change", e => { state.current = e.target.value; dirty(); persist(); renderAll(); });
function addProject(p) { state.projects.push(p); state.current = p.id; dirty(); persist(); renderAll(); }

$("#newProject").addEventListener("click", () => {
  openSheet(`<h3>Nuevo proyecto</h3><p class="hint">Elige una plantilla. Las que traen datos los tienen de ejemplo: cámbialos por los tuyos.</p>
    <div class="tpls">${TEMPLATES.map(t => `<button data-act="tpl:${t.key}"><b>${esc(t.name)}</b><small>${esc(t.desc)}</small></button>`).join("")}</div>
    <div class="actions"><button class="btn ghost" data-act="close">Cancelar</button></div>`,
  act => {
    if (act.startsWith("tpl:")) {
      const t = TEMPLATES.find(x => x.key === act.slice(4)), p = t.make();
      if (t.key !== "blank") p.name = t.name;
      let n = 2, base = p.name; while (state.projects.some(q => q.name === p.name)) p.name = `${base} ${n++}`;
      addProject(p); closeSheet(); showView("view-data");
      setTimeout(() => document.querySelector("#tbody input")?.focus(), 60);
    }
  });
});

$("#projectMenu").addEventListener("click", () => {
  const p = cur();
  openSheet(`<h3>Proyecto</h3>
    <div class="field"><label class="label" for="renameIn">Nombre</label><input type="text" id="renameIn" value="${esc(p.name)}"></div>
    <div class="actions" style="justify-content:flex-start">
      <button class="btn" data-act="dup">Duplicar</button>
      <button class="btn" data-act="csv">Copiar datos (para Excel)</button>
      <button class="btn" data-act="clear">Vaciar datos</button>
      <button class="btn danger" data-act="del">Borrar proyecto</button>
    </div>
    <div id="confirmBox" hidden class="explain"></div>
    <div class="actions"><button class="btn ghost" data-act="close">Cerrar</button><button class="btn primary" data-act="ok">Guardar nombre</button></div>`,
  act => {
    const box = $("#confirmBox");
    if (act === "ok") { p.name = $("#renameIn").value.trim() || p.name; persist(); renderProjects(); renderChartTitle(); closeSheet(); }
    if (act === "dup") { const c = JSON.parse(JSON.stringify(p)); c.id = uid(); c.name = p.name + " (copia)"; addProject(c); closeSheet(); toast("Proyecto duplicado"); }
    if (act === "csv") copyText(toTSV(p)).then(ok => toast(ok ? "Datos copiados. Pégalos en Excel o Sheets." : "No se pudo copiar"));
    if (act === "clear") { box.hidden = false; box.innerHTML = `Se borrarán todos los valores de la tabla, pero se mantienen las columnas y sus fórmulas.<div class="actions" style="margin-top:8px"><button class="btn" data-act="cancel">Cancelar</button><button class="btn danger" data-act="clear2">Vaciar</button></div>`; }
    if (act === "del") { box.hidden = false; box.innerHTML = `¿Borrar «${esc(p.name)}» y todos sus datos? No se puede deshacer.<div class="actions" style="margin-top:8px"><button class="btn" data-act="cancel">Cancelar</button><button class="btn danger" data-act="del2">Sí, borrar</button></div>`; }
    if (act === "cancel") box.hidden = true;
    if (act === "clear2") { p.rows = Array.from({ length: 5 }, () => ({ l: "", c: {} })); dirty(); persist(); renderAll(); closeSheet(); toast("Datos vaciados"); }
    if (act === "del2") {
      state.projects = state.projects.filter(x => x.id !== p.id);
      if (!state.projects.length) state.projects = samples();
      state.current = state.projects[0].id; dirty(); persist(); renderAll(); closeSheet(); toast("Proyecto borrado");
    }
  });
});
function toTSV(p) {
  const d = data();
  const head = [p.labelName || "Etiqueta", ...p.cols.map(c => c.name)];
  const rows = p.rows.map((r, i) => [r.l, ...p.cols.map(c => (c.formula ? (Number.isFinite(d.byId[c.id][i]) ? String(d.byId[c.id][i]).replace(".", ",") : "") : r.c[c.id] ?? ""))]);
  return [head, ...rows].map(r => r.join("\t")).join("\n");
}

/* =========================================================
   Tabla de datos
   ========================================================= */
function renderTable() {
  const p = cur(), d = data();
  $("#thead").innerHTML = `<tr><th class="num-col">#</th>
    <th><div class="labelhead"><div class="l">Etiqueta</div><input type="text" id="labelName" value="${esc(p.labelName)}" aria-label="Nombre de la columna de etiquetas"></div></th>
    ${p.cols.map((c, j) => `<th><button class="colhead" data-col="${c.id}" title="Editar columna"><span class="l"><i style="background:${colColor(c)}"></i>${L(j)}${c.formula ? " · ƒ" : ""}${d.errById[c.id] ? ' <b class="warn">!</b>' : ""}</span><span class="n">${esc(c.name || L(j))}</span></button></th>`).join("")}
    <th><button class="addcol" id="addColHead" title="Añadir columna">＋</button></th></tr>`;
  $("#tbody").innerHTML = p.rows.map((r, i) => `<tr data-i="${i}"><td class="num-col">${i + 1}</td>
    <td><input type="text" id="c${i}_l" data-k="l" value="${esc(r.l)}" aria-label="Etiqueta fila ${i + 1}"></td>
    ${p.cols.map(c => c.formula
      ? `<td class="calc${d.errById[c.id] ? " err" : ""}" data-fc="${c.id}" data-r="${i}">${d.errById[c.id] ? "!" : fmtSig(d.byId[c.id][i])}</td>`
      : `<td><input type="text" inputmode="decimal" class="num" id="c${i}_${c.id}" data-k="${c.id}" value="${esc(r.c[c.id] ?? "")}" aria-label="${esc(c.name)} fila ${i + 1}"></td>`).join("")}
    <td><button class="del" data-del="${i}" aria-label="Borrar fila ${i + 1}">×</button></td></tr>`).join("");
  updateCount();
}
function updateCalcCells() {
  const d = data();
  document.querySelectorAll("#tbody td[data-fc]").forEach(td => {
    const id = td.dataset.fc, v = d.byId[id]?.[+td.dataset.r];
    td.textContent = d.errById[id] ? "!" : fmtSig(v);
  });
}
function updateCount() { const n = data().rowIdx.length; $("#rowCount").textContent = `${n} ${n === 1 ? "fila" : "filas"} con datos`; }
$("#thead").addEventListener("input", e => { if (e.target.id === "labelName") { cur().labelName = e.target.value; persist(); } });
$("#thead").addEventListener("click", e => {
  const b = e.target.closest("[data-col]"); if (b) return openColumn(b.dataset.col);
  if (e.target.closest("#addColHead")) addColumn();
});
$("#tbody").addEventListener("input", e => {
  const tr = e.target.closest("tr"); if (!tr) return;
  const r = cur().rows[+tr.dataset.i], k = e.target.dataset.k;
  if (k === "l") r.l = e.target.value; else if (e.target.value === "") delete r.c[k]; else r.c[k] = e.target.value;
  dirty(); persist(); updateCalcCells(); updateCount(); scheduleRefresh();
});
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
});
$("#addRow").addEventListener("click", () => {
  cur().rows.push({ l: "", c: {} }); dirty(); persist(); renderTable();
  const w = $("#tablewrap"); w.scrollTop = w.scrollHeight;
  document.getElementById(`c${cur().rows.length - 1}_l`)?.focus();
});
$("#addCol").addEventListener("click", () => addColumn());
function addColumn() {
  const p = cur(), c = { id: uid(), name: `Serie ${L(p.cols.length)}`, formula: null, color: null };
  p.cols.push(c);
  if (["bar", "barh", "stacked", "line", "area", "radar", "box"].includes(p.chart.type)) p.chart.series.push(c.id);
  dirty(); persist(); renderTable(); refresh(); openColumn(c.id, true);
}

/* reescribe las letras de las fórmulas cuando se mueven o borran columnas */
function remapFormulas(p, map) { // map: índice antiguo -> índice nuevo (o -1 si se borró)
  p.cols.forEach(c => {
    if (!c.formula) return;
    c.formula = c.formula.replace(/\b([A-Z]{1,2})\b(?!\s*\()/g, (m) => {
      const o = S.letterIndex(m), n = map[o];
      return n === undefined ? m : n < 0 ? "#" : L(n);
    });
  });
}

function openColumn(id, isNew = false) {
  const p = cur(), c = colById(id), j = p.cols.indexOf(c);
  const letters = p.cols.map((_, k) => L(k)).filter((_, k) => k !== j);
  const a = letters[0] || "A", b = letters[1] || a;
  const ex = [`${a}+${b}`, `${a}-${b}`, `(${a}+${b})/2`, `${a}/suma(${a})*100`, `redondear(${a}; 1)`, `${a}-media(${a})`, `si(${a}>=5; 1; 0)`];
  let mode = c.formula ? "f" : "d", autoColor = !c.color;
  openSheet(`<h3>Columna ${L(j)}</h3>
    <div class="row2">
      <div class="field"><label class="label" for="colName">Nombre</label><input type="text" id="colName" value="${esc(c.name)}"></div>
      <div class="field"><label class="label" for="colColor">Color</label><div style="display:flex;gap:8px;align-items:center"><input type="color" id="colColor" value="${toHex(colColor(c))}"><button class="btn small ghost" data-act="autocolor">Automático</button></div></div>
    </div>
    <div class="field"><span class="label">Contenido</span>
      <div class="seg" role="group"><button data-act="mode:d" aria-pressed="${mode === "d"}">Datos que escribo</button><button data-act="mode:f" aria-pressed="${mode === "f"}">Fórmula</button></div></div>
    <div id="fBox" ${mode === "d" ? "hidden" : ""} class="field">
      <label class="label" for="colFormula">Fórmula (usa las letras de las columnas)</label>
      <input type="text" id="colFormula" value="${esc(c.formula || "")}" placeholder="${esc(ex[2])}" autocomplete="off" autocapitalize="characters" spellcheck="false" style="font-family:var(--mono)">
      <p id="fMsg" class="hint"></p>
      <div class="examples">${ex.map(x => `<button data-act="ex:${esc(x)}">${esc(x)}</button>`).join("")}</div>
      <details class="help"><summary>¿Qué puedo escribir?</summary><ul>
        <li>Letras de columna: <code>A</code>, <code>B</code>… y números (<code>2,5</code> o <code>2.5</code>)</li>
        <li>Operaciones: <code>+ - * / ^</code> y paréntesis</li>
        <li>Por fila: <code>redondear(x; n)</code>, <code>raiz(x)</code>, <code>abs(x)</code>, <code>ln(x)</code>, <code>log(x)</code>, <code>exp(x)</code>, <code>pot(x; n)</code>, <code>min(…)</code>, <code>max(…)</code>, <code>si(condición; sí; no)</code></li>
        <li>De toda la columna: <code>suma(A)</code>, <code>media(A)</code>, <code>mediana(A)</code>, <code>desv(A)</code>, <code>contar(A)</code>, <code>min(A)</code>, <code>max(A)</code></li>
        <li>Separa los argumentos con <code>;</code></li></ul></details>
    </div>
    <div class="actions" style="justify-content:space-between">
      <div style="display:flex;gap:6px">
        <button class="btn small" data-act="left" ${j === 0 ? "disabled" : ""} aria-label="Mover a la izquierda">◀</button>
        <button class="btn small" data-act="right" ${j === p.cols.length - 1 ? "disabled" : ""} aria-label="Mover a la derecha">▶</button>
        <button class="btn small danger" data-act="del" ${p.cols.length < 2 ? "disabled" : ""}>Borrar</button>
      </div>
      <div style="display:flex;gap:6px"><button class="btn ghost" data-act="close">Cancelar</button><button class="btn primary" data-act="save">Guardar</button></div>
    </div>
    <div id="delBox" hidden class="explain">Se borrará la columna ${L(j)} y sus datos. Las fórmulas que la usen dejarán de funcionar.
      <div class="actions" style="margin-top:8px"><button class="btn" data-act="nodel">Cancelar</button><button class="btn danger" data-act="del2">Borrar columna</button></div></div>`,
  act => {
    if (act.startsWith("mode:")) {
      mode = act.slice(5);
      document.querySelectorAll(".seg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.act === act));
      $("#fBox").hidden = mode !== "f"; if (mode === "f") { $("#colFormula").focus(); check(); }
    }
    if (act.startsWith("ex:")) { $("#colFormula").value = act.slice(3); check(); }
    if (act === "autocolor") { const prev = c.color; c.color = null; $("#colColor").value = toHex(colColor(c)); c.color = prev; autoColor = true; }
    if (act === "save") {
      c.name = $("#colName").value.trim() || L(j);
      c.color = autoColor ? null : $("#colColor").value;
      if (mode === "f") {
        const f = $("#colFormula").value.trim();
        if (!f) { $("#fMsg").className = "err"; $("#fMsg").textContent = "Escribe una fórmula o elige «Datos que escribo»."; return; }
        c.formula = f;
      } else c.formula = null;
      dirty(); persist(); renderTable(); refresh(); closeSheet();
    }
    if (act === "left" || act === "right") {
      const k = act === "left" ? j - 1 : j + 1;
      const map = {}; p.cols.forEach((_, i) => (map[i] = i)); map[j] = k; map[k] = j;
      [p.cols[j], p.cols[k]] = [p.cols[k], p.cols[j]]; remapFormulas(p, map);
      dirty(); persist(); renderTable(); refresh(); openColumn(id);
    }
    if (act === "del") $("#delBox").hidden = false;
    if (act === "nodel") $("#delBox").hidden = true;
    if (act === "del2") {
      const map = {}; p.cols.forEach((_, i) => (map[i] = i < j ? i : i === j ? -1 : i - 1));
      p.cols.splice(j, 1); p.rows.forEach(r => delete r.c[id]); remapFormulas(p, map);
      p.chart.series = p.chart.series.filter(s => s !== id);
      dirty(); persist(); renderTable(); refresh(); closeSheet(); toast("Columna borrada");
    }
  });
  $("#colColor").addEventListener("input", () => { autoColor = false; });
  const check = () => {
    const f = $("#colFormula").value.trim(), msg = $("#fMsg");
    if (!f) { msg.className = "hint"; msg.textContent = "Ejemplo: " + ex[2]; return; }
    try {
      const comp = S.compileFormula(f, p.cols.length);
      if (comp.deps.includes(j)) throw new Error("La fórmula no puede usar su propia columna.");
      const trial = p.cols.map((k, i) => (i === j ? { formula: f } : k));
      const raw = p.rows.map(r => p.cols.map(k => r.c[k.id] ?? ""));
      const res = S.computeTable(trial, raw);
      if (res.errors[j]) throw new Error(res.errors[j]);
      const vals = res.values[j].filter(Number.isFinite).slice(0, 4).map(fmtSig);
      msg.className = "ok"; msg.textContent = vals.length ? "✓ " + vals.join(" · ") + (res.values[j].filter(Number.isFinite).length > 4 ? " …" : "") : "✓ Fórmula correcta (aún no hay valores)";
    } catch (err) { msg.className = "err"; msg.textContent = err.message; }
  };
  $("#colFormula").addEventListener("input", check);
  if (mode === "f") check();
  if (isNew) setTimeout(() => { $("#colName").select(); }, 60);
}
function toHex(color) {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  if (/^#[0-9a-f]{3}$/i.test(color)) return "#" + color.slice(1).split("").map(x => x + x).join("");
  const c = document.createElement("canvas").getContext("2d"); c.fillStyle = color; return c.fillStyle.startsWith("#") ? c.fillStyle : "#0e6b5c";
}

/* =========================================================
   Importar: pegar, CSV y Excel
   ========================================================= */
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
function fromMatrix(m) {
  m = m.map(r => r.map(x => (x === null || x === undefined ? "" : String(x).trim())));
  m = m.filter(r => r.some(x => x !== ""));
  if (!m.length) return null;
  const width = Math.max(...m.map(r => r.length));
  m = m.map(r => { const c = [...r]; while (c.length < width) c.push(""); return c; });
  const isNum = x => Number.isFinite(S.parseNum(x));
  let keep = []; for (let j = 0; j < width; j++) if (m.some(r => r[j] !== "")) keep.push(j);
  m = m.map(r => keep.map(j => r[j]));
  const w = keep.length;
  // ¿la primera fila es un encabezado?
  const header = m.length > 1 && m[0].some((x, j) => x !== "" && !isNum(x) && m.slice(1).some(r => isNum(r[j]))) ? m.shift() : null;
  // ¿la primera columna son etiquetas?
  const nonEmpty0 = m.map(r => r[0]).filter(x => x !== "");
  const labelCol = w > 1 && nonEmpty0.filter(x => !isNum(x)).length >= nonEmpty0.length / 2;
  const start = labelCol ? 1 : 0;
  const cols = [];
  for (let j = start; j < w; j++) {
    const vals = m.map(r => r[j]).filter(x => x !== "");
    if (vals.length && vals.filter(isNum).length >= vals.length / 2) cols.push(j);
  }
  const skipped = w - start - cols.length;
  if (!cols.length) return null;
  return {
    labelName: labelCol && header ? header[0] || "Etiqueta" : "Etiqueta",
    colNames: cols.map((j, k) => (header && header[j]) || `Serie ${L(k)}`),
    rows: m.map(r => [labelCol ? r[0] : "", ...cols.map(j => r[j])]),
    skipped, preview: [header || null, ...m.slice(0, 6)].filter(Boolean)
  };
}
function importFlow(sheets, suggestedName) { // sheets: [{name, matrix}]
  let idx = 0;
  const draw = () => {
    const t = fromMatrix(sheets[idx].matrix);
    const prev = t ? `<div class="preview"><table>${t.preview.slice(0, 7).map(r => `<tr>${r.slice(0, 8).map(x => `<td>${esc(x)}</td>`).join("")}</tr>`).join("")}</table></div>
      <p class="hint">${t.rows.length} filas · ${t.colNames.length} ${t.colNames.length === 1 ? "columna numérica" : "columnas numéricas"}: ${t.colNames.map(esc).join(", ")}${t.skipped ? ` · ${t.skipped} columna(s) de texto ignoradas` : ""}</p>`
      : `<p class="err">No he encontrado columnas con números en ${sheets.length > 1 ? "esta hoja" : "estos datos"}.</p>`;
    openSheet(`<h3>Importar datos</h3>
      ${sheets.length > 1 ? `<div class="field"><label class="label" for="sheetSel">Hoja</label><select id="sheetSel">${sheets.map((s, i) => `<option value="${i}" ${i === idx ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></div>` : ""}
      ${prev}
      <div class="actions"><button class="btn ghost" data-act="close">Cancelar</button>
        ${t ? `<button class="btn" data-act="replace">Reemplazar el proyecto actual</button><button class="btn primary" data-act="new">Crear proyecto nuevo</button>` : ""}</div>`,
    act => {
      if (!t) return;
      const defs = t.colNames.map(n => [n]);
      const build = () => mk(suggestedName || "Datos importados", t.labelName, defs, t.rows, { type: defs.length > 1 ? "bar" : "bar", series: defs.map((_, i) => i).slice(0, 6), x: 0, y: Math.min(1, defs.length - 1) }, { regX: 0, regY: Math.min(1, defs.length - 1) });
      if (act === "new") { addProject(build()); closeSheet(); toast(`${t.rows.length} filas importadas`); showView("view-data"); }
      if (act === "replace") {
        const p = cur(), n = build();
        Object.assign(p, { labelName: n.labelName, cols: n.cols, rows: n.rows, chart: Object.assign(p.chart, { series: n.chart.series, x: n.chart.x, y: n.chart.y }), stats: {} });
        dirty(); persist(); renderAll(); closeSheet(); toast(`${t.rows.length} filas importadas`);
      }
    });
    $("#sheetSel")?.addEventListener("change", e => { idx = +e.target.value; draw(); });
  };
  draw();
}
$("#pasteBtn").addEventListener("click", () => {
  openSheet(`<h3>Pegar datos</h3>
    <p class="hint">Copia celdas desde Excel, Google Sheets o un CSV y pégalas aquí. La primera fila puede ser el encabezado y la primera columna las etiquetas.</p>
    <textarea id="pasteArea" placeholder="Mes	Ventas	Gastos&#10;Enero	1200	800&#10;Febrero	1350	820"></textarea>
    <div class="actions"><button class="btn ghost" data-act="close">Cancelar</button><button class="btn primary" data-act="ok">Continuar</button></div>`,
  act => {
    if (act !== "ok") return;
    const m = parseText($("#pasteArea").value);
    if (!m.length) { toast("Pega primero algunos datos"); return; }
    importFlow([{ name: "Datos", matrix: m }]);
  });
  setTimeout(() => $("#pasteArea").focus(), 60);
});
let xlsxPromise = null;
function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return (xlsxPromise = xlsxPromise || new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = "xlsx.full.min.js";
    s.onload = () => res(window.XLSX); s.onerror = () => { xlsxPromise = null; rej(new Error("No se pudo cargar el lector de Excel. Ábrelo una vez con conexión.")); };
    document.head.appendChild(s);
  }));
}
$("#fileIn").addEventListener("change", async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  const name = f.name.replace(/\.[^.]+$/, "");
  try {
    if (/\.(xlsx|xls|ods)$/i.test(f.name)) {
      toast("Leyendo el archivo…");
      const [XLSX, buf] = await Promise.all([loadXLSX(), f.arrayBuffer()]);
      const wb = XLSX.read(buf, { type: "array" });
      const sheets = wb.SheetNames.map(n => ({ name: n, matrix: XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: "" }) })).filter(s => s.matrix.length);
      if (!sheets.length) throw new Error("El archivo no tiene datos.");
      importFlow(sheets, name);
    } else {
      let text = await f.text();
      if (text.includes("\uFFFD")) { const buf = await f.arrayBuffer(); text = new TextDecoder("windows-1252").decode(buf); }
      const m = parseText(text);
      if (!m.length) throw new Error("El archivo está vacío.");
      importFlow([{ name: "Datos", matrix: m }], name);
    }
  } catch (err) { toast(err.message || "No se pudo leer el archivo"); }
});

/* =========================================================
   Gráficos
   ========================================================= */
const ICON = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${d}</svg>`;
const TYPES = [
  { id: "bar", name: "Barras", icon: '<path d="M4 20V11M10 20V5M16 20v-8M21 20H3"/>' },
  { id: "barh", name: "Horizontal", icon: '<path d="M4 4v16M4 7h9M4 12h14M4 17h6"/>' },
  { id: "stacked", name: "Apiladas", icon: '<path d="M6 20v-6h4v6M6 14V9h4v5M14 20v-9h4v9M14 11V5h4v6M3 20h18"/>' },
  { id: "line", name: "Líneas", icon: '<path d="M3 17l5-6 4 3 8-9"/>' },
  { id: "area", name: "Áreas", icon: '<path d="M3 19l5-7 4 3 8-9v13z"/>' },
  { id: "pie", name: "Sectores", icon: '<circle cx="12" cy="12" r="8"/><path d="M12 4v8l6 5"/>' },
  { id: "doughnut", name: "Anillo", icon: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>' },
  { id: "radar", name: "Radar", icon: '<path d="M12 3l8 6-3 10H7L4 9z"/><path d="M12 8l4 3-1.5 4h-5L8 11z"/>' },
  { id: "scatter", name: "Dispersión", icon: '<circle cx="6" cy="16" r="1.6"/><circle cx="11" cy="11" r="1.6"/><circle cx="15" cy="13" r="1.6"/><circle cx="18" cy="6" r="1.6"/>' },
  { id: "hist", name: "Histograma", icon: '<path d="M3 20h18M5 20v-6h4v6M9 20V8h4v12M13 20v-9h4v9M17 20v-4h3"/>' },
  { id: "box", name: "Caja", icon: '<path d="M12 3v4M12 17v4M9 3h6M9 21h6"/><rect x="6" y="7" width="12" height="10" rx="1"/><path d="M6 12h12"/>' }
];
const SINGLE = ["pie", "doughnut", "hist"];
$("#types").innerHTML = TYPES.map(t => `<button data-type="${t.id}" aria-pressed="false">${ICON(t.icon)}${t.name}</button>`).join("");
$("#types").addEventListener("click", e => {
  const b = e.target.closest("[data-type]"); if (!b) return;
  const ch = cur().chart; ch.type = b.dataset.type;
  if (!SINGLE.includes(ch.type) && ch.type !== "scatter" && ch.series.length < 1 && cur().cols[0]) ch.series = [cur().cols[0].id];
  persist(); renderChart();
});
$("#seriesChips").addEventListener("click", e => {
  const b = e.target.closest("[data-s]"); if (!b) return;
  const ch = cur().chart, id = b.dataset.s;
  if (SINGLE.includes(ch.type)) ch.one = id;
  else ch.series = ch.series.includes(id) ? ch.series.filter(s => s !== id) : cur().cols.map(c => c.id).filter(c => c === id || ch.series.includes(c));
  persist(); renderChart();
});
["chartX", "chartY", "chartModel"].forEach(k => $("#" + k).addEventListener("change", e => {
  const ch = cur().chart; ch[{ chartX: "x", chartY: "y", chartModel: "model" }[k]] = e.target.value; persist(); renderChart();
}));
$("#optMean").addEventListener("change", e => { cur().chart.showMean = e.target.checked; persist(); renderChart(); });
$("#optValues").addEventListener("change", e => { cur().chart.showValues = e.target.checked; persist(); renderChart(); });
$("#optBins").addEventListener("input", e => { const v = parseInt(e.target.value, 10); cur().chart.bins = v >= 2 && v <= 40 ? v : null; persist(); scheduleRefresh(); });

const valueLabels = {
  id: "valueLabels",
  afterDatasetsDraw(chart, _a, opts) {
    if (!opts.show) return;
    const { ctx } = chart, t = opts.kind;
    ctx.save(); ctx.font = `500 ${opts.size}px ${css("--mono")}`;
    chart.data.datasets.forEach((ds, di) => {
      if (ds._noLabels || !chart.isDatasetVisible(di)) return;
      chart.getDatasetMeta(di).data.forEach((el, i) => {
        const v = ds.data[i]; if (v == null || typeof v === "object") return;
        if (t === "pie" || t === "doughnut") {
          const tot = ds.data.reduce((s, x) => s + (x || 0), 0), pos = el.tooltipPosition();
          if (v / tot < 0.04) return;
          ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.fillText(fmt((v / tot) * 100, 0) + " %", pos.x, pos.y + 4);
        } else if (t === "barh") {
          ctx.fillStyle = css("--ink"); ctx.textAlign = "left"; ctx.fillText(fmt(v), el.x + 4, el.y + 4);
        } else if (t === "stacked") {
          ctx.fillStyle = "#fff"; ctx.textAlign = "center"; if (Math.abs(el.base - el.y) > 14) ctx.fillText(fmt(v), el.x, (el.y + el.base) / 2 + 4);
        } else { ctx.fillStyle = css("--ink"); ctx.textAlign = "center"; ctx.fillText(fmt(v), el.x, el.y - 6); }
      });
    });
    ctx.restore();
  }
};
const boxPlugin = {
  id: "boxplot",
  afterDatasetsDraw(chart, _a, o) {
    if (!o.stats) return;
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
Chart.register(valueLabels, boxPlugin);

let chart;
function renderChartTitle() { $("#chartTitle").textContent = cur().name; }
function fillColSelect(sel, value, fallbackIdx = 0) {
  const p = cur(); const v = validId(value, fallbackIdx);
  sel.innerHTML = p.cols.map((c, j) => `<option value="${c.id}" ${c.id === v ? "selected" : ""}>${L(j)} · ${esc(colName(c))}</option>`).join("");
  return v;
}
function fillModelSelect(sel, value) {
  sel.innerHTML = Object.entries(S.MODELS).map(([k, n]) => `<option value="${k}" ${k === value ? "selected" : ""}>${n}</option>`).join("");
}
function renderChartControls() {
  const p = cur(), ch = p.chart;
  ch.series = ch.series.filter(id => p.cols.some(c => c.id === id));
  ch.one = validId(ch.one || ch.series[0], 0);
  const single = SINGLE.includes(ch.type);
  document.querySelectorAll("#types [data-type]").forEach(b => b.setAttribute("aria-pressed", b.dataset.type === ch.type));
  const isXY = ch.type === "scatter";
  $("#seriesRow").hidden = isXY; $("#xyRow").hidden = !isXY;
  $("#seriesChips").innerHTML = p.cols.map((c, j) => `<button data-s="${c.id}" aria-pressed="${single ? c.id === ch.one : ch.series.includes(c.id)}"><i style="background:${colColor(c)}"></i>${esc(colName(c))}</button>`).join("");
  if (isXY) { ch.x = fillColSelect($("#chartX"), ch.x, 0); ch.y = fillColSelect($("#chartY"), ch.y, 1); fillModelSelect($("#chartModel"), ch.model || "linear"); }
  $("#optMeanW").hidden = !["bar", "line", "area"].includes(ch.type);
  $("#optValuesW").hidden = !["bar", "barh", "stacked", "line", "area", "pie", "doughnut"].includes(ch.type);
  $("#binsWrap").hidden = ch.type !== "hist";
  $("#optMean").checked = !!ch.showMean; $("#optValues").checked = !!ch.showValues; $("#optBins").value = ch.bins || "";
  renderChartTitle();
}
function buildConfig() {
  const p = cur(), ch = p.chart, d = data();
  const ink = css("--ink"), muted = css("--muted"), grid = css("--grid"), pal = palette();
  const fs = { s: 10, m: 12, l: 15 }[ch.font] || 12;
  Chart.defaults.font.family = css("--body"); Chart.defaults.font.size = fs; Chart.defaults.color = muted;
  const legend = { display: ch.legend !== "none", position: ch.legend === "bottom" ? "bottom" : "top", labels: { color: ink, boxWidth: 12, font: { size: fs } } };
  const base = {
    responsive: true, maintainAspectRatio: false, animation: { duration: 250 },
    plugins: {
      legend, tooltip: { callbacks: {} },
      title: { display: !!ch.title, text: ch.title, color: ink, font: { family: css("--display"), size: fs + 5, weight: "600" }, padding: { bottom: 10 } },
      valueLabels: { show: !!ch.showValues, kind: ch.type, size: Math.max(9, fs - 1) }, boxplot: {}
    },
    scales: {
      x: { ticks: { color: muted }, grid: { color: grid }, title: { display: !!ch.xTitle, text: ch.xTitle, color: muted } },
      y: { ticks: { color: muted, font: { family: css("--mono") } }, grid: { color: grid }, beginAtZero: ch.zero !== false, title: { display: !!ch.yTitle, text: ch.yTitle, color: muted } }
    }
  };
  const labels = d.labels;
  const sel = ch.series.map(colById).filter(Boolean);
  const need = msg => ({ empty: msg });

  if (["bar", "barh", "stacked", "line", "area"].includes(ch.type)) {
    if (!sel.length) return need("Elige al menos una serie.");
    if (!sel.some(c => d.vals(c.id).length)) return need("Las series elegidas no tienen datos todavía.");
    const kind = ch.type === "area" ? "line" : ch.type === "line" ? "line" : "bar";
    const ds = sel.map(c => {
      const col = colColor(c);
      return { label: colName(c), data: d.series(c.id), borderColor: col, borderWidth: 2,
        backgroundColor: kind === "bar" ? col : alpha(toHex(col), ch.type === "area" ? 0.22 : 0.1),
        fill: ch.type === "area" ? "origin" : false, tension: 0.25, pointRadius: 3.5, borderRadius: ch.type === "stacked" ? 0 : 4, spanGaps: true };
    });
    if (ch.showMean && ["bar", "line", "area"].includes(ch.type)) sel.forEach(c => {
      const m = S.mean(d.vals(c.id)); if (!Number.isFinite(m)) return;
      ds.push({ type: "line", label: `Media ${colName(c)}`, data: labels.map(() => m), borderColor: colColor(c), borderDash: [6, 5], borderWidth: 1.5, pointRadius: 0, fill: false, _noLabels: true });
    });
    if (ch.type === "barh") { base.indexAxis = "y"; base.scales.x.beginAtZero = ch.zero !== false; base.scales.x.ticks.font = { family: css("--mono") }; delete base.scales.y.ticks.font; }
    if (ch.type === "stacked") { base.scales.x.stacked = true; base.scales.y.stacked = true; }
    if (ds.length === 1) legend.display = false;
    return { type: kind, data: { labels, datasets: ds }, options: base };
  }
  if (ch.type === "pie" || ch.type === "doughnut") {
    const c = colById(ch.one) || p.cols[0]; if (!c) return need("Añade una columna con datos.");
    const items = d.rowIdx.map((ri, k) => ({ label: labels[k], v: d.byId[c.id][ri] })).filter(o => Number.isFinite(o.v) && o.v > 0);
    if (!items.length) return need("Para sectores hacen falta valores positivos en la serie elegida.");
    delete base.scales;
    if (ch.legend === "top") legend.position = "bottom";
    base.cutout = ch.type === "doughnut" ? "58%" : 0;
    base.plugins.tooltip.callbacks.label = x => { const t = x.dataset.data.reduce((s, v) => s + v, 0); return ` ${x.label}: ${fmt(x.raw)} (${fmt((x.raw / t) * 100, 1)} %)`; };
    return { type: ch.type, data: { labels: items.map(o => o.label), datasets: [{ label: colName(c), data: items.map(o => o.v), backgroundColor: items.map((_, i) => pal[i % pal.length]), borderColor: css("--sheet"), borderWidth: 2 }] }, options: base };
  }
  if (ch.type === "radar") {
    if (!sel.length) return need("Elige al menos una serie.");
    if (labels.length < 3) return need("El radar necesita al menos 3 filas con datos.");
    const ds = sel.map(c => ({ label: colName(c), data: d.series(c.id), borderColor: colColor(c), backgroundColor: alpha(toHex(colColor(c)), 0.15), borderWidth: 2, pointRadius: 3 }));
    delete base.scales;
    base.scales = { r: { beginAtZero: ch.zero !== false, grid: { color: grid }, angleLines: { color: grid }, pointLabels: { color: ink, font: { size: fs } }, ticks: { color: muted, backdropColor: "transparent", font: { family: css("--mono"), size: fs - 2 } } } };
    if (ds.length === 1) legend.display = false;
    return { type: "radar", data: { labels, datasets: ds }, options: base };
  }
  if (ch.type === "scatter") {
    const cx = colById(ch.x), cy = colById(ch.y);
    if (!cx || !cy) return need("Elige las columnas X e Y.");
    const X = d.byId[cx.id], Y = d.byId[cy.id];
    const pts = []; X.forEach((x, i) => { if (Number.isFinite(x) && Number.isFinite(Y[i])) pts.push({ x, y: Y[i] }); });
    if (!pts.length) return need(`Rellena ${colName(cx)} y ${colName(cy)} en las mismas filas para ver la dispersión.`);
    const ds = [{ label: `${colName(cy)} según ${colName(cx)}`, data: pts, backgroundColor: colColor(cy), pointRadius: 5, _noLabels: true }];
    const f = S.fit(ch.model || "linear", X, Y);
    if (!f.error) {
      const line = []; for (let k = 0; k <= 80; k++) { const x = f.xmin + ((f.xmax - f.xmin) * k) / 80, y = f.predict(x); if (Number.isFinite(y)) line.push({ x, y }); }
      ds.push({ type: "line", label: `${f.name} · R² = ${fmt(f.r2, 3)}`, data: line, borderColor: cx === cy ? css("--amber") : (colColor(cy) === css("--amber") ? css("--accent") : css("--amber")), borderWidth: 2, pointRadius: 0, tension: 0, _noLabels: true });
    }
    base.scales.x.type = "linear"; base.scales.y.beginAtZero = false;
    base.scales.x.title = { display: true, text: ch.xTitle || colName(cx), color: muted };
    base.scales.y.title = { display: true, text: ch.yTitle || colName(cy), color: muted };
    base.plugins.tooltip.callbacks.label = x => ` (${fmt(x.raw.x)}; ${fmt(x.raw.y)})`;
    return { type: "scatter", data: { datasets: ds }, options: base };
  }
  if (ch.type === "hist") {
    const c = colById(ch.one) || p.cols[0]; if (!c) return need("Añade una columna con datos.");
    const vals = d.vals(c.id); if (vals.length < 2) return need("El histograma necesita al menos 2 valores.");
    const fr = S.frequency(vals, ch.bins || (vals.length > 6 ? undefined : undefined));
    const labs = fr.rows.map(r => (fr.grouped ? intervalLabel(r) : fmt(r.value)));
    legend.display = false; base.scales.x.grid.display = false; base.scales.y.ticks.precision = 0;
    base.scales.y.title = { display: true, text: ch.yTitle || "Frecuencia", color: muted };
    base.scales.x.title = { display: true, text: ch.xTitle || colName(c), color: muted };
    return { type: "bar", data: { labels: labs, datasets: [{ label: "Frecuencia", data: fr.rows.map(r => r.fi), backgroundColor: colColor(c), borderColor: css("--sheet"), borderWidth: 1, barPercentage: fr.grouped ? 1 : 0.8, categoryPercentage: fr.grouped ? 1 : 0.8 }] }, options: base };
  }
  if (ch.type === "box") {
    const cs = sel.filter(c => d.vals(c.id).length >= 2);
    if (!cs.length) return need("Elige series con al menos 2 valores.");
    const st = cs.map(c => S.describe(d.vals(c.id))), colors = cs.map(colColor);
    legend.display = false; base.scales.y.beginAtZero = false;
    base.scales.y.suggestedMin = Math.min(...st.map(s => s.min)); base.scales.y.suggestedMax = Math.max(...st.map(s => s.max));
    base.scales.x.grid.display = false;
    base.plugins.boxplot = { stats: st, colors };
    base.plugins.tooltip.callbacks.label = x => { const s = st[x.dataIndex]; return [` Máx: ${fmt(s.max)}`, ` Q3: ${fmt(s.q3)}`, ` Mediana: ${fmt(s.median)}`, ` Media: ${fmt(s.mean)}`, ` Q1: ${fmt(s.q1)}`, ` Mín: ${fmt(s.min)}`]; };
    return { type: "bar", data: { labels: cs.map(colName), datasets: [{ label: "Caja", data: st.map(s => [s.q1, s.q3]), backgroundColor: colors.map(c => alpha(toHex(c), 0.25)), borderColor: colors, borderWidth: 1.5, borderSkipped: false, barPercentage: 0.5 }] }, options: base };
  }
  return need("Tipo de gráfico desconocido.");
}
function intervalLabel(r) { return `${fmt(r.from)}–${fmt(r.to)}`; }
function renderChart() {
  renderChartControls();
  if (chart) { chart.destroy(); chart = null; }
  const cfg = buildConfig();
  const empty = $("#chartEmpty");
  if (cfg.empty) { empty.hidden = false; empty.textContent = cfg.empty; return; }
  empty.hidden = true;
  if ($("#view-chart").offsetParent === null && window.innerWidth < 1000) return; // vista oculta: se dibuja al mostrarla
  chart = new Chart($("#chart"), cfg);
}

/* personalizar */
$("#customBtn").addEventListener("click", () => {
  const p = cur(), ch = p.chart;
  const seg = (name, opts, val) => `<div class="seg" role="group" data-seg="${name}">${opts.map(([v, t]) => `<button data-act="seg:${name}:${v}" aria-pressed="${v === val}">${t}</button>`).join("")}</div>`;
  openSheet(`<h3>Personalizar gráfico</h3>
    <div class="field"><label class="label" for="cTitle">Título</label><input type="text" id="cTitle" value="${esc(ch.title)}" placeholder="Sin título"></div>
    <div class="row2">
      <div class="field"><label class="label" for="cX">Nombre del eje X</label><input type="text" id="cX" value="${esc(ch.xTitle)}"></div>
      <div class="field"><label class="label" for="cY">Nombre del eje Y</label><input type="text" id="cY" value="${esc(ch.yTitle)}"></div>
    </div>
    <div class="field"><span class="label">Tamaño de letra</span>${seg("font", [["s", "Pequeña"], ["m", "Normal"], ["l", "Grande"]], ch.font)}</div>
    <div class="field"><span class="label">Leyenda</span>${seg("legend", [["top", "Arriba"], ["bottom", "Abajo"], ["none", "Oculta"]], ch.legend)}</div>
    <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="cZero" ${ch.zero !== false ? "checked" : ""}> Empezar el eje en cero</label>
    <div class="field"><span class="label">Colores de las series</span>
      <div class="colorlist">${p.cols.map(c => `<label><input type="color" data-color="${c.id}" value="${toHex(colColor(c))}"><span>${esc(colName(c))}</span></label>`).join("")}</div>
      <button class="btn small ghost" data-act="resetColors" style="align-self:flex-start">Volver a los colores automáticos</button></div>
    <div class="actions"><button class="btn primary" data-act="close">Hecho</button></div>`,
  act => {
    if (act.startsWith("seg:")) {
      const [, k, v] = act.split(":"); ch[k] = v;
      document.querySelectorAll(`[data-seg="${k}"] button`).forEach(b => b.setAttribute("aria-pressed", b.dataset.act === act));
      persist(); renderChart();
    }
    if (act === "resetColors") { p.cols.forEach(c => (c.color = null)); document.querySelectorAll("[data-color]").forEach(i => (i.value = toHex(colColor(colById(i.dataset.color))))); persist(); renderTable(); renderChart(); }
  });
  const upd = () => { ch.title = $("#cTitle").value; ch.xTitle = $("#cX").value; ch.yTitle = $("#cY").value; ch.zero = $("#cZero").checked; persist(); scheduleChart(); };
  ["cTitle", "cX", "cY"].forEach(id => $("#" + id).addEventListener("input", upd)); $("#cZero").addEventListener("change", upd);
  document.querySelectorAll("[data-color]").forEach(i => i.addEventListener("input", () => { colById(i.dataset.color).color = i.value; persist(); scheduleChart(); }));
});
let chartT; const scheduleChart = () => { clearTimeout(chartT); chartT = setTimeout(() => { renderChart(); renderTableHeadColors(); }, 120); };
function renderTableHeadColors() { document.querySelectorAll("#thead [data-col] i").forEach(i => { const c = colById(i.closest("[data-col]").dataset.col); if (c) i.style.background = colColor(c); }); }

/* exportar imagen */
$("#exportBtn").addEventListener("click", () => {
  if (!chart) { toast("Primero añade datos al gráfico"); return; }
  const src = chart.canvas, dpr = window.devicePixelRatio || 1, pad = 24 * dpr, hasTitle = !!cur().chart.title, titleH = hasTitle ? 0 : 40 * dpr;
  const out = document.createElement("canvas"); out.width = src.width + pad * 2; out.height = src.height + pad * 2 + titleH;
  const ctx = out.getContext("2d"); ctx.fillStyle = css("--sheet"); ctx.fillRect(0, 0, out.width, out.height);
  if (!hasTitle) { ctx.fillStyle = css("--ink"); ctx.font = `600 ${Math.round(20 * dpr)}px ${css("--display")}`; ctx.fillText(cur().name, pad, pad + 20 * dpr); }
  ctx.drawImage(src, pad, pad + titleH);
  const url = out.toDataURL("image/png");
  const fname = (cur().chart.title || cur().name).replace(/[^\w\- áéíóúñÁÉÍÓÚÑ]/g, "").trim() + ".png";
  try { const a = document.createElement("a"); a.href = url; a.download = fname; document.body.appendChild(a); a.click(); a.remove(); } catch {}
  openSheet(`<h3>Imagen del gráfico</h3><img src="${url}" alt="Gráfico ${esc(cur().name)}"><p class="hint">Si no se ha descargado, mantén pulsada la imagen y elige «Guardar imagen».</p><div class="actions"><button class="btn primary" data-act="close">Hecho</button></div>`, () => {});
});

/* =========================================================
   Estadísticas
   ========================================================= */
const EXPLAIN = {
  "Media": "La suma de todos los valores dividida entre cuántos hay.",
  "Mediana": "El valor que queda en el centro al ordenarlos. Le afectan poco los valores extremos.",
  "Moda": "El valor que más se repite.",
  "Desviación típica": "Cuánto se separan los datos de la media, de promedio. Cuanto mayor, más dispersos. Es la muestral (divide entre n − 1).",
  "Varianza": "La desviación típica al cuadrado.",
  "Q1 / Q3": "El 25 % de los datos está por debajo de Q1 y el 75 % por debajo de Q3.",
  "Rango intercuartílico": "Q3 − Q1: el ancho de la mitad central de los datos.",
  "Coef. de variación": "La desviación típica en porcentaje de la media. Sirve para comparar la dispersión de series distintas.",
  "Valores atípicos": "Datos que se alejan mucho del resto: más de 1,5 veces el rango intercuartílico por debajo de Q1 o por encima de Q3.",
  "fi": "Frecuencia absoluta: cuántas veces aparece el valor o cuántos datos caen en el intervalo.",
  "Fi": "Frecuencia absoluta acumulada: la suma de fi hasta esa fila.",
  "hi": "Frecuencia relativa: fi dividida entre el total de datos.",
  "Hi": "Frecuencia relativa acumulada: la suma de hi hasta esa fila.",
  "xi": "Marca de clase: el punto medio del intervalo.",
  "R²": "Coeficiente de determinación: qué parte de la variación de Y explica el modelo. 1 = la explica entera, 0 = nada.",
  "Correlación (r)": "De −1 a 1. Cerca de 1: cuando X sube, Y sube. Cerca de −1: cuando X sube, Y baja. Cerca de 0: no hay relación lineal."
};
const info = k => (EXPLAIN[k] ? `<button class="info" data-k="${esc(k)}" aria-label="Qué es ${esc(k)}">ⓘ</button>` : "");
function fillStatSelects() {
  const p = cur(), st = p.stats = p.stats || {};
  const idx = v => (typeof v === "number" ? p.cols[v]?.id : v);
  st.sumCol = fillColSelect($("#sumCol"), idx(st.sumCol), 0);
  st.freqCol = fillColSelect($("#freqCol"), idx(st.freqCol), 0);
  st.regX = fillColSelect($("#regX"), idx(st.regX), 0);
  st.regY = fillColSelect($("#regY"), idx(st.regY), 1);
  st.regModel = st.regModel || "linear"; fillModelSelect($("#regModel"), st.regModel);
  $("#freqBins").value = st.freqBins || "";
}
["sumCol", "freqCol", "regX", "regY", "regModel"].forEach(k => $("#" + k).addEventListener("change", e => { cur().stats[k] = e.target.value; persist(); renderStats(); }));
$("#freqBins").addEventListener("input", e => { const v = parseInt(e.target.value, 10); cur().stats.freqBins = v >= 2 && v <= 40 ? v : null; persist(); renderFreq(); });

function summaryRows(s) {
  return [
    ["Datos (n)", fmt(s.n, 0)], ["Suma", fmt(s.sum)], ["Media", fmt(s.mean)], ["Mediana", fmt(s.median)],
    ["Moda", s.mode.length ? s.mode.slice(0, 3).map(x => fmt(x)).join(" · ") + (s.mode.length > 3 ? "…" : "") : "Sin moda"],
    ["Mínimo", fmt(s.min)], ["Máximo", fmt(s.max)], ["Rango", fmt(s.max - s.min)],
    ["Desviación típica", fmt(s.sd)], ["Varianza", fmt(s.variance)],
    ["Q1 / Q3", `${fmt(s.q1)} / ${fmt(s.q3)}`], ["Rango intercuartílico", fmt(s.iqr)],
    ["Coef. de variación", Number.isFinite(s.cv) ? fmt(s.cv, 1) + " %" : "—"],
    ["Valores atípicos", s.outliers.length ? `<span class="warn">${s.outliers.slice(0, 6).map(x => fmt(x)).join(" · ")}${s.outliers.length > 6 ? "…" : ""}</span>` : "Ninguno"]
  ];
}
function renderSummary() {
  const d = data(), id = cur().stats.sumCol, vals = d.vals(id);
  if (!vals.length) { $("#summary").innerHTML = `<p class="hint">Esta serie no tiene números todavía.</p>`; return; }
  const rows = summaryRows(S.describe(vals));
  $("#summary").innerHTML = `<dl class="stats two">${rows.map(([k, v]) => `<dt>${k}${info(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;
}
let lastFreq = null;
function renderFreq() {
  const d = data(), st = cur().stats, vals = d.vals(st.freqCol);
  if (vals.length < 2) { $("#freq").innerHTML = `<p class="hint">Hacen falta al menos 2 valores.</p>`; lastFreq = null; return; }
  const fr = S.frequency(vals, st.freqBins || undefined); lastFreq = fr;
  const maxF = Math.max(...fr.rows.map(r => r.fi));
  $("#freq").innerHTML = `<div class="ftable-wrap"><table class="freq"><thead><tr>
      <th>${fr.grouped ? "Intervalo" : "Valor"}</th>${fr.grouped ? `<th>xi ${info("xi")}</th>` : ""}<th>fi ${info("fi")}</th><th>Fi ${info("Fi")}</th><th>hi ${info("hi")}</th><th>Hi ${info("Hi")}</th><th>%</th></tr></thead>
    <tbody>${fr.rows.map(r => `<tr><td>${fr.grouped ? `[${fmt(r.from)}, ${fmt(r.to)}${r.last ? "]" : ")"}` : fmt(r.value)}</td>${fr.grouped ? `<td>${fmt(r.mark)}</td>` : ""}
      <td>${r.fi}</td><td>${r.Fi}</td><td>${fmt(r.hi, 3)}</td><td>${fmt(r.Hi, 3)}</td><td>${fmt(r.hi * 100, 1)}<span class="bar" style="width:${Math.round((r.fi / maxF) * 40)}px"></span></td></tr>`).join("")}</tbody>
    <tfoot><tr><td>Total</td>${fr.grouped ? "<td></td>" : ""}<td>${fr.n}</td><td></td><td>1</td><td></td><td>100</td></tr></tfoot></table></div>
    ${fr.grouped ? `<p class="hint">Intervalos ${st.freqBins ? "elegidos por ti" : "calculados con la regla de Sturges"}. Cambia el número de intervalos arriba si lo necesitas.</p>` : ""}`;
}
let lastReg = null;
function renderReg() {
  const d = data(), st = cur().stats;
  const X = d.byId[st.regX] || [], Y = d.byId[st.regY] || [];
  const cx = colById(st.regX), cy = colById(st.regY);
  if (st.regX === st.regY) { $("#reg").innerHTML = `<p class="hint">Elige dos columnas distintas para X e Y.</p>`; lastReg = null; return; }
  const f = S.fit(st.regModel, X, Y, fmtSig); lastReg = f;
  if (f.error) { $("#reg").innerHTML = `<p class="hint">${esc(f.error)}</p>`; return; }
  const all = Object.keys(S.MODELS).map(k => S.fit(k, X, Y)).filter(m => !m.error).sort((a, b) => b.r2 - a.r2);
  let strength = "";
  if (f.type === "linear") {
    const a = Math.abs(f.r); strength = `Relación ${a >= 0.7 ? "fuerte" : a >= 0.4 ? "moderada" : "débil"} y ${f.r >= 0 ? "positiva" : "negativa"}`;
  } else strength = `El modelo explica el ${fmt(f.r2 * 100, 1)} % de la variación de ${esc(colName(cy))}`;
  $("#reg").innerHTML = `<div class="eq">${esc(f.eq)}</div>
    <dl class="stats two">
      <dt>R²${info("R²")}</dt><dd>${fmt(f.r2, 4)}</dd>
      ${f.type === "linear" ? `<dt>Correlación (r)${info("Correlación (r)")}</dt><dd>${fmt(f.r, 4)}</dd>` : ""}
      <dt>Parejas usadas</dt><dd>${f.n}${f.dropped ? ` <span class="warn">(${f.dropped} descartadas)</span>` : ""}</dd>
      <dt>Interpretación</dt><dd style="font-family:var(--body);font-weight:400;text-align:right">${strength}</dd>
    </dl>
    ${f.dropped ? `<p class="hint">Este modelo solo admite ${f.type === "exponential" ? "valores de Y positivos" : f.type === "logarithmic" ? "valores de X positivos" : "valores de X e Y positivos"}.</p>` : ""}
    <div class="predict"><label for="predX">Si ${esc(colName(cx))} =</label><input type="text" inputmode="decimal" id="predX" placeholder="${fmt((f.xmin + f.xmax) / 2, 1)}"><span>→ ${esc(colName(cy))} ≈</span><output id="predY">—</output></div>
    <details class="help"><summary>Comparar todos los modelos</summary>
      <dl class="stats" style="margin-top:6px">${all.map(m => `<dt>${m.name}</dt><dd>R² = ${fmt(m.r2, 4)}</dd>`).join("")}</dl>
      <p class="hint" style="margin-top:6px">Un R² más alto se ajusta mejor a estos puntos, pero los polinomios de grado alto pueden dar predicciones raras fuera del rango de los datos.</p></details>`;
  $("#predX").addEventListener("input", e => {
    const x = S.parseNum(e.target.value), y = Number.isFinite(x) ? f.predict(x) : NaN;
    $("#predY").textContent = fmtSig(y) + (Number.isFinite(x) && (x < f.xmin || x > f.xmax) ? " (fuera del rango de tus datos)" : "");
  });
}
function renderStats() { fillStatSelects(); renderSummary(); renderFreq(); renderReg(); }
$("#view-stats").addEventListener("click", e => {
  const b = e.target.closest(".info"); if (!b) return;
  const ex = $("#explain"), txt = `${b.dataset.k}: ${EXPLAIN[b.dataset.k]}`;
  ex.hidden = ex.textContent === txt ? !ex.hidden : false; ex.textContent = txt;
  if (!ex.hidden) ex.scrollIntoView({ block: "nearest", behavior: "smooth" });
});
$("#toScatter").addEventListener("click", () => {
  const st = cur().stats, ch = cur().chart;
  Object.assign(ch, { type: "scatter", x: st.regX, y: st.regY, model: st.regModel }); persist(); showView("view-chart"); renderChart();
});
function freqTSV() {
  if (!lastFreq) return "";
  const g = lastFreq.grouped;
  const head = [g ? "Intervalo" : "Valor", ...(g ? ["xi"] : []), "fi", "Fi", "hi", "Hi", "%"];
  const n = v => String(+v.toFixed(4)).replace(".", ",");
  return [head, ...lastFreq.rows.map(r => [g ? `[${n(r.from)}; ${n(r.to)}${r.last ? "]" : ")"}` : n(r.value), ...(g ? [n(r.mark)] : []), r.fi, r.Fi, n(r.hi), n(r.Hi), n(r.hi * 100)])].map(r => r.join("\t")).join("\n");
}
$("#copyFreq").addEventListener("click", () => copyText(freqTSV()).then(ok => toast(ok ? "Tabla copiada. Pégala en Excel o Sheets." : "No se pudo copiar")));
$("#copyStats").addEventListener("click", () => {
  const p = cur(), d = data(); let t = `${p.name}\n`;
  p.cols.forEach(c => {
    const v = d.vals(c.id); if (!v.length) return;
    t += `\n${colName(c)}\n` + summaryRows(S.describe(v)).map(([k, x]) => `${k}: ${String(x).replace(/<[^>]+>/g, "")}`).join("\n") + "\n";
  });
  if (lastFreq) t += `\nTabla de frecuencias (${colName(colById(p.stats.freqCol))})\n${freqTSV()}\n`;
  if (lastReg && !lastReg.error) t += `\nRegresión ${lastReg.name} (${colName(colById(p.stats.regX))} → ${colName(colById(p.stats.regY))})\n${lastReg.eq}\nR² = ${fmt(lastReg.r2, 4)}\n`;
  copyText(t.trim()).then(ok => toast(ok ? "Estadísticas copiadas" : "No se pudo copiar"));
});

/* =========================================================
   Hojas, avisos, portapapeles, vistas
   ========================================================= */
let sheetHandler = null, lastFocus = null;
function openSheet(html, handler) {
  lastFocus = document.activeElement;
  $("#sheetCard").innerHTML = html; sheetHandler = handler; $("#sheet").hidden = false;
  const card = $("#sheetCard"); card.tabIndex = -1; setTimeout(() => { if (!document.activeElement?.closest("#sheetCard")) card.focus({ preventScroll: true }); }, 30);
}
function closeSheet() { $("#sheet").hidden = true; sheetHandler = null; lastFocus?.focus?.({ preventScroll: true }); }
$("#sheet").addEventListener("click", e => {
  if (e.target.id === "sheet") return closeSheet();
  const b = e.target.closest("[data-act]"); if (!b) return;
  if (b.dataset.act === "close") return closeSheet();
  if (sheetHandler) sheetHandler(b.dataset.act);
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#sheet").hidden) closeSheet(); });
let toastT; function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2400); }
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch {
    try { const ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok; } catch { return false; }
  }
}
function showView(id) {
  document.querySelectorAll(".view").forEach(v => (v.hidden = v.id !== id));
  document.querySelectorAll("nav.tabs [data-view]").forEach(b => b.setAttribute("aria-selected", b.dataset.view === id));
  if (id === "view-chart") renderChart();
  if (window.innerWidth < 1000) window.scrollTo(0, 0);
}
document.querySelectorAll("nav.tabs [data-view]").forEach(b => b.addEventListener("click", () => showView(b.dataset.view)));

let refreshT; const scheduleRefresh = () => { clearTimeout(refreshT); refreshT = setTimeout(refresh, 220); };
function refresh() { renderChart(); renderStats(); }
function renderAll() { dirty(); renderProjects(); renderTable(); refresh(); }
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => { renderTable(); refresh(); });
new MutationObserver(() => { renderTable(); refresh(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
let wasWide = window.innerWidth >= 1000;
window.addEventListener("resize", () => { const w = window.innerWidth >= 1000; if (w !== wasWide) { wasWide = w; renderChart(); } });
document.fonts?.ready.then(refresh);
renderAll();

/* modo sin conexión (PWA) */
if ("serviceWorker" in navigator && location.protocol === "https:" && !/claude|anthropic/.test(location.hostname)) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
