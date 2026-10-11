// BANCO · NESSUN TURNO SI CHIUDE CON UNA MESA A SALDO — il cierre/apertura del JL (AUT-0666 punto 2 · app_jl v1.39.0) · TERZA PENNA
// Contratto di 🎛 BKP (`BKP 0666 PUNTO 2 D1716DE IL CANCELLO E LA PORTA`): GET <borde>/saldi/<local> con x-borde-token => { ok, mesas:[{mesa, consumo, pagato, resto, n_pagos, ts_ultimo_pago, meseros[]}], ignote:[…] };
// `sin_hechos` => {ok:false}. Regola: «NON SO NON BLOCCA» — una lettura che non riesce avvisa e NON ferma. Leva = /salud → corte_saldo_on (la stessa del cancello del corte).
// ① leva SPENTA: nessuna lettura, nessun blocco, nessuna scheda (il vetro di ieri) ② ACCESA: rotta+token+local giusti (RIESCO→RSC) ③ con mesas a saldo BLOCCA e lo dice (singolare/plurale) ④ NON SO (HTTP 5xx/403, sin_hechos, rete, JSON, mesas non array, timeout 5 s) avvisa e NON blocca
// ⑤ la scheda: resto, chi, eta, le due uscite del JL, nomi/mesa ESCAPATI ⑥ cablaggio: i tre cancelli (abrirT · cjCieEnviar · cjCieIgualEnviar) prima di ogni scrittura, bottone bloccato PRIMA dell'attesa e liberato se blocca, «cerrar igual» NON salta il saldo,
//   la scheda dentro il cierre, la lettura nel giro ⑦ CONTRATTO COL BORDO letto dal SORGENTE del bordo (rotta, header, nomi dei campi, nome della leva in /salud) ⑧ comportamento di abrirT col gate vero ⑨ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path'; import { execSync } from 'node:child_process';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'app_jl.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 320))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); const a = SRC.slice(Math.max(0, i - 6), i) === 'async ' ? i - 6 : i;
  const eol = SRC.indexOf('\n', i), r1 = SRC.slice(i, eol); if (/\}\s*$/.test(r1) && (r1.match(/\{/g) || []).length === (r1.match(/\}/g) || []).length) return SRC.slice(a, eol + 1);
  return SRC.slice(a, SRC.indexOf('\n}\n', i) + 3); };
