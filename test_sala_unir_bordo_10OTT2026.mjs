// BANCO · l'UNIR passa dal bordo (1.4 · BKP `BKP 1 4 UNIR VA DIRITTO AL GAS`) — DALLA PORTA DEL VETRO, non dalla funzione del bordo · TERZA PENNA · 10-ott-2026
// Il banco di 1.4 chiamava `unirMesas` sul DO: verde su un cammino che il telefono non percorre. Qui si esegue `juntaCrear` (la funzione vera di sala.html) con
// `gasPost`/`staffPost` finti e si guarda QUALE dei due viene chiamato e con quale corpo.
// Criteri: ① leva SPENTA => gasPost (il vetro di ieri) e MAI staffPost ② ACCESA => staffPost('unirMesas') con gid, mesas e, se il gesto scioglie junte, gid_rotti
//          ③ la risposta con grupo_id aggiorna la junta come prima (gidSrv) ④ nessuna junta sciolta => nessun gid_rotti (la chiave non nasce) ⑤ il testimone (eco) parte comunque
//          ⑥ la leva nasce spenta e si legge da /salud ⑦ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'sala.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 300))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); return SRC.slice(i, SRC.indexOf('\n}\n', i) + 3); };

function mondo(SRC, { leva, previas = [], seleccion, staffRisp, gasRisp }) {
  const chiamate = []; const hechos = []; const toasts = [];
  let juntas = previas.map((j) => ({ ...j }));
  const ctx = { UNIR_VIA_BORDE_ON: leva, STATE: { selMesas: seleccion.slice(), codigo: 'C1', nombre: 'Wilbert' }, _mapStart: '',
    _juntasLoad: () => juntas.map((j) => ({ ...j })), _juntasSave: (l) => { juntas = l; }, _gid: (p) => p + '-gid1',
    toast: (k, m) => toasts.push([k, m]), refrescarMapa: () => {}, bordeHecho: (g, d) => hechos.push([g, d]),
    gasPost: async (a, b) => { chiamate.push(['gas', a, b]); return gasRisp || { ok: true }; },
    staffPost: async (a, b) => { chiamate.push(['staff', a, b]); return staffRisp || { ok: true, borde: true }; },
    Date, Math, parseInt, JSON, Object, Array, String };
  vm.createContext(ctx);
  vm.runInContext(fnDe(SRC, 'juntaCrear') + '\nthis.crea = juntaCrear;', ctx);
  return { ctx, chiamate, hechos, toasts, juntas: () => juntas };
}
const JV = (n, mesas, gid) => ({ n, principal: mesas[0], ts: 1, gid, mesas });
const tick = () => new Promise((r) => setTimeout(r, 5));
// la porta del SEPARAR: juntaSeparar vera, con la junta in locale e staffPost finto
function mondoSep(SRC, junta) {
  const chiamate = []; let juntas = [{ ...junta }];
  const ctx = { JFIX_ON: false, STATE: { codigo: 'C1', nombre: 'Wilbert' }, _juntasLoad: () => juntas.map((j) => ({ ...j })), _juntasSave: (l) => { juntas = l; }, _gid: (p) => p + '-gidX',
    toast() {}, bordeHecho() {}, cerrarMesa() {}, refrescarMapa() {}, staffPost: async (a, b) => { chiamate.push([a, b]); return { ok: true, borde: true }; }, Date, JSON, Array, Object };
  vm.createContext(ctx); vm.runInContext(fnDe(SRC, 'juntaSeparar') + '\nthis.sep = juntaSeparar;', ctx);
  return { ctx, chiamate };
}

