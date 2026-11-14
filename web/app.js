
let CFG = null, ORDER = [], WMAP = {};
const SLUG = { "Низ A": "lowA", "Верх A": "upA", "Низ B": "lowB", "Верх B": "upB" };
const S = {
  db: null, canWrite: true, connected: false,
  sessions: new Map(), daily: new Map(), measures: new Map(), cardio: [],
  cur: null, dirty: false, saving: false, pending: false, saveTimer: null,
  view: "train", logDate: null, measDate: null, delArm: null,
};
const $ = (sel, root = document) => root.querySelector(sel);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => iso(new Date());
const toDate = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const dShort = s => { const d = toDate(s); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`; };
const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return iso(d); };
const weekStart = s => { const d = toDate(s); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return iso(d); };
const num = v => { if (v === "" || v == null) return null; const n = Number(String(v).replace(",", ".")); return Number.isFinite(n) ? n : null; };
const fmt = (n, d = 1) => n == null || !Number.isFinite(n) ? "—" : (Math.round(n * 10 ** d) / 10 ** d).toLocaleString("ru-RU", { maximumFractionDigits: d });
const fmtW = n => n == null ? "" : String(Math.round(n * 100) / 100).replace(".", ",");
const mmss = s => `${Math.floor(s / 60)}:${pad(Math.max(0, Math.floor(s % 60)))}`;
const avg = a => { const v = a.filter(x => x != null); return v.length ? v.reduce((p, c) => p + c, 0) / v.length : null; };

function setStatus(text, cls = "") { const el = $("#status"); el.textContent = text; el.className = "status " + cls; }
function notice(text) { const el = $("#notice"); el.hidden = !text; el.textContent = text || ""; }

/* ---------- body weight & e1RM ---------- */
function bodyWeightOn(date) {
  let best = null, bestD = "";
  for (const [d, v] of S.daily) if (d <= date && v.weight != null && d > bestD) { best = v.weight; bestD = d; }
  return best ?? CFG.startWeight;
}
function e1(ex, s, bw) {
  if (!s || s.r == null) return null;
  const rir = s.rir ?? 0, r = s.cl ? Math.min(s.r, s.cl) : s.r; // кластер: считаем по мини-подходу
  if (r + rir > 12) return null;
  if (ex.kind === "mainbw") return (bw + (s.w ?? 0)) * (1 + (r + rir) / 30);
  if (s.w == null) return null;
  return s.w * (1 + (r + rir) / 30);
}
function bestE1(ex, sets, date) {
  const bw = bodyWeightOn(date);
  let b = null;
  for (const s of sets || []) { const v = e1(ex, s, bw); if (v != null && (b == null || v > b)) b = v; }
  return b;
}
const sessionList = () => [...S.sessions.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
const filled = s => s && (s.r != null || s.w != null);
const short = n => String(n).replace(/\s*\(.*\)/, "");
const namesOf = ex => [ex.name].concat(ex.aliases || []);
function setsIn(s, ex) {
  for (const n of namesOf(ex)) { const a = (s.sets?.[n] || []).filter(x => x && x.r != null); if (a.length) return a; }
  return null;
}
const isRef = s => s.mode !== "deload" && s.phase !== "test"; // разгрузка и тест не влияют на расчёт весов
function exByName(name) { for (const w of CFG.workouts) for (const e of w.exercises) if (e.name === name) return e; return null; }

/* ---------- suggestion (double progression) ---------- */
function lastFor(type, ex, beforeDate) {
  for (const s of sessionList()) {
    if (s.date >= beforeDate || (type && s.type !== type) || !isRef(s)) continue;
    const sets = setsIn(s, ex);
    if (sets) return { date: s.date, sets, mode: s.mode || "normal", phase: s.phase || null };
  }
  return null;
}
function suggest(ex, type, date) {
  const last = lastFor(type, ex, date);
  if (ex.kind === "emom") {
    const R = ex.rounds || 10, P = ex.perRound || 8;
    if (!last) return { text: `Цель: ${R} раундов по ${P} повторов` };
    const tot = last.sets[0].r;
    return { prev: last, text: `Цель: ${tot >= R * 12 ? "+5 кг и снова " + R * P : (tot + R) + " повторов (+1 в раунде)"}` };
  }
  if (!last) {
    if (ex.noWeight) return { text: ex.sec ? `Цель: ${ex.lo}–${ex.hi} с` : `Цель: ${ex.lo}–${ex.hi} повторов` };
    if (ex.start != null) return { w: ex.start, text: "Стартовый вес" };
    return { text: `Подбери вес на ${ex.lo}–${ex.hi}${ex.sec ? " с" : ""} с запасом ${ex.rirMin ?? 2}` };
  }
  const reps = last.sets.map(s => s.r);
  const allTop = last.sets.length >= ex.sets && reps.every(r => r >= ex.hi);
  const lowCount = reps.filter(r => r < ex.lo).length;
  if (ex.noWeight) {
    return { prev: last, text: allTop ? "Все подходы до верха: усложни вариант" : `Добавь повтор: цель ${ex.hi}${ex.sec ? " с" : ""} в каждом подходе` };
  }
  const ws = last.sets.map(s => s.w).filter(w => w != null);
  const top = ws.length ? Math.max(...ws) : null;
  if (top == null) return { prev: last, text: "Вес в прошлый раз не записан" };
  const inc = stepFor(ex);
  if (allTop) return { prev: last, w: top + inc, text: `Все подходы до ${ex.hi}: +${fmtW(inc)} кг` };
  if (lowCount >= 2) return { prev: last, w: top, text: `Держи вес и добирай повторы до ${ex.lo}+` };
  return { prev: last, w: top, text: `Тот же вес, цель ${ex.hi} в каждом подходе` };
}

/* ---------- 16-week block, modes, deload weeks ---------- */
const MODES = [["normal", "Обычная"], ["light", "Лёгкая"], ["deload", "Разгрузка"]];
const MODE_NAME = { normal: "обычная", light: "лёгкая", deload: "разгрузка" };
const MODE_TXT = {
  normal: "",
  light: "Топ-сет с запасом 3, в каждом упражнении на подход меньше. Когда плохо спал, устал или мало времени.",
  deload: "Половина подходов, вес на 10 % ниже, запас 3–4. При накопленной усталости, после болезни или когда ноют суставы.",
};
const RTS1 = [1, .955, .922, .892, .863]; // одиночка с запасом 0…4 — доля от максимума
const NB = "\u00A0";
const rnd = (x, st) => Math.round(x / st) * st;
const rndDown = (x, st) => Math.floor(x / st + 1e-6) * st;
const wAt = (e, reps, rir) => e / (1 + (reps + rir) / 30);
const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / 86400000);
const profile = () => Store.get("profile", "me") || {};
function saveProfile(patch) { Store.write("profile", "me", { ...profile(), ...patch }, false); }
const PH_FALLBACK = { acc6: "acc" };
const phCfg = (sc, key) => !sc || !key ? null : key in sc ? sc[key] : PH_FALLBACK[key] ? sc[PH_FALLBACK[key]] : null;
function phaseInfo(week) { return CFG.block.phases.find(p => week >= p.from && week <= p.to) || { name: "", note: "" }; }

function blockInfo(date) {
  const B = CFG.block; if (!B) return null;
  const P = profile(), start = P.blockStart || B.start, L = B.length || 16;
  const marks = new Set(P.deloadWeeks || []);
  if (date < start) return { pre: true, start, week: 1, block: 1, phase: B.weekPhase[0], spanStart: start, spanEnd: addDays(start, 6), planned: false, optional: false, marked: false, extra: false, deload: false };
  const span = Math.floor(daysBetween(start, date) / 7);
  const used = new Set();
  for (const s of S.sessions.values()) if (s.date >= start && s.date < addDays(start, 7 * span)) used.add(Math.floor(daysBetween(start, s.date) / 7));
  let n = 0;
  for (let k = 0; k < span; k++) {
    const wk = n % L + 1;
    if (B.plannedDeload.includes(wk) || B.optionalDeload.includes(wk)) { n++; continue; } // разгрузка засчитывается, даже если просто отдыхал
    if (marks.has(addDays(start, 7 * k)) || !used.has(k)) continue; // внеплановая разгрузка или неделя без тренировок — пауза
    n++;
  }
  const wk = n % L + 1, ss = addDays(start, 7 * span);
  const planned = B.plannedDeload.includes(wk), optional = B.optionalDeload.includes(wk), marked = marks.has(ss);
  return { pre: false, start, week: wk, block: Math.floor(n / L) + 1, phase: B.weekPhase[wk - 1], spanStart: ss, spanEnd: addDays(ss, 6), planned, optional, marked, extra: marked && !planned && !optional, deload: planned || marked };
}
function curMode(bi) { return S.cur.mode || (!S.cur.exists && bi?.deload ? "deload" : "normal"); }

/* шаг веса: штанга и пояс — по настройке блинов, остальное — шаг упражнения */
function stepFor(ex) {
  const pl = CFG.plates;
  if (pl && (ex.scheme || ex.bar)) return profile().smallPlates ? pl.small : pl.bar;
  if (ex.scheme) return CFG.schemes[ex.scheme].step || ex.inc || 2.5;
  return ex.inc || 2.5;
}
const repsAt = (e, tot, rir) => 30 * (e / tot - 1) - rir; // сколько повторов «свежими» при запасе rir
/* тестовые одиночки: ~93 % → ~97 % → попытка (+1 шаг, если не выше ~104 % расчётного максимума) */
function testLadder(e, bw, st, w1 = null, rir1 = null) {
  const fl = x => Math.max(0, Math.floor((x - bw) / st + 1e-6) * st);
  if (w1 != null) e = (w1 + bw) / RTS1[Math.round(rir1)];
  const t1 = w1 ?? fl(e * .93);
  let t2 = fl(e * .97); if (t2 <= t1) t2 = null;
  let t3 = (t2 ?? t1) + st; if (t3 + bw > e * 1.04) t3 = null;
  return [t1, t2, t3];
}
const topRange = r => [Math.max(1, r - 1), r + (r >= 5 ? 3 : r >= 3 ? 2 : 1)];
/* вес из доступных (шаг st) и повторы для нужного запаса: ближе к целевым повторам, внутри диапазона */
function pickLoad({ e, bw, st, reps, lo, hi, rir, bonus = 0, prefer = "load", maxW = Infinity }) {
  const ideal = e / (1 + (reps + rir - bonus) / 30) - bw, base = Math.round(ideal / st) * st;
  let best = null;
  for (let k = -2; k <= 2; k++) {
    const w = base + k * st;
    if (w < 0 || w > maxW + 1e-6) continue;
    const x = repsAt(e, w + bw, rir) + bonus;
    let n, d;
    if (reps <= 2) { n = reps; d = Math.abs(x - reps) + (x < reps - 1.25 ? 10 : 0); } // 1–2 повтора: повторы те же, запас плавает
    else {
      n = Math.abs(x - reps) <= .75 ? reps : Math.max(1, Math.round(x)); // запас оценивается примерно, ±0,75 повтора не важны
      d = n < lo ? 10 + lo - n : n > hi ? 10 + n - hi : Math.abs(n - reps);
    }
    if (!best || d < best.d || (d === best.d && (prefer === "reps" ? w < best.w : w > best.w))) best = { w, n, d };
  }
  if (!best) { const w = Math.max(0, Math.floor(Math.min(maxW, ideal) / st) * st); best = { w, n: Math.max(1, Math.round(repsAt(e, w + bw, rir) + bonus)) }; }
  return best;
}
/* бэк-офф: самый тяжёлый вес не выше плана, на котором после топ-сета выйдут нужные повторы (запас +1 на усталость) */
function pickBo(e, bw, st, topW, bo) {
  const ideal = (topW + bw) * (1 - bo.drop) - bw;
  let w = Math.min(topW, Math.ceil(ideal / st - 1e-6) * st);
  for (let k = 0; k < 4 && w >= 0; k++, w -= st) {
    const n = Math.floor(repsAt(e, w + bw, bo.rir + 1) + 1e-6);
    if (n >= bo.lo) return { w, n: Math.min(n, bo.hi) };
  }
  return { w: Math.max(0, Math.min(topW, Math.round(ideal / st) * st)), n: bo.lo };
}

/* план основного упражнения на сегодня: топ-сет + бэк-оффы / одиночки / прямые подходы / тест */
function planScheme(ex, ctx) {
  const sc = CFG.schemes[ex.scheme], ph = phCfg(sc, ctx.phase);
  if (!ph) return null;
  const st = stepFor(ex), bwx = ex.kind === "mainbw", bw = bwx ? bodyWeightOn(ctx.date) : 0;
  const mode = ctx.mode, light = mode === "light" ? 1 : 0;
  const near = x => Math.max(0, Math.round(x / st) * st);
  const deloadW = w => {
    if (w == null) return null;
    const d = Math.max(0, Math.floor(((w + bw) * .9 - bw) / st + 1e-6) * st);
    if ((w - d) / (w + bw) <= .15) return d;
    return (st / (w + bw) <= .15 && w - st >= 0) ? w - st : w; // слишком крупный шаг — тот же вес, меньше подходов
  };
  const last = lastFor(null, ex, ctx.date);
  const e = last ? bestE1(ex, last.sets, last.date) : null;
  const lastTop = last ? Math.max(0, ...last.sets.map(s => s.w ?? 0)) : null;
  const prefer = ctx.phase === "acc" || ctx.phase === "acc6" ? "reps" : "load";
  const capW = same => {
    if (lastTop == null) return Infinity;
    const c = bwx ? Math.max((lastTop + bw) * 1.2 - bw, lastTop + st) : Math.max(lastTop * 1.2, lastTop + st); // защита от опечаток в истории
    return same ? Math.min(c, lastTop + 2 * st) : c;
  };
  const src = same => `Расчёт от ${dShort(last.date)}: максимум ≈${fmt(e)} кг${bwx ? " с весом тела" : ""}${same ? ", план чуть сильнее прошлого раза" : ""}`;
  const base = { st, bw, e, prev: last, note: ph.note || "" };
  const rows = [];

  if (ph.straight) {
    const p = ph.straight; let n = p.n, rir = p.rir + light, w = null, info = "";
    if (p.pct != null && sc.ref) {
      const rx = exByName(sc.ref), rl = rx && lastFor(null, rx, ctx.date), re = rl && bestE1(rx, rl.sets, rl.date);
      const pct = p.pct - .05 * light;
      if (re) { w = near(re * pct - bw); info = `≈${Math.round(pct * 100)} % от максимума в упражнении «${short(sc.ref)}» (≈${fmt(re)} кг)`; }
      else if (ex.start != null) { w = ex.start; info = "Стартовый вес"; }
    } else if (e) {
      const same = mode === "normal" && last.mode === "normal" && phCfg(sc, last.phase)?.straight?.reps === p.reps;
      w = pickLoad({ e, bw, st, reps: Math.floor((p.lo + p.hi) / 2), lo: p.lo, hi: p.hi, rir, bonus: same ? 1 : 0, prefer, maxW: capW(same) }).w;
      info = src(same);
    } else if (ex.start != null) { w = ex.start; info = "Стартовый вес"; }
    if (light) n = Math.max(1, n - 1);
    if (mode === "deload") { n = Math.max(1, Math.ceil(n / 2)); w = deloadW(w); rir = 4; }
    for (let j = 0; j < n; j++) rows.push({ k: String(j + 1), role: "straight", reps: p.reps, rir, w, rest: sc.rest || ex.restSec });
    return { ...base, rows, info };
  }

  if (ph.amrap && mode !== "deload") {
    const start = profile().blockStart || CFG.block.start; let w = null;
    for (const s of sessionList().slice().reverse()) {
      if (s.date < start || s.date >= ctx.date || !isRef(s)) continue;
      const a = setsIn(s, ex); if (a && a[0].w != null) { w = a[0].w; break; }
    }
    if (w == null) w = ph.amrap.w ?? ex.start ?? null;
    rows.push({ k: "Т1", role: "amrap", reps: "макс.", rir: 0, w, rest: sc.rest || 180 });
    return { ...base, rows, info: "Сравни с началом блока: тот же вес, больше повторов — значит сильнее." };
  }

  if (ph.test && mode !== "deload") {
    const RIRS = [2, 1, 0], L = e ? testLadder(e, bw, st) : [ex.start ?? null, null, null];
    for (let j = 0; j < (light ? 1 : 3); j++) {
      if (j === 2 && e && L[2] == null) break; // шаг слишком крупный — попытки сверху нет
      rows.push({ k: "Т" + (j + 1), role: "test", reps: "1", rir: RIRS[j], w: L[j], rest: 300, opt: j === 2 });
    }
    return { ...base, rows, info: e ? `Максимум по последним тренировкам ≈${fmt(e)} кг${bwx ? " с весом тела" : ""}. Т2 и Т3 пересчитаются по тому, как прошла Т1.` : "" };
  }

  const [tR, tRir0] = ph.top || [3, 2];
  const tRir = tRir0 + light, [lo, hi] = topRange(tR);
  let topW = null, topN = tR, info = "";
  if (e) {
    const same = mode === "normal" && last.mode === "normal" && phCfg(sc, last.phase)?.top?.[0] === tR;
    const pk = pickLoad({ e, bw, st, reps: tR, lo, hi, rir: tRir, bonus: same ? 1 : 0, prefer, maxW: capW(same) });
    topW = pk.w; topN = pk.n; info = src(same);
  } else if (ex.start != null) { topW = ex.start; info = "Стартовый вес"; }

  if (mode === "deload") {
    const n = Math.min(3, Math.max(1, Math.ceil((1 + (ph.bo?.n || 0) + (ph.singles?.n || 0)) / 2)));
    const w = deloadW(topW);
    for (let j = 0; j < n; j++) rows.push({ k: "Р" + (j + 1), role: "deload", reps: String(topN), rir: 4, w, rest: sc.restBo || sc.restTop });
    return { ...base, rows, info };
  }
  rows.push({ k: "ТС", role: "top", reps: String(topN), rir: tRir, w: topW, rest: sc.restTop });
  const bo = ph.bo, sg = ph.singles;
  if (bo) for (let j = 0; j < Math.max(0, bo.n - light); j++) rows.push({ k: "Б" + (j + 1), role: "bo", reps: bo.reps, rir: bo.rir + light, drop: bo.drop, cfg: light ? { ...bo, rir: bo.rir + 1 } : bo, w: null, rest: sc.restBo, cluster: bo.cluster || null, intra: bo.intra || null });
  if (sg) for (let j = 0; j < Math.max(0, sg.n - light); j++) rows.push({ k: "О" + (j + 1), role: "single", reps: "1", rir: 3, drop: sg.drop, w: null, rest: sg.rest });
  return { ...base, rows, info };
}

/* план подсобного упражнения (и всех упражнений программы без блока) */
function planAcc(ex, ctx) {
  const em = ex.kind === "emom", R = ex.rounds || 10, P = ex.perRound || 8;
  let n = em ? 1 : ex.sets, hidden = false, rir = ex.rirMin, rirTxt = ex.rir, factor = 1;
  if (ctx.blk) {
    const ph = ctx.phase;
    if (ph === "test" && !ex.keepTest) hidden = true;
    if (ph === "taper") { if (ex.taper === "skip") hidden = true; else if (!em) n = Math.ceil(n / 2); }
    if ((ph === "peak13" || ph === "peak14") && !em) n = Math.max(1, n - 1);
    if (ctx.mode === "light" && !em) n = Math.max(1, n - 1);
    if (ctx.mode === "deload") { if (!em) n = Math.max(1, Math.ceil(n / 2)); factor = .9; rir = Math.max(3, rir ?? 3); rirTxt = "3–4"; }
  }
  const sg = suggest(ex, ctx.type, ctx.date);
  let w = sg.w ?? null;
  if (w != null && factor !== 1) { const d = rndDown(w * factor, stepFor(ex)); if (w > 0 && (w - d) / w <= .15) w = d; }
  const reps = em ? String(ctx.mode === "deload" && ctx.blk ? Math.round(R * P / 2) : R * P) : ex.lo != null ? `${ex.lo}–${ex.hi}` : "";
  const rows = [...Array(n)].map((_, s) => ({ k: String(s + 1), role: "set", reps, rir, w, rest: ex.restSec }));
  const dl = ctx.blk && ctx.mode === "deload";
  const txt = !dl ? sg.text : em ? `Разгрузка: ${reps} повторов за ${R} мин` : ex.noWeight ? "Разгрузка: половина подходов, запас 3–4" : "Разгрузка: вес ниже, половина подходов, запас 3–4";
  const sugg = `${w != null ? `Сегодня: <b>${fmtW(w)}${NB}кг</b> · ` : ""}${esc(txt)}`;
  return { rows, sugg, info: "", prev: sg.prev || null, hidden, rirTxt };
}

function planFor(ex, i, ctx, cur) {
  const stored = cur.sets[ex.name] || [];
  const nStored = stored.reduce((m, x, k) => (x && (filled(x) || x.done) ? k + 1 : m), 0);
  const scheme = !!(ctx.blk && ex.scheme);
  let p = scheme ? planScheme(ex, ctx) : planAcc(ex, ctx);
  if (!p) p = { rows: [], hidden: true, sugg: "", info: "" };
  if (p.hidden && nStored) p.hidden = false; // уже записанное не прячем
  while (p.rows.length < nStored) p.rows.push({ k: String(p.rows.length + 1), role: "extra", reps: "", rir: null, w: null, rest: ex.restSec || 120 });
  const it = { ex, i, ...p, counted: !p.hidden && !ex.optional };
  recalcDeps(it, stored);
  if (scheme) it.sugg = suggFor(it);
  return it;
}
/* бэк-оффы и одиночки — от сегодняшнего топ-сета, тестовые одиночки — от первой */
function recalcDeps(it, arr) {
  const r0 = it.rows[0]; if (!r0) return;
  const bw = it.bw || 0, st = it.st || 2.5;
  const near = x => Math.max(0, Math.round(x / st) * st);
  if (r0.role === "top") {
    const t = arr[0] || {}, topW = t.w ?? r0.w, rir = t.rir ?? r0.rir;
    let e = it.e;
    if (t.w != null && t.r != null && t.r + rir <= 12) e = (t.w + bw) * (1 + (t.r + rir) / 30); // как прошёл топ-сет сегодня
    it.rows.forEach(r => {
      if (r.drop == null) return;
      if (topW == null) { r.w = null; return; }
      if (r.role === "single" || r.cluster || e == null) { r.w = Math.min(topW, near((topW + bw) * (1 - r.drop) - bw)); return; }
      const pk = pickBo(e, bw, st, topW, r.cfg);
      r.w = pk.w; r.reps = String(pk.n);
    });
  }
  if (r0.role === "test") {
    const w1 = arr[0]?.w, rir1 = arr[0]?.rir;
    if (w1 == null || rir1 == null || rir1 < 0 || rir1 > 4) return;
    const L = testLadder(null, bw, st, w1, rir1);
    it.rows.forEach((r, s) => { if (s > 0 && r.role === "test") r.w = L[s]; });
  }
}
function suggFor(it) {
  const rs = it.rows.filter(r => r.role !== "extra"), r0 = rs[0];
  if (!r0) return "";
  const W = w => w != null ? `<b>${fmtW(w)}${NB}кг</b>` : "—";
  const same = rs.filter(r => r.role === r0.role).length;
  if (r0.role === "top") {
    const d = rs.find(r => r.drop != null);
    const dn = d ? (d.role === "single" ? "одиночки" : d.cluster ? "кластеры" : "бэк-оффы") : "";
    return `ТС ${W(r0.w)} × ${esc(r0.reps)} с запасом ${r0.rir}` + (d ? ` · ${dn} ${d.w != null && d.w === r0.w ? "с тем же весом" : W(d.w)}${d.role === "bo" && !d.cluster ? ` × ${esc(d.reps)}` : ""}` : "");
  }
  if (r0.role === "deload") return `Разгрузка: ${same} × ${esc(r0.reps)} по ${W(r0.w)} с запасом 4`;
  if (r0.role === "straight") return `${same} × ${esc(r0.reps)} по ${W(r0.w)} с запасом ${r0.rir}`;
  if (r0.role === "test") return `Тест: одиночка с запасом 2 → с запасом 1${same > 2 ? " → попытка, только если вторая шла быстро" : ""}`;
  if (r0.role === "amrap") return `Тест: 1 подход на максимум повторов${r0.w != null ? ` с <b>+${fmtW(r0.w)}${NB}кг</b>` : ""}`;
  return "";
}
function planText(it) {
  const ex = it.ex, rs = it.rows.filter(r => r.role !== "extra");
  if (CFG.block && ex.scheme) {
    const g = [], by = role => rs.filter(r => r.role === role);
    const top = by("top")[0]; if (top) g.push(`ТС ×${top.reps}`);
    const bo = by("bo"); if (bo.length) g.push(`${bo.length} × ${bo[0].cluster ? "(" + bo[0].cluster + ")" : bo[0].reps}`);
    const sg = by("single"); if (sg.length) g.push(`${sg.length} × 1`);
    const str = by("straight").concat(by("deload")); if (str.length) g.push(`${str.length} × ${str[0].reps}`);
    const ts = by("test"); if (ts.length) g.push(`тест ${ts.length} × 1`);
    if (by("amrap").length) g.push("1 × макс.");
    return esc(g.join(" + ") + " · " + ex.rest);
  }
  return `${ex.kind === "emom" ? (ex.rounds || 10) + " мин × " + (ex.perRound || 8) : rs.length + " × " + esc(ex.reps)} · RIR ${esc(it.rirTxt ?? ex.rir)} · ${esc(ex.rest)}`;
}

function fatigueSigns(date) {
  const out = [];
  const days = [0, 1, 2].map(k => S.daily.get(addDays(date, -k)) || {});
  if (days.every(x => x.sleep != null && x.sleep < 7)) out.push("сон меньше 7 ч три ночи подряд");
  if (days.filter(x => (x.energy != null && x.energy <= 2) || (x.fresh != null && x.fresh <= 2)).length >= 2) out.push("низкая энергия или тяжёлые мышцы 2 дня из 3");
  CFG.workouts.forEach(w => w.exercises.forEach(ex => {
    if (!ex.scheme || !(ex.kind === "main" || ex.kind === "mainbw")) return;
    const pts = sessionList().filter(s => s.date < date && s.date >= addDays(date, -42) && isRef(s))
      .map(s => { const a = setsIn(s, ex); return a ? bestE1(ex, a, s.date) : null; }).filter(v => v != null);
    if (pts.length < 3) return;
    const [a, b, ...rest] = pts, best = Math.max(...rest);
    if (a <= best * .95 && b <= best * .95) out.push(`${short(ex.name).toLowerCase()}: расчётный максимум ниже лучшего на ${Math.round((1 - Math.max(a, b) / best) * 100)} % две тренировки подряд`);
  }));
  return out;
}
function blockBanner(bi, cur) {
  const B = CFG.block;
  if (bi.pre) return `<div class="banner blk"><div class="blk-t">Блок 16 недель стартует ${dShort(bi.start)}</div><div class="small">До старта приложение показывает план 1-й недели.</div>${cur.date >= today() ? `<button type="button" class="btn small" data-blockstart="${cur.date}">Начать блок с ${dShort(cur.date)}</button>` : ""}</div>`;
  const ph = phaseInfo(bi.week);
  const title = bi.extra ? `Внеплановая разгрузка · потом неделя ${bi.week}` : `Неделя ${bi.week} из ${B.length}${bi.block > 1 ? ` · блок ${bi.block}` : ""} · ${bi.optional && bi.marked ? "Разгрузка" : ph.name}`;
  const note = bi.extra ? "Половина подходов, вес на 10 % ниже. План стоит на паузе и продолжится со следующей недели." : bi.optional && bi.marked ? "Половина подходов, вес на 10 % ниже, запас 4." : ph.note;
  const btn = bi.planned ? "" : `<button type="button" class="btn small" data-dlweek="${bi.spanStart}">${bi.marked ? "Отменить разгрузочную неделю" : "Сделать эту неделю разгрузочной"}</button>`;
  return `<div class="banner blk"><div class="blk-t">${esc(title)}</div><div class="small">${esc(note)} <span class="muted">${dShort(bi.spanStart)}–${dShort(bi.spanEnd)}</span></div>${btn}</div>`;
}
function fatigueBanner(date) {
  if (date < addDays(today(), -1)) return "";
  const f = fatigueSigns(date); if (!f.length) return "";
  const adv = f.length >= 2 ? "Похоже на накопленную усталость: сегодня выбери «Разгрузка», а если так и на следующей тренировке — сделай неделю разгрузочной." : "Если чувствуешь себя разбитым — выбери «Лёгкая».";
  return `<div class="banner warn"><b>Признаки усталости:</b> ${esc(f.join("; "))}. ${esc(adv)}</div>`;
}

/* ---------- current session ---------- */
function nextType() {
  const list = sessionList().filter(s => ORDER.includes(s.type));
  if (!list.length) return ORDER[0];
  const i = ORDER.indexOf(list[0].type);
  return ORDER[(i + 1) % ORDER.length];
}
function openSession(type, date) {
  const id = `${date}_${SLUG[type] || type}`;
  const ex = S.sessions.get(id);
  S.cur = { id, type, date, sets: JSON.parse(JSON.stringify(ex?.sets || {})), notes: ex?.notes || "", stamp: ex?.updatedAt || 0, exists: !!ex, mode: ex?.mode || null };
  S.dirty = false;
}
function initCurrent() {
  const t = today();
  const todays = sessionList().find(s => s.date === t);
  openSession(todays ? todays.type : nextType(), t);
}

/* ---------- saving ---------- */
function compactSets(sets) {
  const out = {};
  for (const [k, arr] of Object.entries(sets)) {
    const a = (arr || []).map(s => s ? Object.assign({ w: s.w ?? null, r: s.r ?? null, rir: s.rir ?? null, done: !!s.done }, s.k ? { k: s.k } : {}, s.cl ? { cl: s.cl } : {}) : null);
    while (a.length && (!a[a.length - 1] || (!filled(a[a.length - 1]) && !a[a.length - 1].done))) a.pop();
    if (a.length) out[k] = a.map(s => s || { w: null, r: null, rir: null, done: false });
  }
  return out;
}
function scheduleSave() {
  S.dirty = true;
  setStatus(S.db ? "Не сохранено" : "Без сохранения", S.db ? "" : "bad");
  clearTimeout(S.saveTimer);
  S.saveTimer = setTimeout(flush, 1200);
}
async function flush() {
  clearTimeout(S.saveTimer);
  if (!S.cur || !S.dirty || !S.db || !S.canWrite) return;
  if (S.saving) { S.pending = true; return; }
  const sets = compactSets(S.cur.sets);
  if (!S.cur.exists && !Object.keys(sets).length && !S.cur.notes.trim()) { S.dirty = false; setStatus("Сохранено", "ok"); return; }
  S.saving = true; S.dirty = false;
  const body = { type: S.cur.type, date: S.cur.date, sets, notes: S.cur.notes, updatedAt: Date.now() };
  if (CFG.block) {
    const bi = blockInfo(S.cur.date);
    Object.assign(body, { mode: curMode(bi), week: bi.pre ? 0 : bi.week, phase: bi.phase }, bi.block > 1 ? { block: bi.block } : {}, bi.extra ? { extra: true } : {});
  }
  try {
    await writeDoc("sessions/" + S.cur.id, body);
    S.cur.exists = true; S.cur.stamp = body.updatedAt; if (body.mode) S.cur.mode = body.mode;
    Sync.show();
  } catch (e) {
    S.dirty = true; setStatus("Не сохранилось", "bad");
    if (e?.code === "invalid_argument") readOnly();
  }
  S.saving = false;
  if (S.pending) { S.pending = false; if (S.dirty) flush(); }
}
async function writeDoc(path, body) {
  try { await S.db.doc(path).set(body); }
  catch (e) {
    if (e?.code === "unavailable") { await new Promise(r => setTimeout(r, 600 + Math.random() * 800)); await S.db.doc(path).set(body); }
    else throw e;
  }
}
function readOnly() {}
document.addEventListener("visibilitychange", () => { if (document.hidden) flush(); });
window.addEventListener("pagehide", flush);

/* ---------- train view ---------- */
const isCounted = r => !r.opt && r.role !== "extra";
function countDone() {
  return S.plan.items.filter(it => it.counted).reduce((a, it) => a + it.rows.reduce((b, r, s) => b + (isCounted(r) && S.cur.sets[it.ex.name]?.[s]?.done ? 1 : 0), 0), 0);
}
function renderTrain() {
  const v = $("#view-train");
  if (!S.cur) initCurrent();
  const cur = S.cur, w = WMAP[cur.type], nx = nextType();
  const bi = CFG.block ? blockInfo(cur.date) : null;
  const mode = bi ? curMode(bi) : "normal";
  const ctx = { type: cur.type, date: cur.date, blk: bi, phase: bi?.phase, mode };
  S.plan = { ctx, items: w.exercises.map((ex, i) => planFor(ex, i, ctx, cur)) };
  const total = S.plan.items.filter(it => it.counted).reduce((a, it) => a + it.rows.filter(isCounted).length, 0);
  let h = `<div class="card">
    <div class="seg" role="group" aria-label="Тренировка">${ORDER.map(k => `<button type="button" data-type="${esc(k)}" aria-pressed="${k === cur.type}">${esc(k)}${k === nx && !cur.exists ? '<span class="nx">по циклу</span>' : ""}</button>`).join("")}</div>
    <div class="row"><div class="field" style="flex:1"><label class="label" for="t-date">Дата</label><input type="date" id="t-date" value="${cur.date}"></div>
    <div class="field" style="flex:2"><span class="label">${esc(w.title)}</span><span class="small muted">Сделано подходов: <b id="done-count">${countDone()}</b> из ${total}${cur.exists ? "" : " · новая тренировка"}</span></div></div>
    ${bi ? `<div class="seg seg3" role="group" aria-label="Режим тренировки">${MODES.map(([k, l]) => `<button type="button" data-mode="${k}" aria-pressed="${k === mode}">${l}</button>`).join("")}</div>${MODE_TXT[mode] ? `<p class="small muted mode-txt">${MODE_TXT[mode]}</p>` : ""}` : ""}
  </div>`;
  if (bi) h += blockBanner(bi, cur) + fatigueBanner(cur.date);
  S.plan.items.forEach(it => { if (!it.hidden) h += exCard(it, cur); });
  const hid = S.plan.items.filter(it => it.hidden).map(it => short(it.ex.name));
  if (hid.length) h += `<p class="small muted">На этой неделе по плану не делаем: ${esc(hid.join(", "))}.</p>`;
  h += `<div class="card"><label class="label" for="t-notes">Заметки: самочувствие, замены, техника</label><textarea id="t-notes">${esc(cur.notes)}</textarea></div>`;
  v.innerHTML = h;
}
function exCard(it, cur) {
  const { ex, i, rows } = it;
  const sets = cur.sets[ex.name] || [];
  const nw = ex.noWeight;
  const pv = it.prev;
  const prev = pv ? `<div class="prev">Прошлый раз ${dShort(pv.date)}${pv.mode && pv.mode !== "normal" ? ` (${MODE_NAME[pv.mode]})` : ""}: ${pv.sets.map(s => (s.k && isNaN(+s.k) ? `<span class="muted">${esc(s.k)}</span> ` : "") + (nw || s.w == null ? "" : fmtW(s.w) + "×") + s.r + (s.rir != null ? `<span class="muted">@${s.rir}</span>` : "")).join(" · ")}</div>` : "";
  const isMain = ex.kind === "main" || ex.kind === "mainbw";
  const e1v = isMain ? bestE1(ex, sets, cur.date) : null;
  const repLbl = ex.kind === "emom" ? "Всего" : ex.sec ? "Сек" : "Повт.";
  const wLbl = ex.kind === "mainbw" || ex.kind === "emom" || /доп/.test(ex.name) ? "+кг" : "Кг";
  let h = `<div class="set-hdr${nw ? " nw" : ""}"><span>#</span>${nw ? "" : `<span>${wLbl}</span>`}<span>${repLbl}</span><span>RIR</span><span></span></div>`;
  rows.forEach((r, s) => {
    const st = sets[s] || {};
    const lbl = r.role === "set" || r.role === "extra" ? `подход ${s + 1}` : r.k;
    h += `<div class="set${nw ? " nw" : ""}${st.done ? " done" : ""}${r.role === "top" || r.role === "test" || r.role === "amrap" ? " top" : ""}" data-ex="${i}" data-s="${s}">
      <span class="n${r.k.length > 1 ? " k" : ""}">${esc(r.k)}</span>
      ${nw ? "" : `<input id="w-${i}-${s}" data-f="w" inputmode="decimal" aria-label="Вес, ${lbl}" value="${st.w != null ? fmtW(st.w) : ""}" placeholder="${r.w != null ? fmtW(r.w) : ""}">`}
      <input id="r-${i}-${s}" data-f="r" inputmode="numeric" aria-label="Повторы, ${lbl}" value="${st.r ?? ""}" placeholder="${esc(r.reps ?? "")}">
      <input id="i-${i}-${s}" data-f="rir" inputmode="numeric" aria-label="Запас, ${lbl}" value="${st.rir ?? ""}" placeholder="${r.rir ?? ""}">
      <button type="button" class="tick" data-tick aria-pressed="${!!st.done}" aria-label="${esc(lbl)} сделан">✓</button>
    </div>`;
    if (r.cluster) h += `<div class="cl-line"><button type="button" class="btn small" data-intra="${r.intra}" aria-label="Пауза внутри кластера ${r.intra} секунд">⏱ пауза ${r.intra} с</button></div>`;
  });
  const allDone = rows.length > 0 && rows.every((r, s) => !isCounted(r) || sets[s]?.done);
  return `<article class="card ex${allDone ? " done-all" : ""}" id="ex-${i}">
    <div class="ex-head"><h3>${esc(ex.name)}${ex.optional ? ' <span class="tag">по желанию</span>' : ""}${ex.hint ? `<span class="hint">${esc(ex.hint)}</span>` : ""}</h3><span class="plan">${planText(it)}</span></div>
    ${prev}
    <div class="sugg" id="sugg-${i}">${it.sugg}${it.info ? `<span class="sugg-src">${esc(it.info)}</span>` : ""}</div>
    ${it.note ? `<div class="small muted">${esc(it.note)}</div>` : ""}
    <div class="sets">${h}</div>
    ${isMain ? `<div class="e1" id="e1-${i}">e1RM сегодня: ${e1v ? fmt(e1v) + " кг" : "—"}${ex.kind === "mainbw" ? " (вес тела + доп.)" : ""}</div>` : ""}
  </article>`;
}
function updateCounts() { const el = $("#done-count"); if (el) el.textContent = countDone(); }
const TAGGED = new Set(["top", "bo", "single", "deload", "test", "amrap"]);
function tagSet(st, r) { if (!r) return; if (TAGGED.has(r.role)) st.k = r.k; if (r.cluster) st.cl = +String(r.cluster).split("+")[0]; }
function refreshDeps(i) {
  const it = S.plan.items[i]; if (!it) return;
  recalcDeps(it, S.cur.sets[it.ex.name] || []);
  it.rows.forEach((r, s) => {
    if (s === 0 || (r.drop == null && r.role !== "test")) return;
    const wi = $(`#w-${i}-${s}`); if (wi) wi.placeholder = r.w != null ? fmtW(r.w) : "";
    const ri = $(`#r-${i}-${s}`); if (ri) ri.placeholder = r.reps ?? "";
  });
  const el = $("#sugg-" + i);
  if (el && it.ex.scheme && CFG.block) el.innerHTML = suggFor(it) + (it.info ? `<span class="sugg-src">${esc(it.info)}</span>` : "");
}
$("#view-train").addEventListener("input", e => {
  const t = e.target; S.touched = true;
  if (t.id === "t-notes") { S.cur.notes = t.value; scheduleSave(); return; }
  const row = t.closest(".set"); if (!row) return;
  const i = +row.dataset.ex, s = +row.dataset.s, it = S.plan.items[i], ex = it.ex, r = it.rows[s];
  const arr = S.cur.sets[ex.name] || (S.cur.sets[ex.name] = []);
  arr[s] = arr[s] || {};
  arr[s][t.dataset.f] = num(t.value);
  tagSet(arr[s], r);
  if (s === 0 && (r?.role === "top" || r?.role === "test")) refreshDeps(i);
  if (ex.kind === "main" || ex.kind === "mainbw") {
    const v = bestE1(ex, arr, S.cur.date); const el = $("#e1-" + i);
    if (el) el.textContent = `e1RM сегодня: ${v ? fmt(v) + " кг" : "—"}${ex.kind === "mainbw" ? " (вес тела + доп.)" : ""}`;
  }
  scheduleSave();
});
$("#view-train").addEventListener("change", e => {
  if (e.target.id === "t-date" && e.target.value) { S.touched = true; flush(); openSession(S.cur.type, e.target.value); renderTrain(); }
});
$("#view-train").addEventListener("click", e => {
  if (e.target.closest("button")) S.touched = true;
  const tb = e.target.closest("[data-type]");
  if (tb) { flush(); openSession(tb.dataset.type, S.cur.date); renderTrain(); window.scrollTo(0, 0); return; }
  const mb = e.target.closest("[data-mode]");
  if (mb) { S.cur.mode = mb.dataset.mode; if (S.cur.exists) scheduleSave(); renderTrain(); return; }
  const dw = e.target.closest("[data-dlweek]");
  if (dw) {
    const set = new Set(profile().deloadWeeks || []), k = dw.dataset.dlweek;
    if (set.has(k)) set.delete(k); else set.add(k);
    if (!S.cur.exists) S.cur.mode = null;
    saveProfile({ deloadWeeks: [...set].sort() }); renderTrain(); return;
  }
  const bs = e.target.closest("[data-blockstart]");
  if (bs) { saveProfile({ blockStart: bs.dataset.blockstart }); renderTrain(); return; }
  const ib = e.target.closest("[data-intra]");
  if (ib) { unlockAudio(); startTimer(+ib.dataset.intra, "пауза внутри кластера"); return; }
  const tick = e.target.closest("[data-tick]"); if (!tick) return;
  unlockAudio(); keepAwake();
  const row = tick.closest(".set"); const i = +row.dataset.ex, s = +row.dataset.s;
  const it = S.plan.items[i], ex = it.ex, r = it.rows[s] || {};
  const arr = S.cur.sets[ex.name] || (S.cur.sets[ex.name] = []);
  arr[s] = arr[s] || {};
  const st = arr[s];
  st.done = !st.done;
  if (st.done) {
    const wi = $(`#w-${i}-${s}`); if (wi && st.w == null && wi.placeholder) { st.w = num(wi.placeholder); wi.value = wi.placeholder; }
    const ri = $(`#i-${i}-${s}`); if (ri && st.rir == null && ri.placeholder !== "") { st.rir = num(ri.placeholder); ri.value = ri.placeholder; }
    tagSet(st, r);
    if (s === 0 && (r.role === "top" || r.role === "test")) refreshDeps(i);
    const rest = r.rest ?? ex.restSec;
    if (rest) startTimer(rest, `${ex.name} · ${r.role === "set" || r.role === "extra" ? `подход ${s + 1} из ${it.rows.length}` : r.k}`);
  }
  row.classList.toggle("done", st.done); tick.setAttribute("aria-pressed", st.done);
  $("#ex-" + i).classList.toggle("done-all", it.rows.length > 0 && it.rows.every((q, k) => !isCounted(q) || arr[k]?.done));
  updateCounts(); scheduleSave();
});

