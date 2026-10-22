// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · la venta del JL ferma «hace 576 min» senza errore (22-ott)
// Richiesta: 🎛 `V32 L APP DEL JL NON VEDE LA VENTA DALLE 08 20`. Gira le righe VERE di avvio (STATE + ripristino della cache), `salva`
// e `giroServicio` VERI in vm, con una cache che porta `servInVolo: true` — il telefono di Eduardo.
// node test_app_jl_venta_ferma_volo_22OTT2026.mjs [app_jl.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./app_jl.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  // le righe di avvio: dalla dichiarazione di STATE fino a salva() compresa
  const i0 = SRC.indexOf('let STATE = {'); const i1 = SRC.indexOf('\n', SRC.indexOf('function salva()'));
  if (i0 < 0 || i1 < 0) throw new Error('avvio');
  const AVVIO = SRC.slice(i0, i1 + 1).replace('let STATE', 'var STATE');
  function mondo(cache, ora) {
    const mem = { jl_cache_BKS: cache ? JSON.stringify(cache) : null }, L = { caja: 0 };
    const ctx = { JSON, Object, String, Math, CK: 'jl_cache_BKS', CFG: { LOCAL: 'BKS' }, DEMO: false,
      Date: class extends Date { static now() { return ora.v; } },
      localStorage: { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } },
      cjFlag: () => true, cjAtto1On: () => true, pintaTesta: () => {}, pintaTab: () => {}, giroHistorico: () => {},
      cajaPost1: async () => { L.caja++; return { ok: true, venta: 812340, cuentas: 21 }; } };
    vm.createContext(ctx); vm.runInContext(AVVIO.replace(/^const CK[^\n]*\n/m, '') + fnVin(SRC, '_servOn') + 'async ' + fnVin(SRC, 'giroServicio'), ctx);
    return { ctx, L, mem };
  }
  const ora = { v: Date.parse('2026-10-22T17:55:00-03:00') };
  const CACHE_EDUARDO = { ts: { serv: ora.v - 576 * 60000 }, serv: { ok: true, venta: 0, cuentas: 0 }, servInVolo: true, servInVoloTs: ora.v - 576 * 60000 };
  { const { ctx, L } = mondo(CACHE_EDUARDO, ora); vm.runInContext('STATE.pin = "1234"', ctx); await vm.runInContext('giroServicio()', ctx);
    t('A · la cache di Eduardo (servInVolo acceso dalle 08:20) ⇒ al ricaricamento il servicio PARTE e la venta si aggiorna', L.caja === 1 && ctx.STATE.serv.venta === 812340 && ctx.STATE.servInVolo === false, { caja: L.caja, serv: ctx.STATE.serv }); }
  { const { ctx, L } = mondo(Object.assign({}, CACHE_EDUARDO, { servInVoloTs: ora.v - 5000 }), ora); vm.runInContext('STATE.pin = "1234"', ctx); await vm.runInContext('giroServicio()', ctx);
    t('A2 · ricaricato 5 s dopo aver salvato in volo ⇒ parte SUBITO (il volo di prima è morto con la pagina, non si aspettano 30 s)', L.caja === 1, L.caja); }
  { const { ctx, mem } = mondo(null, ora); vm.runInContext('STATE.servInVolo = true; STATE.servInVoloTs = 1; STATE.ts = {}; salva()', ctx);
    const c = JSON.parse(mem.jl_cache_BKS);
    t('B · salva() non scrive mai il flag di volo nella cache', !('servInVolo' in c) && !('servInVoloTs' in c), Object.keys(c)); }
  { const { ctx, L } = mondo(null, ora); vm.runInContext('STATE.pin = "1"; STATE.servInVolo = true; STATE.servInVoloTs = ' + (ora.v - 5000), ctx); await vm.runInContext('giroServicio()', ctx);
    t('C · un volo VERO in corso (5 s fa) ⇒ non si raddoppia la chiamata', L.caja === 0); }
  { const { ctx, L } = mondo(null, ora); vm.runInContext('STATE.pin = "1"; STATE.servInVolo = true; STATE.servInVoloTs = ' + (ora.v - 31000), ctx); await vm.runInContext('giroServicio()', ctx);
    t('D · un volo rimasto acceso da più di 30 s scade da solo (mai un blocco per sempre)', L.caja === 1); }
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['il flag torna dalla cache', " STATE.pin = ''; STATE.servInVolo = false; STATE.servInVoloTs = 0; }", " STATE.pin = ''; }"],
    ['salva scrive il flag', ' delete c.servInVolo; delete c.servInVoloTs;', ''],
    ['nessuna scadenza', "  if (STATE.servInVolo && (Date.now() - (STATE.servInVoloTs || 0)) < 30000) return;", '  if (STATE.servInVolo) return;'],
    ['niente guardia del doppio volo', "  if (STATE.servInVolo && (Date.now() - (STATE.servInVoloTs || 0)) < 30000) return;", ''],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
