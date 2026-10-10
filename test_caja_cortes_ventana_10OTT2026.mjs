// BANCO · «DICE NUESTRO LIBRO» SULLA FINESTRA DEL CORTE, NEL VETRO (ADMIN + Alberto via V28, 10-ott) · TERZA PENNA
// Criteri: ① leva spenta (o /salud muto) = la pantalla di ieri: nessun campo desde/hasta, libro del giorno ② leva accesa: i campi ci sono, e con una finestra il libro si chiede al bordo SULLA FINESTRA (ISO, hora local → UTC)
//          ③ la finestra comune = [il desde piu presto, l'hasta piu tardi], e se le macchine differiscono >30 min lo dice ④ senza risposta del bordo: libro del giorno con l'etichetta che dice «falta la ventana» (mai un numero
//          finto) ⑤ non si chiede il libro a ogni tasto (una richiesta per finestra) ⑥ la differenza si calcola contro il libro della finestra ⑦ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'caja_cajera.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 320))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); const a = SRC.slice(Math.max(0, i - 6), i) === 'async ' ? i - 6 : i;
  const eol = SRC.indexOf('\n', i), r1 = SRC.slice(i, eol);
  if (/\}\s*$/.test(r1) && (r1.match(/\{/g) || []).length === (r1.match(/\}/g) || []).length) return SRC.slice(a, eol + 1);
  return SRC.slice(a, SRC.indexOf('\n}\n', i) + 3); };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

function mondo(SRC, o) {
  o = o || {}; const els = {}, handlers = {}, reqs = [], app = { innerHTML: '' }, toasts = [];
  const mk = (key) => (els[key] || (els[key] = { key, value: '', dataset: {}, style: {}, innerHTML: '', onclick: null, addEventListener(ev, fn) { (handlers[key] = handlers[key] || {})[ev] = fn; }, insertAdjacentHTML(pos, h) { this.innerHTML += h; ctx.inseriti.push([key, h]); }, disabled: false }));
  const ctx = { JSON, Math, Date, String, Number, Object, Array, Promise, setTimeout, clearTimeout, encodeURIComponent, isNaN, parseInt, console,
    inseriti: [], posts: [], ls: new Map(), localStorage: { getItem: (k) => (ctx.ls.has(k) ? ctx.ls.get(k) : null), setItem: (k, v) => ctx.ls.set(k, String(v)) }, app, LOCAL: 'bks', BORDE: { bks: 'https://borde.test' }, DIA_HOY: '2026-10-10', DIA_NOCHE: '2026-10-09', DIA_CORTE: null, PASO: 3, SES: { user: 'Mayra' }, UIDS_GESTO: {}, _u: 0,
    barra: () => '', esc: (x) => String(x == null ? '' : x), fechaCorta: (d) => d, fmt: (n) => '$' + n, uidGesto: (p) => p + '-' + (++ctx._u), toast: (m, c) => toasts.push([m, c]), renderError() {}, pantalla9() {},
    unTocoUnHecho: (btn, fn) => { btn.onclick = fn; }, postCaja: async (b) => { ctx.posts.push(b); return o.postRisp || { ok: true }; },
    fetch: async (u) => { if (o.saludErr) throw new Error('rete'); return { json: async () => ({ flags: { caja_cortes_ventana_on: o.saludOn === undefined ? '1' : o.saludOn } }) }; },
    getCaja: async (p) => { if (/^cortes_pos/.test(p)) return { ok: true, libro: 5000000, guardado: o.guardado || [], puntos_fonte: 'x', puntos: [{ caja_n: 1, nombre: 'Caja 1', sn: null }, { caja_n: 2, nombre: 'Caja 2', sn: null }] };
      if (/^libro_ventana/.test(p)) { reqs.push(p); return o.libroRisp || { ok: true, libro: 7990344, n: 100 }; } return { ok: false }; },
    document: { getElementById: (id) => mk('#' + id), querySelector: (sel) => mk(sel) },
  };
  vm.createContext(ctx);
  const a = SRC.indexOf('var VENTANA_ON'), b = SRC.indexOf('function diasDeCorte()');
  const pv = SRC.slice(SRC.indexOf('var PROVEEDORES'), SRC.indexOf('async function pantalla8()'));
  vm.runInContext(SRC.slice(SRC.indexOf('function miles('), SRC.indexOf('function milesInput')) + fnDe(SRC, 'milesInput') + '\n' + SRC.slice(a, b) + '\nfunction diasDeCorte() { return [DIA_NOCHE, DIA_HOY]; }\n' + pv + fnDe(SRC, 'pantalla8') +
    '\nthis.F = { ventanaOn, ventanaIso, ventanaComun, fechaHoraCorta, leerLibroVentana, pantalla8, validarCortes, ventanaLocal, htmlFilaCorte };', ctx);
  return { ctx, els, handlers, reqs, app, toasts, mk };
}
const LOC = (iso) => { const d = new Date(iso); const p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()); };

