// BANCO · «il JL fa tutto dalla sua app» — COBRAR / PEDIR / MOVER in sala.html?jl=1 + la propina al mesero del tavolo · TERZA PENNA · 10-ott-2026
// (decisione ⓐ di Alberto, 🎛 V28 `JL FA TUTTO DALLA SUA APP COBRAR`; punto di denaro chiuso con 🖐 QUARTA)
// Criteri: ① leva SPENTA = il filtro di ieri (solo PEDIDOS ed ELIMINAR) · ② leva ACCESA = + PEDIR · COBRAR · MOVER (PRECUENTA/SEPARAR/TIEMPOS no)
//          ③ la leva si legge da /salud (jl_todo_on) e nasce spenta · ④ il body del pago in JL porta `registrado_por` = il mesero del tavolo, `nombre`/`codigo` restano del JL, `cobrado_por` = JL
//          ⑤ FUORI da JL il body e' IDENTICO a ieri · ⑥ contratto con l'altro lato (parola presa dal SORGENTE del bordo): la riga `pagos` del bordo porta quel registrado_por e `repartoPozo` accredita il MESERO, non il JL
//          ⑦ mutanti: ogni rottura deve far diventare rosso il banco.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SALA = process.argv[2] || path.join(AQUI, 'sala.html');
const BORDO = process.argv[3] || path.join(AQUI, '..', '_wt_0613');
const SRC0 = fs.readFileSync(SALA, 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 300))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error('manca ' + nome); return SRC.slice(i, SRC.indexOf('\n', i) + 1); };

// ── il filtro VJ: la riga VERA di sala.html eseguita con una lista di verbi
function filtraVJ(SRC, { JL, JL_TODO_ON }) {
  const i = SRC.indexOf('const VJ = '); const riga = SRC.slice(i, SRC.indexOf('\n', i));
  const V = ['pedir', 'precuenta', 'cobrar', 'pedidos', 'mover', 'separar', 'tiempos', 'descontar'].map((k) => ({ k }));
  const ctx = { JL, JL_TODO_ON, V }; vm.createContext(ctx);
  vm.runInContext(riga + '\nthis.OUT = VJ.map(function (b) { return b.k; });', ctx); return ctx.OUT;
}
const JLX = { user: 'Ale JL', vista: 'Marcela', codigo: 'X1' };
const E = (SRC, JL, on) => filtraVJ(SRC, { JL, JL_TODO_ON: on }).join(',');
function banco(SRC, etichetta) {
  const e0 = ok + ko, k0 = ko;
  t('① leva SPENTA: il JL vede solo PEDIDOS ed ELIMINAR (il filtro di ieri)', E(SRC, JLX, false) === 'pedidos,descontar', E(SRC, JLX, false));
  t('② leva ACCESA: PEDIR · COBRAR · MOVER tornano, PRECUENTA/SEPARAR/TIEMPOS no', E(SRC, JLX, true) === 'pedir,cobrar,pedidos,mover,descontar', E(SRC, JLX, true));
  t('② bis fuori da JL il filtro non esiste: i verbi sono tutti, con o senza leva', E(SRC, null, false) === 'pedir,precuenta,cobrar,pedidos,mover,separar,tiempos,descontar' && E(SRC, null, true) === E(SRC, null, false));

  // ③ la leva nasce spenta e si legge da /salud
  t('③ JL_TODO_ON nasce false', /var JL_TODO_ON = false;/.test(SRC));
  t('③ bis si accende SOLO da /salud → jl_todo_on === "1" (stesso blocco delle altre leve)', /JL_TODO_ON = String\(cercaK\(j, 'jl_todo_on'\)\) === '1'/.test(SRC));

  // ④ il body del pago in JL
  const mondo = (JL, STATE) => { const ctx = { JL, STATE }; vm.createContext(ctx); vm.runInContext(fnDe(SRC, '_registradoPor') + fnDe(SRC, '_cobradoPor') + '\nthis.rp = _registradoPor; this.cp = _cobradoPor;', ctx); return ctx; };
  { const m = mondo(JLX, { nombre: 'Ale JL', vista: 'Marcela' });
    t('④ JL su un tavolo del mesero: registrado_por = il MESERO (la fetta), non il JL', m.rp() === 'Marcela', m.rp());
    t('④ bis cobrado_por = il JL (la traccia di chi ha toccato il telefono)', m.cp().cobrado_por === 'Ale JL', m.cp()); }
  { const m = mondo(JLX, { nombre: 'Ale JL', vista: 'Ale JL' });
    t('④ ter JL sul SUO tavolo: registrado_por = il JL (la fetta e lui)', m.rp() === 'Ale JL'); }
  { const m = mondo(JLX, { nombre: 'Ale JL', vista: '' });
    t('④ quater JL senza fetta: ripiega sul JL, mai su una stringa vuota', m.rp() === 'Ale JL'); }
  // ⑤ fuori da JL: identico a ieri
  { const m = mondo(null, { nombre: 'Marcela', vista: '' });
    t('⑤ il mesero normale (JL null): registrado_por = STATE.nombre e NESSUN cobrado_por', m.rp() === 'Marcela' && Object.keys(m.cp()).length === 0, [m.rp(), m.cp()]); }
  const pc = SRC.slice(SRC.indexOf('async function pagoConfirmar('), SRC.indexOf('\n}\n', SRC.indexOf('async function pagoConfirmar(')) + 3);
  t('④ pagoConfirmar usa _registradoPor() e porta cobrado_por', /registrado_por: _registradoPor\(\)/.test(pc) && /Object\.assign\(body, _cobradoPor\(\)\)/.test(pc));
  t('④ ma `nombre` e `codigo` restano di chi firma (il JL): l auth non cambia', /codigo: STATE\.codigo, nombre: STATE\.nombre, registrado_por: _registradoPor\(\)/.test(pc));
  const fi = SRC.slice(SRC.indexOf("medio: 'fintoc'") - 400, SRC.indexOf("medio: 'fintoc'") + 20);
  t('④ anche il pago Fintoc dalla sala porta il mesero del tavolo', /registrado_por: _registradoPor\(\)/.test(fi), fi.slice(-200));
  t('la porta FAM/colacion/ELIMINAR non cambia (nessun denaro di propina)', (SRC.match(/registrado_por: STATE\.nombre/g) || []).length === 2);
  return ko - k0;
}

