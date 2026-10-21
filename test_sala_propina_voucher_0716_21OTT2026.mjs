// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · AUT-0716 ② · la propina della carta nasce dal TOTALE DEL VOUCHER (21-ott)
// Reperto (Alberto, 20-ott): il cliente lascia meno della propina sugerida, il garzón conferma il 10% ⇒ il fondo paga una propina mai incassata.
// Gira il codice VERO di sala.html in vm: _vouTotNum, _vouEstado, _vouTxt, _pgVouBtnPinta, pagoVouIn, pagoVouTotIn, _pagoPropina, la cintura di pagoConfirmar.
// node test_sala_propina_voucher_0716_21OTT2026.mjs [sala.html]      ·  --mutanti  prova che il banco morde
import fs from 'node:fs'; import vm from 'node:vm'; import { execSync } from 'node:child_process';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); return SRC.slice(i, SRC.indexOf('\n}\n', i) + 3); };
const traIn = (SRC, a, b) => { const i = SRC.indexOf(a); if (i < 0) throw new Error('marcatore: ' + a); const j = SRC.indexOf(b, i); if (j < 0) throw new Error('marcatore: ' + b); return SRC.slice(i, j); };
// la _pagoPropina di IERI (07f3f55), per provare che a leva spenta il numero è lo stesso
let VECCHIA = null;
try { VECCHIA = execSync('git show 07f3f55:sala.html', { cwd: new URL('.', import.meta.url), maxBuffer: 64 << 20 }).toString('utf8').replace(/\r\n/g, '\n'); } catch (e) { VECCHIA = null; }

