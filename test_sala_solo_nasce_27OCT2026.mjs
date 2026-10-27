// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · la lista «solo bordo» vuota all'avvio non manda il clockIn al GAS (27-oct)
// Reperto: 🎛 V33 `CONTROLLER V33 su QUARTA V32 LE PROVE DELLA CENA DEL 26` — il clockIn delle 20:22 del 26 su v3.228.54, con `clockIn` nella lista.
// Gira _soloBorde · staffPost · _saludAttendi VERI in vm. node test_sala_solo_nasce_27OCT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = 'let STAFFPOST_SOLO = "";\nvar SALUD_LEVE_P = null;\n' + fnVin(SRC, '_soloBorde') + (SRC.includes('function _saludAttendi(') ? 'async ' + fnVin(SRC, '_saludAttendi') : '') + 'async ' + fnVin(SRC, 'staffPost');
  async function chiama({ salud, risposta }) {
    const L = { gas: [], fetch: 0 };
    const ctx = { BORDE_W: { QS: '', ok: {} }, STATE: { sala: { bw: true } }, BORDE_SALA: { URL: 'https://b', T: 't' }, CFG: { LOCAL: 'BKS' }, APP_ID: 'sala',
      JSON, Object, String, Promise, setTimeout, clearTimeout, AbortController, encodeURIComponent, Date,
      bordeWriteOn: () => true, _salaVer: () => 'v', _muroCampi: () => ({}), _vediNoAsignado: (j) => j, _pennaSvuota: () => {}, _pennaDice: () => {}, _cadutaMarca: (a, r) => r,
      fetch: async () => { L.fetch++; return { status: 200, json: async () => risposta }; }, gasPost: async (a) => { L.gas.push(a); return { ok: true, via: 'gas' }; } };
    vm.createContext(ctx); vm.runInContext(F, ctx);
    if (salud === 'tarda') vm.runInContext('SALUD_LEVE_P = new Promise(function (r) { setTimeout(function () { STAFFPOST_SOLO = "crearPedidoMesero,clockIn"; r(); }, 20); });', ctx);
    if (salud === 'muta') vm.runInContext('SALUD_LEVE_P = new Promise(function () {});', ctx);
    let r; try { r = await vm.runInContext('staffPost("clockIn", { codigo: "1234", nombre: "Ruth" }, { ingreso: true })', ctx); } catch (e) { r = { lanciato: e.message }; }
    return { r, L };
  }
  const NEED = { ok: false, need: 'gas', error: 'sin_replica' };
  { const x = await chiama({ salud: 'tarda', risposta: NEED });
    t('A · appena caricata, lista ancora vuota, /salud porta clockIn ⇒ il clockIn resta del bordo: need:gas torna visibile, MAI il GAS', x.L.gas.length === 0 && x.r && x.r.sin_borde === true, x); }
  { const x = await chiama({ salud: 'tarda', risposta: { ok: true, borde: true, nombre: 'Ruth' } });
    t('B · stesso avvio, bordo timbrato ⇒ la risposta del bordo', x.r.borde === true && x.L.gas.length === 0, x); }
  { const x = await chiama({ salud: 'muta', risposta: NEED });
    t('C · /salud muto ⇒ dopo l attesa, la lista resta vuota: il ripiego di ieri (GAS)', x.L.gas[0] === 'clockIn', x); }
  { const x = await chiama({ salud: null, risposta: NEED });
    t('D · nessuna lettura di /salud in corso, lista vuota ⇒ come ieri, senza attesa', x.L.gas[0] === 'clockIn', x); }
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [['niente attesa con la lista vuota', '  if (!STAFFPOST_SOLO) await _saludAttendi(1500);\n', '']];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r;
    try { r = await Promise.race([banco(ORIG.split(a).join(b), true), new Promise((ok) => setTimeout(() => ok({ ko: 1 }), 5000))]); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1; setTimeout(() => process.exit(), 50);
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; setTimeout(() => process.exit(), 50); }
