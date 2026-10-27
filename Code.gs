/* =====================================================================
   Proyecto Integrador ADM1401 · Servidor en Google Apps Script
   ---------------------------------------------------------------------
   Guarda en esta Hoja de Google lo que capturan los equipos en la página
   de GitHub Pages. Al entrar se elige PROFESOR o EQUIPO:
   · EQUIPO: cada uno de los 10 equipos tiene una CLAVE ÚNICA (hoja «Equipos»).
     Con ella el servidor solo entrega y deja modificar SU equipo; con una
     clave equivocada, o hacia otro equipo, niega el acceso de inmediato.
     Antes de capturar, el equipo confirma integrantes y roles directivos.
   · PROFESOR: el PIN docente es la clave maestra: ve y modifica todo, de los
     dos grupos, y consulta las claves de todos los equipos.

   PRIMERA VEZ (ver GUIA-INSTALACION.md):
   1. Cambia PIN_DOCENTE y URL_PAGINA aquí abajo.
   2. Ejecuta la función  configurar   (▶ Ejecutar).
   3. Implementa como aplicación web: Ejecutar como «Yo», acceso «Cualquier usuario».
   4. Copia la URL que termina en /exec y pégala en config.js del sitio.
   ===================================================================== */

// ⚙️ Cambia estos valores antes de ejecutar «configurar».
var PIN_DOCENTE = "cambia-este-pin";   // ⚠️ Escribe tu PIN SOLO en Apps Script, nunca en GitHub. Tras ejecutar «configurar» queda guardado y puedes volver a dejar "cambia-este-pin".
var URL_PAGINA  = "https://taniariveraanahuac-creator.github.io/Proyecto-integrador-A/"; // liga de GitHub Pages (para los correos)
var MAX_EQUIPO  = 6;                   // integrantes máximos por equipo
var PERMITIR_CODIGO_PERSONAL = false;  // true = también aceptar los códigos personales de versiones anteriores

var HOJA_DATOS = "datos", HOJA_ALUMNOS = "Alumnos", HOJA_RESUMEN = "Resumen", HOJA_EQUIPOS = "Equipos";
var MAX_CELDA = 49000;
var GRUPOS = { L: { n: "Liderazgo", off: 0 }, A: { n: "Administración", off: 5 } };
// Columnas de la hoja «Alumnos»
var C_GRUPO = 1, C_AP = 2, C_NOM = 3, C_COD = 4, C_EQ = 5, C_CORREO = 6, C_ENVIO = 7;

/* ---------- Puntos de entrada de la aplicación web ---------- */
function doGet(e) { return responder_((e && e.parameter) || {}); }
function doPost(e) {
  var b = {};
  try { b = JSON.parse((e && e.postData && e.postData.contents) || "{}"); } catch (x) {}
  return responder_(b);
}
function salida_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function responder_(q) {
  try {
    if (!PropertiesService.getScriptProperties().getProperty("SAL")) return salida_({ ok: false, err: "Falta ejecutar la función configurar en Apps Script." });
    if (q.a === "login") return salida_(entrar_(String(q.pin || "")));
    var yo = quien_(q);
    if (!yo) { Utilities.sleep(800); return salida_({ ok: false, err: q.key ? "clave" : "codigo", msg: q.key ? "Clave incorrecta. Acceso denegado." : "" }); }
    switch (q.a) {
      case "hello":   return salida_(hola_(yo));
      case "since":   return salida_(desde_(yo, Number(q.v) || 0));
      case "get":     return salida_(leerDoc_(yo, String(q.p || "")));
      case "write":   return salida_(escribir_(yo, q.ops || []));
      case "acquire": return salida_(yo.rol === "docente" ? apartar_(String(q.p || ""), String(q.holder || ""), Number(q.ttl) || 5000) : { ok: true, acquired: false });
      case "join":    return salida_(unirse_(yo, Number(q.t)));
      case "draw":    return salida_(sortear_(yo, Number(q.t), q.pool || []));
      case "asignar": return salida_(asignar_(yo, String(q.id || ""), String(q.nombre || ""), Number(q.eq) || 0));
      case "calendario": return salida_(yo.rol === "docente" ? guardarCalendario_(q.fechas) : { ok: false, err: "privacidad", msg: MSG_PRIVACIDAD });
      case "cierre":  return salida_(yo.rol === "docente" ? guardarCierre_(q.fecha) : { ok: false, err: "privacidad", msg: MSG_PRIVACIDAD });
      case "nuevaClave": return salida_(yo.rol === "docente" ? nuevaClave_(Number(q.t)) : { ok: false, err: "privacidad", msg: MSG_PRIVACIDAD });
      default:        return salida_({ ok: false, err: "Acción desconocida" });
    }
  } catch (err) {
    return salida_({ ok: false, err: String(err && err.message || err) });
  }
}

/* ---------- Identidad: docente (token de la clave maestra) o equipo (clave del equipo) ---------- */
function normCod_(c) { return String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }
function quien_(q) {
  if (q.tok && q.tok === tokenDocente_()) return { rol: "docente" };
  var k = normCod_(q.key);
  if (k) {
    var eq = claves_().porClave[k];
    if (!eq) return null;
    var g = eq > 5 ? "A" : "L", yoId = String(q.yo || ""), m = null;
    // Integrante que captura: debe pertenecer a ESTE equipo (si no, la sesión queda como «equipo» sin nombre).
    if (yoId) m = alumnos_().lista.filter(function (x) { return x.id === yoId && x.eq === eq; })[0] || null;
    return { rol: "alumno", clave: true, a: m ? m : { fila: 0, g: g, ap: "", no: "", n: "Equipo " + ((eq - 1) % 5 + 1), eq: eq, id: "" } };
  }
  if (!PERMITIR_CODIGO_PERSONAL) return null;
  var c = normCod_(q.code);
  if (c.length < 6) return null;
  var a = alumnos_().porCodigo[c];
  return a ? { rol: "alumno", a: a } : null;
}

