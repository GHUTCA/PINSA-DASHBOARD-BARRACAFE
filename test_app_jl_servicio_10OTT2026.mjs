// BANCO · «EL SERVICIO» DELL'APP_JL LEGGE DAL BORDO (V28, 10-ott-2026: «un vetro che legge Google») · TERZA PENNA
// Criteri: ① leva spenta (o /salud muto) = la card di ieri, identica, e nessuna richiesta al bordo ② leva accesa e dato fresco: l'INCASSATO viene dal bordo (non da Google),
//          i tavoli APERTI dalla fetta del bordo ③ lo stesso mesero scritto diverso e UNO (slug) ④ dato vecchio >3 min o errore => Google, mai un mix ⑤ senza fetta restano
//          i tavoli di Google ⑥ senza caja di Google il bordo basta ⑦ la riga «📷 caja» dice DA DOVE ⑧ STATE.caja non si muta ⑨ la richiesta e la giusta ⑩ mutanti.
// Il contratto del bordo e preso dal CODICE VERO (cajaServicio di ../_wt_0613/src/caja_notte.js) quando il worktree c'e': non da un finto che l'autore ha scritto a memoria.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'app_jl.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 360))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); const a = SRC.slice(Math.max(0, i - 6), i) === 'async ' ? i - 6 : i; const eol = SRC.indexOf('\n', i), riga1 = SRC.slice(i, eol); if (/\}\s*$/.test(riga1) && (riga1.match(/\{/g) || []).length === (riga1.match(/\}/g) || []).length) return SRC.slice(a, eol + 1); return SRC.slice(a, SRC.indexOf('\n}\n', i) + 3); };

// il bordo VERO (se c'e'): la forma della risposta non la invento io
let cajaServicio = null;
try { const p = path.resolve(AQUI, '..', '_wt_0613', 'src', 'caja_notte.js'); const T = fs.mkdtempSync(path.join(process.env.TEMP || '.', 'sv-'));
  for (const f of fs.readdirSync(path.dirname(p))) fs.copyFileSync(path.join(path.dirname(p), f), path.join(T, f)); fs.writeFileSync(path.join(T, 'package.json'), '{"type":"module"}');
  cajaServicio = (await import(pathToFileURL(path.join(T, 'caja_notte.js')).href)).cajaServicio; } catch (e) { cajaServicio = null; }
const NOW = Date.now();
const P = (reg, medio, monto, prop, int) => Object.assign({ registrado_por: reg, medio: medio, monto: monto, propina: prop, ts: NOW - 60000, estado: 'ok' }, int ? { intestatario: int } : {});
const bordoRisp = (pagos) => Object.assign({ ok: true, fuente: 'bordo', dia_operativo: '2026-10-10', ts: NOW, n_pagos: (pagos || []).length }, cajaServicio ? cajaServicio(pagos) : { por_mesero: {}, venta: 0, cuentas: 0 });
// la fetta del bordo: la forma letta dal vivo (sala_vista, mesas con mio/ajeno)
const VISTA = () => ({ meseros: {
  wilbert: { ok: true, nombre: 'Wilbert', mesas: [{ mesa: '200', plaza: 'BARRA ACC', total: 2190, n: 1, mio: 2190, ajeno: 0, de: [] }], pendientes: [], mios: [], por_limpiar: [], sin_dueno: [] },
  ray: { ok: true, nombre: 'Ray', mesas: [{ mesa: '31', plaza: 'T1', total: 40000, n: 2, mio: 30000, ajeno: 10000, de: ['Gabriel'] }, { mesa: '32', plaza: 'T1', total: 5000, n: 1, mio: 5000, ajeno: 0, de: [] }], pendientes: [], mios: [], por_limpiar: [], sin_dueno: [] },
  gabriel: { ok: true, nombre: 'Gabriel', mesas: [{ mesa: '31', plaza: 'T2', total: 40000, n: 2, mio: 10000, ajeno: 30000, de: ['Ray'] }], pendientes: [], mios: [], por_limpiar: [], sin_dueno: [] } } });
