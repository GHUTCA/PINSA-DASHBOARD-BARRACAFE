// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · staffpost_solo_borde anche nell'app del JL (23-oct)
// Richiesta: 🎛 `V32 RIPRESA OGGI SOLO LA SALA FUORI DA GOOGLE` ② (C3 app_jl:1070). Gira `_soloBordeJL` e `staffPost` VERI in vm.
// node test_app_jl_staffpost_solo_23OCT2026.mjs [app_jl.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./app_jl.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = fnVin(SRC, '_soloBordeJL') + 'async ' + fnVin(SRC, 'staffPost');
  async function chiama(action, { leva = '', status = 200, body, lancia = null }) {
    const L = { gas: 0, fetch: 0 };
    const ctx = { JSON, String, AbortController, setTimeout, clearTimeout, encodeURIComponent, Object,
      STATE: { salud: { ok: true, flags: { staffpost_solo_borde: leva } } }, CFG: { BORDE: 'https://b', LOCAL: 'BKS', T: 't' },
      fetch: async () => { L.fetch++; if (lancia) { const e = new Error('x'); e.name = lancia; throw e; } return { status, json: async () => body }; },
      gasPost: async () => { L.gas++; return { ok: true, via: 'gas' }; } };
    vm.createContext(ctx); vm.runInContext(F, ctx);
    try { const r = await vm.runInContext('staffPost(' + JSON.stringify(action) + ', { gid: "g1" })', ctx); return { r, L }; }
    catch (e) { return { lanciato: e.message, L }; }
  }
  const TIMBRO = { ok: true, borde: true };
  { const x = await chiama('moverMesa', { leva: '', body: { ok: false, need: 'gas', error: 'apagado' } }); t('A · leva vuota: il bordo non lo prende ⇒ il GAS come oggi', x.L.gas === 1 && x.r.via === 'gas', x); }
  { const x = await chiama('moverMesa', { leva: '', lancia: 'TypeError' }); t('A2 · leva vuota, rete morta ⇒ il GAS come oggi', x.L.gas === 1, x); }
  { const x = await chiama('moverMesa', { leva: 'crearPedidoMesero,marcarPedido,moverMesa,emitirPreCuenta', body: TIMBRO });
    t('B · il valore di stasera: moverMesa timbrato ⇒ la risposta del bordo, ZERO GAS', x.r.borde === true && x.L.gas === 0, x); }
  { const x = await chiama('moverMesa', { leva: 'crearPedidoMesero,marcarPedido,moverMesa,emitirPreCuenta', body: { ok: false, need: 'gas', error: 'gid_missing' } });
    t('C · moverMesa nell elenco, need:gas ⇒ ok:false col motivo e un mensaje in spagnolo, MAI GAS', x.r.ok === false && x.r.sin_borde === true && x.r.error === 'gid_missing' && /inténtalo de nuevo/.test(x.r.mensaje) && x.L.gas === 0, x); }
  { const x = await chiama('moverMesa', { leva: '1', lancia: 'AbortError' }); t('D · «1» = tutti; timeout ⇒ lancia «timeout», MAI GAS', x.lanciato === 'timeout' && x.L.gas === 0, x); }
  { const x = await chiama('moverMesa', { leva: '1', lancia: 'TypeError' }); t('D2 · rete morta ⇒ lancia «sin_red»', x.lanciato === 'sin_red' && x.L.gas === 0, x); }
  { const x = await chiama('moverMesa', { leva: 'crearPedidoMesero', body: { ok: false, need: 'gas' } }); t('E · verbo fuori dall elenco ⇒ il GAS come oggi', x.L.gas === 1, x); }
  { const x = await chiama('moverMesa', { leva: ' crearPedidoMesero , moverMesa ', body: { ok: false, need: 'gas' } }); t('F · elenco con spazi', x.L.gas === 0 && x.r.ok === false, x); }
  t('G · il chiamante moverMesa dice il motivo (mensaje) e «Sin conexión» se lancia', /toast\('err', '✋ ' \+ \(\(r && \(r\.mensaje \|\| r\.error\)\) \|\| 'No se pudo'\)\)/.test(SRC) && /Sin conexión — no se movió nada/.test(SRC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['il rifiuto torna al GAS', "    if (_solo) return { ok: false, sin_borde: true,", "    if (false) return { ok: false, sin_borde: true,"],
    ['la rete torna al GAS', "    if (_solo) throw new Error(e && e.name === 'AbortError' ? 'timeout' : 'sin_red');", ''],
    ['elenco ignorato (tutti sempre)', "  return v.split(',').map(function (x) { return x.trim(); }).indexOf(String(action || '')) >= 0;", '  return true;'],
    ['«1» non vuol dire tutti', "  if (v === '1') return true;\n", ''],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
