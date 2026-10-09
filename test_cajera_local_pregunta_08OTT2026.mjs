// BANCO · la caja NO elige un local en silencio (BKP «BKP MAYRA LOC RIPIEGO RSC» + V28 «MAYRA LOC BKS LINK DATO») · TERZA PENNA · 08-ott-2026
// Corre arrancar() y preguntarLocal() VERDADERAS con un DOM de mentira. Criterio: sin ?loc= y sin un local de sesion CON caja, pregunta; nunca cae en rsc.
import fs from 'node:fs'; import vm from 'node:vm';
const SRC = fs.readFileSync(new URL('./caja_cajera.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : (ko++, console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 260))); };
const fn = (nome, asinc) => { const i = SRC.indexOf((asinc ? 'async function ' : 'function ') + nome + '('); if (i < 0) throw new Error(nome); const j = SRC.indexOf('\n}\n', i) + 3; return SRC.slice(i, j); };
const lc = SRC.match(/var LOCALES_CAJA = \{[^}]*\};/)[0];

function mundo(sesLocal, locInicial) {
  const botones = {}; const log = [];
  const ctx = { LOCAL: locInicial || '', SES: null, log, app: { innerHTML: '', querySelector: (q) => { const id = /data-loc="([^"]+)"/.exec(q)[1]; return botones[id] || (botones[id] = {}); } },
    barra: () => '[bar]', esc: String, Object, String, Promise, flushCola: () => log.push('flush'), pantalla6: () => log.push('p6'),
    pedirPinCaja: async () => { log.push('pin:' + ctx.LOCAL); },
    PinsitaAuth: { sesion: () => ({ user: 'Mayra', role: 'CAJA', local: sesLocal }) } };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(lc + '\n' + fn('preguntarLocal') + '\n' + fn('arrancar', true) + '\n;this.API = { arrancar, preguntarLocal };', ctx);
  return { ctx, botones, log };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

// ① el local de sesion '*' o vacio: NO ripiega — pregunta, y solo ofrece locales con caja
for (const loc of ['*', '', undefined, 'rsc']) {
  const m = mundo(loc); const p = m.ctx.API.arrancar(); await tick();
  t('sesion local=' + JSON.stringify(loc) + ': pregunta (y todavia no pidio el PIN)', /En qué local estás/.test(m.ctx.app.innerHTML) && !m.log.some((x) => x.startsWith('pin:')), m.log);
  t('… ofrece Backstage y NO ofrece rsc ni cdl', /data-loc="bks"/.test(m.ctx.app.innerHTML) && !/data-loc="rsc"/.test(m.ctx.app.innerHTML) && !/data-loc="cdl"/.test(m.ctx.app.innerHTML));
  m.botones.bks.onclick(); await p;
  t('al elegir, LOCAL = bks y recien ahi pide el PIN', m.ctx.LOCAL === 'bks' && m.log.includes('pin:bks') && m.log.includes('p6'), m.log);
}
// ② el usuario YA es de un local con caja: no pregunta
{ const m = mundo('BKS'); await m.ctx.API.arrancar();
  t('sesion BKS (mayusculas): LOCAL = bks, sin preguntar', m.ctx.LOCAL === 'bks' && !/En qué local/.test(m.ctx.app.innerHTML) && m.log.includes('pin:bks'), m.log); }
// ③ ?loc= explicito manda siempre (el link que dio V28)
{ const m = mundo('*', 'bks'); await m.ctx.API.arrancar();
  t('?loc=bks: no pregunta', m.ctx.LOCAL === 'bks' && !/En qué local/.test(m.ctx.app.innerHTML)); }
// ④ guardia de fuente: ya no existe el ripiego a rsc, ni en arrancar ni en postCaja/getCaja; bks tiene su URL
t('no queda `BORDE.rsc` como ripiego', !/BORDE\.rsc/.test(SRC));
t('no queda `: \'rsc\'` como ripiego de LOCAL', !/:\s*'rsc'\s*;/.test(fn('arrancar', true)));
t('BORDE tiene bks', /BORDE = \{[\s\S]*?bks:\s*'https:/.test(SRC));
t('il login NON e filtrato su local "*" (con "*" la lista era la sola corporate e Mayra non c era): init con "todos"', /PinsitaAuth\.init\(\{ local: 'todos'/.test(SRC) && !/PinsitaAuth\.init\(\{ local: '\*'/.test(SRC));
console.log(ko === 0 ? `✅ ${ok}/${ok} verdes` : `❌ ${ko} rojos de ${ok + ko}`); process.exit(ko ? 1 : 0);
