/* Gráficalo · calculadora de notas, PIN, novedades, sugerencias y valoración */
"use strict";

const CONTACT = "cuentapersonalmgc@gmail.com";
const PLAY_URL = "https://play.google.com/store/apps/details?id=io.github.marcsgc.twa";

/* ---------- ¿Qué nota necesito? ---------- */
const gradeState = { rows: [{ g: "", w: "" }, { g: "", w: "" }], next: "", target: "5", max: "10" };
function gradeSheet() {
  const p = cur(), d = data(), gs = gradeState;
  const nums = p.cols.filter(c => c.kind === "num");
  const rowOpts = nums.length ? d.rowIdx.map(i => `<option value="${i}">${esc(labelText(p, i))}</option>`).join("") : "";
  openSheet(`<h3>${t("¿Qué nota necesito?")}</h3>
    <p class="hint">${t("Escribe tus notas y cuánto pesa cada una. Si todas pesan lo mismo, deja el peso vacío.")}</p>
    ${rowOpts ? `<div class="sel-row"><label>${t("Cargar las notas de")} <select id="grRow"><option value="">—</option>${rowOpts}</select></label></div>` : ""}
    <div class="listrows" id="grRows">${gs.rows.map((r, i) => `<div class="listrow" data-i="${i}"><input class="n" type="text" inputmode="decimal" data-g="g" value="${esc(r.g)}" placeholder="${t("Nota")}"><input type="text" inputmode="decimal" data-g="w" value="${esc(r.w)}" placeholder="${t("Peso (%)")}"><button class="x" data-act="rm:${i}" aria-label="${t("Quitar")}">×</button></div>`).join("")}</div>
    <button class="btn small" data-act="add" style="align-self:flex-start">${ICON(IC.plus)}${t("Otra nota")}</button>
    <div class="inputs">
      <label>${t("Peso del próximo examen (%)")}<input type="text" inputmode="decimal" id="grNext" value="${esc(gs.next)}" placeholder="${t("igual")}"></label>
      <label>${t("Media que quiero")}<input type="text" inputmode="decimal" id="grTarget" value="${esc(gs.target)}"></label>
      <label>${t("Nota máxima")}<input type="text" inputmode="decimal" id="grMax" value="${esc(gs.max)}"></label>
    </div>
    <div id="grOut"></div>
    <div class="actions"><button class="btn primary" data-act="close">${t("Cerrar")}</button></div>`,
  act => {
    read();
    if (act === "add") { gs.rows.push({ g: "", w: "" }); gradeSheet(); setTimeout(() => $$("#grRows [data-g=g]").pop()?.focus(), 60); }
    if (act.startsWith("rm:")) { gs.rows.splice(+act.slice(3), 1); if (!gs.rows.length) gs.rows.push({ g: "", w: "" }); gradeSheet(); }
  });
  const read = () => {
    $$("#grRows .listrow").forEach(r => { const o = gs.rows[+r.dataset.i]; if (o) { o.g = r.querySelector("[data-g=g]").value; o.w = r.querySelector("[data-g=w]").value; } });
    gs.next = $("#grNext").value; gs.target = $("#grTarget").value; gs.max = $("#grMax").value;
  };
  const calc = () => {
    read();
    const rows = gs.rows.map(r => ({ g: S.parseNum(r.g), w: S.parseNum(r.w) })).filter(r => Number.isFinite(r.g));
    const target = S.parseNum(gs.target), max = S.parseNum(gs.max) || 10;
    if (!rows.length || !Number.isFinite(target)) { $("#grOut").innerHTML = ""; return; }
    const anyW = rows.some(r => Number.isFinite(r.w));
    const ws = rows.map(r => (anyW ? (Number.isFinite(r.w) ? r.w : 0) : 1)), W = S.sum(ws), sumGW = S.sum(rows.map((r, i) => r.g * ws[i]));
    const current = W ? sumGW / W : NaN;
    let wn = S.parseNum(gs.next);
    if (!Number.isFinite(wn) || wn <= 0) wn = anyW ? Math.max(0, 100 - W) || W / rows.length : 1;
    const need = (target * (W + wn) - sumGW) / wn;
    let msg, cls = "";
    if (need <= 0) { msg = t("Ya lo tienes: aunque saques un 0, tu media será {m}.", { m: fmt((sumGW) / (W + wn)) }); cls = "yes"; }
    else if (need > max) msg = t("No es posible: necesitarías un {x} y la nota máxima es {max}. Con un {max} tu media sería {m}.", { x: fmt(need), max: fmt(max), m: fmt((sumGW + max * wn) / (W + wn)) });
    else { msg = t("Necesitas al menos un {x} en el próximo examen.", { x: fmt(Math.ceil(need * 100) / 100) }); cls = "yes"; }
    $("#grOut").innerHTML = `<div class="verdict ${cls}"><b>${esc(msg)}</b><p>${t("Media actual: {m}", { m: fmt(current) })}${anyW ? ` · ${t("pesos usados: {w} % + {n} % del próximo", { w: fmt(W), n: fmt(wn) })}` : ""}</p></div>`;
  };
  $("#sheetCard").addEventListener("input", calc);
  $("#grRow")?.addEventListener("change", e => {
    const i = +e.target.value; if (e.target.value === "") return;
    gradeState.rows = nums.map(c => ({ g: Number.isFinite(d.byId[c.id][i]) ? String(d.byId[c.id][i]).replace(".", DEC()) : "", w: "" })).filter(r => r.g !== "");
    if (!gradeState.rows.length) gradeState.rows = [{ g: "", w: "" }];
    gradeSheet();
  });
  calc();
}

