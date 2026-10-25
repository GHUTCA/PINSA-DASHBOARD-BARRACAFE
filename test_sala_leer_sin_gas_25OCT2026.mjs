// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · 1.1: la sala non legge più da Google quando il bordo non risponde (25-oct)
// Reperto: 🎛 `V32 UN PEZZO ALLA VOLTA ADESSO SOLO 1.1` — il 24 sera 8 `leer:d:gas` (forense del bordo: Jurley 18:54 ×7, Anthony 00:18 ×1, entrambi
// rete/timeout verso il bordo e nessuna ultima vista). Gira `leerSala` · `_fallbackUltimaVista` · `_saludAttendi` VERI in vm.
// node test_sala_leer_sin_gas_25OCT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = 'var _PENNA_N = {};\n' + fnVin(SRC, '_pennaConta') + fnVin(SRC, '_fallbackUltimaVista') + (SRC.includes('function _saludAttendi(') ? 'async ' + fnVin(SRC, '_saludAttendi') : '') + 'async ' + fnVin(SRC, 'leerSala');
  // fetch: 'rete' (lancia) · 'sin_nombre' (200 ok, il mio nome non c'è) ; salud: 'tarda' (accende la leva dopo 20 ms) · 'muta' · null
  async function leggi({ fetchK = 'rete', bfb = false, tel = null, salud = null, vista = null }) {
    const L = { gas: 0, dice: [] };
    const ctx = { JSON, Object, Number, Math, Date, String, Promise, AbortController, setTimeout, clearTimeout, encodeURIComponent,
      MURO_ON: true, PENNA_TETTO: 999, _pennaSalva: () => {}, _pennaDice: (v) => L.dice.push(v), MUERTOS_ON: false,
      BORDE_SALA: { ON: true, fallos: 0, fallosTs: 0, URL: 'https://b', T: 't', MAX_EDAD_MS: 900000, MAX_EDAD_BORDE_MS: 900000 },
      BANNER_EDAD_BORDE_ON: false, CFG: { LOCAL: 'BKS' }, STATE: vista ? { sala: { ok: true, mesas: [{ mesa: '12' }] }, salaTs: Date.now() - 40000 } : {},
      _slugSalaJS: (n) => String(n).toLowerCase(),
      fetch: async () => { if (fetchK === 'rete') { const e = new Error('x'); e.name = 'AbortError'; throw e; }
        return { ok: true, status: 200, json: async () => ({ ok: true, datos: { edad_ms: 100, datos: { ok: true, ts_datos: Date.now(), meseros: { otro: { ok: true } } } } }) }; },
      gasGet: async () => { L.gas++; return { ok: true, via: 'gas' }; } };
    vm.createContext(ctx);
    vm.runInContext('var BORDE_FALLBACK_ON = ' + bfb + '; var BORDE_FALLBACK_TEL = ' + JSON.stringify(tel) + '; var SALUD_LEVE_P = null;\n' + F, ctx);
    if (salud === 'tarda') ctx.SALUD_LEVE_P = new Promise((r) => setTimeout(() => { vm.runInContext('BORDE_FALLBACK_ON = true;', ctx); r(); }, 20));
    if (salud === 'muta') ctx.SALUD_LEVE_P = new Promise(() => {});
    let r; try { r = await vm.runInContext('leerSala("C1", "Jurley")', ctx); } catch (e) { r = { lanciato: e.message }; }
    return { r, L, N: JSON.parse(JSON.stringify(ctx._PENNA_N)) };
  }
  { const x = await leggi({ salud: 'tarda' });
    t('A · Jurley 18:54: appena caricata, rete giù, /salud non ancora letto, nessuna vista ⇒ aspetta /salud, leva accesa ⇒ si lancia, ZERO Google', x.L.gas === 0 && x.r.lanciato === 'sin_red' && x.N['leer:d:sin_gas'] === 1 && !x.N['leer:d:gas'], x); }
  { const x = await leggi({ bfb: true });
    t('B · leva accesa, rete giù, nessuna vista ⇒ si lancia (il catch del poll mostra la foto salvata), ZERO Google', x.L.gas === 0 && x.r.lanciato === 'sin_red', x); }
  { const x = await leggi({ bfb: true, vista: true });
    t('C · leva accesa, rete giù, con una vista di 40 s ⇒ l ultima vista dichiarata (come dal 21-ott)', x.L.gas === 0 && x.r._vieja_s >= 39 && x.L.dice.indexOf('leer:fallback-vieja') >= 0, x); }
  { const x = await leggi({ bfb: true, fetchK: 'sin_nombre', vista: true });
    t('D · il mio nome non c è nella foto ma ho una vista ⇒ l ultima vista, ZERO Google', x.L.gas === 0 && x.r._vieja_s >= 39, x); }
  { const x = await leggi({ bfb: true, fetchK: 'sin_nombre' });
    t('E · il mio nome non c è e nessuna vista (appena entrato) ⇒ Google, contato a parte (gas_sin_vista)', x.L.gas === 1 && x.N['leer:d:gas_sin_vista'] === 1 && x.N['leer:d:gas'] === 1, x); }
  { const x = await leggi({ salud: 'muta' });
    t('F · /salud muto e leva spenta ⇒ dopo l attesa, Google come ieri', x.L.gas === 1 && !x.r.lanciato, x); }
  { const x = await leggi({ tel: '0', salud: 'tarda' });
    t('G · il freno del telefono (?bfb=0) ⇒ non aspetta, Google come ieri', x.L.gas === 1, x); }
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['non aspetta /salud', "  if ((bordoFalloRed || fotoVieja) && !BORDE_FALLBACK_ON && BORDE_FALLBACK_TEL === null) await _saludAttendi(1500);\n", ''],
    ['senza vista va a Google', "    if (bordoFalloRed) { _pennaConta('leer:d:sin_gas'); throw new Error('sin_red'); }\n", ''],
    ['sin_nombre non usa la vista', "    const ultima = _fallbackUltimaVista();\n    if (ultima) { _pennaDice('leer:fallback-vieja'); return ultima; }\n    if (bordoFalloRed)", "    if (bordoFalloRed)"],
    ['aspetta anche col freno', '!BORDE_FALLBACK_ON && BORDE_FALLBACK_TEL === null) await', '!BORDE_FALLBACK_ON) await'],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r;
    try { r = await Promise.race([banco(ORIG.split(a).join(b), true), new Promise((ok) => setTimeout(() => ok({ ko: 1 }), 4000))]); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1; setTimeout(() => process.exit(), 50);
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; setTimeout(() => process.exit(), 50); }
