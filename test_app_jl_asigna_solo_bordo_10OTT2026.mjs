// BANCO · CON LA LEVA DI P4 ACCESA IL JL ASSEGNA SOLO DAL VETRO NUOVO (V28 `V28 P4 JL ASSEGNA SOLO DAL VETRO NUOVO`, 10-ott) · TERZA PENNA
// La leva si legge dal /salud (`turno_escribe_pg_on`: '1' | lista CSV di locali | '0'), con la semantica di `levaTurnoEscribe` del bordo. Accesa: `asignar()` non chiama MAI `asignarPlaza` del GAS; se il sistema nuovo
// non puo (franja vecchia · lista non da Postgres · persona non risolta · bordo che non risponde) lo dice e non scrive. Spenta o senza /salud: come ieri (il GAS resta il ripiego).
// ① leva spenta: il ripiego sul GAS resta ② leva accesa: nessuna delle cause arriva al GAS, ognuna ha il SUO messaggio, la riga «guardando…» si toglie ③ il percorso felice non cambia ④ la semantica della lista di locali
// ⑤ il timeout (gia senza GAS) non cambia ⑥ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'app_jl.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 320))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); const a = SRC.slice(Math.max(0, i - 6), i) === 'async ' ? i - 6 : i; return SRC.slice(a, SRC.indexOf('\n}\n', i) + 3); };
const STAFF = [{ persona_id: 'p-isa', nombre: 'Isa' }, { persona_id: 'p-leo', nombre: 'Leo' }];
function mondo(SRC, o) {
  const toasts = [], fetches = [], gas = []; let giro = 0; const els = { asMesero: { value: o.mesero || 'Isa' }, asPlaza: { value: o.plaza || 'P1' }, asFranja: { value: o.franja == null ? '19:00-23:00' : o.franja }, asAgregar: { checked: false } };
  const ctx = { JSON, Math, Date, String, Number, Object, Array, Promise, console, encodeURIComponent, AbortController, setTimeout: (fn) => 0, clearTimeout: () => {}, crypto: { randomUUID: () => 'abcd1234-0000-0000-0000-000000000000' },
    CFG: { BORDE: 'https://b.test', T: 'tok', LOCAL: o.local || 'BKS' }, LOC_PG: { BKS: 'BKS', RIESCO: 'RSC' }, STATE: { pin: '4321', user: 'Pedro', salud: o.salud === undefined ? null : o.salud, turno: { asignaciones: [] } },
    _uidGesto: () => 'g-1', _STAFF_JL_FONTE: o.fonte === undefined ? 'bordo' : o.fonte, _STAFF_JL: o.staff || STAFF,
    $: (id) => els[id] || null, toast: (k, m) => toasts.push([k, m]), pintaTab() {}, giroTurno: () => { giro++; }, tab() {},
    gasPost: async (a, b) => { gas.push([a, b]); return { ok: true }; },
    fetch: async (url, opt) => { fetches.push([url, opt]); const r = o.fetch || { body: { ok: true, scritto: true } }; if (r instanceof Error) throw r; return { status: r.status || 200, ok: (r.status || 200) < 400, json: async () => r.body }; } };
  vm.createContext(ctx);
  vm.runInContext(['turnoEscribeOn', '_porQueNoBordo', '_asignarPorBordo', 'asignar'].map((n) => fnDe(SRC, n)).join('\n') + '\nconst _ERR_TURNO = ' + SRC.match(/const _ERR_TURNO = (\{[\s\S]*?\});\n/)[1] + ';\nthis.F = { asignar, turnoEscribeOn };', ctx);
  return { ctx, toasts, fetches, gas, giro: () => giro };
}
const SAL = (v) => ({ ok: true, flags: { turno_escribe_pg_on: v } });
async function banco(SRC) {
  // ① leva spenta / sin salud: come ieri
  for (const [n, sal] of [['senza /salud', null], ['"0"', SAL('0')], ['assente dal /salud', { ok: true }]]) {
    const m = mondo(SRC, { salud: sal, franja: '19–cierre' }); await m.ctx.F.asignar();
    t('① leva spenta (' + n + '): la franja vecchia va al GAS come ieri', m.gas.length === 1 && m.gas[0][0] === 'asignarPlaza' && m.fetches.length === 0, [m.gas.length, m.toasts]); }
  // ② leva accesa: le cause, ognuna col suo messaggio, MAI il GAS
  { const m = mondo(SRC, { salud: SAL('BKS'), franja: '19–cierre' }); await m.ctx.F.asignar();
    t('② franja vecchia: «formato antiguo» con la franja, MAI il GAS, niente fetch, la riga «guardando…» si toglie', m.gas.length === 0 && m.fetches.length === 0 && m.toasts.length === 1 && m.toasts[0][0] === 'err' && /«19–cierre» está en un formato antiguo/.test(m.toasts[0][1]) && /No se escribió nada/.test(m.toasts[0][1]) && m.ctx.STATE.turno.asignaciones.length === 0, [m.toasts, m.gas.length]); }
  { const m = mondo(SRC, { salud: SAL('1'), fonte: 'gas' }); await m.ctx.F.asignar();
    t('② bis lista del GAS (TURNO_PG_ON spento o Postgres muto): la CAUSA vera «viene del sistema viejo», MAI il GAS (EL GIRO ⑤)', m.gas.length === 0 && /todavía viene del sistema viejo/.test(m.toasts[0][1]) && !/No encuentro/.test(m.toasts[0][1]) && /No se escribió nada/.test(m.toasts[0][1]), [m.toasts, m.gas.length]); }
  { const m = mondo(SRC, { salud: SAL('BKS'), mesero: 'Nadie' }); await m.ctx.F.asignar();
    t('② ter nome non risolto: stesso messaggio, MAI il GAS', m.gas.length === 0 && m.fetches.length === 0 && /No encuentro a esa persona/.test(m.toasts[0][1]), [m.toasts, m.gas.length]); }
  { const m = mondo(SRC, { salud: SAL('BKS'), fetch: { status: 404, body: { ok: false, error: 'ruta_apagada' } } }); await m.ctx.F.asignar();
    t('② quater il bordo risponde 404 al primo gesto (la leva si e spenta nel frattempo): «no respondió», MAI il GAS', m.gas.length === 0 && /El sistema nuevo no respondió. Reintenta en un minuto. No se escribió nada/.test(m.toasts[0][1]) && m.ctx.STATE.turno.asignaciones.length === 0, [m.toasts, m.gas.length]); }
  { const m = mondo(SRC, { salud: SAL('BKS'), fetch: { status: 503, body: {} } }); await m.ctx.F.asignar();
    t('② quinto 5xx al primo gesto: stesso, MAI il GAS', m.gas.length === 0 && /no respondió/.test(m.toasts[0][1]), [m.toasts, m.gas.length]); }
  { const m = mondo(SRC, { salud: SAL('BKS') }); m.ctx.STATE.turno.asignaciones = [{ plaza: 'P1', franja: '19–cierre', mesero: 'Leo' }]; m.ctx.$('asFranja').value = '19–cierre'; await m.ctx.F.asignar();
    t('② sesto il messaggio dice chi RESTA nella plaza (come prima)', /P1 sigue con Leo/.test(m.toasts[0][1]), m.toasts); }
  // ③ il percorso felice
  { const m = mondo(SRC, { salud: SAL('BKS') }); await m.ctx.F.asignar();
    t('③ percorso felice: un fetch a /turno/gesto, nessun GAS, «✓ P1: Isa», giroTurno', m.fetches.length === 1 && /\/turno\/gesto\/BKS$/.test(m.fetches[0][0]) && m.gas.length === 0 && m.toasts.some((x) => x[0] === 'ok' && /P1: Isa/.test(x[1])) && m.giro() === 1, [m.fetches.length, m.toasts]); }
  // ④ la semantica della leva
  const on = (v, local) => mondo(SRC, { salud: SAL(v), local }).ctx.F.turnoEscribeOn();
  t('④ "1" = tutti · "bks" in minuscolo · lista "BKS,RSC" => acceso per BKS', on('1') === true && on('bks') === true && on('BKS,RSC') === true && on(' RSC , BKS ') === true);
  t('④ bis "RSC" => spento per BKS · "" · "0" · "false" => spento · "TRUE" => acceso', on('RSC') === false && on('') === false && on('0') === false && on('false') === false && on('TRUE') === true);
  t('④ ter il locale giusto: RIESCO si mappa a RSC', on('RSC', 'RIESCO') === true && on('BKS', 'RIESCO') === false);
  { const m = mondo(SRC, { salud: SAL('RSC'), franja: '19–cierre' }); await m.ctx.F.asignar();
    t('④ quater leva accesa SOLO per un altro locale: il GAS resta il ripiego di questo', m.gas.length === 1, m.gas.length); }
  // ⑤ il timeout non cambia
  { const m = mondo(SRC, { salud: SAL('BKS'), fetch: new Error('abort') }); await m.ctx.F.asignar();
    t('⑤ timeout/rete: «puede que SÍ», MAI il GAS (come prima)', m.gas.length === 0 && m.toasts[0][0] === 'warn' && /puede que SÍ/.test(m.toasts[0][1]), m.toasts); }
  t('versione >= 1.38.1', /app_jl v1\.(38\.[1-9]|39\.\d|[4-9]\d\.\d)/.test(SRC));
}
await banco(SRC0);
const mut = async (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; try { await banco(SRC0.replace(da, () => a)); } catch (e) { ko++; } muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
await mut('la leva accesa non chiude il GAS', "if (turnoEscribeOn()) { togli();", "if (false) { togli();");
await mut('il GAS chiuso anche a leva spenta', "if (turnoEscribeOn()) { togli();", "if (true) { togli();");
await mut('senza /salud la leva e accesa', "(m ? m[1] : '0')", "(m ? m[1] : '1')");
await mut('"1" non vale per tutti', "if (v === '1' || v === 'TRUE') return true;", "if (v === 'TRUE') return true;");
await mut('la lista ignora il locale', ".indexOf(loc) >= 0;", ".length >= 0;");
await mut('il locale non si mappa a PG', "String(LOC_PG[CFG.LOCAL] || CFG.LOCAL || '')", "String(CFG.LOCAL || '')");
await mut('franja vecchia senza motivo', "[0-5][0-9]$/.test(f)) return { usado: false, por: 'franja_vieja' };", "[0-5][0-9]$/.test(f)) return { usado: false };");
await mut('il bordo che non risponde senza motivo', "if (i === 0) return { usado: false, por: 'bordo_no_responde' };", "if (i === 0) return { usado: false };");
await mut('lista_gas detto come «no encuentro»', "if (por === 'lista_gas') return", "if (false) return");
await mut('la riga guardando non si toglie', "if (turnoEscribeOn()) { togli();", "if (turnoEscribeOn()) { ");
await mut('il messaggio perde «no se escribió»', "Reintenta en un minuto. No se escribió nada", "Reintenta en un minuto");
await mut('chi resta nella plaza non si dice', "(_prima ? ' · ' + p + ' sigue con ' + _prima : '')); return; }   // [P4]", "''); return; }   // [P4]");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
