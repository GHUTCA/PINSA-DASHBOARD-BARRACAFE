// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · getTurnoAdmin dal ponte, senza il codice (23-oct)
// Richiesta: 🎛 `V32 IL PONTE PASSA MANCA GETTURNOADMIN`. Gira `_turnoAdminPorBordo` · `_turnoCodRicorda` · `_turnoConCodigoDeHoy` · `giroTurno` VERI in vm.
// node test_app_jl_turno_ponte_23OCT2026.mjs [app_jl.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./app_jl.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
const fnRiga = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n', i) + 1); };
const OGGI = '2026-10-23', IERI = '2026-10-22';
const PONTE = (pid) => ({ ok: true, fuente: 'ponte', plazas: [{ id: 'p1' }], asignaciones: [{ nombre: 'Ana' }], grupos: [], user: { nombre: 'JL' }, turno: Object.assign({ codigo: null, abierto: true }, pid ? { ponte_id: pid } : {}) });
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = 'async ' + fnVin(SRC, '_turnoAdminPorBordo') + fnRiga(SRC, '_turnoCodRicorda') + fnVin(SRC, '_turnoConCodigoDeHoy') + 'async ' + fnVin(SRC, 'giroTurno');
  function mondo({ bordo, gas, stato = {}, dia = OGGI }) {
    const L = { gas: 0, bordo: 0, reload: 0 };
    const ctx = { JSON, String, Object, AbortController, setTimeout, clearTimeout, encodeURIComponent, Date,
      DEMO: false, CFG: { BORDE: 'https://b', LOCAL: 'BKS', T: 't' }, LOC_PG: { BKS: 'bks' },
      STATE: Object.assign({ pin: '1234', ts: {} }, stato),
      _diaOp: () => dia, salva() {}, pintaTesta() {}, pintaTab() {},
      sessionStorage: { removeItem() {} }, location: { reload() { L.reload++; } },
      fetch: async () => { L.bordo++; const b = typeof bordo === 'function' ? bordo() : bordo; return { status: b.status || 200, json: async () => b.body }; },
      gasGet: async () => { L.gas++; return gas; } };
    vm.createContext(ctx); vm.runInContext(F, ctx);
    return { ctx, L, giro: () => vm.runInContext('giroTurno()', ctx) };
  }
  const GAS = { ok: true, plazas: [], asignaciones: [], turno: { codigo: '3805', abierto: true } };
  // A · leva del bordo spenta: gate_spento ⇒ il GAS come oggi, e il codice del GAS si ricorda
  { const w = mondo({ bordo: { body: { ok: true, scritto: false, motivo: 'gate_spento' } }, gas: GAS }); await w.giro();
    t('A · ponte chiuso / leva spenta ⇒ una getTurnoAdmin, e il codice del GAS resta in mano col giorno', w.L.gas === 1 && w.ctx.STATE.turno.turno.codigo === '3805' && w.ctx.STATE.turnoCod === '3805' && w.ctx.STATE.turnoCodDia === OGGI, w.L); }
  // B · il valore: ponte + codice di oggi in mano ⇒ ZERO GAS, plazas del bordo, codice del GAS
  { const w = mondo({ bordo: { body: PONTE() }, gas: GAS, stato: { turnoCod: '3805', turnoCodDia: OGGI } }); await w.giro();
    const tu = w.ctx.STATE.turno;
    t('B · ponte e codice di oggi ⇒ ZERO GAS, le plazas del bordo e il codice letto dal GAS', w.L.gas === 0 && tu.fuente === 'ponte' && tu.plazas.length === 1 && tu.turno.codigo === '3805' && tu.turno.abierto === true, { L: w.L, tu }); }
  // C · codice di IERI (lo STATE torna dalla cache del telefono) ⇒ mai rinasce: il GAS
  { const w = mondo({ bordo: { body: PONTE() }, gas: Object.assign({}, GAS, { turno: { codigo: '7711' } }), stato: { turnoCod: '3805', turnoCodDia: IERI } }); await w.giro();
    t('C · codice di ieri ⇒ una getTurnoAdmin, il codice nuovo, mai quello di ieri', w.L.gas === 1 && w.ctx.STATE.turno.turno.codigo === '7711' && w.ctx.STATE.turnoCod === '7711', w.L); }
  // D · nessun codice in mano ⇒ il GAS
  { const w = mondo({ bordo: { body: PONTE() }, gas: GAS }); await w.giro();
    t('D · ponte senza un codice in mano ⇒ una getTurnoAdmin', w.L.gas === 1 && w.ctx.STATE.turno.turno.codigo === '3805', w.L); }
  // E · fuente:'borde' (il turno del bordo, turno:gate) ⇒ NON si ricorda quel codice
  { const w = mondo({ bordo: { body: { ok: true, fuente: 'borde', plazas: [], turno: { codigo: '9999' } } }, gas: GAS }); await w.giro();
    t('E · fuente borde ⇒ zero GAS, e il suo codice (un ALTRO) non diventa il codice del ponte', w.L.gas === 0 && w.ctx.STATE.turno.turno.codigo === '9999' && !w.ctx.STATE.turnoCod, w.ctx.STATE); }
  // F · ponte_id: il primo si lega, lo stesso passa, uno diverso (turno riaperto sul GAS) ⇒ il GAS
  { const st = { turnoCod: '3805', turnoCodDia: OGGI, turnoCodPonte: null };
    let pid = 'aa11'; const w = mondo({ bordo: () => ({ body: PONTE(pid) }), gas: Object.assign({}, GAS, { turno: { codigo: '4420' } }), stato: st });
    await w.giro(); const g1 = w.L.gas, legato = w.ctx.STATE.turnoCodPonte;
    await w.giro(); const g2 = w.L.gas;
    pid = 'bb22'; await w.giro(); const g3 = w.L.gas;
    t('F · ponte_id: il primo si lega a 3805 (zero GAS), lo stesso passa, uno nuovo ⇒ una getTurnoAdmin e il codice nuovo', g1 === 0 && legato === 'aa11' && g2 === 0 && g3 === 1 && w.ctx.STATE.turnoCod === '4420' && w.ctx.STATE.turnoCodPonte === null, { g1, g2, g3, legato, st: w.ctx.STATE.turnoCod });
    await w.giro(); t('F2 · dopo la rilettura il codice nuovo si lega al ponte nuovo (zero GAS)', w.L.gas === 1 && w.ctx.STATE.turno.turno.codigo === '4420' && w.ctx.STATE.turnoCodPonte === 'bb22', w.L); }
  // G · pin sbagliato al bordo: come oggi
  { const w = mondo({ bordo: { body: { ok: false, error: 'pin_invalid' } }, gas: GAS }); await w.giro();
    t('G · pin sbagliato ⇒ ricarica, zero GAS (invariato)', w.L.reload === 1 && w.L.gas === 0, w.L); }
  // H · il login col ponte prende il cammino del GAS (serve il codice), e il codice del GAS si ricorda
  t('H · entrar: col ponte il cammino della getTurnoAdmin; il codice del GAS si ricorda nel login', /if \(bd\.usado && bd\.ok && !bd\.ponte\) \{/.test(SRC) && /STATE\.pin = pin; _turnoCodRicorda\(r\); STATE\.turno = r;/.test(SRC));
  t('I · salva() non esclude turnoCod (il codice deve sopravvivere al giro, il giorno lo protegge)', !/turnoCod/.test(fnVin(SRC, 'salva')));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['il ponte non si riconosce (torna rosso ⇒ niente)', "  if (j && j.ok === true && j.fuente === 'ponte') return { usado: true, ok: true, r: j, ponte: true };", ''],
    ['il giorno non si controlla', "  if (!STATE.turnoCod || STATE.turnoCodDia !== _diaOp(0)) return null;", '  if (!STATE.turnoCod) return null;'],
    ['ponte_id ignorato', "else if (STATE.turnoCodPonte !== pid) return null;", ''],
    ['il codice del bordo si ricorda', '        if (bd.ok) { STATE.turno = bd.r;', '        if (bd.ok) { _turnoCodRicorda(bd.r); STATE.turno = bd.r;'],
    ['il codice del GAS non si ricorda nel giro', "    if (r && r.ok) { _turnoCodRicorda(r); STATE.turno = r;", '    if (r && r.ok) { STATE.turno = r;'],
    ['il codice nuovo non slega il ponte', ' STATE.turnoCodPonte = null; } }', ' } }'],
    ['il login col ponte non va al GAS', 'if (bd.usado && bd.ok && !bd.ponte) {', 'if (bd.usado && bd.ok) {'],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
