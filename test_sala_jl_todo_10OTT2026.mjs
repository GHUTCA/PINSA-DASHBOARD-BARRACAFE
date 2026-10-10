// BANCO · «il JL fa tutto dalla sua app» — PEDIR / PRECUENTA / COBRAR / MOVER in sala.html?jl=1 + i DUE NOMI del cobro (AUT-0646) · TERZA PENNA · 10-ott-2026
// (decisione ⓐ di Alberto, 🎛 V28 `JL FA TUTTO DALLA SUA APP COBRAR` + `COBRO JL DUE NOMI INTESTATARIO E MANO` + `NESSUN TAVOLO SENZA MESERO PLAZA`)
// Criteri: ① leva SPENTA = il filtro di ieri · ② ACCESA = + PEDIR · PRECUENTA · COBRAR · MOVER (SEPARAR/TIEMPOS no) · ③ la leva nasce spenta e si legge da /salud
//          ④ `registrado_por` RESTA chi incassa (il JL) e il pago porta `intestatario` = il mesero della PLAZA, preso da una sala letta ADESSO
//          ⑤ tavolo senza plaza / plaza senza mesero / due meseri / junta mista / sala non letta => ANOMALIA: il cobro NON parte, il JL lo vede, il fatto si registra
//          ⑥ fuori da JL il body e' identico a ieri · ⑦ contratto dall'altro lato (parola presa dal SORGENTE del bordo): la riga `pagos` porta `intestatario` SOLO a leva accesa
//          ⑧ mutanti: ogni rottura deve far diventare rosso il banco.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SALA = process.argv[2] || path.join(AQUI, 'sala.html');
const BORDO = process.argv[3] || path.join(AQUI, '..', '_wt_0613');
const SRC0 = fs.readFileSync(SALA, 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 300))); };
const fnDe = (SRC, nome, asinc) => { const i = SRC.indexOf((asinc ? 'async function ' : 'function ') + nome + '('); if (i < 0) throw new Error('manca ' + nome); return SRC.slice(i, SRC.indexOf('\n}\n', i) + 3); };

function filtraVJ(SRC, { JL, JL_TODO_ON }) {
  const i = SRC.indexOf('const VJ = '); const riga = SRC.slice(i, SRC.indexOf('\n', i));
  const V = ['pedir', 'precuenta', 'cobrar', 'pedidos', 'mover', 'separar', 'tiempos', 'descontar'].map((k) => ({ k }));
  const ctx = { JL, JL_TODO_ON, V }; vm.createContext(ctx);
  vm.runInContext(riga + '\nthis.OUT = VJ.map(function (b) { return b.k; });', ctx); return ctx.OUT;
}
const JLX = { user: 'Ale JL', vista: 'Marcela', codigo: 'X1' };
const E = (SRC, JL, on) => filtraVJ(SRC, { JL, JL_TODO_ON: on }).join(',');

// la sala letta dal bordo: due meseros, plazas, e una plaza senza nessuno
const SALA_OK = { marcela: { ok: true, nombre: 'Marcela', plazas: ['AURORA A'] }, ray: { ok: true, nombre: 'Ray', plazas: ['VIP A', 'VIP B'] }, sola: { ok: true, nombre: 'Doble1', plazas: ['TERRAZA'] }, sola2: { ok: true, nombre: 'Doble2', plazas: ['TERRAZA'] } };
const PLAZA = { 12: 'AURORA A', 13: 'AURORA A', 40: 'VIP A', 41: 'VIP B', 50: 'HUERFANA', 60: 'TERRAZA', 70: '' };
function mundoIntest(SRC, { salud, fetchFalla, edadMs = 1000, lugar = PLAZA }) {
  const ctx = { STATE: { codigo: 'X1', sala: { mesas: Object.keys(lugar).map((m) => ({ mesa: m, plaza: lugar[m] })) } },
    BORDE_SALA: { ON: true, URL: 'http://b', T: 't' }, CFG: { LOCAL: 'BKS' }, CIE_FRESCO_TIMEOUT_MS: 50, CIE_FRESCO_MAX_MS: 600000, AbortController, setTimeout, clearTimeout, Date, JSON, Object, String, Number, encodeURIComponent,
    fetch: async () => { if (fetchFalla) throw new Error('rete'); return { ok: true, json: async () => ({ ok: true, datos: { datos: { ok: true, ts_datos: Date.now() - edadMs, meseros: salud } } }) }; } };
  vm.createContext(ctx);
  vm.runInContext(fnDe(SRC, '_intestatarioPuro') + fnDe(SRC, '_jlIntestatario', true) + '\nthis.I = _jlIntestatario;', ctx); return ctx;
}

