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

// ── cablaggio sul sorgente
t('leva letta da /salud (cercaK fam_coln_motivo_on)', /FAMCOL_MOTIVO_ON = String\(cercaK\(j, 'fam_coln_motivo_on'\)\) === '1'/.test(SRC));
t('leva nasce spenta: var FAMCOL_MOTIVO_ON = false', /var FAMCOL_MOTIVO_ON = false;/.test(SRC));
t('colación (pannello nuovo) invia motivo', /pago_uid: uid,\n\s+motivo: String\(d\.mtx \|\| ''\)\.trim\(\)\.slice\(0, 80\) \}/.test(SRC));
t('FAM (pannello nuovo) invia para E motivo', /para: String\(d\.fam \|\| ''\)\.slice\(0, 60\),\n\s+motivo: String\(d\.mtx \|\| ''\)\.trim\(\)\.slice\(0, 80\) \}/.test(SRC));
t('un motivo_requerido dal bordo accende il campo (telefono caricato prima)', (SRC.match(/error === 'motivo_requerido'\) FAMCOL_MOTIVO_ON = true/g) || []).length === 2);
t('le due PORTE VECCHIE dichiarano invece di rifiutare mute', (SRC.match(/Esta pantalla vieja no pide el motivo/g) || []).length === 2);
t('il campo motivo si azzera al cambio di tipo', /_dt\.txt = ''; _dt\.mtx = '';/.test(SRC));
t('versione bumpata 3.217.5', /id="ver">sala v3\.217\.5/.test(SRC));
// MUTAZIONE: senza _dtMotOk in _dtHay la FAM senza motivo diventerebbe pronta a leva accesa
const mutB = blocco.replace("return !!_dt.fam && _dtMotOk();", 'return !!_dt.fam;');
t('MUTAZIONE: tolto _dtMotOk da _dtHay il blocco cambia', mutB !== blocco);
{ const c = { FAMCOL_MOTIVO_ON: true, _dt: FAM(), JL: false, DTO_MAX_PCT: 30, esc: String, fmtPrice: String, _dtMot: () => null, _dtMin: () => 0 }; vm.createContext(c);
  vm.runInContext(mutB + '\n;this.hay = _dtHay();', c); t('MUTAZIONE: la FAM senza motivo diventerebbe pronta (il caso A sarebbe rosso)', c.hay === true); }
console.log(ko === 0 ? `✅ ${ok}/${ok + ko} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko === 0 ? 0 : 1);
