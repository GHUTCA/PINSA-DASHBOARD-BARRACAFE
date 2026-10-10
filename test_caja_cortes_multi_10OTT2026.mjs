// BANCO · CORTES POS: FORNITORE E PIU' CORTES PER MACCHINA, NEL VETRO (Alberto via V28, 10-ott; DDL 16f6858f13) · TERZA PENNA
// Criteri: ① la validazione (pura): fornitore obbligatorio, finestra tutta-o-niente, hasta>desde, e con PIU' di un corte per macchina OGNI corte ha la sua finestra e non se ne ripete una (la vista vigente
//          terrebbe un corte solo per macchina+finestra: il secondo senza finestra SOSTITUIREBBE il primo) ② leva spenta = un numero per macchina, nessun fornitore, nessun «+ otro corte» ③ leva accesa: select del
//          fornitore (MPago · Transbank · ANDCO · Otro con testo), «+ otro corte de esta máquina» che AGGIUNGE una riga ④ i cortes gia guardati tornano come righe (AM e PM) con fornitore e finestra
//          ⑤ il salvataggio manda proveedor/desde/hasta, un uid per corte, e si ferma PRIMA di scrivere se qualcosa non torna ⑥ il fornitore si ricorda per macchina ⑦ mutanti.
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
  o = o || {}; const els = {}, handlers = {}, app = { innerHTML: '' }, toasts = [], posts = [], ls = new Map(), ins = [];
  const mk = (key) => (els[key] || (els[key] = { key, value: key.indexOf('[data-maq-prov="') === 0 ? 'MPago' : '', dataset: {}, style: {}, innerHTML: '', onclick: null, addEventListener(ev, fn) { (handlers[key] = handlers[key] || {})[ev] = fn; },
    insertAdjacentHTML(pos, h) { this.innerHTML += h; ins.push([key, h]); }, disabled: false }));
  const ctx = { JSON, Math, Date, String, Number, Object, Array, Promise, setTimeout, clearTimeout, encodeURIComponent, isNaN, parseInt, console,
    localStorage: { getItem: (k) => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)) },
    app, LOCAL: 'bks', BORDE: { bks: 'https://borde.test' }, DIA_HOY: '2026-10-10', DIA_NOCHE: '2026-10-09', DIA_CORTE: null, PASO: 3, SES: { user: 'Mayra' }, UIDS_GESTO: {}, _u: 0,
    barra: () => '', esc: (x) => String(x == null ? '' : x), fechaCorta: (d) => d, fmt: (n) => '$' + n, uidGesto: (p) => p + '-' + (++ctx._u), toast: (m, c) => toasts.push([m, c]), renderError() {}, pantalla9() { ctx.fine = true; },
    unTocoUnHecho: (btn, fn) => { btn.onclick = fn; }, postCaja: async (b) => { posts.push(b); return o.postRisp || { ok: true }; },
    fetch: async () => ({ json: async () => ({ flags: { caja_cortes_ventana_on: o.saludOn === undefined ? '1' : o.saludOn } }) }),
    getCaja: async (p) => { if (/^cortes_pos/.test(p)) return { ok: true, libro: 5000000, guardado: o.guardado || [], puntos_fonte: 'x', puntos: [{ caja_n: 1, nombre: 'Caja 1', sn: null }, { caja_n: 2, nombre: 'Caja 2', sn: null }] }; return { ok: true, libro: 1 }; },
    document: { getElementById: (id) => mk('#' + id), querySelector: (sel) => mk(sel) },
  };
  vm.createContext(ctx);
  const a = SRC.indexOf('var VENTANA_ON'), b = SRC.indexOf('function diasDeCorte()'), pv = SRC.slice(SRC.indexOf('var PROVEEDORES'), SRC.indexOf('async function pantalla8()'));
  vm.runInContext(SRC.slice(SRC.indexOf('function miles('), SRC.indexOf('function milesInput')) + fnDe(SRC, 'milesInput') + '\n' + SRC.slice(a, b) + '\nfunction diasDeCorte() { return [DIA_NOCHE, DIA_HOY]; }\n' +
    'function uidGestoEstable(c, p) { if (!UIDS_GESTO[c]) UIDS_GESTO[c] = uidGesto(p); return UIDS_GESTO[c]; }\n' + pv + fnDe(SRC, 'pantalla8') +
    '\nthis.F = { pantalla8, validarCortes, ventanaLocal, htmlFilaCorte, ventanaIso };', ctx);
  return { ctx, els, handlers, app, toasts, posts, ls, ins, mk };
}
const I = (s) => new Date(s).toISOString();
const V = (nombre, v, desde, hasta, prov) => ({ pt: { nombre }, v, proveedor: prov === undefined ? 'MPago' : prov, ventana: { desde: desde ? I(desde) : null, hasta: hasta ? I(hasta) : null } });
const AM = ['2026-10-08T06:00', '2026-10-08T18:48'], PM = ['2026-10-08T18:48', '2026-10-09T06:00'];

