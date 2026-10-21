// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · pezzo 5.10 · la leva del menù dal bordo (POST /menuLeva) con ripiego solo se non è sua (21-ott)
// Gira `_levaAlBorde`, `levaRefresca`, `leva`, `levaRefrescaNoche`, `levaNoche` VERI di app_jl.html in vm. node test_app_jl_leva_menu_510_21OTT2026.mjs [app_jl.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./app_jl.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = ['uidLeva', '_levaNorm', '_levaAplica', '_levaAplicaNoche', '_levaHoraOk'].map((n) => fnVin(SRC, n)).join('') +
    'let _levaLeyendo = false; let _levaNocheLeyendo = false;\n' + ['_levaAlBorde', 'levaRefresca', 'leva', 'levaRefrescaNoche', 'levaNoche'].map((n) => 'async ' + fnVin(SRC, n)).join('');
  async function gira(chiamata, { status = 200, body, lancia = false, qs = '' } = {}) {
    const L = { fetch: [], gas: [], toasts: [] };
    const ctx = { STATE: { pin: '4321', leva: null, levaInfo: {} }, CFG: { LOCAL: 'BKS' }, BORDE_86: 'https://b', BORDE_TOKEN_86: 'tok', JSON, String, Object, Math, Date, setTimeout, clearTimeout, AbortController, encodeURIComponent, URLSearchParams,
      location: { search: qs }, confirm: () => true, salva: () => {}, pintaTab: () => {}, fmt: (n) => '$' + n, toast: (k, s) => L.toasts.push([k, s]),
      fetch: async (u, o) => { L.fetch.push({ u, b: JSON.parse(o.body), h: o.headers }); if (lancia) throw new Error('rete'); return { status, json: async () => body }; },
      gasGet: async (a, p) => { L.gas.push([a, p]); return { ok: true, escalon: 'apagado', esca: { precio: 1 } }; },
      gasPost: async (a, p) => { L.gas.push([a, p]); return { ok: true, escalon: p.escalon === 'off' ? 'apagado' : p.escalon, esca: { precio: 1 } }; } };
    vm.createContext(ctx); vm.runInContext(F, ctx);
    // fuori fascia non deve fermare il banco della scrittura: l'orario è del GAS/bordo, la cortesia del vetro si toglie qui
    vm.runInContext('_levaHoraOk = function () { return true; };', ctx);
    await vm.runInContext(chiamata, ctx); return { ctx, L };
  }
  const SUA = { ok: true, escalon: 'esca', esca: { precio: 11990 }, estandar: { precio: 16990 } };
  { const { ctx, L } = await gira('levaRefresca()', { body: SUA });
    t('A · leggere dal bordo: get · dia · pin_jl, la stessa forma del GAS ⇒ STATE.leva esca, ZERO Google', L.gas.length === 0 && ctx.STATE.leva === 'esca' && ctx.STATE.levaInfo.esca === 11990 &&
      L.fetch[0].b.accion === 'get' && L.fetch[0].b.tipo === 'dia' && L.fetch[0].b.pin_jl === '4321' && /\/menuLeva\/BKS$/.test(L.fetch[0].u) && L.fetch[0].h['X-Borde-Token'] === 'tok', L); }
  for (const [n, o] of [['404 (rotta assente)', { status: 404, body: { ok: false } }], ['403', { status: 403, body: { ok: false, error: 'token_invalid' } }], ['gate_spento', { body: { ok: true, scritto: false, motivo: 'gate_spento' } }]]) {
    const { L } = await gira('levaRefresca()', o); t('B · lettura, ' + n + ' ⇒ getLevaMenu del GAS', L.gas[0] && L.gas[0][0] === 'getLevaMenu', L);
  }
  { const { ctx, L } = await gira('levaRefresca()', { lancia: true }); ctx.STATE.leva = null;
    t('C · lettura con rete morta ⇒ la card resta, niente Google', L.gas.length === 0, L); }
  { const { ctx, L } = await gira("leva('estandar')", { body: { ok: true, escalon: 'estandar', esca: { precio: 11990 }, estandar: { precio: 16990 } } });
    t('D · scrivere al bordo: set · dia · escalon · uid, «Menú activo», ZERO Google', L.gas.length === 0 && L.fetch[0].b.accion === 'set' && L.fetch[0].b.escalon === 'estandar' && /^lev-/.test(L.fetch[0].b.uid) && ctx.STATE.leva === 'estandar' && /activo/.test(L.toasts[0][1]), L); }
  { const { L } = await gira("leva('esca')", { lancia: true });
    t('E · scrittura con rete morta ⇒ «No sé si el menú cambió», si rilegge dal bordo, MAI setLevaMenu del GAS', !L.gas.some((g) => g[0] === 'setLevaMenu') && /No sé si el menú cambió/.test(L.toasts[0][1]) && L.fetch.length >= 2, L); }
  { const { L } = await gira("leva('esca')", { body: { ok: false, error: 'pin_jl_invalido' } });
    t('F · rifiuto del bordo (PIN) ⇒ si mostra, NON si ripiega sul GAS', !L.gas.length && /pin_jl_invalido/.test(L.toasts[0][1]), L); }
  { const { L } = await gira("leva('off')", { status: 404, body: { ok: false } });
    t('G · scrittura con rotta assente ⇒ setLevaMenu del GAS, come ieri', L.gas[0] && L.gas[0][0] === 'setLevaMenu' && L.gas[0][1].escalon === 'off', L); }
  { const { ctx, L } = await gira('levaRefrescaNoche()', { body: { ok: true, escalon: 'apagado', esca: { precio: 20990 } } });
    t('H · noche: get · noche dal bordo ⇒ STATE.levaNoche off', ctx.STATE.levaNoche === 'off' && L.fetch[0].b.tipo === 'noche' && !L.gas.length, L); }
  { const { L } = await gira("levaNoche('esca')", { lancia: true });
    t('H2 · noche, scrittura con rete morta ⇒ niente GAS', !L.gas.some((g) => g[0] === 'setLevaMenu') && /noche cambió/.test(L.toasts[0][1]), L); }
  { const { L } = await gira('levaRefresca()', { qs: '?borde=0', body: SUA });
    t('I · freno ?borde=0 ⇒ GAS, nessuna chiamata al bordo', L.fetch.length === 0 && L.gas[0][0] === 'getLevaMenu', L); }
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['la rete della scrittura ripiega sul GAS', "    if (bd.usado && bd.rete) { toast('warn', '⏳ No sé si el menú cambió", "    if (false) { toast('warn', '⏳ No sé si el menú cambió"],
    ['un rifiuto del bordo ripiega', "  if (j && j.ok === false && j.error) return { usado: true, ok: false, r: j };", "  if (j && j.ok === false && j.error) return { usado: false };"],
    ['gate_spento non ripiega', "  if (j && j.ok === true && j.scritto === false && j.motivo === 'gate_spento') return { usado: false };\n  if (j && j.ok === true && j.escalon)", "  if (j && j.ok === true && j.escalon)"],
    ['noche letta come dia', "const bd = await _levaAlBorde({ accion: 'get', tipo: 'noche' });", "const bd = await _levaAlBorde({ accion: 'get', tipo: 'dia' });"],
    ['set senza uid', "accion: 'set', tipo: 'dia', escalon: escalon, uid: uidLeva() }", "accion: 'set', tipo: 'dia', escalon: escalon }"],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
