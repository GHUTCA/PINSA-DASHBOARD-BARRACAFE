// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · ② fetchYaPagado solo al bordo (21-ott)
// Richiesta: 🎛 `V32 I PEZZI CHE RESTANO DELLE 58 CHIAMATE` ②. Gira `fetchYaPagado` e `_yaPagRicorda` VERI in vm con fetch finto.
// node test_sala_yapagado_borde_21OTT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = 'async ' + fnVin(SRC, 'fetchYaPagado') + fnVin(SRC, '_yaPagRicorda');
  async function chiama({ status = 200, body, lancia = false, vuoto = true } = {}) {
    const L = { url: null, req: null, gas: 0 };
    const ctx = { BORDE_SALA: { URL: 'https://b', T: 'tk' }, CFG: { LOCAL: 'BKS' }, STATE: { codigo: 'C9' }, APP_ID: 'sala',
      JSON, String, setTimeout, clearTimeout, AbortController, encodeURIComponent, yapagVuotoOn: () => vuoto,
      fetch: async (u, o) => { L.url = u; L.req = JSON.parse(o.body); if (lancia) throw new Error('rete'); return { status, json: async () => body }; },
      gasPost: async () => { L.gas++; return { ok: false, error: 'Unknown action' }; }, gasGet: async () => { L.gas++; return {}; } };
    vm.createContext(ctx); vm.runInContext(F, ctx);
    const r = await vm.runInContext('fetchYaPagado("14")', ctx);
    ctx.__r = r; vm.runInContext('_yaPagRicorda("14", __r)', ctx);
    return { r, L, mem: ctx.STATE.pcYaPag };
  }
  const YP = { n: 1, monto: 23400, pagos: [{ id: 'PG1' }] };
  { const x = await chiama({ body: { ok: true, mesa: '14', fuente: 'borde', ya_pagado: YP, borde: true } });
    t('A · il bordo sa ⇒ la sua risposta passa, la mesa ricorda il pagato', x.r.ya_pagado && x.mem['14'] && x.mem['14'].monto === 23400, x); }
  { const x = await chiama({ body: { ok: true } });
    t('A2 · la richiesta: POST al /pedido-staff/BKS col token, action+codigo+mesa', /^https:\/\/b\/pedido-staff\/BKS\?t=tk$/.test(x.L.url) && x.L.req.action === 'fetchYaPagado' && x.L.req.codigo === 'C9' && x.L.req.mesa === '14', x.L); }
  { const x = await chiama({ body: { ok: false, need: 'gas', error: 'apagado' } });
    t('B · leva del bordo spenta (need:gas) ⇒ «non so» (ok:false), la mesa NON ricorda zero', x.r.ok === false && !('14' in (x.mem || {})), x); }
  { const x = await chiama({ lancia: true });
    t('C · rete morta ⇒ «non so», niente eccezione', x.r.ok === false && x.r.error === 'sin_red' && !('14' in (x.mem || {})), x); }
  { const x = await chiama({ status: 403, body: { ok: false, error: 'token' } });
    t('D · 4xx ⇒ «non so»', x.r.ok === false && !('14' in (x.mem || {})), x); }
  { const x = await chiama({ body: { ok: true, ya_pagado: YP } });
    t('E · un ok senza la firma fuente:borde non si crede', x.r.ok === false && !('14' in (x.mem || {})), x); }
  { let g = 0; for (const c of [{ body: { ok: false, need: 'gas' } }, { lancia: true }, { body: { ok: true, fuente: 'borde' } }]) g += (await chiama(c)).L.gas;
    t('F · ZERO chiamate a Google in ogni ramo', g === 0, g); }
  t('G · nel sorgente fetchYaPagado non nomina gasPost', !/gasPost\('fetchYaPagado'/.test(SRC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['torna al GAS', "    if (j && j.ok === true && j.fuente === 'borde') return j;\n    return { ok: false", "    if (j && j.ok === true && j.fuente === 'borde') return j;\n    return gasPost('fetchYaPagado', { codigo: STATE.codigo, mesa: mesa });\n    return { ok: false"],
    ['crede a ogni risposta', "    if (j && j.ok === true && j.fuente === 'borde') return j;", '    return j;'],
    ['senza la firma', "j.ok === true && j.fuente === 'borde'", 'j.ok === true'],
    ['la rete lancia', "  } catch (e) { return { ok: false, error: 'sin_red' }; }\n  finally { clearTimeout(to); }", "  } finally { clearTimeout(to); }"],
    ['senza la mesa', 'codigo: STATE.codigo, mesa: mesa, app: APP_ID', 'codigo: STATE.codigo, app: APP_ID'],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
