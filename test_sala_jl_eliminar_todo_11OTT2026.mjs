// BANCO · ELIMINAR NELL'APP DEL JL: FAMILIA, CONVENIO E COLACION (AUT-0665 · 🎛 V28 `PROVA 108 DOM PASSATA E FAM MANCA NELLA APP JL`, 11-ott) · TERZA PENNA
// Regola di Alberto: «il JL fa tutto dalla sua app». Ieri ELIMINAR nell'app del JL offriva solo «Un producto» e Alberto ha dovuto passare dall'app di Jurley.
// ① leva SPENTA => le porte di ieri, byte per byte (solo «Un producto» + la frase "se hacen desde el teléfono del mesero") ② ACCESA => Convenio · Familia · Colación · Un producto, in quest'ordine, e NON Descuento/Franquicia/Otro monto
// (si fanno al cobrar) ③ il PIN: nel JL firma la SESSIONE per Colación, Convenio/Descuento (pagoConfirmar) e Un producto — prima colación e convenio avrebbero mandato un pin_jl VUOTO ④ fuori dal JL il PIN e quello scritto
// ⑤ il verde del JL non chiede il PIN (Familia si: lo scrive la famiglia) ⑥ cablaggio: la leva da /salud nasce spenta, la card chiama la funzione, i tre siti usano _dtPinJL ⑦ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'sala.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 320))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); const eol = SRC.indexOf('\n', i), r1 = SRC.slice(i, eol);
  if (/\}\s*$/.test(r1) && (r1.match(/\{/g) || []).length === (r1.match(/\}/g) || []).length) return SRC.slice(i, eol + 1);
  return SRC.slice(i, SRC.indexOf('\n}\n', i) + 3); };
