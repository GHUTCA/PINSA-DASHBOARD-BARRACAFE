// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · il secondo pago della stessa mesa si chiede (24-oct)
// Reperto: Anthony, mesa 42, 00:53:36 + 00:54:00, stesso medio e monto, uid diversi (🎛 BKP `BKP V32 ANTHONY IL DOPPIO E UNA FINESTRA…`).
// Gira gli helper VERI (_pagoRec*) e il BLOCCO VERO inserito in pagoConfirmar (estratto dal file) in vm, con _repetidoAsk e _pagoAlBorde finti.
// node test_sala_pago_doble_24OCT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const H = fnVin(SRC, '_pagoRecMappa') + fnVin(SRC, '_pagoRecSalva').replace(/^/, '') + fnVin(SRC, '_pagoRecDe') + fnVin(SRC, '_pagoRecSegna') + fnVin(SRC, '_pagoRecEsito');
  const i0 = SRC.indexOf("    var _prFin = 'no';"), i1 = SRC.indexOf('    let rB = await _pagoAlBorde(body, pg.tot);', i0);
  if (i0 < 0 || i1 < 0) throw new Error('blocco');
  const BLOCCO = SRC.slice(i0, i1);
  function mondo({ esOtro = false } = {}) {
    const LS = {}; let now = Date.parse('2026-10-24T00:53:36-03:00');
    const L = { ask: 0, toast: [], inviati: 0, chiuso: 0 };
    const ctx = { JSON, String, Number, Math, Object, Date: Object.assign(function (x) { return new globalThis.Date(x == null ? now : x); }, { now: () => now }),
      localStorage: { getItem: (k) => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); } },
      STATE: {}, PAGO_DOBLE_ON: true, PAGO_DOBLE_MS: 180000,
      _repetidoAsk: async () => { L.ask++; return esOtro; }, toast: (k, s) => L.toast.push([k, s]), renderPago: () => {}, cerrarMesa: () => { L.chiuso++; }, refrescar: () => {}, _pagoEsito: () => {}, _pagoMonto: () => 43970 };
    vm.createContext(ctx); vm.runInContext(H, ctx);
    // un «pagoConfirmar» minimo: il blocco vero, poi l'invio finto e l'esito
    vm.runInContext('async function prova(pg, body, esito) {\n' + BLOCCO + '\n  L_inviati++;\n  if (esito === "ok") _pagoRecEsito(pg.mesa, pg.uid, "ok"); else if (esito === "no") _pagoRecEsito(pg.mesa, pg.uid, "no"); else if (esito === "nose") _pagoRecEsito(pg.mesa, pg.uid, "ok");\n  return "inviato";\n}\nvar L_inviati = 0;', ctx);
    const paga = async (uid, { medio = 'efectivo', monto = null, esito = 'ok', parcial = false, c4 = false } = {}) => {
      const pg = { mesa: 42, uid, medio, enviando: true, c4: c4 ? {} : null }; const body = { mesa: 42, medio, pago_uid: uid }; if (monto != null) body.monto = monto; if (parcial) body.parcial = 1;
      const r = await vm.runInContext('prova', ctx)(pg, body, esito); L.inviati = ctx.L_inviati; return { r, body, pg };
    };
    return { ctx, L, paga, avanza: (ms) => { now += ms; } };
  }
  { const w = mondo(); await w.paga('PU-a0pz4'); w.avanza(24000); const x = await w.paga('PU-9xlg9');
    t('A · LA 42 DI ANTHONY: il secondo pago a 24 s (stesso medio e monto, uid diverso) si CHIEDE; «era el mismo» ⇒ non parte niente', w.L.ask === 1 && w.L.inviati === 1 && x.r === undefined && w.L.chiuso === 1 && w.L.toast.some((y) => /ya estaba registrado/.test(y[1])), w.L); }
  { const w = mondo({ esOtro: true }); await w.paga('PU-1'); w.avanza(24000); const x = await w.paga('PU-2');
    t('B · «Sí, es otro pago» ⇒ parte, col confirmo_repetido (il bordo non richiede)', w.L.inviati === 2 && x.body.confirmo_repetido === 1, w.L); }
  { const w = mondo(); await w.paga('PU-1'); w.avanza(24000); await w.paga('PU-2', { monto: 20000 });
    t('C · un secondo pago con un importo DIVERSO (una parte) non è disturbato', w.L.ask === 0 && w.L.inviati === 2); }
  { const w = mondo(); await w.paga('PU-1'); w.avanza(24000); await w.paga('PU-2', { medio: 'debito' });
    t('D · con un medio diverso non è disturbato', w.L.ask === 0 && w.L.inviati === 2); }
  { const w = mondo(); await w.paga('PU-1'); w.avanza(181000); await w.paga('PU-2');
    t('E · dopo 3 minuti nessuna domanda', w.L.ask === 0 && w.L.inviati === 2); }
  { const w = mondo(); await w.paga('PU-1', { esito: 'no' }); w.avanza(10000); await w.paga('PU-2');
    t('F · il primo è stato un NO definitivo ⇒ il secondo parte senza domanda', w.L.ask === 0 && w.L.inviati === 2); }
  { const w = mondo(); await w.paga('PU-1', { esito: 'nose' }); w.avanza(10000); await w.paga('PU-2');
    t('G · il primo senza risposta ⇒ il secondo si CHIEDE (può essere entrato)', w.L.ask === 1 && w.L.inviati === 1); }
  { const w = mondo(); w.ctx.STATE._pagoRec = { 42: { uid: 'PU-1', importe: 43970, medio: 'efectivo', ts: Date.parse('2026-10-24T00:53:30-03:00'), estado: 'volo' } };
    const x = await w.paga('PU-2');
    t('H · il primo ancora in volo ⇒ PAGAR si ferma («todavía se está registrando»), niente parte', x.r === undefined && w.L.inviati === 0 && w.L.toast.some((y) => /todavía se está registrando/.test(y[1])), w.L); }
  { const w = mondo(); w.ctx.STATE._pagoRec = { 42: { uid: 'PU-1', importe: 43970, medio: 'efectivo', ts: Date.parse('2026-10-24T00:52:00-03:00'), estado: 'volo' } };
    await w.paga('PU-2');
    t('I · un volo oltre 60 s non blocca: vale «ok» e si chiede', w.L.ask === 1, w.L); }
  { const w = mondo(); await w.paga('PU-1', { parcial: true, c4: true }); w.avanza(20000); await w.paga('PU-2', { parcial: true, c4: true });
    t('J · le parti di un conto diviso (c4) non sono disturbate (le guarda il bordo)', w.L.ask === 0 && w.L.inviati === 2); }
  { const w = mondo(); await w.paga('PU-1'); w.avanza(5000); await w.paga('PU-1');
    t('K · lo STESSO uid (un ritocco dello stesso pannello) non è un doppio: nessuna domanda', w.L.ask === 0 && w.L.inviati === 2); }
  t('L · il blocco sta PRIMA di _pagoAlBorde, e i tre esiti sono segnati (bordo · GAS · nessuna risposta)', SRC.indexOf("    if (PAGO_DOBLE_ON && !body.confirmo_repetido") < SRC.indexOf('    let rB = await _pagoAlBorde(body, pg.tot);') &&
    (SRC.match(/_prFin = 'ok'; if \(PAGO_DOBLE_ON\) _pagoRecEsito\(pg\.mesa, pg\.uid, 'ok'\);/g) || []).length === 2 && /_prFin = 'nose'; if \(PAGO_DOBLE_ON\) _pagoRecEsito/.test(SRC) && /_prFin === 'no'\) _pagoRecEsito\(pg\.mesa, pg\.uid, 'no'\)/.test(SRC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['non si chiede (stesso medio e monto)', "          const _esOtro = await _repetidoAsk({ hace_s: (Date.now() - _pr.ts) / 1000, monto: _imp });", '          const _esOtro = true;'],
    ['il volo non ferma', "        if (_pr.estado === 'volo') {", "        if (false) {"],
    ['il NO definitivo non toglie il segno', "  if (esito === 'no') delete m[String(mesa)]; else o.estado = 'ok';", "  o.estado = 'ok';"],
    ['la finestra non scade', '  if (!o || Date.now() - o.ts >= PAGO_DOBLE_MS) return null;', '  if (!o) return null;'],
    ['il volo blocca per sempre', "  if (o.estado === 'volo' && Date.now() - o.ts > 60000) o.estado = 'ok';", ''],
    ['si chiede anche con un importo diverso', "if (_pr.medio === String(pg.medio) && _pr.importe === _imp) {", 'if (true) {'],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
