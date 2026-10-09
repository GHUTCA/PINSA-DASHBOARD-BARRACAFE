// BANCO · la «mañana» de la cajera SIN SOBRES (pregunta de EL GIRO, ATTO II A MERCOLEDÌ 06:00 → giovedì) · TERZA PENNA · 06-ott-2026
// Corre las pantallas VERDADERAS (pantalla6 y pantalla9) con un DOM de mentira. Criterios: sobres [] NO detiene el flujo ·
// el depósito sin contado dice «Nada que depositar» (antes: «Vas a depositar −$800») · un depósito negativo apaga el botón.
import fs from 'node:fs'; import vm from 'node:vm';
const SRC = fs.readFileSync(new URL('./caja_cajera.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : (ko++, console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 260))); };
const fn = (nome, asinc) => { const i = SRC.indexOf((asinc ? 'async function ' : 'function ') + nome + '('); if (i < 0) throw new Error(nome); const j = SRC.indexOf('\n}\n', i) + 3; return SRC.slice(i, j); };

function mundo(manana, respuestas) {
  const els = {}; const llamadas = [];
  const el = (id) => els[id] || (els[id] = { id, innerHTML: '', value: '', disabled: false, onclick: null, addEventListener() {}, style: {} });
  const ctx = { MANANA: manana, MULTI: false, NOCHES: [], PROVA: false, plantarBustaPrueba: () => {}, PASO: 3, DIA_NOCHE: '2026-10-06', DIA_HOY: '2026-10-07', DEPOSITO_PENDIENTE: null, SES: { user: 'Mayra' },
    app: { innerHTML: '' }, barra: () => '[bar]', esc: String, fmt: (n) => (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('es-CL'),
    fechaCorta: (d) => d, toast: () => {}, llamadas,
    getCaja: async (p) => { llamadas.push(p); return respuestas[p.split('?')[0]] || { ok: false, error: 'sin_respuesta' }; },
    pantalla8: () => llamadas.push('→pantalla8'), pantalla7: () => llamadas.push('→pantalla7'), pantallaReservaSobre: () => llamadas.push('→reserva'),
    unTocoUnHecho: (b, f) => { b._f = f; }, uidGesto: () => 'u', postCaja: async () => ({ ok: true }), Number, Math, String, Object,
    // el DOM de mentira lee el `value` del input «contado» del HTML que la pantalla acaba de escribir (como haría el navegador)
    document: { getElementById: (id) => { const e = el(id); if (id === 'contado') { const m = /id="contado"[^>]*value="([^"]*)"/.exec(ctx.app.innerHTML); if (m) e.value = m[1]; } return e; },
      querySelector: () => el('q'), querySelectorAll: () => [] } };
  vm.createContext(ctx);
  vm.runInContext(['pantalla6', 'pantalla9'].map((n) => fn(n, true)).join('\n') + '\n;this.API = { pantalla6, pantalla9 };', ctx);
  return { ctx, el, llamadas };
}
const sinSobres = { ok: true, sobres: [] };
const reserva = { ok: true, reserva: 800, reserva_pct: 5 };
const R = (extra) => Object.assign({ manana: sinSobres, 'deposito_pendiente': { ok: true, salida_pendiente: null }, reserva }, extra || {});

// ── ① la «mañana» sin sobres: NO detiene el flujo
{ const m = mundo(null, R()); await m.ctx.API.pantalla6();
  const h = m.ctx.app.innerHTML;
  t('pantalla 6 con sobres []: dice «Nada que contar» y «La caja fuerte está vacía»', /Nada que contar/.test(h) && /La caja fuerte está vacía/.test(h), h.slice(0, 200));
  t('… y ofrece seguir («Ir a los cortes POS»), NO se queda esperando una busta', /id="irPos"/.test(h));
  m.el('irPos').onclick && m.el('irPos').onclick();
  t('al tocar «Ir a los cortes POS» pasa a la pantalla 8', m.llamadas.includes('→pantalla8') && m.ctx.PASO === 3, m.llamadas); }

// ── ② el depósito sin sobres
{ const m = mundo(sinSobres, R()); await m.ctx.API.pantalla9();
  const h = m.ctx.app.innerHTML;
  t('sin sobres: «Nada que depositar» (no «Antes de salir»)', /Nada que depositar/.test(h) && !/Antes de salir/.test(h), h.slice(0, 220));
  t('NUNCA «Vas a depositar» con un número negativo', !/Vas a depositar/.test(h) && !/-\$/.test(h));
  t('hay un botón «Listo» que cierra y vuelve al inicio', /id="finSinSobres"/.test(h));
  m.el('finSinSobres').onclick && m.el('finSinSobres').onclick();
  t('«Listo» vuelve a la pantalla 6 (PASO 1)', m.ctx.PASO === 1, m.ctx.PASO); }
{ const m = mundo(sinSobres, R({ reserva: { ok: true, reserva: 0, reserva_pct: 5 } })); await m.ctx.API.pantalla9();
  t('sin sobres y sin reserva: igual «Nada que depositar»', /Nada que depositar/.test(m.ctx.app.innerHTML)); }

// ── ③ con sobres contados: la pantalla de siempre; un depósito negativo apaga el botón
const conSobre = (contado) => ({ ok: true, sobres: [{ sobre_nro: '1001', conteo: { contado } }] });
{ const m = mundo(conSobre(100000), R({ manana: conSobre(100000) })); await m.ctx.API.pantalla9();
  const h = m.ctx.app.innerHTML;
  t('con $100.000 contados: la pantalla «Antes de salir» de siempre', /Antes de salir/.test(h) && /value="100000"/.test(h), h.slice(0, 200));
  t('el cálculo: reserva $800, vas a depositar $99.200, el botón queda ACTIVO', /\$800/.test(m.el('calc').innerHTML) && /\$99\.200/.test(m.el('calc').innerHTML) && m.el('salir').disabled === false, m.el('calc').innerHTML);
  t('sin la nota de depósito negativo', !/no cubre la reserva/.test(m.el('calc').innerHTML)); }
{ const m = mundo(conSobre(500), R({ manana: conSobre(500) })); await m.ctx.API.pantalla9();
  t('contado $500 < reserva $800: el botón «Salir al banco» queda APAGADO y lo dice', m.el('salir').disabled === true && /El contado no cubre la reserva/.test(m.el('calc').innerHTML), { d: m.el('salir').disabled, c: m.el('calc').innerHTML }); }
{ const m = mundo(conSobre(800), R({ manana: conSobre(800) })); await m.ctx.API.pantalla9();
  t('contado = reserva: depósito $0 es válido, botón activo', m.el('salir').disabled === false); }

// ── ④ lo que no cambia
t('una salida pendiente (volvió del banco) sigue yendo a «De vuelta del banco»', await (async () => {
  const m = mundo(sinSobres, R({ deposito_pendiente: { ok: true, salida_pendiente: { uid_gesto: 'dep-1', a_depositar: 43000 } } })); await m.ctx.API.pantalla9();
  return /De vuelta del banco/.test(m.ctx.app.innerHTML) && !/Nada que depositar/.test(m.ctx.app.innerHTML); })());
t('sin el parámetro de la retención: «Falta un parámetro» (igual que antes)', await (async () => {
  const m = mundo(sinSobres, R({ reserva: { ok: false, error: 'x' } })); await m.ctx.API.pantalla9();
  return /Falta un parámetro/.test(m.ctx.app.innerHTML); })());
const mut = SRC.replace('if (!(contadoTotal > 0)) {', 'if (false) {');
t('MUTACIÓN: sin la guarda «Nada que depositar» el sorgente cambia', mut !== SRC);
console.log(ko === 0 ? `✅ ${ok}/${ok + ko} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko === 0 ? 0 : 1);