async function banco(SRC) {
  { const m = mondo(SRC, {}); const F = m.ctx.F;
    t('② ventanaIso: «2026-10-08T18:48» (hora local) → ISO, y vacio/invalido → null', F.ventanaIso('2026-10-08T18:48') === new Date('2026-10-08T18:48').toISOString() && F.ventanaIso('') === null && F.ventanaIso('xx') === null && F.ventanaIso(null) === null);
    const I = (s) => new Date(s).toISOString();
    const c1 = F.ventanaComun([{ desde: I('2026-10-08T18:48'), hasta: I('2026-10-09T18:48') }, { desde: I('2026-10-08T18:50'), hasta: I('2026-10-09T18:45') }, { desde: null, hasta: null }]);
    t('③ ventanaComun: desde = el mas temprano, hasta = el mas tarde; difieren <= 30 min => false', c1 && c1.desde === I('2026-10-08T18:48') && c1.hasta === I('2026-10-09T18:48') && c1.difieren === false, c1);
    const c2 = F.ventanaComun([{ desde: I('2026-10-08T18:48'), hasta: I('2026-10-09T18:48') }, { desde: I('2026-10-08T12:00'), hasta: I('2026-10-09T18:48') }]);
    t('③ bis difieren > 30 min en el desde => true', c2.difieren === true, c2);
    t('③ ter ninguna ventana (o a medias) => null: se queda el libro del dia', F.ventanaComun([{ desde: I('2026-10-08T18:48'), hasta: null }, { desde: null, hasta: null }]) === null && F.ventanaComun([]) === null && F.ventanaComun(null) === null);
    t('② bis fechaHoraCorta: 08/10 18:48', F.fechaHoraCorta(new Date('2026-10-08T18:48')) === '08/10 18:48'); }
  { const m = mondo(SRC, {}); await m.ctx.F.leerLibroVentana('2026-10-09T21:48:00.000Z', '2026-10-10T21:48:00.000Z');
    t('② ter la lectura: libro_ventana con dia, desde y hasta codificados', m.reqs.length === 1 && /^libro_ventana\?dia=2026-10-09&desde=2026-10-09T21%3A48%3A00\.000Z&hasta=2026-10-10T21%3A48%3A00\.000Z$/.test(m.reqs[0]), m.reqs); }
  // ① leva spenta
  { const m = mondo(SRC, { saludOn: '0' }); await m.ctx.F.pantalla8();
    t('① leva spenta: la pantalla NO tiene los campos desde/hasta', !/data-maq-desde/.test(m.app.innerHTML) && /data-maq-corte="0"/.test(m.app.innerHTML), m.app.innerHTML.slice(0, 200));
    m.mk('[data-maq-corte="0"]').value = '4.000.000'; m.handlers['[data-maq-corte="0"]'].input(); await espera(5);
    t('① bis … y el libro es el del dia, sin pedir nada al bordo', m.reqs.length === 0 && /día completo/.test(m.mk('#comparacion').innerHTML) && /\$5000000/.test(m.mk('#comparacion').innerHTML), m.mk('#comparacion').innerHTML); }
  { const m = mondo(SRC, { saludErr: true }); await m.ctx.F.pantalla8();
    t('① ter /salud muto = apagado: sin campos de ventana', !/data-maq-desde/.test(m.app.innerHTML)); }
  // ② leva accesa
  { const m = mondo(SRC, {}); await m.ctx.F.pantalla8();
    t('② leva accesa: cada maquina tiene sus campos desde/hasta', /data-maq-desde="0"/.test(m.app.innerHTML) && /data-maq-hasta="1"/.test(m.app.innerHTML) && /type="datetime-local"/.test(m.app.innerHTML));
    m.mk('[data-maq-corte="0"]').value = '7.762.251'; m.handlers['[data-maq-corte="0"]'].input();
    m.mk('[data-maq-desde="0"]').value = '2026-10-08T18:48'; m.mk('[data-maq-hasta="0"]').value = '2026-10-09T18:48';
    m.handlers['[data-maq-desde="0"]'].change(); m.handlers['[data-maq-hasta="0"]'].change(); await espera(700);
    t('② bis con la ventana: UNA lectura libro_ventana con la ventana en ISO (hora local → UTC)', m.reqs.length === 1 && m.reqs[0].includes(encodeURIComponent(new Date('2026-10-08T18:48').toISOString())) && m.reqs[0].includes(encodeURIComponent(new Date('2026-10-09T18:48').toISOString())), m.reqs);
    const box = m.mk('#comparacion').innerHTML;
    t('⑥ el libro mostrado es el de la ventana (7.990.344), la etiqueta dice 08/10 18:48 → 09/10 18:48', /\$7990344/.test(box) && /08\/10 18:48 → 09\/10 18:48/.test(box) && !/día completo/.test(box), box);
    t('⑥ bis la diferencia se calcula contra ESE libro: 7.762.251 − 7.990.344 = −228.093', /Diferencia −\$228093/.test(box), box); }
  // ④ el bordo no responde
  { const m = mondo(SRC, { libroRisp: { ok: false, error: 'pg_no_responde' } }); await m.ctx.F.pantalla8();
    m.mk('[data-maq-corte="0"]').value = '7.762.251'; m.handlers['[data-maq-corte="0"]'].input();
    m.mk('[data-maq-desde="0"]').value = '2026-10-08T18:48'; m.mk('[data-maq-hasta="0"]').value = '2026-10-09T18:48'; m.handlers['[data-maq-hasta="0"]'].change(); await espera(700);
    const box = m.mk('#comparacion').innerHTML;
    t('④ sin respuesta del bordo: el libro del dia, y la etiqueta dice «falta la ventana» (mai un numero finto)', /\$5000000/.test(box) && /falta la ventana/.test(box) && !/→/.test(box), box); }
  // ③ difieren
  { const m = mondo(SRC, {}); await m.ctx.F.pantalla8();
    m.mk('[data-maq-corte="0"]').value = '1.000.000'; m.mk('[data-maq-corte="1"]').value = '2.000.000'; m.handlers['[data-maq-corte="0"]'].input();
    m.mk('[data-maq-desde="0"]').value = '2026-10-08T18:48'; m.mk('[data-maq-hasta="0"]').value = '2026-10-09T18:48';
    m.mk('[data-maq-desde="1"]').value = '2026-10-08T12:00'; m.mk('[data-maq-hasta="1"]').value = '2026-10-09T18:48'; m.handlers['[data-maq-hasta="1"]'].change(); await espera(700);
    t('③ quater las ventanas difieren > 30 min: la pantalla AVISA y usa la mas amplia (desde 12:00)', /no cubren la misma ventana/.test(m.mk('#comparacion').innerHTML) && m.reqs.length === 1 && m.reqs[0].includes(encodeURIComponent(new Date('2026-10-08T12:00').toISOString())), [m.reqs, m.mk('#comparacion').innerHTML]); }
  // ⑤ debounce
  { const m = mondo(SRC, {}); await m.ctx.F.pantalla8();
    m.mk('[data-maq-corte="0"]').value = '1.000.000'; m.mk('[data-maq-desde="0"]').value = '2026-10-08T18:48'; m.mk('[data-maq-hasta="0"]').value = '2026-10-09T18:48';
    for (let k = 0; k < 6; k++) m.handlers['[data-maq-hasta="0"]'].change(); await espera(700);
    t('⑤ seis cambios seguidos de la misma ventana => UNA sola lectura', m.reqs.length === 1, m.reqs.length); }
  { const m = mondo(SRC, {}); await m.ctx.F.pantalla8();
    m.mk('[data-maq-corte="0"]').value = '1.000.000'; m.mk('[data-maq-desde="0"]').value = '2026-10-08T18:48'; m.mk('[data-maq-hasta="0"]').value = '2026-10-09T18:48'; m.handlers['[data-maq-hasta="0"]'].change(); await espera(700);
    m.mk('[data-maq-corte="0"]').value = '1.500.000'; m.handlers['[data-maq-corte="0"]'].input(); await espera(50);
    t('⑤ bis cambiar solo el importe NO vuelve a pedir el libro (la ventana es la misma: se recuerda)', m.reqs.length === 1, m.reqs.length); }
  t('⑦ version >= 1.5.0 (la ventana del corte ya esta)', /caja 1\.[5-9]\.\d<\/small>/.test(SRC));
}
await banco(SRC0);
const mut = async (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; try { await banco(SRC0.replace(da, () => a)); } catch (e) { ko++; } muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('⑦ mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
await mut('la leva e ignorata', "VENTANA_ON = !!(j && j.flags && String(j.flags.caja_cortes_ventana_on) === '1');", "VENTANA_ON = true;");
await mut('/salud muto = accesa', "} catch (e) { VENTANA_ON = false; }", "} catch (e) { VENTANA_ON = true; }");
await mut('hora local tratada como UTC', "var d = new Date(v);\n  return isNaN(d.getTime()) ? null : d.toISOString();", "var d = new Date(v + 'Z');\n  return isNaN(d.getTime()) ? null : d.toISOString();");
await mut('el desde es el mas tardio', "Math.min.apply(null, d), dMax", "Math.max.apply(null, d), dMax");
await mut('el hasta es el mas temprano', "hMax = Math.max.apply(null, h);", "hMax = Math.min.apply(null, h);");
await mut('las ventanas que difieren no avisan', "if (vc.difieren) avisoV", "if (false) avisoV");
await mut('sin respuesta, finge el numero', "etiqueta = 'Dice nuestro libro <small>(día completo — falta la ventana)</small>';", "etiqueta = 'Dice nuestro libro'; libro = 1;");
await mut('se pide a cada tecla', "if (VENTANA_PIDIENDO === k) return;\n    VENTANA_PIDIENDO = k;", "VENTANA_PIDIENDO = k;");
await mut('no se recuerda la ventana', "if (VENTANA_LIBRO && VENTANA_LIBRO.k === vc.desde + '|' + vc.hasta && VENTANA_LIBRO.libro != null) {", "if (false) {");
await mut('la lectura sin dia', "return getCaja('libro_ventana?dia=' + encodeURIComponent(DIA_CORTE || DIA_NOCHE) + '&desde='", "return getCaja('libro_ventana?desde='");
await mut('campos de ventana siempre', "(conVentana\n      ? '<select", "(true\n      ? '<select");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