/* ---------- rest timer ---------- */
const T = { end: 0, total: 0, iv: null, beeped: false, ctx: null, lock: null };
function unlockAudio() { try { if (!T.ctx) T.ctx = new (window.AudioContext || window.webkitAudioContext)(); if (T.ctx.state === "suspended") T.ctx.resume(); } catch (e) {} }
function beep() {
  try { const c = T.ctx; if (!c) return; [0, .25, .5].forEach(o => { const os = c.createOscillator(), g = c.createGain(); os.frequency.value = 880; g.gain.value = .15; os.connect(g); g.connect(c.destination); os.start(c.currentTime + o); os.stop(c.currentTime + o + .15); }); } catch (e) {}
  try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {}
}
async function keepAwake() { try { if (!T.lock && navigator.wakeLock) { T.lock = await navigator.wakeLock.request("screen"); T.lock.addEventListener("release", () => { T.lock = null; }); } } catch (e) {} }
function startTimer(sec, what) {
  T.total = sec; T.end = Date.now() + sec * 1000; T.beeped = false;
  $("#t-what").textContent = "Отдых · " + what;
  $("#timer").hidden = false; $("#timer").classList.remove("over");
  clearInterval(T.iv); T.iv = setInterval(tick, 250); tick();
}
function tick() {
  const left = (T.end - Date.now()) / 1000;
  const el = $("#timer");
  if (left <= 0) {
    $("#t-clock").textContent = "0:00"; $("#t-bar").style.width = "100%";
    if (!T.beeped) { T.beeped = true; beep(); el.classList.add("over"); $("#t-what").textContent = "Отдых окончен — следующий подход"; }
    if (left < -60) stopTimer();
    return;
  }
  $("#t-clock").textContent = mmss(Math.ceil(left));
  $("#t-bar").style.width = (100 * (1 - left / T.total)) + "%";
}
function stopTimer() { clearInterval(T.iv); $("#timer").hidden = true; }
$("#t-plus").onclick = () => { T.end += 15000; T.total += 15; if (T.beeped) { T.beeped = false; $("#timer").classList.remove("over"); } tick(); };
$("#t-minus").onclick = () => { T.end -= 15000; tick(); };
$("#t-stop").onclick = stopTimer;

