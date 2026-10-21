// BANCO · IL JL APRE IL TURNO DAL BORDO (1.2 · P2 · AUT-0662) · TERZA PENNA
// Il contratto e quello di 🎛 BKP (`BKP 1.2 P2 CONTRATTO TURNO APERTURA`, 14:27): POST /turno/apertura/<local> {accion:'abrir', uid_gesto, nombre, pin_jl}; risposte: nuevo {codigo, ya_abierto:false},
// gia aperto {ya_abierto:true, abierto_por}, leva spenta {ok:true, scritto:false, motivo:'gate_spento'}, errori {ok:false, error:'pin_invalido'|'pin_bloqueado'+faltan_s | 400 accion_invalida…}.
// ⚠️ Il bordo vero NON ESISTE ancora: qui c'e uno STUB scritto dal contratto. Quando BKP consegna il codice, questo banco si rifa contro il DO vero (resta da fare, dichiarato).
// ① aperto dal bordo: il codice del bordo, il corpo giusto, il GAS NON chiamato ② ya_abierto: lo STESSO codice, detto ③ leva spenta / rotta assente / token => ripiego sul GAS ④ errori definitivi (PIN, bloqueado, 400): detti, MAI il GAS
// ⑤ timeout / rete caduta / 5xx / risposta illeggibile => «puede que si», MAI il GAS, niente giroTurno ⑥ un uid nuovo a ogni tocco ⑦ annullo al confirm ⑧ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'app_jl.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 320))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); const a = SRC.slice(Math.max(0, i - 6), i) === 'async ' ? i - 6 : i; return SRC.slice(a, SRC.indexOf('\n}\n', i) + 3); };
function mondo(SRC, o) {
  const toasts = [], fetches = [], gas = []; let giro = 0, uidN = 0;
  const ctx = { JSON, Math, Date, String, Number, Object, Array, Promise, console, encodeURIComponent, AbortController, setTimeout, clearTimeout,
    CFG: { BORDE: 'https://b.test', T: 'tok', LOCAL: 'BKS' }, LOC_PG: { BKS: 'BKS', RIESCO: 'RSC' }, STATE: { pin: '4321', user: 'Pedro' },
    cjSaldosGate: async () => ({ bloquea: false, nosabe: false, mesas: [] }), cjSaldosAviso: () => {}, confirm: () => o.confirm !== false, toast: (k, m) => toasts.push([k, m]), giroTurno: () => { giro++; }, _uidGesto: () => 'uid-' + (++uidN),
    gasPost: async (a, b) => { gas.push([a, b]); return o.gas || { ok: true, codigo: '9999' }; },
    fetch: async (url, opt) => { fetches.push([url, opt]); const r = o.fetch; if (r instanceof Error) throw r; return { status: r.status || 200, ok: (r.status || 200) < 400, json: async () => { if (r.illeggibile) throw new Error('x'); return r.body; } }; } };
  vm.createContext(ctx);
  vm.runInContext(['_aperturaPorBordo', 'abrirT'].map((n) => fnDe(SRC, n)).join('\n') + '\nconst _ERR_APERTURA = ' + SRC.match(/const _ERR_APERTURA = (\{[^\n]*\});/)[1] + ';\nthis.F = { abrirT };', ctx);
  return { ctx, toasts, fetches, gas, giro: () => giro };
}
const corpo = (m) => JSON.parse(m.fetches[0][1].body);
async function banco(SRC) {
  { const m = mondo(SRC, { fetch: { body: { ok: true, accion: 'abrir', abierto: true, ya_abierto: false, codigo: '1234', fecha_op: '2026-10-13', abierto_por: 'Pedro', ts_apertura: 1, uid_gesto: 'uid-1', pg: 'accodato' } } }); await m.ctx.F.abrirT();
    t('① aperto dal bordo: «código 1234», giroTurno, il GAS NON chiamato', m.toasts.length === 1 && m.toasts[0][0] === 'ok' && /código 1234/.test(m.toasts[0][1]) && !/ya estaba/.test(m.toasts[0][1]) && m.gas.length === 0 && m.giro() === 1, [m.toasts, m.gas.length]);
    t('① bis la rotta, il token e il corpo del contratto', m.fetches[0][0] === 'https://b.test/turno/apertura/BKS' && m.fetches[0][1].method === 'POST' && m.fetches[0][1].headers['x-borde-token'] === 'tok' && JSON.stringify(corpo(m)) === JSON.stringify({ accion: 'abrir', uid_gesto: 'uid-1', nombre: 'Pedro', pin_jl: '4321' }), [m.fetches[0][0], corpo(m)]); }
  { const m = mondo(SRC, { fetch: { body: { ok: true, abierto: true, ya_abierto: true, codigo: '1234', abierto_por: 'Isa', ts_apertura: 1 } } }); await m.ctx.F.abrirT();
    t('② ya_abierto: lo STESSO codice e chi lo aveva aperto, senza GAS', /código 1234 \(ya estaba · abierto por Isa\)/.test(m.toasts[0][1]) && m.gas.length === 0 && m.giro() === 1, m.toasts); }
  { const m = mondo(SRC, { fetch: { body: { ok: true, scritto: false, motivo: 'gate_spento' } } }); await m.ctx.F.abrirT();
    t('③ leva spenta: ripiego sul GAS (abrirTurno col PIN) e il suo codice', m.gas.length === 1 && m.gas[0][0] === 'abrirTurno' && m.gas[0][1].pin === '4321' && /código 9999/.test(m.toasts[0][1]) && m.giro() === 1, [m.gas, m.toasts]); }
  for (const st of [404, 403]) { const m = mondo(SRC, { fetch: { status: st, body: { ok: false, error: 'x' } } }); await m.ctx.F.abrirT();
    t('③ bis HTTP ' + st + ' (rotta assente / token): ripiego sul GAS', m.gas.length === 1 && /código 9999/.test(m.toasts[0][1]), [m.gas.length, m.toasts]); }
  { const m = mondo(SRC, { fetch: { body: { ok: false, error: 'pin_invalido' } } }); await m.ctx.F.abrirT();
    t('④ PIN sbagliato: «PIN incorrecto», MAI il GAS, niente giroTurno', m.toasts[0][0] === 'err' && /PIN incorrecto/.test(m.toasts[0][1]) && m.gas.length === 0 && m.giro() === 0, [m.toasts, m.gas.length]); }
  { const m = mondo(SRC, { fetch: { body: { ok: false, error: 'pin_bloqueado', faltan_s: 125 } } }); await m.ctx.F.abrirT();
    t('④ bis PIN bloccato: «espera 3 min», MAI il GAS', /espera 3 min/.test(m.toasts[0][1]) && m.gas.length === 0, m.toasts); }
  for (const [nome, extra, atteso] of [['pin_jl_bloqueado', { faltan_s: 300 }, /espera 5 min/], ['pin_jl_bloqueado_apparecchio', { faltan_s: 61 }, /espera 2 min/], ['pin_jl_invalido', {}, /PIN incorrecto/], ['pin_jl_requerido', {}, /Falta el PIN/], ['pin_jl_no_configurado', {}, /no tiene PIN de JL/]]) {
    const m = mondo(SRC, { fetch: { body: Object.assign({ ok: false, error: nome }, extra) } }); await m.ctx.F.abrirT();
    t('④ nomi del freno VERO (EL GIRO): ' + nome + ' => parole (con i minuti), MAI il nome crudo, MAI il GAS', m.toasts[0][0] === 'err' && atteso.test(m.toasts[0][1]) && !/pin_jl/.test(m.toasts[0][1]) && m.gas.length === 0, m.toasts); }
  { const m = mondo(SRC, { fetch: { status: 400, body: { ok: false, error: 'accion_invalida' } } }); await m.ctx.F.abrirT();
    t('④ ter HTTP 400 (errore del gesto): detto, MAI il GAS', m.toasts[0][0] === 'err' && /Acción no válida/.test(m.toasts[0][1]) && m.gas.length === 0, [m.toasts, m.gas.length]); }
  for (const [n, fe] of [['timeout/rete', new Error('abort')], ['5xx', { status: 503, body: { ok: false } }], ['5xx senza corpo', { status: 502, illeggibile: true }], ['risposta senza codice', { body: { ok: true } }]]) {
    const m = mondo(SRC, { fetch: fe }); await m.ctx.F.abrirT();
    t('⑤ ' + n + ': «puede que SÍ», MAI il GAS (un secondo codice lascerebbe il JL con quello sbagliato), niente giroTurno', m.toasts.length === 1 && m.toasts[0][0] === 'warn' && /puede que el turno SÍ/.test(m.toasts[0][1]) && m.gas.length === 0 && m.giro() === 0, [n, m.toasts, m.gas.length]); }
  { const m = mondo(SRC, { fetch: { body: { ok: true, ya_abierto: false, codigo: '1', abierto_por: 'P' } } }); await m.ctx.F.abrirT(); await m.ctx.F.abrirT();
    t('⑥ un uid NUOVO a ogni tocco', JSON.parse(m.fetches[0][1].body).uid_gesto === 'uid-1' && JSON.parse(m.fetches[1][1].body).uid_gesto === 'uid-2'); }
  { const m = mondo(SRC, { confirm: false, fetch: { body: {} } }); await m.ctx.F.abrirT();
    t('⑦ «No» al confirm: niente fetch, niente GAS, niente toast', m.fetches.length === 0 && m.gas.length === 0 && m.toasts.length === 0); }
  { const m = mondo(SRC, { fetch: { body: { ok: true, ya_abierto: false, codigo: '7777' } } }); m.ctx.LOC_PG = { BKS: 'BKS' }; m.ctx.CFG.LOCAL = 'OTRO'; await m.ctx.F.abrirT();
    t('locale non mappato: usa il nome del locale (come fa la sezione turno)', /\/turno\/apertura\/OTRO$/.test(m.fetches[0][0])); }
  t('versione >= 1.38.0', /app_jl v1\.(3[89]|[4-9]\d)\.\d/.test(SRC));
}
await banco(SRC0);
/* [21-ott · TERZA V32] il mutante si applica DA `_aperturaPorBordo` in poi: dalla v1.42.1 le stesse righe (404/403, gate_spento, pin_jl) vivono anche in
   `_turnoAdminPorBordo` (1.15), che sta PRIMA nel file — e un replace sulla prima occorrenza mutava quella, lasciando vivo il mutante qui. */
