// BANCO · IL DEPOSITO DEL MARTEDI SCOMPOSTO PER GIORNO (Alberto/V28, 10-ott «CAJA MARTEDI GIORNO PER GIORNO») · TERZA PENNA
// Criteri: ① la pura: una riga per notte (sobres · contado · il 5% di QUELLA notte · neto), ordinate, il contado di una busta senza conteo e il suo declarado come nel totale ② le righe SOMMANO al totale del deposito
//          (con l'«Ajuste manual» se la cajera edita il contado) ③ la schermata vera (pantalla9 con le letture finte): il totale resta UNO, sotto compare «Por día» con le notti ④ una notte sola o senza MULTI: niente tabella
//          ⑤ una notte con la riserva e senza buste non sparisce ⑥ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'caja_cajera.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 360))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); const a = SRC.slice(Math.max(0, i - 6), i) === 'async ' ? i - 6 : i;
  const eol = SRC.indexOf('\n', i), r1 = SRC.slice(i, eol);
  if (/\}\s*$/.test(r1) && (r1.match(/\{/g) || []).length === (r1.match(/\}/g) || []).length) return SRC.slice(a, eol + 1);
  return SRC.slice(a, SRC.indexOf('\n}\n', i) + 3); };

function mondo(SRC, o) {
  const els = {}, handlers = {}, app = { innerHTML: '' };
  const mk = (id) => (els[id] || (els[id] = { id, get value() { if (this._v !== undefined) return this._v; const q = app.innerHTML.match(/id="contado"[^>]*value="(\d+)"/); return q ? q[1] : ''; }, set value(x) { this._v = x; }, innerHTML: '', disabled: false, onclick: null, addEventListener(ev, fn) { (handlers[id] = handlers[id] || {})[ev] = fn; } }));
  const ctx = { JSON, Math, Date, String, Number, Object, Array, Promise, console, app, MULTI: o.multi !== false, NOCHES: o.noches, MANANA: { sobres: o.sobres, noEnc: [], dejadas: [] }, DEPOSITO_PENDIENTE: null, PASO: 4, DIA_HOY: '2026-10-13', DIA_NOCHE: '2026-10-12', UIDS_GESTO: {}, _u: 0,
    barra: () => '', esc: (x) => String(x == null ? '' : x), fmt: (n) => '$' + n, fechaCorta: (d) => d, toast() {}, renderError() {}, pantalla6() {}, pantallaReservaSobre() {}, uidGesto: (p) => p + '-' + (++ctx._u), unTocoUnHecho: (b, fn) => { b.onclick = fn; }, postCaja: async () => ({ ok: true }), SES: { user: 'Mayra' },
    getCaja: async (p) => { if (/^deposito_pendiente/.test(p)) return { ok: true, salida_pendiente: null }; const m = p.match(/^reserva\?dia=(.+)$/); if (m) return { ok: true, reserva: (o.reservas || {})[m[1]], reserva_pct: 5 }; return { ok: false }; },
    document: { getElementById: mk, querySelector: mk } };
  vm.createContext(ctx);
  vm.runInContext(['desgloseDeposito', 'desgloseHtml', 'pantalla9', 'uidGestoEstable'].map((n) => fnDe(SRC, n)).join('\n') + '\nthis.F = { desgloseDeposito, desgloseHtml, pantalla9 };', ctx);
  return { ctx, els, handlers, app, mk };
}
const S = (dia, nro, contado, declarado) => ({ sobre_nro: nro, dia, declarado: declarado || 0, conteo: contado == null ? null : { contado } });