/* ---------- log view ---------- */
function kcalTarget(entry) {
  if (CFG.phases && entry?.phase === CFG.phases[1]) return CFG.kcalPms;
  return CFG.kcal;
}
function renderLog() {
  const v = $("#view-log");
  const d = S.logDate || today();
  const e = S.daily.get(d) || {};
  const target = kcalTarget(e);
  const chips = [`Калории ${target}`, `Белок ${CFG.protein} г`].concat(CFG.steps ? [`Шаги ${CFG.steps}`] : []);
  let h = `<div class="card"><div class="row" style="justify-content:space-between"><h2>День</h2><input type="date" id="l-date" value="${d}" style="width:auto"></div>
    <div class="targets">${chips.map(c => `<span class="chip">${esc(c)}</span>`).join("")}</div>
    <div class="grid-fields">${CFG.daily.map(f => `<div class="field"><label class="label" for="d-${f.k}">${esc(f.label)}${f.unit ? ", " + esc(f.unit) : ""}</label><input id="d-${f.k}" inputmode="decimal" value="${e[f.k] != null ? fmtW(e[f.k]) : ""}"></div>`).join("")}
    ${CFG.phases ? `<div class="field"><label class="label" for="d-phase">Фаза цикла</label><select id="d-phase">${CFG.phases.map(p => `<option${(e.phase || CFG.phases[0]) === p ? " selected" : ""}>${esc(p)}</option>`).join("")}</select></div>` : ""}
    </div>
    <div class="row"><button type="button" class="btn primary" id="d-save">Сохранить день</button><span class="small muted" id="d-msg"></span></div></div>`;
  // cardio
  const cl = S.cardio.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 8);
  h += `<div class="card"><h2>Кардио</h2>
    <div class="grid-fields">
      <div class="field"><label class="label" for="c-type">Тип</label><select id="c-type">${CFG.cardioTypes.map(t => `<option>${esc(t)}</option>`).join("")}</select></div>
      <div class="field"><label class="label" for="c-min">Минут</label><input id="c-min" inputmode="numeric"></div>
      <div class="field"><label class="label" for="c-hr">Ср. пульс</label><input id="c-hr" inputmode="numeric" placeholder="${CFG.hrLow}–${CFG.hrHigh}"></div>
    </div>
    <div class="row"><button type="button" class="btn primary" id="c-add">Добавить за ${dShort(d)}</button><span class="small muted">Цель по пульсу ${CFG.hrLow}–${CFG.hrHigh}</span></div>
    ${cl.length ? `<div class="tbl-wrap"><table><thead><tr><th>Дата</th><th>Тип</th><th>Мин</th><th>Пульс</th><th></th></tr></thead><tbody>${cl.map(c => {
      const z = c.hr == null ? "" : c.hr < CFG.hrLow ? "ниже цели" : c.hr <= CFG.hrHigh ? "в цели" : "выше цели";
      return `<tr><td>${dShort(c.date)}</td><td>${esc(c.type)}</td><td>${c.minutes ?? "—"}</td><td>${c.hr ?? "—"} <span class="muted small">${z}</span></td><td><button type="button" class="btn danger small" data-delc="${esc(c.id)}">${S.delArm === "c" + c.id ? "Удалить?" : "×"}</button></td></tr>`;
    }).join("")}</tbody></table></div>` : `<p class="empty">Записей пока нет. Добавь первое кардио после тренировки.</p>`}
  </div>`;
  // measures
  const md = S.measDate || today();
  const m = S.measures.get(md) || {};
  const ml = [...S.measures.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
  h += `<div class="card"><div class="row" style="justify-content:space-between"><h2>Замеры, см</h2><input type="date" id="m-date" value="${md}" style="width:auto"></div>
    <p class="small muted">Талия${CFG.who === "anya" ? " и бёдра" : ""} — раз в неделю, в понедельник утром. Остальное — раз в 4 недели.</p>
    <div class="grid-fields">${CFG.measures.map(f => `<div class="field"><label class="label" for="m-${f.k}">${esc(f.label)}</label><input id="m-${f.k}" inputmode="decimal" value="${m[f.k] != null ? fmtW(m[f.k]) : ""}"></div>`).join("")}</div>
    <div class="row"><button type="button" class="btn primary" id="m-save">Сохранить замер</button><span class="small muted" id="m-msg"></span></div>
    ${ml.length ? `<div class="tbl-wrap"><table><thead><tr><th>Дата</th>${CFG.measures.map(f => `<th>${esc(f.label)}</th>`).join("")}</tr></thead><tbody>${ml.map(([dd, x]) => `<tr><td>${dShort(dd)}</td>${CFG.measures.map(f => `<td>${x[f.k] != null ? fmt(x[f.k]) : "—"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}
  </div>`;
  // last days
  const days = [...Array(7)].map((_, k) => addDays(d, -k));
  h += `<div class="card"><h2>Последние 7 дней</h2><div class="tbl-wrap"><table><thead><tr><th>Дата</th><th>Вес</th><th>Ккал</th><th>Белок</th><th>Шаги</th><th>Сон</th></tr></thead><tbody>${days.map(dd => {
    const x = S.daily.get(dd) || {};
    const kc = x.kcal != null ? `<span class="${Math.abs(x.kcal - kcalTarget(x)) <= 150 ? "" : "muted"}">${x.kcal}</span>` : "—";
    return `<tr><td>${dShort(dd)}</td><td>${x.weight != null ? fmt(x.weight) : "—"}</td><td>${kc}</td><td>${x.protein ?? "—"}</td><td>${x.steps ?? "—"}</td><td>${x.sleep != null ? fmt(x.sleep) : "—"}</td></tr>`;
  }).join("")}</tbody></table></div></div>`;
  v.innerHTML = h;
}
$("#view-log").addEventListener("change", e => {
  if (e.target.id === "l-date") { S.logDate = e.target.value || today(); renderLog(); }
  if (e.target.id === "m-date") { S.measDate = e.target.value || today(); renderLog(); }
});
$("#view-log").addEventListener("click", async e => {
  const t = e.target;
  if (!S.db || !S.canWrite) { if (t.closest("button")) notice("Сначала войди в аккаунт."); return; }
  if (t.id === "d-save") {
    const d = S.logDate || today(); const body = { date: d };
    CFG.daily.forEach(f => { const val = num($("#d-" + f.k).value); if (val != null) body[f.k] = f.scale ? Math.max(1, Math.min(5, Math.round(val))) : val; });
    if (CFG.phases) body.phase = $("#d-phase").value;
    t.disabled = true;
    try { await writeDoc("daily/" + d, body); $("#d-msg").textContent = "Сохранено"; } catch (err) { $("#d-msg").textContent = "Не сохранилось, попробуй ещё раз"; }
    t.disabled = false;
  }
  if (t.id === "m-save") {
    const d = S.measDate || today(); const body = { date: d };
    CFG.measures.forEach(f => { const val = num($("#m-" + f.k).value); if (val != null) body[f.k] = val; });
    t.disabled = true;
    try { await writeDoc("measures/" + d, body); $("#m-msg").textContent = "Сохранено"; } catch (err) { $("#m-msg").textContent = "Не сохранилось, попробуй ещё раз"; }
    t.disabled = false;
  }
  if (t.id === "c-add") {
    const minutes = num($("#c-min").value);
    if (minutes == null) { $("#c-min").focus(); return; }
    const body = { date: S.logDate || today(), type: $("#c-type").value, minutes, hr: num($("#c-hr").value), createdAt: Date.now() };
    t.disabled = true;
    try { await S.db.collection("cardio").add(body); $("#c-min").value = ""; $("#c-hr").value = ""; } catch (err) { notice("Кардио не сохранилось, попробуй ещё раз."); }
    t.disabled = false;
  }
  const dc = t.closest("[data-delc]");
  if (dc) {
    const id = dc.dataset.delc;
    if (S.delArm !== "c" + id) { S.delArm = "c" + id; renderLog(); return; }
    S.delArm = null;
    try { await S.db.doc("cardio/" + id).delete(); } catch (err) { notice("Не удалось удалить запись."); }
  }
});

/* ---------- charts ---------- */
function lineChart({ raw = [], line = [], line2 = [], unit = "", height = 190 }) {
  const all = raw.concat(line, line2);
  if (all.length < 2) return `<p class="empty">Нужно хотя бы два значения, чтобы построить график.</p>`;
  const W = 640, H = height, L = 40, R = 12, Tp = 10, B = 24;
  const xs = all.map(p => p.x), ys = all.map(p => p.y);
  let x0 = Math.min(...xs), x1 = Math.max(...xs); if (x1 === x0) x1 = x0 + 86400000;
  let y0 = Math.min(...ys), y1 = Math.max(...ys); const padY = Math.max((y1 - y0) * .15, .5); y0 -= padY; y1 += padY;
  const sx = x => L + (x - x0) / (x1 - x0) * (W - L - R), sy = y => Tp + (1 - (y - y0) / (y1 - y0)) * (H - Tp - B);
  const ticks = [...Array(4)].map((_, k) => y0 + (y1 - y0) * (k + .5) / 4);
  const path = pts => pts.map((p, k) => (k ? "L" : "M") + sx(p.x).toFixed(1) + " " + sy(p.y).toFixed(1)).join(" ");
  const lab = x => { const d = new Date(x); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`; };
  const endP = (line.length ? line : raw)[(line.length ? line : raw).length - 1];
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="График">
    <g class="grid">${ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${sy(t)}" y2="${sy(t)}"/>`).join("")}</g>
    ${ticks.map(t => `<text x="${L - 6}" y="${sy(t) + 4}" text-anchor="end">${fmt(t)}</text>`).join("")}
    <text x="${L}" y="${H - 6}">${lab(x0)}</text><text x="${W - R}" y="${H - 6}" text-anchor="end">${lab(x1)}</text>
    ${raw.map(p => `<circle class="raw" cx="${sx(p.x).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="3"/>`).join("")}
    ${line.length > 1 ? `<path class="avg" d="${path(line)}"/>` : ""}
    ${line2.length > 1 ? `<path class="ser2" d="${path(line2)}"/>` : ""}
    ${endP ? `<circle class="end" cx="${sx(endP.x).toFixed(1)}" cy="${sy(endP.y).toFixed(1)}" r="4.5"/>` : ""}
  </svg>`;
}
function spark(pts) {
  if (pts.length < 2) return "";
  const W = 200, H = 40, ys = pts.map(p => p.y); let y0 = Math.min(...ys), y1 = Math.max(...ys); if (y1 === y0) { y0 -= 1; y1 += 1; }
  const sx = k => 4 + k / (pts.length - 1) * (W - 8), sy = y => 4 + (1 - (y - y0) / (y1 - y0)) * (H - 8);
  const last = pts.length - 1;
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${pts.map((p, k) => (k ? "L" : "M") + sx(k).toFixed(1) + " " + sy(p.y).toFixed(1)).join(" ")}"/><circle cx="${sx(last)}" cy="${sy(pts[last].y)}" r="3"/></svg>`;
}

/* ---------- progress view ---------- */
function weightSeries() {
  const days = [...S.daily.entries()].filter(([, v]) => v.weight != null).sort((a, b) => a[0].localeCompare(b[0]));
  const raw = days.map(([d, v]) => ({ d, x: toDate(d).getTime(), y: v.weight }));
  const line = [];
  raw.forEach(p => { const win = raw.filter(q => q.d <= p.d && q.d > addDays(p.d, -7)); if (win.length >= 4) line.push({ x: p.x, y: avg(win.map(q => q.y)), d: p.d }); });
  return { raw, line };
}
function weekRows(n = 10) {
  const now = weekStart(today()); const rows = [];
  for (let k = 0; k < n; k++) {
    const ws = addDays(now, -7 * k), we = addDays(ws, 6);
    const inW = d => d >= ws && d <= we;
    const dd = [...S.daily.entries()].filter(([d]) => inW(d)).map(([, v]) => v);
    const ses = sessionList().filter(s => inW(s.date));
    const sets = ses.reduce((a, s) => a + Object.values(s.sets || {}).reduce((b, arr) => b + arr.filter(x => x && x.r != null).length, 0), 0);
    const card = S.cardio.filter(c => inW(c.date)).reduce((a, c) => a + (c.minutes || 0), 0);
    const meas = [...S.measures.entries()].filter(([d]) => inW(d)).map(([, v]) => v);
    rows.push({ ws, w: avg(dd.map(x => x.weight)), kcal: avg(dd.map(x => x.kcal)), prot: avg(dd.map(x => x.protein)), steps: avg(dd.map(x => x.steps)), n: ses.length, sets, card, waist: avg(meas.map(x => x.waist)), hips: avg(meas.map(x => x.hips)) });
  }
  return rows; // newest first
}
function hint(rows) {
  if (CFG.who === "anya") {
    const a = rows[0], b = rows[4];
    if (!a || !b || a.w == null || b.w == null) return { cls: "", text: "Подсказка появится, когда будет 5 недель взвешиваний." };
    const dw = a.w - b.w, dwaist = a.waist != null && b.waist != null ? a.waist - b.waist : null;
    if (dw < -3) return { cls: "warn", text: `За 4 недели ${fmt(dw)} кг — быстрее плана: +150 ккал.` };
    if (dw > -1 && (dwaist == null || dwaist > -1)) return { cls: "warn", text: `За 4 недели ${fmt(dw)} кг${dwaist != null ? `, талия ${fmt(dwaist)} см` : ""}: проверь точность подсчёта, потом +1500 шагов.` };
    return { cls: "good", text: `За 4 недели ${fmt(dw)} кг${dwaist != null ? `, талия ${fmt(dwaist)} см` : ""} — всё в норме.` };
  }
  const w = rows.slice(0, 3).map(r => r.w);
  if (w.some(x => x == null)) return { cls: "", text: "Подсказка появится, когда будет 3 недели взвешиваний." };
  const rate = ((w[0] - w[1]) + (w[1] - w[2])) / 2;
  if (rate < .15) return { cls: "warn", text: `Набор ${fmt(rate, 2)} кг/нед — мало: +150–200 ккал.` };
  if (rate > .5) return { cls: "warn", text: `Набор ${fmt(rate, 2)} кг/нед — много: −150 ккал.` };
  return { cls: "good", text: `Набор ${fmt(rate, 2)} кг/нед — в норме.` };
}
function renderProgress() {
  const v = $("#view-progress");
  const { raw, line } = weightSeries();
  const rows = weekRows(10);
  const hn = hint(rows);
  const lastAvg = line.length ? line[line.length - 1].y : raw.length ? raw[raw.length - 1].y : null;
  const meas = [...S.measures.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const waist = meas.filter(([, x]) => x.waist != null).map(([d, x]) => ({ x: toDate(d).getTime(), y: x.waist }));
  const hips = meas.filter(([, x]) => x.hips != null).map(([d, x]) => ({ x: toDate(d).getTime(), y: x.hips }));
  const firstWaist = waist[0]?.y, lastWaist = waist[waist.length - 1]?.y;
  let h = `<div class="kpis">
    <div class="card kpi"><span class="label">Средний вес 7 дней</span><span class="v">${fmt(lastAvg)} кг</span><span class="small muted">старт ${fmt(CFG.startWeight)} кг</span></div>
    <div class="card kpi"><span class="label">Талия</span><span class="v">${fmt(lastWaist)} см</span><span class="small muted">${firstWaist != null && waist.length > 1 ? "с начала " + (lastWaist - firstWaist >= 0 ? "+" : "") + fmt(lastWaist - firstWaist) + " см" : "нет замеров"}</span></div>
    <div class="card kpi"><span class="label">Тренировок за неделю</span><span class="v">${rows[0].n}</span><span class="small muted">${rows[0].sets} рабочих подходов</span></div>
  </div>
  <div class="banner${hn.cls === "warn" ? " warn" : ""}">${esc(hn.text)}</div>
  <div class="card chart"><div class="row" style="justify-content:space-between"><h2>Вес тела</h2><span class="small muted">точки — утро, линия — среднее за 7 дней</span></div>${lineChart({ raw, line })}</div>
  <div class="card chart"><div class="row" style="justify-content:space-between"><h2>${CFG.who === "anya" ? "Талия и бёдра" : "Талия"}</h2><span class="small muted">${CFG.who === "anya" ? "синяя — талия, жёлтая — бёдра" : "см"}</span></div>${lineChart({ line: waist, line2: hips })}</div>`;
  // lifts
  const mains = [];
  CFG.workouts.forEach(w => w.exercises.forEach(ex => { if (ex.kind === "main" || ex.kind === "mainbw") mains.push({ ex, type: w.key }); }));
  h += `<div class="card"><h2>Силовые: расчётный максимум</h2><p class="small muted">Лучший подход каждой тренировки по формуле e1RM. Сравнивай только с собой в одном упражнении.</p><div class="lifts">`;
  mains.forEach(({ ex, type }) => {
    const pts = sessionList().filter(s => s.type === type && s.mode !== "deload").reverse().map(s => ({ d: s.date, y: bestE1(ex, s.sets?.[ex.name], s.date) })).filter(p => p.y != null);
    const last = pts[pts.length - 1], first = pts[0];
    h += `<div class="card lift"><span class="small"><b>${esc(ex.name.replace(/\s*\(.*\)/, ""))}</b></span><span class="v">${last ? fmt(last.y) + " кг" : "—"}</span>
      <span class="small muted">${pts.length > 1 ? (last.y - first.y >= 0 ? "+" : "") + fmt(last.y - first.y) + " кг с " + dShort(first.d) : pts.length ? "одна тренировка" : "нет записей"}</span>${spark(pts)}</div>`;
  });
  h += `</div></div>`;
  h += `<div class="card"><h2>По неделям</h2><div class="tbl-wrap"><table><thead><tr><th>Неделя с</th><th>Вес</th><th>Δ</th><th>Ккал</th><th>Белок</th><th>Шаги</th><th>Трен.</th><th>Подх.</th><th>Кардио</th>${CFG.who === "anya" ? "<th>Талия</th>" : ""}</tr></thead><tbody>${rows.map((r, k) => {
    const prev = rows[k + 1]; const dw = r.w != null && prev?.w != null ? r.w - prev.w : null;
    return `<tr><td>${dShort(r.ws)}</td><td>${fmt(r.w, 2)}</td><td>${dw == null ? "—" : (dw >= 0 ? "+" : "") + fmt(dw, 2)}</td><td>${fmt(r.kcal, 0)}</td><td>${fmt(r.prot, 0)}</td><td>${fmt(r.steps, 0)}</td><td>${r.n}</td><td>${r.sets}</td><td>${r.card || "—"}</td>${CFG.who === "anya" ? `<td>${fmt(r.waist)}</td>` : ""}</tr>`;
  }).join("")}</tbody></table></div></div>`;
  v.innerHTML = h;
}

/* ---------- history view ---------- */
function renderHistory() {
  const v = $("#view-history");
  const list = sessionList();
  if (!list.length) { v.innerHTML = `<div class="card"><h2>История</h2><p class="empty">Здесь появятся сохранённые тренировки. Начни с вкладки «Тренировка».</p></div>`; return; }
  v.innerHTML = `<h2>История</h2>` + list.map(s => {
    const w = WMAP[s.type]; let n = 0, best = [];
    Object.values(s.sets || {}).forEach(arr => { n += arr.filter(x => x && x.r != null).length; });
    w?.exercises.forEach(ex => { if (ex.kind === "main" || ex.kind === "mainbw") { const b = bestE1(ex, s.sets?.[ex.name], s.date); if (b) best.push(`${ex.name.replace(/\s*\(.*\)/, "")} ${fmt(b)}`); } });
    const tags = (s.week ? ` · нед. ${s.week}` : "") + (s.mode && s.mode !== "normal" ? ` · ${MODE_NAME[s.mode] || s.mode}` : "");
    return `<div class="card"><div class="hist-item"><div><div class="t">${esc(s.type)} · ${dShort(s.date)}<span class="small muted">${esc(tags)}</span></div><div class="small muted">${n} подходов${best.length ? " · e1RM " + esc(best.join(", ")) : ""}${s.notes ? " · " + esc(s.notes.slice(0, 80)) : ""}</div></div>
      <div class="row"><button type="button" class="btn" data-open="${esc(s.id)}">Открыть</button><button type="button" class="btn danger" data-dels="${esc(s.id)}">${S.delArm === "s" + s.id ? "Удалить?" : "Удалить"}</button></div></div></div>`;
  }).join("");
}
$("#view-history").addEventListener("click", async e => {
  const o = e.target.closest("[data-open]");
  if (o) { const s = S.sessions.get(o.dataset.open); if (s) { flush(); openSession(s.type, s.date); S.touched = true; if (location.hash === "#train") route(); else location.hash = "train"; window.scrollTo(0, 0); } return; }
  const d = e.target.closest("[data-dels]");
  if (d) {
    const id = d.dataset.dels;
    if (S.delArm !== "s" + id) { S.delArm = "s" + id; renderHistory(); return; }
    S.delArm = null;
    if (!S.db || !S.canWrite) return;
    try { await S.db.doc("sessions/" + id).delete(); if (S.cur?.id === id) S.cur = null; } catch (err) { notice("Не удалось удалить тренировку."); }
  }
});

/* ---------- program view ---------- */
function renderProgram() {
  const v = $("#view-program");
  const tg = CFG.who === "anya" ? `Калории ${CFG.kcal} (перед месячными ${CFG.kcalPms}) · белок ${CFG.protein} г · шаги ${CFG.steps}` : `Калории ~${CFG.kcal} (корректируется по темпу набора) · белок от ${CFG.protein} г`;
  let h = `<div class="card"><h2>Цель</h2><p>${esc(CFG.goal)}</p><p class="small muted">${esc(tg)}</p><ul class="rules">${CFG.rules.map(r => `<li>${esc(r)}</li>`).join("")}</ul></div>`;
  const bi = CFG.block ? blockInfo(today()) : null;
  if (bi) h += blockOverview(bi);
  CFG.workouts.forEach(w => {
    h += `<div class="card"><h2>${esc(w.key)}</h2><p class="small muted">${esc(w.title)}${bi ? ` · схема основных — на ${bi.pre ? "1-й неделе" : "этой неделе"}` : ""}</p><div class="tbl-wrap"><table class="prog-tbl"><thead><tr><th>Упражнение</th><th>Подх. × повт.</th><th>RIR</th><th>Отдых</th></tr></thead><tbody>${w.exercises.map(ex => {
      const sc = bi && ex.scheme ? CFG.schemes[ex.scheme] : null, ph = sc ? phCfg(sc, bi.phase) : null;
      const sets = sc ? schemeLine(sc, bi.phase) : `${ex.sets} × ${esc(ex.reps)}`;
      const rir = sc ? (ph?.top ? ph.top[1] : ph?.straight ? ph.straight.rir : "—") : esc(ex.rir);
      return `<tr><td style="white-space:normal">${esc(ex.name)}${ex.optional ? ' <span class="tag">по желанию</span>' : ""}${ex.hint ? `<span class="hint">${esc(ex.hint)}</span>` : ""}</td><td style="white-space:normal">${sets}</td><td>${rir}</td><td>${esc(ex.rest)}</td></tr>`;
    }).join("")}</tbody></table></div></div>`;
  });
  v.innerHTML = h;
}
function schemeLine(sc, key) {
  const ph = phCfg(sc, key); if (!ph) return "—";
  if (ph.straight) return esc(`${ph.straight.n} × ${ph.straight.reps}${ph.straight.pct ? ` (~${Math.round(ph.straight.pct * 100)} %)` : ""}`);
  if (ph.test) return "1 с запасом 2 → 1 с запасом 1 → попытка";
  if (ph.amrap) return "1 подход на максимум повторов";
  let s = `ТС ${ph.top[0]}`;
  if (ph.bo) s += ` + ${ph.bo.n} × ${ph.bo.cluster ? "(" + ph.bo.cluster + ")" : ph.bo.reps}`;
  if (ph.singles) s += ` + ${ph.singles.n} × 1`;
  return esc(s);
}
function blockOverview(bi) {
  const B = CFG.block, lifts = [];
  CFG.workouts.forEach(w => w.exercises.forEach(ex => { if (ex.scheme) lifts.push(ex); }));
  const runs = [];
  B.weekPhase.forEach((k, j) => {
    const wk = j + 1, dl = B.plannedDeload.includes(wk), last = runs[runs.length - 1];
    if (last && last.k === k && !dl && !last.dl) last.to = wk; else runs.push({ k, from: wk, to: wk, dl });
  });
  const P = profile(), marks = (P.deloadWeeks || []).slice().sort();
  let h = `<div class="card"><h2>Блок 16 недель</h2>
    <p class="small muted">Старт ${dShort(bi.start)}.${bi.pre ? "" : ` Сейчас: ${bi.extra ? "внеплановая разгрузка, потом" : ""} неделя ${bi.week}${bi.block > 1 ? `, блок ${bi.block}` : ""}.`}${marks.length ? ` Разгрузочные недели: ${marks.map(dShort).join(", ")}.` : ""} Дату старта можно поменять во вкладке «Аккаунт».</p>`;
  runs.forEach(r => {
    const ph = phaseInfo(r.from), now = !bi.pre && bi.week >= r.from && bi.week <= r.to;
    const wks = r.from === r.to ? `Неделя ${r.from}` : `Недели ${r.from}–${r.to}`;
    h += `<div class="phase${now ? " now" : ""}"><div class="phase-t">${wks} · ${esc(ph.name)}${now ? ' <span class="tag">сейчас</span>' : ""}</div><div class="small muted">${esc(ph.note)}</div>`;
    if (!r.dl) h += `<ul class="phase-l">${lifts.map(ex => { const t = schemeLine(CFG.schemes[ex.scheme], r.k); return t === "—" ? "" : `<li><b>${esc(short(ex.name))}:</b> ${t}</li>`; }).join("")}</ul>`;
    h += `</div>`;
  });
  h += `<ul class="rules">${B.legend.map(l => `<li>${esc(l)}</li>`).join("")}</ul></div>`;
  return h;
}

/* ---------- routing ---------- */
const VIEWS = ["train", "log", "progress", "history", "program", "account"];
function render() {
  if (!CFG) return;
  const r = { train: renderTrain, log: renderLog, progress: renderProgress, history: renderHistory, program: renderProgram, account: renderAccount }[S.view];
  r();
}
function route() {
  if (!CFG) return;
  const h = location.hash.replace("#", "");
  const v = VIEWS.includes(h) ? h : "train";
  if (S.view === "train" && v !== "train") flush();
  if (v !== S.view) S.bMsg = "";
  S.view = v;
  VIEWS.forEach(k => { $("#view-" + k).hidden = k !== v; });
  document.querySelectorAll("nav.tabs a").forEach(a => a.setAttribute("aria-current", a.dataset.v === v ? "page" : "false"));
  render();
}
window.addEventListener("hashchange", route);

/* ---------- data ---------- */
function typing() { const a = document.activeElement; return a && a !== document.body && a.closest && a.closest("main") && /INPUT|TEXTAREA|SELECT/.test(a.tagName); }
let rerenderQueued = false;
function onData() {
  if (S.cur && !S.touched && !S.dirty && !S.cur.exists && S.cur.date === today()) initCurrent();
  if (S.view === "train" && S.cur) {
    const remote = S.sessions.get(S.cur.id);
    if (remote && !S.dirty && !S.saving && (remote.updatedAt || 0) > (S.cur.stamp || 0)) { openSession(S.cur.type, S.cur.date); }
    if (!S.cur.exists && S.sessions.has(S.cur.id) && !S.dirty) openSession(S.cur.type, S.cur.date);
  }
  if (typing()) { if (!rerenderQueued) { rerenderQueued = true; document.addEventListener("focusout", () => { rerenderQueued = false; setTimeout(() => { if (!typing()) render(); }, 50); }, { once: true }); } return; }
  render();
}
/* ================= local store + Supabase sync ================= */
const CONF = window.TRAINER_CONFIG || {};
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};
const Auth = {
  s: LS.get("trainer.auth", null),
  save() { LS.set("trainer.auth", this.s); },
  get uid() { return this.s?.user?.id || null; },
  get email() { return this.s?.user?.email || ""; },
  async call(path, body) {
    const r = await fetch(CONF.supabaseUrl + "/auth/v1/" + path, {
      method: "POST", headers: { "Content-Type": "application/json", apikey: CONF.supabaseKey }, body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.msg || j.error_description || j.message || ("HTTP " + r.status)); e.code = j.error_code || j.error || r.status; throw e; }
    return j;
  },
  take(j) {
    this.s = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000, user: { id: j.user?.id, email: j.user?.email } };
    this.save();
  },
  async signIn(email, password) { this.take(await this.call("token?grant_type=password", { email, password })); },
  async signUp(email, password) {
    const j = await this.call("signup", { email, password });
    if (j.access_token) this.take(j); else { const e = new Error("confirm"); e.code = "confirm_email"; throw e; }
  },
  async token() {
    if (!this.s) return null;
    if (Date.now() > this.s.expires_at - 60000) {
      try { this.take(await this.call("token?grant_type=refresh_token", { refresh_token: this.s.refresh_token })); }
      catch (e) { if (e.code === 400 || e.code === 401 || /refresh/i.test(String(e.code))) { this.s = null; this.save(); } throw e; }
    }
    return this.s.access_token;
  },
  logout() { this.s = null; LS.del("trainer.auth"); },
};

const Store = {
  rows: {}, outbox: {}, since: null, seq: 0, listeners: {},
  key(col, id) { return col + "/" + id; },
  load() {
    const u = Auth.uid; if (!u) return;
    const d = LS.get("trainer.data." + u, {});
    this.rows = d.rows || {}; this.outbox = d.outbox || {}; this.since = d.since || null; this.seq = d.seq || 0;
  },
  persist() { const u = Auth.uid; if (u) LS.set("trainer.data." + u, { rows: this.rows, outbox: this.outbox, since: this.since, seq: this.seq }); },
  list(col) { return Object.values(this.rows).filter(r => r.col === col && !r.deleted); },
  get(col, id) { const r = this.rows[this.key(col, id)]; return r && !r.deleted ? r.data : null; },
  write(col, id, data, deleted) {
    const k = this.key(col, id);
    this.rows[k] = { col, id, data: deleted ? (this.rows[k]?.data || {}) : data, deleted: !!deleted };
    this.outbox[k] = ++this.seq;
    this.persist(); this.emit(col); Sync.soon();
  },
  on(col, fn) { (this.listeners[col] = this.listeners[col] || []).push(fn); },
  emit(col) { (this.listeners[col] || []).forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); },
  pending() { return Object.keys(this.outbox).length; },
};

