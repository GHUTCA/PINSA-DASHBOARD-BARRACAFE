// BANCO della lista meseros dell'app del JL (6.3 fetta A): estrae le funzioni VERE da app_jl.html e le esegue in una sandbox con fetch/gasPost finti.
// 👥 RRHH V23 · gio 08-ott-2026. ⚠️ Scritto dall'autrice della modifica: NON è la seconda testa.   USO: node test_app_jl_staff_08OTT2026.mjs   [APP_JL_HTML=<file> per i mutanti]
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const QUI = dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/') + '/';
const HTML = readFileSync(process.env.APP_JL_HTML || (QUI + 'app_jl.html'), 'utf8').replace(/\r\n/g, '\n');
const a = HTML.indexOf('/* ═══ [08-ott · 👥 RRHH · 6.3 fetta A]'); const b = HTML.indexOf('/* [v1.32.2', a);
if (a < 0 || b < 0) { console.log('ROSSO 0.00 il blocco 6.3 fetta A non c\'è in app_jl.html'); process.exit(1); }
const CODICE = HTML.slice(a, b);
let ko = 0, n = 0; const rossi = [];
const chk = (id, ok, msg) => { n++; if (!ok) { ko++; rossi.push(id); console.log('  ROSSO', id, msg || ''); } };

function mondo({ loc = 'BKS', pin = '1111', bordo, gas }) {
  const log = { fetch: [], gas: 0, pinta: 0 };
  const sb = {
    STATE: { pin }, TAB: 1, CFG: { LOCAL: loc, BORDE: 'https://borde.test', T: 'tok-lettura' },
    pintaTab: () => { log.pinta++; },
    gasPost: async (verbo) => { log.gas++; const r = await gas(verbo); if (r instanceof Error) throw r; return r; },
    fetch: async (url, init) => { log.fetch.push({ url, init }); const r = await bordo(url, init); if (r instanceof Error) throw r; return { json: async () => r }; },
    AbortController, setTimeout, clearTimeout, encodeURIComponent, Date, Array, Math, console
  };
  vm.createContext(sb);
  vm.runInContext(CODICE + '\n;globalThis.__API = { carga: _staffJLCarga, meseros: _meserosJL, get lista() { return _STAFF_JL; }, get err() { return _STAFF_JL_ERR; }, get ts() { return _STAFF_JL_TS; }, get fonte() { return _STAFF_JL_FONTE; } };', sb);
  return { api: sb.__API, log, sb };
}
const quieta = () => new Promise((r) => setTimeout(r, 30));
const STAFF = [{ persona_id: 'p1', nombre: 'Ray', cargo: 'mesero', en_plaza: true }, { persona_id: 'p2', nombre: 'AAG', cargo: 'gerente general', en_plaza: false }, { persona_id: 'p3', nombre: 'Nacho', cargo: 'jefe local', en_plaza: true }];

// 1 · il bordo risponde: lista da Postgres, il GAS NON viene toccato
let m = mondo({ bordo: async () => ({ ok: true, staff: STAFF }), gas: async () => ({ ok: false }) });
m.api.carga(); await quieta();
chk('1.01', m.api.fonte === 'bordo' && m.log.gas === 0, 'fonte bordo, GAS mai chiamato');
chk('1.02', JSON.stringify(m.api.lista.map((s) => s.nombre)) === '["Ray","Nacho"]', 'solo chi sta in plaza (il gerente generale non compare)');
chk('1.03', m.api.lista[0].persona_id === 'p1' && m.api.err === '', 'porta il persona_id e nessun errore');
chk('1.04', m.log.pinta === 1, 'la scheda si ridisegna');
chk('1.05', m.log.fetch[0].init.headers['x-borde-token'] === 'tok-lettura' && !/[?&]t=/.test(m.log.fetch[0].url), 'il segreto va in HEADER x-borde-token, mai in ?t=');
chk('1.06', m.log.fetch[0].url === 'https://borde.test/turno/estado/BKS', 'URL: /turno/estado/BKS');
m = mondo({ loc: 'RIESCO', bordo: async () => ({ ok: true, staff: STAFF }), gas: async () => ({ ok: false }) }); m.api.carga(); await quieta();
chk('1.07', m.log.fetch[0].url.endsWith('/turno/estado/RSC'), 'RIESCO → RSC (il locale di Postgres)');
m = mondo({ loc: 'CANDELARIA', bordo: async () => ({ ok: true, staff: STAFF }), gas: async () => ({ ok: false }) }); m.api.carga(); await quieta();
chk('1.08', m.log.fetch[0].url.endsWith('/turno/estado/CDL'), 'CANDELARIA → CDL');
// cache 10 min
m = mondo({ bordo: async () => ({ ok: true, staff: STAFF }), gas: async () => ({ ok: false }) }); m.api.carga(); await quieta(); m.api.carga(); await quieta();
chk('1.09', m.log.fetch.length === 1, 'entro 10 minuti non richiede');

