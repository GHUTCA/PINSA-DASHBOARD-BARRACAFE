// BANCO · v1.9 · LA ANFITRIONA SENZA GOOGLE (1.9/1.10, 🎛 V32 «V32 ANFITRIONA A MIGRA») · 🚚 MIGRACION V32 · 21-ott-2026 · AUTOCONTROLLO dell'autrice, NON il banco di 💵
// Parte dal banco di TERZA del 10-ott (test_anfitriona_borde_10OTT2026.mjs): i suoi casi restano tutti (leva «sin gas» spenta = la v1.8 di ieri), più ⑨ i casi «sin gas».
// ⚠️ ④ quinto è rosso anche sulla v1.8 del vivo quando manca `_wt_anf_borde/src/sala_anfitriona.js` (il banco ripiega su una vista finta senza `pendiente`): non è di questo pezzo.
// Criteri: ① leva spenta (o /salud muto, o freno ?anfborde=0) = il GAS di sempre, nessuna richiesta di sala al bordo ② leva accesa e dato fresco con `anfitriona` => la mappa e quella del bordo,
//          il GAS non si chiama ③ dato vecchio (>90 s), senza `anfitriona`, o errore => GAS ④ le sedute: con la leva accesa passano dal bordo; la seduta che il bordo non mostra ancora si ricorda
//          25 min qui (la mesa non torna libre) ⑤ la riga «google / bordo hace N s» dice DA DOVE ⑥ il contratto del bordo e preso dal CODICE VERO (sala_anfitriona.js) ⑦ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'anfitriona.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 320))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); const a = SRC.slice(Math.max(0, i - 6), i) === 'async ' ? i - 6 : i;
  return SRC.slice(a, SRC.indexOf('\n}\n', i) + 3); };

// il bordo VERO (se c'e'): la forma di `anfitriona` la produce il suo codice
let vistaBordo = null;
try { const dir = ['_wt_anf_borde', '_wt_vivo'].map((d) => path.resolve(AQUI, '..', d, 'src')).find((d) => fs.existsSync(path.join(d, 'sala_anfitriona.js'))); const T = fs.mkdtempSync(path.join(process.env.TEMP || '.', 'anfv-'));
  fs.copyFileSync(path.join(dir, 'sala_anfitriona.js'), path.join(T, 'sala_anfitriona.js')); fs.writeFileSync(path.join(T, 'package.json'), '{"type":"module"}');
  vistaBordo = (await import(pathToFileURL(path.join(T, 'sala_anfitriona.js')).href)).salaAnfitrionaVista; } catch (e) { vistaBordo = null; }
const NOW = Date.now(), MIN = 60000;
const ANF = () => vistaBordo ? vistaBordo({ plazasCfg: [{ plaza: 'AURORA', mesas: '1-3' }], meseroDe: { AURORA: 'Ray' }, now: NOW,
  pedidos: [{ mesa: '1', estado: 'pendiente', t_creado: NOW - 5 * MIN, toque: NOW - 5 * MIN }], seats: [] })
  : { plazas: [{ plaza: 'AURORA', mesero: 'Ray', mesas: [{ mesa: '1', estado: 'ocupada' }, { mesa: '2', estado: 'libre' }, { mesa: '3', estado: 'libre' }] }], kpis: { sentadas: 0, pax: 0, liberandose: 0 } };
const SALA_GAS = { ok: true, plazas: [{ plaza: 'AURORA', mesero: 'Ray', mesas: [{ mesa: '1', estado: 'libre' }] }], kpis: { sentadas: 9, pax: 9, liberandose: 0 }, ts: NOW };

