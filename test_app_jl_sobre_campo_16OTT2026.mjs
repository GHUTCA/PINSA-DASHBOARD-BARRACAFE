// BANCO · IL SOBRE DI JL2 BLOCCATO A «…» E IL CAMPO CHE SEMBRAVA IL NUMERO DEL SOBRE (🎛 V30 `V30 IL SOBRE DI JL2 BLOCCATO A 26500`, 16-ott) · TERZA PENNA
// Criteri: ① a fine gesto il fuoco si toglie PRIMA del ridisegno (su iOS pintaTab non ridisegnava con un campo a fuoco) ② il timeout di cajaPost1 copre anche
//          il corpo ③ un «…» oltre 20 s si libera ④ il campo: «¿Cuánto contaste?» sopra, $ fisso, $26.500 mentre si scrive, «número del sobre» staccato
//          ⑤ «26.500» parte come 26500 ⑥ i sei gesti usano _cjFine ⑦ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'app_jl.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 300))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); const a = SRC.slice(Math.max(0, i - 6), i) === 'async ' ? i - 6 : i;
  const eol = SRC.indexOf('\n', i); const riga = SRC.slice(a, eol); if (/\}\s*$/.test(riga) && (riga.split('{').length === riga.split('}').length)) return riga + '\n'; return SRC.slice(a, SRC.indexOf('\n}\n', i) + 3); };
