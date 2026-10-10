// BANCO · LA BUSTA «NO ENCONTRADA» NEL VETRO DELLA CAJERA (V28, collaudo 10-ott) · TERZA PENNA
// Criteri: ① il bottone esiste SOLO se /salud lo dice ② «No encuentro este sobre» chiede il MOTIVO (>= 8 lettere) e NON chiede ne manda un sello/contado ③ la busta persa esce da cio che si conta E da cio che va
//          al deposito (MANANA.sobres) ma RESTA in lista col suo motivo ④ solo persa: non dice «la caja fuerte esta vacia» ⑤ «La encontré» (motivo >= 3) la riporta da contare ⑥ l'esito del bordo si DICE
//          (gia_contata, busta_assente, porta non installata…) e un errore NON sposta la busta ⑦ senza rete: non si finge ⑧ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'caja_cajera.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 320))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); const a = SRC.slice(Math.max(0, i - 6), i) === 'async ' ? i - 6 : i;
  const eol = SRC.indexOf('\n', i), r1 = SRC.slice(i, eol);
  if (/\}\s*$/.test(r1) && (r1.match(/\{/g) || []).length === (r1.match(/\}/g) || []).length) return SRC.slice(a, eol + 1);
  return SRC.slice(a, SRC.indexOf('\n}\n', i) + 3); };
const tick = () => new Promise((r) => setTimeout(r, 5));

function mondo(SRC, o) {
  o = o || {}; const posts = [], toasts = [], els = {}, app = { innerHTML: '' }, calls = [];
  const el = (id) => els[id] || (els[id] = { id, value: '', dataset: {}, style: {}, disabled: false, textContent: '', innerHTML: '', onclick: null, listeners: {}, addEventListener(ev, fn) { this.listeners[ev] = fn; } });
  const ctx = { JSON, Math, Date, String, Number, Object, Array, Promise, setTimeout, clearTimeout, encodeURIComponent, console,
    app, LOCAL: 'bks', BORDE: { bks: 'https://borde.test' }, DIA_HOY: '2026-10-10', DIA_NOCHE: '2026-10-09', PROVA: false, MULTI: true, NOCHES: [], PASO: 1, SOBRE_IDX: 0, MANANA: null, UIDS_GESTO: {}, SES: { user: 'Mayra' },
    barra: () => '', esc: (x) => String(x == null ? '' : x), fechaCorta: (d) => d, fmt: (n) => '$' + n, uidGesto: (p) => p + '-' + (++ctx._u), _u: 0,
    toast: (m, c) => toasts.push([m, c]), plantarBustaPrueba() {}, pantalla8() { calls.push('pantalla8'); }, document: { getElementById: el, querySelectorAll: (sel) => (ctx._qs ? ctx._qs(sel) : (sel === '[data-ne]' ? (o.neBtns || []) : [])) },
    fetch: async (u) => { calls.push('fetch ' + u); if (o.saludErr) throw new Error('rete'); return { json: async () => ({ flags: { caja_no_encontrada_on: o.saludOn === undefined ? '1' : o.saludOn } }) }; },
    getCaja: async (p) => { calls.push('get ' + p); if (/^pendientes/.test(p)) return o.pend || { ok: false, error: 'x' }; if (/^manana/.test(p)) return o.mananaRisp || { ok: true, sobres: [], aviso_sin_respuesta: null }; return { ok: false }; },
    postCaja: async (b) => { posts.push(b); return o.postRisp ? (typeof o.postRisp === 'function' ? o.postRisp(b) : o.postRisp) : { ok: true, esito: 'scritto' }; },
    unTocoUnHecho: (btn, fn) => { btn.onclick = fn; },
  };
  vm.createContext(ctx);
  vm.runInContext(['noEncOn', 'marcarNoEncontrada', 'noEncHtml', 'noEncBind', 'dejadasHtml', 'dejadasBind', 'claveSobre', 'pantalla6', 'pantalla7', 'uidGestoEstable'].map((n) => fnDe(SRC, n)).join('\n') + '\n' +
    SRC.slice(SRC.indexOf('var DEJADAS'), SRC.indexOf('function claveSobre')) + SRC.slice(SRC.indexOf('var NOENC_ON'), SRC.indexOf('async function noEncOn')) + SRC.slice(SRC.indexOf('var NOENC_TXT'), SRC.indexOf('async function marcarNoEncontrada')) +
    '\nthis.F = { noEncOn, marcarNoEncontrada, noEncHtml, noEncBind, dejadasHtml, dejadasBind, pantalla6, pantalla7, NOENC_TXT };', ctx);
  return { ctx, posts, toasts, els, app, calls, el };
}
const S = (nro, extra) => Object.assign({ sobre_nro: nro, dia: '2026-10-08', declarado: 40000, firma_jl: 'JL2', ts_hecho: '2026-10-08T22:00:00Z', conteo: null }, extra || {});
const NE = (nro, motivo) => S(nro, { no_encontrada: { motivo: motivo || 'No existe fisicamente', firma: 'Mayra', ts_hecho: 't' } });