async function banco(SRC) {
  const F0 = mondo(SRC, { noches: [], sobres: [] }).ctx.F;
  { const d = F0.desgloseDeposito([S('2026-10-09', '1005', 982000), S('2026-10-10', '1006', 150000), S('2026-10-11', '1007', 0), S('2026-10-10', '1008', 30000)], { '2026-10-09': 49100, '2026-10-10': 9000, '2026-10-11': 0, '2026-10-12': 2500 }, ['2026-10-12', '2026-10-10', '2026-10-09', '2026-10-11'], 1162000);
    t('① una fila por noche, ORDENADAS (09 · 10 · 11 · 12) aunque lleguen desordenadas', d.filas.map((x) => x.dia).join() === '2026-10-09,2026-10-10,2026-10-11,2026-10-12', d.filas.map((x) => x.dia));
    t('① bis el 10 tiene 2 sobres (150.000 + 30.000), el 5% de ESA noche (9.000) y su neto (171.000)', d.filas[1].n === 2 && d.filas[1].contado === 180000 && d.filas[1].reserva === 9000 && d.filas[1].neto === 171000, d.filas[1]);
    t('① ter el 11 contado en 0 es un 0 (no desaparece); el 12 sin sobres pero con reserva sigue ahi (neto negativo)', d.filas[2].n === 1 && d.filas[2].contado === 0 && d.filas[3].n === 0 && d.filas[3].contado === 0 && d.filas[3].reserva === 2500 && d.filas[3].neto === -2500, [d.filas[2], d.filas[3]]);
    t('② las filas suman el contado del total (1.162.000) y el ajuste es 0', d.filas.reduce((a, x) => a + x.contado, 0) === 1162000 && d.ajuste === 0, d);
    t('② bis neto Σ = contado Σ − reserva Σ (la tabla es coherente con «Vas a depositar»)', d.filas.reduce((a, x) => a + x.neto, 0) === 1162000 - (49100 + 9000 + 0 + 2500)); }
  { const d = F0.desgloseDeposito([S('2026-10-09', '1005', 982000)], {}, ['2026-10-09', '2026-10-10'], 1000000);
    t('② ter el contado EDITADO a mano: el ajuste sale (+18.000) y las filas siguen siendo las contadas', d.ajuste === 18000 && d.filas[0].contado === 982000, d); }
  { const d = F0.desgloseDeposito([S('2026-10-09', '1005', null, 40000)], {}, ['2026-10-09', '2026-10-10'], 40000);
    t('① quater un sobre SIN conteo usa su declarado (igual que el total de la pantalla)', d.filas[0].contado === 40000 && d.ajuste === 0, d); }
  t('① quinto sin datos (null): no revienta', F0.desgloseDeposito(null, null, null, 0).filas.length === 0);
  // ③ la pantalla
  { const sobres = [S('2026-10-09', '1005', 982000), S('2026-10-10', '1006', 150000), S('2026-10-11', '1007', 0)];
    const m = mondo(SRC, { noches: ['2026-10-09', '2026-10-10', '2026-10-11'], sobres, reservas: { '2026-10-09': 49100, '2026-10-10': 7500, '2026-10-11': 0 } });
    await m.ctx.F.pantalla9();
    const c = m.mk('calc').innerHTML;
    t('③ el total sigue siendo UNO: «Vas a depositar» $1.132.000 − 56.600 = 1.075.400', /Vas a depositar<\/span><span class="v">\$1075400</.test(c), c.slice(0, 300));
    t('③ bis y DEBAJO «Por día» con las tres noches, cada una con su sobre, contado y reserva', /Por día/.test(c) && /2026-10-09<small>1 sobre · contado \$982000 − reserva \$49100<\/small><\/span><span class="v">\$932900/.test(c) && /2026-10-10<small>1 sobre · contado \$150000 − reserva \$7500<\/small><\/span><span class="v">\$142500/.test(c) && /2026-10-11<small>1 sobre · contado \$0 − reserva \$0<\/small><\/span><span class="v">\$0/.test(c), c);
    t('③ ter el banco recibe un solo deposito: la leyenda lo dice', /el banco recibe un solo depósito/.test(c));
    m.mk('contado').value = '1100000'; m.handlers['contado'].input();
    t('③ quater editar el contado: el total se mueve, el ajuste aparece y las filas no cambian', /Ajuste manual del contado<\/span><span class="v">−\$32000/.test(m.mk('calc').innerHTML) && /\$932900/.test(m.mk('calc').innerHTML), m.mk('calc').innerHTML); }
  // ④ una noche / sin MULTI
  { const m = mondo(SRC, { noches: ['2026-10-09'], sobres: [S('2026-10-09', '1005', 982000)], reservas: { '2026-10-09': 49100 } }); await m.ctx.F.pantalla9();
    t('④ UNA sola noche: nada de tabla por dia (no hay nada que scomponer)', !/Por día/.test(m.mk('calc').innerHTML)); }
  { const m = mondo(SRC, { multi: false, noches: [], sobres: [S(undefined, '1005', 982000)], reservas: { '2026-10-12': 49100 } }); await m.ctx.F.pantalla9();
    t('④ bis sin MULTI (ayer): la pantalla de siempre', !/Por día/.test(m.mk('calc').innerHTML) && /Vas a depositar/.test(m.mk('calc').innerHTML)); }
  // ⑤ una noche con reserva y sin sobres
  { const m = mondo(SRC, { noches: ['2026-10-09', '2026-10-12'], sobres: [S('2026-10-09', '1005', 982000)], reservas: { '2026-10-09': 49100, '2026-10-12': 2500 } }); await m.ctx.F.pantalla9();
    t('⑤ la noche del 12 sin sobres pero con 5% aparece (0 sobres · −2.500) y suma al total', /2026-10-12<small>0 sobres · contado \$0 − reserva \$2500/.test(m.mk('calc').innerHTML) && /Vas a depositar<\/span><span class="v">\$930400/.test(m.mk('calc').innerHTML), m.mk('calc').innerHTML); }
  { const F = mondo(SRC, { noches: [], sobres: [] }).ctx.F;
    t('④ ter la pura HTML: una sola fila => vacio; dos => tabla', F.desgloseHtml({ filas: [{ dia: 'a', n: 1, contado: 1, reserva: 0, neto: 1 }], ajuste: 0 }) === '' && /Por día/.test(F.desgloseHtml({ filas: [{ dia: 'a', n: 1, contado: 1, reserva: 0, neto: 1 }, { dia: 'b', n: 1, contado: 1, reserva: 0, neto: 1 }], ajuste: 0 }))); }
  t('⑥ version >= 1.8.0', /caja 1\.[8-9]\.\d<\/small>/.test(SRC));
}
await banco(SRC0);
const mut = async (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; try { await banco(SRC0.replace(da, () => a)); } catch (e) { ko++; } muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('⑥ mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
await mut('no ordena las noches', "var dias = (noches || []).slice().sort();", "var dias = (noches || []).slice();");
await mut('la reserva de TODAS las noches en cada fila', "var reserva = (porNoche && porNoche[d]) || 0;", "var reserva = 56600;");
await mut('sobres de todas las noches', "return (x.dia || '') === d; });", "return true; });");
await mut('el declarado se ignora', "(x.conteo ? (x.conteo.contado || 0) : (x.declarado || 0))", "(x.conteo ? (x.conteo.contado || 0) : 0)");
await mut('el ajuste no se calcula', "ajuste: (Number(contadoTotal) || 0) - sumaContado", "ajuste: 0");
await mut('tabla con una sola noche', "if (!d || !d.filas || d.filas.length < 2) return '';", "if (!d || !d.filas) return '';");
await mut('la retencion no se guarda por noche', "(RESERVA.porNoche = RESERVA.porNoche || {})[NOCHES[iN]] = rN.reserva;", "");
await mut('la tabla fuera del recalc', "(MULTI && NOCHES.length > 1 ? desgloseHtml(desgloseDeposito(MANANA.sobres, RESERVA.porNoche, NOCHES, c)) : '')", "''");
await mut('la leyenda del deposito unico', "(el banco recibe un solo depósito)", "");
await mut('el ajuste sin signo', "(d.ajuste > 0 ? '+' : '−')", "''");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