/* ---------- Claves de seguridad por equipo (hoja «Equipos») ---------- */
function hojaEquipos_() {
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(HOJA_EQUIPOS);
  if (!sh) {
    sh = ss.insertSheet(HOJA_EQUIPOS);
    sh.getRange(1, 1, 1, 5).setValues([["Grupo", "Equipo (1-10)", "Equipo en su grupo", "Clave del equipo", "Generada"]]).setFontWeight("bold").setBackground("#f37021").setFontColor("#ffffff");
    var filas = []; for (var n = 1; n <= 10; n++) filas.push([n <= 5 ? "Liderazgo" : "Administración", n, (n - 1) % 5 + 1, "", ""]);
    sh.getRange(2, 1, 10, 5).setValues(filas); sh.setFrozenRows(1);
  }
  return sh;
}
function claves_() {
  var cache = CacheService.getScriptCache(), c = cache.get("claves");
  if (c) return JSON.parse(c);
  var o = { porClave: {}, porEquipo: {} }, sh = SpreadsheetApp.getActive().getSheetByName(HOJA_EQUIPOS);
  if (sh && sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues().forEach(function (r) {
    var n = Number(r[1]), k = normCod_(r[3]);
    if (n >= 1 && n <= 10 && k.length >= 9) { o.porClave[k] = n; o.porEquipo[n] = String(r[3]).trim(); }
  });
  cache.put("claves", JSON.stringify(o), 600);
  return o;
}
function claveNueva_(usadas) {
  var ab = "ABCDEFGHJKMNPQRSTUVWXYZ23456789", c;
  do { c = ""; for (var i = 0; i < 9; i++) c += ab.charAt(Math.floor(Math.random() * ab.length)); } while (usadas[c]);
  usadas[c] = 1;
  return c.slice(0, 3) + "-" + c.slice(3, 6) + "-" + c.slice(6);
}
/* Pone una clave a cada equipo que no la tenga. Para cambiar una clave, bórrala y vuelve a ejecutar esta función. */
function generarClavesEquipo() {
  var sh = hojaEquipos_(), v = sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues(), usadas = {}, nuevas = 0;
  v.forEach(function (r) { if (r[3]) usadas[normCod_(r[3])] = 1; });
  v.forEach(function (r) { if (!r[3] && Number(r[1]) >= 1) { r[3] = claveNueva_(usadas); r[4] = new Date(); nuevas++; } });
  sh.getRange(2, 1, v.length, 5).setValues(v);
  CacheService.getScriptCache().remove("claves");
  Logger.log("Claves nuevas: " + nuevas);
  try { SpreadsheetApp.getActive().toast("Claves nuevas: " + nuevas + ". Están en la hoja «Equipos».", "Proyecto Integrador", 8); } catch (x) {}
}
/* Docente: reemplaza la clave de un equipo (la anterior deja de funcionar al instante). */
function nuevaClave_(eq) {
  if (!(eq >= 1 && eq <= 10)) return { ok: false, msg: "Equipo no válido." };
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh = hojaEquipos_(), v = sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues(), usadas = {}, k = "";
    v.forEach(function (r) { if (r[3]) usadas[normCod_(r[3])] = 1; });
    v.forEach(function (r, i) { if (Number(r[1]) === eq) { k = claveNueva_(usadas); sh.getRange(i + 2, 4, 1, 2).setValues([[k, new Date()]]); } });
    CacheService.getScriptCache().remove("claves");
    return k ? { ok: true, clave: k } : { ok: false, msg: "No encontré ese equipo en la hoja «Equipos»." };
  } finally { lock.releaseLock(); }
}
function idMiembro_(cod) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, cod + "|" + PropertiesService.getScriptProperties().getProperty("SAL"), Utilities.Charset.UTF_8);
  return "m" + Utilities.base64EncodeWebSafe(b).replace(/[^A-Za-z0-9]/g, "").slice(0, 10);
}
/* Lista de alumnos (hoja «Alumnos»), guardada unos minutos en caché. */
function alumnos_() {
  var cache = CacheService.getScriptCache(), c = cache.get("alumnos");
  if (c) return JSON.parse(c);
  var sh = SpreadsheetApp.getActive().getSheetByName(HOJA_ALUMNOS), out = { lista: [], porCodigo: {} };
  if (sh && sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, C_EQ).getValues().forEach(function (r, i) {
      var g = String(r[0] || "").trim().toUpperCase().charAt(0), ap = String(r[1] || "").trim(), no = String(r[2] || "").trim(), cod = normCod_(r[3]);
      if (!GRUPOS[g] || !(ap || no)) return;
      var eq = Number(r[4]) || 0;
      if (eq && (eq <= GRUPOS[g].off || eq > GRUPOS[g].off + 5)) eq = 0; // equipo fuera de su grupo
      var a = { fila: i + 2, g: g, ap: ap, no: no, n: (no + " " + ap).trim(), eq: eq, id: cod ? idMiembro_(cod) : "" };
      out.lista.push(a);
      if (cod) out.porCodigo[cod] = a;
    });
  }
  cache.put("alumnos", JSON.stringify(out), 600);
  return out;
}
function miembros_(eq) {
  var o = {};
  alumnos_().lista.forEach(function (a) { if (a.eq === eq && a.id) o[a.id] = { n: a.n, t: a.fila }; });
  return o;
}
function conteos_(g) {
  var o = {};
  for (var i = 1; i <= 5; i++) o[GRUPOS[g].off + i] = 0;
  alumnos_().lista.forEach(function (a) { if (a.g === g && a.eq) o[a.eq] = (o[a.eq] || 0) + 1; });
  return o;
}
/* Para elegir equipo: solo si hay lugar (true) o está completo (false); nunca cuántos ni quiénes. */
function lugares_(g) { var c = conteos_(g), o = {}; Object.keys(c).forEach(function (k) { o[k] = (c[k] || 0) < MAX_EQUIPO; }); return o; }
function hola_(yo) {
  if (yo.rol === "docente") {
    var r = {}; alumnos_().lista.forEach(function (a) { (r[a.g] = r[a.g] || []).push([a.ap, a.no]); });
    return { ok: true, rol: "docente", roster: r, rev: revActual_(), hoja: SpreadsheetApp.getActive().getUrl(), limites: limitesApi_(), claves: claves_().porEquipo };
  }
  var a = yo.a;
  return { ok: true, rol: "alumno", clave: !!yo.clave, nombre: a.id ? a.n : "", grupo: a.g, equipo: a.eq || 0, me: a.id, max: MAX_EQUIPO, pub: a.eq ? null : lugares_(a.g), rev: revActual_(), limites: limitesApi_() };
}

/* ---------- Almacén: una fila por documento en la hoja «datos» ---------- */
function hojaDatos_() {
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(HOJA_DATOS);
  if (!sh) { sh = ss.insertSheet(HOJA_DATOS); sh.getRange(1, 1, 1, 4).setValues([["ruta", "json", "rev", "actualizado"]]).setFontWeight("bold"); sh.setFrozenRows(1); }
  return sh;
}
function leerTodo_() {
  var sh = hojaDatos_(), n = sh.getLastRow() - 1, filas = {};
  if (n > 0) sh.getRange(2, 1, n, 3).getValues().forEach(function (r, i) { if (r[0]) filas[r[0]] = { fila: i + 2, json: r[1], rev: Number(r[2]) || 0 }; });
  return { sh: sh, filas: filas };
}
function revActual_() {
  var c = CacheService.getScriptCache().get("rev");
  if (c != null) return Number(c);
  var v = Number(PropertiesService.getScriptProperties().getProperty("REV")) || 0;
  CacheService.getScriptCache().put("rev", String(v), 21600);
  return v;
}
function subirRev_() {
  var P = PropertiesService.getScriptProperties(), v = (Number(P.getProperty("REV")) || 0) + 1;
  P.setProperty("REV", String(v)); CacheService.getScriptCache().put("rev", String(v), 21600);
  return v;
}
function parse_(s) { if (!s) return null; try { return JSON.parse(s); } catch (e) { return null; } }

/* =====================================================================
   POLÍTICA DE ACCESO
   · DOCENTE (PIN): ve y modifica todo, de los dos grupos y de todos los equipos.
   · EQUIPO (clave del equipo): solo ve y modifica lo de SU equipo
     (teams/<n>, teams/<n>/w/*, grades/<n> solo lectura y sorteo/* de su equipo).
     No recibe nada que permita ver o deducir datos de otro equipo: ni integrantes,
     ni organizaciones sorteadas o propuestas, ni cuántos integrantes tiene.
   Cualquier intento de leer o escribir fuera de su equipo se rechaza con
   un mensaje de restricción de privacidad.
   ===================================================================== */
