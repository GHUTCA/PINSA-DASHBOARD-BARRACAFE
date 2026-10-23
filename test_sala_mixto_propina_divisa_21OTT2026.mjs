// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · la propina del mixto divisa fra i mezzi (mesa 47, 21-ott)
// Richiesta: 🎛 `V32 MIXTO CON LA PROPINA IN DUE MEZZI MESA 47`. Gira gli helper VERI e la regione VERA dell'invio (`_propMx` → righe di medios_json) in vm.
// node test_sala_mixto_propina_divisa_21OTT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const NOMI = ['_fmtMiles'].concat(SRC.includes('function _mxKeys(') ? ['_mxKeys', '_mxMedio'] : []).concat(['_mxMediosConMonto', '_mxPropMedio', '_mxPropNum', '_mxPropDiv', '_mxPropDivCuadra', 'bPropDivIn', 'bPropDivBlur', '_mxPropHtml', 'bPropMedio']);
  const LBL = SRC.includes('const MX_LBL = ') ? SRC.slice(SRC.indexOf('const MX_LBL = '), SRC.indexOf('\n', SRC.indexOf('const MX_LBL = ')) + 1) : '';
  const F = LBL + NOMI.map((n) => fnVin(SRC, n)).join('');
  const i0 = SRC.indexOf('    const _propMx = PROPINA_MIXTO_MEDIO_ON'); const i1 = SRC.indexOf('  /* v3.7.2 · AUT-0007', i0);
  if (i0 < 0 || i1 < 0) throw new Error('regione invio');
  const INV = SRC.slice(i0, i1).replace(/\n  \}\s*$/, '\n');
  function mondo(mixto, prop) {
    const els = {}, L = { toast: [], render: 0 };
    const ctx = { JSON, Object, Math, String, parseFloat, PROPINA_MIXTO_MEDIO_ON: true, STATE: { pago: { medio: 'mixto', mixto: mixto } },
      _pagoPropina: () => prop, renderPago: () => { L.render++; }, toast: (a, b) => L.toast.push(b),
      $: (id) => els[id] || (els[id] = { value: '', innerHTML: '' }), els, L };
    vm.createContext(ctx); vm.runInContext(F, ctx); return ctx;
  }
  function invia(ctx, partes) {
    ctx.mixtoPartes = partes; ctx.pg = ctx.STATE.pago; ctx.uscito = false;
    vm.runInContext('(function () { let mixtoPartes = this.mixtoPartes; const pg = this.pg; ' + INV + ' this.mixtoPartes = mixtoPartes; this.uscito = true; }).call(this)', ctx);
    return ctx;
  }
  const P47 = [{ k: 'efectivo', medio: 'efectivo', monto: 16340 }, { k: 'debito', medio: 'debito', monto: 16340 }];   // [22-ott] le righe vere portano la chiave fino all invio
  // la mesa 47
  { const c = mondo({ efectivo: '16340', debito: '16340' }, 3268);
    const h = vm.runInContext('_mxPropHtml(STATE.pago, 3268)', c);
    t('A · con due mezzi c è il chip «Dividir»', /bPropMedio\('_div'\)/.test(h) && /Dividir/.test(h), h.slice(0, 200)); }
  { const c = mondo({ efectivo: '16340', debito: '16340' }, 3268); vm.runInContext('bPropMedio("_div")', c);
    t('B · «Dividir» parte con tutta la propina in efectivo', c.STATE.pago.propDiv.efectivo === '3268' && c.STATE.pago.propDiv.debito === '0', c.STATE.pago.propDiv);
    const h = vm.runInContext('_mxPropHtml(STATE.pago, 3268)', c);
    t('B2 · le caselle per mezzo e la riga della somma', /id="bmxp_efectivo"/.test(h) && /id="bmxp_debito"/.test(h) && /bmxPropCu/.test(h) && /✓ suma \$3\.268/.test(h), h.slice(-400)); }
  { const c = mondo({ efectivo: '16340', debito: '16340' }, 3268); vm.runInContext('bPropMedio("_div"); bPropDivIn("efectivo", "1634"); bPropDivBlur("efectivo")', c);
    t('C · due mezzi: scrivere 1.634 in efectivo mette 1.634 in débito', c.STATE.pago.propDiv.debito === '1634' && c.els.bmxp_debito.value === '1.634', c.STATE.pago.propDiv);
    invia(c, P47.map((x) => Object.assign({}, x)));
    t('D · MESA 47: le righe di medios_json portano 1.634 + 1.634', c.uscito && c.mixtoPartes[0].propina === 1634 && c.mixtoPartes[1].propina === 1634, c.mixtoPartes); }
  { const c = mondo({ efectivo: '16340', debito: '16340' }, 3268); vm.runInContext('bPropMedio("_div"); bPropDivIn("efectivo", "1000"); bPropDivIn("debito", "1000")', c);
    invia(c, P47.map((x) => Object.assign({}, x)));
    t('E · la somma non torna (2.000 su 3.268) ⇒ il pago NON parte, e lo dice', !c.uscito && /3\.268/.test(c.L.toast[0] || ''), c.L); }
  { const c = mondo({ efectivo: '10000', debito: '10000', credito: '12680' }, 3000); vm.runInContext('bPropMedio("_div"); bPropDivIn("efectivo", "1000"); bPropDivBlur("efectivo")', c);
    t('F · tre mezzi: niente riempimento automatico (non si indovina dove va il resto)', c.STATE.pago.propDiv.debito === '0' && c.STATE.pago.propDiv.credito === '0', c.STATE.pago.propDiv); }
  { const c = mondo({ debito: '16340', credito: '16340' }, 3268); vm.runInContext('bPropMedio("_div")', c);
    t('G · senza efectivo si parte dal primo mezzo', c.STATE.pago.propDiv.debito === '3268', c.STATE.pago.propDiv); }
  { const c = mondo({ efectivo: '16340', debito: '16340' }, 3268); c.STATE.pago.propMedio = 'debito';
    invia(c, P47.map((x) => Object.assign({}, x)));
    t('H · un mezzo solo come ieri: tutta in débito, 0 in efectivo', c.mixtoPartes[0].propina === 0 && c.mixtoPartes[1].propina === 3268, c.mixtoPartes); }
  { const c = mondo({ efectivo: '32680' }, 3268); const h = vm.runInContext('_mxPropHtml(STATE.pago, 3268)', c);
    t('I · un mezzo solo con monto ⇒ niente «Dividir»', !/Dividir/.test(h), h); }
  { const c = mondo({ efectivo: '16340', debito: '16340' }, 3268); vm.runInContext('bPropMedio("_div")', c); c.STATE.pago.mixto.debito = '';
    t('J · se un mezzo sparisce dal mixto, «Dividir» decade (si torna a scegliere)', vm.runInContext('_mxPropMedio(STATE.pago)', c) === '', null); }
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['senza chip Dividir', "(ms.length >= 2 ? '<div class=\"cs-chip' + (sel === '_div' ? ' sel' : '') + '\" onclick=\"bPropMedio(\\'_div\\')\">➗ Dividir</div>' : '')", "''"],
    ['la somma non si controlla', "if (suD !== _propMx) {", 'if (false) {'],
    ['divisa ignorata all invio (tutta su un mezzo)', "propina: dv[x.k] || 0 }", "propina: x.medio === 'efectivo' ? _propMx : 0 }"],
    ['default non in efectivo', "ms.indexOf('efectivo') >= 0 ? 'efectivo' : ms[0]", 'ms[ms.length - 1]'],
    ['niente resto automatico', "if (ms.length === 2 && String(pg.propDiv[k] == null ? '' : pg.propDiv[k]).trim() !== '') {", 'if (false) {'],
    ['resto anche con tre mezzi', 'if (ms.length === 2 && String', 'if (ms.length >= 2 && String'],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
