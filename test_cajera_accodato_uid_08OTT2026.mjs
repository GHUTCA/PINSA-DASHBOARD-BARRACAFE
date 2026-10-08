// BANCO · EMERG «EMERG CAJERA ACCODATO LETTO COME ERRORE 5 CONTEOS» · TERZA PENNA · 08-ott-2026
// ① postCaja: `{ok:true, scritto:false, accodato:true}` e un SUCCESSO (prima: «No se guardó: no_escrito» e la cajera ritoccava). ② l'uid del conteo nasce col GESTO: tre tocchi sullo stesso conteo = UN uid.
import fs from 'node:fs'; import vm from 'node:vm';
const SRC = fs.readFileSync(new URL('./caja_cajera.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : (ko++, console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 260))); };
const fn = (nome, asinc) => { const i = SRC.indexOf((asinc ? 'async function ' : 'function ') + nome + '('); if (i < 0) throw new Error(nome); return SRC.slice(i, SRC.indexOf('\n}\n', i) + 3); };

// ── ① postCaja
function conBordo(risposta, httpOk = true) {
  const ctx = { BORDE: { bks: 'http://b' }, LOCAL: 'bks', TOKEN: 't', PIN_CAJA: '1', PROVA: false, DIA_HOY: 'd', encolado: [],
    esRespuestaPin: async () => false, colaEncolar: (b) => ctx.encolado.push(b), Object, JSON, encodeURIComponent,
    fetch: async () => ({ ok: httpOk, status: httpOk ? 200 : 500, json: async () => risposta }) };
  vm.createContext(ctx); vm.runInContext(fn('postCaja', true) + '\n;this.postCaja = postCaja;', ctx); return ctx;
}
{ const r = await conBordo({ ok: true, scritto: false, accodato: true, verbo: 'conteo', uid_gesto: 'u' }).postCaja({ verbo: 'conteo' });
  t('accodato:true ⇒ successo (non no_escrito)', r.ok === true && r.accodato === true, r); }
{ const r = await conBordo({ ok: true, accodato: true, ya: true, uid_gesto: 'u' }).postCaja({ verbo: 'conteo' });
  t('`ya` (il bordo riconosce il gesto) ⇒ successo', r.ok === true, r); }
{ const r = await conBordo({ ok: true, scritto: false, motivo: 'gate_spento' }).postCaja({ verbo: 'conteo' });
  t('scritto:false SENZA accodato resta un errore, col suo motivo (gate spento)', r.ok === false && r.motivo === 'gate_spento', r); }
{ const r = await conBordo({ ok: true, scritto: false }).postCaja({ verbo: 'conteo' });
  t('scritto:false senza motivo ⇒ no_escrito', r.ok === false && r.motivo === 'no_escrito', r); }
{ const r = await conBordo({ ok: false, error: 'x' }, false).postCaja({ verbo: 'conteo' });
  t('un rifiuto vero resta un rifiuto', r.ok === false, r); }

// ── ② l'uid stabile
{ const ctx = { Date, Math }; vm.createContext(ctx);
  vm.runInContext(fn('uidGesto') + '\n' + SRC.slice(SRC.indexOf('var UIDS_GESTO'), SRC.indexOf('function toast(')) + '\n;this.API = { uidGestoEstable };', ctx);
  const A = ctx.API.uidGestoEstable;
  t('stessa chiave ⇒ stesso uid (retry / secondo tocco)', A('k1', 'cnt') === A('k1', 'cnt'));
  t('altra chiave (altra cifra) ⇒ uid nuovo', A('k1', 'cnt') !== A('k2', 'cnt')); }

// ── ③ il flusso vero: pantalla7 → «Dejar anotado y seguir» toccato tre volte
function mundoConteo() {
  const els = {}; const posts = []; const toasts = []; const clic = {};
  const el = (id) => els[id] || (els[id] = { id, value: '', disabled: false, style: {}, addEventListener() {}, dataset: {}, textContent: '', set onclick(f) { clic[id] = f; }, get onclick() { return clic[id]; } });
  const ctx = { MANANA: { sobres: [{ sobre_nro: '1002', declarado: 17500 }] }, SOBRE_IDX: 0, PASO: 2, DIA_NOCHE: '2026-10-07', SES: { user: 'Mayra' }, app: { innerHTML: '' }, UIDS_GESTO: {},
    barra: () => '', esc: String, toast: (m, k) => toasts.push(m), pantalla7: () => { ctx.volvio = (ctx.volvio || 0) + 1; }, pantalla8: () => {}, Number, Math, Date, String, Object, posts, toasts,
    document: { getElementById: el, querySelector: () => el('q') },
    unTocoUnHecho: (b, f) => { clic[b.id + ':hecho'] = f; },
    postCaja: async (b) => { posts.push(b); return ctx.respuesta ? ctx.respuesta(b) : { ok: true, accodato: true, scritto: false }; } };
  vm.createContext(ctx);
  vm.runInContext(fn('uidGesto') + '\n' + SRC.slice(SRC.indexOf('var UIDS_GESTO'), SRC.indexOf('function toast(')) + '\n' + fn('pantalla7') + '\n;this.pantalla7 = pantalla7;', ctx);
  return { ctx, el, clic, posts, toasts };
}
{ const m = mundoConteo(); m.ctx.pantalla7();
  m.el('contado').value = '17000'; m.clic.selloSi.call(m.el('selloSi'));
  // il bottone «Revisar» e registrato da unTocoUnHecho: lo eseguiamo, poi il bottone «confirmar» che quello crea
  await m.clic['revisar:hecho']();
  await m.clic['confirmar:hecho'](); await m.clic['confirmar:hecho'](); await m.clic['confirmar:hecho']();
  t('tre tocchi su «Dejar anotado y seguir» ⇒ tre POST con lo STESSO uid_gesto (il bordo ne scrive UNO)', m.posts.length === 3 && new Set(m.posts.map((p) => p.uid_gesto)).size === 1, m.posts.map((p) => p.uid_gesto));
  t('con accodato:true NON compare «No se guardó»', !m.toasts.some((x) => /No se guard/.test(x)), m.toasts); }

// ── ④ le altre tre strade che coniavano un uid a ogni tocco
t('pos_corte, deposito (salida) e deposito (vuelta) non coniano piu un uid per tocco', !/uid_gesto:\s*uidGesto\(/.test(SRC), SRC.match(/uid_gesto:\s*uidGesto\([^)]*\)/g));
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
