// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · il motivo del JL nel vetro della cajera (caja 1.11.0, 29-ott)
// Reperto: 🎛 V33 `CONTROLLER V33 · su TERZA V32 · su PROGRAMMA SOBRE MOTIVO JL` — sì: il motivo DOPO il conteo della cajera, mai prima (il conteo è cieco).
// Il dato: bordo 7c7b91e, `pendientes[].motivo_jl` = {texto, firma_jl, ts} | null. Leva: /salud → flags.sobre_motivo_on · ?motivojl=1/0.
// Gira pantalla6, pantalla7 e le funzioni motivoJl* VERE di caja_cajera.html in vm (impianto di test_caja_no_encontrada). node test_caja_motivo_jl_29OCT2026.mjs · --mutanti
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const ORIG = fs.readFileSync(path.join(AQUI, 'caja_cajera.html'), 'utf8').replace(/\r\n/g, '\n');
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); const a = SRC.slice(Math.max(0, i - 6), i) === 'async ' ? i - 6 : i;
  const eol = SRC.indexOf('\n', i), r1 = SRC.slice(i, eol);
  if (/\}\s*$/.test(r1) && (r1.match(/\{/g) || []).length === (r1.match(/\}/g) || []).length) return SRC.slice(a, eol + 1);
  return SRC.slice(a, SRC.indexOf('\n}\n', i) + 3); };
