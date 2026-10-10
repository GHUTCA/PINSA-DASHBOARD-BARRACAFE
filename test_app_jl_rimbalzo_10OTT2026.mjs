// BANCO · la sala che rimanda il JL alla sua app DICE PERCHE' (V28 «lezione per la riprova») · TERZA PENNA · 10-ott-2026
// Criteri: ① un rimbalzo recente si mostra con una BARRA che resta e col motivo ② si consuma alla prima lettura ③ un rimbalzo vecchio (>10 min) o assente non mostra niente
//          ④ la funzione e chiamata all avvio, PRIMA di boot ⑤ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'app_jl.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 300))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); return SRC.slice(i, SRC.indexOf('\n}\n', i) + 3); };
function mondo(SRC, rec) {
  const ss = new Map(); if (rec !== undefined) ss.set('jl_rimbalzo', JSON.stringify(rec)); const dom = { el: null };
  const ctx = { JSON, Date, String, Object,
    sessionStorage: { getItem: (k) => (ss.has(k) ? ss.get(k) : null), removeItem: (k) => ss.delete(k) },
    document: { getElementById: () => dom.el, createElement: () => ({ attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, remove() { dom.el = null; }, onclick: null }), body: { appendChild: (e) => { dom.el = e; } } } };
  vm.createContext(ctx); vm.runInContext(fnDe(SRC, '_cjRimbalzo') + '\nthis.R = _cjRimbalzo;', ctx); return { ctx, ss, dom };
}
function banco(SRC) {
  const k0 = ko;
  { const m = mondo(SRC, { ts: Date.now() - 5000, msg: 'No estás en el turno — pide al JL que te asigne.' }); const r = m.ctx.R();
    t('① un rimbalzo recente: ritorna true e accende una BARRA col perche', r === true && m.dom.el && /No estás en el turno/.test(m.dom.el.textContent) && /te devolvió a tu app/.test(m.dom.el.textContent), m.dom.el && m.dom.el.textContent);
    t('② si consuma alla prima lettura (non riappare al ricaricare)', !m.ss.has('jl_rimbalzo'));
    if (m.dom.el && m.dom.el.onclick) m.dom.el.onclick(); t('① bis la barra si chiude al tocco', m.dom.el === null); }
  { const m = mondo(SRC, { ts: Date.now() - 11 * 60000, msg: 'vecchio' }); const r = m.ctx.R();
    t('③ un rimbalzo di piu di 10 minuti non mostra niente (e si butta)', r === false && m.dom.el === null && !m.ss.has('jl_rimbalzo')); }
  { const m = mondo(SRC, undefined); const r = m.ctx.R(); t('③ bis nessun rimbalzo: niente barra', r === false && m.dom.el === null); }
  { const m = mondo(SRC, { ts: Date.now(), msg: '' }); const r = m.ctx.R(); t('③ ter motivo vuoto: dice «sin motivo», mai una barra muta', r === true && /sin motivo/.test(m.dom.el.textContent), m.dom.el && m.dom.el.textContent); }
  t('④ e chiamata all avvio, PRIMA di bootDemo/boot', SRC.indexOf('try { _cjRimbalzo(); } catch (e) {}') > 0 && SRC.indexOf('try { _cjRimbalzo(); } catch (e) {}') < SRC.indexOf('if (DEMO) bootDemo();'));
  return ko - k0;
}
banco(SRC0);
const mut = (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; banco(SRC0.replace(da, () => a)); muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('⑤ mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
mut('non si consuma', "sessionStorage.removeItem('jl_rimbalzo'); }", "}");
mut('non guarda l eta', "Date.now() - r.ts > 600000", "false");
mut('il motivo sparisce', "String(r.msg || 'sin motivo')", "'sin motivo'");
mut('non e chiamata all avvio', "try { _cjRimbalzo(); } catch (e) {}\nif (DEMO)", "if (DEMO)");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
