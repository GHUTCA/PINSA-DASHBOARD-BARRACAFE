// BANCO · AUT-0566 · il VETRO di FAM e colación chiede il perché (sala.html) · TERZA PENNA · 04-ott-2026
// Estrae le funzioni vere (`_dtMotOk`, `_dtMotBox`, `_dtHay`, `_dtFalta`) e le esegue con le dipendenze finte.
// Criteri: leva SPENTA = il vetro di ieri · leva ACCESA: FAM/colación senza motivo (8 lettere) non partono, il campo
// compare e dice «Escribe el motivo» · gli altri tipi non cambiano · i due siti d'invio portano `motivo` ·
// le PORTE VECCHIE (solo ?desc2=0) sono dichiarate, non lasciate rifiutare mute.
import fs from 'node:fs'; import vm from 'node:vm';
const SRC = fs.readFileSync(new URL('./sala.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : (ko++, console.log('✗', n, i === undefined ? '' : JSON.stringify(i))); };
const fn = (nome) => { const i = SRC.indexOf('function ' + nome + '('); const j = SRC.indexOf('\n}\n', i) + 3;
  if (i < 0 || j < i) throw new Error('non estraggo ' + nome); return SRC.slice(i, j); };
const blocco = ['_dtMotOk', '_dtMotBox', '_dtHay', '_dtFalta'].map(fn).join('\n');
function mondo(leva, dt, extra) {
  const ctx = Object.assign({ FAMCOL_MOTIVO_ON: leva, _dt: dt, JL: false, DTO_MAX_PCT: 30,
    esc: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'), fmtPrice: (n) => '$' + n,
    _dtMot: () => null, _dtMin: () => 0 }, extra || {});
  vm.createContext(ctx); vm.runInContext(blocco + '\n;this.API = { _dtMotOk, _dtMotBox, _dtHay, _dtFalta };', ctx); return ctx; }
const FAM = (x) => Object.assign({ tipo: 'fam', fam: 'Ale', col: '', mtx: '', pin: '9999' }, x || {});
const COL = (x) => Object.assign({ tipo: 'coln', fam: '', col: 'Pedro', mtx: '', pin: '2222' }, x || {});

// ── leva SPENTA = ieri
for (const dt of [FAM(), COL()]) { const m = mondo(false, dt);
  t('spenta: ' + dt.tipo + ' senza motivo è PRONTA (come ieri)', m.API._dtHay() === true);
  t('spenta: nessun campo motivo', m.API._dtMotBox() === ''); }

// ── leva ACCESA
for (const [nome, mk, falta] of [['FAM', FAM, 'Que teclee su código'], ['colación', COL, 'Escribe el PIN del JL']]) {
  const senza = mondo(true, mk()), corto = mondo(true, mk({ mtx: 'turno' })), spazi = mondo(true, mk({ mtx: '          ' })),
    ok8 = mondo(true, mk({ mtx: 'Comida del turno' }));
  t(nome + ' accesa: senza motivo NON è pronta', senza.API._dtHay() === false);
  t(nome + ' accesa: la riga del bottone dice «Escribe el motivo»', senza.API._dtFalta() === 'Escribe el motivo', senza.API._dtFalta());
  t(nome + ' accesa: 5 lettere non bastano', corto.API._dtHay() === false);
  t(nome + ' accesa: soli spazi non bastano', spazi.API._dtHay() === false);
  t(nome + ' accesa: motivo di 8+ lettere ⇒ pronta', ok8.API._dtHay() === true);
  t(nome + ' accesa: col motivo la riga torna a chiedere la firma/codice', ok8.API._dtFalta() === falta, ok8.API._dtFalta());
  t(nome + ' accesa: il campo compare, maxlength 80, con l\'oninput giusto', /<textarea[^>]*id="dtMt"[^>]*maxlength="80"[^>]*_dtEscribe\(\\'mtx\\'/.test(senza.API._dtMotBox()) || /_dtEscribe\(\\?'mtx\\?'/.test(senza.API._dtMotBox()), senza.API._dtMotBox());
  t(nome + ' accesa: il testo già scritto resta nel campo (escapato)', mondo(true, mk({ mtx: 'a<b motivo largo' })).API._dtMotBox().includes('a&lt;b motivo largo'));
}
// senza la persona scelta resta «¿Quién?» prima del motivo
t('FAM senza persona: prima «¿Quién es?»', mondo(true, FAM({ fam: '' })).API._dtFalta() === '¿Quién es?');
t('colación senza persona: prima «¿Para quién es?»', mondo(true, COL({ col: '' })).API._dtFalta() === '¿Para quién es?');
// gli altri tipi non cambiano
t('«otro» non è toccato dalla leva', mondo(true, { tipo: 'otro', cob: 0, txt: '' }, { _dtMin: () => 1 }).API._dtHay() === false);
t('«franq» resta pronta', mondo(true, { tipo: 'franq' }).API._dtHay() === true);

// ── CONDIZIONE DI 🎛 CONTROLLER: FAM/colación non ripiegano mai sul libro (gasPost)
{ const fnA = (nome) => { const i = SRC.indexOf((nome === '_scontoVia' ? 'async function ' : 'function ') + nome + '('); const j = SRC.indexOf('\n}\n', i) + 3; if (i < 0) throw new Error(nome); return SRC.slice(i, j); };
  const code = fnA('_scontoVia') + '\n' + fnA('_esFamColn');
  const run = async (leva, action, body, bordo, dto = true) => {
    const chiamate = [];
    const ctx = { FAMCOL_MOTIVO_ON: leva, DTO_BORDE_ON: dto, chiamate,
      _pagoAlBorde: async () => bordo, gasPost: async (a, b) => { chiamate.push('gasPost'); return { ok: true, via: 'libro' }; } };
    vm.createContext(ctx); vm.runInContext(code + '\n;this.API = { _scontoVia, _esFamColn };', ctx);
    const r = await ctx.API._scontoVia(action, body, 1000); return { r, chiamate };
  };
  const FAMB = { fam: 1, pin_fam: '9999', medio: 'fam' };
  let o = await run(true, 'registrarPago', FAMB, null);
  t('FAM, il bordo non la prende (null), leva accesa: NESSUNA chiamata al libro', o.chiamate.length === 0, o);
  t('… e il vetro dice sin_bordo, definitivo, con un messaggio', o.r && o.r.ok === false && o.r.error === 'sin_bordo' && o.r.definitivo === true && !!o.r.mensaje, o.r);
  o = await run(true, 'registrarColacion', { para: 'Pedro', pin_jl: '2222' }, null);
  t('colación, il bordo non la prende, leva accesa: nessuna chiamata al libro', o.chiamate.length === 0 && o.r.error === 'sin_bordo', o);
  o = await run(true, 'registrarPago', FAMB, null, false);
  t('FAM con ?dtoborde=0 (il bordo spento dal telefono), leva accesa: nessuna chiamata al libro', o.chiamate.length === 0 && o.r.error === 'sin_bordo', o);
  o = await run(true, 'registrarPago', FAMB, { ok: true, borde: true });
  t('FAM accettata dal bordo: si restituisce la risposta del bordo, nessuna chiamata al libro', o.chiamate.length === 0 && o.r.ok === true && o.r.borde === true, o);
  o = await run(true, 'registrarPago', FAMB, { ok: false, borde: true, definitivo: true, error: 'motivo_requerido' });
  t('un NO definitivo del bordo passa com è', o.r.error === 'motivo_requerido' && o.chiamate.length === 0, o);
  // leva SPENTA = ieri: il ripiego sul libro resta
  o = await run(false, 'registrarPago', FAMB, null);
  t('leva spenta: FAM ripiega sul libro come ieri', o.chiamate.length === 1 && o.r.via === 'libro', o);
  o = await run(false, 'registrarColacion', { para: 'Pedro' }, null);
  t('leva spenta: colación ripiega sul libro come ieri', o.chiamate.length === 1, o);
  // gli altri gesti non cambiano a leva accesa
  o = await run(true, 'registrarPago', { medio: 'efectivo', monto_manual: 1, pin_jl: '2222' }, null);
  t('leva accesa: uno sconto (dto) ripiega sul libro come ieri', o.chiamate.length === 1, o);
  o = await run(true, 'registrarPago', { sin_pago: 1, fam: 1, pin_fam: '1' }, null);
  t('leva accesa: sin_pago (JL) non è FAM e ripiega come ieri', o.chiamate.length === 1, o);
  o = await run(true, 'registrarPago', { medio: 'efectivo' }, null);
  t('leva accesa: un pago normale ripiega come ieri', o.chiamate.length === 1, o); }

// ── cablaggio sul sorgente
t('leva letta da /salud (cercaK fam_coln_motivo_on)', /FAMCOL_MOTIVO_ON = String\(cercaK\(j, 'fam_coln_motivo_on'\)\) === '1'/.test(SRC));
t('leva nasce spenta: var FAMCOL_MOTIVO_ON = false', /var FAMCOL_MOTIVO_ON = false;/.test(SRC));
t('colación (pannello nuovo) invia motivo', /pago_uid: uid,\n\s+motivo: String\(d\.mtx \|\| ''\)\.trim\(\)\.slice\(0, 80\) \}/.test(SRC));
t('FAM (pannello nuovo) invia para E motivo', /para: String\(d\.fam \|\| ''\)\.slice\(0, 60\),\n\s+motivo: String\(d\.mtx \|\| ''\)\.trim\(\)\.slice\(0, 80\) \}/.test(SRC));
t('un motivo_requerido dal bordo accende il campo (telefono caricato prima)', (SRC.match(/error === 'motivo_requerido'\) FAMCOL_MOTIVO_ON = true/g) || []).length === 2);
t('le due PORTE VECCHIE dichiarano invece di rifiutare mute', (SRC.match(/Esta pantalla vieja no pide el motivo/g) || []).length === 2);
t('il campo motivo si azzera al cambio di tipo', /_dt\.txt = ''; _dt\.mtx = '';/.test(SRC));
t('sin_bordo ha il suo messaggio in FAM e colación', (SRC.match(/sin_bordo: 'Sin conexión con el bordo/g) || []).length === 1 && /error === 'sin_bordo'\) \? 'Sin conexión con el bordo/.test(SRC));
t('versione bumpata 3.217.5', /id="ver">sala v3\.217\.5/.test(SRC));
// MUTAZIONE: senza _dtMotOk in _dtHay la FAM senza motivo diventerebbe pronta a leva accesa
const mutB = blocco.replace("return !!_dt.fam && _dtMotOk();", 'return !!_dt.fam;');
t('MUTAZIONE: tolto _dtMotOk da _dtHay il blocco cambia', mutB !== blocco);
{ const c = { FAMCOL_MOTIVO_ON: true, _dt: FAM(), JL: false, DTO_MAX_PCT: 30, esc: String, fmtPrice: String, _dtMot: () => null, _dtMin: () => 0 }; vm.createContext(c);
  vm.runInContext(mutB + '\n;this.hay = _dtHay();', c); t('MUTAZIONE: la FAM senza motivo diventerebbe pronta (il caso A sarebbe rosso)', c.hay === true); }
console.log(ko === 0 ? `✅ ${ok}/${ok + ko} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko === 0 ? 0 : 1);