var MSG_PRIVACIDAD = "Acceso restringido: esa información pertenece a otro equipo. Solo puedes consultar y modificar la de tu equipo.";
/* ¿Qué rutas puede ver o modificar cada quien? */
function equipoDeRuta_(p) { var m = /^(?:teams|grades)\/(\d+)(?:\/|$)/.exec(p); return m ? Number(m[1]) : 0; }
function puedeVer_(yo, p, d) {
  if (yo.rol === "docente") return true;
  if (!yo.a.eq) return false;
  if (p.indexOf("sorteo/") === 0) return !!d && d.t === yo.a.eq;   // solo las organizaciones sorteadas para SU equipo
  return equipoDeRuta_(p) === yo.a.eq;
}
/* Documento del equipo con sus integrantes tomados de la hoja «Alumnos». */
function vista_(yo, p, d) {
  if (/^teams\/\d+$/.test(p)) { d = d || {}; d.mem = miembros_(Number(p.split("/")[1])); return d; }
  return d;
}

function desde_(yo, v) {
  var actual = revActual_();
  if (v >= actual && v > 0) return { ok: true, rev: actual, docs: [], limites: limitesApi_() };
  var t = leerTodo_(), out = [], vistos = {};
  if (yo.rol === "docente") {
    Object.keys(t.filas).forEach(function (p) {
      var f = t.filas[p]; if (p.indexOf("locks/") === 0 || f.rev <= v) return;
      var d = parse_(f.json); if (d == null && !v) return;
      out.push([p, d == null ? null : vista_(yo, p, d)]); vistos[p] = 1;
    });
    for (var n = 1; n <= 10; n++) { var tp = "teams/" + n; if (!vistos[tp]) out.push([tp, vista_(yo, tp, t.filas[tp] ? parse_(t.filas[tp].json) : null)]); }
    return { ok: true, rev: actual, docs: out, limites: limitesApi_() };
  }
  // Alumno: se envía completo su propio alcance (son pocos documentos).
  Object.keys(t.filas).forEach(function (p) {
    var d = parse_(t.filas[p].json); if (d == null) return;
    if (!puedeVer_(yo, p, d)) return;
    out.push([p, vista_(yo, p, d)]); vistos[p] = 1;
  });
  if (yo.a.eq && !vistos["teams/" + yo.a.eq]) out.push(["teams/" + yo.a.eq, vista_(yo, "teams/" + yo.a.eq, null)]);
  if (yo.a.eq) out.push(["pub/libres", { n: alumnos_().lista.filter(function (x) { return x.g === yo.a.g && !x.eq; }).map(function (x) { return x.n; }) }]);
  return { ok: true, rev: actual, full: true, docs: out, limites: limitesApi_() };
}
function leerDoc_(yo, p) {
  if (!p) return { ok: false, err: "ruta vacía" };
  var t = leerTodo_(), f = t.filas[p], d = f ? parse_(f.json) : null;
  if (!puedeVer_(yo, p, d)) return { ok: false, err: "privacidad", msg: MSG_PRIVACIDAD };
  if (/^teams\/\d+$/.test(p)) d = vista_(yo, p, d);
  else if (d) d = vista_(yo, p, d);
  return { ok: true, exists: d != null, data: d };
}

function esObj_(v) { return v && typeof v === "object" && !Array.isArray(v); }
function mezclar_(a, b) { var o = esObj_(a) ? JSON.parse(JSON.stringify(a)) : {}; for (var k in b) { var v = b[k]; o[k] = esObj_(v) ? mezclar_(o[k], v) : v; } return o; }
/* Un alumno no puede cambiar la lista de integrantes (vive en la hoja «Alumnos»). */
function limpiarAlumno_(d) {
  d = JSON.parse(JSON.stringify(d || {}));
  ["mem", "sorteoAt", "sorteoBy", "ajustes"].forEach(function (k) { delete d[k]; });
  if (esObj_(d.alts)) ["A", "B"].forEach(function (k) { if (esObj_(d.alts[k])) { delete d.alts[k].n; delete d.alts[k].orig; delete d.alts[k].tipo; } });
  return d;
}
function permiteEscribir_(yo, op) {
  var p = op.p;
  if (yo.rol === "docente") return true;
  if (op.t !== "update") return false;
  if (p.indexOf("grades/") === 0) return false;
  return !!yo.a.eq && (p === "teams/" + yo.a.eq || p.indexOf("teams/" + yo.a.eq + "/w/") === 0);
}