async function banco(SRC) {
  const m0 = mondo(SRC, {}), F = m0.ctx.F;
  // ① la pura
  t('① nada que guardar / una cifra invalida => mensaje, no se escribe', F.validarCortes([V('Caja 1', null)], true).msg === 'Escribe al menos un corte' && /no es un número/.test(F.validarCortes([V('Caja 1', NaN)], true).msg) && /no es un número/.test(F.validarCortes([V('Caja 1', -5)], false).msg));
  t('① bis sin ventana-leva: pasa tal cual (como ayer), sin exigir proveedor ni ventana', F.validarCortes([V('Caja 1', 100, null, null, '')], false).ok === true);
  t('① ter con la leva: proveedor obligatorio', /proveedor/.test(F.validarCortes([V('Caja 1', 100, null, null, '')], true).msg || ''), F.validarCortes([V('Caja 1', 100, null, null, '')], true));
  t('① quater ventana a medias => msg; hasta <= desde => msg', /Falta el desde o el hasta/.test(F.validarCortes([V('Caja 1', 100, AM[0], null)], true).msg || '') && /después del «desde»/.test(F.validarCortes([V('Caja 1', 100, AM[1], AM[0])], true).msg || ''));
  t('① quinto UNA sola entrada por maquina, SIN ventana: pasa (la ventana es opcional)', F.validarCortes([V('Caja 1', 100), V('Caja 2', 200)], true).ok === true);
  t('① sexto DOS cortes de la misma maquina SIN ventana => msg (se pisarian: la vista tiene una clave por ventana)', /necesita su ventana/.test(F.validarCortes([V('Caja 1', 100), V('Caja 1', 200)], true).msg || ''), F.validarCortes([V('Caja 1', 100), V('Caja 1', 200)], true));
  t('① septimo dos cortes de la misma maquina, uno con ventana y otro SIN => msg', /necesita su ventana/.test(F.validarCortes([V('Caja 1', 100, AM[0], AM[1]), V('Caja 1', 200)], true).msg || ''));
  t('① octavo la MISMA ventana dos veces => msg (uno pisaria al otro)', /misma ventana/.test(F.validarCortes([V('Caja 1', 100, AM[0], AM[1]), V('Caja 1', 200, AM[0], AM[1])], true).msg || ''));
  t('① noveno AM y PM distintos => ok, con las dos filas', (F.validarCortes([V('Caja 1', 100, AM[0], AM[1]), V('Caja 1', 200, PM[0], PM[1])], true).filas || []).length === 2);
  t('① decimo Caja 1 con AM+PM y Caja 2 con uno solo sin ventana: ok (la regla es por maquina)', F.validarCortes([V('Caja 1', 100, AM[0], AM[1]), V('Caja 1', 200, PM[0], PM[1]), V('Caja 2', 50)], true).ok === true);
  t('③ ventanaLocal es la inversa de ventanaIso (para precargar lo guardado)', F.ventanaLocal(F.ventanaIso('2026-10-08T18:48')) === '2026-10-08T18:48' && F.ventanaLocal('') === '' && F.ventanaLocal('xx') === '');
  // ② leva spenta
  { const m = mondo(SRC, { saludOn: '0' }); await m.ctx.F.pantalla8();
    t('② leva spenta: ni fornitor, ni ventana, ni «+ otro corte»', !/data-maq-prov/.test(m.app.innerHTML) && !/data-maq-mas/.test(m.app.innerHTML) && !/data-maq-desde/.test(m.app.innerHTML) && /Un número por máquina/.test(m.app.innerHTML), m.app.innerHTML.slice(0, 200));
    m.mk('[data-maq-corte="0"]').value = '1.802.361'; await m.els['#guardar'].onclick();
    t('② bis … y el guardado es el de ayer: sin proveedor/desde/hasta, el uid como ayer', m.posts.length === 1 && m.posts[0].corte === 1802361 && !('proveedor' in m.posts[0]) && !('desde' in m.posts[0]) && !('hasta' in m.posts[0]) && m.posts[0].maquina === 'Caja 1', m.posts); }
  // ③ leva accesa
  { const m = mondo(SRC, {}); await m.ctx.F.pantalla8();
    t('③ select del proveedor por maquina con MPago · Transbank · ANDCO · Otro, MPago por defecto', /data-maq-prov="0"/.test(m.app.innerHTML) && /<option value="Transbank"/.test(m.app.innerHTML) && /<option value="ANDCO"/.test(m.app.innerHTML) && /<option value="Otro"/.test(m.app.innerHTML) && /<option value="MPago" selected>/.test(m.app.innerHTML), m.app.innerHTML.slice(0, 300));
    t('③ bis el campo «¿Cuál proveedor?» esta OCULTO hasta elegir Otro', /data-maq-provotro="0"[^>]*style="[^"]*display:none/.test(m.app.innerHTML));
    t('③ ter un boton «+ otro corte de esta máquina» por maquina', /data-maq-mas="0"/.test(m.app.innerHTML) && /data-maq-mas="1"/.test(m.app.innerHTML));
    m.mk('[data-maq-prov="0"]').value = 'Otro'; m.handlers['[data-maq-prov="0"]'].change(); t('③ quater elegir Otro muestra el campo de texto', m.mk('[data-maq-provotro="0"]').style.display === '');
    m.mk('[data-maq-mas="0"]').onclick();
    t('③ quinto «+ otro corte» AGREGA una fila (la 3a) a la Caja 1, rotulada «Otro corte de Caja 1»', m.ins.length === 1 && m.ins[0][0] === '#maqFilas0' && /Otro corte de Caja 1/.test(m.ins[0][1]) && /data-maq-corte="2"/.test(m.ins[0][1]), m.ins);
    m.mk('[data-maq-corte="0"]').value = '900.000'; m.mk('[data-maq-corte="2"]').value = '902.361'; m.handlers['[data-maq-corte="2"]'].input();
    t('③ sexto la suma incluye las dos filas (900.000 + 902.361)', /\$1802361/.test(m.mk('#comparacion').innerHTML), m.mk('#comparacion').innerHTML); }
  // ④ lo ya guardado
  { const g = [{ maquina: 'Caja 1', corte: 900000, proveedor: 'MPago', desde: I(AM[0]), hasta: I(AM[1]) }, { maquina: 'Caja 1', corte: 902361, proveedor: 'Transbank', desde: I(PM[0]), hasta: I(PM[1]) }, { maquina: 'Caja 2', corte: 5000 }];
    const m = mondo(SRC, { guardado: g }); await m.ctx.F.pantalla8();
    t('④ los cortes ya guardados vuelven como FILAS: dos de la Caja 1 (AM y PM) + una de la Caja 2 (3 inputs de corte)', (m.app.innerHTML.match(/data-maq-corte="/g) || []).length === 3 && /value="900\.000"/.test(m.app.innerHTML) && /value="902\.361"/.test(m.app.innerHTML) && /value="5\.000"/.test(m.app.innerHTML), m.app.innerHTML.slice(0, 200));
    t('④ bis proveedor y ventana precargados (Transbank seleccionado; desde/hasta en hora local)', /<option value="Transbank" selected>/.test(m.app.innerHTML) && m.app.innerHTML.includes('value="' + m.ctx.F.ventanaLocal(I(PM[0])) + '"'), m.app.innerHTML.slice(0, 300)); }
  // ⑤ el guardado
  { const m = mondo(SRC, {}); await m.ctx.F.pantalla8();
    m.mk('[data-maq-corte="0"]').value = '900.000'; m.mk('[data-maq-desde="0"]').value = '2026-10-08T06:00'; m.mk('[data-maq-hasta="0"]').value = '2026-10-08T18:48'; m.mk('[data-maq-prov="0"]').value = 'Transbank';
    m.mk('[data-maq-mas="0"]').onclick();
    m.mk('[data-maq-corte="2"]').value = '902.361'; m.mk('[data-maq-desde="2"]').value = '2026-10-08T18:48'; m.mk('[data-maq-hasta="2"]').value = '2026-10-09T06:00'; m.mk('[data-maq-prov="2"]').value = 'Otro'; m.mk('[data-maq-provotro="2"]').value = 'Getnet';
    await m.els['#guardar'].onclick();
    t('⑤ dos cortes de la Caja 1 => dos posts, cada uno con proveedor, desde y hasta (ISO) — el segundo con el proveedor escrito', m.posts.length === 2 && m.posts[0].proveedor === 'Transbank' && m.posts[0].desde === I('2026-10-08T06:00') && m.posts[0].hasta === I('2026-10-08T18:48') && m.posts[1].proveedor === 'Getnet' && m.posts[1].corte === 902361 && m.posts[1].desde === I('2026-10-08T18:48'), m.posts);
    t('⑤ bis dos uid DISTINTOS (dos hechos, no uno repetido), y el dia_op va en los dos', m.posts[0].uid_gesto !== m.posts[1].uid_gesto && m.posts.every((p) => p.dia_op === '2026-10-09' && p.verbo === 'pos_corte' && p.maquina === 'Caja 1'));
    t('⑥ el proveedor elegido se recuerda por maquina (Transbank para Caja 1; «Otro» para el escrito)', m.ls.get('caja_prov_Caja 1') !== undefined, [...m.ls]); }
  { const m = mondo(SRC, {}); await m.ctx.F.pantalla8();
    m.mk('[data-maq-corte="0"]').value = '900.000'; m.mk('[data-maq-desde="0"]').value = '2026-10-08T06:00'; m.mk('[data-maq-hasta="0"]').value = '2026-10-08T18:48';
    m.mk('[data-maq-mas="0"]').onclick();
    m.mk('[data-maq-corte="2"]').value = '900.000'; m.mk('[data-maq-desde="2"]').value = '2026-10-08T18:48'; m.mk('[data-maq-hasta="2"]').value = '2026-10-09T06:00';
    await m.els['#guardar'].onclick();
    t('⑤ bis-bis AM y PM con el MISMO importe: dos uid distintos (la ventana forma parte del hecho; sin ella el segundo seria el mismo «hecho» y no se escribiria)', m.posts.length === 2 && m.posts[0].uid_gesto !== m.posts[1].uid_gesto, m.posts.map((p) => p.uid_gesto)); }
  { const m = mondo(SRC, {}); await m.ctx.F.pantalla8();
    m.mk('[data-maq-corte="0"]').value = '900.000'; m.mk('[data-maq-mas="0"]').onclick(); m.mk('[data-maq-corte="2"]').value = '902.361';
    await m.els['#guardar'].onclick();
    t('⑤ ter dos cortes de la misma maquina SIN ventana: NO se escribe NADA y se dice por que', m.posts.length === 0 && m.toasts.some((x) => /necesita su ventana/.test(x[0])), [m.posts.length, m.toasts]); }
  { const m = mondo(SRC, {}); await m.ctx.F.pantalla8();
    m.mk('[data-maq-corte="0"]').value = '900.000'; m.mk('[data-maq-prov="0"]').value = 'Otro'; m.mk('[data-maq-provotro="0"]').value = '  ';
    await m.els['#guardar'].onclick();
    t('⑤ quater «Otro» sin escribir cual proveedor => NO se escribe, se pide el proveedor', m.posts.length === 0 && m.toasts.some((x) => /proveedor/i.test(x[0])), [m.posts.length, m.toasts]); }
  { const m = mondo(SRC, {}); await m.ctx.F.pantalla8();
    m.mk('[data-maq-corte="0"]').value = '900.000'; m.mk('[data-maq-corte="1"]').value = '12a';
    await m.els['#guardar'].onclick();
    t('⑤ quinto una cifra invalida en OTRA maquina frena TODO antes de escribir la primera', m.posts.length === 0 && m.toasts.some((x) => /no es un número/.test(x[0])), [m.posts.length, m.toasts]); }
  { const m = mondo(SRC, {}); await m.ctx.F.pantalla8();
    m.mk('[data-maq-corte="0"]').value = '900.000';
    await m.els['#guardar'].onclick();
    t('⑤ sexto UN corte por maquina sin ventana, con MPago por defecto: se escribe, con proveedor y SIN desde/hasta (columnas en NULL)', m.posts.length === 1 && m.posts[0].proveedor === 'MPago' && !('desde' in m.posts[0]) && !('hasta' in m.posts[0]) && m.ctx.fine === true, m.posts); }
  t('⑦ version >= 1.6.0', /caja 1\.[6-9]\.\d<\/small>/.test(SRC));
}
await banco(SRC0);
const mut = async (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; try { await banco(SRC0.replace(da, () => a)); } catch (e) { ko++; } muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('⑦ mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
await mut('proveedor no obligatorio', "if (!x.proveedor) return { msg: 'Elige el proveedor del corte de ' + nom };", "");
await mut('ventana a medias pasa', "if (!!w.desde !== !!w.hasta) return", "if (false) return");
await mut('hasta antes de desde pasa', "if (w.desde && Date.parse(w.hasta) <= Date.parse(w.desde)) return", "if (false) return");
await mut('dos cortes sin ventana pasan', "if (lista.some(function(x){ return !(x.ventana && x.ventana.desde); })) return", "if (false) return");
await mut('la misma ventana dos veces pasa', "if (vistas[kk]) return", "if (false) return");
await mut('el uid no distingue la ventana', "'|' + (x.ventana.desde || '') + '|' + (x.ventana.hasta || '') + '|' + x.proveedor : ''", "'' : ''");
await mut('no manda el proveedor', "cuerpo.proveedor = x.proveedor;", "");
await mut('no manda la ventana', "if (x.ventana.desde) { cuerpo.desde = x.ventana.desde; cuerpo.hasta = x.ventana.hasta; }", "");
await mut('«+ otro corte» no agrega fila', "FILAS.push(r);\n      document.getElementById('maqFilas' + i)", "document.getElementById('maqFilas' + i)");
await mut('lo guardado no vuelve como filas', "previos = ventanaActiva ? (CORTES.guardado || []).filter(function(g){ return g.maquina === pt.nombre; }) :", "previos = false ? [] :");
await mut('Otro no usa el texto', "elP.value === 'Otro' ? String((elO && elO.value) || '').trim() : String(elP.value || '').trim()", "String(elP.value || '').trim()");
await mut('el proveedor no se recuerda', "try { localStorage.setItem('caja_prov_' + x.pt.nombre,", "try { void ('caja_prov_' + x.pt.nombre,");
await mut('leva spenta con select de proveedor', "(conVentana\n      ? '<select", "(true\n      ? '<select");
await mut('se escribe antes de validar todo', "var v = validarCortes(valores(), ventanaActiva);\n    if (!v.ok) { toast(v.msg, 'bad'); return; }", "var v = { ok: true, filas: valores().filter(function(x){ return x.v !== null; }) };");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