// Google com'e' nel vivo DOPO il cobro della 199: in ritardo (Wilbert ancora «sin cobrar», 2 cuentas abiertas)
const GOOGLE = () => ({ ok: true, venta: 100000, cuentas: 12, mesas_abiertas: [{ mesa: '200', consumo: 2190, min_quieta: 5 }, { mesa: '199', consumo: 3190, min_quieta: 30 }],
  por_mesero: { Wilbert: { venta: 0, n: 0, cobrado: 0, n_cobros: 0, abierto: 5380, n_abierto: 2 }, Ray: { venta: 80000, n: 6, cobrado: 80000, n_cobros: 6, abierto: 0, n_abierto: 0 }, '': { venta: 4000, n: 1, cobrado: 4000, n_cobros: 1 } } });

function mondo(SRC, o) {
  o = o || {}; const posts = [];
  const STATE = { caja: o.caja === undefined ? GOOGLE() : o.caja, vista: o.vista === undefined ? VISTA() : o.vista, turno: { asignaciones: [] }, user: 'Eduardo', pin: '2222',
    ts: { caja: NOW - 4000 }, salud: o.salud === undefined ? { flags: { caja_atto1_on: '1', caja_servicio_on: '1' } } : o.salud, serv: o.serv || null };
  if (o.serv) STATE.ts.serv = o.servTs === undefined ? NOW - 5000 : o.servTs;
  const ctx = { JSON, Math, Date, String, Number, Object, Array, RegExp, STATE, DEMO: false, posts, pinta: 0,
    cajaPost1: async (p) => { posts.push(p); if (o.cajaPost1) return o.cajaPost1(p); return o.risposta; },
    pintaTesta() { ctx.pinta++; }, pintaTab() { ctx.pinta++; }, $: () => ({ innerHTML: '' }) };
  vm.createContext(ctx);
  vm.runInContext(['cjFlag', 'cjAtto1On', '_servOn', '_servFresco', 'giroServicio', '_cajaVista', '_slugSalaJS', '_cjMesasDetalle', '_cjMesasAbiertas', '_porMesero']
    .map((n) => fnDe(SRC, n)).join('\n') + '\nthis.F = { cjFlag, _servOn, _servFresco, giroServicio, _cajaVista, _porMesero, _cjMesasAbiertas };', ctx);
  return { ctx, STATE, posts };
}
const riga = (lista, nome) => lista.find((m) => String(m.n).toLowerCase() === nome.toLowerCase());

