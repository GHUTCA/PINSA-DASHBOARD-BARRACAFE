// BANCO · LA BUSTA R, UNA PER NOTTE — il VETRO (AUT-0659, ordine di Alberto «giorno per giorno, non accumulato») · TERZA PENNA
// Il contratto e `roja_estado` (bordo `750ae67`) e le formule di ADMIN: «a banca = contado − reserva, per ogni salida»; la salida di martedi porta la R-0001 (99.500) come riserva del 09:
// contado BRUTO = lo contato + 99.500, reserva = 99.500 + le buste nuove, a banca = lo contato − le buste nuove. Si eseguono le funzioni VERE del vetro (pantalla9, pantallaRojaNotte, desglose) con letture finte.
// ① la schermata: totale UNO, «Roja ya sellada», tabella per giorno con la R-0001 sul 09 ② la salida: contado lordo · reserva · a banca, l invariante per ogni contado editato ③ una busta per notte con debito
// (10 · 11 · 12), MAI il 09 (coperto), uid `res-<salida>-<notte>`, il numero del bordo a schermo ④ un rifiuto non avanza e il retry usa lo stesso uid ⑤ la secuenza si riprende dopo un cierre dell app
// (le gia sigillate non si ripetono) ⑥ leva spenta (404 lettura_sconosciuta) => la busta unica di ieri ⑦ un errore che NON e «sin roja» ferma (nessuna uscita al banco a ciegas) ⑧ sin_cuota col calcolo e l avviso
// ⑨ tutto coperto => nessuna busta ⑩ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'caja_cajera.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 360))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); const a = SRC.slice(Math.max(0, i - 6), i) === 'async ' ? i - 6 : i;
  const eol = SRC.indexOf('\n', i), r1 = SRC.slice(i, eol);
  if (/\}\s*$/.test(r1) && (r1.match(/\{/g) || []).length === (r1.match(/\}/g) || []).length) return SRC.slice(a, eol + 1);
  return SRC.slice(a, SRC.indexOf('\n}\n', i) + 3); };
const S = (dia, nro, contado) => ({ sobre_nro: nro, dia, declarado: 0, conteo: { contado } });
const NOCHES = ['2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12'];
const SOBRES = [S('2026-10-09', '1005', 982000), S('2026-10-10', '1006', 300000), S('2026-10-11', '1007', 250000), S('2026-10-12', '1008', 100000)];
const ROJA = (o) => Object.assign({ ok: true, roja: true, reserva_pct: 5, sueltas: [{ uid: 'res-vieja', numero: 'R-0001', dia: '2026-10-09', importo: 99500 }], sueltas_total: 99500,
  noches: [{ dia: '2026-10-09', estado: 'coperta', importo: 0, quota: 51214, coperto: 51214, debito: 0 }, { dia: '2026-10-10', estado: 'da_sigillare', importo: 40000, quota: 40000, coperto: 0, debito: 40000 },
    { dia: '2026-10-11', estado: 'da_sigillare', importo: 31250, quota: 31250, coperto: 0, debito: 31250 }, { dia: '2026-10-12', estado: 'da_sigillare', importo: 12800, quota: 12800, coperto: 0, debito: 12800 }] }, o || {});

