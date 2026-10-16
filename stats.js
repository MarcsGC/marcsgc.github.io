/* Gráficalo · motor de cálculo (sin dependencias). Funciona en el navegador y en Node para pruebas. */
(function (root) {
  "use strict";

  /* ---------- números ---------- */
  function parseNum(s) {
    if (typeof s === "number") return Number.isFinite(s) ? s : NaN;
    if (s === null || s === undefined) return NaN;
    let t = String(s).trim().replace(/\s/g, "").replace(/[€$%]/g, "");
    if (!t) return NaN;
    if (t.includes(",") && t.includes(".")) {
      t = t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
    } else t = t.replace(",", ".");
    if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t)) return NaN;
    const n = Number(t);
    return Number.isFinite(n) ? n : NaN;
  }

  /* ---------- estadística descriptiva ---------- */
  const sum = a => a.reduce((s, x) => s + x, 0);
  const mean = a => (a.length ? sum(a) / a.length : NaN);
  const sorted = a => [...a].sort((x, y) => x - y);
  function quantile(a, p) { // interpolación lineal (como CUARTIL.INC de Excel)
    if (!a.length) return NaN;
    const s = sorted(a), i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
    return s[lo] + (s[hi] - s[lo]) * (i - lo);
  }
  const median = a => quantile(a, 0.5);
  function mode(a) {
    const c = new Map();
    a.forEach(x => c.set(x, (c.get(x) || 0) + 1));
    const max = Math.max(0, ...c.values());
    if (max < 2) return [];
    return [...c].filter(([, v]) => v === max).map(([k]) => k).sort((x, y) => x - y);
  }
  function variance(a) {
    if (a.length < 2) return NaN;
    const m = mean(a);
    return sum(a.map(x => (x - m) ** 2)) / (a.length - 1);
  }
  const sd = a => Math.sqrt(variance(a));
  function describe(a) {
    const q1 = quantile(a, 0.25), q3 = quantile(a, 0.75), iqr = q3 - q1, m = mean(a), s = sd(a);
    const lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr;
    const inside = a.filter(x => x >= lo && x <= hi);
    return {
      n: a.length, sum: sum(a), mean: m, median: median(a), mode: mode(a),
      min: a.length ? Math.min(...a) : NaN, max: a.length ? Math.max(...a) : NaN,
      sd: s, variance: variance(a), q1, q3, iqr,
      cv: m ? (s / Math.abs(m)) * 100 : NaN,
      outliers: a.filter(x => x < lo || x > hi),
      whiskerLow: inside.length ? Math.min(...inside) : NaN,
      whiskerHigh: inside.length ? Math.max(...inside) : NaN
    };
  }

  /* ---------- regresiones ---------- */
  function solve(A, b) { // eliminación gaussiana con pivote parcial
    const n = b.length, M = A.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-12) return null;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const f = M[r][c] / M[c][c];
        for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
      }
    }
    return M.map((r, i) => r[n] / r[i]);
  }
  function linFit(xs, ys) {
    const n = xs.length, mx = mean(xs), my = mean(ys);
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
    if (!sxx) return null;
    const b = sxy / sxx;
    return { a: my - b * mx, b, r: syy ? sxy / Math.sqrt(sxx * syy) : NaN };
  }
  const MODELS = {
    linear: "Lineal", exponential: "Exponencial", logarithmic: "Logarítmica", power: "Potencial",
    poly2: "Polinómica (grado 2)", poly3: "Polinómica (grado 3)", poly4: "Polinómica (grado 4)"
  };
  function fit(type, X, Y, fmt) {
    const fmt0 = fmt || (v => String(+v.toPrecision(4)));
    fmt = v => (v < 0 ? "−" : "") + fmt0(Math.abs(v));
    let xs = [], ys = [];
    for (let i = 0; i < X.length; i++) if (Number.isFinite(X[i]) && Number.isFinite(Y[i])) { xs.push(X[i]); ys.push(Y[i]); }
    let dropped = 0;
    const keep = f => { const nx = [], ny = []; xs.forEach((x, i) => { if (f(x, ys[i])) { nx.push(x); ny.push(ys[i]); } }); dropped = xs.length - nx.length; xs = nx; ys = ny; };
    if (type === "exponential") keep((x, y) => y > 0);
    if (type === "logarithmic") keep(x => x > 0);
    if (type === "power") keep((x, y) => x > 0 && y > 0);
    const deg = type.startsWith("poly") ? +type.slice(4) : 1;
    if (xs.length < Math.max(3, deg + 2)) return { error: `Hacen falta al menos ${Math.max(3, deg + 2)} parejas de datos válidas para este modelo.` };

    let predict, eq, coefs, r = NaN;
    const sgn = v => (v < 0 ? " − " : " + ") + fmt(Math.abs(v));
    if (type === "linear") {
      const L = linFit(xs, ys); if (!L) return { error: "Todos los valores de X son iguales." };
      predict = x => L.a + L.b * x; coefs = [L.a, L.b]; r = L.r;
      eq = `y = ${fmt(L.a)}${sgn(L.b)}·x`;
    } else if (type === "exponential") {
      const L = linFit(xs, ys.map(Math.log)); if (!L) return { error: "Todos los valores de X son iguales." };
      const a = Math.exp(L.a), b = L.b; predict = x => a * Math.exp(b * x); coefs = [a, b];
      eq = `y = ${fmt(a)}·e^(${fmt(b)}·x)`;
    } else if (type === "logarithmic") {
      const L = linFit(xs.map(Math.log), ys); if (!L) return { error: "Todos los valores de X son iguales." };
      predict = x => (x > 0 ? L.a + L.b * Math.log(x) : NaN); coefs = [L.a, L.b];
      eq = `y = ${fmt(L.a)}${sgn(L.b)}·ln(x)`;
    } else if (type === "power") {
      const L = linFit(xs.map(Math.log), ys.map(Math.log)); if (!L) return { error: "Todos los valores de X son iguales." };
      const a = Math.exp(L.a), b = L.b; predict = x => (x > 0 ? a * Math.pow(x, b) : NaN); coefs = [a, b];
      eq = `y = ${fmt(a)}·x^${fmt(b)}`;
    } else if (deg >= 2) {
      // escalamos X para que el sistema esté bien condicionado
      const mx = mean(xs), sx = sd(xs) || 1, u = xs.map(x => (x - mx) / sx);
      const A = [], bb = [];
      for (let i = 0; i <= deg; i++) {
        A.push([]); bb.push(sum(u.map((v, k) => ys[k] * v ** i)));
        for (let j = 0; j <= deg; j++) A[i].push(sum(u.map(v => v ** (i + j))));
      }
      const c = solve(A, bb); if (!c) return { error: "No se puede ajustar este modelo con estos datos." };
      // pasar a coeficientes en x
      const out = Array(deg + 1).fill(0);
      const binom = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; };
      for (let i = 0; i <= deg; i++) for (let k = 0; k <= i; k++) out[k] += c[i] * binom(i, k) * (1 / sx) ** i * (-mx) ** (i - k);
      coefs = out;
      predict = x => out.reduce((s, ck, k) => s + ck * x ** k, 0);
      eq = "y = " + out.map((ck, k) => ({ ck, k })).reverse().map(({ ck, k }, idx) => {
        const term = k === 0 ? "" : k === 1 ? "·x" : `·x${["", "", "²", "³", "⁴"][k]}`;
        return idx === 0 ? `${fmt(ck)}${term}` : `${sgn(ck)}${term}`;
      }).join("");
    } else return { error: "Modelo desconocido." };

    const my = mean(ys);
    let ssr = 0, sst = 0;
    ys.forEach((y, i) => { ssr += (y - predict(xs[i])) ** 2; sst += (y - my) ** 2; });
    const r2 = sst ? 1 - ssr / sst : NaN;
    return { type, name: MODELS[type], predict, eq, coefs, r, r2, n: xs.length, dropped, xmin: Math.min(...xs), xmax: Math.max(...xs) };
  }

  /* ---------- tablas de frecuencias ---------- */
  function niceStep(raw) {
    const p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }
  function frequency(values, bins) {
    const n = values.length;
    if (!n) return { rows: [], n: 0, grouped: false };
    const uniq = [...new Set(values)].sort((a, b) => a - b);
    const allInt = values.every(Number.isInteger);
    const discrete = !bins && (uniq.length <= 6 || (allInt && uniq.length <= 15));
    let rows = [];
    if (discrete) {
      rows = uniq.map(v => ({ label: v, value: v, mark: v, fi: values.filter(x => x === v).length }));
    } else {
      const mn = Math.min(...values), mx = Math.max(...values);
      const k = bins || Math.max(2, Math.ceil(1 + Math.log2(n))); // regla de Sturges
      let w, start;
      if (bins) { w = (mx - mn) / k || 1; start = mn; }
      else { w = niceStep((mx - mn) / k || 1); start = Math.floor(mn / w) * w; }
      const count = bins ? k : Math.max(1, Math.ceil((mx - start) / w + 1e-9));
      for (let i = 0; i < count; i++) {
        const a = start + i * w, b = a + w, last = i === count - 1;
        const fi = values.filter(x => x >= a - 1e-9 && (last ? x <= b + 1e-9 : x < b - 1e-9)).length;
        rows.push({ from: a, to: b, last, mark: (a + b) / 2, fi });
      }
    }
    let F = 0;
    rows.forEach(r => { F += r.fi; r.Fi = F; r.hi = r.fi / n; r.Hi = F / n; });
    return { rows, n, grouped: !discrete };
  }

  /* ---------- fórmulas de columnas ---------- */
  // Sintaxis: letras de columna (A, B, C…), números, + − * / ^ ( ), y funciones.
  // Las funciones de columna (suma, media…) con una sola letra devuelven el valor de toda la columna.
  const ROW_FN = {
    abs: "Math.abs", raiz: "Math.sqrt", sqrt: "Math.sqrt", ln: "Math.log", log: "Math.log10", exp: "Math.exp",
    redondear: "F.round", round: "F.round", pot: "Math.pow", pow: "Math.pow", min: "F.min", max: "F.max",
    si: "F.si", if: "F.si"
  };
  const COL_FN = {
    suma: "sum", sum: "sum", total: "sum", media: "mean", promedio: "mean", mean: "mean", avg: "mean",
    mediana: "median", median: "median", desv: "sd", sd: "sd", contar: "n", count: "n", min: "min", max: "max"
  };
  const F = {
    round: (x, d) => { const p = Math.pow(10, d || 0); return Math.round(x * p) / p; },
    min: (...a) => Math.min(...a), max: (...a) => Math.max(...a),
    si: (c, a, b) => (c ? a : b)
  };
  const letterIndex = s => [...s].reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0) - 1;
  const indexLetter = i => { let s = ""; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };

  function compileFormula(src, ncols) {
    const toks = [];
    const re = /\s*(?:(\d+(?:[.,]\d+)?(?![\d]))|([A-Za-zÁÉÍÓÚáéíóúñÑ_]+)|(<=|>=|<>|!=|==|[-+*/^(),;<>=]))/y;
    let pos = 0, m;
    const s = String(src).trim();
    while (pos < s.length) {
      re.lastIndex = pos; m = re.exec(s);
      if (!m) throw new Error(`No entiendo «${s.slice(pos).trim().slice(0, 8)}».`);
      pos = re.lastIndex;
      if (m[1]) toks.push({ t: "num", v: m[1].replace(",", ".") });
      else if (m[2]) toks.push({ t: "id", v: m[2] });
      else if (m[3]) toks.push({ t: "op", v: m[3] });
    }
    // una coma entre dígitos ya se ha leído como decimal; el resto de comas separa argumentos
    let i = 0;
    const deps = new Set();
    const peek = () => toks[i], next = () => toks[i++];
    const expect = v => { const t = next(); if (!t || t.v !== v) throw new Error(`Falta «${v}».`); };
    const colRef = name => {
      const idx = letterIndex(name);
      if (!/^[A-Z]{1,2}$/.test(name)) throw new Error(`«${name}» no es una columna ni una función conocida.`);
      if (idx >= ncols) throw new Error(`La columna ${name} no existe.`);
      deps.add(idx); return idx;
    };
    function primary() {
      const t = next();
      if (!t) throw new Error("La fórmula está incompleta.");
      if (t.t === "num") return t.v;
      if (t.t === "op" && t.v === "(") { const e = expr(); expect(")"); return `(${e})`; }
      if (t.t === "op" && (t.v === "-" || t.v === "+")) return `(${t.v}${unary()})`;
      if (t.t === "id") {
        const low = t.v.toLowerCase();
        if (peek() && peek().v === "(") {
          next();
          // función de columna con una sola letra: suma(A)
          if (COL_FN[low] && toks[i] && toks[i].t === "id" && /^[A-Z]{1,2}$/.test(toks[i].v) && toks[i + 1] && toks[i + 1].v === ")") {
            const idx = colRef(next().v); next();
            return `AG(${idx},"${COL_FN[low]}")`;
          }
          if (!ROW_FN[low]) throw new Error(`No conozco la función «${t.v}».`);
          const args = [];
          if (peek() && peek().v !== ")") {
            args.push(expr());
            while (peek() && (peek().v === ";" || peek().v === ",")) { next(); args.push(expr()); }
          }
          expect(")");
          return `${ROW_FN[low]}(${args.join(",")})`;
        }
        return `V[${colRef(t.v)}]`;
      }
      throw new Error(`Sobra «${t.v}».`);
    }
    function power() { let b = primary(); if (peek() && peek().v === "^") { next(); b = `Math.pow(${b},${unary()})`; } return b; }
    function unary() { if (peek() && (peek().v === "-" || peek().v === "+")) { const o = next().v; return `(${o}${unary()})`; } return power(); }
    function term() { let l = unary(); while (peek() && (peek().v === "*" || peek().v === "/")) { const o = next().v; l = `${l}${o}${unary()}`; } return l; }
    function arith() { let l = term(); while (peek() && (peek().v === "+" || peek().v === "-")) { const o = next().v; l = `${l}${o}${term()}`; } return l; }
    function expr() {
      let l = arith();
      const cmp = { "<": "<", ">": ">", "<=": "<=", ">=": ">=", "=": "===", "==": "===", "<>": "!==", "!=": "!==" };
      if (peek() && cmp[peek().v]) { const o = cmp[next().v]; l = `(${l}${o}${arith()}?1:0)`; }
      return l;
    }
    if (!toks.length) throw new Error("Escribe una fórmula.");
    const body = expr();
    if (i < toks.length) throw new Error(`Sobra «${toks[i].v}».`);
    // eslint-disable-next-line no-new-func
    const fn = new Function("V", "AG", "F", `"use strict";return (${body});`);
    return { deps: [...deps], run: (V, AG) => { const r = fn(V, AG, F); return typeof r === "number" && Number.isFinite(r) ? r : NaN; } };
  }

  // Calcula todas las columnas. cols: [{formula}], raw: matriz filas × columnas de textos.
  function computeTable(cols, raw) {
    const nR = raw.length, nC = cols.length;
    const out = Array(nC), errors = Array(nC).fill(null), state = Array(nC).fill(0), compiled = [];
    const aggCache = {};
    function agg(idx, kind) {
      const key = idx + kind;
      if (aggCache[key] !== undefined) return aggCache[key];
      const vals = column(idx).filter(Number.isFinite);
      const d = vals.length ? describe(vals) : null;
      const v = !d ? NaN : kind === "sum" ? d.sum : kind === "mean" ? d.mean : kind === "median" ? d.median : kind === "sd" ? d.sd : kind === "n" ? d.n : kind === "min" ? d.min : d.max;
      return (aggCache[key] = v);
    }
    function column(j) {
      if (state[j] === 2) return out[j];
      if (state[j] === 1) throw new Error("La fórmula depende de sí misma (referencia circular).");
      state[j] = 1;
      const f = cols[j].formula && String(cols[j].formula).trim();
      if (!f) out[j] = raw.map(r => parseNum(r[j]));
      else {
        try {
          const c = compiled[j] || (compiled[j] = compileFormula(f, nC));
          c.deps.forEach(d => column(d));
          out[j] = raw.map((_, r) => { const V = out.map((col, k) => (col ? col[r] : NaN)); return c.run(V, agg); });
        } catch (e) { errors[j] = e.message; out[j] = Array(nR).fill(NaN); }
      }
      state[j] = 2;
      return out[j];
    }
    for (let j = 0; j < nC; j++) {
      try { column(j); } catch (e) { errors[j] = e.message; out[j] = Array(nR).fill(NaN); state[j] = 2; }
    }
    return { values: out, errors };
  }

  const api = { parseNum, sum, mean, median, quantile, mode, variance, sd, describe, fit, MODELS, frequency, compileFormula, computeTable, letterIndex, indexLetter };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.GStats = api;
})(typeof self !== "undefined" ? self : this);
