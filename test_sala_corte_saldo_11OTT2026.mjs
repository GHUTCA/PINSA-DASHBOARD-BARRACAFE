// BANCO · IL CORTE DEL MESERO NON SI CHIUDE CON UNA MESA A SALDO — il VETRO DELLA SALA (AUT-0666 punto 2 · 🎛 BKP `BKP 0666 PUNTO 2 D1716DE IL CANCELLO E LA PORTA`) · TERZA PENNA · 11-ott-2026
// Contratto di BKP: il bordo risponde `{ok:false, error:'mesa_a_saldo', definitivo:true, borde:true, mesas:[{mesa, consumo, pagado, resto}]}` PRIMA di entrambe le uscite del corte (corte del bordo e `pasar_mesas` verso il GAS).
// Il vetro la tratta come DEFINITIVA: niente ripiego sul GAS. Qui si esegue `cierreEnviar` VERA (e `_cieSaldo`) con il bordo e il GAS finti.
// ① corte del bordo + mesa_a_saldo => la schermata del saldo, il GAS MAI ② la strada del «passa le mesas» (pasarMesas) con la leva => il vetro ASPETTA il bordo e si ferma anche li ③ senza leva la strada del passa-mesas e quella di ieri
// (fire-and-forget, GAS) ④ un bordo muto/null/altro errore => prosegue su GAS come ieri ⑤ il corte pulito non cambia ⑥ la schermata: mesa, pagado, resto, totale e le TRE uscite ⑦ cablaggio /salud ⑧ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'sala.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 360))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); const a = SRC.slice(Math.max(0, i - 6), i) === 'async ' ? i - 6 : i; return SRC.slice(a, SRC.indexOf('\n}\n', i) + 3); };
function mondo(SRC, o) {
  const ev = { render: [], bordo: [], gas: [], hechos: [], paso4: [], toasts: [] };
  const ctx = { CORTE_BORDE_ON: !!o.corteBorde, CAJA_ATTO1_ON: o.atto1 !== false, SALDO_SIN_PADRON_ON: !!o.saldoOn,
    CIE: { enviando: false, paso: 2, uidMonto: 5000, motivo: '', pasarMesas: !!o.pasar, res: null, franja: 'noche' },
    _cieMontoValor: () => 5000, $: () => null, toast: (k, m) => ev.toasts.push([k, m]), esc: (x) => String(x == null ? '' : x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])), fmtPrice: (n) => '$' + n, STATE: { codigo: 'C1', nombre: 'Anthony' },
    _cieUid: () => 'uid-1', _cieUidKey: () => 'k', localStorage: { removeItem() {} }, Date, Math, Number, Object, Array, Promise, String, JSON, console,
    _cerrarMeseroAlBorde: async (b) => { ev.bordo.push(b); if (o.bordoThrow) throw new Error('x'); return o.bordo === undefined ? null : o.bordo; },
    gasPost: async (a, b) => { ev.gas.push([a, b]); return o.gas || { ok: true, dedup: false }; },
    bordeHecho: (n, d) => ev.hechos.push([n, d]), _ciePaso4: (r) => ev.paso4.push(r), _ciePaso4Dedup() {}, _ciePaso3Motivo() {}, _cieRender: (h) => ev.render.push(h),
    _cieVoyACobrar() {}, _cieSalirSinCerrar() {}, _cieCerrar() {}, _CIE_INTENTO: 1 };
  vm.createContext(ctx);
  vm.runInContext(['_cieSaldo', 'cierreEnviar'].map((n) => fnDe(SRC, n)).join('\n') + '\nthis.F = { cierreEnviar, _cieSaldo };', ctx);
  return { ctx, ev };
}
const SALDO = (extra) => Object.assign({ ok: false, error: 'mesa_a_saldo', definitivo: true, borde: true, mesas: [{ mesa: '100', consumo: 161970, pagado: 41970, resto: 120000 }] }, extra || {});
async function banco(SRC) {
  // ① corte del bordo
  { const m = mondo(SRC, { corteBorde: true, saldoOn: true, bordo: SALDO() }); await m.ctx.F.cierreEnviar();
    t('① corte del bordo + mesa_a_saldo: la schermata del saldo, MAI il GAS', m.ev.render.length === 1 && /a saldo/.test(m.ev.render[0]) && m.ev.gas.length === 0 && m.ev.paso4.length === 0, [m.ev.render.length, m.ev.gas.length]);
    t('① bis il bottone si rilascia (CIE.enviando false) e il testimone «corte_rechazado_saldo» parte', m.ctx.CIE.enviando === false && m.ev.hechos.some((h) => h[0] === 'corte_rechazado_saldo' && h[1].n === 1 && h[1].resto === 120000), m.ev.hechos); }
  // ② la strada del «passa le mesas»
  { const m = mondo(SRC, { saldoOn: true, pasar: true, bordo: SALDO() }); await m.ctx.F.cierreEnviar();
    t('② pasarMesas + leva: il vetro ASPETTA il bordo e si ferma sul saldo (prima era fire-and-forget e il GAS chiudeva)', m.ev.bordo.length === 1 && m.ev.render.length === 1 && m.ev.gas.length === 0, [m.ev.bordo.length, m.ev.gas.length]); }
  { const m = mondo(SRC, { corteBorde: false, saldoOn: true, pasar: false, bordo: SALDO() }); await m.ctx.F.cierreEnviar();
    t('② bis corte del bordo spento + leva del saldo: stessa cosa', m.ev.render.length === 1 && m.ev.gas.length === 0); }
  // ③ senza leva: ieri
  { const m = mondo(SRC, { saldoOn: false, pasar: true, bordo: SALDO() }); await m.ctx.F.cierreEnviar();
    t('③ SENZA la leva del vetro, la strada del passa-mesas e quella di ieri: il GAS chiude (il cancello del bordo vive solo se il vetro lo aspetta)', m.ev.gas.length === 1 && m.ev.render.length === 0 && m.ev.paso4.length === 1, [m.ev.gas.length, m.ev.render.length]);
    t('③ bis e il bordo e chiamato UNA volta, senza essere atteso', m.ev.bordo.length === 1); }
  // ④ bordo muto
  for (const [n, o] of [['null (need:gas / rete)', { bordo: null }], ['throw', { bordoThrow: true }], ['un altro errore', { bordo: { ok: false, error: 'sin_gate', borde: true } }]]) {
    const m = mondo(SRC, { saldoOn: true, pasar: true, ...o }); await m.ctx.F.cierreEnviar();
    t('④ bordo ' + n + ': non e un saldo, si prosegue su GAS come ieri', m.ev.gas.length === 1 && m.ev.render.length === 0, [m.ev.gas.length, m.ev.render.length]); }
  // ⑤ il corte pulito
  { const m = mondo(SRC, { corteBorde: true, saldoOn: true, bordo: { ok: true, borde: true, recibido: true, cierre: {} } }); await m.ctx.F.cierreEnviar();
    t('⑤ corte pulito dal bordo: _ciePaso4, nessun GAS, nessun saldo', m.ev.paso4.length === 1 && m.ev.gas.length === 0 && m.ev.render.length === 0, [m.ev.paso4.length, m.ev.gas.length]); }
  { const m = mondo(SRC, { corteBorde: true, saldoOn: true, bordo: { ok: false, error: 'mesas_abiertas', borde: true, mesas_abiertas: [{ mesa: '7', consumo: 100 }] } }); await m.ctx.F.cierreEnviar();
    t('⑤ bis «mesas_abiertas» resta la schermata di prima (non e il saldo)', m.ev.render.length === 1 && /mesas abiertas/.test(m.ev.render[0]) && !/a saldo/.test(m.ev.render[0]), m.ev.render[0]); }
  // ⑥ la schermata
  { const m = mondo(SRC, {}); m.ctx.F._cieSaldo(SALDO({ mesas: [{ mesa: '100', consumo: 161970, pagado: 41970, resto: 120000 }, { mesa: '7', consumo: 30000, pagado: 10000, resto: 20000 }] })); const h = m.ev.render[0];
    t('⑥ ogni mesa col pagado, il consumo e il RESTO; il totale 140.000', /Mesa 100/.test(h) && /pagado \$41970 de \$161970/.test(h) && /resto \$120000/.test(h) && /Mesa 7/.test(h) && /resto \$20000/.test(h) && /\$140000 por cerrar/.test(h), h);
    t('⑥ bis le TRE uscite: cobrar il resto · ELIMINAR/descuento con motivo · «se fue sin pagar» lo firma il JL', /Cobra el resto/.test(h) && /ELIMINAR/.test(h) && /se fue sin pagar/.test(h) && /el JL|al JL/.test(h), h);
    t('⑥ ter «Cobro el resto ahora» e «Salir sin cerrar» (nessun bottone per chiudere comunque)', /_cieVoyACobrar\(\)/.test(h) && /_cieSalirSinCerrar\(\)/.test(h) && !/cierreEnviar\(\)/.test(h), h); }
  { const m = mondo(SRC, {}); m.ctx.F._cieSaldo(SALDO({ mesas: [{ mesa: '<b>9</b>', consumo: 1, pagado: 0, resto: 1 }] }));
    t('⑥ quater il numero di mesa e escapato (nessun HTML dal bordo)', !/<b>9<\/b>/.test(m.ev.render[0]) && /&lt;b&gt;9/.test(m.ev.render[0]), m.ev.render[0]); }
  // ⑦ cablaggio
  t('⑦ la leva del vetro nasce spenta e si legge da /salud (saldo_sin_padron_on)', /var SALDO_SIN_PADRON_ON = false;/.test(SRC) && /SALDO_SIN_PADRON_ON = String\(cercaK\(j, 'saldo_sin_padron_on'\)\) === '1';/.test(SRC));
  t('versione >= 3.228.0', /sala v3\.(228\.\d|22[9]\.\d|2[3-9]\d\.\d)/.test(SRC));
}
await banco(SRC0);
const mut = async (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; try { await banco(SRC0.replace(da, () => a)); } catch (e) { ko++; } muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
await mut('il saldo del corte del bordo non ferma', "if (rb && rb.error === 'mesa_a_saldo') rbSaldo = rb;   // [AUT-0666] definitivo", "if (false) rbSaldo = rb;");
await mut('il saldo non e definitivo: il GAS chiude', "if (rbSaldo) { _cieSaldo(rbSaldo); CIE.enviando = false; return; }", "if (rbSaldo) { _cieSaldo(rbSaldo); CIE.enviando = false; }");
await mut('il passa-mesas non aspetta il bordo', "} else if (SALDO_SIN_PADRON_ON) {", "} else if (false) {");
await mut('il passa-mesas aspetta anche a leva spenta', "} else if (SALDO_SIN_PADRON_ON) {", "} else if (true) {");
await mut('un errore qualunque ferma il corte', "if (rb2 && rb2.error === 'mesa_a_saldo') rbSaldo = rb2;", "if (rb2) rbSaldo = rb2;");
await mut('il bordo che lancia rompe il corte', "const rb2 = await _cerrarMeseroAlBorde(_cierreBody).catch(function () { return null; });", "const rb2 = await _cerrarMeseroAlBorde(_cierreBody);");
await mut('il bottone resta spento', "if (rbSaldo) { _cieSaldo(rbSaldo); CIE.enviando = false; return; }", "if (rbSaldo) { _cieSaldo(rbSaldo); return; }");
await mut('manca il resto in schermata', "<b>resto ' + esc(fmtPrice(m.resto || 0)) + '</b>", "<b>' + '</b>");
await mut('manca il totale', "con ' + esc(fmtPrice(tot)) + ' por cerrar", "por cerrar");
await mut('manca l uscita del JL', "si el cliente <b>se fue sin pagar</b>, díselo al JL: él lo firma.", "");
await mut('manca il testimone', "bordeHecho('corte_rechazado_saldo'", "void ('corte_rechazado_saldo'");
await mut('mesa non escapata', "<span>Mesa ' + esc(m.mesa) + ' <small>pagado", "<span>Mesa ' + m.mesa + ' <small>pagado");
await mut('la leva non si legge', "SALDO_SIN_PADRON_ON = String(cercaK(j, 'saldo_sin_padron_on')) === '1';", "");
await mut('la leva nasce accesa', "var SALDO_SIN_PADRON_ON = false;", "var SALDO_SIN_PADRON_ON = true;");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
