// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · la propina sugerida del convenio Falabella sul pieno (24-oct)
// Ordine: 🎛 `V32 PROPINA FALABELLA SUL PIENO SABATO NEL COBRO DI OGGI` (decisione di Alberto 23-ott). Gira `_propBaseConv` e `_pagoPropina` VERI in vm.
// node test_sala_propina_convenio_pleno_24OCT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const QC = fs.readFileSync(new URL('./que_cambio.html', import.meta.url), 'utf8');
const GU = fs.readFileSync(new URL('./guia_turno.html', import.meta.url), 'utf8');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
const fnRiga = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n', i) + 1); };
function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = fnRiga(SRC, '_propConvOn') + fnVin(SRC, '_propBaseConv') + fnVin(SRC, '_pagoPropina') + fnVin(SRC, '_pagoMonto') + fnVin(SRC, '_bMonto');
  // il mondo: consumo $21.600, Falabella 20% ⇒ monto $17.280 (come lo lascia `_dtGo`)
  function prop({ leva = true, tel = null, conv = 'falabella', monto = '17280', voucher = null } = {}) {
    const ctx = { String, Number, Math, parseInt, parseFloat, PROP_CONV_SRV: leva, PROP_CONV_TEL: tel,
      STATE: { pago: { tot: 21600, montoOn: true, montoCustom: monto, prop: 'sug', medio: 'credito', dto: { et: 'Banco Falabella 20%', tot: 21600, monto: 17280, conv } } },
      _vouEstado: () => (voucher ? { aplica: true, ok: true, prop: voucher - 17280 } : { aplica: false }), c4Parte: () => 0 };
    vm.createContext(ctx); vm.runInContext(F, ctx);
    return { p: vm.runInContext('_pagoPropina()', ctx), base: (d) => vm.runInContext('_propBaseConv(' + d + ')', ctx) };
  }
  t('A · leva spenta: il 10% dello scontato, come ieri (AUT-0248 ④)', prop({ leva: false }).p === 1728);
  t('B · leva accesa, Falabella: il 10% del pieno ($21.600 ⇒ $2.160), lo stesso numero della precuenta', prop().p === 2160);
  t('C · leva accesa, un descuento che non è convenio: resta sullo scontato', prop({ conv: '' }).p === 1728);
  t('D · leva accesa, il JL cambia il monto a mano: la regola di prima', prop({ monto: '15000' }).p === 1500);
  t('D2 · il monto scritto coi punti è lo stesso monto', prop({ monto: '17.280' }).p === 2160);
  t('E · con la carta e il voucher scritto la propina resta voucher − consumo (il chip è solo suggerimento)', prop({ voucher: 19500 }).p === 2220);
  t('F · ?propconv=1 accende sopra la leva spenta, ?propconv=0 spegne sopra la leva accesa', prop({ leva: false, tel: true }).p === 2160 && prop({ leva: true, tel: false }).p === 1728);
  t('G · i chip con base pg.tot: col convenio a leva il pieno, altrimenti pg.tot', prop().base(21600) === 21600 && prop({ conv: '' }).base(21600) === 21600 && prop({ leva: false }).base(999) === 999);
  t('H · i quattro punti passano da _propBaseConv, nessun 10% vecchio resta', (SRC.match(/_propBaseConv\(/g) || []).length === 5 && !/Math\.round\(_bMonto\(\) \* 0\.10\)/.test(SRC) && !/Math\.round\(pg\.tot \* 0\.10\)/.test(SRC));
  t('I · _dtGo porta il convenio nel pago', /conv: d\.tipo === 'conv' \? \(d\.conv \|\| ''\) : ''/.test(SRC));
  t('J · la leva si legge da /salud', /PROP_CONV_SRV = String\(cercaK\(j, 'propina_convenio_pleno_on'\)\) === '1';/.test(SRC));
  t('K · «Qué cambió» e la guida dicono la regola', /La propina con Banco Falabella/.test(QC) && /<b>propina sugerida<\/b> se calcula sobre la cuenta <b>antes del descuento<\/b>/.test(GU));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['la leva ignorata', 'function _propConvOn() { return PROP_CONV_TEL !== null ? PROP_CONV_TEL : PROP_CONV_SRV; }', 'function _propConvOn() { return true; }'],
    ['vale per ogni sconto, non solo il convenio', '!pg.dto || !pg.dto.conv || !pg.montoOn', '!pg.dto || !pg.montoOn'],
    ['il monto cambiato a mano non riporta la regola di prima', "  if (Number(String(pg.montoCustom || '').replace(/[^0-9]/g, '')) !== Math.round(Number(pg.dto.monto) || 0)) return def;", ''],
    ['_pagoPropina non usa il pieno', 'Math.round(_propBaseConv(_bMonto()) * 0.10);   // [24-ott] il convenio', 'Math.round(_bMonto() * 0.10);   // [24-ott] il convenio'],
    ['il voucher scavalcato dal suggerimento', '  if (_ve.aplica && _ve.ok) return _ve.prop;\n  if (pg.prop', '  if (pg.prop'],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