const tick = () => new Promise((r) => setTimeout(r, 5));
function mondo(SRC, o) {
  o = o || {}; const els = {}, app = { innerHTML: '' }, calls = [];
  const el = (id) => els[id] || (els[id] = { id, value: '', dataset: {}, style: {}, disabled: false, innerHTML: '', onclick: null, listeners: {}, addEventListener(ev, fn) { this.listeners[ev] = fn; } });
  const ctx = { JSON, Math, Date, String, Number, Object, Array, Promise, URLSearchParams, setTimeout, clearTimeout, encodeURIComponent, console,
    location: { search: o.qs || '' }, app, LOCAL: 'bks', BORDE: { bks: 'https://borde.test' }, DIA_HOY: '2026-10-30', DIA_NOCHE: '2026-10-29', PROVA: false, MULTI: true, NOCHES: [], PASO: 1, SOBRE_IDX: 0, MANANA: null, UIDS_GESTO: {}, SES: { user: 'Mayra' },
    barra: () => '', fechaCorta: (d) => d, fmt: (n) => '$' + n, uidGesto: (p) => p + '-1', toast: () => {}, plantarBustaPrueba() {}, pantalla8() {},
    esc: (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    document: { getElementById: el, querySelectorAll: () => [] },
    fetch: async (u) => { calls.push(u); if (o.lento) await new Promise((r) => setTimeout(r, 60)); return { json: async () => ({ flags: { caja_no_encontrada_on: '0', sobre_motivo_on: o.leva === undefined ? '1' : o.leva } }) }; },
    getCaja: async (p) => (/^pendientes/.test(p) ? { ok: true, sobres: o.sobres, noches: ['2026-10-29'] } : { ok: true, sobres: [], aviso_sin_respuesta: null }),
    postCaja: async () => ({ ok: true }), unTocoUnHecho: (btn, fn) => { btn.onclick = fn; } };
  vm.createContext(ctx);
  vm.runInContext('var CAJA_DIA = null, UNA_ON = null; async function unaOn() { return false; } function pantallaCajas() {}\n' +
    ['noEncOn', 'noEncHtml', 'noEncBind', 'dejadasHtml', 'dejadasBind', 'claveSobre', 'pantalla6', 'pantalla7', 'uidGestoEstable', 'motivoJlQs', 'motivoJlOn', 'motivoJlYa', 'motivoJlHtml'].map((n) => fnDe(SRC, n)).join('\n') + '\n' +
    SRC.slice(SRC.indexOf('var DEJADAS'), SRC.indexOf('function claveSobre')) + 'var NOENC_ON = null, NOENC_TS = 0, MOTJL_ON = null, MOTJL_TS = 0, MOTJL_QS = null;\n' +
    SRC.slice(SRC.indexOf('var NOENC_TXT'), SRC.indexOf('async function marcarNoEncontrada')) + '\nthis.F = { pantalla6, pantalla7, motivoJlOn };', ctx);
  return { ctx, els, app, calls, el };
}
const MOT = { texto: 'Ray pagó un taxi <con> la caja', firma_jl: 'JL2', ts: '2026-10-30T03:00:00Z' };
const S = (nro, extra) => Object.assign({ sobre_nro: nro, dia: '2026-10-29', declarado: 40000, firma_jl: 'JL2', ts_hecho: '2026-10-29T22:00:00Z', conteo: null, motivo_jl: MOT }, extra || {});
/* la cajera conta: apre il sobre, sello intatto, scrive la cifra, «Revisar conteo» */
async function conta(m, cifra) {
  m.ctx.MANANA = { ok: true, sobres: [S('1004')] }; m.ctx.SOBRE_IDX = 0; m.ctx.F.pantalla7(); await tick();
  const prima = m.app.innerHTML + m.el('extra').innerHTML;
  m.el('selloSi').onclick.call(m.el('selloSi')); m.el('contado').value = String(cifra); await m.el('revisar').onclick();
  return { prima, dopo: m.el('extra').innerHTML };
}
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  { const m = mondo(SRC, { leva: '0' }); const r = await conta(m, 38000);
    t('A · leva spenta ⇒ dopo il conteo nessun motivo (la schermata di ieri)', !/Motivo \(JL\)/.test(r.dopo) && /Qué viste al abrirlo/.test(r.dopo), r.dopo); }
  { const m = mondo(SRC); const r = await conta(m, 38000);
    t('B · leva accesa: PRIMA di «Revisar conteo» il motivo non c\'è (il conteo resta cieco)', !/Motivo \(JL\)/.test(r.prima) && !/taxi/.test(r.prima), r.prima.slice(0, 300));
    t('C · DOPO, con diferencia: «Motivo (JL)», il testo passato da esc e chi l\'ha scritto', /Motivo \(JL\)/.test(r.dopo) && /«Ray pagó un taxi &lt;con&gt; la caja»/.test(r.dopo) && /JL2/.test(r.dopo), r.dopo); }
  { const m = mondo(SRC); const r = await conta(m, 40000);
    t('C2 · DOPO, senza diferencia (la cajera trova quello che il JL ha imbustato): il motivo si vede lo stesso', /Nada que declarar/.test(r.dopo) && /Motivo \(JL\)/.test(r.dopo), r.dopo); }
  { const m = mondo(SRC); m.ctx.MANANA = { ok: true, sobres: [S('1004', { motivo_jl: null })] }; m.ctx.SOBRE_IDX = 0; m.ctx.F.pantalla7(); await tick();
    m.el('selloSi').onclick.call(m.el('selloSi')); m.el('contado').value = '38000'; await m.el('revisar').onclick();
    t('D · busta senza motivo ⇒ niente (vuoto, mai inventato)', !/Motivo \(JL\)/.test(m.el('extra').innerHTML)); }
  { const m = mondo(SRC, { qs: '?motivojl=0' }); const r = await conta(m, 38000);
    t('E · ?motivojl=0 spegne anche a leva accesa', !/Motivo \(JL\)/.test(r.dopo)); }
  { const m = mondo(SRC, { leva: '0', qs: '?motivojl=1' }); const r = await conta(m, 38000);
    t('E2 · ?motivojl=1 accende sul telefono (la prova sulla 998)', /Motivo \(JL\)/.test(r.dopo)); }
  { const m = mondo(SRC, { sobres: [S('1004'), S('1005', { conteo: { contado: 38000 } })] }); await m.ctx.F.motivoJlOn(); await m.ctx.F.pantalla6();
    const h = m.app.innerHTML;
    t('F · lista: il motivo accanto al sobre GIÀ contato (1005), mai accanto a quello da contare (1004)', (h.match(/Motivo \(JL\)/g) || []).length === 1 && h.indexOf('Motivo (JL)') > h.indexOf('1005'), h.slice(0, 600)); }
  { const m = mondo(SRC, { lento: true, sobres: [S('1005', { conteo: { contado: 38000 } })] }); await m.ctx.F.pantalla6();
    t('F2 · lista: la prima volta non aspetta /salud (N1): leva non ancora nota ⇒ niente, e la chiede dietro', !/Motivo \(JL\)/.test(m.app.innerHTML) && m.calls.some((u) => /\/salud/.test(u))); }
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['motivo anche sul sobre da contare nella lista', "(s.conteo && motivoJlYa() && s.motivo_jl", '(motivoJlYa() && s.motivo_jl'],
    ['leva ignorata', "var motJl = (await motivoJlOn()) ? motivoJlHtml(s) : '';", 'var motJl = motivoJlHtml(s);'],
    ['niente esc sul testo', "«' + esc(t) + '»'", "«' + t + '»'"],
    ['solo con diferencia (non quando la cajera quadra)', "<b>Nada que declarar.</b></div>' + motJl +", "<b>Nada que declarar.</b></div>' +"],
    ['freno del telefono ignorato', "  if (motivoJlQs() === '0') return false;\n", ''],
    ['la lista aspetta /salud', "  motivoJlOn();   // [1.11.0]", '  await motivoJlOn();   // [1.11.0]'],
    ['motivo vuoto disegnato', "  if (!t) return '';\n", ''],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r;
    try { r = await banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