const ESC = (s) => (s || '').toString().replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const FMT = (n) => '$' + (Math.round(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const MESAS = [
  { mesa: '100', consumo: 161970, pagato: 41970, resto: 120000, n_pagos: 1, ts_ultimo_pago: 1000000, meseros: ['Isa', 'Pedro'] },
  { mesa: '7', consumo: 30000, pagato: 10000, resto: 20000, n_pagos: 2, ts_ultimo_pago: 2000000, meseros: [] } ];
function mondo(SRC, o) {
  o = o || {}; const toasts = [], fetches = [], timers = [], ctxClicks = []; let pinta = 0;
  const ctx = { JSON, Math, Date, String, Number, Object, Array, Promise, console, encodeURIComponent, AbortController, esc: ESC, fmt: FMT,
    clearTimeout: () => {}, setTimeout: (fn) => { timers.push(fn); return timers.length; },
    CFG: { BORDE: 'https://b.test', T: 'tok', LOCAL: o.local || 'BKS' }, LOC_PG: { BKS: 'BKS', RIESCO: 'RSC' },
    STATE: { salud: o.salud === undefined ? { flags: { corte_saldo_on: '1' } } : o.salud }, CJ1: { st: null, saldos: o.saldos },
    toast: (k, m) => toasts.push([k, m]), pintaTab: () => { pinta++; },
    clicks: [], mesaAbrir: (a, b) => { ctxClicks.push(['abrir', a, b]); }, cjSinPagoMesa: (a) => { ctxClicks.push(['sinpago', a]); },
    fetch: async (url, opt) => { fetches.push([url, opt]); const r = o.fetch; if (r instanceof Error) throw r; if (r && r.cuelga) return new Promise((_, rej) => { opt.signal.addEventListener('abort', () => rej(new Error('abort'))); });
      return { status: r.status || 200, ok: (r.status || 200) < 400, json: async () => { if (r.illeggibile) throw new Error('x'); return r.body; } }; } };
  vm.createContext(ctx);
  vm.runInContext(['cjFlag', 'cjSaldoOn', 'cjSaldosLeer', 'cjSaldosGate', 'cjSaldosAviso', 'cjSaldosHtml', '_cjJs'].map((n) => fnDe(SRC, n)).join('\n') + '\nthis.F = { cjSaldoOn, cjSaldosLeer, cjSaldosGate, cjSaldosAviso, cjSaldosHtml };', ctx);
  return { ctx, F: ctx.F, toasts, fetches, timers, clicks: ctxClicks, pinta: () => pinta };
}
const OK = (mesas) => ({ body: { ok: true, local: 'BKS', ts: 1, foto_edad_s: 3, mesas: mesas, ignote: [] } });
async function banco(SRC) {
  // ① leva spenta
  for (const salud of [undefined, null, {}, { flags: {} }, { flags: { corte_saldo_on: '0' } }]) {
    const m = mondo(SRC, { salud: salud === undefined ? {} : salud, fetch: OK(MESAS), saldos: MESAS }); const g = await m.F.cjSaldosGate();
    t('① leva spenta (' + JSON.stringify(salud) + '): nessuna lettura, nessun blocco, nessun avviso', m.fetches.length === 0 && g.bloquea === false && g.nosabe === false && m.F.cjSaldosHtml() === '' && m.toasts.length === 0, [m.fetches.length, g]); }
  // ② accesa: rotta, token, local
  { const m = mondo(SRC, { fetch: OK([]) }); const g = await m.F.cjSaldosGate();
    t('② accesa + zero mesas: non blocca, non avvisa', g.bloquea === false && g.nosabe === false && m.toasts.length === 0, g);
    t('② bis rotta /saldi/<local>, header x-borde-token, mai in query, cache no-store, con segnale', m.fetches[0][0] === 'https://b.test/saldi/BKS' && m.fetches[0][1].headers['x-borde-token'] === 'tok' && !/[?&]t=/.test(m.fetches[0][0]) && m.fetches[0][1].cache === 'no-store' && !!m.fetches[0][1].signal, m.fetches[0]); }
  { const m = mondo(SRC, { local: 'RIESCO', fetch: OK([]) }); await m.F.cjSaldosGate();
    t('② ter RIESCO => /saldi/RSC (la tabella LOC_PG, come tutto il vetro)', m.fetches[0][0] === 'https://b.test/saldi/RSC', m.fetches[0][0]); }
  // ③ con saldi
  { const m = mondo(SRC, { fetch: OK(MESAS) }); const g = await m.F.cjSaldosGate();
    t('③ due mesas a saldo: BLOCCA, le porta, e la scheda ha di che disegnare', g.bloquea === true && g.nosabe === false && g.mesas.length === 2 && m.ctx.CJ1.saldos.length === 2, g);
    m.F.cjSaldosAviso(g);
    t('③ bis l avviso e un errore (non un warn), dice il numero al plurale e ridisegna', m.toasts.length === 1 && m.toasts[0][0] === 'err' && /Hay 2 mesas a saldo/.test(m.toasts[0][1]) && m.pinta() === 1, [m.toasts, m.pinta()]); }
  { const m = mondo(SRC, { fetch: OK([MESAS[0]]) }); const g = await m.F.cjSaldosGate(); m.F.cjSaldosAviso(g);
    t('③ ter una sola: singolare, e il testo non allarma coi soldi (niente cifre inventate)', /Hay 1 mesa a saldo:/.test(m.toasts[0][1]) && !/mesas a saldo/.test(m.toasts[0][1]), m.toasts); }
  // ④ NON SO NON BLOCCA
  const NONSO = [['HTTP 500', { status: 500, body: { ok: false } }], ['HTTP 403 token', { status: 403, body: { ok: false, error: 'token_invalid' } }], ['HTTP 404', { status: 404, body: { ok: false } }],
    ['sin_hechos (200 ma ok:false)', { body: { ok: false, error: 'sin_hechos' } }], ['rete caduta', new Error('net')], ['JSON illeggibile', { illeggibile: true }],
    ['mesas non e un array', { body: { ok: true, mesas: null } }], ['corpo vuoto', { body: null }]];
  for (const [nome, fetch] of NONSO) { const m = mondo(SRC, { fetch: fetch, saldos: [] }); const g = await m.F.cjSaldosGate(); m.F.cjSaldosAviso(g);
    t('④ NON SO — ' + nome + ': NON blocca, avvisa (warn) e non ridisegna', g.bloquea === false && g.nosabe === true && m.toasts.length === 1 && m.toasts[0][0] === 'warn' && /No pude revisar los saldos/.test(m.toasts[0][1]) && m.pinta() === 0, [g, m.toasts]); }
  { const m = mondo(SRC, { fetch: { cuelga: true } }); const p = m.F.cjSaldosGate(); await Promise.resolve(); await Promise.resolve();
    t('④ bis timeout: il tetto e 5 s', m.timers.length === 1, m.timers.length); m.timers[0](); const g = await Promise.race([p, new Promise((r) => setTimeout(() => r('APPESO'), 80))]);
    t('④ ter timeout scaduto: NON blocca e dice che non sa (e non resta appeso)', g !== 'APPESO' && g.bloquea === false && g.nosabe === true, g); }
  // ⑤ la scheda
  { const m = mondo(SRC, { saldos: MESAS }); const h = m.F.cjSaldosHtml();
    t('⑤ la scheda: mesa, resto, pagato/consumo, chi, il conteggio', /Mesa 100/.test(h) && /resto \$120\.000/.test(h) && /pagado \$41\.970 de \$161\.970/.test(h) && /Isa, Pedro/.test(h) && /Mesas a saldo <span class="pill off">2<\/span>/.test(h), h.slice(0, 400));
    t('⑤ bis le due uscite del JL per ogni mesa: Cobrar/eliminar (mesaAbrir) e Se fue sin pagar (cjSinPagoMesa)', (h.match(/mesaAbrir\(/g) || []).length === 2 && (h.match(/cjSinPagoMesa\(/g) || []).length === 2 && /Se fue sin pagar/.test(h) && /Cobrar \/ eliminar/.test(h), h.slice(0, 200));
    t('⑤ ter senza il mesero non si inventa un nome (mesa 7 non ha meseros) e la prima apre con il nome vuoto', /mesaAbrir\(&quot;Isa&quot;,&quot;100&quot;\)/.test(h) && /mesaAbrir\(&quot;&quot;,&quot;7&quot;\)/.test(h), h.match(/mesaAbrir\([^)]*\)/g)); }
  { const NASTY = "9'<b>\"\\", NM = "<i>x'"; const m = mondo(SRC, { saldos: [{ mesa: NASTY, consumo: 5000, pagato: 1000, resto: 4000, ts_ultimo_pago: 1, meseros: [NM] }] }); const h = m.F.cjSaldosHtml();
    t('⑤ quater niente HTML crudo dai nomi (tag o apici fuori posto)', !/<b>|<i>/.test(h), h.slice(0, 300));
    /* l attributo si DECODIFICA prima di girare: si simula il browser (decodifica le entita, poi esegue il JS) e si chiede che gli argomenti tornino IDENTICI — senza rompere ne iniettare */
    const dec = (a) => a.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const ons = [...h.matchAll(/onclick="([^"]*)"/g)].map((x) => dec(x[1])); let err = '';
    ons.forEach((code) => { try { vm.runInContext(code, m.ctx); } catch (e) { err = String(e); } });
    t('⑤ quater bis i due onclick, decodificati come fa il browser, chiamano le funzioni con i nomi ESATTI (nessuna rottura, nessuna iniezione)', !err && ons.length === 2 && JSON.stringify(m.clicks) === JSON.stringify([['abrir', NM, NASTY], ['sinpago', NASTY]]), [err, m.clicks]); }
  { const m = mondo(SRC, { salud: {}, saldos: MESAS }); const h = m.F.cjSaldosHtml();
    t('⑤ quinquies la scheda e muta a leva spenta anche se CJ1.saldos e pieno (stato stantio)', h === '', h); }
  { const m = mondo(SRC, { saldos: [] }); t('⑤ sexies senza mesas: nessuna scheda (niente rumore, N8)', m.F.cjSaldosHtml() === ''); }
  // ⑥ cablaggio
  const ord = (SRC_, fn, a, b) => { const f = fnDe(SRC_, fn); const i = f.indexOf(a), j = f.indexOf(b); return i >= 0 && j >= 0 && i < j; };
  t('⑥ abrirT: il gate viene PRIMA della scrittura (apertura al bordo)', ord(SRC, 'abrirT', 'await cjSaldosGate()', '_aperturaPorBordo('));
  t('⑥ bis abrirT: se blocca, esce (return) — niente apertura', /const sgA = await cjSaldosGate\(\); if \(sgA\.bloquea \|\| sgA\.nosabe\) \{ cjSaldosAviso\(sgA\); if \(sgA\.bloquea\) return; \}/.test(fnDe(SRC, 'abrirT')));
  t('⑥ ter cjCieEnviar: il gate viene dopo il controllo mesas abiertas e PRIMA di cajaPost1', ord(SRC, 'cjCieEnviar', "toast('warn', 'Quedan mesas abiertas')", 'await cjSaldosGate()') && ord(SRC, 'cjCieEnviar', 'await cjSaldosGate()', 'await cajaPost1('));
  t('⑥ quater cjCieIgualEnviar: «cerrar igual» NON salta il saldo — gate dopo motivo+PIN e PRIMA di cajaPost1', ord(SRC, 'cjCieIgualEnviar', "Escribe tu PIN", 'await cjSaldosGate()') && ord(SRC, 'cjCieIgualEnviar', 'await cjSaldosGate()', 'await cajaPost1('));
  t('⑥ quinquies bottone bloccato PRIMA dell attesa e liberato se il gate blocca (cjCieEnviar + cjCieIgualEnviar)', ['cjCieEnviar', 'cjCieIgualEnviar'].every((n) => { const f = fnDe(SRC, n); return f.indexOf('btn.disabled = true') >= 0 && f.indexOf('btn.disabled = true') < f.indexOf('await cjSaldosGate()') && /if \(sg[CI]\.bloquea\) \{ if \(btn\) btn\.disabled = false; return; \}/.test(f); }));
  t('⑥ sexies la scheda sta dentro il cierre (cjAtto1Html) e la lettura nel giro, dietro la leva', /h \+= cjSaldosHtml\(\);/.test(fnDe(SRC, 'cjAtto1Html')) && /if \(cjSaldoOn\(\)\) \{ const sd = await cjSaldosLeer\(\); if \(sd\.ok\) CJ1\.saldos = sd\.mesas; \}/.test(fnDe(SRC, 'cjAtto1Giro')));
  t('⑥ septies la leva e quella del bordo e si legge da /salud (cjFlag), mai un letterale acceso', /function cjSaldoOn\(\) \{ return cjFlag\('corte_saldo_on'\); \}/.test(SRC) && !/corte_saldo_on\s*=\s*true/.test(SRC));
  t('⑥ octies spenta e nulla: nessun altro punto di app_jl legge /saldi', (SRC.match(/CFG\.BORDE \+ '\/saldi\/'/g) || []).length === 1);
  t('versione >= 1.39.0', /id="ver">app_jl v1\.(39\.\d|[4-9]\d\.\d)</.test(SRC));
  // ⑦ contratto col bordo (sorgente vero, mai un letterale mio)
  let B = ''; try { B = process.env.BORDO_SRC ? fs.readFileSync(process.env.BORDO_SRC, 'utf8') : execSync('git -C ../_wt_roja show bkp-saldo-0666-11ott:src/index.js', { cwd: AQUI, maxBuffer: 1 << 28 }).toString(); } catch (e) { B = ''; }
  if (!B) { if (!muto) console.log('⚠ sorgente del bordo non trovato (BORDO_SRC): il ⑦ NON gira'); ko++; }
  else {
    t('⑦ il bordo espone GET /saldi/:local con il token di lettura (header X-Borde-Token)', /if \(rotta === 'saldi'\)/.test(B) && /X-Borde-Token/.test(B.slice(B.indexOf("rotta === 'saldi'"), B.indexOf("rotta === 'saldi'") + 600)));
    t('⑦ bis i campi della mesa sono quelli che il vetro legge (mesa · consumo · pagato · resto · ts_ultimo_pago · meseros)', /out\.mesas\.push\(\{ mesa: m, consumo: consumo, pagato: pagato, resto: consumo - pagato, n_pagos: n, ts_ultimo_pago: ult, meseros: meseros \}\)/.test(B));
    t('⑦ ter sin_hechos e {ok:false} (il vetro lo legge come NON SO)', /return \{ ok: false, error: 'sin_hechos' \}/.test(B));
    t('⑦ quater la leva si chiama corte_saldo_on in /salud (lo stesso nome che il vetro cerca)', /corte_saldo_on/.test(B) && new RegExp("cjFlag\\('corte_saldo_on'\\)").test(SRC)); }
  // ⑧ abrirT col gate VERO
  const aper = (o) => { const toasts = [], fetches = [], gas = []; let giro = 0; const m = mondo(SRC, o);
    Object.assign(m.ctx, { STATE: { pin: '4321', user: 'Pedro', salud: { flags: { corte_saldo_on: '1' } } }, confirm: () => true, giroTurno: () => { giro++; }, _uidGesto: () => 'u-1',
      gasPost: async (a, b) => { gas.push([a, b]); return { ok: true, codigo: '9999' }; }, toast: (k, mm) => toasts.push([k, mm]), apertura: [] });
    const f0 = m.ctx.fetch; m.ctx.fetch = async (url, opt) => { if (/\/saldi\//.test(url)) return f0(url, opt); fetches.push(url); return { status: 200, ok: true, json: async () => ({ ok: true, abierto: true, ya_abierto: false, codigo: '1234', abierto_por: 'Pedro', ts_apertura: 1 }) }; };
    vm.runInContext(['_aperturaPorBordo', 'abrirT'].map((n) => fnDe(SRC, n)).join('\n') + '\nconst _ERR_APERTURA = ' + SRC.match(/const _ERR_APERTURA = (\{[^\n]*\});/)[1] + ';\nthis.G = { abrirT };', m.ctx);
    return { m, toasts, fetches, gas, giro: () => giro }; };
  { const a = aper({ fetch: OK(MESAS) }); await a.m.ctx.G.abrirT();
    t('⑧ abrirT con una mesa a saldo: NON apre (niente POST /turno/apertura, niente GAS, niente giroTurno) e lo dice', a.fetches.length === 0 && a.gas.length === 0 && a.giro() === 0 && a.toasts.some((x) => x[0] === 'err' && /mesas a saldo/.test(x[1])), [a.fetches, a.gas, a.toasts]); }
  { const a = aper({ fetch: OK([]) }); await a.m.ctx.G.abrirT();
    t('⑧ bis abrirT senza saldi: apre dal bordo come ieri (codigo 1234)', a.fetches.length === 1 && /\/turno\/apertura\/BKS$/.test(a.fetches[0]) && a.toasts.some((x) => /código 1234/.test(x[1])) && a.giro() === 1, [a.fetches, a.toasts]); }
  { const a = aper({ fetch: { status: 500, body: { ok: false } } }); await a.m.ctx.G.abrirT();
    t('⑧ ter abrirT con la lettura rotta: NON SO NON BLOCCA — apre, e avvisa', a.fetches.length === 1 && a.toasts.some((x) => x[0] === 'warn') && a.toasts.some((x) => /código 1234/.test(x[1])), [a.fetches, a.toasts]); }
  { const a = aper({ salud: {}, fetch: OK(MESAS) }); a.m.ctx.STATE.salud = {}; await a.m.ctx.G.abrirT();
    t('⑧ quater abrirT a leva spenta: nessuna lettura di /saldi, apre come ieri', a.m.fetches.length === 0 && a.fetches.length === 1, [a.m.fetches.length, a.fetches]); }
}
await banco(SRC0);
const mut = async (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; try { await banco(SRC0.replace(da, () => a)); } catch (e) { ko++; } muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
await mut('la leva non spegne la lettura', "if (!cjSaldoOn()) return { bloquea: false, nosabe: false, mesas: [] };", "");
await mut('la leva nasce accesa', "function cjSaldoOn() { return cjFlag('corte_saldo_on'); }", "function cjSaldoOn() { return true; }");
await mut('la leva ha un altro nome', "return cjFlag('corte_saldo_on'); }", "return cjFlag('corte_saldo'); }");
await mut('il token va in query', "headers: { 'x-borde-token': CFG.T }, cache", "headers: {}, cache");
await mut('manca la tabella LOC_PG', "encodeURIComponent(LOC_PG[CFG.LOCAL] || CFG.LOCAL)", "encodeURIComponent(CFG.LOCAL)");
await mut('niente timeout', "setTimeout(function () { ctrl.abort(); }, 5000)", "setTimeout(function () { }, 5000)");
await mut('NON SO blocca (lettura fallita)', "if (!sd.ok) return { bloquea: false, nosabe: true, mesas: [] };", "if (!sd.ok) return { bloquea: true, nosabe: true, mesas: [] };");
await mut('NON SO tace', "if (!sd.ok) return { bloquea: false, nosabe: true, mesas: [] };", "if (!sd.ok) return { bloquea: false, nosabe: false, mesas: [] };");
await mut('mesas stesse non bloccano', "return { bloquea: sd.mesas.length > 0, nosabe: false, mesas: sd.mesas };", "return { bloquea: false, nosabe: false, mesas: sd.mesas };");
await mut('ok:false (sin_hechos) letto come vuoto', "if (!r.ok || !j || j.ok !== true || !Array.isArray(j.mesas)) return { ok: false };", "if (!r.ok || !j || !Array.isArray(j.mesas)) return { ok: true, mesas: [], ignote: [] };");
await mut('mesas non-array accettato', "|| !Array.isArray(j.mesas)) return { ok: false };", ") return { ok: false };");
await mut('l avviso non ridisegna', "    try { pintaTab(); } catch (e) {}\n  } else if (sg.nosabe)", "  } else if (sg.nosabe)");
await mut('l avviso del NON SO e un errore', "toast('warn', 'No pude revisar los saldos", "toast('err', 'No pude revisar los saldos");
await mut('manca la via «se fue sin pagar»', "onclick=\"cjSinPagoMesa(", "onclick=\"x(");
await mut('l onclick usa esc senza JSON (apice che torna vero)', "onclick=\"mesaAbrir(' + _cjJs((m.meseros && m.meseros[0]) || '') + ',' + _cjJs(m.mesa) + ')\"", "onclick=\"mesaAbrir(\\'' + esc((m.meseros && m.meseros[0]) || '') + '\\',\\'' + esc(m.mesa) + '\\')\"");
await mut('manca «cobrar / eliminar»', "onclick=\"mesaAbrir(", "onclick=\"x(");
await mut('i nomi non si escapano', "'<div class=\"cob\">Mesa ' + esc(m.mesa)", "'<div class=\"cob\">Mesa ' + m.mesa");
await mut('la scheda ignora la leva', "const l = (cjSaldoOn() && CJ1.saldos) || [];", "const l = CJ1.saldos || [];");
await mut('abrirT senza gate', "const sgA = await cjSaldosGate(); if (sgA.bloquea || sgA.nosabe) { cjSaldosAviso(sgA); if (sgA.bloquea) return; }", "");
await mut('abrirT avvisa ma non esce', "cjSaldosAviso(sgA); if (sgA.bloquea) return; }", "cjSaldosAviso(sgA); }");
await mut('cjCieEnviar senza gate', "const sgC = await cjSaldosGate(); if (sgC.bloquea || sgC.nosabe) { cjSaldosAviso(sgC); if (sgC.bloquea) { if (btn) btn.disabled = false; return; } }", "");
await mut('cjCieEnviar non libera il bottone', "if (sgC.bloquea) { if (btn) btn.disabled = false; return; }", "if (sgC.bloquea) { return; }");
await mut('cjCieIgualEnviar senza gate (cerrar igual salta il saldo)', "const sgI = await cjSaldosGate(); if (sgI.bloquea || sgI.nosabe) { cjSaldosAviso(sgI); if (sgI.bloquea) { if (btn) btn.disabled = false; return; } }", "");
await mut('cjCieIgualEnviar non libera il bottone', "if (sgI.bloquea) { if (btn) btn.disabled = false; return; }", "if (sgI.bloquea) { return; }");
await mut('la scheda non e nel cierre', "  h += cjSaldosHtml();   // [AUT-0666]", "  // [AUT-0666]");
await mut('il giro non legge i saldi', "if (cjSaldoOn()) { const sd = await cjSaldosLeer(); if (sd.ok) CJ1.saldos = sd.mesas; }", "");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
