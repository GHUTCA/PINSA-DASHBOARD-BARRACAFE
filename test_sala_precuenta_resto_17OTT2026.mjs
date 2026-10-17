// BANCO · TERZA PENNA V30 · CONTROLLO DELL'AUTRICE · AUT-0696 · la precuenta e la tessera dopo una parte pagata (17-ott)
// Reperto di Alberto su 997: pannello «Mesa 997 $3.190», tessera «por cobrar $7.080», precuenta «TOTAL $7.788» senza la parte.
// Gira il codice VERO di sala.html in vm: _vpTot e _vpBase interi, il blocco della precuenta, la riga della tessera, il blocco della junta.
// node test_sala_precuenta_resto_17OTT2026.mjs [sala.html]
import fs from 'node:fs'; import vm from 'node:vm';
const SRC = fs.readFileSync(process.argv[2] || new URL('./sala.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
const fnV = (nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); return SRC.slice(i, SRC.indexOf('\n}\n', i) + 3); };
// i marcatori stanno FUORI dalle righe curate: un mutante deve arrivare al banco, non rompere l'estrazione
const tra = (a, b) => { const i = SRC.indexOf(a); if (i < 0) throw new Error('marcatore: ' + a); const j = SRC.indexOf(b, i); if (j < 0) throw new Error('marcatore: ' + b); return SRC.slice(i, j).trimEnd(); };
const pcCalc = tra('  const _pcMs = ', '  /* v3.4.3 · il lucchetto guarda la mesa che STAMPA');
const pcRighe = tra("      '<hr><div class=\"pr\"><span>Consumo</span>", "      '<div class=\"nota2\">gracias");
const tessera = tra('[17-ott · AUT-0696 · 997: tessera', '      porCobrar += plata;').replace(/^[^\n]*\n[^\n]*\n/, '');
const junta = tra('  let plataReal = 0, pagJ = 0;', "  if (llam) { st = 'nuevo';");
// lo stato del mondo: righe per mesa, parte locale, pagado del server, riepilogo del server
function mondo({ righe = {}, parc = {}, sed = {}, res = {} }) {
  const ctx = { Math, Number, isFinite, parseFloat, String,
    STATE: { mesasModel: Object.keys(righe).map((mesa) => ({ mesa, pend: righe[mesa].map((x) => ({ total: x })), mios: [], limpiar: [] })), pagadoParcial: parc, tsPagoCierre: {} },
    PAGO_UUIDS_VETRO_ON: true, MARCA_TS_ON: true, RESTO_SERVER_ON: true,
    _resDe: (m) => (res[m] != null ? { total: res[m] } : null), _pagadoSedutaDeMesa: (m) => (sed[m] != null ? sed[m] : null),
    _fmtMiles: (n) => Math.round(n).toLocaleString('es-CL'), out: null };
  vm.createContext(ctx); vm.runInContext(fnV('calcolaResto') + fnV('_vpBase') + fnV('_vpTot'), ctx); return ctx;
}
function papel(w, { modo = 'toda', mesas, sub, lineas }) {
  w.pc = { modo, sub }; w.det = { mesas }; w.tot0 = lineas;
  vm.runInContext('(function () { let tot = tot0;\n' + pcCalc + '\nout = { tot, resto, prop, faltanP, pag: _pcPag, html: ' + pcRighe + " '' }; })();", w);
  const h = w.out.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  return Object.assign(w.out, { txt: h });
}
const tileU = (w, mesa, plata) => { w.m = { mesa }; w.plata0 = plata; vm.runInContext('(function () { var plata = plata0;\n' + tessera + '\nout = plata; })();', w); return w.out; };
const tileJ = (w, mesas, plata) => { w.jn = { mesas }; w.plata0 = plata; vm.runInContext('(function () { var plata = plata0;\n' + junta + '\nout = plata; })();', w); return w.out; };

{ const w = mondo({ righe: { '997': [3890, 3190] }, parc: { '997': 3890 } });
  const p = papel(w, { mesas: ['997'], lineas: 7080 });
  t('A · 997 sul telefono che ha cobrado: Consumo 7.080 · Ya pagado −3.890 · Por pagar 3.190', /Consumo \$7\.080/.test(p.txt) && /Ya pagado −\$3\.890/.test(p.txt) && /Por pagar \$3\.190/.test(p.txt), p.txt);
  t('A · propina sul resto (319) e TOTAL 3.509 — non 7.788', p.prop === 319 && /TOTAL \$3\.509/.test(p.txt) && !/7\.788/.test(p.txt), p.txt);
  t('A · il «por pagar» del papel È il numero del pannello (_vpTot)', p.resto === w._vpTot('997'), [p.resto, w._vpTot('997')]);
  t('A · tessera: por cobrar 3.190, non 7.080', tileU(w, '997', 7080) === 3190, tileU(w, '997', 7080)); }
{ const w = mondo({ righe: { '997': [3890, 3190] }, sed: { '997': 3890 } });
  const p = papel(w, { mesas: ['997'], lineas: 7080 });
  t('B · telefono B (nessuna memoria locale), il server dice 3.890 ⇒ stesso papel di A', /Ya pagado −\$3\.890/.test(p.txt) && /TOTAL \$3\.509/.test(p.txt), p.txt);
  t('B · tessera 3.190', tileU(w, '997', 7080) === 3190); }
{ const w = mondo({ righe: { '997': [3890, 3190] }, sed: { '997': 3890 }, parc: { '997': 3890 } });
  const p = papel(w, { mesas: ['997'], lineas: 7080 });
  t('C · server e memoria la stessa parte ⇒ si toglie UNA volta (massimo, mai somma)', p.pag === 3890 && p.resto === 3190, p); }
{ const w = mondo({ righe: { '40': [5000, 2080] } });
  const p = papel(w, { mesas: ['40'], lineas: 7080 });
  t('D · niente pagato: nessuna riga «Ya pagado», TOTAL 7.788 come prima', !/Ya pagado/.test(p.txt) && !/Por pagar/.test(p.txt) && /TOTAL \$7\.788/.test(p.txt), p.txt);
  t('D · tessera invariata 7.080', tileU(w, '40', 7080) === 7080); }
{ const w = mondo({ righe: { '41': [3890, 3190] }, res: { '41': 9000 }, parc: { '41': 3890 } });
  const p = papel(w, { mesas: ['41'], lineas: 7080 });
  t('E · il server sa 9.000 (consumo di un collega): Otros 1.920 · Consumo 9.000 · Ya pagado 3.890 · Por pagar 5.110', p.faltanP === 1920 && /Consumo \$9\.000/.test(p.txt) && /Por pagar \$5\.110/.test(p.txt), p.txt);
  t('E · tessera 5.110 (dal 9.000 del server, meno la parte)', tileU(w, '41', 9000) === 5110, tileU(w, '41', 9000)); }
{ const w = mondo({ righe: { '20': [4000], '21': [3000] }, parc: { '21': 1000 } });
  const p = papel(w, { mesas: ['20', '21'], lineas: 7000 });
  t('F · junta 20·21, parte 1.000 sulla 21: Toda la cuenta ⇒ Ya pagado 1.000, Por pagar 6.000', p.pag === 1000 && /Por pagar \$6\.000/.test(p.txt), p.txt);
  const pm = papel(w, { modo: 'mesa', mesas: ['20', '21'], sub: '21', lineas: 3000 });
  t('F · Copia por mesa 21 ⇒ solo la sua parte: Por pagar 2.000', pm.pag === 1000 && /Por pagar \$2\.000/.test(pm.txt), pm.txt);
  const p20 = papel(w, { modo: 'mesa', mesas: ['20', '21'], sub: '20', lineas: 4000 });
  t('F · Copia por mesa 20 ⇒ niente da togliere', p20.pag === 0 && !/Ya pagado/.test(p20.txt), p20.txt);
  t('F · tessera della junta 6.000, non 7.000', tileJ(w, ['20', '21'], 7000) === 6000, tileJ(w, ['20', '21'], 7000)); }
{ const w = mondo({ righe: { '997': [3890, 3190] }, parc: { '997': 3890 } });
  for (const modo of ['persona', 'parte']) { const p = papel(w, { modo, mesas: ['997'], lineas: 3190 });
    t('G · «' + modo + '» è una vista parziale per disegno: nessun «Ya pagado», TOTAL sulle sue righe', p.pag === 0 && p.resto === 3190 && !/Ya pagado/.test(p.txt), p.txt); } }
{ const w = mondo({ righe: { '30': [5000] }, sed: { '30': 6000 } });
  const p = papel(w, { mesas: ['30'], lineas: 5000 });
  t('H · il pagato supera il consumo ⇒ resto 0, mai negativo', p.resto === 0 && p.prop === 0 && /TOTAL \$0/.test(p.txt), p.txt);
  t('H · tessera 0, mai negativa', tileU(w, '30', 5000) === 0); }
console.log('\n' + (ko ? '🔴 ' + ko + ' rossi su ' + (ok + ko) : '🟢 ' + ok + ' controlli, tutti verdi'));
process.exitCode = ko ? 1 : 0;
