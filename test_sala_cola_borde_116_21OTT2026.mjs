// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · pezzo 1.16 · la cola offline entra dal bordo (21-ott)
// Gira la `_colaFlush` VERA di sala.html in vm con staffPost/gasPost finti. node test_sala_cola_borde_116_21OTT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = 'let COLA_FLUSHING = false;\nasync ' + fnVin(SRC, '_colaFlush');
  async function gira({ on = true, coda, staff = () => ({ ok: true, borde: true }), gas = () => ({ ok: true }) }) {
    let mem = JSON.parse(JSON.stringify(coda)); const vie = [], toasts = [];
    const ctx = { COLA_BORDE_ON: on, STATE: { codigo: 'C2' }, JSON,
      _colaGet: () => JSON.parse(JSON.stringify(mem)), _colaSave: (a) => { mem = JSON.parse(JSON.stringify(a)); },
      staffPost: async (a, b) => { vie.push(['staff', a, b.uuid, b.codigo]); return staff(b); },
      gasPost: async (a, b) => { vie.push(['gas', a, b.uuid, b.codigo]); return gas(b); },
      toast: (k, s) => toasts.push(s), refrescar: () => {}, _soloBorde: () => false };   // [21-ott] la leva per verbo dell'1.3: qui spenta
    vm.createContext(ctx); vm.runInContext(F, ctx); await vm.runInContext('_colaFlush()', ctx);
    return { vie, mem, toasts };
  }
  const CODA = [{ action: 'crearPedidoMesero', body: { codigo: 'C1', uuid: 'mg-1-cocina' }, intentos: 0 }, { action: 'crearPedidoMesero', body: { codigo: 'C1', uuid: 'mg-1-barra' }, intentos: 0 }];
  { const x = await gira({ coda: CODA }); t('A · leva accesa: le due entrate vanno a staffPost (il bordo), nessuna al GAS, la coda si svuota', x.vie.every((v) => v[0] === 'staff') && x.vie.length === 2 && x.mem.length === 0, x); }
  { const x = await gira({ coda: CODA }); t('A2 · stesso uuid della cattura e codigo vivo del turno', x.vie[0][2] === 'mg-1-cocina' && x.vie[0][3] === 'C2', x.vie); }
  { const x = await gira({ on: false, coda: CODA }); t('B · leva spenta: dritte al GAS, come ieri', x.vie.every((v) => v[0] === 'gas') && x.vie.length === 2 && x.mem.length === 0, x); }
  { const x = await gira({ coda: CODA, staff: () => { throw new Error('rete'); } }); t('C · rete morta ⇒ ci si ferma, la coda resta intera (prossimo giro)', x.mem.length === 2 && x.vie.length === 1, x); }
  { const x = await gira({ coda: CODA, staff: () => ({ ok: false, borde: true, error: 'codigo_invalid' }) }); t('D · rifiuto ⇒ la entry resta, intentos+1, ci si ferma', x.mem.length === 2 && x.mem[0].intentos === 1 && x.vie.length === 1, x); }
  { const x = await gira({ coda: CODA }); t('E · il toast conta 2 pedidos entrati', x.toasts.some((s) => /2 pedidos de la cola/.test(s)), x.toasts); }
  t('F · la leva si legge dal /salud e nasce spenta', /COLA_BORDE_ON = String\(cercaK\(j, 'cola_borde_on'\)\) === '1';/.test(SRC) && /var COLA_BORDE_ON = false;/.test(SRC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['sempre GAS', 'r = COLA_BORDE_ON ? await staffPost(e0.action, e0.body) : await gasPost(e0.action, e0.body);', 'r = await gasPost(e0.action, e0.body);'],
    ['sempre bordo', 'r = COLA_BORDE_ON ? await staffPost(e0.action, e0.body) : await gasPost(e0.action, e0.body);', 'r = await staffPost(e0.action, e0.body);'],
    ['la leva non si legge', "COLA_BORDE_ON = String(cercaK(j, 'cola_borde_on')) === '1';", ''],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