function mondo(SRC, o) {
  const els = {}, handlers = {}, toasts = [], posts = [], app = { innerHTML: '' }, ls = Object.assign({}, o.ls || {});
  let nro = 1;
  const mk = (id) => (els[id] || (els[id] = { id, _v: undefined, get value() { if (this._v !== undefined) return this._v; const q = app.innerHTML.match(/id="contado"[^>]*value="(\d+)"/); return q ? q[1] : ''; }, set value(x) { this._v = x; }, innerHTML: '', disabled: false, onclick: null, addEventListener(ev, fn) { (handlers[id] = handlers[id] || {})[ev] = fn; } }));
  const ctx = { JSON, Math, Date, String, Number, Object, Array, Promise, console, app, MULTI: o.multi !== false, NOCHES: o.noches || NOCHES, MANANA: { sobres: o.sobres || SOBRES, noEnc: [], dejadas: [] }, DEPOSITO_PENDIENTE: null, PASO: 4, DIA_HOY: '2026-10-13', DIA_NOCHE: '2026-10-12', UIDS_GESTO: {}, _u: 0, rendered: [], pantalla9n: 0,
    barra: () => '', esc: (x) => String(x == null ? '' : x), fmt: (n) => '$' + n, fechaCorta: (d) => d, toast: (m, k) => toasts.push([m, k]), renderError: (a, b) => ctx.rendered.push(['error', a, b]), pantalla6() {}, pantallaReservaSobre: (d, m) => ctx.rendered.push(['unica', d, m]),
    uidGesto: (p) => p + '-' + (++ctx._u), unTocoUnHecho: (b, fn) => { b.onclick = fn; }, SES: { user: 'Mayra' }, localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } },
    postCaja: async (b) => { posts.push(b); if (b.verbo === 'reserva_sobre') { const f = o.falla && o.falla.shift ? o.falla.shift() : null; if (f) return { ok: false, motivo: f }; return { ok: true, sobre_nro: 'R-000' + (++nro), scritto: true }; } return { ok: true, accodato: true }; },
    getCaja: async (p) => {
      if (/^deposito_pendiente/.test(p)) return { ok: true, salida_pendiente: o.pend || null };
      if (/^roja_estado/.test(p)) { ctx.rojaPath = p; return o.roja === undefined ? ROJA() : o.roja; }
      const m = p.match(/^reserva\?dia=(.+)$/); if (m) return { ok: true, reserva: (o.reservas || {})[m[1]], reserva_pct: 5 };
      return { ok: false, error: 'lettura_sconosciuta' }; },
    document: { getElementById: mk, querySelector: mk } };
  vm.createContext(ctx);
  vm.runInContext(['desgloseDeposito', 'desgloseHtml', 'legamiHtml', 'pantallaRojaError', 'rojaPendLeer', 'rojaPendGuardar', 'rojaPendLimpiar', 'rojaSiguiente', 'pantallaRojaNotte', 'pantalla9', 'uidGestoEstable'].map((n) => fnDe(SRC, n)).join('\n') + '\nvar ROJA_PEND_KEY = "caja_roja_pend_v1";\nthis.F = { pantalla9, pantallaRojaNotte, desgloseDeposito };', ctx);
  return { ctx, mk, handlers, toasts, posts, app, ls };
}
const calc = (m) => m.mk('calc').innerHTML;
const click = async (m, id) => { await m.mk(id).onclick(); };
const SALIDA = (m) => m.posts.find((p) => p.verbo === 'deposito');
const BUSTE = (m) => m.posts.filter((p) => p.verbo === 'reserva_sobre');

