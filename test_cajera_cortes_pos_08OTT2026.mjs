// BANCO · cortes POS: «+ Otra máquina» y «Guardar» que avanza solo · TERZA PENNA · 08-ott-2026 (V28: `CORTES POS MANCA SECONDA MACCHINA`, `CORTES GUARDAR NON AVANZA`)
// Corre la pantalla8() VERDADERA con un DOM de mentira que recuerda los elementos por indice.
import fs from 'node:fs'; import vm from 'node:vm';
const SRC = fs.readFileSync(new URL('./caja_cajera.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : (ko++, console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 260))); };
const i0 = SRC.indexOf('async function pantalla8('); const fnSrc = SRC.slice(i0, SRC.indexOf('\n}\n', i0) + 3);
const MQ = SRC.match(/var MAQUINAS_CONOCIDAS = \[[^\]]*\];/)[0];

function mundo(corTes, respuestaPost) {
  const els = {}; const posts = []; const log = []; const insertado = [];
  const el = (k) => els[k] || (els[k] = { value: '', style: {}, addEventListener() {}, onclick: null, insertAdjacentHTML: (w, h) => insertado.push(h) });
  const ctx = { CORTES: null, PASO: 3, DIA_HOY: '2026-10-09', SES: { user: 'Mayra' }, app: { innerHTML: '' }, posts, log, insertado,
    barra: () => '', esc: String, fmt: String, toast: (m) => log.push('toast:' + m), renderError: () => log.push('error'), Number, Math, String, Array, Object,
    getCaja: async () => corTes, postCaja: async (b) => { posts.push(b); return respuestaPost ? respuestaPost(b) : { ok: true, accodato: true }; },
    uidGestoEstable: (k, p) => p + '|' + k, pantalla9: () => log.push('→pantalla9'),
    unTocoUnHecho: (b, f) => { b._hecho = f; },
    document: { getElementById: (id) => el('id:' + id), querySelector: (sel) => el('q:' + sel) } };
  vm.createContext(ctx); vm.runInContext(MQ + '\n' + fnSrc + '\n;this.p8 = pantalla8;', ctx);
  return { ctx, el, posts, log, insertado };
}
const C1 = { ok: true, maquinas: ['MPago'], libro: 1000, guardado: [] };
const campo = (m, i, sel, corte) => { m.el('q:[data-maq-select="' + i + '"]').value = sel; m.el('q:[data-maq-corte="' + i + '"]').value = String(corte); };

// ① «+ Otra máquina» agrega una fila (la primera conocida libre) y las dos se guardan
{ const m = mundo(C1); await m.ctx.p8();
  t('el boton «+ Otra máquina» existe', /id="otraMaq"/.test(m.ctx.app.innerHTML));
  campo(m, 0, 'MPago', 500);
  m.el('id:otraMaq').onclick();
  t('agrega una fila con indice 1 y la primera maquina conocida libre (Getnet, no MPago)', m.insertado.length === 1 && /data-maq-select="1"/.test(m.insertado[0]) && /value="Getnet" selected/.test(m.insertado[0]), m.insertado);
  campo(m, 1, 'Getnet', 300);
  await m.el('id:guardar')._hecho();
  t('guarda LAS DOS maquinas, cada una con su corte', m.posts.length === 2 && m.posts[0].maquina === 'MPago' && m.posts[0].corte === 500 && m.posts[1].maquina === 'Getnet' && m.posts[1].corte === 300, m.posts);
  t('y despues pasa SOLA al deposito (no se queda con un toast)', m.log.includes('→pantalla9') && m.ctx.PASO === 4, m.log); }
// ② si un guardado falla, NO avanza
{ const m = mundo(C1, () => ({ ok: false, motivo: 'x' })); await m.ctx.p8(); campo(m, 0, 'MPago', 500);
  await m.el('id:guardar')._hecho();
  t('un guardado que falla NO avanza al deposito y lo dice', !m.log.includes('→pantalla9') && m.log.some((x) => /No se guard/.test(x)), m.log); }
// ③ «Ir al depósito» sigue para quien no escribe cortes
{ const m = mundo(C1); await m.ctx.p8(); m.el('id:siguiente').onclick();
  t('«Ir al depósito» sigue funcionando', m.log.includes('→pantalla9') && m.ctx.PASO === 4); }
// ④ tres veces «+ Otra máquina»: no repite una conocida ya usada
{ const m = mundo(C1); await m.ctx.p8(); campo(m, 0, 'MPago', 1); m.el('id:otraMaq').onclick(); campo(m, 1, 'Getnet', 1); m.el('id:otraMaq').onclick();
  t('la tercera fila propone otra conocida (Transbank), no repite MPago ni Getnet', /value="Transbank" selected/.test(m.insertado[1] || ''), m.insertado); }
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
