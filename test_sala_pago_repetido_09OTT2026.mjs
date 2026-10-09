// BANCO · la guardia del PAGO REPETIDO — el lado del vetro · TERZA PENNA · 09-ott-2026 (mesa 55; BKP `BKP PAGO REPETIDO SCRITTA E9E3BED`)
// Corre las funciones VERDADERAS de sala.html (_pagoAlBorde, _repetidoAsk, _repetidoManeja) con un DOM y un bordo de mentira.
// Criterios: «pago_repetido» es una respuesta FINAL del bordo (NO cae al GAS, que registraria el doble) · el aviso dice hace cuanto y cuanto ·
// «No, era el mismo» no reenvia nada · «Sí, es otro» reenvia el MISMO payload con confirmo_repetido:1 y un uid NUEVO · el boton se apaga al primer toque.
import fs from 'node:fs'; import vm from 'node:vm';
const SRC = fs.readFileSync(new URL('./sala.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : (ko++, console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 280))); };
const fn = (nome, asinc) => { const i = SRC.indexOf((asinc ? 'async function ' : 'function ') + nome + '('); if (i < 0) throw new Error(nome); return SRC.slice(i, SRC.indexOf('\n}\n', i) + 3); };

function mundo(respuestaBordo, decision) {
  const pasados = []; const fetches = []; const botones = {}; let ultimoHtml = '';
  const mkBtn = (cls) => (botones[cls] = { disabled: false, textContent: '', onclick: null, cls });
  const ctx = { bordeWriteOn: () => true, DTO_BORDE_ON: false, DTO_PORTAS_BORDE: [], BORDE_PAGO: { QS: '1', PORTAS: ['pin_jl', 'cortesia', 'fam'], MS: 1000, pausaHasta: 0, RETE_MS: 1, APAGADO_MS: 1 },
    BORDE_SALA: { URL: 'http://b', T: 't' }, CFG: { LOCAL: 'BKS' }, _pennaDice: (x) => pasados.push(x), _vediNoAsignado: (x) => x, esc: String, _fmtMiles: (n) => Number(n).toLocaleString('es-CL'),
    AbortController, setTimeout, clearTimeout, Date, JSON, Math, Object, String, Number, Promise, encodeURIComponent,
    fetch: async (u, op) => { fetches.push(JSON.parse(op.body)); return { json: async () => respuestaBordo(JSON.parse(op.body)) }; },
    document: { createElement: () => ({ className: '', set innerHTML(h) { ultimoHtml = h; }, get innerHTML() { return ultimoHtml; }, remove() { this._fuera = true; },
        querySelector: (sel) => mkBtn(sel.replace('.', '')), onclick: null }),
      body: { appendChild: (o) => { setTimeout(() => { if (decision === 'si') botones['cmAsk-si'].onclick(); else if (decision === 'no') botones['cmAsk-no'].onclick(); else if (decision === 'fuera') o.onclick({ target: o }); }, 0); } } } };
  vm.createContext(ctx);
  vm.runInContext(['_pagoAlBorde', '_repetidoAsk', '_repetidoManeja'].map((n) => fn(n, n !== '_repetidoAsk')).join('\n') + '\n;this.API = { _pagoAlBorde, _repetidoAsk, _repetidoManeja };', ctx);
  return { ctx, pasados, fetches, botones, html: () => ultimoHtml };
}
const REP = { ok: false, error: 'pago_repetido', motivo: 'mismo_pago_reciente', previo: { uid: 'PU-a', ts: 1, monto: 146380, hace_s: 13 } };   // SIN borde:true ni definitivo (como lo manda el bordo de BKP)
const body0 = () => ({ pago_uid: 'PU-primero', mesa: '55', medio: 'debito', propina: 14638 });

// ① «pago_repetido» es FINAL: _pagoAlBorde la devuelve, no la cambia por null (= ir al GAS)
{ const m = mundo(() => REP); const r = await m.ctx.API._pagoAlBorde(body0(), 146380);
  t('«pago_repetido» sin timbro borde/definitivo: se DEVUELVE (no null: el GAS registraria el doble)', r && r.error === 'pago_repetido' && r.previo.hace_s === 13, r); }
{ const m = mundo(() => ({ ok: false, error: 'otro_error_raro' })); const r = await m.ctx.API._pagoAlBorde(body0(), 146380);
  t('control: un error cualquiera SIN timbro sigue cayendo al GAS (null), como ayer', r === null, r); }
{ const m = mundo(() => ({ ok: true, borde: true, monto: 5 })); const r = await m.ctx.API._pagoAlBorde(body0(), 146380);
  t('control: un pago normal aceptado por el bordo pasa como siempre', r && r.ok === true, r); }

// ② el aviso
{ const m = mundo(() => REP, 'no'); const p = m.ctx.API._repetidoAsk(REP.previo); const r = await p; const h = m.html();
  t('el aviso dice hace cuanto y cuanto, y pregunta si es OTRO pago', /hace 13 s/.test(h) && /146\.380/.test(h) && /¿Es OTRO pago\?/.test(h), h);
  t('«No, era el mismo» => false (la opcion segura)', r === false); }
{ const m = mundo(() => REP, 'si'); const r = await m.ctx.API._repetidoAsk(REP.previo); t('«Sí, es otro pago» => true', r === true); }
{ const m = mundo(() => REP, 'fuera'); const r = await m.ctx.API._repetidoAsk(REP.previo); t('tocar FUERA del cuadro = no es otro pago (la opcion segura: no cobra de nuevo)', r === false); }
{ const m = mundo(() => REP, 'no'); const p = m.ctx.API._repetidoAsk({ hace_s: 125, monto: 5000 }); await p; t('mas de un minuto se dice en minutos', /hace 2 min/.test(m.html()), m.html()); }

// ③ el manejo
{ const m = mundo(() => ({ ok: true, borde: true, monto: 146380 }), 'no'); const b = body0(), pg = { uid: 'PU-primero', tot: 146380 };
  const x = await m.ctx.API._repetidoManeja(REP, b, pg);
  t('«era el mismo»: fin:true, NO se reenvia nada, el payload no cambia', x.fin === true && m.fetches.length === 0 && b.pago_uid === 'PU-primero' && b.confirmo_repetido === undefined, [x, m.fetches, b]); }
{ const m = mundo(() => ({ ok: true, borde: true, monto: 146380 }), 'si'); const b = body0(), pg = { uid: 'PU-primero', tot: 146380 };
  const x = await m.ctx.API._repetidoManeja(REP, b, pg);
  t('«es otro»: se reenvia UNA vez, el MISMO payload (mesa, medio, propina) con confirmo_repetido:1 y un uid NUEVO', m.fetches.length === 1 && m.fetches[0].confirmo_repetido === 1 && m.fetches[0].mesa === '55' && m.fetches[0].medio === 'debito' && m.fetches[0].propina === 14638 && m.fetches[0].pago_uid !== 'PU-primero' && /^PU-/.test(m.fetches[0].pago_uid), m.fetches);
  t('… el uid del panel (pg.uid) tambien es el nuevo, y la respuesta es la del bordo', pg.uid === m.fetches[0].pago_uid && x.rB && x.rB.ok === true, [pg, x]); }

// ④ guardas de fuente
const pc = SRC.slice(SRC.indexOf('async function pagoConfirmar('), SRC.indexOf('\n}\n', SRC.indexOf('async function pagoConfirmar(')) + 3);
t('el boton se apaga al PRIMER toque (btn.disabled = true junto a pg.enviando)', /pg\.enviando = true; if \(btn\) btn\.disabled = true;/.test(pc));
t('pagoConfirmar maneja «pago_repetido» una sola vez (no si ya llevaba confirmo_repetido)', /error === 'pago_repetido' && !body\.confirmo_repetido/.test(pc) && /_repetidoManeja\(rB, body, pg\)/.test(pc));
t('«era el mismo» cierra la mesa como «ya estaba pagada» y NO sigue al GAS', /x\.fin/.test(pc) && /no se cobró de nuevo/.test(pc));
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
