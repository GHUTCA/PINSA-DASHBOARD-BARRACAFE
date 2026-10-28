// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · 4.3: il KDS non chiede più a Google com'è la coda (27-oct)
// Richiesta 🎛 V33 `V33 MAR 27 MATTINA` ③. Gira leerKds · poll · entrar VERI in vm, con fetch del bordo e gasGet finti.
// node test_kds_sin_gas_27OCT2026.mjs [kds.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./kds.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
const COLA = { ok: true, cola: [{ uuid: 'u1', mesa: '12', items: [{ nombre: 'Lomo', llevar: 1 }] }], listos: [] };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const iL = SRC.indexOf('const KDS_SIN_GAS_ON'); const leva = iL < 0 ? 'const KDS_SIN_GAS_ON = false;' : SRC.slice(iL, SRC.indexOf('\n', iL));
  const iE = SRC.indexOf('const KDS_ESPERA_MS'); const espera = iE < 0 ? '' : SRC.slice(iE, SRC.indexOf('\n', iE));   // [28-ott · ⓐ] le costanti dell'attesa, se ci sono
  function mondo({ qs = '', borde = 'ok', edad = 1000, gas = COLA, invalidi = Infinity, edadGate = null } = {}) {
    const L = { fetch: 0, gas: [], els: {}, now: 1e12, invalidi: 0 };   // [28-ott] orologio finto: setTimeout fa avanzare `now`
    const el = (id) => (L.els[id] = L.els[id] || { id, textContent: '', value: '', disabled: false, _c: new Set(), classList: { add: (...c) => c.forEach((x) => L.els[id]._c.add(x)), remove: (...c) => c.forEach((x) => L.els[id]._c.delete(x)) } });
    const ctx = { JSON, Date: { now: () => L.now }, Math, Number, String, Object, Promise, Error, setTimeout: (f, ms) => { L.now += (ms || 0); return setTimeout(f, 0); }, clearTimeout, AbortController, encodeURIComponent, URLSearchParams,
      QS: new URLSearchParams(qs), CFG: { LOCAL: 'BKS', SK: { COD: 'c', EST: 'e', LOC: 'l' } }, STATE: { codigo: '1234', estacion: 'cocina', fallos: 0, pollEnVuelo: 0 },
      localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} }, $: el,
      fetch: async () => { L.fetch++; if (borde === 'rete') throw new Error('rete');
        const inv = borde === 'invalid' && L.invalidi++ < invalidi;   // [28-ott] i primi `invalidi` giri rifiutati, poi il gate nuovo
        const j = inv ? Object.assign({ ok: false, error: 'codigo_invalid' }, edadGate == null ? {} : { edad_gate_s: edadGate }) : borde === 'vacio' ? { ok: true, datos: null } : { ok: true, datos: { edad_ms: edad, datos: COLA } };
        return { ok: true, json: async () => j }; },
      gasGet: async (a, p) => { L.gas.push(a); return gas; },
      aplicar: (r) => { L.aplicato = r; }, render: () => {}, renovarCodigo: async () => false, salir: () => {}, showEntrada: () => {}, showTablero: () => { L.tablero = (L.tablero || 0) + 1; }, bautizarSilencioso: () => {} };
    vm.createContext(ctx);
    vm.runInContext(leva + '\n' + espera + '\nconst BORDE = { URL: "https://b", T: "t", ON: ' + (qs.includes('borde=0') ? 'false' : 'true') + ', MAX_EDAD_MS: 300000, fallos: 0, fallosTs: 0 };\n' +
      'async ' + fnVin(SRC, 'leerKds') + 'async ' + fnVin(SRC, 'poll') + 'async ' + fnVin(SRC, 'entrar'), ctx);
    return { ctx, L };
  }
  const leggi = async (w) => { try { return await vm.runInContext('leerKds("1234", "cocina")', w.ctx); } catch (e) { return { lanciato: e.message }; } };
  { const w = mondo(); const r = await leggi(w); t('A · bordo sano ⇒ la coda del bordo, ZERO GAS', r.cola && w.L.gas.length === 0, w.L); }
  { const w = mondo({ borde: 'rete' }); const r = await leggi(w); t('B · bordo irraggiungibile ⇒ si lancia «sin_red», MAI getKds', r.lanciato === 'sin_red' && w.L.gas.length === 0, { r, gas: w.L.gas }); }
  { const w = mondo({ borde: 'vacio' }); const r = await leggi(w); t('C · bordo che risponde senza coda ⇒ «cargando», MAI getKds', r.lanciato === 'cargando' && w.L.gas.length === 0, { r, gas: w.L.gas }); }
  { const w = mondo({ edad: 600000 }); const r = await leggi(w); t('D · foto oltre il tetto ⇒ la foto DICHIARATA (_vieja_s), MAI getKds', r.cola && r._vieja_s === 600 && w.L.gas.length === 0, { r, gas: w.L.gas }); }
  { const w = mondo({ borde: 'invalid' }); const r = await leggi(w); t('E · codigo_invalid dal bordo ⇒ come prima (il poll rinnova o esce)', r.ok === false && r.error === 'codigo_invalid' && w.L.gas.length === 0, r); }
  { const w = mondo({ qs: 'kdsgas=1', borde: 'rete' }); const r = await leggi(w); t('F · ?kdsgas=1 (il freno per apparecchio) ⇒ getKds come ieri', r.cola && w.L.gas[0] === 'getKds', w.L.gas); }
  { const w = mondo({ qs: 'borde=0', borde: 'rete' }); const r = await leggi(w); t('G · ?borde=0 (il freno di sempre) ⇒ niente bordo, getKds come ieri', r.cola && w.L.fetch === 0 && w.L.gas[0] === 'getKds', w.L); }
  { const w = mondo({ borde: 'vacio' }); await vm.runInContext('poll()', w.ctx);
    t('H · il poll con «cargando»: «⏳ Cargando la cola…», i fallos non salgono', w.L.els.offline.textContent === '⏳ Cargando la cola…' && w.ctx.STATE.fallos === 0, { off: w.L.els.offline && w.L.els.offline.textContent, f: w.ctx.STATE.fallos }); }
  { const w = mondo({ borde: 'rete' }); await vm.runInContext('poll()', w.ctx); await vm.runInContext('poll()', w.ctx);
    t('I · il poll con la rete morta: «Sin conexión» dopo due giri, ZERO GAS', /Sin conexión/.test(w.L.els.offline.textContent) && w.ctx.STATE.fallos === 2 && w.L.gas.length === 0, { f: w.ctx.STATE.fallos, gas: w.L.gas }); }
  // l'ingresso col codice
  const entra = async (o) => { const w = mondo(o); w.L.els.entCodigo = { value: '1234' }; await vm.runInContext('entrar()', w.ctx); return w; };
  { const w = await entra({}); t('J · ingresso col codice buono: validato dal bordo, dentro, ZERO GAS', w.L.tablero === 1 && w.L.aplicato && w.L.gas.length === 0 && w.ctx.STATE.codigo === '1234', w.L); }
  { const w = await entra({ borde: 'invalid' }); t('K · codice rifiutato dal bordo per più di 2 minuti ⇒ dopo l attesa, il messaggio di sempre, ZERO GAS', /Código inválido/.test(w.L.els.entErr.textContent) && !w.L.tablero && w.L.gas.length === 0 && w.L.fetch > 1, { txt: w.L.els.entErr.textContent, fetch: w.L.fetch }); }
  { const w = await entra({ borde: 'invalid', invalidi: 2 }); t('K2 · [28-ott ⓐ] apertura del turno: due rifiuti, poi il gate nuovo ⇒ dentro da solo, ZERO GAS', w.L.tablero === 1 && w.ctx.STATE.codigo === '1234' && w.L.gas.length === 0 && w.L.fetch === 3, { fetch: w.L.fetch, tab: w.L.tablero }); }
  { const w = mondo({ borde: 'invalid', invalidi: 1 }); w.L.els.entCodigo = { value: '1234' };
    const storia = []; w.L.els.entErr = { set textContent(v) { storia.push(v); this._t = v; }, get textContent() { return this._t || ''; } };
    await vm.runInContext('entrar()', w.ctx); const durante = storia.join(' | ');
    t('K3 · [28-ott ⓐ] durante l attesa il tablet dice «Espera un minuto, se está abriendo el turno»', /Espera un minuto, se está abriendo el turno/.test(durante), durante); }
  { const w = await entra({ borde: 'invalid', edadGate: 20 }); t('K4 · [28-ott ⓐ] il bordo dice che il gate è fresco (20 s) ⇒ il codice è sbagliato davvero: niente attesa', /Código inválido/.test(w.L.els.entErr.textContent) && w.L.fetch === 1, { fetch: w.L.fetch }); }
  { const w = await entra({ borde: 'vacio' }); t('L · codice buono, coda non ancora pronta ⇒ dentro senza aplicar, ZERO GAS', w.L.tablero === 1 && !w.L.aplicato && w.L.gas.length === 0, w.L); }
  { const w = await entra({ borde: 'rete' }); t('M · rete morta all ingresso ⇒ «Sin conexión», ZERO GAS', /Sin conexión/.test(w.L.els.entErr.textContent) && w.L.gas.length === 0, w.L.els.entErr.textContent); }
  t('N · la riapertura del tablet non chiama getKds dopo il rinnovo, a leva', (SRC.match(/if \(KDS_SIN_GAS_ON && BORDE\.ON\) \{ showTablero\(\); poll\(\); return; \}/g) || []).length === 2);
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['la lettura ricade su Google', "  if (KDS_SIN_GAS_ON && BORDE.ON) {\n    if (fotoVieja) return fotoVieja;\n    throw new Error(bordoRispose ? 'cargando' : 'sin_red');\n  }\n", ''],
    ['nasce spenta', "return QS.get('kdsgas') !== '1';", "return QS.get('kdsgas') === '0';"],
    ['cargando conta come guasto', "    if (e && e.message === 'cargando') {", "    if (false) {"],
    ['l ingresso valida sul GAS', "    if (KDS_SIN_GAS_ON && BORDE.ON) {\n      const leggi = async function () {", "    if (false) {\n      const leggi = async function () {"],   // [28-ott] la forma della v1.31
    ['vuoto letto come rete', '      if (r.ok) bordoRispose = true;\n', ''],
    ['niente attesa all apertura del turno', "      while (r && !r.ok && r.error === 'codigo_invalid' && Date.now() - t0 < KDS_ESPERA_MS", "      while (false && r && !r.ok && r.error === 'codigo_invalid' && Date.now() - t0 < KDS_ESPERA_MS"],
    ['il gate fresco aspetta lo stesso', "             && !(r.edad_gate_s != null && r.edad_gate_s < KDS_GATE_FRESCO_S)) {", "             && true) {"],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
