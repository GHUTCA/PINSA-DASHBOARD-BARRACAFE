// BANCO · UNA CAJA POR DÍA, NUNCA SUMADA — el VETRO de la cajera (AUT-0667, ordine di Alberto dom 11-ott: «una cassa per giorno… separate… una alla volta») · TERZA PENNA
// Contratto col bordo `bkp-caja-per-giorno-11ott` (BKP): `pendientes` porta `cajas_pendientes:[{dia,n_sobres,declarado,n_contados}]` (solo notti CHIUSE) e `nascosti`; la salida porta `caja_dia`; una `vuelta` per salida con lo
// stesso N°; `roja_estado?noches=D` dà le sueltas che coprono D; lettura `depositos_en_camino` (proposta: se manca, 404 `lettura_sconosciuta`, si usa la lista di QUESTO telefono). Si eseguono le funzioni VERE del vetro.
// ① la leva si legge da /salud (caja_una_per_giorno_on) e /salud muto = spenta ② la LISTA: una riga per notte, «N sobres · M por contar», MAI un importo, la notte in corso non c'e, senza lista = errore (non un ripiego sommato)
// ③ aprire una caja: SOLO i suoi sobres, SUA noche, SUOI cortes, e si puo tornare alla lista ④ la salida: `caja_dia`, solo i sobres di quel giorno, uid per giorno, roja di quella noche sola (09 coperta: reserva 99.500)
// ⑤ dopo la salida si torna alla LISTA e la caja resta «En camino» (anche chiudendo l app) ⑥ UN N° per tutte: una vuelta per salida con lo stesso N° ⑦ leva spenta = il vetro di ieri ⑧ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'caja_cajera.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 360))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); const a = SRC.slice(Math.max(0, i - 6), i) === 'async ' ? i - 6 : i;
  const eol = SRC.indexOf('\n', i), r1 = SRC.slice(i, eol);
  if (/\}\s*$/.test(r1) && (r1.match(/\{/g) || []).length === (r1.match(/\}/g) || []).length) return SRC.slice(a, eol + 1);
  return SRC.slice(a, SRC.indexOf('\n}\n', i) + 3); };
const S = (nro, dia, decl, conteo) => ({ sobre_nro: nro, dia, declarado: decl, firma_jl: 'Pedro', origen: 'jl', ts_hecho: '2026-10-12T05:00:00Z', conteo: conteo || null });
const SOBRES = [S('1005', '2026-10-09', 36000, { contado: 36000 }), S('N09', '2026-10-09', 1046312, { contado: 1045500 }), S('1006', '2026-10-10', 96000), S('1008', '2026-10-10', 6000), S('1009', '2026-10-10', 114000)];
const CAJAS = [{ dia: '2026-10-09', n_sobres: 2, declarado: 1082312, n_contados: 2 }, { dia: '2026-10-10', n_sobres: 3, declarado: 216000, n_contados: 0 }];
const PEND = (o) => Object.assign({ ok: true, sobres: SOBRES, noches: ['2026-10-09', '2026-10-10'], n_noches: 2, cajas_pendientes: CAJAS, nascosti: [{ sobre_nro: '1018', dia: '2026-10-13' }] }, o || {});
const ROJA09 = { ok: true, roja: true, reserva_pct: 5, sueltas: [{ uid: 'res-R1', numero: 'R-0001', dia: '2026-10-09', importo: 99500 }], sueltas_total: 99500, noches: [{ dia: '2026-10-09', estado: 'coperta', importo: 0, quota: 51214, coperto: 51214, debito: 0 }] };