async function banco(SRC) {
  // ① la schermata
  { const m = mondo(SRC, {}); await m.ctx.F.pantalla9(); const c = calc(m);
    t('① la lettura va a `roja_estado` con il giorno e TUTTE le notti', /^roja_estado\?dia=2026-10-13&noches=2026-10-09,2026-10-10,2026-10-11,2026-10-12$/.test(m.ctx.rojaPath), m.ctx.rojaPath);
    t('① il totale e UNO: «Vas a depositar» = lo contato 1.632.000 − le buste nuove 84.050 = 1.547.950', /Vas a depositar<\/span><span class="v">\$1547950</.test(c), c.slice(0, 600));
    t('① bis «Roja ya sellada (R-0001) + $99500» come riga e la reserva totale 183.550 (R-0001 + 3 buste nuove)', /Roja ya sellada \(R-0001\)<\/span><span class="v">\+ \$99500/.test(c) && /Reserva: roja ya sellada \+ 3 sobres nuevos<\/span><span class="v">\$183550/.test(c), c);
    t('① ter la tabella «Por día» con la R-0001 sul 09: 1.081.500 − 99.500 → 982.000; e 10 · 11 · 12 con C − R', /2026-10-09<small>1 sobre · contado \$1081500 − reserva \$99500<\/small><\/span><span class="v">\$982000/.test(c) && /2026-10-10<small>1 sobre · contado \$300000 − reserva \$40000<\/small><\/span><span class="v">\$260000/.test(c) && /2026-10-12<small>1 sobre · contado \$100000 − reserva \$12800<\/small><\/span><span class="v">\$87200/.test(c), c);
    t('① quater nessun «Ajuste manual» (le righe sommano al totale: 1.731.500 lordo)', !/Ajuste manual/.test(c), c);
    t('① quinto la nota della cuota non c e (tutte le notti hanno quota)', !/Sin cuota/.test(c)); }
  // ② la salida e l'invariante
  { const m = mondo(SRC, {}); await m.ctx.F.pantalla9(); await click(m, 'salir'); const s = SALIDA(m);
    t('② la salida: contado LORDO 1.731.500 · reserva 183.550 · a banca 1.547.950', s && s.contado === 1731500 && s.reserva === 183550 && s.a_depositar === 1547950, s);
    t('② bis l invariante di ADMIN: a banca = contado − reserva', s.a_depositar === s.contado - s.reserva);
    t('② quater la salida dice quali buste R gia sigillate CONTA (la R-0001): `rojas` per il legame alla vuelta', s.rojas && s.rojas.length === 1 && s.rojas[0].uid === 'res-vieja' && s.rojas[0].numero === 'R-0001' && s.rojas[0].importo === 99500, s.rojas);
    t('② ter la salida dice quali sobres porta (4)', s.sobres.length === 4 && s.sobres[0].dia === '2026-10-09', s.sobres); }
  for (const nuovo of ['1000000', '1632000', '1700000']) {
    const m = mondo(SRC, {}); await m.ctx.F.pantalla9(); m.mk('contado').value = nuovo; m.handlers.contado.input(); await click(m, 'salir'); const s = SALIDA(m); const neto = Number(nuovo);
    t('② quater contado editato a ' + nuovo + ': a banca = contado − reserva, e = lo contato − le buste nuove (' + (neto - 84050) + ')', s.a_depositar === s.contado - s.reserva && s.a_depositar === neto - 84050 && s.contado === neto + 99500, s); }
  { const m = mondo(SRC, {}); await m.ctx.F.pantalla9(); m.mk('contado').value = '50000'; m.handlers.contado.input();
    t('② quinto un contado che non copre le buste nuove: il bottone si spegne e lo dice', m.mk('salir').disabled === true && /no cubre la reserva/.test(calc(m)), calc(m)); }
  // ③ la sequenza
  { const m = mondo(SRC, {}); await m.ctx.F.pantalla9(); await click(m, 'salir'); const dep = SALIDA(m).uid_gesto;
    t('③ dopo la salida: la prima schermata e «sobre 1 de 3» della notte 10, 40.000, SENZA il 09', /sobre 1 de 3/.test(m.app.innerHTML) && /Noche 2026-10-10/.test(m.app.innerHTML) && /\$40000/.test(m.app.innerHTML) && !/2026-10-09/.test(m.app.innerHTML), m.app.innerHTML);
    await click(m, 'sellarRoja');
    t('③ bis la 1a busta: verbo reserva_sobre, uid res-<salida>-<notte>, dia_op = la notte, monto = il debito, referencia = la salida', BUSTE(m).length === 1 && BUSTE(m)[0].uid_gesto === 'res-' + dep + '-2026-10-10' && BUSTE(m)[0].dia_op === '2026-10-10' && BUSTE(m)[0].monto === 40000 && BUSTE(m)[0].referencia_uid === dep, BUSTE(m));
    t('③ ter il numero del bordo resta a schermo (persistente) e il bottone dice «Siguiente sobre»', /R-0002/.test(m.app.innerHTML) && /Siguiente sobre/.test(m.app.innerHTML), m.app.innerHTML);
    await click(m, 'sigRoja'); t('③ quater sobre 2 de 3: notte 11, 31.250', /sobre 2 de 3/.test(m.app.innerHTML) && /Noche 2026-10-11/.test(m.app.innerHTML) && /\$31250/.test(m.app.innerHTML));
    await click(m, 'sellarRoja'); await click(m, 'sigRoja'); await click(m, 'sellarRoja');
    t('③ quinto in tutto 3 buste (10 · 11 · 12), MAI il 09: i dia_op sono nell ordine e i monti sono i debiti', BUSTE(m).map((b) => b.dia_op).join() === '2026-10-10,2026-10-11,2026-10-12' && BUSTE(m).map((b) => b.monto).join() === '40000,31250,12800', BUSTE(m).map((b) => [b.dia_op, b.monto]));
    t('③ sesto l ultima dice «Listo»', /Listo/.test(m.app.innerHTML) && /R-0004/.test(m.app.innerHTML));
    await click(m, 'sigRoja');
    t('③ settimo dopo «Listo»: «Registrado», la memoria locale si pulisce, torna al deposito', m.toasts.some((x) => /Registrado/.test(x[0])) && m.ls.caja_roja_pend_v1 === undefined, [m.toasts, m.ls]); }
  // ④ un rifiuto non avanza
  { const m = mondo(SRC, { falla: ['rifiutato'] }); await m.ctx.F.pantalla9(); await click(m, 'salir'); await click(m, 'sellarRoja');
    t('④ il bordo rifiuta: «No se guardó», si resta sulla STESSA busta (nessun avanzamento)', m.toasts.some((x) => /No se guardó: rifiutato/.test(x[0])) && /sobre 1 de 3/.test(m.app.innerHTML) && BUSTE(m).length === 1, [m.toasts, BUSTE(m).length]);
    await click(m, 'sellarRoja');
    t('④ bis il retry riusa lo STESSO uid (il bordo risponde con lo stesso numero, mai un secondo)', BUSTE(m).length === 2 && BUSTE(m)[0].uid_gesto === BUSTE(m)[1].uid_gesto, BUSTE(m).map((b) => b.uid_gesto)); }
  // ⑤ riprendere dopo un cierre dell'app
  { const m = mondo(SRC, {}); await m.ctx.F.pantalla9(); await click(m, 'salir'); const dep = SALIDA(m).uid_gesto; await click(m, 'sellarRoja');   // la 1a sigillata, poi si chiude l app
    const m2 = mondo(SRC, { ls: m.ls, pend: { uid_gesto: dep, a_depositar: 1547950 } }); await m2.ctx.F.pantalla9();
    t('⑤ riaperta l app con la salida pendiente: NON «De vuelta del banco» ma la sobre 2 de 3 (la 1a e gia sigillata)', /sobre 2 de 3/.test(m2.app.innerHTML) && /Noche 2026-10-11/.test(m2.app.innerHTML) && !/De vuelta del banco/.test(m2.app.innerHTML), m2.app.innerHTML);
    await click(m2, 'sellarRoja'); await click(m2, 'sigRoja'); await click(m2, 'sellarRoja'); await click(m2, 'sigRoja');
    t('⑤ bis completate le altre due, solo 2 buste nuove (11 e 12) e poi «Registrado»', BUSTE(m2).map((b) => b.dia_op).join() === '2026-10-11,2026-10-12' && m2.toasts.some((x) => /Registrado/.test(x[0])), BUSTE(m2).map((b) => b.dia_op));
    const m3 = mondo(SRC, { ls: m.ls, pend: { uid_gesto: 'OTRA-SALIDA', a_depositar: 1 } }); await m3.ctx.F.pantalla9();
    t('⑤ ter una salida pendiente DIVERSA: la secuenza ricordata non si impone (vuelta normale)', /De vuelta del banco/.test(m3.app.innerHTML) && !/busta \d de/.test(m3.app.innerHTML), m3.app.innerHTML); }
  // ⑥ leva spenta
  { const m = mondo(SRC, { roja: { ok: false, error: 'lettura_sconosciuta' }, reservas: { '2026-10-09': 49100, '2026-10-10': 40000, '2026-10-11': 31250, '2026-10-12': 12800 } }); await m.ctx.F.pantalla9(); await click(m, 'salir'); const s = SALIDA(m);
    t('⑥ leva spenta (404 lettura_sconosciuta): la busta UNICA di sempre — contado netto, reserva = somma delle notti, nessuna «roja ya sellada»', s.contado === 1632000 && s.reserva === 133150 && s.a_depositar === 1498850 && !/Roja ya sellada/.test(calc(m)), s);
    t('⑥ bis e una sola schermata di busta (pantallaReservaSobre) col totale, non la secuenza', m.ctx.rendered.some((r) => r[0] === 'unica' && r[2] === 133150) && BUSTE(m).length === 0, m.ctx.rendered); }
  // ⑦ un errore che non e «sin roja»
  for (const [err, frase, conRetry] of [['pg_no_responde', /la base no contesta/, true], ['porta_non_installata', /todavía no está instalada/, false], ['sin_red', /sin conexión/, true], ['x_strano', /No pude leer la roja \(x_strano\)/, true]]) {
    const m = mondo(SRC, { roja: { ok: false, error: err } }); await m.ctx.F.pantalla9();
    t('⑦ errore «' + err + '»: la CAUSA vera (non «contrato pendiente»), NIENTE «Salir al banco», nessun post', frase.test(m.app.innerHTML) && !/contrato pendiente/.test(m.app.innerHTML) && m.posts.length === 0 && !m.mk('salir').onclick, m.app.innerHTML);
    t('⑦ bis «' + err + '»: «Reintentar» ' + (conRetry ? 'SI (ripetere puo servire)' : 'NO (ripetere lo stesso blocco non serve)'), conRetry === /retryRoja/.test(m.app.innerHTML), m.app.innerHTML);
    if (conRetry) { m.ctx.rojaPath = ''; await m.mk('retryRoja').onclick(); t('⑦ ter «Reintentar» rilegge la roja', /^roja_estado/.test(m.ctx.rojaPath), m.ctx.rojaPath); } }
  // ⑧ sin_cuota
  { const r = ROJA({ noches: ROJA().noches.map((n) => (n.dia === '2026-10-12' ? { dia: n.dia, estado: 'sin_cuota', importo: 1000, quota: null, coperto: 0, debito: null } : n)) });
    const m = mondo(SRC, { roja: r }); await m.ctx.F.pantalla9(); const c = calc(m);
    t('⑧ una notte senza quota: entra col calcolo del bordo (1.000) e l avviso «Sin cuota de ADMIN»', /Sin cuota de ADMIN para 2026-10-12/.test(c) && /Vas a depositar<\/span><span class="v">\$1559750/.test(c), c);
    await click(m, 'salir'); await click(m, 'sellarRoja'); await click(m, 'sigRoja'); await click(m, 'sellarRoja'); await click(m, 'sigRoja');
    t('⑧ bis la 3a busta (12) porta il calcolo e dice «Sin cuota de ADMIN para esta noche»', /Sin cuota de ADMIN para esta noche/.test(m.app.innerHTML) && /\$1000/.test(m.app.innerHTML), m.app.innerHTML);
    const r2 = ROJA({ noches: ROJA().noches.map((n) => (n.dia === '2026-10-12' ? { dia: n.dia, estado: 'sin_cuota', importo: null, quota: null, coperto: 0, debito: null } : n)) });
    const m2 = mondo(SRC, { roja: r2 }); await m2.ctx.F.pantalla9();
    t('⑧ ter senza quota E senza il parametro del 5%: «Falta un parámetro», non si inventa', /Falta un parámetro/.test(m2.app.innerHTML) && !m2.mk('salir').onclick, m2.app.innerHTML); }
  // ⑨ tutto coperto
  { const r = ROJA({ noches: ROJA().noches.map((n) => ({ dia: n.dia, estado: 'coperta', importo: 0, quota: 1, coperto: 1, debito: 0 })) });
    const m = mondo(SRC, { roja: r }); await m.ctx.F.pantalla9(); await click(m, 'salir'); const s = SALIDA(m);
    t('⑨ tutte coperte: nessuna busta nuova, la salida porta solo la roja ya sellada (reserva 99.500, a banca = lo contato)', BUSTE(m).length === 0 && s.reserva === 99500 && s.a_depositar === 1632000 && m.toasts.some((x) => /Registrado/.test(x[0])), [BUSTE(m).length, s]); }
  // ⑮ (EL GIRO ✏️) un errore di PIN non e un guasto della roja: con il PIN fresco si rilegge, MAI «avisa a MIGRACIÓN»
  for (const errPin of ['pin_caja_invalido', 'pin_caja_requerido']) {
    let n = 0; const m = mondo(SRC, { roja: undefined }); const orig = m.ctx.getCaja;
    m.ctx.getCaja = async (p) => { if (/^roja_estado/.test(p) && n++ === 0) return { ok: false, error: errPin, pin: true }; return orig(p); };
    await m.ctx.F.pantalla9();
    t('⑮ ' + errPin + ': si rilegge la roja con il PIN fresco (2a lettura) e si arriva a «Antes de salir», senza «MIGRACIÓN»', n === 2 && /Antes de salir/.test(m.app.innerHTML) && !/MIGRACIÓN/.test(m.app.innerHTML), [n, m.app.innerHTML.slice(0, 200)]); }
  for (const [errPin, frase, conRetry] of [['pin_caja_bloqueado', /Demasiados intentos con el PIN/, true], ['pin_caja_no_configurado', /no tiene PIN configurado/, false]]) {
    const m = mondo(SRC, { roja: { ok: false, error: errPin, pin: true } }); await m.ctx.F.pantalla9();
    t('⑮ bis ' + errPin + ': il testo giusto (non «base»/«MIGRACIÓN»), niente «Salir al banco»', frase.test(m.app.innerHTML) && !/MIGRACIÓN/.test(m.app.innerHTML) && !m.mk('salir').onclick && conRetry === /retryRoja/.test(m.app.innerHTML), m.app.innerHTML); }
  // ⑬ (EL GIRO 🟡) piu buste sin deposito di quante la salida puo portare: si ferma e lo dice, senza uscire al banco
  { const m = mondo(SRC, { roja: ROJA({ sueltas_exceso: true }) }); await m.ctx.F.pantalla9();
    t('⑬ `sueltas_exceso`: «Hay más sobres R sin depósito…», niente Reintentar (non serve), niente «Salir al banco», nessun post, e mai «contrato pendiente»', /Hay más sobres R sin depósito/.test(m.app.innerHTML) && !/retryRoja/.test(m.app.innerHTML) && !/contrato pendiente/.test(m.app.innerHTML) && m.posts.length === 0 && !m.mk('salir').onclick, m.app.innerHTML); }
  // ⑭ (EL GIRO 🟡) los legames que esperan o fueron rechazados se VEN en «Antes de salir»
  { const m = mondo(SRC, { roja: ROJA({ legami: [{ deposito: 'dep-0', numero: 'R-0001', importo: 99500, estado: 'pendiente', intentos: 2, edad_min: 190, err: 'pg_http_409' }, { deposito: 'dep-9', numero: 'R-0003', importo: 5000, estado: 'rifiutata', intentos: 1, edad_min: 20, err: 'pg_http_400' }] }) }); await m.ctx.F.pantalla9();
    t('⑭ la nota «legame de la roja sin concluir» con numero, importo, esperando/RECHAZADO y la edad', /Hay un sobre de la roja sin ligar a su depósito/.test(m.app.innerHTML) && /R-0001 \(\$99500\) — esperando · hace 3 h/.test(m.app.innerHTML) && /R-0003 \(\$5000\) — RECHAZADO · hace 20 min/.test(m.app.innerHTML) && /avisa a MIGRACIÓN/.test(m.app.innerHTML), m.app.innerHTML.slice(0, 700));
    const n = mondo(SRC, {}); await n.ctx.F.pantalla9(); t('⑭ bis sin legami: nada', !/legame de la roja/.test(n.app.innerHTML)); }
  // ⑪ una quota gia in parte coperta: la busta e il RESTO, mai la quota intera
  { const r = ROJA({ noches: ROJA().noches.map((n) => (n.dia === '2026-10-11' ? { dia: n.dia, estado: 'da_sigillare', importo: 21250, quota: 31250, coperto: 10000, debito: 21250 } : n)) });
    const m = mondo(SRC, { roja: r }); await m.ctx.F.pantalla9(); await click(m, 'salir'); await click(m, 'sellarRoja'); await click(m, 'sigRoja'); await click(m, 'sellarRoja');
    t('⑪ quota 31.250 con 10.000 gia coperti: la busta della notte 11 e di 21.250, e la salida porta il totale giusto (reserva 99.500 + 40.000 + 21.250 + 12.800)', BUSTE(m)[1].monto === 21250 && SALIDA(m).reserva === 173550 && SALIDA(m).a_depositar === 1632000 - 74050, [BUSTE(m)[1], SALIDA(m)]); }
  { const r = ROJA({ sueltas: [], sueltas_total: 0 }); const m = mondo(SRC, { roja: r }); await m.ctx.F.pantalla9(); await click(m, 'salir');
    t('⑫ senza buste gia sigillate: la salida NON porta `rojas`', SALIDA(m) && !('rojas' in SALIDA(m)), SALIDA(m)); }
  // ⑩ una notte sola
  { const m = mondo(SRC, { noches: ['2026-10-10'], sobres: [S('2026-10-10', '1006', 300000)], roja: ROJA({ sueltas: [], sueltas_total: 0, noches: [{ dia: '2026-10-10', estado: 'da_sigillare', importo: 40000, quota: 40000, coperto: 0, debito: 40000 }] }) }); await m.ctx.F.pantalla9();
    t('⑩ una notte sola con roja: niente tabella «Por día» e niente «Roja ya sellada»', !/Por día/.test(calc(m)) && !/Roja ya sellada/.test(calc(m)) && /Vas a depositar<\/span><span class="v">\$260000/.test(calc(m)), calc(m));
    await click(m, 'salir'); t('⑩ bis una busta sola: «sobre 1 de 1»', /sobre 1 de 1/.test(m.app.innerHTML), m.app.innerHTML); }
  t('versione >= 1.9.0', /caja 1\.(9\.\d|[1-9]\d\.\d)<\/small>/.test(SRC));
}
await banco(SRC0);
const mut = async (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; try { await banco(SRC0.replace(da, () => a)); } catch (e) { ko++; } muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
await mut('la salida non porta le rojas', "if (ROJA && ROJA.sueltas && ROJA.sueltas.length) cuerpoSalida.rojas =", "if (false) cuerpoSalida.rojas =");
await mut('l eccesso di sueltas non ferma', "if (rjR.sueltas_exceso) { pantallaRojaError('demasiadas_buste_sin_deposito'); return; }", "");
await mut('i legami non si mostrano', "'<div id=\"calc\"></div>' + legamiHtml(ROJA) +", "'<div id=\"calc\"></div>' +");
await mut('rifiutato come esperando', "(x.estado === 'rifiutata' ? 'RECHAZADO' : 'esperando')", "'esperando'");
await mut('un blocco permanente offre Reintentar', "'Avisa a MIGRACIÓN. No salgas al banco hasta que esté.', false]", "'Avisa a MIGRACIÓN. No salgas al banco hasta que esté.', true]");
await mut('l eccesso dice la causa falsa', "if (rjR.sueltas_exceso) { pantallaRojaError('demasiadas_buste_sin_deposito'); return; }", "if (rjR.sueltas_exceso) { renderError('La roja', 'demasiadas_buste_sin_deposito'); return; }");
await mut('Reintentar non rilegge', "b.onclick = function(){ return pantalla9(); };", "b.onclick = function(){};");
await mut('un errore di PIN si legge come guasto della roja', "if (rjR.pin && (rjR.error === 'pin_caja_invalido' || rjR.error === 'pin_caja_requerido')) { return pantalla9(); }", "");
await mut('la roja non si legge', "var rjR = await getCaja('roja_estado?dia=' + DIA_HOY + '&noches=' + NOCHES.join(','));", "var rjR = { ok: false, error: 'lettura_sconosciuta' };");
await mut('un errore diventa «sin roja»', "      pantallaRojaError(rjR.error); return;", "");
await mut('il contado non e lordo', "var c = (Number(document.getElementById('contado').value || '') || 0) + S;", "var c = (Number(document.getElementById('contado').value || '') || 0);");
await mut('la reserva senza la roja ya sellada', "if (RESERVA.reserva !== null) RESERVA.reserva = RESERVA.nuevas + ROJA.sueltas_total;", "if (RESERVA.reserva !== null) RESERVA.reserva = RESERVA.nuevas;");
await mut('la coperta si sigilla', "if ((nR.estado === 'da_sigillare' || nR.estado === 'sin_cuota') && nR.importo > 0) {", "if (true) {");
await mut('la busta con la quota intera', "RESERVA.aSellar.push({ dia: nR.dia, importo: nR.importo,", "RESERVA.aSellar.push({ dia: nR.dia, importo: (nR.quota || nR.importo),");
await mut('uid senza la notte', "uid_gesto: 'res-' + depositoUid + '-' + it.dia,", "uid_gesto: 'res-' + depositoUid,");
await mut('dia_op sbagliato', "dia_op: it.dia, monto: it.importo,", "dia_op: DIA_NOCHE, monto: it.importo,");
await mut('monto sbagliato', "dia_op: it.dia, monto: it.importo,", "dia_op: it.dia, monto: 1,");
await mut('un rifiuto avanza', "if (!r.ok) { toast('No se guardó: ' + r.motivo, 'bad'); return; }\n    p.hechas[it.dia]", "p.hechas[it.dia]");
await mut('il numero non si mostra', "'<div class=\"rows\"><div class=\"r tot\"><span class=\"n\">Sobre</span><span class=\"v\">' + esc(r.sobre_nro || '—') + '</span></div></div>' +\n      '<button class=\"btn acc\" id=\"sigRoja\">'", "'<button class=\"btn acc\" id=\"sigRoja\">'");
await mut('la secuenza non si riprende', "if (rpR && rpR.dep === DEPOSITO_PENDIENTE.uid_gesto && rpR.lista && rojaSiguiente(rpR) >= 0) { pantallaRojaNotte(rpR.dep, rpR.lista, rpR.hechas); return; }", "");
await mut('la secuenza si impone a ogni salida', "rpR.dep === DEPOSITO_PENDIENTE.uid_gesto && rpR.lista", "rpR.lista");
await mut('le gia sigillate si ripetono', "for (var i = 0; i < p.lista.length; i++) { if (!p.hechas[p.lista[i].dia]) return i; } return -1;", "return p.lista.length ? 0 : -1;");
await mut('la memoria non si pulisce', "if (i < 0) { rojaPendLimpiar(); toast(", "if (i < 0) { toast(");
await mut('tutte coperte: ancora una busta', "if (RESERVA.aSellar.length) pantallaRojaNotte(depositoUid, RESERVA.aSellar, {});", "pantallaRojaNotte(depositoUid, RESERVA.aSellar.length ? RESERVA.aSellar : [{ dia: DIA_NOCHE, importo: 1 }], {});");
await mut('sin_cuota senza avviso', "(ROJA && RESERVA.sinCuota.length ? '<div class=\"note\">Sin cuota de ADMIN para '", "(false ? '<div class=\"note\">Sin cuota de ADMIN para '");
await mut('sin_cuota senza parametro si inventa', "if (nR.importo == null) { RESERVA = { ok: true, reserva: null }; break; }", "if (nR.importo == null) { nR.importo = 0; }");
await mut('la tabella senza la roja ya sellada', "desgloseDeposito(MANANA.sobres, RESERVA.porNoche, NOCHES, c, ROJA ? ROJA.sueltas : null)", "desgloseDeposito(MANANA.sobres, RESERVA.porNoche, NOCHES, c, null)");
await mut('la riga «Roja ya sellada» manca', "(S > 0 ? '<div class=\"r\"><span class=\"n\">Roja ya sellada (", "(false ? '<div class=\"r\"><span class=\"n\">Roja ya sellada (");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
