// BANCO · TERZA PENNA V30 · CONTROLLO DELL'AUTRICE · AUT-0716 · la propina del mixto dice in che mezzo entra (19-ott)
// Reperto: Isa, mesa 20 (18-ott), mixto efectivo 14.926 + débito 35.814, propina 5.074 in contanti: la regola del bordo la metteva in carta.
// Contratto di 🎛 BKP: `propina` su OGNI riga di `medios_json`, somma = propina del pago; assente = la regola di oggi.
// Gira il codice VERO di sala.html in vm: il blocco mixto di pagoConfirmar, _mxMediosConMonto, _mxPropMedio, _mxPropHtml, bPropMedio.
// node test_sala_propina_mixto_0716_19OTT2026.mjs [sala.html]
import fs from 'node:fs'; import vm from 'node:vm';
const SRC = fs.readFileSync(process.argv[2] || new URL('./sala.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 400))); };
const fnV = (nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); return SRC.slice(i, SRC.indexOf('\n}\n', i) + 3); };
const tra = (a, b) => { const i = SRC.indexOf(a); if (i < 0) throw new Error('marcatore: ' + a); const j = SRC.indexOf(b, i); if (j < 0) throw new Error('marcatore: ' + b); return SRC.slice(i, j); };
// il blocco mixto di pagoConfirmar, dal `let mixtoPartes` fino al commento che lo segue (marcatori fuori dalle righe curate)
const BLOCCO = tra('  let mixtoPartes = null;\n  if (pg.medio === \'mixto\') {', '  /* v3.7.2 · AUT-0007');
function paga({ on = true, mixto, propina = 0, medio = 'mixto', propMedio, monto }) {
  const log = [];
  const pg = { medio, mixto, propMedio };
  const ctx = { Math, String, parseFloat, JSON, PROPINA_MIXTO_MEDIO_ON: on, STATE: { pago: pg }, pg, log,
    _pagoMonto: () => monto, _pagoPropina: () => propina, toast: (k, s) => log.push([k, s]), renderPago: () => log.push(['render']),
    _fmtMiles: (n) => Math.round(n).toLocaleString('es-CL'), out: null };
  vm.createContext(ctx);
  vm.runInContext((SRC.includes('function _mxKeys(') ? SRC.slice(SRC.indexOf('const MX_LBL = '), SRC.indexOf(String.fromCharCode(10), SRC.indexOf('const MX_LBL = ')) + 1) + fnV('_mxKeys') + fnV('_mxMedio') : '') + fnV('_mxMediosConMonto') + fnV('_mxPropMedio') + '(function () {\n' + BLOCCO + '\n out = { mixtoPartes: mixtoPartes }; })();', ctx);
  return { righe: ctx.out && ctx.out.mixtoPartes, log, fermato: !ctx.out };
}
const ISA = { efectivo: '14926', debito: '35814', credito: '', transferencia: '' };
{ const r = paga({ mixto: ISA, propina: 5074, propMedio: 'efectivo', monto: 50740 });
  t('A · Isa, mesa 20: la propina 5.074 sulla riga efectivo, 0 sul débito', JSON.stringify(r.righe) === JSON.stringify([{ medio: 'efectivo', monto: 14926, propina: 5074 }, { medio: 'debito', monto: 35814, propina: 0 }]), r);
  t('A · somma delle propine delle righe = la propina del pago', r.righe.reduce((s, x) => s + x.propina, 0) === 5074, r.righe); }
{ const r = paga({ mixto: ISA, propina: 5074, propMedio: 'debito', monto: 50740 });
  t('A2 · in carta se il mesero dice carta', r.righe[0].propina === 0 && r.righe[1].propina === 5074, r.righe); }
{ const r = paga({ mixto: ISA, propina: 5074, monto: 50740 });
  t('B · leva accesa, propina > 0 e nessuna scelta ⇒ il pago NON parte, e lo dice', r.fermato && r.log.some((x) => x[0] === 'warn' && /en qué medio/.test(x[1])), r); }
{ const r = paga({ on: false, mixto: ISA, propina: 5074, monto: 50740 });
  t('C · leva spenta ⇒ righe di ieri, senza la chiave propina (il bordo applica la regola)', JSON.stringify(r.righe) === JSON.stringify([{ medio: 'efectivo', monto: 14926 }, { medio: 'debito', monto: 35814 }]), r.righe); }
{ const r = paga({ mixto: ISA, propina: 0, monto: 50740 });
  t('D · propina 0 ⇒ niente chip obbligatorio, righe senza chiave', !r.fermato && !('propina' in r.righe[0]), r); }
{ const r = paga({ mixto: { efectivo: '', debito: '35814', credito: '14926', transferencia: '' }, propina: 5074, propMedio: 'efectivo', monto: 50740 });
  t('E · la scelta «efectivo» non è più fra i mezzi del mixto (cifra tolta) ⇒ conta come non scelta, il pago si ferma', r.fermato, r); }
{ const r = paga({ medio: 'debito', mixto: ISA, propina: 5074, monto: 50740 });
  t('F · un pago non mixto non è toccato', r.righe === null && !r.fermato, r); }
{ const r = paga({ mixto: ISA, propina: 5074, propMedio: 'efectivo', monto: 40000 });
  t('G · la somma che non quadra si ferma PRIMA, come ieri', r.fermato && r.log.some((x) => /no cuadra/.test(x[1])), r.log); }
// il chip
function chip({ on = true, mixto, prop, propMedio }) {
  const pg = { mixto, propMedio };
  const ctx = { Math, String, parseFloat, PROPINA_MIXTO_MEDIO_ON: on, STATE: { pago: pg }, _fmtMiles: (n) => Math.round(n).toLocaleString('es-CL'), renderPago: () => {} };
  vm.createContext(ctx); vm.runInContext((SRC.includes('function _mxKeys(') ? SRC.slice(SRC.indexOf('const MX_LBL = '), SRC.indexOf(String.fromCharCode(10), SRC.indexOf('const MX_LBL = ')) + 1) + fnV('_mxKeys') + fnV('_mxMedio') : '') + fnV('_mxMediosConMonto') + fnV('_mxPropMedio') + fnV('_mxPropHtml') + fnV('bPropMedio'), ctx);   // [22-ott · TERZA] le chiavi del mixto e le etichette
  return { html: vm.runInContext('_mxPropHtml(STATE.pago, ' + prop + ')', ctx), ctx, pg };
}
{ const { html } = chip({ mixto: ISA, prop: 5074 });
  t('H · leva accesa: domanda in ámbar «¿La propina de $5.074 en qué medio?» e SOLO i mezzi del mixto (Efectivo, Débito)', /¿La propina de <b>\$5\.074<\/b> en qué medio\?/.test(html) && /Efectivo/.test(html) && /Débito/.test(html) && !/Crédito/.test(html) && !/Transfer/.test(html), html); }
{ const { html, ctx, pg } = chip({ mixto: ISA, prop: 5074 });
  vm.runInContext("bPropMedio('efectivo')", ctx);
  const h2 = vm.runInContext('_mxPropHtml(STATE.pago, 5074)', ctx);
  t('H · toccare Efectivo lo sceglie: «entra en:» e il chip è sel', pg.propMedio === 'efectivo' && /entra en:/.test(h2) && /cs-chip sel" onclick="bPropMedio\('efectivo'\)/.test(h2), h2); }
t('I · leva spenta ⇒ nessun chip', chip({ on: false, mixto: ISA, prop: 5074 }).html === '');
t('I · propina 0 ⇒ nessun chip', chip({ mixto: ISA, prop: 0 }).html === '');
t('J · il chip è dentro il pannello del mixto (bMedio), dopo le quattro righe', /fila\('transferencia', 'Transfer'\) \+( _mxExtraHtml\(pg, fila\) \+)?\n\s+(\(_v2 \? '<div id="bmxProp">' \+ _mxPropHtml\(pg, prop\) \+ '<\/div>' : _mxPropHtml\(pg, prop\)\)|_mxPropHtml\(pg, prop\)) \+/.test(fnV('bMedio'))   /* [21-ott] anche col contenitore bmxProp della leva mixto v2 */);
t('J · la leva si legge dal /salud come le altre', /PROPINA_MIXTO_MEDIO_ON = String\(cercaK\(j, 'propina_mixto_medio_on'\)\) === '1';/.test(SRC) && /var PROPINA_MIXTO_MEDIO_ON = false;/.test(SRC));
console.log('\n' + (ko ? '🔴 ' + ko + ' rossi su ' + (ok + ko) : '🟢 ' + ok + ' controlli, tutti verdi'));
process.exitCode = ko ? 1 : 0;
