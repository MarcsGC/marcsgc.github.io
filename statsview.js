/* Gráficalo · vista de estadísticas */
"use strict";

const SECTIONS = [["sum", "Resumen"], ["freq", "Frecuencias"], ["rel", "Relación"], ["cross", "Tablas cruzadas"], ["test", "Contrastes"], ["prob", "Probabilidad"]];
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
  "Correlación (r)": "De −1 a 1. Cerca de 1: cuando X sube, Y sube. Cerca de −1: cuando X sube, Y baja. Cerca de 0: no hay relación lineal.",
  "p-valor": "La probabilidad de obtener unos datos al menos así de extremos si en realidad no hubiera ningún efecto. Si es menor que el nivel de significación (α), el resultado es significativo.",
  "χ²": "Mide cuánto se alejan los recuentos observados de los que habría si las dos variables fueran independientes.",
  "V de Cramér": "La fuerza de la asociación, de 0 (ninguna) a 1 (total). Orientativamente: 0,1 débil, 0,3 moderada, 0,5 fuerte.",
  "d de Cohen": "El tamaño del efecto: la diferencia medida en desviaciones típicas. Orientativamente: 0,2 pequeño, 0,5 mediano, 0,8 grande.",
  "η²": "Qué parte de la variación total se debe a las diferencias entre grupos.",
  "Intervalo de confianza": "Rango de valores en el que, con la confianza indicada, está el valor real de la población."
};
const info = k => (EXPLAIN[k] ? `<button class="info" data-k="${esc(k)}" aria-label="${esc(t("Qué es {k}", { k: t(k) }))}">ⓘ</button>` : "");
const st = () => (cur().stats = cur().stats || {});
const SUB = "₀₁₂₃₄₅₆₇₈₉", sub = n => String(n).split("").map(c => SUB[+c] ?? c).join("");
const numList = () => numCols();
const catList = () => [{ id: LABEL }, ...cur().cols];
const optList = (list, val) => list.map(c => `<option value="${c.id}" ${c.id === val ? "selected" : ""}>${esc(c.id === LABEL ? colName(LABEL) : `${L(cur().cols.indexOf(c))} · ${colName(c)}`)}</option>`).join("");
function validCat(id, fb = 0) { const l = catList(); return l.some(c => c.id === id) ? id : (l[fb] || l[0]).id; }
const sel = (key, list, val, rerender = true) => `<select data-st="${key}" ${rerender ? "data-rr" : ""}>${optList(list, val)}</select>`;

function renderStats() {
  const s = st(); s.section = SECTIONS.some(x => x[0] === s.section) ? s.section : "sum";
  $("#statsNav").innerHTML = SECTIONS.map(([k, n]) => `<button role="tab" data-sec="${k}" aria-selected="${k === s.section}">${t(n)}</button>`).join("");
  $("#explain").hidden = true;
  const nav = $("#statsNav"), on = nav.querySelector("[aria-selected=true]"); if (on) nav.scrollLeft = on.offsetLeft - (nav.clientWidth - on.offsetWidth) / 2;
  const fn = { sum: secSummary, freq: secFreq, rel: secRel, cross: secCross, test: secTest, prob: secProb }[s.section];
  $("#statsBody").innerHTML = fn() + `<div id="stOut" class="sblock"></div>`;
  renderStatsOut();
}
function renderStatsOut() { const s = st(); const fn = { sum: outSummary, freq: outFreq, rel: outRel, cross: outCross, test: outTest, prob: outProb }[s.section]; fn(); }
$("#statsNav").addEventListener("click", e => { const b = e.target.closest("[data-sec]"); if (!b) return; st().section = b.dataset.sec; saveSoon(); renderStats(); });
$("#statsBody").addEventListener("change", e => onStatInput(e, true));
$("#statsBody").addEventListener("input", e => { if (e.target.matches("input[type=text],input[type=number]")) onStatInput(e, false); });
function onStatInput(e, committed) {
  const el = e.target.closest("[data-st]"); if (!el) return;
  const s = st(), k = el.dataset.st;
  s[k] = el.type === "checkbox" ? el.checked : el.value;
  saveSoon();
  if (el.hasAttribute("data-rr") && committed) renderStats(); else renderStatsOutSoon();
}
const renderStatsOutSoon = debounce(() => renderStatsOut(), 160);
$("#statsBody").addEventListener("click", e => {
  const i = e.target.closest(".info");
  if (i) { const ex = $("#explain"), txt = `${t(i.dataset.k)}: ${t(EXPLAIN[i.dataset.k])}`; ex.hidden = ex.textContent === txt ? !ex.hidden : false; ex.textContent = txt; if (!ex.hidden) ex.scrollIntoView({ block: "nearest", behavior: "smooth" }); return; }
  const b = e.target.closest("[data-sa]"); if (!b) return;
  const s = st(), a = b.dataset.sa;
  if (a.startsWith("seg:")) { const [, k, v] = a.split(":"); s[k] = v; saveSoon(); renderStats(); }
  if (a === "stepsSum") stepsSheet(s.sumCol);
  if (a === "stepsReg") regStepsSheet();
  if (a === "toScatter") { const p = cur(); let ch = p.charts.find(c => c.type === "scatter"); if (!ch) { ch = Object.assign(defaultChart(), { name: t("Dispersión"), type: "scatter" }); p.charts.push(ch); } Object.assign(ch, { x: s.regX, y: s.regY, model: s.regModel || "linear" }); p.activeChart = ch.id; persist(); showView("view-chart"); renderChartUI(); }
  if (a === "toCount") { const p = cur(); let ch = p.charts.find(c => c.type === "count" && c.countCol === s.crossRow && c.splitCol === s.crossCol); if (!ch) { ch = Object.assign(defaultChart(), { name: t("Tabla cruzada"), type: "count", countCol: s.crossRow, splitCol: s.crossCol, countStyle: "stacked" }); p.charts.push(ch); } p.activeChart = ch.id; persist(); showView("view-chart"); renderChartUI(); }
  if (a === "copyFreq") copyText(freqTSV()).then(ok => toast(ok ? t("Tabla copiada. Pégala en Excel o Sheets.") : t("No se pudo copiar")));
  if (a === "copyCross") copyText(crossTSV()).then(ok => toast(ok ? t("Tabla copiada. Pégala en Excel o Sheets.") : t("No se pudo copiar")));
  if (a === "useData") { const v = data().vals(s.probCol); if (v.length < 2) { toast(t("Esa serie necesita al menos 2 valores.")); return; } s.mu = String(+S.mean(v).toFixed(4)).replace(".", LANG === "es" ? "," : "."); s.sigma = String(+S.sd(v).toFixed(4)).replace(".", LANG === "es" ? "," : "."); saveSoon(); renderStats(); }
});
const num = (v, d) => { const n = S.parseNum(v); return Number.isFinite(n) ? n : d; };
const seg = (key, opts, val) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button data-sa="seg:${key}:${v}" aria-pressed="${v === val}">${l}</button>`).join("")}</div>`;

