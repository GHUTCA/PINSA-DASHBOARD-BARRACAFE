// BANCO · il RITIRO coi DUE NOMI — «¿Quién entrega?» (AUT-0646, 🎛 V28: la colonna si chiama `entregado_por`, sulla riga del ritiro, la manda app_jl) · TERZA PENNA · 10-ott-2026
// Criteri: ① leva SPENTA (/salud → caja_entregado_por_on) = il vetro di ieri: nessun controllo, nessuna chiave nel payload
//          ② ACCESA: il menu offre il JL e gli altri garzones, NON il mesero stesso, senza doppioni; vuoto = «como siempre» e la chiave non viaggia
//          ③ un nome uguale al mesero (senza accenti/maiuscole) non e un secondo nome ④ i DUE ritiri vivi (Recibí $X e cifra digitata) lo spediscono
//          ⑤ contratto dal sorgente del bordo: `cajaFilaRitiro` scrive `entregado_por` SOLO a leva accesa e solo se diverso dal mesero ⑥ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const APP = process.argv[2] || path.join(AQUI, 'app_jl.html');
const BORDO = process.argv[3] || path.join(AQUI, '..', '_wt_0613');
const SRC0 = fs.readFileSync(APP, 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 300))); };
const fn = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error('manca ' + nome); let d = 0, j = SRC.indexOf('{', i); for (; j < SRC.length; j++) { if (SRC[j] === '{') d++; else if (SRC[j] === '}' && --d === 0) break; } return SRC.slice(i, j + 1) + '\n'; };
const FN = ['cjFlag', '_cjEntregaOn', '_cjEntrega', '_cjEnManoDe', 'cjRetEntrega'];

