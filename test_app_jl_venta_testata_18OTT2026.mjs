// BANCO · TERZA PENNA V30 · CONTROLLO DELL'AUTRICE · app_jl v1.41.0 · la venta della testata dice da dove viene (18-ott)
// Reperto: foto di Eduardo 00:46 «venta hoy 6.179.752 · 140 cerradas», ferma = Google vecchia di 31 min (il bordo diceva 6.175.862 · 134).
// Gira le funzioni VERE di app_jl.html in vm: pintaTesta, _testaVenta, fmtTesta, _servFresco, giroServicio, boot.
// node test_app_jl_venta_testata_18OTT2026.mjs [app_jl.html]
import fs from 'node:fs'; import vm from 'node:vm';
const SRC = fs.readFileSync(process.argv[2] || new URL('./app_jl.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 400))); };
const fnV = (nome) => { const i = SRC.search(new RegExp('(async )?function ' + nome + '\\(')); if (i < 0) throw new Error(nome); return SRC.slice(i, SRC.indexOf('\n}\n', i) + 3); };
const riga = (inizio) => { const i = SRC.indexOf(inizio); if (i < 0) throw new Error(inizio); return SRC.slice(i, SRC.indexOf('\n', i) + 1); };
const NOW = 1_800_000_000_000, MIN = 60e3;
const SAL_ON = { flags: { caja_servicio_on: '1', caja_atto1_on: '1' } }, SAL_OFF = { flags: { caja_servicio_on: '0', caja_atto1_on: '1' } };
function testa({ serv = null, tsServ = 0, caja = null, salud = SAL_ON, servErr = '', enSala = 2865430 }) {
  const el = {}; const $ = (id) => (el[id] = el[id] || { textContent: '', innerHTML: '', className: '' });
  const ctx = { Math, Number, String, JSON, RegExp, Object, isFinite, $, Date: { now: () => NOW },
    STATE: { serv, caja, salud, servErr, ts: { serv: tsServ, caja: caja ? NOW - 40e3 : 0, vista: NOW - 10e3 }, prods: [], user: 'Eduardo' },
    pintaSalud: () => {}, _rechazosHoy: () => null, _sinPapel: () => null, _enSalaDaVista: () => enSala, edadVistaTxt: () => 'hace 10 s',
    _cajaVista: () => caja };
  vm.createContext(ctx);
  vm.runInContext(riga('const esc = ') + riga('const fmt = ') + ['edadS', '_fmtEdadS', 'edadTxt', 'cjFlag', 'cjAtto1On', '_servOn', '_servFresco', '_testaVenta', 'fmtTesta', 'pintaTesta'].map(fnV).join('\n') + '\npintaTesta();', ctx);
  const h = el.hKpi.innerHTML; const kpi = [...h.matchAll(/<span class="kpi([^"]*)"><b>([^<]*)<\/b><small>([^<]*)<\/small>/g)].map((m) => ({ cls: m[1].trim(), b: m[2], s: m[3] }));
  return { kpi, h };
}
const BORDO = { ok: true, venta: 6175862, cuentas: 134 }, GOOGLE = { ok: true, venta: 6179752, cuentas: 140, mesas_abiertas: new Array(55) };
{ const { kpi } = testa({ serv: BORDO, tsServ: NOW - 31 * MIN, caja: GOOGLE });
  t('A · Eduardo 00:46: bordo vecchio di 31 min ⇒ la testata dice la cifra del BORDO (6,18M · 134), non quella di Google (140)', kpi[1].b === '$6,18M' && kpi[2].b === '134', kpi);
  t('A · e lo DICE: «venta · hace 31 min» in ámbar, anche cerradas e promedio', /venta · hace 31 min/.test(kpi[1].s) && kpi[1].cls.includes('amb') && kpi[2].cls.includes('amb') && kpi[4].cls.includes('amb'), kpi);
  t('A · en sala compatto: $2,87M (le cifre non si sovrappongono più)', kpi[0].b === '$2,87M', kpi[0]);
  t('A · promedio = venta/cerradas del bordo: 6.175.862 / 134 = 46.088,5 ⇒ $46.089', kpi[4].b === '$46.089', kpi[4]); }
{ const { kpi } = testa({ serv: BORDO, tsServ: NOW - 30e3, caja: GOOGLE });
  t('B · bordo fresco (30 s) ⇒ «venta hoy», verde, niente ámbar', kpi[1].s === 'venta hoy' && !kpi[1].cls.includes('amb') && kpi[1].cls.includes('ok'), kpi[1]); }
{ const { kpi } = testa({ caja: GOOGLE });
  t('C · leva accesa e il bordo non ha MAI risposto ⇒ Google, ma «venta · de Google» in ámbar', kpi[1].b === '$6,18M' && kpi[2].b === '140' && /de Google/.test(kpi[1].s) && kpi[1].cls.includes('amb'), kpi); }
{ const { kpi } = testa({ caja: GOOGLE, salud: SAL_OFF });
  t('D · leva spenta ⇒ Google come prima: «venta hoy», niente ámbar', kpi[1].s === 'venta hoy' && !kpi[1].cls.includes('amb'), kpi[1]); }
{ const { kpi } = testa({ serv: BORDO, tsServ: NOW - 5 * MIN, caja: GOOGLE, servErr: 'timeout' });
  t('E · l errore del bordo si vede: «venta · hace 5 min · sin respuesta»', /hace 5 min · sin respuesta/.test(kpi[1].s), kpi[1]); }
{ const { kpi } = testa({ serv: BORDO, tsServ: NOW - 2 * MIN, caja: GOOGLE, salud: null });
  t('F · /salud fallito (salud null) ⇒ resta il bordo con la sua età, non salta su Google', kpi[2].b === '134' && kpi[1].cls.includes('amb'), kpi); }
{ const { kpi } = testa({ serv: BORDO, tsServ: NOW - 10 * MIN, caja: GOOGLE, salud: SAL_OFF });
  t('F2 · [EL GIRO ⑤] leva spenta ad app aperta (rollback) col bordo già visto ⇒ torna a Google come prima: «venta hoy», 140', kpi[2].b === '140' && kpi[1].s === 'venta hoy' && !kpi[1].cls.includes('amb'), kpi); }
{ const { kpi } = testa({ serv: BORDO, tsServ: NOW - 5 * MIN, caja: GOOGLE, servErr: 'servicio_spento' });
  t('E2 · [EL GIRO ③] servicio_spento in spagnolo: «servicio apagado», mai «spento»', /servicio apagado/.test(kpi[1].s) && !/spento/.test(kpi[1].s), kpi[1]); }
{ const { kpi } = testa({ serv: { ok: true, venta: 298320, cuentas: 9 }, tsServ: NOW - 20e3, enSala: 44140 });
  t('G · sotto il milione le cifre restano intere ($298.320 · $44.140)', kpi[1].b === '$298.320' && kpi[0].b === '$44.140', kpi); }
{ const { kpi } = testa({});
  t('H · niente bordo e niente Google ⇒ i puntini, non uno zero', kpi[1].b === '···' && kpi[2].b === '···', kpi); }
// il giro: boot con i timer catturati
{ const cb = []; const lis = {}; const chiamate = [];
  const ctx = { Math, STATE: {}, CFG: { POLL_MS: 20000 }, TAB: 0, setInterval: (f, ms) => cb.push([f, ms]),
    document: { hidden: false, addEventListener: (k, f) => { lis[k] = f; } },
    pintaTesta: () => chiamate.push('testa'), tab: () => {}, giroVeloce: () => {}, giroProds: () => {}, giroAyer: () => {} /* [22-ott · TERZA AUT-0728] il giro delle mesas di ieri, nato nel boot */, giroTurno: () => {}, cjAtto1On: () => false, cjAtto1Giro: () => {},
    giroCaja: () => chiamate.push('caja'), giroServicio: () => chiamate.push('serv') };
  vm.createContext(ctx); vm.runInContext(fnV('boot'), ctx); vm.runInContext('boot();', ctx);
  const g = cb.find((x) => x[1] === 60000); chiamate.length = 0;
  for (const tb of [0, 1, 2, 3, -1]) { ctx.TAB = tb; g[0](); }
  t('I · ogni 60 s: Servicio/Caja ⇒ giroCaja (che chiama anche servicio); Turno, Ventas e agotados ⇒ giroServicio', JSON.stringify(chiamate) === JSON.stringify(['caja', 'serv', 'caja', 'serv', 'serv']), chiamate);
  chiamate.length = 0; lis.visibilitychange && lis.visibilitychange();
  t('I · al ritorno in primo piano: giroServicio subito, e la testata si ridisegna', chiamate.includes('serv') && chiamate.includes('testa'), chiamate);
  chiamate.length = 0; ctx.document.hidden = true; lis.visibilitychange && lis.visibilitychange();
  t('I · andando in background non si chiama niente', chiamate.length === 0, chiamate); }
// l'errore arriva in testata
{ const chiamate = [];
  const ctx = { STATE: { pin: '1234', ts: {}, servInVolo: false }, DEMO: false, _servOn: () => true, Date,
    cajaPost1: async () => { throw new Error('timeout'); }, pintaTesta: () => chiamate.push('testa'), pintaTab: () => {} };
  vm.createContext(ctx); vm.runInContext(fnV('giroServicio'), ctx);
  await vm.runInContext('giroServicio()', ctx);
  t('J · servicio in timeout ⇒ servErr «timeout», servInVolo torna falso, e la testata si ridisegna', ctx.STATE.servErr === 'timeout' && ctx.STATE.servInVolo === false && chiamate.includes('testa'), [ctx.STATE, chiamate]); }
console.log('\n' + (ko ? '🔴 ' + ko + ' rossi su ' + (ok + ko) : '🟢 ' + ok + ' controlli, tutti verdi'));
process.exitCode = ko ? 1 : 0;
