// BANCO di «Guardar» che passa dal bordo (6.3 fetta B, lato app): estrae le funzioni VERE da app_jl.html (blocco A + _asignarPorBordo + asignar) e le esegue con fetch/gasPost finti.
// 👥 RRHH V23 · gio 08-ott-2026. ⚠️ Scritto dall'autrice: NON è la seconda testa.   USO: node test_app_jl_gesto_08OTT2026.mjs   [APP_JL_HTML=<file> per i mutanti]
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const QUI = dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/') + '/';
const HTML = readFileSync(process.env.APP_JL_HTML || (QUI + 'app_jl.html'), 'utf8').replace(/\r\n/g, '\n');
function fn(nome, asincrona) {
  const k = (asincrona ? 'async function ' : 'function ') + nome + '(';
  const i = HTML.indexOf(k); if (i < 0) { console.log('ROSSO 0.00 manca ' + nome); process.exit(1); }
  let j = HTML.indexOf('{', i), d = 0; for (;; j++) { if (HTML[j] === '{') d++; else if (HTML[j] === '}') { d--; if (d === 0) break; } }
  return HTML.slice(i, j + 1);
}
const a = HTML.indexOf('/* ═══ [08-ott · 👥 RRHH · 6.3 fetta A]'), b = HTML.indexOf('/* [v1.32.2', a);
const A = HTML.slice(a, b);
const c = HTML.indexOf('const _ERR_TURNO'); const d0 = HTML.indexOf('async function _asignarPorBordo');
if (a < 0 || c < 0 || d0 < 0) { console.log('ROSSO 0.00 i blocchi 6.3 non ci sono in app_jl.html'); process.exit(1); }
const CODICE = A + '\n' + fn('_uidGesto') + '\n' + HTML.slice(c, HTML.indexOf('\n', HTML.indexOf('};', c)) + 1) + '\n' + fn('_asignarPorBordo', true) + '\n' + fn('asignar', true);
let ko = 0, n = 0; const rossi = [];
const chk = (id, ok, msg) => { n++; if (!ok) { ko++; rossi.push(id); console.log('  ROSSO', id, msg || ''); } };

const STAFF = [{ nombre: 'Ray', persona_id: 'p-ray', cargo: 'mesero' }, { nombre: 'Jurley', persona_id: 'p-jur', cargo: 'mesero' }, { nombre: 'Nacho', persona_id: 'p-nac', cargo: 'jefe local' }];
function mondo({ loc = 'BKS', fonte = 'bordo', asignaciones = [], agregar = false, bordo, gas, mesero = 'Ray', plaza = 'P1', franja = '19:00-03:00' }) {
  const W = { fetch: [], gas: [], toasts: [], timers: [], giro: 0, tab: 0, pinta: 0 };
  const campos = { asMesero: { value: mesero }, asPlaza: { value: plaza }, asFranja: { value: franja }, asAgregar: { checked: agregar } };
  const sb = { STATE: { pin: '2222', turno: { asignaciones: asignaciones.map((x) => Object.assign({}, x)) } }, TAB: 1, CFG: { LOCAL: loc, BORDE: 'https://borde.test', T: 'tok-lettura' },
    $: (id) => campos[id], toast: (t, m) => W.toasts.push(t + ':' + m), pintaTab: () => { W.pinta++; }, tab: () => { W.tab++; }, giroTurno: () => { W.giro++; },
    gasPost: async (verbo, p) => { W.gas.push({ verbo, p }); const r = await gas(verbo, p); if (r instanceof Error) throw r; return r; },
    fetch: async (url, init) => { W.fetch.push({ url, init, body: init && init.body ? JSON.parse(init.body) : null }); const r = await bordo(url, init, W.fetch.length); if (r instanceof Error) throw r;
      return { ok: r.http === undefined ? true : r.http < 400, status: r.http || 200, json: async () => (r.cuerpo === undefined ? {} : r.cuerpo) }; },
    AbortController, setTimeout: (f, ms) => { W.timers.push(ms); return 1; }, clearTimeout, encodeURIComponent, Date, Math, console, JSON, Array, Object, Promise, crypto: globalThis.crypto };
  vm.createContext(sb);
  vm.runInContext(CODICE + `\n;_STAFF_JL = ${JSON.stringify(STAFF)}; _STAFF_JL_FONTE = ${JSON.stringify(fonte)}; globalThis.__A = { asignar, _asignarPorBordo };`, sb);
  return { W, api: sb.__A, sb };
}
const OK = { cuerpo: { ok: true, scritto: true } };
const GAS_OK = async () => ({ ok: true });