/* ---------- resumen ---------- */
function secSummary() {
  const s = st(); s.sumCol = validCat(s.sumCol, 1);
  const c = s.sumCol === LABEL ? null : colById(s.sumCol);
  return `<div class="sel-row"><label>${t("Columna")} ${sel("sumCol", catList(), s.sumCol)}</label>${c && isNum(c) ? `<button class="btn small" data-sa="stepsSum">${t("Paso a paso")}</button>` : ""}</div>`;
}
function summaryRows(sd) {
  return [
    ["Datos (n)", fmt(sd.n, 0)], ["Suma", fmt(sd.sum)], ["Media", fmt(sd.mean)], ["Mediana", fmt(sd.median)],
    ["Moda", sd.mode.length ? sd.mode.slice(0, 3).map(x => fmt(x)).join(" · ") + (sd.mode.length > 3 ? "…" : "") : t("Sin moda")],
    ["Mínimo", fmt(sd.min)], ["Máximo", fmt(sd.max)], ["Rango", fmt(sd.max - sd.min)],
    ["Desviación típica", fmt(sd.sd)], ["Varianza", fmt(sd.variance)],
    ["Q1 / Q3", `${fmt(sd.q1)} / ${fmt(sd.q3)}`], ["Rango intercuartílico", fmt(sd.iqr)],
    ["Coef. de variación", Number.isFinite(sd.cv) ? fmt(sd.cv, 1) + " %" : "—"],
    ["Valores atípicos", sd.outliers.length ? `<span class="warn">${sd.outliers.slice(0, 6).map(x => fmt(x)).join(" · ")}${sd.outliers.length > 6 ? "…" : ""}</span>` : t("Ninguno")]
  ];
}
const dl = (rows, two = true) => `<dl class="stats ${two ? "two" : ""}">${rows.map(([k, v, cls]) => `<dt>${t(k)}${info(k)}</dt><dd class="${cls || ""}">${v}</dd>`).join("")}</dl>`;
function catTable(id) {
  const d = data(), list = S.countCategories(d.cat(id)); if (!list.length) return `<p class="hint">${t("Esta columna está vacía.")}</p>`;
  const tot = list.reduce((a, x) => a + x.n, 0), max = Math.max(...list.map(x => x.n));
  return `<div class="twrap"><table class="freq"><thead><tr><th>${esc(nameOf(id))}</th><th>fi ${info("fi")}</th><th>hi ${info("hi")}</th><th>%</th></tr></thead>
    <tbody>${list.map(x => `<tr><td>${esc(d.catDisplay(id, x.key))}</td><td>${x.n}</td><td>${fmt(x.n / tot, 3)}</td><td>${fmt((x.n / tot) * 100, 1)}<span class="bar" style="width:${Math.round((x.n / max) * 40)}px"></span></td></tr>`).join("")}</tbody>
    <tfoot><tr><td>${t("Total")}</td><td>${tot}</td><td>1</td><td>100</td></tr></tfoot></table></div>`;
}
function outSummary() {
  const s = st(), d = data(), c = s.sumCol === LABEL ? null : colById(s.sumCol);
  if (c && isNum(c)) {
    const v = d.vals(c.id);
    $("#stOut").innerHTML = v.length ? dl(summaryRows(S.describe(v))) : `<p class="hint">${t("Esta serie no tiene números todavía.")}</p>`;
  } else {
    const list = S.countCategories(d.cat(s.sumCol)), tot = list.reduce((a, x) => a + x.n, 0);
    const mx = Math.max(0, ...list.map(x => x.n)), modes = list.filter(x => x.n === mx);
    $("#stOut").innerHTML = (tot ? dl([["Datos (n)", fmt(tot, 0)], ["Categorías", fmt(list.length, 0)], ["Moda", esc(modes.slice(0, 3).map(x => d.catDisplay(s.sumCol, x.key)).join(" · ")) + ` (${mx})`, "txt"]]) : "") + catTable(s.sumCol);
  }
}

/* ---------- frecuencias ---------- */
let lastFreq = null;
function secFreq() {
  const s = st(); s.freqCol = validCat(s.freqCol, 1);
  const c = s.freqCol === LABEL ? null : colById(s.freqCol);
  return `<div class="sel-row"><label>${t("Columna")} ${sel("freqCol", catList(), s.freqCol)}</label>
    ${c && isNum(c) ? `<label>${t("Intervalos")} <input type="number" data-st="freqBins" min="2" max="40" placeholder="auto" value="${esc(s.freqBins || "")}" style="width:72px;padding:6px 8px"></label>` : ""}
    <button class="btn small" data-sa="copyFreq">${t("Copiar")}</button></div>`;
}
function outFreq() {
  const s = st(), d = data(), c = s.freqCol === LABEL ? null : colById(s.freqCol);
  if (!c || !isNum(c)) { lastFreq = { cat: true, id: s.freqCol, list: S.countCategories(d.cat(s.freqCol)) }; $("#stOut").innerHTML = catTable(s.freqCol); return; }
  const vals = d.vals(c.id); if (vals.length < 2) { lastFreq = null; $("#stOut").innerHTML = `<p class="hint">${t("Hacen falta al menos 2 valores.")}</p>`; return; }
  const b = parseInt(s.freqBins, 10), fr = S.frequency(vals, b >= 2 && b <= 40 ? b : undefined); lastFreq = fr;
  const maxF = Math.max(...fr.rows.map(r => r.fi));
  $("#stOut").innerHTML = `<div class="twrap"><table class="freq"><thead><tr>
      <th>${fr.grouped ? t("Intervalo") : t("Valor")}</th>${fr.grouped ? `<th>xi ${info("xi")}</th>` : ""}<th>fi ${info("fi")}</th><th>Fi ${info("Fi")}</th><th>hi ${info("hi")}</th><th>Hi ${info("Hi")}</th><th>%</th></tr></thead>
    <tbody>${fr.rows.map(r => `<tr><td style="font-family:var(--mono)">${fr.grouped ? `[${fmt(r.from)}, ${fmt(r.to)}${r.last ? "]" : ")"}` : fmt(r.value)}</td>${fr.grouped ? `<td>${fmt(r.mark)}</td>` : ""}
      <td>${r.fi}</td><td>${r.Fi}</td><td>${fmt(r.hi, 3)}</td><td>${fmt(r.Hi, 3)}</td><td>${fmt(r.hi * 100, 1)}<span class="bar" style="width:${Math.round((r.fi / maxF) * 40)}px"></span></td></tr>`).join("")}</tbody>
    <tfoot><tr><td>${t("Total")}</td>${fr.grouped ? "<td></td>" : ""}<td>${fr.n}</td><td></td><td>1</td><td></td><td>100</td></tr></tfoot></table></div>
    ${fr.grouped ? `<p class="hint">${s.freqBins ? t("Intervalos elegidos por ti.") : t("Intervalos calculados con la regla de Sturges. Cambia el número de intervalos si lo necesitas.")}</p>` : ""}`;
}
function freqTSV() {
  if (!lastFreq) return "";
  const n = v => String(+(+v).toFixed(4)).replace(".", LANG === "es" ? "," : ".");
  if (lastFreq.cat) { const tot = lastFreq.list.reduce((a, x) => a + x.n, 0); return [[nameOf(lastFreq.id), "fi", "hi", "%"], ...lastFreq.list.map(x => [x.key, x.n, n(x.n / tot), n((x.n / tot) * 100)])].map(r => r.join("\t")).join("\n"); }
  const g = lastFreq.grouped;
  return [[g ? t("Intervalo") : t("Valor"), ...(g ? ["xi"] : []), "fi", "Fi", "hi", "Hi", "%"], ...lastFreq.rows.map(r => [g ? `[${n(r.from)}; ${n(r.to)}${r.last ? "]" : ")"}` : n(r.value), ...(g ? [n(r.mark)] : []), r.fi, r.Fi, n(r.hi), n(r.Hi), n(r.hi * 100)])].map(r => r.join("\t")).join("\n");
}