function mondo(SRC, o) {
  const ctx = { JL: o.jl === undefined ? { user: 'Jurley', pin: '4321' } : o.jl, _dt: o.dt || null, _dtHay: () => true, String };
  vm.createContext(ctx);
  vm.runInContext(['_dtPuertasJL', '_dtPinJL', '_dtListo'].map((n) => fnDe(SRC, n)).join('\n') + '\nthis.F = { _dtPuertasJL, _dtPinJL, _dtListo };', ctx);
  return ctx;
}
const tipos = (html) => [...html.matchAll(/_dtTipo\('(\w+)'\)/g)].map((x) => x[1]);
function banco(SRC) {
  const F = mondo(SRC, {}).F;
  const off = F._dtPuertasJL(false), on = F._dtPuertasJL(true);
  t('① leva SPENTA: una sola porta, «Un producto»', tipos(off).join() === 'prod', tipos(off));
  t('① bis leva SPENTA: la frase di ieri sul telefono del mesero resta', /Descuentos, convenios y colación se hacen desde el teléfono del mesero\./.test(off) && /firmas tú/.test(off));
  t('② leva ACCESA: Convenio · Familia · Un producto, in quest ordine — la Colación NON c è (15-ott, S2 di Alberto: non si usa più per eliminar)', tipos(on).join() === 'conv,fam,prod', tipos(on));
  // ⑦ la cortesía non esiste più (15-ott, S2 · 🎛 V30 `V30 0665 SENZA COLACION E CORTESIA FUORI`)
  t('⑦ nessun bottone apre la cortesía (l ultima porta era il foglio Descontar con ?desc2=0)', SRC.indexOf('onclick="_dtoCortesia(') < 0);
  { const i = SRC.indexOf('function _dtoCortesia('); const corpo = i >= 0 ? SRC.slice(i, SRC.indexOf('\n}\n', i)) : '';
    t('⑦ bis _dtoCortesia (link vecchio, cache) non apre il pago e non imposta il medio cortesia', i >= 0 && !/medio = 'cortesia'/.test(corpo) && !/abrirPago\(/.test(corpo) && /ya no existe/.test(corpo), corpo.slice(0, 120)); }
  t('② bis NON Descuento, Franquicia ne «Cobré otro monto» (si fanno al cobrar)', !/_dtTipo\('(dto|franq|otro)'\)/.test(on));
  t('② ter la frase vecchia sparisce e dice dove stanno i descuentos', !/se hacen desde el teléfono del mesero/.test(on) && /se hacen al cobrar/.test(on));
  t('② quater Familia dice che il codice lo scrive la famiglia (il JL non lo conosce)', /el código lo escribe la familia/.test(on));
  // ③ ④ il PIN
  const J = mondo(SRC, { jl: { user: 'Jurley', pin: '4321' } }).F, M = mondo(SRC, { jl: null }).F;
  t('③ nel JL il PIN del gesto e quello della SESSIONE, anche se d.pin e vuoto (colación e convenio mandavano pin_jl vuoto)', J._dtPinJL({ pin: '' }) === '4321' && J._dtPinJL({}) === '4321' && J._dtPinJL(null) === '4321');
  t('③ bis nel JL la sessione vince su un d.pin residuo', J._dtPinJL({ pin: '9999' }) === '4321');
  t('④ fuori dal JL il PIN e quello scritto (trim), vuoto se manca', M._dtPinJL({ pin: ' 1234 ' }) === '1234' && M._dtPinJL({}) === '' && M._dtPinJL(null) === '');
  // ⑤ il verde
  const Lj = (dt) => mondo(SRC, { jl: { user: 'Jurley', pin: '4321' }, dt: dt }).F._dtListo();
  t('⑤ JL: Colación e Convenio sono pronti SENZA PIN (firma la sessione)', Lj({ tipo: 'coln', pin: '' }) === true && Lj({ tipo: 'conv', pin: '' }) === true);
  t('⑤ bis JL: Familia NO senza il codice di 4 cifre (lo scrive la famiglia)', Lj({ tipo: 'fam', pin: '' }) === false && Lj({ tipo: 'fam', pin: '123' }) === false && Lj({ tipo: 'fam', pin: '1234' }) === true);
  // ⑥ cablaggio
  t('⑥ la leva nasce spenta e si legge da /salud (jl_eliminar_todo_on)', /var JL_ELIMINAR_TODO_ON = false;/.test(SRC) && /JL_ELIMINAR_TODO_ON = String\(cercaK\(j, 'jl_eliminar_todo_on'\)\) === '1';/.test(SRC));
  t('⑥ bis la card del JL chiama _dtPuertasJL con la leva', /if \(!_dt\.tipo && JL\) \{\n\s+b = _dtPuertasJL\(JL_ELIMINAR_TODO_ON\);/.test(SRC));
  t('⑥ ter i tre siti del PIN usano _dtPinJL: colación · convenio/cobro · un producto', /para: d\.col, pin_jl: _dtPinJL\(d\)/.test(SRC) && /pg\.pinJL = _dtPinJL\(d\);/.test(SRC) && /motivo: d\.pmot, pin_jl: _dtPinJL\(d\),/.test(SRC));
  t('versione >= 3.227.0', /sala v3\.(227\.\d|22[89]\.\d|2[3-9]\d\.\d)/.test(SRC));
}
banco(SRC0);
const mut = (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; try { banco(SRC0.replace(da, () => a)); } catch (e) { ko++; } muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
mut('la leva non apre le porte', "if (!todo) return prod +", "if (true) return prod +");
mut('le porte si aprono a leva spenta', "if (!todo) return prod +", "if (false) return prod +");
mut('manca Convenio', "onclick=\"_dtTipo(\\'conv\\')\">' +\n      '<span class=\"c4nm\">🤝 Convenio", "onclick=\"_dtTipo(\\'xconv\\')\">' +\n      '<span class=\"c4nm\">🤝 Convenio");
mut('manca Familia', "onclick=\"_dtTipo(\\'fam\\')\">' +\n      '<span class=\"c4nm\">👨‍👩‍👧 Familia<small style=\"display:block;font-size:12.5px;font-weight:400;' +\n      'color:var(--cs-ink2)\">deja en $0 · el código lo escribe la familia", "onclick=\"_dtTipo(\\'xfam\\')\">' +\n      '<span class=\"c4nm\">👨‍👩‍👧 Familia<small style=\"display:block;font-size:12.5px;font-weight:400;' +\n      'color:var(--cs-ink2)\">deja en $0 · el código lo escribe la familia");
mut('la Colación torna nell ELIMINAR del JL', "       eliminar: diventa un pezzo a sé (una persona, un prodotto definito, una al giorno). Qui non c'è la sua porta. */\n    prod +", "       eliminar: diventa un pezzo a sé (una persona, un prodotto definito, una al giorno). Qui non c'è la sua porta. */\n    '<button class=\"c4pick\" onclick=\"_dtTipo(\\'coln\\')\">c</button>' + prod +");
mut('la cortesía torna nel foglio Descontar', "    '<button class=\"opt2\" onclick=\"_dtoProducto(", "    '<button class=\"opt2\" onclick=\"_dtoCortesia(\\'' + esc(mesa) + '\\')\">c</button>' +\n    '<button class=\"opt2\" onclick=\"_dtoProducto(");
mut('_dtoCortesia riapre il pago', "  toast('warn', 'La cortesía ya no existe.", "  abrirPago(mesa); STATE.pago.medio = 'cortesia';\n  toast('warn', 'La cortesía ya no existe.");
mut('compare Descuento', "'<div class=\"c4expl\" style=\"font-size:12.5px;margin-top:8px\">Los descuentos y «cobré otro monto» se hacen al cobrar.</div>';", "'<button onclick=\"_dtTipo(\\'dto\\')\">d</button>';");
mut('il PIN del JL non e la sessione', "function _dtPinJL(d) { return JL ? JL.pin : String((d && d.pin) || '').trim(); }", "function _dtPinJL(d) { return String((d && d.pin) || '').trim(); }");
mut('fuori dal JL il PIN e la sessione', "function _dtPinJL(d) { return JL ? JL.pin : String((d && d.pin) || '').trim(); }", "function _dtPinJL(d) { return JL ? JL.pin : (JL && JL.pin); }");
mut('la colación manda d.pin', "para: d.col, pin_jl: _dtPinJL(d)", "para: d.col, pin_jl: d.pin");
mut('il convenio manda d.pin', "pg.pinJL = _dtPinJL(d);", "pg.pinJL = d.pin;");
mut('un producto manda d.pin', "motivo: d.pmot, pin_jl: _dtPinJL(d),", "motivo: d.pmot, pin_jl: (d.pin || '').trim(),");
mut('la card ignora la leva', "b = _dtPuertasJL(JL_ELIMINAR_TODO_ON);", "b = _dtPuertasJL(false);");
mut('la leva non si legge da /salud', "JL_ELIMINAR_TODO_ON = String(cercaK(j, 'jl_eliminar_todo_on')) === '1';", "");
mut('la leva nasce accesa', "var JL_ELIMINAR_TODO_ON = false;", "var JL_ELIMINAR_TODO_ON = true;");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