function escribir_(yo, ops) {
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    var t = leerTodo_(), cambios = {}, negadas = [], errores = [];
    ops.forEach(function (op, i) {
      var p = String(op && op.p || "");
      if (!/^[A-Za-z0-9_\-]+(\/[A-Za-z0-9_\-]+)*$/.test(p)) { errores.push(i); return; }
      if (!permiteEscribir_(yo, { t: op.t, p: p })) { negadas.push(yo.rol !== "docente" && equipoDeRuta_(p) && equipoDeRuta_(p) !== yo.a.eq ? p + "#privacidad" : p); return; }
      var dat = esObj_(op.d) ? op.d : {};
      if (/^teams\/\d+$/.test(p)) dat = yo.rol === "docente" ? (function (x) { x = JSON.parse(JSON.stringify(x)); delete x.mem; return x; })(dat) : limpiarAlumno_(dat);
      var actual = cambios.hasOwnProperty(p) ? cambios[p] : (t.filas[p] ? parse_(t.filas[p].json) : null), d;
      if (yo.rol !== "docente") {
        // Entregas: se editan hasta el cierre general del proyecto (fecha de la S8 o prórroga posterior).
        // Pasada la fecha límite de la semana queda VENCIDA: se acepta, pero el servidor deja evidencia
        // (_venc = primera edición tardía) y sella la hora real de entrega para calcular el retraso.
        var mw = /^teams\/\d+\/w\/(\d+)$/.exec(p);
        if (mw) { var wi_ = Number(mw[1]); if (!plazoAbierto_(wi_, actual)) { negadas.push(p); return; } dat = JSON.parse(JSON.stringify(dat)); delete dat.ext; delete dat._venc; delete dat._vencBy; dat._at = Date.now(); dat._by = firma_(t, cambios, yo);
          if (dat.hasOwnProperty("at")) dat.at = Date.now();
          if (dat.est === "Entregado") { dat.at = Date.now(); dat.by = dat._by; }
          if (Date.now() > venceMs_(wi_, actual) && !(actual && actual._venc)) { dat._venc = Date.now(); dat._vencBy = dat._by; }
          // Aportes por rol: cada integrante solo escribe el recuadro de SU rol directivo.
          if (esObj_(dat.rol)) { var tp = "teams/" + yo.a.eq, td = cambios.hasOwnProperty(tp) ? cambios[tp] : (t.filas[tp] ? parse_(t.filas[tp].json) : null), rs = (td && td.roles) || {};
            Object.keys(dat.rol).forEach(function (k) { if (!yo.a.id || rs[k] !== yo.a.id) { delete dat.rol[k]; negadas.push(p + "#rol"); } }); } }
        // Organización: no puede repetirse entre equipos.
        if (/^teams\/\d+$/.test(p) && esObj_(dat.org) && dat.org.n && orgOcupada_(t, cambios, p, dat.org.n)) { delete dat.org.n; negadas.push(p + "#org"); }
        if (/^teams\/\d+$/.test(p) && esObj_(dat.alts) && esObj_(dat.alts.C) && dat.alts.C.n && orgOcupada_(t, cambios, p, dat.alts.C.n)) { delete dat.alts.C.n; negadas.push(p + "#org"); }
      }
      if (op.t === "delete") d = null;
      else if (op.t === "set") d = dat;
      else d = mezclar_(actual, dat);
      if (d != null && JSON.stringify(d).length > MAX_CELDA) { errores.push(i); return; }
      cambios[p] = d;
    });
    guardar_(t, cambios);
    var vis = {}; Object.keys(cambios).forEach(function (p) { vis[p] = cambios[p] == null ? null : vista_(yo, p, cambios[p]); });
    return { ok: true, docs: vis, denied: negadas, errors: errores, msg: negadas.some(function (x) { return /#privacidad$/.test(x); }) ? MSG_PRIVACIDAD : "" };
  } finally { lock.releaseLock(); }
}
/* Firma de quien captura: «Nombre · CFO» (el rol sale de la asignación del equipo). */
var SIGLAS = { dg: "CEO", op: "COO", fi: "CFO", mk: "CMO", rh: "CHRO", "in": "CIO" };
function firma_(t, cambios, yo) {
  var p = "teams/" + yo.a.eq, d = cambios && cambios.hasOwnProperty(p) ? cambios[p] : (t.filas[p] ? parse_(t.filas[p].json) : null), r = [];
  if (d && d.roles && yo.a.id) Object.keys(SIGLAS).forEach(function (k) { if (d.roles[k] === yo.a.id) r.push(SIGLAS[k]); });
  return yo.a.n + (r.length ? " · " + r.join("/") : "");
}
function guardar_(t, cambios) {
  var claves = Object.keys(cambios); if (!claves.length) return;
  var nueva = subirRev_(), ahora = new Date(), nuevas = [];
  claves.forEach(function (p) {
    var fila = [p, cambios[p] == null ? "" : JSON.stringify(cambios[p]), nueva, ahora];
    if (t.filas[p]) t.sh.getRange(t.filas[p].fila, 1, 1, 4).setValues([fila]);
    else { nuevas.push(fila); t.filas[p] = { fila: -1, json: fila[1], rev: nueva }; }
  });
  if (nuevas.length) t.sh.getRange(t.sh.getLastRow() + 1, 1, nuevas.length, 4).setValues(nuevas);
}

/* Fecha límite de la semana i: 23:59 de Cancún (UTC-5) o la prórroga del documento. */
function venceMs_(i, d) {
  var L = limites_();
  if (!L[i]) return Infinity;
  var lim = new Date(L[i] + "T23:59:59-05:00").getTime();
  if (d && d.ext && /^\d{4}-\d{2}-\d{2}$/.test(d.ext)) lim = Math.max(lim, new Date(d.ext + "T23:59:59-05:00").getTime());
  return lim;
}
/* ¿Se puede seguir capturando la semana i? Sí, hasta el cierre general (fecha de la S8 o la ampliación
   que fije la docente, hasta 5 años) o una prórroga posterior de esa semana. */
function plazoAbierto_(i, d) {
  var L = limites_();
  if (!L[i]) return true;
  return Date.now() <= Math.max(venceMs_(i, d), cierreMs_());
}
/* Nombres de organización normalizados para comparar ("Café Ñ" = "cafe-n"). */
function slug_(n) { return String(n || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function orgsDeOtros_(t, cambios, excepto) {
  var o = {};
  for (var n = 1; n <= 10; n++) {
    var p = "teams/" + n; if (p === excepto) continue;
    var d = cambios && cambios.hasOwnProperty(p) ? cambios[p] : (t.filas[p] ? parse_(t.filas[p].json) : null);
    if (d && d.org && d.org.n) o[slug_(d.org.n)] = n;
    if (d && d.alts) ["A", "B", "C"].forEach(function (k) { if (d.alts[k] && d.alts[k].n) o[slug_(d.alts[k].n)] = n; });
  }
  Object.keys(t.filas).forEach(function (p) {
    if (p.indexOf("sorteo/") !== 0) return; var d = parse_(t.filas[p].json);
    if (d && d.t && "teams/" + d.t !== excepto && !o.hasOwnProperty(p.slice(7))) o[p.slice(7)] = d.t;
  });
  return o;
}
function orgOcupada_(t, cambios, p, nombre) { var s = slug_(nombre); return !!s && orgsDeOtros_(t, cambios, p).hasOwnProperty(s); }

/* ---------- Sorteo de las alternativas A y B (lo hace el servidor) ---------- */
function sortear_(yo, eq, pool) {
  if (!(eq >= 1 && eq <= 10)) return { ok: false, msg: "Equipo no válido." };
  var lock = LockService.getScriptLock(); lock.waitLock(25000);
  try {
    var t = leerTodo_(), tm = t.filas["teams/" + eq] ? parse_(t.filas["teams/" + eq].json) || {} : {};
    if (yo.rol !== "docente") {
      if (yo.a.eq !== eq) return { ok: false, msg: "Solo puedes sortear para tu equipo." };
      if (!tm.roles || tm.roles.dg !== yo.a.id) return { ok: false, msg: "Solo el Director General del equipo puede hacer el sorteo." };
    }
    if (tm.sorteoAt) return { ok: true, prev: true, a: tm.alts && tm.alts.A && tm.alts.A.n || "", b: tm.alts && tm.alts.B && tm.alts.B.n || "" };
    var usadas = orgsDeOtros_(t, null, "teams/" + eq);
    if (tm.alts && tm.alts.C && tm.alts.C.n) usadas[slug_(tm.alts.C.n)] = eq;
    var libres = (pool || []).filter(function (x) { return x && x.n && !usadas.hasOwnProperty(slug_(x.n)); });
    if (libres.length < 2) return { ok: false, msg: "Ya no quedan suficientes organizaciones libres en el sorteo. La docente puede liberar alguna desde su panel." };
    var rnd = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
    var A = rnd(libres), resto = libres.filter(function (x) { return x !== A; }), otros = resto.filter(function (x) { return x.cat !== A.cat; });
    var B = rnd(otros.length ? otros : resto);
    var quien = yo.rol === "docente" ? "Docente" : yo.a.n, ahora = Date.now(), cambios = {};
    cambios["sorteo/" + slug_(A.n)] = { t: eq, slot: "A", at: ahora, by: quien };
    cambios["sorteo/" + slug_(B.n)] = { t: eq, slot: "B", at: ahora, by: quien };
    var f = function (x) { return { n: x.n, tipo: x.tipo || "", giro: x.s || "", orig: "Sorteo" }; };
    cambios["teams/" + eq] = mezclar_(tm, { alts: { A: f(A), B: f(B) }, sorteoAt: ahora, sorteoBy: quien });
    delete cambios["teams/" + eq].mem;
    guardar_(t, cambios);
    return { ok: true, a: A.n, b: B.n };
  } finally { lock.releaseLock(); }
}

/* ---------- Docente: agregar o quitar a un alumno de un equipo ---------- */
function asignar_(yo, id, nombre, eq) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    CacheService.getScriptCache().remove("alumnos");
    var L = alumnos_().lista, a = null;
    if (id) a = L.filter(function (x) { return x.id === id; })[0];
    else if (nombre) { var nn = slug_(nombre); a = L.filter(function (x) { return slug_(x.n) === nn; })[0]; }
    if (!a) return { ok: false, msg: "No encontré a ese alumno en la hoja «Alumnos»." };
    if (yo.rol !== "docente") {
      // Director General: solo agrega a alguien de su grupo sin equipo, o quita a otro integrante de su propio equipo.
      // Con la clave del equipo cualquier integrante lo arma; con código personal (versión anterior), solo el Director General.
      var mio = yo.a.eq, tdoc = (function () { var t0 = leerTodo_(), f = t0.filas["teams/" + mio]; return f ? parse_(f.json) || {} : {}; })();
      if (!mio || (!yo.clave && (!tdoc.roles || tdoc.roles.dg !== yo.a.id))) return { ok: false, msg: "Solo el Director General del equipo o la docente cambian integrantes." };
      if (eq && a.g !== yo.a.g) return { ok: false, err: "privacidad", msg: MSG_PRIVACIDAD };
      if (eq && (eq !== mio || a.eq)) return { ok: false, msg: a.eq ? a.n + " no está disponible; la docente puede ayudarte." : "Solo puedes agregar a tu propio equipo." };
      if (!eq && a.eq !== mio) return { ok: false, err: "privacidad", msg: MSG_PRIVACIDAD };
    }
    if (eq) {
      var G = GRUPOS[a.g];
      if (!(eq > G.off && eq <= G.off + 5)) return { ok: false, msg: a.n + " es de otro grupo." };
      if ((conteos_(a.g)[eq] || 0) >= MAX_EQUIPO) return { ok: false, msg: "Ese equipo ya tiene " + MAX_EQUIPO + " integrantes." };
    }
    SpreadsheetApp.getActive().getSheetByName(HOJA_ALUMNOS).getRange(a.fila, C_EQ).setValue(eq || "");
    if (a.eq && a.eq !== (eq || 0)) {   // quien sale de su equipo (o se mueve a otro) deja sus roles ahí; lo ya capturado se conserva
      var t = leerTodo_(), p = "teams/" + a.eq, d = t.filas[p] ? parse_(t.filas[p].json) : null;
      if (d && d.roles) { var cambio = false; Object.keys(d.roles).forEach(function (k) { if (d.roles[k] === a.id) { d.roles[k] = ""; cambio = true; } }); if (cambio) { var c = {}; c[p] = d; guardar_(t, c); } }
    }
    CacheService.getScriptCache().remove("alumnos");
    subirRev_();
  } finally { lock.releaseLock(); }
  try { generarResumen(); } catch (x) {}   // la hoja «Resumen» refleja el cambio de inmediato
  return { ok: true };
}

/* Candado corto para reajustes de la docente. */
function apartar_(p, holder, ttl) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var c = CacheService.getScriptCache(), k = "L:" + p, v = c.get(k);
    if (v && v !== holder) return { ok: true, acquired: false };
    c.put(k, holder, Math.max(2, Math.ceil(ttl / 1000)));
    return { ok: true, acquired: true };
  } finally { lock.releaseLock(); }
}

