// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · la fascia della leva del menù non è più cablata 08-14 (23-oct)
// Richiesta: 📖 `MENU BKS V32 LEVA DEL MENU AL BORDO RAMO 210770A` ①. Gira `_levaFascia`, `_levaFasciaTxt`, `_levaHoraOk` VERI in vm con un orologio finto.
// node test_app_jl_leva_fascia_23OCT2026.mjs [app_jl.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./app_jl.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 200))); };
  const F = ['_levaFascia', '_levaFasciaTxt', '_levaHoraOk'].map((n) => fnVin(SRC, n)).join('');
  const alle = (hhmm, salud) => {   // un orologio fermo a hh:mm di Santiago
    const D = class extends Date { toLocaleString() { return '2026-10-23 ' + hhmm + ':00'; } };
    const ctx = { Date: D, JSON, STATE: { salud } }; vm.createContext(ctx); vm.runInContext(F, ctx);
    return { ok: vm.runInContext('_levaHoraOk()', ctx), txt: vm.runInContext('_levaFasciaTxt()', ctx), f: vm.runInContext('_levaFascia()', ctx) };
  };
  { const x = alle('14:30', { ok: true }); t('A · senza la chiave del bordo: alle 14:30 si può accendere (lo specchio è 08-15, non più 08-14)', x.ok === true && x.txt === '08-15' && x.f.fuente === 'espejo', x); }
  { const x = alle('15:00', { ok: true }); t('A2 · alle 15:00 no (il confine è escluso, come il reloj)', x.ok === false, x); }
  { const x = alle('07:59', { ok: true }); t('A3 · alle 07:59 no', x.ok === false, x); }
  { const x = alle('14:30', { flags: { menu_leva_reloj: 'esca|09:00|13:00|TUTTI' } }); t('B · con la chiave del bordo vince il bordo: 09-13 ⇒ alle 14:30 no', x.ok === false && x.txt === '09-13' && x.f.fuente === 'bordo', x); }
  { const x = alle('10:00', { flags: { menu_leva_reloj: 'esca|09:00|13:00|TUTTI' } }); t('B2 · e alle 10:00 sì', x.ok === true, x); }
  { const x = alle('14:30', { flags: { menu_leva_reloj: 'roto' } }); t('C · chiave illeggibile ⇒ lo specchio, mai un blocco', x.ok === true && x.f.fuente === 'espejo', x); }
  t('D · i due testi non hanno più «08-14» cablato', !/fuera de horario 08-14/.test(SRC) && !/Fuera de horario \(08-14\)/.test(SRC) && (SRC.match(/_levaFasciaTxt\(\)/g) || []).length >= 2);
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['lo specchio torna 08-14', "return { de: '08:00', hasta: '15:00', fuente: 'espejo' };", "return { de: '08:00', hasta: '14:00', fuente: 'espejo' };"],
    ['la chiave del bordo ignorata', "    if (/^\\d{2}:\\d{2}$/.test(p[1] || '') && /^\\d{2}:\\d{2}$/.test(p[2] || '')) return { de: p[1], hasta: p[2], fuente: 'bordo' };\n", ''],
    ['il confine incluso', 'return hhmm >= f.de && hhmm < f.hasta;', 'return hhmm >= f.de && hhmm <= f.hasta;'],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
