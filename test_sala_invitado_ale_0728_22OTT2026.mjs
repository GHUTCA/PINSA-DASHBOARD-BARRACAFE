// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · AUT-0728 ③: il motivo fisso «Invitado ALE», massimo 40% (22-ott)
// Richiesta: 🎛 `V32 LE QUATTRO REGOLE DEL MESSAGGIO DI ALBERTO`. Gira DTO_MOTIVOS e gli helper VERI dello sconto in vm.
// node test_sala_invitado_ale_0728_22OTT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
const varVin = (S, n) => { const i = S.indexOf('var ' + n + ' = ['); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n];\n', i) + 4); };
function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = varVin(SRC, 'DTO_MOTIVOS') + varVin(SRC, 'DTO_CONVENIOS') + ['_dtMot', '_dtConv', '_dtEscludePromo', '_dtBase', '_dtQuita', '_dtCobra'].map((n) => fnVin(SRC, n)).join('');
  const iL = SRC.indexOf("_dtLista('mot', "); const LISTA = SRC.slice(iL + "_dtLista('mot', ".length, SRC.indexOf(',   //', iL));
  function mondo(max, dt) { const ctx = { Math, DTO_MAX_PCT: max, _dt: dt }; vm.createContext(ctx); vm.runInContext(F, ctx); return ctx; }
  const dt = (tot) => ({ tipo: 'dto', mot: 'invitado_ale', tot: tot, promo: 0, mesa: '12' });
  { const c = mondo(40, dt(10000)); const m = vm.runInContext('_dtMot("invitado_ale")', c);
    t('A · c è il motivo «Invitado ALE» al 40%', m && m.n === 'Invitado ALE' && m.pct === 40 && !m.esc, m); }
  { const c = mondo(40, dt(10000)); t('B · consumo 10.000 ⇒ si toglie 4.000, si cobra 6.000', vm.runInContext('_dtQuita()', c) === 4000 && vm.runInContext('_dtCobra()', c) === 6000); }
  { // mai sopra il tetto, nemmeno di un peso, su qualunque consumo (il server rifiuterebbe `descuento_max`)
    const sopra = []; for (let tot = 1000; tot <= 60000; tot += 7) { const c = mondo(40, dt(tot)); const q = vm.runInContext('_dtQuita()', c); if (q > tot * 0.4) { sopra.push([tot, q]); if (sopra.length > 3) break; } }
    t('C · su 8.429 consumi (1.000-60.000) lo sconto non supera MAI il 40%', sopra.length === 0, sopra); }
  { const c = mondo(40, { tipo: 'dto', mot: 'atraso_cocina', tot: 10005, promo: 0 });
    t('D · i motivi sotto il tetto arrotondano come ieri (10% di 10.005 = 1.001)', vm.runInContext('_dtQuita()', c) === 1001, vm.runInContext('_dtQuita()', c)); }
  { const c = mondo(40, null); const ls = vm.runInContext(LISTA, c).map((m) => m.k);
    t('E · tetto 40 ⇒ la lista offre Invitado ALE', ls.indexOf('invitado_ale') >= 0 && ls.length === 5, ls); }
  { const c = mondo(30, null); const ls = vm.runInContext(LISTA, c).map((m) => m.k);
    t('F · tetto 30 (default prima del /salud, o server abbassato) ⇒ NON si offre, gli altri sì', ls.indexOf('invitado_ale') < 0 && ls.length === 4, ls); }
  t('G · il motivo arriva al libro come `motivo` del pago (pg.dto.et)', /body\.motivo = String\(pg\.dto\.et \|\| ''\)\.slice\(0, 80\);/.test(SRC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['senza il motivo', "  { k: 'invitado_ale',     n: 'Invitado ALE',      pct: 40 }\n", "  { k: 'xx', n: 'X', pct: 5 }\n"],
    ['arrotondamento per eccesso al tetto', "(p >= DTO_MAX_PCT ? Math.floor(_dtBase() * p / 100) : Math.round(_dtBase() * p / 100))", 'Math.round(_dtBase() * p / 100)'],
    ['floor per tutti', "(p >= DTO_MAX_PCT ? Math.floor(_dtBase() * p / 100) : Math.round(_dtBase() * p / 100))", 'Math.floor(_dtBase() * p / 100)'],
    ['lista senza filtro del tetto', "DTO_MOTIVOS.filter(function (m) { return m.pct <= DTO_MAX_PCT; })", 'DTO_MOTIVOS'],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
