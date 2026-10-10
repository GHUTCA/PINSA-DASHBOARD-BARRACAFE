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
    toast: (m, c) => toasts.push([m, c]), plantarBustaPrueba() {}, pantalla8() { calls.push('pantalla8'); }, document: { getElementById: el, querySelectorAll: (sel) => (sel === '[data-ne]' ? (o.neBtns || []) : []) },
    fetch: async (u) => { calls.push('fetch ' + u); if (o.saludErr) throw new Error('rete'); return { json: async () => ({ flags: { caja_no_encontrada_on: o.saludOn === undefined ? '1' : o.saludOn } }) }; },
    getCaja: async (p) => { calls.push('get ' + p); if (/^pendientes/.test(p)) return o.pend || { ok: false, error: 'x' }; if (/^manana/.test(p)) return o.mananaRisp || { ok: true, sobres: [], aviso_sin_respuesta: null }; return { ok: false }; },
    postCaja: async (b) => { posts.push(b); return o.postRisp ? (typeof o.postRisp === 'function' ? o.postRisp(b) : o.postRisp) : { ok: true, esito: 'scritto' }; },
    unTocoUnHecho: (btn, fn) => { btn.onclick = fn; },
  };
  vm.createContext(ctx);
  vm.runInContext(['noEncOn', 'marcarNoEncontrada', 'noEncHtml', 'noEncBind', 'pantalla6', 'pantalla7', 'uidGestoEstable'].map((n) => fnDe(SRC, n)).join('\n') + '\n' +
    SRC.slice(SRC.indexOf('var NOENC_ON'), SRC.indexOf('async function noEncOn')) + SRC.slice(SRC.indexOf('var NOENC_TXT'), SRC.indexOf('async function marcarNoEncontrada')) +
    '\nthis.F = { noEncOn, marcarNoEncontrada, noEncHtml, noEncBind, pantalla6, pantalla7, NOENC_TXT };', ctx);
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
    t('② el uid es ESTABLE para el mismo gesto (un reintento es el mismo hecho)', m.posts[0].uid_gesto === m.posts[1].uid_gesto);
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
  t('⑧ versión: caja 1.2.0', /caja 1\.2\.0<\/small>/.test(SRC));
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
await mut('solo perdidas = caja vacia', "if (!sobres.length && MANANA.noEnc.length) {", "if (false) {");
await mut('el uid cambia a cada toque', "uidGestoEstable('ne|' + evento + '|' + dia + '|' + sobre.sobre_nro + '|' + motivo, 'ne')", "uidGesto('ne')");
await mut('el sello viaja', "sobre_dia_op: dia, sobre_nro: sobre.sobre_nro, evento: evento, motivo: motivo, fuente: 'app_caja' });", "sobre_dia_op: dia, sobre_nro: sobre.sobre_nro, evento: evento, motivo: motivo, sello_intacto: false, fuente: 'app_caja' });");
await mut('la ritrovata no recarga', "toast('Anotado: el sobre apareció — ya se puede contar', 'ok');\n        pantalla6();", "toast('Anotado: el sobre apareció — ya se puede contar', 'ok');");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