/* ---------- El alumno se une a un equipo de su grupo ---------- */
function unirse_(yo, eq) {
  if (yo.rol !== "alumno" || yo.clave) return { ok: false, msg: "Con la clave del equipo, los integrantes se registran en la confirmación del equipo." };
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    CacheService.getScriptCache().remove("alumnos");
    var a = alumnos_().lista.filter(function (x) { return x.fila === yo.a.fila; })[0] || yo.a;
    if (a.eq) return { ok: true, equipo: a.eq, me: a.id };
    var G = GRUPOS[a.g];
    if (!(eq > G.off && eq <= G.off + 5)) return { ok: false, msg: "Ese equipo no es de tu grupo." };
    if ((conteos_(a.g)[eq] || 0) >= MAX_EQUIPO) return { ok: false, msg: "Ese equipo está completo. Elige otro." };
    SpreadsheetApp.getActive().getSheetByName(HOJA_ALUMNOS).getRange(a.fila, C_EQ).setValue(eq);
    CacheService.getScriptCache().remove("alumnos");
    subirRev_();
    var res = { ok: true, equipo: eq, me: a.id };
  } finally { lock.releaseLock(); }
  if (res) { try { generarResumen(); } catch (x) {} return res; }
}

/* ---------- Acceso docente ---------- */
function tokenDocente_() {
  var P = PropertiesService.getScriptProperties(), pin = P.getProperty("PIN_DOCENTE") || "", sal = P.getProperty("SAL") || "";
  if (!pin) return "__sin_pin__";
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pin + "|" + sal, Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(b).replace(/=+$/, "");
}
function entrar_(pin) {
  Utilities.sleep(600); // frena intentos repetidos
  var real = PropertiesService.getScriptProperties().getProperty("PIN_DOCENTE");
  if (!real || pin !== real) return { ok: false };
  return { ok: true, tok: tokenDocente_() };
}

/* =====================================================================
   MENÚ Y AUTOMATIZACIONES
   ===================================================================== */
function onOpen() {
  SpreadsheetApp.getUi().createMenu("Proyecto Integrador")
    .addItem("Generar claves de equipo faltantes", "generarClavesEquipo")
    .addItem("Generar identificadores de alumnos faltantes", "generarCodigos")
    .addItem("Enviarme un correo de prueba", "probarCorreo")
    .addItem("Enviar la clave de su equipo por correo", "enviarCodigos")
    .addSeparator()
    .addItem("Actualizar resumen ahora", "generarResumen")
    .addItem("Reinstalar automatizaciones", "instalarAutomatizaciones")
    .addItem("Hacer respaldo ahora", "respaldar")
    .addToUi();
}
/* Si la docente edita la hoja «Alumnos» (por ejemplo, cambia a alguien de equipo), la página se actualiza sola. */
function onEdit(e) {
  try {
    var hoja = e && e.range && e.range.getSheet().getName();
    if (hoja === HOJA_ALUMNOS) { CacheService.getScriptCache().remove("alumnos"); subirRev_(); }
    if (hoja === HOJA_EQUIPOS) CacheService.getScriptCache().remove("claves");
  } catch (x) {}
}

/* CONFIGURACIÓN INICIAL · ejecútala una vez (y de nuevo si cambias el PIN; no borra datos). */
function configurar() {
  var P = PropertiesService.getScriptProperties();
  if (PIN_DOCENTE === "cambia-este-pin") throw new Error("Primero cambia PIN_DOCENTE (línea 17) y guarda el archivo.");
  P.setProperty("PIN_DOCENTE", PIN_DOCENTE.trim());
  if (!P.getProperty("SAL")) P.setProperty("SAL", Utilities.getUuid());
  if (!P.getProperty("REV")) P.setProperty("REV", "0");
  CacheService.getScriptCache().removeAll(["rev", "alumnos", "claves"]);
  hojaDatos_();
  var ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName(HOJA_ALUMNOS)) {
    var sh = ss.insertSheet(HOJA_ALUMNOS);
    var enc = [["Grupo (L o A)", "Apellidos", "Nombre(s)", "Identificador (no lo edites)", "Equipo (1-5 L · 6-10 A)", "Correo (opcional)", "Clave enviada"]];
    var filas = LISTA_INICIAL.map(function (r) { return [r[0], r[1], r[2], "", "", "", ""]; });
    sh.getRange(1, 1, 1, 7).setValues(enc).setFontWeight("bold").setBackground("#f37021").setFontColor("#ffffff");
    sh.getRange(2, 1, filas.length, 7).setValues(filas);
    sh.setFrozenRows(1);
  }
  generarCodigos();
  generarClavesEquipo();
  generarResumen();
  instalarAutomatizaciones();
  Logger.log("Listo. En la hoja «Equipos» está la clave de cada equipo. Ahora implementa la aplicación web.");
}

