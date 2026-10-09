// BANCO · AUT-EMERG · con todos los sobres contados la caja NO vuelve al primero (`EMERG CAJERA TUTTE CONTATE RIPARTE DA CAPO`) · 🎛 BKP V29 · 08-ott-2026
// Corre la pantalla6() VERDADERA con un DOM de mentira. Uso: node test_cajera_tutte_contate_08OTT2026.mjs  (junto a caja_cajera.html)
import fs from 'node:fs'; import vm from 'node:vm';
const SRC = fs.readFileSync(new URL('./caja_cajera.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0; const t = (n, c, i) => { c ? (ok++, console.log('✓', n)) : (ko++, console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 220))); };
const i = SRC.indexOf('async function pantalla6() {'); const j = SRC.indexOf('\n}\n', i) + 3; const fn = SRC.slice(i, j);
async function corre(sobres) {
  const btn = { onclick: null }; const app = { innerHTML: '' }; const llamadas = [];
  const ctx = { app, MANANA: null, PROVA: false, DIA_NOCHE: '2026-10-07', DIA_HOY: '2026-10-08', MULTI: false, NOCHES: [], SOBRE_IDX: null, PASO: null,
    barra: () => '', fechaCorta: (d) => d, esc: (s) => String(s), renderError: () => llamadas.push('error'),
    getCaja: async () => ({ ok: true, sobres: sobres }),
    pantalla7: () => llamadas.push('p7'), pantalla8: () => llamadas.push('p8'),
    document: { getElementById: () => btn } };
  vm.createContext(ctx); vm.runInContext(fn + '\n;globalThis.__p6 = pantalla6;', ctx);
  await ctx.__p6(); const html = app.innerHTML;
  if (btn.onclick) btn.onclick();
  return { html, llamadas, idx: ctx.SOBRE_IDX, paso: ctx.PASO };
}
{ const r = await corre([{ sobre_nro: '1002', conteo: { x: 1 } }, { sobre_nro: '1003', conteo: { x: 1 } }]);
  t('todos contados: el título dice «ya contaste los 2 sobres»', /ya contaste los 2 sobres/.test(r.html), r.html.slice(0, 200));
  t('…y el botón dice «Seguir»', />Seguir</.test(r.html));
  t('…y tocarlo va a los cortes (paso 3), no al primer sobre', r.llamadas.join() === 'p8' && r.paso === 3, r); }
{ const r = await corre([{ sobre_nro: '1002', conteo: { x: 1 } }, { sobre_nro: '1003' }]);
  t('falta uno: «1 · sobre que tienes que contar»', /<p class="big acc">1<\/p><p class="blab">sobre que tienes que contar/.test(r.html), r.html.slice(0, 200));
  t('…y se abre ESE (el 1003, índice 1)', r.llamadas.join() === 'p7' && r.idx === 1 && r.paso === 2, r); }
{ const r = await corre([{ sobre_nro: '1002' }, { sobre_nro: '1003' }]);
  t('ninguno contado: «2 · sobres que tienes que contar», se abre el primero', /<p class="big acc">2<\/p><p class="blab">sobres que tienes que contar/.test(r.html) && r.idx === 0 && r.llamadas.join() === 'p7', r); }
{ const r = await corre([]);
  t('sin sobres: «Nada que contar», como antes', /Nada que contar/.test(r.html), r.html.slice(0, 120)); }
console.log((ko ? '❌ ' : '✅ ') + ok + '/' + (ok + ko) + ' verdes'); process.exit(ko ? 1 : 0);
