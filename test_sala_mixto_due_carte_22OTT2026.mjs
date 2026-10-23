// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · il mixto della mesa 47: due carte dello stesso tipo, e il «sobran» che dice dove (22-oct)
// Richiesta: 🎛 `V32 MESA 47 I DUE PESOS ERANO NELLA MACCHINA`. Gira gli helper VERI e la regione VERA dell'invio (righe di medios_json) in vm.
// node test_sala_mixto_due_carte_22OTT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const LBL = SRC.slice(SRC.indexOf('const MX_LBL = '), SRC.indexOf('\n', SRC.indexOf('const MX_LBL = ')) + 1);
  const NOMI = ['_fmtMiles', '_mxKeys', '_mxMedio', 'mxOtra', '_mxExtraHtml', '_mxCuadraTxt', '_mxMediosConMonto', '_mxPropMedio', '_mxPropNum', '_mxPropDiv', '_mxPropHtml', 'bPropMedio'];
  const F = LBL + NOMI.map((n) => fnVin(SRC, n)).join('');
  // l'invio: dalla costruzione di mixtoPartes fino alla fine del ramo mixto
  const i0 = SRC.indexOf('    mixtoPartes = _mxKeys(pg).map(function (k2) {'); const i1 = SRC.indexOf('  /* v3.7.2 · AUT-0007', i0);
  if (i0 < 0 || i1 < 0) throw new Error('regione invio');
  const INV = SRC.slice(i0, i1).replace(/\n  \}\s*$/, '\n');
  function mondo(mixto, prop, monto) {
    const L = { toast: [], render: 0 };
    const ctx = { JSON, Object, Math, String, parseFloat, PROPINA_MIXTO_MEDIO_ON: true, STATE: { pago: { medio: 'mixto', mixto: mixto } },
      _pagoPropina: () => prop, _pagoMonto: () => monto, renderPago: () => { L.render++; }, toast: (a, b) => L.toast.push(b), L };
    vm.createContext(ctx); vm.runInContext(F, ctx); return ctx;
  }
  function invia(ctx) {
    ctx.pg = ctx.STATE.pago; ctx.uscito = false;
    vm.runInContext('(function () { let mixtoPartes = null; const pg = this.pg; const mx = pg.mixto || {};\n' + INV + '\n this.mixtoPartes = mixtoPartes; this.uscito = true; }).call(this)', ctx);
    return ctx;
  }
  const M47 = () => ({ efectivo: '', debito: '', credito: '19790', transferencia: '' });   // consumo 88.480: 19.790 + Falabella 54.952 = 74.742
  { const c = mondo(M47(), 0, 74742); const h = vm.runInContext('_mxExtraHtml(STATE.pago, function (k, l) { return "[" + k + ":" + l + "]"; })', c);
    t('A · senza seconda carta: due chip «＋ otra de crédito / débito», nessuna riga in più', /mxOtra\('credito2'\)">＋ otra de crédito/.test(h) && /mxOtra\('debito2'\)">＋ otra de débito/.test(h) && !/\[credito2/.test(h), h); }
  { const c = mondo(M47(), 0, 74742); vm.runInContext('mxOtra("credito2")', c);
    const h = vm.runInContext('_mxExtraHtml(STATE.pago, function (k, l) { return "[" + k + ":" + l + "]"; })', c);
    t('B · «＋ otra de crédito» ⇒ la riga «Crédito 2», e il suo chip sparisce', /\[credito2:Crédito 2\]/.test(h) && !/mxOtra\('credito2'\)/.test(h) && /mxOtra\('debito2'\)/.test(h) && c.L.render === 1, h); }
  { const c = mondo(Object.assign(M47(), { credito2: '54952' }), 0, 74742); invia(c);
    t('C · MESA 47: due righe «credito» al bordo (19.790 + 54.952), nessuna chiave interna esce', c.uscito && c.mixtoPartes.length === 2 && c.mixtoPartes.every((x) => x.medio === 'credito' && !('k' in x)) && c.mixtoPartes[1].monto === 54952, c.mixtoPartes); }
  { const c = mondo(Object.assign(M47(), { credito2: '54952' }), 2000, 74742); c.STATE.pago.propMedio = 'credito2'; invia(c);
    t('D · la propina tutta sulla SECONDA carta ⇒ resta sulla seconda riga, non sulla prima', c.mixtoPartes[0].propina === 0 && c.mixtoPartes[1].propina === 2000, c.mixtoPartes); }
  { const c = mondo(Object.assign(M47(), { credito2: '54952' }), 2000, 74742); c.STATE.pago.propMedio = '_div'; c.STATE.pago.propDiv = { credito: '500', credito2: '1500' }; invia(c);
    t('E · «Dividir» fra i due crediti: 500 e 1.500 restano distinti', c.mixtoPartes[0].propina === 500 && c.mixtoPartes[1].propina === 1500, c.mixtoPartes); }
  { const c = mondo(Object.assign(M47(), { credito2: '54954' }), 0, 74742); invia(c);
    t('F · sobran 2 pesos ⇒ il pago non parte (la somma deve essere esatta)', !c.uscito && /no cuadra/.test(c.L.toast[0] || ''), c.L.toast); }
  { const c = mondo(M47(), 0, 74742); const tx = vm.runInContext('_mxCuadraTxt(74744, -2, 74742)', c);
    t('G · il messaggio della mesa 47: «sobran $2 en los montos · deben sumar $74.742» e «no en la propina»', /sobran <b>\$2<\/b> en los montos/.test(tx) && /deben sumar <b>\$74\.742<\/b>/.test(tx) && /no en la propina/.test(tx), tx); }
  { const c = mondo(M47(), 0, 74742); t('G2 · cuadra ⇒ «✓ cuadra»', vm.runInContext('_mxCuadraTxt(74742, 0, 74742)', c) === '✓ cuadra: $74.742'); }
  { const c = mondo(M47(), 0, 74742); invia(c);
    t('H · senza seconda carta tutto come ieri: una riga sola ⇒ «al menos 2 medios»', !c.uscito && /al menos 2 medios/.test(c.L.toast[0] || ''), c.L.toast); }
  t('I · i tre disegni del mixto usano lo stesso messaggio', (SRC.match(/_mxCuadraTxt\(/g) || []).length >= 4 && !/— baja alguna cifra';/.test(SRC) && !/la suma debe ser exacta'\)/.test(SRC));
  t('J · le righe della seconda carta nei due disegni', (SRC.match(/fila\('transferencia', 'Transfer'\) \+ _mxExtraHtml\(pg, fila\)/g) || []).length === 2);
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['la seconda carta va al bordo col nome interno', "medio: _mxMedio(k2), monto:", 'medio: k2, monto:'],
    ['la propina legata al mezzo e non alla chiave', "propina: x.k === pm ? _propMx : 0 }", "propina: x.medio === _mxMedio(pm) ? _propMx : 0 }"],
    ['la chiave interna esce dal telefono', "    mixtoPartes = mixtoPartes.map(function (x) { const o = { medio: x.medio, monto: x.monto }; if ('propina' in x) o.propina = x.propina; return o; });", ''],
    ['il messaggio non dice della propina', "la diferencia está en los montos de los medios, <b>no en la propina</b>", 'baja alguna cifra'],
    ['niente righe della seconda carta', "  let h = ['debito2', 'credito2'].filter(function (k) { return k in mx; }).map(function (k) { return fila(k, MX_LBL[k]); }).join('');", "  let h = '';"],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
