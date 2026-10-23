// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · le due note di Alberto sul mixto (mesa 999, 21-ott)
// ① scelto «Mixto» i bottoni dei medios si chiudono in una riga · ② scrivere un importo NON ridisegna il pannello (niente ritorno in cima).
// Gira `bMedio`, `_bMxPinta`, `bMxIn`, `bMxBlur2` VERI in vm. A leva spenta confronta l'HTML di bMedio con quello di HEAD: deve essere identico.
// node test_sala_mixto_v2_note_alberto_21OTT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm'; import { execSync } from 'node:child_process';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
let HEAD = null; try { HEAD = execSync('git show 8814ab5:sala.html', { cwd: new URL('.', import.meta.url), maxBuffer: 64 << 20 }).toString('utf8').replace(/\r\n/g, '\n'); } catch (e) {}
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
function elFinto(id) { return { id, value: '', placeholder: '', innerHTML: '', textContent: '', disabled: false, style: {}, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } }; }
function mondo(SRC, { v2 = true, pg, monto = 3190, prop = 319 }) {
  const dom = {}; const w = { innerHTML: '', querySelector: () => null };
  const fns = ['bMedio', '_mxMediosConMonto', '_mxPropMedio', '_mxPropHtml'].concat(SRC.includes('function _bMxPinta(') ? ['_bMxNum', '_bMxPinta', 'bMxIn', 'bMxBlur2'] : [])
    .concat(SRC.includes('function _mxKeys(') ? ['_mxKeys', '_mxMedio', '_mxExtraHtml', '_mxCuadraTxt'] : []);   // [22-ott · TERZA] il mixto con la seconda carta
  const LBL = SRC.includes('const MX_LBL = ') ? SRC.slice(SRC.indexOf('const MX_LBL = '), SRC.indexOf('\n', SRC.indexOf('const MX_LBL = ')) + 1) : '';
  const ctx = { STATE: { pago: pg, nombre: 'Wilbert' }, PROPINA_MIXTO_MEDIO_ON: true, PAGO_BLOQUEA_ON: false, Math, String, parseFloat,
    mxV2On: () => v2, c4Css: () => {}, _bMonto: () => monto, _pagoPropina: () => prop, c4Resta: () => 0, _pagadaAviso: () => null, _yaMontoTxt: () => '',
    esc: (s) => String(s == null ? '' : s), fmtPrice: (n) => '$' + Math.round(n), _fmtMiles: (n) => String(Math.round(n)), _pgRelojOff: () => {},
    _pagoQuiereVoucher: () => !!(pg.mixto && (_n(pg.mixto.debito) > 0 || _n(pg.mixto.credito) > 0)),
    $: (id) => dom[id] || null, dom, w, renderPago: () => { ctx.ridisegni = (ctx.ridisegni || 0) + 1; }, ridisegni: 0 };
  function _n(v) { return Math.round(parseFloat(String(v).replace(/[^0-9]/g, '')) || 0); }
  vm.createContext(ctx); vm.runInContext(LBL + fns.map((n) => fnVin(SRC, n)).join('\n'), ctx);
  return { ctx, w, dom };
}
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const PG = () => ({ medio: 'mixto', mixto: { efectivo: '1500', debito: '', credito: '', transferencia: '' }, prop: 'sug', uid: 'PU-1', mesa: '999' });
  // ⓪ leva spenta: bMedio identico a 6bb39de
  if (HEAD) {
    const stati = [PG(), Object.assign(PG(), { medio: 'debito' }), Object.assign(PG(), { mixto: { efectivo: '1500', debito: '1690', credito: '', transferencia: '' }, propMedio: 'efectivo' }), Object.assign(PG(), { medio: '' })];
    const diversi = stati.filter((p) => { const a = mondo(SRC, { v2: false, pg: JSON.parse(JSON.stringify(p)) }), b = mondo(HEAD, { v2: false, pg: JSON.parse(JSON.stringify(p)) });
      vm.runInContext('bMedio(w, STATE.pago)', a.ctx); vm.runInContext('bMedio(w, STATE.pago)', b.ctx);
      /* [21-ott · mesa 47] l'unica differenza voluta da allora: il chip «➗ Dividir» della propina (dietro PROPINA_MIXTO_MEDIO_ON, non dietro la leva v2) */
      const senzaDiv = (h) => h.replace(/<div class="cs-chip( sel)?" onclick="bPropMedio\('_div'\)">➗ Dividir<\/div>/, '')
        /* [22-ott · mesa 47] e le due differenze volute dopo: i chip «＋ otra de crédito / débito» e il testo del sobran/faltan (che dice dove sta la differenza) */
        .replace(/<div class="c4chips" style="margin-top:6px">(<div class="cs-chip" onclick="mxOtra\('(credito2|debito2)'\)">[^<]*<\/div>)+<\/div>/, '')
        .replace(/(✓ cuadra: \$\d+|faltan <b>|sobran <b>)[\s\S]*?<\/div><\/div>/, 'CUADRA</div></div>');
      const norm = (h) => h.replace(/(✓ cuadra: \$\d+|faltan <b>|sobran <b>)[\s\S]*?<\/div><\/div>/, 'CUADRA</div></div>');
      return senzaDiv(a.w.innerHTML) !== norm(b.w.innerHTML); }).length;
    t('⓪ leva spenta: l HTML di bMedio è IDENTICO a quello di 6bb39de su 4 stati (mixto, débito, mixto quadrato, senza medio)', diversi === 0, diversi);
  } else t('⓪ (git show 6bb39de non disponibile: confronto saltato)', true);
  // ① la riga sola
  { const m = mondo(SRC, { pg: PG() }); vm.runInContext('bMedio(w, STATE.pago)', m.ctx); const h = m.w.innerHTML;
    t('① leva accesa e Mixto scelto: niente Débito/Crédito/Efectivo/Transfer, resta «Mixto» scelto e «Cambiar»', !/pagoSet\('medio','debito'\)/.test(h) && !/pagoSet\('medio','transferencia'\)/.test(h) && /pagoSet\('medio','mixto'\)/.test(h) && /Cambiar<small>otro medio<\/small>/.test(h) && /pagoSet\('medio',''\)/.test(h)); }
  { const pg = PG(); pg.medio = 'debito'; const m = mondo(SRC, { pg }); vm.runInContext('bMedio(w, STATE.pago)', m.ctx);
    t('① leva accesa ma medio Débito: i cinque bottoni come sempre', /pagoSet\('medio','transferencia'\)/.test(m.w.innerHTML) && !/Cambiar<small>/.test(m.w.innerHTML)); }
  { const m = mondo(SRC, { pg: PG() }); vm.runInContext('bMedio(w, STATE.pago)', m.ctx); const h = m.w.innerHTML;
    t('② leva accesa: i campi hanno id e chiamano bMxIn/bMxBlur2 (non bMxBlur), e ci sono bmxProp · bmxCuadra · c4Pagar · data-scr', /id="bmx_debito"/.test(h) && /oninput="bMxIn\(this,'debito'\)"/.test(h) && /onblur="bMxBlur2\(this,'debito'\)"/.test(h) && !/bMxBlur\(this/.test(h) && /id="bmxProp"/.test(h) && /id="bmxCuadra"/.test(h) && /id="c4Pagar"/.test(h) && /data-scr="medio" data-uid="PU-1"/.test(h)); }
  // ② l'aggiornamento sul posto
  { const pg = PG(); const m = mondo(SRC, { pg }); ['efectivo', 'debito', 'credito', 'transferencia'].forEach((k) => { m.dom['bmx_' + k] = elFinto('bmx_' + k); });
    ['bmxCuadra', 'bmxProp', 'c4Pagar'].forEach((k) => { m.dom[k] = elFinto(k); });
    vm.runInContext("bMxIn({ value: '1690' }, 'debito')", m.ctx);
    t('② scrivere 1.690 nel débito: «✓ cuadra», PAGAR acceso «— pasa la tarjeta», chip della propina, ZERO ridisegni', m.ctx.ridisegni === 0 && /cuadra: \$3190/.test(m.dom.bmxCuadra.innerHTML) && !m.dom.c4Pagar.disabled &&
      /PAGAR \$3509 — pasa la tarjeta/.test(m.dom.c4Pagar.textContent) && m.dom.c4Pagar.attrs.onclick === 'pagoAlPaso3()' && /en qué medio/.test(m.dom.bmxProp.innerHTML), { r: m.ctx.ridisegni, c: m.dom.bmxCuadra.innerHTML, b: m.dom.c4Pagar }); }
  { const pg = PG(); const m = mondo(SRC, { pg }); ['efectivo', 'debito', 'credito', 'transferencia'].forEach((k) => { m.dom['bmx_' + k] = elFinto('bmx_' + k); });
    ['bmxCuadra', 'bmxProp', 'c4Pagar'].forEach((k) => { m.dom[k] = elFinto(k); });
    vm.runInContext('_bMxPinta()', m.ctx);
    t('② ancora 1.690 da ripartire: «faltan», PAGAR spento «La suma no cuadra», il placeholder dice «$1690 — toca y listo»', /faltan <b>\$1690<\/b> en los montos · deben sumar <b>\$3190<\/b>/.test(m.dom.bmxCuadra.innerHTML) && m.dom.c4Pagar.disabled && /no cuadra/.test(m.dom.c4Pagar.textContent) && /\$1690 — toca y listo/.test(m.dom.bmx_debito.placeholder), m.dom); }
  { const pg = PG(); const m = mondo(SRC, { pg }); const el = elFinto('bmx_debito'); m.dom.bmx_debito = el; ['bmxCuadra', 'bmxProp', 'c4Pagar'].forEach((k) => { m.dom[k] = elFinto(k); });
    vm.runInContext('bMxBlur2(dom.bmx_debito, "debito")', m.ctx);
    t('② lasciare il campo vuoto ⇒ «toca y listo» scrive 1.690 DENTRO il campo e nello stato, senza ridisegno', pg.mixto.debito === '1690' && el.value === '1690' && m.ctx.ridisegni === 0 && /cuadra/.test(m.dom.bmxCuadra.innerHTML), { pg: pg.mixto, el: el.value, r: m.ctx.ridisegni }); }
  { const pg = PG(); pg.mixto.debito = '900'; const m = mondo(SRC, { pg }); const el = elFinto('bmx_debito'); el.value = '900'; m.dom.bmx_debito = el; ['bmxCuadra', 'bmxProp', 'c4Pagar'].forEach((k) => { m.dom[k] = elFinto(k); });
    vm.runInContext('bMxBlur2(dom.bmx_debito, "debito")', m.ctx);
    t('② un campo già scritto non si tocca (900 resta 900)', pg.mixto.debito === '900' && el.value === '900'); }
  { const pg = PG(); pg.mixto.debito = '5000'; const m = mondo(SRC, { pg }); ['bmxCuadra', 'bmxProp', 'c4Pagar'].forEach((k) => { m.dom[k] = elFinto(k); }); vm.runInContext('_bMxPinta()', m.ctx);
    t('② troppo ⇒ «sobran … baja alguna cifra», PAGAR spento', /sobran <b>\$3310<\/b>/.test(m.dom.bmxCuadra.innerHTML) && m.dom.c4Pagar.disabled); }
  t('③ la leva: /salud cobro_mixto_v2_on e ?mxv2 per telefono', /MXV2_SRV = String\(cercaK\(j, 'cobro_mixto_v2_on'\)\) === '1';/.test(SRC) && /function mxV2On\(\) \{ return MXV2_QS === '0' \? false : \(MXV2_QS === '1' \|\| MXV2_SRV\); \}/.test(SRC));
  t('③ lo scroll si tiene solo se era la stessa schermata dello stesso pago', /_scV\.getAttribute\('data-uid'\) === String\(pg\.uid \|\| ''\)/.test(fnVin(SRC, 'bMedio')));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['bMxIn ridisegna', "function bMxIn(el, k2) { const pg = STATE.pago; if (!pg || !pg.mixto) return; pg.mixto[k2] = el.value; _bMxPinta(); }", "function bMxIn(el, k2) { const pg = STATE.pago; if (!pg || !pg.mixto) return; pg.mixto[k2] = el.value; renderPago(); }"],
    ['PAGAR non si riaccende', 'bt.disabled = !!(pg.enviando || mal);', 'bt.disabled = true;'],
    ['il toca y listo non va nel campo', "if (resto > 0) { pg.mixto[k2] = String(resto); if (el) el.value = String(resto); }", 'if (resto > 0) { pg.mixto[k2] = String(resto); }'],
    ['il chip della propina non si aggiorna', "const pp = $('bmxProp'); if (pp) pp.innerHTML = _mxPropHtml(pg, prop);", ''],
    ['la riga sola anche a leva spenta', '((mxV2On() && pg.medio === \'mixto\')', "((pg.medio === 'mixto')"],
    ['onclick di PAGAR fisso', "bt.setAttribute('onclick', alP3 ? 'pagoAlPaso3()' : 'pagoConfirmar(this)');", ''],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
