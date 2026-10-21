// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · pezzo 1.3 · staffPost senza la strada di Google, verbo per verbo (21-ott)
// Gira `_soloBorde` e `staffPost` VERI di sala.html in vm con fetch e gasPost finti. node test_sala_staffpost_solo_borde_13_21OTT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = 'let STAFFPOST_SOLO = "";\n' + fnVin(SRC, '_soloBorde') + 'async ' + fnVin(SRC, 'staffPost');
  async function chiama(action, { solo = '', bw = true, qs = '', status = 200, body, lancia = false } = {}) {
    const L = { fetch: 0, gas: [], penna: [] };
    const ctx = { BORDE_W: { QS: qs, ok: {} }, STATE: { sala: { bw: bw } }, BORDE_SALA: { URL: 'https://b', T: 't' }, CFG: { LOCAL: 'BKS' }, APP_ID: 'sala',
      JSON, Object, String, setTimeout, clearTimeout, AbortController, encodeURIComponent, Date,
      bordeWriteOn: () => (qs === '0' ? false : qs === '1' ? true : bw), _salaVer: () => 'v', _muroCampi: () => ({}), _vediNoAsignado: (j) => j,
      _pennaSvuota: () => {}, _pennaDice: (s) => L.penna.push(s), _cadutaMarca: (a, r) => r,
      fetch: async () => { L.fetch++; if (lancia) { const e = new Error('x'); e.name = 'AbortError'; throw e; } return { status, json: async () => body }; },
      gasPost: async (a) => { L.gas.push(a); return { ok: true, via: 'gas' }; } };
    vm.createContext(ctx); vm.runInContext(F, ctx); vm.runInContext('STAFFPOST_SOLO = ' + JSON.stringify(solo) + ';', ctx);
    try { const r = await vm.runInContext('staffPost(' + JSON.stringify(action) + ', { uuid: "u1" })', ctx); return { r, L }; }
    catch (e) { return { lanciato: e.message, L }; }
  }
  const TIMBRO = { ok: true, borde: true, id_pedido: 'P1' };
  // leva spenta: come ieri
  { const x = await chiama('crearPedidoMesero', { body: { ok: false, error: 'sin_gate' }, status: 503 }); t('A · leva spenta, bordo senza timbro ⇒ GAS come ieri', x.L.gas[0] === 'crearPedidoMesero' && x.r.via === 'gas', x); }
  { const x = await chiama('marcarPedido', { lancia: true }); t('A2 · leva spenta, rete morta ⇒ GAS come ieri', x.L.gas.length === 1 && !x.lanciato, x); }
  { const x = await chiama('marcarPedido', { bw: false, body: TIMBRO }); t('A3 · leva spenta e bw spento ⇒ GAS senza bussare al bordo', x.L.fetch === 0 && x.L.gas.length === 1, x); }
  // leva accesa per un verbo
  { const x = await chiama('crearPedidoMesero', { solo: 'crearPedidoMesero', body: TIMBRO }); t('B · solo crear, timbrato ⇒ la risposta del bordo', x.r && x.r.borde === true && x.L.gas.length === 0, x); }
  { const x = await chiama('crearPedidoMesero', { solo: 'crearPedidoMesero', status: 503, body: { ok: false, error: 'sin_gate' } }); t('C · solo crear, sin_gate ⇒ LANCIA (il pedido va nella coda offline), MAI GAS', x.lanciato === 'sin_red' && x.L.gas.length === 0, x); }
  { const x = await chiama('crearPedidoMesero', { solo: 'crearPedidoMesero', status: 429, body: { ok: false, error: 'rate_limit' } }); t('C2 · rate_limit ⇒ lancia, niente GAS', x.lanciato === 'sin_red' && x.L.gas.length === 0, x); }
  { const x = await chiama('crearPedidoMesero', { solo: 'crearPedidoMesero', lancia: true }); t('D · rete morta/timeout ⇒ lancia «timeout» come gasPost, MAI GAS', x.lanciato === 'timeout' && x.L.gas.length === 0, x); }
  { const x = await chiama('marcarPedido', { solo: 'crearPedidoMesero', body: { ok: false, error: 'sin_gate' }, status: 503 }); t('E · un verbo fuori dall elenco ⇒ GAS come ieri', x.L.gas[0] === 'marcarPedido', x); }
  { const x = await chiama('marcarPedido', { solo: '1', body: { ok: false, need: 'gas', error: 'apagado' } }); t('F · «1» = tutti; need:gas ⇒ ok:false visibile col motivo, niente GAS', x.r && x.r.ok === false && x.r.sin_borde === true && x.r.error === 'apagado' && x.L.gas.length === 0, x); }
  { const x = await chiama('marcarPedido', { solo: '1', bw: false, body: TIMBRO }); t('G · leva accesa ⇒ bussa al bordo ANCHE con bw spento', x.L.fetch === 1 && x.r.borde === true && x.L.gas.length === 0, x); }
  { const x = await chiama('marcarPedido', { solo: '1', qs: '0', body: TIMBRO }); t('H · il freno del telefono ?bordew=0 vince: GAS diretto', x.L.fetch === 0 && x.L.gas.length === 1, x); }
  { const x = await chiama('moverMesa', { solo: ' crearPedidoMesero , moverMesa ', body: TIMBRO }); t('I · elenco con spazi', x.r.borde === true && x.L.gas.length === 0, x); }
  t('J · la leva si legge dal /salud e nasce vuota', /STAFFPOST_SOLO = String\(cercaK\(j, 'staffpost_solo_borde'\) == null \? '' : cercaK\(j, 'staffpost_solo_borde'\)\);/.test(SRC) && /let STAFFPOST_SOLO = '';/.test(SRC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['il guasto torna al GAS', "      throw new Error('sin_red');\n    }\n    _pennaDice('gas:'", "    }\n    _pennaDice('gas:'"],
    ['la rete torna al GAS', "    if (_solo) { _pennaDice('solo:' + (e && e.name === 'AbortError' ? 'timeout' : 'red')); throw new Error(e && e.name === 'AbortError' ? 'timeout' : 'sin_red'); }", ''],
    ['bw spento ferma anche il solo', "  if (!_solo && !bordeWriteOn() && !_ingreso)", "  if (!bordeWriteOn() && !_ingreso)"],
    ['il freno del telefono ignorato', "  if (BORDE_W.QS === '0') return false;   // il freno del telefono vince sempre", ''],
    ['elenco ignorato (tutti sempre)', "  return v.split(',').map(function (x) { return x.trim(); }).indexOf(String(action || '')) >= 0;", '  return true;'],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
