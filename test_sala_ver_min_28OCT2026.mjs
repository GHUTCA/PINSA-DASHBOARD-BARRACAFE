// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · la versione minima: un vetro difettoso si toglie dal centro (28-ott)
// Reperto: 🎛 V33 `Correggo la mia riga delle 16:44` (sì a sala_ver_min) · il 28 la .58 restava aperta sui telefoni e nessuno entrava nel turno.
// Gira `_verNum`, `_verSotto`, `_verMinMomentoSicuro`, `_verMinControlla` VERI di sala.html in vm. node test_sala_ver_min_28OCT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const i0 = SRC.indexOf('var SALA_VER_MIN = '); const decl = SRC.slice(i0, SRC.indexOf('function _verNum(', i0));
  const F = decl + fnVin(SRC, '_verNum') + fnVin(SRC, '_verSotto') + fnVin(SRC, '_verMinMomentoSicuro') + fnVin(SRC, '_verMinControlla');
  function giro({ mio = 'sala v3.228.58 · vetro', min = '3.228.59', entrada = false, entBtnDis = false, mesa = '', cola = 0, flushing = false, ovl = false, qs = {}, mem = {}, ora = 1e12 } = {}) {
    const L = { reload: 0, timer: 0 }; const el = { ver: { textContent: mio }, verBanner: { innerHTML: '', classList: { h: true, remove() { this.h = false; } } }, entBtn: { disabled: entBtnDis } };
    const ls = Object.assign({}, mem);
    const ctx = { $: (id) => el[id], STATE: { mesaAbierta: mesa }, COLA_FLUSHING: flushing, _colaGet: () => new Array(cola).fill({}), _entradaVisible: () => entrada,
      _salaVer: () => el.ver.textContent.trim(), QS: { get: (k) => (qs[k] == null ? null : qs[k]) }, JSON, String, Math,
      Date: { now: () => ora }, document: { querySelector: (q) => (ovl && q === '[id$="Ovl"].on' ? {} : null) },
      localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); } },
      location: { reload: () => { L.reload++; } }, setTimeout: () => { L.timer++; return 1; }, clearTimeout: () => {} };
    vm.createContext(ctx); vm.runInContext(F, ctx); vm.runInContext('SALA_VER_MIN = ' + JSON.stringify(min) + '; _verMinControlla();', ctx);
    return { L, banner: !el.verBanner.classList.h, ls };
  }
  { const x = giro({ entrada: true }); t('A · sotto il minimo, schermata d\'ingresso ferma ⇒ si ricarica', x.L.reload === 1, x); }
  { const x = giro({ entrada: true, entBtnDis: true }); t('A2 · all\'ingresso ma «ENTRANDO…» ⇒ non ora: avviso + riprova', x.L.reload === 0 && x.banner && x.L.timer === 1, x); }
  { const x = giro({}); t('B · in sala, mesa chiusa, niente coda, niente finestre ⇒ si ricarica', x.L.reload === 1, x); }
  { const x = giro({ mesa: '12' }); t('C · mesa aperta (chi incassa) ⇒ MAI ricarica: avviso rosso + riprova', x.L.reload === 0 && x.banner && x.L.timer === 1, x); }
  { const x = giro({ cola: 2 }); t('C2 · coda offline non vuota ⇒ non ora', x.L.reload === 0 && x.banner, x); }
  { const x = giro({ flushing: true }); t('C3 · coda in svuotamento ⇒ non ora', x.L.reload === 0 && x.banner, x); }
  { const x = giro({ ovl: true }); t('C4 · una finestra aperta (cobro/precuenta) ⇒ non ora', x.L.reload === 0 && x.banner, x); }
  { const x = giro({ mio: 'sala v3.228.59 · vetro' }); t('D · uguale al minimo ⇒ niente', x.L.reload === 0 && !x.banner, x); }
  { const x = giro({ mio: 'sala v3.229.0 · vetro' }); t('D2 · sopra il minimo ⇒ niente', x.L.reload === 0 && !x.banner, x); }
  { const x = giro({ mio: 'sala v3.228.9 · vetro', min: '3.228.59' }); t('D3 · confronto per NUMERI: .9 è sotto .59', x.L.reload === 1, x); }
  { const x = giro({ mio: 'sala v3.228.100 · vetro', min: '3.228.59' }); t('D4 · e .100 è sopra .59', x.L.reload === 0, x); }
  { const x = giro({ min: '' }); t('E · minimo vuoto ⇒ niente', x.L.reload === 0 && !x.banner, x); }
  { const x = giro({ min: 'boh' }); t('E2 · minimo illeggibile ⇒ niente', x.L.reload === 0 && !x.banner, x); }
  { const x = giro({ mio: '' }); t('E3 · versione propria illeggibile ⇒ niente', x.L.reload === 0, x); }
  { const x = giro({ qs: { vermin: '0' } }); t('F · freno del telefono ?vermin=0 ⇒ niente', x.L.reload === 0 && !x.banner, x); }
  { const x = giro({ mem: { sala_vermin_rl: JSON.stringify({ min: '3.228.59', ts: 1e12 - 60000 }) } });
    t('G · già ricaricata per questo minimo 1 min fa (Pages ancora vecchio) ⇒ niente giro in tondo, solo avviso', x.L.reload === 0 && x.banner, x); }
  { const x = giro({ mem: { sala_vermin_rl: JSON.stringify({ min: '3.228.59', ts: 1e12 - 11 * 60000 }) } }); t('G2 · tregua scaduta ⇒ riprova a ricaricare', x.L.reload === 1, x); }
  { const x = giro({ mem: { sala_vermin_rl: JSON.stringify({ min: '3.228.55', ts: 1e12 - 60000 }) } }); t('G3 · un minimo NUOVO non è in tregua', x.L.reload === 1, x); }
  { const x = giro({}); t('G4 · prima di ricaricare segna minimo e ora', JSON.parse(x.ls.sala_vermin_rl || '{}').min === '3.228.59', x); }
  t('H · /salud: la chiave sala_ver_min la legge e controlla (assente non tocca)', /\{ const _vm = cercaK\(j, 'sala_ver_min'\); if \(_vm != null\) \{ SALA_VER_MIN = String\(_vm\)\.trim\(\); _verMinControlla\(\); \} \}/.test(SRC));
  t('H2 · al ritorno in primo piano si ricontrolla', /_verCheck\(\);[^\n]*\n\s*_verMinControlla\(\);/.test(SRC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['confronto come testo', "for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i];", "if (String(mio) !== String(min)) return String(a) < String(b);"],
    ['ricarica anche con la mesa aperta', '    if (STATE.mesaAbierta) return false;\n', ''],
    ['ricarica con la coda piena', '    if (COLA_FLUSHING || _colaGet().length > 0) return false;\n', ''],
    ['ricarica con una finestra aperta', "    if (document.querySelector('[id$=\"Ovl\"].on')) return false;   // una finestra aperta (cobro, mesa, precuenta…)\n", ''],
    ['niente tregua (giro in tondo)', "    if (k && k.min === SALA_VER_MIN && Date.now() - k.ts < VERMIN_TREGUA_MS) { avviso(); return; }\n", ''],
    ['freno del telefono ignorato', " || QS.get('vermin') === '0'", ''],
    ['ricarica anche mentre ENTRANDO', "return !(b && b.disabled);", 'return true;'],
    ['ricarica anche a pari versione', 'return false;\n}\nfunction _verMinMomentoSicuro', 'return true;\n}\nfunction _verMinMomentoSicuro'],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r;
    try { r = await banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
