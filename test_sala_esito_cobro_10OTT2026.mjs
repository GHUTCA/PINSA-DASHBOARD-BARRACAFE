// BANCO · l'ESITO DEL COBRO LASCIA UNA TRACCIA CHE RESTA (V28 «lezione per la riprova», prova A mesa 200) · TERZA PENNA · 10-ott-2026
// Criteri: ① ogni cobro scrive l'esito in localStorage (ultimi 30) e come fatto al bordo ② per il JL un esito NON ok accende una BARRA che resta (non un toast)
//          ③ un esito ok non accende nessuna barra; un mesero normale non la vede ④ i sei punti di uscita di pagoConfirmar dichiarano il loro esito
//          ⑤ in JL il rimbalzo di showEntrada scrive `jl_rimbalzo` col PERCHE' (poi lo legge l'app_jl) ⑥ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'sala.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 300))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); return SRC.slice(i, SRC.indexOf('\n}\n', i) + 3); };

function mondo(SRC, JL) {
  const ls = new Map(), ss = new Map(), hechos = [], dom = { el: null, quitado: false }, redirects = [];
  const ctx = { JL, JSON, Math, Number, String, Date, Object, Array,
    localStorage: { getItem: (k) => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, v) },
    sessionStorage: { getItem: (k) => (ss.has(k) ? ss.get(k) : null), setItem: (k, v) => ss.set(k, v), removeItem: (k) => ss.delete(k) },
    bordeHecho: (g, d) => hechos.push([g, d]),
    document: { getElementById: () => dom.el, createElement: () => ({ style: {}, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, remove() { dom.quitado = true; dom.el = null; }, onclick: null }), body: { appendChild: (e) => { dom.el = e; } } },
    location: { replace: (u) => redirects.push(u) }, _jlBackUrl: () => 'app_jl.html?loc=bks' };
  vm.createContext(ctx);
  vm.runInContext(fnDe(SRC, '_pagoEsito') + fnDe(SRC, '_pagoFallaBanner') + fnDe(SRC, 'showEntrada') + '\nthis.E = _pagoEsito; this.S = showEntrada;', ctx);
  return { ctx, ls, ss, hechos, dom, redirects };
}
function banco(SRC) {
  const k0 = ko; const pg = { mesa: '200', medio: 'efectivo', tot: 2190 };
  { const m = mondo(SRC, { user: 'Eduardo' }); m.ctx.E(pg, 'rifiutato', 'no_asignado');
    const l = JSON.parse(m.ls.get('pinsita_pago_esito') || '[]');
    t('① l esito resta in localStorage: mesa, medio, monto, esito, motivo, jl', l.length === 1 && l[0].mesa === '200' && l[0].esito === 'rifiutato' && l[0].motivo === 'no_asignado' && l[0].monto === 2190 && l[0].jl === 1, l);
    t('① bis e un fatto al bordo (pago_esito) con mesa/esito/motivo', m.hechos.length === 1 && m.hechos[0][0] === 'pago_esito' && m.hechos[0][1].esito === 'rifiutato' && m.hechos[0][1].motivo === 'no_asignado', m.hechos);
    t('② il JL con un esito NON ok vede una BARRA che resta, col motivo', m.dom.el && /NO se registró/.test(m.dom.el.textContent) && /no_asignado/.test(m.dom.el.textContent) && /mesa 200/.test(m.dom.el.textContent) && !m.dom.quitado, m.dom.el && m.dom.el.textContent);
    if (m.dom.el && m.dom.el.onclick) m.dom.el.onclick(); t('② bis la barra si chiude solo al tocco', m.dom.quitado === true); }
  { const m = mondo(SRC, { user: 'Eduardo' }); m.ctx.E(pg, 'ok', 'bordo');
    t('③ un esito ok NON accende nessuna barra (ma lascia la traccia)', m.dom.el === null && JSON.parse(m.ls.get('pinsita_pago_esito')).length === 1 && m.hechos.length === 1, [m.dom.el]); }
  { const m = mondo(SRC, null); m.ctx.E(pg, 'rifiutato', 'x');
    t('③ bis un mesero normale: traccia e fatto si', JSON.parse(m.ls.get('pinsita_pago_esito')).length === 1 && m.hechos.length === 1);
    t('③ ter … ma NESSUNA barra (per lui resta il toast di sempre)', m.dom.el === null); }
  { const m = mondo(SRC, null); for (let i = 0; i < 40; i++) m.ctx.E({ mesa: String(i), medio: 'efectivo', tot: 1 }, 'ok', 'gas');
    const l = JSON.parse(m.ls.get('pinsita_pago_esito'));
    t('① ter il registro tiene solo gli ultimi 30 (un registro senza tetto e un accumulo)', l.length === 30 && l[0].mesa === '10' && l[29].mesa === '39', [l.length, l[0] && l[0].mesa]); }
  { const m = mondo(SRC, { user: 'Eduardo' }); m.ctx.S('No estás en el turno — pide al JL que te asigne.');
    const r = JSON.parse(m.ss.get('jl_rimbalzo') || 'null');
    t('⑤ in JL il rimbalzo lascia scritto PERCHE\' (jl_rimbalzo) e poi rimanda all app_jl', r && /No estás en el turno/.test(r.msg) && r.ts > 0 && m.redirects.length === 1 && /app_jl/.test(m.redirects[0]), [r, m.redirects]); }
  { const m = mondo(SRC, { user: 'Eduardo' }); m.ctx.S();
    t('⑤ bis senza messaggio: un motivo di ripiego, mai vuoto', JSON.parse(m.ss.get('jl_rimbalzo') || '{"msg":""}').msg.length > 5); }
  // ④ i punti di uscita
  const a = SRC.indexOf('async function pagoConfirmar(btn) {'), b = SRC.indexOf('\n}\n', a); const fn = SRC.slice(a, b);
  const qua = (re) => (fn.match(re) || []).length;
  t('④ pagoConfirmar dichiara l esito su: anomalia · ok bordo · ok gas · ok duplicato · rifiutato · sin_respuesta', qua(/_pagoEsito\(pg, 'anomalia'/g) === 1 && qua(/_pagoEsito\(pg, 'ok', 'bordo'\)/g) === 1 && qua(/_pagoEsito\(pg, 'ok', r\.mesa_abierta/g) === 1 && qua(/_pagoEsito\(pg, 'ok', 'duplicado'\)/g) === 1 && qua(/_pagoEsito\(pg, 'rifiutato'/g) === 1 && qua(/_pagoEsito\(pg, 'sin_respuesta'/g) === 1, qua(/_pagoEsito\(/g));
  t('④ bis l esito del rifiuto sta PRIMA della catena degli errori (non in un ramo solo)', fn.indexOf("_pagoEsito(pg, 'rifiutato'") > 0 && fn.indexOf("_pagoEsito(pg, 'rifiutato'") < fn.indexOf('const errPin'));
  return ko - k0;
}
banco(SRC0);
const mut = (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; banco(SRC0.replace(da, () => a)); muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('⑥ mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
mut('la barra compare anche con esito ok', "if (esito !== 'ok' && JL) {", "if (JL) {");
mut('la barra compare anche per i meseros', "if (esito !== 'ok' && JL) {", "if (esito !== 'ok') {");
mut('la barra non compare mai', "if (esito !== 'ok' && JL) {", "if (false) {");
mut('il registro senza tetto', "l.slice(-30)", "l");
mut('il fatto al bordo sparisce', "try { bordeHecho('pago_esito',", "try { void ('pago_esito',");
mut('il rifiuto non dichiara l esito', "_pagoEsito(pg, 'rifiutato', (r && (r.error || r.motivo)) || '?');", "");
mut('il successo del bordo non dichiara l esito', "_pagoEsito(pg, 'ok', 'bordo');", "");
mut('il rimbalzo torna muto', "sessionStorage.setItem('jl_rimbalzo',", "void (");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