function mondo(SRC, o) {
  o = o || {}; const calls = [], ls = new Map(), rendered = [], dom = { fuente: '', offline: false };
  const QS = new URLSearchParams(o.qs || '');
  const ctx = { JSON, Math, Date, String, Number, Object, Array, Promise, encodeURIComponent, AbortController, setTimeout, clearTimeout, URLSearchParams,
    QS, CFG: { LOCAL: 'BKS' }, BORDE_SALA: { URL: 'https://borde.test', T: 'TOKEN-LETTURA' },
    STATE: { codigo: '1234', nombre: 'Ana', strikes: 0, sala: null, bsMesa: '2', bsPax: 4, bsSeatUid: 'seat-x', seatsLoc: [] }, SENTARBORDE_ON: !!o.sentarborde,
    localStorage: { getItem: (k) => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: (k) => ls.delete(k) },
    $: (id) => ({ classList: { add() { if (id === 'offline') dom.offline = true; }, remove() { if (id === 'offline') dom.offline = false; } }, set textContent(v) { if (id === 'fuente') dom.fuente = v; }, get textContent() { return dom.fuente; }, innerHTML: '' }),
    render: (r) => rendered.push(JSON.parse(JSON.stringify(r))), calls, _strikeTurno() { ctx.STATE.strikes++; return false; },
    gasGet: async (a, p) => { calls.push(['gas', a]); return o.gas || SALA_GAS; },
    fetch: async (url, opt) => { const u = String(url); calls.push(['fetch', u.replace('https://borde.test', ''), opt && opt.headers && opt.headers['X-Borde-Token'] || '']);
      if (/\/salud/.test(u)) { if (o.saludErr) throw new Error('rete'); return { json: async () => ({ version: 'borde v0.test', flags: { anfitriona_borde_on: o.saludOn === undefined ? '1' : o.saludOn, anfitriona_sin_gas_on: o.sinGas || '0' } }) }; }
      if (/seccion=sala_vista/.test(u)) { if (o.estadoErr) throw new Error('rete'); return { json: async () => o.estado === undefined ? ({ ok: true, datos: { datos: { edad_borde_s: o.edad === undefined ? 3 : o.edad, ts_datos: NOW, anfitriona: ANF() } } }) : o.estado }; }
      if (/pedido-staff/.test(u)) { return { json: async () => o.sentarRisp || ({ ok: true, borde: true, mesa: '2', pax: 4 }) }; }
      return { json: async () => ({}) }; } };
  ctx.gasPost = async (a, b) => { calls.push(['gas', a]); return { ok: true, mesa: b && b.mesa, pax: b && b.pax }; };
  ctx.toast = (tipo, msg) => { dom.toast = [tipo, msg]; }; ctx.cerrarSheet = () => { dom.cerrato = true; };
  vm.createContext(ctx);
  const a = SRC.indexOf('const ANF_BORDE ='), b = SRC.indexOf('async function refrescar(');
  vm.runInContext(SRC.slice(a, b) + '\n' + fnDe(SRC, 'refrescar') + '\n' + fnDe(SRC, '_sentarAlBorde') + '\n' + fnDe(SRC, 'confirmarSentar') + '\nthis.F = { ANF_BORDE, anfSaludLeva, leerSalaBorde, anfAplicaSeatsLocales, refrescar, _sentarAlBorde, _anfFreno, pintaFuente, confirmarSentar };', ctx);
  return { ctx, calls, ls, rendered, dom };
}
const cuenta = (m, tipo, re) => m.calls.filter((c) => c[0] === tipo && (!re || re.test(c[1]))).length;

