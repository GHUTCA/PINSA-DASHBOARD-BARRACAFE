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
  { const l = gira(SRC, { pg: { mesa: '997', tot: 2190, c4: { _resta: 0 } }, body: { parcial: 1, monto: 2190, es_total: true }, rB: { ok: true, borde: true, monto: 2190 } });
    t('H · l ultima parte che CHIUDE (parcial + es_total) dal bordo senza mesa_abierta ⇒ chiude, con ricevuta', has(l, 'cierre') && has(l, 'recibo') && !has(l, 'parcial'), l); }
  // ③ + il pezzo unico (⚙️ ARQ, 🎛 V30 UN PEZZO SOLO DOMATTINA): il blocco VERO del payload, con le funzioni VERE di c4 e _yaPagadoSesion
  const fnV = (nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); return SRC.slice(i, SRC.indexOf('\n}\n', i) + 3); };
  const fnR = (nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); return SRC.slice(i, SRC.indexOf('\n', i) + 1); };
  const pay = (pg) => {
    const a = SRC.indexOf('    const _yaPag = _yaPagadoSesion(pg);'); if (a < 0) throw new Error('blocco _yaPag');
    const fine = 'body.monto = Math.round(pg.tot); body.parcial = 1; _cierraConParte = true;\n    }'; const b = SRC.indexOf(fine, a); if (b < 0) throw new Error('fine blocco');
    const esT = SRC.slice(SRC.indexOf('  body.es_total = '), SRC.indexOf('\n', SRC.indexOf('  body.es_total = ')));
    const ctx = { pg, body: {}, Math, isFinite, _pagoMonto: () => pg.tot }; vm.createContext(ctx);
    vm.runInContext(['c4Falta', 'c4Parte', 'c4Resta', 'c4Cierra'].map(fnR).join('') + fnV('c4Bruto') + fnV('_yaPagadoSesion') +
      'let _cierraConParte = false;\n' + SRC.slice(a, b + fine.length) + '\n' + esT + ';\n', ctx);
    return ctx.body; };
  const c4todo = () => ({ paso: 'medio', modo: 'todo', sel: {}, partes: 0, pagadoAntes: 0 });
  { const b = pay({ parte: { monto: 6080 }, tot: 6080, restoAbrir: 6080, consumoAbrir: 6080 });
    t('③ dedo 6.080 su resto 6.080, niente pagato prima: pago INTERO (niente parcial, niente monto, es_total)', b.parcial === undefined && b.monto === undefined && b.es_total === true, b); }
  { const b = pay({ parte: { monto: 3000 }, tot: 3000, restoAbrir: 6080, consumoAbrir: 6080 });
    t('③ dedo 3.000 su resto 6.080: parte (parcial, monto 3.000, es_total falso)', b.parcial === 1 && b.monto === 3000 && b.es_total === false, b); }
  { const b = pay({ parte: { monto: 3000 }, tot: 3000, restoAbrir: 0, consumoAbrir: 0 });
    t('③ resto ignoto (0): resta parte, il verso sicuro', b.parcial === 1 && b.monto === 3000, b); }
  { const b = pay({ parte: { monto: 3000 }, tot: 3000, restoAbrir: 6080, consumoAbrir: 6080, montoOn: true });
    t('③ col monto ritoccato a mano comanda la sua porta: questo blocco non scrive niente', b.parcial === undefined, b); }
  { const b = pay({ parte: { monto: 2190 }, tot: 2190, restoAbrir: 2190, consumoAbrir: 6080 });
    t('U1 · dedo che copre il resto 2.190 DOPO 3.890 già pagati: parcial + monto 2.190 + es_total (il libro sottrae, non scrive 6.080)', b.parcial === 1 && b.monto === 2190 && b.es_total === true, b); }
  { const b = pay({ c4: c4todo(), tot: 2190, restoAbrir: 2190, consumoAbrir: 6080 });
    t('U2 · CASO COMUNE: c4 «pago todo» del resto 2.190 dopo una parte (pagadoAntes 0, il già pagato dentro pg.tot) ⇒ parcial + monto 2.190 + es_total', b.parcial === 1 && b.monto === 2190 && b.es_total === true, b); }
  { const b = pay({ c4: Object.assign(c4todo(), { pagadoAntes: 3890 }), tot: 6080, restoAbrir: 6080, consumoAbrir: 6080 });
    t('U3 · c4 che chiude con pagadoAntes 3.890 (yapag2/ritentativo) ⇒ parcial + monto 2.190 (c4Falta) + es_total', b.parcial === 1 && b.monto === 2190 && b.es_total === true, b); }
  { const b = pay({ c4: c4todo(), tot: 6080, restoAbrir: 6080, consumoAbrir: 6080 });
    t('U4 · c4 «pago todo» di colpo solo, niente pagato prima: pago intero come oggi (niente monto)', b.parcial === undefined && b.monto === undefined && b.es_total === true, b); }
  { const b = pay({ c4: Object.assign(c4todo(), { modo: 'iguales', partes: 2 }), tot: 6080, restoAbrir: 6080, consumoAbrir: 6080 });
    t('U5 · c4 a metà (3.040 su 6.080): parte come oggi, es_total falso', b.parcial === 1 && b.monto === 3040 && b.es_total === false, b); }
  { const b = pay({ tot: 2190, restoAbrir: 2190, consumoAbrir: 6080 });
    t('U6 · pago senza c4 né parte (un altro telefono) del resto 2.190 dopo 3.890 ⇒ parcial + monto 2.190 + es_total', b.parcial === 1 && b.monto === 2190 && b.es_total === true, b); }
  { const b = pay({ tot: 6080, restoAbrir: 6080, consumoAbrir: 6080 });
    t('U7 · pago senza c4 né parte, niente pagato prima: come oggi', b.parcial === undefined && b.monto === undefined, b); }
  // _vpTot: il già pagato = MASSIMO fra server e memoria locale (mai la somma), nel ramo uuids
  const vp = ({ res, sed, loc, serverOn = true }) => { const ctx = { Math, Number, isFinite, PAGO_UUIDS_VETRO_ON: true, MARCA_TS_ON: true, RESTO_SERVER_ON: serverOn,
      STATE: { mesasModel: [], pagadoParcial: loc ? { '997': loc } : {} }, _resDe: () => (res ? { total: res } : null), _pagadoSedutaDeMesa: () => (sed === undefined ? null : sed) };
    const i0 = SRC.indexOf('function _vpTot('), i1 = SRC.indexOf('    return Math.max(0, baseU - pagU);', i0);
    vm.createContext(ctx); vm.runInContext(fnV('_vpBase') + SRC.slice(i0, i1) + '    return Math.max(0, baseU - pagU);\n  }\n}\nthis.r = _vpTot("997");', ctx); return ctx.r; };
  t('V1 · telefono B (nessuna memoria), il server sa 3.890 ⇒ resto 2.190 (prima: 6.080)', vp({ res: 6080, sed: 3890 }) === 2190, vp({ res: 6080, sed: 3890 }));
  t('V2 · telefono A, server stantio (0) e memoria 3.890 ⇒ 2.190 (il massimo, non il server secco)', vp({ res: 6080, sed: 0, loc: 3890 }) === 2190, vp({ res: 6080, sed: 0, loc: 3890 }));
  t('V3 · server 4.890 (A 3.890 + B 1.000), memoria A 3.890 ⇒ 1.190: mai la somma (che darebbe 0)', vp({ res: 6080, sed: 4890, loc: 3890 }) === 1190, vp({ res: 6080, sed: 4890, loc: 3890 }));
  t('V4 · server spento per apparecchio, memoria 3.890 ⇒ 2.190 come ieri', vp({ res: 6080, sed: 4890, loc: 3890, serverOn: false }) === 2190);
  t('V5 · nessun pagato da nessuna parte ⇒ consumo intero', vp({ res: 6080 }) === 6080);
  { const ab = SRC.slice(SRC.indexOf('function abrirPago('), SRC.indexOf('function abrirPago(') + 20000);
    t('③ abrirPago salva resto E consumo PRIMA che la parte prenda il posto del totale, e li porta in STATE.pago',
      ab.indexOf('const _restoAbrir = tot;') > 0 && ab.indexOf('_consAbrir += _vpBase(mm)') > 0 && ab.indexOf('_consAbrir += _vpBase(mm)') < ab.indexOf('if (_pt) tot = _pt;') && /restoAbrir: _restoAbrir, consumoAbrir: _consAbrir/.test(ab)); }
  return ko - k0;
}
banco(SRC0);
const mut = (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; let rossi; try { banco(SRC0.replace(da, () => a)); rossi = ko - k1; } catch (e) { rossi = 'sintassi:' + e.message; } muto = false; ko = k0; ok = o0;
  t('mutante «' + nome + '» ⇒ banco ROSSO', typeof rossi === 'number' && rossi > 0, rossi); };
