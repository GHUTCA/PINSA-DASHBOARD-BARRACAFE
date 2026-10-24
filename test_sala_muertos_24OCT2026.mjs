// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · il pedido cancellato non risorge su nessun telefono (24-oct)
// Reperto: la 998 del 24-ott (QUARTA): caffè cancellato dal PC, risorto sugli altri telefoni fino al cobro, e sopravvissuto alla ricarica (la foto).
// Gira `_muertosSet` · `_muertosFiltra` · `_mesasJustificadasCalo` · `mergeSalaGuardia` VERI in vm, nell'ordine di refrescar (muertos → guardia → STATE.sala).
// node test_sala_muertos_24OCT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
const fnRiga = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n', i) + 1); };
const P = (uuid, mesa, total) => ({ uuid, mesa, total, estado: 'digitado' });
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = "const _ARRAYS_SALA_MESA = ['mios', 'pendientes', 'por_limpiar', 'sin_dueno'];\n" + fnRiga(SRC, '_idPedido') + fnVin(SRC, '_mesasJustificadasCalo') +
    fnVin(SRC, '_muertosSet') + fnVin(SRC, '_muertosFiltra') + fnVin(SRC, 'mergeSalaGuardia');
  function mondo({ on = true } = {}) {
    const L = { rech: 0 };
    const ctx = { String, Object, Array, JSON, Date, MARCA_SAFETY_MS: 300000, MUERTOS_ON: on, STATE: { marcado: {} }, _pennaDice: () => { L.rech++; }, _guardiaLocalRegistra: () => {} };
    vm.createContext(ctx); vm.runInContext(F, ctx);
    const poll = (r) => { r = Object.assign({ ok: true }, JSON.parse(JSON.stringify(r))); r = ctx._muertosFiltra(r); r = ctx.mergeSalaGuardia(ctx.STATE.sala, r); ctx.STATE.sala = r; return r; };
    const vede = (u) => ['mios', 'pendientes', 'por_limpiar', 'sin_dueno'].some((k) => (ctx.STATE.sala[k] || []).some((p) => p.uuid === u));
    return { ctx, L, poll, vede };
  }
  // A · il telefono che NON ha cancellato (la 998): il bordo dice la morte
  { const w = mondo(); w.poll({ mios: [P('u-cafe', 998, 3190)] });
    w.poll({ mios: [], muertos: [{ uuid: 'u-cafe', mesa: '998', ts: 1, como: 'cancelado' }] });
    t('A1 · un altro telefono: il pedido morto (muertos) NON si restaura', !w.vede('u-cafe') && w.L.rech === 0, w.L);
    w.poll({ mios: [P('u-cafe', 998, 3190)], muertos: [{ uuid: 'u-cafe', mesa: '998' }] });
    t('A2 · una vista che lo porta ancora (in ritardo) ma lo dichiara morto: fuori', !w.vede('u-cafe'));
    for (let i = 0; i < 5; i++) w.poll({ mios: [], muertos: [] });
    t('A3 · cinque poll dopo (muertos vuoto): non risorge', !w.vede('u-cafe')); }
  // B · il PRIMA: senza muertos (bordo vecchio o leva del bordo spenta) la guardia di oggi lo restaura
  { const w = mondo(); w.poll({ mios: [P('u-cafe', 998, 3190)] }); w.poll({ mios: [] });
    t('B · muertos ASSENTE = come oggi: la guardia restaura (il prima, misurato)', w.vede('u-cafe') && w.L.rech === 1); }
  // C · la ricarica: STATE.sala è la FOTO salvata (col restauro dentro), poi il primo poll fresco
  { const w = mondo(); w.ctx.STATE.sala = { ok: true, _foto_local: 120, mios: [P('u-cafe', 998, 3190), P('u-pan', 50, 1000)] };
    w.poll({ mios: [P('u-pan', 50, 1000)] });
    t('C · dopo la ricarica la foto NON fa restaurare (il giro della 998 si rompe anche senza muertos)', !w.vede('u-cafe') && w.vede('u-pan') && w.L.rech === 0, w.L); }
  { const w = mondo(); w.ctx.STATE.sala = { ok: true, _vieja_s: 400, mios: [P('u-cafe', 998, 3190)] }; w.poll({ mios: [] });
    t('C2 · neanche da una vista vecchia (_vieja_s)', !w.vede('u-cafe')); }
  // D · la guardia resta viva per ciò per cui esiste: un pedido VIVO sparito senza ragione da una vista fresca
  { const w = mondo(); w.poll({ mios: [P('u-vivo', 30, 5000)] }); w.poll({ mios: [], muertos: [] });
    t('D · un pedido vivo che sparisce senza essere morto: la guardia lo restaura ancora (AUT-0396 intatta)', w.vede('u-vivo') && w.L.rech === 1); }
  // E · il freno ?muertos=0
  { const w = mondo({ on: false }); w.poll({ mios: [P('u-cafe', 998, 3190)] }); w.poll({ mios: [], muertos: [{ uuid: 'u-cafe' }] });
    const w2 = mondo({ on: false }); w2.ctx.STATE.sala = { ok: true, _foto_local: 120, mios: [P('u-cafe', 998, 3190)] }; w2.poll({ mios: [] });
    t('E · ?muertos=0: tutto come oggi (restaura col muertos e dalla foto)', w.vede('u-cafe') && w2.vede('u-cafe')); }
  t('F1 · leerSala porta muertos nella fetta, e refrescar filtra PRIMA della guardia', /if \(MUERTOS_ON && Array\.isArray\(j\.datos\.datos\.muertos\)\) mia\.muertos = j\.datos\.datos\.muertos;/.test(SRC) &&
    SRC.indexOf('    r = _muertosFiltra(r);') > 0 && SRC.indexOf('    r = _muertosFiltra(r);') < SRC.indexOf('    if (GUARDIA_SALA_ON) r = mergeSalaGuardia(STATE.sala, r);'));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['la guardia restaura i morti', "      if (_mu[id]) return;                              // [24-ott]", '      //'],
    ['il filtro non toglie', "    if (Array.isArray(r[k])) r[k] = r[k].filter(function (p) { return !(p && p.uuid != null && mu[String(p.uuid)]); });\n  });\n  return r;\n}\nfunction mergeSalaGuardia", "  });\n  return r;\n}\nfunction mergeSalaGuardia"],
    ['dalla foto si restaura', "  if (MUERTOS_ON && (prevR._foto_local || prevR._vieja_s)) return respR;", ''],
    ['la guardia spenta del tutto coi muertos', "  if (!prevR) return respR;                    // niente \"prima\" con cui confrontare: entra libera", "  if (!prevR || respR.muertos) return respR;"],
    ['il freno ignorato', "  if (MUERTOS_ON && r && Array.isArray(r.muertos))", "  if (r && Array.isArray(r.muertos))"],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
