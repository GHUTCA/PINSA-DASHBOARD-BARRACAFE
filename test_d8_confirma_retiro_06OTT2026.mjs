// BANCO · D8 de EL GIRO · la tarjeta «Confirma tu retiro» del mesero (sala.html) · TERZA PENNA · 06-ott-2026
// ① «Ya entregaste hoy» NO cuenta el retiro que se está confirmando (era $35.299 / $70.598, debe ser $0 / $35.299).
// ② la tarjeta llegaba a los 20-30 s: el giro del retiro va cada 10 s; la propina sigue a 30 s; con las palancas apagadas no hay red.
import fs from 'node:fs'; import vm from 'node:vm';
const SRC = fs.readFileSync(new URL('./sala.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : (ko++, console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 260))); };
const fn = (nome, asinc) => { const i = SRC.indexOf((asinc ? 'async function ' : 'function ') + nome + '('); if (i < 0) throw new Error(nome); const j = SRC.indexOf('\n}\n', i) + 3; return SRC.slice(i, j); };
const $ = (v) => '$' + Math.round(v).toLocaleString('es-CL');

// ── ① la tarjeta, con el código de verdad
function tarjeta(r) {
  const els = {}; const ctx = { _cajaConfAperta: '', fmtPrice: $, esc: String, Date, $: (id) => els[id] || null,
    document: { createElement: () => ({ id: '', innerHTML: '' }), body: { appendChild: (e) => { els[e.id] = e; } } } };
  vm.createContext(ctx);
  vm.runInContext(fn('_cajaYaEntregue') + '\n' + fn('_cajaConfMostrar') + '\n;this.API = { _cajaYaEntregue, _cajaConfMostrar };', ctx);
  const p = Object.assign({}, r.por_confirmar[0], { entregado_antes: ctx.API._cajaYaEntregue(r) });
  ctx.API._cajaConfMostrar(p);
  const h = els.cajaConfWrap.innerHTML;
  const filas = [...h.matchAll(/<span>([^<]*)<\/span><b>([^<]*)<\/b>/g)].reduce((o, m) => (o[m[1]] = m[2], o), {});
  return { antes: ctx.API._cajaYaEntregue(r), ya: filas['Ya entregaste hoy'], con: filas['Con esta entrega'], tot: (h.match(/cie-tot">([^<]*)</) || [])[1] };
}
{ const a = tarjeta({ entregado: 35299, por_confirmar: [{ uid_gesto: 'u1', monto: 35299, ts: 1 }] });
  t('el caso del demo (Wilbert, 999): «Ya entregaste hoy $0» y «Con esta entrega $35.299»', a.ya === $(0) && a.con === $(35299) && a.tot === $(35299), a);
  t('y NO el $70.598 del difetto', a.con !== $(70598)); }
{ const a = tarjeta({ entregado: 45299, por_confirmar: [{ uid_gesto: 'u2', monto: 35299, ts: 1 }] });
  t('con un retiro previo confirmado de $10.000: «$10.000» y «$45.299»', a.ya === $(10000) && a.con === $(45299), a); }
{ const a = tarjeta({ entregado: 0, por_confirmar: [{ uid_gesto: 'u3', monto: 5000 }] });
  t('si el bordo no suma el pendiente (entregado 0): nunca negativo', a.ya === $(0) && a.con === $(5000), a); }
{ const a = tarjeta({ entregado: 50000, por_confirmar: [{ uid_gesto: 'a', monto: 20000 }, { uid_gesto: 'b', monto: 15000 }] });
  t('dos pendientes: «ya» descuenta los DOS (solo lo confirmado = $15.000), «con» suma el de la tarjeta', a.ya === $(15000) && a.con === $(35000), a); }
{ const a = tarjeta({ entregado: 35299, por_confirmar: [{ uid_gesto: 'x', monto: 35299.0 }] });
  t('monto entero igual al entregado: $0 exacto', a.antes === 0); }
t('sin por_confirmar el helper no explota', (() => { const c = {}; vm.createContext(c); vm.runInContext(fn('_cajaYaEntregue') + ';this.f=_cajaYaEntregue;', c); return c.f({ entregado: 100 }) === 100 && c.f(null) === 0 && c.f({}) === 0; })());
t('los DOS sitios usan el helper (corte y giro)', (SRC.match(/entregado_antes: _cajaYaEntregue\(r\)/g) || []).length === 2);
t('ningún sitio manda ya `entregado_antes: r.entregado || 0`', !/entregado_antes: r\.entregado \|\| 0/.test(SRC));

// ── ② el giro
async function giro(que, flags) {
  const llamadas = [];
  const ctx = { JL: false, STATE: { codigo: 'c', nombre: 'Wilbert' }, document: { visibilityState: 'visible' }, CAJA_ATTO1_ON: flags.a1, CAJA_ATTO3_ON: flags.a3,
    _cajaConfAperta: '', _propAperta: '', llamadas,
    _cajaMesero: async (b) => { llamadas.push(b.verbo); return { ok: true, por_confirmar: [], por_firmar: [] }; },
    _cajaConfMostrar: () => {}, _propMostrar: () => {}, Object };
  vm.createContext(ctx); vm.runInContext(fn('_cajaGiroMesero', true) + '\n;this.f=_cajaGiroMesero;', ctx);
  await ctx.f(que); return llamadas;
}
t('giro «ritiro»: solo estado_mesero', JSON.stringify(await giro('ritiro', { a1: true, a3: true })) === '["estado_mesero"]');
t('giro «propina»: solo propinas_mesero', JSON.stringify(await giro('propina', { a1: true, a3: true })) === '["propinas_mesero"]');
t('sin argumento: los dos, como ayer', JSON.stringify(await giro(undefined, { a1: true, a3: true })) === '["estado_mesero","propinas_mesero"]');
t('ATTO I y III apagados: NINGUNA llamada a la red (el poll más rápido no cuesta nada)', (await giro('ritiro', { a1: false, a3: false })).length === 0 && (await giro('propina', { a1: false, a3: false })).length === 0);
t('ATTO I apagado y III encendido: el giro del retiro no llama', (await giro('ritiro', { a1: false, a3: true })).length === 0);
t('el JL no hace el giro del mesero', await (async () => { const l = []; const c = { JL: true, STATE: { codigo: 'c', nombre: 'x' }, document: {}, CAJA_ATTO1_ON: true, _cajaMesero: async () => { l.push(1); return {}; } }; vm.createContext(c); vm.runInContext(fn('_cajaGiroMesero', true) + ';this.f=_cajaGiroMesero;', c); await c.f('ritiro'); return l.length === 0; })());
t('los intervalos: ritiro cada 10 s, propina cada 30 s', /setInterval\(function \(\) \{ _cajaGiroMesero\('ritiro'\); \}, 10000\);/.test(SRC) && /setInterval\(function \(\) \{ _cajaGiroMesero\('propina'\); \}, 30000\);/.test(SRC));
t('ya no existe el setInterval(_cajaGiroMesero, 30000) único', !/setInterval\(_cajaGiroMesero, 30000\)/.test(SRC));
t('versión bumpada 3.220.3', /id="ver">sala v3\.220\.3/.test(SRC));
// MUTACIÓN: sin el helper, el difetto vuelve
const mut = SRC.split('entregado_antes: _cajaYaEntregue(r)').join('entregado_antes: r.entregado || 0');
t('MUTACIÓN: devolviendo r.entregado el sorgente cambia (y el caso del demo daría $70.598)', mut !== SRC && /entregado_antes: r\.entregado \|\| 0/.test(mut));
console.log(ko === 0 ? `✅ ${ok}/${ok + ko} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko === 0 ? 0 : 1);