function banco(SRC) {
  const k0 = ko;
  { const m = mondo(SRC, { salud: { flags: { caja_atto1_on: '1' } }, serv: bordoRisp([P('Wilbert', 'efectivo', 2190, 0)]) });
    t('① leva spenta: _cajaVista e STATE.caja, la STESSA cosa', m.ctx.F._cajaVista() === m.STATE.caja);
    const w = riga(m.ctx.F._porMesero(), 'Wilbert'); t('① bis … e la card di ieri: Wilbert «sin cobrar», 5.380 en sala (Google)', w && w.abierto === 5380 && w.n_abierto === 2 && !w.cobrado, w);
    return ko - k0 > 0 ? 0 : 0; }
}
async function bancoAsync(SRC) {
  { const m = mondo(SRC, { salud: { flags: { caja_atto1_on: '1' } }, risposta: bordoRisp([]) }); await m.ctx.F.giroServicio();
    t('① ter leva spenta: nessuna richiesta al bordo', m.posts.length === 0, m.posts); }
  { const m = mondo(SRC, { salud: { flags: { caja_servicio_on: '1' } }, risposta: bordoRisp([]) }); await m.ctx.F.giroServicio();
    t('① quinto la leva c e ma la caja della notte (atto1) e spenta: il verbo non esiste => nessuna richiesta', m.posts.length === 0 && !m.ctx.F._servOn(), m.posts); }
  { const m = mondo(SRC, { salud: null, risposta: bordoRisp([]) }); await m.ctx.F.giroServicio();
    t('① quater /salud muto (non ancora arrivato): spenta, nessuna richiesta', m.posts.length === 0 && m.ctx.F._cajaVista() === m.STATE.caja, m.posts); }
  { const m = mondo(SRC, { risposta: bordoRisp([P('Wilbert', 'efectivo', 2190, 219), P('Ray', 'debito', 10000, 0)]) }); await m.ctx.F.giroServicio();
    t('⑨ la richiesta: verbo servicio col PIN del JL, e basta', m.posts.length === 1 && m.posts[0].verbo === 'servicio' && m.posts[0].pin_jl === '2222', m.posts);
    t('⑨ bis la risposta ok si tiene e si data (STATE.serv, STATE.ts.serv)', m.STATE.serv && m.STATE.serv.ok && m.STATE.ts.serv > 0 && m.STATE.servErr === '' && m.ctx.pinta > 0);
    const l = m.ctx.F._porMesero(); const w = riga(l, 'Wilbert'), r = riga(l, 'Ray');
    t('② Wilbert: INCASSATO dal bordo (2.190 in 1 cobro), non piu «sin cobrar»', w && w.cobrado === 2190 && w.ctas === 1 && w.venta === 2190, w);
    t('② bis … e i tavoli aperti dalla FETTA (2.190 in 1 cuenta: la 200), non i 5.380 di Google', w && w.abierto === 2190 && w.n_abierto === 1, w);
    t('② ter Ray: incassato dal bordo (10.000 in 1), NON gli 80.000 in 6 di Google', r && r.cobrado === 10000 && r.ctas === 1, r);
    t('② quater Ray: aperto = la sua parte (mio 30.000 + 5.000 = 35.000 in 2 mesas), non il totale della 31 (40.000)', r && r.abierto === 35000 && r.n_abierto === 2, r);
    const q = l.find((x) => x.qr); t('② quinto la riga dei QR (chiave vuota): il servido di Google resta, l INCASSATO e quello del bordo (qui nessun pago senza nome => 0)', q && q.servido === 4000 && q.cobrado === 0, q);
    const c = m.ctx.F._cajaVista();
    t('② sesto i riquadri: venta e cuentas dal bordo (12.190 in 2), «abiertas» dalla fetta (3 mesas)', c.venta === 12190 && c.cuentas === 2 && c.abiertas_bordo === 3 && c.fuente_bordo === true, [c.venta, c.cuentas, c.abiertas_bordo]);
    t('⑧ STATE.caja NON si muta (la copia di Google resta com era)', m.STATE.caja.por_mesero.Ray.cobrado === 80000 && m.STATE.caja.venta === 100000 && m.STATE.caja.por_mesero.Wilbert.abierto === 5380, m.STATE.caja); }
  { const m = mondo(SRC, { serv: bordoRisp([P('WÍLBERT ', 'efectivo', 2190, 0)]) });
    const l = m.ctx.F._porMesero().filter((x) => /wilbert/i.test(x.n.normalize('NFD').replace(/[̀-ͯ]/g, '')));
    t('③ «WÍLBERT » del bordo e «Wilbert» di Google: UN mesero solo, col nome di Google', l.length === 1 && l[0].n === 'Wilbert' && l[0].cobrado === 2190, l); }
  { const m = mondo(SRC, { serv: bordoRisp([P('Nacho', 'efectivo', 7000, 0)]) });
    const n = riga(m.ctx.F._porMesero(), 'Nacho'); t('③ bis un mesero che Google non conosce ancora entra dal bordo (7.000 in 1)', n && n.cobrado === 7000 && n.ctas === 1, n); }
  { const m = mondo(SRC, { serv: bordoRisp([P('Eduardo', 'efectivo', 2190, 0, 'Wilbert')]) });
    const l = m.ctx.F._porMesero(); const w = riga(l, 'Wilbert'), e = riga(l, 'Eduardo');
    t('③ ter i DUE NOMI: Eduardo (JL) ha incassato per Wilbert: il numero e di Wilbert, Eduardo non compare con quel denaro', w && w.cobrado === 2190 && (!e || !e.cobrado), [w, e]); }
  { const m = mondo(SRC, { serv: bordoRisp([P('Wilbert', 'efectivo', 2190, 0)]), servTs: NOW - 4 * 60000 });
    t('④ dato del bordo piu vecchio di 3 minuti: non fresco => la card e quella di Google, intera', m.ctx.F._servFresco() === false && m.ctx.F._cajaVista() === m.STATE.caja);
    const w = riga(m.ctx.F._porMesero(), 'Wilbert'); t('④ bis … nessun mix: Wilbert come dice Google (5.380 en sala, 0 cobrado)', w && w.abierto === 5380 && !w.cobrado, w); }
  { const m = mondo(SRC, { serv: bordoRisp([P('Wilbert', 'efectivo', 2190, 0)]), risposta: { ok: false, error: 'pg_no_responde' } }); await m.ctx.F.giroServicio();
    t('④ ter il bordo risponde errore: il dato buono di prima resta (fresco), l errore si ricorda', m.STATE.servErr === 'pg_no_responde' && !!m.STATE.serv && m.STATE.serv.ok === true && m.ctx.F._servFresco() === true); }
  { const m = mondo(SRC, { cajaPost1: async () => { throw new Error('timeout'); } }); await m.ctx.F.giroServicio();
    t('④ quater timeout: nessun crash, Google resta, errore dichiarato', m.STATE.servErr === 'timeout' && m.ctx.F._cajaVista() === m.STATE.caja && m.STATE.servInVolo === false, m.STATE.servErr); }
  { const m = mondo(SRC, { risposta: { ok: false, error: 'servicio_spento' } }); await m.ctx.F.giroServicio();
    t('④ quinto leva del bordo spenta (servicio_spento): silenzio, Google', m.STATE.serv === null && m.ctx.F._cajaVista() === m.STATE.caja); }
  { const m = mondo(SRC, { serv: bordoRisp([P('', 'credito', 5000, 0), P('Ray', 'debito', 10000, 0)]) });
    const q = m.ctx.F._porMesero().find((x) => x.qr);
    t('② (EL GIRO ①) un pago SENZA nome del bordo va nella riga dei QR (5.000), e il totale dei riquadri lo comprende (15.000)', q && q.cobrado === 5000 && q.ctas === 1 && m.ctx.F._cajaVista().venta === 15000, [q, m.ctx.F._cajaVista().venta]); }
  { const v = VISTA(); v.meseros.ray = { ok: false, nombre: 'Ray' }; const cg = GOOGLE(); cg.por_mesero.Ray = { venta: 0, n: 0, cobrado: 0, n_cobros: 0, abierto: 777, n_abierto: 3 };
    const m = mondo(SRC, { vista: v, caja: cg, serv: bordoRisp([P('Wilbert', 'efectivo', 2190, 0)]) });
    const l = m.ctx.F._porMesero(); const r = riga(l, 'Ray'), w = riga(l, 'Wilbert'), g = riga(l, 'Gabriel');
    t('③ (EL GIRO ③) Ray ha la fetta ROTTA: tiene l abierto di Google (777 in 3), non uno zero inventato', r && r.abierto === 777 && r.n_abierto === 3, r);
    t('③ bis … mentre chi ha la fetta buona si azzera e si riempie dal bordo (Wilbert 2.190 in 1; Gabriel 10.000 in 1)', w && w.abierto === 2190 && g && g.abierto === 10000, [w, g]); }
  { const m = mondo(SRC, { vista: null, serv: bordoRisp([P('Wilbert', 'efectivo', 2190, 0)]) });
    const w = riga(m.ctx.F._porMesero(), 'Wilbert'); const c = m.ctx.F._cajaVista();
    t('⑤ senza fetta del bordo: incassato dal bordo, i tavoli aperti restano quelli di Google (non uno zero inventato)', w && w.cobrado === 2190 && w.abierto === 5380 && c.abiertas_bordo === undefined, [w, c.abiertas_bordo]); }
  { const m = mondo(SRC, { caja: null, serv: bordoRisp([P('Wilbert', 'efectivo', 2190, 0)]) });
    const c = m.ctx.F._cajaVista(); const w = riga(m.ctx.F._porMesero(), 'Wilbert');
    t('⑥ Google non ha risposto (caja nulla): il bordo basta, nessun crash', c && c.ok === true && c.venta === 2190 && w && w.cobrado === 2190 && w.abierto === 2190, [c && c.venta, w]); }
  { const m = mondo(SRC, { serv: bordoRisp([]) });
    const c = m.ctx.F._cajaVista(); const w = riga(m.ctx.F._porMesero(), 'Wilbert');
    const r = riga(m.ctx.F._porMesero(), 'Ray');
    t('② settimo il bordo dice «zero cobros»: e UNO ZERO VERO (Google non lo smentisce con ore di ritardo)', c.venta === 0 && c.cuentas === 0 && (!w || !w.cobrado) && r && r.cobrado === 0 && r.ctas === 6 - 6 + (r.servido ? r.ctas : 0), [c.venta, w, r]); }
  // ⑦ la fonte si dichiara
  t('⑦ la riga «📷 caja» dice DA DOVE: «del bordo» + l eta del bordo, in entrambi i posti', (SRC.match(/_servFresco\(\) \? 'del bordo ' \+ edadTxt\('serv'\) : edadTxt\('caja'\)/g) || []).length === 2);
  t('⑨ ter giroCaja chiama giroServicio (stessa cadenza, nessun timer nuovo)', /async function giroCaja\(\) \{\n  if \(DEMO \|\| !STATE\.pin\) return;\n  giroServicio\(\);/.test(SRC));
  t('⑨ quater la testata e la lista leggono _cajaVista, non STATE.caja', /function _porMesero\(\) \{\n  const c = _cajaVista\(\);/.test(SRC) && /const c = _cajaVista\(\);\n  const vuoto/.test(SRC));
}
function sincrono(SRC) { banco(SRC); }
sincrono(SRC0); await bancoAsync(SRC0);
const mut = async (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; sincrono(SRC0.replace(da, () => a)); await bancoAsync(SRC0.replace(da, () => a)); muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('⑩ mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
await mut('la leva e ignorata', "return cjFlag('caja_servicio_on') && cjAtto1On();", "return true;");
await mut('non serve il caja atto1', "return cjFlag('caja_servicio_on') && cjAtto1On();", "return cjFlag('caja_servicio_on');");
await mut('il dato vecchio resta fresco', "(Date.now() - STATE.ts.serv) < 180000", "true");
await mut('l incassato di Google si mescola', "pm[n].cobrado = 0; pm[n].n_cobros = 0;   // l'incassato", "   // l'incassato");
await mut('niente confronto per slug', "const k = _slugSalaJS(nome); if (porSlug[k] == null)", "const k = nome; if (porSlug[k] == null)");
await mut('i tavoli aperti restano di Google', "if (buoni.length) {", "if (false) {");
await mut('aperto = totale della mesa, non la parte sua', "const mio = +(x && x.mio) || 0;", "const mio = +(x && x.total) || 0;");
await mut('venta non dal bordo', "base.venta = +sv.venta || 0;", "");
await mut('STATE.caja si muta', "const sv = STATE.serv, base = Object.assign({}, c || { ok: true }), g = (c && c.por_mesero) || {}, pm = {}, porSlug = {};", "const sv = STATE.serv, base = c || { ok: true }, g = (c && c.por_mesero) || {}, pm = g, porSlug = {};");
await mut('il PIN non viaggia', "{ verbo: 'servicio', pin_jl: STATE.pin }", "{ verbo: 'servicio' }");
await mut('la fonte non si dichiara (caja)', "'<p class=\"mini\">📷 caja ' + (_servFresco() ? 'del bordo ' + edadTxt('serv') : edadTxt('caja')) + '</p></div>'", "'<p class=\"mini\">📷 caja ' + edadTxt('caja') + '</p></div>'");
await mut('giroCaja non chiama giroServicio', "giroServicio();   // [v1.37.2]", "// [v1.37.2]");
await mut('un errore azzera il dato buono', "else STATE.servErr = (r && r.error) || 'no_ok';", "else { STATE.servErr = (r && r.error) || 'no_ok'; STATE.serv = null; }");
await mut('la riga dei QR tiene l incassato di Google', "pm[n].cobrado = 0; pm[n].n_cobros = 0;   // l'incassato", "if (String(n).trim()) { pm[n].cobrado = 0; pm[n].n_cobros = 0; }   // l'incassato");
await mut('azzera l abierto a chi non ha la fetta', "buoni.forEach(function (k) {\n      let tot = 0, n = 0;", "Object.keys(pm).forEach(function (n) { if (String(n).trim()) { pm[n].abierto = 0; pm[n].n_abierto = 0; } });\n    buoni.forEach(function (k) {\n      let tot = 0, n = 0;");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