function mondo(SRC, { flag, user = 'Ale JL', meseros = ['Marcela', 'Ray', 'Ale JL'] }) {
  const ctx = { JSON, RegExp, String, Object, esc: (x) => String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;'),
    STATE: { user, salud: flag ? { caja: { caja_entregado_por_on: '1' } } : { caja: { caja_entregado_por_on: '0' } } },
    pintaTab: () => { ctx.REDIBUJADO = (ctx.REDIBUJADO || 0) + 1; },
    CJ1: { ret: null, st: { meseros: meseros.map((m, i) => ({ mesero: m, en_mano: 1000 * (i + 1) })) } } };
  vm.createContext(ctx);
  vm.runInContext(FN.map((n) => fn(SRC, n)).join('') + '\n' + fn(SRC, '_cjEntregaSel')
    + '\nthis.API = { _cjEntregaOn, _cjEntrega, _cjEnManoDe, cjRetEntrega, _cjEntregaSel };', ctx); return ctx;
}
function banco(SRC) {
  const k0 = ko;
  { const m = mondo(SRC, { flag: false }); const ret = { mesero: 'Marcela', entrega: 'Ale JL' }; m.CJ1.ret = ret;
    t('① leva SPENTA: _cjEntrega non porta nulla, anche se il campo e valorizzato', Object.keys(m.API._cjEntrega(ret)).length === 0, m.API._cjEntrega(ret));
    t('① bis leva spenta: nessun menu (il vetro di ieri)', m.API._cjEntregaSel(ret) === '', m.API._cjEntregaSel(ret)); }
  { const m = mondo(SRC, { flag: true }); const ret = { mesero: 'Marcela', entrega: '' }; m.CJ1.ret = ret;
    t('② leva ACCESA, nessuno scelto: la chiave NON viaggia (vuoto = il mesero consegna, come oggi)', Object.keys(m.API._cjEntrega(ret)).length === 0);
    ret.entrega = 'Ale JL'; t('② il JL che consegna: entregado_por = Ale JL', m.API._cjEntrega(ret).entregado_por === 'Ale JL', m.API._cjEntrega(ret));
    m.API.cjRetEntrega('Ray'); t('② cjRetEntrega scrive nel ritiro corrente', ret.entrega === 'Ray' && m.API._cjEntrega(ret).entregado_por === 'Ray');
    const h = m.API._cjEntregaSel(ret);
    t('② il menu offre «como siempre», Yo (JL) e Ray; NON Marcela (e il mesero stesso); Ale JL una volta sola', /Marcela \(como siempre\)/.test(h) && /Yo \(Ale JL\)/.test(h) && /value="Ray" selected/.test(h) && (h.match(/value="Marcela"/g) || []).length === 0 && (h.match(/value="Ale JL"/g) || []).length === 1, h);
    ret.entrega = 'marcela'; t('③ un nome uguale al mesero (maiuscole) non e un secondo nome', Object.keys(m.API._cjEntrega(ret)).length === 0, m.API._cjEntrega(ret));
    ret.entrega = '  '; t('③ bis solo spazi = vuoto', Object.keys(m.API._cjEntrega(ret)).length === 0); }
  // ③ ter la cifra e di CHI HA I BIGLIETTI (V28: il ritiro si confronta con l en_mano di entregado_por, o del mesero se vuoto)
  { const m = mondo(SRC, { flag: true, meseros: ['Marcela', 'Ray', 'Ale JL'] });   // en_mano: Marcela 1000 · Ray 2000 · Ale JL 3000
    const ret = { mesero: 'Marcela', att: { en_mano: 1000 }, entrega: '' }; m.CJ1.ret = ret;
    t('③ ter nessuno scelto: la cifra e quella del mesero (come oggi)', m.API._cjEnManoDe(ret) === 1000, m.API._cjEnManoDe(ret));
    ret.entrega = 'Ale JL'; t('③ ter consegna il JL: la cifra (e il `visto`) e la SUA, 3.000, non i 1.000 del mesero', m.API._cjEnManoDe(ret) === 3000, m.API._cjEnManoDe(ret));
    ret.entrega = 'ray'; t('③ ter il nome si trova senza maiuscole', m.API._cjEnManoDe(ret) === 2000, m.API._cjEnManoDe(ret));
    ret.entrega = 'Pinco Pallino'; t('③ ter uno senza contante in mano => 0 (il bordo rifiutera nada_que_recibir; il bottone si spegne)', m.API._cjEnManoDe(ret) === 0);
    ret.entrega = 'Ale JL'; ret.conf = 5; m.API.cjRetEntrega('Ray'); t('③ ter cambiare chi consegna ridisegna e azzera la conferma vecchia (vale per UN monto)', m.REDIBUJADO === 1 && ret.conf === 0 && ret.entrega === 'Ray', [m.REDIBUJADO, ret]);
    const mm = mondo(SRC, { flag: false }); const r2 = { mesero: 'Marcela', att: { en_mano: 1000 }, entrega: 'Ale JL' }; mm.CJ1.ret = r2;
    t('③ ter leva SPENTA: anche con un nome nel campo la cifra resta quella del mesero', mm.API._cjEnManoDe(r2) === 1000, mm.API._cjEnManoDe(r2)); }
  // ④ i due ritiri vivi
  t('④ «Recibí $X» firma l en_mano di CHI CONSEGNA (`visto: _cjEnManoDe(ret)`)', /visto: _cjEnManoDe\(ret\), uid_gesto: ret\.uid/.test(SRC));
  t('④ la cifra digitata: `esperado_ora`, il tetto e il «Faltaban» sono di chi consegna', /esperado_ora: _cjEnManoDe\(ret\)/.test(SRC) && /const att = _cjEnManoDe\(CJ1\.ret\);/.test(SRC) && /'\? Faltaban ' \+ fmt\(_cjEnManoDe\(CJ1\.ret\)\)/.test(SRC));
  t('④ le due schede mostrano la cifra di chi consegna', /'<b style="font-size:26px">' \+ fmt\(_cjEnManoDe\(CJ1\.ret\)\)/.test(SRC) && /'<b style="font-size:20px">' \+ fmt\(_cjEnManoDe\(CJ1\.ret\)\)/.test(SRC));
  t('④ `Recibí` si spegne se chi consegna non ha nulla in mano', /!\(_cjEnManoDe\(CJ1\.ret\) > 0\) \? ' disabled'/.test(SRC));
  t('④ «Recibí $X» (cjRetTodo) spedisce `..._cjEntrega(ret)`', /recibi: 'todo', visto: _cjEnManoDe\(ret\), uid_gesto: ret\.uid, \.\.\._cjEntrega\(ret\) \}\)/.test(SRC));
  t('④ bis la cifra digitata (cjRetEnviar) spedisce `..._cjEntrega(ret)`', /confirmo_sobre_esperado: 1 \} : \{\}\), \.\.\._cjEntrega\(ret\) \}\)/.test(SRC));
  t('④ ter il menu compare in tutte e DUE le schede del ritiro', (SRC.match(/_cjEntregaSel\(CJ1\.ret\)/g) || []).length === 2);
  t('④ quater il menu non esiste senza il flag del bordo (cjFlag(caja_entregado_por_on))', /function _cjEntregaOn\(\) \{ return cjFlag\('caja_entregado_por_on'\); \}/.test(SRC));
  return ko - k0;
}
banco(SRC0);

