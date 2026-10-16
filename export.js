/* Gráficalo · exportar y compartir */
"use strict";

function downloadBlob(blob, name) {
  try {
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast(t("Descargando «{n}»", { n: name }));
  } catch { toast(t("No se pudo descargar el archivo")); }
}
async function shareFile(blob, name, title) {
  const file = new File([blob], name, { type: blob.type || "application/octet-stream" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title }); return; } catch (e) { if (e && e.name === "AbortError") return; }
  }
  downloadBlob(blob, name);
}
const safeName = s => String(s).replace(/[\\/:*?"<>|]/g, "").trim() || "graficalo";
const stamp = () => todayISO();

/* ---------- copia de seguridad ---------- */
function backupBlob() {
  const payload = { app: "graficalo", version: 3, exported: new Date().toISOString(), projects: state.projects };
  return new Blob([JSON.stringify(payload)], { type: "application/json" });
}
function backupSheet() {
  const n = state.projects.length, rows = state.projects.reduce((a, p) => a + p.rows.length, 0), name = `graficalo-${t("copia")}-${stamp()}.json`;
  openSheet(`<h3>${t("Copia de seguridad")}</h3>
    <p>${t("Tus datos solo están en este dispositivo. Guarda una copia por si cambias de móvil o borras la app.")}</p>
    <p class="hint">${t("{p} proyectos · {r} filas en total", { p: n, r: rows })}</p>
    <div class="actions"><button class="btn" data-act="dl">${ICON(IC.imp)}${t("Descargar")}</button><button class="btn primary" data-act="share">${ICON(IC.share)}${t("Compartir o guardar en…")}</button></div>`,
  act => { if (act === "dl") downloadBlob(backupBlob(), name); if (act === "share") shareFile(backupBlob(), name, t("Copia de seguridad de Gráficalo")); });
}
$("#backupIn").addEventListener("change", async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    const list = Array.isArray(j) ? j : j && j.projects;
    if (!Array.isArray(list) || !list.length || !list.every(p => p && Array.isArray(p.cols) && Array.isArray(p.rows))) throw new Error();
    const projects = list.map(p => upgradeProject(JSON.parse(JSON.stringify(p))));
    openSheet(`<h3>${t("Restaurar copia de seguridad")}</h3>
      <p>${t("El archivo contiene {n} proyectos:", { n: projects.length })}</p>
      <ul class="hint" style="margin:0;padding-left:18px">${projects.slice(0, 12).map(p => `<li>${esc(p.name)} · ${p.rows.length} ${t("filas")}</li>`).join("")}${projects.length > 12 ? "<li>…</li>" : ""}</ul>
      <div class="actions"><button class="btn ghost" data-act="close">${t("Cancelar")}</button><button class="btn" data-act="replace">${t("Reemplazar todos los míos")}</button><button class="btn primary" data-act="add">${t("Añadirlos a los míos")}</button></div>`,
    act => {
      if (act === "add") {
        const ids = new Set(state.projects.map(p => p.id));
        projects.forEach(p => { if (ids.has(p.id)) p.id = uid(); state.projects.push(p); });
        state.current = projects[0].id; hist(); dirty(); saveNow(); renderAll(); closeSheet(); toast(t("{n} proyectos restaurados", { n: projects.length }));
      }
      if (act === "replace") confirmSheet(t("Reemplazar todos"), t("Se borrarán tus {n} proyectos actuales y se sustituirán por los de la copia. No se puede deshacer.", { n: state.projects.length }), t("Reemplazar"), () => {
        Object.keys(HIST).forEach(k => delete HIST[k]);
        state.projects = projects; state.current = projects[0].id; hist(); dirty(); saveNow(); renderAll(); toast(t("{n} proyectos restaurados", { n: projects.length }));
      });
    });
  } catch { toast(t("Ese archivo no es una copia de seguridad de Gráficalo.")); }
});