// ── ⑥ l'altro lato, dal sorgente del bordo
const Bi = await import(pathToFileURL(path.join(BORDO, 'src', 'index.js')).href);
const A3 = await import(pathToFileURL(path.join(BORDO, 'src', 'caja_atto3.js')).href);
{ // il body che il vetro costruisce in JL, come arriva al bordo
  const bodyJl = { codigo: 'X1', nombre: 'Ale JL', registrado_por: 'Marcela', cobrado_por: 'Ale JL', mesa: '12', medio: 'efectivo', propina: 3000, pago_uid: 'PU-jl-1' };
  const fila = Bi._pgPago.filaPago(bodyJl, { PAGO_PG_WRITE_ON: '1', local: 'BKS', ts: Date.parse('2026-10-10T20:00:00Z'), monto_registrato: 30000 });
  t('⑥ il bordo scrive la riga `pagos` con registrado_por = il MESERO (non il JL)', fila && fila.fila && fila.fila.registrado_por === 'Marcela', fila);
  t('⑥ bis il campo additivo `cobrado_por` non rompe la riga (nessuna colonna sconosciuta)', fila && fila.fila && !('cobrado_por' in fila.fila), fila && fila.fila && Object.keys(fila.fila));
  const filaVecchia = Bi._pgPago.filaPago({ ...bodyJl, registrado_por: 'Ale JL' }, { PAGO_PG_WRITE_ON: '1', local: 'BKS', ts: Date.parse('2026-10-10T20:00:00Z'), monto_registrato: 30000 });
  const cdp = (pg) => ({ propina_efectivo: Number(pg.propina) || 0 });
  const pozoOra = A3.repartoPozo([{ registrado_por: fila.fila.registrado_por, propina: 3000 }], cdp);
  const pozoIeri = A3.repartoPozo([{ registrado_por: filaVecchia.fila.registrado_por, propina: 3000 }], cdp);
  const chiavi = (p) => Object.keys(p.per_grafia || {}).map((k) => p.per_grafia[k].grafia);
  t('⑥ ter il pozo accredita la propina a MARCELA', chiavi(pozoOra).join() === 'Marcela' && pozoOra.propina_efectivo === 3000, chiavi(pozoOra));
  t('⑥ quater controllo: col registrado_por del JL (il difetto) la propina andava al JL — il banco distingue i due casi', chiavi(pozoIeri).join() === 'Ale JL', chiavi(pozoIeri));
}

const SC = banco(SRC0, 'sala');
// ⑦ MUTANTI: ogni rottura deve far rosso il banco
const mut = (nome, da, a) => { if (!SRC0.includes(da)) { t('mutante ' + nome + ': la stringa da mutare esiste', false); return; }
  const k0 = ko, o0 = ok; const M = SRC0.replace(da, a); const k1 = ko; muto = true; banco(M, nome); muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('⑦ mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
mut('filtro ignora la leva (sempre acceso)', "(JL_TODO_ON && (b.k === 'pedir'", "(true && (b.k === 'pedir'");
mut('filtro ignora la leva (mai acceso)', "(JL_TODO_ON && (b.k === 'pedir'", "(false && (b.k === 'pedir'");
mut('COBRAR dimenticato', " || b.k === 'cobrar' ||", " ||");
mut('PRECUENTA trapela', "(b.k === 'pedir' ||", "(b.k === 'precuenta' || b.k === 'pedir' ||");
mut('la leva nasce accesa', 'var JL_TODO_ON = false;', 'var JL_TODO_ON = true;');
mut('registrado_por torna al JL nel pagoConfirmar', 'registrado_por: _registradoPor(),   // [10-ott · ⓐ] in', 'registrado_por: STATE.nombre,   // [10-ott · ⓐ] in');
mut('il helper ignora la fetta', "return (JL && STATE.vista) ? STATE.vista : STATE.nombre; }\nfunction _cobradoPor", "return STATE.nombre; }\nfunction _cobradoPor");
mut('cobrado_por sparisce', 'Object.assign(body, _cobradoPor());', '/* niente */');
mut('il nome della leva di /salud cambia', "cercaK(j, 'jl_todo_on')", "cercaK(j, 'jl_tutto_on')");

console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