// 1 · il percorso felice
let m = mondo({ bordo: async () => OK, gas: GAS_OK }); await m.api.asignar();
chk('1.01', m.W.fetch.length === 1 && m.W.gas.length === 0 && m.W.giro === 1, 'UN gesto al bordo, il GAS NON chiamato, il turno si rilegge');
const g1 = m.W.fetch[0];
chk('1.02', g1.url === 'https://borde.test/turno/gesto/BKS' && g1.init.method === 'POST' && g1.init.headers['x-borde-token'] === 'tok-lettura' && !/[?&]t=/.test(g1.url), 'POST /turno/gesto/BKS con il segreto in HEADER, mai in ?t=');
chk('1.03', g1.body.accion === 'asignar' && g1.body.persona_id === 'p-ray' && g1.body.plaza === 'P1' && g1.body.franja === '19:00-03:00' && g1.body.pin_jl === '2222' && !('sustituye_persona_id' in g1.body), 'persona_id (non il nome), plaza, franja, PIN del JL; nessuna sostituzione');
chk('1.04', typeof g1.body.uid_gesto === 'string' && g1.body.uid_gesto.length >= 8, 'l\'uid_gesto lo conia il TELEFONO');
chk('1.05', m.W.toasts.some((t) => t.startsWith('ok:')), 'toast di successo');
m = mondo({ loc: 'RIESCO', bordo: async () => OK, gas: GAS_OK }); await m.api.asignar();
chk('1.06', m.W.fetch[0].url.endsWith('/turno/gesto/RSC'), 'RIESCO → RSC');

// 2 · cambiare e agregare
const PREV = (n) => [{ plaza: 'P1', franja: '19:00-03:00', mesero: n }];
m = mondo({ asignaciones: PREV('Jurley'), bordo: async () => OK, gas: GAS_OK }); await m.api.asignar();
chk('2.01', m.W.fetch.length === 1 && m.W.fetch[0].body.accion === 'asignar' && m.W.fetch[0].body.sustituye_persona_id === 'p-jur' && /cambio/.test(m.W.fetch[0].body.motivo), 'Guardar su una plaza già di Jurley = UNA asignar con sustituye_persona_id (e un motivo)');
m = mondo({ asignaciones: PREV('Jurley,Nacho'), bordo: async () => OK, gas: GAS_OK }); await m.api.asignar();
chk('2.02', m.W.fetch.length === 2 && m.W.fetch[0].body.sustituye_persona_id === 'p-jur' && m.W.fetch[1].body.accion === 'quitar' && m.W.fetch[1].body.persona_id === 'p-nac', 'due persone già in plaza: una sostituzione + un quitar');
chk('2.03', m.W.fetch[0].body.uid_gesto !== m.W.fetch[1].body.uid_gesto, 'ogni gesto ha il SUO uid');
m = mondo({ asignaciones: PREV('Jurley'), agregar: true, bordo: async () => OK, gas: GAS_OK }); await m.api.asignar();
chk('2.04', m.W.fetch.length === 1 && !('sustituye_persona_id' in m.W.fetch[0].body) && m.W.fetch[0].body.accion === 'asignar', '«＋ agregar»: aggiunge Ray SENZA togliere Jurley (due persone nella plaza)');
m = mondo({ asignaciones: PREV('Ray'), bordo: async () => OK, gas: GAS_OK }); await m.api.asignar();
chk('2.05', m.W.fetch.length === 0 && m.W.gas.length === 0 && m.W.toasts.some((t) => /ya estaba/.test(t)), 'Ray è già lì: nessun gesto, lo dice');

