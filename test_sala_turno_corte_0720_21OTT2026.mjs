// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · AUT-0720 · il turno del corte (madrugada e dalle 18:30 = noche) e il regime del GAS che non si mostra (21-ott)
// Richiesta: 🖐 QUARTA `QUARTA V32 IL TURNO DEL CORTE E INVERTITO DALL 8 OTTOBRE` + 🎛 `V32 AUT-0720 TURNO DEL CORTE`.
// Gira la riga VERA della franja (estratta dal sorgente) con un orologio finto, e i tre punti del regime. node test_sala_turno_corte_0720_21OTT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const riga = (pref) => { const i = SRC.indexOf(pref); if (i < 0) throw new Error('manca: ' + pref); return SRC.slice(i, SRC.indexOf('\n', i) + 1); };
  const FR = riga('    if (!CIE.franja) {');
  const franjaAlle = (h, m) => { class D extends Date { getHours() { return h; } getMinutes() { return m; } }
    const ctx = { CIE: {}, Date: D }; vm.createContext(ctx); vm.runInContext(FR, ctx); return ctx.CIE.franja; };
  const CASI = [[0, 0, 'noche'], [1, 10, 'noche'], [3, 11, 'noche'], [5, 59, 'noche'], [6, 0, 'dia'], [12, 0, 'dia'], [17, 2, 'dia'], [17, 25, 'dia'], [18, 30, 'dia'], [18, 54, 'dia'], [19, 29, 'dia'], [19, 30, 'noche'], [20, 10, 'noche'], [23, 59, 'noche']];
  const sbagli = CASI.filter(([h, m, att]) => franjaAlle(h, m) !== att).map(([h, m, att]) => h + ':' + m + ' atteso ' + att + ' uscito ' + franjaAlle(h, m));
  t('A · i confini al minuto: madrugada e dalle 19:30 = noche, 06:00–19:29 = dia (Ray 17:25 ⇒ dia · Jurley 03:11 ⇒ noche · Isa 17:02 ⇒ dia · un AM alle 18:54 ⇒ dia)', sbagli.length === 0, sbagli);
  { const ctx = { CIE: { franja: 'dia' }, Date }; vm.createContext(ctx); vm.runInContext(FR, ctx);
    t('A2 · una franja già nata (retry della stessa dichiarazione) non si ricalcola', ctx.CIE.franja === 'dia'); }
  // la testa del corte (_cieTurnoHoy): lo stesso taglio, rosso di QUARTA
  const fnT = (() => { const i = SRC.indexOf('function _cieTurnoHoy('); return SRC.slice(i, SRC.indexOf('\n}\n', i) + 3); })();
  const testaAlle = (h, m) => {   // un orologio fermo a h:m del 21-ott (le ore e i minuti li legge solo la funzione)
    class D extends Date { constructor(...a) { super(...(a.length ? a : [2026, 9, 21, h, m])); } }
    const ctx = { Date: D }; vm.createContext(ctx); vm.runInContext(fnT, ctx); return vm.runInContext('_cieTurnoHoy()', ctx); };
  const sbT = [[18, 54, 'día'], [19, 29, 'día'], [19, 30, 'noche'], [12, 0, 'día']].filter(([h, m, att]) => !testaAlle(h, m).endsWith('· ' + att)).map(([h, m, att]) => h + ':' + m + ' atteso ' + att + ' uscito ' + testaAlle(h, m));
  t('A3 · la testa del corte «Tu turno de hoy» taglia alle 19:30 come la franja (18:54 ⇒ día)', sbT.length === 0, sbT);
  // il regime
  const G = SRC.slice(SRC.indexOf("    if (!r) {\n      r = await gasPost('cerrarMesero', _cierreBody);"), SRC.indexOf('    if (r && r.ok) {', SRC.indexOf("r = await gasPost('cerrarMesero', _cierreBody);")));
  async function chiude(rBordo, rGas) { const ctx = { r: rBordo, gasPost: async () => JSON.parse(JSON.stringify(rGas)), _cierreBody: {}, out: null };
    vm.createContext(ctx); await vm.runInContext('(async function () { let r = this.r;\n' + G + '\n this.out = r; }).call(this)', ctx); return ctx.out; }
  { const r = await chiude(null, { ok: true, regimen: 'individual', id: 'CM-1' });
    t('B · corte ricaduto sul GAS ⇒ regimen null (la riga «esta noche es tuya» non esce), il resto intatto', r.regimen === null && r.id === 'CM-1' && r.ok === true, r); }
  { const r = await chiude({ ok: true, regimen: 'pozo', borde: true }, { ok: true, regimen: 'individual' });
    t('B2 · corte del bordo ⇒ il SUO regime resta (pozo)', r.regimen === 'pozo', r); }
  t('C · _cieCompleta: il regime solo da corte_fuente borde', /CIE\.data\.regimen = r\.corte_fuente === 'borde' \? r\.regimen : null;/.test(SRC) && !/CIE\.data\.turno = r\.turno; CIE\.data\.regimen = r\.regimen;/.test(SRC));
  t('C2 · corte letto dal libro (getCierreMesero) ⇒ regimen null nella testata', /CIE\.data = r; CIE\.tol = r\.tolerancia \|\| 2000;\n    CIE\.data\.regimen = null;/.test(SRC));
  t('D · la riga del recibo resta quella che tace su null', /\(r\.regimen == null \? '<\/div>' : '<div class="cie-nota"/.test(SRC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['la riga vecchia (17:00)', "CIE.franja = (_m < 6 * 60 || _m >= 19 * 60 + 30) ? 'noche' : 'dia';", "CIE.franja = (_d.getHours() < 17 ? 'dia' : 'noche');"],
    ['senza madrugada', "CIE.franja = (_m < 6 * 60 || _m >= 19 * 60 + 30) ? 'noche' : 'dia';", "CIE.franja = (_m >= 19 * 60 + 30) ? 'noche' : 'dia';"],
    ['taglio di ieri alle 18:30', '_m >= 19 * 60 + 30', '_m >= 18 * 60 + 30'],
    ['la testa del corte alle 18:30', 'const noche = (hh * 60 + mm) >= (19 * 60 + 30) || hh < 6;', 'const noche = (hh * 60 + mm) >= (18 * 60 + 30) || hh < 6;'],
    ['il regime del GAS passa', "      if (r && typeof r === 'object') r.regimen = null;\n", ''],
    ['il regime cancellato anche al bordo', "      if (r && typeof r === 'object') r.regimen = null;\n    }\n", "    }\n    if (r && typeof r === 'object') r.regimen = null;\n"],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