async function banco(SRC) {
  const k0 = ko;
  // ① _cjFine: blur prima di pintaTab
  { const log = []; const ctx = { CJ1: { enviando: true, enviandoTs: 1 }, document: { activeElement: { blur() { log.push('blur'); } } }, pintaTab() { log.push('pinta'); } };
    vm.createContext(ctx); vm.runInContext(fnDe(SRC, '_cjFine'), ctx); ctx._cjFine();
    t('① a fine gesto: enviando falso, il fuoco si toglie PRIMA del ridisegno', ctx.CJ1.enviando === false && log.join() === 'blur,pinta', log); }
  // ② cajaPost1: il corpo fermo va in timeout
  { let abortato = false;
    const ctx = { CFG: { BORDE: 'http://b', LOCAL: 'BKS', T: 't' }, JSON, Error, encodeURIComponent, AbortController,
      setTimeout: (f, ms) => { if (ms === 10000) setTimeout(f, 30); return 1; }, clearTimeout: () => {},
      fetch: async (u, op) => ({ status: 200, json: () => new Promise((res, rej) => { op.signal.addEventListener('abort', () => { abortato = true; const e = new Error('abort'); e.name = 'AbortError'; rej(e); }); }) }) };
    vm.createContext(ctx); vm.runInContext(fnDe(SRC, 'cajaPost1'), ctx);
    let err = null; try { await ctx.cajaPost1({ verbo: 'sobre' }); } catch (e) { err = e; }
    t('② un corpo che non arriva va in timeout (non resta appeso per sempre)', abortato && err && err.message === 'timeout', err && err.message); }
  // ③ la guardia dei 20 s (sul codice) e ⑥ i sei gesti
  t('③ cjAtto1Html libera un «…» oltre 20 s', /function cjAtto1Html\(\) \{\n  if \(CJ1\.enviando && CJ1\.enviandoTs && Date\.now\(\) - CJ1\.enviandoTs > 20000\) CJ1\.enviando = false;/.test(SRC));
  // [29-ott · TERZA · app_jl v1.43.10] il SETTIMO gesto, «Guardar» il motivo del sobre rosso (cjSobMotivo), nasce con la stessa regola
  t('⑥ i sette gesti finiscono con _cjFine e partono con enviandoTs', (SRC.match(/finally \{ _cjFine\(\); \}/g) || []).length === 7 && (SRC.match(/CJ1\.enviando = true; CJ1\.enviandoTs = Date\.now\(\);/g) || []).length === 7 && !/finally \{ CJ1\.enviando = false; pintaTab\(\); \}/.test(SRC));
  // ④ il campo
  { const e = { value: '26500' }; const ctx = { Number, String }; vm.createContext(ctx); vm.runInContext(fnDe(SRC, 'cjMilesIn'), ctx); ctx.cjMilesIn(e);
    t('④ mentre si scrive: 26500 ⇒ 26.500', e.value === '26.500', e.value); }
  { const i = SRC.indexOf("'<p style=\"font-size:15px;font-weight:800;margin:10px 0 4px\">¿Cuánto contaste?</p>'"), j = SRC.indexOf('id="cj1SobContado"'), k = SRC.indexOf('número del sobre — lo da el sistema');
    t('④ «¿Cuánto contaste?» SOPRA il campo, il $ fisso, «número del sobre» DOPO il bottone e spiegato', i > 0 && i < j && j < k && /<span style="font-size:24px;font-weight:900">\$<\/span>/.test(SRC.slice(i, j + 10)) && SRC.indexOf("onclick=\"cjSobEnviar(this)\"", j) < k); }
  // ⑤ «26.500» parte come 26500
  { const posts = []; const ctx = { CJ1: { enviando: false }, STATE: { pin: '1' }, parseInt, Number, String, toast: () => {}, cjMotivoTxt: String, CJ1_ERR: {},
      $: (id) => id === 'cj1SobContado' ? { value: '26.500' } : null, cajaNuevoUid: () => 'CJ-SOB-x', cajaPost1: async (p) => { posts.push(p); return { ok: true, cuadra: false, intento: 1, de: 3 }; },
      _cjFine() { ctx.CJ1.enviando = false; } };
    vm.createContext(ctx); vm.runInContext(fnDe(SRC, 'cjSobEnviar'), ctx); await ctx.cjSobEnviar(null);
    t('⑤ «26.500» parte come contado 26500', posts.length === 1 && posts[0].contado === 26500, posts); }
  // ⑦ AUT-0705 · le tre fasce (Alberto): verde ≤100 · ambra 100-1.000 · rojo >1.000 dopo tre conteos
  { const ctx = { String, Number, isFinite, Math }; vm.createContext(ctx); vm.runInContext(fnDe(SRC, '_cjFascia') + fnDe(SRC, '_cjNum'), ctx);
    t('⑦ la fascia del bordo vince: verde · ambra · rojo', ctx._cjFascia({ fascia: 'verde', con_diferencia: true }) === 'verde' && ctx._cjFascia({ fascia: 'ambra' }) === 'ambra' && ctx._cjFascia({ fascia: 'ROJO' }) === 'rojo');
    t('⑦ senza fascia, busta nata dopo tre conteos (cuadra:false + con_diferencia) ⇒ rojo, non ambra (giallo di ⚙️ ARQ)', ctx._cjFascia({ sobre_nro: '1040', cuadra: false, con_diferencia: true }) === 'rojo');
    t('⑦ senza fascia (bordo di oggi): con_diferencia ⇒ ambra, altrimenti verde', ctx._cjFascia({ con_diferencia: true }) === 'ambra' && ctx._cjFascia({}) === 'verde' && ctx._cjFascia({ fascia: 'boh', con_diferencia: false }) === 'verde');
    t('⑦ la differenza: numero o null, mai 0 inventato', ctx._cjNum(122) === 122 && ctx._cjNum(-1500.4) === -1500 && ctx._cjNum(null) === null && ctx._cjNum('') === null && ctx._cjNum(undefined) === null); }
  { const C = (sob) => { const ctx = { CJ1: { st: { meseros: [], da_imbustare: { n: 0 } }, sob: sob, enviando: false }, cjFlag: () => false, fmt: (n) => '$' + Number(n).toLocaleString('es-CL'), esc: String,
        _cjFascia: null, Date, Math, String, Number, cjSaldosHtml: () => '', _cjMesasDetalle: () => [], _cjHace: () => '', CJ1_ERR: {} };
      vm.createContext(ctx); vm.runInContext(['_cjRiga', '_cjMmSs', '_cjArg'].map((n) => fnDe(SRC, n)).join('') + fnDe(SRC, 'cjAtto1Html'), ctx);
      try { return ctx.cjAtto1Html(); } catch (e) { return 'ERR ' + e.message; } };
    const g = C({ nro: '1035', fascia: 'ambra', diferencia: 122 }), v = C({ nro: '1036', fascia: 'verde', diferencia: 2 }), r = C({ nro: '1037', fascia: 'rojo', diferencia: -1500 });
    t('⑦ ambra: «Cuadra con diferencia · +$122», card ambra', /card ambra/.test(g) && /Cuadra con diferencia · \+\$122/.test(g), g.slice(0, 400));
    t('⑦ verde: «Cuadra · +$2»', /Cuadra · \+\$2</.test(v) && !/card ambra|card rossa/.test(v.split('Detalle retiro efectivo')[0].slice(-40)), v.slice(0, 300));
    t('⑦ rojo: «No cuadró en 3 conteos · −$1.500», card rossa', /card rossa/.test(r) && /No cuadró en 3 conteos · −\$1\.500/.test(r), r.slice(0, 300)); }
  t('⑦ durante i conteos (cuadra:false) NON si mostra la differenza: il conteggio resta cieco', /No cuadró: cuenta de nuevo · conteo ' \+ \(sob\.intento \+ 1\)/.test(SRC) && !/cuenta de nuevo[^\n]*diferencia/.test(SRC));
  t('versione >= 1.40.5', /app_jl v1\.(40\.[5-9]|4[1-9]\.\d)/.test(SRC));
  return ko - k0;
}
await banco(SRC0);
const mut = async (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; try { await banco(SRC0.replace(da, () => a)); } catch (e) { ko++; } muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('mutante «' + nome + '» ⇒ banco ROSSO', rossi > 0, rossi); };
await mut('niente blur a fine gesto', "try { const ae = document.activeElement; if (ae && ae.blur) ae.blur(); } catch (e) {} pintaTab(); }", "pintaTab(); }");
await mut('il timeout torna a fermarsi agli header', "    let j = null; try { j = await r.json(); } catch (e) { if (e && e.name === 'AbortError') throw e; j = null; }   // [v1.40.5] il timeout copre anche il corpo\n    clearTimeout(to);", "    clearTimeout(to);\n    let j = null; try { j = await r.json(); } catch (e) { j = null; }");
await mut('nessuna guardia dei 20 s', "  if (CJ1.enviando && CJ1.enviandoTs && Date.now() - CJ1.enviandoTs > 20000) CJ1.enviando = false;", "");
await mut('niente punti delle migliaia', "e.value = d ? Number(d).toLocaleString('es-CL') : '';", "e.value = d;");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
