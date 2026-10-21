// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · pezzo 5.10 · la lista del 🚫 86 dal bordo (catalogoMesero + ago86) invece di adminListProducts (21-ott)
// Gira `_prodsDalBorde` e `giroProds` VERI di app_jl.html in vm, bordo e GAS finti. node test_app_jl_prods86_510_21OTT2026.mjs [app_jl.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./app_jl.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = 'async ' + fnVin(SRC, '_prodsDalBorde') + 'async ' + fnVin(SRC, 'giroProds');
  const CAT = { ok: true, productos: [{ id: 'BKS-BEB-007', nombre: 'Agua con gas' }, { id: 'BKS-SOU-003', nombre: 'Pisco Sour' }, { id: '', nombre: 'rotto' }] };
  async function gira({ ago = { ok: true, apagado: false, seeded: true, ids: ['BKS-SOU-003'] }, agoStatus = 200, cat = CAT, lancia = '', qs = '', prima = null }) {
    const L = { fetch: [], gas: [] };
    const ctx = { DEMO: false, TAB: 0, STATE: { pin: '4321', ts: {}, prods: prima }, CFG: { LOCAL: 'BKS' }, BORDE_86: 'https://b', BORDE_TOKEN_86: 'tok', JSON, String, Array, setTimeout, clearTimeout, AbortController, encodeURIComponent, URLSearchParams,
      location: { search: qs }, salva: () => {}, pintaTesta: () => {}, ochenta: () => {},
      fetch: async (u, o) => { L.fetch.push({ u, h: o.headers }); if (lancia && u.includes(lancia)) throw new Error('rete');
        if (u.includes('/ago86/')) return { status: agoStatus, json: async () => ago }; return { status: 200, json: async () => cat }; },
      gasGet: async (a) => { L.gas.push(a); return { ok: true, products: [{ id: 'G', nombre: 'del GAS', agotado: false }] }; } };
    vm.createContext(ctx); vm.runInContext(F, ctx); await vm.runInContext('giroProds()', ctx); return { ctx, L };
  }
  { const { ctx, L } = await gira({});
    t('A · leva 86 del bordo accesa e seminata ⇒ i prodotti dalla carta del bordo, agotado dal DO, ZERO Google', L.gas.length === 0 && ctx.STATE.prods.length === 2 && ctx.STATE.prods.find((p) => p.id === 'BKS-SOU-003').agotado === true &&
      ctx.STATE.prods.find((p) => p.id === 'BKS-BEB-007').agotado === false && ctx.STATE.prodsFonte === 'bordo' && L.fetch.every((f) => f.h['X-Borde-Token'] === 'tok'), { gas: L.gas, prods: ctx.STATE.prods }); }
  for (const [n, o] of [['rotta spenta (404 ruta_apagada)', { agoStatus: 404, ago: { ok: false, error: 'ruta_apagada' } }], ['DO non seminato', { ago: { ok: true, apagado: false, seeded: false, ids: [] } }],
    ['leva del DO spenta (apagado)', { ago: { ok: true, apagado: true, seeded: true, ids: [] } }], ['carta vuota', { cat: { ok: true, productos: [] } }]]) {
    const { ctx, L } = await gira(o);
    t('B · ' + n + ' ⇒ adminListProducts del GAS, come ieri', L.gas[0] === 'adminListProducts' && ctx.STATE.prods[0].id === 'G', { gas: L.gas, prods: ctx.STATE.prods });
  }
  { const { ctx, L } = await gira({ lancia: 'ago86', prima: [{ id: 'X', nombre: 'in memoria', agotado: true }] });
    t('C · rete morta ⇒ resta la lista in memoria, niente Google', L.gas.length === 0 && ctx.STATE.prods[0].id === 'X', L); }
  { const { ctx, L } = await gira({ qs: '?borde=0' });
    t('D · freno ?borde=0 (lo stesso di adminToggle86Via) ⇒ GAS, nessuna chiamata al bordo', L.fetch.length === 0 && L.gas[0] === 'adminListProducts', L); }
  { const { ctx, L } = await gira({ ago: { ok: true, apagado: false, seeded: true, ids: [] } });
    t('E · nessun agotado ⇒ tutti disponibili (lista seminata e vuota è un fatto, non un «non so»)', L.gas.length === 0 && ctx.STATE.prods.every((p) => p.agotado === false), ctx.STATE.prods); }
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['crede a un DO non seminato', ' || a.j.apagado || !a.j.seeded || ', ' || a.j.apagado || '],
    ['la rete ripiega sul GAS', "    if (b.stato === 'rete') return;   // resta quella in memoria", "    if (b.stato === 'rete') {}"],
    ['agotado ignorato', 'agotado: !!ago[String(p.id)]', 'agotado: false'],
    ['il freno ?borde=0 ignorato', "  if (!salta) {\n    const b = await _prodsDalBorde();", "  if (true) {\n    const b = await _prodsDalBorde();"],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
