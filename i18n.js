/* Gráficalo · traducciones. El texto en español es la clave; cada archivo de lang/ contiene un idioma. */
"use strict";
let LANG = "es";
const I18N = {};
const LANGS = { es: "Español", en: "English", pt: "Português", fr: "Français", it: "Italiano", de: "Deutsch", ca: "Català" };
const COMMA_LANGS = ["es", "pt", "fr", "it", "de", "ca"];
const decimalComma = () => COMMA_LANGS.includes(LANG);
const DEC = () => (decimalComma() ? "," : ".");
function detectLang() {
  const list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "es"]).map(x => String(x).toLowerCase());
  for (const l of list) { const k = l.split("-")[0]; if (LANGS[k]) return k; }
  return "en";
}
function localeTag() {
  const nav = String(navigator.language || "").toLowerCase();
  if (LANG === "pt") return nav === "pt-pt" ? "pt-PT" : "pt-BR";
  return { es: "es-ES", en: nav.startsWith("en-gb") ? "en-GB" : "en-US", fr: "fr-FR", it: "it-IT", de: "de-DE", ca: "ca-ES" }[LANG] || "es-ES";
}
function loadLang(l) {
  if (l === "es" || I18N[l]) return Promise.resolve();
  return new Promise(res => { const s = document.createElement("script"); s.src = `lang/${l}.js`; s.onload = res; s.onerror = res; document.head.appendChild(s); });
}
function t(s, params) {
  const d = I18N[LANG];
  let r = (d && d[s]) || s;
  if (params) r = r.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? params[k] : m));
  return r;
}