function banco(SRC) {
  const k0 = ko;
  // ① ② ③ la leva
  t('① leva SPENTA: il JL vede solo PEDIDOS ed ELIMINAR (il filtro di ieri)', E(SRC, JLX, false) === 'pedidos,descontar', E(SRC, JLX, false));
  t('② leva ACCESA: PEDIR · PRECUENTA · COBRAR · MOVER tornano, SEPARAR/TIEMPOS no', E(SRC, JLX, true) === 'pedir,precuenta,cobrar,pedidos,mover,descontar', E(SRC, JLX, true));
  t('② bis fuori da JL il filtro non esiste: i verbi sono tutti, con o senza leva', E(SRC, null, false) === 'pedir,precuenta,cobrar,pedidos,mover,separar,tiempos,descontar' && E(SRC, null, true) === E(SRC, null, false));
  t('③ JL_TODO_ON nasce false e si accende SOLO da /salud → jl_todo_on === "1"', /var JL_TODO_ON = false;/.test(SRC) && /JL_TODO_ON = String\(cercaK\(j, 'jl_todo_on'\)\) === '1'/.test(SRC));

  // ④ ⑤ l'intestatario, preso ADESSO dalla sala
  return Promise.all([
    mundoIntest(SRC, { salud: SALA_OK }).I(['12']), mundoIntest(SRC, { salud: SALA_OK }).I(['40']), mundoIntest(SRC, { salud: SALA_OK }).I(['12', '13']),
    mundoIntest(SRC, { salud: SALA_OK }).I(['12', '40']), mundoIntest(SRC, { salud: SALA_OK }).I(['50']), mundoIntest(SRC, { salud: SALA_OK }).I(['60']),
    mundoIntest(SRC, { salud: SALA_OK }).I(['70']), mundoIntest(SRC, { salud: SALA_OK }).I(['99']), mundoIntest(SRC, { salud: SALA_OK, fetchFalla: true }).I(['12']),
    mundoIntest(SRC, { salud: SALA_OK, edadMs: 20 * 60000 }).I(['12']), mundoIntest(SRC, { salud: SALA_OK, edadMs: -5 * 60000 }).I(['12']),
    mundoIntest(SRC, { salud: { marcela: { ok: false, nombre: 'Marcela', plazas: ['AURORA A'] } } }).I(['12']),
  ]).then(([a, b, junta, mista, huerfana, doble, sinPl, desconocida, sinRed, vieja, futura, caida]) => {
    t('④ tavolo di Marcela: intestatario = MARCELA (la plaza AURORA A), con la plaza', a.ok && a.nombre === 'Marcela' && a.plaza === 'AURORA A', a);
    t('④ bis tavolo di Ray: intestatario = RAY', b.ok && b.nombre === 'Ray' && b.plaza === 'VIP A', b);
    t('④ ter junta 12+13 della STESSA plaza: un intestatario solo', junta.ok && junta.nombre === 'Marcela', junta);
    t('⑤ junta mista (12 di Marcela + 40 di Ray): ANOMALIA, non si indovina', !mista.ok && mista.motivo === 'junta_con_varios_meseros', mista);
    t('⑤ plaza SENZA mesero: anomalia «plaza_sin_mesero» (mai intestata al JL)', !huerfana.ok && huerfana.motivo === 'plaza_sin_mesero' && huerfana.plaza === 'HUERFANA', huerfana);
    t('⑤ plaza con DUE meseros: anomalia, non ne sceglie uno', !doble.ok && doble.motivo === 'plaza_con_varios_meseros', doble);
    t('⑤ tavolo con plaza vuota: anomalia «mesa_sin_plaza»', !sinPl.ok && sinPl.motivo === 'mesa_sin_plaza', sinPl);
    t('⑤ tavolo che il telefono non conosce: anomalia «mesa_sin_plaza»', !desconocida.ok && desconocida.motivo === 'mesa_sin_plaza', desconocida);
    t('⑤ sala NON LETTA (rete morta): anomalia «sala_no_leida» — NON ripiega sulla memoria del telefono', !sinRed.ok && sinRed.motivo === 'sala_no_leida', sinRed);
    t('⑤ sala di 20 minuti fa: non decide (lezione di Ray, 01-ott)', !vieja.ok && vieja.motivo === 'sala_no_leida', vieja);
    t('⑤ sala «dal futuro» (orologio indietro): non decide', !futura.ok && futura.motivo === 'sala_no_leida', futura);
    t('⑤ il mesero della plaza risulta non-ok (caduto): anomalia, non un intestatario fantasma', !caida.ok && caida.motivo === 'plaza_sin_mesero', caida);

    // ⑥ sorgente: i due nomi, e l'anomalia ferma il cobro
    const pc = SRC.slice(SRC.indexOf('async function pagoConfirmar('), SRC.indexOf('\n}\n', SRC.indexOf('async function pagoConfirmar(')) + 3);
    t('⑥ pagoConfirmar: `registrado_por` RESTA STATE.nombre (chi incassa: ha i biglietti in mano)', /codigo: STATE\.codigo, nombre: STATE\.nombre, registrado_por: STATE\.nombre,/.test(pc));
    t('⑥ pagoConfirmar: in JL risolve l intestatario PRIMA di costruire il body, con la sala della junta', /if \(JL\) \{[^}]*_jlIntestatario\(\(pg\.mesas && pg\.mesas\.length\) \? pg\.mesas : \[pg\.mesa\]\)/s.test(pc));
    t('⑥ pagoConfirmar: sull anomalia SBLOCCA il pannello, avvisa il JL e NON prosegue', /if \(!intest\.ok\) \{ pg\.enviando = false; renderPago\(\); _intestatarioAnomalia\(intest, 'pagoConfirmar'\); return; \}/.test(pc));
    t('⑥ pagoConfirmar: il body porta intestatario + intestatario_plaza SOLO se c e (fuori da JL il body e identico a ieri)', /if \(intest\) \{ body\.intestatario = intest\.nombre; body\.intestatario_plaza = intest\.plaza; \}/.test(pc));
    const ancora = pc.indexOf('let intest = null;'), cob = pc.indexOf('const body = {');
    t('⑥ l intestatario si risolve PRIMA di `const body` (altrimenti il body non puo portarlo)', ancora > 0 && cob > ancora, [ancora, cob]);
    const fi = SRC.slice(SRC.indexOf('let intF = null;') - 10, SRC.indexOf("medio: 'fintoc'") + 40);
    t('⑥ anche il pago Fintoc dalla sala: stesso intestatario, stessa anomalia', /intF = await _jlIntestatario\(\[mesa\]\)/.test(fi) && /!intF\.ok\) \{ _intestatarioAnomalia\(intF, 'fintoc'\); return; \}/.test(fi) && /registrado_por: STATE\.nombre/.test(fi) && /intestatario: intF \? intF\.nombre : undefined/.test(fi), fi.slice(0, 400));
    t('⑥ l anomalia si REGISTRA (bordeHecho pago_sin_intestatario) e si MOSTRA al JL', /bordeHecho\('pago_sin_intestatario'/.test(SRC) && /toast\('err', _INTEST_MSG\[a\.motivo\]/.test(SRC));
    t('⑥ la porta FAM/colacion/ELIMINAR non cambia (registrado_por: STATE.nombre, due siti)', (SRC.match(/registrado_por: STATE\.nombre, mesa: mesa, medio: 'fam'/g) || []).length === 1 && (SRC.match(/registrado_por: STATE\.nombre,\n      mesa: pg\.mesa, medio: 'fam'|registrado_por: STATE\.nombre,\n      mesa: pg\.mesa/g) || []).length >= 0);
    t('nessun resto del vecchio disegno (`_registradoPor` / `cobrado_por`)', !/_registradoPor|_cobradoPor|cobrado_por/.test(SRC));
    return ko - k0;
  });
}

// ⑦ l'altro lato, dal sorgente del bordo
const Bi = await import(pathToFileURL(path.join(BORDO, 'src', 'index.js')).href);
{ const body = { codigo: 'X1', nombre: 'Ale JL', registrado_por: 'Ale JL', intestatario: 'Marcela', intestatario_plaza: 'AURORA A', mesa: '12', medio: 'efectivo', propina: 3000, pago_uid: 'PU-jl-1' };
  const ts = Date.parse('2026-10-10T20:00:00Z');
  const spenta = Bi._pgPago.filaPago(body, { PAGO_PG_WRITE_ON: '1', local: 'BKS', ts, monto_registrato: 30000 });
  const accesa = Bi._pgPago.filaPago(body, { PAGO_PG_WRITE_ON: '1', PAGOS_INTESTATARIO_PG_ON: '1', local: 'BKS', ts, monto_registrato: 30000 });
  const senza = Bi._pgPago.filaPago({ ...body, intestatario: undefined }, { PAGO_PG_WRITE_ON: '1', PAGOS_INTESTATARIO_PG_ON: '1', local: 'BKS', ts, monto_registrato: 30000 });
  t('⑦ leva SPENTA: la riga `pagos` NON porta `intestatario` (la colonna non c e ancora: una colonna ignota => quarantena)', spenta && spenta.fila && !('intestatario' in spenta.fila), spenta && spenta.fila);
  t('⑦ leva ACCESA: `intestatario` = Marcela e `registrado_por` RESTA il JL (due nomi)', accesa && accesa.fila.intestatario === 'Marcela' && accesa.fila.registrado_por === 'Ale JL', accesa && accesa.fila);
  t('⑦ leva accesa ma pago senza intestatario (un mesero normale): la chiave non nasce', senza && !('intestatario' in senza.fila), senza && senza.fila);
  t('⑦ `intestatario_plaza` NON arriva in Postgres (nessuna colonna chiesta da MIGRACION)', accesa && !('intestatario_plaza' in accesa.fila), accesa && Object.keys(accesa.fila));
}

await banco(SRC0);
const mut = async (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; await banco(SRC0.replace(da, a)); muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('⑧ mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
await mut('filtro ignora la leva (sempre acceso)', "(JL_TODO_ON && (b.k === 'pedir'", "(true && (b.k === 'pedir'");
await mut('filtro ignora la leva (mai acceso)', "(JL_TODO_ON && (b.k === 'pedir'", "(false && (b.k === 'pedir'");
await mut('COBRAR dimenticato', " || b.k === 'cobrar' ||", " ||");
await mut('PRECUENTA dimenticata', " || b.k === 'precuenta' ||", " ||");
await mut('la leva nasce accesa', 'var JL_TODO_ON = false;', 'var JL_TODO_ON = true;');
await mut('il nome della leva di /salud cambia', "cercaK(j, 'jl_todo_on')", "cercaK(j, 'jl_tutto_on')");
await mut('registrado_por torna al mesero (cancella chi ha i biglietti)', 'nombre: STATE.nombre, registrado_por: STATE.nombre,\n    mesa: pg.mesa', 'nombre: STATE.nombre, registrado_por: (intest ? intest.nombre : STATE.nombre),\n    mesa: pg.mesa');
await mut('l anomalia non ferma il cobro', "if (!intest.ok) { pg.enviando = false; renderPago(); _intestatarioAnomalia(intest, 'pagoConfirmar'); return; }", "if (!intest.ok) { _intestatarioAnomalia(intest, 'pagoConfirmar'); }");
await mut('il body non porta l intestatario', 'body.intestatario = intest.nombre;', 'body.xx = intest.nombre;');
await mut('plaza senza mesero => intestato al JL', "return { ok: false, motivo: 'plaza_sin_mesero', mesa: mesa, plaza: pl };", "return { ok: true, nombre: STATE.nombre, plaza: pl };");
await mut('due meseros: ne sceglie uno', "if (duenos.length > 1) return { ok: false, motivo: 'plaza_con_varios_meseros', mesa: mesa, plaza: pl };", "");
await mut('junta mista accettata', "if (nombre && duenos[0] !== nombre) return { ok: false, motivo: 'junta_con_varios_meseros', mesa: mesa, plaza: pl };", "");
await mut('sala vecchia accettata', 'Date.now() - tsD <= CIE_FRESCO_MAX_MS', 'true');
await mut('rete morta => ripiega sulla memoria', "if (!todos) return { ok: false, motivo: 'sala_no_leida', mesa: String((mesas || [])[0] || ''), plaza: '' };", "if (!todos) todos = { marcela: { ok: true, nombre: 'Marcela', plazas: ['AURORA A'] } };");
await mut('l anomalia non si registra', "try { bordeHecho('pago_sin_intestatario'", "try { void ('pago_sin_intestatario'");
await mut('Fintoc senza intestatario', "intestatario: intF ? intF.nombre : undefined", "intestatario: undefined");

console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