const UIDN = { n: 0 };
function mondo(SRC, o) {
  o = o || {}; const els = {}, toasts = [], posts = [], llamadas = [], ls = Object.assign({}, o.ls || {}); const app = { innerHTML: '' }; let u = UIDN.n;
  const mk = (id) => (els[id] || (els[id] = { id, _v: undefined, get value() { if (this._v !== undefined) return this._v; const q = app.innerHTML.match(new RegExp('id="' + id + '"[^>]*value="([0-9]+)"')); return q ? q[1] : ''; }, set value(x) { this._v = x; }, innerHTML: '', onclick: null, disabled: false, checked: true, h: {}, addEventListener(ev, fn) { this.h[ev] = fn; }, style: {}, dataset: {} }));
  const ctx = { JSON, Math, Date, String, Number, Object, Array, Promise, console, setTimeout, clearTimeout, encodeURIComponent, app, DEPOSITO_PENDIENTE: null, MANANA: null, MULTI: false, NOCHES: [], PASO: 1, SOBRE_IDX: 0, PROVA: false, DIA_HOY: o.hoy || '2026-10-13', DIA_NOCHE: '2026-10-12',
    LOCAL: 'bks', BORDE: { bks: 'https://b.test' }, SES: { user: 'Mayra' }, barra: () => '[bar]', esc: (x) => String(x == null ? '' : x), fmt: (n) => '$' + n, fechaCorta: (d) => 'f:' + d, toast: (m, k) => toasts.push([m, k]),
    renderError: (a, b) => { ctx.app.innerHTML = '[error ' + a + ' ' + b + ']'; ctx.erroresR = (ctx.erroresR || 0) + 1; }, pantalla7() { llamadas.push('→pantalla7'); }, pantalla8() { llamadas.push('→pantalla8'); }, plantarBustaPrueba() {},
    uidGesto: (p) => p + '-' + (++UIDN.n), unTocoUnHecho: (b, fn) => { b.onclick = fn; }, postCaja: async (b) => { posts.push(b); const f = o.postFalla && o.postFalla(b, posts.length); if (f) return f; return { ok: true, sobre_nro: 'R-000' + posts.length }; },
    localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } },
    fetch: async (url) => { llamadas.push('fetch ' + url); if (o.saludRota) throw new Error('net'); return { json: async () => ({ flags: o.flags || {} }) }; },
    getCaja: async (p) => { llamadas.push(p); const h = o.get && o.get(p); if (h) return h; if (/^pendientes/.test(p)) return PEND(); if (/^depositos_en_camino/.test(p)) return { ok: false, error: 'lettura_sconosciuta' }; if (/^manana/.test(p)) return { ok: true, sobres: [], aviso_sin_respuesta: null };
      if (/^roja_estado/.test(p)) return ROJA09; if (/^reserva/.test(p)) return { ok: true, reserva: 1000, reserva_pct: 5 }; return { ok: false, error: 'sin_respuesta' }; },
    document: { getElementById: mk, querySelector: mk, querySelectorAll: () => [] } };
  vm.createContext(ctx);
  vm.runInContext("var CAJA_DIA = null, UNA_ON = null, UNA_TS = 0, DIA_CORTE = null, UIDS_GESTO = {}, DEJADAS = {}, SENZA_ESITO = [], EN_CAMINO_KEY = 'caja_en_camino_v1', ROJA_PEND_KEY = 'caja_roja_pend_v1'; async function noEncOn() { return false; } function dejadasHtml() { return ''; } function dejadasBind() {} function noEncHtml() { return ''; } function noEncBind() {} function senzaEsitoHtml() { return ''; } async function ventanaOn() { return false; } function claveSobre(x) { return (x.dia || DIA_NOCHE) + ':' + x.sobre_nro; }", ctx);
  const NOMI = ['unaOn', 'enCaminoLocal', 'enCaminoGuardar', 'enCaminoAgregar', 'enCaminoQuitar', 'enCaminoTodas', 'pantallaCajas', 'abrirCaja', 'trasSalida', 'vueltaErrorTxt', 'pantallaEnCamino', 'pantalla6', 'pantalla9', 'diasDeCorte', 'desgloseDeposito', 'desgloseHtml', 'legamiHtml',
    'diaAnterior', 'pantallaRojaError', 'rojaPendLeer', 'rojaPendGuardar', 'rojaPendLimpiar', 'rojaSiguiente', 'pantallaRojaNotte', 'pantallaReservaSobre', 'uidGestoEstable', 'uidGesto2'].filter((n) => n !== 'uidGesto2');
  vm.runInContext(NOMI.map((n) => fnDe(SRC, n)).join('\n') + '\nthis.F = { ' + NOMI.join(', ') + ' };', ctx);
  return { ctx, mk, toasts, posts, llamadas, app, ls };
}
const click = async (m, id) => { await m.mk(id).onclick(); };
const sinMonto = (h) => !/1082312|1\.082\.312|1045500|36000|36\.000|96000|216000|114000|\$\d{4,}/.test(h);

