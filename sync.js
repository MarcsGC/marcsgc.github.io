/* Gráficalo · sincronización con Google Drive
   Los proyectos se guardan en la carpeta oculta de la app en el Drive del usuario (permiso drive.appdata).
   Sin servidores: el móvil o el PC hablan directamente con Google. Inicio de sesión por redirección
   (OAuth 2.0 para apps web en el navegador), que funciona igual en el navegador y dentro de la app de Google Play. */
"use strict";
const GDRIVE_CLIENT_ID = "961630600416-a7kce325bvvkt48lh75vi3h6pavrb56n.apps.googleusercontent.com"; // ID de cliente de OAuth (no es secreto)
const GD_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const GD_FILE = "graficalo-sync.json";
const GD_TOK = "graficalo.gdtoken", GD_STATE = "graficalo.gdstate";
const syncState = { busy: false, again: false, status: "off", lastPull: 0, lastFp: "", applying: false };

const gdEnabled = () => !!GDRIVE_CLIENT_ID;
const syncOn = () => !!(settings.sync && settings.sync.on);
const gdRedirectUri = () => new URL("./", location.href.split("#")[0].split("?")[0]).href;
function gdToken() { try { const x = JSON.parse(localStorage.getItem(GD_TOK)); return x && x.exp > Date.now() + 60000 ? x.t : null; } catch { return null; } }
const gdSaveTok = x => { try { localStorage.setItem(GD_TOK, JSON.stringify(x)); } catch {} };
const gdClearTok = () => { try { localStorage.removeItem(GD_TOK); } catch {} };

