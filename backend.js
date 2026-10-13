/* =====================================================================
   Proyecto Integrador ADM1401 · Capa de datos para GitHub Pages
   ---------------------------------------------------------------------
   Dos modos de trabajo:
   · "sheets": si config.js trae la URL de Apps Script, todo se guarda en
     una Hoja de Google de la docente. Al entrar se elige PROFESOR (PIN o
     clave maestra) o EQUIPO (clave de seguridad del equipo). El servidor
     solo entrega los datos del equipo de esa clave, que se sincronizan
     cada pocos segundos entre sus integrantes.
   · "local": sin URL, la página funciona como demostración y guarda solo
     en el navegador que se esté usando.
   Expone window.claude.use("db" | "user" | "downloads") con la misma forma
   que usa la aplicación, y window.PI_BACKEND para estado, acceso docente
   y respaldos.
   ===================================================================== */
(function () {
  "use strict";
  var CFG = window.PI_CONFIG || {};
  var API = String(CFG.apiUrl || "").trim();
  var MODE = API ? "sheets" : "local";
  var K = { db: "pi-local-db-v1", queue: "pi-cola-v1", code: "pi-codigo", tok: "pi-docente-tok", key: "pi-clave", yo: "pi-yo" };
  var POLL_VISIBLE = (CFG.segundosSincronizacion || 5) * 1000, POLL_HIDDEN = 30000;

  /* ---------- utilidades ---------- */
  function lsg(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lss(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  /* La sesión (clave, PIN e integrante) dura mientras la pestaña esté abierta. */
  var MEM = {};
  function ssg(k) { try { var v = sessionStorage.getItem(k); if (v != null) return v; } catch (e) {} return MEM[k] == null ? null : MEM[k]; }
  function sss(k, v) { MEM[k] = v; try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} }
  function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }
  function merge(a, b) { var o = isObj(a) ? Object.assign({}, a) : {}; for (var k in b) { var v = b[k]; o[k] = isObj(v) ? merge(o[k], v) : v; } return o; }
  function clone(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }
  function parentOf(p) { return p.split("/").slice(0, -1).join("/"); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------- estado compartido ---------- */
  var docs = new Map();            // ruta del documento -> datos
  var listeners = new Set();       // {col, cb}
  var rev = 0;                     // última revisión recibida del servidor
  var code = "", tok = ssg(K.tok) || "", key = ssg(K.key) || "", yo = ssg(K.yo) || "", isDocente = false;
  lss(K.tok, null); lss(K.code, null);   // las versiones anteriores guardaban la sesión de forma permanente
  var status = { state: MODE === "local" ? "local" : "idle", msg: "" };
  var statusL = new Set();
  function setStatus(s, m) { if (status.state === s && status.msg === (m || "")) return; status = { state: s, msg: m || "", at: Date.now() }; statusL.forEach(function (f) { try { f(status); } catch (e) {} }); }

  function snapshot(col) {
    var out = [];
    docs.forEach(function (d, p) { if (parentOf(p) === col) out.push({ id: p.slice(col.length + 1), exists: true, data: (function (x) { return function () { return clone(x); }; })(d) }); });
    return { docs: out, size: out.length, empty: !out.length };
  }
  function emit(l) { try { l.cb(snapshot(l.col)); } catch (e) { console.error(e); } }
  function notify(paths) {
    var cols = new Set(paths.map(parentOf));
    listeners.forEach(function (l) { if (cols.has(l.col)) emit(l); });
  }
  function applyOp(op) {
    if (op.t === "delete") docs.delete(op.p);
    else if (op.t === "set") docs.set(op.p, clone(op.d) || {});
    else docs.set(op.p, merge(docs.get(op.p), op.d || {}));
  }

  /* =====================================================================
     MODO LOCAL
     ===================================================================== */
  function loadLocal() {
    try { var o = JSON.parse(lsg(K.db) || "{}"); Object.keys(o).forEach(function (p) { docs.set(p, o[p]); }); } catch (e) {}
  }
  var saveT = null;
  function saveLocal() {
    clearTimeout(saveT);
    saveT = setTimeout(function () { var o = {}; docs.forEach(function (d, p) { if (p.indexOf("locks/") !== 0) o[p] = d; }); lss(K.db, JSON.stringify(o)); }, 200);
  }

  /* =====================================================================
     MODO HOJA DE GOOGLE (Apps Script)
     ===================================================================== */
  var queue = [];                  // {op, res}
  try { JSON.parse(lsg(K.queue) || "[]").forEach(function (op) { queue.push({ op: op, res: null }); }); } catch (e) {}
  function persistQueue() { lss(K.queue, queue.length ? JSON.stringify(queue.map(function (q) { return q.op; })) : null); }

  function call(payload, attempt) {
    var body = Object.assign({ code: code, tok: tok, key: key, yo: yo }, payload);
    return fetch(API, { method: "POST", body: JSON.stringify(body), redirect: "follow" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .catch(function (e) {
        if ((attempt || 0) < 2) return sleep(800 * ((attempt || 0) + 1)).then(function () { return call(payload, (attempt || 0) + 1); });
        throw e;
      });
  }
  function getJSON(params) {
    var q = Object.keys(params).map(function (k) { return k + "=" + encodeURIComponent(params[k]); }).join("&");
    return fetch(API + (API.indexOf("?") < 0 ? "?" : "&") + q + "&code=" + encodeURIComponent(code) + "&tok=" + encodeURIComponent(tok) + "&key=" + encodeURIComponent(key) + "&yo=" + encodeURIComponent(yo), { redirect: "follow" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }

  /* --- escrituras: se agrupan, se guardan si no hay red y se reintentan --- */
  var flushT = null, inflight = false, backoff = 0;
  function enqueue(op) {
    applyOp(op); notify([op.p]);
    return new Promise(function (res) {
      queue.push({ op: op, res: res }); persistQueue(); setStatus("saving");
      clearTimeout(flushT); flushT = setTimeout(flush, 250);
    });
  }
  function flush() {
    if (inflight || !queue.length) return;
    inflight = true;
    var batch = queue.slice(0, 40);
    call({ a: "write", ops: batch.map(function (q) { return q.op; }) }).then(function (r) {
      if (!r || !r.ok) throw new Error((r && r.err) || "sin respuesta");
      queue.splice(0, batch.length); persistQueue(); backoff = 0;
      var changed = [];
      Object.keys(r.docs || {}).forEach(function (p) { var d = r.docs[p]; if (d == null) docs.delete(p); else docs.set(p, d); changed.push(p); });
      overlayPending(changed); if (changed.length) notify(changed);
      if (r.denied && r.denied.length) setStatus("error", r.msg ? r.msg : r.denied.some(function (x) { return /#org$/.test(x); }) ? "No se guardó la organización: otro equipo ya la eligió." : r.denied.some(function (x) { return /#rol$/.test(x); }) ? "No se guardó: cada integrante solo escribe el aporte de su propio rol." : r.denied.some(function (x) { return /\/w\/\d+$/.test(x); }) ? "No se guardó: el plazo de esa entrega ya cerró." : "Hay cambios que solo puede hacer la docente.");
      else setStatus(queue.length ? "saving" : "ok");
      batch.forEach(function (q) { q.res && q.res(); });
    }).catch(function (e) {
      if (/^(codigo|clave)$/.test(String(e && e.message))) { setStatus("error", "Tu clave ya no es válida: no se guardará nada más. Presiona «Salir» y entra con la clave vigente."); }
      else setStatus("offline");
      // Se resuelve para no bloquear la pantalla; la escritura sigue en cola.
      batch.forEach(function (q) { if (q.res) { q.res(); q.res = null; } });
      backoff = Math.min(30000, (backoff || 1500) * 2);
      setTimeout(flush, backoff);
    }).then(function () {
      inflight = false;
      if (queue.length && !backoff) { clearTimeout(flushT); flushT = setTimeout(flush, 250); }
    });
  }
  /* Espera a que se envíen las escrituras pendientes (máx. 8 s) antes de una acción del servidor. */
  function vaciarCola() {
    var t0 = Date.now();
    return new Promise(function (res) {
      (function check() {
        if (!queue.length || Date.now() - t0 > 8000 || status.state === "offline") return res();
        clearTimeout(flushT); flush(); setTimeout(check, 150);
      })();
    });
  }
  function overlayPending(paths) {
    var set = new Set(paths);
    queue.forEach(function (q) { if (set.has(q.op.p)) applyOp(q.op); });
  }

  /* --- lecturas: sondeo de cambios desde la última revisión --- */
  var pollT = null, polling = false;
  function poll() {
    if (polling) return Promise.resolve();
    polling = true; clearTimeout(pollT);
    return getJSON({ a: "since", v: rev }).then(function (r) {
      if (!r || !r.ok) throw new Error((r && r.err) || "sin respuesta");
      var changed = [];
      if (r.full) { docs.forEach(function (d, p) { changed.push(p); }); docs.clear(); }
      (r.docs || []).forEach(function (pair) { var p = pair[0], d = pair[1]; if (d == null) docs.delete(p); else docs.set(p, d); changed.push(p); });
      if (r.rev != null) rev = r.rev;
      overlayPending(changed);
      if (changed.length) notify(changed);
      if (status.state === "offline" || status.state === "idle") setStatus(queue.length ? "saving" : "ok");
      if (queue.length && !inflight) flush();
    }).catch(function (e) {
      if (/^(codigo|clave)$/.test(String(e && e.message))) setStatus("error", "Tu clave ya no es válida: no se guardará nada más. Presiona «Salir» y entra con la clave vigente.");
      else setStatus("offline");
    }).then(function () { polling = false; schedule(); });
  }
  function schedule() {
    clearTimeout(pollT);
    pollT = setTimeout(poll, document.hidden ? POLL_HIDDEN : POLL_VISIBLE);
  }
  document.addEventListener("visibilitychange", function () { if (MODE === "sheets" && !document.hidden) poll(); });
  window.addEventListener("online", function () { if (MODE === "sheets") { backoff = 0; flush(); poll(); } });
  window.addEventListener("beforeunload", function (e) { if (MODE === "sheets" && queue.length && status.state === "saving") { e.preventDefault(); e.returnValue = ""; } });

  /* =====================================================================
     API con la forma que espera la aplicación
     ===================================================================== */
  function docRef(path) {
    return {
      id: path.split("/").pop(),
      get: function () {
        if (MODE === "local") { var d = docs.get(path); return Promise.resolve({ exists: d != null, id: path.split("/").pop(), data: function () { return clone(d); } }); }
        return call({ a: "get", p: path }).then(function (r) {
          if (r && r.err === "privacidad") throw new Error(r.msg || "Acceso restringido.");
          if (!r || !r.ok) throw new Error((r && r.err) || "error");
          if (r.exists) docs.set(path, r.data); else docs.delete(path);
          overlayPending([path]);
          var d = docs.get(path);
          return { exists: d != null, id: path.split("/").pop(), data: function () { return clone(d); } };
        });
      },
      set: function (d) { return write({ t: "set", p: path, d: d }); },
      update: function (d) { return write({ t: "update", p: path, d: d }); },
      delete: function () { return write({ t: "delete", p: path }); },
      acquire: function (o) {
        if (MODE === "local") return Promise.resolve({ acquired: true });
        return call({ a: "acquire", p: path, holder: (o && o.holder) || "x", ttl: (o && o.ttlMs) || 5000 }).then(function (r) { return { acquired: !!(r && r.ok && r.acquired) }; });
      }
    };
  }
  function write(op) {
    if (MODE === "local") { applyOp(op); notify([op.p]); saveLocal(); return Promise.resolve(); }
    return enqueue(op);
  }
  var dbApi = {
    collection: function (col) {
      return {
        onSnapshot: function (cb) { var l = { col: col, cb: cb }; listeners.add(l); setTimeout(function () { emit(l); }, 0); return function () { listeners.delete(l); }; }
      };
    },
    doc: docRef
  };
  var userApi = { canEdit: function () { return Promise.resolve(isDocente); } };

  /* --- descargas desde el navegador (PDF y CSV) --- */
  var dlApi = {
    save: function (o) {
      var d = o.data, b = d instanceof Blob ? d : new Blob([d], { type: /\.pdf$/i.test(o.filename) ? "application/pdf" : /\.json$/i.test(o.filename) ? "application/json" : "text/csv;charset=utf-8" });
      var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = o.filename || "archivo";
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      return Promise.resolve();
    }
  };

  /* =====================================================================
     Arranque: código personal (alumno) o PIN (docente) y primera carga
     ===================================================================== */
  var readyRes; var ready = new Promise(function (r) { readyRes = r; });
  var info = { roster: null, hoja: "" };
  var sess = { rol: MODE === "local" ? "local" : "", nombre: "", grupo: "", equipo: 0, me: "", pub: null, max: 6 };

  function esc(t) { return String(t || "").replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  /* Pantalla de acceso: primero el tipo de usuario, después su clave. */
  function gate(msg, modo) {
    var root = document.getElementById("root");
    var top = '<header class="top"><h1>Proyecto Integrador ADM1401</h1><p>Universidad Anáhuac Cancún · ADM1401 Introducción a la Empresa</p></header>';
    var aviso = msg ? '<p class="pill ko" role="alert" style="white-space:normal;display:block;padding:8px 12px;margin-top:10px">🔒 ' + esc(msg) + '</p>' : '';
    if (!modo) {
      root.innerHTML = top + '<main><div class="card" style="max-width:560px;margin:24px auto;border-color:var(--or)"><h2>¿Cómo ingresas?</h2>' +
        '<p class="mut sm">Elige tu tipo de acceso. Cada equipo trabaja solo en su espacio, protegido con su clave.</p>' +
        '<div class="grid"><button class="opt" id="g-prof" style="min-height:96px"><b style="font-size:1.1rem">🎓 PROFESOR</b><span class="mut sm">Clave maestra · ve los dos grupos, todos los equipos y sus claves</span></button>' +
        '<button class="opt" id="g-eq" style="min-height:96px"><b style="font-size:1.1rem">👥 EQUIPO</b><span class="mut sm">Clave de tu equipo · solo tu equipo</span></button></div>' + aviso + '</div></main>';
      document.getElementById("g-prof").onclick = function () { gate("", "docente"); };
      document.getElementById("g-eq").onclick = function () { gate("", "equipo"); };
      return;
    }
    var docente = modo === "docente";
    root.innerHTML = top + '<main><form class="card" id="gate" style="max-width:460px;margin:24px auto;border-color:var(--or)">' +
      (docente
        ? '<h2>🎓 Acceso de PROFESOR</h2><label class="l" for="g-pin">Clave maestra (PIN docente)</label><input id="g-pin" type="password" autocomplete="current-password" required>'
        : '<h2>👥 Acceso de EQUIPO</h2><p class="mut">Escribe la clave de seguridad que la docente le dio a tu equipo. Solo abre tu equipo.</p>' +
          '<label class="l" for="g-cod">Clave del equipo</label><input id="g-cod" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXX-XXX-XXX" required style="letter-spacing:.12em;font-weight:700">') +
      aviso +
      '<div class="bar" style="margin-top:10px"><button class="btn" type="submit">Entrar</button>' +
      '<button class="btn alt sm" type="button" id="g-alt">← Cambiar tipo de acceso</button></div>' +
      (docente ? '' : '<p class="sm mut" style="margin-top:12px">Después confirmarán a los integrantes y su rol directivo. Si usas una computadora compartida, al terminar presiona «Salir».</p>') +
      '</form></main>';
    var f = document.getElementById("gate"), i = document.getElementById(docente ? "g-pin" : "g-cod"), b = f.querySelector("button[type=submit]");
    i.focus();
    document.getElementById("g-alt").onclick = function () { gate("", ""); };
    f.onsubmit = function (e) {
      e.preventDefault(); b.disabled = true; b.textContent = "Verificando…";
      if (docente) {
        call({ a: "login", pin: i.value.trim() }).then(function (r) {
          if (r && r.ok && r.tok) { tok = r.tok; sss(K.tok, tok); code = ""; key = ""; yo = ""; sss(K.key, null); sss(K.yo, null); hello(); }
          else gate("Clave maestra incorrecta. Acceso denegado.", "docente");
        }).catch(function () { gate("No se pudo conectar. Revisa tu internet.", "docente"); });
      } else { key = i.value.trim(); tok = ""; code = ""; yo = ""; sss(K.tok, null); sss(K.yo, null); hello("equipo"); }
    };
  }
  function hello(modo) {
    getJSON({ a: "hello" }).then(function (r) {
      if (!r || !r.ok) {
        if (r && (r.err === "codigo" || r.err === "clave")) {
          var habia = !!(code || tok || key);
          sss(K.key, null); sss(K.tok, null); sss(K.yo, null); lss(K.code, null); code = ""; tok = ""; key = ""; yo = "";
          return gate(habia ? (modo === "equipo" || r.err === "clave" ? "Clave incorrecta. Acceso denegado." : "La sesión ya no es válida. Vuelve a entrar.") : "", habia ? (modo || "equipo") : "");
        }
        throw new Error((r && r.err) || "error");
      }
      if (key) sss(K.key, key);
      if (yo && !r.me) { yo = ""; sss(K.yo, null); }   // el integrante ya no está en el equipo
      isDocente = r.rol === "docente";
      sess = { rol: r.rol, nombre: r.nombre || "", grupo: r.grupo || "", equipo: r.equipo || 0, me: r.me || "", pub: r.pub || null, max: r.max || 6, clave: !!r.clave, claves: r.claves || null };
      info.roster = r.roster || null; info.hoja = r.hoja || ""; info.limites = r.limites || null;
      return poll().then(function () { setStatus(queue.length ? "saving" : "ok"); if (queue.length) flush(); readyRes(); });
    }).catch(function (e) {
      gate("No se pudo conectar con el servidor. Revisa tu internet e inténtalo de nuevo." + (e && e.message && e.message !== "Failed to fetch" ? " (" + e.message + ")" : ""), "");
    });
  }

  function init() {
    if (MODE === "local") {
      /* Publicada sin apiUrl: avisar en lugar de entrar en silencio a la demostración. */
      var esLocal = /^(localhost|127\.0\.0\.1|)$/.test(location.hostname) || location.protocol === "file:";
      if (!esLocal && !new URLSearchParams(location.search).has("demo")) {
        document.getElementById("root").innerHTML = '<header class="top"><h1>Proyecto Integrador ADM1401</h1><p>Universidad Anáhuac Cancún · ADM1401 Introducción a la Empresa</p></header>' +
          '<main><div class="card" role="alert" style="max-width:560px;margin:24px auto;border-color:var(--or)"><h2>⚠️ La página no está conectada</h2>' +
          '<p>Todavía no se puede capturar: lo que escribas no se guardaría ni lo vería tu equipo. <b>Avisa a la docente.</b></p>' +
          '<p class="sm mut">Docente: falta pegar la URL /exec de Apps Script en <code>config.js</code> → <code>apiUrl</code>.</p>' +
          '<p class="sm"><a href="?demo">Abrir la demostración de todos modos (solo guarda en este navegador)</a></p></div></main>';
        return ready.then(function () { return info; });
      }
      loadLocal();
      isDocente = lsg(K.tok) === "local";
      info.roster = CFG.listaLocal || null;
      readyRes();
      return ready.then(function () { return info; });
    }
    var u = new URLSearchParams(location.search), qc = u.get("codigo"), qk = u.get("clave");
    if (qk) { key = qk.trim(); tok = ""; yo = ""; sss(K.tok, null); sss(K.yo, null); }
    if (qc) { code = qc.trim(); tok = ""; }
    if (qk || qc) { u.delete("clave"); u.delete("codigo"); history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u : "") + location.hash); }
    var dq = u.has("docente");
    if (code || tok || key) hello(key ? "equipo" : ""); else gate("", dq ? "docente" : "");
    return ready.then(function () { return info; });
  }

  window.claude = {
    use: function (n) {
      if (n === "db") return ready.then(function () { return dbApi; });
      if (n === "user") return ready.then(function () { return userApi; });
      if (n === "downloads") return Promise.resolve(dlApi);
      return Promise.resolve(null);
    }
  };

  window.PI_BACKEND = {
    mode: MODE,
    init: init,
    status: function () { return status; },
    onStatus: function (f) { statusL.add(f); return function () { statusL.delete(f); }; },
    isDocente: function () { return isDocente; },
    session: function () { return sess; },
    hoja: function () { return info.hoja; },
    login: function (pin) {
      if (MODE === "local") { if (String(pin).trim() !== String(CFG.pinLocal || "demo")) return Promise.resolve({ ok: false }); lss(K.tok, "local"); return Promise.resolve({ ok: true }); }
      return call({ a: "login", pin: String(pin).trim() }).then(function (r) { if (r && r.ok && r.tok) { tok = r.tok; lss(K.tok, tok); lss(K.code, null); return { ok: true }; } return { ok: false }; });
    },
    logout: function () { tok = ""; lss(K.tok, null); },
    salir: function () { sss(K.key, null); sss(K.tok, null); sss(K.yo, null); lss(K.code, null); lss(K.tok, null); lss(K.queue, null);
      try { Object.keys(sessionStorage).forEach(function (k) { if (/^pi-/.test(k)) sessionStorage.removeItem(k); }); } catch (e) {} try { Object.keys(localStorage).forEach(function (k) { if (/^pi-/.test(k)) localStorage.removeItem(k); }); } catch (e) {} location.replace(location.pathname); },
    /* Integrante que captura (lo confirma el equipo tras entrar con su clave; el servidor lo valida). */
    setYo: function (id) { yo = String(id || ""); sss(K.yo, yo || null); sess.me = yo; },
    /* Docente: genera una nueva clave para un equipo; la anterior deja de funcionar. */
    nuevaClave: MODE === "sheets" ? function (t) {
      return call({ a: "nuevaClave", t: t }).then(function (r) { if (r && r.ok && sess.claves) sess.claves[t] = r.clave; return r && r.ok ? r : { ok: false, msg: (r && (r.msg || r.err)) || "No se pudo generar la clave." }; });
    } : null,
    /* El alumno se une a un equipo de su grupo (lo valida el servidor). */
    join: MODE === "sheets" ? function (t) {
      return call({ a: "join", t: t }).then(function (r) {
        if (r && r.ok) { sess.equipo = r.equipo; sess.me = r.me; sess.pub = null; rev = 0; return poll().then(function () { return r; }); }
        return { ok: false, msg: (r && (r.msg || r.err)) || "No se pudo registrar." };
      });
    } : null,
    /* Sorteo A y B: lo hace el servidor para que ninguna organización se repita. */
    draw: MODE === "sheets" ? function (t, pool) {
      return vaciarCola().then(function () { return call({ a: "draw", t: t, pool: pool }); }).then(function (r) { return poll().then(function () { return r && r.ok ? r : { ok: false, msg: (r && (r.msg || r.err)) || "No se pudo completar el sorteo." }; }); });
    } : null,
    /* Docente: agrega o quita a un alumno de un equipo (la hoja «Alumnos» se actualiza sola). */
    asignar: MODE === "sheets" ? function (o) {
      return call({ a: "asignar", id: o.id || "", nombre: o.nombre || "", eq: o.eq || 0 }).then(function (r) { return poll().then(function () { return r && r.ok ? r : { ok: false, msg: (r && (r.msg || r.err)) || "No se pudo guardar el cambio." }; }); });
    } : null,
    refrescar: function () { return MODE === "sheets" ? poll() : Promise.resolve(); },
    exportAll: function () { var o = {}; docs.forEach(function (d, p) { if (p.indexOf("locks/") !== 0) o[p] = d; }); return { app: "PI-ADM1401", version: 1, fecha: new Date().toISOString(), modo: MODE, docs: o }; },
    importAll: function (obj) {
      if (!obj || !obj.docs) return Promise.reject(new Error("Archivo no válido"));
      var paths = Object.keys(obj.docs);
      if (MODE === "local") { docs.clear(); paths.forEach(function (p) { docs.set(p, obj.docs[p]); }); saveLocal(); return Promise.resolve(paths.length); }
      return Promise.all(paths.map(function (p) { var d = Object.assign({}, obj.docs[p]); delete d.mem; return write({ t: "set", p: p, d: d }); })).then(function () { return paths.length; });
    },
    download: dlApi.save
  };
})();