/* Pone un identificador interno (XXXX-XXXX) a quien no lo tenga: liga a cada alumno con lo que captura. */
function generarCodigos() {
  var sh = SpreadsheetApp.getActive().getSheetByName(HOJA_ALUMNOS); if (!sh || sh.getLastRow() < 2) return;
  var rg = sh.getRange(2, 1, sh.getLastRow() - 1, C_COD), v = rg.getValues(), usados = {}, ab = "ABCDEFGHJKMNPQRSTUVWXYZ23456789", nuevos = 0;
  v.forEach(function (r) { if (r[C_COD - 1]) usados[normCod_(r[C_COD - 1])] = 1; });
  v.forEach(function (r) {
    if (r[C_COD - 1] || !(r[1] || r[2])) return;
    var c; do { c = ""; for (var i = 0; i < 8; i++) c += ab.charAt(Math.floor(Math.random() * ab.length)); } while (usados[c]);
    usados[c] = 1; r[C_COD - 1] = c.slice(0, 4) + "-" + c.slice(4); nuevos++;
  });
  rg.setValues(v);
  CacheService.getScriptCache().remove("alumnos");
  Logger.log("Códigos nuevos: " + nuevos);
}

/* =====================================================================
   CORREO CON LA CLAVE DEL EQUIPO
   - enviarCodigos(): envía a cada alumno con correo (columna F) y equipo
     (columna E) que aún no la haya recibido (columna G vacía) la clave de
     SU equipo, y registra la fecha. Si cambias la clave de un equipo,
     borra la columna G de sus integrantes y vuelve a enviar.
   - probarCorreo(): te envía a ti un ejemplo. No marca nada como enviado.
   ===================================================================== */
var FIRMA_CORREO = "Mtra. Tania Rivera Lozano<br>ADM1401 Introducción a la Empresa · Escuela Internacional de Negocios<br>Universidad Anáhuac Cancún · coordadmin.uac@anahuac.mx · ext. 154";