const I0 = SRC0.indexOf('const _ERR_APERTURA = ');   // subito prima di _aperturaPorBordo, e dopo _turnoAdminPorBordo
const mut = async (nome, da, a) => { if (!SRC0.slice(I0).includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; try { await banco(SRC0.slice(0, I0) + SRC0.slice(I0).replace(da, () => a)); } catch (e) { ko++; } muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
await mut('il bordo non si prova (sempre GAS)', "const bd = await _aperturaPorBordo(_uidGesto());", "const bd = { usado: false };");
await mut('timeout ripiega sul GAS', "clearTimeout(to); return { usado: true, ok: false, dudoso: true }; }   // timeout", "clearTimeout(to); return { usado: false }; }   // timeout");
await mut('5xx ripiega sul GAS', "if (!r.ok || !j || j.ok !== true || !j.codigo) return { usado: true, ok: false, dudoso: true };", "if (!r.ok || !j || j.ok !== true || !j.codigo) return { usado: false };");
await mut('un errore di PIN ripiega sul GAS', "if (j && j.ok === false && j.error) return { usado: true,", "if (false) return { usado: true,");
await mut('gate_spento non ripiega', "if (j && j.ok === true && j.scritto === false && j.motivo === 'gate_spento') return { usado: false };", "");
await mut('404 non ripiega', "if (r.status === 404 || r.status === 403) return { usado: false };", "");
await mut('ya_abierto non si dice', "(bd.ya ? ' (ya estaba' + (bd.por ? ' · abierto por ' + bd.por : '') + ')' : '')", "''");
await mut('il PIN non viaggia', "pin_jl: STATE.pin }), signal", "}), signal");
await mut('uid fisso (stesso per ogni tocco)', "_aperturaPorBordo(_uidGesto())", "_aperturaPorBordo('uid-1')");
await mut('senza giroTurno dopo l\'apertura', "(bd.por ? ' · abierto por ' + bd.por : '') + ')' : '')); giroTurno(); return; }", "(bd.por ? ' · abierto por ' + bd.por : '') + ')' : '')); return; }");
await mut('il token del bordo manca', "'x-borde-token': CFG.T },\n      body: JSON.stringify({ accion: 'abrir'", "},\n      body: JSON.stringify({ accion: 'abrir'");
await mut('il freno vero (pin_jl_bloqueado) non da i minuti', "/^pin(_jl)?_bloqueado/.test(String(j.error))", "j.error === 'pin_bloqueado'");
await mut('pin_jl_requerido crudo', "pin_jl_requerido: 'Falta el PIN', ", "");
await mut('il blocco del PIN senza minuti', "Math.ceil(bd.bloqueado / 60) + ' min'", "bd.bloqueado + ' min'");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
