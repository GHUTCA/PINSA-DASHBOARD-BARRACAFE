// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · un mesero ENTRA nel primo minuto di un turno nuovo (28-ott)
// Reperto: 🎛 V33 `V33 EMERGENZA NESSUNO ENTRA NEL TURNO` + ⚙️ `ARQ V32 CAUSA NESSUNO ENTRA SIN GATE` + decisione `CONTROLLER V33 su ARQ V32 CAUSA NESSUNO ENTRA`.
// Alle 15:35 il codice PM non era ancora nel gate del bordo ⇒ 503 sin_gate; la .58 lo trasformava in un muro muto. Gira `entrar`, `staffPost`, `_soloBorde`
// VERI di sala.html in vm: il bordo del primo minuto risponde come il bordo vivo (a2aa859), il libro accetta. Criterio: entrarSala() chiamata, nessun errore.
// node test_sala_ingreso_primo_minuto_28OCT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
// le risposte del bordo vivo nel primo minuto (lette in a2aa859 `_pedidoStaff`): nessuna porta `borde:true`
const PRIMO_MINUTO = [
  ['503 sin_gate gate_no_match (codice nuovo non ancora nel gate)', 503, { ok: false, error: 'sin_gate', motivo: 'gate_no_match' }],
  ['503 sin_gate (gate vecchio)', 503, { ok: false, error: 'sin_gate', edad_ms: 95000 }],
  ['need:gas sin_asignaciones', 200, { ok: false, need: 'gas', error: 'sin_replica', motivo: 'sin_asignaciones' }],
  ['need:gas contrato_incompleto', 200, { ok: false, need: 'gas', error: 'sin_replica', motivo: 'contrato_incompleto' }],
  ['need:gas apagado (CLOCKIN_BORDE_ON spenta)', 200, { ok: false, need: 'gas', error: 'apagado' }],
  ['rete morta', 0, null],
];
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const i0 = SRC.indexOf('let STAFFPOST_SOLO = '); const riga = SRC.slice(i0, SRC.indexOf('\n', i0));
  const F = riga + '\nlet _CLOCKIN_UID = null;\n' + fnVin(SRC, '_soloBorde') + 'async ' + fnVin(SRC, 'staffPost') + 'async ' + fnVin(SRC, 'entrar');
  async function entra({ status, body, lista }) {
    const L = { gas: [], fetch: 0, sala: 0 }; const el = {};
    const $ = (id) => (el[id] = el[id] || { value: id === 'entCodigo' ? '3946' : id === 'entNombre' ? 'Wilbert' : '', textContent: '', disabled: false, classList: { add() {}, remove() {} } });
    const ctx = { $, BAUTISMO: false, deviceToken: 'x', BORDE_W: { QS: '', ok: {} }, STATE: { sala: null }, BORDE_SALA: { URL: 'https://b', T: 't' },
      CFG: { LOCAL: 'BKS', SK: { COD: 'c', NOM: 'n', LOC: 'l' } }, APP_ID: 'sala', localStorage: { setItem() {} },
      JSON, Object, String, Date, Math, Promise, setTimeout, clearTimeout, AbortController, encodeURIComponent,
      bordeWriteOn: () => false /* all'ingresso la sala non c'è ancora */, _salaVer: () => 'v', _muroCampi: () => ({}), _vediNoAsignado: (j) => j,
      _pennaSvuota() {}, _pennaDice() {}, _cadutaMarca: (a, r) => r, toast() {}, _ofreceCorteSinPlaza() {}, entrarSala: () => { L.sala++; },
      fetch: async () => { L.fetch++; if (!status) throw new TypeError('Failed to fetch'); return { status, json: async () => body }; },
      gasPost: async (a, b) => { L.gas.push(a); return { ok: true, nombre: b.nombre, marcaje_nuevo: true }; } };
    vm.createContext(ctx); vm.runInContext(F, ctx);
    if (lista !== undefined) vm.runInContext('STAFFPOST_SOLO = ' + JSON.stringify(lista) + ';', ctx);
    let lanciato = null; try { await vm.runInContext('entrar()', ctx); } catch (e) { lanciato = e.message; }
    return { L, err: $('entErr').textContent, lanciato };
  }
  for (const [nome, status, body] of PRIMO_MINUTO) for (const [ln, lista] of [['lista di nascita', undefined], ['/salud "1" (tutti)', '1'], ['/salud con clockIn', 'crearPedidoMesero,clockIn']]) {
    const x = await entra({ status, body, lista });
    t('ENTRA · ' + nome + ' · ' + ln, x.L.sala === 1 && x.L.gas[0] === 'clockIn' && !x.err && !x.lanciato, x);
  }
  { const x = await entra({ status: 200, body: { ok: true, borde: true, nombre: 'Wilbert', marcaje_nuevo: true } });
    t('ENTRA dal bordo quando il bordo timbra: niente libro', x.L.sala === 1 && x.L.gas.length === 0, x); }
  { const x = await entra({ status: 200, body: { ok: false, borde: true, error: 'no_asignado', mensaje: 'No estás en el turno' } });
    t('un NO timbrato resta un NO, con la sua frase (non è un muro muto)', x.L.sala === 0 && x.err === 'No estás en el turno' && x.L.gas.length === 0, x); }
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['l ingresso torna solo bordo (il difetto delle 15:35)', 'const _solo = _soloBorde(action) && !_ingreso;', 'const _solo = _soloBorde(action);'],
    ['l ingresso non bussa e non ripiega', "const _ingreso = !!(opts && opts.ingreso) && BORDE_W.QS !== '0';", 'const _ingreso = false;'],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r;
    try { r = await banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1; setTimeout(() => process.exit(), 50);
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; setTimeout(() => process.exit(), 50); }