function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const fnV = (n) => fnVin(SRC, n);
  const FUN = ['_vouTotNum', '_vouEstado', '_vouTxt', '_pgVouBtnPinta', 'pagoVouIn', 'pagoVouTotIn', '_pagoPropina'].map(fnV).join('');
  function mondo({ on = true, v3 = true, medio = 'debito', consumo = 61090, prop = 'sug', otro = '', vouTot = '', voucher = '', sinVoucher = false } = {}) {
    const dom = {};
    const el = (id) => dom[id] || (dom[id] = { id, textContent: '', innerHTML: '', disabled: false, style: {} });
    const pg = { mesa: '20', medio, prop, otro, vouTot, voucher, sinVoucher };
    const ctx = { Math, String, parseFloat, PROPINA_VOUCHER_ON: on, PAGO_V3_ON: v3, STATE: { pago: pg }, $: el, dom,
      _bMonto: () => consumo, _fmtMiles: (n) => Math.round(n).toLocaleString('es-CL') };
    vm.createContext(ctx); vm.runInContext(FUN, ctx);
    return { ctx, pg, el, run: (s) => vm.runInContext(s, ctx) };
  }
  // A · il caso di Alberto: il voucher dice il totale vero
  { const m = mondo({ vouTot: '67199' });
    t('A · voucher 67.199 su consumo 61.090 ⇒ propina 6.109 (dedotta, non confermata)', m.run('_pagoPropina()') === 6109, m.run('_vouEstado(STATE.pago)')); }
  { const m = mondo({ vouTot: '64000', prop: 'sug' });
    t('A2 · il cliente lascia meno: chip 10% (6.109) ma voucher 64.000 ⇒ si registra 2.910', m.run('_pagoPropina()') === 2910, m.run('_pagoPropina()')); }
  { const m = mondo({ vouTot: '61090' });
    t('A3 · voucher = consumo ⇒ propina 0, ok', m.run('_pagoPropina()') === 0 && m.run('_vouEstado(STATE.pago).ok') === true); }
  { const m = mondo({ vouTot: '$67.199' });
    t('A4 · il totale scritto con punto e segno vale uguale', m.run('_pagoPropina()') === 6109); }
  // B-D · totale mancante o sbagliato ⇒ non ok (CERRAR spento, cintura in pagoConfirmar)
  { const m = mondo({ vouTot: '' }); const e = m.run('_vouEstado(STATE.pago)');
    t('B · totale vuoto ⇒ aplica, non ok, motivo vacio', e.aplica && !e.ok && e.motivo === 'vacio', e); }
  { const m = mondo({ vouTot: '60000' }); const e = m.run('_vouEstado(STATE.pago)');
    t('C · totale sotto il consumo ⇒ non ok, motivo menor, e lo dice in rosso', e.aplica && !e.ok && e.motivo === 'menor' && /menor que el consumo/.test(m.run('_vouTxt(_vouEstado(STATE.pago))')), e); }
  { const m = mondo({ vouTot: '671990' }); const e = m.run('_vouEstado(STATE.pago)');
    t('D · un cero di troppo (671.990) ⇒ non ok, motivo excesivo', e.aplica && !e.ok && e.motivo === 'excesivo', e); }
  { const m = mondo({ vouTot: '79000' });
    t('D2 · propina sopra il 25% ⇒ ok ma ámbar «revisa»', /#f5a623/.test(m.run('_vouTxt(_vouEstado(STATE.pago))')) && /revisa/.test(m.run('_vouTxt(_vouEstado(STATE.pago))'))); }
  // E-H · dove NON si applica: tutto come ieri
  for (const [n, o] of [['E · leva spenta', { on: false }], ['F · mixto', { medio: 'mixto' }], ['F2 · efectivo', { medio: 'efectivo' }],
    ['G · «No hay voucher»', { sinVoucher: true }], ['H · ?pagov3=0 (nessuna ③)', { v3: false }]]) {
    const m = mondo({ ...o, vouTot: '64000' });
    t(n + ' ⇒ aplica:false e la propina è quella del chip (6.109)', m.run('_vouEstado(STATE.pago).aplica') === false && m.run('_pagoPropina()') === 6109, m.run('_pagoPropina()'));
  }
  // I · il bottone della ③
  { const m = mondo({ on: false }); m.run("pagoVouIn({ value: '123456' })"); const b = m.el('pgVouBtn');
    t('I · leva spenta, 6 cifre ⇒ CERRAR MESA 20 acceso (come ieri)', !b.disabled && b.textContent === 'CERRAR MESA 20', b); }
  { const m = mondo({ on: false }); m.run("pagoVouIn({ value: '1234' })"); const b = m.el('pgVouBtn');
    t('I · leva spenta, 4 cifre ⇒ «Faltan 2 cifras» spento (come ieri)', b.disabled && b.textContent === 'Faltan 2 cifras', b); }
  { const m = mondo(); m.run("pagoVouIn({ value: '123456' })"); const b = m.el('pgVouBtn');
    t('I2 · leva accesa, 6 cifre senza totale ⇒ spento, «Escribe el total del voucher»', b.disabled && b.textContent === 'Escribe el total del voucher', b); }
  { const m = mondo(); m.run("pagoVouIn({ value: '123456' })"); m.run("pagoVouTotIn({ value: '67199' })"); const b = m.el('pgVouBtn');
    t('I3 · … scritto 67.199 ⇒ acceso, e la riga dice propina $6.109 (10%)', !b.disabled && b.textContent === 'CERRAR MESA 20' && /6\.109/.test(m.el('pgVouTotTxt').innerHTML) && /10%/.test(m.el('pgVouTotTxt').innerHTML), [b, m.el('pgVouTotTxt').innerHTML]); }
  { const m = mondo(); m.run("pagoVouTotIn({ value: '67199' })"); const b = m.el('pgVouBtn');
    t('I4 · totale giusto ma cifre mancanti ⇒ resta spento', b.disabled && /Faltan/.test(b.textContent), b); }
  // J · la cintura di pagoConfirmar
  const CINT = traIn(SRC, '  const _vePago = _vouEstado(pg);', '  // [AUT-0416]');
  function cintura(o) {
    const m = mondo(o); const log = [];
    m.ctx.pg = m.pg; m.ctx.toast = (k, s) => log.push([k, s]); m.ctx.renderPago = () => log.push(['render']); m.ctx.out = null;
    m.run('(function () {\n' + CINT + '\n out = true; })();');
    return { passa: m.ctx.out === true, log };
  }
  { const r = cintura({ vouTot: '' }); t('J · leva accesa, carta, totale vuoto ⇒ pagoConfirmar si ferma e lo dice', !r.passa && r.log.some((x) => /total del voucher/.test(x[1])), r); }
  t('J2 · totale valido ⇒ passa', cintura({ vouTot: '67199' }).passa);
  t('J3 · leva spenta ⇒ passa senza totale', cintura({ on: false }).passa);
  t('J4 · «No hay voucher» ⇒ passa senza totale', cintura({ sinVoucher: true }).passa);
  // K · le righe di innesto
  t('K · body.voucher_total solo con totale valido', /if \(_vePago\.aplica && _vePago\.ok\) body\.voucher_total = _vePago\.tot;/.test(SRC));
  t('K · la leva si legge dal /salud e nasce spenta', /PROPINA_VOUCHER_ON = String\(cercaK\(j, 'propina_voucher_on'\)\) === '1';/.test(SRC) && /var PROPINA_VOUCHER_ON = false;/.test(SRC));
  t('K · tornando indietro dalla ③ il totale si azzera', /function pagoVolverA2\(\) \{ if \(STATE\.pago\) \{ STATE\.pago\.paso3 = false; STATE\.pago\.vouTot = ''; renderPago\(\); \} \}/.test(SRC));
  t('K · la ③ disegna il campo solo se aplica', /\(_ve\.aplica\s*\n\s*\? '<div class="cs-psec" style="text-align:center;margin-top:14px">💳 Total del voucher<\/div>'/.test(SRC));
  // L · a leva spenta _pagoPropina è numericamente quella di ieri
  if (VECCHIA) {
    const FV = fnVin(VECCHIA, '_pagoPropina'); let uguali = true; const diff = [];
    for (const prop of ['sug', 'otro', 'sin', '']) for (const otro of ['', '5000', '$7.500', 'abc']) for (const consumo of [0, 12345, 61090]) {
      const m = mondo({ on: false, prop, otro, consumo, vouTot: '99999' });
      const cv = { Math, String, parseFloat, STATE: { pago: { prop, otro } }, _bMonto: () => consumo }; vm.createContext(cv); vm.runInContext(FV, cv);
      const a = m.run('_pagoPropina()'), b = vm.runInContext('_pagoPropina()', cv); if (a !== b) { uguali = false; diff.push({ prop, otro, consumo, a, b }); }
    }
    t('L · leva spenta: _pagoPropina = quella di 07f3f55 su 48 combinazioni', uguali, diff);
  } else t('L · (git show 07f3f55 non disponibile: confronto saltato)', true);
  return { ok, ko };
}

if (process.argv.includes('--mutanti')) {
  const M = [
    ['niente controllo menor', 'if (prop < 0) return { aplica: true, ok: false, motivo: \'menor\'', 'if (false) return { aplica: true, ok: false, motivo: \'menor\''],
    ['niente controllo excesivo', 'if (prop > consumo) return', 'if (false) return'],
    ['_pagoPropina ignora il voucher', 'if (_ve.aplica && _ve.ok) return _ve.prop;', ''],
    ['si applica anche al mixto', "!(pg.medio === 'debito' || pg.medio === 'credito')", "!(pg.medio === 'debito' || pg.medio === 'credito' || pg.medio === 'mixto')"],
    ['sin voucher non esce', 'pg.sinVoucher || !(pg.medio', '!(pg.medio'],
    ['bottone non guarda il totale', 'b.disabled = !(ok6 && okT);', 'b.disabled = !ok6;'],
    ['cintura disattivata', "if (_vePago.aplica && !_vePago.ok) { toast(", "if (false) { toast("],
    ['base sbagliata (10% fisso)', 'const consumo = _bMonto(), tot', 'const consumo = Math.round(_bMonto() * 1.1), tot'],
  ];
  let morti = 0;
  for (const [n, a, b] of M) {
    if (!ORIG.includes(a)) { console.log('⚠ mutante non applicabile: ' + n); continue; }
    let r; try { r = banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; }
    console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) morti++;
  }
  console.log('\nmutanti ' + morti + '/' + M.length); process.exitCode = morti === M.length ? 0 : 1;
} else {
  const r = banco(ORIG, false);
  console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi'));
  process.exitCode = r.ko ? 1 : 0;
}
