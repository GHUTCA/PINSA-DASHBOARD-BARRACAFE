// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · la lista «solo bordo» nasce piena nel vetro (27-oct)
// Reperto: 🎛 V33 `CONTROLLER V33 su ARQ V32 6.5 I CLOCKIN` — STAFFPOST_SOLO nasceva '' e, finché /salud non rispondeva, il clockIn ripiegava sul GAS.
// Gira la riga VERA della lista, _soloBorde e staffPost VERI in vm. node test_sala_solo_nasce_27OCT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const i0 = SRC.indexOf('let STAFFPOST_SOLO = '); const riga = SRC.slice(i0, SRC.indexOf('\n', i0));
  const F = riga + '\nvar SALUD_LEVE_P = null;\n' + fnVin(SRC, '_soloBorde') + (SRC.includes('function _saludAttendi(') ? 'async ' + fnVin(SRC, '_saludAttendi') : 'async function _saludAttendi() {}\n') + 'async ' + fnVin(SRC, 'staffPost');
  async function chiama({ lista, risposta, action = 'clockIn', qs = '' }) {
    const L = { gas: [], fetch: 0 };
    const ctx = { BORDE_W: { QS: qs, ok: {} }, STATE: { sala: { bw: true } }, BORDE_SALA: { URL: 'https://b', T: 't' }, CFG: { LOCAL: 'BKS' }, APP_ID: 'sala',
      JSON, Object, String, Promise, setTimeout, clearTimeout, AbortController, encodeURIComponent, Date,
      bordeWriteOn: () => qs !== '0', _salaVer: () => 'v', _muroCampi: () => ({}), _vediNoAsignado: (j) => j, _pennaSvuota: () => {}, _pennaDice: () => {}, _cadutaMarca: (a, r) => r,
      fetch: async () => { L.fetch++; return { status: 200, json: async () => risposta }; }, gasPost: async (a) => { L.gas.push(a); return { ok: true, via: 'gas' }; } };
    vm.createContext(ctx); vm.runInContext(F, ctx);
    if (lista !== undefined) vm.runInContext('STAFFPOST_SOLO = ' + JSON.stringify(lista) + ';', ctx);
    let r; try { r = await vm.runInContext('staffPost(' + JSON.stringify(action) + ', { codigo: "1234", nombre: "Ruth" }, { ingreso: true })', ctx); } catch (e) { r = { lanciato: e.message }; }
    return { r, L };
  }
  const NEED = { ok: false, need: 'gas', error: 'sin_replica' };
  { const x = await chiama({ risposta: NEED });
    t('A · appena caricata, /salud non ancora arrivato: il clockIn è già «solo bordo» ⇒ need:gas visibile, MAI il GAS', x.L.gas.length === 0 && x.r && x.r.sin_borde === true, x); }
  { const x = await chiama({ risposta: { ok: true, borde: true, nombre: 'Ruth' } });
    t('B · stesso avvio, bordo timbrato ⇒ la risposta del bordo', x.r.borde === true && x.L.gas.length === 0, x); }
  { const x = await chiama({ risposta: NEED, action: 'marcarPedido' }); t('B2 · anche marcarPedido nasce solo bordo', x.L.gas.length === 0, x); }
  { const x = await chiama({ lista: '', risposta: NEED }); t('C · /salud che svuota la lista ("") ⇒ il ripiego di ieri (GAS): la leva del bordo comanda', x.L.gas[0] === 'clockIn', x); }
  { const x = await chiama({ qs: '0', risposta: NEED }); t('D · il freno del telefono ?bordew=0 ⇒ niente solo-bordo', x.L.gas[0] === 'clockIn' && x.L.fetch === 0, x); }
  t('E · /salud cambia la lista solo se porta la chiave', /\{ const _sp = cercaK\(j, 'staffpost_solo_borde'\); if \(_sp != null\) STAFFPOST_SOLO = String\(_sp\); \}/.test(SRC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['nasce vuota', "let STAFFPOST_SOLO = 'crearPedidoMesero,marcarPedido,moverMesa,emitirPreCuenta,clockIn';", "let STAFFPOST_SOLO = '';"],
    ['nasce senza clockIn', "emitirPreCuenta,clockIn';", "emitirPreCuenta';"],
    ['la chiave assente svuota', "if (_sp != null) STAFFPOST_SOLO = String(_sp);", "STAFFPOST_SOLO = String(_sp == null ? '' : _sp);"],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r;
    try { r = await banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1; setTimeout(() => process.exit(), 50);
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; setTimeout(() => process.exit(), 50); }