/* ---------- Excel ---------- */
async function exportExcel() {
  try {
    toast(t("Preparando el archivo…")); await loadXLSX();
    const p = cur(), d = data();
    const head = [p.labelName || t("Etiqueta"), ...p.cols.map(c => c.name)];
    const body = d.rowIdx.map(i => [p.labelType === "date" && p.rows[i].l ? new Date(tsOf(p.rows[i].l)) : p.rows[i].l, ...p.cols.map(c => (c.kind === "text" ? d.txt[c.id][i] : Number.isFinite(d.byId[c.id][i]) ? d.byId[c.id][i] : ""))]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([head, ...body], { cellDates: true });
    ws["!cols"] = head.map(h => ({ wch: Math.max(10, String(h).length + 2) }));
    XLSX.utils.book_append_sheet(wb, ws, t("Datos").slice(0, 31));
    const nc = numCols().filter(c => d.vals(c.id).length);
    if (nc.length) {
      const ds = nc.map(c => S.describe(d.vals(c.id)));
      const keys = [["Datos (n)", "n"], ["Suma", "sum"], ["Media", "mean"], ["Mediana", "median"], ["Mínimo", "min"], ["Máximo", "max"], ["Desviación típica", "sd"], ["Varianza", "variance"], ["Q1", "q1"], ["Q3", "q3"], ["Rango intercuartílico", "iqr"], ["Coef. de variación", "cv"]];
      const rows = [[t("Estadístico"), ...nc.map(colName)], ...keys.map(([k, f]) => [t(k) + (f === "cv" ? " (%)" : ""), ...ds.map(s => (Number.isFinite(s[f]) ? +s[f].toFixed(6) : ""))])];
      const ws2 = XLSX.utils.aoa_to_sheet(rows); ws2["!cols"] = [{ wch: 24 }, ...nc.map(() => ({ wch: 14 }))];
      XLSX.utils.book_append_sheet(wb, ws2, t("Estadísticas").slice(0, 31));
    }
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), name = safeName(p.name) + ".xlsx";
    openSheet(`<h3>${t("Exportar a Excel")}</h3><p>${t("«{n}» está listo: hoja de datos (con las columnas calculadas) y hoja de estadísticas.", { n: name })}</p>${filtered() ? `<p class="warn">${t("Solo incluye las filas del filtro activo.")}</p>` : ""}
      <div class="actions"><button class="btn" data-act="dl">${ICON(IC.imp)}${t("Descargar")}</button><button class="btn primary" data-act="share">${ICON(IC.share)}${t("Compartir")}</button></div>`,
    act => { if (act === "dl") downloadBlob(blob, name); if (act === "share") shareFile(blob, name, p.name); });
  } catch (e) { toast(e.message || t("No se pudo crear el archivo")); }
}