/* ---------- relación ---------- */
let lastReg = null;
function secRel() {
  const s = st(), nums = numList();
  if (nums.length < 2) return `<p class="hint">${t("Hacen falta al menos dos columnas de números.")}</p>`;
  s.regX = validId(s.regX, 0); s.regY = validId(s.regY, 1); s.regModel = s.regModel || "linear";
  return `<div class="sel-row"><label>X ${sel("regX", nums, s.regX)}</label><label>Y ${sel("regY", nums, s.regY)}</label>
    <label>${t("Modelo")} <select data-st="regModel" data-rr>${Object.entries(S.MODELS).map(([k, n]) => `<option value="${k}" ${k === s.regModel ? "selected" : ""}>${t(n)}</option>`).join("")}</select></label></div>
    <div class="grp"><button class="btn small" data-sa="toScatter">${t("Ver en el gráfico")}</button>${s.regModel === "linear" ? `<button class="btn small" data-sa="stepsReg">${t("Paso a paso")}</button>` : ""}</div>`;
}
function regXY() { const s = st(), d = data(); return [d.rowIdx.map(i => d.byId[s.regX]?.[i]), d.rowIdx.map(i => d.byId[s.regY]?.[i])]; }
function outRel() {
  const s = st(); if (numList().length < 2) { lastReg = null; return; }
  if (s.regX === s.regY) { lastReg = null; $("#stOut").innerHTML = `<p class="hint">${t("Elige dos columnas distintas para X e Y.")}</p>`; return; }
  const [X, Y] = regXY(), f = S.fit(s.regModel, X, Y, fmtSig); lastReg = f;
  if (f.error) { $("#stOut").innerHTML = `<p class="hint">${esc(t(f.error.replace(/\d+/, "{n}"), { n: (f.error.match(/\d+/) || [""])[0] }))}</p>`; return; }
  const cx = nameOf(s.regX), cy = nameOf(s.regY), all = Object.keys(S.MODELS).map(k => S.fit(k, X, Y)).filter(m => !m.error).sort((a, b) => b.r2 - a.r2);
  const rows = [["R²", fmt(f.r2, 4)]];
  let interp;
  if (f.type === "linear") {
    const ct = S.corrTest(f.r, f.n), a = Math.abs(f.r);
    rows.push(["Correlación (r)", fmt(f.r, 4)], ["p-valor", fmtP(ct.p)]);
    interp = t("Relación {s} y {d}", { s: a >= 0.7 ? t("fuerte") : a >= 0.4 ? t("moderada") : t("débil"), d: f.r >= 0 ? t("positiva") : t("negativa") }) + (ct.p < 0.05 ? "" : " · " + t("no significativa (p ≥ 0,05)"));
  } else interp = t("El modelo explica el {p} de la variación de {y}", { p: fmt(f.r2 * 100, 1) + " %", y: cy });
  rows.push(["Parejas usadas", `${f.n}${f.dropped ? ` <span class="warn">(${t("{n} descartadas", { n: f.dropped })})</span>` : ""}`], ["Interpretación", esc(interp), "txt"]);
  $("#stOut").innerHTML = `<div class="eq">${esc(f.eq)}</div>${dl(rows)}
    ${f.dropped ? `<p class="hint">${f.type === "exponential" ? t("Este modelo solo admite valores de Y positivos.") : f.type === "logarithmic" ? t("Este modelo solo admite valores de X positivos.") : t("Este modelo solo admite valores de X e Y positivos.")}</p>` : ""}
    <div class="predict"><label for="predX">${t("Si {x} =", { x: esc(cx) })}</label><input type="text" inputmode="decimal" id="predX" placeholder="${fmt((f.xmin + f.xmax) / 2, 1)}"><span>→ ${esc(cy)} ≈</span><output id="predY">—</output></div>
    <details class="help"><summary>${t("Comparar todos los modelos")}</summary>
      <dl class="stats" style="margin-top:6px">${all.map(m => `<dt>${t(m.name)}</dt><dd>R² = ${fmt(m.r2, 4)}</dd>`).join("")}</dl>
      <p class="hint" style="margin-top:6px">${t("Un R² más alto se ajusta mejor a estos puntos, pero los polinomios de grado alto pueden dar predicciones raras fuera del rango de los datos.")}</p></details>`;
  $("#predX").addEventListener("input", e => {
    const x = S.parseNum(e.target.value), y = Number.isFinite(x) ? f.predict(x) : NaN;
    $("#predY").textContent = fmtSig(y) + (Number.isFinite(x) && (x < f.xmin || x > f.xmax) ? " " + t("(fuera del rango de tus datos)") : "");
  });
}

/* ---------- tablas cruzadas ---------- */
let lastCross = null;
function secCross() {
  const s = st(), p = cur();
  const firstTxt = p.cols.find(c => c.kind === "text");
  s.crossRow = validCat(s.crossRow ?? LABEL, 0); s.crossCol = validCat(s.crossCol ?? (firstTxt ? firstTxt.id : (p.cols[0] || {}).id), 1);
  s.crossMode = s.crossMode || "count";
  return `<div class="sel-row"><label>${t("Filas")} ${sel("crossRow", catList(), s.crossRow)}</label><label>${t("Columnas")} ${sel("crossCol", catList(), s.crossCol)}</label></div>
    <div class="setrow">${seg("crossMode", [["count", t("Recuento")], ["total", t("% del total")], ["row", t("% por fila")], ["col", t("% por columna")]], s.crossMode)}
    <div class="grp"><button class="btn small" data-sa="copyCross">${t("Copiar")}</button><button class="btn small" data-sa="toCount">${t("Ver gráfico")}</button></div></div>`;
}
function outCross() {
  const s = st(), d = data();
  if (s.crossRow === s.crossCol) { lastCross = null; $("#stOut").innerHTML = `<p class="hint">${t("Elige dos columnas distintas.")}</p>`; return; }
  const ct = S.crosstab(d.cat(s.crossRow), d.cat(s.crossCol)); lastCross = ct;
  if (!ct.n) { $("#stOut").innerHTML = `<p class="hint">${t("No hay filas con las dos columnas rellenas.")}</p>`; return; }
  const tooMany = ct.rowKeys.length > 30 || ct.colKeys.length > 15;
  const rs = ct.counts.map(r => r.reduce((a, x) => a + x, 0)), cs = ct.colKeys.map((_, j) => ct.counts.reduce((a, r) => a + r[j], 0));
  const cell = (v, i, j) => s.crossMode === "count" ? v : s.crossMode === "total" ? fmt((v / ct.n) * 100, 1) : s.crossMode === "row" ? fmt(rs[i] ? (v / rs[i]) * 100 : 0, 1) : fmt(cs[j] ? (v / cs[j]) * 100 : 0, 1);
  const tot = (v, kind) => s.crossMode === "count" ? v : s.crossMode === "total" ? fmt((v / ct.n) * 100, 1) : (s.crossMode === "row") === (kind === "row") ? "100" : fmt((v / ct.n) * 100, 1);
  let html = tooMany ? `<p class="warn">${t("Hay demasiadas categorías para una tabla cruzada útil. Elige columnas con menos valores distintos.")}</p>` : "";
  html += `<div class="twrap"><table class="freq"><thead><tr><th>${esc(nameOf(s.crossRow))} \\ ${esc(nameOf(s.crossCol))}</th>${ct.colKeys.map(k => `<th>${esc(d.catDisplay(s.crossCol, k))}</th>`).join("")}<th class="tot">${t("Total")}</th></tr></thead>
    <tbody>${ct.rowKeys.slice(0, 60).map((k, i) => `<tr><td>${esc(d.catDisplay(s.crossRow, k))}</td>${ct.counts[i].map((v, j) => `<td>${cell(v, i, j)}</td>`).join("")}<td class="tot">${tot(rs[i], "row")}</td></tr>`).join("")}</tbody>
    <tfoot><tr><td>${t("Total")}</td>${cs.map(v => `<td>${tot(v, "col")}</td>`).join("")}<td>${s.crossMode === "count" ? ct.n : "100"}</td></tr></tfoot></table></div>`;
  if (s.crossMode !== "count") html += `<p class="hint">${t("Valores en porcentaje.")}</p>`;
  const chi = S.chi2Independence(ct.counts);
  if (!chi.error) {
    const a = num(s.alpha, 0.05), yes = chi.p < a, v = chi.cramerV;
    html += `<div class="verdict ${yes ? "yes" : ""}"><b>${yes ? t("Las dos variables están relacionadas") : t("No hay evidencia de relación")}</b>
      <p>${yes ? t("Con un nivel de significación del {a}, la distribución de «{c}» cambia según «{r}» (p = {p}).", { a: pct(a), c: nameOf(s.crossCol), r: nameOf(s.crossRow), p: fmtP(chi.p) })
        : t("Con un nivel de significación del {a}, las diferencias que ves pueden deberse al azar (p = {p}).", { a: pct(a), p: fmtP(chi.p) })}</p></div>
      ${dl([["χ²", fmt(chi.chi2, 3)], ["Grados de libertad", chi.df], ["p-valor", fmtP(chi.p)], ["V de Cramér", fmt(v, 3) + ` (${v < 0.1 ? t("muy débil") : v < 0.3 ? t("débil") : v < 0.5 ? t("moderada") : t("fuerte")})`]])}
      ${chi.lowExpected > 0.2 ? `<p class="warn">${t("Más del 20 % de las casillas tienen una frecuencia esperada menor que 5: el resultado de χ² es poco fiable. Junta categorías o recoge más datos.")}</p>` : ""}
      <details class="help"><summary>${t("Ver el cálculo")}</summary><div class="math" style="margin-top:6px">${t("Frecuencia esperada")} = (${t("total fila")} × ${t("total columna")}) / n\nχ² = Σ (O − E)² / E = ${fmt(chi.chi2, 3)}\n${t("gl")} = (${t("filas")} − 1) × (${t("columnas")} − 1) = ${chi.df}\nV = √(χ² / (n · (min(${t("filas")}, ${t("columnas")}) − 1))) = ${fmt(v, 3)}</div></details>`;
  }
  $("#stOut").innerHTML = html;
}
function crossTSV() {
  if (!lastCross) return ""; const s = st(), d = data();
  return [[`${nameOf(s.crossRow)} \\ ${nameOf(s.crossCol)}`, ...lastCross.colKeys.map(k => d.catDisplay(s.crossCol, k)), t("Total")], ...lastCross.rowKeys.map((k, i) => [d.catDisplay(s.crossRow, k), ...lastCross.counts[i], lastCross.counts[i].reduce((a, x) => a + x, 0)])].map(r => r.join("\t")).join("\n");
}

