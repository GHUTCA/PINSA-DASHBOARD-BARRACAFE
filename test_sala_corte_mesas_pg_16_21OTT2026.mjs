// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · pezzo 1.6 (corte senza getCierreMesero) + 1.7 soltar2x1 al bordo (21-ott)
// Gira `_cieMesasDalBorde`, `cierreAbrir` e `soltarRegalo__in` VERI di sala.html in vm, bordo e GAS finti.
// node test_sala_corte_mesas_pg_16_21OTT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = 'async ' + fnVin(SRC, '_cieMesasDalBorde') + 'async ' + fnVin(SRC, 'cierreAbrir') + 'async ' + fnVin(SRC, 'soltarRegalo__in') + '\nfunction _cieOkRecente() { return null; }\n';   // [23-ott] nessun corte recente: il flusso di sempre
  function mondo({ on = true, estado, locale = null, gas = { ok: true, mesas_abiertas: [], tolerancia: 3000 }, estadoOn = false, soltarOn = true, staff }) {
    const L = { gas: [], borde: [], fatti: [], render: [], paso1: 0, toasts: [] };
    const ctx = { CORTE_MESAS_PG_ON: on, CORTE_LOCAL_ON: true, SOLTAR2X1_BORDE_ON: soltarOn, STATE: { codigo: 'C1', nombre: 'Ray' }, CIE: {}, _CIE_INTENTO: 0, _CIE_FIRMADO: false,
      Math, String, parseFloat, Array, Object,
      muroT0: () => {}, salir: () => {}, bordeHecho: (g, d) => L.fatti.push([g, d]), _cieRender: (h) => L.render.push(h), esc: (s) => String(s),
      _cieLeerFresco: async () => locale, _cieDatosLocali: () => locale, _ciePaso1: () => { L.paso1++; }, corteEstadoOn: () => estadoOn,
      _cajaMesero: async (x) => { L.borde.push(x); return typeof estado === 'function' ? estado() : estado; },
      gasPost: async (a, b) => { L.gas.push(a); return gas; },
      staffPost: async (a, b) => { L.borde.push({ staff: a, b }); return staff || { ok: true, borde: true, sueltos: 1 }; },
      toast: (k, s) => L.toasts.push(s), refrescar: () => {} };
    vm.createContext(ctx); vm.runInContext(F, ctx);
    return { ctx, L };
  }
  const PGOK = { ok: true, mesero: 'Ray', corte_fuente: 'borde', ya_cerrado: null, turno: 'noche', regimen: 'pool', tolerancia: 2500,
    mesas_abiertas: [{ mesa: 48, consumo: '35000', pedidos: 2, desde_ts: 1 }, { mesa: '91', consumo: 12990 }], mesas_abiertas_fuente: 'pg' };
  // _cieMesasDalBorde
  { const { ctx } = mondo({ estado: PGOK }); const r = await vm.runInContext('_cieMesasDalBorde()', ctx);
    t('A · fuente pg ⇒ sabe, mesas normalizate (mesa stringa, consumo numero)', r.sabe && JSON.stringify(r.mesas) === JSON.stringify([{ mesa: '48', consumo: 35000 }, { mesa: '91', consumo: 12990 }]), r); }
  for (const [n, e] of [['fuente null (PG giù)', { ok: true, mesas_abiertas: [], mesas_abiertas_fuente: null }], ['chiave assente (leva del bordo spenta)', { ok: true, corte_fuente: 'borde' }], ['rete morta', null], ['errore', { ok: false, error: 'codigo_invalid' }]]) {
    const { ctx } = mondo({ estado: e }); const r = await vm.runInContext('_cieMesasDalBorde()', ctx);
    t('A2 · ' + n + ' ⇒ sabe:false, MAI «zero mesas»', r.sabe === false && !r.mesas, r);
  }
  // cierreAbrir senza sala fresca
  { const { ctx, L } = mondo({ estado: PGOK }); await vm.runInContext('cierreAbrir()', ctx); const d = ctx.CIE.data;
    t('B · leva accesa, senza sala fresca: corte dalle mesas di PG, ZERO Google', L.gas.length === 0 && L.paso1 === 1 && d && d.n_abiertas === 2 && d.monto_abierto === 47990 && d.mesas_abiertas[0].pasa_a === '' && d.hay_heredero === false, { gas: L.gas, d }); }
  { const { ctx } = mondo({ estado: PGOK }); await vm.runInContext('cierreAbrir()', ctx);
    t('B2 · turno, régimen, ya_cerrado e tolerancia dal bordo', ctx.CIE.data.turno === 'noche' && ctx.CIE.data.regimen === 'pool' && ctx.CIE.data.ya_cerrado === null && ctx.CIE.tol === 2500, ctx.CIE); }
  { const { ctx, L } = mondo({ estado: { ok: true, mesas_abiertas_fuente: null, mesas_abiertas: [] } }); await vm.runInContext('cierreAbrir()', ctx);
    t('C · non so (fuente null) ⇒ «No pude leer tus mesas» con Reintentar e Salir sin cerrar, niente Google, niente corte', L.gas.length === 0 && L.paso1 === 0 && /No pude leer tus mesas \(sin_mesas_pg\)/.test(L.render.at(-1)) && /Salir sin cerrar/.test(L.render.at(-1)), L); }
  { const { ctx, L } = mondo({ on: false, estado: PGOK }); await vm.runInContext('cierreAbrir()', ctx);
    t('D · leva spenta ⇒ getCierreMesero come ieri, nessuna lettura di estado_mesero', L.gas[0] === 'getCierreMesero' && L.borde.length === 0 && ctx.CIE.tol === 3000, L); }
  // cierreAbrir con sala fresca: il completamento
  const LOC = { ok: true, _local: true, mesero: 'Ray', mesas_abiertas: [], n_abiertas: 0 };
  { const { ctx, L } = mondo({ locale: LOC, estado: { ok: true, corte_fuente: 'gas' } }); await vm.runInContext('cierreAbrir()', ctx); await new Promise((r) => setTimeout(r, 5));
    t('E · sala fresca, bordo senza completamento ⇒ niente libro (leva accesa)', L.gas.length === 0 && L.fatti.some((f) => f[0] === 'corte_estado' && f[1].fuente === 'nessuna'), L); }
  { const { ctx, L } = mondo({ on: false, locale: LOC, estado: { ok: true } }); await vm.runInContext('cierreAbrir()', ctx); await new Promise((r) => setTimeout(r, 5));
    t('E2 · leva spenta e cortest spento ⇒ completa dal libro, come ieri', L.gas[0] === 'getCierreMesero' && L.borde.length === 0, L); }
  // fin turno (il primo punto)
  t('F · fin turno: a leva accesa le mesas da _cieMesasDalBorde, il libro solo nel ramo else', /if \(!ab && CORTE_MESAS_PG_ON\) \{[\s\S]{0,200}_cieMesasDalBorde\(\)[\s\S]{0,200}\} else if \(!ab\) \{\n\s+try \{\n\s+const rl = await gasPost\('getCierreMesero'/.test(SRC));
  // soltar2x1
  { const { ctx, L } = mondo({}); await vm.runInContext("soltarRegalo__in('u9', null)", ctx);
    t('G · soltar2x1 a leva accesa ⇒ staffPost(soltar2x1, {codigo,nombre,uuid}), zero Google', L.gas.length === 0 && L.borde[0].staff === 'soltar2x1' && L.borde[0].b.uuid === 'u9' && L.borde[0].b.codigo === 'C1' && /Regalo soltado/.test(L.toasts[0]), L); }
  { const { ctx, L } = mondo({ soltarOn: false }); await vm.runInContext("soltarRegalo__in('u9', null)", ctx);
    t('G2 · leva spenta ⇒ gasPost come ieri', L.gas[0] === 'soltar2x1' && L.borde.length === 0, L); }
  t('H · le due leve dal /salud, nascono spente', /CORTE_MESAS_PG_ON = String\(cercaK\(j, 'corte_mesas_pg_on'\)\) === '1';/.test(SRC) && /var CORTE_MESAS_PG_ON = false;/.test(SRC) && /SOLTAR2X1_BORDE_ON = String\(cercaK\(j, 'soltar2x1_borde_on'\)\) === '1';/.test(SRC) && /var SOLTAR2X1_BORDE_ON = false;/.test(SRC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['fuente null letto come zero mesas', "if (r.mesas_abiertas_fuente !== 'pg' || !Array.isArray(r.mesas_abiertas))", 'if (!Array.isArray(r.mesas_abiertas))'],
    ['senza sala fresca torna al libro', '  if (CORTE_MESAS_PG_ON) {\n    const mb = await _cieMesasDalBorde();\n    if (mb.sabe) {', '  if (false) {\n    const mb = await _cieMesasDalBorde();\n    if (mb.sabe) {'],
    ['completamento al libro a leva accesa', "else if (CORTE_MESAS_PG_ON) bordeHecho('corte_estado', { fuente: 'nessuna'", "else if (false) bordeHecho('corte_estado', { fuente: 'nessuna'"],
    ['heredero inventato', "return { mesa: m.mesa, consumo: m.consumo, pasa_a: '' }; }),\n        n_abiertas: mb.mesas.length, monto_abierto: monto, hay_heredero: false };", "return { mesa: m.mesa, consumo: m.consumo, pasa_a: 'JL' }; }),\n        n_abiertas: mb.mesas.length, monto_abierto: monto, hay_heredero: true };"],
    ['soltar sempre al GAS', "const r = SOLTAR2X1_BORDE_ON ? await staffPost('soltar2x1', _bS) : await gasPost('soltar2x1', _bS);", "const r = await gasPost('soltar2x1', _bS);"],
    ['consumo stringa', 'consumo: Math.round(parseFloat(m.consumo) || 0)', 'consumo: m.consumo'],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