// ⑤ il bordo, dal sorgente
const C = await import(pathToFileURL(path.join(BORDO, 'src', 'caja.js')).href);
{ const base = { local: 'BKS', mesero: 'Marcela', monto: 5000, uid_gesto: 'CJ-RIT-1', esperado_ora: 5000 };
  const ctx = (on) => ({ CAJA_PG_WRITE_ON: '1', ...(on ? { CAJA_ENTREGADO_POR_PG_ON: '1' } : {}), local: 'BKS', ts: Date.parse('2026-10-10T21:00:00Z'), dia_operativo: '2026-10-10', fuente: 'app_jl' });
  const f = (p, on) => C.cajaFilaRitiro({ ...base, ...p }, ctx(on));
  t('⑤ leva SPENTA: la riga NON porta entregado_por (colonna ancora inesistente)', f({ entregado_por: 'Ale JL' }, false).fila && !('entregado_por' in f({ entregado_por: 'Ale JL' }, false).fila));
  t('⑤ leva ACCESA: entregado_por = Ale JL e `mesero` resta l intestatario', f({ entregado_por: 'Ale JL' }, true).fila.entregado_por === 'Ale JL' && f({ entregado_por: 'Ale JL' }, true).fila.mesero === 'Marcela', f({ entregado_por: 'Ale JL' }, true).fila);
  t('⑤ accesa ma vuoto: la chiave non nasce (il mesero consegna i suoi biglietti)', !('entregado_por' in f({}, true).fila) && !('entregado_por' in f({ entregado_por: '' }, true).fila));
  t('⑤ accesa ma uguale al mesero (Marcela / marcela / MARCELA ): la chiave non nasce', !('entregado_por' in f({ entregado_por: ' MARCELA ' }, true).fila));
  t('⑤ accesa, differenza di accento (Marcéla): e lo STESSO nome, non nasce', !('entregado_por' in f({ entregado_por: 'Marcéla' }, true).fila));
}

const mut = (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; banco(SRC0.replace(da, a)); muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('⑥ mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
mut('il menu ignora il flag', "return cjFlag('caja_entregado_por_on'); }", 'return true; }');
mut('il flag ha un altro nome', "cjFlag('caja_entregado_por_on')", "cjFlag('caja_entregado_x_on')");
mut('la chiave viaggia anche vuota', "return (_cjEntregaOn() && e && e.toLowerCase()", "return (_cjEntregaOn() && e.toLowerCase()");
mut('il nome uguale al mesero passa', "e.toLowerCase() !== String((ret && ret.mesero) || '').trim().toLowerCase()) ?", "true) ?");
mut('il visto resta del mesero', 'visto: _cjEnManoDe(ret), uid_gesto', 'visto: ret.att.en_mano, uid_gesto');
mut('il tetto resta del mesero', 'const att = _cjEnManoDe(CJ1.ret);', 'const att = +(CJ1.ret.att && CJ1.ret.att.en_mano) || 0;');
mut('esperado_ora resta del mesero', 'esperado_ora: _cjEnManoDe(ret)', 'esperado_ora: ret.att.en_mano');
mut('_cjEnManoDe ignora chi consegna', "if (!e) return +(ret && ret.att && ret.att.en_mano) || 0;", "return +(ret && ret.att && ret.att.en_mano) || 0;");
mut('cambiare chi consegna non azzera la conferma', "CJ1.ret.entrega = String(v || ''); CJ1.ret.conf = 0; pintaTab();", "CJ1.ret.entrega = String(v || '');");
mut('Recibí $X non lo spedisce', "uid_gesto: ret.uid, ..._cjEntrega(ret) });", "uid_gesto: ret.uid });");
mut('la cifra digitata non lo spedisce', "} : {}), ..._cjEntrega(ret) });", "} : {}) });");
mut('il menu offre il mesero stesso', "k.toLowerCase() === String(ret.mesero || '').trim().toLowerCase() || vi[k.toLowerCase()]", "vi[k.toLowerCase()]");
mut('il menu ha doppioni', "vi[k.toLowerCase()] = 1; otros.push(k);", "otros.push(k);");

console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