/* ---------- contrastes ---------- */
const TESTS = [["one", "Media de una serie frente a un valor"], ["welch", "Comparar dos series independientes"], ["paired", "Comparar dos series emparejadas (antes / después)"], ["groups", "Comparar grupos según una categoría"]];
function secTest() {
  const s = st(), nums = numList(); s.testKind = TESTS.some(x => x[0] === s.testKind) ? s.testKind : "one";
  if (!nums.length) return `<p class="hint">${t("Hace falta al menos una columna de números.")}</p>`;
  s.testA = validId(s.testA, 0); s.testB = validId(s.testB, 1); s.testAlt = s.testAlt || "two"; s.alpha = s.alpha || "0.05";
  const p = cur(); s.testG = validCat(s.testG ?? ((p.cols.find(c => c.kind === "text") || {}).id || LABEL), 0);
  let h = `<div class="sel-row"><label>${t("Prueba")} <select data-st="testKind" data-rr>${TESTS.map(([k, n]) => `<option value="${k}" ${k === s.testKind ? "selected" : ""}>${t(n)}</option>`).join("")}</select></label></div><div class="sel-row">`;
  if (s.testKind === "one") h += `<label>${t("Serie")} ${sel("testA", nums, s.testA, false)}</label><label>${t("Valor de referencia")} <input type="text" inputmode="decimal" data-st="testMu" value="${esc(s.testMu ?? "5")}" style="width:90px;font-family:var(--mono)"></label>`;
  if (s.testKind === "welch" || s.testKind === "paired") h += `<label>A ${sel("testA", nums, s.testA, false)}</label><label>B ${sel("testB", nums, s.testB, false)}</label>`;
  if (s.testKind === "groups") h += `<label>${t("Valores")} ${sel("testA", nums, s.testA, false)}</label><label>${t("Grupos")} ${sel("testG", catList(), s.testG, false)}</label>`;
  h += `</div><div class="sel-row">`;
  if (s.testKind !== "groups") h += `<label>${t("Hipótesis")} <select data-st="testAlt">${[["two", t("distinta (≠)")], ["greater", t("mayor (>)")], ["less", t("menor (<)")]].map(([v, n]) => `<option value="${v}" ${v === s.testAlt ? "selected" : ""}>${n}</option>`).join("")}</select></label>`;
  h += `<label>${t("Significación (α)")} <select data-st="alpha">${["0.01", "0.05", "0.10"].map(v => `<option value="${v}" ${v === s.alpha ? "selected" : ""}>${pct(+v).replace(",0 ", " ").replace(".0 ", " ")}</option>`).join("")}</select></label></div>`;
  return h;
}
function outTest() {
  const s = st(), d = data(); if (!numList().length) return;
  const a = num(s.alpha, 0.05), alt = s.testAlt || "two", conf = 1 - a;
  const altW = { two: t("distinta de"), greater: t("mayor que"), less: t("menor que") }[alt];
  const altD = { two: t("distintas"), greater: t("mayor"), less: t("menor") }[alt];
  const A = nameOf(s.testA), B = nameOf(s.testB);
  let r, verdict, rows, calc, note = t("La prueba t supone que los datos siguen aproximadamente una distribución normal. Con muestras pequeñas (menos de 15 datos) o muy asimétricas, interpreta el resultado con prudencia.");
  const err = m => { $("#stOut").innerHTML = `<p class="hint">${m}</p>`; };
  if (s.testKind === "one") {
    const mu = num(s.testMu, NaN); if (!Number.isFinite(mu)) return err(t("Escribe un valor de referencia."));
    r = S.tTestOne(d.vals(s.testA), mu, alt, conf); if (r.error) return err(r.error === "n" ? t("Hacen falta al menos 2 valores.") : t("Todos los valores son iguales: no se puede calcular."));
    const yes = r.p < a;
    verdict = [yes, yes ? t("La media es {w} {mu}", { w: altW, mu: fmt(mu) }) : t("No hay evidencia de que la media sea {w} {mu}", { w: altW, mu: fmt(mu) }),
      yes ? t("Con un nivel de significación del {a}, la media de «{c}» ({m}) es {w} {mu} (p = {p}).", { a: pct(a), c: A, m: fmt(r.mean), w: altW, mu: fmt(mu), p: fmtP(r.p) })
        : t("Con un nivel de significación del {a}, la diferencia entre la media de «{c}» ({m}) y {mu} puede deberse al azar (p = {p}).", { a: pct(a), c: A, m: fmt(r.mean), mu: fmt(mu), p: fmtP(r.p) })];
    rows = [["Media", fmt(r.mean)], ["Desviación típica", fmt(r.sd)], ["Datos (n)", r.n], ["t", fmt(r.t, 4)], ["Grados de libertad", r.df], ["p-valor", fmtP(r.p)], ["Intervalo de confianza", `${pct(conf).replace(",0 ", " ")}: [${fmt(r.ci[0])}, ${fmt(r.ci[1])}]`], ["d de Cohen", fmt(r.d, 3)]];
    calc = `t = (x̄ − μ₀) / (s / √n)\n  = (${fmt(r.mean, 4)} − ${fmt(mu, 4)}) / (${fmt(r.sd, 4)} / √${r.n})\n  = ${fmt(r.t, 4)}\n${t("gl")} = n − 1 = ${r.df}`;
  } else if (s.testKind === "welch" || s.testKind === "paired") {
    if (s.testA === s.testB) return err(t("Elige dos series distintas."));
    if (s.testKind === "welch") {
      r = S.tTestWelch(d.vals(s.testA), d.vals(s.testB), alt, conf);
      if (r.error) return err(r.error === "n" ? t("Cada serie necesita al menos 2 valores.") : t("Todos los valores son iguales: no se puede calcular."));
      rows = [[t("Media") + " A", fmt(r.m1)], [t("Media") + " B", fmt(r.m2)], ["Diferencia (A − B)", fmt(r.diff)], ["t", fmt(r.t, 4)], ["Grados de libertad", fmt(r.df, 2)], ["p-valor", fmtP(r.p)], ["Intervalo de confianza", `[${fmt(r.ci[0])}, ${fmt(r.ci[1])}]`], ["d de Cohen", fmt(r.d, 3)]];
      calc = `t = (x̄A − x̄B) / √(sA²/nA + sB²/nB)\n  = (${fmt(r.m1, 4)} − ${fmt(r.m2, 4)}) / √(${fmt(r.sd1 ** 2, 4)}/${r.n1} + ${fmt(r.sd2 ** 2, 4)}/${r.n2})\n  = ${fmt(r.t, 4)}\n${t("gl (Welch)")} = ${fmt(r.df, 2)}`;
    } else {
      r = S.tTestPaired(d.rowIdx.map(i => d.byId[s.testA][i]), d.rowIdx.map(i => d.byId[s.testB][i]), alt, conf);
      if (r.error) return err(r.error === "n" ? t("Hacen falta al menos 2 filas con A y B rellenas.") : t("Todas las diferencias son iguales: no se puede calcular."));
      rows = [["Diferencia media (A − B)", fmt(r.diff)], ["Desviación típica", fmt(r.sd)], ["Parejas usadas", r.pairs], ["t", fmt(r.t, 4)], ["Grados de libertad", r.df], ["p-valor", fmtP(r.p)], ["Intervalo de confianza", `[${fmt(r.ci[0])}, ${fmt(r.ci[1])}]`], ["d de Cohen", fmt(r.d, 3)]];
      calc = `${t("Para cada fila")}: d = A − B\nt = d̄ / (s_d / √n)\n  = ${fmt(r.mean, 4)} / (${fmt(r.sd, 4)} / √${r.n})\n  = ${fmt(r.t, 4)}\n${t("gl")} = n − 1 = ${r.df}`;
    }
    const yes = r.p < a;
    const rel = alt === "two" ? "" : " " + t("(A {w} B)", { w: altD });
    verdict = [yes, yes ? t("Hay diferencia significativa") + rel : t("No hay diferencia significativa"),
      yes ? t("Con un nivel de significación del {a}, la media de «{x}» es {w} la de «{y}» (p = {p}).", { a: pct(a), x: A, y: B, w: altW, p: fmtP(r.p) })
        : t("Con un nivel de significación del {a}, la diferencia entre «{x}» y «{y}» puede deberse al azar (p = {p}).", { a: pct(a), x: A, y: B, p: fmtP(r.p) })];
  } else {
    const vals = d.rowIdx.map(i => d.byId[s.testA][i]), g = d.cat(s.testG), map = new Map();
    vals.forEach((v, k) => { if (!Number.isFinite(v) || g[k] === "") return; if (!map.has(g[k])) map.set(g[k], []); map.get(g[k]).push(v); });
    const keys = [...map.keys()].sort(S.keyCmp), groups = keys.map(k => map.get(k));
    if (keys.length < 2) return err(t("Hacen falta al menos 2 grupos con datos."));
    if (keys.length > 20) return err(t("Hay demasiados grupos. Elige una columna con menos categorías."));
    const tbl = `<div class="twrap"><table class="freq"><thead><tr><th>${esc(nameOf(s.testG))}</th><th>n</th><th>${t("Media")}</th><th>${t("Desviación típica")}</th></tr></thead><tbody>${keys.map((k, i) => `<tr><td>${esc(d.catDisplay(s.testG, k))}</td><td>${groups[i].length}</td><td>${fmt(S.mean(groups[i]))}</td><td>${fmt(S.sd(groups[i]))}</td></tr>`).join("")}</tbody></table></div>`;
    if (keys.length === 2) {
      r = S.tTestWelch(groups[0], groups[1], "two", conf);
      if (r.error) return err(t("Cada grupo necesita al menos 2 valores y algo de variación."));
      const yes = r.p < a, g1 = d.catDisplay(s.testG, keys[0]), g2 = d.catDisplay(s.testG, keys[1]);
      verdict = [yes, yes ? t("Los grupos son distintos") : t("No hay diferencia significativa entre los grupos"),
        yes ? t("Con un nivel de significación del {a}, «{c}» es distinto en «{g1}» ({m1}) y «{g2}» ({m2}) (p = {p}).", { a: pct(a), c: A, g1, g2, m1: fmt(r.m1), m2: fmt(r.m2), p: fmtP(r.p) })
          : t("Con un nivel de significación del {a}, la diferencia entre «{g1}» y «{g2}» puede deberse al azar (p = {p}).", { a: pct(a), g1, g2, p: fmtP(r.p) })];
      rows = [["t", fmt(r.t, 4)], ["Grados de libertad", fmt(r.df, 2)], ["p-valor", fmtP(r.p)], ["Diferencia", fmt(r.diff)], ["Intervalo de confianza", `[${fmt(r.ci[0])}, ${fmt(r.ci[1])}]`], ["d de Cohen", fmt(r.d, 3)]];
      calc = t("Prueba t de Welch entre los dos grupos (no supone varianzas iguales).");
    } else {
      r = S.anova(groups); if (r.error) return err(t("Cada grupo necesita datos y algo de variación."));
      const yes = r.p < a;
      verdict = [yes, yes ? t("Al menos un grupo es distinto") : t("No hay diferencia significativa entre los grupos"),
        yes ? t("Con un nivel de significación del {a}, la media de «{c}» no es igual en todos los grupos (ANOVA, p = {p}). Mira la tabla para ver cuáles destacan.", { a: pct(a), c: A, p: fmtP(r.p) })
          : t("Con un nivel de significación del {a}, las diferencias entre grupos pueden deberse al azar (ANOVA, p = {p}).", { a: pct(a), p: fmtP(r.p) })];
      rows = [["F", fmt(r.F, 4)], ["Grados de libertad", `${r.df1} ${t("y")} ${r.df2}`], ["p-valor", fmtP(r.p)], ["η²", fmt(r.eta2, 3)]];
      calc = `F = (SC ${t("entre")} / (k − 1)) / (SC ${t("dentro")} / (N − k))\n  = (${fmt(r.ssb, 4)} / ${r.df1}) / (${fmt(r.ssw, 4)} / ${r.df2})\n  = ${fmt(r.F, 4)}`;
      note = t("El ANOVA supone que cada grupo sigue aproximadamente una distribución normal con una dispersión parecida.");
    }
    $("#stOut").innerHTML = verdictHTML(verdict) + tbl + dl(rows) + calcHTML(calc, note);
    return;
  }
  $("#stOut").innerHTML = verdictHTML(verdict) + dl(rows) + calcHTML(calc, note);
}
const verdictHTML = ([yes, h, p]) => `<div class="verdict ${yes ? "yes" : ""}"><b>${esc(h)}</b><p>${esc(p)}</p></div>`;
const calcHTML = (calc, note) => `<details class="help"><summary>${t("Ver el cálculo")}</summary><div class="math" style="margin-top:6px">${esc(calc)}</div></details>
  <details class="help"><summary>${t("¿Qué significa?")}</summary><p class="hint" style="margin-top:6px">${t(EXPLAIN["p-valor"])} ${esc(note)}</p></details>`;

