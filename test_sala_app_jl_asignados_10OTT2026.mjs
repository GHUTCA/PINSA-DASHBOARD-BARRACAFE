// BANCO · il COBRAR del JL si perdeva: il bordo lo respingeva con `no_asignado` perche la sala si presentava come app:'sala' (PROVA A mesa 200, 10-ott-2026) · TERZA PENNA
// Il bordo ha il cancello «SOLO CHI E' NEL TURNO» (`_soloAsignados`) per i gesti con app:'sala'. Il JL (Eduardo) non ha una plaza: in ?jl=1 la sala deve presentarsi come `jl`.
// Criteri: ① in JL tutti i corpi verso bordo e GAS portano app:'jl'; fuori da JL restano app:'sala' (identici a ieri)
//          ② CONTRATTO DALL'ALTRO LATO (parola presa dal SORGENTE del bordo, il DO vero): app:'sala' + JL => no_asignado definitivo; app:'jl' => passa; un mesero assegnato passa con 'sala'
//          ③ nessun `app: 'sala'` letterale rimasto nei corpi ④ mutanti.
// Uso: node test_sala_app_jl_asignados_10OTT2026.mjs [sala.html] [radice del bordo]
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path'; import os from 'node:os'; import { pathToFileURL } from 'node:url';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'sala.html'), 'utf8').replace(/\r\n/g, '\n');
const BORDO = process.argv[3] || path.join(AQUI, '..', '_wt_0613');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 300))); };
const fnDe = (SRC, nome, asinc) => { const i = SRC.indexOf((asinc ? 'async function ' : 'function ') + nome + '('); if (i < 0) throw new Error(nome); return SRC.slice(i, SRC.indexOf('\n}\n', i) + 3); };

// ② il bordo VERO (DO) — la parola dall'altro lato
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'asigjl-'));
for (const f of fs.readdirSync(path.join(BORDO, 'src'))) fs.copyFileSync(path.join(BORDO, 'src', f), path.join(TMP, f));
fs.writeFileSync(path.join(TMP, 'package.json'), '{"type":"module"}');
const B = await import(pathToFileURL(path.join(TMP, 'index.js')).href);
const m = new Map(); const st = { get: async (k) => m.get(k), put: async (k, v) => { m.set(k, v); }, delete: async (k) => m.delete(k), list: async () => new Map(), getAlarm: async () => null, setAlarm: async () => {} };
const now = Date.now(); m.set('sec:sala_hechos', { ts: now, datos: { asig: [{ mesero: 'Wilbert', plaza: 'BARRA ACC' }] } });
const d = new B.EstadoLocal({ storage: st }, { TURNO_SOLO_ASIGNADOS_ON: '1', TURNO_ESENTI: 'GG' });
const rSala = await d._soloAsignados({ app: 'sala', nombre: 'Eduardo' }, now), rJl = await d._soloAsignados({ app: 'jl', nombre: 'Eduardo' }, now), rMes = await d._soloAsignados({ app: 'sala', nombre: 'Wilbert' }, now);
t('② il bordo respinge il JL (non assegnato) con app:sala: no_asignado DEFINITIVO — la causa della mesa 200', rSala && rSala.body && rSala.body.error === 'no_asignado' && rSala.body.definitivo === true && rSala.body.borde === true, rSala);
t('② bis lo stesso JL con app:jl passa (il bordo lo dichiara: «il JL entra nella sua app»)', rJl === null, rJl);
t('② ter un mesero assegnato passa con app:sala (nulla cambia per i meseros)', rMes === null, rMes);

function mondo(SRC, JL) {
  const fetches = [];
  const ctx = { JL, bordeWriteOn: () => true, DTO_BORDE_ON: false, DTO_PORTAS_BORDE: [], BORDE_PAGO: { QS: '1', PORTAS: ['pin_jl', 'cortesia', 'fam'], MS: 1000, pausaHasta: 0, RETE_MS: 1, APAGADO_MS: 1 },
    BORDE_SALA: { URL: 'http://b', T: 't' }, CFG: { LOCAL: 'BKS' }, STATE: { codigo: 'C1', nombre: 'Eduardo' }, _pennaDice: () => {}, _vediNoAsignado: (x) => x, _muroCampi: () => ({}), _salaVer: () => 'v', esc: String,
    AbortController, setTimeout, clearTimeout, Date, JSON, Math, Object, String, Number, Promise, encodeURIComponent, URL, console,
    fetch: async (u, op) => { fetches.push(JSON.parse(op.body)); return { json: async () => ({ ok: true, borde: true, monto: 5 }) }; } };
  vm.createContext(ctx);
  vm.runInContext('const APP_ID = ' + (JL ? "'jl'" : "'sala'") + ';\n' + fnDe(SRC, '_pagoAlBorde', true) + '\nthis.P = _pagoAlBorde;', ctx);
  return { ctx, fetches };
}
async function banco(SRC) {
  const k0 = ko;
  t('① APP_ID nasce dal JL: `const APP_ID = JL ? \'jl\' : \'sala\'`', /const APP_ID = JL \? 'jl' : 'sala';/.test(SRC));
  t('③ nessun `app: \'sala\'` letterale resta nei corpi', !/app: 'sala'/.test(SRC), (SRC.match(/app: 'sala'/g) || []).length);
  t('① bis i sei punti che si presentano al bordo/GAS usano APP_ID', (SRC.match(/app: APP_ID/g) || []).length === 6, (SRC.match(/app: APP_ID/g) || []).length);
  { const mm = mondo(SRC, { user: 'Eduardo' }); await mm.ctx.P({ pago_uid: 'PU-1', mesa: '200', medio: 'efectivo', propina: 219 }, 2190);
    t('① in JL il pago al bordo porta app:jl', mm.fetches.length === 1 && mm.fetches[0].app === 'jl', mm.fetches); }
  { const mm = mondo(SRC, null); await mm.ctx.P({ pago_uid: 'PU-1', mesa: '55', medio: 'efectivo', propina: 0 }, 2190);
    t('① bis un mesero normale: app:sala come ieri', mm.fetches.length === 1 && mm.fetches[0].app === 'sala', mm.fetches); }
  { // l'ordine: APP_ID deve esistere PRIMA di essere usato (const dopo JL)
    t('① ter APP_ID e dichiarata DOPO `const JL` e prima dei corpi', SRC.indexOf('const APP_ID') > SRC.indexOf('const JL = (function') && SRC.indexOf('const APP_ID') < SRC.indexOf('app: APP_ID')); }
  return ko - k0;
}
await banco(SRC0);
const mut = async (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; await banco(SRC0.replace(da, () => a)); muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('④ mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
await mut('APP_ID resta sempre sala', "const APP_ID = JL ? 'jl' : 'sala';", "const APP_ID = 'sala';");
await mut('APP_ID per tutti jl', "const APP_ID = JL ? 'jl' : 'sala';", "const APP_ID = 'jl';");
await mut('il pago torna app:sala letterale', "const bB = Object.assign({ action: action || 'registrarPago', local: CFG.LOCAL, app: APP_ID },", "const bB = Object.assign({ action: action || 'registrarPago', local: CFG.LOCAL, app: 'sala' },");
await mut('lo staffPost torna app:sala', "cli_ver: _salaVer(), app: APP_ID }, body || {}, _muroCampi(_VOLO_B))", "cli_ver: _salaVer(), app: 'sala' }, body || {}, _muroCampi(_VOLO_B))");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
