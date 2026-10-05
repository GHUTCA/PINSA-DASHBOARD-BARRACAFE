// BANCO · il modo di collaudo del VETRO della cajera (caja_cajera.html) · TERZA PENNA · 05-ott-2026
// Criteri: sin ?prova=1 la app es la de siempre (días reales, ningún dia_prueba) · con ?prova=1 los días son 2099, cada POST
// lleva dia_prueba = el «hoy» de prueba, el banner dice MODO PRUEBA, y la busta de prueba se planta con el verbo prueba_sobre.
import fs from 'node:fs'; import vm from 'node:vm';
const SRC = fs.readFileSync(new URL('./caja_cajera.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : (ko++, console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 260))); };
const fn = (nome, asinc) => { const i = SRC.indexOf((asinc ? 'async function ' : 'function ') + nome + '('); if (i < 0) throw new Error(nome);
  const j = SRC.indexOf('\n}\n', i) + 3; return SRC.slice(i, j); };

// ── lo stato (PROVA, DIA_HOY, DIA_NOCHE) letto dal sorgente vero
const iS = SRC.indexOf('var PROVA = (function');
const iE = SRC.indexOf("if (PROVA) { DIA_HOY", iS); const jE = SRC.indexOf('\n', iE) + 1;
const stato = SRC.slice(iS, jE);
function mondoStato(search) {
  const ctx = { location: { search }, URLSearchParams, DIA_HOY: '2026-10-05', DIA_NOCHE: '2026-10-04' };
  vm.createContext(ctx); vm.runInContext(stato + '\n;this.out = { PROVA, DIA_HOY, DIA_NOCHE };', ctx); return ctx.out;
}
const N = mondoStato(''), PV = mondoStato('?prova=1'), P0 = mondoStato('?prova=0'), PX = mondoStato('?loc=rsc&prova=1');
t('sin ?prova=1: los días reales intactos', N.PROVA === false && N.DIA_HOY === '2026-10-05' && N.DIA_NOCHE === '2026-10-04', N);
t('?prova=0 no es prova', P0.PROVA === false && P0.DIA_HOY === '2026-10-05', P0);
t('con ?prova=1: días de PRUEBA 2099 (hoy 31-dic, noche 30-dic)', PV.PROVA === true && PV.DIA_HOY === '2099-12-31' && PV.DIA_NOCHE === '2099-12-30', PV);
t('?prova=1 junto a otros parámetros funciona', PX.PROVA === true && PX.DIA_HOY === '2099-12-31', PX);
t('el día de prueba lo entiende el bordo (2099-)', /^2099-/.test(PV.DIA_HOY) && /^2099-/.test(PV.DIA_NOCHE));

// ── postCaja: dia_prueba solo en modo prueba, el pin nunca en la URL
async function corre(prova, body) {
  const llamadas = [];
  const ctx = { PROVA: prova, DIA_HOY: prova ? '2099-12-31' : '2026-10-05', PIN_CAJA: '2222', LOCAL: 'bks', TOKEN: 'tk', BORDE: { bks: 'http://bordo' }, llamadas,
    fetch: async (u, o) => { llamadas.push({ u, o }); return { ok: true, json: async () => ({ ok: true, scritto: true }) }; },
    esRespuestaPin: async () => false, colaEncolar: () => {}, encodeURIComponent, Object, JSON };
  vm.createContext(ctx); vm.runInContext(fn('postCaja', true) + '\n;this.postCaja = postCaja;', ctx);
  await ctx.postCaja(body); return llamadas[0];
}
{ const a = await corre(false, { verbo: 'conteo', uid_gesto: 'u' }); const b = JSON.parse(a.o.body);
  t('sin prova: el POST NO lleva dia_prueba', b.dia_prueba === undefined && b.pin_caja === '2222' && b.verbo === 'conteo', b);
  t('el PIN viaja en el cuerpo, no en la URL', !/2222/.test(a.u)); }
{ const a = await corre(true, { verbo: 'conteo', uid_gesto: 'u' }); const b = JSON.parse(a.o.body);
  t('con prova: el POST lleva dia_prueba = 2099-12-31', b.dia_prueba === '2099-12-31' && b.verbo === 'conteo', b); }

// ── plantarBustaPrueba
async function planta(nro, monto) {
  const posts = [], toasts = [];
  const els = { psNro: { value: nro }, psMonto: { value: monto } };
  const ctx = { document: { getElementById: (id) => els[id] }, toast: (m, k) => toasts.push([m, k]), pantalla6: () => { toasts.push(['pantalla6']); },
    postCaja: async (b) => { posts.push(b); return { ok: true }; }, Date, parseInt };
  vm.createContext(ctx); vm.runInContext(fn('plantarBustaPrueba', true) + '\n;this.f = plantarBustaPrueba;', ctx);
  await ctx.f(); return { posts, toasts };
}
{ const o = await planta('9001', '43000');
  t('planta: verbo prueba_sobre con número y monto', o.posts.length === 1 && o.posts[0].verbo === 'prueba_sobre' && o.posts[0].sobre_nro === '9001' && o.posts[0].suma_ritiri === 43000, o.posts);
  t('planta: uid_gesto único por busta', /^ps-9001-/.test(o.posts[0].uid_gesto));
  t('planta: recarga la pantalla', o.toasts.some((x) => x[0] === 'pantalla6')); }
{ const o = await planta('', '100'); t('planta: sin número no manda nada', o.posts.length === 0, o); }
{ const o = await planta('9002', ''); t('planta: sin monto no manda nada', o.posts.length === 0, o); }
{ const o = await planta('9003', '0'); t('planta: un monto 0 es una declaración válida', o.posts.length === 1 && o.posts[0].suma_ritiri === 0, o); }

// ── cableado visible
t('el banner MODO PRUEBA está en la barra de todas las pantallas', /function barra\(titulo\) \{\n\s+return \(PROVA \? '<div class="note bad"[^']*<b>🧪 MODO PRUEBA<\/b>/.test(SRC));
t('el formulario de la busta de prueba solo aparece en modo prueba', /\(PROVA \? '<div class="note"><b>Preparar una busta de prueba<\/b>/.test(SRC) && /if \(PROVA\) document\.getElementById\('psPlantar'\)/.test(SRC));
t('no hay ninguna lectura/escritura que ignore los días (todas usan DIA_HOY/DIA_NOCHE)', !/getCaja\('[a-z_]+\?dia=20\d\d/.test(SRC));
console.log(ko === 0 ? `✅ ${ok}/${ok + ko} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko === 0 ? 0 : 1);
