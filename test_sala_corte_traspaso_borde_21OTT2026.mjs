// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · il corte CON mesas da passare al bordo (21-ott)
// Richiesta: ⚙️ `ARQ V32 CORTE CON TRASPASO 363D394 E IL VETRO`. Gira la regione VERA di cierreEnviar (da `let r = null` al verdetto) in vm.
// node test_sala_corte_traspaso_borde_21OTT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const i0 = SRC.indexOf('    let r = null, rbSaldo = null;'); const i1 = SRC.indexOf('    if (r && r.ok) {', i0);
  if (i0 < 0 || i1 < 0) throw new Error('regione');
  const G = SRC.slice(i0, i1);
  async function corte({ pasar = true, tras = true, corte = true, atto1 = true, saldo = false, bordo }) {
    const L = { bordo: [], gas: 0, saldo: 0 };
    const ctx = { CIE: { pasarMesas: pasar, enviando: true }, CORTE_TRAS_BORDE_ON: tras, CORTE_BORDE_ON: corte, CAJA_ATTO1_ON: atto1, SALDO_SIN_PADRON_ON: saldo,
      _cierreBody: { uid: 'u1', pasar_mesas: pasar }, Object, JSON,
      _cerrarMeseroAlBorde: async (b) => { L.bordo.push(JSON.parse(JSON.stringify(b))); return bordo === undefined ? null : JSON.parse(JSON.stringify(bordo)); },
      gasPost: async () => { L.gas++; return { ok: true, id: 'CM-GAS', regimen: 'x' }; },
      bordeHecho: () => {}, _cieSaldo: () => { L.saldo++; }, out: null };
    vm.createContext(ctx);
    await vm.runInContext('(async function () {\n' + G + '\n this.out = r; }).call(this)', ctx);
    return { r: ctx.out, L };
  }
  const OK = { ok: true, borde: true, id: 'CM-B', traspasos: [{ mesa: '12', a: 'Ana', consumo: 9000 }], mesas_abiertas: [], monto_abierto: 0 };
  { const x = await corte({ bordo: OK });
    t('A · leva accesa + mesas da passare ⇒ il bordo col segnale pasar_mesas_borde, ZERO GAS, il risultato è del bordo', x.L.bordo.length === 1 && x.L.bordo[0].pasar_mesas_borde === true && x.L.gas === 0 && x.r.id === 'CM-B' && x.r.traspasos.length === 1, x); }
  { const x = await corte({ bordo: { ok: false, borde: true, error: 'mesas_abiertas', mesas_abiertas: [{ mesa: '7', consumo: 1 }], n_abiertas: 1 } });
    t('B · mesa senza erede ⇒ il rifiuto del bordo è il risultato, niente GAS (nessun secondo corte)', x.L.gas === 0 && x.r.error === 'mesas_abiertas', x); }
  { const x = await corte({ bordo: { ok: false, borde: true, need: 'gas' } });
    t('C · need:gas ⇒ il GAS come ieri, un corte solo', x.L.bordo.length === 1 && x.L.gas === 1 && x.r.id === 'CM-GAS', x); }
  { const x = await corte({ bordo: undefined });
    t('D · rete morta (null) ⇒ il GAS', x.L.gas === 1 && x.r.id === 'CM-GAS', x); }
  { const x = await corte({ bordo: { ok: false, borde: true, error: 'mesa_a_saldo' } });
    t('E · mesa_a_saldo ⇒ si ferma come oggi, niente GAS', x.L.saldo === 1 && x.L.gas === 0, x); }
  { const x = await corte({ tras: false, bordo: OK });
    t('F · leva del traspaso spenta ⇒ come ieri: bordo fire-and-forget SENZA il segnale, e il GAS', x.L.gas === 1 && x.L.bordo.every((b) => !b.pasar_mesas_borde), x); }
  { const x = await corte({ pasar: false, bordo: OK });
    t('G · senza mesas da passare ⇒ il ramo di oggi, senza il segnale', x.L.bordo.length === 1 && !x.L.bordo[0].pasar_mesas_borde && x.L.gas === 0, x); }
  { const x = await corte({ corte: false, bordo: OK });
    t('H · CORTE_BORDE_ON spenta ⇒ anche col traspaso acceso il GAS (il corte al bordo non c è)', x.L.gas === 1 && x.L.bordo.every((b) => !b.pasar_mesas_borde), x); }
  { const x = await corte({ tras: false, saldo: true, bordo: { ok: false, borde: true, need: 'gas' } });
    t('I · leva spenta e SALDO_SIN_PADRON ⇒ il cancello del saldo come oggi, poi GAS', x.L.bordo.length === 1 && x.L.gas === 1 && !x.L.bordo[0].pasar_mesas_borde, x); }
  t('J · la leva si legge dal /salud e nasce false', /var CORTE_TRAS_BORDE_ON = false;/.test(SRC) && /CORTE_TRAS_BORDE_ON = String\(cercaK\(j, 'corte_traspaso_borde_on'\)\) === '1';/.test(SRC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['senza il segnale', "_trasB ? Object.assign({}, _cierreBody, { pasar_mesas_borde: true }) : _cierreBody", '_cierreBody'],
    ['segnale sempre', "_trasB ? Object.assign({}, _cierreBody, { pasar_mesas_borde: true }) : _cierreBody", "Object.assign({}, _cierreBody, { pasar_mesas_borde: true })"],
    ['leva ignorata', 'const _trasB = !!CIE.pasarMesas && CORTE_TRAS_BORDE_ON;', 'const _trasB = !!CIE.pasarMesas;'],
    ['il traspaso resta al GAS', '(!CIE.pasarMesas || _trasB)', '!CIE.pasarMesas'],
    ['senza CORTE_BORDE_ON', 'if (CORTE_BORDE_ON && CAJA_ATTO1_ON && (!CIE.pasarMesas || _trasB))', 'if ((CORTE_BORDE_ON && CAJA_ATTO1_ON && !CIE.pasarMesas) || _trasB)'],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