/* the same small API the page used before (doc/collection), backed by Store */
const LocalDB = {
  doc(path) {
    const [col, id] = path.split("/");
    return { set: async body => Store.write(col, id, body, false), delete: async () => Store.write(col, id, null, true) };
  },
  collection(col) {
    return {
      add: async body => { const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8); Store.write(col, id, body, false); return { id }; },
      onSnapshot(next) {
        const fire = () => next({ docs: Store.list(col).map(r => ({ id: r.id, data: () => r.data })) });
        Store.on(col, fire); setTimeout(fire, 0); return () => {};
      },
    };
  },
};

const Sync = {
  busy: false, again: false, timer: null, last: null, err: null,
  soon() { clearTimeout(this.timer); this.timer = setTimeout(() => this.run(), 1500); this.show(); },
  async rest(path, opts = {}) {
    const tok = await Auth.token();
    if (!tok) throw Object.assign(new Error("no session"), { code: "auth" });
    const r = await fetch(CONF.supabaseUrl + "/rest/v1/" + path, {
      ...opts, headers: { apikey: CONF.supabaseKey, Authorization: "Bearer " + tok, "Content-Type": "application/json", ...(opts.headers || {}) },
    });
    if (!r.ok) { const t = await r.text().catch(() => ""); throw Object.assign(new Error("HTTP " + r.status + " " + t.slice(0, 200)), { code: r.status }); }
    return r;
  },
  async push() {
    const keys = Object.keys(Store.outbox).slice(0, 200);
    if (!keys.length) return;
    const snap = Object.fromEntries(keys.map(k => [k, Store.outbox[k]]));
    const body = keys.map(k => { const r = Store.rows[k]; return { user_id: Auth.uid, col: r.col, id: r.id, data: r.data || {}, deleted: !!r.deleted }; });
    await this.rest("entries?on_conflict=user_id,col,id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(body) });
    keys.forEach(k => { if (Store.outbox[k] === snap[k]) delete Store.outbox[k]; });
    Store.persist();
    if (Object.keys(Store.outbox).length) await this.push();
  },
  async pull() {
    const changed = new Set();
    for (let page = 0; page < 20; page++) {
      let q = "entries?select=col,id,data,deleted,updated_at&order=updated_at.asc&limit=1000";
      if (Store.since) q += "&updated_at=gte." + encodeURIComponent(Store.since);
      const rows = await (await this.rest(q)).json();
      rows.forEach(r => {
        const k = Store.key(r.col, r.id);
        if (Store.outbox[k]) return;
        const cur = Store.rows[k];
        if (cur && cur.deleted === r.deleted && JSON.stringify(cur.data) === JSON.stringify(r.data)) return;
        Store.rows[k] = { col: r.col, id: r.id, data: r.data, deleted: r.deleted };
        changed.add(r.col);
      });
      const prev = Store.since;
      if (rows.length) Store.since = rows[rows.length - 1].updated_at;
      if (rows.length < 1000 || Store.since === prev) break;
    }
    Store.persist();
    changed.forEach(c => Store.emit(c));
  },
  async run() {
    if (!Auth.uid || !CONF.supabaseUrl) return;
    if (this.busy) { this.again = true; return; }
    this.busy = true; this.show();
    try { await this.push(); await this.pull(); this.err = null; this.last = Date.now(); }
    catch (e) { this.err = e; if (e.code === "auth") onSignedOut(); }
    this.busy = false; this.show();
    if (this.again) { this.again = false; this.run(); }
  },
  show() {
    const n = Store.pending();
    if (this.busy) setStatus("Синхронизация…");
    else if (this.err && !navigator.onLine) setStatus(n ? `Без сети · ${n} на телефоне` : "Без сети", "bad");
    else if (this.err) setStatus(n ? `Не отправлено: ${n}` : "Нет связи с сервером", "bad");
    else if (n) setStatus(`Ждёт отправки: ${n}`);
    else if (this.last) setStatus("Синхронизировано", "ok");
    if (S.view === "account") updateAccountSync();
  },
};
window.addEventListener("online", () => Sync.run());
document.addEventListener("visibilitychange", () => { if (!document.hidden) Sync.run(); });
setInterval(() => { if (!document.hidden) Sync.run(); }, 30000);

/* ================= program, sign-in, account ================= */
function useProgram(who) {
  CFG = window.PROGRAMS[who] || window.PROGRAMS.max;
  ORDER = CFG.workouts.map(w => w.key);
  WMAP = Object.fromEntries(CFG.workouts.map(w => [w.key, w]));
  $("#app-name").textContent = "Тренировки · " + CFG.name;
  document.title = "Тренировки · " + CFG.name;
}
function showShell(on) {
  $("#nav").hidden = !on; $("#view-auth").hidden = on;
  if (!on) VIEWS.forEach(k => { $("#view-" + k).hidden = true; });
}
function renderAuth(msg = "", isErr = false) {
  const noConf = !CONF.supabaseUrl || !CONF.supabaseKey;
  $("#view-auth").innerHTML = `<div class="card auth">
    <h2>Вход</h2>
    ${noConf ? `<div class="banner warn">Приложение ещё не подключено к базе: заполни web/config.js.</div>` : ""}
    <p class="small muted">Один аккаунт — одна программа. У каждого своя почта, данные не смешиваются.</p>
    <div class="field"><label class="label" for="a-email">Почта</label><input id="a-email" type="email" autocomplete="email" inputmode="email" value="${esc(LS.get("trainer.lastEmail", ""))}"></div>
    <div class="field"><label class="label" for="a-pass">Пароль (от 6 символов)</label><input id="a-pass" type="password" autocomplete="current-password"></div>
    <div class="row"><button type="button" class="btn primary" id="a-in">Войти</button><button type="button" class="btn" id="a-up">Создать аккаунт</button></div>
    <p class="small ${isErr ? "err" : "muted"}" id="a-msg">${esc(msg)}</p>
  </div>`;
}
function authError(e) {
  const c = String(e.code || ""), m = String(e.message || "");
  if (c === "confirm_email") return "Аккаунт создан. Подтверди почту по ссылке из письма и нажми «Войти».";
  if (/invalid_credentials|Invalid login/i.test(c + m)) return "Неверная почта или пароль.";
  if (/email_not_confirmed|not confirmed/i.test(c + m)) return "Почта не подтверждена. Открой письмо от Supabase и перейди по ссылке.";
  if (/user_already_exists|already registered/i.test(c + m)) return "Такой аккаунт уже есть. Нажми «Войти».";
  if (/weak_password|at least 6/i.test(c + m)) return "Пароль слишком короткий: нужно минимум 6 символов.";
  if (/Failed to fetch|NetworkError/i.test(m)) return "Нет связи с сервером. Проверь интернет.";
  return "Не получилось: " + m;
}
$("#view-auth").addEventListener("click", async e => {
  const t = e.target; if (t.id !== "a-in" && t.id !== "a-up") return;
  const email = $("#a-email").value.trim(), pass = $("#a-pass").value;
  if (!email || !pass) { $("#a-msg").textContent = "Введи почту и пароль."; return; }
  LS.set("trainer.lastEmail", email);
  t.disabled = true; $("#a-msg").textContent = "Подключаюсь…";
  try { if (t.id === "a-in") await Auth.signIn(email, pass); else await Auth.signUp(email, pass); await afterSignIn(); }
  catch (err) { renderAuth(authError(err), err.code !== "confirm_email"); }
  t.disabled = false;
});
function renderSetup() {
  $("#view-auth").hidden = false;
  $("#view-auth").innerHTML = `<div class="card auth"><h2>Чья это программа?</h2>
    <p class="small muted">Выбирается один раз для этого аккаунта. Потом можно сменить во вкладке «Аккаунт».</p>
    <div class="row">${Object.values(window.PROGRAMS).map(p => `<button type="button" class="btn primary" data-prog="${esc(p.who)}">${esc(p.name)}</button>`).join("")}</div></div>`;
}
$("#view-auth").addEventListener("click", e => {
  const b = e.target.closest("[data-prog]"); if (!b) return;
  saveProfile({ program: b.dataset.prog });
  startApp(b.dataset.prog);
});
async function afterSignIn() {
  Store.load();
  $("#view-auth").innerHTML = `<div class="card auth"><p>Загружаю данные…</p></div>`;
  await Sync.run();
  const prof = Store.get("profile", "me");
  if (prof?.program) startApp(prof.program); else renderSetup();
}
let started = false;
function startApp(who) {
  useProgram(who);
  showShell(true);
  S.db = LocalDB; S.cur = null;
  if (!started) {
    started = true;
    sub("sessions", snap => { S.sessions = new Map(snap.docs.map(d => [d.id, d.data()])); });
    sub("daily", snap => { S.daily = new Map(snap.docs.map(d => [d.id, d.data()])); });
    sub("measures", snap => { S.measures = new Map(snap.docs.map(d => [d.id, d.data()])); });
    sub("cardio", snap => { S.cardio = snap.docs.map(d => ({ id: d.id, ...d.data() })); });
    Store.on("profile", () => { const p = Store.get("profile", "me"); if (p?.program && p.program !== CFG.who) { useProgram(p.program); S.cur = null; } onData(); });
  }
  route(); Sync.show();
}
function onSignedOut() { renderAuth("Сессия закончилась. Войди снова."); showShell(false); }
function sub(col, apply) { LocalDB.collection(col).onSnapshot(snap => { apply(snap); onData(); }); }

function syncText() {
  const n = Store.pending();
  const st = Sync.busy ? "Идёт синхронизация…" : Sync.err ? "Последняя попытка не удалась" + (navigator.onLine ? "" : ": нет интернета") + "." : Sync.last ? "Последняя синхронизация: " + new Date(Sync.last).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "Ещё не было.";
  return `${st} Ждут отправки: ${n}.`;
}
function updateAccountSync() { const el = $("#acc-sync"); if (el) el.textContent = syncText(); }
function renderAccount() {
  const v = $("#view-account"); if (!v || v.hidden) return;
  v.innerHTML = `<div class="card"><h2>Аккаунт</h2>
    <p>${esc(Auth.email)}</p>
    <p class="small muted">Программа: <b>${esc(CFG.name)}</b></p>
    <div class="row">${Object.values(window.PROGRAMS).filter(p => p.who !== CFG.who).map(p => `<button type="button" class="btn" data-switch="${esc(p.who)}">Переключить на программу «${esc(p.name)}»</button>`).join("")}</div>
  </div>${CFG.block ? blockCard() : ""}
  <div class="card"><h2>Синхронизация</h2>
    <p class="small" id="acc-sync">${esc(syncText())}</p>
    <p class="small muted">Всё, что ты вводишь, сначала сохраняется на устройстве, поэтому в зале можно работать без интернета.</p>
    <div class="row"><button type="button" class="btn primary" id="s-now">Синхронизировать сейчас</button></div></div>
  <div class="card"><h2>Импорт</h2>
    <p class="small muted">Из файла .json или из скопированного текста. Записи с той же датой и тренировкой заменяются.</p>
    <div class="row"><button type="button" class="btn" id="s-pick">Выбрать файл</button></div>
    <div class="field"><label class="label" for="s-text">Или вставь текст сюда</label><textarea id="s-text" placeholder='{"app":"trainer", ...}'></textarea></div>
    <div class="row"><button type="button" class="btn primary" id="s-import-text">Импортировать текст</button></div>
    <p class="small" id="s-msg"></p></div>
  <div class="card"><h2>Экспорт и отчёт</h2>
    <p class="small muted">Отчёт — короткая сводка за 4 недели, чтобы вставить её в чат с Claude. Экспорт — все записи целиком.</p>
    <div class="row"><button type="button" class="btn primary" id="s-report">Скопировать отчёт для Claude</button><button type="button" class="btn" id="s-export">Экспорт всех данных</button></div>
    <textarea id="s-out-text" readonly hidden></textarea>
    <p class="small" id="s-msg2"></p></div>
  <div class="card"><h2>Выход</h2><p class="small muted">Данные, которые ещё не отправлены, будут потеряны. Сейчас таких: ${Store.pending()}.</p>
    <div class="row"><button type="button" class="btn danger" id="s-out">${S.delArm === "logout" ? "Точно выйти?" : "Выйти"}</button></div></div>`;
}
function blockCard() {
  const bi = blockInfo(today()), P = profile(), dl = (P.deloadWeeks || []).slice().sort();
  const now = bi.pre ? `Блок начнётся ${dShort(bi.start)}.` : `Сейчас неделя ${bi.week} из ${CFG.block.length} · ${phaseInfo(bi.week).name}${bi.extra ? " (внеплановая разгрузка)" : ""}${bi.block > 1 ? ` · блок ${bi.block}` : ""}.`;
  return `<div class="card"><h2>Блок тренировок</h2>
    <p class="small">${esc(now)}</p>
    <p class="small muted">Неделя без тренировок и внеплановая разгрузочная неделя ставят план на паузу. Разгрузочную неделю включают на вкладке «Тренировка».${dl.length ? " Отмечены: " + dl.map(d => dShort(d) + "–" + dShort(addDays(d, 6))).join(", ") + "." : ""}</p>
    <div class="row"><div class="field" style="flex:1;min-width:150px"><label class="label" for="b-start">Начало блока</label><input type="date" id="b-start" value="${bi.start}"></div>
    <button type="button" class="btn primary" id="b-save" style="align-self:flex-end">Сохранить</button></div>
    <div class="row"><button type="button" class="btn" id="b-new">Начать новый блок с сегодня</button></div>
    ${CFG.plates ? `<label class="check"><input type="checkbox" id="b-small"${P.smallPlates ? " checked" : ""}> Есть блины по 1,25 кг: шаг на штанге и поясе ${fmtW(CFG.plates.small)} кг вместо ${fmtW(CFG.plates.bar)}</label>` : ""}
    <p class="small" id="b-msg">${esc(S.bMsg || "")}</p></div>`;
}
function importText(text) {
  const j = JSON.parse(text);
  const rows = Array.isArray(j.rows) ? j.rows : [];
  let n = 0;
  rows.forEach(r => { if (r && r.col && r.id && r.data && ["sessions", "daily", "measures", "cardio"].includes(r.col)) { Store.write(r.col, String(r.id), r.data, false); n++; } });
  return n;
}
async function copyOut(text, msgEl, okText) {
  const ta = $("#s-out-text"); ta.value = text; ta.hidden = false;
  try { await navigator.clipboard.writeText(text); msgEl.textContent = okText; }
  catch (e) { ta.focus(); ta.select(); try { document.execCommand("copy"); msgEl.textContent = okText; } catch (e2) { msgEl.textContent = "Скопируй текст из поля ниже вручную."; } }
}
function buildReport() {
  const from = addDays(today(), -28);
  const L = [`Отчёт «Тренировки» · ${CFG.name} · ${dShort(from)}–${dShort(today())}`];
  if (CFG.block) {
    const bi = blockInfo(today()), dl = profile().deloadWeeks || [];
    L.push(bi.pre ? `Блок 16 недель стартует ${dShort(bi.start)}` : `Блок: неделя ${bi.week} из ${CFG.block.length} (${phaseInfo(bi.week).name})${bi.extra ? ", внеплановая разгрузка" : ""}${bi.block > 1 ? `, блок ${bi.block}` : ""}, старт ${dShort(bi.start)}${dl.length ? ", разгрузочные недели с " + dl.map(dShort).join(", ") : ""}`);
  }
  const rows = weekRows(5).reverse();
  L.push("Недели (с понедельника): вес ср. / ккал / белок / шаги / тренировок / подходов / кардио мин / талия");
  rows.forEach(r => L.push(`${dShort(r.ws)}: ${fmt(r.w, 2)} / ${fmt(r.kcal, 0)} / ${fmt(r.prot, 0)} / ${fmt(r.steps, 0)} / ${r.n} / ${r.sets} / ${r.card || 0} / ${fmt(r.waist)}`));
  L.push("Тренировки:");
  sessionList().filter(x => x.date >= from).reverse().forEach(x => {
    const w = WMAP[x.type];
    const parts = Object.entries(x.sets || {}).map(([name, arr]) => {
      const ss = arr.filter(q => q && q.r != null).map(q => (q.k ? q.k + " " : "") + (q.w != null ? fmtW(q.w) + "×" : "") + q.r + (q.cl ? "(кл.)" : "") + (q.rir != null ? "@" + q.rir : ""));
      return ss.length ? `${name.replace(/\s*\(.*\)/, "")}: ${ss.join(" ")}` : null;
    }).filter(Boolean);
    L.push(`${dShort(x.date)} ${x.type}${x.week ? " · нед. " + x.week : ""}${x.mode && x.mode !== "normal" ? " · " + (MODE_NAME[x.mode] || x.mode) : ""}${parts.length ? "" : " (без записей)"}`);
    parts.forEach(p => L.push("  " + p));
    if (x.notes) L.push("  Заметки: " + x.notes);
  });
  const meas = [...S.measures.entries()].filter(([d]) => d >= from).sort();
  if (meas.length) { L.push("Замеры:"); meas.forEach(([d, m]) => L.push(`${dShort(d)}: ` + CFG.measures.filter(f => m[f.k] != null).map(f => `${f.label} ${fmt(m[f.k])}`).join(", "))); }
  return L.join("\n");
}
document.addEventListener("click", async e => {
  if (!$("#view-account") || $("#view-account").hidden) return;
  const t = e.target;
  const sw = t.closest("[data-switch]");
  if (sw) { saveProfile({ program: sw.dataset.switch }); useProgram(sw.dataset.switch); S.cur = null; renderAccount(); return; }
  if (t.id === "b-save") {
    const d = $("#b-start").value;
    if (!d) { $("#b-msg").textContent = "Выбери дату."; return; }
    S.bMsg = "Сохранено."; saveProfile({ blockStart: d }); S.cur = null; renderAccount(); return;
  }
  if (t.id === "b-small") { S.bMsg = t.checked ? "Шаг на штанге и поясе — 2,5 кг." : "Шаг на штанге и поясе — 5 кг."; saveProfile({ smallPlates: t.checked }); S.cur = null; renderAccount(); return; }
  if (t.id === "b-new") { S.bMsg = "Новый блок начинается сегодня."; saveProfile({ blockStart: today(), deloadWeeks: [] }); S.cur = null; renderAccount(); return; }
  if (t.id === "s-now") { Sync.run(); return; }
  if (t.id === "s-pick") { $("#file-in").value = ""; $("#file-in").click(); return; }
  if (t.id === "s-import-text") {
    const txt = $("#s-text").value.trim();
    if (!txt) { $("#s-msg").textContent = "Поле пустое: вставь текст."; return; }
    try { const n = importText(txt); $("#s-msg").textContent = n ? `Импортировано записей: ${n}.` : "В тексте не нашлось записей."; if (n) $("#s-text").value = ""; }
    catch (err) { $("#s-msg").textContent = "Текст не распознан: скопируй его целиком, от первой { до последней }."; }
    return;
  }
  if (t.id === "s-report") { await copyOut(buildReport(), $("#s-msg2"), "Отчёт скопирован. Вставь его в чат с Claude."); return; }
  if (t.id === "s-export") {
    const out = JSON.stringify({ app: "trainer", exportedAt: new Date().toISOString(), program: CFG.who, rows: Object.values(Store.rows).filter(r => !r.deleted && r.col !== "profile") });
    if (window.Capacitor) { await copyOut(out, $("#s-msg2"), "Все данные скопированы как текст. Вставь их в заметку или в чат."); return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([out], { type: "application/json" })); a.download = `trainer-${CFG.who}-${today()}.json`; document.body.appendChild(a); a.click(); a.remove();
    $("#s-msg2").textContent = "Файл сохранён в «Загрузки».";
    return;
  }
  if (t.id === "s-out") {
    if (S.delArm !== "logout") { S.delArm = "logout"; renderAccount(); return; }
    S.delArm = null; Auth.logout(); location.reload();
  }
});
$("#file-in").addEventListener("change", async e => {
  const f = e.target.files?.[0]; if (!f) return;
  const msg = () => $("#s-msg") || { set textContent(v) { notice(v); } };
  try { const n = importText(await f.text()); msg().textContent = n ? `Импортировано записей: ${n}.` : "В файле не нашлось записей."; }
  catch (err) { msg().textContent = "Не удалось прочитать файл: это должен быть .json из экспорта."; }
});

async function boot() {
  if (Auth.uid) { Store.load(); const p = Store.get("profile", "me"); if (p?.program) { startApp(p.program); Sync.run(); return; } await afterSignIn().catch(() => renderAuth("Нет связи с сервером. Проверь интернет и войди снова.", true)); return; }
  showShell(false); renderAuth();
}
if ("serviceWorker" in navigator && !window.Capacitor && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
boot();
