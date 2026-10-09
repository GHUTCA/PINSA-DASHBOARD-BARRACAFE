// BANCO · cortes POS a SEI Point · el dia del corte · jornada contra suma · Guardar avanza · TERZA PENNA · 09-ott-2026
// (V28: `CORTES SEI POINT GIORNO DEL SERVIZIO SOMMA`, `CORTES SN IN POSTGRES TOLLERANZA ZERO`, `CORTES GUARDAR NON AVANZA`). Corre la pantalla8() VERDADERA con un DOM de mentira.
import fs from 'node:fs'; import vm from 'node:vm';
const SRC = fs.readFileSync(new URL('./caja_cajera.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : (ko++, console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 280))); };
const i0 = SRC.indexOf('async function pantalla8('); const fnSrc = SRC.slice(i0, SRC.indexOf('\n}\n', i0) + 3);
const iD = SRC.indexOf('var DIA_CORTE'); const dcSrc = SRC.slice(iD, i0);   // DIA_CORTE + diasDeCorte

function mundo(corTes, respuestaPost) {
  const els = {}; const posts = []; const log = [];
  const el = (k) => els[k] || (els[k] = { value: '', style: {}, listeners: {}, innerHTML: '', onclick: null, addEventListener(ev, f) { this.listeners[ev] = f; } });
  const ctx = { CORTES: null, PASO: 3, DIA_HOY: '2026-10-09', DIA_NOCHE: '2026-10-08', SES: { user: 'Mayra' }, app: { innerHTML: '' }, posts, log, lecturas: [],
    barra: () => '', esc: String, fmt: (n) => '$' + Math.abs(n).toLocaleString('es-CL'), fechaCorta: (d) => 'f' + d.slice(8), diaAnterior: () => '2026-10-07',
    toast: (m) => log.push('toast:' + m), renderError: () => log.push('error'), Number, Math, String, Array, Object,
    getCaja: async (p) => { ctx.lecturas.push(p); return corTes; },
    postCaja: async (b) => { posts.push(b); return respuestaPost ? respuestaPost(b) : { ok: true, accodato: true }; },
    uidGestoEstable: (k, p) => p + '|' + k, pantalla9: () => log.push('→pantalla9'), unTocoUnHecho: (b, f) => { b._hecho = f; },
    document: { getElementById: (id) => el('id:' + id), querySelector: (sel) => el('q:' + sel) } };
  vm.createContext(ctx); vm.runInContext(dcSrc + '\n' + fnSrc + '\n;this.p8 = pantalla8; this.getDia = () => DIA_CORTE;', ctx);
  return { ctx, el, posts, log };
}
const PUNTOS = [1, 2, 3, 4, 5, 6].map((n) => ({ caja_n: n, nombre: 'Caja ' + n, sn: 'SN' + n }));
const C = (x) => Object.assign({ ok: true, puntos: PUNTOS, puntos_fonte: 'tabla', libro: 300, guardado: [] }, x || {});
const corte = (m, n, v) => { m.el('q:[data-maq-corte="' + (n - 1) + '"]').value = String(v); };
const tipea = (m, n) => m.el('q:[data-maq-corte="' + (n - 1) + '"]').listeners.input();

// ① seis filas Caja 1..6 con S/N, y el dia por defecto es AYER
{ const m = mundo(C()); await m.ctx.p8(); const h = m.ctx.app.innerHTML;
  t('seis filas «Caja 1 … Caja 6», cada una con su S/N', [1, 2, 3, 4, 5, 6].every((n) => h.includes('Caja ' + n) && h.includes('S/N SN' + n)), h.slice(0, 200));
  t('NO hay «MPago/Getnet/Transbank/SumUp» ni «+ Otra máquina»', !/MPago|Getnet|Transbank|SumUp|otraMaq/.test(h));
  t('lee los cortes del dia de AYER por defecto (el dia que cierra)', m.ctx.lecturas[0] === 'cortes_pos?dia=2026-10-08' && m.ctx.getDia() === '2026-10-08', m.ctx.lecturas);
  t('la eleccion del dia es VISIBLE y es la del bordo: ayer u hoy (no anteayer)', /id="diaCorte"/.test(h) && />Ayer · f08</.test(h) && />Hoy · f09</.test(h) && !/f07/.test(h), h.slice(0, 500)); }
// ② ripiego sin tabla: sigue habiendo seis filas
{ const m = mundo(C({ puntos: undefined })); await m.ctx.p8();
  t('sin `puntos` en la lectura: igual seis filas Caja 1..6 (sin S/N)', [1, 2, 3, 4, 5, 6].every((n) => m.ctx.app.innerHTML.includes('Caja ' + n)) && !/S\/N/.test(m.ctx.app.innerHTML)); }
// ③ guardar: solo las filas escritas, con el dia, y avanza
{ const m = mundo(C()); await m.ctx.p8(); corte(m, 1, 100); corte(m, 3, 200); await m.el('id:guardar')._hecho();
  t('guarda SOLO las filas escritas (Caja 1 y Caja 3), con maquina «Caja n», corte y dia_corte = ayer', m.posts.length === 2 && m.posts[0].maquina === 'Caja 1' && m.posts[0].corte === 100 && m.posts[1].maquina === 'Caja 3' && m.posts[1].corte === 200 && m.posts.every((p) => p.dia_corte === '2026-10-08'), m.posts);
  t('y pasa SOLA al deposito', m.log.includes('→pantalla9') && m.ctx.PASO === 4, m.log); }
{ const m = mundo(C()); await m.ctx.p8(); corte(m, 2, 0); await m.el('id:guardar')._hecho();
  t('un 0 escrito es un corte DECLARADO (se guarda); una fila vacia no', m.posts.length === 1 && m.posts[0].maquina === 'Caja 2' && m.posts[0].corte === 0, m.posts); }
{ const m = mundo(C()); await m.ctx.p8(); await m.el('id:guardar')._hecho();
  t('sin ningun corte escrito: no guarda y NO avanza (dice que escriba uno)', m.posts.length === 0 && !m.log.includes('→pantalla9') && m.log.some((x) => /al menos un corte/.test(x)), m.log); }
{ const m = mundo(C(), () => ({ ok: false, motivo: 'x' })); await m.ctx.p8(); corte(m, 1, 5); await m.el('id:guardar')._hecho();
  t('un guardado que falla NO avanza y lo dice', !m.log.includes('→pantalla9') && m.log.some((x) => /No se guard/.test(x)), m.log); }
// ④ cambiar el dia vuelve a leer ESE dia
{ const m = mundo(C()); await m.ctx.p8(); m.el('id:diaCorte').value = '2026-10-09'; await m.el('id:diaCorte').listeners.change(); await new Promise((r) => setTimeout(r, 0));
  t('elegir «hoy» vuelve a leer cortes_pos de ESE dia', m.ctx.lecturas.includes('cortes_pos?dia=2026-10-09') && m.ctx.getDia() === '2026-10-09', [m.ctx.lecturas, m.ctx.getDia()]);
  corte(m, 1, 9); await m.el('id:guardar')._hecho(); t('dia_corte del guardado = el elegido', m.posts[0] && m.posts[0].dia_corte === '2026-10-09', m.posts); }
// ⑤ la JORNADA contra la SUMA — tolerancia cero, ambar, sin bloquear
{ const m = mundo(C({ libro: 300 })); await m.ctx.p8(); corte(m, 1, 100); corte(m, 2, 150); tipea(m, 1);
  const h = m.el('id:comparacion').innerHTML;
  t('suma 250 contra libro 300 ⇒ «Diferencia −$50» en ambar', /Suma de las máquinas/.test(h) && /\$250/.test(h) && /Dice nuestro libro/.test(h) && /Diferencia −\$50/.test(h) && /ambar/.test(h), h);
  await m.el('id:guardar')._hecho(); t('… y NO bloquea: guarda igual', m.posts.length === 2 && m.log.includes('→pantalla9'), m.log); }
{ const m = mundo(C({ libro: 300 })); await m.ctx.p8(); corte(m, 1, 100); corte(m, 2, 200); tipea(m, 1);
  t('suma = libro ⇒ sin diferencia (cualquier ≠ 0 se ve, = 0 se calla)', !/Diferencia/.test(m.el('id:comparacion').innerHTML)); }
{ const m = mundo(C({ libro: 300 })); await m.ctx.p8(); corte(m, 1, 301); tipea(m, 1);
  t('un solo peso de mas SE VE (tolerancia cero)', /Diferencia \+\$1/.test(m.el('id:comparacion').innerHTML), m.el('id:comparacion').innerHTML); }
{ const m = mundo(C({ libro: null })); await m.ctx.p8(); corte(m, 1, 5); tipea(m, 1);
  t('libro null (no se pudo leer): no hay comparacion, el corte se guarda igual', m.el('id:comparacion').innerHTML === ''); }
// ⑥ el bordo VIEJO (sin la marca) no guarda con el dia equivocado
{ const m = mundo(C({ puntos_fonte: undefined })); await m.ctx.p8();
  t('bordo viejo: avisa, el boton Guardar nace deshabilitado', /todavía no acepta el día del corte/.test(m.ctx.app.innerHTML) && /id="guardar" disabled/.test(m.ctx.app.innerHTML)); }
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
