// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · il clockIn di sala e anfitriona dal bordo, a leva clockin_vetro_borde_on (23-oct)
// Richiesta: 🎛 `V32 IL 23 ALLE 10 COSA E FUORI E COSA NO` (C3 sala:17082 · anfitriona:389 · 670). Gira le funzioni VERE in vm con fetch e gasPost finti.
// node test_clockin_vetro_borde_23OCT2026.mjs · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const R = (f) => fs.readFileSync(new URL('./' + f, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const ORIG = { sala: R('sala.html'), anf: R('anfitriona.html') };
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(S, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  // ── la sala: _clockInDetras
  async function sala({ leva, uidPrima = null }) {
    const L = { gas: [], staff: [] };
    const ctx = { STATE: { codigo: '3474', nombre: 'Ruth' }, CLOCKIN_VETRO_ON: leva, _CLOCKIN_UID: uidPrima, Date, Math,
      gasPost: async (a, b) => { L.gas.push([a, b]); return { ok: true, via: 'gas' }; },
      staffPost: async (a, b, o) => { L.staff.push([a, b, o]); return { ok: true, borde: true, nombre: 'Ruth', tg_link: 'https://t.me/x' }; } };
    vm.createContext(ctx); vm.runInContext('var _CLOCKIN_UID = this._CLOCKIN_UID;\nasync function _saludAttendi() {}   /* [26-ott] l attesa di /salud (5e7eab2) neutra */\n' + 'async ' + fnVin(S.sala, '_clockInDetras') + '\nthis.go = _clockInDetras; this.uid = () => _CLOCKIN_UID;', ctx);
    const r = await ctx.go(); return { r, L, uid: ctx.uid() };
  }
  { const x = await sala({ leva: false }); t('A · sala, leva spenta ⇒ il GAS di ieri', x.L.gas.length === 1 && x.L.staff.length === 0 && x.r.via === 'gas', x.L); }
  { const x = await sala({ leva: true });
    t('B · sala, leva accesa ⇒ staffPost clockIn col clockin_uid e { ingreso: true }, niente GAS diretto', x.L.gas.length === 0 && x.L.staff[0][0] === 'clockIn' && /^ci-/.test(x.L.staff[0][1].clockin_uid) && x.L.staff[0][2] && x.L.staff[0][2].ingreso === true, x.L); }
  { const prima = { k: '3474|Ruth', u: 'ci-ingresso1' }; const x = await sala({ leva: true, uidPrima: prima });
    t('C · sala: la verifica riusa la chiave dell ingresso (il bordo non scrive due ingressi)', x.L.staff[0][1].clockin_uid === 'ci-ingresso1', x.L.staff); }
  { const x = await sala({ leva: true, uidPrima: { k: '9999|Otro', u: 'ci-vecchio' } });
    t('C2 · sala: chiave di un altro turno/nome ⇒ una nuova', x.L.staff[0][1].clockin_uid !== 'ci-vecchio' && x.uid.k === '3474|Ruth', x.L.staff); }
  t('D · sala: _verificaDetras passa da _clockInDetras e la leva si legge dal /salud', /const r = await _clockInDetras\(\);/.test(S.sala) && /const _civ = cercaK\(j, 'clockin_vetro_borde_on'\); if \(_civ != null && QS\.get\('civ'\) !== '0'\) CLOCKIN_VETRO_ON = String\(_civ\) === '1';/.test(S.sala) && /var CLOCKIN_VETRO_ON = \(function \(\) \{ try \{ return QS\.get\('civ'\) !== '0'; \}/.test(S.sala));   // [26-ott · ARQ porta ①] nasce ACCESA, /salud la spegne solo con "0"
  // ── l'anfitriona: _clockInAlBorde
  async function anf({ leva, risposta, lancia = false }) {
    const L = { fetch: [] };
    const ctx = { ANF_BORDE: { clockin: leva }, CFG: { LOCAL: 'BKS' }, BORDE_SALA: { URL: 'https://b', T: 't' }, JSON, Date, Math, AbortController, setTimeout, clearTimeout, encodeURIComponent,
      anfSaludLeva: async () => leva,
      fetch: async (u, o) => { L.fetch.push([u, JSON.parse(o.body)]); if (lancia) throw new Error('rete'); return { json: async () => JSON.parse(JSON.stringify(risposta)) }; } };
    vm.createContext(ctx); vm.runInContext('let _ANF_CI = null;\n' + 'async ' + fnVin(S.anf, '_clockInAlBorde') + '\nthis.go = _clockInAlBorde;', ctx);
    const r1 = await ctx.go('3474', 'Gaby'); const r2 = await ctx.go('3474', 'Gaby'); return { r1, r2, L };
  }
  { const x = await anf({ leva: false, risposta: { ok: true, borde: true } }); t('E · anfitriona, leva spenta ⇒ null (il GAS di ieri), nessuna chiamata al bordo', x.r1 === null && x.L.fetch.length === 0, x); }
  { const x = await anf({ leva: true, risposta: { ok: true, borde: true, nombre: 'Gaby', tg_link: 'https://t.me/x' } });
    t('F · anfitriona, leva accesa ⇒ la risposta del bordo (forma del GAS), action clockIn con clockin_uid', x.r1 && x.r1.nombre === 'Gaby' && x.L.fetch[0][1].action === 'clockIn' && /^ci-/.test(x.L.fetch[0][1].clockin_uid), x);
    t('F2 · due tentativi dello stesso nome ⇒ la stessa chiave (un ingresso solo)', x.L.fetch[0][1].clockin_uid === x.L.fetch[1][1].clockin_uid, x.L.fetch.map((f) => f[1].clockin_uid)); }
  { const x = await anf({ leva: true, risposta: { ok: false, need: 'gas', borde: true, error: 'sin_replica' } }); t('G · need:gas ⇒ null ⇒ il GAS', x.r1 === null, x.r1); }
  { const x = await anf({ leva: true, risposta: { ok: true } }); t('G2 · senza borde:true ⇒ null', x.r1 === null, x.r1); }
  { const x = await anf({ leva: true, lancia: true }); t('G3 · rete ⇒ null', x.r1 === null, x.r1); }
  t('H · anfitriona: i due clockIn passano prima dal bordo', (S.anf.match(/\(await _clockInAlBorde\(/g) || []).length === 2);
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['sala: la leva ignorata', 'sala', "  if (!CLOCKIN_VETRO_ON) return gasPost('clockIn', { codigo: STATE.codigo, nombre: STATE.nombre });\n", ''],
    ['sala: chiave nuova sempre', 'sala', "  if (!_CLOCKIN_UID || _CLOCKIN_UID.k !== k) _CLOCKIN_UID =", "  _CLOCKIN_UID ="],
    ['sala: senza ingreso (bw spento la blocca)', 'sala', "clockin_uid: _CLOCKIN_UID.u }, { ingreso: true });", "clockin_uid: _CLOCKIN_UID.u });"],
    ['anfitriona: leva ignorata', 'anf', "  if (!ANF_BORDE.clockin) return null;\n", ''],
    ['anfitriona: need:gas creduto', 'anf', "return (j && j.borde === true && !j.need) ? j : null;", "return (j && j.borde === true) ? j : null;"],
    ['anfitriona: chiave nuova a ogni tentativo', 'anf', "  if (!_ANF_CI || _ANF_CI.k !== k) _ANF_CI =", "  _ANF_CI ="],
  ];
  let m = 0; for (const [n, f, a, b] of M) { if (!ORIG[f].includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } const S = Object.assign({}, ORIG); S[f] = S[f].split(a).join(b); let r; try { r = await banco(S, true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