async function banco(SRC) {
  const k0 = ko;
  { const m = mondo(SRC, { leva: false, seleccion: ['200', '199'] }); m.ctx.crea(); await tick();
    t('① leva SPENTA: l unir va dritto al GAS (gasPost) e NON al bordo — il vetro di ieri', m.chiamate.length === 1 && m.chiamate[0][0] === 'gas' && m.chiamate[0][1] === 'unirMesas', m.chiamate); }
  { const m = mondo(SRC, { leva: true, seleccion: ['200', '199'] }); m.ctx.crea(); await tick();
    const c = m.chiamate[0] || [];
    t('② leva ACCESA: l unir passa da staffPost (prima il bordo) e NON dal gasPost diretto', m.chiamate.length === 1 && c[0] === 'staff' && c[1] === 'unirMesas', m.chiamate);
    t('② bis il corpo porta codigo, nombre, mesas (principal prima) e il gid coniato dal vetro', c[2] && c[2].codigo === 'C1' && c[2].nombre === 'Wilbert' && c[2].mesas === '199,200' || c[2] && /^(199|200),(199|200)$/.test(c[2].mesas) && c[2].gid === 'un-gid1', c[2]);
    t('④ nessuna junta sciolta: la chiave gid_rotti NON nasce', c[2] && !('gid_rotti' in c[2]), c[2]); }
  { const m = mondo(SRC, { leva: true, previas: [JV(1, ['10', '11'], 'G-AAA'), JV(2, ['20', '21'], 'G-BBB')], seleccion: ['11', '30'] }); m.ctx.crea(); await tick();
    const c = (m.chiamate[0] || [])[2] || {};
    t('② ter il gesto scioglie la junta 1 (mesa 11): gid_rotti = [G-AAA], la 2 non si tocca', JSON.stringify(c.gid_rotti) === '["G-AAA"]', c);
    t('② quater la junta sciolta sparisce dal locale e nasce la nuova', m.juntas().length === 2 && !m.juntas().some((j) => j.gid === 'G-AAA'), m.juntas()); }
  { const m = mondo(SRC, { leva: true, previas: [JV(1, ['10', '11'], 'G-AAA'), JV(2, ['20', '21'], 'G-BBB')], seleccion: ['11', '20'] }); m.ctx.crea(); await tick();
    const c = (m.chiamate[0] || [])[2] || {};
    t('② quinquies il gesto scioglie DUE junte: gid_rotti le nomina entrambe', c.gid_rotti && c.gid_rotti.length === 2 && c.gid_rotti.includes('G-AAA') && c.gid_rotti.includes('G-BBB'), c); }
  { const m = mondo(SRC, { leva: true, previas: [{ n: 1, principal: '10', ts: 1, gid: '', mesas: ['10', '11'] }], seleccion: ['11', '30'] }); m.ctx.crea(); await tick();
    const c = (m.chiamate[0] || [])[2] || {};
    t('④ bis una junta sciolta SENZA gid (vecchia): non si inventa nessun gid_rotti', !('gid_rotti' in c), c); }
  { const m = mondo(SRC, { leva: true, seleccion: ['200', '199'], staffRisp: { ok: true, borde: true, grupo_id: 'un-gid1' } }); m.ctx.crea(); await tick();
    const j = m.juntas()[0] || {};
    t('③ la risposta del bordo con grupo_id marca la junta come confermata (gidSrv) — come con la risposta del GAS', j.gidSrv === 'un-gid1' && j.gid === 'un-gid1', j); }
  { const m = mondo(SRC, { leva: true, seleccion: ['200', '199'], staffRisp: { ok: true, borde: true } }); m.ctx.crea(); await tick();
    const j = m.juntas()[0] || {};
    t('③ bis il bordo risponde SENZA grupo_id (riga non in coda): la junta NON si dichiara confermata e tiene il gid del vetro', !j.gidSrv && j.gid === 'un-gid1', j); }
  { const m = mondo(SRC, { leva: true, seleccion: ['200', '199'] }); m.ctx.crea(); await tick();
    t('⑤ il testimone (eco per gli altri telefoni) parte comunque e PRIMA, ottimistico', m.hechos.length === 1 && m.hechos[0][0] === 'unir', m.hechos); }
  { const m = mondo(SRC, { leva: true, seleccion: ['200'] }); m.ctx.crea(); await tick();
    t('una sola mesa non e una junta: niente gesto', m.chiamate.length === 0 && m.hechos.length === 0, m.chiamate); }
  // 1.4b (QUARTA df3944f): il separar chiude la riga in grupos_mesa per OGNI gid di gid_rotti — e la chiave e quella CHE IL LIBRO CONOSCE
  { const m = mondoSep(SRC, { n: 1, principal: '200', ts: 1, gid: 'un-vetro', gidSrv: 'G-LIBRO', mesas: ['199', '200'] }); m.ctx.sep(1); await tick();
    const b = (m.chiamate[0] || [])[1] || {};
    t('1.4b il separar manda gid_rotti = [gidSrv] (la chiave che il LIBRO conosce), NON il gid del gesto', m.chiamate[0] && m.chiamate[0][0] === 'separarMesas' && JSON.stringify(b.gid_rotti) === '["G-LIBRO"]' && b.gid === 'sp-gidX', m.chiamate); }
  { const m = mondoSep(SRC, { n: 1, principal: '200', ts: 1, gid: 'un-vetro', mesas: ['199', '200'] }); m.ctx.sep(1); await tick();
    const b = (m.chiamate[0] || [])[1] || {};
    t('1.4b bis senza gidSrv (il libro non ha ancora confermato) ripiega sul gid della junta', JSON.stringify(b.gid_rotti) === '["un-vetro"]', b); }
  { const m = mondoSep(SRC, { n: 1, principal: '200', ts: 1, gid: '', mesas: ['199', '200'] }); m.ctx.sep(1); await tick();
    const b = (m.chiamate[0] || [])[1] || {};
    t('1.4b ter una junta SENZA nessuna chiave: gid_rotti non nasce (mai un gid inventato: scriverebbe una junta fantasma chiusa)', !('gid_rotti' in b) && b.principal === '200', b); }
  { const m = mondo(SRC, { leva: true, previas: [{ n: 1, principal: '10', ts: 1, gid: 'un-v', gidSrv: 'G-LIBRO', mesas: ['10', '11'] }], seleccion: ['11', '30'] }); m.ctx.crea(); await tick();
    const c = (m.chiamate[0] || [])[2] || {};
    t('1.4b quater anche l unir nomina le junte sciolte con la chiave del LIBRO (gidSrv), non con il gid del vetro', JSON.stringify(c.gid_rotti) === '["G-LIBRO"]', c); }
  t('⑥ UNIR_VIA_BORDE_ON nasce false e si accende SOLO da /salud → unir_via_borde_on === "1"', /var UNIR_VIA_BORDE_ON = false;/.test(SRC) && SRC.includes("UNIR_VIA_BORDE_ON = String(cercaK(j, 'unir_via_borde_on')) === '1'"));
  return ko - k0;
}
await banco(SRC0);
const mut = async (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; await banco(SRC0.replace(da, () => a)); muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('⑦ mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
await mut('la leva e ignorata (sempre gas)', "(UNIR_VIA_BORDE_ON ? staffPost('unirMesas', _corpoUnir) : gasPost('unirMesas', _corpoUnir))", "gasPost('unirMesas', _corpoUnir)");
await mut('la leva e ignorata (sempre bordo)', "(UNIR_VIA_BORDE_ON ? staffPost('unirMesas', _corpoUnir) : gasPost('unirMesas', _corpoUnir))", "staffPost('unirMesas', _corpoUnir)");
await mut('gid_rotti non parte', "if (gidRotti.length) _corpoUnir.gid_rotti = gidRotti;", "");
await mut('gid_rotti parte sempre (anche vuoto)', "if (gidRotti.length) _corpoUnir.gid_rotti = gidRotti;", "_corpoUnir.gid_rotti = gidRotti;");
await mut('gid_rotti nomina tutte le junte', "const gidRotti = prima.filter(function (j) { return j.mesas.some(function (m) { return sel.indexOf(m) >= 0; }); })", "const gidRotti = prima.filter(function (j) { return true; })");
await mut('il testimone non parte', "bordeHecho('unir', { principal: principal, mesas: _mesasOrden });", "");
await mut('la junta si conferma anche senza grupo_id', "if (r && r.ok && r.grupo_id) {", "if (r && r.ok) {");
await mut('il separar manda il gid del gesto invece della chiave del libro', "const _chiaveLibro = j.gidSrv || j.gid || '';", "const _chiaveLibro = '';");
await mut('il separar ignora gidSrv', "const _chiaveLibro = j.gidSrv || j.gid || '';", "const _chiaveLibro = j.gid || '';");
await mut('il separar inventa una chiave', "const _chiaveLibro = j.gidSrv || j.gid || '';", "const _chiaveLibro = j.gidSrv || j.gid || 'x';");
await mut('l unir ignora gidSrv', "return j.gidSrv || j.gid; }).filter(Boolean);", "return j.gid; }).filter(Boolean);");
await mut('la leva non si legge da /salud', "UNIR_VIA_BORDE_ON = String(cercaK(j, 'unir_via_borde_on')) === '1';", "UNIR_VIA_BORDE_ON = false;");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
