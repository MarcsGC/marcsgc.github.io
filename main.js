/* Gráficalo · arranque */
"use strict";
(async function start() {
  const want = settings.lang && LANGS[settings.lang] ? settings.lang : detectLang();
  await loadLang(want);
  LANG = I18N[want] || want === "es" ? want : "es"; S.setLocale({ decimalComma: decimalComma() }); document.documentElement.lang = LANG;
  applyTheme();
  initState();
  hist();
  translateStatic();
  renderChart._w = wide();
  renderAll();
  showView(wide() ? "view-chart" : "view-data");
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => { if (settings.theme === "auto") { applyTheme(); renderTable(); refresh(); } });
  document.fonts?.ready.then(() => refresh());
  if (location.hash === "#quick") { try { history.replaceState(null, "", location.pathname + location.search); } catch {} openQuickFromShortcut(); }
  checkIncomingLink().then(() => { if (!settings.tutorialDone && $("#sheet").hidden) showOnboarding(); });
  window.addEventListener("hashchange", checkIncomingLink);
  if ("serviceWorker" in navigator && location.protocol === "https:" && !/claude|anthropic/.test(location.hostname)) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