function ligaEquipo_(clave) { return URL_PAGINA + (URL_PAGINA.indexOf("?") < 0 ? "?" : "&") + "clave=" + encodeURIComponent(clave); }
function escHtml_(t) { return String(t || "").replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

/* Arma asunto, versión HTML y versión de texto plano del correo de un alumno. */
function correoCodigo_(nombre, clave, equipo) {
  var liga = ligaEquipo_(clave), n = escHtml_(nombre), eqTxt = escHtml_(equipo);
  var naranja = "#f37021";
  var html =
    "<div style='font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#2b2b2b;max-width:560px'>" +
    "<p>Hola, " + n + ":</p>" +
    "<p>Este semestre tu equipo trabajará como el <b>consejo directivo de una organización real de Quintana Roo</b>. Cada integrante asume un rol directivo (CEO, COO, CFO, CMO, CHRO o CIO) y durante ocho semanas analizarán la organización desde esa perspectiva hasta proponerle una mejora concreta, que entregarán como proyecto final el martes 24 de noviembre, con su pitch.</p>" +
    "<p>Todo el seguimiento será en una página del curso. Ahí tu equipo captura cada entrega, ve qué falta antes de entregar, descarga el PDF para Brightspace y recibe la calificación y los comentarios.</p>" +
    "<p style='margin:22px 0'><a href='" + liga + "' style='background:" + naranja + ";color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px;display:inline-block'>Entrar al Proyecto Integrador</a></p>" +
    "<p>Clave de seguridad de tu equipo (" + eqTxt + "): <b style='font-size:17px;letter-spacing:1px'>" + escHtml_(clave) + "</b></p>" +
    "<p><b>Cómo empezar, en 3 minutos:</b></p><ol>" +
    "<li>Abre la liga: entra directo con la clave de tu equipo; funciona en celular y en computadora. También puedes elegir «EQUIPO» y escribirla.</li>" +
    "<li>Confirmen a los integrantes y el rol directivo de cada uno, e indica quién eres tú.</li>" +
    "<li>En cada entrega responde desde la perspectiva de tu rol. La página te muestra siempre la próxima entrega y su fecha límite.</li></ol>" +
    "<p style='background:#fff7f1;border-left:4px solid " + naranja + ";padding:10px 12px'>La clave es solo de tu equipo: con ella únicamente ustedes ven y editan su trabajo, y no abre ningún otro equipo. No la compartas fuera de tu equipo, y si usas una computadora compartida presiona «Salir» al terminar.</p>" +
    "<p>Si algo no funciona o la clave no abre, respóndeme este correo y lo resolvemos.</p>" +
    "<p>Nos vemos en clase.</p><p>" + FIRMA_CORREO + "</p>" +
    "<p style='font-size:12px;color:#6b6560'>Si el botón no abre, copia esta liga en tu navegador: " + liga + "</p></div>";
  var texto = "Hola, " + nombre + ":\n\n" +
    "Este semestre tu equipo trabajará como el consejo directivo de una organización real de Quintana Roo. Cada integrante asume un rol directivo (CEO, COO, CFO, CMO, CHRO o CIO) y durante ocho semanas analizarán la organización desde esa perspectiva hasta proponerle una mejora concreta, que entregarán como proyecto final el martes 24 de noviembre, con su pitch.\n\n" +
    "Entrar al Proyecto Integrador: " + liga + "\nClave de seguridad de tu equipo (" + equipo + "): " + clave + "\n\n" +
    "Cómo empezar:\n1. Abre la liga; funciona en celular y en computadora.\n2. Confirmen integrantes y el rol directivo de cada uno.\n3. En cada entrega, responde desde la perspectiva de tu rol.\n\n" +
    "La clave es solo de tu equipo: no la compartas. Si usas una computadora compartida, presiona «Salir» al terminar.\n\n" +
    "Si algo no funciona, responde este correo.\n\nMtra. Tania Rivera Lozano\nADM1401 · Universidad Anáhuac Cancún";
  return { subject: nombre + ", la clave de tu equipo para el Proyecto Integrador · ADM1401", htmlBody: html, body: texto };
}
function nombreEquipo_(eq) { return (eq > 5 ? "Administración" : "Liderazgo") + " · Equipo " + ((eq - 1) % 5 + 1); }

function enviarCodigos() {
  if (URL_PAGINA.indexOf("TU-USUARIO") >= 0) throw new Error("Primero escribe URL_PAGINA (línea 18) con tu liga de GitHub Pages.");
  var sh = SpreadsheetApp.getActive().getSheetByName(HOJA_ALUMNOS); if (!sh || sh.getLastRow() < 2) return;
  var n = sh.getLastRow() - 1, v = sh.getRange(2, 1, n, C_ENVIO).getValues(), env = 0, sinEq = 0, errores = [], K = claves_().porEquipo;
  var cupo = MailApp.getRemainingDailyQuota();
  v.forEach(function (r, i) {
    var correo = String(r[C_CORREO - 1] || "").trim(), eq = Number(r[C_EQ - 1]) || 0;
    if (!correo || r[C_ENVIO - 1]) return;
    if (!eq || !K[eq]) { sinEq++; return; }
    if (env >= cupo) { errores.push(correo + " (sin cupo diario de Gmail)"); return; }
    try {
      var m = correoCodigo_(String(r[C_NOM - 1] || "").trim().split(" ")[0] || "", K[eq], nombreEquipo_(eq));
      MailApp.sendEmail({ to: correo, subject: m.subject, body: m.body, htmlBody: m.htmlBody, name: "Mtra. Tania Rivera Lozano" });
      sh.getRange(i + 2, C_ENVIO).setValue(new Date()); env++;
    } catch (e) { errores.push(correo + " (" + e.message + ")"); }
  });
  var msg = "Correos enviados: " + env + (sinEq ? ". Sin equipo todavía (no se enviaron): " + sinEq : "") + (errores.length ? ". No enviados: " + errores.join("; ") : "");
  Logger.log(msg);
  try { SpreadsheetApp.getActive().toast(msg, "Proyecto Integrador", 10); } catch (x) {}
}

function probarCorreo() {
  var yo = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  var a = alumnos_().lista.filter(function (x) { return x.no; })[0] || { no: "Alumno", ap: "" };
  var m = correoCodigo_(a.no.split(" ")[0], claves_().porEquipo[1] || "ABC-DEF-GHJ", nombreEquipo_(1));
  MailApp.sendEmail({ to: yo, subject: "[PRUEBA] " + m.subject, body: m.body, htmlBody: m.htmlBody, name: "Mtra. Tania Rivera Lozano" });
  try { SpreadsheetApp.getActive().toast("Te envié un correo de prueba a " + yo, "Proyecto Integrador", 8); } catch (x) {}
}

/* Programa el resumen cada hora y un respaldo diario a las 23 h. */
function instalarAutomatizaciones() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (["generarResumen", "generarResumenSiCambio", "respaldar"].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("generarResumenSiCambio").timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger("respaldar").timeBased().everyDays(1).atHour(23).create();
}

/* ---------- Resumen legible para la docente ---------- */
/* Lo llama un activador cada 5 minutos: solo regenera si algo cambió desde la última vez. */
function generarResumenSiCambio() {
  var P = PropertiesService.getScriptProperties(), rev = String(Number(P.getProperty("REV")) || 0);
  if (P.getProperty("REV_RESUMEN") === rev) return;
  generarResumen();
  P.setProperty("REV_RESUMEN", rev);
}
var PESOS = [0.05, 0.05, 0.05, 0.1, 0.1, 0.1, 0.1, 0.15], PESO_PITCH = 0.1;
/* Calendario de entregas S1 a S8 (S8 = PROYECTO FINAL). Cada entrega cierra ese día a las 23:59 (hora de Cancún).
   LIMITES son las fechas ORIGINALES. Las fechas vigentes se cambian desde la página:
   Panel docente → «Calendario de entregas» (se guardan en las propiedades del script, sin tocar este código).
   «Restaurar fechas originales» vuelve a LIMITES. Cambiar fechas no modifica nada de lo capturado ni entregado. */
var LIMITES = ["2026-10-18", "2026-10-25", "2026-11-01", "2026-11-05", "2026-11-10", "2026-11-15", "2026-11-19", "2026-11-24"];
function fechasValidas_(v) {
  return Array.isArray(v) && v.length === LIMITES.length && v.every(function (d, i) {
    return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(new Date(d + "T12:00:00-05:00").getTime()) && (i === 0 || d >= v[i - 1]);
  });
}
/* Fechas vigentes: las guardadas por la docente en el Panel docente; si no hay, las originales (LIMITES). */
function limites_() {
  try { var v = JSON.parse(PropertiesService.getScriptProperties().getProperty("CALENDARIO") || "null"); if (fechasValidas_(v)) return v; } catch (e) {}
  return LIMITES;
}
/* Docente: guarda el calendario (8 fechas AAAA-MM-DD en orden) o, con fechas vacías, restaura LIMITES.
   Solo cambia las fechas límite: no toca ningún documento, entrega, calificación ni prórroga. */
function guardarCalendario_(fechas) {
  var P = PropertiesService.getScriptProperties();
  if (fechas == null || fechas === "" || (Array.isArray(fechas) && !fechas.length)) P.deleteProperty("CALENDARIO");
  else if (!fechasValidas_(fechas)) return { ok: false, msg: "Fechas no válidas: deben ser 8, con formato AAAA-MM-DD y en orden (S1 ≤ S2 ≤ … ≤ S8)." };
  else P.setProperty("CALENDARIO", JSON.stringify(fechas));
  subirRev_();   // avisa a todas las páginas abiertas
  try { generarResumen(); } catch (x) {}
  return { ok: true, limites: limitesApi_() };
}
/* ---------- Cierre general del proyecto ----------
   Fecha hasta la que los equipos pueden seguir capturando y entregar semanas atrasadas
   (quedan registradas como tardías). Por omisión es la fecha de la S8; la docente la amplía
   desde el Panel docente hasta 5 años después de hoy. Se guarda en la propiedad CIERRE. */
var MAX_ANIOS_CIERRE = 5;
function cierreGuardado_() {
  var c = PropertiesService.getScriptProperties().getProperty("CIERRE") || "";
  return /^\d{4}-\d{2}-\d{2}$/.test(c) ? c : "";
}
function cierreMs_() {
  var L = limites_(), s8 = new Date(L[L.length - 1] + "T23:59:59-05:00").getTime(), c = cierreGuardado_();
  return c ? Math.max(s8, new Date(c + "T23:59:59-05:00").getTime()) : s8;
}
/* Lo que recibe la página: las 8 fechas límite y, si hay ampliación, la fecha de cierre como 9.º elemento. */
function limitesApi_() { var L = limites_().slice(), c = cierreGuardado_(); if (c) L.push(c); return L; }
function guardarCierre_(fecha) {
  var P = PropertiesService.getScriptProperties();
  if (fecha == null || fecha === "") P.deleteProperty("CIERRE");
  else {
    fecha = String(fecha);
    var L = limites_(), max = Utilities.formatDate(new Date(Date.now() + MAX_ANIOS_CIERRE * 366 * 864e5), "America/Cancun", "yyyy-MM-dd");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || isNaN(new Date(fecha + "T12:00:00-05:00").getTime())) return { ok: false, msg: "Fecha no válida (AAAA-MM-DD)." };
    if (fecha < L[L.length - 1]) return { ok: false, msg: "El cierre general no puede ser antes de la fecha de la S8 (" + L[L.length - 1] + ")." };
    if (fecha > max) return { ok: false, msg: "El cierre general puede ampliarse como máximo " + MAX_ANIOS_CIERRE + " años (hasta " + max + ")." };
    P.setProperty("CIERRE", fecha);
  }
  subirRev_();   // avisa a todas las páginas abiertas
  try { generarResumen(); } catch (x) {}
  return { ok: true, limites: limitesApi_() };
}
function generarResumen() {
  var LIM = limites_();
  CacheService.getScriptCache().remove("alumnos");
  var t = leerTodo_(), D = {};
  Object.keys(t.filas).forEach(function (p) { var d = parse_(t.filas[p].json); if (d != null) D[p] = d; });
  var enc = ["Grupo", "Equipo", "Nombre del equipo", "Organización elegida", "Tipo", "Contacto", "¿Aceptó?", "CEO (Director General)", "Integrantes (rol)", "Alternativas A · B · C"]
    .concat(LIM.map(function (x, i) { return "S" + (i + 1); }))
    .concat(LIM.map(function (x, i) { return "E" + (i + 1); }))
    .concat(["Pitch", "Puntos /80", "Nota /100", "Última edición"]);
  var filas = [enc], hoy = new Date();
  var ROL = SIGLAS;
  for (var n = 1; n <= 10; n++) {
    var tm = D["teams/" + n] || {}, gr = D["grades/" + n] || {}, al = tm.alts || {}, mem = miembros_(n);
    var ids = Object.keys(mem).sort(function (a, b) { return mem[a].t - mem[b].t; });
    var rolesDe = function (id) { return Object.keys(tm.roles || {}).filter(function (r) { return tm.roles[r] === id; }).map(function (r) { return ROL[r] || r; }); };
    var el = tm.elegida && al[tm.elegida] && al[tm.elegida].n ? al[tm.elegida] : (tm.org && tm.org.n ? tm.org : null);
    var est = LIM.map(function (lim, i) {
      var w = D["teams/" + n + "/w/" + i] || {}, fin = venceMs_(i, w);
      if (w.est === "Entregado") return w.at && w.at > fin ? "Tarde (" + Math.ceil((w.at - fin) / 864e5) + " d)" : "Entregado";
      return hoy.getTime() > fin ? (plazoAbierto_(i, w) ? "Vencida" : "No entregado") : "Pendiente";
    });
    var cal = PESOS.map(function (p, i) { var v = parseFloat(gr.c && gr.c[i]); return isNaN(v) ? "" : v; });
    var pts = cal.reduce(function (s, v, i) { return s + (v === "" ? 0 : v * PESOS[i]); }, 0) + (isNaN(parseFloat(gr.pitch)) ? 0 : parseFloat(gr.pitch) * PESO_PITCH);
    var dg = tm.roles && tm.roles.dg && mem[tm.roles.dg] ? mem[tm.roles.dg].n : "";
    filas.push([n <= 5 ? "Liderazgo" : "Administración", (n - 1) % 5 + 1, tm.nombre || "", el ? el.n : "", el ? (el.tipo || "") : "",
      el ? [el.contacto, el.cargo].filter(String).join(", ") : "", el ? (el.acepta || "") : "", dg,
      ids.map(function (id) { var r = rolesDe(id); return mem[id].n + (r.length ? " (" + r.join(", ") + ")" : ""); }).join("; "),
      ["A", "B", "C"].map(function (k) { return k + ": " + (al[k] && al[k].n || "—"); }).join(" · ")]
      .concat(est).concat(cal).concat([gr.pitch || "", Math.round(pts * 10) / 10, Math.round(pts / 0.8 * 10) / 10, ultima_(D, n)]));
  }
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(HOJA_RESUMEN) || ss.insertSheet(HOJA_RESUMEN, 0);
  sh.clear();
  sh.getRange(1, 1, filas.length, enc.length).setValues(filas);
  sh.getRange(1, 1, 1, enc.length).setFontWeight("bold").setBackground("#f37021").setFontColor("#ffffff");
  sh.setFrozenRows(1); sh.setFrozenColumns(4);
  var sin = alumnos_().lista.filter(function (a) { return !a.eq; }).map(function (a) { return a.n; });
  sh.getRange(filas.length + 2, 1).setValue("Sin equipo (" + sin.length + "): " + (sin.join(", ") || "—"));
  sh.getRange(filas.length + 3, 1).setValue("Actualizado: " + Utilities.formatDate(hoy, "America/Cancun", "dd/MM/yyyy HH:mm"));
}