async function banco(SRC) {
  // ① la leva
  { for (const [nome, fl, rota, atteso] of [['acesa', { caja_una_per_giorno_on: '1' }, false, true], ['"0"', { caja_una_per_giorno_on: '0' }, false, false], ['assente', {}, false, false], ['/salud muto', {}, true, false]]) {
      const m = mondo(SRC, { flags: fl, saludRota: rota }); const r = await m.ctx.F.unaOn();
      t('① la leva (' + nome + ') => ' + atteso, r === atteso, r); }
    const m = mondo(SRC, { flags: { caja_una_per_giorno_on: '1' } }); await m.ctx.F.unaOn(); await m.ctx.F.unaOn();
    t('① bis si cachea 60 s: una sola lettura de /salud', m.llamadas.filter((x) => /salud/.test(x)).length === 1, m.llamadas); }
  // ② la lista
  { const m = mondo(SRC, {}); await m.ctx.F.pantallaCajas(); const h = m.ctx.app.innerHTML;
    t('② pide `pendientes` con el dia de HOY', m.llamadas[0] === 'pendientes?dia=2026-10-13', m.llamadas);
    t('② bis UNA fila por noche: «Caja del f:2026-10-09» y «Caja del f:2026-10-10», nunca «noches»/total', /Caja del f:2026-10-09/.test(h) && /Caja del f:2026-10-10/.test(h) && !/noches/.test(h), h);
    t('② ter cada fila dice cuantos sobres y cuantos faltan por contar (2 sobres · todos contados / 3 sobres · 3 por contar)', /2 sobres · todos contados/.test(h) && /3 sobres · 3 por contar/.test(h), h);
    t('② quater CONTEO CIEGO: ningun monto declarado (ni el de la caja, ni el de un sobre)', sinMonto(h), h);
    t('② quinquies la noche en curso NO esta como caja, y se dice que sigue abierta', !/2026-10-13/.test(h) && /La noche de hoy sigue abierta/.test(h), h);
    t('② sexies el titulo dice «2 cajas por contar» y el subtitulo que cada dia es una caja aparte', /2 cajas por contar/.test(h) && /Cada día es una caja aparte/.test(h));
    t('② septies sin salidas en camino no hay bloque «En camino» ni boton', !/En camino al banco/.test(h) && !/yaVolvi/.test(h)); }
  { const m = mondo(SRC, { get: (p) => (/^pendientes/.test(p) ? PEND({ cajas_pendientes: undefined }) : null) }); await m.ctx.F.pantallaCajas();
    t('② octies un bordo SIN `cajas_pendientes` NO cae en la lista sumada: error con nombre', m.ctx.erroresR === 1 && /sin_lista_de_cajas/.test(m.ctx.app.innerHTML), m.ctx.app.innerHTML); }
  { const m = mondo(SRC, { get: (p) => (/^pendientes/.test(p) ? PEND({ cajas_pendientes: [], sobres: [] }) : null) }); await m.ctx.F.pantallaCajas();
    t('② nonies sin cajas: «Nada por contar»', /Nada por contar/.test(m.ctx.app.innerHTML) && /No hay cajas pendientes/.test(m.ctx.app.innerHTML)); }
  { const m = mondo(SRC, {}); await m.ctx.F.pantallaCajas(); await click(m, 'caja0');
    t('② decies tocar «Caja del 09» la abre: CAJA_DIA, el dia de los cortes y paso 1', m.ctx.CAJA_DIA === '2026-10-09' && m.ctx.DIA_CORTE === '2026-10-09' && m.ctx.PASO === 1, [m.ctx.CAJA_DIA, m.ctx.DIA_CORTE]); }
  // ③ aprire una caja
  { const m = mondo(SRC, {}); m.ctx.F.abrirCaja('2026-10-09'); await new Promise((r) => setTimeout(r, 20)); const h = m.ctx.app.innerHTML;
    t('③ la caja del 09 muestra SOLO sus sobres (1005 y N09), no los del 10', /1005/.test(h) && /N09/.test(h) && !/1006|1008|1009/.test(h), h);
    t('③ bis NOCHES = [09], el titulo «Caja del f:2026-10-09» y el boton «‹ Las cajas»', m.ctx.NOCHES.join() === '2026-10-09' && /Caja del f:2026-10-09/.test(h) && /volverCajas/.test(h), [m.ctx.NOCHES, h.slice(0, 200)]);
    t('③ ter ...y todos contados: «Seguir» (no «Abrir y contar»)', /Seguir/.test(h) && !/Abrir y contar/.test(h)); }
  { const m = mondo(SRC, {}); m.ctx.F.abrirCaja('2026-10-10'); await new Promise((r) => setTimeout(r, 20)); const h = m.ctx.app.innerHTML;
    t('③ quater la caja del 10: sus 3 sobres, 3 por contar, nada del 09', /1006/.test(h) && /1008/.test(h) && /1009/.test(h) && !/1005|N09/.test(h) && /class="big acc">3</.test(h), h.slice(0, 400)); }
  { const m = mondo(SRC, { flags: { caja_una_per_giorno_on: '1' } }); await m.ctx.F.pantalla6(); await new Promise((r) => setTimeout(r, 30));
    t('③ quinquies con la leva, `pantalla6` sin caja abierta va a la LISTA (no a una lista sumada)', /Las cajas/.test(m.ctx.app.innerHTML) && /2 cajas por contar/.test(m.ctx.app.innerHTML), m.ctx.app.innerHTML.slice(0, 200)); }
  { const m = mondo(SRC, {}); await m.ctx.F.pantalla6();
    t('③ sexies SIN la leva: pantalla6 es la de ayer — «2 noches», todos los sobres juntos', /2 noches/.test(m.ctx.app.innerHTML) && /1005/.test(m.ctx.app.innerHTML) && /1009/.test(m.ctx.app.innerHTML), m.ctx.app.innerHTML.slice(0, 200)); }
  { const m = mondo(SRC, {}); m.ctx.F.abrirCaja('2026-10-09'); await new Promise((r) => setTimeout(r, 20)); await click(m, 'volverCajas'); await new Promise((r) => setTimeout(r, 30));
    t('③ septies «‹ Las cajas» vuelve a la lista y suelta la caja', m.ctx.CAJA_DIA === null && /2 cajas por contar/.test(m.ctx.app.innerHTML), m.ctx.CAJA_DIA); }
  { const m = mondo(SRC, {}); const dc = () => m.ctx.F.diasDeCorte();
    t('③ octies los cortes de una caja son los de SU dia (sin opciones de otros dias)', dc().length === 3);
    m.ctx.CAJA_DIA = '2026-10-09'; t('③ nonies con caja abierta: [su dia] y nada mas', JSON.stringify(dc()) === JSON.stringify(['2026-10-09']), dc()); }
  // ④ la salida de UNA caja
  const abreDeposito = async (dia, o2) => {
    const m = mondo(SRC, Object.assign({ flags: { caja_una_per_giorno_on: '1' } }, o2 || {})); await m.ctx.F.unaOn(); m.ctx.CAJA_DIA = dia; m.ctx.MULTI = true; m.ctx.NOCHES = [dia];
    m.ctx.MANANA = { sobres: SOBRES.filter((x) => x.dia === dia).map((x) => Object.assign({}, x, { conteo: { contado: x.sobre_nro === 'N09' ? 1045500 : x.declarado } })), noEnc: [], dejadas: [] };
    await m.ctx.F.pantalla9(); return m; };
  { const m = await abreDeposito('2026-10-09');
    t('④ la lectura de la roja pide SOLO la noche de la caja (`noches=2026-10-09`)', m.llamadas.includes('roja_estado?dia=2026-10-13&noches=2026-10-09'), m.llamadas);
    t('④ bis no mira `deposito_pendiente` (las salidas en camino viven en la lista)', !m.llamadas.some((x) => /^deposito_pendiente/.test(x)), m.llamadas);
    await click(m, 'salir'); const s = m.posts.find((p) => p.verbo === 'deposito');
    t('④ ter la salida del 09: `caja_dia` = 09 y SOLO sus dos sobres', s && s.caja_dia === '2026-10-09' && s.sobres.length === 2 && s.sobres.every((x) => x.dia === '2026-10-09'), s);
    t('④ quater contado = lo contado 1.081.500 (la R-0001 esta ADENTRO: ADMIN «LA R STA DENTRO IL CONTATO»); reserva 99.500 (la 09 esta coperta: ninguna busta nueva); a banco 982.000', s.contado === 1081500 && s.reserva === 99500 && s.a_depositar === 982000, s);
    t('④ quinquies la salida lleva la R-0001 en `rojas` (la lectura le dio solo esa)', s.rojas && s.rojas.length === 1 && s.rojas[0].numero === 'R-0001', s.rojas);
    t('④ sexies el uid de la salida depende del DIA de la caja (dos cajas, dos salidas)', /^dep-/.test(s.uid_gesto) && Object.keys(m.ctx.UIDS_GESTO || {}).some((k) => k.indexOf('deps|2026-10-09|') === 0), Object.keys(m.ctx.UIDS_GESTO || {})); }
  { const m = await abreDeposito('2026-10-09'); await click(m, 'salir');
    t('⑤ tras la salida: vuelve a la LISTA (no a una pantalla de deposito sumada)', /Las cajas/.test(m.ctx.app.innerHTML) || m.llamadas.some((x) => /^pendientes/.test(x)), m.llamadas.slice(-3));
    const l = JSON.parse(m.ls.caja_en_camino_v1 || '[]');
    t('⑤ bis la salida queda en la lista de ESTE telefono («en camino»), con su dia y su a-banco 982.000', l.length === 1 && l[0].dia === '2026-10-09' && l[0].a_depositar === 982000 && l[0].uid === m.posts[0].uid_gesto, l); }
  { const m = await abreDeposito('2026-10-10', { get: (p) => (/^roja_estado/.test(p) ? { ok: true, roja: true, reserva_pct: 5, sueltas: [], sueltas_total: 0, noches: [{ dia: '2026-10-10', estado: 'da_sigillare', importo: 66900, quota: 66900, coperto: 0, debito: 66900 }] } : null) });
    await click(m, 'salir'); const s = m.posts.find((p) => p.verbo === 'deposito');
    t('④ la caja del 10: caja_dia 10, sus 3 sobres, contado 216.000-… (declarado, nada contado: se usa el declarado), reserva 66.900 de SU noche', s.caja_dia === '2026-10-10' && s.sobres.length === 3 && s.reserva === 66900 && s.contado - s.reserva === s.a_depositar, s);
    const r = m.posts.find((p) => p.verbo === 'reserva_sobre');
    t('④ bis la busta R de la caja del 10 es de la noche 10 (no de otra)', !r || r.dia_op === '2026-10-10', r); }
  { const mA = await abreDeposito('2026-10-09'); await click(mA, 'salir'); const mB = await abreDeposito('2026-10-10'); await click(mB, 'salir');
    const ua = mA.posts.find((p) => p.verbo === 'deposito').uid_gesto, ub = mB.posts.find((p) => p.verbo === 'deposito').uid_gesto;
    t('④ ter dos cajas = dos uid distintos', ua !== ub, [ua, ub]); }
  // ④-bis [11-ott · ADMIN «DENTRO O A PARTE» + V28 «campo a DOS numeros»] el campo editable es el CONTANTE PARA EL BANCO; la R la pone el sistema y NO se escribe
  const calcDe = (m) => m.mk('calc').innerHTML;
  const escribe = async (m, v) => { m.mk('contado').value = String(v); m.mk('contado').h.input(); };
  { const m = await abreDeposito('2026-10-09'); const h = m.app.innerHTML, c = calcDe(m);
    t('④-bis la etiqueta dice «Contante para el banco · lo que pones en la bolsa» y el valor por defecto es lo contado MENOS la roja (1.081.500 − 99.500 = 982.000)', /Contante para el banco/.test(h) && /id="contado"[^>]*value="982000"/.test(h), h.slice(0, 500));
    t('④-bis b la pantalla muestra los dos numeros: «Contado de los sobres (con la roja adentro) $1081500» y «Vas a depositar $982000»', c.includes('Contado de los sobres <small>(con la roja adentro)</small></span><span class="v">$1081500') && c.includes('Vas a depositar</span><span class="v">$982000'), c);
    t('④-bis c por defecto no hay aviso de ajuste', !/Lo contado menos la roja/.test(c)); }
  { const m = await abreDeposito('2026-10-09'); await escribe(m, 982000); await click(m, 'salir'); const s2 = m.posts.find((p) => p.verbo === 'deposito');
    t('④-bis d Mayra escribe el NETO (lo que le queda en la mano, 982.000): la salida es la correcta — contado lordo 1.081.500 · reserva 99.500 · a banco 982.000 (la R NO se quita dos veces)', s2.contado === 1081500 && s2.reserva === 99500 && s2.a_depositar === 982000, s2); }
  { const m = await abreDeposito('2026-10-09'); await escribe(m, 1081500); const c = calcDe(m); await click(m, 'salir'); const s2 = m.posts.find((p) => p.verbo === 'deposito');
    t('④-bis e si escribe el LORDO por error (1.081.500): a banco 1.081.500, y la pantalla lo SEÑALA como ajuste +99.500 sobre lo esperado (no lo bloquea)', s2.a_depositar === 1081500 && s2.contado === 1181000 && c.includes('Lo contado menos la roja es $982000') && c.includes('diferencia de +$99500'), [s2, c]); }
  { const m = await abreDeposito('2026-10-09'); await escribe(m, 900000); const c = calcDe(m); await click(m, 'salir'); const s2 = m.posts.find((p) => p.verbo === 'deposito');
    t('④-bis f menos de lo esperado (900.000): a banco 900.000, contado lordo 999.500, ajuste −82.000 señalado', s2.a_depositar === 900000 && s2.contado === 999500 && s2.reserva === 99500 && c.includes('diferencia de −$82000'), [s2, c]); }
  for (const v of [0, 1, 50000, 982000, 1500000]) {
    const m = await abreDeposito('2026-10-09'); await escribe(m, v); await click(m, 'salir'); const s2 = m.posts.find((p) => p.verbo === 'deposito');
    t('④-bis g invariante para ' + v + ': a banco = lo escrito · contado lordo = lo escrito + la R · a banco = contado − reserva (la R no pasa nunca por el banco)', s2.a_depositar === v && s2.contado === v + s2.reserva && s2.a_depositar === s2.contado - s2.reserva, s2); }
  { const m = await abreDeposito('2026-10-10', { get: (p) => (/^roja_estado/.test(p) ? { ok: true, roja: true, reserva_pct: 5, sueltas: [{ uid: 'res-R2', numero: 'R-0002', dia: '2026-10-10', importo: 66900 }], sueltas_total: 66900, noches: [{ dia: '2026-10-10', estado: 'coperta', importo: 0, quota: 66900, coperto: 66900, debito: 0 }] } : null) });
    const decl = 96000 + 6000 + 114000; const h = m.app.innerHTML;
    t('④-bis h la caja del 10 con la R-0002 ya sellada: por defecto ' + (decl - 66900) + ' para el banco (lo contado − 66.900), y la salida lo dice', new RegExp('id="contado"[^>]*value="' + (decl - 66900) + '"').test(h), h.slice(0, 400));
    await click(m, 'salir'); const s2 = m.posts.find((p) => p.verbo === 'deposito');
    t('④-bis i ...salida: a banco = ' + (decl - 66900) + ' · reserva 66.900 · contado lordo ' + decl, s2.a_depositar === decl - 66900 && s2.reserva === 66900 && s2.contado === decl, s2); }
  { const m = mondo(SRC, {}); m.ctx.MULTI = true; m.ctx.NOCHES = ['2026-10-09']; m.ctx.MANANA = { sobres: SOBRES.filter((x) => x.dia === '2026-10-09').map((x) => Object.assign({}, x, { conteo: { contado: x.declarado } })), noEnc: [], dejadas: [] };
    await m.ctx.F.pantalla9(); const h = m.app.innerHTML;
    t('④-bis j SIN caja abierta (el vetro de ayer) el campo sigue siendo «Contado» y NO dice «Contante para el banco»', !/Contante para el banco/.test(h), h.slice(0, 300)); }
  // ⑥ UN N° para todas
  const ENC = [{ uid: 'dep-A', dia: '2026-10-09', a_depositar: 982000 }, { uid: 'dep-B', dia: '2026-10-10', a_depositar: 919500 }];
  { const m = mondo(SRC, { get: (p) => (/^depositos_en_camino/.test(p) ? { ok: true, depositos: ENC } : null) }); await m.ctx.F.pantallaCajas(); const h = m.ctx.app.innerHTML;
    t('⑥ la lista muestra «En camino al banco» con CADA caja separada y «Por depositar $X»', /En camino al banco/.test(h) && /Caja del f:2026-10-09 · Por depositar \$982000/.test(h) && /Caja del f:2026-10-10 · Por depositar \$919500/.test(h), h);
    t('⑥ bis ...y NUNCA «Depositaste»/«Depositado» antes del N°', !/Depositaste|Depositado/.test(h));
    await click(m, 'yaVolvi'); await new Promise((r) => setTimeout(r, 20)); const h2 = m.ctx.app.innerHTML;
    t('⑥ ter «Ya volví del banco» abre UNA pantalla con las dos cajas MARCADAS y UN campo de N°', /En camino al banco/.test(h2) && /Marca las cajas que van en ese papel/.test(h2) && (h2.match(/id="nro"/g) || []).length === 1 && (h2.match(/type="checkbox"/g) || []).length === 2 && h2.split('" checked ').length - 1 === 2 && h2.includes('982000') && h2.includes('919500'), h2);
    t('⑥ quater ...y el total del PAPEL DEL BANCO es el de las marcadas (para compararlo con el papel; en el libro cada caja sigue separada)', m.mk('totalSel').innerHTML.includes('Comprobante del banco: <b>$1901500</b>') && m.mk('totalSel').innerHTML.includes('2 cajas marcadas'), m.mk('totalSel').innerHTML);
    m.mk('nro').value = '61418'; await click(m, 'cerrarEnCamino'); await new Promise((r) => setTimeout(r, 30));
    const v = m.posts.filter((p) => p.evento === 'vuelta');
    t('⑥ quinquies se guardan DOS vueltas, una por salida, con el MISMO N° 61418', v.length === 2 && v.every((x) => x.nro_deposito === '61418') && v[0].referencia_uid === 'dep-A' && v[1].referencia_uid === 'dep-B', v);
    t('⑥ sexies cada vuelta lleva el dia de SU caja y un uid propio', v[0].caja_dia === '2026-10-09' && v[1].caja_dia === '2026-10-10' && v[0].uid_gesto !== v[1].uid_gesto, v);
    t('⑥ septies recien AHORA «Depositado · N° 61418» y de vuelta a la lista', m.toasts.some((x) => x[0] === 'Depositado · N° 61418') && /Las cajas/.test(m.ctx.app.innerHTML), [m.toasts, m.ctx.app.innerHTML.slice(0, 100)]); }
  { const ENC3 = [{ uid: 'dep-8', dia: '2026-10-08', a_depositar: 500000 }].concat(ENC);
    const m = mondo(SRC, { get: (p) => (/^depositos_en_camino/.test(p) ? { ok: true, depositos: ENC3 } : null) }); await m.ctx.F.pantallaEnCamino();
    t('⑥ bis-1 con una salida de OTRO viaje (la del 08, 500.000) el total sale de las MARCADAS: 3 marcadas = 2.401.500', m.mk('totalSel').innerHTML.includes('$2401500') && m.mk('totalSel').innerHTML.includes('3 cajas marcadas'), m.mk('totalSel').innerHTML);
    m.mk('chk0').checked = false; m.mk('chk0').h.change();
    t('⑥ bis-2 desmarcar la del 08: el total vuelve a 1.901.500 (2 marcadas) y el boton sigue activo', m.mk('totalSel').innerHTML.includes('$1901500') && m.mk('cerrarEnCamino').disabled === false, m.mk('totalSel').innerHTML);
    m.mk('nro').value = '61418'; await click(m, 'cerrarEnCamino'); await new Promise((r) => setTimeout(r, 30));
    const v = m.posts.filter((p) => p.evento === 'vuelta');
    t('⑥ bis-3 el N° 61418 se guarda SOLO en las marcadas (09 y 10): la del 08 NO recibe vuelta y sigue «En camino»', v.length === 2 && v.every((x) => x.referencia_uid !== 'dep-8') && v.map((x) => x.referencia_uid).join() === 'dep-A,dep-B', v); }
  { const m = mondo(SRC, { get: (p) => (/^depositos_en_camino/.test(p) ? { ok: true, depositos: ENC } : null) }); await m.ctx.F.pantallaEnCamino(); m.mk('chk0').checked = false; m.mk('chk1').checked = false; m.mk('chk0').h.change();
    t('⑥ bis-4 con NINGUNA marcada el boton se apaga y lo dice', m.mk('cerrarEnCamino').disabled === true && m.mk('totalSel').innerHTML.includes('No hay ninguna caja marcada'), m.mk('totalSel').innerHTML);
    m.mk('nro').value = '1'; await click(m, 'cerrarEnCamino'); t('⑥ bis-5 ...y aunque se fuerce el toque no se guarda nada', m.posts.length === 0, m.posts); }
  { const m = mondo(SRC, { ls: { caja_en_camino_v1: JSON.stringify(ENC.map((x) => Object.assign({ ts: Date.now() }, x))) }, postFalla: (b, n) => (n === 2 ? { ok: false, motivo: 'salida_en_camino' } : null) });
    await m.ctx.F.pantallaEnCamino(); m.mk('nro').value = '61418'; await click(m, 'cerrarEnCamino');
    const rest = JSON.parse(m.ls.caja_en_camino_v1 || '[]');
    t('⑥ octies si la 2a vuelta falla (salida todavia en cola): mensaje con palabras, NO «Depositado», la 1a ya guardada sale de la lista y la 2a queda', m.toasts.length === 1 && /todavía está llegando al sistema/.test(m.toasts[0][0]) && !m.toasts.some((x) => /Depositado/.test(x[0])) && rest.length === 1 && rest[0].uid === 'dep-B', [m.toasts, rest]); }
  { const m = mondo(SRC, { ls: { caja_en_camino_v1: JSON.stringify(ENC.map((x) => Object.assign({ ts: Date.now() }, x))) } }); await m.ctx.F.pantallaEnCamino(); await click(m, 'cerrarEnCamino');
    t('⑥ nonies sin N°: no se guarda nada', m.posts.length === 0 && m.toasts.some((x) => /Escribe el número de depósito/.test(x[0])), m.posts); }
  { const m = mondo(SRC, { ls: { caja_en_camino_v1: JSON.stringify([{ uid: 'dep-X', dia: '2026-10-08', a_depositar: 5, ts: Date.now() - 3600000 }]) }, get: (p) => (/^depositos_en_camino/.test(p) ? { ok: true, depositos: [] } : null) }); await m.ctx.F.pantallaCajas();
    t('⑥ decies una salida local de hace 1 h que el bordo YA no lista (anulada) no se queda para siempre', !/En camino al banco/.test(m.ctx.app.innerHTML), m.ctx.app.innerHTML); }
  { const m = mondo(SRC, { ls: { caja_en_camino_v1: JSON.stringify([{ uid: 'dep-Y', dia: '2026-10-09', a_depositar: 7, ts: Date.now() - 60000 }]) }, get: (p) => (/^depositos_en_camino/.test(p) ? { ok: true, depositos: [] } : null) }); await m.ctx.F.pantallaCajas();
    t('⑥ undecies ...pero una de hace 1 minuto (el bordo tarda en verla) SI se ve', /Caja del f:2026-10-09 · Por depositar \$7/.test(m.ctx.app.innerHTML), m.ctx.app.innerHTML); }
  { const m = mondo(SRC, { ls: { caja_en_camino_v1: JSON.stringify([{ uid: 'dep-L', dia: '2026-10-09', a_depositar: 982000, ts: Date.now() - 20000 }]) } }); await m.ctx.F.pantallaCajas(); const h = m.ctx.app.innerHTML;
    t('⑥ duodecies una caja con su salida YA escrita (aunque el bordo todavia no saque sus sobres de la lista) NO se reabre: la lista ofrece solo la del 10, y la del 09 esta «En camino»', /Caja del f:2026-10-10/.test(h) && !/id="caja1"/.test(h) && (h.match(/id="caja\d"/g) || []).length === 1 && h.includes("Caja del f:2026-10-09 · Por depositar $982000") && /Una caja por contar/.test(h), h); }
  { const m = mondo(SRC, {}); await m.ctx.F.pantallaCajas();
    t('⑥ terdecies la lectura de las salidas en camino lleva `dia` (el bordo valida siempre el dia: sin el, 400 a cada apertura)', m.llamadas.includes('depositos_en_camino?dia=2026-10-13'), m.llamadas); }
  // ⑦ cerrar la app a mitad de la roja y trasSalida
  { const m = mondo(SRC, { ls: { caja_roja_pend_v1: JSON.stringify({ dep: 'dep-Z', lista: [{ dia: '2026-10-10', importo: 66900 }], hechas: {} }) } }); await m.ctx.F.pantallaCajas();
    t('⑦ si cerro la app entre la salida y la ultima busta R: la secuencia se retoma ANTES de la lista', /A la caja fuerte ROJA/.test(m.ctx.app.innerHTML) && !/Las cajas/.test(m.ctx.app.innerHTML), m.ctx.app.innerHTML.slice(0, 200)); }
  { const m = mondo(SRC, {}); m.ctx.UNA_ON = null; m.ctx.F.trasSalida(); await new Promise((r) => setTimeout(r, 20));
    t('⑦ bis `trasSalida` SIN la leva es `pantalla9` (el vetro de ayer)', m.llamadas.some((x) => /^deposito_pendiente/.test(x)), m.llamadas); }
  { const m = mondo(SRC, { flags: { caja_una_per_giorno_on: '1' } }); await m.ctx.F.unaOn(); m.ctx.F.trasSalida(); await new Promise((r) => setTimeout(r, 20));
    t('⑦ ter `trasSalida` CON la leva vuelve a la lista y suelta la caja', m.ctx.CAJA_DIA === null && m.llamadas.some((x) => /^pendientes/.test(x)), m.llamadas); }
  { const m = mondo(SRC, { flags: { caja_una_per_giorno_on: '1' } }); await m.ctx.F.unaOn(); await m.ctx.F.pantalla9();
    t('⑦ quater con la leva, `pantalla9` sin caja abierta va a la lista (no a un deposito sumado)', m.llamadas.some((x) => /^pendientes/.test(x)) && !m.llamadas.some((x) => /^roja_estado|^deposito_pendiente/.test(x)), m.llamadas); }
  // cableado
  t('⑧ el vetro lee la leva con el nombre del bordo (caja_una_per_giorno_on)', SRC.includes('caja_una_per_giorno_on'));
  t('⑧ bis la salida de una caja lleva `caja_dia` solo dentro de `if (CAJA_DIA)`', SRC.includes('if (CAJA_DIA) cuerpoSalida.caja_dia = CAJA_DIA;'));
  t('⑧ ter la version es >= 1.10.0', /caja 1\.(1\d|[2-9]\d)\.\d<\/small>/.test(SRC));
}
await banco(SRC0);
const mut = async (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; try { await banco(SRC0.replace(da, () => a)); } catch (e) { ko++; } muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
await mut('la leva ha un altro nome', "String(j.flags.caja_una_per_giorno_on) === '1'", "String(j.flags.caja_una_per_giorno) === '1'");
await mut('/salud muto = acceso', "} catch (e) { UNA_ON = false; }   // /salud mudo", "} catch (e) { UNA_ON = true; }   // /salud mudo");
await mut('la lista muestra el importe declarado', "'<small style=\"display:block;font-weight:500;opacity:.85\">' + (c.n_sobres || 0)", "'<small style=\"display:block;font-weight:500;opacity:.85\">' + fmt(c.declarado) + ' · ' + (c.n_sobres || 0)");
await mut('sin cajas_pendientes cae en la lista sumada', "if (!PENDC.ok || !Array.isArray(PENDC.cajas_pendientes)) { renderError('Las cajas', PENDC.ok ? 'sin_lista_de_cajas' : PENDC.error); return; }", "if (!PENDC.ok) { renderError('Las cajas', PENDC.error); return; } if (!Array.isArray(PENDC.cajas_pendientes)) PENDC.cajas_pendientes = [];");
await mut('la caja abierta no filtra sus sobres', "MANANA.sobres = MANANA.sobres.filter(function(s){ return String(s.dia || '').slice(0, 10) === CAJA_DIA; }); NOCHES = [CAJA_DIA];", "NOCHES = [CAJA_DIA];");
await mut('la caja abierta no fija su noche', "MANANA.sobres = MANANA.sobres.filter(function(s){ return String(s.dia || '').slice(0, 10) === CAJA_DIA; }); NOCHES = [CAJA_DIA];", "MANANA.sobres = MANANA.sobres.filter(function(s){ return String(s.dia || '').slice(0, 10) === CAJA_DIA; });");
await mut('pantalla6 no va a la lista', "if (!CAJA_DIA && await unaOn()) { pantallaCajas(); return; }", "if (false) { pantallaCajas(); return; }");
await mut('abrirCaja no fija el dia de los cortes', "function abrirCaja(dia) { CAJA_DIA = dia; DIA_CORTE = dia; PASO = 1; pantalla6(); }", "function abrirCaja(dia) { CAJA_DIA = dia; PASO = 1; pantalla6(); }");
await mut('los cortes ofrecen otros dias', "function diasDeCorte() { return CAJA_DIA ? [CAJA_DIA] : [DIA_NOCHE, diaAnterior(DIA_NOCHE), DIA_HOY]; }", "function diasDeCorte() { return [DIA_NOCHE, diaAnterior(DIA_NOCHE), DIA_HOY]; }");
await mut('la salida no lleva caja_dia', "if (CAJA_DIA) cuerpoSalida.caja_dia = CAJA_DIA;", "");
await mut('el uid no depende del dia', "uidGestoEstable('deps|' + (CAJA_DIA || DIA_HOY) + '|'", "uidGestoEstable('deps|' + DIA_HOY + '|'");
await mut('pantalla9 sigue leyendo deposito_pendiente en una caja', "var pend = CAJA_DIA ? { ok: true, salida_pendiente: null } : await getCaja('deposito_pendiente?dia=' + DIA_HOY);", "var pend = await getCaja('deposito_pendiente?dia=' + DIA_HOY);");
await mut('la salida no queda «en camino»', "if (CAJA_DIA) enCaminoAgregar({ uid: depositoUid, dia: CAJA_DIA, a_depositar: ultimo.aDep, ts: Date.now() });", "");
await mut('tras la salida no vuelve a la lista', "function trasSalida() { if (UNA_ON === true) { CAJA_DIA = null; pantallaCajas(); } else pantalla9(); }", "function trasSalida() { pantalla9(); }");
await mut('trasSalida sin la leva va a la lista', "function trasSalida() { if (UNA_ON === true) { CAJA_DIA = null; pantallaCajas(); } else pantalla9(); }", "function trasSalida() { CAJA_DIA = null; pantallaCajas(); }");
await mut('la vuelta no lleva el dia de su caja', "nro_deposito: nro, caja_dia: x.dia,", "nro_deposito: nro,");
await mut('una sola vuelta para todas', "for (var i = 0; i < enc.length; i++) {\n      var x = enc[i];", "for (var i = 0; i < 1; i++) {\n      var x = enc[i];");
await mut('la vuelta se guarda aunque la anterior falle', "if (!r.ok) { toast(vueltaErrorTxt(r.motivo), 'bad'); return; }\n      enCaminoQuitar(x.uid);", "if (!r.ok) { toast(vueltaErrorTxt(r.motivo), 'bad'); }\n      enCaminoQuitar(x.uid);");
await mut('el toast dice Depositado antes del N°', "toast('Depositado · N° ' + nro, 'ok');\n    pantallaCajas();", "toast('Depositado', 'ok');\n    pantallaCajas();");
await mut('la caja con salida escrita se reabre', "var cajas = PENDC.cajas_pendientes.filter(function(c){ return !enc.some(function(e){ return e.dia === String(c.dia || '').slice(0, 10); }); });", "var cajas = PENDC.cajas_pendientes;");
await mut('la lectura en camino sin dia', "getCaja('depositos_en_camino?dia=' + DIA_HOY)", "getCaja('depositos_en_camino')");
await mut('el valor por defecto olvida la roja', "(esUna ? contadoTotal - RESERVA.reserva : contadoTotal)", "(esUna ? contadoTotal : contadoTotal)");
await mut('el contado lordo no suma la R', "var c = esUna ? inp + reserva : inp;", "var c = esUna ? inp : inp;");
await mut('a banco es el lordo (la R pasa por el banco)', "var aDep = c - reserva;   // = inp con una caja", "var aDep = c;   // = inp con una caja");
await mut('el ajuste no se señala', "(esUna && inp !== esperado ?", "(false ?");
await mut('el vetro de ayer tambien pide el campo nuevo', "var esUna = !!CAJA_DIA;", "var esUna = true;");
await mut('se guarda tambien la no marcada', "if (!marcadas[i]) continue;", "");
await mut('el total suma todas, marcadas o no', "if (m[i]) { tot += x.a_depositar; n++; }", "{ tot += x.a_depositar; n++; }");
await mut('con ninguna marcada el boton sigue', "document.getElementById('cerrarEnCamino').disabled = !n;", "");
await mut('las cajas no vienen marcadas', '" checked style="margin-right:8px">', '" style="margin-right:8px">');
await mut('las salidas locales viejas no caducan', "if (srv !== null && !(Date.now() - (x.ts || 0) < 600000)) return;", "");
await mut('el bordo no manda sobre las locales', "(srv || []).forEach(function(x){", "([]).forEach(function(x){");
await mut('la roja pendiente no se retoma', "if (rpC && rpC.lista && rojaSiguiente(rpC) >= 0) { pantallaRojaNotte(rpC.dep, rpC.lista, rpC.hechas); return; }", "");
await mut('pantalla9 sin caja no va a la lista', "if (UNA_ON === true && !CAJA_DIA) { pantallaCajas(); return; }", "");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