/* ---------- probabilidad ---------- */
function secProb() {
  const s = st(); s.dist = s.dist || "normal";
  let h = `<div class="setrow">${seg("dist", [["normal", t("Normal")], ["binom", t("Binomial")]], s.dist)}</div>`;
  const inp = (k, label, def, w = 96) => `<label>${label}<input type="text" inputmode="decimal" data-st="${k}" value="${esc(s[k] ?? def)}" style="width:${w}px"></label>`;
  if (s.dist === "normal") {
    s.ncalc = s.ncalc || "le";
    const nums = numList(); s.probCol = validId(s.probCol, 0);
    h += `<div class="inputs">${inp("mu", t("Media (μ)"), "0")}${inp("sigma", t("Desviación (σ)"), "1")}
      ${nums.length ? `<label>${t("O usa los datos de")}<span class="grp">${sel("probCol", nums, s.probCol, false)}<button class="btn small" data-sa="useData">${t("Usar")}</button></span></label>` : ""}</div>
      <div class="inputs"><label>${t("Calcular")}<select data-st="ncalc" data-rr>${[["le", "P(X ≤ a)"], ["ge", "P(X ≥ a)"], ["between", "P(a ≤ X ≤ b)"], ["inv", t("Valor para un percentil")]].map(([v, n]) => `<option value="${v}" ${v === s.ncalc ? "selected" : ""}>${n}</option>`).join("")}</select></label>
      ${s.ncalc === "inv" ? inp("pp", t("Probabilidad (0–1)"), "0,95") : inp("a", "a", "1")}${s.ncalc === "between" ? inp("b", "b", "2") : ""}</div>`;
  } else {
    s.bcalc = s.bcalc || "eq";
    h += `<div class="inputs">${inp("bn", t("Intentos (n)"), "10")}${inp("bp", t("Probabilidad de éxito (p)"), "0,5")}</div>
      <div class="inputs"><label>${t("Calcular")}<select data-st="bcalc" data-rr>${[["eq", "P(X = k)"], ["le", "P(X ≤ k)"], ["ge", "P(X ≥ k)"], ["between", "P(k₁ ≤ X ≤ k₂)"]].map(([v, n]) => `<option value="${v}" ${v === s.bcalc ? "selected" : ""}>${n}</option>`).join("")}</select></label>
      ${inp("bk", s.bcalc === "between" ? "k₁" : "k", "5", 80)}${s.bcalc === "between" ? inp("bk2", "k₂", "7", 80) : ""}</div>`;
  }
  return h;
}
function outProb() {
  const s = st();
  const box = (res, extra) => { $("#stOut").innerHTML = `<div class="probres">${res}</div>${extra || ""}<canvas class="probcanvas" id="probCv" role="img" aria-label="${t("Gráfico de la distribución")}"></canvas>`; };
  if (s.dist === "normal") {
    const mu = num(s.mu ?? "0", NaN), sg = num(s.sigma ?? "1", NaN);
    if (!Number.isFinite(mu) || !(sg > 0)) { $("#stOut").innerHTML = `<p class="hint">${t("La desviación típica tiene que ser mayor que 0.")}</p>`; return; }
    let a = num(s.a ?? "1", NaN), b = num(s.b ?? "2", NaN), res, lo = -Infinity, hi = Infinity, extra = "";
    if (s.ncalc === "inv") {
      const pp = num(s.pp ?? "0,95", NaN); if (!(pp > 0 && pp < 1)) { $("#stOut").innerHTML = `<p class="hint">${t("La probabilidad tiene que estar entre 0 y 1.")}</p>`; return; }
      a = S.normInv(pp, mu, sg); hi = a; res = `x = ${fmt(a, 4)}`;
      extra = `<p class="hint">${t("El {p} de los valores está por debajo de {x}. z = {z}", { p: pct(pp), x: fmt(a, 4), z: fmt((a - mu) / sg, 3) })}</p>`;
    } else {
      if (!Number.isFinite(a) || (s.ncalc === "between" && !Number.isFinite(b))) { $("#stOut").innerHTML = `<p class="hint">${t("Escribe los valores.")}</p>`; return; }
      if (s.ncalc === "between" && b < a) [a, b] = [b, a];
      let p;
      if (s.ncalc === "le") { p = S.normCdf(a, mu, sg); hi = a; res = `P(X ≤ ${fmt(a)}) = ${fmt(p, 4)}`; }
      if (s.ncalc === "ge") { p = 1 - S.normCdf(a, mu, sg); lo = a; res = `P(X ≥ ${fmt(a)}) = ${fmt(p, 4)}`; }
      if (s.ncalc === "between") { p = S.normCdf(b, mu, sg) - S.normCdf(a, mu, sg); lo = a; hi = b; res = `P(${fmt(a)} ≤ X ≤ ${fmt(b)}) = ${fmt(p, 4)}`; }
      extra = `<p class="hint">${pct(p)} · z${s.ncalc === "between" ? sub(1) : ""} = ${fmt((a - mu) / sg, 3)}${s.ncalc === "between" ? ` · z${sub(2)} = ${fmt((b - mu) / sg, 3)}` : ""}</p>`;
    }
    box(res, extra); drawNormal($("#probCv"), mu, sg, lo, hi);
  } else {
    const n = Math.round(num(s.bn ?? "10", NaN)), p = num(s.bp ?? "0,5", NaN);
    if (!(n >= 1 && n <= 100000) || !(p >= 0 && p <= 1)) { $("#stOut").innerHTML = `<p class="hint">${t("n tiene que ser un entero positivo y p estar entre 0 y 1.")}</p>`; return; }
    let k = Math.round(num(s.bk ?? "5", NaN)), k2 = Math.round(num(s.bk2 ?? "7", NaN)), res, lo, hi;
    if (!Number.isFinite(k) || (s.bcalc === "between" && !Number.isFinite(k2))) { $("#stOut").innerHTML = `<p class="hint">${t("Escribe los valores.")}</p>`; return; }
    if (s.bcalc === "between" && k2 < k) [k, k2] = [k2, k];
    let pr;
    if (s.bcalc === "eq") { pr = S.binomPmf(k, n, p); lo = hi = k; res = `P(X = ${k}) = ${fmt(pr, 4)}`; }
    if (s.bcalc === "le") { pr = S.binomCdf(k, n, p); lo = 0; hi = k; res = `P(X ≤ ${k}) = ${fmt(pr, 4)}`; }
    if (s.bcalc === "ge") { pr = 1 - S.binomCdf(k - 1, n, p); lo = k; hi = n; res = `P(X ≥ ${k}) = ${fmt(pr, 4)}`; }
    if (s.bcalc === "between") { pr = S.binomCdf(k2, n, p) - S.binomCdf(k - 1, n, p); lo = k; hi = k2; res = `P(${k} ≤ X ≤ ${k2}) = ${fmt(pr, 4)}`; }
    box(res, `<p class="hint">${pct(pr)} · ${t("media")} np = ${fmt(n * p, 3)} · ${t("desviación")} √(npq) = ${fmt(Math.sqrt(n * p * (1 - p)), 3)}</p>`);
    drawBinom($("#probCv"), n, p, lo, hi);
  }
}
function setupCanvas(cv) {
  const dpr = window.devicePixelRatio || 1, w = cv.clientWidth || 600, h = cv.clientHeight || 220;
  cv.width = w * dpr; cv.height = h * dpr; const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
  return { ctx, w, h };
}
function drawNormal(cv, mu, sg, lo, hi) {
  const { ctx, w, h } = setupCanvas(cv), padB = 26, padT = 10, x0 = mu - 4 * sg, x1 = mu + 4 * sg, ymax = S.normPdf(mu, mu, sg) * 1.08;
  const X = x => ((x - x0) / (x1 - x0)) * w, Y = y => h - padB - (y / ymax) * (h - padB - padT);
  ctx.fillStyle = alpha(css("--accent"), 0.3); ctx.beginPath();
  const a = Math.max(x0, lo), b = Math.min(x1, hi);
  if (b > a) { ctx.moveTo(X(a), Y(0)); for (let i = 0; i <= 120; i++) { const x = a + ((b - a) * i) / 120; ctx.lineTo(X(x), Y(S.normPdf(x, mu, sg))); } ctx.lineTo(X(b), Y(0)); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle = css("--accent"); ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 240; i++) { const x = x0 + ((x1 - x0) * i) / 240; i ? ctx.lineTo(X(x), Y(S.normPdf(x, mu, sg))) : ctx.moveTo(X(x), Y(S.normPdf(x, mu, sg))); }
  ctx.stroke();
  ctx.strokeStyle = css("--line"); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(w, Y(0)); ctx.stroke();
  ctx.fillStyle = css("--muted"); ctx.font = `11px ${css("--mono")}`; ctx.textAlign = "center"; ctx.textBaseline = "top";
  for (let k = -3; k <= 3; k++) { const x = mu + k * sg; ctx.fillText(fmt(x, 2), X(x), h - padB + 6); ctx.beginPath(); ctx.moveTo(X(x), Y(0)); ctx.lineTo(X(x), Y(0) + 4); ctx.stroke(); }
  [lo, hi].forEach(v => { if (Number.isFinite(v) && v > x0 && v < x1) { ctx.strokeStyle = css("--amber"); ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(X(v), padT); ctx.lineTo(X(v), Y(0)); ctx.stroke(); ctx.setLineDash([]); } });
}
function drawBinom(cv, n, p, lo, hi) {
  const { ctx, w, h } = setupCanvas(cv), padB = 26, padT = 10, m = n * p, sdv = Math.sqrt(n * p * (1 - p));
  let k0 = n <= 40 ? 0 : Math.max(0, Math.floor(m - 4.5 * sdv)), k1 = n <= 40 ? n : Math.min(n, Math.ceil(m + 4.5 * sdv));
  if (k1 - k0 > 200) { k0 = Math.max(0, Math.round(m - 100)); k1 = k0 + 200; }
  const ps = []; for (let k = k0; k <= k1; k++) ps.push(S.binomPmf(k, n, p));
  const ymax = Math.max(...ps) * 1.1 || 1, bw = w / ps.length;
  ps.forEach((v, i) => {
    const k = k0 + i, on = k >= lo && k <= hi, bh = (v / ymax) * (h - padB - padT);
    ctx.fillStyle = on ? css("--accent") : alpha(css("--muted"), 0.35); ctx.fillRect(i * bw + bw * 0.12, h - padB - bh, bw * 0.76, bh);
  });
  ctx.fillStyle = css("--muted"); ctx.font = `11px ${css("--mono")}`; ctx.textAlign = "center"; ctx.textBaseline = "top";
  const step = Math.max(1, Math.ceil(ps.length / 12));
  for (let i = 0; i < ps.length; i += step) ctx.fillText(String(k0 + i), i * bw + bw / 2, h - padB + 6);
}