function ultima_(D, n) {
  var u = null;
  for (var i = 0; i < LIMITES.length; i++) { var w = D["teams/" + n + "/w/" + i]; if (w && w._at && (!u || w._at > u._at)) u = w; }
  return u ? Utilities.formatDate(new Date(u._at), "America/Cancun", "dd/MM HH:mm") + (u._by ? " · " + u._by : "") : "";
}

/* ---------- Respaldo: copia de la hoja de datos con fecha ---------- */
function respaldar() {
  var ss = SpreadsheetApp.getActive(), src = hojaDatos_();
  var nombre = "respaldo " + Utilities.formatDate(new Date(), "America/Cancun", "yyyy-MM-dd");
  var viejo = ss.getSheetByName(nombre); if (viejo) ss.deleteSheet(viejo);
  src.copyTo(ss).setName(nombre).hideSheet();
  ss.getSheets().filter(function (s) { return /^respaldo \d{4}-\d{2}-\d{2}$/.test(s.getName()); })
    .sort(function (a, b) { return a.getName() < b.getName() ? 1 : -1; })
    .slice(10).forEach(function (s) { ss.deleteSheet(s); });
}

/* ---------- Lista inicial de alumnos (se copia a la hoja «Alumnos») ---------- */
var LISTA_INICIAL = [
  ["L","Álvarez García","Sofía Ximena"],["L","Morales Fernández","Ariannys Valentina"],["L","Castillo Palma","Carlos Joaquín"],["L","Coba Cob","Ingrid Ixchel"],
  ["L","Velasco Ancona","Andrea Isabel"],["L","García Navarrete","Yardley Saint"],["L","Fernández González","Renata"],["L","Salas Palacios","Luis Ángel"],
  ["L","Gratacós Gallegos","Pau"],["L","Pérez Ribadeneira","Joaquín Estuardo"],["L","Chevez Rodríguez","Héctor"],["L","Rodríguez Cardoso","Victoria Carolina"],
  ["L","Esquivel Jácome","Mario Yael"],["L","Dzul Trinidad","Irán"],["L","González Varillas","Daniel"],["L","Ortega Colmenares","Arianna Isabella"],
  ["A","Escobar Ramos","José René"],["A","Tapia Campos","Camila"],["A","Treviño Martínez","Emiliano"],["A","Flores González","Samantha"],
  ["A","Tec Guerrero","Camila Yamilet"],["A","Rivera","Daniella Valentina"],["A","Barrera Reyes","Frida Sofía"],["A","González Ulloa","Luis Diego"],
  ["A","Neira Bone","Camilo Gabriel"],["A","Ruiz Pelagio","Jorge"],["A","Ruiz Mendoza","Santiago"],["A","Willis Salvatierra","Maya"],
  ["A","Alcocer Hanson","Scott Allen"],["A","Amador Quiroz","Sebastián David"],["A","Tame Caram","Anuar"],["A","Fuentes Camacho","Emiliano"],
  ["A","Vigueras Morales","Lenny Antonio"],["A","Casarrubias Martínez","Mauricio Charbel"],["A","Gorocica Burelos","Juan Antonio"],["A","Gascón García Marín","Mario Patricio"],
  ["A","Sarabia Sánchez","Maximiliano"],["A","Santos Rojas","Vasti Sarai"]
];