/* ---------- PIN ---------- */
async function hashPin(pin, salt) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ":" + pin));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function pinSetSheet() {
  openSheet(`<h3>${t("Bloqueo con PIN")}</h3><p class="hint">${t("Elige un PIN de 4 a 8 cifras. Si lo olvidas, solo podrás entrar borrando todos los datos, así que guarda antes una copia de seguridad.")}</p>
    <div class="row2"><div class="field"><label class="label" for="pin1">${t("PIN")}</label><input type="password" inputmode="numeric" id="pin1" maxlength="8" autocomplete="new-password"></div>
    <div class="field"><label class="label" for="pin2">${t("Repite el PIN")}</label><input type="password" inputmode="numeric" id="pin2" maxlength="8" autocomplete="new-password"></div></div>
    <p class="err" id="pinErr"></p>
    <div class="actions"><button class="btn ghost" data-act="close">${t("Cancelar")}</button><button class="btn primary" data-act="ok">${t("Guardar")}</button></div>`,
  async act => {
    if (act !== "ok") return;
    const a = $("#pin1").value, b = $("#pin2").value;
    if (!/^\d{4,8}$/.test(a)) { $("#pinErr").textContent = t("El PIN tiene que tener entre 4 y 8 cifras."); return; }
    if (a !== b) { $("#pinErr").textContent = t("Los dos PIN no coinciden."); return; }
    if (!window.crypto?.subtle) { $("#pinErr").textContent = t("Este navegador no permite usar PIN."); return; }
    const salt = uid() + uid(); settings.pin = { salt, len: a.length, hash: await hashPin(a, salt) }; saveSettings();
    closeSheet(); toast(t("PIN activado"));
  });
  setTimeout(() => $("#pin1").focus(), 60);
}
let lockBuf = "", lockFails = 0, lockUntil = 0, hiddenAt = 0;
function showLock() {
  if (!settings.pin || !$("#lock").hidden) return;
  lockBuf = ""; drawLock(); $("#lock").hidden = false;
}
function drawLock(msg = "", forgot = false) {
  const n = (settings.pin && settings.pin.len) || 4, dots = Array.from({ length: n }, (_, i) => `<i class="${i < lockBuf.length ? "on" : ""}"></i>`).join("");
  $("#lock").innerHTML = forgot
    ? `<div class="lockcard"><h3>${t("¿Olvidaste el PIN?")}</h3><p>${t("Por seguridad no se puede recuperar. Puedes borrar todos los datos de la app y quitar el PIN; después podrás restaurar una copia de seguridad si la tienes.")}</p>
       <div class="actions"><button class="btn" data-l="back">${t("Volver")}</button><button class="btn danger" data-l="wipe">${t("Borrar todo y quitar el PIN")}</button></div></div>`
    : `<div class="lockcard"><svg viewBox="0 0 32 32" width="44" height="44" aria-hidden="true"><rect x="2" y="2" width="28" height="28" rx="7" fill="var(--accent)"/><rect x="8" y="17" width="4" height="8" rx="1" fill="var(--sheet)"/><rect x="14" y="11" width="4" height="14" rx="1" fill="var(--sheet)"/><rect x="20" y="7" width="4" height="18" rx="1" fill="var(--amber)"/></svg>
       <h3>${t("Introduce tu PIN")}</h3><div class="pindots">${dots}</div><p class="err" style="min-height:1.2em">${esc(msg)}</p>
       <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<button data-k="${k}">${k}</button>`).join("")}<button data-l="forgot" class="sm">${t("¿Olvidado?")}</button><button data-k="0">0</button><button data-l="del" aria-label="${t("Borrar")}">⌫</button></div></div>`;
}
$("#lock").addEventListener("click", async e => {
  const k = e.target.closest("[data-k]"), l = e.target.closest("[data-l]");
  if (l?.dataset.l === "forgot") return drawLock("", true);
  if (l?.dataset.l === "back") return drawLock();
  if (l?.dataset.l === "wipe") { try { [KEY, "graficalo.v2", "graficalo.v1", "graficalo.gdtoken"].forEach(k => localStorage.removeItem(k)); } catch {} delete settings.pin; delete settings.sync; saveSettings(); location.reload(); return; }
  if (l?.dataset.l === "del") { lockBuf = lockBuf.slice(0, -1); return drawLock(); }
  if (!k) return;
  if (Date.now() < lockUntil) return drawLock(t("Demasiados intentos. Espera unos segundos."));
  const len = settings.pin.len || 4;
  if (lockBuf.length >= len) return;
  lockBuf += k.dataset.k; drawLock();
  if (lockBuf.length < len) return;
  if ((await hashPin(lockBuf, settings.pin.salt)) === settings.pin.hash) { $("#lock").hidden = true; lockBuf = ""; lockFails = 0; return; }
  lockFails++; lockBuf = ""; if (lockFails >= 5) { lockUntil = Date.now() + 30000; lockFails = 0; } drawLock(t("PIN incorrecto"));
});
document.addEventListener("keydown", e => { if ($("#lock").hidden) return; if (/^\d$/.test(e.key)) $(`#lock [data-k="${e.key}"]`)?.click(); if (e.key === "Backspace") $('#lock [data-l="del"]')?.click(); });
document.addEventListener("visibilitychange", () => { if (document.hidden) hiddenAt = Date.now(); else if (settings.pin && hiddenAt && Date.now() - hiddenAt > 60000) showLock(); });