/* ---------- informe PDF ---------- */
function pdfSheet() {
  const p = cur();
  openSheet(`<h3>${t("Informe en PDF")}</h3><p class="hint">${t("Elige qué incluir.")}</p>
    <div class="checks">
      <label><input type="checkbox" id="pdCharts" checked> ${t("Gráficos")}</label>
      <label style="padding-left:24px"><input type="checkbox" id="pdAll" ${p.charts.length > 1 ? "checked" : "disabled"}> ${t("Todos los gráficos ({n}), no solo el actual", { n: p.charts.length })}</label>
      <label><input type="checkbox" id="pdStats" checked> ${t("Resumen estadístico")}</label>
      <label><input type="checkbox" id="pdFreq"> ${t("Tabla de frecuencias")} (${esc(nameOf(validCat(st().freqCol, 1)))})</label>
      <label><input type="checkbox" id="pdReg" ${numCols().length > 1 ? "" : "disabled"}> ${t("Regresión")} (${numCols().length > 1 ? esc(nameOf(validId(st().regX, 0))) + " → " + esc(nameOf(validId(st().regY, 1))) : "—"})</label>
      <label><input type="checkbox" id="pdData" checked> ${t("Tabla de datos")}</label>
    </div>
    <div class="actions"><button class="btn ghost" data-act="close">${t("Cancelar")}</button><button class="btn primary" data-act="go">${t("Crear PDF")}</button></div>`,
  async act => {
    if (act !== "go") return;
    const opt = { charts: $("#pdCharts").checked, all: $("#pdAll").checked, stats: $("#pdStats").checked, freq: $("#pdFreq").checked, reg: $("#pdReg").checked, data: $("#pdData").checked };
    const btn = $("#sheetCard [data-act=go]"); btn.disabled = true; btn.textContent = t("Creando…");
    try {
      const blob = await buildPDF(opt), name = safeName(p.name) + ".pdf";
      openSheet(`<h3>${t("Informe listo")}</h3><p>${esc(name)}</p><div class="actions"><button class="btn" data-act="dl">${ICON(IC.imp)}${t("Descargar")}</button><button class="btn primary" data-act="share">${ICON(IC.share)}${t("Compartir")}</button></div>`,
        a2 => { if (a2 === "dl") downloadBlob(blob, name); if (a2 === "share") shareFile(blob, name, p.name); });
    } catch (e) { btn.disabled = false; btn.textContent = t("Crear PDF"); toast(e.message || t("No se pudo crear el PDF")); }
  });
}
// las fuentes estándar de PDF solo admiten Latin-1: sustituimos los símbolos que no lo están
const pdfSafe = s => String(s ?? "").replace(/−/g, "-").replace(/→/g, "->").replace(/≈/g, "~").replace(/≤/g, "<=").replace(/≥/g, ">=").replace(/≠/g, "!=").replace(/⁴/g, "^4").replace(/√/g, "raiz ").replace(/χ²/g, "Chi²").replace(/[₀-₉]/g, c => "0123456789"["₀₁₂₃₄₅₆₇₈₉".indexOf(c)]).replace(/η²/g, "eta²").replace(/[^\x00-\xFF€…–—‘’“”•œŒ]/g, "");
async function buildPDF(opt) {
  await loadScript("lib/jspdf.umd.min.js"); await loadScript("lib/jspdf.plugin.autotable.min.js");
  const { jsPDF } = window.jspdf, p = cur(), d = data();
  const doc = new jsPDF({ unit: "mm", format: "a4" }), W = 210, H = 297, M = 16, CW = W - 2 * M;
  const ACC = [14, 107, 92], INK = [23, 35, 31], MUT = [91, 107, 101];
  let y = 0;
  doc.setFillColor(...ACC); doc.rect(0, 0, W, 30, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text("GRÁFICALO", M, 10);
  doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.text(pdfSafe(p.name), M, 21, { maxWidth: CW });
  doc.setTextColor(...MUT); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  y = 38;
  doc.text(pdfSafe(`${t("Informe del {d}", { d: new Date().toLocaleDateString(LOC(), { day: "numeric", month: "long", year: "numeric" }) })} · ${d.rowIdx.length} ${t("filas con datos")}`), M, y);
  if (filtered()) { y += 5; doc.setTextColor(196, 122, 18); doc.text(pdfSafe(t("Filtro activo") + ": " + p.filters.map(f => `${nameOf(f.col)} ${opLabel(f.op)} ${f.val ?? ""}`).join(" · ")), M, y, { maxWidth: CW }); }
  y += 8;
  const heading = txt => { if (y > H - 40) { doc.addPage(); y = 20; } doc.setTextColor(...INK); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(pdfSafe(txt), M, y); y += 6; doc.setFont("helvetica", "normal"); };
  const table = (head, body, extra = {}) => {
    doc.autoTable(Object.assign({ head: [head.map(pdfSafe)], body: body.map(r => r.map(pdfSafe)), startY: y, margin: { left: M, right: M }, styles: { font: "helvetica", fontSize: 8.5, cellPadding: 1.8, textColor: INK, lineColor: [207, 218, 213], lineWidth: 0.1 },
      headStyles: { fillColor: ACC, textColor: 255, fontStyle: "bold" }, alternateRowStyles: { fillColor: [244, 247, 245] }, theme: "grid" }, extra));
    y = doc.lastAutoTable.finalY + 8;
  };
  if (opt.charts) {
    const list = opt.all ? p.charts : [activeChart()];
    for (const ch of list) {
      const url = renderChartImage(ch, { w: 760, h: 425, theme: "light", scale: 2.6 });
      if (!url) continue;
      const hh = (CW * 425) / 760;
      if (y + hh + 10 > H - 14) { doc.addPage(); y = 20; }
      if (list.length > 1 || ch.title) { doc.setTextColor(...INK); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text(pdfSafe(ch.title || ch.name), M, y); y += 3; }
      doc.addImage(url, "PNG", M, y, CW, hh, undefined, "FAST"); y += hh + 8;
    }
  }
  if (opt.stats) {
    const nc = numCols().filter(c => d.vals(c.id).length);
    if (nc.length) {
      heading(t("Resumen estadístico"));
      const keys = [["Datos (n)", s => fmt(s.n, 0)], ["Media", s => fmt(s.mean)], ["Mediana", s => fmt(s.median)], ["Moda", s => (s.mode.length ? s.mode.slice(0, 2).map(x => fmt(x)).join("; ") : "-")], ["Mínimo", s => fmt(s.min)], ["Máximo", s => fmt(s.max)], ["Desviación típica", s => fmt(s.sd)], ["Varianza", s => fmt(s.variance)], ["Q1 / Q3", s => `${fmt(s.q1)} / ${fmt(s.q3)}`], ["Coef. de variación", s => (Number.isFinite(s.cv) ? fmt(s.cv, 1) + " %" : "-")]];
      for (let k = 0; k < nc.length; k += 5) {
        const chunk = nc.slice(k, k + 5), ds = chunk.map(c => S.describe(d.vals(c.id)));
        table([t("Estadístico"), ...chunk.map(colName)], keys.map(([n, f]) => [t(n), ...ds.map(f)]), { columnStyles: Object.fromEntries(chunk.map((_, i) => [i + 1, { halign: "right" }])) });
      }
    }
    p.cols.filter(c => c.kind === "text").forEach(c => {
      const l = S.countCategories(d.cat(c.id)); if (!l.length) return; const tot = l.reduce((a, x) => a + x.n, 0);
      heading(colName(c)); table([colName(c), "fi", "%"], l.map(x => [x.key, x.n, fmt((x.n / tot) * 100, 1)]), { columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } } });
    });
  }
  if (opt.freq) {
    const s = st(), id = validCat(s.freqCol, 1), c = id === LABEL ? null : colById(id);
    if (c && isNum(c)) {
      const v = d.vals(c.id);
      if (v.length >= 2) {
        const b = parseInt(s.freqBins, 10), fr = S.frequency(v, b >= 2 && b <= 40 ? b : undefined);
        heading(`${t("Tabla de frecuencias")} · ${colName(c)}`);
        table([fr.grouped ? t("Intervalo") : t("Valor"), ...(fr.grouped ? ["xi"] : []), "fi", "Fi", "hi", "Hi", "%"],
          fr.rows.map(r => [fr.grouped ? `[${fmt(r.from)}, ${fmt(r.to)}${r.last ? "]" : ")"}` : fmt(r.value), ...(fr.grouped ? [fmt(r.mark)] : []), r.fi, r.Fi, fmt(r.hi, 3), fmt(r.Hi, 3), fmt(r.hi * 100, 1)]),
          { columnStyles: Object.fromEntries([1, 2, 3, 4, 5, 6].map(i => [i, { halign: "right" }])) });
      }
    }
  }
  if (opt.reg && numCols().length > 1) {
    const s = st(), rx = validId(s.regX, 0), ry = validId(s.regY, 1), f = S.fit(s.regModel || "linear", d.rowIdx.map(i => d.byId[rx][i]), d.rowIdx.map(i => d.byId[ry][i]), fmtSig);
    if (!f.error) {
      heading(`${t("Regresión")} ${t(f.name).toLowerCase()} · ${nameOf(rx)} → ${nameOf(ry)}`);
      const rows = [[t("Ecuación"), f.eq], ["R²", fmt(f.r2, 4)], [t("Parejas usadas"), f.n]];
      if (f.type === "linear") { const ct = S.corrTest(f.r, f.n); rows.splice(2, 0, [t("Correlación (r)"), fmt(f.r, 4)], [t("p-valor"), fmtP(ct.p)]); }
      table([t("Medida"), t("Valor")], rows);
    }
  }
  if (opt.data) {
    heading(t("Datos"));
    const cols = p.cols.slice(0, 9);
    table([p.labelName || t("Etiqueta"), ...cols.map(colName)], d.rowIdx.map(i => [labelText(p, i), ...cols.map(c => (c.kind === "text" ? d.txt[c.id][i] : fmtSig(d.byId[c.id][i])))]),
      { columnStyles: Object.fromEntries(cols.map((c, k) => [k + 1, { halign: c.kind === "text" ? "left" : "right" }])) });
    if (p.cols.length > 9) { doc.setFontSize(8); doc.setTextColor(...MUT); doc.text(pdfSafe(t("Se muestran las 9 primeras columnas.")), M, y - 4); }
  }
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(...MUT); doc.text(pdfSafe(t("Creado con Gráficalo · página {i} de {n}", { i, n: pages })), W / 2, H - 8, { align: "center" }); }
  return doc.output("blob");
}

