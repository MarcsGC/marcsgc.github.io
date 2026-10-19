/* Gráficalo · motor de cálculo (sin dependencias). Funciona en el navegador y en Node para pruebas. */
(function (root) {
  "use strict";

  /* ---------- números ---------- */
  // Configuración regional: en español la coma es decimal; en inglés la coma separa miles.
  const CFG = { decimalComma: true };
  function setLocale(o) { Object.assign(CFG, o || {}); }
  function parseNum(s) {
    if (typeof s === "number") return Number.isFinite(s) ? s : NaN;
    if (s === null || s === undefined) return NaN;
    let t = String(s).trim().replace(/[\s\u00a0]/g, "").replace(/[€$%£]/g, "").replace(/\u2212/g, "-");
    if (!t) return NaN;
    if (t.includes(",") && t.includes(".")) {
      t = t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
    } else if (t.includes(",")) {
      if (!CFG.decimalComma && /^[-+]?\d{1,3}(,\d{3})+$/.test(t)) t = t.replace(/,/g, "");
      else if ((t.match(/,/g) || []).length > 1) t = t.replace(/,/g, "");
      else t = t.replace(",", ".");
    }
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
    si: "F.si", if: "F.si", ponderada: "F.wavg", wavg: "F.wavg"
  };
  const COL2_FN = { mediap: 1, wmean: 1 };
  const COL_FN = {
    suma: "sum", sum: "sum", total: "sum", media: "mean", promedio: "mean", mean: "mean", avg: "mean",
    mediana: "median", median: "median", desv: "sd", sd: "sd", contar: "n", count: "n", min: "min", max: "max"
  };
  const F = {
    round: (x, d) => { const p = Math.pow(10, d || 0); return Math.round(x * p) / p; },
    min: (...a) => Math.min(...a), max: (...a) => Math.max(...a),
    si: (c, a, b) => (c ? a : b),
    wavg: (...a) => { let sv = 0, sw = 0; for (let i = 0; i + 1 < a.length; i += 2) { if (Number.isFinite(a[i]) && Number.isFinite(a[i + 1])) { sv += a[i] * a[i + 1]; sw += a[i + 1]; } } return sw ? sv / sw : NaN; }
  };
  const letterIndex = s => [...s].reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0) - 1;
  const indexLetter = i => { let s = ""; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };

  function compileFormula(src, ncols) {
    const toks = [];
    const re = CFG.decimalComma
      ? /\s*(?:(\d+(?:[.,]\d+)?(?![\d]))|([A-Za-zÁÉÍÓÚáéíóúñÑ_]+)|(<=|>=|<>|!=|==|[-+*/^(),;<>=]))/y
      : /\s*(?:(\d+(?:\.\d+)?(?![\d]))|([A-Za-zÁÉÍÓÚáéíóúñÑ_]+)|(<=|>=|<>|!=|==|[-+*/^(),;<>=]))/y;
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
          // media ponderada de una columna con los pesos de otra: mediap(A; B)
          if (COL2_FN[low] && toks[i] && /^[A-Z]{1,2}$/.test(toks[i].v) && toks[i + 1] && (toks[i + 1].v === ";" || toks[i + 1].v === ",") && toks[i + 2] && /^[A-Z]{1,2}$/.test(toks[i + 2].v) && toks[i + 3] && toks[i + 3].v === ")") {
            const a = colRef(next().v); next(); const b = colRef(next().v); next();
            return `AG2(${a},${b})`;
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
    const fn = new Function("V", "AG", "F", "AG2", `"use strict";return (${body});`);
    return { deps: [...deps], run: (V, AG, AG2) => { const r = fn(V, AG, F, AG2); return typeof r === "number" && Number.isFinite(r) ? r : NaN; } };
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
    function agg2(a, b) {
      const key = a + "w" + b; if (aggCache[key] !== undefined) return aggCache[key];
      const A = column(a), B = column(b); let sv = 0, sw = 0;
      A.forEach((v, r) => { if (Number.isFinite(v) && Number.isFinite(B[r])) { sv += v * B[r]; sw += B[r]; } });
      return (aggCache[key] = sw ? sv / sw : NaN);
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
          out[j] = raw.map((_, r) => { const V = out.map((col, k) => (col ? col[r] : NaN)); return c.run(V, agg, agg2); });
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


  /* ---------- funciones especiales ---------- */
  function logGamma(x) { // Lanczos (g = 7, n = 9)
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
      12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - logGamma(1 - x);
    x -= 1; let a = c[0]; const t = x + 7.5;
    for (let i = 1; i < 9; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  function gammaP(a, x) { // gamma incompleta regularizada inferior
    if (x <= 0) return 0;
    if (x < a + 1) {
      let ap = a, sumv = 1 / a, del = sumv;
      for (let n = 0; n < 1000; n++) { ap++; del *= x / ap; sumv += del; if (Math.abs(del) < Math.abs(sumv) * 1e-15) break; }
      return sumv * Math.exp(-x + a * Math.log(x) - logGamma(a));
    }
    let b = x + 1 - a, c = 1 / 1e-300, d = 1 / b, h = d;
    for (let i = 1; i < 1000; i++) {
      const an = -i * (i - a); b += 2;
      d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-15) break;
    }
    return 1 - Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
  }
  function betacf(a, b, x) {
    const qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1, d = 1 - (qab * x) / qap; if (Math.abs(d) < 1e-300) d = 1e-300; d = 1 / d; let h = d;
    for (let m = 1; m <= 1000; m++) {
      const m2 = 2 * m;
      let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; h *= d * c;
      aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d;
      const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-15) break;
    }
    return h;
  }
  function betaI(a, b, x) { // beta incompleta regularizada
    if (x <= 0) return 0; if (x >= 1) return 1;
    const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
  }

  /* ---------- distribuciones ---------- */
  const normCdf = (x, mu = 0, sigma = 1) => {
    const z = (x - mu) / sigma; if (!Number.isFinite(z)) return z > 0 ? 1 : 0;
    const p = gammaP(0.5, (z * z) / 2) / 2; return z >= 0 ? 0.5 + p : 0.5 - p;
  };
  const normPdf = (x, mu = 0, sigma = 1) => Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
  function normInv(p, mu = 0, sigma = 1) { // Acklam + un paso de Newton
    if (p <= 0) return -Infinity; if (p >= 1) return Infinity;
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    const pl = 0.02425; let q, r, x;
    if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else if (p <= 1 - pl) { q = p - 0.5; r = q * q; x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
    else { q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    for (let i = 0; i < 2; i++) { const e = normCdf(x) - p; x -= e / normPdf(x); }
    return mu + sigma * x;
  }
  function tCdf(t, df) {
    if (!Number.isFinite(t)) return t > 0 ? 1 : 0;
    const x = df / (df + t * t), tail = betaI(df / 2, 0.5, x) / 2;
    return t > 0 ? 1 - tail : tail;
  }
  function tInv(p, df) {
    let lo = -1e3, hi = 1e3;
    for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (tCdf(mid, df) < p) lo = mid; else hi = mid; if (hi - lo < 1e-12) break; }
    return (lo + hi) / 2;
  }
  const chi2Cdf = (x, k) => (x <= 0 ? 0 : gammaP(k / 2, x / 2));
  const fCdf = (x, d1, d2) => (x <= 0 ? 0 : betaI(d1 / 2, d2 / 2, (d1 * x) / (d1 * x + d2)));
  function binomPmf(k, n, p) {
    if (k < 0 || k > n || !Number.isInteger(k)) return 0;
    if (p === 0) return k === 0 ? 1 : 0; if (p === 1) return k === n ? 1 : 0;
    return Math.exp(logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1) + k * Math.log(p) + (n - k) * Math.log(1 - p));
  }
  function binomCdf(k, n, p) { if (k < 0) return 0; if (k >= n) return 1; let s = 0; for (let i = 0; i <= Math.floor(k); i++) s += binomPmf(i, n, p); return Math.min(1, s); }

  /* ---------- contrastes de hipótesis ---------- */
  function pFromT(t, df, alt) { // alt: "two" | "greater" | "less"
    if (alt === "greater") return 1 - tCdf(t, df);
    if (alt === "less") return tCdf(t, df);
    return Math.min(1, 2 * (1 - tCdf(Math.abs(t), df)));
  }
  function tTestOne(xs, mu0, alt = "two", conf = 0.95) {
    const n = xs.length; if (n < 2) return { error: "n" };
    const m = mean(xs), s = sd(xs), se = s / Math.sqrt(n), df = n - 1;
    if (!se) return { error: "sd0" };
    const t = (m - mu0) / se, q = tInv(1 - (1 - conf) / 2, df);
    return { n, mean: m, sd: s, se, df, t, p: pFromT(t, df, alt), ci: [m - q * se, m + q * se], d: (m - mu0) / s };
  }
  function tTestWelch(a, b, alt = "two", conf = 0.95) {
    const n1 = a.length, n2 = b.length; if (n1 < 2 || n2 < 2) return { error: "n" };
    const m1 = mean(a), m2 = mean(b), v1 = variance(a), v2 = variance(b);
    const se = Math.sqrt(v1 / n1 + v2 / n2); if (!se) return { error: "sd0" };
    const df = (v1 / n1 + v2 / n2) ** 2 / ((v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1));
    const t = (m1 - m2) / se, q = tInv(1 - (1 - conf) / 2, df), diff = m1 - m2;
    const sp = Math.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2));
    return { n1, n2, m1, m2, sd1: Math.sqrt(v1), sd2: Math.sqrt(v2), diff, se, df, t, p: pFromT(t, df, alt), ci: [diff - q * se, diff + q * se], d: sp ? diff / sp : NaN };
  }
  function tTestPaired(a, b, alt = "two", conf = 0.95) {
    const dif = []; for (let i = 0; i < Math.min(a.length, b.length); i++) if (Number.isFinite(a[i]) && Number.isFinite(b[i])) dif.push(a[i] - b[i]);
    const r = tTestOne(dif, 0, alt, conf); if (r.error) return r;
    return Object.assign(r, { diff: r.mean, pairs: dif.length });
  }
  function anova(groups) { // groups: [[...], ...]
    const g = groups.filter(x => x.length); const k = g.length, all = [].concat(...g), N = all.length;
    if (k < 2 || N - k < 1) return { error: "n" };
    const gm = mean(all); let ssb = 0, ssw = 0;
    g.forEach(x => { const m = mean(x); ssb += x.length * (m - gm) ** 2; x.forEach(v => (ssw += (v - m) ** 2)); });
    const df1 = k - 1, df2 = N - k; if (!ssw) return { error: "sd0" };
    const F = ssb / df1 / (ssw / df2);
    return { k, N, df1, df2, ssb, ssw, F, p: 1 - fCdf(F, df1, df2), eta2: ssb / (ssb + ssw), means: g.map(mean), ns: g.map(x => x.length), sds: g.map(sd) };
  }
  function corrTest(r, n) {
    if (n < 3 || !Number.isFinite(r)) return { error: "n" };
    const df = n - 2; if (Math.abs(r) >= 1) return { t: Infinity, df, p: 0 };
    const t = (r * Math.sqrt(df)) / Math.sqrt(1 - r * r); return { t, df, p: pFromT(t, df, "two") };
  }

  /* ---------- categorías y tablas cruzadas ---------- */
  const keyCmp = (a, b) => { const x = parseNum(a), y = parseNum(b); if (Number.isFinite(x) && Number.isFinite(y)) return x - y; return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" }); };
  function countCategories(vals) {
    const m = new Map(); vals.forEach(v => { const k = String(v ?? "").trim(); if (k === "") return; m.set(k, (m.get(k) || 0) + 1); });
    return [...m].map(([key, n]) => ({ key, n })).sort((a, b) => keyCmp(a.key, b.key));
  }
  function crosstab(rv, cv) {
    const pairs = []; for (let i = 0; i < rv.length; i++) { const a = String(rv[i] ?? "").trim(), b = String(cv[i] ?? "").trim(); if (a !== "" && b !== "") pairs.push([a, b]); }
    const rk = [...new Set(pairs.map(p => p[0]))].sort(keyCmp), ck = [...new Set(pairs.map(p => p[1]))].sort(keyCmp);
    const counts = rk.map(() => ck.map(() => 0));
    pairs.forEach(([a, b]) => counts[rk.indexOf(a)][ck.indexOf(b)]++);
    return { rowKeys: rk, colKeys: ck, counts, n: pairs.length };
  }
  function chi2Independence(counts) {
    const R = counts.length, C = counts[0] ? counts[0].length : 0;
    if (R < 2 || C < 2) return { error: "dims" };
    const rs = counts.map(r => sum(r)), cs = counts[0].map((_, j) => sum(counts.map(r => r[j]))), N = sum(rs);
    if (!N) return { error: "n" };
    let chi2 = 0, low = 0; const expected = counts.map((r, i) => r.map((_, j) => (rs[i] * cs[j]) / N));
    counts.forEach((r, i) => r.forEach((o, j) => { const e = expected[i][j]; if (e > 0) chi2 += (o - e) ** 2 / e; if (e < 5) low++; }));
    const df = (R - 1) * (C - 1);
    return { chi2, df, p: 1 - chi2Cdf(chi2, df), expected, N, cramerV: Math.sqrt(chi2 / (N * (Math.min(R, C) - 1))), lowExpected: low / (R * C), minExpected: Math.min(...[].concat(...expected)) };
  }

  const api = { setLocale, parseNum, logGamma, gammaP, betaI, normCdf, normPdf, normInv, tCdf, tInv, chi2Cdf, fCdf, binomPmf, binomCdf, pFromT, tTestOne, tTestWelch, tTestPaired, anova, corrTest, countCategories, crosstab, chi2Independence, keyCmp, sum, mean, median, quantile, mode, variance, sd, describe, fit, MODELS, frequency, compileFormula, computeTable, letterIndex, indexLetter };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.GStats = api;
})(typeof self !== "undefined" ? self : this);
