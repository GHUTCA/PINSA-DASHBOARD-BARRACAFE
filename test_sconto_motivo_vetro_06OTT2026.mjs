// BANCO · #67 · la casilla del MOTIVO nelle tre strade dello sconto (sala.html) · TERZA PENNA · 06-ott-2026
// Le tre strade che mettono un importo a mano SENZA la lista di motivi (`_dtoOtroMonto`, `_dtoPct`, il chip «¿Cobraste otro
// monto?») convergono nel pannello del pago. Criteri (CONTROLLER): senza motivo ⇒ non partono · con motivo ⇒ arriva al bordo ·
// leva a 0 ⇒ il vetro di ieri · la lista di motivi (`pg.dto`) e la cortesía non cambiano.
import fs from 'node:fs'; import vm from 'node:vm';
const SRC = fs.readFileSync(new URL('./sala.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : (ko++, console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 240))); };
const fn = (nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); const j = SRC.indexOf('\n}\n', i) + 3; return SRC.slice(i, j); };
const codice = ['_pagoMonto', '_scontoSinMotivo', '_motivoManHtml'].map(fn).join('\n');
function mondo(leva, pg) {
  const ctx = { SCONTOMOT_ON: leva, STATE: { pago: pg }, esc: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'), parseInt, String };
  vm.createContext(ctx); vm.runInContext(codice + '\n;this.API = { _scontoSinMotivo, _motivoManHtml };', ctx);
  return { blocca: () => ctx.API._scontoSinMotivo(pg), box: () => ctx.API._motivoManHtml(pg) };
}
const PG = (x) => Object.assign({ tot: 15000, medio: 'efectivo', montoOn: true, montoCustom: '12000', motivoMan: '', dto: null }, x || {});

// ── leva spenta = ieri
{ const m = mondo(false, PG()); t('spenta: nessun blocco (il vetro di ieri)', m.blocca() === false); t('spenta: nessuna casella', m.box() === ''); }

// ── a leva accesa: le tre strade
{ // 1) % rapida: _dtoPct precarica montoCustom = 80% del consumo
  const m = mondo(true, PG({ montoCustom: String(Math.round(15000 * 80 / 100)) }));
  t('% rapida senza motivo: NON parte', m.blocca() === true);
  t('% rapida: la casella compare', /id="motivoManTx"/.test(m.box()) && /maxlength="80"/.test(m.box()), m.box());
  const c = mondo(true, PG({ motivoMan: 'Cliente reclamó el tiempo' })); t('% rapida con motivo: parte', c.blocca() === false); }
{ // 2) «otro monto» del JL: monto vuoto (= consumo) finché non lo scrive
  const m = mondo(true, PG({ montoCustom: '' }));
  t('«otro monto» con il campo vuoto: non c\'è ancora un monto a mano ⇒ nessuna casella (come ieri)', m.blocca() === false && m.box() === '');
  const m2 = mondo(true, PG({ montoCustom: '9000' }));
  t('«otro monto» con un importo a mano e senza motivo: NON parte, con casella', m2.blocca() === true && /motivoManTx/.test(m2.box())); }
{ // 3) il chip «¿Cobraste otro monto?»: stesso stato (montoOn + montoCustom)
  const m = mondo(true, PG({ montoCustom: '14000' })); t('chip «otro monto» senza motivo: NON parte', m.blocca() === true); }

// ── soglia di lettere
for (const [mot, bloccato] of [['', true], ['    ', true], ['abc', true], ['abcd', true], ['  abcd  ', true], ['abcde', false], ['  abcde  ', false], ['Reclamo por demora', false]]) {
  t('motivo «' + mot + '» ' + (bloccato ? 'blocca' : 'passa'), mondo(true, PG({ motivoMan: mot })).blocca() === bloccato); }

// ── ciò che NON cambia a leva accesa
t('con la lista di motivi (pg.dto) la casella non serve: non blocca e non compare', (() => { const m = mondo(true, PG({ dto: { et: 'Demora', tot: 15000, monto: 12000 }, motivoMan: '' })); return m.blocca() === false && m.box() === ''; })());
t('la cortesía non è uno sconto con monto: non blocca', mondo(true, PG({ medio: 'cortesia' })).blocca() === false);
t('monto a mano = consumo (nessuno sconto): non blocca', mondo(true, PG({ montoCustom: '15000' })).blocca() === false);
t('senza montoOn: non blocca', mondo(true, PG({ montoOn: false, montoCustom: '' })).blocca() === false);
t('il texto escrito se queda en la casilla (y escapado)', mondo(true, PG({ motivoMan: 'a<b motivo' })).box().includes('a&lt;b motivo'));

// ── cablaggio sul sorgente
t('la leva nasce spenta: var SCONTOMOT_ON = false', /var SCONTOMOT_ON = false;/.test(SRC));
t('la leva viene da /salud: sconto_motivo_obligatorio_on', /SCONTOMOT_ON = String\(cercaK\(j, 'sconto_motivo_obligatorio_on'\)\) === '1'/.test(SRC));
t('la guardia sta in pagoConfirmar PRIMA di enviando', (() => { const i = SRC.indexOf('async function pagoConfirmar(btn)'); const a = SRC.indexOf('_scontoSinMotivo(pg)', i); const b = SRC.indexOf('pg.enviando = true', i); return i > 0 && a > i && b > a; })());
t('il motivo scritto viaggia nell\'invio (body.motivo = motivoMan, slice 80)', /else if \(String\(pg\.motivoMan \|\| ''\)\.trim\(\)\) \{[^}]*body\.motivo = String\(pg\.motivoMan\)\.trim\(\)\.slice\(0, 80\);/.test(SRC));
t('la lista di motivi (pg.dto) resta com\'era e va per prima', /if \(pg\.dto\) \{\n\s+body\.motivo = String\(pg\.dto\.et \|\| ''\)\.slice\(0, 80\);/.test(SRC));
t('un motivo_requerido del bordo accende la leva e dice cosa fare', /r\.error === 'motivo_requerido'\) \{[\s\S]{0,260}SCONTOMOT_ON = true; _rech\(/.test(SRC));
t('la casella è nel pannello delle opzioni del JL, sotto il campo del monto', /oninput="pagoInput\(\\'montoCustom\\',this\.value\)" onchange="renderPago\(\)">' \+ _motivoManHtml\(pg\)/.test(SRC));
t('un solo punto invia monto_manual (le tre strade convergono)', (SRC.match(/body\.monto_manual = 1/g) || []).length === 1);
// MUTAZIONE: senza la guardia le tre strade partirebbero senza motivo
const mut = SRC.replace("if (_scontoSinMotivo(pg)) { toast('warn'", "if (false) { toast('warn'");
t('MUTAZIONE: tolta la guardia il sorgente cambia', mut !== SRC);
console.log(ko === 0 ? `✅ ${ok}/${ok + ko} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko === 0 ? 0 : 1);