/* ---------- inicio de sesión ---------- */
function gdAuth(silent) {
  if (!gdEnabled()) return;
  const st = uid() + uid() + "." + (silent ? "s" : "m");
  try { localStorage.setItem(GD_STATE, st); } catch {}
  saveNow();
  const q = new URLSearchParams({ client_id: GDRIVE_CLIENT_ID, redirect_uri: gdRedirectUri(), response_type: "token", scope: GD_SCOPE, include_granted_scopes: "true", state: st });
  if (silent) q.set("prompt", "none");
  if (settings.sync?.email) q.set("login_hint", settings.sync.email);
  location.assign("https://accounts.google.com/o/oauth2/v2/auth?" + q);
}
// Vuelta de Google: #access_token=…&expires_in=…&state=…  o  #error=…&state=…
function gdHandleRedirect() {
  const h = location.hash;
  if (!/(^#|&)(access_token|error)=/.test(h)) return null;
  const p = new URLSearchParams(h.slice(1));
  try { history.replaceState(null, "", location.pathname + location.search); } catch {}
  let st = null; try { st = localStorage.getItem(GD_STATE); localStorage.removeItem(GD_STATE); } catch {}
  if (!st || p.get("state") !== st) return { error: "state" };
  const silent = st.endsWith(".s");
  if (p.get("error")) return { error: p.get("error"), silent };
  gdSaveTok({ t: p.get("access_token"), exp: Date.now() + (+p.get("expires_in") || 3600) * 1000 });
  return { ok: true, silent };
}

/* ---------- API de Drive ---------- */
async function gd(path, opts = {}) {
  const tok = gdToken();
  if (!tok) throw Object.assign(new Error("auth"), { auth: true });
  const url = path.startsWith("http") ? path : "https://www.googleapis.com/drive/v3/" + path;
  const r = await fetch(url, { ...opts, headers: { Authorization: "Bearer " + tok, ...(opts.headers || {}) } });
  if (r.status === 401) { gdClearTok(); throw Object.assign(new Error("auth"), { auth: true }); }
  if (!r.ok) throw new Error("http " + r.status);
  return r;
}
async function gdFind() {
  const q = encodeURIComponent(`name='${GD_FILE}' and trashed=false`);
  const r = await gd(`files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)&orderBy=modifiedTime%20desc&pageSize=10`);
  return (await r.json()).files || [];
}
const gdDownload = async id => (await gd(`files/${id}?alt=media`)).json();
async function gdCreate(obj) {
  const b = "graficalo" + Date.now();
  const body = `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: GD_FILE, parents: ["appDataFolder"] })}\r\n--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(obj)}\r\n--${b}--`;
  return (await gd("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", { method: "POST", headers: { "Content-Type": "multipart/related; boundary=" + b }, body })).json();
}
async function gdUpdate(id, obj) {
  return (await gd(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media&fields=id`, { method: "PATCH", headers: { "Content-Type": "application/json; charset=UTF-8" }, body: JSON.stringify(obj) })).json();
}
async function gdEmail() { try { return (await (await gd("about?fields=user(emailAddress)")).json()).user?.emailAddress || ""; } catch { return ""; } }

/* ---------- fusión ----------
   Por proyecto gana la versión con el cambio más reciente (p.updated). Un proyecto borrado (state.deleted[id] = fecha)
   desaparece si nadie lo ha tocado después de borrarlo. Si se editó en los dos sitios desde la última sincronización,
   se conserva también la versión perdedora como copia, para no perder nada. */
function mergeSync(local, remote, lastSync) {
  const del = { ...(remote?.deleted || {}) };
  Object.entries(local.deleted || {}).forEach(([k, v]) => { if (!(del[k] >= v)) del[k] = v; });
  const old = Date.now() - 180 * 864e5;
  Object.keys(del).forEach(k => { if (del[k] < old) delete del[k]; });
  const L = new Map(local.projects.map(p => [p.id, p])), R = new Map((remote?.projects || []).map(p => [p.id, p]));
  const all = [...local.projects, ...(remote?.projects || [])];
  const copied = new Set(all.map(p => p.conflictOf).filter(Boolean));
  const out = [], losers = [];
  for (const id of new Set([...L.keys(), ...R.keys()])) {
    const a = L.get(id), b = R.get(id);
    let win = a || b;
    if (a && b) {
      const ua = a.updated || 0, ub = b.updated || 0;
      win = ua >= ub ? a : b;
      const lose = win === a ? b : a;
      if (ua !== ub && lastSync && ua > lastSync && ub > lastSync && snap(a) !== snap(b) && !copied.has(id + ":" + (lose.updated || 0))) losers.push(lose);
    }
    if (del[id] && del[id] >= (win.updated || 0)) continue;
    delete del[id];
    out.push(win);
  }
  losers.forEach(p => {
    const c = JSON.parse(JSON.stringify(p));
    c.conflictOf = p.id + ":" + (p.updated || 0); c.id = uid(); c.name = p.name + " " + t("(otro dispositivo)"); c.updated = Date.now();
    out.push(c);
  });
  return { projects: out, deleted: del, conflicts: losers.length };
}
const syncFp = x => (x?.projects || []).map(p => p.id + ":" + (p.updated || 0)).sort().join(",") + "|" + Object.keys(x?.deleted || {}).sort().join(",");

function applyMerged(m) {
  const before = new Map(state.projects.map(p => [p.id, p]));
  const curBefore = cur();
  state.projects = m.projects; state.deleted = m.deleted;
  state.projects.forEach(p => { const o = before.get(p.id); if (o && o !== p) delete HIST[p.id]; });
  Object.keys(HIST).forEach(k => { if (!before.has(k) || !state.projects.some(p => p.id === k)) delete HIST[k]; });
  if (!state.projects.find(p => p.id === state.current)) state.current = state.projects[0]?.id || null;
  syncState.applying = true; saveNow(); syncState.applying = false;
  const editing = document.activeElement?.closest?.("#tbody, #quick, #sheet");
  if (curBefore && cur() === curBefore && editing) { renderProjects(); return; } // no interrumpir lo que estás escribiendo
  hist(); dirty(); renderAll();
}

/* ---------- ciclo de sincronización ---------- */
function setSync(s) { syncState.status = s; document.body.dataset.sync = s; }
async function syncNow(opts = {}) {
  if (!gdEnabled() || !syncOn()) return;
  if (!gdToken()) { setSync("paused"); if (opts.manual) gdAuth(false); return; }
  if (!navigator.onLine) { setSync("offline"); return; }
  const localFp = syncFp(state);
  if (opts.auto && localFp === syncState.lastFp && Date.now() - syncState.lastPull < 60000) return;
  if (syncState.busy) { syncState.again = true; return; }
  syncState.busy = true; setSync("busy");
  try {
    const files = await gdFind();
    const fileId = files[0]?.id;
    let remote = fileId ? await gdDownload(fileId) : null;
    for (const f of files.slice(1)) { // copias duplicadas (dos dispositivos creando a la vez): se funden y se borran
      try { remote = mergeSync(remote || { projects: [] }, await gdDownload(f.id), 0); await gd(`files/${f.id}`, { method: "DELETE" }); } catch {}
    }
    const m = mergeSync({ projects: state.projects, deleted: state.deleted }, remote, settings.sync.lastSync || 0);
    const fp = syncFp(m);
    if (fp !== localFp || m.conflicts) applyMerged(m);
    if (!remote || fp !== syncFp(remote) || m.conflicts) {
      const obj = { app: "graficalo", v: 1, updated: Date.now(), projects: state.projects, deleted: state.deleted };
      if (fileId) await gdUpdate(fileId, obj); else await gdCreate(obj);
    }
    settings.sync.lastSync = Date.now(); settings.sync.err = 0; saveSettings();
    syncState.lastPull = Date.now(); syncState.lastFp = syncFp(state);
    if (m.conflicts) toast(t("Se ha guardado una copia de {n} proyecto(s) que se editaron en dos dispositivos a la vez.", { n: m.conflicts }));
    setSync("ok");
  } catch (e) {
    setSync(e.auth ? "paused" : "error");
    if (opts.manual) toast(e.auth ? t("Hay que volver a conectar con Google") : t("No se ha podido sincronizar. Lo intentaré más tarde."));
  } finally {
    syncState.busy = false;
    if (syncState.again) { syncState.again = false; syncSoon(); }
    if ($("#sheet") && !$("#sheet").hidden && $("#syncInfo")) $("#syncInfo").innerHTML = syncInfoHTML();
    if (!$("#home").hidden) showHome();
  }
}
const syncSoon = debounce(() => { if (!syncState.applying) syncNow({ auto: true }); }, 2500);

// antes de salir a la página de Google, comprobar que hay red de verdad (si no, se quedaría en una página de error)
function gdReachable() {
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 3500);
  return fetch("https://accounts.google.com/favicon.ico?" + Date.now(), { mode: "no-cors", cache: "no-store", signal: ctl.signal }).then(() => true, () => false).finally(() => clearTimeout(tm));
}
async function startupSync() {
  if (!gdEnabled()) return;
  const r = gdHandleRedirect();
  if (r?.ok) {
    if (!settings.sync) settings.sync = {};
    const first = !settings.sync.on || !settings.sync.email;
    settings.sync.on = true; settings.sync.silentFail = 0; saveSettings();
    if (first) { settings.sync.email = await gdEmail(); saveSettings(); }
    const n0 = state.projects.length;
    await syncNow();
    if (first) toast(state.projects.length > n0 ? t("Conectado con Google Drive: {n} proyectos traídos", { n: state.projects.length - n0 }) : t("Conectado con Google Drive"));
  } else if (r?.error) {
    if (r.silent && settings.sync) { settings.sync.silentFail = Date.now(); saveSettings(); setSync("paused"); }
    else {
      if (settings.sync && !settings.sync.email) { settings.sync.on = false; saveSettings(); }
      if (r.error !== "access_denied") toast(t("No se ha podido conectar con Google"));
    }
  } else if (syncOn()) {
    if (gdToken()) syncNow();
    else if (navigator.onLine && Date.now() - (settings.sync.silentFail || 0) > 6 * 3600e3 && await gdReachable()) gdAuth(true); // reconexión silenciosa
    else setSync("paused");
  }
  document.addEventListener("visibilitychange", () => {
    if (!syncOn()) return;
    if (document.visibilityState === "visible" && Date.now() - syncState.lastPull > 30000) syncNow();
    if (document.visibilityState === "hidden" && syncFp(state) !== syncState.lastFp) syncNow();
  });
  window.addEventListener("online", () => syncOn() && syncNow());
}

/* ---------- pantalla de ajustes ---------- */
function agoText(ts) {
  if (!ts) return t("nunca");
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return t("ahora mismo");
  if (m < 60) return t("hace {n} min", { n: m });
  const h = Math.round(m / 60); if (h < 24) return t("hace {n} h", { n: h });
  return fmtDate(isoOf(new Date(ts)), true);
}
function syncInfoHTML() {
  const s = syncState.status, last = settings.sync?.lastSync;
  const line = s === "busy" ? t("Sincronizando…")
    : s === "paused" ? t("En pausa: hay que volver a conectar con Google.")
    : s === "offline" ? t("Sin conexión. Se sincronizará cuando vuelva.")
    : s === "error" ? t("No se ha podido sincronizar. Lo intentaré más tarde.")
    : t("Última sincronización: {w}", { w: agoText(last) });
  return `<p style="margin:0">${settings.sync?.email ? t("Conectado como {e}", { e: `<b>${esc(settings.sync.email)}</b>` }) : t("Conectado con Google Drive")}</p><p class="hint" style="margin:4px 0 0">${line}</p>`;
}
function syncMenuSub() {
  if (!syncOn()) return t("Tus proyectos en el móvil y en el ordenador");
  return syncState.status === "paused" ? t("En pausa: toca para reconectar") : t("Última sincronización: {w}", { w: agoText(settings.sync.lastSync) });
}
function syncSheet() {
  if (!gdEnabled()) { toast(t("La sincronización aún no está disponible")); return; }
  if (!syncOn()) {
    openSheet(`<h3>${t("Sincronizar con Google Drive")}</h3>
      <ul class="hint" style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px">
        <li>${t("Usa Gráficalo en el móvil y en el ordenador con la misma cuenta de Google y tendrás los mismos proyectos en los dos.")}</li>
        <li>${t("Se guardan en una carpeta oculta de tu Google Drive que solo ve Gráficalo. No aparece entre tus archivos ni toca nada más.")}</li>
        <li>${t("Gráficalo no tiene servidores: tus datos van directamente de tu dispositivo a tu Drive.")}</li>
      </ul>
      <p class="hint" style="margin:0">${t("Se abrirá la página de Google para que elijas tu cuenta y vuelvas.")}</p>
      <div class="actions"><button class="btn ghost" data-act="close">${t("Cancelar")}</button><button class="btn primary" data-act="connect">${t("Conectar con Google")}</button></div>`,
    act => {
      if (act !== "connect") return;
      if (!navigator.onLine) { toast(t("Necesitas conexión a internet")); return; }
      settings.sync = Object.assign(settings.sync || {}, { on: true }); saveSettings(); gdAuth(false);
    });
    return;
  }
  const paused = !gdToken();
  openSheet(`<h3>${t("Sincronizar con Google Drive")}</h3>
    <div id="syncInfo">${syncInfoHTML()}</div>
    <p class="hint" style="margin:0">${t("Se sincroniza solo al abrir la app y cada vez que cambias algo. Si editas el mismo proyecto en dos dispositivos sin conexión, se queda el cambio más reciente y se guarda una copia del otro.")}</p>
    <div class="actions"><button class="btn ghost" data-act="off">${t("Desconectar")}</button><button class="btn primary" data-act="now">${paused ? t("Reconectar") : t("Sincronizar ahora")}</button></div>`,
  act => {
    if (act === "now") { if (!gdToken()) gdAuth(false); else syncNow({ manual: true }); $("#syncInfo").innerHTML = syncInfoHTML(); }
    if (act === "off") disconnectSheet();
  });
}
function disconnectSheet() {
  openSheet(`<h3>${t("Desconectar Google Drive")}</h3>
    <p class="hint" style="margin:0">${t("Tus proyectos se quedan en este dispositivo. Dejarán de sincronizarse con los demás.")}</p>
    <label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" id="gdWipe" style="margin-top:4px"> ${t("Borrar también la copia guardada en Google Drive")}</label>
    <div class="actions"><button class="btn ghost" data-act="close">${t("Cancelar")}</button><button class="btn danger" data-act="ok">${t("Desconectar")}</button></div>`,
  async act => {
    if (act !== "ok") return;
    const wipe = $("#gdWipe").checked, tok = gdToken();
    if (wipe && tok) { try { for (const f of await gdFind()) await gd(`files/${f.id}`, { method: "DELETE" }); } catch { toast(t("No se ha podido borrar la copia de Google Drive")); } }
    if (tok) fetch("https://oauth2.googleapis.com/revoke?token=" + encodeURIComponent(tok), { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" } }).catch(() => {});
    gdClearTok(); delete settings.sync; saveSettings(); setSync("off"); closeSheet(); toast(t("Google Drive desconectado"));
  });
}
