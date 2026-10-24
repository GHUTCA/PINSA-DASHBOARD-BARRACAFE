// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · il totale vecchio dopo la correzione (24-oct)
// Reperto: 🖐 QUARTA `QUARTA V32 IL LAMPEGGIO ANCHE CON GUARDIA 0` — la 998 alle 10:38: tolto il pan, ~20 s dopo «$4.280» per ~5 s con «1 línea $3.190».
// Gira `_corrAttSegna` · `_corrAttApplica` VERI in vm, con la risposta di una vista più vecchia del gesto.
// node test_sala_corr_atteso_24OCT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = "const _ARRAYS_SALA_MESA = ['mios', 'pendientes', 'por_limpiar', 'sin_dueno'];\n" + fnVin(SRC, '_corrAttSegna') + fnVin(SRC, '_corrAttApplica');
  function mondo({ on = true } = {}) {
    let now = Date.parse('2026-10-24T10:38:01-03:00');
    const ctx = { String, Number, Math, Object, Array, JSON, Date: Object.assign(function (x) { return new globalThis.Date(x == null ? now : x); }, { now: () => now }), CORR_ATT_ON: on, STATE: {} };
    vm.createContext(ctx); vm.runInContext(F, ctx);
    return { ctx, avanza: (ms) => { now += ms; }, segna: (m, u, r, v = 4280) => ctx._corrAttSegna(m, u, r, v), applica: (r) => ctx._corrAttApplica(JSON.parse(JSON.stringify(r))) };
  }
  const VISTA_VECCHIA = { ok: true, mios: [{ uuid: 'u-998', mesa: 998, total: 4280, items_json: '[{"n":"Cafe"},{"n":"Pan"}]' }, { uuid: 'u-50', mesa: 50, total: 9000 }],
    mesas: [{ mesa: '998', total: 4280 }, { mesa: '50', total: 9000 }], venta_turno: { venta: 13280, cuentas: 2 } };
  { const w = mondo(); w.segna('998', 'u-998', { ok: true, total: 3190, items_json: '[{"n":"Cafe"}]' }); w.avanza(20000);
    const r = w.applica(VISTA_VECCHIA);
    const p = r.mios.find((x) => x.uuid === 'u-998'), m998 = r.mesas.find((x) => x.mesa === '998'), m50 = r.mesas.find((x) => x.mesa === '50');
    t('A · LA 998: la vista vecchia (pedido e résumé a $4.280) si corregge a $3.190 PRIMA del disegno, righe comprese', p.total === 3190 && /Cafe/.test(p.items_json) && !/Pan/.test(p.items_json) && m998.total === 3190, { p, m998 });
    t('A2 · venta_turno toglie la stessa differenza ($1.090); l altra mesa non si tocca', r.venta_turno.venta === 12190 && m50.total === 9000 && r.mios.find((x) => x.uuid === 'u-50').total === 9000, r.venta_turno);
    const r2 = w.applica({ ok: true, mios: [{ uuid: 'u-998', mesa: 998, total: 3190 }], mesas: [{ mesa: '998', total: 3190 }] });
    t('B · la vista arriva col totale nuovo: niente da correggere, e la voce RESTA (la foto vecchia può ancora arrivare)', r2.mesas[0].total === 3190 && !!w.ctx.STATE._corrAtteso['u-998']);
    w.avanza(20000); const r3 = w.applica(VISTA_VECCHIA);
    t('B2 · (S2 di 💵) poll fresco, POI la foto vecchia a $4.280: si corregge lo stesso', r3.mesas.find((x) => x.mesa === '998').total === 3190 && r3.venta_turno.venta === 12190);
    const r4 = w.applica({ ok: true, mios: [{ uuid: 'u-998', mesa: 998, total: 1500 }], mesas: [{ mesa: '998', total: 1500 }], venta_turno: { venta: 10500 } });
    t('B3 · (S3 di 💵) un TERZO totale (un altro telefono ha corretto ancora): non si tocca, niente denaro rimesso', r4.mios[0].total === 1500 && r4.mesas[0].total === 1500 && r4.venta_turno.venta === 10500, r4); }
  { const w = mondo(); w.segna('998', 'u-998', { ok: true, total: 3190 }, 4280); w.avanza(10000); w.segna('998', 'u-998', { ok: true, total: 2000 }, 3190); w.avanza(10000);
    const r5 = w.applica(VISTA_VECCHIA), r6 = w.applica({ ok: true, mios: [{ uuid: 'u-998', mesa: 998, total: 3190 }], mesas: [{ mesa: '998', total: 3190 }] });
    t('B5 · (🟡 di 💵) due correzioni di fila 4.280 → 3.190 → 2.000: la foto a 4.280 E quella a 3.190 si correggono a 2.000', r5.mios.find((x) => x.uuid === 'u-998').total === 2000 && r5.mesas.find((x) => x.mesa === '998').total === 2000 && r6.mesas[0].total === 2000, { r5: r5.mesas, r6: r6.mesas }); }
  { const w = mondo(); w.segna('998', 'u-998', { ok: true, total: 3190 }, null);
    t('B4 · senza il totale di prima non si registra (non si indovina)', !w.ctx.STATE._corrAtteso); }
  { const w = mondo(); w.segna('998', 'u-998', { ok: true, scritto: true });
    t('C · la risposta senza total (il bordo a leva spenta): niente registro, la vista com è', !w.ctx.STATE._corrAtteso && w.applica(VISTA_VECCHIA).mesas[0].total === 4280); }
  { const w = mondo(); w.segna('998', 'u-998', { ok: true, cancelado: true, total: 0 });
    t('D · un annullamento non si registra qui (lo tolgono il registro locale e i muertos)', !w.ctx.STATE._corrAtteso); }
  { const w = mondo(); w.segna('998', 'u-998', { ok: true, total: 3190 }); w.avanza(301000);
    t('E · oltre 5 minuti la voce scade e la vista non si tocca', w.applica(VISTA_VECCHIA).mesas[0].total === 4280 && !Object.keys(w.ctx.STATE._corrAtteso).length); }
  { const w = mondo({ on: false }); w.segna('998', 'u-998', { ok: true, total: 3190 });
    t('F · ?corratt=0: niente, come ieri', !w.ctx.STATE._corrAtteso && w.applica(VISTA_VECCHIA).mesas[0].total === 4280);
    w.ctx.STATE._corrAtteso = { 'u-998': { mesa: '998', total: 3190, viejo: 4280, viejos: [4280], items_json: null, ts: Date.parse('2026-10-24T10:38:01-03:00') } };
    t('F2 · ?corratt=0 col registro già pieno (spento dopo il gesto): la vista non si tocca', w.applica(VISTA_VECCHIA).mesas[0].total === 4280); }
  { const w = mondo(); w.segna('998', 'u-998', { ok: true, total: 3190 }); const r = w.applica({ ok: true, mios: [], mesas: [{ mesa: '998', total: 4280 }] });
    t('G · la vista non porta il pedido: niente si corregge (né si toglie)', r.mesas[0].total === 4280 && !!w.ctx.STATE._corrAtteso['u-998']); }
  t('H · il poll corregge PRIMA dei muertos e della guardia; i due punti che correggono segnano', SRC.indexOf('    r = _corrAttApplica(r);') > 0 && SRC.indexOf('    r = _corrAttApplica(r);') < SRC.indexOf('    if (GUARDIA_SALA_ON) r = mergeSalaGuardia(STATE.sala, r);') &&
    /_corrAttSegna\(mesa, uuid, r, _viejoAtt\);/.test(fnVin(SRC, '_corrAplicaLocal')) && /_corrAttSegna\(mesa, uuid, r, _viejoAtt\);/.test(fnVin(SRC, '_dtEliminarOptimista')) &&
    /const _viejoAtt = arr\[idx\]\.total;[\s\S]*arr\[idx\]\.total = r\.total;/.test(fnVin(SRC, '_corrAplicaLocal')) && /const _viejoAtt = arr\[idx\]\.total;[\s\S]*arr\[idx\]\.total = r\.total;/.test(fnVin(SRC, '_dtEliminarOptimista')));   // il totale DI PRIMA letto prima di sovrascriverlo
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['il résumé non si corregge', "    if (Array.isArray(rs)) rs.forEach(function (m) { if (m && String(m.mesa) === e.mesa && typeof m.total === 'number') m.total = Math.max(0, m.total - delta); });", ''],
    ['venta_turno non si corregge', "    if (r.venta_turno && typeof r.venta_turno.venta === 'number') r.venta_turno.venta = Math.max(0, r.venta_turno.venta - delta);", ''],
    ['si corregge anche un terzo totale (S3)', "    if (!_vv.some(function (x) { return Math.abs(vecchio - x) < 1; }) || Math.abs(delta) < 1) return;", "    if (Math.abs(delta) < 1) return;"],
    ['il poll fresco svuota la voce (S2)', "    if (!_vv.some(function (x) { return Math.abs(vecchio - x) < 1; }) || Math.abs(delta) < 1) return;", "    if (Math.abs(delta) < 1) { delete reg[u]; return; }\n    if (!_vv.some(function (x) { return Math.abs(vecchio - x) < 1; })) return;"],
    ['due correzioni di fila: si tiene solo l ultimo totale di prima', "    const _vv = Array.isArray(e.viejos) ? e.viejos : [e.viejo];", "    const _vv = [e.viejo];"],
    ['si registra senza il totale di prima', "|| uuid == null || viejo == null) return;", "|| uuid == null) return;"],
    ['la voce non scade', "    if (!e || now - e.ts > 300000) { delete reg[u]; return; }", "    if (!e) { return; }"],
    ['si registra anche senza total', "|| r.total == null ||", "||"],
    ['il freno ignorato', "  if (!CORR_ATT_ON || !r || !STATE._corrAtteso) return r;", "  if (!r || !STATE._corrAtteso) return r;"],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
