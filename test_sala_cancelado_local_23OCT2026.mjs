// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · il pedido cancellato da qui non torna (23-oct)
// Reperto: 🖐 QUARTA `QUARTA V32 LA MESA CHIUSA LAMPEGGIA SECONDA VOLTA 998` (997 il 22, 998 il 23). Causa: `TERZA V32 LA MESA CHE LAMPEGGIA LA CAUSA`.
// Gira le funzioni VERE in vm: _cancLocal* · _mesasJustificadasCalo · mergeSalaGuardia (la guardia vera, accesa di fabbrica).
// node test_sala_cancelado_local_23OCT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
const fnRiga = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n', i) + 1); };
const P = (uuid, mesa, total) => ({ uuid, mesa, total, estado: 'digitado', items_json: '[{"id":"pan","qty":1}]' });
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = "const _ARRAYS_SALA_MESA = ['mios', 'pendientes', 'por_limpiar', 'sin_dueno'];\n" + fnRiga(SRC, '_idPedido') + fnVin(SRC, '_mesasJustificadasCalo') +
    fnRiga(SRC, '_cancLocalOn') + fnVin(SRC, '_cancLocalVivi') + fnVin(SRC, '_cancLocalFiltra') + fnVin(SRC, '_cancLocalSegna') + fnVin(SRC, 'mergeSalaGuardia') + (SRC.includes('function _muertosSet(') ? '\nvar MUERTOS_ON = false; function _muertosSet() { return {}; }\n' : '') +   // [24-ott] muertos neutro: la guardia di ieri
    (SRC.includes('function _cancTraza(') ? fnVin(SRC, '_cancTraza') + fnRiga(SRC, '_cancTrazaMesas') + fnVin(SRC, '_cancTrazaConta') + fnVin(SRC, '_cancTrazaRes') : '');
  function mondo({ leva = true, tel = null } = {}) {
    const L = { limpiar: [], mappa: 0, panel: 0, rech: 0 };
    let now = Date.parse('2026-10-23T16:33:00-03:00');
    const ctx = { String, Object, Array, JSON, Date: Object.assign(function () { return new globalThis.Date(now); }, { now: () => now }), MARCA_SAFETY_MS: 300000, CANC_LOCAL_SRV: leva, CANC_LOCAL_TEL: tel,
      STATE: { marcado: {}, mesaAbierta: '' }, _limpiarMesaLocal: (m) => { L.limpiarMesa = (L.limpiarMesa || 0) + 1; },
      _limpiarUuidsLocal: (us, m) => { us.forEach((u) => { L.limpiar.push(m + ':' + u); ctx.STATE.marcado[u] = { marca: 'limpia', mesa: m, ts: now }; }); },
      refrescarMapa: () => { L.mappa++; }, renderPanel: () => { L.panel++; }, renderMesaSheet: () => {}, _pennaDice: () => { L.rech++; }, _guardiaLocalRegistra: () => {},
      localStorage: (() => { const LS = {}; L.LS = LS; return { getItem: (k) => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); } }; })() };
    vm.createContext(ctx); vm.runInContext(F.replace(/^let CANC_LOCAL_SRV.*$/m, ''), ctx);
    // il ciclo del poll, nell'ordine di refrescar: filtro → guardia → STATE.sala
    const poll = (r) => { r = Object.assign({ ok: true }, JSON.parse(JSON.stringify(r))); r = ctx._cancLocalFiltra(r); r = ctx.mergeSalaGuardia(ctx.STATE.sala, r); ctx.STATE.sala = r; return r; };
    const vede = (uuid) => ['mios', 'pendientes', 'por_limpiar', 'sin_dueno'].some((k) => (ctx.STATE.sala[k] || []).some((p) => p.uuid === uuid));
    return { ctx, L, poll, vede, avanza: (ms) => { now += ms; } };
  }
  // A · la 998 di oggi: un pedido solo, cancellato da «Un producto»
  { const w = mondo(); w.poll({ mios: [P('u-pan', 998, 1090)] });
    w.ctx._cancLocalSegna(998, 'u-pan');
    t('A1 · al gesto: sparito da STATE.sala, la mesa vuota prende il segno PER UUID (mai mesa#), la tessera si ridisegna subito', !w.vede('u-pan') && w.L.limpiar[0] === '998:u-pan' && !w.L.limpiarMesa && !w.ctx.STATE.marcado['mesa#998'] && w.L.mappa === 1 && w.L.panel === 1, w.L);
    w.poll({ mios: [P('u-pan', 998, 1090)] });
    t('A2 · il poll partito PRIMA del gesto (ha ancora il pedido) non lo rimette', !w.vede('u-pan'));
    w.poll({ mios: [] });
    t('A3 · il poll senza il pedido e senza mesas_pagadas: la guardia NON lo restaura', !w.vede('u-pan') && w.L.rech === 0, w.L);
    w.poll({ mios: [], mesas_pagadas: { 998: 1 } });
    t('A4 · poi il server la dà pagada: resta libre', !w.vede('u-pan')); }
  // B · il caso peggiore: sulla mesa resta un altro pedido
  { const w = mondo(); w.poll({ mios: [P('u-pan', 998, 1090), P('u-cafe', 998, 2500)] });
    w.ctx._cancLocalSegna('998', 'u-pan');
    t('B1 · resta il café: la mesa NON si chiude (niente limpia), il pan sparisce', w.L.limpiar.length === 0 && !w.vede('u-pan') && w.vede('u-cafe'), w.L);
    for (let i = 0; i < 4; i++) { w.avanza(60000); w.poll({ mios: [P('u-cafe', 998, 2500)] }); }
    t('B2 · quattro poll senza il pan: mai restaurato, il café resta', !w.vede('u-pan') && w.vede('u-cafe') && w.L.rech === 0, w.L);
    w.avanza(120000); w.poll({ mios: [P('u-cafe', 998, 2500)] });
    t('B3 · dopo i 5 minuti il registro scade e il pan resta fuori (la foto di prima non lo ha più)', !w.vede('u-pan') && w.vede('u-cafe') && !Object.keys(w.ctx.STATE._cancLocal).length); }
  // C · leva SPENTA = la guardia di ieri (il difetto, misurato: il «prima»)
  { const w = mondo({ leva: false }); w.poll({ mios: [P('u-pan', 998, 1090), P('u-cafe', 998, 2500)] });
    w.ctx._cancLocalSegna('998', 'u-pan');
    t('C1 · leva spenta: il gesto non scrive niente (nessun registro, nessun limpia, nessun ridisegno in più)', !w.ctx.STATE._cancLocal && w.L.limpiar.length === 0 && w.L.mappa === 0 && w.vede('u-pan'));
    w.ctx.STATE.sala.mios = w.ctx.STATE.sala.mios.filter((p) => p.uuid !== 'u-pan');   // il modello di ieri lo toglie a mano
    w.poll({ mios: [P('u-cafe', 998, 2500)] });
    t('C2 · leva spenta, prima che il server lo sappia: identico a ieri', w.vede('u-cafe'));
    const w2 = mondo({ leva: false }); w2.poll({ mios: [P('u-pan', 998, 1090), P('u-cafe', 998, 2500)] });
    w2.poll({ mios: [P('u-cafe', 998, 2500)] });
    t('C3 · il PRIMA, sul vetro di ieri: la guardia RIMETTE il pedido cancellato (è il «ricompare»)', w2.vede('u-pan') && w2.L.rech === 1, w2.L); }
  // D · per apparecchio: ?canc=1 accende anche con la leva del bordo spenta, ?canc=0 spegne con la leva accesa
  { const w = mondo({ leva: false, tel: true }); w.poll({ mios: [P('u-pan', 998, 1090)] }); w.ctx._cancLocalSegna(998, 'u-pan'); w.poll({ mios: [] });
    const w2 = mondo({ leva: true, tel: false }); w2.poll({ mios: [P('u-pan', 998, 1090)] }); w2.ctx._cancLocalSegna(998, 'u-pan');
    t('D · ?canc=1 accende, ?canc=0 spegne, sopra la leva del bordo', !w.vede('u-pan') && w.L.limpiar.length === 1 && w2.vede('u-pan') && !w2.ctx.STATE._cancLocal); }
  // E · un pedido NUOVO sulla stessa mesa dopo il gesto resta (il registro è per uuid, non per mesa)
  { const w = mondo(); w.poll({ mios: [P('u-pan', 998, 1090)] }); w.ctx._cancLocalSegna(998, 'u-pan');
    w.poll({ pendientes: [P('u-nuevo', 998, 3000)] });
    t('E · un pedido nuovo sulla mesa dopo il gesto si vede', w.vede('u-nuevo') && !w.vede('u-pan')); }
  // T · la traccia del lampeggio (solo a leva accesa, solo nel telefono)
  { const w = mondo(); w.poll({ mios: [P('u-pan', 998, 1090)], mesas: [{ mesa: 998, total: 1090 }] }); w.ctx._cancLocalSegna(998, 'u-pan');
    const tr = JSON.parse(w.L.LS.sala_canc_traza || '[]');
    t('T1 · il gesto lascia «segna» con mesa, uuid, quedan e il résumé che c era', tr.length === 1 && tr[0].e === 'segna' && tr[0].uuid === 'u-pan' && tr[0].quedan === false && tr[0].res === 1090, tr);
    const w2 = mondo({ leva: false }); w2.poll({ mios: [P('u-pan', 998, 1090)] }); w2.ctx._cancLocalSegna(998, 'u-pan');
    t('T2 · leva spenta: nessuna traccia', !w2.L.LS.sala_canc_traza);
    t('T3 · il poll scrive la traccia DOPO render(r), con fuente/res/vptot/modelo, e si legge con ?canc_traza=1', SRC.includes("render(r);\n    try { _cancTrazaMesas().forEach") && SRC.includes('vptot: _vpTot(m)') && SRC.includes("QS.get('canc_traza') === '1'")); }
  // F · i cammini nel file
  t('F1 · refrescar filtra PRIMA della guardia', /r = _cancLocalFiltra\(r\);[^\n]*\n\s*if \(GUARDIA_SALA_ON\) r = mergeSalaGuardia\(STATE\.sala, r\);/.test(SRC));
  t('F2 · «Un producto»: tutte le qty a zero = cancellato anche se il bordo non ripete cancelado', /\(_bodyCorrBorde\.cancelado && !r\.cancelado\) \? Object\.assign\(\{\}, r, \{ _cancelado_vetro: true \}\) : r\)/.test(SRC) && /if \(r\.cancelado \|\| r\._cancelado_vetro\) _cancLocalSegna\(mesa, uuid\);/.test(fnVin(SRC, '_dtEliminarOptimista')));
  t('F3 · il pannello a steppers (_corrAplicaLocal) segna anche lui', /if \(r\.cancelado\) _cancLocalSegna\(mesa, uuid\);/.test(fnVin(SRC, '_corrAplicaLocal')));
  t('F4 · la leva si legge da /salud', /CANC_LOCAL_SRV = String\(cercaK\(j, 'sala_cancelado_local_on'\)\) === '1';/.test(SRC));
  t('F5 · la riconciliazione confronta la mesa tollerante al tipo (a leva accesa)', /_cancLocalOn\(\) \? String\(x\.mesa\) === String\(e\.mesa\) : x\.mesa === e\.mesa/.test(fnVin(SRC, '_corrOptimistaReconcilia')));
  // G · [23-ott · BKP 2f0c2e4] la correzione che aggiunge un prodotto 86: il ramo VERO di guardarCorreccion__in, coi suoi toast
  { const i = SRC.indexOf("} else if (r && (r.need === 'items_agotados' || r.error === 'items_agotados')) {");
    const corpo = i < 0 ? '' : SRC.slice(SRC.indexOf('{', i + 8) + 1, SRC.indexOf('    } else {', i));
    const L = { toast: [], marca: null, btn: { disabled: true } };
    const g = { _ago86Marca: (a) => { L.marca = a; }, toast: (k, s) => L.toast.push([k, s]) };
    let ret = 'non uscito';
    try { ret = new Function('r', 'btn', '_ago86Marca', 'toast', corpo + '\nreturn "caduto";')({ ok: false, borde: true, scritto: false, need: 'items_agotados', agotados: [{ id: 'pan', nombre: 'Pan de masa madre' }] }, L.btn, g._ago86Marca, g.toast); } catch (e) { ret = 'errore ' + e.message; }
    t('G · need:items_agotados nella correzione: il nome del piatto, segnato 86, bottone riattivato, il pannello resta (return)', i > 0 && ret === undefined && L.marca && L.marca[0].id === 'pan' && /Se acabó: Pan de masa madre — no se agregó nada/.test((L.toast[0] || [])[1] || '') && L.btn.disabled === false, { ret, L });
    t('G2 · «Qué cambió» ha la riga', /Agregar algo que se acabó/.test(fs.readFileSync(new URL('./que_cambio.html', import.meta.url), 'utf8'))); }
  // H · [23-ott · EL GIRO c8d8c73] il pedido nuovo riconosce need:'items_agotados' (forma del bordo) oltre a error (forma del GAS)
  t('H · crearPedido: l 86 dal bordo (need) come dal GAS (error)', /if \(r && \(r\.error === 'items_agotados' \|\| r\.need === 'items_agotados'\)\) \{/.test(SRC));
  // I · la coda offline: un pedido 86 esce, gli altri dietro entrano, il mesero lo sa col nome — _colaFlush VERO
  { const LS = {}; let cola = [
      { action: 'crearPedidoMesero', body: { uuid: 'q1', mesa: 42, codigo: 'C' } },
      { action: 'crearPedidoMesero', body: { uuid: 'q2', mesa: 43, codigo: 'C' } },
      { action: 'crearPedidoMesero', body: { uuid: 'q3', mesa: 44, codigo: 'C' } }];
    const L = { toast: [], marca: null, refr: 0, post: [] };
    const ctx = { JSON, Date, String, Math, COLA_FLUSHING: false, COLA_BORDE_ON: true, STATE: { codigo: 'C' },
      localStorage: { getItem: (k) => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); } },
      _colaGet: () => cola.slice(), _colaSave: (x) => { cola = x.slice(); }, _soloBorde: () => true,
      staffPost: async (act, b) => { L.post.push(b.uuid); return b.uuid === 'q1' ? { ok: false, borde: true, scritto: false, need: 'items_agotados', agotados: [{ id: 'pan', nombre: 'Pan' }], mesa: 42 } : { ok: true }; },
      gasPost: async () => ({ ok: true }), _ago86Marca: (x) => { L.marca = x; }, toast: (k, s) => L.toast.push([k, s]), refrescar: () => { L.refr++; },
      _colaBadge: () => { L.badge = (L.badge || 0) + 1; } };
    vm.createContext(ctx); vm.runInContext('async ' + fnVin(SRC, '_colaFlush') + fnVin(SRC, '_cola86Txt'), ctx);
    await vm.runInContext('_colaFlush()', ctx);
    const s86 = JSON.parse(LS.sala_cola_86 || '[]');
    t('I · coda: il pedido 86 esce e si mette da parte, gli altri due entrano, il mesero legge mesa e piatto', cola.length === 0 && L.post.join(',') === 'q1,q2,q3' && s86.length === 1 && s86[0].body.uuid === 'q1' && L.marca && L.marca[0].id === 'pan' && L.toast.some((x) => /2 pedidos de la cola entraron/.test(x[1])), { cola, post: L.post, toast: L.toast });
    const ult = L.toast[L.toast.length - 1] || [];
    t('I2 · K3 di 💵: l ULTIMO toast (quello che resta a schermo) è il NO, con mesa, piatto e «los otros 2 sí entraron»', ult[0] === 'err' && /Mesa 42: se acabó Pan — el pedido guardado NO entró/.test(ult[1]) && /los otros 2 sí entraron/.test(ult[1]), L.toast); }
  // I3 · il badge tiene il NO finché il mesero non tocca — _colaBadge · _cola86* VERI
  { const LS = { sala_cola_86: JSON.stringify([{ ts: 1, body: { mesa: 42 }, agotados: [{ id: 'pan', nombre: 'Pan' }] }]), mesero_cola_v1: '[]' };
    const el = { textContent: '', style: {}, onclick: null }; const L = { toast: [] };
    const ctx = { JSON, localStorage: { getItem: (k) => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); } }, $: () => el,
      _colaGet: () => JSON.parse(LS.mesero_cola_v1), toast: (k, s) => L.toast.push([k, s]) };
    vm.createContext(ctx); vm.runInContext(fnVin(SRC, '_colaBadge') + fnRiga(SRC, '_cola86Get') + fnRiga(SRC, '_cola86NoVisti') + fnVin(SRC, '_cola86Txt') + fnVin(SRC, '_cola86Mostra'), ctx);
    vm.runInContext('_colaBadge()', ctx); const prima = el.textContent, cliccabile = typeof el.onclick === 'function';
    if (cliccabile) el.onclick(); const dopo = el.textContent;
    t('I3 · badge «🚫 1 no entró — toca» finché non lo tocca; il tocco dice mesa e piatto e lo spegne', /🚫 1 no entró — toca/.test(prima) && cliccabile && /NO entraron: Mesa 42: se acabó Pan/.test((L.toast[0] || [])[1] || '') && dopo === '', { prima, dopo, toast: L.toast }); }
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['il filtro non toglie niente', 'r[k] = r[k].filter(function (p) { return !(p && p.uuid != null && v[String(p.uuid)]); });', 'r[k] = r[k].slice();'],
    ['la mesa vuota non prende il segno', "  if (!quedan) _limpiarUuidsLocal([String(uuid)], String(mesa));", ''],
    ['segno anche se resta un pedido', "  if (!quedan) _limpiarUuidsLocal([String(uuid)], String(mesa));", '  _limpiarUuidsLocal([String(uuid)], String(mesa));'],
    ['torna il segno di mesa (la finestra del café)', "  if (!quedan) _limpiarUuidsLocal([String(uuid)], String(mesa));", '  if (!quedan) _limpiarMesaLocal(String(mesa));'],
    ['il registro non scade', '  Object.keys(reg).forEach(function (u) { if (now - reg[u].ts < MARCA_SAFETY_MS) out[u] = reg[u]; else delete reg[u]; });', '  Object.keys(reg).forEach(function (u) { out[u] = reg[u]; });'],
    ['la leva ignorata (sempre accesa)', 'function _cancLocalOn() { return CANC_LOCAL_TEL !== null ? CANC_LOCAL_TEL : CANC_LOCAL_SRV; }', 'function _cancLocalOn() { return true; }'],
    ['il poll filtra DOPO la guardia', "    r = _cancLocalFiltra(r);   // [23-ott · TERZA]", "    //"],
    ['la tessera non si ridisegna', '  try { refrescarMapa(); } catch (e) {}', ''],
    ['la correzione 86 non riconosciuta (torna «No se pudo: ?»)', "} else if (r && (r.need === 'items_agotados' || r.error === 'items_agotados')) {", "} else if (r && r.error === 'items_agotados_x') {"],
    ['crearPedido non legge need', "if (r && (r.error === 'items_agotados' || r.need === 'items_agotados')) {   // [23-ott", "if (r && (r.error === 'items_agotados')) {   // [23-ott"],
    ['il NO detto prima del SI (coperto)', "  if (no86.length) { toast('err',", "  if (false) { toast('err',"],
    ['il badge non tiene il NO', "(no.length ? ((n ? ' · ' : '') + '🚫 ' + no.length + ' no entró — toca') : '')", "''"],
    ['la coda si ferma sull 86 (come ieri)', "      if (r && (r.need === 'items_agotados' || r.error === 'items_agotados')) {\n        const e86", "      if (false) {\n        const e86"],
    ['il bordo muto su cancelado non segna', 'if (r.cancelado || r._cancelado_vetro) _cancLocalSegna(mesa, uuid);', 'if (r.cancelado) _cancLocalSegna(mesa, uuid);'],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