mut('la guardia della parte tolta (il difetto della 997)', '      if (_abiertaB) {', '      if (false) {');
mut('il bordo non vince su mesa_abierta', "(rB.mesa_abierta === true || rB.mesa_abierta === false) ? rB.mesa_abierta", "false ? rB.mesa_abierta");
mut('③ la parte a dedo torna parcial sempre', "if (!(pg.restoAbrir > 0) || _mParte < Math.round(pg.restoAbrir)) {", "if (true) {");
mut('③ il resto ignoto diventa intero', "if (!(pg.restoAbrir > 0) || _mParte < Math.round(pg.restoAbrir)) {", "if (_mParte < Math.round(pg.restoAbrir)) {");
mut("U il caso comune dimenticato (solo pagadoAntes)", "const dif = (pg.consumoAbrir > 0", "const dif = 0 && (pg.consumoAbrir > 0");
mut("U la c4 che chiude esce intera", "else if (pg.c4 && !pg.montoOn && _yaPag > 0) {", "else if (false) {");
mut("U l ultima parte senza es_total", "body.es_total = !body.parcial || _cierraConParte;", "body.es_total = !body.parcial;");
mut("V il server torna ignorato", "const sedU = RESTO_SERVER_ON ? _pagadoSedutaDeMesa(mesa) : null;", "const sedU = null;");
mut("V server e memoria sommati", "const pagU = Math.max((sedU != null && isFinite(Number(sedU))) ? Number(sedU) : 0, parcU || 0);", "const pagU = ((sedU != null) ? Number(sedU) : 0) + (parcU || 0);");
mut('parcial solo numerico', "(body.parcial === 1 || body.parcial === '1')", "(body.parcial === 1)");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exitCode = ko ? 1 : 0;
