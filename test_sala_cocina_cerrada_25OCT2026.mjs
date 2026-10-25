// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · la cucina chiusa non è rete (25-oct)
// Richiesta 🎛 BKP `BKP V32 CUCINA CERRADA NON E RETE` (bordo afe53fd, leva ESTACION_CERRADA_TIMBRO_ON): ① il mesero legge r.mensaje · ② in coda il no timbrato esce come l'86.
// Gira le righe VERE di crearPedido (il ramo del no) e _colaFlush · _cola86Txt VERI in vm.
// node test_sala_cocina_cerrada_25OCT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const QC = fs.readFileSync(new URL('./que_cambio.html', import.meta.url), 'utf8');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
const MSJ = 'La cocina está cerrada: Lomo saltado no se puede pedir ahora.';
const NO_C = { ok: false, error: 'estacion_cerrada', borde: true, definitivo: true, estacion: 'cocina', producto: 'Lomo saltado', mensaje: MSJ, msj: MSJ };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  // ① il ramo del no di crearPedido: le righe vere, dal commento della cucina chiusa fino a «} catch (e) {»
  { const i = SRC.indexOf('    if (r && r.error === \'estacion_cerrada\')'); const j = i < 0 ? -1 : SRC.indexOf('\n  } catch (e) {', i);
    const blocco = (i < 0 || j < 0) ? "toast('err', 'No se pudo: ' + (r && r.error || '?'));" : SRC.slice(i, j);
    const f = (r) => { const T = []; vm.runInContext('(function(r){ ' + blocco + ' })', vm.createContext({ toast: (k, s) => T.push([k, s]) }))(r); return T; };
    const a = f(NO_C), b = f({ ok: false, error: 'estacion_cerrada', borde: true }), c = f({ ok: false, error: 'codigo_invalid' });
    t('A · cucina chiusa: il mesero legge la frase del bordo, non «No se pudo: estacion_cerrada»', a.length === 1 && a[0][1].includes(MSJ) && !/No se pudo/.test(a[0][1]), a);
    t('B · senza mensaje: una frase in spagnolo, mai il codice', b.length === 1 && /Fuera de horario/.test(b[0][1]) && !/estacion_cerrada/.test(b[0][1]), b);
    t('C · un altro no resta «No se pudo: <codice>» come ieri', c.length === 1 && c[0][1] === 'No se pudo: codigo_invalid', c); }
  // ② la coda: il no timbrato della cucina esce, gli altri entrano, il mesero lo sa
  const coda = async (risposta) => { const LS = {}; let cola = [
      { action: 'crearPedidoMesero', body: { uuid: 'q1', mesa: 42, codigo: 'C' } },
      { action: 'crearPedidoMesero', body: { uuid: 'q2', mesa: 43, codigo: 'C' } }];
    const L = { toast: [], post: [] };
    const ctx = { JSON, Date, String, Math, COLA_FLUSHING: false, COLA_BORDE_ON: true, STATE: { codigo: 'C' },
      localStorage: { getItem: (k) => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); } },
      _colaGet: () => cola.slice(), _colaSave: (x) => { cola = x.slice(); }, _soloBorde: () => true,
      staffPost: async (act, b) => { L.post.push(b.uuid); return b.uuid === 'q1' ? risposta : { ok: true }; },
      gasPost: async () => ({ ok: true }), _ago86Marca: () => {}, toast: (k, s) => L.toast.push([k, s]), refrescar: () => {}, _colaBadge: () => {} };
    vm.createContext(ctx); vm.runInContext('async ' + fnVin(SRC, '_colaFlush') + fnVin(SRC, '_cola86Txt'), ctx);
    await vm.runInContext('_colaFlush()', ctx);
    return { cola, L, s86: JSON.parse(LS.sala_cola_86 || '[]'), ctx }; };
  { const w = await coda(NO_C); const ult = w.L.toast[w.L.toast.length - 1] || [];
    t('D · coda: la cucina chiusa timbrata esce e si mette da parte, l altro entra', w.cola.length === 0 && w.L.post.join(',') === 'q1,q2' && w.s86.length === 1 && w.s86[0].body.uuid === 'q1', { cola: w.cola, post: w.L.post, s86: w.s86 });
    t('E · l ultimo toast dice mesa e cucina chiusa, non «se acabó»', ult[0] === 'err' && /Mesa 42: fuera de horario \(Lomo saltado\)/.test(ult[1]) && !/se acabó/.test(ult[1]), w.L.toast);
    const txt = vm.runInContext('_cola86Txt', w.ctx)(w.s86[0]);
    t('F · il badge che lo rimostra dopo dice «la cocina está cerrada», non «se acabó»', /Mesa 42: fuera de horario \(Lomo saltado\)/.test(txt) && !/se acabó/.test(txt), txt); }
  { const w = await coda({ ok: false, error: 'estacion_cerrada' });   // senza timbro (leva del bordo "0"): staffPost l'ha già lanciata come rete, qui non arriverebbe; se arriva, si ferma come ieri
    t('G · un estacion_cerrada SENZA borde:true si ferma come ieri (non è un no definitivo)', w.cola.length === 2 && w.L.post.join(',') === 'q1' && w.s86.length === 0, { cola: w.cola, post: w.L.post }); }
  { const w = await coda({ ok: false, borde: true, need: 'items_agotados', agotados: [{ id: 'pan', nombre: 'Pan' }] });
    t('H · l 86 resta com era («se acabó Pan»)', w.cola.length === 0 && w.L.toast.some((x) => /Mesa 42: se acabó Pan/.test(x[1])), w.L.toast); }
  // ⓪ staffPost VERO: il no della cucina SENZA timbro (il bordo vivo di oggi) non è rete
  { const F = 'let STAFFPOST_SOLO = "";\n' + fnVin(SRC, '_soloBorde') + 'async ' + fnVin(SRC, 'staffPost');
    const chiama = async (solo, body) => { const L = { gas: [], penna: [] };
      const ctx = { BORDE_W: { QS: '', ok: {} }, STATE: { sala: { bw: true } }, BORDE_SALA: { URL: 'https://b', T: 't' }, CFG: { LOCAL: 'BKS' }, APP_ID: 'sala',
        JSON, Object, String, setTimeout, clearTimeout, AbortController, encodeURIComponent, Date,
        bordeWriteOn: () => true, _salaVer: () => 'v', _muroCampi: () => ({}), _vediNoAsignado: (j) => j, _pennaSvuota: () => {}, _pennaDice: (s) => L.penna.push(s), _cadutaMarca: (a, r) => r,
        fetch: async () => ({ status: 200, json: async () => body }), gasPost: async (a) => { L.gas.push(a); return { ok: true, via: 'gas' }; } };
      vm.createContext(ctx); vm.runInContext(F, ctx); vm.runInContext('STAFFPOST_SOLO = ' + JSON.stringify(solo) + ';', ctx);
      try { return { r: await vm.runInContext('staffPost("crearPedidoMesero", { uuid: "u1" })', ctx), L }; } catch (e) { return { lanciato: e.message, L }; } };
    const NUDO = { ok: false, error: 'estacion_cerrada', producto: 'Lomo saltado' };
    const x = await chiama('crearPedidoMesero', NUDO);
    t('J · solo bordo, cucina chiusa SENZA timbro ⇒ no definitivo con la frase, non lancia (niente coda), niente GAS', x.r && x.r.ok === false && x.r.definitivo === true && x.r.mensaje === 'Fuera de horario: Lomo saltado no se puede pedir ahora.' && !x.lanciato && x.L.gas.length === 0, x);
    const y = await chiama('', NUDO);
    t('K · leva solo-bordo spenta: lo stesso no non scivola sul GAS', y.r && y.r.definitivo === true && y.L.gas.length === 0, y);
    const z = await chiama('crearPedidoMesero', { ok: false, error: 'sin_gate' });
    t('L · un altro no senza timbro resta guasto ⇒ lancia come ieri', z.lanciato === 'sin_red', z);
    // e la catena: la risposta di staffPost entra nella coda e ne esce
    const w = await coda(x.r);
    t('M · catena: la risposta di staffPost (senza borde:true) esce dalla coda con «la cocina está cerrada»', w.cola.length === 0 && w.s86.length === 1 && w.L.toast.some((q) => /Mesa 42: fuera de horario \(Lomo saltado\)/.test(q[1])), w.L.toast); }
  t('I · «Qué cambió» ha la riga', /Cocina o barra cerrada/.test(QC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['il toast torna al codice', "if (r && r.error === 'estacion_cerrada') { toast('err', '🚫 ' + (r.mensaje", "if (false) { toast('err', '🚫 ' + (r.mensaje"],
    ['la coda si ferma sulla cucina chiusa', "if (r && r.error === 'estacion_cerrada' && (r.borde === true || r.definitivo === true)) {", "if (false) {"],
    ['la coda non guarda il timbro', "if (r && r.error === 'estacion_cerrada' && (r.borde === true || r.definitivo === true)) {", "if (r && r.error === 'estacion_cerrada') {"],
    ['staffPost la tratta come rete', "if (j && j.ok !== true && j.error === 'estacion_cerrada') {", 'if (false) {'],
    ['la coda ignora il definitivo', "(r.borde === true || r.definitivo === true)", 'r.borde === true'],
    ['il badge dice se acabó', "  if (x.cerrada) return 'Mesa '", "  if (false) return 'Mesa '"],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