/* ---------- paso a paso ---------- */
const list = (arr, max = 30) => (arr.length > max ? arr.slice(0, max).map(x => fmt(x, 4)).join("; ") + "; …" : arr.map(x => fmt(x, 4)).join("; "));
const stepHTML = steps => `<div class="steps">${steps.map(([p, m]) => `<div class="step"><div><p>${p}</p>${m ? `<div class="math">${m}</div>` : ""}</div></div>`).join("")}</div>`;
function stepsSheet(colId, which) {
  const v = data().vals(colId); if (v.length < 2) { toast(t("Hacen falta al menos 2 valores.")); return; }
  which = which || "mean";
  const tabs = [["mean", t("Media")], ["median", t("Mediana")], ["mode", t("Moda")], ["sd", t("Varianza y desviación")], ["q", t("Cuartiles")]];
  const n = v.length, srt = [...v].sort((a, b) => a - b), sum = S.sum(v), m = sum / n;
  let steps = [];
  if (which === "mean") steps = [
    [t("Suma todos los valores."), `Σx = ${v.length > 12 ? v.slice(0, 12).map(x => fmt(x, 4)).join(" + ") + " + …" : v.map(x => fmt(x, 4)).join(" + ")} = ${fmt(sum, 4)}`],
    [t("Cuenta cuántos valores hay."), `n = ${n}`],
    [t("Divide la suma entre el número de valores."), `x̄ = Σx / n = ${fmt(sum, 4)} / ${n} = <b>${fmt(m, 4)}</b>`]];
  if (which === "median") {
    steps = [[t("Ordena los datos de menor a mayor."), list(srt)]];
    if (n % 2) { const k = (n + 1) / 2; steps.push([t("Como n = {n} es impar, la mediana es el valor central, en la posición (n + 1) / 2 = {k}.", { n, k }), `Me = x${sub(k)} = <b>${fmt(srt[k - 1], 4)}</b>`]); }
    else { const k = n / 2; steps.push([t("Como n = {n} es par, la mediana es la media de los dos valores centrales (posiciones {a} y {b}).", { n, a: k, b: k + 1 }), `Me = (x${sub(k)} + x${sub(k + 1)}) / 2 = (${fmt(srt[k - 1], 4)} + ${fmt(srt[k], 4)}) / 2 = <b>${fmt((srt[k - 1] + srt[k]) / 2, 4)}</b>`]); }
  }
  if (which === "mode") {
    const c = new Map(); v.forEach(x => c.set(x, (c.get(x) || 0) + 1));
    const arr = [...c].sort((a, b) => b[1] - a[1] || a[0] - b[0]), mx = arr[0][1];
    steps = [[t("Cuenta cuántas veces aparece cada valor."), arr.slice(0, 12).map(([x, k]) => `${fmt(x, 4).padStart(10)}  →  ${k}`).join("\n") + (arr.length > 12 ? "\n…" : "")]];
    steps.push(mx < 2 ? [t("Ningún valor se repite, así que no hay moda."), ""] : [t("La moda es el valor (o los valores) que más se repite."), `Mo = <b>${arr.filter(x => x[1] === mx).map(x => fmt(x[0], 4)).join("; ")}</b>  (${mx} ${t("veces")})`]);
  }
  if (which === "sd") {
    const dev = v.map(x => [x, x - m, (x - m) ** 2]), ss = S.sum(dev.map(r => r[2])), s2 = ss / (n - 1);
    const rowsTxt = dev.slice(0, 12).map(([x, d1, d2]) => `${fmt(x, 4).padStart(9)}  ${fmt(d1, 4).padStart(10)}  ${fmt(d2, 4).padStart(10)}`).join("\n") + (n > 12 ? `\n${t("… y {n} filas más", { n: n - 12 })}` : "");
    steps = [
      [t("Calcula la media."), `x̄ = ${fmt(sum, 4)} / ${n} = ${fmt(m, 4)}`],
      [t("Resta la media a cada dato y eleva el resultado al cuadrado."), `${"xi".padStart(9)}  ${"xi − x̄".padStart(10)}  ${"(xi − x̄)²".padStart(10)}\n${rowsTxt}`],
      [t("Suma los cuadrados."), `Σ(xi − x̄)² = ${fmt(ss, 4)}`],
      [t("Divide entre n − 1 para obtener la varianza (muestral)."), `s² = ${fmt(ss, 4)} / ${n - 1} = <b>${fmt(s2, 4)}</b>`],
      [t("Haz la raíz cuadrada para obtener la desviación típica."), `s = √${fmt(s2, 4)} = <b>${fmt(Math.sqrt(s2), 4)}</b>`],
      [t("Si te piden la varianza poblacional, divide entre n en lugar de n − 1."), `σ² = ${fmt(ss, 4)} / ${n} = ${fmt(ss / n, 4)}   σ = ${fmt(Math.sqrt(ss / n), 4)}`]];
  }
  if (which === "q") {
    const qs = p => { const pos = 1 + (n - 1) * p, lo = Math.floor(pos), fr = pos - lo, a = srt[lo - 1], b = srt[Math.min(n, lo + 1) - 1]; return [pos, lo, fr, a, b, a + fr * (b - a)]; };
    const line = (name, p) => { const [pos, lo, fr, a, b, q] = qs(p); return [t("{q} está en la posición 1 + (n − 1) · {p} = {pos}.", { q: name, p: fmt(p, 2), pos: fmt(pos, 4) }), fr ? `${name} = x${sub(lo)} + ${fmt(fr, 4)} · (x${sub(lo + 1)} − x${sub(lo)}) = ${fmt(a, 4)} + ${fmt(fr, 4)} · (${fmt(b, 4)} − ${fmt(a, 4)}) = <b>${fmt(q, 4)}</b>` : `${name} = x${sub(lo)} = <b>${fmt(a, 4)}</b>`]; };
    steps = [[t("Ordena los datos de menor a mayor."), list(srt)], line("Q1", 0.25), line("Q3", 0.75),
      [t("Este es el método de la función CUARTIL.INC de Excel. En clase a veces se usa otro método y el resultado puede variar un poco."), ""]];
  }
  openSheet(`<h3>${t("Paso a paso")} · ${esc(nameOf(colId))}</h3>
    <div class="seg" role="group">${tabs.map(([k, l]) => `<button data-act="w:${k}" aria-pressed="${k === which}">${l}</button>`).join("")}</div>
    ${stepHTML(steps)}<div class="actions"><button class="btn primary" data-act="close">${t("Cerrar")}</button></div>`,
  act => { if (act.startsWith("w:")) stepsSheet(colId, act.slice(2)); });
}
function regStepsSheet() {
  const [X, Y] = regXY(), xs = [], ys = []; X.forEach((x, i) => { if (Number.isFinite(x) && Number.isFinite(Y[i])) { xs.push(x); ys.push(Y[i]); } });
  const n = xs.length; if (n < 3) { toast(t("Hacen falta al menos 3 parejas de datos.")); return; }
  const Sx = S.sum(xs), Sy = S.sum(ys), Sxy = S.sum(xs.map((x, i) => x * ys[i])), Sxx = S.sum(xs.map(x => x * x)), Syy = S.sum(ys.map(y => y * y));
  const b = (n * Sxy - Sx * Sy) / (n * Sxx - Sx * Sx), a = Sy / n - b * (Sx / n), r = (n * Sxy - Sx * Sy) / Math.sqrt((n * Sxx - Sx * Sx) * (n * Syy - Sy * Sy));
  const f4 = v => fmt(v, 4), pad = (s, k = 10) => String(s).padStart(k);
  const rows = xs.slice(0, 12).map((x, i) => `${pad(f4(x))} ${pad(f4(ys[i]))} ${pad(f4(x * ys[i]), 12)} ${pad(f4(x * x), 12)}`).join("\n") + (n > 12 ? `\n${t("… y {n} filas más", { n: n - 12 })}` : "");
  const steps = [
    [t("Prepara una tabla con x, y, x·y y x² y suma cada columna."), `${pad("x")} ${pad("y")} ${pad("x·y", 12)} ${pad("x²", 12)}\n${rows}\n\nn = ${n}   Σx = ${f4(Sx)}   Σy = ${f4(Sy)}\nΣxy = ${f4(Sxy)}   Σx² = ${f4(Sxx)}   Σy² = ${f4(Syy)}`],
    [t("Calcula la pendiente b."), `b = (n·Σxy − Σx·Σy) / (n·Σx² − (Σx)²)\n  = (${n}·${f4(Sxy)} − ${f4(Sx)}·${f4(Sy)}) / (${n}·${f4(Sxx)} − ${f4(Sx)}²)\n  = <b>${f4(b)}</b>`],
    [t("Calcula la ordenada en el origen a."), `a = ȳ − b·x̄ = ${f4(Sy / n)} − ${f4(b)}·${f4(Sx / n)} = <b>${f4(a)}</b>`],
    [t("Escribe la recta de regresión."), `y = ${f4(a)} ${b < 0 ? "−" : "+"} ${f4(Math.abs(b))}·x`],
    [t("Calcula el coeficiente de correlación r y R²."), `r = (n·Σxy − Σx·Σy) / √[(n·Σx² − (Σx)²)·(n·Σy² − (Σy)²)]\n  = <b>${f4(r)}</b>\nR² = r² = <b>${f4(r * r)}</b>`]];
  openSheet(`<h3>${t("Paso a paso")} · ${t("regresión lineal")}</h3><p class="hint">X = ${esc(nameOf(st().regX))} · Y = ${esc(nameOf(st().regY))}</p>${stepHTML(steps)}<div class="actions"><button class="btn primary" data-act="close">${t("Cerrar")}</button></div>`, () => {});
}

/* ---------- copiar todo ---------- */
$("#copyStats").addEventListener("click", () => {
  const p = cur(), d = data(); let txt = `${p.name}${filtered() ? ` (${t("filtrado")})` : ""}\n`;
  numCols().forEach(c => { const v = d.vals(c.id); if (!v.length) return; txt += `\n${colName(c)}\n` + summaryRows(S.describe(v)).map(([k, x]) => `${t(k)}: ${String(x).replace(/<[^>]+>/g, "")}`).join("\n") + "\n"; });
  p.cols.filter(c => c.kind === "text").forEach(c => { const l = S.countCategories(d.cat(c.id)); if (l.length) txt += `\n${colName(c)}\n` + l.map(x => `${x.key}: ${x.n}`).join("\n") + "\n"; });
  if (lastReg && !lastReg.error) txt += `\n${t("Regresión")} ${t(lastReg.name)} (${nameOf(st().regX)} → ${nameOf(st().regY)})\n${lastReg.eq}\nR² = ${fmt(lastReg.r2, 4)}\n`;
  copyText(txt.trim()).then(ok => toast(ok ? t("Estadísticas copiadas") : t("No se pudo copiar")));
});