// 2 · il bordo è spento / vuoto / rotto → il GAS di sempre
const GAS_OK = async () => ({ ok: true, staff: [{ nombre: 'Anthony', activo: true }, { nombre: 'Pedro', activo: false }] });
m = mondo({ bordo: async () => ({ ok: false, error: 'turno_pg_off' }), gas: GAS_OK }); m.api.carga(); await quieta();
chk('2.01', m.api.fonte === 'gas' && m.log.gas === 1 && m.api.lista.length === 2, 'bordo spento (503) → ripiego GAS');
m = mondo({ bordo: async () => ({ ok: true, staff: [] }), gas: GAS_OK }); m.api.carga(); await quieta();
chk('2.02', m.api.fonte === 'gas', 'bordo con lista VUOTA → ripiego GAS (un bordo senza seme non svuota il menu)');
m = mondo({ bordo: async () => new Error('failed to fetch'), gas: GAS_OK }); m.api.carga(); await quieta();
chk('2.03', m.api.fonte === 'gas' && m.api.err === '', 'bordo irraggiungibile → ripiego GAS');
chk('2.04', JSON.stringify(m.api.meseros()) === '["Anthony","Pedro"]' || JSON.stringify(m.api.meseros()) === '["Anthony"]' || m.api.meseros().includes('Anthony'), 'e la lista dei meseros si compone');

// 3 · NESSUNO risponde: l'errore SI VEDE e si riprova
m = mondo({ bordo: async () => new Error('x'), gas: async () => ({ ok: false, error: 'pin_invalid' }) }); m.api.carga(); await quieta();
chk('3.01', m.api.lista === null && m.api.err === 'pin_invalid', 'GAS dice pin_invalid → l\'errore è nominato (prima: muto)');
chk('3.02', m.api.ts === 0, 'e _STAFF_JL_TS torna a 0: la prossima apertura della scheda RIPROVA');
chk('3.03', m.log.pinta === 1, 'e la scheda si ridisegna per MOSTRARLO');
m = mondo({ bordo: async () => new Error('x'), gas: async () => { const e = new Error('timeout'); return e; } }); m.api.carga(); await quieta();
chk('3.04', m.api.err === 'timeout', 'timeout nominato');
m = mondo({ bordo: async () => new Error('x'), gas: async () => new Error('boom') }); m.api.carga(); await quieta();
chk('3.05', m.api.err === 'sin_red', 'rete assente nominata');
m = mondo({ pin: '', bordo: async () => ({ ok: true, staff: STAFF }), gas: GAS_OK }); m.api.carga(); await quieta();
chk('3.06', m.log.fetch.length === 0 && m.log.gas === 0, 'senza PIN (non loggato) non chiama nessuno');

// 4 · statico: l'errore è MOSTRATO nella scheda, e il bordo non mette il segreto in query
chk('4.01', /No pude traer la lista de meseros \(' \+ esc\(_STAFF_JL_ERR\)/.test(HTML), 'tabAsig mostra l\'errore con _STAFF_JL_ERR (non più «Cargando…» per sempre)');
chk('4.02', !/turno\/estado[^\n]*\?t=/.test(HTML), 'nessun ?t= sulla rotta nuova');
chk('4.03', /Guardar|asignar\(\)/.test(HTML) && /asignarPlaza/.test(HTML), 'la SCRITTURA (asignarPlaza, Guardar) è ancora al suo posto: la fetta A non la tocca');

console.log(`\nBANCO APP JL STAFF 6.3 A · ${n - ko}/${n} verdi` + (rossi.length ? ' · ROSSI: ' + rossi.join(' ') : ''));
process.exit(ko ? 1 : 0);
