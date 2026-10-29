// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · 6.5b: l'identità del telefono dal bordo nei vetri (sala · anfitriona) — 29-ott
// Reperto: `TERZA V32 6.5B DATA`. Gira `_identitaBordeOGas`, `_bautizoAlBorde`, `_conDev` VERI di sala.html e `_anfLv`, `_anfLeveIdentita`,
// `_identitaBordeOGas` VERI di anfitriona.html in vm, con fetch e gasPost finti. Le risposte del bordo sono le FORME del ponte vivo `dc4fa2f`
// (index.js r.6614-6638 e r.6678-6682): battesimo `{ok:true, token, fuente:'borde'}` SENZA timbro · getStaffSala `{ok:true, staff, borde:true}` · `need:'gas'`.
// node test_6_5b_vetri_29OCT2026.mjs · --mutanti
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SALA0 = fs.readFileSync(path.join(AQUI, 'sala.html'), 'utf8').replace(/\r\n/g, '\n');
const ANF0 = fs.readFileSync(path.join(AQUI, 'anfitriona.html'), 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n, asinc) => { const i = S.indexOf((asinc ? 'async function ' : 'function ') + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
const BAUT_OK = { ok: true, token: 'tok-pg', nombre: 'Wilbert', tipo: 'mesero', estacion: '', fuente: 'borde' };
const NEED = { ok: false, need: 'gas', error: 'apagado' };

async function banco(SALA, ANF, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  /* ── sala ── */
  const decl = SALA.slice(SALA.indexOf('var STAFF_SALA_BORDE_ON = '), SALA.indexOf('function _bautizoAlBorde('));
  const FS = decl + fnVin(SALA, '_bautizoAlBorde') + fnVin(SALA, '_identitaBordeOGas', true) + fnVin(SALA, '_conDev');
  async function sala({ leve = {}, risposta = BAUT_OK, rete = true, qs = '', dev = 'tok-1', stok = 'st-1' } = {}) {
    const L = { fetch: [], gas: [] };
    const ctx = { BORDE_W: { QS: qs }, BORDE_SALA: { URL: 'http://b', T: 't' }, CFG: { LOCAL: 'BKS' }, APP_ID: 'sala', _salaVer: () => 'v', CHECKIN_BORDE_ON: !!leve.checkin,
      STATE: { sessionTok: stok }, deviceToken: dev, AbortController, setTimeout, clearTimeout, JSON, Object, String, encodeURIComponent,
      fetch: async (u, op) => { L.fetch.push({ u, body: JSON.parse(op.body) }); if (!rete) throw new Error('red'); return { json: async () => risposta }; },
      gasPost: async (a, b) => { L.gas.push({ a, b }); return { ok: true, token: 'tok-gas', via: 'gas' }; } };
    vm.createContext(ctx); vm.runInContext(FS + '\nSTAFF_SALA_BORDE_ON = ' + !!leve.staff + '; BAUTIZO_BORDE_ON = ' + !!leve.bautizo + '; GATE_DEVICE_V = ' + !!leve.gate + ';', ctx);
    return { ctx, L };
  }
  { const { ctx, L } = await sala({}); const r = await ctx._identitaBordeOGas(ctx._bautizoAlBorde(), 'bautizarDevice', { codigo: '1234', nombre: 'Wilbert' });
    t('S1 · leve spente: il battesimo va al GAS come ieri e il bordo NON si chiama', L.fetch.length === 0 && L.gas.length === 1 && r.via === 'gas', L); }
  { const { ctx, L } = await sala({ leve: { bautizo: true } }); await ctx._identitaBordeOGas(ctx._bautizoAlBorde(), 'bautizarDevice', { codigo: '1234', nombre: 'Wilbert' });
    t('S2 · bautizo acceso ma checkin_borde_on spento ⇒ GAS (un token solo PG sarebbe «device_desconocido» al salaCheckIn del GAS)', L.fetch.length === 0 && L.gas.length === 1, L); }
  { const { ctx, L } = await sala({ leve: { bautizo: true, checkin: true } }); const r = await ctx._identitaBordeOGas(ctx._bautizoAlBorde(), 'bautizarDevice', { codigo: '1234', nombre: 'Wilbert' });
    t('S3 · battesimo al bordo, risposta del ponte SENZA borde:true ⇒ si crede (fuente:borde), MAI rifatto sul GAS', L.fetch.length === 1 && L.gas.length === 0 && r.token === 'tok-pg', L);
    const b = L.fetch[0] && L.fetch[0].body; t('S3b · il corpo: action, local, app, codigo, nombre', b && b.action === 'bautizarDevice' && b.local === 'BKS' && b.app === 'sala' && b.codigo === '1234' && b.nombre === 'Wilbert', b); }
  { const { ctx, L } = await sala({ leve: { bautizo: true, checkin: true }, risposta: NEED }); const r = await ctx._identitaBordeOGas(true, 'bautizarDevice', {});
    t('S4 · need:gas ⇒ ripiego GAS', L.fetch.length === 1 && L.gas.length === 1 && r.via === 'gas', L); }
  { const { ctx, L } = await sala({ risposta: { ok: false, error: 'sin_gate' } }); await ctx._identitaBordeOGas(true, 'getStaffSala', {});
    t('S5 · risposta senza timbro e senza fuente (sin_gate 503) ⇒ GAS', L.gas.length === 1, L); }
  { const { ctx, L } = await sala({ rete: false }); const r = await ctx._identitaBordeOGas(true, 'getStaffSala', {});
    t('S6 · rete morta ⇒ GAS', L.gas.length === 1 && r.via === 'gas', L); }
  { const { ctx, L } = await sala({ risposta: { ok: true, staff: [{ nombre: 'Ana' }], borde: true } }); const r = await ctx._identitaBordeOGas(true, 'getStaffSala', { codigo: '1' });
    t('S7 · getStaffSala dal bordo (borde:true) ⇒ si usa, la forma è quella del GAS (staff[].nombre)', L.gas.length === 0 && r.staff[0].nombre === 'Ana', L); }
  { const { ctx, L } = await sala({ qs: '0' }); await ctx._identitaBordeOGas(true, 'getStaffSala', {});
    t('S8 · freno del telefono ?bordew=0 ⇒ GAS, il bordo non si chiama', L.fetch.length === 0 && L.gas.length === 1, L); }
  { const { ctx } = await sala({}); const o = { action: 'x' }; t('S9 · gate spento: il corpo resta quello di ieri, byte per byte', JSON.stringify(ctx._conDev(o)) === '{"action":"x"}'); }
  { const { ctx } = await sala({ leve: { gate: true } }); const o = ctx._conDev({ action: 'x' }); t('S10 · gate acceso: device_token + session_tok nel corpo', o.device_token === 'tok-1' && o.session_tok === 'st-1', o); }
  { const { ctx } = await sala({ leve: { gate: true }, stok: '' }); const o = ctx._conDev({ action: 'x' }); t('S11 · gate acceso senza session_tok (entrata dal GAS) ⇒ niente di mezzo (il bordo lo rifiuterebbe comunque)', !('device_token' in o), o); }
  { const { ctx } = await sala({ leve: { gate: true }, dev: '' }); const o = ctx._conDev({ action: 'x' }); t('S12 · gate acceso, telefono non battezzato ⇒ niente', !('device_token' in o), o); }
  { const { ctx } = await sala({ leve: { gate: true } }); const o = ctx._conDev({ action: 'revocarDevice', device_token: 'altro' }); t('S13 · un device_token già nel corpo non si sovrascrive', o.device_token === 'altro', o); }
  t('S14 · staffPost passa da _conDev', /body: JSON\.stringify\(_conDev\(Object\.assign\(\{ action, local: CFG\.LOCAL, cli_ver: _salaVer\(\), app: APP_ID \}, body \|\| \{\}, _muroCampi\(_VOLO_B\)\)\)\)/.test(SALA));
  t('S15 · _letturaBordeOGas passa da _conDev', /_conDev\(Object\.assign\(\{ action, local: CFG\.LOCAL, cli_ver: _salaVer\(\), app: APP_ID \}, bodyBorde \|\| \{\}\)\)/.test(SALA));
  { const S2 = SALA.replace("if (COLN_STAFF_BORDE_ON) staff = await _staffDalBorde();   // [2.6b] niente Google a leva accesa\n  else try { const r = await gasPost('getStaffSala'", '<<colación: il suo ripiego a leva COLN_STAFF_BORDE_ON spenta, 2.6b>>');
    t('S16 · nessun gasPost diretto resta per bautizarDevice / revocarDevice / getStaffSala (salvo il ripiego della colación sotto la sua leva)', S2 !== SALA && !/gasPost\('(bautizarDevice|revocarDevice|getStaffSala)'/.test(S2), (S2.match(/gasPost\('(bautizarDevice|revocarDevice|getStaffSala)'/g) || [])); }
  t('S17 · /salud legge le tre leve con la regola dell\'elenco di locali', /STAFF_SALA_BORDE_ON = _lv\(cercaK\(j, 'staff_sala_borde_on'\)\); BAUTIZO_BORDE_ON = _lv\(cercaK\(j, 'bautizo_borde_on'\)\); GATE_DEVICE_V = _lv\(cercaK\(j, 'gate_device_on'\)\);/.test(SALA));
  { const i = SALA.indexOf('{ const _lv = function (v)'); const src = SALA.slice(i + 2, SALA.indexOf('};', i) + 2).replace('const _lv', 'var _lv');
    const c = { String, CFG: { LOCAL: 'BKS' } }; vm.createContext(c); vm.runInContext(src, c);
    t('S18 · la regola: "1" sì · "0"/""/assente no · "BKS,RSC" sì · "RSC" no', c._lv('1') && !c._lv('0') && !c._lv('') && !c._lv(undefined) && c._lv('bks, rsc') && !c._lv('RSC')); }
  /* ── anfitriona ── */
  const FA = fnVin(ANF, '_anfLv') + fnVin(ANF, '_anfLeveIdentita', true) + fnVin(ANF, '_identitaBordeOGas', true);
  async function anf({ flags = {}, salud = true, risposta = BAUT_OK } = {}) {
    const L = { fetch: [], gas: [], ls: {} };
    const ctx = { BORDE_SALA: { URL: 'http://b', T: 't' }, CFG: { LOCAL: 'BKS' }, AbortController, setTimeout, clearTimeout, JSON, Object, String, encodeURIComponent,
      localStorage: { setItem: (k, v) => { L.ls[k] = v; } },
      fetch: async (u, op) => { if (u.endsWith('/salud')) { if (!salud) throw new Error('muto'); return { json: async () => ({ flags }) }; } L.fetch.push({ u, body: JSON.parse(op.body) }); return { json: async () => risposta }; },
      gasPost: async (a, b) => { L.gas.push({ a, b }); return { ok: true, via: 'gas' }; } };
    vm.createContext(ctx); vm.runInContext(FA, ctx); return { ctx, L };
  }
  { const { ctx, L } = await anf({ flags: { bautizo_borde_on: 'BKS', checkin_borde_on: '1', staff_sala_borde_on: '0' } }); const lv = await ctx._anfLeveIdentita();
    t('A1 · leve dal /salud: bautizo "BKS" + checkin "1" ⇒ sì · staff "0" ⇒ no · anf_checkinb ricordata', lv.bautizo === true && lv.staff === false && L.ls.anf_checkinb === '1', { lv, L }); }
  { const { ctx } = await anf({ flags: { bautizo_borde_on: '1', checkin_borde_on: '0' } }); const lv = await ctx._anfLeveIdentita();
    t('A2 · bautizo acceso ma checkin spento ⇒ battesimo al GAS', lv.bautizo === false, lv); }
  { const { ctx } = await anf({ salud: false }); const lv = await ctx._anfLeveIdentita(); t('A3 · /salud muto ⇒ tutto spento (GAS come ieri)', !lv.bautizo && !lv.staff, lv); }
  { const { ctx, L } = await anf(); const r = await ctx._identitaBordeOGas(true, 'bautizarDevice', { codigo: '1', nombre: 'Kele', rol: 'anfitriona' });
    t('A4 · battesimo al bordo senza timbro (fuente:borde) ⇒ si crede, niente GAS; app:anfitriona e rol nel corpo', L.gas.length === 0 && r.token === 'tok-pg' && L.fetch[0].body.app === 'anfitriona' && L.fetch[0].body.rol === 'anfitriona', L); }
  { const { ctx, L } = await anf({ risposta: NEED }); await ctx._identitaBordeOGas(true, 'getStaffSala', {}); t('A5 · need:gas ⇒ GAS', L.gas.length === 1, L); }
  { const { ctx, L } = await anf(); await ctx._identitaBordeOGas(false, 'getStaffSala', {}); t('A6 · leva spenta ⇒ il bordo non si chiama', L.fetch.length === 0 && L.gas.length === 1, L); }
  t('A7 · nessun gasPost diretto resta per bautizarDevice / revocarDevice / getStaffSala', !/gasPost\('(bautizarDevice|revocarDevice|getStaffSala)'/.test(ANF), (ANF.match(/gasPost\('(bautizarDevice|revocarDevice|getStaffSala)'/g) || []));
  t('A8 · la revoca prende il token PRIMA di azzerarlo', /const _tokR = deviceToken;[^\n]*\n[^\n]*device_token: _tokR/.test(ANF));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['sala', 'si crede solo a borde:true (il difetto di staffPost)', "if (j && (j.borde === true || j.fuente === 'borde')) return j;\n    } catch (e) { /* rete o timeout: la via di sempre */ }\n    finally", "if (j && j.borde === true) return j;\n    } catch (e) { /* rete o timeout: la via di sempre */ }\n    finally"],
    ['sala', 'il battesimo al bordo senza chiedere checkin_borde_on', 'return BAUTIZO_BORDE_ON && CHECKIN_BORDE_ON;', 'return BAUTIZO_BORDE_ON;'],
    ['sala', 'la leva ignorata (bussa sempre)', 'if (levaOn && BORDE_W.QS', 'if (true && BORDE_W.QS'],
    ['sala', 'freno del telefono ignorato', "levaOn && BORDE_W.QS !== '0' && BORDE_SALA", 'levaOn && BORDE_SALA'],
    ['sala', 'device nel corpo anche a gate spento', 'if (!GATE_DEVICE_V || !deviceToken', 'if (!deviceToken'],
    ['sala', 'device senza session_tok', ' || !STATE.sessionTok || !o', ' || !o'],
    ['sala', 'staffPost senza _conDev', 'body: JSON.stringify(_conDev(Object.assign({ action, local: CFG.LOCAL, cli_ver: _salaVer(), app: APP_ID }, body || {}, _muroCampi(_VOLO_B)))),', 'body: JSON.stringify(Object.assign({ action, local: CFG.LOCAL, cli_ver: _salaVer(), app: APP_ID }, body || {}, _muroCampi(_VOLO_B))),'],
    ['sala', 'il battesimo torna dritto al GAS', "_identitaBordeOGas(_bautizoAlBorde(), 'bautizarDevice'", "gasPost('bautizarDevice'"],
    ['anf', 'anfitriona: si crede solo a borde:true', "if (j && (j.borde === true || j.fuente === 'borde')) return j;", 'if (j && j.borde === true) return j;'],
    ['anf', 'anfitriona: battesimo senza checkin', "bautizo: _anfLv(f.bautizo_borde_on) && cb", 'bautizo: _anfLv(f.bautizo_borde_on)'],
    ['anf', 'anfitriona: la revoca col token già azzerato', "{ device_token: _tokR }", '{ device_token: deviceToken }'],
  ];
  let m = 0; for (const [dove, n, a, b] of M) { const S = dove === 'sala' ? SALA0 : ANF0; if (!S.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r;
    const mut = S.split(a).join(b);
    try { r = await banco(dove === 'sala' ? mut : SALA0, dove === 'anf' ? mut : ANF0, true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(SALA0, ANF0, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