/* ---------- novedades ---------- */
const WHATS_NEW = {
  "0.6": ["Tus proyectos en tarjetas al abrir la app, con su último valor y un minigráfico.", "Unidades en las columnas (€, kg, %…) que se ven en la tabla, los gráficos y las estadísticas.", "Un resumen en una frase encima de las estadísticas.", "Botones de un toque en el registro rápido para respuestas como Sí / No.", "Modo sencillo: las estadísticas avanzadas se activan en Ajustes."],
  "0.5": ["Sincroniza tus proyectos entre el móvil y el ordenador con Google Drive (Menú → Sincronizar con Google Drive).", "Nueva pantalla de inicio para elegir con qué plantilla empezar, con las plantillas agrupadas.", "Al borrar todos los proyectos ya no vuelven a aparecer los ejemplos."],
  "0.4": ["Tendencia y media de 7 días en los gráficos de evolución, y fecha estimada para llegar a tu objetivo.", "IMC y cambio entre kg y lb en el registro de peso.", "Compara esta semana con la anterior, o este mes con el pasado (Estadísticas → Periodos).", "«¿Qué nota necesito?» en el menú, y media ponderada en las fórmulas.", "Plantillas nuevas: presupuesto anual, hucha de ahorro, tensión, glucosa, horas de trabajo y hábitos.", "Bloqueo con PIN, y envío de sugerencias desde el menú."],
  "0.3": ["Ahora en 7 idiomas.", "Registro rápido: escribe el valor y la fecha se pone sola."]
};
function whatsNewSheet(force) {
  const items = WHATS_NEW[APP_VERSION] || [];
  if (!items.length && !force) return;
  openSheet(`<h3>${t("Novedades de la versión {v}", { v: APP_VERSION })}</h3>
    <ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px">${items.map(x => `<li>${esc(t(x))}</li>`).join("")}</ul>
    <div class="actions"><button class="btn primary" data-act="close">${t("Entendido")}</button></div>`, () => {});
}

