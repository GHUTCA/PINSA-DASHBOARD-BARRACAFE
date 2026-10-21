// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · ① getCaja non si chiama più a leva accesa (21-ott)
// Richiesta: 🎛 `V32 I PEZZI CHE RESTANO DELLE 58 CHIAMATE` ①. Gira `giroCaja`, `_cajaSinGas`, `_cajaVista` VERI in vm.
// node test_app_jl_caja_sin_gas_21OTT2026.mjs [app_jl.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./app_jl.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = fnVin(SRC, 'cjFlag') + fnVin(SRC, '_servOn') + fnVin(SRC, '_servFresco') + fnVin(SRC, '_cajaSinGas') + 'async ' + fnVin(SRC, 'giroCaja') + fnVin(SRC, '_cajaVista');
  function mondo({ leve = {}, caja = null, serv = null } = {}) {
    const L = { gas: 0, salva: 0 };
    const ctx = { DEMO: false, JSON, RegExp, Object, Array, Math, Date, String,
      STATE: { pin: '1', salud: { flags: leve }, caja: caja, ts: { caja: caja ? Date.now() : 0, serv: serv ? Date.now() : 0 }, serv: serv, vista: null, cajaErr: '' },
      cjAtto1On: () => true, giroServicio: () => {}, salva: () => { L.salva++; }, pintaTesta: () => {}, pintaTab: () => {},
      gasPost: async () => { L.gas++; return { ok: true, venta: 1, boletas: 9, cierres: [] }; },
      _slugSalaJS: (n) => String(n).toLowerCase(), _cjMesasAbiertas: () => [], _franjaObj: (x) => x };
    vm.createContext(ctx); vm.runInContext(F, ctx); return { ctx, L };
  }
  const ON = { caja_servicio_on: '1', jl_caja_sin_gas: '1' };
  { const { ctx, L } = mondo({ leve: { caja_servicio_on: '1' } }); await vm.runInContext('giroCaja()', ctx);
    t('A · leva assente ⇒ getCaja come ieri', L.gas === 1 && ctx.STATE.caja && ctx.STATE.caja.boletas === 9, L); }
  { const { ctx, L } = mondo({ leve: ON }); await vm.runInContext('giroCaja()', ctx);
    t('B · leva accesa ⇒ ZERO Google', L.gas === 0, L); }
  { const { ctx, L } = mondo({ leve: { jl_caja_sin_gas: '1' } }); await vm.runInContext('giroCaja()', ctx);
    t('C · leva accesa ma servicio spento ⇒ Google come ieri (il bordo non serve la caja)', L.gas === 1, L); }
  { const { ctx, L } = mondo({ leve: ON, caja: { ok: true, boletas: 120, cierres: [{ nombre: 'ayer' }] } }); await vm.runInContext('giroCaja()', ctx);
    t('D · leva accesa ⇒ la caja di Google salvata (anche di ieri) si dimentica', ctx.STATE.caja === null && L.salva === 1 && L.gas === 0, ctx.STATE.caja); }
  const SV = { ok: true, venta: 500, cuentas: 3, propinas: 40, por_mesero: {} };
  { const { ctx } = mondo({ leve: ON, serv: Object.assign({}, SV, { dobles: [{ mesa: '12', veces: 2 }], boletas: { emitidas: 7 } }) });
    const c = vm.runInContext('_cajaVista()', ctx);
    t('E · i doppi e le boletas dal bordo quando li porta', c.dobles_bordo === true && c.dobles[0].mesa === '12' && c.boletas === 7 && c.boletas_bordo, c); }
  { const { ctx } = mondo({ leve: ON, serv: SV }); const c = vm.runInContext('_cajaVista()', ctx);
    t('F · chiavi assenti ⇒ nessun doppio inventato, boletas non dal bordo', !c.dobles && !c.boletas_bordo && c.venta === 500, c); }
  { const { ctx } = mondo({ leve: ON, caja: { ok: true, dobles: [{ mesa: '5' }] }, serv: SV }); const c = vm.runInContext('_cajaVista()', ctx);
    t('F2 · bordo senza dobles ⇒ restano quelli di Google (leva spenta, ripiego)', c.dobles && c.dobles[0].mesa === '5', c); }
  t('G · riga Boletas: «—» se né Google né il bordo le hanno', /\(\(STATE\.caja \|\| c\.boletas_bordo\) \? \(c\.boletas \|\| 0\) : '—'\)/.test(SRC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['la leva non ferma Google', "  if (_cajaSinGas()) { if (STATE.caja) { STATE.caja = null; STATE.ts.caja = 0; STATE.cajaErr = ''; salva(); pintaTesta(); pintaTab(); } return; }\n", ''],
    ['senza servicio acceso', "function _cajaSinGas() { return cjFlag('jl_caja_sin_gas') && _servOn(); }", "function _cajaSinGas() { return cjFlag('jl_caja_sin_gas'); }"],
    ['la caja vecchia resta', "if (STATE.caja) { STATE.caja = null; STATE.ts.caja = 0; STATE.cajaErr = ''; salva(); pintaTesta(); pintaTab(); } return; }", 'return; }'],
    ['doppi inventati', '  if (Array.isArray(sv.dobles)) { base.dobles = sv.dobles; base.dobles_bordo = true; }', '  base.dobles = sv.dobles || []; base.dobles_bordo = true;'],
    ['boletas sempre «—» senza Google', '((STATE.caja || c.boletas_bordo) ?', '(STATE.caja ?'],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
