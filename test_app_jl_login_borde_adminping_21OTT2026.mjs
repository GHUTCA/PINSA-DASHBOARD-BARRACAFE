// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · il login del JL dal bordo, senza getTurnoAdmin né adminPing (21-ott)
// Richiesta: ⚙️ `ARQ V32 ADMINPING D5EBF18 COSA LO SOSTITUISCE E QUANDO MUORE` + 🎛 `V32 AUT-0725 GETCAJA E CHI FA COSA ADESSO`.
// Gira `entrar` e `_turnoAdminPorBordo` VERI in vm con fetch e gasGet finti. node test_app_jl_login_borde_adminping_21OTT2026.mjs [app_jl.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./app_jl.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = 'async ' + fnVin(SRC, '_turnoAdminPorBordo') + 'async ' + fnVin(SRC, 'entrar')
    + (SRC.includes('function _turnoCodRicorda(') ? SRC.slice(SRC.indexOf('function _turnoCodRicorda('), SRC.indexOf('\n', SRC.indexOf('function _turnoCodRicorda(')) + 1) + 'function _diaOp() { return "2026-10-23"; }\n' : '');   // [23-ott] il codice del GAS si ricorda (turno dal ponte)
  async function login({ status = 200, body, lancia = false, ping = { ok: true, user: 'Eduardo' }, gasTurno = { ok: true, turno: { abierto_by: 'Altro' } } } = {}) {
    const L = { gas: [], boot: 0, fetchBody: null };
    const el = { gPin: { value: ' 1234 ' }, gErr: { textContent: '' }, gate: { className: '' } };
    const ctx = { JSON, String, Date, setTimeout, clearTimeout, AbortController, encodeURIComponent,
      CFG: { BORDE: 'https://b', LOCAL: 'BKS', T: 't' }, LOC_PG: { BKS: 'BKS' }, STATE: { pin: null, user: null, ts: {} },
      $: (id) => el[id], sessionStorage: { setItem: () => {} }, salva: () => {}, boot: () => { L.boot++; },
      fetch: async (u, o) => { L.fetchBody = JSON.parse(o.body); if (lancia) throw new Error('rete'); return { status, json: async () => body }; },
      gasGet: async (a) => { L.gas.push(a); return a === 'adminPing' ? ping : gasTurno; } };
    vm.createContext(ctx); vm.runInContext(F, ctx); await vm.runInContext('entrar()', ctx);
    return { L, S: ctx.STATE, err: el.gErr.textContent, gate: el.gate.className };
  }
  const TB = { ok: true, fuente: 'borde', turno: { abierto_by: 'Altro', codigo: '1' }, plazas: [] };
  { const x = await login({ body: Object.assign({ user: 'Eduardo' }, TB) });
    t('A · bordo suo con user ⇒ ZERO Google, il nome è quello del PIN, non abierto_by', x.L.gas.length === 0 && x.S.user === 'Eduardo' && x.S.turno.fuente === 'borde' && x.L.boot === 1 && x.S.pin === '1234', x); }
  { const x = await login({ body: TB });
    t('A2 · la richiesta porta il PIN digitato', true && x.L.fetchBody && x.L.fetchBody.pin_jl === '1234', x.L); }
  { const x = await login({ body: TB, ping: { ok: true, user: 'Eduardo' } });
    t('B · bordo senza user (prima di d5ebf18) ⇒ solo adminPing, mai getTurnoAdmin, mai abierto_by', x.L.gas.join() === 'adminPing' && x.S.user === 'Eduardo', x); }
  { const x = await login({ body: TB, ping: { ok: false } });
    t('B2 · … e adminPing muto ⇒ abierto_by come oggi (mai peggio di ieri)', x.S.user === 'Altro' && x.L.boot === 1, x); }
  { const x = await login({ body: { ok: false, error: 'pin_invalido' } });
    t('C · PIN rifiutato dal bordo ⇒ «PIN no válido», niente Google, niente PIN in memoria', x.err === 'PIN no válido' && x.L.gas.length === 0 && x.S.pin === null && x.L.boot === 0, x); }
  { const x = await login({ body: { ok: true, scritto: false, motivo: 'gate_spento' } });
    t('D · leva spenta (gate_spento) ⇒ il cammino di oggi intero', x.L.gas.join() === 'getTurnoAdmin,adminPing' && x.S.user === 'Eduardo' && x.L.boot === 1, x); }
  { const x = await login({ status: 404, body: { ok: false } });
    t('D2 · 404 ⇒ cammino di oggi', x.L.gas[0] === 'getTurnoAdmin' && x.L.boot === 1, x); }
  { const x = await login({ lancia: true });
    t('E · rete del bordo morta ⇒ cammino di oggi (il login non resta chiuso per colpa del bordo)', x.L.gas[0] === 'getTurnoAdmin' && x.L.boot === 1, x); }
  { const x = await login({ body: { ok: true, foo: 1 } });
    t('E2 · risposta illeggibile ⇒ cammino di oggi', x.L.gas[0] === 'getTurnoAdmin' && x.L.boot === 1, x); }
  { const x = await login({ body: { ok: true, scritto: false, motivo: 'gate_spento' }, gasTurno: { ok: false, error: 'pin_invalid' } });
    t('F · ripiego col PIN sbagliato ⇒ «PIN no válido» e nessun PIN in memoria', x.err === 'PIN no válido' && x.S.pin === null && x.L.boot === 0, x); }
  { const x = await login({ status: 429, body: { ok: false, error: 'pin_jl_bloqueado', faltan_s: 290 } });
    t('K · PIN bloccato dal freno del bordo ⇒ «bloqueado · 5 min», niente GAS, niente PIN in memoria', /bloqueado/.test(x.err) && /5 min/.test(x.err) && x.L.gas.length === 0 && x.S.pin === null && x.L.boot === 0, x); }
  { const x = await login({ status: 429, body: { ok: false, error: 'pin_jl_bloqueado_apparecchio', faltan_s: 30 } });
    t('K2 · bloccato per apparecchio ⇒ lo stesso, almeno 1 min', /1 min/.test(x.err) && x.L.gas.length === 0, x); }
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['niente bordo al login', '  try { bd = await _turnoAdminPorBordo(); } catch (e) { bd = { usado: false }; }\n', ''],
    ['user da abierto_by come prima del 06-set', "STATE.user = rB.user ? String(rB.user) : '';", "STATE.user = (rB.turno && rB.turno.abierto_by) || '';"],
    ['senza ripiego adminPing', "    if (!STATE.user) { try { const who = await gasGet('adminPing', { pin: pin }); if (who && who.ok && who.user) STATE.user = who.user; } catch (e) {} }\n    if (!STATE.user) STATE.user = (rB", '    if (!STATE.user) STATE.user = (rB'],
    ['pin rifiutato va al GAS', "  if (bd.usado && bd.pinMal) { STATE.pin = null; $('gErr').textContent = 'PIN no válido'; return; }\n", ''],
    ['rete morta blocca il login', "  if (bd.usado && bd.ok", "  if (bd.usado && !bd.ok) { $('gErr').textContent = 'Sin conexión — prueba de nuevo'; return; }\n  if (bd.usado && bd.ok"],
    ['il freno del bordo si aggira (bloqueado va al GAS)', "  if (j && j.ok === false && /^pin(_jl)?_bloqueado/.test(String(j.error || ''))) return { usado: true, ok: false, bloqueado: true, faltan_s: +j.faltan_s || 0 };", ''],
    ['il PIN resta in memoria nel ripiego', "  STATE.pin = null;\n  try {\n    const r = await gasGet('getTurnoAdmin'", "  try {\n    const r = await gasGet('getTurnoAdmin'"],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
