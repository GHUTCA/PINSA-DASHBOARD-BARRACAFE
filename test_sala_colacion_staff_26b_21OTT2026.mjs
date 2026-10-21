// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · pezzo 2.6b · la lista della colación da /turno/estado (21-ott)
// Gira `_staffDalBorde` e l'inizio VERO di `_dtoColacion__in` in vm, fetch e gasPost finti. node test_sala_colacion_staff_26b_21OTT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const lp = SRC.slice(SRC.indexOf('const LOC_PG_SALA'), SRC.indexOf('\n', SRC.indexOf('const LOC_PG_SALA')) + 1);
  const F = lp + 'async ' + fnVin(SRC, '_staffDalBorde') + 'async ' + fnVin(SRC, '_dtoColacion__in');
  async function apri({ on = true, risposta, lancia = false, gas = { ok: true, staff: [{ nombre: 'Ray' }] }, local = 'BKS' }) {
    const vie = []; let html = '';
    const ctx = { COLN_STAFF_BORDE_ON: on, BORDE_SALA: { URL: 'https://b', T: 'tok' }, CFG: { LOCAL: local }, STATE: { codigo: 'C1' }, JSON, setTimeout, clearTimeout, AbortController, String, encodeURIComponent,
      fetch: async (u, o) => { vie.push(['borde', u, o.headers['x-borde-token']]); if (lancia) throw new Error('rete'); return { json: async () => risposta }; },
      gasPost: async (a, b) => { vie.push(['gas', a]); return gas; },
      vhojaCerrar: () => {}, vhoja: (h) => { html = h; }, esc: (s) => String(s) };
    vm.createContext(ctx); vm.runInContext(F, ctx); await vm.runInContext("_dtoColacion__in('20')", ctx);
    return { vie, html };
  }
  const PG = { ok: true, staff: [{ nombre: 'Ray', en_plaza: true }, { nombre: 'Coni', en_plaza: false }, { nombre: 'ray', en_plaza: true }, { nombre: ' ' }] };
  { const x = await apri({ risposta: PG }); t('A · leva accesa: legge /turno/estado/BKS col token in header, ZERO Google', x.vie.length === 1 && x.vie[0][0] === 'borde' && /\/turno\/estado\/BKS$/.test(x.vie[0][1]) && x.vie[0][2] === 'tok', x.vie); }
  { const x = await apri({ risposta: PG }); t('A2 · tutto lo staff (anche fuori plaza: Coni), senza doppioni né vuoti, in ordine', /colnPara\(this,'Coni'\)/.test(x.html) && (x.html.match(/colnPara\(this,'Ray'\)/gi) || []).length === 1 && x.html.indexOf("'Coni'") < x.html.indexOf("'Ray'"), x.html.slice(0, 400)); }
  { const x = await apri({ risposta: PG, local: 'RIESCO' }); t('A3 · RIESCO ⇒ RSC sul bordo', /\/turno\/estado\/RSC$/.test(x.vie[0][1]), x.vie); }
  { const x = await apri({ risposta: { ok: false, error: 'turno_pg_off' } }); t('B · bordo spento (503 turno_pg_off) ⇒ lista vuota con «reintenta», NON Google', x.vie.every((v) => v[0] === 'borde') && /No llegó la lista del turno/.test(x.html), x); }
  { const x = await apri({ lancia: true }); t('C · rete morta ⇒ lista vuota, NON Google', x.vie.every((v) => v[0] === 'borde') && /No llegó la lista/.test(x.html), x.vie); }
  { const x = await apri({ on: false, risposta: PG }); t('D · leva spenta ⇒ getStaffSala come ieri, nessuna chiamata al bordo', x.vie.length === 1 && x.vie[0][1] === 'getStaffSala' && /colnPara\(this,'Ray'\)/.test(x.html), x.vie); }
  t('E · leva dal /salud, nasce spenta', /COLN_STAFF_BORDE_ON = String\(cercaK\(j, 'colacion_staff_borde_on'\)\) === '1';/.test(SRC) && /var COLN_STAFF_BORDE_ON = false;/.test(SRC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['solo chi è in plaza', "j.staff.forEach(function (s) {", "j.staff.filter(function (s) { return s.en_plaza; }).forEach(function (s) {"],
    ['ripiego a Google a leva accesa', 'if (COLN_STAFF_BORDE_ON) staff = await _staffDalBorde();   // [2.6b] niente Google a leva accesa\n  else try', 'if (COLN_STAFF_BORDE_ON) staff = await _staffDalBorde();\n  if (!staff.length) try'],
    ['token in query invece che header', "{ headers: { 'x-borde-token': BORDE_SALA.T }, cache", "{ headers: {}, cache"],
    ['senza dedup', "if (n && !vist[k]) { vist[k] = 1; out.push(n); }", 'if (n) out.push(n);'],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
