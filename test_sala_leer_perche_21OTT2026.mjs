// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · il perché di ogni lettura della sala che finisce su Google (21-ott)
// Richiesta: ⚙️ `ARQ V32 IL METRO DELLE CHIAMATE VERE E IL PRIMA DEL 21`. Gira `leerSala` e `_pennaConta` VERI in vm.
// node test_sala_leer_perche_21OTT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = 'var _PENNA_N = {}; var MUERTOS_ON = false;\n' + fnVin(SRC, '_pennaConta') + 'async ' + fnVin(SRC, 'leerSala');   // [24-ott] muertos neutro: la lettura di ieri
  async function leggi({ fallos = 0, status = 200, body, lancia = null, ultima = null }) {
    const L = { gas: 0, dice: [] };
    const ctx = { JSON, Object, Number, Math, Date, String, AbortController, setTimeout, clearTimeout, encodeURIComponent,
      MURO_ON: true, PENNA_TETTO: 999, _pennaSalva: () => {}, _pennaDice: (v) => L.dice.push(v),
      BORDE_SALA: { ON: true, fallos: fallos, fallosTs: Date.now(), URL: 'https://b', T: 't', MAX_EDAD_MS: 360000, MAX_EDAD_BORDE_MS: 600000 },
      BORDE_FALLBACK_ON: true, BANNER_EDAD_BORDE_ON: false, CFG: { LOCAL: 'BKS' }, STATE: {},
      _slugSalaJS: (n) => String(n).toLowerCase(), _fallbackUltimaVista: () => ultima,
      fetch: async () => { if (lancia) { const e = new Error('x'); e.name = lancia; throw e; } return { ok: status >= 200 && status < 300, status, json: async () => body }; },
      gasGet: async () => { L.gas++; return { ok: true, via: 'gas' }; } };
    vm.createContext(ctx); vm.runInContext(F, ctx);
    let r; try { r = await vm.runInContext('leerSala("C1", "Ana")', ctx); } catch (e) { r = { lanciato: e.message }; }
    return { r, L, N: JSON.parse(JSON.stringify(ctx._PENNA_N)) };
  }
  const ora = Date.now();
  const vista = (meseros, ts) => ({ ok: true, datos: { datos: { ok: true, meseros, ts_datos: ts } } });
  { const x = await leggi({ body: vista({ ana: { ok: true, mesas: [] } }, ora - 5000) });
    t('A · lettura buona dal bordo ⇒ nessun contatore, niente GAS', Object.keys(x.N).length === 0 && x.L.gas === 0, x); }
  { const x = await leggi({ body: vista({ pedro: { ok: true } }, ora) });
    t('B · nome non nella foto ⇒ leer:d:sin_nombre + leer:d:gas, etichetta del mesero intatta', x.N['leer:d:sin_nombre'] === 1 && x.N['leer:d:gas'] === 1 && x.L.dice.length === 0, x); }
  { const x = await leggi({ body: vista({ ana: { ok: true } }, ora - 3 * 3600000) });
    t('C · foto oltre il tetto ⇒ leer:d:foto_vieja + gas', x.N['leer:d:foto_vieja'] === 1 && x.N['leer:d:gas'] === 1, x); }
  { const x = await leggi({ status: 503, body: { ok: false } });
    t('D · HTTP 503 ⇒ leer:d:http_503, e il leer:bordo-red di sempre', x.N['leer:d:http_503'] === 1 && x.L.dice[0] === 'leer:bordo-red', x); }
  { const x = await leggi({ lancia: 'AbortError' });
    t('E · timeout ⇒ leer:d:timeout', x.N['leer:d:timeout'] === 1 && x.L.dice[0] === 'leer:bordo-red', x); }
  { const x = await leggi({ lancia: 'TypeError' });
    t('E2 · rete ⇒ leer:d:rete', x.N['leer:d:rete'] === 1, x); }
  { const x = await leggi({ lancia: 'SyntaxError' });
    t('E3 · JSON illeggibile ⇒ leer:d:json', x.N['leer:d:json'] === 1, x); }
  { const x = await leggi({ body: { ok: true, datos: null } });
    t('F · 200 senza dati ⇒ leer:d:sin_datos + gas', x.N['leer:d:sin_datos'] === 1 && x.N['leer:d:gas'] === 1, x); }
  { const x = await leggi({ fallos: 3 });
    t('G · pausa dei 3 fallimenti ⇒ leer:d:pausa + gas', x.N['leer:d:pausa'] === 1 && x.N['leer:d:gas'] === 1, x); }
  { const x = await leggi({ lancia: 'TypeError', ultima: { ok: true, vieja: 1 } });
    t('H · rete morta con ultima vista ⇒ niente leer:d:gas (non va a Google)', !x.N['leer:d:gas'] && x.L.gas === 0, x); }
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['senza sin_nombre', "        } else _pennaConta('leer:d:sin_nombre');", '        }'],
    ['senza pausa', "  if (bordoFalloRed) _pennaConta('leer:d:pausa');\n", ''],
    ['gas non contato', "  _pennaConta('leer:d:gas');\n", ''],
    ['il contatore cambia l etichetta', "function _pennaConta(v) {\n  if (!MURO_ON || !v) return;", "function _pennaConta(v) {\n  if (!MURO_ON || !v) return; _pennaDice(v);"],
    ['classe persa', "e && e.name === 'AbortError' ? 'timeout' : e && e.name === 'SyntaxError' ? 'json' : 'rete'", "'rete'"],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