/* ---------- compartir un proyecto por enlace ---------- */
const b64u = {
  enc: bytes => { let s = ""; const a = new Uint8Array(bytes); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); },
  dec: str => { const s = atob(str.replace(/-/g, "+").replace(/_/g, "/")); const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
};
async function packProject(p) {
  const json = JSON.stringify({ v: 3, p: Object.assign({}, p, { stats: {} }) }), bytes = new TextEncoder().encode(json);
  if (window.CompressionStream) {
    const out = await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer();
    return "z." + b64u.enc(out);
  }
  return "u." + b64u.enc(bytes);
}
async function unpackProject(str) {
  const [kind, body] = [str.slice(0, 2), str.slice(2)], bytes = b64u.dec(body);
  let text;
  if (kind === "z.") text = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
  else text = new TextDecoder().decode(bytes);
  const j = JSON.parse(text); if (!j.p || !Array.isArray(j.p.cols)) throw new Error();
  return upgradeProject(j.p);
}
const appBase = () => (/^https?:/.test(location.protocol) && !/claude|anthropic|localhost|127\./.test(location.hostname) ? location.origin + location.pathname : "https://marcsgc.github.io/");
async function shareProjectLink() {
  try {
    const p = cur(), packed = await packProject(p), url = `${appBase()}#p=${packed}`;
    const long = url.length > 30000;
    openSheet(`<h3>${t("Compartir proyecto")}</h3>
      <p>${t("Quien abra el enlace podrá añadir una copia de «{n}» a su Gráficalo. Los datos van dentro del enlace: no se suben a ningún servidor.", { n: p.name })}</p>
      ${long ? `<p class="warn">${t("El enlace es muy largo porque el proyecto tiene muchos datos. Algunas apps lo pueden cortar: para proyectos grandes usa la copia de seguridad.")}</p>` : ""}
      <input type="text" id="linkIn" value="${esc(url)}" readonly style="font-family:var(--mono);font-size:.8rem">
      <div class="actions"><button class="btn" data-act="copy">${ICON(IC.copy)}${t("Copiar enlace")}</button>${navigator.share ? `<button class="btn primary" data-act="share">${ICON(IC.share)}${t("Compartir")}</button>` : ""}</div>`,
    async act => {
      if (act === "copy") { const ok = await copyText(url); if (!ok) $("#linkIn").select(); toast(ok ? t("Enlace copiado") : t("Selecciona el enlace y cópialo")); }
      if (act === "share") { try { await navigator.share({ title: p.name, text: t("Te comparto «{n}», hecho con Gráficalo:", { n: p.name }), url }); } catch {} }
    });
  } catch { toast(t("No se pudo crear el enlace")); }
}
async function checkIncomingLink() {
  const m = location.hash.match(/^#p=([A-Za-z0-9._-]+)$/); if (!m) return;
  try { history.replaceState(null, "", location.pathname + location.search); } catch {}
  try {
    const p = await unpackProject(m[1]);
    openSheet(`<h3>${t("Te han compartido un proyecto")}</h3><p><b>${esc(p.name)}</b> · ${p.rows.length} ${t("filas")} · ${p.charts.length} ${p.charts.length === 1 ? t("gráfico") : t("gráficos")}</p>
      <div class="actions"><button class="btn ghost" data-act="close">${t("Ignorar")}</button><button class="btn primary" data-act="add">${t("Añadir a mis proyectos")}</button></div>`,
    act => { if (act === "add") { p.id = uid(); addProject(p); closeSheet(); toast(t("Proyecto añadido")); } });
  } catch { toast(t("El enlace del proyecto está dañado o incompleto.")); }
}