/* ---------- sugerencias ---------- */
function feedbackSheet() {
  let kind = "idea";
  openSheet(`<h3>${t("Enviar sugerencias o errores")}</h3>
    <div class="seg" role="group" id="fbSeg"><button data-act="k:idea" aria-pressed="true">${t("Sugerencia")}</button><button data-act="k:bug" aria-pressed="false">${t("Error")}</button></div>
    <textarea id="fbText" placeholder="${t("Cuéntame qué te gustaría o qué ha fallado…")}" style="min-height:120px;font-family:var(--body)"></textarea>
    <label style="display:flex;gap:8px;align-items:center;font-size:.9rem"><input type="checkbox" id="fbInfo" checked> ${t("Incluir la versión de la app y del móvil")}</label>
    <p class="hint">${t("Se abrirá tu app de correo con el mensaje listo. También puedes escribir a {e}.", { e: `<b style="user-select:all">${CONTACT}</b>` })}</p>
    <div class="actions"><button class="btn" data-act="copy">${ICON(IC.copy)}${t("Copiar dirección")}</button><a class="btn primary" id="fbSend" href="#">${ICON('<path d="M4 6h16v12H4z"/><path d="M4 7l8 6 8-6"/>')}${t("Enviar por correo")}</a></div>`,
  act => {
    if (act.startsWith("k:")) { kind = act.slice(2); $$("#fbSeg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.act === act)); upd(); }
    if (act === "copy") copyText(CONTACT).then(ok => toast(ok ? t("Dirección copiada") : CONTACT));
  });
  const upd = () => {
    const info = $("#fbInfo").checked ? `\n\n---\nGráficalo ${APP_VERSION} · ${LANG} · ${navigator.userAgent} · ${screen.width}×${screen.height}` : "";
    const subject = `Gráficalo ${APP_VERSION} · ${kind === "bug" ? t("Error") : t("Sugerencia")}`;
    $("#fbSend").href = `mailto:${CONTACT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent($("#fbText").value + info)}`;
  };
  $("#fbText").addEventListener("input", upd); $("#fbInfo").addEventListener("change", upd); upd();
  $("#fbSend").addEventListener("click", () => setTimeout(closeSheet, 300));
}

/* ---------- valorar ---------- */
function rateSheet(manual) {
  openSheet(`<h3>${t("¿Te está gustando Gráficalo?")}</h3>
    <p>${t("Si te resulta útil, una valoración en Google Play ayuda mucho a que otras personas la encuentren. Solo tarda un momento.")}</p>
    <div class="actions">${manual ? "" : `<button class="btn ghost" data-act="never">${t("No, gracias")}</button><button class="btn" data-act="later">${t("Más tarde")}</button>`}<a class="btn primary" id="rateGo" href="${PLAY_URL}" target="_blank" rel="noopener">${t("Valorar en Google Play")}</a></div>
    ${manual ? "" : `<p class="hint">${t("¿Algo no te convence? Mejor cuéntamelo:")} <button class="btn small ghost" data-act="fb">${t("Enviar sugerencias o errores")}</button></p>`}`,
  act => {
    if (act === "never") { settings.rate = "never"; saveSettings(); closeSheet(); }
    if (act === "later") { settings.rateNext = (settings.opens || 0) + 10; saveSettings(); closeSheet(); }
    if (act === "fb") feedbackSheet();
  });
  $("#rateGo").addEventListener("click", () => { settings.rate = "done"; saveSettings(); setTimeout(closeSheet, 300); });
}

/* ---------- arranque ---------- */
function startupExtras() {
  settings.opens = (settings.opens || 0) + 1; settings.firstOpen = settings.firstOpen || Date.now();
  const newUser = !settings.tutorialDone;
  const showNews = !newUser && settings.seenVersion !== APP_VERSION;
  settings.seenVersion = APP_VERSION; saveSettings();
  if (settings.pin) showLock();
  setTimeout(() => {
    if (!$("#sheet").hidden || !$("#onb").hidden) return;
    if (showNews) return whatsNewSheet();
    const days = (Date.now() - settings.firstOpen) / 864e5;
    if (!settings.rate && settings.opens >= 8 && days >= 3 && settings.opens >= (settings.rateNext || 0)) rateSheet(false);
  }, 1200);
}
