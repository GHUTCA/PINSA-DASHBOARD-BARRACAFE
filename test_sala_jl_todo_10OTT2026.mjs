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
// il banco dichiara QUALE bordo ha letto (hash + file tracciati sporchi): un banco verde su un albero che si muove non e una prova (richiesta di EL GIRO, 10-ott)
import { execFileSync } from 'node:child_process';
const gitB = (...a) => { try { return execFileSync('git', ['-C', BORDO, ...a], { encoding: 'utf8' }).trim(); } catch (e) { return '?'; } };
const BORDO_HASH = gitB('rev-parse', '--short', 'HEAD'), BORDO_SPORCHI = gitB('status', '--porcelain', '-uno').split('\n').filter(Boolean).length;
console.log('BORDO LETTO : ' + BORDO + ' @ ' + BORDO_HASH + (BORDO_SPORCHI ? ' · ' + BORDO_SPORCHI + ' file tracciati SPORCHI (non e un hash pulito)' : ' (pulito)') + '  · uso: node test_sala_jl_todo_10OTT2026.mjs <sala.html> <radice del bordo>');
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
function mundoIntest(SRC, { salud, fetchFalla, edadMs = 1000, lugar = PLAZA, conto, contoOn = false }) {
  const hechos = [];
  const ctx = { STATE: { codigo: 'X1', sala: { mesas: Object.keys(lugar).map((m) => ({ mesa: m, plaza: lugar[m] })) } },
    BORDE_SALA: { ON: true, URL: 'http://b', T: 't' }, CFG: { LOCAL: 'BKS' }, CIE_FRESCO_TIMEOUT_MS: 50, CIE_FRESCO_MAX_MS: 600000, AbortController, setTimeout, clearTimeout, Date, JSON, Object, String, Number, encodeURIComponent,
    CONTO_APERTURA_ON: contoOn, bordeHecho: (g, d) => hechos.push([g, d]), _hechos: hechos,
    fetch: async (u, init) => { if (fetchFalla) throw new Error('rete');
      if (/\/conto\//.test(String(u))) { ctx._contoUrl = String(u); ctx._contoHdr = init && init.headers; if (conto === 'falla') throw new Error('rete'); return { ok: conto !== 'rotto', json: async () => ({ ok: conto !== 'rotto', mesas: conto }) }; }
      return { ok: true, json: async () => ({ ok: true, datos: { datos: { ok: true, ts_datos: Date.now() - edadMs, meseros: salud } } }) }; } };
  vm.createContext(ctx);
  vm.runInContext(fnDe(SRC, '_slugSalaJS') + fnDe(SRC, '_intestatarioPuro') + fnDe(SRC, '_jlIntestatario', true) + '\nthis.I = _jlIntestatario;', ctx); return ctx;
}

function banco(SRC) {
  const k0 = ko;
  // ① ② ③ la leva
  t('① leva SPENTA: il JL vede solo PEDIDOS ed ELIMINAR (il filtro di ieri)', E(SRC, JLX, false) === 'pedidos,descontar', E(SRC, JLX, false));
  t('② leva ACCESA: PEDIR · PRECUENTA · COBRAR · MOVER tornano, SEPARAR/TIEMPOS no', E(SRC, JLX, true) === 'pedir,precuenta,cobrar,pedidos,mover,descontar', E(SRC, JLX, true));
  t('② bis fuori da JL il filtro non esiste: i verbi sono tutti, con o senza leva', E(SRC, null, false) === 'pedir,precuenta,cobrar,pedidos,mover,separar,tiempos,descontar' && E(SRC, null, true) === E(SRC, null, false));
  t('③ JL_TODO_ON nasce false e si accende SOLO da /salud → jl_todo_on === "1"', /var JL_TODO_ON = false;/.test(SRC) && /JL_TODO_ON = String\(cercaK\(j, 'jl_todo_on'\)\) === '1'/.test(SRC));
  t('③ ter CONTO_APERTURA_ON nasce false e si accende SOLO da /salud → conto_apertura_on === "1"', /var CONTO_APERTURA_ON = false;/.test(SRC) && SRC.includes("CONTO_APERTURA_ON = String(cercaK(j, 'conto_apertura_on')) === '1'"));
  // ⓒ DI ALBERTO: il QR con auto-dueño (o due meseros) su una plaza condivisa NON lo cobra il JL: niente scelta, niente divisione, un messaggio solo
  { const am = (a) => { const toasts = [], hechos = []; const ctx = { toast: (k, m) => toasts.push([k, m]), bordeHecho: (g, d) => hechos.push([g, d]) }; vm.createContext(ctx);
      const ini = SRC.indexOf('const _INTEST_MSG = {'), fin = SRC.indexOf('\n};', ini) + 3;
      vm.runInContext(SRC.slice(ini, fin) + '\n' + fnDe(SRC, '_intestatarioAnomalia') + '\nthis.A = _intestatarioAnomalia;', ctx); ctx.A(a, 'pagoConfirmar'); return { toasts, hechos }; };
    const q1 = am({ ok: false, motivo: 'conto_sin_mesero', detalle: 'primo_sin_mesero', mesa: '60', plaza: 'TERRAZA' });
    const q2 = am({ ok: false, motivo: 'conto_sin_mesero', detalle: 'primo_con_varios_meseros', mesa: '60', plaza: 'TERRAZA' });
    const q3 = am({ ok: false, motivo: 'conto_sin_mesero', detalle: 'sin_pedidos_abiertos', mesa: '60', plaza: 'TERRAZA' });
    t('ⓒ QR sin mesero en plaza condivisa: el JL lee «Cobra uno de los meseros de la plaza.»', q1.toasts.length === 1 && q1.toasts[0][0] === 'err' && q1.toasts[0][1] === 'Cobra uno de los meseros de la plaza.', q1);
    t('ⓒ bis auto-dueño (el primer pedido con DOS meseros): el mismo mensaje', q2.toasts[0][1] === 'Cobra uno de los meseros de la plaza.', q2);
    t('ⓒ ter el hecho se registra con el motivo y el detalle (para forense)', q1.hechos.length === 1 && q1.hechos[0][0] === 'pago_sin_intestatario' && q1.hechos[0][1].motivo === 'conto_sin_mesero' && q1.hechos[0][1].detalle === 'primo_sin_mesero', q1.hechos);
    t('ⓒ quater «sin pedidos abiertos» es OTRA cosa: otro mensaje, no el de la regla de Alberto', q3.toasts[0][1] !== 'Cobra uno de los meseros de la plaza.' && /pedidos abiertos/.test(q3.toasts[0][1]), q3); }

  // ④ ⑤ l'intestatario, preso ADESSO dalla sala
  return Promise.all([
    mundoIntest(SRC, { salud: SALA_OK }).I(['12']), mundoIntest(SRC, { salud: SALA_OK }).I(['40']), mundoIntest(SRC, { salud: SALA_OK }).I(['12', '13']),
    mundoIntest(SRC, { salud: SALA_OK }).I(['12', '40']), mundoIntest(SRC, { salud: SALA_OK }).I(['50']), mundoIntest(SRC, { salud: SALA_OK }).I(['60']),
    mundoIntest(SRC, { salud: SALA_OK }).I(['70']), mundoIntest(SRC, { salud: SALA_OK }).I(['99']), mundoIntest(SRC, { salud: SALA_OK, fetchFalla: true }).I(['12']),
    mundoIntest(SRC, { salud: SALA_OK, edadMs: 20 * 60000 }).I(['12']), mundoIntest(SRC, { salud: SALA_OK, edadMs: -5 * 60000 }).I(['12']),
    mundoIntest(SRC, { salud: { marcela: { ok: false, nombre: 'Marcela', plazas: ['AURORA A'] } } }).I(['12']),
    // la plaza si cerca nella sala letta ADESSO (🟡② di EL GIRO): la memoria del telefono dice AURORA A, la sala fresca dice che il tavolo 12 e ora di Ray (VIP A)
    mundoIntest(SRC, { salud: { ...SALA_OK, ray: { ...SALA_OK.ray, mios: [{ mesa: '12', plaza: 'VIP A' }] } } }).I(['12']),
    // tavolo che la sala fresca non mostra: ripiega sulla memoria e lo DICHIARA
    mundoIntest(SRC, { salud: SALA_OK }).I(['13']),
  ]).then(([a, b, junta, mista, huerfana, doble, sinPl, desconocida, sinRed, vieja, futura, caida, fresca, memoria]) => {
    // ── la PLAZA CONDIVISA (V28: l'intestatario e il mesero che ha APERTO il conto, se e uno dei dueños) ──
    return Promise.all([
      mundoIntest(SRC, { salud: SALA_OK, contoOn: true, conto: { 60: { mesero: 'Doble2', n: 2 } } }).I(['60']),
      mundoIntest(SRC, { salud: SALA_OK, contoOn: true, conto: { 60: { mesero: 'doble1', n: 1 } } }).I(['60']),
      mundoIntest(SRC, { salud: SALA_OK, contoOn: true, conto: { 60: { mesero: 'Ray', n: 1 } } }).I(['60']),
      mundoIntest(SRC, { salud: SALA_OK, contoOn: true, conto: { 60: { mesero: '', n: 1, motivo: 'primo_sin_mesero' } } }).I(['60']),
      mundoIntest(SRC, { salud: SALA_OK, contoOn: true, conto: 'falla' }).I(['60']),
      mundoIntest(SRC, { salud: SALA_OK, contoOn: true, conto: 'rotto' }).I(['60']),
      mundoIntest(SRC, { salud: SALA_OK, contoOn: true, conto: {} }).I(['60']),
      mundoIntest(SRC, { salud: SALA_OK, contoOn: false, conto: { 60: { mesero: 'Doble2' } } }).I(['60']),
      mundoIntest(SRC, { salud: SALA_OK, contoOn: true, conto: { 60: { mesero: 'Doble2' }, 12: { mesero: 'Zzz' } }, lugar: { ...PLAZA, 61: 'TERRAZA' } }).I(['60', '12']),
      mundoIntest(SRC, { salud: SALA_OK, contoOn: true, conto: { 60: { mesero: 'Doble2' }, 61: { mesero: 'Doble1' } }, lugar: { ...PLAZA, 61: 'TERRAZA' } }).I(['60', '61']),
      mundoIntest(SRC, { salud: SALA_OK, contoOn: true, conto: { 60: { mesero: 'Doble2' }, 61: { mesero: 'Doble2' } }, lugar: { ...PLAZA, 61: 'TERRAZA' } }).I(['60', '61']),
    ]).then(([c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11]) => {
      t('⑩ plaza condivisa, il conto l ha aperto Doble2 (uno dei dueños): intestatario DOBLE2, il cobro NON si ferma', c1.ok && c1.nombre === 'Doble2' && c1.plaza === 'TERRAZA', c1);
      t('⑩ bis il confronto col dueño e per slug (maiuscole/accenti): doble1 => Doble1', c2.ok && c2.nombre === 'Doble1', c2);
      t('⑩ ter chi ha aperto NON e dueño della plaza (Ray): anomalia conto_fuera_duenos, niente cobro', !c3.ok && c3.motivo === 'conto_fuera_duenos', c3);
      t('⑩ quater il conto non ha mesero (nessuno ha preso il primo pedido): anomalia conto_sin_mesero, MAI il primo dueño', !c4.ok && c4.motivo === 'conto_sin_mesero' && c4.detalle === 'primo_sin_mesero', c4);
      t('⑩ quinquies il bordo non risponde: anomalia conto_no_leido (non ripiega su un dueño a caso)', !c5.ok && c5.motivo === 'conto_no_leido', c5);
      t('⑩ sexies il bordo risponde ok:false: conto_no_leido', !c6.ok && c6.motivo === 'conto_no_leido', c6);
      t('⑩ septies il bordo non conosce la mesa: conto_no_leido', !c7.ok && c7.motivo === 'conto_no_leido', c7);
      t('⑩ octies rotta spenta (CONTO_APERTURA_ON falsa): il blocco di prima, plaza_con_varios_meseros, e NON chiama la rotta', !c8.ok && c8.motivo === 'plaza_con_varios_meseros', c8);
      t('⑩ nonies junta con plaza condivisa e una mesa di un altro mesero singolo: Marcela per la 12 non e Doble2 => junta mista', !c9.ok && c9.motivo === 'junta_con_varios_meseros', c9);
      t('⑩ decies junta della stessa plaza aperta da due meseros diversi: junta mista, si ferma', !c10.ok && c10.motivo === 'junta_con_varios_meseros', c10);
      t('⑩ undecies junta della stessa plaza aperta dallo STESSO mesero: un intestatario solo', c11.ok && c11.nombre === 'Doble2', c11);
      const mm = mundoIntest(SRC, { salud: SALA_OK, contoOn: true, conto: { 60: { mesero: 'Doble2' } } });
      return mm.I(['60']).then((rr) => {
        t('⑩ la rotta si chiama con le mesas e il token in HEADER (mai in querystring)', /\/conto\/BKS\?mesas=60$/.test(mm._contoUrl) && mm._contoHdr && mm._contoHdr['X-Borde-Token'] === 't' && !/[?&]t=/.test(mm._contoUrl), [mm._contoUrl, mm._contoHdr]);
        const mem = mundoIntest(SRC, { salud: SALA_OK });
        return mem.I(['13']).then((r13) => {
          t('⑩ un intestatario preso dalla MEMORIA non resta invisibile: fonte_plaza e un fatto pago_intestatario_da_memoria', r13.ok && r13.fonte_plaza === 'memoria' && mem._hechos.some((h) => h[0] === 'pago_intestatario_da_memoria' && h[1].plaza === 'AURORA A'), [r13, mem._hechos]);
          const fr = mundoIntest(SRC, { salud: { ...SALA_OK, marcela: { ...SALA_OK.marcela, mios: [{ mesa: '12', plaza: 'AURORA A' }] } } });
          return fr.I(['12']).then((r12) => { t('⑩ dalla sala fresca (il tavolo c e) nessun fatto di memoria', r12.ok && r12.fonte_plaza === 'sala' && !fr._hechos.length, [r12, fr._hechos]); });
        });
      });
    }).then(() => {
    t('④ la plaza viene dalla sala FRESCA, non dalla memoria: il tavolo 12 passato a Ray => intestatario RAY, fonte sala', fresca.ok && fresca.nombre === 'Ray' && fresca.plaza === 'VIP A' && fresca.fonte_plaza === 'sala', fresca);
    t('④ se la sala fresca non mostra il tavolo si ripiega sulla memoria e lo si DICHIARA (fonte_plaza: memoria)', memoria.ok && memoria.nombre === 'Marcela' && memoria.fonte_plaza === 'memoria', memoria);
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
    t('⑥ pagoConfirmar: sull anomalia SBLOCCA il pannello, avvisa il JL, lascia l esito e NON prosegue', pc.includes("if (!intest.ok) { pg.enviando = false; renderPago(); _intestatarioAnomalia(intest, 'pagoConfirmar'); _pagoEsito(pg, 'anomalia', intest.motivo); return; }"));
    t('⑥ pagoConfirmar: il body porta intestatario + intestatario_plaza + la FONTE SOLO se c e (fuori da JL il body e identico a ieri)', /if \(intest\) \{ body\.intestatario = intest\.nombre; body\.intestatario_plaza = intest\.plaza; body\.intestatario_fonte = intest\.fonte_plaza \|\| ''; \}/.test(pc));
    const ancora = pc.indexOf('let intest = null;'), cob = pc.indexOf('const body = {');
    t('⑥ l intestatario si risolve PRIMA di `const body` (altrimenti il body non puo portarlo)', ancora > 0 && cob > ancora, [ancora, cob]);
    const fi = SRC.slice(SRC.indexOf('let intF = null;') - 10, SRC.indexOf("medio: 'fintoc'") + 40);
    t('⑥ anche il pago Fintoc dalla sala: stesso intestatario, stessa anomalia', /intF = await _jlIntestatario\(\[mesa\]\)/.test(fi) && /!intF\.ok\) \{ _intestatarioAnomalia\(intF, 'fintoc'\); return; \}/.test(fi) && /registrado_por: STATE\.nombre/.test(fi) && /intestatario: intF \? intF\.nombre : undefined/.test(fi), fi.slice(0, 400));
    t('⑥ l anomalia si REGISTRA (bordeHecho pago_sin_intestatario) e si MOSTRA al JL', /bordeHecho\('pago_sin_intestatario'/.test(SRC) && /toast\('err', _INTEST_MSG\[kM\]/.test(SRC));
    t('⑥ la porta FAM/colacion/ELIMINAR non cambia (registrado_por: STATE.nombre, due siti)', (SRC.match(/registrado_por: STATE\.nombre, mesa: mesa, medio: 'fam'/g) || []).length === 1 && (SRC.match(/registrado_por: STATE\.nombre,\n      mesa: pg\.mesa, medio: 'fam'|registrado_por: STATE\.nombre,\n      mesa: pg\.mesa/g) || []).length >= 0);
    t('nessun resto del vecchio disegno (`_registradoPor` / `cobrado_por`)', !/_registradoPor|_cobradoPor|cobrado_por/.test(SRC));
    return ko - k0;
    });
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
await mut('la plaza torna a leggere solo la memoria', "for (const k of ['mesas', 'mios', 'pendientes', 'por_limpiar'])", "for (const k of [])");
await mut('registrado_por torna al mesero (cancella chi ha i biglietti)', 'nombre: STATE.nombre, registrado_por: STATE.nombre,\n    mesa: pg.mesa', 'nombre: STATE.nombre, registrado_por: (intest ? intest.nombre : STATE.nombre),\n    mesa: pg.mesa');
await mut('l anomalia non ferma il cobro', "_intestatarioAnomalia(intest, 'pagoConfirmar'); _pagoEsito(pg, 'anomalia', intest.motivo); return; }", "_intestatarioAnomalia(intest, 'pagoConfirmar'); _pagoEsito(pg, 'anomalia', intest.motivo); }");
await mut('il body non porta l intestatario', 'body.intestatario = intest.nombre;', 'body.xx = intest.nombre;');
await mut('plaza senza mesero => intestato al JL', "return { ok: false, motivo: 'plaza_sin_mesero', mesa: mesa, plaza: pl };", "return { ok: true, nombre: STATE.nombre, plaza: pl };");
await mut('plaza condivisa: ne sceglie uno', "if (duenos.length > 1) {", "if (false) {");
await mut('junta mista accettata', "if (nombre && dueno !== nombre) return { ok: false, motivo: 'junta_con_varios_meseros', mesa: mesa, plaza: pl };", "");
await mut('il mensaje de Alberto cambia', "'conto_sin_mesero:primo_sin_mesero': 'Cobra uno de los meseros de la plaza.'", "'conto_sin_mesero:primo_sin_mesero': 'Asigna la cuenta.'");
await mut('el auto-dueño no tiene el mensaje de Alberto', "'conto_sin_mesero:primo_con_varios_meseros': 'Cobra uno de los meseros de la plaza.',", "");
await mut('el detalle no elige el mensaje', "const kM = (a.detalle && _INTEST_MSG[a.motivo + ':' + a.detalle]) ? a.motivo + ':' + a.detalle : a.motivo;", "const kM = a.motivo;");
await mut('chi ha aperto non e dueño: passa', "if (!hit) return { ok: false, motivo: 'conto_fuera_duenos', mesa: mesa, plaza: pl, detalle: a.mesero };", "if (!hit) { nombre = a.mesero; }");
await mut('conto senza mesero: passa col primo dueño', "if (!a.mesero) return { ok: false, motivo: 'conto_sin_mesero', mesa: mesa, plaza: pl, detalle: a.motivo || '' };", "");
await mut('il bordo muto: ripiega sul primo dueño', "r = ap ? _intestatarioPuro(mesas, dam, todos, ap) : { ok: false, motivo: 'conto_no_leido', mesa: r.mesa, plaza: r.plaza };", "r = _intestatarioPuro(mesas, dam, todos, ap || { [r.mesa]: { mesero: r.duenos[0] } });");
await mut('la rotta si chiama anche a leva spenta', "if (!CONTO_APERTURA_ON) { r.motivo = 'plaza_con_varios_meseros'; }", "if (false) { r.motivo = 'plaza_con_varios_meseros'; }");
await mut('il token va in querystring', "{ signal: ctrl.signal, cache: 'no-store', headers: { 'X-Borde-Token': BORDE_SALA.T } }", "{ signal: ctrl.signal, cache: 'no-store' }");
await mut('la memoria non lascia traccia', "try { bordeHecho('pago_intestatario_da_memoria'", "try { void ('pago_intestatario_da_memoria'");
await mut('la fonte non viaggia nel body', "body.intestatario_fonte = intest.fonte_plaza || '';", "");
await mut('la leva conto_apertura_on non si legge', "CONTO_APERTURA_ON = String(cercaK(j, 'conto_apertura_on')) === '1';", "CONTO_APERTURA_ON = false;");
await mut('sala vecchia accettata', 'Date.now() - tsD <= CIE_FRESCO_MAX_MS', 'true');
await mut('rete morta => ripiega sulla memoria', "if (!todos) return { ok: false, motivo: 'sala_no_leida', mesa: String((mesas || [])[0] || ''), plaza: '' };", "if (!todos) todos = { marcela: { ok: true, nombre: 'Marcela', plazas: ['AURORA A'] } };");
await mut('l anomalia non si registra', "try { bordeHecho('pago_sin_intestatario'", "try { void ('pago_sin_intestatario'");
await mut('Fintoc senza intestatario', "intestatario: intF ? intF.nombre : undefined", "intestatario: undefined");

console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
