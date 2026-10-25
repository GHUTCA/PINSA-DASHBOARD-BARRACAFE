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
  const iR = SRC.indexOf('      if (BORDE_FALLBACK_TEL === null');   // [25-ott] la riga ora porta anche «chiave presente» if (iR < 0) throw new Error('riga salud');
  const RS = SRC.slice(iR, SRC.indexOf('\n', iR));
  const leva = (q, mem, salud) => { const st = Object.assign({}, mem); let badge = 0;
    const ctx = { String, QS: { get: (k) => (k === 'bfb' ? q : null) }, localStorage: { getItem: (k) => (k in st ? st[k] : null), setItem: (k, v) => { st[k] = v; } },
      cercaK: (j, k) => j[k], _pintarGuardiaBadge: () => { badge++; } };
    vm.createContext(ctx); vm.runInContext(TEL + '\nthis.prima = BORDE_FALLBACK_ON;\nvar j = ' + JSON.stringify(salud) + ';\n' + RS + '\nthis.dopo = BORDE_FALLBACK_ON;', ctx);
    return { prima: ctx.prima, dopo: ctx.dopo, badge }; };
  { const x = leva(null, {}, {}); t('A · [25-ott · V33 1.1] telefono muto, /salud senza la chiave ⇒ ACCESA di nascita, e la chiave assente non la tocca (un telefono che non raggiunge il bordo resta senza Google)', x.prima === true && x.dopo === true && x.badge === 0, x); }
  { const x = leva(null, {}, { borde_fallback_on: '0' }); t('A2 · /salud dice "0" esplicito ⇒ spenta su tutta la flotta (il freno di BKP), e il badge si ridipinge', x.prima === true && x.dopo === false && x.badge === 1, x); }
  { const x = leva(null, {}, { borde_fallback_on: '1' }); t('B · telefono muto, borde_fallback_on "1" ⇒ accesa, nessun cambio (era già accesa)', x.dopo === true && x.badge === 0, x); }
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
      BORDE_FALLBACK_ON: bfb, BANNER_EDAD_BORDE_ON: false, BORDE_FALLBACK_TEL: null, _saludAttendi: async () => {}, CFG: { LOCAL: 'BKS' },
      STATE: { sala: { ok: true, mesas: [{ mesa: '12' }] }, salaTs: salaTs }, _slugSalaJS: (n) => String(n).toLowerCase(),
      fetch: async () => { const e = new Error('x'); e.name = lancia; throw e; },
      gasGet: async () => { L.gas++; return { ok: true, via: 'gas' }; } };
    vm.createContext(ctx); vm.runInContext(F, ctx);
    let r; try { r = await vm.runInContext('leerSala("C1", "Ruth")', ctx); } catch (e) { r = { lanciato: e.message }; }   // [25-ott · 1.1] a leva accesa senza vista si lancia
    return { r, L, N: JSON.parse(JSON.stringify(ctx._PENNA_N)) };
  }
  { const x = await leggi({ bfb: false }); t('E · leva spenta: il timeout va a Google (la sera di Ruth)', x.L.gas === 1 && x.N['leer:d:gas'] === 1, x); }
  { const x = await leggi({ bfb: true }); t('F · leva accesa: il timeout mostra l ultima vista con la sua età, ZERO Google', x.L.gas === 0 && x.r.mesas && x.r._vieja_s >= 29 && x.L.dice.indexOf('leer:fallback-vieja') >= 0, x); }
  { const x = await leggi({ bfb: true, lancia: 'TypeError' }); t('F2 · leva accesa: anche la rete morta', x.L.gas === 0 && x.r._vieja_s >= 29, x); }
  { const x = await leggi({ bfb: true, salaTs: Date.now() - 20 * 60000 }); t('G · ultima vista oltre i 15 min ⇒ [25-ott · 1.1] niente Google: si lancia come la rete morta (il catch del poll mostra la foto salvata dichiarata)', x.L.gas === 0 && x.r && x.r.lanciato === 'sin_red', x); }
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
      BORDE_FALLBACK_ON: true, BANNER_EDAD_BORDE_ON: false, BORDE_FALLBACK_TEL: null, _saludAttendi: async () => {}, CFG: { LOCAL: 'BKS' }, STATE: { sala: { ok: true, mesas: [] }, salaTs: ora },
      _slugSalaJS: (n) => String(n).toLowerCase(),
      fetch: async () => { const e = new Error('x'); e.name = 'AbortError'; throw e; },
      gasGet: async () => { L.gas++; return { ok: true, via: 'gas' }; } };
    vm.createContext(ctx); vm.runInContext(F + '\nasync function giro() { let r = await leerSala("C1", "Ruth");\n' + POLL + ' return r; }', ctx);
    const t0 = ora;
    for (let s = passo; s <= minuti * 60; s += passo) {
      ora = t0 + s * 1000; ctx.BORDE_SALA.fallos = 0;   // il respiro dei 90 s non conta qui: ogni giro arriva al ripiego
      let r; try { r = await vm.runInContext('giro()', ctx); } catch (e) { r = { via: 'lancia' }; }   // [25-ott · 1.1] oltre il tetto si lancia, non si va a Google
      L.giri.push({ s, via: r.via === 'gas' ? 'gas' : r.via === 'lancia' ? 'lancia' : 'vieja', dich: r._vieja_s });
    }
    return L;
  }
  { const L = await catena(2); const male = L.giri.filter((g) => g.via === 'vieja' && Math.abs(g.dich - g.s) > 1);
    t('H · 2 min di rete giù: l età DICHIARATA è quella VERA a ogni giro (N4), non riparte da 20 s', male.length === 0 && L.gas === 0, male.slice(0, 4)); }
  { const L = await catena(25); const primo = L.giri.find((g) => g.via !== 'vieja');
    t('I · 25 min di rete giù: oltre i 15 min il tetto scatta e [25-ott · 1.1] si lancia (il catch del poll dichiara la sala morta), MAI Google', !!primo && primo.via === 'lancia' && primo.s > 880 && primo.s <= 920 && L.gas === 0, primo || L.giri.slice(-2)); }
  { // il giallo di 💵: passo 17,3 s, l'arrotondamento al secondo non si accumula
    const L = await catena2(14.9, 17.3); const ult = L.giri.filter((g) => g.via === 'vieja').pop();
    t('J · passo 17,3 s per ~15 min: l età dichiarata non resta indietro (≤ 1 s)', !!ult && Math.abs(ult.dich - ult.s) <= 1, ult); }
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['il /salud ignorato', "const _bfb = String(cercaK(j, 'borde_fallback_on')) === '1';", 'const _bfb = BORDE_FALLBACK_ON;'],
    ['il telefono non vince', "if (BORDE_FALLBACK_TEL === null && cercaK(j, 'borde_fallback_on') != null) {", "if (cercaK(j, 'borde_fallback_on') != null) {"],
    ['spenta di fabbrica (il buco di pranzo)', "let BORDE_FALLBACK_ON = BORDE_FALLBACK_TEL !== '0';", "let BORDE_FALLBACK_ON = BORDE_FALLBACK_TEL === '1';"],
    ['la chiave assente spegne', "if (BORDE_FALLBACK_TEL === null && cercaK(j, 'borde_fallback_on') != null) {", 'if (BORDE_FALLBACK_TEL === null) {'],
    ['il badge non si ridipinge', 'BORDE_FALLBACK_ON = _bfb; _pintarGuardiaBadge();', 'BORDE_FALLBACK_ON = _bfb;'],
    ['l età si azzera a ogni giro (il rosso di 💵)', "STATE.salaTs = Date.now() - (typeof r._vieja_ms", 'STATE.salaTs = Date.now() - 0 * (typeof r._vieja_ms'],
    ['i ms non viaggiano (il giallo di 💵)', 'vieja._vieja_ms = edad;', ''],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
