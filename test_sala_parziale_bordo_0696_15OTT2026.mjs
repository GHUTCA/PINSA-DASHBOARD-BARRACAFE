// BANCO · TERZA PENNA V30 · CONTROLLO DELL'AUTRICE · AUT-0696 · il ramo VERO «pago accettato dal bordo» di sala.html, estratto e fatto girare in vm
// node test_sala_parziale_bordo_0696_15OTT2026.mjs [sala.html] · controllo negativo sul vivo v3.226.7: 9 rossi su 12 (A riproduce il toast di Wilbert)
import fs from 'node:fs'; import vm from 'node:vm';
const SRC0 = fs.readFileSync(process.argv[2] || new URL('./sala.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 300))); if (c && !muto) console.log('✓', n); };
function ramo(SRC) {
  const testa = '    if (rB && rB.ok !== false) {';
  const a = SRC.indexOf(testa); if (a < 0) throw new Error('ramo non trovato');
  let d = 0, i = a + testa.length - 1;
  for (; i < SRC.length; i++) { if (SRC[i] === '{') d++; else if (SRC[i] === '}') { d--; if (d === 0) break; } }
  return SRC.slice(a, i + 1);
}
function gira(SRC, { pg, body, rB, propina = 0 }) {
  const log = [];
  const ctx = { STATE: { pago: {} }, Math, Number, isFinite, String, JSON,
    _pagoEsito: (p, e, m) => log.push(['esito', e, m]), _limpiarUuidsLocal: (u, m) => log.push(['limpiaU', m]), _limpiarJuntaLocal: (m) => log.push(['limpiaJ', m]),
    _marcarCierreInstante: (m) => log.push(['cierre', m]), _marcarPagoParcial: (m, x) => log.push(['parcial', m, x]),
    toast: (k, s) => log.push(['toast', s]), fmtPrice: (n) => '$' + Number(n).toLocaleString('es-CL'), _recibo: (o) => log.push(['recibo', o.monto]),
    renderPago: () => {}, cerrarMesa: () => log.push(['cerrarMesa']), refrescar: () => {}, setTimeout: (f) => f(),
    c4Resta: (p) => p.c4._resta, pg, body, rB, propina, esCort: false };
  vm.createContext(ctx);
  vm.runInContext('(function(){' + ramo(SRC) + '\n log.push(["fuori"]); })()'.replace('log.push', 'this.__l.push'), Object.assign(ctx, { __l: log }));
  return log;
}
const has = (l, k) => l.some((x) => x[0] === k);
const txt = (l) => l.filter((x) => x[0] === 'toast').map((x) => x[1]).join(' | ');
function banco(SRC) {
  const k0 = ko;
  { const l = gira(SRC, { pg: { mesa: '997', tot: 6080, c4: { _resta: 2190 } }, body: { parcial: 1, monto: 3890 }, rB: { ok: true, borde: true, monto: 3890 }, propina: 389 });
    t('A · 997: parte $3.890 su $6.080 dal bordo (ACK senza mesa_abierta) ⇒ NESSUNA pulizia, NESSUN cierre', !has(l, 'limpiaJ') && !has(l, 'limpiaU') && !has(l, 'cierre'), l);
    t('A · si marca la parte (3.890) e il toast dice FALTA $2.190 e «sigue abierta»', l.some((x) => x[0] === 'parcial' && x[1] === '997' && x[2] === 3890) && /FALTA \$2\.190/.test(txt(l)) && /sigue abierta/.test(txt(l)), txt(l));
    t('A · esito ok bordo dichiarato, il ramo ritorna (non cade nel GAS)', l.some((x) => x[0] === 'esito' && x[1] === 'ok' && x[2] === 'bordo') && !has(l, 'fuori') && has(l, 'cerrarMesa'), l); }
  { const l = gira(SRC, { pg: { mesa: '998', tot: 6080 }, body: {}, rB: { ok: true, borde: true, monto: 6080 } });
    t('B · pago TOTALE dal bordo: come ieri (pulisce la junta, marca il cierre, ricevuta)', has(l, 'limpiaJ') && has(l, 'cierre') && has(l, 'recibo') && !has(l, 'parcial'), l); }
  { const l = gira(SRC, { pg: { mesa: '997', tot: 6080, c4: { _resta: 2190 } }, body: { parcial: 1, monto: 3890 }, rB: { ok: true, borde: true, monto: 3890, mesa_abierta: false } });
    t('C · il bordo dice mesa_abierta:false (copre tutto) ⇒ vince lui: si chiude', has(l, 'limpiaJ') && has(l, 'cierre'), l); }
  { const l = gira(SRC, { pg: { mesa: '50', tot: 10000 }, body: {}, rB: { ok: true, borde: true, monto: 4000, mesa_abierta: true, falta: 6000 } });
    t('D · il bordo dice mesa_abierta:true anche senza parcial ⇒ resta aperta, FALTA $6.000 dal bordo', !has(l, 'cierre') && !has(l, 'limpiaJ') && /FALTA \$6\.000/.test(txt(l)), txt(l)); }
  { const l = gira(SRC, { pg: { mesa: '997', tot: 6080, c4: { _resta: 2190 } }, body: { parcial: 1, monto: 3890 }, rB: { ok: true, borde: true, monto: 3890, falta: 2000 } });
    t('E · se il bordo manda falta vince sul calcolo locale (2.000, non 2.190)', /FALTA \$2\.000/.test(txt(l)) && !/2\.190/.test(txt(l)), txt(l)); }
  { const l = gira(SRC, { pg: { mesa: '70', tot: 9000, parte: { titulo: 'dedo', monto: 3000 } }, body: { parcial: 1, monto: 3000 }, rB: { ok: true, borde: true, monto: 3000 } });
    t('F · parte a dedo del JL (senza c4): resta aperta, nessun numero inventato', !has(l, 'cierre') && /sigue abierta/.test(txt(l)) && !/FALTA/.test(txt(l)), txt(l)); }
  { const l = gira(SRC, { pg: { mesa: '997', tot: 6080, c4: { _resta: 2190 } }, body: { parcial: '1', monto: 3890 }, rB: { ok: true, borde: true, monto: 3890 } });
    t('G · parcial come stringa "1" ⇒ stessa cosa di 1', !has(l, 'cierre'), l); }
  return ko - k0;
}
banco(SRC0);
const mut = (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; let rossi; try { banco(SRC0.replace(da, () => a)); rossi = ko - k1; } catch (e) { rossi = 'sintassi:' + e.message; } muto = false; ko = k0; ok = o0;
  t('mutante «' + nome + '» ⇒ banco ROSSO', typeof rossi === 'number' && rossi > 0, rossi); };
mut('la guardia della parte tolta (il difetto della 997)', '      if (_abiertaB) {', '      if (false) {');
mut('il bordo non vince su mesa_abierta', "(rB.mesa_abierta === true || rB.mesa_abierta === false) ? rB.mesa_abierta", "false ? rB.mesa_abierta");
mut('parcial solo numerico', "(body.parcial === 1 || body.parcial === '1')", "(body.parcial === 1)");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exitCode = ko ? 1 : 0;
