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
    if (S.view === "account") renderAccount();
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
  Store.write("profile", "me", { program: b.dataset.prog }, false);
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
    Store.on("profile", () => { const p = Store.get("profile", "me"); if (p?.program && p.program !== CFG.who) { useProgram(p.program); S.cur = null; render(); } });
  }
  route(); Sync.show();
}
function onSignedOut() { renderAuth("Сессия закончилась. Войди снова."); showShell(false); }
function sub(col, apply) { LocalDB.collection(col).onSnapshot(snap => { apply(snap); onData(); }); }

function renderAccount() {
  const v = $("#view-account"); if (!v || v.hidden) return;
  const n = Store.pending();
  v.innerHTML = `<div class="card"><h2>Аккаунт</h2>
    <p>${esc(Auth.email)}</p>
    <p class="small muted">Программа: <b>${esc(CFG.name)}</b></p>
    <div class="row">${Object.values(window.PROGRAMS).filter(p => p.who !== CFG.who).map(p => `<button type="button" class="btn" data-switch="${esc(p.who)}">Переключить на программу «${esc(p.name)}»</button>`).join("")}</div>
  </div>
  <div class="card"><h2>Синхронизация</h2>
    <p class="small">${Sync.busy ? "Идёт синхронизация…" : Sync.err ? "Последняя попытка не удалась" + (navigator.onLine ? "" : ": нет интернета") + "." : Sync.last ? "Последняя синхронизация: " + new Date(Sync.last).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "Ещё не было."}</p>
    <p class="small muted">Ждут отправки: ${n}. Всё, что ты вводишь, сначала сохраняется на устройстве, поэтому в зале можно работать без интернета.</p>
    <div class="row"><button type="button" class="btn primary" id="s-now">Синхронизировать сейчас</button></div></div>
  <div class="card"><h2>Резервная копия</h2>
    <p class="small muted">Импорт добавляет записи из файла .json. Записи с той же датой и тренировкой заменяются.</p>
    <div class="row"><label class="btn" for="s-file">Импортировать файл</label><input type="file" id="s-file" accept=".json,application/json" hidden><button type="button" class="btn" id="s-export">Экспорт в файл</button></div>
    <p class="small muted" id="s-msg"></p></div>
  <div class="card"><h2>Выход</h2><p class="small muted">Данные, которые ещё не отправлены, будут потеряны. Сейчас таких: ${n}.</p>
    <div class="row"><button type="button" class="btn danger" id="s-out">${S.delArm === "logout" ? "Точно выйти?" : "Выйти"}</button></div></div>`;
}
document.addEventListener("click", e => {
  if (!$("#view-account") || $("#view-account").hidden) return;
  const t = e.target;
  const sw = t.closest("[data-switch]");
  if (sw) { Store.write("profile", "me", { program: sw.dataset.switch }, false); useProgram(sw.dataset.switch); S.cur = null; renderAccount(); return; }
  if (t.id === "s-now") { Sync.run(); return; }
  if (t.id === "s-export") {
    const out = { app: "trainer", exportedAt: new Date().toISOString(), program: CFG.who, rows: Object.values(Store.rows).filter(r => !r.deleted && r.col !== "profile") };
    const blob = new Blob([JSON.stringify(out, null, 1)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `trainer-${CFG.who}-${today()}.json`; document.body.appendChild(a); a.click(); a.remove();
    $("#s-msg").textContent = "Файл сохранён в «Загрузки».";
    return;
  }
  if (t.id === "s-out") {
    if (S.delArm !== "logout") { S.delArm = "logout"; renderAccount(); return; }
    S.delArm = null; Auth.logout(); location.reload();
  }
});
document.addEventListener("change", async e => {
  if (e.target.id !== "s-file") return;
  const f = e.target.files?.[0]; if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    const rows = Array.isArray(j.rows) ? j.rows : [];
    let n = 0;
    rows.forEach(r => { if (r && r.col && r.id && r.data && ["sessions", "daily", "measures", "cardio"].includes(r.col)) { Store.write(r.col, String(r.id), r.data, false); n++; } });
    $("#s-msg").textContent = n ? `Импортировано записей: ${n}.` : "В файле не нашлось записей.";
  } catch (err) { $("#s-msg").textContent = "Не удалось прочитать файл: это должен быть .json из экспорта."; }
});

async function boot() {
  if (Auth.uid) { Store.load(); const p = Store.get("profile", "me"); if (p?.program) { startApp(p.program); Sync.run(); return; } await afterSignIn().catch(() => renderAuth("Нет связи с сервером. Проверь интернет и войди снова.", true)); return; }
  showShell(false); renderAuth();
}
if ("serviceWorker" in navigator && !window.Capacitor && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
boot();