async function banco(SRC) {
  { const m = mondo(SRC, { saludOn: '0' }); await m.ctx.F.refrescar(false);
    t('① leva spenta: ni una richiesta di sala al bordo, il GAS risponde', cuenta(m, 'fetch', /sala_vista/) === 0 && cuenta(m, 'gas') === 1 && m.rendered[0].kpis.sentadas === 9, m.calls);
    t('① bis … e la riga dice «google»', /google/.test(m.dom.fuente), m.dom.fuente); }
  { const m = mondo(SRC, { saludErr: true }); await m.ctx.F.refrescar(false);
    t('① ter /salud muto = spenta (mai la mappa del bordo senza che il bordo lo dica): GAS', cuenta(m, 'fetch', /sala_vista/) === 0 && cuenta(m, 'gas') === 1); }
  { const m = mondo(SRC, { qs: 'anfborde=0' }); await m.ctx.F.refrescar(false);
    t('① quater ?anfborde=0 e il freno per apparecchio (si ricorda): GAS anche con la leva accesa', cuenta(m, 'gas') === 1 && cuenta(m, 'fetch', /sala_vista/) === 0 && m.ls.get('anfi_borde_off') === '1', [m.calls, [...m.ls]]); }
  { const m = mondo(SRC, { qs: 'anfborde=1' }); m.ls.set('anfi_borde_off', '1'); await m.ctx.F.refrescar(false);
    t('① quinto ?anfborde=1 toglie il freno', !m.ls.has('anfi_borde_off') && cuenta(m, 'gas') === 0, [m.calls, [...m.ls]]); }
  { const m = mondo(SRC, {}); await m.ctx.F.refrescar(false);
    t('② leva accesa, dato fresco con `anfitriona`: la mappa e quella del bordo, il GAS NON si chiama', cuenta(m, 'gas') === 0 && m.rendered.length === 1 && m.rendered[0].plazas[0].mesero === 'Ray', m.calls);
    t('② bis la richiesta e la giusta: sala_vista col codigo e il token di lettura', m.calls.some((c) => /\/estado\/BKS\?seccion=sala_vista&codigo=1234/.test(c[1]) && c[2] === 'TOKEN-LETTURA'), m.calls);
    t('⑤ la riga dice DA DOVE e quanto: «bordo hace 3 s»', /bordo hace 3 s/.test(m.dom.fuente), m.dom.fuente);
    t('⑥ il contratto e preso dal codice del bordo (mesa 1 ocupada con 🛎 pendiente)', !vistaBordo || (m.rendered[0].plazas[0].mesas[0].estado === 'ocupada' && m.rendered[0].plazas[0].mesas[0].pendiente === true), m.rendered[0] && m.rendered[0].plazas[0].mesas[0]); }
  { const m = mondo(SRC, { edad: 200 }); await m.ctx.F.refrescar(false);
    t('③ dato del bordo piu vecchio di 90 s: GAS', cuenta(m, 'gas') === 1 && m.rendered[0].kpis.sentadas === 9, m.calls); }
  { const m = mondo(SRC, { estado: { ok: true, datos: { datos: { edad_borde_s: 2, meseros: {} } } } }); await m.ctx.F.refrescar(false);
    t('③ bis il bordo risponde ma SENZA `anfitriona` (bordo vecchio): GAS', cuenta(m, 'gas') === 1); }
  { const m = mondo(SRC, { estadoErr: true }); await m.ctx.F.refrescar(false);
    t('③ ter il bordo non risponde: GAS, nessun errore in faccia all\'anfitriona', cuenta(m, 'gas') === 1 && !m.dom.offline); }
  { const m = mondo(SRC, { estado: { ok: false, error: 'codigo_invalid' }, gas: { ok: false, error: 'codigo_invalid' } }); await m.ctx.F.refrescar(false);
    t('③ quater codigo invalido: la decisione resta del GAS (i 3 strikes di sempre, nessuna logica nuova)', cuenta(m, 'gas') === 1 && m.ctx.STATE.strikes === 1, m.ctx.STATE.strikes); }
  // ④ le sedute
  { const m = mondo(SRC, { sentarborde: false }); const r = await m.ctx.F._sentarAlBorde({ mesa: '2', pax: 4, seat_uid: 'x' });
    t('④ con la leva accesa il tap «Sentados» passa dal bordo anche SENZA ?sentarborde=1', r && r.borde === true && cuenta(m, 'fetch', /pedido-staff/) === 1, m.calls); }
  { const m = mondo(SRC, { sentarborde: false, saludOn: '0' }); const r = await m.ctx.F._sentarAlBorde({ mesa: '2', pax: 4, seat_uid: 'x' });
    t('④ bis leva spenta e niente ?sentarborde: come ieri, il bordo non si tocca', r === null && cuenta(m, 'fetch', /pedido-staff/) === 0, m.calls); }
  { const m = mondo(SRC, {}); const r = JSON.parse(JSON.stringify(ANF()));
    m.ctx.STATE.seatsLoc = [{ mesa: '2', pax: 6, ts: NOW - 2 * MIN }, { mesa: '3', pax: 2, ts: NOW - 40 * MIN }, { mesa: '1', pax: 9, ts: NOW - MIN }];
    const out = m.ctx.F.anfAplicaSeatsLocales(r); const mm = (n) => out.plazas[0].mesas.find((x) => x.mesa === n);
    t('④ ter la seduta che il bordo non mostra: mesa 2 libre -> ocupada con 6 pax (non si siede due volte)', mm('2').estado === 'ocupada' && mm('2').pax === 6, mm('2'));
    t('④ quater una seduta di 40 min fa (oltre i 25) NON conta e si butta', mm('3').estado === 'libre' && m.ctx.STATE.seatsLoc.length === 2, [mm('3'), m.ctx.STATE.seatsLoc]);
    t('④ quinto una mesa che il bordo gia dice ocupada (con il suo pedido) NON si tocca', mm('1').estado === 'ocupada' && mm('1').pendiente === true && mm('1').pax !== 9, mm('1')); }
  t('⑦ versione e fuente: v1.10, e la riga «fuente» esiste', />v1\.10 · 21ott</.test(SRC) && /id="fuente"/.test(SRC));
  // ⑨ LA LEVA «SIN GAS»
  { const m = mondo(SRC, { sinGas: '1', edad: 200 }); await m.ctx.F.refrescar(false);
    t('⑨ sin gas: dato del bordo vecchio (200 s) si MOSTRA, il GAS non si chiama', cuenta(m, 'gas') === 0 && m.rendered.length === 1, m.calls);
    t('⑨ bis … e la riga dice l eta e «mapa vieja»', /bordo hace 200 s/.test(m.dom.fuente) && /vieja/.test(m.dom.fuente), m.dom.fuente); }
  { const m = mondo(SRC, { sinGas: '1', estadoErr: true }); await m.ctx.F.refrescar(false);
    t('⑨ ter sin gas: bordo muto => «Sin conexión», nessuna mappa nuova, il GAS non si chiama', cuenta(m, 'gas') === 0 && m.dom.offline && m.rendered.length === 0, [m.calls, m.dom]); }
  { const m = mondo(SRC, { sinGas: '1', estado: { ok: true, datos: { datos: { edad_borde_s: 2, meseros: {} } } } }); await m.ctx.F.refrescar(false);
    t('⑨ quater sin gas: bordo senza anfitriona => offline, il GAS non si chiama', cuenta(m, 'gas') === 0 && m.dom.offline, m.calls); }
  { const m = mondo(SRC, { sinGas: '1', saludOn: '0' }); await m.ctx.F.refrescar(false);
    t('⑨ quinto la leva sin gas DA SOLA non accende niente: senza anfitriona_borde_on resta la v1.8 (GAS)', cuenta(m, 'gas') === 1 && !m.ctx.F.ANF_BORDE.sinGas, m.calls); }
  { const m = mondo(SRC, { sinGas: '1', qs: 'anfsingas=0', edad: 200 }); await m.ctx.F.refrescar(false);
    t('⑨ sesto ?anfsingas=0 e il freno per apparecchio (si ricorda): torna il ripiego di ieri', cuenta(m, 'gas') === 1 && m.ls.get('anfi_singas_off') === '1', [m.calls, [...m.ls]]); }
  { const m = mondo(SRC, { sinGas: '1' }); await m.ctx.F.anfSaludLeva(); m.ctx.F.ANF_BORDE.ts = 0;
    const f0 = m.ctx.fetch; m.ctx.fetch = async (u, op) => { if (/\/salud/.test(String(u))) throw new Error('rete'); return f0(u, op); };
    await m.ctx.F.anfSaludLeva();
    t('⑨ settimo /salud che cade DOPO aver visto la leva accesa: la leva resta', m.ctx.F.ANF_BORDE.sinGas === true && m.ctx.F.ANF_BORDE.on === true, m.ctx.F.ANF_BORDE); }
  { const m = mondo(SRC, { sinGas: '1', sentarRisp: { ok: false, need: 'gas', error: 'apagado' } });
    m.ctx.STATE.bsMesa = '2'; m.ctx.STATE.bsSeatUid = 'seat-fisso'; m.ctx.STATE.enviando = false; m.ctx.refrescar = async () => {};
    await m.ctx.F.confirmarSentar();
    t('⑨ ottavo sin gas: il bordo rifiuta il sentar => NESSUN sentarMesa al GAS, il foglio resta aperto, si dice perche', cuenta(m, 'gas') === 0 && !m.dom.cerrato && /apagado/.test((m.dom.toast || [])[1] || ''), [m.calls, m.dom]);
    t('⑨ nono … e il ritentativo porta la STESSA seat_uid (non siede due volte)', m.ctx.STATE.bsSeatUid === 'seat-fisso' && m.ctx.STATE.enviando === false); }
  { const m = mondo(SRC, { sinGas: '1' }); m.ctx.STATE.bsMesa = '2'; m.ctx.STATE.enviando = false; m.ctx.refrescar = async () => {};
    await m.ctx.F.confirmarSentar();
    t('⑨ decimo sin gas: il bordo timbra => seduta riuscita, foglio chiuso, nessun GAS', cuenta(m, 'gas') === 0 && m.dom.cerrato === true, [m.calls, m.dom]); }
  { const m = mondo(SRC, { sentarRisp: { ok: false, need: 'gas', error: 'apagado' } }); m.ctx.STATE.bsMesa = '2'; m.ctx.STATE.enviando = false; m.ctx.refrescar = async () => {};
    await m.ctx.F.confirmarSentar();
    t('⑨ undicesimo leva sin gas SPENTA: il rifiuto del bordo va al GAS come ieri (v1.8 intatta)', cuenta(m, 'gas') === 1 && m.dom.cerrato === true, m.calls); }
  { const m = mondo(SRC, { sinGas: '1', estado: { ok: false, error: 'codigo_invalid' } }); await m.ctx.F.refrescar(false);
    t('⑨ dodicesimo sin gas: il turno chiuso (codigo_invalid dal bordo) e uno strike come col GAS, nessuna mappa, nessun GAS', m.ctx.STATE.strikes === 1 && cuenta(m, 'gas') === 0 && m.rendered.length === 0, [m.ctx.STATE.strikes, m.calls]); }
  { const m = mondo(SRC, { estado: { ok: false, error: 'codigo_invalid' }, gas: { ok: false, error: 'codigo_invalid' } }); await m.ctx.F.refrescar(false);
    t('⑨ tredicesimo leva SPENTA: codigo_invalid del bordo non conta due volte (lo strike resta del GAS, uno solo)', m.ctx.STATE.strikes === 1 && cuenta(m, 'gas') === 1, [m.ctx.STATE.strikes, m.calls]); }
  t('⑦ bis la seduta riuscita si ricorda (seatsLoc.push) e render ne riceve la versione con le sedute', /seatsLoc = STATE\.seatsLoc \|\| \[\]\)\.push/.test(SRC) && /render\(anfAplicaSeatsLocales\(rB\)\)/.test(SRC));
}
await banco(SRC0);
const mut = async (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; await banco(SRC0.replace(da, () => a)); muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('⑧ mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
await mut('la leva e ignorata', "ANF_BORDE.on = !!(j && j.flags && String(j.flags.anfitriona_borde_on) === '1') && !_anfFreno();", "ANF_BORDE.on = true;");
await mut('il freno non frena', "&& !_anfFreno();", ";");
await mut('/salud muto = accesa', "if (!ANF_BORDE.sinGas) ANF_BORDE.on = false;", "ANF_BORDE.on = true;");
await mut('il dato vecchio passa', "if (vieja && !ANF_BORDE.sinGas) return null;", "");
await mut('senza anfitriona si va avanti', "if (!d || !d.anfitriona || !Array.isArray(d.anfitriona.plazas)) return null;", "if (!d) return null;");
await mut('il codigo non viaggia', "'?seccion=sala_vista&codigo=' + encodeURIComponent(STATE.codigo)", "'?seccion=sala_vista'");
await mut('il token non viaggia', "{ headers: { 'X-Borde-Token': BORDE_SALA.T }, signal", "{ signal");
await mut('la fonte non si dichiara', "el.textContent = r && r._fuente === 'bordo'", "el.textContent = ''; void (r && r._fuente === 'bordo')");
await mut('le sedute passano dal bordo solo col vecchio flag', "if (!SENTARBORDE_ON && !(await anfSaludLeva())) return null;", "if (!SENTARBORDE_ON) return null;");
await mut('la seduta locale e eterna', "Date.now() - x.ts <= ANF_SEAT_VIGENCIA_MS", "true");
await mut('la seduta locale sovrascrive il bordo', "if (m.estado === 'libre' || m.estado === 'presunta') {", "if (true) {");
await mut('il bordo non e tentato prima del GAS', "const rB = await leerSalaBorde();", "const rB = null;");
await mut('il GAS e chiamato comunque', "if (rB) { STATE.strikes = 0; STATE.sala = rB; $('offline').classList.remove('show'); render(anfAplicaSeatsLocales(rB)); pintaFuente(rB); return; }", "if (rB) { STATE.sala = rB; render(anfAplicaSeatsLocales(rB)); pintaFuente(rB); }");
await mut('sin gas: il GAS della mappa torna', "if (ANF_BORDE.sinGas) { $('offline').classList.add('show'); return; }", "");
await mut('sin gas: il sentar ripiega sul GAS', "if (ANF_BORDE.sinGas) return { ok: false, error: (j && (j.error || j.motivo)) || ('http_' + r.status), _sinGas: true };", "");
await mut('sin gas: il foglio si chiude sul rifiuto', "if (r && r._sinGas) {", "if (r && r._sinGas) { cerrarSheet();");
await mut('sin gas: la leva sola accende', "ANF_BORDE.sinGas = ANF_BORDE.on && ", "ANF_BORDE.sinGas = ");
await mut('sin gas: il freno non frena', "&& !_anfSinGasFreno();", ";");
await mut('sin gas: /salud che cade spegne', "if (!ANF_BORDE.sinGas) ANF_BORDE.on = false;", "ANF_BORDE.on = false; ANF_BORDE.sinGas = false;");
await mut('sin gas: il turno chiuso non fa strike', "if (rB && rB._codigoMuerto) { _strikeTurno(); return; }", "if (rB && rB._codigoMuerto) { return; }");
await mut('sin gas: il turno chiuso diventa Sin conexión', "if (ANF_BORDE.sinGas && j && j.ok === false && j.error === 'codigo_invalid') return { _codigoMuerto: true };", "");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
