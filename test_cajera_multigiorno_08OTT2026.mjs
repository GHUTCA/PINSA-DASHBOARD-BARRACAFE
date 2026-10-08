// BANCO · AUT-0613 · el depósito en VARIOS días (lado de la cajera) · TERZA PENNA · 08-ott-2026
// Corre las pantallas VERDADERAS (pantalla6, pantalla7, pantalla9, pantallaReservaSobre) con un DOM de mentira. Criterios: la lista junta TODAS las noches sin
// depósito · el monto declarado no se ve antes de contar (conteo ciego) · cada conteo se escribe en la noche DEL SOBRE · la retención suma las noches incluidas ·
// el depósito DICE qué sobres lleva · si el bordo todavía no tiene la lectura `pendientes`, la app sigue como ayer (una noche) · la app no sugiere ningún día.
import fs from 'node:fs'; import vm from 'node:vm';
const SRC = fs.readFileSync(new URL('./caja_cajera.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : (ko++, console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 300))); };
const fn = (nome, asinc) => { const i = SRC.indexOf((asinc ? 'async function ' : 'function ') + nome + '('); if (i < 0) throw new Error(nome); const j = SRC.indexOf('\n}\n', i) + 3; return SRC.slice(i, j); };

function mundo(respuestas, init) {
  const els = {}; const llamadas = []; const posts = [];
  const el = (id) => els[id] || (els[id] = { id, innerHTML: '', value: '', disabled: false, onclick: null, addEventListener() {}, style: {} });
  const ctx = Object.assign({ MANANA: null, MULTI: false, NOCHES: [], PROVA: false, plantarBustaPrueba: () => {}, PASO: 1, SOBRE_IDX: 0, DIA_NOCHE: '2026-10-07', DIA_HOY: '2026-10-08',
    DEPOSITO_PENDIENTE: null, SES: { user: 'Mayra' }, app: { innerHTML: '' }, barra: () => '[bar]', esc: String,
    fmt: (n) => (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('es-CL'), fechaCorta: (d) => 'f:' + d, toast: () => {}, llamadas, posts,
    renderError: (tt, e) => { ctx.app.innerHTML = '[error ' + tt + ' ' + e + ']'; },
    getCaja: async (p) => { llamadas.push(p); return respuestas[p] || respuestas[p.split('?')[0]] || { ok: false, error: 'sin_respuesta' }; },
    pantalla8: () => llamadas.push('→pantalla8'), pantalla7: () => llamadas.push('→pantalla7'),
    unTocoUnHecho: (b, f) => { b._f = f; }, uidGesto: (p) => p + '-' + Math.random().toString(36).slice(2, 8), postCaja: async (b) => { posts.push(b); return { ok: true, sobre_nro: 'R-1' }; }, Number, Math, String, Object, Array, Date,
    document: { getElementById: (id) => { const e = el(id); if (id === 'contado' && !e._set) { const m = /id="contado"[^>]*value="([^"]*)"/.exec(ctx.app.innerHTML); if (m) e.value = m[1]; } return e; },
      querySelector: () => el('q'), querySelectorAll: () => [] } }, init || {});
  vm.createContext(ctx);
  vm.runInContext(SRC.slice(SRC.indexOf('var UIDS_GESTO'), SRC.indexOf('function toast(')), ctx);   // el helper REAL del uid estable
  vm.runInContext(['pantalla6', 'pantalla7', 'pantalla9', 'pantallaReservaSobre'].map((n) => fn(n, n !== 'pantalla7' && n !== 'pantallaReservaSobre')).join('\n') + '\n;this.API = { pantalla6, pantalla7, pantalla9, pantallaReservaSobre };', ctx);
  return { ctx, el, llamadas, posts };
}
const S = (nro, dia, decl, conteo) => ({ sobre_nro: nro, dia, declarado: decl, firma_jl: 'Pedro', origen: 'jl', ts_hecho: '2026-10-08T05:00:00Z', conteo: conteo || null });
const SOBRES = [S('1002', '2026-10-06', 16808, { contado: 16808 }), S('1003', '2026-10-07', 90000), S('1004', '2026-10-07', 405470)];
const PEND = { ok: true, sobres: SOBRES, noches: ['2026-10-06', '2026-10-07'], n_noches: 2 };
const R = (x) => Object.assign({ pendientes: PEND, manana: { ok: true, sobres: [], aviso_sin_respuesta: null }, deposito_pendiente: { ok: true, salida_pendiente: null },
  'reserva?dia=2026-10-06': { ok: true, reserva: 800, reserva_pct: 5 }, 'reserva?dia=2026-10-07': { ok: true, reserva: 2200, reserva_pct: 5 } }, x || {});

console.log('── ① la lista junta TODAS las noches');
{ const m = mundo(R()); await m.ctx.API.pantalla6();
  const h = m.ctx.app.innerHTML;
  t('pide la lectura pendientes (con el día de HOY, para el PIN)', m.llamadas[0] === 'pendientes?dia=2026-10-08', m.llamadas);
  t('MULTI queda encendido y NOCHES = las dos noches', m.ctx.MULTI === true && m.ctx.NOCHES.length === 2);
  t('el título dice «2 noches» y «acumulado sin depositar»', /2 noches/.test(h) && /acumulado sin depositar/.test(h), h.slice(0, 260));
  t('cuenta cuántos FALTAN (2 de 3; semántica de BKP `EMERG TUTTE CONTATE`), cada fila con su noche', /class="big acc">2</.test(h) && /sobres que tienes que contar/.test(h) && /f:2026-10-06/.test(h) && /f:2026-10-07/.test(h), h.slice(0, 400));
  t('CONTEO CIEGO: ningún monto declarado en pantalla (ni 16.808, ni 90.000, ni 405.470, ni el total)', !/16\.808|16808|90\.000|405\.470|512\.278/.test(h), h.slice(0, 500));
  t('el que ya estaba contado dice «Contado», los otros «Por contar»', /Contado/.test(h) && (h.match(/Por contar/g) || []).length === 2);
  m.el('abrir').onclick(); t('«Abrir y contar» empieza por el primero SIN contar (el 1003)', m.ctx.SOBRE_IDX === 1 && /Sobre 1003/.test(m.ctx.app.innerHTML) && /2 de 3/.test(m.ctx.app.innerHTML), m.ctx.SOBRE_IDX); }
{ const m = mundo(R({ manana: { ok: true, sobres: [], aviso_sin_respuesta: { mesero: 'Ruth', motivo: 'tiempo', ts: '2026-10-08T04:00:00Z' } } })); await m.ctx.API.pantalla6();
  t('el aviso «sin respuesta» de anoche se sigue viendo', /Un aviso quedó sin respuesta/.test(m.ctx.app.innerHTML) && /Ruth/.test(m.ctx.app.innerHTML)); }
{ const m = mundo(R({ manana: { ok: false, error: 'x' } })); await m.ctx.API.pantalla6();
  t('si la lectura del aviso de anoche falla, la pantalla NO se cae', m.ctx.MULTI === true && /acumulado sin depositar/.test(m.ctx.app.innerHTML)); }
{ const m = mundo(R({ pendientes: { ok: true, sobres: SOBRES.slice(1, 2), noches: ['2026-10-07'], n_noches: 1 } })); await m.ctx.API.pantalla6();
  t('una sola noche pendiente: el título es la fecha, no «1 noches»', !/1 noches/.test(m.ctx.app.innerHTML) && /f:2026-10-07/.test(m.ctx.app.innerHTML)); }
{ const m = mundo(R({ pendientes: { ok: true, sobres: [], noches: [], n_noches: 0 } })); await m.ctx.API.pantalla6();
  t('sin sobres pendientes: «Nada que contar · no hay sobres sin depositar» y sigue a los cortes POS', /Nada que contar/.test(m.ctx.app.innerHTML) && /no hay sobres sin depositar/.test(m.ctx.app.innerHTML) && /id="irPos"/.test(m.ctx.app.innerHTML)); }

console.log('── ② el bordo todavía no tiene la lectura: la app sigue como ayer');
for (const [nombre, resp] of [['404 lettura_sconosciuta', { ok: false, error: 'lettura_sconosciuta' }], ['502 la vista no existe', { ok: false, error: 'pg_no_responde' }], ['sin red', { ok: false, error: 'sin_red' }]]) {
  const m = mundo(R({ pendientes: resp, manana: { ok: true, sobres: [S('1001', undefined, 5000)], aviso_sin_respuesta: null } })); await m.ctx.API.pantalla6();
  t(nombre + ': MULTI apagado, usa manana de AYER (una noche) y la pantalla de siempre', m.ctx.MULTI === false && m.llamadas.includes('manana?dia=2026-10-07') && /f:2026-10-07/.test(m.ctx.app.innerHTML) && /turno noche/.test(m.ctx.app.innerHTML), m.ctx.app.innerHTML.slice(0, 200)); }
{ const m = mundo(R({ pendientes: { ok: false, error: 'pin_caja_invalido', pin: true } })); await m.ctx.API.pantalla6();
  t('un error de PIN NO cae al flujo viejo: pide el PIN de nuevo', /\[error/.test(m.ctx.app.innerHTML) && m.ctx.MULTI === false && !m.llamadas.includes('manana?dia=2026-10-07')); }

console.log('── ③ cada conteo va a la noche DEL SOBRE');
{ const m = mundo(R(), { MULTI: true, NOCHES: PEND.noches, MANANA: { ok: true, sobres: JSON.parse(JSON.stringify(SOBRES)) }, SOBRE_IDX: 1 });
  m.ctx.API.pantalla7();
  m.el('contado').value = '90000'; m.el('contado')._set = true; m.el('selloSi').onclick();
  await m.el('revisar')._f(); await m.el('confirmar')._f();
  const c = m.posts[0];
  t('el conteo del 1003 se escribe con sobre_dia_op = 2026-10-07 (su noche), no la de ayer por default', c && c.verbo === 'conteo' && c.sobre_nro === '1003' && c.sobre_dia_op === '2026-10-07', c); }
{ const m = mundo(R(), { MULTI: true, NOCHES: PEND.noches, MANANA: { ok: true, sobres: JSON.parse(JSON.stringify(SOBRES)) }, SOBRE_IDX: 0 });
  m.ctx.MANANA.sobres[0].conteo = null; m.ctx.API.pantalla7();
  m.el('contado').value = '16808'; m.el('contado')._set = true; m.el('selloSi').onclick(); await m.el('revisar')._f(); await m.el('confirmar')._f();
  t('el conteo del 1002 se escribe en la noche 2026-10-06 (distinta de la del 1003)', m.posts[0].sobre_dia_op === '2026-10-06', m.posts[0]); }

{ // dos sobres con el MISMO numero en noches distintas (06/1 y 07/1): el uid estable NO los confunde (si no, el bordo se tragaria el 2º como `ya`)
  const dos = [S('1', '2026-10-06', 5000), S('1', '2026-10-07', 6000)];
  const m = mundo(R({ pendientes: { ok: true, sobres: dos, noches: ['2026-10-06', '2026-10-07'], n_noches: 2 } }), { MULTI: true, NOCHES: ['2026-10-06', '2026-10-07'], MANANA: { ok: true, sobres: JSON.parse(JSON.stringify(dos)) }, SOBRE_IDX: 0 });
  for (const idx of [0, 1]) { m.ctx.SOBRE_IDX = idx; m.ctx.API.pantalla7(); m.el('contado').value = '5000'; m.el('contado')._set = true; m.el('selloSi').onclick(); await m.el('revisar')._f(); await m.el('confirmar')._f(); }
  t('06/1 y 07/1 tienen uid DISTINTO y cada una su noche', m.posts.length === 2 && m.posts[0].uid_gesto !== m.posts[1].uid_gesto && m.posts[0].sobre_dia_op === '2026-10-06' && m.posts[1].sobre_dia_op === '2026-10-07', m.posts); }
{ // TODAS contadas en modo MULTI: «Seguir» va a los cortes, no vuelve a la primera
  const todas = SOBRES.map((x) => Object.assign({}, x, { conteo: { contado: x.declarado } }));
  const m = mundo(R({ pendientes: { ok: true, sobres: todas, noches: PEND.noches, n_noches: 2 } })); await m.ctx.API.pantalla6();
  t('todas contadas (varias noches): el botón dice «Seguir»', />Seguir</.test(m.ctx.app.innerHTML), m.ctx.app.innerHTML.slice(0, 300));
  m.el('abrir').onclick();
  t('… y tocarlo va a pantalla8, no a la primera', m.llamadas.includes('→pantalla8') && !m.llamadas.includes('→pantalla7'), m.llamadas); }

console.log('── ④ el depósito junta las noches y DICE qué sobres lleva');
const contados = SOBRES.map((s, i) => Object.assign({}, s, { conteo: { contado: [16808, 90000, 405470][i] } }));
{ const m = mundo(R(), { MULTI: true, NOCHES: PEND.noches, MANANA: { ok: true, sobres: contados } }); await m.ctx.API.pantalla9();
  const h = m.ctx.app.innerHTML;
  t('pide la retención de CADA noche incluida (06 y 07), cada una con su base de siempre', m.llamadas.includes('reserva?dia=2026-10-06') && m.llamadas.includes('reserva?dia=2026-10-07') && !m.llamadas.includes('reserva?dia=2026-10-07-ayer'), m.llamadas);
  t('«Antes de salir» con el contado total (512.278) editable', /Antes de salir/.test(h) && /value="512278"/.test(h), h.slice(0, 260));
  t('la retención SUMA las dos noches (800 + 2.200 = 3.000) y deposita 509.278', /\$3\.000/.test(m.el('calc').innerHTML) && /\$509\.278/.test(m.el('calc').innerHTML), m.el('calc').innerHTML);
  t('dice cuántos sobres y noches lleva', /3 · 2 noches/.test(m.el('calc').innerHTML), m.el('calc').innerHTML);
  m.llamadas.length = 0; await m.el('salir')._f();
  const s = m.posts[0];
  t('la «salida» lleva sobres:[{nro,dia}] de los TRES, en orden', s && s.verbo === 'deposito' && s.evento === 'salida' && JSON.stringify(s.sobres) === JSON.stringify([{ nro: '1002', dia: '2026-10-06' }, { nro: '1003', dia: '2026-10-07' }, { nro: '1004', dia: '2026-10-07' }]), s);
  t('...con contado 512.278, reserva 3.000 y a_depositar 509.278 (declarados, no recalculados por el bordo)', s.contado === 512278 && s.reserva === 3000 && s.a_depositar === 509278, s); }
{ const m = mundo(R(), { MULTI: true, NOCHES: PEND.noches, MANANA: { ok: true, sobres: contados } });
  m.ctx.API.pantallaReservaSobre('dep-uid', 3000); await m.el('sellarRoja')._f();
  t('la busta ROJA se sella con la ÚLTIMA noche incluida (2026-10-07) y el mismo monto', m.posts[0].verbo === 'reserva_sobre' && m.posts[0].dia_op === '2026-10-07' && m.posts[0].monto === 3000, m.posts[0]); }
{ const m = mundo(R({ 'reserva?dia=2026-10-07': { ok: true, reserva: null } }), { MULTI: true, NOCHES: PEND.noches, MANANA: { ok: true, sobres: contados } }); await m.ctx.API.pantalla9();
  t('si a UNA noche le falta el parámetro de la retención: «Falta un parámetro» (no se inventa la suma)', /Falta un parámetro/.test(m.ctx.app.innerHTML)); }
{ const m = mundo(R(), { MULTI: false, NOCHES: [], MANANA: { ok: true, sobres: [S('1001', undefined, 5000, { contado: 100000 })] } }); await m.ctx.API.pantalla9();
  t('MODO VIEJO (sin MULTI): pide UNA retención (la de ayer) y la salida NO lleva sobres', m.llamadas.includes('reserva?dia=2026-10-07') && !m.llamadas.includes('reserva?dia=2026-10-06'), m.llamadas);
  await m.el('salir')._f(); t('...y la salida es la de siempre (sin campo sobres)', m.posts[0].evento === 'salida' && !('sobres' in m.posts[0]), m.posts[0]); }

console.log('── ⑤ la app no empuja ningún día (orden de Alberto: depósitos a días elegidos al azar)');
t('no hay recordatorios, notificaciones, ni «hoy toca depositar» en la app', !/recordatorio|notificaci|recuerda|hoy toca|toca depositar|Notification|setTimeout\(.*dep/i.test(SRC.replace(/<!--[\s\S]*?-->/g, '')));
t('no calcula ni muestra una fecha sugerida para depositar', !/sugerid|próximo depósito|proximo deposito|deposita el|fecha de depósito/i.test(SRC.replace(/<!--[\s\S]*?-->/g, '')));
const mut = SRC.replace('if (MULTI) cuerpoSalida.sobres =', 'if (false) cuerpoSalida.sobres =');
t('MUTACIÓN: sin el campo sobres en la salida el sorgente cambia', mut !== SRC);

console.log(ko === 0 ? `✅ ${ok}/${ok + ko} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko === 0 ? 0 : 1);