// 3 · il ripiego sul GAS: SOLO quando è chiaro che il bordo non c'è
m = mondo({ fonte: 'gas', bordo: async () => OK, gas: GAS_OK }); await m.api.asignar();
chk('3.01', m.W.fetch.length === 0 && m.W.gas.length === 1 && m.W.gas[0].verbo === 'asignarPlaza', 'la lista viene dal GAS (niente persona_id): Guardar fa il GAS di sempre');
m = mondo({ franja: '19–cierre', bordo: async () => OK, gas: GAS_OK }); await m.api.asignar();
chk('3.02', m.W.fetch.length === 0 && m.W.gas.length === 1, 'una franja «vecchia» non HH:MM-HH:MM: la gestisce il GAS');
m = mondo({ asignaciones: PREV('Fantasma'), bordo: async () => OK, gas: GAS_OK }); await m.api.asignar();
chk('3.03', m.W.fetch.length === 0 && m.W.gas.length === 1, 'in plaza c\'è un nome che non so risolvere: lo sostituisce il GAS (non lascio un fantasma)');
m = mondo({ bordo: async () => ({ cuerpo: { ok: true, scritto: false, motivo: 'gate_spento' } }), gas: GAS_OK }); await m.api.asignar();
chk('3.04', m.W.fetch.length === 1 && m.W.gas.length === 1, 'leva spenta («gate_spento»): si ripiega sul GAS');
m = mondo({ bordo: async () => ({ http: 404, cuerpo: { ok: false, error: 'ruta_apagada' } }), gas: GAS_OK }); await m.api.asignar();
chk('3.05', m.W.gas.length === 1, 'rotta spenta (404): GAS');
m = mondo({ bordo: async () => ({ http: 503, cuerpo: { ok: false, error: 'sin_postgres' } }), gas: GAS_OK }); await m.api.asignar();
chk('3.06', m.W.gas.length === 1, 'Postgres giù (503): GAS');

// 4 · gli errori veri non si scavalcano col GAS
m = mondo({ bordo: async () => ({ cuerpo: { ok: false, error: 'pin_jl_invalido' } }), gas: GAS_OK }); await m.api.asignar();
chk('4.01', m.W.gas.length === 0 && m.W.toasts.some((t) => /err:.*PIN incorrecto/.test(t)), 'PIN sbagliato: «PIN incorrecto», e NON si riprova col GAS (sarebbe un secondo tentativo)');
m = mondo({ bordo: async () => ({ cuerpo: { ok: false, error: 'pin_jl_bloqueado', faltan_s: 540 } }), gas: GAS_OK }); await m.api.asignar();
chk('4.02', m.W.gas.length === 0 && m.W.toasts.some((t) => /espera 9 min/.test(t)), 'bloccato: «espera 9 min»');
m = mondo({ bordo: async () => ({ cuerpo: { ok: false, error: 'persona_fuera_del_locale' } }), gas: GAS_OK }); await m.api.asignar();
chk('4.03', m.W.gas.length === 0 && m.W.toasts.some((t) => /no está asignada a este local/.test(t)), 'persona di un altro locale: lo dice');
chk('4.04', m.sb.STATE.turno.asignaciones.every((x) => !x._pendiente), 'e la riga «guardando…» ottimista SI TOGLIE');

// 5 · timeout / rete caduta: NIENTE GAS (il bordo potrebbe aver scritto)
m = mondo({ bordo: async () => new Error('failed to fetch'), gas: GAS_OK }); await m.api.asignar();
chk('5.01', m.W.gas.length === 0, 'rete caduta/timeout: NON si ripiega sul GAS');
chk('5.02', m.W.toasts.some((t) => /warn:.*puede que SÍ/.test(t)) && m.W.timers.includes(30000), '«puede que sí se guardó» + verifica fra 30 s');
// 6 · a metà
m = mondo({ asignaciones: PREV('Jurley,Nacho'), bordo: async (u, i, k) => (k === 1 ? OK : { http: 404, cuerpo: { ok: false } }), gas: GAS_OK }); await m.api.asignar();
chk('6.01', m.W.gas.length === 0 && m.W.toasts.some((t) => /se cortó a la mitad/.test(t)), 'se il primo gesto passa e il secondo no: lo DICE, non finge e non ripiega');
// 7 · statico
chk('7.01', /id="asAgregar"/.test(HTML) && /_STAFF_JL_FONTE === 'bordo' \? '<label/.test(HTML), 'la casella «＋ agregar» c\'è, e solo quando la lista viene da Postgres');
chk('7.02', !/turno\/gesto[^\n]*\?t=/.test(HTML), 'nessun ?t= sulla rotta del gesto');

console.log(`\nBANCO APP JL GESTO 6.3 B · ${n - ko}/${n} verdi` + (rossi.length ? ' · ROSSI: ' + rossi.join(' ') : ''));
process.exit(ko ? 1 : 0);