async function banco(SRC) {
  { const m = mondo(SRC, { saludOn: '1' }); t('① leva "1": noEncOn true', await m.ctx.F.noEncOn() === true);
    const a = mondo(SRC, { saludOn: '0' }); t('① leva "0": false', await a.ctx.F.noEncOn() === false);
    const e = mondo(SRC, { saludErr: true }); t('① /salud muto: false (ningun boton sin que el bordo lo diga)', await e.ctx.F.noEncOn() === false);
    await m.ctx.F.noEncOn(); t('① la respuesta se recuerda 60 s (una sola /salud)', m.calls.filter((c) => /salud/.test(c)).length === 1, m.calls); }
  { const m = mondo(SRC, {}); const r = await m.ctx.F.marcarNoEncontrada(S('1003'), 'no_encontrada', 'No existe fisicamente en la caja');
    const b = m.posts[0];
    t('② el cuerpo: verbo, dia del sobre, nro, evento, motivo, fuente — y NADA de sello ni contado', b.verbo === 'sobre_no_encontrada' && b.sobre_dia_op === '2026-10-08' && b.sobre_nro === '1003' && b.evento === 'no_encontrada' && /existe fisicamente/.test(b.motivo) && b.fuente === 'app_caja' && !('sello_intacto' in b) && !('contado' in b), b);
    await m.ctx.F.marcarNoEncontrada(S('1003'), 'no_encontrada', 'No existe fisicamente en la caja');
    t('② con una respuesta DEFINITIVA el gesto se cierra: el siguiente es nuevo (uid nuevo) — el uid estable vale solo mientras la respuesta es incierta (ver ⑪)', m.posts[0].uid_gesto !== m.posts[1].uid_gesto);
    await m.ctx.F.marcarNoEncontrada(S('1004'), 'no_encontrada', 'No existe fisicamente en la caja');
    t('② … y distinto para otro sobre', m.posts[2].uid_gesto !== m.posts[0].uid_gesto);
    await m.ctx.F.marcarNoEncontrada({ sobre_nro: '1009' }, 'ritrovata', 'la vi');
    t('② un sobre sin `dia` (la lectura «manana») usa el dia de anoche', m.posts[3].sobre_dia_op === '2026-10-09'); }
  // ③ la lista
  { const m = mondo(SRC, { pend: { ok: true, sobres: [S('1005'), NE('1003'), NE('1004', 'se perdio en el traslado')], noches: ['2026-10-08'] } }); await m.ctx.F.pantalla6();
    t('③ MANANA.sobres = SOLO lo que se cuenta (la 1005); MANANA.noEnc = las dos perdidas', m.ctx.MANANA.sobres.length === 1 && m.ctx.MANANA.sobres[0].sobre_nro === '1005' && m.ctx.MANANA.noEnc.length === 2, [m.ctx.MANANA.sobres.length, m.ctx.MANANA.noEnc.length]);
    t('③ bis la lista MUESTRA las perdidas, con su motivo, aparte', /2 sobres no encontrados/.test(m.app.innerHTML) && /No existe fisicamente/.test(m.app.innerHTML) && /se perdio en el traslado/.test(m.app.innerHTML) && /La encontré/.test(m.app.innerHTML), m.app.innerHTML.slice(0, 300));
    t('③ ter el numero «por contar» solo cuenta la 1005 (1)', /<p class="big acc">1<\/p>/.test(m.app.innerHTML), m.app.innerHTML.slice(0, 200)); }
  // ④ solo perdidas
  { const m = mondo(SRC, { pend: { ok: true, sobres: [NE('1003'), NE('1004')], noches: ['2026-10-08'] } }); await m.ctx.F.pantalla6();
    t('④ solo perdidas: «Nada que contar» CON la lista de las perdidas, y NO «la caja fuerte esta vacia»', /Nada que contar/.test(m.app.innerHTML) && /2 sobres no encontrados/.test(m.app.innerHTML) && !/la caja fuerte está vacía/i.test(m.app.innerHTML) && /irPos/.test(m.app.innerHTML), m.app.innerHTML.slice(0, 300));
    const lista = m.ctx.MANANA.sobres; t('④ bis el deposito no lleva ninguna (MANANA.sobres vacio)', lista.length === 0); }
  { const m = mondo(SRC, { pend: { ok: true, sobres: [], noches: [] } }); await m.ctx.F.pantalla6();
    t('④ ter nada de nada: la pantalla vacia de siempre', /la caja fuerte está vacía/i.test(m.app.innerHTML) && !/no encontrado/.test(m.app.innerHTML)); }
  // ⑤ la encontré
  { const m = mondo(SRC, { pend: { ok: true, sobres: [S('1005'), NE('1003')], noches: ['2026-10-08'] } }); const btn = m.el('b0'); btn.dataset.ne = '0';
    m.ctx.document.querySelectorAll = (sel) => (sel === '[data-ne]' ? [btn] : []);
    await m.ctx.F.pantalla6(); btn.onclick();
    t('⑤ «La encontré» abre el formulario con el motivo', /¿Dónde la encontraste\?/.test(m.els['neForm0'].innerHTML), m.els['neForm0'].innerHTML);
    m.el('neMot0').value = 'la'; await m.el('neOk0').onclick();
    t('⑤ bis motivo < 3 letras: no se manda nada', m.posts.length === 0 && m.toasts.some((x) => /dónde/i.test(x[0])), [m.posts.length, m.toasts]);
    m.el('neMot0').value = 'en el cajon de la oficina'; await m.el('neOk0').onclick();
    await tick(); t('⑤ ter con motivo: evento ritrovata, y la lista se RICARGA (la 1003 vuelve a la lista de cosas por contar)', m.posts.length === 1 && m.posts[0].evento === 'ritrovata' && m.posts[0].sobre_nro === '1003' && m.calls.filter((c) => /^get pendientes/.test(c)).length === 2, [m.posts, m.calls]);
    m.toasts.length = 0; }
  { const m = mondo(SRC, { pend: { ok: true, sobres: [NE('1003')], noches: ['2026-10-08'] }, postRisp: { ok: false, motivo: 'non_no_encontrada' } }); const btn = m.el('b0'); btn.dataset.ne = '0';
    m.ctx.document.querySelectorAll = (sel) => (sel === '[data-ne]' ? [btn] : []);
    await m.ctx.F.pantalla6(); btn.onclick(); m.el('neMot0').value = 'en el cajon'; await m.el('neOk0').onclick();
    t('⑤ quater «ritrovata» rifiutata: se dice con las palabras del vetro (no el codigo crudo)', m.toasts.some((x) => /no estaba marcado/.test(x[0])), m.toasts); }
  // ② pantalla7
  async function sobre7(o, intent) {
    const m = mondo(SRC, o); const sobres = [S('1003'), S('1004')]; m.ctx.MANANA = { ok: true, sobres: sobres, noEnc: [] }; m.ctx.SOBRE_IDX = 0; m.ctx.PASO = 2;
    m.ctx.F.pantalla7(); await tick(); return m;
  }
  { const m = await sobre7({ saludOn: '0' });
    t('① leva "0": la pantalla del conteo NO ofrece «No encuentro este sobre»', !m.el('noEncBox').innerHTML, m.el('noEncBox').innerHTML); }
  { const m = await sobre7({ saludOn: '1' });
    t('① leva "1": ofrece «No encuentro este sobre»', /No encuentro este sobre/.test(m.el('noEncBox').innerHTML), m.el('noEncBox').innerHTML);
    m.el('neAbrir').onclick();
    const f = m.el('noEncBox').innerHTML;
    t('② el formulario pide el MOTIVO y no menciona sello ni contado', /¿Por qué no está\?/.test(f) && !/sello|contado/i.test(f), f);
    m.el('neMotivo').value = 'no esta'; await m.el('neGuardar').onclick();
    t('② motivo < 8 letras: no se manda nada y se dice', m.posts.length === 0 && m.toasts.some((x) => /mínimo 8/.test(x[0])), [m.posts.length, m.toasts]);
    m.el('neMotivo').value = 'No esta en la caja fuerte'; await m.el('neGuardar').onclick(); await tick();
    t('③ ok: la busta sale de MANANA.sobres y pasa a noEnc con su motivo; se sigue con la proxima (1004)', m.ctx.MANANA.sobres.length === 1 && m.ctx.MANANA.sobres[0].sobre_nro === '1004' && m.ctx.MANANA.noEnc.length === 1 && m.ctx.MANANA.noEnc[0].no_encontrada.motivo === 'No esta en la caja fuerte', [m.ctx.MANANA.sobres.map((x) => x.sobre_nro), m.ctx.MANANA.noEnc.length]);
    t('② el cuerpo que viaja: no_encontrada de la 1003, sin sello', m.posts.length === 1 && m.posts[0].sobre_nro === '1003' && m.posts[0].evento === 'no_encontrada' && !('sello_intacto' in m.posts[0]), m.posts); }
  { const m = await sobre7({ saludOn: '1', postRisp: { ok: false, motivo: 'gia_contata' } }); m.el('neAbrir').onclick(); m.el('neMotivo').value = 'No esta en la caja fuerte'; await m.el('neGuardar').onclick();
    t('⑥ gia_contata: se DICE («ya tiene un conteo») y la busta NO se mueve', m.toasts.some((x) => /ya tiene un conteo/.test(x[0])) && m.ctx.MANANA.sobres.length === 2 && m.ctx.MANANA.noEnc.length === 0, [m.toasts, m.ctx.MANANA.sobres.length]); }
  { const m = await sobre7({ saludOn: '1', postRisp: { ok: false, motivo: 'porta_non_installata', error: 'porta_non_installata' } }); m.el('neAbrir').onclick(); m.el('neMotivo').value = 'No esta en la caja fuerte'; await m.el('neGuardar').onclick();
    t('⑥ bis porta non installata: «Falta instalar una pieza», la busta NO se mueve', m.toasts.some((x) => /Falta instalar/.test(x[0])) && m.ctx.MANANA.sobres.length === 2, m.toasts); }
  { const m = await sobre7({ saludOn: '1', postRisp: { ok: true, encolado: true } }); m.el('neAbrir').onclick(); m.el('neMotivo').value = 'No esta en la caja fuerte'; await m.el('neGuardar').onclick();
    t('⑦ sin señal (encolado): NO se finge — la busta no se mueve y se avisa «no sigas hasta que se confirme»', m.ctx.MANANA.sobres.length === 2 && m.toasts.some((x) => /Sin señal/.test(x[0])), [m.ctx.MANANA.sobres.length, m.toasts]); }
  { const m = await sobre7({ saludOn: '1', postRisp: { ok: true, ya: true, esito: 'gia_no_encontrada' } }); m.el('neAbrir').onclick(); m.el('neMotivo').value = 'No esta en la caja fuerte'; await m.el('neGuardar').onclick();
    t('③ bis «ya estaba anotado» (gia_no_encontrada): ok, se dice, y sale del conteo', m.ctx.MANANA.sobres.length === 1 && m.toasts.some((x) => /ya estaba anotado/.test(x[0])), m.toasts); }
  { const m = mondo(SRC, { saludOn: '1' }); m.ctx.MANANA = { ok: true, sobres: [S('1003')], noEnc: [] }; m.ctx.SOBRE_IDX = 0; m.ctx.F.pantalla7(); await tick(); m.el('neAbrir').onclick(); m.el('neMotivo').value = 'No esta en la caja fuerte'; await m.el('neGuardar').onclick(); await tick();
    t('③ ter la ULTIMA busta marcada: se sigue a los cortes POS (paso 3), no queda una pantalla vacia', m.ctx.MANANA.sobres.length === 0 && m.calls.includes('pantalla8'), m.calls); }
  // ═══ EL GIRO «UNA RIGA»: persa → ritrovata → persa di nuovo, stessa pagina, stesso motivo
  { const m = mondo(SRC, {}); const sb = S('1003'); const MOT = 'No existe fisicamente en la caja';
    await m.ctx.F.marcarNoEncontrada(sb, 'no_encontrada', MOT); await m.ctx.F.marcarNoEncontrada(sb, 'ritrovata', 'la encontre en el cajon'); await m.ctx.F.marcarNoEncontrada(sb, 'no_encontrada', MOT);
    t('⑪ persa → ritrovata → persa di nuovo (stesso motivo, stessa pagina): TRE uid distinti — la terza non e un «gia» muto', new Set(m.posts.map((p) => p.uid_gesto)).size === 3, m.posts.map((p) => p.uid_gesto)); }
  { const m = mondo(SRC, { postRisp: { ok: true, encolado: true } }); const sb = S('1003'); const MOT = 'No existe fisicamente en la caja';
    await m.ctx.F.marcarNoEncontrada(sb, 'no_encontrada', MOT); await m.ctx.F.marcarNoEncontrada(sb, 'no_encontrada', MOT);
    t('⑪ bis risposta INCERTA (sin señal): il reintento porta lo STESSO uid (e lo stesso fatto, mai due)', m.posts.length === 2 && m.posts[0].uid_gesto === m.posts[1].uid_gesto, m.posts.map((p) => p.uid_gesto)); }
  { const m = mondo(SRC, { postRisp: { ok: false, motivo: 'pg_no_responde' } }); const sb = S('1003'); const MOT = 'No existe fisicamente en la caja';
    await m.ctx.F.marcarNoEncontrada(sb, 'no_encontrada', MOT); await m.ctx.F.marcarNoEncontrada(sb, 'no_encontrada', MOT);
    t('⑪ ter base que no responde (incerta): stesso uid al reintento', m.posts[0].uid_gesto === m.posts[1].uid_gesto, m.posts.map((p) => p.uid_gesto)); }
  { const m = mondo(SRC, { postRisp: { ok: false, motivo: 'gia_contata' } }); const sb = S('1003'); const MOT = 'No existe fisicamente en la caja';
    await m.ctx.F.marcarNoEncontrada(sb, 'no_encontrada', MOT); await m.ctx.F.marcarNoEncontrada(sb, 'no_encontrada', MOT);
    t('⑪ quater rifiuto DEFINITIVO (gia_contata): il prossimo tentativo e un gesto nuovo (uid nuovo)', m.posts[0].uid_gesto !== m.posts[1].uid_gesto, m.posts.map((p) => p.uid_gesto)); }
  // ═══ ELEGIR y DEJAR PARA DESPUES (Mayra ferma: «Abrir y contar» apre sempre la 1003) ═══
  { const m = mondo(SRC, { pend: { ok: true, sobres: [S('1003'), S('1004'), S('1005')], noches: ['2026-10-08'] } }); await m.ctx.F.pantalla6();
    const filasEl = (m.app.innerHTML.match(/data-el="\d+"/g) || []);
    t('⑨ ELEGIR: cada fila «Por contar» es tocable (3 filas, con data-el)', filasEl.length === 3 && /Por contar ›/.test(m.app.innerHTML), filasEl);
    const filas = [{ dataset: { el: '2' } }]; m.ctx._qs = (sel) => (sel === '[data-el]' ? filas : []); m.ctx.F.dejadasBind(); filas[0].onclick();
    t('⑨ bis tocar la 3a fila (1005) abre ESA: SOBRE_IDX 2, paso 2, pantalla del conteo de la 1005', m.ctx.SOBRE_IDX === 2 && m.ctx.PASO === 2 && /Sobre 1005/.test(m.app.innerHTML), [m.ctx.SOBRE_IDX, m.app.innerHTML.slice(0, 120)]); }
  { const m = mondo(SRC, {}); m.ctx.MANANA = { ok: true, sobres: [S('1003'), S('1004'), S('1005')], noEnc: [], dejadas: [] }; m.ctx.SOBRE_IDX = 0; m.ctx.F.pantalla7(); await tick();
    m.el('dejar').onclick();
    t('⑩ DEJAR: la 1003 sale de MANANA.sobres (no se cuenta NI viaja al banco) y pasa a dejadas; se sigue con la 1004', m.ctx.MANANA.sobres.map((x) => x.sobre_nro).join() === '1004,1005' && m.ctx.MANANA.dejadas.length === 1 && /Sobre 1004/.test(m.app.innerHTML), [m.ctx.MANANA.sobres.map((x) => x.sobre_nro), m.app.innerHTML.slice(0, 100)]);
    t('⑩ bis NO escribe nada (cero posts): es de esta sesion, no un hecho', m.posts.length === 0, m.posts);
    t('⑩ ter queda anotada en DEJADAS por dia:nro (vuelve a la lista al recargar pantalla6, sin repetirse)', m.ctx.DEJADAS['2026-10-08:1003'] === 1, m.ctx.DEJADAS); }
  { const m = mondo(SRC, { pend: { ok: true, sobres: [S('1003'), S('1004'), S('1005')], noches: ['2026-10-08'] } }); m.ctx.DEJADAS = { '2026-10-08:1003': 1, '2026-10-08:1004': 1 }; await m.ctx.F.pantalla6();
    t('⑩ quater pantalla6 con 1003 y 1004 dejadas: se cuenta SOLO la 1005 («1 sobre que tienes que contar») y las otras 2 salen aparte con «Contar ahora»', m.ctx.MANANA.sobres.length === 1 && m.ctx.MANANA.sobres[0].sobre_nro === '1005' && /2 sobres para después/.test(m.app.innerHTML) && /Contar ahora/.test(m.app.innerHTML) && /<p class="big acc">1<\/p>/.test(m.app.innerHTML), m.app.innerHTML.slice(0, 260));
    const bs = [{ dataset: { de: '0' } }]; m.ctx._qs = (sel) => (sel === '[data-de]' ? bs : []); m.ctx.F.dejadasBind(); bs[0].onclick(); await tick();
    t('⑩ quinto «Contar ahora» la devuelve a la lista de por contar', !m.ctx.DEJADAS['2026-10-08:1003'] && m.ctx.MANANA.sobres.length === 2, [m.ctx.DEJADAS, m.ctx.MANANA.sobres.length]); }
  { const m = mondo(SRC, { pend: { ok: true, sobres: [S('1003'), S('1004')], noches: ['2026-10-08'] } }); m.ctx.DEJADAS = { '2026-10-08:1003': 1, '2026-10-08:1004': 1 }; await m.ctx.F.pantalla6();
    t('⑩ sexto TODAS dejadas: «Nada que contar» con la lista y paso a los cortes, no «la caja fuerte esta vacia»', /Nada que contar/.test(m.app.innerHTML) && /2 sobres para después/.test(m.app.innerHTML) && !/la caja fuerte está vacía/i.test(m.app.innerHTML) && /irPos/.test(m.app.innerHTML), m.app.innerHTML.slice(0, 220)); }
  { const src = SRC; t('⑩ séptimo el deposito AVISA cuantos sobres no viajan (no encontrados o dejados)', /NO van en este depósito/.test(src) && /MANANA\.noEnc \|\| \[\]\)\.length \+ \(MANANA\.dejadas \|\| \[\]\)\.length/.test(src)); }
  t('⑧ versión: caja 1.3.1', /caja 1\.3\.1<\/small>/.test(SRC));
}
await banco(SRC0);
const mut = async (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; try { await banco(SRC0.replace(da, () => a)); } catch (e) { ko++; } muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('⑧ mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
await mut('la leva e ignorata', "NOENC_ON = !!(j && j.flags && String(j.flags.caja_no_encontrada_on) === '1');", "NOENC_ON = true;");
await mut('/salud muto = accesa', "} catch (e) { NOENC_ON = false; }", "} catch (e) { NOENC_ON = true; }");
await mut('la persa resta en MANANA.sobres (se cuenta y va al banco)', "MANANA.sobres = todosLosSobres.filter(function(s){ return !s.no_encontrada; });", "MANANA.sobres = todosLosSobres;");
await mut('la persa desaparece de la lista', "'<div class=\"rows\">' + lista.map(function(x, i){", "'<div class=\"rows\">' + [].map(function(x, i){");
await mut('el formulario pregunta por el sello', "'<p class=\"lb\">¿Por qué no está? <b>Escríbelo tal como es</b></p>", "'<p class=\"lb\">¿El sello estaba intacto? ¿Por qué no está? <b>Escríbelo tal como es</b></p>");
await mut('el motivo corto pasa', "if (motivo.length < 8) { toast(NOENC_TXT.motivo_troppo_corto, 'bad'); return; }", "");
await mut('un error mueve la busta igual', "if (!r.ok) { toast('No se guardó: ' + (NOENC_TXT[r.motivo] || NOENC_TXT[r.error] || r.motivo || r.error), 'bad'); return; }\n        if (r.encolado) { toast('Sin señal — se enviará solo. No sigas hasta que se confirme.', 'bad'); return; }\n        s.no_encontrada", "s.no_encontrada");
await mut('sin señal se finge', "if (r.encolado) { toast('Sin señal — se enviará solo. No sigas hasta que se confirme.', 'bad'); return; }\n        s.no_encontrada", "s.no_encontrada");
await mut('solo perdidas = caja vacia', "if (!sobres.length && (MANANA.noEnc.length || MANANA.dejadas.length)) {", "if (false) {");
await mut('il uid non si libera mai (il difetto di EL GIRO)', "  if (!incerta) delete UIDS_GESTO[clave];", "");
await mut('si libera anche se la risposta e incerta', "var incerta = r.encolado || r.error === 'pg_no_responde' || r.motivo === 'pg_no_responde' || r.motivo === 'sin_red' || r.error === 'sin_red';", "var incerta = false;");
await mut('el uid cambia a cada toque (un reintento incierto seria un segundo hecho)', "uid_gesto: uidGestoEstable(clave, 'ne'),", "uid_gesto: uidGesto('ne'),");
await mut('el sello viaja', "sobre_dia_op: dia, sobre_nro: sobre.sobre_nro, evento: evento, motivo: motivo, fuente: 'app_caja' });", "sobre_dia_op: dia, sobre_nro: sobre.sobre_nro, evento: evento, motivo: motivo, sello_intacto: false, fuente: 'app_caja' });");
await mut('la ritrovata no recarga', "toast('Anotado: el sobre apareció — ya se puede contar', 'ok');\n        pantalla6();", "toast('Anotado: el sobre apareció — ya se puede contar', 'ok');");
await mut('la fila no es tocable (elegir)', "(s.conteo ? '' : ' data-el=\"' + idx + '\" style=\"cursor:pointer\"')", "''");
await mut('elegir abre otro indice', "SOBRE_IDX = Number(r.dataset.el); PASO = 2; pantalla7();", "SOBRE_IDX = 0; PASO = 2; pantalla7();");
await mut('dejar no la saca del deposito', "MANANA.sobres.splice(SOBRE_IDX, 1);\n    toast('Sobre ' + s.sobre_nro + ' para después", "toast('Sobre ' + s.sobre_nro + ' para después");
await mut('dejar escribe un hecho', "DEJADAS[claveSobre(s)] = 1;\n    (MANANA.dejadas", "postCaja({ verbo: 'conteo', contado: 0 }); DEJADAS[claveSobre(s)] = 1;\n    (MANANA.dejadas");
await mut('al recargar se pierden las dejadas', "MANANA.sobres = MANANA.sobres.filter(function(s){ return !DEJADAS[claveSobre(s)]; });", "");
await mut('contar ahora no la devuelve', "delete DEJADAS[claveSobre(x)]; pantalla6();", "pantalla6();");
await mut('el deposito no avisa', "NO van en este depósito", "van en este depósito");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
