/* Gráficalo · leer una tabla desde una foto (Tesseract.js, todo en el dispositivo) */
"use strict";

let ocrWorker = null;
$("#photoIn").addEventListener("change", async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  openSheet(`<h3>${t("Leyendo la foto…")}</h3><p class="hint" id="ocrMsg">${t("Preparando el lector. La primera vez descarga unos 6 MB y después funciona sin conexión.")}</p>
    <div class="progress"><i id="ocrBar"></i></div><div class="actions"><button class="btn ghost" data-act="close">${t("Cancelar")}</button></div>`, () => {});
  const msg = m => { const el = $("#ocrMsg"); if (el) el.textContent = m; }, bar = v => { const el = $("#ocrBar"); if (el) el.style.width = Math.round(v * 100) + "%"; };
  try {
    const canvas = await prepareImage(f);
    await loadScript("ocr/tesseract.min.js");
    if (!ocrWorker) {
      const abs = p => new URL(p, location.href).href;
      ocrWorker = await Tesseract.createWorker("spa", 1, {
        workerPath: abs("ocr/worker.min.js"), corePath: abs("ocr/"), langPath: abs("ocr/lang"), gzip: true,
        logger: m => { if (m.status === "recognizing text") { msg(t("Reconociendo el texto…")); bar(0.3 + m.progress * 0.7); } else { msg(t("Cargando el lector…")); bar(Math.min(0.3, (m.progress || 0) * 0.3)); } }
      });
      await ocrWorker.setParameters({ tessedit_pageseg_mode: "6", preserve_interword_spaces: "1" });
    }
    const { data: res } = await ocrWorker.recognize(canvas);
    if ($("#sheet").hidden) return; // cancelado
    const rows = linesToRows(res.text);
    if (!rows.length) { openSheet(`<h3>${t("No he encontrado texto")}</h3><p>${t("Prueba con una foto más cercana, recta y con buena luz.")}</p><div class="actions"><button class="btn primary" data-act="close">${t("Cerrar")}</button></div>`, () => {}); return; }
    pasteSheet(rows.map(r => r.join("\t")).join("\n"), t("Revisa lo que he leído y corrige los errores antes de continuar: la lectura de fotos no es perfecta, sobre todo con letra a mano."));
  } catch (err) {
    openSheet(`<h3>${t("No se pudo leer la foto")}</h3><p>${esc(err && err.message ? err.message : t("Error desconocido"))}</p><div class="actions"><button class="btn primary" data-act="close">${t("Cerrar")}</button></div>`, () => {});
  }
});
// escala, pasa a grises y aumenta el contraste para que el OCR acierte más
async function prepareImage(file) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(t("No se pudo abrir la imagen."))); i.src = URL.createObjectURL(file); });
  const max = 2200, k = Math.min(max / Math.max(img.width, img.height), 2.5);
  const w = Math.round(img.width * k), h = Math.round(img.height * k), cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const ctx = cv.getContext("2d"); ctx.drawImage(img, 0, 0, w, h); URL.revokeObjectURL(img.src);
  const id = ctx.getImageData(0, 0, w, h), px = id.data, hist = new Array(256).fill(0);
  for (let i = 0; i < px.length; i += 4) { const g = Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]); px[i] = g; hist[g]++; }
  let lo = 0, hi = 255, acc = 0; const n = w * h;
  for (let g = 0; g < 256; g++) { acc += hist[g]; if (acc > n * 0.01) { lo = g; break; } }
  acc = 0; for (let g = 255; g >= 0; g--) { acc += hist[g]; if (acc > n * 0.01) { hi = g; break; } }
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < px.length; i += 4) { const v = Math.max(0, Math.min(255, ((px[i] - lo) * 255) / span)); px[i] = px[i + 1] = px[i + 2] = v; }
  ctx.putImageData(id, 0, 0);
  return cv;
}
function linesToRows(text) {
  const isN = s => Number.isFinite(S.parseNum(s.replace(/[|]/g, "")));
  return String(text).split("\n").map(l => l.replace(/[|¦]/g, "  ").replace(/\s+$/, "")).filter(l => l.trim()).map(l => {
    const toks = l.trim().split(/\s+/);
    if (toks.filter(isN).length >= 2) { // etiqueta con varias palabras + números
      let k = 0; while (k < toks.length && !isN(toks[k])) k++;
      const label = toks.slice(0, k).join(" ");
      return (label ? [label] : [""]).concat(toks.slice(k));
    }
    return l.trim().split(/\s{2,}|\t/);
  });
}
