// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · pezzo 2.3 · franjas, boletas, Ayer e Sem. pasada dal bordo (21-ott)
// Gira `_franjaObj`, `_diaOp`, `giroHistorico`, `_histCol`, `_cajaVista` VERI di app_jl.html in vm. node test_app_jl_servicio_franja_23_21OTT2026.mjs [app_jl.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./app_jl.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const riga = (pref) => { const i = SRC.indexOf(pref); if (i < 0) throw new Error(pref); return SRC.slice(i, SRC.indexOf('\n', i) + 1); };
  const F = riga('const TURNI = ') + riga('const HIST = ') + fnVin(SRC, '_franjaObj') + fnVin(SRC, '_diaOp') + 'async ' + fnVin(SRC, 'giroHistorico') + fnVin(SRC, '_histCol') + fnVin(SRC, '_cajaVista');
  function mondo({ risposte = {}, servOn = true, now } = {}) {
    const chiesti = [];
    const ctx = { DEMO: false, STATE: { pin: '1234', ts: {} }, TAB: 0, Date: now ? class extends Date { constructor(...a) { super(...(a.length ? a : [now])); } static now() { return now; } } : Date,
      Math, Object, String, Array, Number, _servOn: () => servOn, _servFresco: () => true, _slugSalaJS: (s) => String(s).toLowerCase(), _cjMesasAbiertas: () => [],
      fmt: (n) => '$' + Math.round(n), pintaTab: () => {},
      cajaPost1: async (p) => { chiesti.push(p); const r = risposte[p.dia]; if (r instanceof Error) throw r; return r || { ok: true, venta: 999 }; } };
    vm.createContext(ctx); vm.runInContext(F, ctx); return { ctx, chiesti };
  }
  // _franjaObj
  { const { ctx } = mondo(); const o = vm.runInContext("_franjaObj([{franja:'DÍA',venta:100,cuentas:2},{franja:'noche',venta:50,cuentas:1},{franja:'Dia',venta:10,cuentas:1},{franja:'sin_franja',venta:7,cuentas:1},{franja:'AURORA',venta:3,cuentas:1}])", ctx);
    t('A · le quattro chiavi del vetro (maiuscole, Dia ⇒ DÍA), cuentas ⇒ ctas, il resto in _otras', o['DÍA'].venta === 110 && o['DÍA'].ctas === 3 && o.NOCHE.venta === 50 && o._otras.venta === 10 && o._otras.ctas === 2, o); }
  // _diaOp: alle 03:00 di Santiago del 22 il giorno operativo è ancora il 21
  { const { ctx } = mondo({ now: Date.parse('2026-10-22T06:00:00Z') });   // 03:00 a Santiago (UTC-3)
    t('B · alle 03:00 del 22 «ayer» è il 20, «sem. pasada» il 14 (giorno operativo che cambia alle 06:00)', vm.runInContext('_diaOp(1)', ctx) === '2026-10-20' && vm.runInContext('_diaOp(7)', ctx) === '2026-10-14' && vm.runInContext('_diaOp(0)', ctx) === '2026-10-21'); }
  // giroHistorico: si crede solo alla risposta col suo dia
  { const now = Date.parse('2026-10-21T18:00:00Z');
    const { ctx, chiesti } = mondo({ now, risposte: { '2026-10-20': { ok: true, dia: '2026-10-20', venta: 5000000, cuentas: 100, boletas: { emitidas: 98 }, propinas: { total: 400000 } }, '2026-10-14': { ok: true, venta: 1 } } });
    await vm.runInContext('giroHistorico()', ctx);
    t('C · chiede servicio con dia per ayer e sem. pasada', chiesti.length === 2 && chiesti[0].verbo === 'servicio' && chiesti[0].dia === '2026-10-20' && chiesti[1].dia === '2026-10-14' && chiesti[0].pin_jl === '1234', chiesti);
    t('C2 · ayer col suo dia ⇒ preso; sem. pasada SENZA dia (leva di BKP spenta: sarebbe oggi) ⇒ scartato', vm.runInContext('HIST.ayer && HIST.ayer.venta === 5000000 && HIST.sem === null', ctx), vm.runInContext('HIST', ctx));
    t('C3 · le cinque righe di ayer: venta, cuentas, boletas, ticket, propina', JSON.stringify(vm.runInContext('_histCol(HIST.ayer)', ctx)) === JSON.stringify(['$5000000', 100, 98, '$50000', '$400000']), vm.runInContext('_histCol(HIST.ayer)', ctx));
    t('C4 · senza risposta ⇒ cinque «—»', JSON.stringify(vm.runInContext('_histCol(null)', ctx)) === JSON.stringify(['—', '—', '—', '—', '—']));
    await vm.runInContext('giroHistorico()', ctx);
    t('C5 · dentro i 10 minuti non richiede', chiesti.length === 2, chiesti.length); }
  { const { ctx, chiesti } = mondo({ servOn: false }); await vm.runInContext('giroHistorico()', ctx);
    t('D · leva caja_servicio_on spenta ⇒ nessuna lettura', chiesti.length === 0); }
  // _cajaVista: boletas e franjas solo se il bordo le porta
  { const { ctx } = mondo(); ctx.STATE.caja = { ok: true, boletas: 7, por_franja: { 'DÍA': { venta: 1, ctas: 1 } } };
    ctx.STATE.serv = { ok: true, venta: 10, cuentas: 2, por_mesero: {}, boletas: { emitidas: 40, por_emitir: 1 }, por_franja: [{ franja: 'HH', venta: 9, cuentas: 1 }] };
    const v = vm.runInContext('_cajaVista()', ctx);
    t('E · bordo con le chiavi ⇒ boletas 40 e franjas dal bordo (franja_bordo)', v.boletas === 40 && v.franja_bordo === true && v.por_franja.HH.venta === 9 && !v.por_franja['DÍA'], v); }
  { const { ctx } = mondo(); ctx.STATE.caja = { ok: true, boletas: 7, por_franja: { 'DÍA': { venta: 1, ctas: 1 } } };
    ctx.STATE.serv = { ok: true, venta: 10, cuentas: 2, por_mesero: {} };
    const v = vm.runInContext('_cajaVista()', ctx);
    t('E2 · bordo senza le chiavi (leva spenta) ⇒ boletas e franjas di Google, come ieri', v.boletas === 7 && !v.franja_bordo && v.por_franja['DÍA'].venta === 1, v); }
  t('F · la tabla General usa le colonne storiche, la franja ha la riga «Sin franja» e la pill del bordo',
    /\['Venta',   fmt\(venta\), _hA\[0\], _hS\[0\], '—'\]/.test(SRC) && /\['Propina', propTot \? fmt\(propTot\) : '—', _hA\[4\], _hS\[4\], '—'\]\]/.test(SRC) && /<b>Sin franja<\/b>/.test(SRC) && /📷 del bordo ' \+ edadTxt\('serv'\)/.test(fnVin(SRC, '_ventasFranjas')));
  t('G · giroHistorico parte solo dopo un servicio riuscito, fuori dal try e isolato', /if \(STATE\.servErr\) pintaTesta\(\);[^\n]*\n[^\n]*\n  else \{ try \{ giroHistorico\(\); \} catch \(e\) \{\} \}/.test(fnVin(SRC, 'giroServicio')));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['crede a una risposta senza dia', 'return (r && r.ok && r.dia === dia) ? r : null;', 'return (r && r.ok) ? r : null;'],
    ['giorno solare invece che operativo', 'const t = Date.now() - 6 * 3600000 - (menoGiorni || 0) * 86400000;', 'const t = Date.now() - (menoGiorni || 0) * 86400000;'],
    ['le franjas ignote si perdono', 'const dst = note[k] ? (o[k] = o[k] || { venta: 0, ctas: 0 }) : o._otras;', 'if (!note[k]) return; const dst = (o[k] = o[k] || { venta: 0, ctas: 0 });'],
    ['franjas dal bordo anche senza chiave', 'if (Array.isArray(sv.por_franja)) {', 'if (true) {'],
    ['cuentas non tradotto', 'dst.ctas += +x.cuentas || 0;', 'dst.ctas += +x.ctas || 0;'],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
