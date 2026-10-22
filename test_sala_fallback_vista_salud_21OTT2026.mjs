// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · l'ultima vista buona invece di Google, a leva della flotta (21-ott)
// Richiesta: ⚙️ `ARQ V32 LEER BORDO RED IL BORDO E SANO IL TEMPO SI PERDE PRIMA`. Gira la leva VERA (telefono + /salud) e `leerSala` VERA in vm.
// node test_sala_fallback_vista_salud_21OTT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  // ① la leva
  const iT = SRC.indexOf('const BORDE_FALLBACK_TEL = (function () {'); if (iT < 0) throw new Error('leva');
  const TEL = SRC.slice(iT, SRC.indexOf('})();', iT) + 5) + '\n' + SRC.slice(SRC.indexOf('let BORDE_FALLBACK_ON = '), SRC.indexOf('\n', SRC.indexOf('let BORDE_FALLBACK_ON = ')));
  const iR = SRC.indexOf('      if (BORDE_FALLBACK_TEL === null) {'); if (iR < 0) throw new Error('riga salud');
  const RS = SRC.slice(iR, SRC.indexOf('\n', iR));
  const leva = (q, mem, salud) => { const st = Object.assign({}, mem); let badge = 0;
    const ctx = { String, QS: { get: (k) => (k === 'bfb' ? q : null) }, localStorage: { getItem: (k) => (k in st ? st[k] : null), setItem: (k, v) => { st[k] = v; } },
      cercaK: (j, k) => j[k], _pintarGuardiaBadge: () => { badge++; } };
    vm.createContext(ctx); vm.runInContext(TEL + '\nthis.prima = BORDE_FALLBACK_ON;\nvar j = ' + JSON.stringify(salud) + ';\n' + RS + '\nthis.dopo = BORDE_FALLBACK_ON;', ctx);
    return { prima: ctx.prima, dopo: ctx.dopo, badge }; };
  { const x = leva(null, {}, {}); t('A · telefono muto, /salud senza la chiave ⇒ spenta (come oggi)', x.prima === false && x.dopo === false && x.badge === 0, x); }
  { const x = leva(null, {}, { borde_fallback_on: '1' }); t('B · telefono muto, borde_fallback_on "1" ⇒ accesa su tutta la flotta, e il badge si ridipinge', x.dopo === true && x.badge === 1, x); }
  { const x = leva('0', {}, { borde_fallback_on: '1' }); t('C · ?bfb=0 vince sulla leva accesa', x.dopo === false, x); }
  { const x = leva(null, { sala_bfb: '0' }, { borde_fallback_on: '1' }); t('C2 · un telefono spento a mano in passato resta spento', x.dopo === false, x); }
  { const x = leva(null, { sala_bfb: '1' }, { borde_fallback_on: '0' }); t('D · un telefono acceso a mano resta acceso a leva spenta', x.prima === true && x.dopo === true, x); }
  // ② leerSala: il timeout di Ruth
  const F = 'var _PENNA_N = {};\n' + fnVin(SRC, '_pennaConta') + fnVin(SRC, '_fallbackUltimaVista') + 'async ' + fnVin(SRC, 'leerSala');
  async function leggi({ bfb, lancia = 'AbortError', salaTs = Date.now() - 30000 }) {
    const L = { gas: 0, dice: [] };
    const ctx = { JSON, Object, Number, Math, Date, String, AbortController, setTimeout, clearTimeout, encodeURIComponent,
      MURO_ON: true, PENNA_TETTO: 999, _pennaSalva: () => {}, _pennaDice: (v) => L.dice.push(v),
      BORDE_SALA: { ON: true, fallos: 0, fallosTs: 0, URL: 'https://b', T: 't', MAX_EDAD_MS: 900000, MAX_EDAD_BORDE_MS: 900000 },
      BORDE_FALLBACK_ON: bfb, BANNER_EDAD_BORDE_ON: false, CFG: { LOCAL: 'BKS' },
      STATE: { sala: { ok: true, mesas: [{ mesa: '12' }] }, salaTs: salaTs }, _slugSalaJS: (n) => String(n).toLowerCase(),
      fetch: async () => { const e = new Error('x'); e.name = lancia; throw e; },
      gasGet: async () => { L.gas++; return { ok: true, via: 'gas' }; } };
    vm.createContext(ctx); vm.runInContext(F, ctx);
    const r = await vm.runInContext('leerSala("C1", "Ruth")', ctx);
    return { r, L, N: JSON.parse(JSON.stringify(ctx._PENNA_N)) };
  }
  { const x = await leggi({ bfb: false }); t('E · leva spenta: il timeout va a Google (la sera di Ruth)', x.L.gas === 1 && x.N['leer:d:gas'] === 1, x); }
  { const x = await leggi({ bfb: true }); t('F · leva accesa: il timeout mostra l ultima vista con la sua età, ZERO Google', x.L.gas === 0 && x.r.mesas && x.r._vieja_s >= 29 && x.L.dice.indexOf('leer:fallback-vieja') >= 0, x); }
  { const x = await leggi({ bfb: true, lancia: 'TypeError' }); t('F2 · leva accesa: anche la rete morta', x.L.gas === 0 && x.r._vieja_s >= 29, x); }
  { const x = await leggi({ bfb: true, salaTs: Date.now() - 20 * 60000 }); t('G · ultima vista oltre i 15 min ⇒ Google come prima (il tetto di sempre)', x.L.gas === 1, x); }
  // ③ la catena di 💵 (`EL GIRO V32 57C6174 … L ETA SI AZZERA`): rete giù per N minuti, un giro ogni 20 s, con le righe VERE del poll dopo la lettura
  const iP = SRC.indexOf('    STATE.sala = r;\n'); const iQ = SRC.indexOf('    STATE.salaTs = ', iP);
  if (iP < 0 || iQ < 0 || iQ - iP > 1200) throw new Error('righe del poll');
  const POLL = SRC.slice(iP, SRC.indexOf('\n', iQ) + 1);
  async function catena(minuti) { return catena2(minuti, 20); }
  async function catena2(minuti, passo) {
    let ora = 1e12; const L = { gas: 0, giri: [] };
    class D extends Date { constructor(...a) { super(...(a.length ? a : [ora])); } static now() { return ora; } }
    const ctx = { JSON, Object, Number, Math, Date: D, String, AbortController, setTimeout, clearTimeout, encodeURIComponent,
      MURO_ON: true, PENNA_TETTO: 999, _pennaSalva: () => {}, _pennaDice: () => {},
      BORDE_SALA: { ON: true, fallos: 0, fallosTs: 0, URL: 'https://b', T: 't', MAX_EDAD_MS: 900000, MAX_EDAD_BORDE_MS: 900000 },
      BORDE_FALLBACK_ON: true, BANNER_EDAD_BORDE_ON: false, CFG: { LOCAL: 'BKS' }, STATE: { sala: { ok: true, mesas: [] }, salaTs: ora },
      _slugSalaJS: (n) => String(n).toLowerCase(),
      fetch: async () => { const e = new Error('x'); e.name = 'AbortError'; throw e; },
      gasGet: async () => { L.gas++; return { ok: true, via: 'gas' }; } };
    vm.createContext(ctx); vm.runInContext(F + '\nasync function giro() { let r = await leerSala("C1", "Ruth");\n' + POLL + ' return r; }', ctx);
    const t0 = ora;
    for (let s = passo; s <= minuti * 60; s += passo) {
      ora = t0 + s * 1000; ctx.BORDE_SALA.fallos = 0;   // il respiro dei 90 s non conta qui: ogni giro arriva al ripiego
      const r = await vm.runInContext('giro()', ctx);
      L.giri.push({ s, via: r.via === 'gas' ? 'gas' : 'vieja', dich: r._vieja_s });
    }
    return L;
  }
  { const L = await catena(2); const male = L.giri.filter((g) => g.via === 'vieja' && Math.abs(g.dich - g.s) > 1);
    t('H · 2 min di rete giù: l età DICHIARATA è quella VERA a ogni giro (N4), non riparte da 20 s', male.length === 0 && L.gas === 0, male.slice(0, 4)); }
  { const L = await catena(25); const primoGas = L.giri.find((g) => g.via === 'gas');
    t('I · 25 min di rete giù: oltre i 15 min si torna a Google (il tetto scatta)', !!primoGas && primoGas.s > 880 && primoGas.s <= 920, primoGas || L.giri.slice(-2)); }
  { // il giallo di 💵: passo 17,3 s, l'arrotondamento al secondo non si accumula
    const L = await catena2(14.9, 17.3); const ult = L.giri.filter((g) => g.via === 'vieja').pop();
    t('J · passo 17,3 s per ~15 min: l età dichiarata non resta indietro (≤ 1 s)', !!ult && Math.abs(ult.dich - ult.s) <= 1, ult); }
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['il /salud ignorato', "const _bfb = String(cercaK(j, 'borde_fallback_on')) === '1';", 'const _bfb = BORDE_FALLBACK_ON;'],
    ['il telefono non vince', 'if (BORDE_FALLBACK_TEL === null) {', 'if (true) {'],
    ['accesa di fabbrica', "let BORDE_FALLBACK_ON = BORDE_FALLBACK_TEL === '1';", "let BORDE_FALLBACK_ON = BORDE_FALLBACK_TEL !== '0';"],
    ['il badge non si ridipinge', 'BORDE_FALLBACK_ON = _bfb; _pintarGuardiaBadge();', 'BORDE_FALLBACK_ON = _bfb;'],
    ['l età si azzera a ogni giro (il rosso di 💵)', "STATE.salaTs = Date.now() - (typeof r._vieja_ms", 'STATE.salaTs = Date.now() - 0 * (typeof r._vieja_ms'],
    ['i ms non viaggiano (il giallo di 💵)', 'vieja._vieja_ms = edad;', ''],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
